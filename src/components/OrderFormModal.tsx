import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Zap,
  Upload,
  AlertCircle,
  CheckCircle2,
  Package,
} from 'lucide-react';
import {
  Pedido,
  OrderItem,
  CatalogoProducto,
  UserAccount,
  PedidoEstado,
} from '../types';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveOrder: (order: Pedido) => void;
  catalogo: CatalogoProducto[];
  currentUser: UserAccount;
  totalOrdersCount: number;
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  isOpen,
  onClose,
  onSaveOrder,
  catalogo,
  currentUser,
  totalOrdersCount,
}) => {
  // Order Code & Date
  const nextNumber = totalOrdersCount + 1;
  const initialCode = `FAL-2026-${String(nextNumber).padStart(5, '0')}`;

  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yy = String(today.getFullYear()).slice(-2);
  const initialDate = `${dd}/${mm}/${yy}`;

  const [code, setCode] = useState(initialCode);
  const [fecha, setFecha] = useState(initialDate);
  const [vendedor, setVendedor] = useState(currentUser.nombre || 'Asesor Comercial');
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoCliente, setTipoCliente] = useState<'minorista' | 'mayorista'>('minorista');
  const [vehiculo, setVehiculo] = useState('');
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
  const [items, setItems] = useState<OrderItem[]>([
    {
      id: 'it-init-1',
      producto: '',
      desc: '',
      cant: 1,
      vUnit: 0,
      total: 0,
      categoria: 'Aceros',
    },
  ]);

  // Down payment
  const [abonoInicial, setAbonoInicial] = useState<number>(0);
  const [metodoAbonoInicial, setMetodoAbonoInicial] = useState('Transferencia Bancaria');

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCode(`FAL-2026-${String(totalOrdersCount + 1).padStart(5, '0')}`);
      setFecha(initialDate);
      setCliente('');
      setTelefono('');
      setVehiculo('');
      setPlaca('');
      setObservaciones('');
      setLlevaLuces(false);
      setVoltaje('24V');
      setColorLogos('');
      setFotoRef(null);
      setAbonoInicial(0);
      setEstado('Pendiente');
      setItems([
        {
          id: 'it-' + Date.now(),
          producto: '',
          desc: '',
          cant: 1,
          vUnit: 0,
          total: 0,
          categoria: 'Aceros',
        },
      ]);
    }
  }, [isOpen, totalOrdersCount]);

  if (!isOpen) return null;

  // Regex validations
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$/;
  const phoneRegex = /^\d{10}$/;

  const isNameValid = cliente.trim().length >= 3 && nameRegex.test(cliente.trim());
  const isPhoneValid = phoneRegex.test(telefono.trim());
  const isLucesValid = !llevaLuces || colorLogos.trim().length > 0;

  // Recalculate item totals
  const handleItemChange = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    if (field === 'cant' || field === 'vUnit') {
      const cant = Number(current.cant) || 0;
      const vUnit = Number(current.vUnit) || 0;
      current.total = cant * vUnit;
    }

    updated[index] = current;
    setItems(updated);
  };

  const handleSelectCatalogItem = (index: number, catalogId: string) => {
    const prod = catalogo.find((c) => c.id === catalogId);
    if (!prod) return;

    const unitPrice = tipoCliente === 'mayorista' ? prod.pMayorista : prod.pMinorista;
    const updated = [...items];
    const cant = updated[index].cant || 1;
    updated[index] = {
      ...updated[index],
      producto: prod.nombre,
      desc: prod.desc,
      vUnit: unitPrice,
      total: cant * unitPrice,
      categoria: prod.categoria,
    };
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        id: 'it-' + Date.now() + Math.random().toString(36).substring(2, 5),
        producto: '',
        desc: '',
        cant: 1,
        vUnit: 0,
        total: 0,
        categoria: 'Aceros',
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleClientTypeChange = (newType: 'minorista' | 'mayorista') => {
    setTipoCliente(newType);
    // Refresh prices for any catalog item picked
    const updated = items.map((it) => {
      const catProd = catalogo.find((c) => c.nombre === it.producto);
      if (catProd) {
        const newUnit = newType === 'mayorista' ? catProd.pMayorista : catProd.pMinorista;
        return {
          ...it,
          vUnit: newUnit,
          total: it.cant * newUnit,
        };
      }
      return it;
    });
    setItems(updated);
  };

  const totalCalculado = items.reduce((acc, it) => acc + (it.total || 0), 0);
  const saldoCalculado = Math.max(0, totalCalculado - (abonoInicial || 0));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setFotoRef(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isNameValid) {
      alert('Error en nombre de cliente: Debe contener solo letras, tildes, guiones y espacios (mínimo 3 caracteres).');
      return;
    }
    if (!isPhoneValid) {
      alert('Error en teléfono: Debe tener exactamente 10 dígitos numéricos.');
      return;
    }
    if (llevaLuces && !colorLogos.trim()) {
      alert('Debe especificar el color de logos o acabado luminoso ya que marcó el pedido con luces.');
      return;
    }

    const validItems = items.filter((it) => it.producto.trim().length > 0);
    if (validItems.length === 0) {
      alert('Debe agregar al menos un producto o trabajo a realizar.');
      return;
    }

    const abonos = [];
    if (abonoInicial > 0) {
      abonos.push({
        id: 'ab-init-' + Date.now(),
        fecha: `${fecha} ${new Date().toLocaleTimeString().slice(0, 5)}`,
        monto: abonoInicial,
        metodo: metodoAbonoInicial,
        comprobante: `INI-${code.slice(-5)}`,
        usuario: currentUser.nombre,
      });
    }

    const newOrder: Pedido = {
      id: code,
      fecha,
      cliente: cliente.trim(),
      telefono: telefono.trim(),
      vehiculo: vehiculo.trim(),
      placa: '',
      tipoCliente,
      vendedor,
      llevaLuces,
      voltaje: llevaLuces ? voltaje : '',
      colorLogos: llevaLuces ? colorLogos.trim() : '',
      observaciones: observaciones.trim(),
      fotoRef: fotoRef || null,
      estado,
      avance: estado === 'Listo para Instalación' ? 100 : 0,
      etapas: {
        corte: { estado: 'Pendiente', resp: '-', fecha: '-', obs: '' },
        doblado: { estado: 'Pendiente', resp: '-', fecha: '-', obs: '' },
        soldado: { estado: 'Pendiente', resp: '-', fecha: '-', obs: '' },
        pulido: { estado: 'Pendiente', resp: '-', fecha: '-', obs: '' },
        brillado: { estado: 'Pendiente', resp: '-', fecha: '-', obs: '' },
        alistado: { estado: 'Pendiente', resp: '-', fecha: '-', obs: '' },
      },
      items: validItems,
      total: totalCalculado,
      abonos,
      saldo: saldoCalculado,
      instalacion: {
        fecha: 'Por coordinar',
        confirmada: false,
        bahia: 'Bahía 1',
      },
    };

    onSaveOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#141414] border border-neutral-800 rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto custom-scrollbar text-white">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-5 bg-[#e50914] rounded-sm"></span>
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide uppercase">
              Registrar Nuevo Pedido de Fabricación
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Número de Pedido
              </label>
              <input
                type="text"
                value={code}
                readOnly
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs font-mono font-bold text-[#e50914]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Fecha (dd/mm/aa)*
              </label>
              <input
                type="text"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                pattern="\d{2}/\d{2}/\d{2}"
                placeholder="24/10/26"
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Vendedor Responsable*
              </label>
              <select
                value={vendedor}
                onChange={(e) => setVendedor(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
              >
                <option value="Carlos Rojas">Carlos Rojas</option>
                <option value="Lucía Méndez">Lucía Méndez</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
          </div>

          {/* Client & Phone with Regex validation */}
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
                placeholder="Ej. Juan Pérez Gómez o Transportes SAS"
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
                placeholder="Ej. 3101234567"
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
                onChange={(e) =>
                  handleClientTypeChange(e.target.value as 'minorista' | 'mayorista')
                }
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white font-semibold focus:outline-none focus:border-[#e50914]"
              >
                <option value="minorista">Minorista (PVP)</option>
                <option value="mayorista">Mayorista (Tarifa Dist.)</option>
              </select>
            </div>
          </div>

          {/* Vehicle and Initial Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Marca / Línea del Vehículo*
              </label>
              <input
                type="text"
                value={vehiculo}
                onChange={(e) => setVehiculo(e.target.value)}
                required
                placeholder="Ej. Kenworth T800 / Chevrolet FVR"
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Estado Inicial de Entrada
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as PedidoEstado)}
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
              >
                <option value="Pendiente">Pendiente (Aprobado)</option>
                <option value="En Fabricación">En Fabricación</option>
                <option value="Listo para Instalación">Listo para Instalación</option>
              </select>
            </div>
          </div>

          {/* Conditional Lights Section */}
          <div className="bg-neutral-900/80 border border-neutral-800 p-3.5 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="checkLuces"
                checked={llevaLuces}
                onChange={(e) => setLlevaLuces(e.target.checked)}
                className="w-4 h-4 accent-[#e50914] rounded cursor-pointer"
              />
              <label
                htmlFor="checkLuces"
                className="text-xs font-bold text-white cursor-pointer select-none flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                ¿El pedido incluye instalación o trabajo de Luces LED?
              </label>
            </div>

            {llevaLuces && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-neutral-800 animate-in fade-in duration-100">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-300 mb-1">
                    Voltaje del Sistema Eléctrico*
                  </label>
                  <select
                    value={voltaje}
                    onChange={(e) => setVoltaje(e.target.value as '12V' | '24V')}
                    required={llevaLuces}
                    className="w-full bg-neutral-800 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                  >
                    <option value="24V">24 Voltios (24V - Tractocamiones / Mulas)</option>
                    <option value="12V">12 Voltios (12V - Camiones livianos / Turbo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-300 mb-1">
                    Color de Logos / Acabado Luminoso*
                  </label>
                  <input
                    type="text"
                    value={colorLogos}
                    onChange={(e) => setColorLogos(e.target.value)}
                    required={llevaLuces}
                    placeholder="Ej. Rojo Neón, Ámbar Clásico, Blanco Frío"
                    className="w-full bg-neutral-800 border border-neutral-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Items Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#e50914]" />
                <span>Ítems y Productos del Trabajo ({items.length})</span>
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-[#e50914] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Ítem
              </button>
            </div>

            <div className="overflow-x-auto border border-neutral-800 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-900 text-neutral-300 border-b border-neutral-800">
                  <tr>
                    <th className="p-2.5 w-1/3">Producto (Catálogo o Nombre)</th>
                    <th className="p-2.5">Descripción Específica</th>
                    <th className="p-2.5 w-16 text-center">Cant.</th>
                    <th className="p-2.5 w-28 text-right">V. Unit ($)</th>
                    <th className="p-2.5 w-28 text-right">Total ($)</th>
                    <th className="p-2.5 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80 bg-neutral-950">
                  {items.map((it, idx) => (
                    <tr key={it.id} className="hover:bg-neutral-900/40">
                      <td className="p-2 space-y-1">
                        <select
                          onChange={(e) => handleSelectCatalogItem(idx, e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-700 p-1.5 rounded text-white text-[11px] focus:outline-none focus:border-[#e50914]"
                        >
                          <option value="">-- Escoger del catálogo --</option>
                          {catalogo.map((c) => (
                            <option key={c.id} value={c.id}>
                              [{c.categoria}] {c.nombre}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={it.producto}
                          onChange={(e) => handleItemChange(idx, 'producto', e.target.value)}
                          placeholder="O escribir nombre a la medida..."
                          required
                          className="w-full bg-neutral-900/90 border border-neutral-700 p-1.5 rounded text-white text-xs focus:outline-none focus:border-[#e50914]"
                        />
                      </td>

                      <td className="p-2">
                        <textarea
                          rows={2}
                          value={it.desc}
                          onChange={(e) => handleItemChange(idx, 'desc', e.target.value)}
                          placeholder="Calibre de lámina, perforaciones, acabado..."
                          className="w-full bg-neutral-900 border border-neutral-700 p-1.5 rounded text-white text-xs focus:outline-none focus:border-[#e50914]"
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="number"
                          value={it.cant}
                          min={1}
                          onChange={(e) =>
                            handleItemChange(idx, 'cant', parseInt(e.target.value) || 1)
                          }
                          className="w-full bg-neutral-900 border border-neutral-700 p-1.5 rounded text-white text-xs text-center font-mono font-bold focus:outline-none focus:border-[#e50914]"
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="number"
                          value={it.vUnit}
                          min={0}
                          onChange={(e) =>
                            handleItemChange(idx, 'vUnit', parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-neutral-900 border border-neutral-700 p-1.5 rounded text-white text-xs text-right font-mono font-bold focus:outline-none focus:border-[#e50914]"
                        />
                      </td>

                      <td className="p-2 text-right font-mono font-bold text-white text-xs">
                        ${(it.total || 0).toLocaleString()}
                      </td>

                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={items.length <= 1}
                          className="text-neutral-500 hover:text-[#e50914] disabled:opacity-30 transition"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Down Payment Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-neutral-900 border border-neutral-800 rounded-lg">
            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-400">
                Total Valor Pedido
              </label>
              <div className="text-xl font-black font-mono text-white mt-0.5">
                ${totalCalculado.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                Abono Inicial Apertura ($)
              </label>
              <input
                type="number"
                value={abonoInicial}
                min={0}
                max={totalCalculado}
                onChange={(e) => setAbonoInicial(parseFloat(e.target.value) || 0)}
                className="w-full bg-neutral-800 border border-neutral-700 px-3 py-1.5 rounded text-xs text-white font-mono font-bold focus:outline-none focus:border-[#e50914]"
              />
              {abonoInicial > 0 && (
                <select
                  value={metodoAbonoInicial}
                  onChange={(e) => setMetodoAbonoInicial(e.target.value)}
                  className="w-full mt-1.5 bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-300 p-1 rounded"
                >
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Efectivo">Efectivo en Caja</option>
                  <option value="Datáfono / Tarjeta">Datáfono / Tarjeta</option>
                  <option value="Nequi / Daviplata">Nequi / Daviplata</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-400">
                Saldo Pendiente a Cobrar
              </label>
              <div
                className={`text-xl font-black font-mono mt-0.5 ${
                  saldoCalculado > 0 ? 'text-[#e50914]' : 'text-green-400'
                }`}
              >
                ${saldoCalculado.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Reference Photo & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Foto de Referencia / Plano de Fabricación
              </label>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-3 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition">
                  <Upload className="w-3.5 h-3.5 text-[#e50914]" /> Subir Imagen
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {fotoRef && (
                  <button
                    type="button"
                    onClick={() => setFotoRef(null)}
                    className="text-xs text-neutral-400 hover:text-[#e50914] underline"
                  >
                    Quitar foto
                  </button>
                )}
              </div>
              {fotoRef && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={fotoRef}
                    alt="Referencia"
                    className="h-20 w-auto rounded border border-neutral-700 object-cover shadow"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Observaciones de Taller / Ensamble
              </label>
              <textarea
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Detalles sobre tipo de brillo, troquelado, requerimientos de entrega..."
                className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#e50914] hover:bg-[#b80710] text-white text-xs font-bold transition shadow-lg shadow-red-900/40 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Guardar Pedido en Sistema
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
