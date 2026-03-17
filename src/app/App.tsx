import { useEffect, useState, type SubmitEvent, type JSX } from 'react';
import { loginRequest, getApiErrorMessage } from '../features/auth/api';
import { LoginForm } from '../features/auth/components/LoginForm';
import { clearSession, getPersistedSession, getSafeboxApiBaseUrl, persistSession } from '../features/auth/session';
import type { AuthUser, LoginPayload } from '../features/auth/types';
import { Dashboard } from '../features/dashboard/components/Dashboard';

const App = (): JSX.Element => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const persisted = getPersistedSession();
    if (!persisted) return;

    setToken(persisted.token);
    setUser(persisted.user);
  }, []);

  const handleLogin = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const apiBase = getSafeboxApiBaseUrl();
    if (!apiBase) {
      setAuthError('Configure VITE_SAFEBOX_API (ou NEXT_PUBLIC_SAFEBOX_API) no .env');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    const payload: LoginPayload = {
      email: email.trim(),
      password,
    };

    try {
      const data = await loginRequest(apiBase, payload);
      setToken(data.token);
      setUser(data.user);
      persistSession(data.token, data.user);
    } catch (error) {
      setAuthError(getApiErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = (): void => {
    setToken(null);
    setUser(null);
    setPassword('');
    clearSession();
  };

  if (!token || !user) {
    return (
      <LoginForm
        email={email}
        password={password}
        isLoading={authLoading}
        error={authError}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return <Dashboard user={user} token={token} onLogout={handleLogout} />;
};

export default App;
