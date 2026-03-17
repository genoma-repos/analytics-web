import type { AuthUser, PersistedSession } from './types';

export const SESSION_KEY = 'doc_analyser_session';

export const getSafeboxApiBaseUrl = (): string => {
  const viteUrl = (import.meta.env.VITE_SAFEBOX_API as string | undefined) ?? '';
  const nextPublicUrl =
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
      ?.NEXT_PUBLIC_SAFEBOX_API ?? '';

  return (viteUrl || nextPublicUrl).trim();
};

export const getPersistedSession = (): PersistedSession | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PersistedSession;
    if (parsed?.token && parsed?.user) {
      return parsed;
    }
  } catch {
    localStorage.removeItem(SESSION_KEY);
  }

  return null;
};

export const persistSession = (token: string, user: AuthUser): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
};

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};
