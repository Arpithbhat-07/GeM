import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    critical: <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-600/40 bg-slate-900 text-emerald-200',
    warning: 'border-amber-600/40 bg-slate-900 text-amber-200',
    critical: 'border-rose-600/40 bg-slate-900 text-rose-200',
    info: 'border-blue-600/40 bg-slate-900 text-blue-200',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-200">
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl border shadow-2xl text-xs font-medium max-w-md ${borders[toast.type] || borders.info}`}>
        {icons[toast.type] || icons.info}
        <span className="leading-snug">{toast.message}</span>
      </div>
    </div>
  );
}
