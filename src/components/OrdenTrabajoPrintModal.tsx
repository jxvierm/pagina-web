import React from 'react';
import {
  X,
  Printer,
  Wrench,
  CheckCircle2,
  Calendar,
  Clock,
  Phone,
  Truck,
  User,
  ShieldCheck,
  ClipboardList,
} from 'lucide-react';
import { OrdenTrabajo } from '../types';

interface OrdenTrabajoPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  orden: OrdenTrabajo | null;
}

export const OrdenTrabajoPrintModal: React.FC<OrdenTrabajoPrintModalProps> = ({
  isOpen,
  onClose,
  orden,
}) => {
  if (!isOpen || !orden) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative max-w-3xl w-full my-auto space-y-4">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print flex items-center justify-between bg-neutral-900 border border-neutral-800 px-5 py-3 rounded-xl text-white shadow-xl">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#e50914]" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Orden de Trabajo de Taller · Ficha de Montaje
            </span>
            <span className="font-mono text-neutral-400 font-bold ml-2">
              [{orden.id}]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-900/30 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Imprimir Hoja de Taller
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Work Order Sheet */}
        <div
          id="printable-orden-trabajo"
          className="bg-white text-neutral-900 p-8 sm:p-10 rounded-xl shadow-2xl font-sans text-xs space-y-6 border border-neutral-300"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b-2 border-neutral-900 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-black rounded-lg p-1 flex items-center justify-center">
                <img
                  src="/assets/aistudio/0536b826-dd6a-4517-a94c-df560356e50f_21824cc7.jpg"
                  alt="FALPRO"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-neutral-950 uppercase font-mono">
                  FALPRO S.A.S.
                </h1>
                <div className="text-[10px] text-neutral-600 font-semibold leading-tight">
                  Fabricación de Lujos e Inoxidables Automotrices
                </div>
                <div className="text-[9px] text-neutral-500 font-mono mt-0.5">
                  NIT: 901.458.789-2 · Chocontá, Cundinamarca · Colombia
                </div>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-xs font-black uppercase text-[#e50914] tracking-widest font-mono">
                ORDEN DE TRABAJO EN TALLER
              </div>
              <div className="text-xl font-black font-mono text-neutral-950 mt-0.5">
                {orden.id}
              </div>
              <div className="text-[10px] text-neutral-600 font-semibold mt-1">
                Fecha Emisión: <span className="font-mono text-neutral-900">{orden.fechaCreacion}</span>
              </div>
              {orden.pedidoId && (
                <div className="text-[10px] text-neutral-700 font-mono font-bold">
                  Ref. Pedido: {orden.pedidoId}
                </div>
              )}
            </div>
          </div>

          {/* Operational Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-100 p-3.5 rounded-lg border border-neutral-300">
            <div>
              <span className="text-[9px] uppercase font-bold text-neutral-500 block">
                Bahía Asignada
              </span>
              <span className="text-xs font-bold text-neutral-900 font-mono">
                {orden.bahia}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-neutral-500 block">
                Fecha / Hora Cita
              </span>
              <span className="text-xs font-bold text-neutral-900 font-mono">
                {orden.fechaProgramada} {orden.horaProgramada ? `· ${orden.horaProgramada}` : ''}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-neutral-500 block">
                Técnico Líder
              </span>
              <span className="text-xs font-bold text-neutral-900">
                {orden.tecnicoLider}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-neutral-500 block">
                Prioridad / Tipo
              </span>
              <span className="text-xs font-bold text-[#e50914] uppercase">
                {orden.prioridad} · {orden.tipoTrabajo}
              </span>
            </div>
          </div>

          {/* Customer & Vehicle Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
            <div>
              <div className="text-[10px] uppercase font-bold text-neutral-500 mb-1">
                Datos del Cliente / Transportador
              </div>
              <div className="text-sm font-black text-neutral-950">{orden.cliente}</div>
              <div className="text-xs text-neutral-700 mt-0.5">
                Teléfono de Contacto: <span className="font-mono font-bold text-neutral-900">{orden.telefono}</span>
              </div>
            </div>

            <div className="sm:border-l sm:border-neutral-200 sm:pl-4">
              <div className="text-[10px] uppercase font-bold text-neutral-500 mb-1">
                Datos del Vehículo
              </div>
              <div className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <span>{orden.vehiculo}</span>
                {orden.placa && orden.placa !== 'N/A' && (
                  <span className="bg-neutral-900 text-white font-mono px-2 py-0.5 rounded font-black text-xs">
                    {orden.placa}
                  </span>
                )}
              </div>
              {orden.kilometraje && (
                <div className="text-[10px] text-neutral-600 mt-1">
                  Km Ingreso: <span className="font-mono">{orden.kilometraje}</span>
                </div>
              )}
            </div>
          </div>

          {/* Checklist / Tasks to Execute in Workshop */}
          <div className="space-y-2">
            <div className="flex justify-between items-center pb-1 border-b border-neutral-300">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-[#e50914]" /> Lista de Tareas y Trabajos de Fabricación / Instalación
              </h3>
              <span className="text-[10px] text-neutral-500 font-mono">
                {orden.tareas.length} ítem(s) especificados
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs border border-neutral-300">
              <thead className="bg-neutral-100 text-neutral-700 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-2 border border-neutral-300 w-12 text-center">OK</th>
                  <th className="p-2 border border-neutral-300">Descripción del Trabajo / Pieza a Montar</th>
                  <th className="p-2 border border-neutral-300 w-32 text-center">Responsable</th>
                  <th className="p-2 border border-neutral-300 w-24 text-center">Verificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {orden.tareas.map((t, idx) => (
                  <tr key={t.id || idx}>
                    <td className="p-2.5 border border-neutral-300 text-center">
                      <div className="w-4 h-4 border-2 border-neutral-800 rounded mx-auto flex items-center justify-center font-bold">
                        {t.completada ? '✓' : ''}
                      </div>
                    </td>
                    <td className="p-2.5 border border-neutral-300 font-medium text-neutral-900">
                      {t.descripcion}
                    </td>
                    <td className="p-2.5 border border-neutral-300 text-center font-mono text-[11px] text-neutral-600">
                      {t.responsable || orden.tecnicoLider}
                    </td>
                    <td className="p-2.5 border border-neutral-300 text-center text-neutral-400 font-mono text-[10px]">
                      [ &nbsp; &nbsp; &nbsp; &nbsp; ]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Materials & Technical Specifications */}
          {(orden.materiales || orden.observaciones) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-50 p-3.5 rounded-lg border border-neutral-200">
              {orden.materiales && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Materiales / Insumos Requeridos del Taller
                  </div>
                  <div className="text-xs text-neutral-800 font-mono leading-relaxed">
                    {orden.materiales}
                  </div>
                </div>
              )}
              {orden.observaciones && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-neutral-600 mb-1">
                    Observaciones y Precauciones Técnicas
                  </div>
                  <div className="text-xs text-neutral-800 leading-relaxed italic">
                    {orden.observaciones}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quality Control Checklist Section */}
          <div className="p-3.5 bg-neutral-100/80 rounded-lg border border-neutral-300 space-y-2">
            <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-neutral-800">
              <ShieldCheck className="w-4 h-4 text-green-700" />
              Control de Calidad e Inspección Final de Montaje
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-semibold text-neutral-700">
              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-neutral-200">
                <input
                  type="checkbox"
                  defaultChecked={orden.controlCalidad?.fijacionMecanica}
                  className="rounded text-[#e50914]"
                />
                <span>Fijación Mecánica & Remaches Inox</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-neutral-200">
                <input
                  type="checkbox"
                  defaultChecked={orden.controlCalidad?.pruebaElectrica}
                  className="rounded text-[#e50914]"
                />
                <span>Prueba Eléctrica & Luces LED</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-neutral-200">
                <input
                  type="checkbox"
                  defaultChecked={orden.controlCalidad?.brilladoLimpieza}
                  className="rounded text-[#e50914]"
                />
                <span>Pulido & Brillado Tipo Espejo</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-neutral-200">
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="rounded text-[#e50914]"
                />
                <span>Limpieza Libre de Grasa</span>
              </label>
            </div>
          </div>

          {/* Physical Signatures Block */}
          <div className="grid grid-cols-2 gap-8 pt-8">
            <div className="border-t border-neutral-400 pt-2 text-center">
              <div className="h-10"></div>
              <div className="font-bold text-neutral-900 text-xs">
                {orden.tecnicoLider}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono uppercase">
                Técnico Instalador Responsable
              </div>
            </div>

            <div className="border-t border-neutral-400 pt-2 text-center">
              <div className="h-10"></div>
              <div className="font-bold text-neutral-900 text-xs">
                {orden.cliente}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono uppercase">
                Recibido a Conformidad Cliente / Conductor
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="pt-3 border-t border-neutral-300 text-center text-[9px] text-neutral-400 font-mono">
            FALPRO S.A.S. · Documento de Control Operativo de Planta · Chocontá, Cundinamarca · Soporte: (310) 123-4567
          </div>
        </div>
      </div>
    </div>
  );
};
