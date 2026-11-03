import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Calendar,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  PieChart,
  BarChart3,
  Search,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Users,
} from 'lucide-react';
import { Pedido, Cotizacion, FacturaSinPedido, UserAccount } from '../types';

interface ResumenFinancieroViewProps {
  pedidos: Pedido[];
  cotizaciones?: Cotizacion[];
  facturasSinPedido?: FacturaSinPedido[];
  currentUser?: UserAccount;
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const ResumenFinancieroView: React.FC<ResumenFinancieroViewProps> = ({
  pedidos,
  cotizaciones = [],
  facturasSinPedido = [],
  currentUser,
}) => {
  // Default to 'todos' so all orders and balances are immediately visible
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>('todos');
  const [selectedMonth, setSelectedMonth] = useState<string>('todos'); // 'todos' or '0'..'11'
  const [filterTipoCliente, setFilterTipoCliente] = useState<'todos' | 'minorista' | 'mayorista'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'mensual' | 'anual' | 'pedidos'>('mensual');

  // Helper to extract year and month (0-11) from date strings (DD/MM/YY or YYYY-MM-DD or DD/MM/YYYY)
  const parseDateParts = (dateStr?: string): { year: number; month: number } | null => {
    if (!dateStr) return null;
    try {
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length >= 3) {
          const month = parseInt(parts[1], 10) - 1;
          let year = parseInt(parts[2], 10);
          if (year < 100) year += 2000;
          return { year, month };
        }
      } else if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length >= 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          return { year, month };
        }
      }
    } catch {
      return null;
    }
    return null;
  };

  // Discover all distinct years in data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    yearsSet.add(String(currentYear));

    pedidos.forEach((p) => {
      const parts = parseDateParts(p.fecha);
      if (parts) yearsSet.add(String(parts.year));
    });

    facturasSinPedido.forEach((f) => {
      const parts = parseDateParts(f.fecha);
      if (parts) yearsSet.add(String(parts.year));
    });

    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [pedidos, facturasSinPedido, currentYear]);

  // Filtered pedidos according to controls
  const filteredPedidos = useMemo(() => {
    return pedidos.filter((p) => {
      // Exclude cancelled orders from financial calculations
      if (p.estado === 'Cancelado') return false;

      const dateParts = parseDateParts(p.fecha);
      if (selectedYear !== 'todos' && dateParts && String(dateParts.year) !== selectedYear) {
        return false;
      }
      if (selectedMonth !== 'todos' && dateParts && dateParts.month !== parseInt(selectedMonth, 10)) {
        return false;
      }
      if (filterTipoCliente !== 'todos' && p.tipoCliente !== filterTipoCliente) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchClient = p.cliente.toLowerCase().includes(q);
        const matchPlate = p.placa ? p.placa.toLowerCase().includes(q) : false;
        const matchVehicle = p.vehiculo.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        if (!matchClient && !matchPlate && !matchVehicle && !matchId) return false;
      }
      return true;
    });
  }, [pedidos, selectedYear, selectedMonth, filterTipoCliente, searchQuery]);

  // Filtered direct invoices
  const filteredFacturasSinPedido = useMemo(() => {
    return facturasSinPedido.filter((f) => {
      const dateParts = parseDateParts(f.fecha);
      if (selectedYear !== 'todos' && dateParts && String(dateParts.year) !== selectedYear) {
        return false;
      }
      if (selectedMonth !== 'todos' && dateParts && dateParts.month !== parseInt(selectedMonth, 10)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchClient = f.cliente.toLowerCase().includes(q);
        const matchId = f.id.toLowerCase().includes(q);
        if (!matchClient && !matchId) return false;
      }
      return true;
    });
  }, [facturasSinPedido, selectedYear, selectedMonth, searchQuery]);

  // Overall KPIs calculation
  const totalVentasPedidos = filteredPedidos.reduce((acc, p) => acc + (p.total || 0), 0);
  const totalAbonosPedidos = filteredPedidos.reduce(
    (acc, p) => acc + (p.abonos ? p.abonos.reduce((sum, a) => sum + (a.monto || 0), 0) : 0),
    0
  );
  const totalSaldosPedidos = filteredPedidos.reduce((acc, p) => acc + (p.saldo || 0), 0);

  const totalVentasFacturasSP = filteredFacturasSinPedido.reduce((acc, f) => acc + (f.total || 0), 0);
  const totalAbonosFacturasSP = filteredFacturasSinPedido.reduce((acc, f) => acc + (f.abono || 0), 0);
  const totalSaldosFacturasSP = filteredFacturasSinPedido.reduce((acc, f) => acc + (f.saldo || 0), 0);

  const totalVentasGlobal = totalVentasPedidos + totalVentasFacturasSP;
  const totalRecaudadoGlobal = totalAbonosPedidos + totalAbonosFacturasSP;
  const totalSaldoPendienteGlobal = totalSaldosPedidos + totalSaldosFacturasSP;
  const porcentajeRecaudado =
    totalVentasGlobal > 0 ? Math.round((totalRecaudadoGlobal / totalVentasGlobal) * 100) : 0;
  const totalOperaciones = filteredPedidos.length + filteredFacturasSinPedido.length;
  const ticketPromedio = totalOperaciones > 0 ? Math.round(totalVentasGlobal / totalOperaciones) : 0;

  // Breakdown by Month (for the selected year)
  const monthlyBreakdown = useMemo(() => {
    return MESES.map((mesNombre, monthIndex) => {
      // Find orders in this month
      const monthOrders = pedidos.filter((p) => {
        if (p.estado === 'Cancelado') return false;
        const parts = parseDateParts(p.fecha);
        if (!parts) return false;
        if (selectedYear !== 'todos' && String(parts.year) !== selectedYear) return false;
        return parts.month === monthIndex;
      });

      const monthFacturasSP = facturasSinPedido.filter((f) => {
        const parts = parseDateParts(f.fecha);
        if (!parts) return false;
        if (selectedYear !== 'todos' && String(parts.year) !== selectedYear) return false;
        return parts.month === monthIndex;
      });

      const ventas =
        monthOrders.reduce((sum, p) => sum + (p.total || 0), 0) +
        monthFacturasSP.reduce((sum, f) => sum + (f.total || 0), 0);

      const recaudado =
        monthOrders.reduce(
          (sum, p) => sum + (p.abonos ? p.abonos.reduce((s, a) => s + (a.monto || 0), 0) : 0),
          0
        ) + monthFacturasSP.reduce((sum, f) => sum + (f.abono || 0), 0);

      const saldo =
        monthOrders.reduce((sum, p) => sum + (p.saldo || 0), 0) +
        monthFacturasSP.reduce((sum, f) => sum + (f.saldo || 0), 0);

      const count = monthOrders.length + monthFacturasSP.length;
      const pct = ventas > 0 ? Math.min(100, Math.round((recaudado / ventas) * 100)) : 0;

      return {
        monthIndex,
        mes: mesNombre,
        count,
        ventas,
        recaudado,
        saldo,
        pct,
      };
    });
  }, [pedidos, facturasSinPedido, selectedYear]);

  // Breakdown by Year
  const yearlyBreakdown = useMemo(() => {
    return availableYears.map((yearStr) => {
      const yearOrders = pedidos.filter((p) => {
        if (p.estado === 'Cancelado') return false;
        const parts = parseDateParts(p.fecha);
        return parts && String(parts.year) === yearStr;
      });

      const yearFacturasSP = facturasSinPedido.filter((f) => {
        const parts = parseDateParts(f.fecha);
        return parts && String(parts.year) === yearStr;
      });

      const ventas =
        yearOrders.reduce((sum, p) => sum + (p.total || 0), 0) +
        yearFacturasSP.reduce((sum, f) => sum + (f.total || 0), 0);

      const recaudado =
        yearOrders.reduce(
          (sum, p) => sum + (p.abonos ? p.abonos.reduce((s, a) => s + (a.monto || 0), 0) : 0),
          0
        ) + yearFacturasSP.reduce((sum, f) => sum + (f.abono || 0), 0);

      const saldo =
        yearOrders.reduce((sum, p) => sum + (p.saldo || 0), 0) +
        yearFacturasSP.reduce((sum, f) => sum + (f.saldo || 0), 0);

      const count = yearOrders.length + yearFacturasSP.length;
      const pct = ventas > 0 ? Math.min(100, Math.round((recaudado / ventas) * 100)) : 0;

      return {
        year: yearStr,
        count,
        ventas,
        recaudado,
        saldo,
        pct,
      };
    });
  }, [availableYears, pedidos, facturasSinPedido]);

  // Export CSV summary
  const handleExportCSV = () => {
    const headers = [
      'Periodo / Mes',
      'Operaciones',
      'Ventas Totales ($ COP)',
      'Total Recaudado ($ COP)',
      'Saldo Pendiente ($ COP)',
      '% Recaudo',
    ];

    const rows = monthlyBreakdown.map((m) => [
      `"${m.mes} ${selectedYear !== 'todos' ? selectedYear : ''}"`,
      m.count,
      m.ventas,
      m.recaudado,
      m.saldo,
      `"${m.pct}%"`,
    ]);

    // Totals row
    rows.push([
      '"TOTAL PERIODO"',
      totalOperaciones,
      totalVentasGlobal,
      totalRecaudadoGlobal,
      totalSaldoPendienteGlobal,
      `"${porcentajeRecaudado}%"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `FALPRO_Resumen_Financiero_Ventas_${selectedYear}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-800/80 p-5 rounded-2xl border border-neutral-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-emerald-950/70 border border-emerald-600/40 rounded-xl flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide font-mono">
                RESUMEN FINANCIERO Y VENTAS
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/30">
                FALPRO S.A.S.
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Consolidado de ventas totales, pagos recaudados, cartera pendiente y análisis por mes y año · Chocontá
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg text-xs font-semibold border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Descargar reporte en formato Excel CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-900/40"
            title="Imprimir informe financiero"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Resumen</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-semibold text-neutral-300">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#e50914]" />
            <span>Filtrar Período y Criterios:</span>
          </div>
          {(selectedYear !== 'todos' || selectedMonth !== 'todos' || filterTipoCliente !== 'todos' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedYear(String(currentYear));
                setSelectedMonth('todos');
                setFilterTipoCliente('todos');
                setSearchQuery('');
              }}
              className="text-[11px] text-neutral-400 hover:text-[#e50914] transition underline cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Year selector */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
              Año
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-[#e50914]"
              >
                <option value="todos">Todos los Años</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Año {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Month selector */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
              Mes
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white font-semibold focus:outline-none focus:border-[#e50914]"
            >
              <option value="todos">Todo el Año (12 Meses)</option>
              {MESES.map((m, idx) => (
                <option key={m} value={String(idx)}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Client Type selector */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
              Tipo de Cliente
            </label>
            <select
              value={filterTipoCliente}
              onChange={(e) =>
                setFilterTipoCliente(e.target.value as 'todos' | 'minorista' | 'mayorista')
              }
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white font-semibold focus:outline-none focus:border-[#e50914]"
            >
              <option value="todos">Todos (Minoristas y Mayoristas)</option>
              <option value="minorista">Minorista (PVP Directo)</option>
              <option value="mayorista">Mayorista (Empresas y Flotas)</option>
            </select>
          </div>

          {/* Search bar */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
              Buscar Cliente / Placa
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ej. Pedro, SNT-452..."
                className="w-full pl-8 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales Card */}
        <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded-xl shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold mb-2">
            <span>VENTAS TOTALES</span>
            <div className="p-1.5 bg-blue-950/60 border border-blue-800 rounded-lg text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            ${totalVentasGlobal.toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-800 text-[11px] text-neutral-400">
            <span>Operaciones: <strong>{totalOperaciones}</strong></span>
            <span>Ticket prom: <strong>${ticketPromedio.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Total Collected / Cash In Card */}
        <div className="bg-neutral-900/90 border border-emerald-900/40 p-4 rounded-xl shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold mb-2">
            <span>TOTAL RECAUDADO</span>
            <div className="p-1.5 bg-emerald-950/70 border border-emerald-800 rounded-lg text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
            ${totalRecaudadoGlobal.toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-800 text-[11px]">
            <span className="text-neutral-400">Tasa de Recaudo:</span>
            <span className="font-mono font-bold text-emerald-400">{porcentajeRecaudado}% del total</span>
          </div>
        </div>

        {/* Pending Balance / Accounts Receivable Card */}
        <div className="bg-neutral-900/90 border border-amber-900/40 p-4 rounded-xl shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold mb-2">
            <span>SALDO PENDIENTE (CARTERA)</span>
            <div className="p-1.5 bg-amber-950/70 border border-amber-800 rounded-lg text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black font-mono tracking-tight ${
              totalSaldoPendienteGlobal > 0 ? 'text-[#e50914]' : 'text-green-400'
            }`}
          >
            ${totalSaldoPendienteGlobal.toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-800 text-[11px] text-neutral-400">
            <span>Por cobrar:</span>
            <span className="font-mono font-bold text-amber-400">
              {totalVentasGlobal > 0 ? 100 - porcentajeRecaudado : 0}% por liquidar
            </span>
          </div>
        </div>

        {/* Global Progress Bar Card */}
        <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded-xl shadow-md relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold mb-2">
              <span>SALUD FINANCIERA</span>
              <div className="p-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-300">
                <PieChart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xs font-bold text-white flex items-center justify-between mb-1.5">
              <span>Efectividad de Cobro</span>
              <span className="text-emerald-400 font-mono font-bold">{porcentajeRecaudado}%</span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 via-emerald-500 to-green-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${porcentajeRecaudado}%` }}
              ></div>
            </div>
          </div>
          <div className="text-[10px] text-neutral-400 pt-2 border-t border-neutral-800 mt-2">
            FALPRO S.A.S. · Flujo de caja en tiempo real
          </div>
        </div>
      </div>

      {/* View Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('mensual')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'mensual'
              ? 'bg-[#e50914] text-white shadow-md shadow-red-900/40'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Resumen Mes a Mes ({selectedYear !== 'todos' ? selectedYear : 'Todos'})</span>
        </button>

        <button
          onClick={() => setActiveTab('anual')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'anual'
              ? 'bg-[#e50914] text-white shadow-md shadow-red-900/40'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Comparativo por Año</span>
        </button>

        <button
          onClick={() => setActiveTab('pedidos')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'pedidos'
              ? 'bg-[#e50914] text-white shadow-md shadow-red-900/40'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Detalle de Pedidos y Saldos ({filteredPedidos.length})</span>
        </button>
      </div>

      {/* 1. MONTH-BY-MONTH VIEW */}
      {activeTab === 'mensual' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#e50914]" />
                Desglose Mensual de Ventas y Recaudo {selectedYear !== 'todos' ? `(${selectedYear})` : ''}
              </h2>
              <p className="text-[11px] text-neutral-400">
                Evolución mensual comparando el valor facturado vs dinero cobrado y saldo en mora.
              </p>
            </div>
            <div className="text-xs font-mono text-neutral-400">
              Total 12 Meses: <strong className="text-white">${totalVentasGlobal.toLocaleString()}</strong>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[10px] font-bold border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Mes</th>
                  <th className="py-3 px-4 text-center">Operaciones</th>
                  <th className="py-3 px-4 text-right">Ventas Totales</th>
                  <th className="py-3 px-4 text-right">Total Recaudado</th>
                  <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                  <th className="py-3 px-4">Cumplimiento / Recaudo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 font-mono">
                {monthlyBreakdown.map((row) => (
                  <tr
                    key={row.monthIndex}
                    className={`hover:bg-neutral-800/50 transition ${
                      row.ventas > 0 ? 'bg-neutral-900/40' : 'opacity-60'
                    }`}
                  >
                    <td className="py-3 px-4 font-sans font-semibold text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-600"></span>
                      <span>{row.mes}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-neutral-300">
                      {row.count > 0 ? row.count : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      ${row.ventas.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">
                      ${row.recaudado.toLocaleString()}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        row.saldo > 0 ? 'text-[#e50914]' : 'text-neutral-500'
                      }`}
                    >
                      ${row.saldo.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {row.ventas > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-24 sm:w-36 bg-neutral-800 rounded-full h-2 overflow-hidden shrink-0">
                            <div
                              className={`h-2 rounded-full ${
                                row.pct === 100
                                  ? 'bg-green-500'
                                  : row.pct >= 50
                                  ? 'bg-emerald-400'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${row.pct}%` }}
                            ></div>
                          </div>
                          <span
                            className={`text-[10px] font-bold ${
                              row.pct === 100 ? 'text-green-400' : 'text-neutral-300'
                            }`}
                          >
                            {row.pct}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-600 text-[11px]">Sin registros</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-neutral-950 font-bold border-t-2 border-neutral-700 text-white font-mono">
                <tr>
                  <td className="py-3.5 px-4 font-sans uppercase">Total Consolidado</td>
                  <td className="py-3.5 px-4 text-center text-blue-400">{totalOperaciones}</td>
                  <td className="py-3.5 px-4 text-right text-white">
                    ${totalVentasGlobal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-400">
                    ${totalRecaudadoGlobal.toLocaleString()}
                  </td>
                  <td
                    className={`py-3.5 px-4 text-right ${
                      totalSaldoPendienteGlobal > 0 ? 'text-[#e50914]' : 'text-green-400'
                    }`}
                  >
                    ${totalSaldoPendienteGlobal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-emerald-400">
                    {porcentajeRecaudado}% Recaudado
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 2. YEAR-BY-YEAR COMPARISON */}
      {activeTab === 'anual' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-neutral-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#e50914]" />
              Resumen Histórico Comparativo por Año
            </h2>
            <p className="text-[11px] text-neutral-400">
              Balance acumulado año tras año de facturación y cobro.
            </p>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[10px] font-bold border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Año</th>
                  <th className="py-3 px-4 text-center">Total Pedidos / Facturas</th>
                  <th className="py-3 px-4 text-right">Ventas Totales ($)</th>
                  <th className="py-3 px-4 text-right">Recaudado Efectivo ($)</th>
                  <th className="py-3 px-4 text-right">Saldo por Cobrar ($)</th>
                  <th className="py-3 px-4">Efectividad General</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 font-mono">
                {yearlyBreakdown.map((row) => (
                  <tr key={row.year} className="hover:bg-neutral-800/50 transition">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2 font-mono text-sm">
                      <span className="w-2 h-2 rounded-full bg-[#e50914]"></span>
                      <span>Año {row.year}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-neutral-300">
                      {row.count}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-white">
                      ${row.ventas.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-400">
                      ${row.recaudado.toLocaleString()}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-black ${
                        row.saldo > 0 ? 'text-[#e50914]' : 'text-green-400'
                      }`}
                    >
                      ${row.saldo.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-2.5 rounded-full bg-emerald-500"
                            style={{ width: `${row.pct}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-emerald-400">{row.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. DETAILED ORDERS & BALANCES TABLE */}
      {activeTab === 'pedidos' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#e50914]" />
                Detalle Individual de Pedidos y Saldos ({filteredPedidos.length})
              </h2>
              <p className="text-[11px] text-neutral-400">
                Auditoría uno a uno de cuentas por cobrar y abonos realizados.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[10px] font-bold border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente / Vehículo</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4 text-right">Total ($)</th>
                  <th className="py-3 px-4 text-right">Abonos ($)</th>
                  <th className="py-3 px-4 text-right">Saldo ($)</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredPedidos.length > 0 ? (
                  filteredPedidos.map((p) => {
                    const totalAbonado = p.abonos ? p.abonos.reduce((s, a) => s + (a.monto || 0), 0) : 0;
                    return (
                      <tr key={p.id} className="hover:bg-neutral-800/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-white">{p.id}</td>
                        <td className="py-3 px-4 text-neutral-400">{p.fecha}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{p.cliente}</div>
                          <div className="text-[10px] text-neutral-400">
                            {p.vehiculo} {p.placa ? `(${p.placa})` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.tipoCliente === 'mayorista'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : 'bg-neutral-800 text-neutral-300'
                            }`}
                          >
                            {p.tipoCliente === 'mayorista' ? 'Mayorista' : 'Minorista'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          ${p.total.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          ${totalAbonado.toLocaleString()}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-bold ${
                            p.saldo > 0 ? 'text-[#e50914]' : 'text-green-400'
                          }`}
                        >
                          ${p.saldo.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.estado === 'Entregado'
                                ? 'bg-green-950 text-green-300 border border-green-800'
                                : p.estado === 'Listo para Instalación'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {p.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-neutral-500 text-xs">
                      No hay pedidos registrados con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
