import { AppNotification } from '../types';

let swRegistration: ServiceWorkerRegistration | null = null;

// Initialize service worker
export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    swRegistration = reg;
    return reg;
  } catch (error) {
    console.warn('FALPRO Service Worker registration skipped or restricted in sandbox:', error);
    return null;
  }
}

// Get current browser permission state
export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Request permission from user
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.warn('Could not request notification permission:', error);
    return 'denied';
  }
}

// Emit native browser notification
export async function sendBrowserNotification(notification: AppNotification): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const title = `FALPRO · ${notification.titulo}`;
  const options: NotificationOptions = {
    body: notification.mensaje,
    icon: '/src/assets/images/falpro_workshop_hero_1792850637721.jpg',
    badge: '/src/assets/images/falpro_workshop_hero_1792850637721.jpg',
    tag: notification.id,
    data: {
      url: '/',
      pedidoId: notification.pedidoId,
      moduloDestino: notification.moduloDestino,
    },
  };

  try {
    if (swRegistration && 'showNotification' in swRegistration) {
      await swRegistration.showNotification(title, options);
      return true;
    } else {
      new Notification(title, options);
      return true;
    }
  } catch (err) {
    console.warn('Native notification failed:', err);
    return false;
  }
}

// Subtle audio alert using Web Audio API (no external audio assets required)
export function playNotificationTone(priority: 'normal' | 'alta' | 'urgente' = 'normal'): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (priority === 'urgente' || priority === 'alta') {
      // Two-tone chime for high priority
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12); // E6
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Subtle single soft tick
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(660, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch {
    // Ignore audio errors if blocked by browser autoplay policy
  }
}
