import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { RemoteApi, type CampusApi, type FeedFilters } from './api';
import { DemoApi } from './demo';
import { normalizeApiUrl } from './format';
import * as storage from './storage';
import type { Me, Person } from './types';

const TOKEN_KEY = 'campus-token';
const URL_KEY = 'campus-api-url';
/** Адрес сервера по умолчанию задаётся при сборке: EXPO_PUBLIC_API_URL=https://api.example.ru */
export const DEFAULT_API_URL = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL ?? '');

/** Данные регистрации, которые собираются по шагам до проверки кода. */
export interface Draft {
  birthDate?: string;
  consent?: boolean;
  university?: string;
  institute?: string;
  email?: string;
  codeSentAt?: number;
}

interface Session {
  ready: boolean;
  api: CampusApi;
  demo: boolean;
  apiUrl: string;
  signedIn: boolean;
  me: Me | null;
  draft: Draft;
  filters: FeedFilters;
  setDraft(patch: Partial<Draft>): void;
  setFilters(filters: FeedFilters): void;
  setApiUrl(url: string): Promise<void>;
  startDemo(): void;
  exitDemo(): void;
  signIn(token: string): Promise<Me>;
  refreshMe(): Promise<Me | null>;
  signOut(): Promise<void>;
  rememberPeople(people: Person[]): void;
  person(userId: string): Person | undefined;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [demo, setDemo] = useState(false);
  const [apiUrl, setApiUrlState] = useState(DEFAULT_API_URL);
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [draft, setDraftState] = useState<Draft>({});
  const [filters, setFilters] = useState<FeedFilters>({});
  const people = useRef(new Map<string, Person>());
  const demoApi = useRef<DemoApi | null>(null);

  const forget = useCallback(async () => {
    await storage.deleteItem(TOKEN_KEY).catch(() => undefined);
    setToken(null);
    setMe(null);
  }, []);

  const remote = useMemo(() => new RemoteApi(apiUrl, token, () => void forget()), [apiUrl, token, forget]);
  const api: CampusApi = demo ? (demoApi.current ??= new DemoApi()) : remote;

  // Восстановление сессии при запуске
  useEffect(() => {
    (async () => {
      try {
        const [savedUrl, savedToken] = await Promise.all([
          storage.getItem(URL_KEY),
          storage.getItem(TOKEN_KEY),
        ]);
        const url = savedUrl || DEFAULT_API_URL;
        setApiUrlState(url);
        if (savedToken && url) {
          const client = new RemoteApi(url, savedToken, () => undefined);
          try {
            setMe(await client.me());
            setToken(savedToken);
          } catch (e) {
            // Нет сети — токен оставляем, пользователь увидит ошибку на экране; 401 — выходим
            if ((e as { status?: number }).status === 401) await storage.deleteItem(TOKEN_KEY);
            else setToken(savedToken);
          }
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const value = useMemo<Session>(() => ({
    ready,
    api,
    demo,
    apiUrl,
    signedIn: demo ? !!me : !!token,
    me,
    draft,
    filters,
    setDraft: (patch) => setDraftState((d) => ({ ...d, ...patch })),
    setFilters,
    async setApiUrl(url) {
      const normalized = normalizeApiUrl(url);
      setApiUrlState(normalized);
      if (normalized) await storage.setItem(URL_KEY, normalized);
      else await storage.deleteItem(URL_KEY);
    },
    startDemo() {
      demoApi.current = new DemoApi();
      setDemo(true);
      setMe(null);
      setDraftState({});
    },
    exitDemo() {
      demoApi.current = null;
      people.current.clear();
      setDemo(false);
      setMe(null);
      setDraftState({});
      setFilters({});
    },
    async signIn(newToken) {
      if (demo) {
        const profile = await api.me();
        setMe(profile);
        return profile;
      }
      await storage.setItem(TOKEN_KEY, newToken);
      const client = new RemoteApi(apiUrl, newToken, () => undefined);
      const profile = await client.me();
      setToken(newToken);
      setMe(profile);
      return profile;
    },
    async refreshMe() {
      if (!demo && !token) return null;
      const profile = await api.me();
      setMe(profile);
      return profile;
    },
    async signOut() {
      people.current.clear();
      setDraftState({});
      setFilters({});
      if (demo) {
        demoApi.current = null;
        setDemo(false);
        setMe(null);
        return;
      }
      await forget();
    },
    rememberPeople(list) {
      for (const p of list) people.current.set(p.userId, p);
    },
    person: (userId) => people.current.get(userId),
  }), [ready, api, demo, apiUrl, token, me, draft, filters, forget]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession вне SessionProvider');
  return session;
}
