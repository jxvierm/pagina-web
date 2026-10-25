import React, { useState } from 'react';
import {
  Hammer,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  User,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Pedido, EtapasKeys, EtapaEstado, UserAccount } from '../types';

interface ProduccionViewProps {
  pedidos: Pedido[];
  onUpdateStage: (
    pedidoId: string,
    etapa: EtapasKeys,
    nuevoEstado: EtapaEstado,
    resp?: string,
    obs?: string
  ) => void;
  onMarcarListo: (pedidoId: string) => void;
  currentUser: UserAccount;
}

export const ProduccionView: React.FC<ProduccionViewProps> = ({
  pedidos,
  onUpdateStage,
  onMarcarListo,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('activos');

  const etapasOrder: EtapasKeys[] = [
    'corte',
    'doblado',
    'soldado',
    'pulido',
    'brillado',
    'alistado',
  ];

  const stageTitles: Record<EtapasKeys, string> = {
    corte: '1. Corte Láser / Cizalla',
    doblado: '2. Doblado y Plegado CNC',
    soldado: '3. Soldado TIG Inox',
    pulido: '4. Pulido / Desbaste',
    brillado: '5. Brillado Tipo Espejo',
    alistado: '6. Alistado & Módulos LED',
  };

  const filteredPedidos = pedidos.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      p.id.toLowerCase().includes(q) ||
      p.cliente.toLowerCase().includes(q) ||
      (p.placa ? p.placa.toLowerCase().includes(q) : false) ||
      p.vehiculo.toLowerCase().includes(q);

    if (filterEstado === 'activos') {
      return matchSearch && (p.estado === 'En Fabricación' || p.estado === 'Pendiente' || p.estado === 'Listo para Instalación');
    }
    if (filterEstado === 'enFabricacion') {
      return matchSearch && p.estado === 'En Fabricación';
    }
    if (filterEstado === 'listos') {
      return matchSearch && p.estado === 'Listo para Instalación';
    }
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-6 bg-[#e50914] rounded-sm"></span>
            SEGUIMIENTO DE FABRICACIÓN (TABLERO DE PLANTA)
          </h1>
          <p className="text-xs text-neutral-400">
            Control de 6 etapas técnicas: Corte, Doblado, Soldado, Pulido, Brillado y Alistado con cálculo automatizado de avance
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#141414] border border-neutral-800 px-3 py-1.5 rounded-lg text-xs text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span>Planta Operativa Activa</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar pedido en producción por cliente, vehículo o código..."
            className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914] w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
          >
            <option value="activos">Todos los Activos en Planta</option>
            <option value="enFabricacion">Solo en Fabricación</option>
            <option value="listos">Listos para Instalación</option>
            <option value="todos">Histórico Completo</option>
          </select>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPedidos.length === 0 ? (
          <div className="col-span-full bg-[#141414] border border-neutral-800 p-8 rounded-xl text-center text-neutral-500">
            No hay órdenes de fabricación en este estado de filtro.
          </div>
        ) : (
          filteredPedidos.map((p) => {
            const isCompleted = p.avance === 100;
            return (
              <div
                key={p.id}
                className="bg-[#141414] border border-neutral-800 rounded-xl p-5 shadow-lg space-y-4 flex flex-col justify-between hover:border-neutral-700 transition"
              >
                {/* Header of Card */}
                <div className="space-y-2 border-b border-neutral-800 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono font-black text-sm text-[#e50914] tracking-wide">
                        {p.id}
                      </div>
                      <div className="text-xs font-bold text-white mt-0.5">{p.cliente}</div>
                      <div className="text-[11px] text-neutral-400">
                        {p.vehiculo}{p.placa ? <> · <span className="font-mono font-bold text-neutral-200">{p.placa}</span></> : null}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black font-mono text-white leading-none">
                        {p.avance}%
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">
                        Avance Planta
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-neutral-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-green-500' : 'bg-[#e50914]'
                      }`}
                      style={{ width: `${p.avance}%` }}
                    ></div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1">
                    <span>
                      Estado: <strong className="text-neutral-200">{p.estado}</strong>
                    </span>
                    {p.llevaLuces && (
                      <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                        <Zap className="w-3 h-3" /> Luces {p.voltaje}
                      </span>
                    )}
                  </div>
                </div>

                {/* 6 Stages list */}
                <div className="space-y-2 flex-1">
                  {etapasOrder.map((etapaKey) => {
                    const etapa = p.etapas[etapaKey];
                    const isDone = etapa.estado === 'Completado';
                    const isInProgress = etapa.estado === 'En proceso';
                    const isBlocked = etapa.estado === 'Bloqueado';

                    return (
                      <div
                        key={etapaKey}
                        className={`p-2.5 rounded-lg border text-xs transition ${
                          isDone
                            ? 'bg-green-950/20 border-green-900/40'
                            : isInProgress
                            ? 'bg-amber-950/20 border-amber-900/50'
                            : isBlocked
                            ? 'bg-red-950/20 border-red-900/50'
                            : 'bg-neutral-900/60 border-neutral-800'
                        }`}
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-bold text-neutral-200 text-[11px] truncate">
                            {stageTitles[etapaKey]}
                          </span>
                          <select
                            value={etapa.estado}
                            onChange={(e) =>
                              onUpdateStage(
                                p.id,
                                etapaKey,
                                e.target.value as EtapaEstado,
                                currentUser.nombre
                              )
                            }
                            className={`border text-[10px] font-bold rounded px-1.5 py-0.5 focus:outline-none ${
                              isDone
                                ? 'bg-green-950 border-green-800 text-green-300'
                                : isInProgress
                                ? 'bg-amber-950 border-amber-800 text-amber-300'
                                : isBlocked
                                ? 'bg-red-950 border-red-800 text-red-300'
                                : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                            }`}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="En proceso">En proceso</option>
                            <option value="Completado">Completado</option>
                            <option value="No aplica">No aplica</option>
                            <option value="Bloqueado">Bloqueado</option>
                          </select>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-1">
                          <span>
                            Resp: <strong className="text-neutral-300">{etapa.resp || '-'}</strong>
                          </span>
                          <span className="truncate max-w-[140px] text-neutral-500">
                            {etapa.obs || (etapa.fecha !== '-' ? etapa.fecha : 'En espera')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-neutral-400">
                    Ítems: {p.items.length} · Total: ${p.total.toLocaleString()}
                  </div>
                  {p.avance < 100 && (
                    <button
                      onClick={() => onMarcarListo(p.id)}
                      className="px-3 py-1 bg-green-950 hover:bg-green-900 text-green-300 text-xs font-bold rounded border border-green-800 transition flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Alistar Entrega
                    </button>
                  )}
                  {p.avance === 100 && (
                    <span className="text-[11px] font-bold text-green-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Fabricación Lista
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
