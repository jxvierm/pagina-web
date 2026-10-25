import React, { useState } from 'react';
import {
  PlusCircle,
  Search,
  Wallet,
  Printer,
  Trash2,
  Zap,
  CheckCircle2,
  Clock,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { Pedido, PedidoEstado, UserAccount, RolePermissions } from '../types';

interface PedidosViewProps {
  pedidos: Pedido[];
  onOpenNewOrderModal: () => void;
  onOpenInvoiceModal: (pedido: Pedido) => void;
  onOpenAbonosModal: (pedido: Pedido) => void;
  onUpdateOrderStatus: (pedidoId: string, nuevoEstado: PedidoEstado) => void;
  onDeleteOrder?: (pedidoId: string) => void;
  permissions: RolePermissions;
}

export const PedidosView: React.FC<PedidosViewProps> = ({
  pedidos,
  onOpenNewOrderModal,
  onOpenInvoiceModal,
  onOpenAbonosModal,
  onUpdateOrderStatus,
  onDeleteOrder,
  permissions,
}) => {
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [selectedPedidoDetalle, setSelectedPedidoDetalle] = useState<Pedido | null>(null);

  const filtered = pedidos.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.id.toLowerCase().includes(q) ||
      p.cliente.toLowerCase().includes(q) ||
      (p.placa ? p.placa.toLowerCase().includes(q) : false) ||
      p.telefono.includes(q) ||
      p.vehiculo.toLowerCase().includes(q);

    const matchEstado = filterEstado === 'todos' || p.estado === filterEstado;
    const matchTipo = filterTipo === 'todos' || p.tipoCliente === filterTipo;

    return matchSearch && matchEstado && matchTipo;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-6 bg-[#e50914] rounded-sm"></span>
            REGISTRO Y GESTIÓN DE PEDIDOS
          </h1>
          <p className="text-xs text-neutral-400">
            Control comercial unificado, validaciones de ingeniería, luces y gestión de abonos
          </p>
        </div>

        {permissions.crear && (
          <button
            onClick={onOpenNewOrderModal}
            className="bg-[#e50914] hover:bg-[#b80710] text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-900/40 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Nuevo Pedido
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, vehículo, teléfono o código..."
            className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914] w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
          >
            <option value="todos">Todos los Estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En Fabricación">En Fabricación</option>
            <option value="Listo para Instalación">Listo para Instalación</option>
            <option value="Entregado">Entregado</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
          >
            <option value="todos">Todos los Tipos</option>
            <option value="minorista">Solo Minoristas</option>
            <option value="mayorista">Solo Mayoristas</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#141414] border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-neutral-900 text-neutral-300 uppercase font-semibold">
              <tr className="border-b border-neutral-800">
                <th className="p-3">Código</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3">Vehículo</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Luces</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-right">Abonos</th>
                <th className="p-3 text-right">Saldo</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-6 text-center text-neutral-500">
                    No se encontraron pedidos con los criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const totalAbonado = p.abonos.reduce((sum, a) => sum + a.monto, 0);
                  return (
                    <tr key={p.id} className="hover:bg-neutral-900/50 transition">
                      <td className="p-3 font-mono font-bold text-[#e50914] whitespace-nowrap">
                        {p.id}
                      </td>
                      <td className="p-3 font-mono text-neutral-400 whitespace-nowrap">{p.fecha}</td>
                      <td className="p-3 font-bold text-white whitespace-nowrap">
                        {p.cliente}
                        {p.fotoRef && (
                          <span className="ml-1.5 text-[9px] px-1 py-0.2 bg-neutral-800 text-neutral-400 rounded">
                            Foto
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-neutral-300 whitespace-nowrap">
                        {p.telefono}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="text-neutral-200">{p.vehiculo}</span>
                        {p.placa ? (
                          <span className="ml-1.5 bg-neutral-900 border border-neutral-700 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-[#e50914]">
                            {p.placa}
                          </span>
                        ) : null}
                      </td>
                      <td className="p-3 uppercase text-[10px] font-semibold whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            p.tipoCliente === 'mayorista'
                              ? 'bg-purple-950 text-purple-300'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {p.tipoCliente}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {p.llevaLuces ? (
                          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                            <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{p.voltaje}</span>
                            {p.colorLogos && (
                              <span className="text-[10px] text-neutral-400 truncate max-w-[80px]">
                                ({p.colorLogos})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-500 text-[10px]">No incluye</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-white whitespace-nowrap">
                        ${p.total.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-green-400 whitespace-nowrap">
                        ${totalAbonado.toLocaleString()}
                      </td>
                      <td
                        className={`p-3 text-right font-mono font-bold whitespace-nowrap ${
                          p.saldo > 0 ? 'text-[#e50914]' : 'text-neutral-500'
                        }`}
                      >
                        ${p.saldo.toLocaleString()}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {permissions.editar ? (
                          <select
                            value={p.estado}
                            onChange={(e) =>
                              onUpdateOrderStatus(p.id, e.target.value as PedidoEstado)
                            }
                            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[10px] font-bold text-neutral-200 focus:outline-none focus:border-[#e50914]"
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="En Fabricación">En Fabricación</option>
                            <option value="Listo para Instalación">Listo para Instalación</option>
                            <option value="Entregado">Entregado</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300">
                            {p.estado}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenAbonosModal(p)}
                            title="Registrar / Ver Abonos"
                            className="p-1.5 bg-green-950 hover:bg-green-900 text-green-400 rounded border border-green-800/80 transition"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenInvoiceModal(p)}
                            title="Ver Factura Interna / Imprimir"
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded border border-neutral-700 transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedPedidoDetalle(p)}
                            title="Ver Ítems y Detalles"
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded border border-neutral-700 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {permissions.eliminar && onDeleteOrder && (
                            <button
                              onClick={() => {
                                if (confirm(`¿Está seguro de eliminar el pedido ${p.id}?`)) {
                                  onDeleteOrder(p.id);
                                }
                              }}
                              title="Eliminar Pedido (Administrador)"
                              className="p-1.5 bg-red-950/60 hover:bg-red-900 text-[#e50914] rounded border border-red-900/80 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details drawer/modal if clicked */}
      {selectedPedidoDetalle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-[#141414] border border-neutral-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-black text-white">
                DETALLE DE ORDEN: <span className="text-[#e50914] font-mono">{selectedPedidoDetalle.id}</span>
              </h3>
              <button
                onClick={() => setSelectedPedidoDetalle(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 space-y-1">
                <div>Cliente: <strong className="text-white">{selectedPedidoDetalle.cliente}</strong> ({selectedPedidoDetalle.telefono})</div>
                <div>Vehículo: <strong className="text-white">{selectedPedidoDetalle.vehiculo}</strong>{selectedPedidoDetalle.placa ? <> · Placa: <strong className="text-[#e50914]">{selectedPedidoDetalle.placa}</strong></> : null}</div>
                <div>Vendedor: {selectedPedidoDetalle.vendedor} · Fecha: {selectedPedidoDetalle.fecha}</div>
                {selectedPedidoDetalle.observaciones && (
                  <div className="text-neutral-400 pt-1 border-t border-neutral-800">
                    Obs: {selectedPedidoDetalle.observaciones}
                  </div>
                )}
              </div>

              <div>
                <div className="font-bold text-neutral-300 mb-1">Ítems a fabricar ({selectedPedidoDetalle.items.length}):</div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {selectedPedidoDetalle.items.map((it, idx) => (
                    <div key={idx} className="bg-neutral-900/60 p-2 rounded border border-neutral-800 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-white">{it.cant}x {it.producto}</div>
                        {it.desc && <div className="text-[10px] text-neutral-400">{it.desc}</div>}
                      </div>
                      <div className="text-right font-mono font-bold text-white">
                        ${it.total.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPedidoDetalle.fotoRef && (
                <div>
                  <div className="font-bold text-neutral-300 mb-1">Foto de Referencia:</div>
                  <img
                    src={selectedPedidoDetalle.fotoRef}
                    alt="Referencia de fabricación"
                    className="h-32 w-full object-cover rounded-lg border border-neutral-800"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                onClick={() => setSelectedPedidoDetalle(null)}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
