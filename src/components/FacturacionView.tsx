import React, { useState } from 'react';
import {
  Receipt,
  FileText,
  FilePlus,
  Printer,
  ArrowRight,
  Plus,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  Pedido,
  Cotizacion,
  FacturaSinPedido,
  RolePermissions,
  OrderItem,
} from '../types';

interface FacturacionViewProps {
  pedidos: Pedido[];
  cotizaciones: Cotizacion[];
  facturasSinPedido: FacturaSinPedido[];
  onOpenPrintModalForPedido: (pedido: Pedido) => void;
  onOpenPrintModalForCotizacion: (cot: Cotizacion) => void;
  onOpenPrintModalForFacturaSP: (fac: FacturaSinPedido) => void;
  onConvertQuoteToOrder: (cot: Cotizacion) => void;
  onAddCotizacion: (cot: Cotizacion) => void;
  onAddFacturaSinPedido: (fac: FacturaSinPedido) => void;
  permissions: RolePermissions;
}

export const FacturacionView: React.FC<FacturacionViewProps> = ({
  pedidos,
  cotizaciones,
  facturasSinPedido,
  onOpenPrintModalForPedido,
  onOpenPrintModalForCotizacion,
  onOpenPrintModalForFacturaSP,
  onConvertQuoteToOrder,
  onAddCotizacion,
  onAddFacturaSinPedido,
  permissions,
}) => {
  // Modal states
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false);
  const [showDirectInvoiceModal, setShowDirectInvoiceModal] = useState(false);

  // New Quote form fields
  const [quoteClient, setQuoteClient] = useState('');
  const [quotePhone, setQuotePhone] = useState('');
  const [quoteVehicle, setQuoteVehicle] = useState('');
  const [quoteItems, setQuoteItems] = useState<OrderItem[]>([
    { id: 'q-it-1', producto: '', desc: '', cant: 1, vUnit: 0, total: 0 },
  ]);
  const [quoteVigencia, setQuoteVigencia] = useState('15 días hábiles');

  // Direct Invoice form fields
  const [spClient, setSpClient] = useState('');
  const [spNit, setSpNit] = useState('');
  const [spPhone, setSpPhone] = useState('');
  const [spItems, setSpItems] = useState<OrderItem[]>([
    { id: 'sp-it-1', producto: '', desc: '', cant: 1, vUnit: 0, total: 0 },
  ]);
  const [spAbono, setSpAbono] = useState<number>(0);
  const [spMetodo, setSpMetodo] = useState('Efectivo');

  // Helper for adding quote items
  const addQuoteItem = () => {
    setQuoteItems([
      ...quoteItems,
      { id: 'q-it-' + Date.now(), producto: '', desc: '', cant: 1, vUnit: 0, total: 0 },
    ]);
  };

  const handleQuoteItemChange = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const updated = [...quoteItems];
    const current = { ...updated[index], [field]: value };
    if (field === 'cant' || field === 'vUnit') {
      current.total = (Number(current.cant) || 0) * (Number(current.vUnit) || 0);
    }
    updated[index] = current;
    setQuoteItems(updated);
  };

  const quoteTotal = quoteItems.reduce((acc, it) => acc + (it.total || 0), 0);

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteClient.trim()) {
      alert('Ingrese el nombre del cliente');
      return;
    }
    const validItems = quoteItems.filter((i) => i.producto.trim().length > 0);
    if (validItems.length === 0) {
      alert('Ingrese al menos un producto o trabajo a cotizar');
      return;
    }

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);

    const newQuote: Cotizacion = {
      id: `COT-2026-${String(cotizaciones.length + 1).padStart(4, '0')}`,
      cliente: quoteClient.trim(),
      tel: quotePhone.trim(),
      vehiculo: quoteVehicle.trim(),
      placa: '',
      total: quoteTotal,
      vigencia: quoteVigencia,
      estado: 'Pendiente',
      items: validItems,
      fecha: `${dd}/${mm}/${yy}`,
    };

    onAddCotizacion(newQuote);
    setShowNewQuoteModal(false);
    setQuoteClient('');
    setQuotePhone('');
    setQuoteVehicle('');
    setQuoteItems([{ id: 'q-it-1', producto: '', desc: '', cant: 1, vUnit: 0, total: 0 }]);
  };

  // Direct Invoice submit
  const addSpItem = () => {
    setSpItems([
      ...spItems,
      { id: 'sp-it-' + Date.now(), producto: '', desc: '', cant: 1, vUnit: 0, total: 0 },
    ]);
  };

  const handleSpItemChange = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const updated = [...spItems];
    const current = { ...updated[index], [field]: value };
    if (field === 'cant' || field === 'vUnit') {
      current.total = (Number(current.cant) || 0) * (Number(current.vUnit) || 0);
    }
    updated[index] = current;
    setSpItems(updated);
  };

  const spTotal = spItems.reduce((acc, it) => acc + (it.total || 0), 0);
  const spSaldo = Math.max(0, spTotal - (spAbono || 0));

  const handleSaveSpInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spClient.trim()) {
      alert('Ingrese el cliente para la factura');
      return;
    }
    const validItems = spItems.filter((i) => i.producto.trim().length > 0);
    if (validItems.length === 0) {
      alert('Agregue al menos un ítem');
      return;
    }

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);

    const newSp: FacturaSinPedido = {
      id: `FAC-SP-2026-${String(facturasSinPedido.length + 1).padStart(4, '0')}`,
      fecha: `${dd}/${mm}/${yy}`,
      cliente: spClient.trim(),
      nitOCedula: spNit.trim() || '222222222222',
      telefono: spPhone.trim(),
      items: validItems,
      subtotal: spTotal,
      impuesto: 0,
      total: spTotal,
      abono: spAbono,
      saldo: spSaldo,
      metodoPago: spMetodo,
      notas: 'Venta directa en mostrador sin orden previa de fabricación',
    };

    onAddFacturaSinPedido(newSp);
    setShowDirectInvoiceModal(false);
    setSpClient('');
    setSpNit('');
    setSpPhone('');
    setSpAbono(0);
    setSpItems([{ id: 'sp-it-1', producto: '', desc: '', cant: 1, vUnit: 0, total: 0 }]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-6 bg-[#e50914] rounded-sm"></span>
            FACTURACIÓN Y COTIZACIONES
          </h1>
          <p className="text-xs text-neutral-400">
            Documentos comerciales internos con impresión formal a PDF. (No sustituye la factura electrónica legal fiscal).
          </p>
        </div>

        {permissions.facturar && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowDirectInvoiceModal(true)}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <FilePlus className="w-4 h-4 text-[#e50914]" /> Factura Sin Pedido
            </button>
            <button
              onClick={() => setShowNewQuoteModal(true)}
              className="px-3.5 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-bold transition shadow-md shadow-red-900/40 flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" /> Nueva Cotización
            </button>
          </div>
        )}
      </div>

      {/* Grid: Facturas vs Cotizaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Facturas Emitidas */}
        <div className="bg-[#141414] border border-neutral-800 rounded-xl p-5 shadow space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
            <h2 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#e50914]" /> Facturas Emitidas ({pedidos.length + facturasSinPedido.length})
            </h2>
            <span className="text-xs text-neutral-500">Documentos listos para imprimir</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="text-neutral-400 border-b border-neutral-800 bg-neutral-900/50">
                <tr>
                  <th className="p-2.5">No. Factura</th>
                  <th className="p-2.5">Ref. / Fecha</th>
                  <th className="p-2.5">Cliente</th>
                  <th className="p-2.5 text-right">Total</th>
                  <th className="p-2.5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {/* Orders invoices */}
                {pedidos.map((p, idx) => {
                  const invoiceNum = `FAC-${p.id}`;
                  return (
                    <tr key={p.id} className="hover:bg-neutral-900/50 transition">
                      <td className="p-2.5 font-mono font-bold text-[#e50914]">{invoiceNum}</td>
                      <td className="p-2.5 font-mono text-neutral-400 text-[11px]">{p.fecha}</td>
                      <td className="p-2.5 font-semibold text-white">
                        {p.cliente}
                        <div className="text-[10px] text-neutral-400 font-normal">
                          {p.vehiculo}{p.placa ? ` · ${p.placa}` : ''}
                        </div>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-white">
                        ${p.total.toLocaleString()}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => onOpenPrintModalForPedido(p)}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-bold rounded flex items-center gap-1 mx-auto transition cursor-pointer"
                        >
                          <Printer className="w-3 h-3 text-[#e50914]" /> Imprimir
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Direct counter invoices */}
                {facturasSinPedido.map((sp) => (
                  <tr key={sp.id} className="hover:bg-neutral-900/50 transition bg-neutral-900/20">
                    <td className="p-2.5 font-mono font-bold text-blue-400">{sp.id}</td>
                    <td className="p-2.5 font-mono text-neutral-400 text-[11px]">{sp.fecha}</td>
                    <td className="p-2.5 font-semibold text-white">
                      {sp.cliente}
                      <span className="ml-1 text-[9px] px-1 bg-neutral-800 text-blue-400 rounded">
                        Venta Directa
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-white">
                      ${sp.total.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => onOpenPrintModalForFacturaSP(sp)}
                        className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-bold rounded flex items-center gap-1 mx-auto transition cursor-pointer"
                      >
                        <Printer className="w-3 h-3 text-blue-400" /> Imprimir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Cotizaciones Registradas */}
        <div className="bg-[#141414] border border-neutral-800 rounded-xl p-5 shadow space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
            <h2 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" /> Cotizaciones Registradas ({cotizaciones.length})
            </h2>
            <span className="text-xs text-neutral-500">Con conversión directa a pedido</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="text-neutral-400 border-b border-neutral-800 bg-neutral-900/50">
                <tr>
                  <th className="p-2.5">No. Cotiz.</th>
                  <th className="p-2.5">Cliente</th>
                  <th className="p-2.5">Vigencia</th>
                  <th className="p-2.5 text-right">Total</th>
                  <th className="p-2.5">Estado</th>
                  <th className="p-2.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {cotizaciones.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-neutral-500">
                      No hay cotizaciones registradas actualmente.
                    </td>
                  </tr>
                ) : (
                  cotizaciones.map((c) => {
                    const isConverted = c.estado === 'Convertida';
                    return (
                      <tr key={c.id} className="hover:bg-neutral-900/50 transition">
                        <td className="p-2.5 font-mono font-bold text-amber-400">{c.id}</td>
                        <td className="p-2.5 font-semibold text-white">
                          {c.cliente}
                          {c.vehiculo && (
                            <div className="text-[10px] text-neutral-400 font-normal">
                              {c.vehiculo} {c.placa ? `(${c.placa})` : ''}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-neutral-400 text-[11px]">{c.vigencia}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-white">
                          ${c.total.toLocaleString()}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isConverted
                                ? 'bg-green-950 text-green-300 border border-green-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {c.estado}
                          </span>
                        </td>
                        <td className="p-2.5 text-center space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => onOpenPrintModalForCotizacion(c)}
                            title="Ver / Imprimir Cotización"
                            className="p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {!isConverted && permissions.crear && (
                            <button
                              onClick={() => onConvertQuoteToOrder(c)}
                              title="Crear Pedido de Fábrica a partir de esta cotización"
                              className="px-2 py-1 bg-[#e50914] hover:bg-[#b80710] text-white text-[10px] font-bold rounded transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              A Pedido <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Nueva Cotización */}
      {showNewQuoteModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-neutral-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-auto text-white">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" /> GENERAR NUEVA COTIZACIÓN FORMAL
              </h3>
              <button
                onClick={() => setShowNewQuoteModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Cliente / Razón Social*
                  </label>
                  <input
                    type="text"
                    required
                    value={quoteClient}
                    onChange={(e) => setQuoteClient(e.target.value)}
                    placeholder="Ej. Flota Santander SAS"
                    className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="tel"
                    value={quotePhone}
                    onChange={(e) => setQuotePhone(e.target.value)}
                    placeholder="Ej. 3112233445"
                    className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Vehículo (Modelo)
                  </label>
                  <input
                    type="text"
                    value={quoteVehicle}
                    onChange={(e) => setQuoteVehicle(e.target.value)}
                    placeholder="Ej. Kenworth T800"
                    className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Vigencia de Cotización
                  </label>
                  <input
                    type="text"
                    value={quoteVigencia}
                    onChange={(e) => setQuoteVigencia(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-neutral-300">
                    Productos o Trabajos Cotizados
                  </span>
                  <button
                    type="button"
                    onClick={addQuoteItem}
                    className="text-xs text-[#e50914] hover:underline font-bold"
                  >
                    + Agregar Fila
                  </button>
                </div>

                <div className="space-y-2">
                  {quoteItems.map((qIt, idx) => (
                    <div key={qIt.id} className="grid grid-cols-12 gap-2 bg-neutral-900/60 p-2 rounded border border-neutral-800">
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          value={qIt.producto}
                          onChange={(e) => handleQuoteItemChange(idx, 'producto', e.target.value)}
                          placeholder="Nombre del accesorio..."
                          className="w-full bg-neutral-900 border border-neutral-700 p-1.5 rounded text-xs text-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={1}
                          value={qIt.cant}
                          onChange={(e) => handleQuoteItemChange(idx, 'cant', parseInt(e.target.value) || 1)}
                          className="w-full bg-neutral-900 border border-neutral-700 p-1.5 rounded text-xs text-center font-mono text-white"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min={0}
                          value={qIt.vUnit}
                          onChange={(e) => handleQuoteItemChange(idx, 'vUnit', parseFloat(e.target.value) || 0)}
                          placeholder="V. Unit"
                          className="w-full bg-neutral-900 border border-neutral-700 p-1.5 rounded text-xs text-right font-mono text-white"
                        />
                      </div>
                      <div className="col-span-2 text-right self-center font-mono font-bold text-xs text-amber-400">
                        ${(qIt.total || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center bg-neutral-900 p-3 rounded-lg border border-neutral-800">
                <span className="text-xs text-neutral-400 font-semibold">Total Cotización Estimada:</span>
                <span className="text-lg font-black font-mono text-amber-400">
                  ${quoteTotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowNewQuoteModal(false)}
                  className="px-4 py-2 bg-neutral-800 rounded text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded text-xs font-bold"
                >
                  Guardar Cotización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Factura Sin Pedido (Venta Directa) */}
      {showDirectInvoiceModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-neutral-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-auto text-white">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-blue-400" /> EMISIÓN DE FACTURA SIN PEDIDO (VENTA MOSTRADOR)
              </h3>
              <button
                onClick={() => setShowDirectInvoiceModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSpInvoice} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Cliente / Razón Social*
                  </label>
                  <input
                    type="text"
                    required
                    value={spClient}
                    onChange={(e) => setSpClient(e.target.value)}
                    placeholder="Ej. Pedro Picapiedra"
                    className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    C.C. o NIT
                  </label>
                  <input
                    type="text"
                    value={spNit}
                    onChange={(e) => setSpNit(e.target.value)}
                    placeholder="Ej. 1020304050"
                    className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-neutral-300">
                    Artículos Despachados
                  </span>
                  <button
                    type="button"
                    onClick={addSpItem}
                    className="text-xs text-blue-400 hover:underline font-bold"
                  >
                    + Agregar Ítem
                  </button>
                </div>

                {spItems.map((it, idx) => (
                  <div key={it.id} className="grid grid-cols-12 gap-2 bg-neutral-900/60 p-2 rounded border border-neutral-800">
                    <div className="col-span-6">
                      <input
                        type="text"
                        required
                        value={it.producto}
                        onChange={(e) => handleSpItemChange(idx, 'producto', e.target.value)}
                        placeholder="Descripción o accesorio entregado..."
                        className="w-full bg-neutral-900 border border-neutral-700 p-1.5 rounded text-xs text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min={1}
                        value={it.cant}
                        onChange={(e) => handleSpItemChange(idx, 'cant', parseInt(e.target.value) || 1)}
                        className="w-full bg-neutral-900 border border-neutral-700 p-1.5 rounded text-xs text-center font-mono text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min={0}
                        value={it.vUnit}
                        onChange={(e) => handleSpItemChange(idx, 'vUnit', parseFloat(e.target.value) || 0)}
                        placeholder="V. Unit"
                        className="w-full bg-neutral-900 border border-neutral-700 p-1.5 rounded text-xs text-right font-mono text-white"
                      />
                    </div>
                    <div className="col-span-2 text-right self-center font-mono font-bold text-xs text-blue-400">
                      ${(it.total || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-900 p-3 rounded-lg border border-neutral-800">
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-bold">Total Factura</div>
                  <div className="text-lg font-black font-mono text-white mt-0.5">
                    ${spTotal.toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">
                    Pago Inmediato ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={spTotal}
                    value={spAbono}
                    onChange={(e) => setSpAbono(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-800 border border-neutral-700 p-1 rounded text-xs text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-bold">Saldo Pendiente</div>
                  <div className={`text-lg font-black font-mono mt-0.5 ${spSaldo > 0 ? 'text-[#e50914]' : 'text-green-400'}`}>
                    ${spSaldo.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowDirectInvoiceModal(false)}
                  className="px-4 py-2 bg-neutral-800 rounded text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold"
                >
                  Generar Factura Directa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
