import React from 'react';
import { X, Printer, Download, CheckCircle, FileText } from 'lucide-react';
import { Pedido, Cotizacion, FacturaSinPedido } from '../types';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido?: Pedido | null;
  cotizacion?: Cotizacion | null;
  facturaSinPedido?: FacturaSinPedido | null;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  pedido,
  cotizacion,
  facturaSinPedido,
}) => {
  if (!isOpen) return null;

  // Determine source data
  const isQuote = !!cotizacion;
  const isDirectInvoice = !!facturaSinPedido;

  const docTitle = isQuote
    ? 'COTIZACIÓN COMERCIAL'
    : isDirectInvoice
    ? 'FACTURA INTERNA (VENTA DIRECTA)'
    : 'FACTURA INTERNA / COMPROBANTE DE PEDIDO';

  const docCode = isQuote
    ? cotizacion.id
    : isDirectInvoice
    ? facturaSinPedido.id
    : `FAC-${pedido?.id || '2026-00001'}`;

  const docDate = isQuote
    ? cotizacion.fecha
    : isDirectInvoice
    ? facturaSinPedido.fecha
    : pedido?.fecha || '24/10/26';

  const clientName = isQuote
    ? cotizacion.cliente
    : isDirectInvoice
    ? facturaSinPedido.cliente
    : pedido?.cliente || '';

  const clientPhone = isQuote
    ? cotizacion.tel
    : isDirectInvoice
    ? facturaSinPedido.telefono
    : pedido?.telefono || '';

  const vehicle = isQuote
    ? cotizacion.vehiculo
    : isDirectInvoice
    ? 'Venta en mostrador'
    : pedido?.vehiculo || '';

  const plate = isQuote
    ? cotizacion.placa
    : isDirectInvoice
    ? 'N/A'
    : pedido?.placa || '';

  const items = isQuote
    ? cotizacion.items
    : isDirectInvoice
    ? facturaSinPedido.items
    : pedido?.items || [];

  const total = isQuote
    ? cotizacion.total
    : isDirectInvoice
    ? facturaSinPedido.total
    : pedido?.total || 0;

  const abonosTotal = isQuote
    ? 0
    : isDirectInvoice
    ? facturaSinPedido.abono
    : pedido?.abonos.reduce((sum, a) => sum + a.monto, 0) || 0;

  const saldo = isQuote
    ? cotizacion.total
    : isDirectInvoice
    ? facturaSinPedido.saldo
    : pedido?.saldo || 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative max-w-3xl w-full my-auto space-y-4">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print flex items-center justify-between bg-neutral-900 border border-neutral-800 px-5 py-3 rounded-xl text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#e50914]" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Vista Previa de Documento Imprimible
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#e50914] hover:bg-[#b80710] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-md shadow-red-900/40 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div
          id="printInvoiceArea"
          className="bg-white text-neutral-900 rounded-xl p-8 sm:p-10 shadow-2xl space-y-6 text-xs font-sans border border-neutral-300"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-neutral-900 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-1 border border-neutral-300 shrink-0 shadow-sm overflow-hidden">
                <img
                  src="/assets/aistudio/0536b826-dd6a-4517-a94c-df560356e50f_21824cc7.jpg"
                  alt="FALPRO Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="text-2xl font-black tracking-wider leading-none text-neutral-950 flex items-center gap-1.5">
                  <span>FAL<span className="text-[#e50914]">PRO</span></span>
                  <span className="text-base text-neutral-700 font-bold">S.A.S.</span>
                </div>
                <div className="text-xs font-bold text-neutral-800 tracking-wide mt-0.5">
                  FALPRO S.A.S. · LUJOS PARA VEHÍCULOS
                </div>
                <div className="text-[11px] text-neutral-600 mt-0.5">
                  NIT: 901.482.391-4 · Cel: (+57) 310-000-0000 · info@falpro.com
                </div>
                <div className="text-[10px] text-neutral-500">
                  Chocontá, Cundinamarca · Colombia
                </div>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-sm font-black uppercase text-[#e50914] tracking-wide">
                {docTitle}
              </div>
              <div className="text-base font-black font-mono text-neutral-950 mt-0.5">
                {docCode}
              </div>
              <div className="text-xs text-neutral-600 font-semibold mt-1">
                Fecha de Emisión: <span className="font-mono text-neutral-900">{docDate}</span>
              </div>
              {pedido && (
                <div className="text-[11px] text-neutral-500 font-mono">
                  Orden Fábrica: {pedido.id}
                </div>
              )}
            </div>
          </div>

          {/* Customer & Vehicle Info Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div>
              <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                Información del Cliente
              </div>
              <div className="text-sm font-black text-neutral-950 mt-1">{clientName}</div>
              <div className="text-neutral-600 mt-0.5">
                Teléfono: <span className="font-mono font-semibold text-neutral-900">{clientPhone}</span>
              </div>
              {pedido && (
                <div className="text-[11px] text-neutral-600 mt-0.5">
                  Tipo: <span className="capitalize font-semibold">{pedido.tipoCliente}</span> · Vendedor: <span className="font-semibold">{pedido.vendedor}</span>
                </div>
              )}
            </div>

            <div className="sm:border-l sm:border-neutral-200 sm:pl-4">
              <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                Datos del Vehículo & Trabajo
              </div>
              <div className="text-sm font-bold text-neutral-900 mt-1">
                {vehicle}
                {plate && plate !== 'N/A' && (
                  <span className="ml-2 font-mono bg-neutral-200 px-2 py-0.5 rounded text-neutral-900 font-black">
                    {plate}
                  </span>
                )}
              </div>
              {pedido?.llevaLuces && (
                <div className="text-[11px] text-neutral-700 font-medium mt-1">
                  Sistema de Luces: <strong className="text-neutral-950">{pedido.voltaje}</strong> · Color/Logos: <strong className="text-neutral-950">{pedido.colorLogos || 'Personalizado'}</strong>
                </div>
              )}
              {isQuote && cotizacion && (
                <div className="text-[11px] text-neutral-600 mt-0.5">
                  Vigencia de oferta: <span className="font-semibold text-neutral-900">{cotizacion.vigencia}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-900 text-[11px] font-black uppercase text-neutral-800 bg-neutral-100">
                  <th className="py-2.5 px-3 w-14 text-center">Cant.</th>
                  <th className="py-2.5 px-3">Descripción / Producto en Acero o Luces</th>
                  <th className="py-2.5 px-3 text-right w-32">V. Unitario</th>
                  <th className="py-2.5 px-3 text-right w-36">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-neutral-500">
                      Sin ítems detallados en el comprobante.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/60">
                      <td className="py-2.5 px-3 text-center font-bold font-mono">
                        {it.cant}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-neutral-950">{it.producto}</div>
                        {it.desc && (
                          <div className="text-[11px] text-neutral-600 mt-0.5">{it.desc}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-neutral-800">
                        ${it.vUnit.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-950">
                        ${it.total.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t-2 border-neutral-900">
            <div className="sm:max-w-xs text-[11px] text-neutral-600 space-y-1">
              <div className="font-bold text-neutral-900 uppercase">Abonos Realizados:</div>
              {pedido && pedido.abonos.length > 0 ? (
                pedido.abonos.map((a, i) => (
                  <div key={i} className="flex justify-between font-mono text-[10px] text-neutral-700">
                    <span>{a.fecha} ({a.metodo}):</span>
                    <span className="font-bold text-neutral-900">${a.monto.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div className="text-neutral-500 italic">No se han registrado abonos previos.</div>
              )}
            </div>

            <div className="w-full sm:w-72 space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-600">Subtotal:</span>
                <span className="font-mono font-semibold">${total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-600">Descuento aplicado:</span>
                <span className="font-mono font-semibold">$0</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-600">Impuesto / Retenciones:</span>
                <span className="font-mono font-semibold">$0 (Régimen Simplificado)</span>
              </div>
              <div className="flex justify-between py-1.5 text-sm font-black border-b-2 border-neutral-900 text-neutral-950">
                <span>VALOR TOTAL:</span>
                <span className="font-mono">${total.toLocaleString()}</span>
              </div>
              {!isQuote && (
                <>
                  <div className="flex justify-between py-1 text-neutral-700">
                    <span>Total Abonado:</span>
                    <span className="font-mono font-bold text-green-700">
                      -${abonosTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 text-sm font-black text-[#e50914] border-t border-neutral-300">
                    <span>SALDO PENDIENTE:</span>
                    <span className="font-mono">${saldo.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Terms, Warranties & Legal Disclaimer */}
          <div className="border-t border-neutral-300 pt-4 text-[10px] text-neutral-600 space-y-1.5 leading-relaxed bg-neutral-50 p-3.5 rounded-lg">
            <div className="font-bold text-neutral-900 uppercase">
              Términos de Garantía y Pago FALPRO:
            </div>
            <p>
              • <strong>Aceros Inoxidables:</strong> 1 año de garantía sobre soldaduras estructurales TIG y brillo espejo ante agentes atmosféricos comunes.
            </p>
            <p>
              • <strong>Sistemas de Iluminación LED:</strong> 6 meses de garantía sobre estanqueidad de módulos y continuidad eléctrica contra defectos de fábrica.
            </p>
            <p>
              • <strong>Cuentas Bancarias Autorizadas:</strong> Bancolombia Cuenta de Ahorros No. <strong>123-456789-01</strong> a nombre de FALPRO S.A.S. (Enviar comprobante al 310-000-0000).
            </p>
            <p className="italic text-[9.5px] text-neutral-500 pt-1 border-t border-neutral-200">
              <strong>Nota Legal Tributaria:</strong> Este comprobante impreso corresponde a una relación interna de trabajo, orden de fabricación y cotización/pedido. No reemplaza ni sustituye la factura electrónica legal exigida por las autoridades fiscales correspondientes.
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-[11px] text-center text-neutral-700">
            <div className="border-t border-neutral-400 pt-2">
              <div className="font-bold text-neutral-900">FIRMA Y SELLO FALPRO</div>
              <div className="text-[10px] text-neutral-500">Área Comercial y Despachos</div>
            </div>
            <div className="border-t border-neutral-400 pt-2">
              <div className="font-bold text-neutral-900">FIRMA CLIENTE / AUTORIZADO</div>
              <div className="text-[10px] text-neutral-500">C.C. / NIT Conforme</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
