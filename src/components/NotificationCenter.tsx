import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  ExternalLink,
  PlusCircle,
  Volume2,
  VolumeX,
  Globe,
  ShoppingCart,
  Hammer,
  Calendar,
  Wallet,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AppNotification, ActiveModule } from '../types';
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
} from '../services/notificationService';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
  onNavigateToModule: (module?: ActiveModule, pedidoId?: string) => void;
  onOpenCreateReminder: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onDeleteNotification,
  onNavigateToModule,
  onOpenCreateReminder,
}) => {
  const [filter, setFilter] = useState<'todas' | 'noLeidas' | 'alertas'>('todas');
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    getBrowserNotificationPermission()
  );

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserPermission(res);
  };

  const unreadCount = notifications.filter((n) => !n.leida).length;

  const filtered = notifications.filter((n) => {
    if (filter === 'noLeidas') return !n.leida;
    if (filter === 'alertas') return n.prioridad === 'urgente' || n.prioridad === 'alta';
    return true;
  });

  const getCategoryIcon = (tipo: AppNotification['tipo']) => {
    switch (tipo) {
      case 'nuevo_pedido':
        return <ShoppingCart className="w-3.5 h-3.5 text-[#e50914]" />;
      case 'produccion':
        return <Hammer className="w-3.5 h-3.5 text-amber-400" />;
      case 'cronograma':
        return <Calendar className="w-3.5 h-3.5 text-green-400" />;
      case 'pago':
        return <Wallet className="w-3.5 h-3.5 text-emerald-400" />;
      case 'recordatorio':
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-[#e50914]" />;
    }
  };

  const getRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return `Hace ${diffDays} d`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end sm:p-4 pt-16 sm:pt-18 pointer-events-none animate-in fade-in duration-100">
      {/* Background click to dismiss */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs pointer-events-auto"
        onClick={onClose}
      />

      {/* Popover container */}
      <div className="relative pointer-events-auto w-full sm:max-w-md bg-[#161616] border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] text-white overflow-hidden mr-0 sm:mr-4">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-neutral-800 rounded-lg text-[#e50914] border border-neutral-700">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide text-white uppercase flex items-center gap-1.5">
                <span>Notificaciones</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#e50914] text-white text-[10px] font-mono font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-neutral-400">
                Alertas operativas de taller, pedidos y citas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenCreateReminder}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded text-[11px] font-semibold transition flex items-center gap-1 border border-neutral-700 cursor-pointer"
              title="Crear recordatorio operativo"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#e50914]" />
              <span className="hidden sm:inline">Recordatorio</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Browser Push Permission Banner */}
        <div className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <Globe className="w-4 h-4 text-neutral-400 shrink-0" />
            <div className="text-[11px] leading-tight">
              {browserPermission === 'granted' ? (
                <span className="text-green-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Notificaciones Push Activas
                </span>
              ) : browserPermission === 'denied' ? (
                <span className="text-neutral-400">Notificaciones del navegador bloqueadas</span>
              ) : (
                <span className="text-neutral-300">Recibe alertas en segundo plano</span>
              )}
            </div>
          </div>

          {browserPermission !== 'granted' && browserPermission !== 'unsupported' && (
            <button
              onClick={handleRequestPermission}
              className="px-2.5 py-1 bg-[#e50914] hover:bg-[#b80710] text-white text-[10px] font-bold rounded transition cursor-pointer shrink-0"
            >
              Activar Push
            </button>
          )}
        </div>

        {/* Filter Tabs & Quick Action buttons */}
        <div className="px-4 py-2 border-b border-neutral-800 flex items-center justify-between gap-2 text-xs bg-[#141414]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('todas')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                filter === 'todas'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('noLeidas')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                filter === 'noLeidas'
                  ? 'bg-neutral-800 text-[#e50914]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              No leídas ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('alertas')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                filter === 'alertas'
                  ? 'bg-neutral-800 text-amber-400'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Alertas
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded transition"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-neutral-400 hover:text-[#e50914] p-1 rounded transition"
                title="Limpiar todas las notificaciones"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-neutral-800/80">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 space-y-2">
              <Bell className="w-8 h-8 mx-auto opacity-30 text-neutral-400" />
              <div className="text-xs font-semibold">No hay notificaciones en este filtro</div>
              <p className="text-[10px] text-neutral-600">
                Las alertas de nuevos pedidos, fabricación y citas aparecerán aquí.
              </p>
            </div>
          ) : (
            filtered.map((n) => {
              const isUnread = !n.leida;
              return (
                <div
                  key={n.id}
                  className={`p-3.5 transition flex items-start gap-3 hover:bg-neutral-900/60 relative ${
                    isUnread ? 'bg-neutral-900/30' : 'opacity-85'
                  }`}
                >
                  {/* Unread indicator */}
                  {isUnread && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e50914] absolute left-1.5 top-5"></span>
                  )}

                  {/* Icon */}
                  <div className="p-2 bg-neutral-900 rounded-lg shrink-0 border border-neutral-800 mt-0.5">
                    {getCategoryIcon(n.tipo)}
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      onMarkAsRead(n.id);
                      if (n.moduloDestino) {
                        onNavigateToModule(n.moduloDestino, n.pedidoId);
                        onClose();
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white leading-snug">
                          {n.titulo}
                        </span>
                        {n.prioridad === 'urgente' && (
                          <span className="px-1 py-0.2 bg-red-950 text-red-300 text-[8px] font-black rounded border border-red-800">
                            URGENTE
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                        {getRelativeTime(n.timestamp)}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                      {n.mensaje}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      {n.pedidoId && (
                        <span className="font-mono text-[10px] font-bold text-[#e50914] bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                          {n.pedidoId}
                        </span>
                      )}
                      {n.moduloDestino && (
                        <span className="text-[10px] text-neutral-400 flex items-center gap-0.5 hover:text-white">
                          <span>Ir al módulo</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNotification(n.id);
                    }}
                    className="text-neutral-600 hover:text-neutral-300 p-1 rounded transition shrink-0"
                    title="Eliminar notificación"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#121212] border-t border-neutral-800 text-[10px] text-neutral-500 flex justify-between items-center">
          <span>Sistema de Avisos en Planta FALPRO S.A.S. · Chocontá</span>
          <span>Actualizado en tiempo real</span>
        </div>
      </div>
    </div>
  );
};
