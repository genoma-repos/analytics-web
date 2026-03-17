import { useEffect, useState, type JSX } from 'react';
import { LogOut } from 'lucide-react';
import type { AuthUser } from '../../auth/types';
import { getSafeboxApiBaseUrl } from '../../auth/session';
import { OcrAnalysis } from './OcrAnalysis';
import { SystemAnalysis } from './SystemAnalysis';
import { AIContractDashboard } from '../../aiContractDashboard/components/AIContractDashboard';

type DashboardProps = {
  user: AuthUser;
  token: string;
  onLogout: () => void;
};

type Screen = 'ocr' | 'system' | 'ai-contract';

export const Dashboard = ({ user, token, onLogout }: DashboardProps): JSX.Element => {
  const [screen, setScreen] = useState<Screen>('ocr');
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      return;
    }

    document.documentElement.classList.remove('dark');
  }, [isDark]);

  const apiBaseUrl = getSafeboxApiBaseUrl();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Genoma Analyser</h1>
          <p className="text-slate-500">Separacao de OCR Docs e Analise Operacional de Vendas</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex ui-filter p-1">
            <button
              className={`ui-filter-button ${screen === 'ocr' ? 'ui-filter-button-active' : ''}`}
              onClick={() => setScreen('ocr')}
            >
              OCR
            </button>
            <button
              className={`ui-filter-button ${screen === 'system' ? 'ui-filter-button-active' : ''}`}
              onClick={() => setScreen('system')}
            >
              Analise do Sistema
            </button>
            <button
              className={`ui-filter-button ${screen === 'ai-contract' ? 'ui-filter-button-active' : ''}`}
              onClick={() => setScreen('ai-contract')}
            >
              AI Contratos
            </button>
          </div>

          <button
            onClick={() => setIsDark((current) => !current)}
            className="ui-button-ghost"
            title="Alternar tema"
          >
            {isDark ? 'Modo claro' : 'Modo escuro'}
          </button>

          <button onClick={onLogout} className="ui-button-ghost flex items-center gap-2" title="Sair">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {screen === 'ocr' ? <OcrAnalysis userName={user.name} userEmail={user.email} /> : null}
        {screen === 'system' ? (
          apiBaseUrl ? (
            <SystemAnalysis apiBaseUrl={apiBaseUrl} token={token} userId={user.id} />
          ) : (
            <div className="ui-card p-6 text-red-700 border-red-200 bg-red-50">
              Configure `VITE_SAFEBOX_API` (ou `NEXT_PUBLIC_SAFEBOX_API`) no `.env` para carregar a analise do sistema.
            </div>
          )
        ) : null}
        {screen === 'ai-contract' ? <AIContractDashboard token={token} /> : null}
      </div>
    </div>
  );
};
