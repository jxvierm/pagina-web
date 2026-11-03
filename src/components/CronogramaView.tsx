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
  Plus,
  Printer,
  Trash2,
  Edit2,
  ClipboardList,
  AlertTriangle,
  User,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  Pedido,
  OrdenTrabajo,
  EstadoOrdenTrabajo,
  UserAccount,
  RolePermissions,
} from '../types';
import { OrdenTrabajoFormModal } from './OrdenTrabajoFormModal';
import { OrdenTrabajoPrintModal } from './OrdenTrabajoPrintModal';

interface CronogramaViewProps {
  pedidos: Pedido[];
  onToggleConfirmacion: (pedidoId: string) => void;
  onUpdateFechaInstalacion: (pedidoId: string, nuevaFecha: string, bahia: string) => void;
  currentUser?: UserAccount;
  permissions?: RolePermissions;
  ordenesTrabajo?: OrdenTrabajo[];
  onAddOrdenTrabajo?: (ot: OrdenTrabajo) => void;
  onUpdateOrdenTrabajo?: (ot: OrdenTrabajo) => void;
  onDeleteOrdenTrabajo?: (otId: string) => void;
}

export const CronogramaView: React.FC<CronogramaViewProps> = ({
  pedidos,
  onToggleConfirmacion,
  onUpdateFechaInstalacion,
  currentUser = {
    id: 'usr-admin',
    user: 'admin',
    nombre: 'Administrador Principal',
    role: 'Administrador',
    estado: 'Activo',
    updated: '',
  },
  permissions = {
    consultar: true,
    crear: true,
    editar: true,
    eliminar: true,
    facturar: true,
    descargar: true,
    imprimir: true,
  },
  ordenesTrabajo = [],
  onAddOrdenTrabajo,
  onUpdateOrdenTrabajo,
  onDeleteOrdenTrabajo,
}) => {
  const [subTab, setSubTab] = useState<'agenda' | 'ordenesTrabajo'>('agenda');

  // Agenda Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBahiaAgenda, setFilterBahiaAgenda] = useState('todas');
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [editFecha, setEditFecha] = useState('');
  const [editBahia, setEditBahia] = useState('Bahía 1 (Pista Principal)');

  // Work Orders Search & Filter
  const [searchOt, setSearchOt] = useState('');
  const [filterEstadoOt, setFilterEstadoOt] = useState<string>('todos');
  const [filterBahiaOt, setFilterBahiaOt] = useState<string>('todas');

  // Work Order Modals
  const [showOtFormModal, setShowOtFormModal] = useState(false);
  const [editingOt, setEditingOt] = useState<OrdenTrabajo | null>(null);
  const [initialPedidoForOt, setInitialPedidoForOt] = useState<string>('');
  const [printingOt, setPrintingOt] = useState<OrdenTrabajo | null>(null);

  // Agenda filtering
  const filteredPedidos = pedidos.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      p.id.toLowerCase().includes(q) ||
      p.cliente.toLowerCase().includes(q) ||
      (p.placa ? p.placa.toLowerCase().includes(q) : false) ||
      p.vehiculo.toLowerCase().includes(q);

    const matchBahia =
      filterBahiaAgenda === 'todas' ||
      (p.instalacion?.bahia && p.instalacion.bahia.includes(filterBahiaAgenda));

    return matchSearch && matchBahia;
  });

  // Work orders filtering
  const filteredOts = ordenesTrabajo.filter((ot) => {
    const q = searchOt.toLowerCase();
    const matchSearch =
      ot.id.toLowerCase().includes(q) ||
      (ot.pedidoId ? ot.pedidoId.toLowerCase().includes(q) : false) ||
      ot.cliente.toLowerCase().includes(q) ||
      ot.vehiculo.toLowerCase().includes(q) ||
      (ot.placa ? ot.placa.toLowerCase().includes(q) : false) ||
      ot.tecnicoLider.toLowerCase().includes(q);

    const matchEstado = filterEstadoOt === 'todos' || ot.estado === filterEstadoOt;
    const matchBahia = filterBahiaOt === 'todas' || ot.bahia.includes(filterBahiaOt);

    return matchSearch && matchEstado && matchBahia;
  });

  // Work order metrics
  const totalOts = ordenesTrabajo.length;
  const otsEnProceso = ordenesTrabajo.filter((o) => o.estado === 'En Bahía / En Proceso').length;
  const otsCalidad = ordenesTrabajo.filter((o) => o.estado === 'Control de Calidad').length;
  const otsFinalizadas = ordenesTrabajo.filter((o) => o.estado === 'Finalizada').length;

  const handleOpenEditAgenda = (p: Pedido) => {
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

  const handleCreateOtFromPedido = (pedidoId: string) => {
    const existing = ordenesTrabajo.find((ot) => ot.pedidoId === pedidoId);
    if (existing) {
      // If already exists, open it in print modal or edit
      setPrintingOt(existing);
    } else {
      setInitialPedidoForOt(pedidoId);
      setEditingOt(null);
      setShowOtFormModal(true);
    }
  };

  const handleToggleTaskCompleted = (ot: OrdenTrabajo, taskId: string) => {
    if (!onUpdateOrdenTrabajo) return;
    const updatedTasks = ot.tareas.map((t) =>
      t.id === taskId ? { ...t, completada: !t.completada } : t
    );

    // If all tasks are completed, optionally suggest or set state
    const allDone = updatedTasks.every((t) => t.completada);
    const updatedOt: OrdenTrabajo = {
      ...ot,
      tareas: updatedTasks,
      estado: allDone && ot.estado === 'En Bahía / En Proceso' ? 'Control de Calidad' : ot.estado,
    };
    onUpdateOrdenTrabajo(updatedOt);
  };

  const handleQuickStatusChange = (ot: OrdenTrabajo, nuevoEstado: EstadoOrdenTrabajo) => {
    if (!onUpdateOrdenTrabajo) return;
    onUpdateOrdenTrabajo({
      ...ot,
      estado: nuevoEstado,
    });
  };

  const handleDeleteOt = (otId: string) => {
    if (!onDeleteOrdenTrabajo) return;
    if (window.confirm(`¿Está seguro de eliminar la Orden de Trabajo ${otId}?`)) {
      onDeleteOrdenTrabajo(otId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2 font-mono italic">
            <span className="w-2.5 h-6 bg-[#e50914] rounded-sm"></span>
            CRONOGRAMA DE INSTALACIONES Y ÓRDENES DE TRABAJO
          </h1>
          <p className="text-xs text-neutral-400">
            Coordinación operativa de bahías de ensamble, montajes en acero, turnos de instalación y órdenes técnicas de taller
          </p>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'ordenesTrabajo' && permissions.crear && (
            <button
              onClick={() => {
                setEditingOt(null);
                setInitialPedidoForOt('');
                setShowOtFormModal(true);
              }}
              className="px-4 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-900/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nueva Orden de Trabajo
            </button>
          )}

          <div className="text-xs text-neutral-400 bg-[#141414] border border-neutral-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#e50914]" />
            <span className="font-mono">Taller Chocontá</span>
          </div>
        </div>
      </div>

      {/* Main Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-[#141414] border border-neutral-800 rounded-xl shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('agenda')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              subTab === 'agenda'
                ? 'bg-[#e50914] text-white shadow-md shadow-red-900/30'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Agenda de Bahías e Instalaciones ({pedidos.length})
          </button>

          <button
            onClick={() => setSubTab('ordenesTrabajo')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              subTab === 'ordenesTrabajo'
                ? 'bg-[#e50914] text-white shadow-md shadow-red-900/30'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-amber-400" />
            Órdenes de Trabajo (OT) ({ordenesTrabajo.length})
            {otsEnProceso > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black animate-pulse">
                {otsEnProceso} en proceso
              </span>
            )}
          </button>
        </div>

        <div className="text-[11px] text-neutral-400 pr-2 hidden sm:block">
          {subTab === 'agenda'
            ? 'Gestión de citas y confirmación con transportadores'
            : 'Fichas técnicas de taller, listas de chequeo y control de calidad'}
        </div>
      </div>

      {/* SUB-TAB 1: AGENDA DE INSTALACIONES */}
      {subTab === 'agenda' && (
        <div className="space-y-4">
          {/* Search & Bay Filter */}
          <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl flex flex-wrap gap-3 items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cita por cliente, vehículo, pedido o placa..."
                className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914] w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterBahiaAgenda}
                onChange={(e) => setFilterBahiaAgenda(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
              >
                <option value="todas">Todas las Bahías</option>
                <option value="Bahía 1">Bahía 1 (Pista Principal)</option>
                <option value="Bahía 2">Bahía 2 (Ajustes y Cabinas)</option>
                <option value="Bahía 3">Bahía 3 (Eléctrica / Luces)</option>
                <option value="Despacho">Despacho Nacional</option>
              </select>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="bg-[#141414] border border-neutral-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#e50914]" /> Turnos y Bahías Coordinadas ({filteredPedidos.length})
              </h2>
              <span className="text-xs text-neutral-500">Horarios confirmados con taller</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-900 text-neutral-300 uppercase font-semibold">
                  <tr className="border-b border-neutral-800">
                    <th className="p-3">Fecha y Hora Cita</th>
                    <th className="p-3">Bahía Asignada</th>
                    <th className="p-3">No. Pedido</th>
                    <th className="p-3">Cliente / Transportador</th>
                    <th className="p-3">Vehículo</th>
                    <th className="p-3">Trabajo a Instalar</th>
                    <th className="p-3">Confirmación</th>
                    <th className="p-3 text-center">Acciones y Orden de Trabajo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {filteredPedidos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-neutral-500">
                        No hay citas programadas con los criterios de búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredPedidos.map((p) => {
                      const isConfirmed = p.instalacion.confirmada;
                      const formattedDate = p.instalacion.fecha.replace('T', ' ');
                      const linkedOt = ordenesTrabajo.find((ot) => ot.pedidoId === p.id);

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
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => onToggleConfirmacion(p.id)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded transition cursor-pointer ${
                                  isConfirmed
                                    ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                                    : 'bg-green-900/70 hover:bg-green-800 text-green-300 border border-green-700'
                                }`}
                              >
                                {isConfirmed ? 'Desmarcar' : 'Confirmar'}
                              </button>

                              <button
                                onClick={() => handleOpenEditAgenda(p)}
                                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] font-semibold transition cursor-pointer"
                              >
                                Reagendar
                              </button>

                              {/* Work Order Action Button */}
                              {linkedOt ? (
                                <button
                                  onClick={() => setPrintingOt(linkedOt)}
                                  className="px-2.5 py-1 bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Ver e Imprimir Ficha de Orden de Trabajo"
                                >
                                  <ClipboardList className="w-3 h-3 text-amber-400" />
                                  <span>Ver OT ({linkedOt.id})</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleCreateOtFromPedido(p.id)}
                                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer hover:border-[#e50914]"
                                  title="Generar Hoja de Orden de Trabajo para Taller"
                                >
                                  <Plus className="w-3 h-3 text-[#e50914]" />
                                  <span>Crear OT</span>
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
        </div>
      )}

      {/* SUB-TAB 2: ÓRDENES DE TRABAJO (OT) */}
      {subTab === 'ordenesTrabajo' && (
        <div className="space-y-5">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs text-neutral-400 uppercase font-semibold">Total Órdenes OT</div>
                <div className="text-2xl font-black mt-1 font-mono text-white">{totalOts}</div>
                <div className="text-[10px] text-neutral-400 font-medium mt-0.5">
                  Fichas activas de taller
                </div>
              </div>
              <div className="p-3 bg-neutral-900 rounded-xl text-[#e50914] border border-neutral-800">
                <ClipboardList className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs text-neutral-400 uppercase font-semibold">En Bahía / En Proceso</div>
                <div className="text-2xl font-black mt-1 font-mono text-amber-400">{otsEnProceso}</div>
                <div className="text-[10px] text-amber-400/80 font-medium mt-0.5">
                  Operarios montando accesorios
                </div>
              </div>
              <div className="p-3 bg-neutral-900 rounded-xl text-amber-400 border border-neutral-800">
                <Wrench className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs text-neutral-400 uppercase font-semibold">Control de Calidad</div>
                <div className="text-2xl font-black mt-1 font-mono text-purple-400">{otsCalidad}</div>
                <div className="text-[10px] text-purple-300 font-medium mt-0.5">
                  Prueba eléctrica y pulido
                </div>
              </div>
              <div className="p-3 bg-neutral-900 rounded-xl text-purple-400 border border-neutral-800">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs text-neutral-400 uppercase font-semibold">Finalizadas y Entregadas</div>
                <div className="text-2xl font-black mt-1 font-mono text-green-400">{otsFinalizadas}</div>
                <div className="text-[10px] text-green-400 font-medium mt-0.5">
                  Firmadas a conformidad
                </div>
              </div>
              <div className="p-3 bg-neutral-900 rounded-xl text-green-400 border border-neutral-800">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl flex flex-wrap gap-3 items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={searchOt}
                onChange={(e) => setSearchOt(e.target.value)}
                placeholder="Buscar por código OT, pedido, cliente, vehículo o técnico..."
                className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914] w-full"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterEstadoOt}
                onChange={(e) => setFilterEstadoOt(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
              >
                <option value="todos">Todos los Estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En Bahía / En Proceso">En Bahía / En Proceso</option>
                <option value="Control de Calidad">Control de Calidad</option>
                <option value="Finalizada">Finalizada</option>
                <option value="Cancelada">Cancelada</option>
              </select>

              <select
                value={filterBahiaOt}
                onChange={(e) => setFilterBahiaOt(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
              >
                <option value="todas">Todas las Bahías</option>
                <option value="Bahía 1">Bahía 1 (Pista Principal)</option>
                <option value="Bahía 2">Bahía 2 (Ajustes y Cabinas)</option>
                <option value="Bahía 3">Bahía 3 (Eléctrica / Luces)</option>
                <option value="Bahía 4">Bahía 4 (Defensas)</option>
                <option value="Despacho">Despacho Nacional</option>
              </select>

              {permissions.crear && (
                <button
                  onClick={() => {
                    setEditingOt(null);
                    setInitialPedidoForOt('');
                    setShowOtFormModal(true);
                  }}
                  className="px-3 py-1.5 bg-[#e50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-900/30"
                >
                  <Plus className="w-3.5 h-3.5" /> Nueva OT
                </button>
              )}
            </div>
          </div>

          {/* Cards List of Work Orders */}
          {filteredOts.length === 0 ? (
            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-12 text-center space-y-4 shadow-lg">
              <div className="w-16 h-16 bg-neutral-900 rounded-2xl border border-neutral-800 flex items-center justify-center mx-auto text-neutral-600">
                <ClipboardList className="w-8 h-8 text-[#e50914]" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">No hay Órdenes de Trabajo registradas</h3>
                <p className="text-xs text-neutral-400">
                  Crea una nueva orden de trabajo de taller o genera una automáticamente a partir de un pedido programado en la agenda.
                </p>
              </div>
              {permissions.crear && (
                <button
                  onClick={() => {
                    setEditingOt(null);
                    setInitialPedidoForOt('');
                    setShowOtFormModal(true);
                  }}
                  className="px-4 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-red-900/40"
                >
                  <Plus className="w-4 h-4" /> Crear Primera Orden de Trabajo
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOts.map((ot) => {
                const totalTasks = ot.tareas.length;
                const completedTasks = ot.tareas.filter((t) => t.completada).length;
                const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                const statusColor =
                  ot.estado === 'Finalizada'
                    ? 'bg-green-950 text-green-300 border-green-800'
                    : ot.estado === 'Control de Calidad'
                    ? 'bg-purple-950 text-purple-300 border-purple-800'
                    : ot.estado === 'En Bahía / En Proceso'
                    ? 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700';

                const priorityColor =
                  ot.prioridad === 'Urgente'
                    ? 'bg-red-950 text-red-300 border-red-700 font-bold'
                    : ot.prioridad === 'Alta'
                    ? 'bg-amber-950 text-amber-300 border-amber-700'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700';

                return (
                  <div
                    key={ot.id}
                    className="bg-[#141414] border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-neutral-700 transition space-y-4"
                  >
                    <div>
                      {/* Top Row: Code, Status & Priority */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800/80">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-[#e50914] bg-black/80 px-2.5 py-0.5 rounded border border-neutral-800">
                            {ot.id}
                          </span>
                          {ot.pedidoId && (
                            <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                              Pedido: <strong className="text-neutral-200">{ot.pedidoId}</strong>
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[10px] border ${priorityColor}`}>
                            {ot.prioridad}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {permissions.editar ? (
                            <select
                              value={ot.estado}
                              onChange={(e) =>
                                handleQuickStatusChange(ot, e.target.value as EstadoOrdenTrabajo)
                              }
                              className={`text-[10px] font-bold px-2 py-1 rounded border focus:outline-none focus:border-[#e50914] ${statusColor}`}
                            >
                              <option value="Pendiente">Pendiente</option>
                              <option value="En Bahía / En Proceso">En Bahía / En Proceso</option>
                              <option value="Control de Calidad">Control de Calidad</option>
                              <option value="Finalizada">Finalizada</option>
                              <option value="Cancelada">Cancelada</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                              {ot.estado}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Customer & Vehicle Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                            Cliente / Transportador
                          </span>
                          <span className="font-bold text-white block text-sm">
                            {ot.cliente}
                          </span>
                          <span className="text-neutral-400 flex items-center gap-1 text-[11px] mt-0.5">
                            <Phone className="w-3 h-3" /> {ot.telefono}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                            Vehículo & Bahía
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-neutral-200 text-sm">{ot.vehiculo}</span>
                            {ot.placa && (
                              <span className="bg-neutral-900 border border-neutral-700 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold text-[#e50914]">
                                {ot.placa}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-amber-400 font-semibold block mt-0.5">
                            {ot.bahia}
                          </span>
                        </div>
                      </div>

                      {/* Timing & Leader Tech */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 p-2 bg-neutral-900/60 rounded-lg border border-neutral-800 text-[11px]">
                        <div className="flex items-center gap-1 text-neutral-300">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Prog: <strong>{ot.fechaProgramada}</strong> {ot.horaProgramada ? `(${ot.horaProgramada})` : ''}</span>
                        </div>
                        <div className="flex items-center gap-1 text-neutral-300">
                          <User className="w-3.5 h-3.5 text-[#e50914]" />
                          <span>Líder: <strong className="text-white">{ot.tecnicoLider}</strong></span>
                        </div>
                      </div>

                      {/* Progress Bar & Checklist */}
                      <div className="mt-3.5 space-y-2">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-neutral-400 font-bold uppercase text-[10px] flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-[#e50914]" /> Trabajos ({completedTasks}/{totalTasks})
                          </span>
                          <span className="font-mono font-bold text-neutral-300">
                            {progressPct}% completado
                          </span>
                        </div>
                        <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              progressPct === 100
                                ? 'bg-green-500'
                                : progressPct > 50
                                ? 'bg-[#e50914]'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          ></div>
                        </div>

                        {/* Interactive Task Checkboxes */}
                        <div className="space-y-1.5 mt-2 bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800/80 max-h-36 overflow-y-auto">
                          {ot.tareas.map((t) => (
                            <label
                              key={t.id}
                              className="flex items-start gap-2 p-1 rounded hover:bg-neutral-900 cursor-pointer transition text-xs select-none"
                            >
                              <input
                                type="checkbox"
                                checked={t.completada}
                                onChange={() => handleToggleTaskCompleted(ot, t.id)}
                                className="mt-0.5 rounded text-[#e50914] focus:ring-0 cursor-pointer"
                              />
                              <span
                                className={`text-[11px] leading-snug ${
                                  t.completada
                                    ? 'line-through text-neutral-500'
                                    : 'text-neutral-200 font-medium'
                                }`}
                              >
                                {t.descripcion}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Material Specs Snippet */}
                      {ot.materiales && (
                        <div className="mt-2 text-[10px] text-neutral-400 truncate">
                          <span className="font-bold text-neutral-500 uppercase">Materiales:</span> {ot.materiales}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs">
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Creada: {ot.fechaCreacion}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPrintingOt(ot)}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Imprimir Hoja de Taller para Mecánico/Instalador"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Ficha OT</span>
                        </button>

                        {permissions.editar && (
                          <button
                            onClick={() => {
                              setEditingOt(ot);
                              setInitialPedidoForOt(ot.pedidoId || '');
                              setShowOtFormModal(true);
                            }}
                            className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded transition cursor-pointer"
                            title="Editar Orden de Trabajo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {permissions.eliminar && onDeleteOrdenTrabajo && (
                          <button
                            onClick={() => handleDeleteOt(ot.id)}
                            className="p-1 hover:bg-red-950/60 text-neutral-500 hover:text-red-400 rounded transition cursor-pointer"
                            title="Eliminar Orden de Trabajo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Reagendar Agenda */}
      {editingPedido && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#e50914]" /> COORDINAR CITA: {editingPedido.id}
              </h3>
              <button onClick={() => setEditingPedido(null)} className="text-neutral-400 hover:text-white cursor-pointer">
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
                  <option value="Bahía 4 (Montaje de Defensas y Guardabarros)">Bahía 4 (Montaje de Defensas y Guardabarros)</option>
                  <option value="Despacho por Encomienda Nacional">Despacho por Encomienda Nacional</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingPedido(null)}
                  className="px-4 py-2 bg-neutral-800 rounded text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded text-xs font-bold shadow-lg shadow-red-900/40 cursor-pointer"
                >
                  Guardar Horario en Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear / Editar Orden de Trabajo */}
      {showOtFormModal && (
        <OrdenTrabajoFormModal
          isOpen={showOtFormModal}
          onClose={() => {
            setShowOtFormModal(false);
            setEditingOt(null);
            setInitialPedidoForOt('');
          }}
          onSave={(savedOt) => {
            if (editingOt && onUpdateOrdenTrabajo) {
              onUpdateOrdenTrabajo(savedOt);
            } else if (onAddOrdenTrabajo) {
              onAddOrdenTrabajo(savedOt);
            }
            setShowOtFormModal(false);
            setEditingOt(null);
            setInitialPedidoForOt('');
          }}
          editingOt={editingOt}
          pedidos={pedidos}
          currentUser={currentUser}
          totalOtCount={ordenesTrabajo.length}
          initialPedidoId={initialPedidoForOt}
        />
      )}

      {/* Modal: Imprimir Hoja de Orden de Trabajo para Taller */}
      {printingOt && (
        <OrdenTrabajoPrintModal
          isOpen={!!printingOt}
          onClose={() => setPrintingOt(null)}
          orden={printingOt}
        />
      )}
    </div>
  );
};
