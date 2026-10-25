import React, { useState } from 'react';
import {
  Package,
  Wrench,
  ClockAlert,
  BadgeDollarSign,
  Search,
  Printer,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { Pedido, Cotizacion, ActiveModule } from '../types';

interface DashboardViewProps {
  pedidos: Pedido[];
  cotizaciones: Cotizacion[];
  onOpenOrderModal: () => void;
  onOpenInvoiceModal: (pedido: Pedido) => void;
  onOpenAbonosModal: (pedido: Pedido) => void;
  onNavigateTo: (mod: ActiveModule) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  pedidos,
  cotizaciones,
  onOpenOrderModal,
  onOpenInvoiceModal,
  onOpenAbonosModal,
  onNavigateTo,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVendedor, setFilterVendedor] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');

  // Filtered orders
  const filteredOrders = pedidos.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      p.id.toLowerCase().includes(q) ||
      p.cliente.toLowerCase().includes(q) ||
      (p.placa ? p.placa.toLowerCase().includes(q) : false) ||
      p.vehiculo.toLowerCase().includes(q);
    const matchVendedor = filterVendedor === 'todos' || p.vendedor === filterVendedor;
    const matchTipo = filterTipo === 'todos' || p.tipoCliente === filterTipo;
    return matchSearch && matchVendedor && matchTipo;
  });

  // Metrics
  const totalOrders = filteredOrders.length;
  const minoristas = filteredOrders.filter((p) => p.tipoCliente === 'minorista').length;
  const mayoristas = filteredOrders.filter((p) => p.tipoCliente === 'mayorista').length;
  const enFabricacion = filteredOrders.filter((p) => p.estado === 'En Fabricación').length;
  const listos = filteredOrders.filter((p) => p.estado === 'Listo para Instalación').length;
  const pendientes = filteredOrders.filter((p) => p.estado === 'Pendiente').length;

  return (
    <div className="space-y-6">
      {/* Hero Visual Spotlight */}
      <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-[#141414] shadow-xl">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/falpro_workshop_hero_1792850637721.jpg"
            alt="FALPRO Taller de Fabricación"
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-[#0d0d0d]/85 to-transparent"></div>
        </div>

        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl p-1.5 shrink-0 shadow-lg shadow-red-900/30 border border-neutral-700/60 hidden sm:flex items-center justify-center overflow-hidden">
              <img
                src="/assets/aistudio/0536b826-dd6a-4517-a94c-df560356e50f_21824cc7.jpg"
                alt="FALPRO Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#e50914] font-mono italic">
                <span className="w-2 h-2 rounded-full bg-[#e50914] inline-block animate-pulse"></span>
                Chocontá, Cundinamarca
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono italic">
                SISTEMA DE GESTIÓN Y PRODUCCIÓN FALPRO S.A.S.
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-mono italic">
                Control de pedidos, fabricación de lujos e instalación en tiempo real.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTo('produccion')}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold border border-neutral-700 transition flex items-center gap-2 cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-[#e50914]" /> Tablero de Fábrica
            </button>
            <button
              onClick={onOpenOrderModal}
              className="px-4 py-2.5 bg-[#e50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-bold transition shadow-lg shadow-red-900/40 flex items-center gap-2 cursor-pointer"
            >
              + Nuevo Pedido
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
            <span className="w-2 h-5 bg-[#e50914] rounded-sm"></span>
            Panel de Métricas y Control
          </h2>
          <p className="text-xs text-neutral-400">Indicadores comerciales y seguimiento de avance de pedidos</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, vehículo o código..."
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
            />
          </div>

          <select
            value={filterVendedor}
            onChange={(e) => setFilterVendedor(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
          >
            <option value="todos">Todos los Vendedores</option>
            <option value="Carlos Rojas">Carlos Rojas</option>
            <option value="Lucía Méndez">Lucía Méndez</option>
            <option value="Administrador">Administrador</option>
          </select>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
          >
            <option value="todos">Minoristas y Mayoristas</option>
            <option value="minorista">Solo Minoristas</option>
            <option value="mayorista">Solo Mayoristas</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-neutral-400 uppercase font-semibold">Total Pedidos</div>
            <div className="text-2xl font-black mt-1 font-mono text-white">{totalOrders}</div>
            <div className="text-[10px] text-green-400 font-medium mt-0.5 font-mono">
              {minoristas} Minoristas · {mayoristas} Mayoristas
            </div>
          </div>
          <div className="p-3 bg-neutral-900 rounded-xl text-[#e50914] border border-neutral-800">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-neutral-400 uppercase font-semibold">En Fabricación</div>
            <div className="text-2xl font-black mt-1 font-mono text-amber-400">{enFabricacion}</div>
            <div className="text-[10px] text-neutral-400 font-medium mt-0.5">
              {listos} Listos · {pendientes} Pendientes
            </div>
          </div>
          <div className="p-3 bg-neutral-900 rounded-xl text-amber-400 border border-neutral-800">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-[#e50914] uppercase font-bold flex items-center gap-1">
              <ClockAlert className="w-3.5 h-3.5" /> Pedidos Atrasados
            </div>
            <div className="text-2xl font-black mt-1 font-mono text-white">0</div>
            <div className="text-[10px] text-neutral-400 font-medium mt-0.5">
              Flujo de planta dentro del margen
            </div>
          </div>
          <div className="p-3 bg-red-950/40 rounded-xl text-[#e50914] border border-red-900/50">
            <ClockAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-neutral-400 uppercase font-semibold">Facturas & Cotiz.</div>
            <div className="text-2xl font-black mt-1 font-mono text-blue-400">{pedidos.length}</div>
            <div className="text-[10px] text-neutral-400 font-medium mt-0.5">
              {cotizaciones.length} Cotizaciones activas
            </div>
          </div>
          <div className="p-3 bg-neutral-900 rounded-xl text-blue-400 border border-neutral-800">
            <BadgeDollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Individual Order Progress Table */}
      <div className="bg-[#141414] border border-neutral-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#e50914]" />
              Progreso Individual por Pedido Activo
            </h3>
            <span className="text-xs text-neutral-500">
              Cálculo automatizado con base en las 6 etapas de fabricación
            </span>
          </div>

          <button
            onClick={() => onNavigateTo('pedidos')}
            className="text-xs text-[#e50914] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            Ver todos los pedidos <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 uppercase bg-neutral-900/60">
                <th className="p-3 font-semibold">No. Pedido</th>
                <th className="p-3 font-semibold">Fecha</th>
                <th className="p-3 font-semibold">Cliente / Vehículo</th>
                <th className="p-3 font-semibold">Tipo</th>
                <th className="p-3 font-semibold">Vendedor</th>
                <th className="p-3 font-semibold w-48">Avance Fabricación</th>
                <th className="p-3 font-semibold">Estado</th>
                <th className="p-3 font-semibold text-right">Saldo Pendiente</th>
                <th className="p-3 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-neutral-500">
                    No se encontraron pedidos coincidentes con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((p) => {
                  const isFinished = p.avance === 100;
                  return (
                    <tr key={p.id} className="hover:bg-neutral-900/50 transition">
                      <td className="p-3 font-mono font-bold text-[#e50914]">{p.id}</td>
                      <td className="p-3 text-neutral-300 font-mono">{p.fecha}</td>
                      <td className="p-3">
                        <div className="font-semibold text-white">{p.cliente}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {p.vehiculo}{p.placa ? <> · <span className="text-neutral-200 font-bold">{p.placa}</span></> : null}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.tipoCliente === 'mayorista'
                              ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                              : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                          }`}
                        >
                          {p.tipoCliente}
                        </span>
                      </td>
                      <td className="p-3 text-neutral-300">{p.vendedor}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-neutral-900 rounded-full h-2 overflow-hidden border border-neutral-800">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isFinished ? 'bg-green-500' : 'bg-[#e50914]'
                              }`}
                              style={{ width: `${p.avance}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-bold text-[11px] text-neutral-200 w-10 text-right">
                            {p.avance}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.estado === 'En Fabricación'
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                              : p.estado === 'Listo para Instalación'
                              ? 'bg-green-950/70 text-green-300 border border-green-800/60'
                              : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                          }`}
                        >
                          {p.estado}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        <span className={p.saldo > 0 ? 'text-[#e50914]' : 'text-green-400'}>
                          ${p.saldo.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenInvoiceModal(p)}
                            title="Ver Factura Interna / Imprimir"
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenAbonosModal(p)}
                            title="Registrar / Consultar Abonos"
                            className="px-2 py-1 bg-green-950/70 hover:bg-green-900 text-green-300 text-[10px] font-bold rounded border border-green-800 transition"
                          >
                            Abonar
                          </button>
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
  );
};
