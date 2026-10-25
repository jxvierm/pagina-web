import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  Truck,
  Wrench,
  Search,
  Check,
} from 'lucide-react';
import { Pedido } from '../types';

interface CronogramaViewProps {
  pedidos: Pedido[];
  onToggleConfirmacion: (pedidoId: string) => void;
  onUpdateFechaInstalacion: (pedidoId: string, nuevaFecha: string, bahia: string) => void;
}

export const CronogramaView: React.FC<CronogramaViewProps> = ({
  pedidos,
  onToggleConfirmacion,
  onUpdateFechaInstalacion,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [editFecha, setEditFecha] = useState('');
  const [editBahia, setEditBahia] = useState('Bahía 1 (Pista Principal)');

  const filtered = pedidos.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      p.cliente.toLowerCase().includes(q) ||
      (p.placa ? p.placa.toLowerCase().includes(q) : false) ||
      p.vehiculo.toLowerCase().includes(q)
    );
  });

  const handleOpenEdit = (p: Pedido) => {
    setEditingPedido(p);
    setEditFecha(p.instalacion.fecha.includes('T') ? p.instalacion.fecha : '2026-10-26T10:00');
    setEditBahia(p.instalacion.bahia || 'Bahía 1 (Pista Principal)');
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPedido) return;
    onUpdateFechaInstalacion(editingPedido.id, editFecha, editBahia);
    setEditingPedido(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-6 bg-[#e50914] rounded-sm"></span>
            CRONOGRAMA DE INSTALACIONES Y ENTREGAS
          </h1>
          <p className="text-xs text-neutral-400">
            Coordinación de bahías de ensamble, turnos de montajes de acero y confirmación con transportadores
          </p>
        </div>

        <div className="text-xs text-neutral-400 bg-[#141414] border border-neutral-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#e50914]" />
          <span>Agenda Operativa Activa</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl flex items-center gap-2">
        <Search className="w-4 h-4 text-neutral-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar cita por cliente, vehículo o pedido..."
          className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914] w-full"
        />
      </div>

      {/* Schedule Table */}
      <div className="bg-[#141414] border border-neutral-800 rounded-xl p-5 shadow space-y-4">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <h2 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#e50914]" /> Turnos y Bahías Coordinadas ({filtered.length})
          </h2>
          <span className="text-xs text-neutral-500">Horarios confirmados con taller</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-900 text-neutral-300 uppercase">
              <tr className="border-b border-neutral-800">
                <th className="p-3">Fecha y Hora Cita</th>
                <th className="p-3">Bahía Asignada</th>
                <th className="p-3">No. Pedido</th>
                <th className="p-3">Cliente / Transportador</th>
                <th className="p-3">Vehículo</th>
                <th className="p-3">Trabajo a Instalar</th>
                <th className="p-3">Confirmación</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filtered.map((p) => {
                const isConfirmed = p.instalacion.confirmada;
                const formattedDate = p.instalacion.fecha.replace('T', ' ');
                return (
                  <tr key={p.id} className="hover:bg-neutral-900/50 transition">
                    <td className="p-3 font-mono font-bold text-white whitespace-nowrap">
                      {formattedDate}
                    </td>
                    <td className="p-3 font-semibold text-neutral-300 whitespace-nowrap">
                      {p.instalacion.bahia || 'Bahía 1 (Pista Principal)'}
                    </td>
                    <td className="p-3 font-mono font-bold text-[#e50914] whitespace-nowrap">
                      {p.id}
                    </td>
                    <td className="p-3 font-bold text-white whitespace-nowrap">
                      {p.cliente}
                      <div className="text-[10px] text-neutral-400 font-normal flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {p.telefono}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span>{p.vehiculo}</span>
                      {p.placa ? (
                        <span className="ml-1 bg-neutral-900 border border-neutral-700 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-[#e50914]">
                          {p.placa}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-3 text-neutral-300 max-w-xs truncate">
                      {p.items.map((i) => i.producto).join(', ')}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isConfirmed
                            ? 'bg-green-950 text-green-300 border border-green-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {isConfirmed ? 'Confirmado por Cliente' : 'Pendiente Confirmar'}
                      </span>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap space-x-1">
                      <button
                        onClick={() => onToggleConfirmacion(p.id)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded transition cursor-pointer ${
                          isConfirmed
                            ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                            : 'bg-green-900/70 hover:bg-green-800 text-green-300 border border-green-700'
                        }`}
                      >
                        {isConfirmed ? 'Desmarcar' : 'Confirmar Cita'}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] font-semibold transition cursor-pointer"
                      >
                        Reagendar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Reagendar */}
      {editingPedido && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#e50914]" /> COORDINAR CITA: {editingPedido.id}
              </h3>
              <button onClick={() => setEditingPedido(null)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="text-xs text-neutral-300">
              Vehículo: <strong>{editingPedido.vehiculo}{editingPedido.placa ? ` (${editingPedido.placa})` : ''}</strong> · Cliente: <strong>{editingPedido.cliente}</strong>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Fecha y Hora de Cita en Bahía*
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editFecha}
                  onChange={(e) => setEditFecha(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Bahía Asignada de Instalación
                </label>
                <select
                  value={editBahia}
                  onChange={(e) => setEditBahia(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white"
                >
                  <option value="Bahía 1 (Pista Principal - Mulas)">Bahía 1 (Pista Principal - Mulas)</option>
                  <option value="Bahía 2 (Ajustes y Cabinas Medianas)">Bahía 2 (Ajustes y Cabinas Medianas)</option>
                  <option value="Bahía 3 (Instalación Eléctrica / Luces)">Bahía 3 (Instalación Eléctrica / Luces)</option>
                  <option value="Despacho por Encomienda Nacional">Despacho por Encomienda Nacional</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingPedido(null)}
                  className="px-4 py-2 bg-neutral-800 rounded text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded text-xs font-bold"
                >
                  Guardar Horario en Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
