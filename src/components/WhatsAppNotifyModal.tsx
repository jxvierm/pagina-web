import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  Send,
  Phone,
  Truck,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { Pedido } from '../types';
import { buildWhatsAppCompletionMessage, buildWhatsAppUrl } from '../utils/orderHelpers';

interface WhatsAppNotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
  onMarkAsSent?: (pedidoId: string) => void;
}

export const WhatsAppNotifyModal: React.FC<WhatsAppNotifyModalProps> = ({
  isOpen,
  onClose,
  pedido,
  onMarkAsSent,
}) => {
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState(pedido?.telefono || '');
  const [customMessage, setCustomMessage] = useState(
    pedido ? buildWhatsAppCompletionMessage(pedido) : ''
  );

  // Update when opened
  React.useEffect(() => {
    if (pedido) {
      setCustomPhone(pedido.telefono);
      setCustomMessage(buildWhatsAppCompletionMessage(pedido));
      setCopied(false);
    }
  }, [pedido]);

  if (!isOpen || !pedido) return null;

  const [sendingAuto, setSendingAuto] = useState(false);
  const [autoSentSuccess, setAutoSentSuccess] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendAutomatically = async () => {
    if (!pedido) return;
    setSendingAuto(true);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customPhone,
          message: customMessage,
          pedidoId: pedido.id,
          tipo: 'terminacion_pedido',
          cliente: pedido.cliente,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAutoSentSuccess(true);
        if (onMarkAsSent) {
          onMarkAsSent(pedido.id);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        alert('Error al enviar automáticamente: ' + (data.error || 'Fallo de conexión'));
      }
    } catch (err) {
      alert('Error de red al conectar con el servicio de WhatsApp.');
    } finally {
      setSendingAuto(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const url = buildWhatsAppUrl(customPhone, customMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
    if (onMarkAsSent) {
      onMarkAsSent(pedido.id);
    }
    onClose();
  };

  const saldo =
    pedido.saldo ??
    Math.max(0, pedido.total - (pedido.abonos || []).reduce((s, a) => s + a.monto, 0));

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#141414] border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-auto text-white">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-600/60 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-900/30">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                  Notificar Terminación por WhatsApp
                </h3>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Envío automatizado al cliente con detalles y estado de saldo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Details Brief Card */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center border-b border-neutral-800/80 pb-2">
            <div>
              <span className="text-neutral-400 text-[10px] uppercase font-mono block">Pedido</span>
              <span className="font-mono font-black text-[#e50914] text-sm">{pedido.id}</span>
            </div>
            <div className="text-right">
              <span className="text-neutral-400 text-[10px] uppercase font-mono block">Cliente</span>
              <span className="font-bold text-white text-xs">{pedido.cliente}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <Truck className="w-3.5 h-3.5 text-[#e50914]" />
              <span className="truncate">{pedido.vehiculo}</span>
              {pedido.placa && (
                <span className="font-mono text-amber-400 font-bold">({pedido.placa})</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-neutral-300 justify-end">
              <DollarSign className="w-3.5 h-3.5 text-green-400" />
              <span>
                Saldo:{' '}
                <strong className={saldo > 0 ? 'text-[#e50914] font-mono' : 'text-green-400 font-mono'}>
                  ${saldo.toLocaleString()}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Destination Phone Input */}
        <div>
          <label className="block text-[11px] font-semibold uppercase text-neutral-300 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" /> Teléfono WhatsApp del Cliente
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">Indicativo +57 Colombia</span>
          </label>
          <input
            type="tel"
            value={customPhone}
            onChange={(e) => setCustomPhone(e.target.value)}
            placeholder="Ej. 3101234567"
            className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Message Preview & Edit */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-semibold uppercase text-neutral-300">
              Mensaje Personalizado Generado
            </label>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copiar Texto
                </>
              )}
            </button>
          </div>
          <textarea
            rows={6}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full bg-black/70 border border-neutral-800 p-3 rounded-lg text-xs text-neutral-200 font-sans focus:outline-none focus:border-emerald-500 leading-relaxed custom-scrollbar"
          />
        </div>

        {/* Helpful Tip */}
        <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-[11px] text-emerald-300/90 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Al pulsar <strong>«Enviar por WhatsApp»</strong> se abrirá directamente la conversación con el cliente con todo el texto cargado.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-2 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleCopyMessage}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 rounded-lg text-xs font-semibold border border-neutral-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" /> Copiar Texto
          </button>
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            title="Abrir chat en WhatsApp Web"
            className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-emerald-600/40 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Abrir en Web
          </button>
          <button
            type="button"
            onClick={handleSendAutomatically}
            disabled={sendingAuto || autoSentSuccess}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer"
          >
            {autoSentSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" /> ¡Enviado Automáticamente!
              </>
            ) : sendingAuto ? (
              <>
                <Send className="w-3.5 h-3.5 animate-pulse" /> Despachando...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Enviar Automáticamente
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
