import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  Zap,
  Wrench,
  CheckCircle2,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Layers,
  Sparkles,
  X,
  Save,
  Boxes,
} from 'lucide-react';
import { InsumoInventario, CategoriaInsumo, UserAccount, RolePermissions } from '../types';

interface InventarioViewProps {
  inventario: InsumoInventario[];
  onAddInsumo: (insumo: InsumoInventario) => void;
  onUpdateInsumo: (insumo: InsumoInventario) => void;
  onDeleteInsumo: (insumoId: string) => void;
  onAdjustStock: (insumoId: string, newStock: number, motivo: string) => void;
  currentUser: UserAccount;
  permissions: RolePermissions;
}

export const InventarioView: React.FC<InventarioViewProps> = ({
  inventario,
  onAddInsumo,
  onUpdateInsumo,
  onDeleteInsumo,
  onAdjustStock,
  currentUser,
  permissions,
}) => {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<'todas' | CategoriaInsumo>('todas');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<InsumoInventario | null>(null);
  const [stockAdjustInsumo, setStockAdjustInsumo] = useState<InsumoInventario | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number | ''>('');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [adjustReason, setAdjustReason] = useState('');

  // Add form fields - starts completely blank
  const [addNombre, setAddNombre] = useState('');
  const [addCat, setAddCat] = useState<CategoriaInsumo>('Luces LED');
  const [addStockActual, setAddStockActual] = useState<number | ''>('');
  const [addStockMinimo, setAddStockMinimo] = useState<number | ''>('');
  const [addUnidad, setAddUnidad] = useState('');
  const [addUbicacion, setAddUbicacion] = useState('');
  const [addCosto, setAddCosto] = useState<number | ''>('');
  const [addNotas, setAddNotas] = useState('');

  // Edit form fields
  const [editNombre, setEditNombre] = useState('');
  const [editCat, setEditCat] = useState<CategoriaInsumo>('Luces LED');
  const [editStockActual, setEditStockActual] = useState<number | ''>('');
  const [editStockMinimo, setEditStockMinimo] = useState<number | ''>('');
  const [editUnidad, setEditUnidad] = useState('Und');
  const [editUbicacion, setEditUbicacion] = useState('');
  const [editCosto, setEditCosto] = useState<number | ''>('');
  const [editNotas, setEditNotas] = useState('');

  // Low stock counter
  const lowStockItems = inventario.filter((i) => i.stockActual <= i.stockMinimo);
  const totalLights = inventario.filter((i) => i.categoria === 'Luces LED').length;
  const totalSupplies = inventario.filter((i) => i.categoria !== 'Luces LED').length;

  // Filtered list
  const filtered = inventario.filter((item) => {
    const matchCat = filterCat === 'todas' || item.categoria === filterCat;
    const matchLow = onlyLowStock ? item.stockActual <= item.stockMinimo : true;
    const q = search.toLowerCase();
    const matchSearch =
      item.nombre.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      (item.ubicacion ? item.ubicacion.toLowerCase().includes(q) : false);

    return matchCat && matchLow && matchSearch;
  });

  const handleOpenEdit = (item: InsumoInventario) => {
    setEditingInsumo(item);
    setEditNombre(item.nombre);
    setEditCat(item.categoria);
    setEditStockActual(item.stockActual);
    setEditStockMinimo(item.stockMinimo);
    setEditUnidad(item.unidadMedida);
    setEditUbicacion(item.ubicacion || '');
    setEditCosto(item.costoUnitario || 0);
    setEditNotas(item.notas || '');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addNombre.trim()) return;

    const prefix = addCat === 'Luces LED' ? 'INV-LU-' : 'INV-TAL-';
    const nextNum = inventario.length + 1;
    const id = `${prefix}${String(nextNum).padStart(3, '0')}`;

    const newInsumo: InsumoInventario = {
      id,
      nombre: addNombre.trim(),
      categoria: addCat,
      stockActual: Math.max(0, Number(addStockActual) || 0),
      stockMinimo: Math.max(1, Number(addStockMinimo) || 1),
      unidadMedida: addUnidad.trim() || 'Und',
      ubicacion: addUbicacion.trim() || undefined,
      costoUnitario: Math.max(0, Number(addCosto) || 0),
      ultimaReposicion: new Date().toLocaleDateString(),
      notas: addNotas.trim() || undefined,
    };

    onAddInsumo(newInsumo);
    setShowAddModal(false);
    setAddNombre('');
    setAddStockActual('');
    setAddStockMinimo('');
    setAddUnidad('');
    setAddUbicacion('');
    setAddCosto('');
    setAddNotas('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInsumo || !editNombre.trim()) return;

    const updated: InsumoInventario = {
      ...editingInsumo,
      nombre: editNombre.trim(),
      categoria: editCat,
      stockActual: Math.max(0, Number(editStockActual) || 0),
      stockMinimo: Math.max(1, Number(editStockMinimo) || 1),
      unidadMedida: editUnidad.trim() || 'Und',
      ubicacion: editUbicacion.trim() || undefined,
      costoUnitario: Math.max(0, Number(editCosto) || 0),
      notas: editNotas.trim() || undefined,
    };

    onUpdateInsumo(updated);
    setEditingInsumo(null);
  };

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustInsumo) return;

    const amountNum = adjustAmount === '' ? 1 : Math.max(1, Number(adjustAmount) || 1);
    const delta = adjustType === 'add' ? amountNum : -amountNum;
    const newStock = Math.max(0, stockAdjustInsumo.stockActual + delta);
    const reasonText = adjustReason.trim()
      ? adjustReason.trim()
      : adjustType === 'add'
      ? 'Entrada de mercancía / Reposición'
      : 'Consumo en fabricación / ensamble';

    onAdjustStock(stockAdjustInsumo.id, newStock, reasonText);
    setStockAdjustInsumo(null);
    setAdjustAmount('');
    setAdjustReason('');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl shadow space-y-1">
          <div className="flex justify-between items-center text-xs text-neutral-400">
            <span>Total Referencias</span>
            <Boxes className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {inventario.length}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">Luces + Insumos de Planta</div>
        </div>

        <div
          onClick={() => setOnlyLowStock(!onlyLowStock)}
          className={`p-4 rounded-xl border transition cursor-pointer shadow space-y-1 ${
            lowStockItems.length > 0
              ? 'bg-amber-950/40 border-amber-600/80 hover:bg-amber-950/60'
              : 'bg-[#141414] border-neutral-800'
          }`}
        >
          <div className="flex justify-between items-center text-xs text-amber-300 font-semibold">
            <span>Stock Bajo / Crítico</span>
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            {lowStockItems.length}
          </div>
          <div className="text-[10px] text-amber-300/80 font-mono">
            {onlyLowStock ? 'Filtrando pocas unidades' : 'Clic para filtrar alertas'}
          </div>
        </div>

        <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl shadow space-y-1">
          <div className="flex justify-between items-center text-xs text-neutral-400">
            <span>Módulos y Luces LED</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">{totalLights}</div>
          <div className="text-[10px] text-neutral-500 font-mono">24V / 12V e impermeables</div>
        </div>

        <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl shadow space-y-1">
          <div className="flex justify-between items-center text-xs text-neutral-400">
            <span>Insumos y Abrasivos</span>
            <Wrench className="w-4 h-4 text-[#e50914]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">{totalSupplies}</div>
          <div className="text-[10px] text-neutral-500 font-mono">Discos, pastas, soldadura</div>
        </div>
      </div>

      {/* Low Stock Alert Alert Banner if items exist */}
      {lowStockItems.length > 0 && !onlyLowStock && (
        <div className="p-3 bg-amber-950/40 border border-amber-600/70 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              <strong>¡Alerta de Inventario!</strong> Hay <strong>{lowStockItems.length}</strong> insumos o módulos de luces por debajo o en su stock mínimo ({lowStockItems.map((i) => i.nombre.split(' ')[0]).slice(0, 3).join(', ')}...).
            </span>
          </div>
          <button
            onClick={() => setOnlyLowStock(true)}
            className="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-white font-bold rounded text-[11px] border border-amber-600/60 transition cursor-pointer shrink-0"
          >
            Ver Alertas
          </button>
        </div>
      )}

      {/* Control Bar: Search, Category Tabs, Add Button */}
      <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex flex-1 items-center gap-2 min-w-[240px]">
          <Search className="w-4 h-4 text-neutral-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por insumo, módulo LED, código o estante..."
            className="w-full bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value as 'todas' | CategoriaInsumo)}
            className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
          >
            <option value="todas">Todas las Categorías</option>
            <option value="Luces LED">Luces LED</option>
            <option value="Insumos Taller">Insumos Taller</option>
            <option value="Abrasivos y Pulido">Abrasivos y Pulido</option>
            <option value="Soldadura y Gases">Soldadura y Gases</option>
            <option value="Tornillería y Fijación">Tornillería y Fijación</option>
          </select>

          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              onlyLowStock
                ? 'bg-amber-500 text-black shadow'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pocas Unidades ({lowStockItems.length})</span>
          </button>

          {permissions.crear && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-[#e50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-red-900/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Registrar Insumo
            </button>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-[#141414] border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-neutral-900 text-neutral-300 uppercase font-semibold">
              <tr className="border-b border-neutral-800">
                <th className="p-3">Código</th>
                <th className="p-3">Insumo / Descripción</th>
                <th className="p-3">Categoría</th>
                <th className="p-3 text-center">Stock Actual</th>
                <th className="p-3 text-center">Mínimo</th>
                <th className="p-3 text-center">Nivel / Alerta</th>
                <th className="p-3">Ubicación</th>
                <th className="p-3 text-right">Costo Est.</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-500">
                    No se encontraron insumos ni luces con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isLow = item.stockActual <= item.stockMinimo;
                  const ratio = Math.min(100, (item.stockActual / (item.stockMinimo * 2.5)) * 100);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-neutral-900/50 transition ${
                        isLow ? 'bg-amber-950/15' : ''
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-neutral-400 whitespace-nowrap">
                        {item.id}
                      </td>
                      <td className="p-3 font-bold text-white max-w-[280px]">
                        <div className="flex items-center gap-2">
                          {item.categoria === 'Luces LED' ? (
                            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <Package className="w-3.5 h-3.5 text-[#e50914] shrink-0" />
                          )}
                          <span className="truncate">{item.nombre}</span>
                        </div>
                        {item.notas && (
                          <div className="text-[10px] text-neutral-500 font-normal truncate mt-0.5">
                            {item.notas}
                          </div>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-900 border border-neutral-700 text-neutral-300">
                          {item.categoria}
                        </span>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <span
                          className={`font-mono text-sm font-black px-2 py-0.5 rounded ${
                            isLow
                              ? 'text-amber-400 bg-amber-950/80 border border-amber-700'
                              : 'text-white'
                          }`}
                        >
                          {item.stockActual} {item.unidadMedida}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-neutral-400 whitespace-nowrap">
                        {item.stockMinimo} {item.unidadMedida}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1 min-w-[110px]">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span
                              className={`font-bold ${
                                isLow ? 'text-amber-400 flex items-center gap-1' : 'text-green-400'
                              }`}
                            >
                              {isLow ? '⚠️ POCAS UNIDADES' : 'DISPONIBLE'}
                            </span>
                            <span className="text-neutral-500">{Math.round(ratio)}%</span>
                          </div>
                          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isLow ? 'bg-amber-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${ratio}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-neutral-400 text-xs whitespace-nowrap">
                        {item.ubicacion || 'Taller General'}
                      </td>
                      <td className="p-3 text-right font-mono text-neutral-300 whitespace-nowrap">
                        ${(item.costoUnitario || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Adjust Button */}
                          <button
                            onClick={() => {
                              setStockAdjustInsumo(item);
                              setAdjustAmount(1);
                              setAdjustType('add');
                              setAdjustReason('');
                            }}
                            title="Entrada / Salida de Stock"
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded border border-neutral-700 transition cursor-pointer"
                          >
                            <Boxes className="w-3.5 h-3.5 text-blue-400" />
                          </button>

                          {permissions.editar && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              title="Editar Insumo"
                              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded border border-neutral-700 transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {permissions.eliminar && (
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar el insumo "${item.nombre}" (${item.id})?`)) {
                                  onDeleteInsumo(item.id);
                                }
                              }}
                              title="Eliminar Insumo"
                              className="p-1.5 bg-red-950/60 hover:bg-red-900 text-[#e50914] rounded border border-red-900/80 transition cursor-pointer"
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

      {/* MODAL 1: ADD NEW INSUMO */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-auto text-white">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-5 bg-[#e50914] rounded-sm"></span>
                <h3 className="text-base font-black text-white uppercase tracking-wide">
                  Registrar Insumo / Luces en Inventario
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Nombre del Insumo / Módulo LED*
                </label>
                <input
                  type="text"
                  required
                  value={addNombre}
                  onChange={(e) => setAddNombre(e.target.value)}
                  placeholder="Ej. Módulo LED 24V Ámbar Direccional / Disco Flap 60"
                  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Categoría*
                  </label>
                  <select
                    value={addCat}
                    onChange={(e) => setAddCat(e.target.value as CategoriaInsumo)}
                    className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                  >
                    <option value="Luces LED">Luces LED</option>
                    <option value="Insumos Taller">Insumos Taller</option>
                    <option value="Abrasivos y Pulido">Abrasivos y Pulido</option>
                    <option value="Soldadura y Gases">Soldadura y Gases</option>
                    <option value="Tornillería y Fijación">Tornillería y Fijación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Unidad de Medida*
                  </label>
                  <select
                    value={addUnidad}
                    onChange={(e) => setAddUnidad(e.target.value)}
                    required
                    className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                  >
                    <option value="">-- Seleccionar --</option>
                    <option value="Und">Unidades (Und)</option>
                    <option value="Rollo">Rollos (5m / 10m)</option>
                    <option value="Tubo">Tubos (Silicona)</option>
                    <option value="Kg">Kilos (Kg)</option>
                    <option value="Kit">Kits</option>
                    <option value="Metros">Metros (m)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Stock Inicial*
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={addStockActual}
                    onChange={(e) => setAddStockActual(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs font-mono text-white text-center focus:outline-none focus:border-[#e50914]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold uppercase text-neutral-400">
                      Stock Mínimo*
                    </label>
                    <span className="text-[9px] text-amber-400 font-mono">Alerta</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    value={addStockMinimo}
                    onChange={(e) => setAddStockMinimo(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                    placeholder="Ej. 5"
                    className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs font-mono text-amber-300 text-center focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Costo Unitario ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={addCosto}
                    onChange={(e) => setAddCosto(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs font-mono text-white text-right focus:outline-none focus:border-[#e50914]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Ubicación en Planta / Estante
                </label>
                <input
                  type="text"
                  value={addUbicacion}
                  onChange={(e) => setAddUbicacion(e.target.value)}
                  placeholder="Ej. Estante A1 - Electrónica / Bodega Pulido"
                  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Notas / Especificaciones Técnicas
                </label>
                <input
                  type="text"
                  value={addNotas}
                  onChange={(e) => setAddNotas(e.target.value)}
                  placeholder="Ej. Grano especial para acero 304 / Voltaje 24V"
                  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-bold shadow-lg shadow-red-900/40 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Guardar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT INSUMO */}
      {editingInsumo && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-auto text-white">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-5 bg-[#e50914] rounded-sm"></span>
                <h3 className="text-base font-black text-white uppercase tracking-wide">
                  Editar Insumo: <span className="font-mono text-[#e50914]">{editingInsumo.id}</span>
                </h3>
              </div>
              <button
                onClick={() => setEditingInsumo(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Nombre del Insumo / Módulo LED*
                </label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Categoría*
                  </label>
                  <select
                    value={editCat}
                    onChange={(e) => setEditCat(e.target.value as CategoriaInsumo)}
                    className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                  >
                    <option value="Luces LED">Luces LED</option>
                    <option value="Insumos Taller">Insumos Taller</option>
                    <option value="Abrasivos y Pulido">Abrasivos y Pulido</option>
                    <option value="Soldadura y Gases">Soldadura y Gases</option>
                    <option value="Tornillería y Fijación">Tornillería y Fijación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Unidad de Medida*
                  </label>
                  <input
                    type="text"
                    required
                    value={editUnidad}
                    onChange={(e) => setEditUnidad(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Stock Actual*
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editStockActual}
                    placeholder="0"
                    onChange={(e) => setEditStockActual(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs font-mono text-white text-center focus:outline-none focus:border-[#e50914]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold uppercase text-neutral-400">
                      Stock Mínimo*
                    </label>
                    <span className="text-[9px] text-amber-400 font-mono">Alerta</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editStockMinimo}
                    placeholder="1"
                    onChange={(e) => setEditStockMinimo(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs font-mono text-amber-300 text-center focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Costo Unitario ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editCosto}
                    placeholder="0"
                    onChange={(e) => setEditCosto(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs font-mono text-white text-right focus:outline-none focus:border-[#e50914]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Ubicación en Planta
                </label>
                <input
                  type="text"
                  value={editUbicacion}
                  onChange={(e) => setEditUbicacion(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Notas
                </label>
                <input
                  type="text"
                  value={editNotas}
                  onChange={(e) => setEditNotas(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingInsumo(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-bold shadow-lg shadow-red-900/40 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Actualizar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK STOCK ADJUST (ENTRADA / SALIDA) */}
      {stockAdjustInsumo && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 my-auto text-white">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-black text-white uppercase tracking-wide">
                  Movimiento de Inventario
                </h3>
              </div>
              <button
                onClick={() => setStockAdjustInsumo(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 space-y-1">
              <div className="text-xs font-bold text-white">{stockAdjustInsumo.nombre}</div>
              <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
                <span>Stock Actual: <strong>{stockAdjustInsumo.stockActual} {stockAdjustInsumo.unidadMedida}</strong></span>
                <span>Mínimo Alerta: {stockAdjustInsumo.stockMinimo}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-2.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    adjustType === 'add'
                      ? 'bg-green-600 text-white border-green-500 shadow-md shadow-green-950'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" /> + Entrada / Reposición
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('subtract')}
                  className={`py-2.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    adjustType === 'subtract'
                      ? 'bg-[#e50914] text-white border-red-600 shadow-md shadow-red-950'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" /> - Salida / Consumo
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Cantidad a {adjustType === 'add' ? 'Ingresar' : 'Retirar'} ({stockAdjustInsumo.unidadMedida})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustAmount}
                  placeholder="1"
                  onChange={(e) => setAdjustAmount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-lg font-mono font-bold text-white text-center focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Motivo u Orden de Trabajo
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ej. Consumo para Pedido FAL-2026-00001 o Factura de Compra"
                  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Projected result */}
              <div className="p-2.5 bg-black/60 border border-neutral-800 rounded-lg text-xs flex justify-between items-center font-mono">
                <span className="text-neutral-400">Nuevo Stock Resultante:</span>
                <span className="text-sm font-bold text-white">
                  {adjustType === 'add'
                    ? stockAdjustInsumo.stockActual + (Number(adjustAmount) || 0)
                    : Math.max(0, stockAdjustInsumo.stockActual - (Number(adjustAmount) || 0))}{' '}
                  {stockAdjustInsumo.unidadMedida}
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setStockAdjustInsumo(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-blue-950 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
