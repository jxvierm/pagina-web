import React, { useState } from 'react';
import { Building2, UserPlus, Phone, MapPin, Search, Wallet, Plus } from 'lucide-react';
import { Mayorista, RolePermissions } from '../types';

interface MayoristasViewProps {
  mayoristas: Mayorista[];
  onAddMayorista: (m: Mayorista) => void;
  permissions: RolePermissions;
}

export const MayoristasView: React.FC<MayoristasViewProps> = ({
  mayoristas,
  onAddMayorista,
  permissions,
}) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [empresa, setEmpresa] = useState('');
  const [nit, setNit] = useState('');
  const [contacto, setContacto] = useState('');
  const [tel, setTel] = useState('');
  const [dir, setDir] = useState('');
  const [lista, setLista] = useState('Mayorista Platino (15% Desc)');

  const filtered = mayoristas.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.empresa.toLowerCase().includes(q) ||
      m.nit.includes(q) ||
      m.contacto.toLowerCase().includes(q) ||
      m.tel.includes(q)
    );
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa.trim()) return;

    const newM: Mayorista = {
      id: 'may-' + Date.now(),
      nit: nit.trim() || 'S/N',
      empresa: empresa.trim(),
      contacto: contacto.trim() || 'Representante Legal',
      tel: tel.trim(),
      dir: dir.trim() || 'Dirección Comercial Principal',
      lista,
      saldoTotal: 0,
    };

    onAddMayorista(newM);
    setShowModal(false);
    setEmpresa('');
    setNit('');
    setContacto('');
    setTel('');
    setDir('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-6 bg-[#e50914] rounded-sm"></span>
            GESTIÓN DE CLIENTES MAYORISTAS
          </h1>
          <p className="text-xs text-neutral-400">
            Cuentas corporativas, NIT, listas preferenciales y saldos de cartera consolidada
          </p>
        </div>

        {permissions.crear && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-[#e50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-900/40 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Registrar Mayorista
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl flex items-center gap-2">
        <Search className="w-4 h-4 text-neutral-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por empresa, NIT, contacto o teléfono..."
          className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914] w-full"
        />
      </div>

      {/* Grid of Wholesalers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((m) => (
          <div
            key={m.id}
            className="bg-[#141414] border border-neutral-800 rounded-xl p-5 shadow space-y-3 hover:border-neutral-700 transition"
          >
            <div className="flex justify-between items-start border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">{m.empresa}</h3>
                <span className="text-xs text-neutral-400 font-mono">NIT: {m.nit}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                {m.lista}
              </span>
            </div>

            <div className="text-xs space-y-1.5 text-neutral-300">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 w-16">Contacto:</span>
                <span className="font-semibold text-white">{m.contacto}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-neutral-500" />
                <span className="font-mono text-neutral-200">{m.tel}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                <span className="text-neutral-400">{m.dir}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-between items-center text-xs">
              <span className="text-neutral-400 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-[#e50914]" /> Saldo Cartera:
              </span>
              <span
                className={`font-mono font-bold ${
                  m.saldoTotal > 0 ? 'text-[#e50914]' : 'text-green-400'
                }`}
              >
                ${m.saldoTotal.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Registrar Mayorista */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#e50914]" /> REGISTRAR CUENTA MAYORISTA
              </h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Razón Social / Empresa*
                </label>
                <input
                  type="text"
                  required
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Ej. Transportes del Valle SAS"
                  className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    NIT*
                  </label>
                  <input
                    type="text"
                    required
                    value={nit}
                    onChange={(e) => setNit(e.target.value)}
                    placeholder="901.123.456-7"
                    className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Teléfono*
                  </label>
                  <input
                    type="tel"
                    required
                    value={tel}
                    onChange={(e) => setTel(e.target.value)}
                    placeholder="3101234567"
                    className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Contacto Responsable
                </label>
                <input
                  type="text"
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  placeholder="Nombre de gerente de compras"
                  className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Dirección Sede Principal
                </label>
                <input
                  type="text"
                  value={dir}
                  onChange={(e) => setDir(e.target.value)}
                  placeholder="Ej. Calle 13 #98-20 Bogotá"
                  className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Lista de Precios Asignada
                </label>
                <select
                  value={lista}
                  onChange={(e) => setLista(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white"
                >
                  <option value="Mayorista Platino (15% Desc)">Mayorista Platino (15% Desc)</option>
                  <option value="Mayorista Oro (10% Desc)">Mayorista Oro (10% Desc)</option>
                  <option value="Distribuidor Autorizado">Distribuidor Autorizado</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-neutral-800 rounded text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded text-xs font-bold"
                >
                  Registrar Mayorista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
