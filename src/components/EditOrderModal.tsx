import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Zap,
  Upload,
  AlertCircle,
  CheckCircle2,
  Save,
  Truck,
  Package,
  User,
} from 'lucide-react';
import {
  Pedido,
  OrderItem,
  CatalogoProducto,
  UserAccount,
  PedidoEstado,
} from '../types';
import { VEHICLE_BRANDS, isNoAplicaVehicle, VehicleBrand } from '../data/vehicleBrands';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Pedido | null;
  onSaveEditedOrder: (updatedOrder: Pedido) => void;
  catalogo: CatalogoProducto[];
  currentUser: UserAccount;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onSaveEditedOrder,
  catalogo,
  currentUser,
}) => {
  const [fecha, setFecha] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [vendedor, setVendedor] = useState('');
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoCliente, setTipoCliente] = useState<'minorista' | 'mayorista'>('minorista');

  // Vehicle fields
  const [marcaVehiculo, setMarcaVehiculo] = useState<string>('Kenworth');
  const [lineaVehiculo, setLineaVehiculo] = useState('');
  const [placa, setPlaca] = useState('');

  const [estado, setEstado] = useState<PedidoEstado>('Pendiente');
  const [observaciones, setObservaciones] = useState('');

  // Lights conditional
  const [llevaLuces, setLlevaLuces] = useState(false);
  const [voltaje, setVoltaje] = useState<'12V' | '24V'>('24V');
  const [colorLogos, setColorLogos] = useState('');

  // Photo
  const [fotoRef, setFotoRef] = useState<string | null>(null);

  // Items
  const [items, setItems] = useState<OrderItem[]>([]);

  // When order changes, populate form
  useEffect(() => {
    if (order && isOpen) {
      setFecha(order.fecha);
      setFechaEntrega(order.fechaEntrega || '');
      setVendedor(order.vendedor || currentUser?.nombre || currentUser?.user || 'Administrador');
      setCliente(order.cliente);
      setTelefono(order.telefono);
      setTipoCliente(order.tipoCliente);
      setPlaca(order.placa || '');
      setEstado(order.estado);
      setObservaciones(order.observaciones || '');
      setLlevaLuces(order.llevaLuces);
      setVoltaje(order.voltaje === '12V' ? '12V' : '24V');
      setColorLogos(order.colorLogos || '');
      setFotoRef(order.fotoRef || null);
      setItems(
        order.items && order.items.length > 0
          ? order.items.map((it) => ({ ...it }))
          : [{ id: 'it-1', producto: '', desc: '', cant: 1, vUnit: 0, total: 0, categoria: 'Aceros' }]
      );

      // Parse vehicle brand vs line
      const rawVehiculo = order.vehiculo || '';
      if (isNoAplicaVehicle(rawVehiculo)) {
        setMarcaVehiculo('No aplica');
        setLineaVehiculo('');
      } else {
        const foundBrand = VEHICLE_BRANDS.find(
          (b) => b !== 'No aplica' && b !== 'Otro' && rawVehiculo.toLowerCase().startsWith(b.toLowerCase())
        );
        if (foundBrand) {
          setMarcaVehiculo(foundBrand);
          setLineaVehiculo(rawVehiculo.substring(foundBrand.length).trim());
        } else {
          setMarcaVehiculo('Otro');
          setLineaVehiculo(rawVehiculo);
        }
      }
    }
  }, [order, isOpen, currentUser.nombre]);

  if (!isOpen || !order) return null;

  // Regex validations
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$/;
  const phoneRegex = /^\d{10}$/;
  const isNameValid = cliente.trim().length >= 3 && nameRegex.test(cliente.trim());
  const isPhoneValid = phoneRegex.test(telefono.trim());
  const isVehicleNoAplica = marcaVehiculo === 'No aplica';

  // Handle setting "No aplica" quickly
  const handleSetNoAplica = () => {
    setMarcaVehiculo('No aplica');
    setLineaVehiculo('');
    if (!placa || placa === '') {
      setPlaca('N/A');
    }
  };

  // Item helpers
  const handleItemChange = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'cant' || field === 'vUnit') {
      const cant = Number(item.cant) || 0;
      const vUnit = Number(item.vUnit) || 0;
      item.total = Math.max(0, cant) * Math.max(0, vUnit);
    }

    updated[index] = item;
    setItems(updated);
  };

  const handleSelectCatalogProduct = (index: number, prodId: string) => {
    const prod = catalogo.find((c) => c.id === prodId);
    if (!prod) return;

    const unitPrice = tipoCliente === 'mayorista' ? prod.pMayorista : prod.pMinorista;
    const updated = [...items];
    const current = updated[index];
    const cant = Number(current.cant) || 1;

    updated[index] = {
      ...current,
      producto: prod.nombre,
      desc: prod.desc,
      vUnit: unitPrice,
      total: cant * unitPrice,
      categoria: prod.categoria,
    };

    setItems(updated);

    if (prod.categoria === 'Luces') {
      setLlevaLuces(true);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: 'it-' + Date.now(),
        producto: '',
        desc: '',
        cant: '',
        vUnit: '',
        total: 0,
        categoria: 'Aceros',
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      alert('El pedido debe tener como mínimo un ítem.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFotoRef(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const totalCalculado = items.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  const totalAbonos = (order.abonos || []).reduce((acc, curr) => acc + (curr.monto || 0), 0);
  const saldoCalculado = Math.max(0, totalCalculado - totalAbonos);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isNameValid) {
      alert('El nombre del cliente solo debe contener letras y espacios (mínimo 3 letras).');
      return;
    }
    if (!isPhoneValid) {
      alert('El teléfono debe tener exactamente 10 dígitos numéricos.');
      return;
    }

    const validItems: OrderItem[] = items
      .filter((i) => i.producto.trim().length > 0)
      .map((i) => {
        const itemCant = i.cant === '' ? 1 : Math.max(1, Number(i.cant) || 1);
        const itemVUnit = i.vUnit === '' ? 0 : Math.max(0, Number(i.vUnit) || 0);
        return {
          ...i,
          cant: itemCant,
          vUnit: itemVUnit,
          total: itemCant * itemVUnit,
        };
      });

    if (validItems.length === 0) {
      alert('Debe incluir al menos un producto o accesorio en el pedido.');
      return;
    }

    // Determine final vehicle string
    let finalVehiculo = 'No aplica';
    if (marcaVehiculo !== 'No aplica') {
      if (marcaVehiculo === 'Otro') {
        finalVehiculo = lineaVehiculo.trim() || 'Vehículo Especial';
      } else {
        finalVehiculo = lineaVehiculo.trim()
          ? `${marcaVehiculo} ${lineaVehiculo.trim()}`
          : marcaVehiculo;
      }
    }

    const updatedOrder: Pedido = {
      ...order,
      fecha: fecha.trim() || order.fecha,
      fechaEntrega: fechaEntrega.trim() || undefined,
      vendedor,
      cliente: cliente.trim(),
      telefono: telefono.trim(),
      tipoCliente,
      vehiculo: finalVehiculo,
      placa: isVehicleNoAplica && !placa ? 'N/A' : placa.trim(),
      estado,
      observaciones: observaciones.trim(),
      llevaLuces,
      voltaje: llevaLuces ? voltaje : '',
      colorLogos: llevaLuces ? colorLogos.trim() : '',
      fotoRef,
      items: validItems,
      total: totalCalculado,
      saldo: saldoCalculado,
    };

    onSaveEditedOrder(updatedOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#141414] border border-neutral-800 rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto custom-scrollbar text-white">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-5 bg-[#e50914] rounded-sm"></span>
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide uppercase">
              Modificar Pedido: <span className="text-[#e50914] font-mono">{order.id}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Número de Pedido
              </label>
              <input
                type="text"
                value={order.id}
                readOnly
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs font-mono font-bold text-[#e50914]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Fecha Registro (dd/mm/aa)*
              </label>
              <input
                type="text"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                placeholder="24/10/26"
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold uppercase text-neutral-400">
                  Fecha Entrega
                </label>
                <span className="text-[9px] text-amber-400 font-mono">Aviso 8 días</span>
              </div>
              <input
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold uppercase text-neutral-400">
                  Vendedor Responsable*
                </label>
                <button
                  type="button"
                  onClick={() => setVendedor(currentUser?.nombre || currentUser?.user || 'Administrador')}
                  className="text-[10px] text-green-400 hover:text-green-300 underline cursor-pointer flex items-center gap-1"
                  title="Cargar usuario actual en sesión"
                >
                  <User className="w-2.5 h-2.5" /> Usar mi usuario en sesión
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={vendedor}
                  onChange={(e) => setVendedor(e.target.value)}
                  required
                  placeholder="Nombre del vendedor"
                  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 pl-8 rounded-lg text-xs text-white font-semibold focus:outline-none focus:border-[#e50914]"
                />
                <User className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Client & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold uppercase text-neutral-400">
                  Nombre del Cliente / Empresa*
                </label>
                {cliente.length > 0 && (
                  <span className="text-[10px] flex items-center gap-1 font-mono">
                    {isNameValid ? (
                      <span className="text-green-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Válido
                      </span>
                    ) : (
                      <span className="text-[#e50914] flex items-center gap-0.5">
                        <AlertCircle className="w-3 h-3" /> Solo letras/espacios
                      </span>
                    )}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                required
                className={`w-full bg-neutral-900 border px-3 py-2 rounded-lg text-xs text-white focus:outline-none ${
                  cliente.length > 0
                    ? isNameValid
                      ? 'border-green-600 focus:border-green-500'
                      : 'border-[#e50914] focus:border-[#e50914]'
                    : 'border-neutral-700 focus:border-[#e50914]'
                }`}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold uppercase text-neutral-400">
                  Teléfono (10 dígitos)*
                </label>
                {telefono.length > 0 && (
                  <span className="text-[10px] font-mono">
                    {isPhoneValid ? (
                      <span className="text-green-400">OK</span>
                    ) : (
                      <span className="text-[#e50914]">10 dígitos</span>
                    )}
                  </span>
                )}
              </div>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
                maxLength={10}
                className={`w-full bg-neutral-900 border px-3 py-2 rounded-lg text-xs text-white font-mono focus:outline-none ${
                  telefono.length > 0
                    ? isPhoneValid
                      ? 'border-green-600 focus:border-green-500'
                      : 'border-[#e50914] focus:border-[#e50914]'
                    : 'border-neutral-700 focus:border-[#e50914]'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Tipo de Cliente*
              </label>
              <select
                value={tipoCliente}
                onChange={(e) => setTipoCliente(e.target.value as 'minorista' | 'mayorista')}
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white font-semibold focus:outline-none focus:border-[#e50914]"
              >
                <option value="minorista">Minorista (PVP)</option>
                <option value="mayorista">Mayorista (Tarifa Dist.)</option>
              </select>
            </div>
          </div>

          {/* Vehicle Brand & Placa with "No aplica" option */}
          <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#e50914]" />
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  Datos del Vehículo o Aplicación
                </span>
              </div>
              <button
                type="button"
                onClick={handleSetNoAplica}
                className={`px-2.5 py-1 rounded text-[11px] font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  isVehicleNoAplica
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                }`}
              >
                <span>🚫</span>
                <span>{isVehicleNoAplica ? 'Marcado como No Aplica' : 'Marcar "No aplica"'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Marca de Vehículo*
                </label>
                <select
                  value={marcaVehiculo}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMarcaVehiculo(val);
                    if (val === 'No aplica') {
                      setLineaVehiculo('');
                      if (!placa) setPlaca('N/A');
                    }
                  }}
                  className={`w-full bg-neutral-900 border px-3 py-2 rounded-lg text-xs text-white focus:outline-none ${
                    isVehicleNoAplica
                      ? 'border-amber-500/50 bg-amber-950/20 text-amber-200'
                      : 'border-neutral-700 focus:border-[#e50914]'
                  }`}
                >
                  {VEHICLE_BRANDS.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand === 'No aplica' ? '⚠️ No aplica (Accesorio o sin vehículo)' : brand}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Línea / Modelo / Referencia
                </label>
                <input
                  type="text"
                  value={lineaVehiculo}
                  disabled={isVehicleNoAplica}
                  onChange={(e) => setLineaVehiculo(e.target.value)}
                  placeholder={isVehicleNoAplica ? 'No aplica' : 'Ej. T800, Cascadia, FVR'}
                  className={`w-full bg-neutral-900 border px-3 py-2 rounded-lg text-xs text-white focus:outline-none ${
                    isVehicleNoAplica
                      ? 'opacity-40 border-neutral-800 cursor-not-allowed'
                      : 'border-neutral-700 focus:border-[#e50914]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Placa (Opcional si No Aplica)
                </label>
                <input
                  type="text"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  placeholder={isVehicleNoAplica ? 'N/A' : 'Ej. SNT-452'}
                  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white font-mono uppercase focus:outline-none focus:border-[#e50914]"
                />
              </div>
            </div>
          </div>

          {/* Status & Observations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Estado del Pedido
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as PedidoEstado)}
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
              >
                <option value="Pendiente">Pendiente (Aprobado)</option>
                <option value="En Fabricación">En Fabricación</option>
                <option value="Listo para Instalación">Listo para Instalación</option>
                <option value="Entregado">Entregado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Observaciones Generales
              </label>
              <input
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Especificaciones o notas especiales"
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>
          </div>

          {/* Conditional Lights */}
          <div className="bg-neutral-900/80 border border-neutral-800 p-3.5 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editCheckLuces"
                checked={llevaLuces}
                onChange={(e) => setLlevaLuces(e.target.checked)}
                className="w-4 h-4 accent-[#e50914] rounded cursor-pointer"
              />
              <label
                htmlFor="editCheckLuces"
                className="text-xs font-bold text-white cursor-pointer select-none flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                ¿El pedido incluye instalación o trabajo de Luces LED?
              </label>
            </div>

            {llevaLuces && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6 pt-1 border-l-2 border-[#e50914]">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Voltaje del Sistema Eléctrico*
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                      <input
                        type="radio"
                        name="editVoltaje"
                        value="24V"
                        checked={voltaje === '24V'}
                        onChange={() => setVoltaje('24V')}
                        className="accent-[#e50914]"
                      />
                      24 Voltios (Pesado / Tractocamión)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                      <input
                        type="radio"
                        name="editVoltaje"
                        value="12V"
                        checked={voltaje === '12V'}
                        onChange={() => setVoltaje('12V')}
                        className="accent-[#e50914]"
                      />
                      12 Voltios (Liviano / Turbo)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Color de Luces / Logos LED
                  </label>
                  <input
                    type="text"
                    value={colorLogos}
                    onChange={(e) => setColorLogos(e.target.value)}
                    placeholder="Ej. Blanco / Rojo / Ámbar"
                    className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Reference Photo */}
          <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-semibold uppercase text-neutral-400 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[#e50914]" />
                Foto de Referencia Técnica o Vehículo (Opcional)
              </label>
              {fotoRef && (
                <button
                  type="button"
                  onClick={() => setFotoRef(null)}
                  className="text-[11px] text-[#e50914] hover:underline cursor-pointer"
                >
                  Quitar Foto
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer"
              />
              {fotoRef && (
                <div className="w-12 h-12 rounded border border-neutral-700 overflow-hidden shrink-0">
                  <img src={fotoRef} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#e50914]" />
                Ítems y Accesorios Fabricados ({items.length})
              </span>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#e50914]" /> Agregar Ítem
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-neutral-400">
                      Ítem #{index + 1}
                    </span>
                    {catalogo.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-500">Cargar del Catálogo:</span>
                        <select
                          onChange={(e) => handleSelectCatalogProduct(index, e.target.value)}
                          defaultValue=""
                          className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                        >
                          <option value="" disabled>
                            -- Seleccionar Producto --
                          </option>
                          {catalogo.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre} (
                              {tipoCliente === 'mayorista'
                                ? `$${c.pMayorista.toLocaleString()}`
                                : `$${c.pMinorista.toLocaleString()}`}
                              )
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={item.producto}
                        onChange={(e) => handleItemChange(index, 'producto', e.target.value)}
                        placeholder="Nombre del accesorio o lujo"
                        required
                        className="w-full bg-black border border-neutral-700 px-3 py-1.5 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-neutral-500">Cant:</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={item.cant}
                          onChange={(e) =>
                            handleItemChange(index, 'cant', e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="w-full bg-black border border-neutral-700 px-2 py-1.5 rounded text-xs text-white text-center font-mono focus:outline-none focus:border-[#e50914]"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-neutral-500">Unit:</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={item.vUnit}
                          onChange={(e) =>
                            handleItemChange(index, 'vUnit', e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))
                          }
                          className="w-full bg-black border border-neutral-700 px-2 py-1.5 rounded text-xs text-white text-right font-mono focus:outline-none focus:border-[#e50914]"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2 text-right">
                      <span className="text-xs font-mono font-bold text-white">
                        ${(item.total || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="sm:col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-neutral-500 hover:text-[#e50914] p-1 transition cursor-pointer"
                        title="Eliminar fila"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={item.desc}
                      onChange={(e) => handleItemChange(index, 'desc', e.target.value)}
                      placeholder="Detalles técnicos, material o acabado (ej. Acero 304, Brillado Espejo)"
                      className="w-full bg-black/60 border border-neutral-800 px-3 py-1 rounded text-[11px] text-neutral-300 focus:outline-none focus:border-[#e50914]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-[#1c1c1c] border border-neutral-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-neutral-400 space-y-1">
              <div>
                Total Facturado: <span className="font-mono text-white font-bold">${totalCalculado.toLocaleString()}</span>
              </div>
              <div>
                Abonos Registrados: <span className="font-mono text-green-400 font-bold">${totalAbonos.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-neutral-400 uppercase font-semibold block">
                Saldo Pendiente
              </span>
              <span
                className={`text-xl sm:text-2xl font-black font-mono ${
                  saldoCalculado > 0 ? 'text-[#e50914]' : 'text-green-400'
                }`}
              >
                ${saldoCalculado.toLocaleString()} COP
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#e50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-900/40 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Guardar Cambios del Pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
