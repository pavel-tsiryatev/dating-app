import { useToast } from '../components/toast';
import type { ProfileInput } from './api';
import { useSession } from './session';

/** Изменить одно поле анкеты: API принимает анкету целиком, поэтому собираем её из текущей. */
export function useProfileUpdate() {
  const { api, me, refreshMe } = useSession();
  const toast = useToast();
  return async (patch: Partial<ProfileInput>) => {
    const p = me?.profile;
    if (!p) return false;
    try {
      await api.saveProfile({
        name: p.name, university: p.university, institute: p.institute, goal: p.goal, about: p.about ?? undefined,
        interests: p.interests, hideFromInstitute: p.hideFromInstitute, isVisible: p.isVisible, notifications: p.notifications,
        theme: p.theme, ...patch,
      });
      await refreshMe();
      return true;
    } catch (e) {
      toast((e as Error).message, 'error');
      return false;
    }
  };
}
