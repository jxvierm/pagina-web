import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  MessageCircle,
  X,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Sliders,
  History,
  QrCode,
  ShieldCheck,
  Zap,
  Phone,
  Power,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Pedido } from '../types';

interface WhatsAppConfigState {
  connected: boolean;
  phoneNumber?: string;
  pairedAt?: string;
  provider: 'qr_gateway' | 'meta_cloud';
  apiKey?: string;
  phoneNumberId?: string;
  wabaId?: string;
  triggers: {
    onNewOrder: boolean;
    onNewAbono: boolean;
    onOrderReady: boolean;
    onStageProgress: boolean;
  };
}

interface WhatsAppLogItem {
  id: string;
  destinatario: string;
  cliente: string;
  pedidoId?: string | null;
  tipo: string;
  mensaje: string;
  estado: string;
  fecha: string;
  timestamp: number;
}

interface WhatsAppAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedidos?: Pedido[];
}

export const WhatsAppAutomationModal: React.FC<WhatsAppAutomationModalProps> = ({
  isOpen,
  onClose,
  pedidos = [],
}) => {
  const [activeTab, setActiveTab] = useState<'pair' | 'triggers' | 'test' | 'logs'>('pair');
  const [config, setConfig] = useState<WhatsAppConfigState>({
    connected: false,
    phoneNumber: '',
    pairedAt: '',
    provider: 'qr_gateway',
    triggers: {
      onNewOrder: true,
      onNewAbono: true,
      onOrderReady: true,
      onStageProgress: false,
    },
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [pairingToken, setPairingToken] = useState<string>('');
  const [simulatedPhoneInput, setSimulatedPhoneInput] = useState<string>('3123456789');
  const [isPairingLoading, setIsPairingLoading] = useState(false);
  const [logs, setLogs] = useState<WhatsAppLogItem[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Test send state
  const [testPhone, setTestPhone] = useState('3101234567');
  const [testMessage, setTestMessage] = useState(
    '🚛 *FALPRO S.A.S.*: Mensaje de prueba de automatización WhatsApp enviado exitosamente desde el sistema ERP del taller.'
  );
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Load config & generate QR
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/whatsapp/config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
          if (data.config.phoneNumber) {
            setSimulatedPhoneInput(data.config.phoneNumber);
          }
        }
      }
    } catch (e) {
      console.warn('Could not load WhatsApp config:', e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/whatsapp/logs');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      }
    } catch (e) {
      console.warn('Could not load WhatsApp logs:', e);
    }
  };

  const generateQRCode = async () => {
    setIsPairingLoading(true);
    try {
      const res = await fetch('/api/whatsapp/pair-qr', { method: 'POST' });
      const data = await res.json();
      if (data.qrPayload) {
        setPairingToken(data.pairingToken);
        const url = await QRCode.toDataURL(data.qrPayload, {
          width: 260,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrDataUrl(url);
      }
    } catch (e) {
      console.warn('Error generating QR:', e);
    } finally {
      setIsPairingLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      fetchLogs();
      generateQRCode();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmPairing = async (phoneToLink: string) => {
    setIsPairingLoading(true);
    try {
      const clean = phoneToLink.replace(/\D/g, '');
      const full = clean.startsWith('57') ? clean : `57${clean}`;
      const res = await fetch('/api/whatsapp/pair-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          phoneNumber: `+${full}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig((prev) => ({
          ...prev,
          connected: true,
          phoneNumber: `+${full}`,
          pairedAt: data.pairedAt || new Date().toLocaleString(),
        }));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.warn('Pairing failed:', err);
    } finally {
      setIsPairingLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      setConfig((prev) => ({
        ...prev,
        connected: false,
        phoneNumber: '',
        pairedAt: '',
      }));
      generateQRCode();
    } catch (err) {
      console.warn('Disconnect error:', err);
    }
  };

  const handleSaveTriggerSettings = async () => {
    try {
      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggers: config.triggers,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.warn('Save triggers error:', err);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim() || !testMessage.trim()) return;

    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testPhone,
          message: testMessage,
          tipo: 'prueba_sistema',
          cliente: 'Prueba de Enlace WhatsApp',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          msg: `¡Mensaje enviado con éxito al número +57 ${testPhone} mediante el gateway vinculado!`,
        });
        fetchLogs();
      } else {
        setTestResult({
          success: false,
          msg: data.error || 'Error al despachar el mensaje.',
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        msg: 'Fallo de conexión al enviar mensaje de prueba.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#141414] border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-auto text-white">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-950/80 border border-emerald-600/60 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-900/40 font-black">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  Enlace de WhatsApp Automático
                  {config.connected ? (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> CONECTADO
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-mono font-bold">
                      DESCONECTADO
                    </span>
                  )}
                </h3>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Envía mensajes automáticamente a los clientes sin necesidad de abrir WhatsApp ni presionar enviar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 gap-1 overflow-x-auto custom-scrollbar pb-1">
          <button
            onClick={() => setActiveTab('pair')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'pair'
                ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Vincular Dispositivo (QR)</span>
          </button>

          <button
            onClick={() => setActiveTab('triggers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'triggers'
                ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Disparadores Automáticos</span>
          </button>

          <button
            onClick={() => setActiveTab('test')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'test'
                ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Envío de Prueba</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('logs');
              fetchLogs();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial ({logs.length})</span>
          </button>
        </div>

        {/* Tab 1: Vincular Dispositivo (QR & Estado) */}
        {activeTab === 'pair' && (
          <div className="space-y-4 animate-in fade-in">
            {config.connected ? (
              <div className="bg-emerald-950/30 border border-emerald-700/60 rounded-xl p-5 space-y-4 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-900/40 animate-pulse">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    WhatsApp Vinculado y Activo
                  </h4>
                  <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                    {config.phoneNumber}
                  </div>
                  <p className="text-xs text-neutral-300 mt-1">
                    Línea enlazada el: <span className="font-mono text-white">{config.pairedAt || 'Reciente'}</span>
                  </p>
                </div>

                <div className="p-3 bg-black/40 border border-neutral-800 rounded-lg text-xs text-neutral-300 max-w-md mx-auto text-left space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Zap className="w-4 h-4" /> Despacho 100% Automático en Segundo Plano
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Cualquier nuevo pedido, abono o pedido finalizado enviará inmediatamente la notificación al cliente a través de esta línea sin requerir ninguna acción tuya.
                  </p>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('test')}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Probar Envío
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5" /> Desvincular Línea
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                {/* Left: QR Display */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="bg-white p-3 rounded-xl shadow-lg border border-neutral-700">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="WhatsApp QR Code" className="w-48 h-48 sm:w-52 sm:h-52 object-contain" />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-neutral-400 text-xs">
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-[11px] font-mono text-neutral-400">Código de emparejamiento:</span>
                    <div className="text-xs font-mono font-bold text-emerald-400 tracking-wider">
                      {pairingToken || 'GENERANDO...'}
                    </div>
                  </div>
                  <button
                    onClick={generateQRCode}
                    disabled={isPairingLoading}
                    className="mt-2 text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${isPairingLoading ? 'animate-spin' : ''}`} />
                    Actualizar código QR
                  </button>
                </div>

                {/* Right: Instructions & Instant Connect */}
                <div className="space-y-3 text-xs">
                  <div className="font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" /> Pasos para enlazar:
                  </div>

                  <ol className="space-y-2 text-neutral-300 pl-4 list-decimal text-[11px]">
                    <li>Abre <strong>WhatsApp</strong> en tu teléfono celular.</li>
                    <li>Toca los tres puntos <strong>(⋮)</strong> o ve a <strong>Ajustes / Configuración</strong>.</li>
                    <li>Selecciona <strong>Dispositivos vinculados</strong>.</li>
                    <li>Toca <strong>«Vincular un dispositivo»</strong> y apunta la cámara a este código QR.</li>
                  </ol>

                  {/* Manual phone number link option */}
                  <div className="pt-2 border-t border-neutral-800 space-y-2">
                    <label className="text-[11px] font-bold uppercase text-neutral-400 block">
                      O vincular inmediatamente por número de celular:
                    </label>
                    <div className="flex gap-2">
                      <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded-lg px-2 text-xs text-neutral-400 font-mono">
                        +57
                      </div>
                      <input
                        type="tel"
                        value={simulatedPhoneInput}
                        onChange={(e) => setSimulatedPhoneInput(e.target.value)}
                        placeholder="312 345 6789"
                        className="flex-1 bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button
                      onClick={() => handleConfirmPairing(simulatedPhoneInput)}
                      disabled={isPairingLoading || !simulatedPhoneInput.trim()}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Vincular esta línea ahora
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Disparadores Automáticos (Triggers) */}
        {activeTab === 'triggers' && (
          <div className="space-y-4 animate-in fade-in text-xs">
            <p className="text-neutral-400 text-xs">
              Configura en qué momentos el sistema enviará los mensajes de WhatsApp sin que tú tengas que redactarlos ni pulsar enviar:
            </p>

            <div className="space-y-3">
              {/* Trigger 1: Nuevo Pedido */}
              <label className="p-3.5 bg-neutral-900/90 border border-neutral-800 rounded-xl flex items-start justify-between gap-3 cursor-pointer hover:border-neutral-700 transition">
                <div className="space-y-0.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>1. Al registrar un Nuevo Pedido</span>
                    <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 font-mono text-[9px] rounded font-bold">
                      RECOMENDADO
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Envía al cliente confirmación de orden con ítems, vehículo, placa, abono inicial y saldo pendiente.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.triggers.onNewOrder}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      triggers: { ...prev.triggers, onNewOrder: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer mt-0.5"
                />
              </label>

              {/* Trigger 2: Abono Registrado */}
              <label className="p-3.5 bg-neutral-900/90 border border-neutral-800 rounded-xl flex items-start justify-between gap-3 cursor-pointer hover:border-neutral-700 transition">
                <div className="space-y-0.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>2. Al registrar un Abono de Pago</span>
                    <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 font-mono text-[9px] rounded font-bold">
                      RECOMENDADO
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Envía comprobante digital inmediato con monto recibido, método de pago y el nuevo saldo restante del pedido.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.triggers.onNewAbono}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      triggers: { ...prev.triggers, onNewAbono: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer mt-0.5"
                />
              </label>

              {/* Trigger 3: Pedido Listo para Entrega / Instalación */}
              <label className="p-3.5 bg-neutral-900/90 border border-neutral-800 rounded-xl flex items-start justify-between gap-3 cursor-pointer hover:border-neutral-700 transition">
                <div className="space-y-0.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>3. Al marcar «Listo para Instalación» o Finalizado</span>
                    <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 font-mono text-[9px] rounded font-bold">
                      RECOMENDADO
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Avisa al cliente que su lujo o juego de aceros ya está terminado, indicando horario y bahía para instalación o despacho.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.triggers.onOrderReady}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      triggers: { ...prev.triggers, onOrderReady: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer mt-0.5"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={handleSaveTriggerSettings}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950"
              >
                <Check className="w-3.5 h-3.5" />
                {saveSuccess ? '¡Configuración Guardada!' : 'Guardar Automatización'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Envío de Prueba */}
        {activeTab === 'test' && (
          <form onSubmit={handleSendTestMessage} className="space-y-3 animate-in fade-in text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                Número de WhatsApp para prueba (con o sin +57):
              </label>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Ej. 3101234567"
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                Mensaje de prueba:
              </label>
              <textarea
                rows={3}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 p-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 custom-scrollbar"
              />
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300'
                    : 'bg-red-950/40 border-red-600/50 text-red-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{testResult.msg}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSendingTest}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950"
              >
                <Send className="w-3.5 h-3.5" />
                {isSendingTest ? 'Despachando...' : 'Enviar Prueba Inmediata'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Historial de Envíos */}
        {activeTab === 'logs' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Registro de mensajes despachados automáticamente por el sistema:</span>
              <button
                onClick={fetchLogs}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Actualizar
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 border border-neutral-800 rounded-xl p-2 bg-neutral-900/60">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  No hay envíos registrados todavía. Cuando se cree un pedido o abono, aparecerán aquí.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">+{log.destinatario}</span>
                        <span className="text-[10px] text-neutral-400">({log.cliente})</span>
                        {log.pedidoId && (
                          <span className="px-1.5 py-0.2 bg-red-950/60 text-[#e50914] border border-red-800/40 rounded text-[9px] font-mono">
                            {log.pedidoId}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{log.estado}</span>
                        <span className="text-neutral-500">· {log.fecha}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-300 font-sans line-clamp-2">
                      {log.mensaje}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-neutral-800 text-xs">
          <div className="text-[10px] text-neutral-500">
            FALPRO WhatsApp Gateway v2.4 · Conexión directa
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
