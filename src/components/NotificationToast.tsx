import React, { useEffect } from 'react';
import {
  Bell,
  ShoppingCart,
  Hammer,
  Calendar,
  Wallet,
  AlertCircle,
  X,
  ArrowRight,
} from 'lucide-react';
import { AppNotification, ActiveModule } from '../types';

interface NotificationToastProps {
  toasts: AppNotification[];
  onDismiss: (id: string) => void;
  onNavigate: (module?: ActiveModule, pedidoId?: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  toasts,
  onDismiss,
  onNavigate,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((notif) => {
        return (
          <ToastItem
            key={notif.id}
            notification={notif}
            onDismiss={() => onDismiss(notif.id)}
            onNavigate={onNavigate}
          />
        );
      })}
    </div>
  );
};

const ToastItem: React.FC<{
  notification: AppNotification;
  onDismiss: () => void;
  onNavigate: (module?: ActiveModule, pedidoId?: string) => void;
}> = ({ notification, onDismiss, onNavigate }) => {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getIcon = () => {
    switch (notification.tipo) {
      case 'nuevo_pedido':
        return <ShoppingCart className="w-4 h-4 text-[#e50914]" />;
      case 'produccion':
        return <Hammer className="w-4 h-4 text-amber-400" />;
      case 'cronograma':
        return <Calendar className="w-4 h-4 text-green-400" />;
      case 'pago':
        return <Wallet className="w-4 h-4 text-emerald-400" />;
      case 'recordatorio':
      default:
        return <AlertCircle className="w-4 h-4 text-[#e50914]" />;
    }
  };

  const getBorderColor = () => {
    if (notification.prioridad === 'urgente') return 'border-red-600 shadow-red-950/80';
    if (notification.prioridad === 'alta') return 'border-amber-600/80 shadow-amber-950/60';
    return 'border-neutral-700 shadow-black/80';
  };

  return (
    <div
      className={`pointer-events-auto bg-[#171717] text-white border ${getBorderColor()} rounded-xl p-3.5 shadow-2xl transition-all duration-300 animate-in slide-in-from-right-4 flex items-start gap-3 relative`}
    >
      <div className="p-2 bg-neutral-900 rounded-lg shrink-0 mt-0.5 border border-neutral-800">
        {getIcon()}
      </div>

      <div
        className="flex-1 cursor-pointer pr-4"
        onClick={() => {
          onNavigate(notification.moduloDestino, notification.pedidoId);
          onDismiss();
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            FALPRO Alerta
          </span>
          {notification.prioridad === 'urgente' && (
            <span className="px-1.5 py-0.2 bg-red-950 text-red-300 text-[9px] font-black rounded border border-red-800">
              URGENTE
            </span>
          )}
        </div>
        <h4 className="text-xs font-black text-white mt-0.5 leading-snug">
          {notification.titulo}
        </h4>
        <p className="text-[11px] text-neutral-300 mt-0.5 leading-relaxed line-clamp-2">
          {notification.mensaje}
        </p>
        <div className="flex items-center gap-1 text-[10px] text-[#e50914] font-bold mt-1.5">
          <span>Abrir módulo</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="text-neutral-500 hover:text-white p-1 rounded transition shrink-0"
        title="Descartar"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
