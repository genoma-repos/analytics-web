import type { SubmitEvent, JSX } from 'react';

type LoginFormProps = {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => Promise<void>;
};

export const LoginForm = ({
  email,
  password,
  isLoading,
  error,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginFormProps): JSX.Element => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="ui-card w-full max-w-md p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Entrar</h1>
      <p className="text-slate-500 mb-6">Acesse sua conta para abrir o painel de analise.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className="ui-input w-full px-3 py-2"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            className="ui-input w-full px-3 py-2"
            placeholder="********"
          />
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

        <button type="submit" disabled={isLoading} className="ui-button w-full py-2.5 disabled:opacity-60">
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  </div>
);
