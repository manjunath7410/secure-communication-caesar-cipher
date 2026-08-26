import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../../types/navigation';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-notifications-container"
      className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none font-mono"
    >
      {toasts.map((toast) => {
        let borderClass = 'border-neutral-200 dark:border-neutral-800';
        let bgClass = 'bg-white dark:bg-neutral-900';
        let textClass = 'text-neutral-900 dark:text-neutral-100';
        let msgClass = 'text-neutral-600 dark:text-neutral-400';
        let icon = <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />;

        if (toast.type === 'success') {
          borderClass = 'border-emerald-200 dark:border-emerald-900/60';
          bgClass = 'bg-emerald-50/95 dark:bg-emerald-950/90';
          textClass = 'text-emerald-900 dark:text-emerald-200';
          msgClass = 'text-emerald-800/80 dark:text-emerald-300/80';
          icon = <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />;
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-200 dark:border-amber-900/60';
          bgClass = 'bg-amber-50/95 dark:bg-amber-950/90';
          textClass = 'text-amber-900 dark:text-amber-200';
          msgClass = 'text-amber-800/80 dark:text-amber-300/80';
          icon = <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />;
        } else if (toast.type === 'error') {
          borderClass = 'border-red-200 dark:border-red-900/60';
          bgClass = 'bg-red-50/95 dark:bg-red-950/90';
          textClass = 'text-red-900 dark:text-red-200';
          msgClass = 'text-red-800/80 dark:text-red-300/80';
          icon = <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />;
        }

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto p-3.5 border shadow-lg rounded-xl flex items-start gap-3 backdrop-blur-md transition-all transform animate-in slide-in-from-bottom-2 ${bgClass} ${borderClass}`}
            role="alert"
          >
            {icon}
            <div className="flex-1 min-w-0 font-sans">
              <div className={`text-xs font-semibold tracking-tight ${textClass}`}>
                {toast.title}
              </div>
              {toast.message && (
                <p className={`text-[11px] mt-0.5 leading-relaxed break-words ${msgClass}`}>
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5 transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
