import React, { useState } from 'react';
import { Bell, Clock, X, AlertTriangle, Calendar } from 'lucide-react';
import { AppNotification, NotificationPriority, Pedido, ActiveModule } from '../types';

interface CreateReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedidos: Pedido[];
  onAddNotification: (notif: AppNotification) => void;
}

export const CreateReminderModal: React.FC<CreateReminderModalProps> = ({
  isOpen,
  onClose,
  pedidos,
  onAddNotification,
}) => {
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [prioridad, setPrioridad] = useState<NotificationPriority>('alta');
  const [selectedPedidoId, setSelectedPedidoId] = useState('');
  const [moduloDestino, setModuloDestino] = useState<ActiveModule>('pedidos');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !mensaje.trim()) {
      alert('Por favor complete el título y detalle del recordatorio.');
      return;
    }

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    const newReminder: AppNotification = {
      id: 'rem-' + Date.now(),
      tipo: 'recordatorio',
      titulo: titulo.trim(),
      mensaje: mensaje.trim(),
      fecha: `${dd}/${mm}/${yy} ${hh}:${min}`,
      timestamp: Date.now(),
      leida: false,
      prioridad,
      pedidoId: selectedPedidoId || undefined,
      moduloDestino,
    };

    onAddNotification(newReminder);
    onClose();
    setTitulo('');
    setMensaje('');
    setSelectedPedidoId('');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#141414] border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#e50914]" /> CREAR RECORDATORIO / ALERTA OPERATIVA
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
              Título del Recordatorio*
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Confirmar llegada de cabina a Bahía 1"
              className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
              Detalle y Tareas a Realizar*
            </label>
            <textarea
              rows={3}
              required
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Detallar contacto, instrucciones técnicas de ensamble o revisión de cobros..."
              className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Nivel de Prioridad
              </label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as NotificationPriority)}
                className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
              >
                <option value="normal">Normal (Informativa)</option>
                <option value="alta">Alta (Atención recomendada)</option>
                <option value="urgente">Urgente (Crítica / Bloqueante)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Módulo Asociado
              </label>
              <select
                value={moduloDestino}
                onChange={(e) => setModuloDestino(e.target.value as ActiveModule)}
                className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
              >
                <option value="pedidos">Pedidos</option>
                <option value="produccion">Producción (Planta)</option>
                <option value="cronograma">Cronograma / Bahías</option>
                <option value="facturacion">Facturación</option>
                <option value="mayoristas">Mayoristas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
              Vincular a Pedido Existente (Opcional)
            </label>
            <select
              value={selectedPedidoId}
              onChange={(e) => setSelectedPedidoId(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white font-mono"
            >
              <option value="">-- Sin pedido específico --</option>
              {pedidos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} · {p.cliente} ({p.placa})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-semibold text-neutral-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded text-xs font-bold shadow-md shadow-red-900/40"
            >
              Guardar Recordatorio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
