import React, { useState, useRef } from 'react';
import {
  Layers,
  Plus,
  Edit3,
  Search,
  Sparkles,
  Zap,
  Package,
  Upload,
  Image as ImageIcon,
  X,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Link as LinkIcon,
} from 'lucide-react';
import { CatalogoProducto, UserAccount, RolePermissions } from '../types';

interface CatalogoViewProps {
  catalogo: CatalogoProducto[];
  onAddProducto: (prod: CatalogoProducto) => void;
  onUpdateProducto?: (prod: CatalogoProducto) => void;
  onDeleteProducto?: (prodId: string) => void;
  onUpdatePrecios: (prodId: string, pMinorista: number, pMayorista: number) => void;
  currentUser: UserAccount;
  permissions: RolePermissions;
}

export const CatalogoView: React.FC<CatalogoViewProps> = ({
  catalogo,
  onAddProducto,
  onUpdateProducto,
  onDeleteProducto,
  onUpdatePrecios,
  currentUser,
  permissions,
}) => {
  const [filterCat, setFilterCat] = useState<'todos' | 'Aceros' | 'Luces'>('todos');
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProd, setEditingProd] = useState<CatalogoProducto | null>(null);

  // Add Product Form states
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<'Aceros' | 'Luces'>('Aceros');
  const [desc, setDesc] = useState('');
  const [pMinorista, setPMinorista] = useState<number>(0);
  const [pMayorista, setPMayorista] = useState<number>(0);
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [showUrlField, setShowUrlField] = useState(false);

  // Edit Product Form states
  const [editNombre, setEditNombre] = useState('');
  const [editCategoria, setEditCategoria] = useState<'Aceros' | 'Luces'>('Aceros');
  const [editDesc, setEditDesc] = useState('');
  const [editMin, setEditMin] = useState<number>(0);
  const [editMay, setEditMay] = useState<number>(0);
  const [editImage, setEditImage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const filtered = catalogo.filter((c) => {
    const matchCat = filterCat === 'todos' || c.categoria === filterCat;
    const q = search.toLowerCase();
    const matchSearch =
      c.nombre.toLowerCase().includes(q) ||
      c.desc.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor seleccione un archivo de imagen válido (JPG, PNG, WEBP, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (isEdit) {
        setEditImage(result);
      } else {
        setUploadedImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEdit = (prod: CatalogoProducto) => {
    if (currentUser.role !== 'Administrador') {
      alert('Permiso denegado: únicamente el rol de Administrador tiene autorización para editar el catálogo.');
      return;
    }
    setEditingProd(prod);
    setEditNombre(prod.nombre);
    setEditCategoria(prod.categoria);
    setEditDesc(prod.desc);
    setEditMin(prod.pMinorista);
    setEditMay(prod.pMayorista);
    setEditImage(prod.imagen || '');
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProd) return;

    const updated: CatalogoProducto = {
      ...editingProd,
      nombre: editNombre.trim() || editingProd.nombre,
      categoria: editCategoria,
      desc: editDesc.trim(),
      pMinorista: Number(editMin) || 0,
      pMayorista: Number(editMay) || 0,
      imagen: editImage || undefined,
      updated: new Date().toLocaleDateString(),
    };

    if (onUpdateProducto) {
      onUpdateProducto(updated);
    } else {
      onUpdatePrecios(editingProd.id, editMin, editMay);
    }
    setEditingProd(null);
  };

  const handleSaveNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const prefix = categoria === 'Luces' ? 'LU-' : 'AC-';
    const nextNum = catalogo.filter((c) => c.categoria === categoria).length + 1;
    const id = `${prefix}${String(nextNum).padStart(3, '0')}`;

    const finalImage = uploadedImage || imageUrlInput.trim() || undefined;

    const newProd: CatalogoProducto = {
      id,
      nombre: nombre.trim(),
      categoria,
      desc: desc.trim() || 'Accesorio automotriz de alta especificación FALPRO',
      pMinorista: Number(pMinorista) || 0,
      pMayorista: Number(pMayorista) || 0,
      updated: new Date().toLocaleDateString(),
      imagen: finalImage,
    };

    onAddProducto(newProd);
    setShowAddModal(false);
    setNombre('');
    setDesc('');
    setPMinorista(0);
    setPMayorista(0);
    setUploadedImage('');
    setImageUrlInput('');
    setShowUrlField(false);
  };

  const handleDelete = (prod: CatalogoProducto) => {
    if (currentUser.role !== 'Administrador') {
      alert('Solo el Administrador puede eliminar productos del catálogo.');
      return;
    }
    if (window.confirm(`¿Está seguro de eliminar el producto "${prod.nombre}" (${prod.id})?`)) {
      if (onDeleteProducto) {
        onDeleteProducto(prod.id);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-6 bg-[#e50914] rounded-sm"></span>
            CATÁLOGO DE PRODUCTOS Y TARIFAS
          </h1>
          <p className="text-xs text-neutral-400">
            Líneas de producción de lujos para vehículos con fotos reales y tarifas Minorista / Mayorista
          </p>
        </div>

        {permissions.crear && (
          <button
            onClick={() => {
              setUploadedImage('');
              setImageUrlInput('');
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-[#e50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-900/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Agregar Producto
          </button>
        )}
      </div>

      {/* Filter and Category Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-lg border border-neutral-800 overflow-x-auto max-w-full">
          <button
            onClick={() => setFilterCat('todos')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              filterCat === 'todos'
                ? 'bg-[#e50914] text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Todos ({catalogo.length})
          </button>
          <button
            onClick={() => setFilterCat('Aceros')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              filterCat === 'Aceros'
                ? 'bg-[#e50914] text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Aceros Inoxidables (
            {catalogo.filter((c) => c.categoria === 'Aceros').length})
          </button>
          <button
            onClick={() => setFilterCat('Luces')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              filterCat === 'Luces'
                ? 'bg-[#e50914] text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Luces LED (
            {catalogo.filter((c) => c.categoria === 'Luces').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, nombre..."
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
          />
        </div>
      </div>

      {/* Visual Product Cards Showcase or Clean Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-12 text-center space-y-4 shadow-lg">
          <div className="w-16 h-16 bg-neutral-900 rounded-2xl border border-neutral-800 flex items-center justify-center mx-auto text-neutral-600">
            <Package className="w-8 h-8 text-[#e50914]" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-white">Catálogo listo para registrar productos</h3>
            <p className="text-xs text-neutral-400">
              No hay productos registrados actualmente. Agregue sus accesorios en acero inoxidable o luces LED subiendo sus respectivas fotografías.
            </p>
          </div>
          {permissions.crear && (
            <button
              onClick={() => {
                setUploadedImage('');
                setImageUrlInput('');
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-red-900/40"
            >
              <Plus className="w-4 h-4" /> Agregar Primer Producto con Foto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((prod) => (
            <div
              key={prod.id}
              className="bg-[#141414] border border-neutral-800 rounded-xl overflow-hidden shadow-md flex flex-col justify-between hover:border-neutral-700 transition group"
            >
              <div>
                {/* Product Image */}
                <div className="h-44 relative overflow-hidden bg-neutral-900 border-b border-neutral-800 flex items-center justify-center">
                  {prod.imagen ? (
                    <img
                      src={prod.imagen}
                      alt={prod.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-neutral-600 gap-1.5 p-4 text-center">
                      <ImageIcon className="w-8 h-8 text-neutral-700" />
                      <span className="text-[10px] text-neutral-500 font-medium">Sin foto asignada</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/85 text-[#e50914] border border-neutral-800">
                      {prod.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm ${
                        prod.categoria === 'Aceros' ? 'bg-neutral-800' : 'bg-amber-900/90'
                      }`}
                    >
                      {prod.categoria}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-1.5">
                  <h3 className="font-bold text-sm text-white leading-snug line-clamp-1">
                    {prod.nombre}
                  </h3>
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {prod.desc}
                  </p>
                </div>
              </div>

              {/* Pricing Section & Actions */}
              <div className="p-4 pt-0 space-y-2.5">
                <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-400 text-[11px]">Minorista (PVP):</span>
                    <span className="font-mono font-bold text-white">
                      ${prod.pMinorista.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-neutral-800">
                    <span className="text-purple-400 font-semibold text-[11px]">
                      Mayorista:
                    </span>
                    <span className="font-mono font-bold text-purple-300">
                      ${prod.pMayorista.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 text-[10px] text-neutral-500">
                  <span>Act: {prod.updated}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(prod)}
                      className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="Modificar Precios o Foto (Solo Administrador)"
                    >
                      <Edit3 className="w-3 h-3 text-[#e50914]" /> Editar
                    </button>
                    {currentUser.role === 'Administrador' && onDeleteProducto && (
                      <button
                        onClick={() => handleDelete(prod)}
                        className="p-1 hover:bg-red-950/60 text-neutral-500 hover:text-red-400 rounded transition cursor-pointer"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: EDITAR PRODUCTO / PRECIOS / FOTO */}
      {editingProd && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white my-auto">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#e50914]" /> EDITAR PRODUCTO ({editingProd.id})
              </h3>
              <button
                onClick={() => setEditingProd(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                />
              </div>

              {/* Photo Upload Area in Edit */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Foto del Producto
                </label>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, true)}
                  className="hidden"
                />
                {editImage ? (
                  <div className="relative rounded-lg overflow-hidden border border-neutral-700 h-32 bg-black">
                    <img src={editImage} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditImage('')}
                      className="absolute top-2 right-2 p-1 bg-black/80 hover:bg-red-950 text-white hover:text-red-400 rounded-full cursor-pointer"
                      title="Quitar foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 hover:bg-neutral-800 text-[10px] text-white rounded cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Cambiar
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => editFileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-700 hover:border-[#e50914] rounded-lg p-4 text-center cursor-pointer transition bg-neutral-900/40"
                  >
                    <Upload className="w-6 h-6 mx-auto text-neutral-500 mb-1" />
                    <span className="text-xs text-neutral-300 font-semibold block">
                      Subir foto del producto
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      Desde computador, celular o cámara (JPG, PNG)
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Precio Minorista ($)*
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editMin}
                    onChange={(e) => setEditMin(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white font-mono font-bold focus:outline-none focus:border-[#e50914]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-purple-400 mb-1">
                    Precio Mayorista ($)*
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editMay}
                    onChange={(e) => setEditMay(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-purple-300 font-mono font-bold focus:outline-none focus:border-[#e50914]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingProd(null)}
                  className="px-4 py-2 bg-neutral-800 rounded text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded text-xs font-bold cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR PRODUCTO CON FOTO */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white my-auto">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#e50914]" /> AGREGAR PRODUCTO AL CATÁLOGO
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Nombre del Producto / Accesorio*
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Visera Kenworth T800 Troquelada"
                  className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Línea / Categoría*
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as 'Aceros' | 'Luces')}
                  className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                >
                  <option value="Aceros">5.1 Aceros Inoxidables (304 / 430)</option>
                  <option value="Luces">5.2 Luces LED y Módulos Eléctricos</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Descripción Técnica y Compatibilidad
                </label>
                <textarea
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Calibres, modelo de camión, voltaje, acabado..."
                  className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                />
              </div>

              {/* PHOTO UPLOAD DROPZONE */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400">
                    Foto del Producto
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlField(!showUrlField)}
                    className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <LinkIcon className="w-3 h-3" /> {showUrlField ? 'Ocultar URL' : 'O ingresar URL'}
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, false)}
                  className="hidden"
                />

                {uploadedImage ? (
                  <div className="relative rounded-lg overflow-hidden border border-neutral-700 h-36 bg-black">
                    <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setUploadedImage('')}
                      className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-red-950 text-white hover:text-red-400 rounded-full cursor-pointer transition shadow"
                      title="Eliminar foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 text-[10px] font-bold text-green-400 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Foto cargada
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-700 hover:border-[#e50914] rounded-lg p-4 text-center cursor-pointer transition bg-neutral-900/40 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-neutral-800 group-hover:bg-red-950/60 border border-neutral-700 group-hover:border-red-800 flex items-center justify-center mx-auto mb-1.5 transition">
                      <Upload className="w-5 h-5 text-neutral-400 group-hover:text-[#e50914] transition" />
                    </div>
                    <span className="text-xs text-neutral-200 font-bold block">
                      Haz clic para subir foto del producto
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      Formatos: JPG, PNG, WEBP desde tu celular o computador
                    </span>
                  </div>
                )}

                {showUrlField && (
                  <div className="mt-2">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://ejemplo.com/foto-producto.jpg"
                      className="w-full bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                    />
                  </div>
                )}
              </div>

              {/* Pricing inputs */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Precio Minorista ($)*
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={pMinorista || ''}
                    onChange={(e) => setPMinorista(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white font-mono font-bold focus:outline-none focus:border-[#e50914]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-purple-400 mb-1">
                    Precio Mayorista ($)*
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={pMayorista || ''}
                    onChange={(e) => setPMayorista(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-purple-300 font-mono font-bold focus:outline-none focus:border-[#e50914]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded text-xs font-bold shadow-lg shadow-red-900/40 cursor-pointer"
                >
                  Guardar en Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
