import { XCircle } from 'lucide-react';
import type { JSX } from 'react';
import type { OcrItem } from '../types';

type OcrDetailsModalProps = {
  item: OcrItem;
  onClose: () => void;
};

export const OcrDetailsModal = ({ item, onClose }: OcrDetailsModalProps): JSX.Element => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
    <div className="ui-card rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
      <div className="p-6 border-b flex justify-between items-center ui-panel rounded-t-3xl">
        <div>
          <h4 className="font-bold text-lg text-slate-900">Conteudo do OCR</h4>
          <p className="text-xs text-slate-500 italic">Analisando falha de classificacao para {item.nome}</p>
        </div>
        <button onClick={onClose} className="ui-icon-button rounded-full">
          <XCircle size={24} className="text-slate-400 hover:text-red-500" />
        </button>
      </div>
      <div className="p-8 overflow-y-auto">
        <div className="bg-slate-950 text-slate-300 p-6 rounded-2xl font-mono text-sm leading-relaxed border border-slate-800 shadow-inner">
          {item.ocr || 'Nenhum texto extraido deste documento.'}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 ui-panel">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">IA Classificou como</p>
            <p className="text-red-600 font-bold uppercase">{item.tipo}</p>
          </div>
          <div className="p-4 ui-panel">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Deveria ser</p>
            <p className="text-emerald-600 font-bold uppercase">
              {item.tipo_documento?.map((entry) => entry.nome_tipo).join(' / ')}
            </p>
          </div>
        </div>
      </div>
      <div className="p-6 border-t ui-panel rounded-b-3xl text-right">
        <button onClick={onClose} className="ui-button px-6 py-2 rounded-xl font-bold shadow-lg">
          Fechar Inspecao
        </button>
      </div>
    </div>
  </div>
);
