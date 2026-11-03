import { Pedido } from '../types';

/**
 * Calculates remaining days until delivery.
 * Negative number = Overdue by N days.
 * 0 = Due today.
 * Positive number = Due in N days.
 */
export function getDaysUntilDelivery(fechaEntrega?: string): number | null {
  if (!fechaEntrega || !fechaEntrega.trim()) return null;

  let targetDate: Date;
  const clean = fechaEntrega.trim();

  if (clean.includes('-')) {
    const [y, m, d] = clean.split('-').map(Number);
    targetDate = new Date(y, m - 1, d);
  } else if (clean.includes('/')) {
    const parts = clean.split('/').map(Number);
    if (parts.length === 3) {
      const d = parts[0];
      const m = parts[1] - 1;
      const y = parts[2] < 100 ? 2000 + parts[2] : parts[2];
      targetDate = new Date(y, m, d);
    } else {
      return null;
    }
  } else {
    return null;
  }

  if (isNaN(targetDate.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Checks whether an order is within the 8-day deadline reminder threshold and unfinished.
 */
export function checkDelivery8DayReminder(
  fechaEntrega?: string,
  estado?: string
): {
  isAlert: boolean;
  daysLeft: number | null;
  statusText: string;
  badgeClass: string;
  severity: 'vencido' | 'hoy' | 'alerta8dias' | 'aTiempo' | 'completado';
} {
  if (estado === 'Listo para Instalación' || estado === 'Entregado' || estado === 'Cancelado') {
    return {
      isAlert: false,
      daysLeft: null,
      statusText: 'Completado',
      badgeClass: 'bg-green-950 text-green-300 border-green-800',
      severity: 'completado',
    };
  }

  const daysLeft = getDaysUntilDelivery(fechaEntrega);

  if (daysLeft === null) {
    return {
      isAlert: false,
      daysLeft: null,
      statusText: 'Sin fecha de entrega',
      badgeClass: 'bg-neutral-800 text-neutral-400 border-neutral-700',
      severity: 'aTiempo',
    };
  }

  if (daysLeft < 0) {
    const absDays = Math.abs(daysLeft);
    return {
      isAlert: true,
      daysLeft,
      statusText: `¡VENCIDO hace ${absDays} día${absDays > 1 ? 's' : ''}!`,
      badgeClass: 'bg-red-950 text-red-300 border-red-700 font-black animate-pulse',
      severity: 'vencido',
    };
  }

  if (daysLeft === 0) {
    return {
      isAlert: true,
      daysLeft: 0,
      statusText: '¡ENTREGA HOY!',
      badgeClass: 'bg-red-950 text-red-200 border-red-600 font-black animate-pulse',
      severity: 'hoy',
    };
  }

  if (daysLeft <= 8) {
    return {
      isAlert: true,
      daysLeft,
      statusText: `Entrega en ${daysLeft} día${daysLeft > 1 ? 's' : ''} (Aviso 8D)`,
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-600/80 font-bold',
      severity: 'alerta8dias',
    };
  }

  return {
    isAlert: false,
    daysLeft,
    statusText: `Entrega en ${daysLeft} días`,
    badgeClass: 'bg-neutral-800 text-neutral-300 border-neutral-700',
    severity: 'aTiempo',
  };
}

/**
 * Builds the WhatsApp notification message when an order is finished.
 */
export function buildWhatsAppCompletionMessage(pedido: Pedido): string {
  const placaText = pedido.placa && pedido.placa !== 'N/A' ? ` (Placa: *${pedido.placa}*)` : '';
  const saldo = pedido.saldo ?? Math.max(0, pedido.total - (pedido.abonos || []).reduce((s, a) => s + a.monto, 0));
  const saldoText =
    saldo > 0
      ? `\n💰 Saldo pendiente por cancelar: *$${saldo.toLocaleString()} COP*.`
      : '\n✅ Su pedido se encuentra *100% cancelado a paz y salvo*.';

  return `¡Hola *${pedido.cliente}*! 👋 Le saludamos de *FALPRO S.A.S. - Fabricación de Lujos e Inoxidables Automotrices*.\n\n` +
    `Le informamos con agrado que su orden de fabricación *${pedido.id}* para su vehículo *${pedido.vehiculo}*${placaText} ya se encuentra *¡TERMINADA Y LISTA PARA INSTALACIÓN O ENTREGA!* 🚛✨\n` +
    `${saldoText}\n\n` +
    `📍 Sede Principal: Chocontá, Cundinamarca.\n` +
    `Por favor confírmenos la fecha y hora de su llegada para reservar su turno en la bahía de montaje.\n\n` +
    `¡Muchas gracias por su confianza en la calidad y precisión FALPRO!`;
}

/**
 * Formats phone number and produces direct WhatsApp Web / App URL.
 */
export function buildWhatsAppUrl(telefono: string, message: string): string {
  let cleanPhone = telefono.replace(/\D/g, '');
  if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
    cleanPhone = '57' + cleanPhone;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
