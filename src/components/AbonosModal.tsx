import React, { useState } from 'react';
import { X, Wallet, Plus, Calendar, User, Receipt, Trash2 } from 'lucide-react';
import { Pedido, Abono, UserAccount } from '../types';

interface AbonosModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
  currentUser: UserAccount;
  onSaveAbono: (pedidoId: string, abono: Omit<Abono, 'id'>) => void;
  onDeleteAbono?: (pedidoId: string, abonoId: string) => void;
}

export const AbonosModal: React.FC<AbonosModalProps> = ({
  isOpen,
  onClose,
  pedido,
  currentUser,
  onSaveAbono,
  onDeleteAbono,
}) => {
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('Transferencia Bancaria');
  const [comprobante, setComprobante] = useState('');

  if (!isOpen || !pedido) return null;

  const totalAbonado = pedido.abonos.reduce((acc, a) => acc + a.monto, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(monto);
    if (!val || val <= 0) {
      alert('Por favor ingrese un monto válido mayor a 0');
      return;
    }

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    onSaveAbono(pedido.id, {
      fecha: `${dd}/${mm}/${yy} ${hh}:${min}`,
      monto: val,
      metodo,
      comprobante: comprobante.trim() || 'S/C',
      usuario: currentUser.nombre,
    });

    setMonto('');
    setComprobante('');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#141414] border border-neutral-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#e50914]" />
            <span>ABONOS A PEDIDO:</span>
            <span className="text-[#e50914] font-mono">{pedido.id}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer & Balance summary card */}
        <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-400">Total Pedido</div>
            <div className="text-sm font-black font-mono text-white mt-0.5">
              ${pedido.total.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-400">Total Abonado</div>
            <div className="text-sm font-black font-mono text-green-400 mt-0.5">
              ${totalAbonado.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-400">Saldo Pendiente</div>
            <div className={`text-sm font-black font-mono mt-0.5 ${pedido.saldo > 0 ? 'text-[#e50914]' : 'text-neutral-400'}`}>
              ${pedido.saldo.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="text-[11px] text-neutral-400 px-1">
          Cliente: <strong className="text-white">{pedido.cliente}</strong> · Vehículo: <strong className="text-white">{pedido.vehiculo} ({pedido.placa})</strong>
        </div>

        {/* New Abono Form */}
        <form onSubmit={handleSubmit} className="space-y-3 bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
          <div className="text-xs font-bold uppercase text-neutral-300 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-[#e50914]" /> Registrar Nuevo Abono
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
              Monto del Abono ($ COP)*
            </label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Ej. 300000"
              required
              min="1"
              max={pedido.saldo > 0 ? pedido.saldo : undefined}
              className="w-full bg-neutral-800 border border-neutral-700 p-2 rounded text-xs text-white font-mono font-bold focus:outline-none focus:border-[#e50914]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                Método de Pago*
              </label>
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
              >
                <option value="Transferencia Bancaria">Transferencia Bancaria (Bancolombia)</option>
                <option value="Efectivo">Efectivo en Caja</option>
                <option value="Datáfono / Tarjeta">Datáfono / Tarjeta Débito/Crédito</option>
                <option value="Nequi / Daviplata">Nequi / Daviplata</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                No. Comprobante / Ref
              </label>
              <input
                type="text"
                value={comprobante}
                onChange={(e) => setComprobante(e.target.value)}
                placeholder="Ej. TR-98214"
                className="w-full bg-neutral-800 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#e50914] hover:bg-[#b80710] text-white py-2 rounded text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-red-900/40 cursor-pointer"
          >
            <Receipt className="w-4 h-4" /> Registrar Abono y Sincronizar en Nube
          </button>
        </form>

        {/* Existing Abonos List */}
        <div className="border-t border-neutral-800 pt-3">
          <div className="text-xs font-bold text-neutral-300 mb-2 flex justify-between items-center">
            <span>Historial de Abonos Recibidos ({pedido.abonos.length})</span>
          </div>

          <div className="max-h-40 overflow-y-auto custom-scrollbar border border-neutral-800 rounded-lg">
            <table className="w-full text-[11px] text-left">
              <thead className="text-neutral-400 bg-neutral-900 border-b border-neutral-800 sticky top-0">
                <tr>
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Monto</th>
                  <th className="p-2">Método / Ref</th>
                  <th className="p-2">Cajero</th>
                  {currentUser.role === 'Administrador' && <th className="p-2 text-center">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {pedido.abonos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-neutral-500">
                      Sin abonos registrados aún.
                    </td>
                  </tr>
                ) : (
                  pedido.abonos.map((a) => (
                    <tr key={a.id} className="hover:bg-neutral-800/40">
                      <td className="p-2 font-mono text-neutral-400">{a.fecha}</td>
                      <td className="p-2 font-bold font-mono text-green-400">
                        ${a.monto.toLocaleString()}
                      </td>
                      <td className="p-2 text-neutral-300">
                        <div>{a.metodo}</div>
                        {a.comprobante && (
                          <div className="text-[10px] text-neutral-500 font-mono">
                            Ref: {a.comprobante}
                          </div>
                        )}
                      </td>
                      <td className="p-2 text-neutral-400">{a.usuario}</td>
                      {currentUser.role === 'Administrador' && (
                        <td className="p-2 text-center">
                          {onDeleteAbono && (
                            <button
                              onClick={() => {
                                if (confirm(`¿Anular abono de $${a.monto.toLocaleString()}?`)) {
                                  onDeleteAbono(pedido.id, a.id);
                                }
                              }}
                              className="text-neutral-500 hover:text-[#e50914] p-1 rounded transition"
                              title="Anular abono (Solo Administrador)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
