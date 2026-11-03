import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Wrench,
  CheckCircle2,
  Calendar,
  Clock,
  Truck,
  User,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';
import {
  OrdenTrabajo,
  Pedido,
  UserAccount,
  EstadoOrdenTrabajo,
  TipoTrabajoOT,
  TareaOrdenTrabajo,
} from '../types';

interface OrdenTrabajoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ot: OrdenTrabajo) => void;
  editingOt: OrdenTrabajo | null;
  pedidos: Pedido[];
  currentUser: UserAccount;
  totalOtCount: number;
  initialPedidoId?: string;
}

const BAY_OPTIONS = [
  'Bahía 1 (Pista Principal - Mulas)',
  'Bahía 2 (Ajustes y Cabinas Medianas)',
  'Bahía 3 (Instalación Eléctrica / Luces)',
  'Bahía 4 (Montaje de Defensas y Guardabarros)',
  'Despacho por Encomienda Nacional',
];

const TIPO_TRABAJO_OPTIONS: TipoTrabajoOT[] = [
  'Instalación de Lujos Inox',
  'Instalación Eléctrica / Módulos LED',
  'Montaje Completo (Acero + Luces)',
  'Ajuste / Mantenimiento en Bahía',
  'Embalaje y Despacho',
];

export const OrdenTrabajoFormModal: React.FC<OrdenTrabajoFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingOt,
  pedidos,
  currentUser,
  totalOtCount,
  initialPedidoId,
}) => {
  const [selectedPedidoId, setSelectedPedidoId] = useState<string>('');
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [vehiculo, setVehiculo] = useState('');
  const [placa, setPlaca] = useState('');
  const [bahia, setBahia] = useState('');
  const [tecnicoLider, setTecnicoLider] = useState(currentUser.nombre || currentUser.user || '');
  const [tipoTrabajo, setTipoTrabajo] = useState<TipoTrabajoOT | ''>('');
  const [prioridad, setPrioridad] = useState<'Normal' | 'Alta' | 'Urgente'>('Normal');
  const [estado, setEstado] = useState<EstadoOrdenTrabajo>('Pendiente');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [horaProgramada, setHoraProgramada] = useState('');
  const [materiales, setMateriales] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [tareas, setTareas] = useState<TareaOrdenTrabajo[]>([]);

  // Initialize or populate when opened
  useEffect(() => {
    if (!isOpen) return;

    if (editingOt) {
      setSelectedPedidoId(editingOt.pedidoId || '');
      setCliente(editingOt.cliente);
      setTelefono(editingOt.telefono);
      setVehiculo(editingOt.vehiculo);
      setPlaca(editingOt.placa || '');
      setBahia(editingOt.bahia || '');
      setTecnicoLider(editingOt.tecnicoLider || currentUser.nombre || currentUser.user || '');
      setTipoTrabajo(editingOt.tipoTrabajo);
      setPrioridad(editingOt.prioridad);
      setEstado(editingOt.estado);
      setFechaProgramada(editingOt.fechaProgramada);
      setHoraProgramada(editingOt.horaProgramada || '');
      setMateriales(editingOt.materiales || '');
      setObservaciones(editingOt.observaciones || '');
      setTareas(editingOt.tareas.map((t) => ({ ...t })));
    } else {
      // New OT - starts without initial hardcoded values
      setFechaProgramada('');
      setHoraProgramada('');
      setTecnicoLider(currentUser.nombre || currentUser.user || '');
      setPrioridad('Normal');
      setEstado('Pendiente');
      setBahia('');
      setTipoTrabajo('');

      // If initialPedidoId was passed
      const targetId = initialPedidoId || '';
      setSelectedPedidoId(targetId);

      if (targetId) {
        populateFromPedido(targetId);
      } else {
        setCliente('');
        setTelefono('');
        setVehiculo('');
        setPlaca('');
        setMateriales('');
        setObservaciones('');
        setTareas([]);
      }
    }
  }, [isOpen, editingOt, initialPedidoId, currentUser]);

  const populateFromPedido = (pId: string) => {
    const p = pedidos.find((order) => order.id === pId);
    if (!p) return;

    setCliente(p.cliente);
    setTelefono(p.telefono);
    setVehiculo(p.vehiculo);
    setPlaca(p.placa || '');
    if (p.instalacion?.bahia) {
      setBahia(p.instalacion.bahia);
    }
    if (p.instalacion?.fecha) {
      if (p.instalacion.fecha.includes('T')) {
        const [d, t] = p.instalacion.fecha.split('T');
        setFechaProgramada(d);
        setHoraProgramada(t || '09:00');
      } else {
        setFechaProgramada(p.instalacion.fecha);
      }
    }

    const matText = p.llevaLuces
      ? `Acero Inoxidable 304, Módulos LED ${p.voltaje || '24V'} (${p.colorLogos || 'Personalizado'}), Cableado automotriz, Tornillería Inox`
      : 'Acero Inoxidable 304 troquelado / cortado a láser, Tornillería Inox';
    setMateriales(matText);

    if (p.observaciones) {
      setObservaciones(`Obs. comercial: ${p.observaciones}`);
    }

    // Build tasks from items
    const generatedTasks: TareaOrdenTrabajo[] = p.items.map((it, idx) => ({
      id: 't-' + (idx + 1),
      descripcion: `Instalación de ${it.cant}x ${it.producto} ${it.desc ? `(${it.desc})` : ''}`,
      completada: false,
      responsable: currentUser.nombre || 'Técnico Taller',
    }));

    if (p.llevaLuces) {
      generatedTasks.push({
        id: 't-luces',
        descripcion: `Conexión eléctrica de iluminación (${p.voltaje || '24V'}) y prueba de mando`,
        completada: false,
        responsable: 'Electricista Taller',
      });
    }

    generatedTasks.push({
      id: 't-final',
      descripcion: 'Inspección final de torque, brillado espejo y entrega al conductor',
      completada: false,
      responsable: currentUser.nombre || 'Control Calidad',
    });

    setTareas(generatedTasks);
  };

  const handleSelectPedidoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedPedidoId(pId);
    if (pId) {
      populateFromPedido(pId);
    }
  };

  const handleAddTask = () => {
    setTareas([
      ...tareas,
      {
        id: 't-' + Date.now(),
        descripcion: '',
        completada: false,
        responsable: tecnicoLider,
      },
    ]);
  };

  const handleRemoveTask = (idx: number) => {
    if (tareas.length <= 1) return;
    setTareas(tareas.filter((_, i) => i !== idx));
  };

  const handleTaskChange = (idx: number, desc: string) => {
    const updated = [...tareas];
    updated[idx].descripcion = desc;
    setTareas(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente.trim() || !vehiculo.trim()) {
      alert('Por favor complete el nombre del cliente y el vehículo.');
      return;
    }

    const validTasks = tareas.filter((t) => t.descripcion.trim().length > 0);
    if (validTasks.length === 0) {
      alert('Agregue al menos una tarea a realizar en la orden de trabajo.');
      return;
    }

    const todayDate = new Date();
    const dd = String(todayDate.getDate()).padStart(2, '0');
    const mm = String(todayDate.getMonth() + 1).padStart(2, '0');
    const yy = String(todayDate.getFullYear()).slice(-2);
    const creationDateStr = `${dd}/${mm}/${yy}`;

    const otId = editingOt ? editingOt.id : `OT-2026-${String(totalOtCount + 1).padStart(4, '0')}`;

    const newOt: OrdenTrabajo = {
      id: otId,
      pedidoId: selectedPedidoId.trim() || undefined,
      cliente: cliente.trim(),
      telefono: telefono.trim(),
      vehiculo: vehiculo.trim(),
      placa: placa.trim() || undefined,
      bahia: bahia.trim() || 'Bahía 1 - Aceros Principales',
      fechaCreacion: editingOt ? editingOt.fechaCreacion : creationDateStr,
      fechaProgramada: fechaProgramada || creationDateStr,
      horaProgramada,
      tecnicoLider: tecnicoLider.trim() || currentUser.nombre || 'Administrador',
      tipoTrabajo: (tipoTrabajo as TipoTrabajoOT) || 'Fabricación Aceros',
      prioridad,
      estado,
      materiales: materiales.trim() || undefined,
      observaciones: observaciones.trim() || undefined,
      tareas: validTasks,
      controlCalidad: editingOt?.controlCalidad || {
        fijacionMecanica: false,
        pruebaElectrica: false,
        brilladoLimpieza: false,
      },
    };

    onSave(newOt);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#141414] border border-neutral-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-white my-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#e50914]" />
            <h2 className="text-sm font-black uppercase text-white tracking-wide">
              {editingOt ? `EDITAR ORDEN DE TRABAJO (${editingOt.id})` : 'NUEVA ORDEN DE TRABAJO (OT)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Link to Existing Order */}
          <div className="bg-neutral-900/70 p-3 rounded-lg border border-neutral-800 space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase text-neutral-300">
              Vincular a Pedido Existente (Opcional)
            </label>
            <select
              value={selectedPedidoId}
              onChange={handleSelectPedidoChange}
              className="w-full bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
            >
              <option value="">-- Sin vincular a pedido (Orden Directa de Taller) --</option>
              {pedidos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} · {p.cliente} ({p.vehiculo}{p.placa ? ` - ${p.placa}` : ''}) · {p.estado}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-neutral-500">
              Al seleccionar un pedido se auto-cargan cliente, vehículo, placas y tareas de fabricación.
            </p>
          </div>

          {/* Customer & Vehicle Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Cliente / Transportador*
              </label>
              <input
                type="text"
                required
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Ej. Andrés Gómez - Transportes Chocontá"
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Teléfono de Contacto*
              </label>
              <input
                type="tel"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej. 3101234567"
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded text-xs text-white font-mono focus:outline-none focus:border-[#e50914]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Vehículo (Marca / Modelo)*
              </label>
              <input
                type="text"
                required
                value={vehiculo}
                onChange={(e) => setVehiculo(e.target.value)}
                placeholder="Ej. Kenworth T800 Troquelada"
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Placa del Vehículo
              </label>
              <input
                type="text"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                placeholder="Ej. TRL-982 o N/A"
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded text-xs text-white font-mono uppercase focus:outline-none focus:border-[#e50914]"
              />
            </div>
          </div>

          {/* Bay, Technician & Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Bahía Asignada*
              </label>
              <select
                value={bahia}
                onChange={(e) => setBahia(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 px-2.5 py-1.5 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
              >
                <option value="">-- Seleccionar Bahía / Área --</option>
                {BAY_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold uppercase text-neutral-400">
                  Técnico Líder*
                </label>
                <span className="text-[9px] text-green-400 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> En sesión
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={tecnicoLider}
                  onChange={(e) => setTecnicoLider(e.target.value)}
                  placeholder="Nombre técnico"
                  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-1.5 pl-7 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                />
                <User className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-2" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Tipo de Trabajo*
              </label>
              <select
                value={tipoTrabajo}
                onChange={(e) => setTipoTrabajo(e.target.value as TipoTrabajoOT)}
                className="w-full bg-neutral-900 border border-neutral-700 px-2.5 py-1.5 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
              >
                <option value="">-- Seleccionar Tipo de Trabajo --</option>
                {TIPO_TRABAJO_OPTIONS.map((tt) => (
                  <option key={tt} value={tt}>
                    {tt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule Date & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Fecha Programada*
              </label>
              <input
                type="date"
                required
                value={fechaProgramada}
                onChange={(e) => setFechaProgramada(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Hora Estimada*
              </label>
              <input
                type="time"
                value={horaProgramada}
                onChange={(e) => setHoraProgramada(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Prioridad
                </label>
                <select
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value as 'Normal' | 'Alta' | 'Urgente')}
                  className="w-full bg-neutral-900 border border-neutral-700 px-2 py-1.5 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                >
                  <option value="Normal">Normal</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Estado OT
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoOrdenTrabajo)}
                  className="w-full bg-neutral-900 border border-neutral-700 px-2 py-1.5 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Bahía / En Proceso">En Proceso</option>
                  <option value="Control de Calidad">C. Calidad</option>
                  <option value="Finalizada">Finalizada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Checklist / Tasks List */}
          <div className="space-y-2 border-t border-neutral-800 pt-3">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold uppercase text-neutral-300 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-[#e50914]" /> Lista de Tareas / Trabajos a Realizar ({tareas.length})
              </label>
              <button
                type="button"
                onClick={handleAddTask}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded text-white flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#e50914]" /> Agregar Tarea
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {tareas.map((t, idx) => (
                <div key={t.id || idx} className="flex items-center gap-2 bg-neutral-900 p-2 rounded border border-neutral-800">
                  <span className="font-mono text-neutral-500 text-[10px] w-6 shrink-0 text-center">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    required
                    value={t.descripcion}
                    onChange={(e) => handleTaskChange(idx, e.target.value)}
                    placeholder="Descripción de la tarea o pieza a montar..."
                    className="flex-1 bg-neutral-950 border border-neutral-700 px-2.5 py-1 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                  />
                  {tareas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(idx)}
                      className="p-1 text-neutral-500 hover:text-red-400 cursor-pointer"
                      title="Eliminar tarea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Materials & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-neutral-800 pt-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Materiales e Insumos de Taller Requeridos
              </label>
              <textarea
                rows={2}
                value={materiales}
                onChange={(e) => setMateriales(e.target.value)}
                placeholder="Ej. Acero 304 cal 16, tornillos inox 1/4, pasta blanca, silicona..."
                className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Observaciones y Precauciones Técnicas
              </label>
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Instrucciones especiales para el técnico o precauciones en cabina..."
                className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded text-xs font-bold shadow-lg shadow-red-900/40 cursor-pointer"
            >
              {editingOt ? 'Guardar Cambios en OT' : 'Crear Orden de Trabajo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
