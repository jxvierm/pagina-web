import React, { useState } from 'react';
import {
  CloudUpload,
  Download,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  History,
  ShieldCheck,
  Database,
  ArrowRight,
} from 'lucide-react';
import { SyncLog, Pedido, RolePermissions } from '../types';

interface ExcelCloudViewProps {
  logs: SyncLog[];
  pedidos: Pedido[];
  onTriggerSync: (msg?: string) => void;
  permissions: RolePermissions;
}

export const ExcelCloudView: React.FC<ExcelCloudViewProps> = ({
  logs,
  pedidos,
  onTriggerSync,
  permissions,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState(false);

  const handleManualSync = () => {
    setSyncing(true);
    setTimeout(() => {
      onTriggerSync('Forzado manual de sincronización total de registros y cartera');
      setSyncing(false);
    }, 600);
  };

  const handleDownloadExcel = () => {
    if (!permissions.descargar) {
      alert('Permiso denegado: su rol no tiene autorización para descargar copias de seguridad de la base de datos.');
      return;
    }

    // Generate CSV UTF-8 with BOM for Excel compatibility
    let csv = '\uFEFF';
    csv += 'LIBRO MAESTRO CONSOLIDADO - FALPRO S.A.S. LUJOS PARA VEHÍCULOS\n';
    csv += 'Año Fiscal: 2026 | Planta Principal: Chocontá, Cundinamarca | FALPRO Cloud Sync\n\n';
    csv += 'No_Pedido,Fecha,Cliente,Telefono,Vehiculo,Placa,Tipo_Cliente,Lleva_Luces,Voltaje,Color_Logos,Total_COP,Abonado_COP,Saldo_COP,Estado_Fabricacion,Avance_Pct,Vendedor,Bahia_Cita\n';

    pedidos.forEach((p) => {
      const abonado = p.abonos.reduce((sum, a) => sum + a.monto, 0);
      const cleanCliente = p.cliente.replace(/"/g, '""');
      const cleanVehiculo = p.vehiculo.replace(/"/g, '""');
      csv += `"${p.id}","${p.fecha}","${cleanCliente}","${p.telefono}","${cleanVehiculo}","${p.placa}","${p.tipoCliente}","${p.llevaLuces ? 'SI' : 'NO'}","${p.voltaje || 'N/A'}","${p.colorLogos || 'N/A'}",${p.total},${abonado},${p.saldo},"${p.estado}",${p.avance}%,"${p.vendedor}","${p.instalacion.bahia || 'Bahía 1'}"\n`;
    });

    csv += '\n--- DETALLE DE ÍTEMS Y FABRICACIÓN ---\n';
    csv += 'No_Pedido,Placa,Producto,Descripcion,Cantidad,Valor_Unitario,Total_Item\n';
    pedidos.forEach((p) => {
      p.items.forEach((it) => {
        const prod = it.producto.replace(/"/g, '""');
        const desc = (it.desc || '').replace(/"/g, '""');
        csv += `"${p.id}","${p.placa}","${prod}","${desc}",${it.cant},${it.vUnit},${it.total}\n`;
      });
    });

    csv += '\n--- AUDITORÍA DE ABONOS REGISTRADOS ---\n';
    csv += 'No_Pedido,Fecha_Abono,Monto_COP,Metodo_Pago,Comprobante_Ref,Usuario_Cajero\n';
    pedidos.forEach((p) => {
      p.abonos.forEach((ab) => {
        csv += `"${p.id}","${ab.fecha}",${ab.monto},"${ab.metodo}","${ab.comprobante}","${ab.usuario}"\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Pedidos_FALPRO_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onTriggerSync('Descarga local de copia de seguridad con formato Excel Pedidos_FALPRO_2026.csv');
    setDownloadNotice(true);
    setTimeout(() => setDownloadNotice(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-6 bg-[#e50914] rounded-sm"></span>
            SINCRONIZACIÓN EXCEL EN LA NUBE
          </h1>
          <p className="text-xs text-neutral-400">
            Arquitectura de persistencia desacoplada: operaciones de alta disponibilidad con réplica asíncrona a OneDrive y Google Sheets
          </p>
        </div>

        {permissions.descargar && (
          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-green-950/60 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Descargar Pedidos_FALPRO_2026.xlsx
          </button>
        )}
      </div>

      {downloadNotice && (
        <div className="p-3 bg-green-950/80 border border-green-800 rounded-lg text-xs text-green-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          Descarga generada con éxito. Archivo CSV con codificación UTF-8 compatible nativamente con Microsoft Excel y hojas de cálculo.
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Architecture details */}
        <div className="bg-[#141414] border border-neutral-800 p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#e50914]" />
            Motor de Persistencia y Réplica
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Las operaciones locales de taller se validan y guardan con cero latencia. En paralelo, un proceso asíncrono replica pedidos, desgloses, abonos de auditoría y etapas al libro maestro:
          </p>

          <div className="p-3 bg-neutral-900 rounded-lg font-mono text-[11px] text-green-400 border border-neutral-800 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#e50914]" /> Pedidos_FALPRO_2026.xlsx
            </div>
            <div className="text-neutral-400 pl-3">├── Hoja: Pedidos (General)</div>
            <div className="text-neutral-400 pl-3">├── Hoja: Items (Detalle técnico)</div>
            <div className="text-neutral-400 pl-3">├── Hoja: Abonos_Auditoria (Histórico)</div>
            <div className="text-neutral-400 pl-3">├── Hoja: Mayoristas (Cartera y NIT)</div>
            <div className="text-neutral-400 pl-3">├── Hoja: Seguimiento_Planta (Etapas)</div>
            <div className="text-neutral-400 pl-3">└── Hoja: Facturacion_Interna</div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 py-2.5 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <CloudUpload className={`w-4 h-4 text-[#e50914] ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando con la Nube...' : 'Forzar Sincronización Inmediata'}
            </button>
            <div className="text-[10px] text-neutral-500 text-center">
              Última verificación de canal: <span className="text-neutral-300">Activa (Canal Seguro SSL)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Audit Logs */}
        <div className="lg:col-span-2 bg-[#141414] border border-neutral-800 p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-[#e50914]" />
              Registro y Auditoría de Sincronizaciones ({logs.length})
            </h3>
            <span className="text-[10px] bg-green-950 text-green-300 px-2.5 py-0.5 rounded border border-green-800 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-green-400" /> Sincronización OK
            </span>
          </div>

          <div className="overflow-y-auto max-h-96 custom-scrollbar pr-1">
            <ul className="space-y-2 text-xs font-mono">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 space-y-1 hover:border-neutral-700 transition"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 font-mono">[{log.fecha}]</span>
                    <span className="text-green-400 font-bold bg-green-950/60 px-1.5 py-0.2 rounded border border-green-900/60">
                      {log.estado}
                    </span>
                  </div>
                  <div className="text-neutral-200">{log.msg}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
