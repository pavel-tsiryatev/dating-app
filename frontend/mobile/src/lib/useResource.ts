import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface Resource<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  reload(): Promise<void>;
  setData(update: T | ((prev: T | undefined) => T)): void;
}

/**
 * Загрузка данных экрана: при открытии, при возврате на экран и по pull-to-refresh.
 * `pollMs` — периодическое обновление, пока экран открыт (чат, ожидание оплаты).
 */
export function useResource<T>(load: () => Promise<T>, deps: unknown[], pollMs?: number): Resource<T> {
  const [data, setDataState] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loader = useRef(load);
  loader.current = load;
  const alive = useRef(true);
  useEffect(() => () => {
    alive.current = false;
  }, []);

  const run = useCallback(async (mode: 'initial' | 'refresh' | 'silent') => {
    if (mode === 'refresh') setRefreshing(true);
    try {
      const value = await loader.current();
      if (!alive.current) return;
      setDataState(value);
      setError(null);
    } catch (e) {
      if (alive.current && mode !== 'silent') setError((e as Error).message || 'Что-то пошло не так');
    } finally {
      if (alive.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useFocusEffect(
    useCallback(() => {
      void run('initial');
      if (!pollMs) return undefined;
      const timer = setInterval(() => void run('silent'), pollMs);
      return () => clearInterval(timer);
    }, [run, pollMs]),
  );

  return {
    data,
    error,
    loading: loading && data === undefined,
    refreshing,
    reload: () => run('refresh'),
    setData: (update) => setDataState((prev) => (typeof update === 'function' ? (update as (p: T | undefined) => T)(prev) : update)),
  };
}
