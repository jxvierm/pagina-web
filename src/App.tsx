import React, { useState, useEffect, useRef } from 'react';
import { multiScreenSync, ConnectedScreenInfo } from './services/multiScreenSyncService';
import {
  ActiveModule,
  Pedido,
  CatalogoProducto,
  Mayorista,
  Cotizacion,
  FacturaSinPedido,
  UserAccount,
  SyncLog,
  EtapasKeys,
  EtapaEstado,
  PedidoEstado,
  AppNotification,
  InsumoInventario,
  OrdenTrabajo,
} from './types';
import {
  INITIAL_PEDIDOS,
  INITIAL_CATALOGO,
  INITIAL_MAYORISTAS,
  INITIAL_COTIZACIONES,
  INITIAL_USUARIOS,
  DEFAULT_PRIMARY_USER,
  INITIAL_SYNCLOGS,
  INITIAL_NOTIFICACIONES,
  INITIAL_INVENTARIO,
  ROLE_PERMISSIONS,
  loadStoredData,
  saveStoredData,
} from './data/initialData';
import { checkDelivery8DayReminder } from './utils/orderHelpers';
import {
  registerNotificationServiceWorker,
  sendBrowserNotification,
  playNotificationTone,
} from './services/notificationService';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { PedidosView } from './components/PedidosView';
import { ProduccionView } from './components/ProduccionView';
import { FacturacionView } from './components/FacturacionView';
import { CatalogoView } from './components/CatalogoView';
import { MayoristasView } from './components/MayoristasView';
import { CronogramaView } from './components/CronogramaView';
import { ExcelCloudView } from './components/ExcelCloudView';
import { UsuariosView } from './components/UsuariosView';
import { LoginModal } from './components/LoginModal';
import { OrderFormModal } from './components/OrderFormModal';
import { AbonosModal } from './components/AbonosModal';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { NotificationCenter } from './components/NotificationCenter';
import { NotificationToast } from './components/NotificationToast';
import { CreateReminderModal } from './components/CreateReminderModal';
import { ResumenFinancieroView } from './components/ResumenFinancieroView';
import { ChatModal } from './components/ChatModal';
import { WhatsAppAutomationModal } from './components/WhatsAppAutomationModal';
import { MessageSquare } from 'lucide-react';
import { ChatMessage } from './types';

const DEFAULT_GUEST_USER: UserAccount = {
  id: 'guest',
  user: 'invitado',
  nombre: 'Sin Sesión',
  role: 'Consulta',
  estado: 'Activo',
  updated: 'N/A',
};

export default function App() {
  // App state without any mock/demo data - completely clean from zero
  const [usuarios, setUsuarios] = useState<UserAccount[]>(() => {
    try {
      localStorage.removeItem('falpro_app_data_usuarios');
      localStorage.removeItem('falpro_app_data_currentUser');
      // Wipe legacy keys containing mock examples
      localStorage.removeItem('falpro_app_data_pedidos');
      localStorage.removeItem('falpro_app_data_catalogo');
      localStorage.removeItem('falpro_app_data_mayoristas');
      localStorage.removeItem('falpro_app_data_cotizaciones');
      localStorage.removeItem('falpro_app_data_syncLogs');
      localStorage.removeItem('falpro_app_data_notifications');
      localStorage.removeItem('falpro_app_data_facturasSinPedido');
    } catch {}
    const stored = loadStoredData<UserAccount[]>('usuarios_v4', loadStoredData<UserAccount[]>('usuarios_v3', INITIAL_USUARIOS));
    if (!stored || stored.length === 0 || !stored.some((u) => u.role === 'Administrador')) {
      return [DEFAULT_PRIMARY_USER];
    }
    return stored;
  });

  // Always require login with password on page entry or reload
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');

  const [pedidos, setPedidos] = useState<Pedido[]>(() =>
    loadStoredData<Pedido[]>('pedidos_v4', INITIAL_PEDIDOS)
  );

  const [catalogo, setCatalogo] = useState<CatalogoProducto[]>(() =>
    loadStoredData<CatalogoProducto[]>('catalogo_v4', INITIAL_CATALOGO)
  );

  const [inventario, setInventario] = useState<InsumoInventario[]>(() =>
    loadStoredData<InsumoInventario[]>('inventario_v4', INITIAL_INVENTARIO)
  );

  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenTrabajo[]>(() =>
    loadStoredData<OrdenTrabajo[]>('ordenesTrabajo_v4', [])
  );

  const [mayoristas, setMayoristas] = useState<Mayorista[]>(() =>
    loadStoredData<Mayorista[]>('mayoristas_v4', INITIAL_MAYORISTAS)
  );

  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(() =>
    loadStoredData<Cotizacion[]>('cotizaciones_v4', INITIAL_COTIZACIONES)
  );

  const [facturasSinPedido, setFacturasSinPedido] = useState<FacturaSinPedido[]>(() =>
    loadStoredData<FacturaSinPedido[]>('facturasSinPedido_v4', [])
  );

  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(() =>
    loadStoredData<SyncLog[]>('syncLogs_v4', INITIAL_SYNCLOGS)
  );

  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadStoredData<AppNotification[]>('notifications_v4', INITIAL_NOTIFICACIONES)
  );

  const [toastQueue, setToastQueue] = useState<AppNotification[]>([]);

  // Modals state - starts open if no user is authenticated
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedPedidoForAbono, setSelectedPedidoForAbono] = useState<Pedido | null>(null);

  // Printable invoice modal state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoicePedido, setInvoicePedido] = useState<Pedido | null>(null);
  const [invoiceCotizacion, setInvoiceCotizacion] = useState<Cotizacion | null>(null);
  const [invoiceFacturaSP, setInvoiceFacturaSP] = useState<FacturaSinPedido | null>(null);

  // Multi-screen real-time synchronization state
  const isInitialLoadCompletedRef = useRef(false);
  const lastSyncedJsonRef = useRef<Record<string, string>>({});
  const [connectedScreensCount, setConnectedScreensCount] = useState(1);
  const [connectedScreens, setConnectedScreens] = useState<ConnectedScreenInfo[]>([]);

  // Check initial WhatsApp connection state
  useEffect(() => {
    fetch('/api/whatsapp/config')
      .then((r) => r.json())
      .then((data) => {
        if (data?.config?.connected !== undefined) {
          setIsWhatsAppConnected(Boolean(data.config.connected));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch initial chat messages and subscribe to incoming real-time messages
  useEffect(() => {
    fetch('/api/chat/messages')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.messages)) {
          setChatMessages(data.messages);
        }
      })
      .catch(() => {});

    const unsubChat = multiScreenSync.subscribeToChatMessages((incoming: ChatMessage) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });

      // Show toast if chat is closed and message is from another user
      if (incoming.senderId !== currentUser?.id && !isChatModalOpen) {
        triggerNotification({
          tipo: 'chat',
          prioridad: 'normal',
          titulo: `Mensaje de ${incoming.senderName}`,
          mensaje: incoming.texto ? incoming.texto.slice(0, 80) : 'Ha enviado una foto en el chat',
          leida: false,
        });
      }
    });

    return () => {
      unsubChat();
    };
  }, [currentUser, isChatModalOpen]);

  // Initialize multi-screen real-time channel and listen for remote updates
  useEffect(() => {
    multiScreenSync.init(activeModule, currentUser?.nombre);

    const unsubCount = multiScreenSync.subscribeToScreenCount((count, screens) => {
      setConnectedScreensCount(count);
      setConnectedScreens(screens);
    });

    const applyStore = (store: Record<string, unknown>) => {
      if (Array.isArray(store.pedidos)) {
        lastSyncedJsonRef.current['pedidos'] = JSON.stringify(store.pedidos);
        setPedidos(store.pedidos as Pedido[]);
        saveStoredData('pedidos_v4', store.pedidos);
      }
      if (Array.isArray(store.catalogo)) {
        lastSyncedJsonRef.current['catalogo'] = JSON.stringify(store.catalogo);
        setCatalogo(store.catalogo as CatalogoProducto[]);
        saveStoredData('catalogo_v4', store.catalogo);
      }
      if (Array.isArray(store.inventario)) {
        lastSyncedJsonRef.current['inventario'] = JSON.stringify(store.inventario);
        setInventario(store.inventario as InsumoInventario[]);
        saveStoredData('inventario_v4', store.inventario);
      }
      if (Array.isArray(store.ordenesTrabajo)) {
        lastSyncedJsonRef.current['ordenesTrabajo'] = JSON.stringify(store.ordenesTrabajo);
        setOrdenesTrabajo(store.ordenesTrabajo as OrdenTrabajo[]);
        saveStoredData('ordenesTrabajo_v4', store.ordenesTrabajo);
      }
      if (Array.isArray(store.mayoristas)) {
        lastSyncedJsonRef.current['mayoristas'] = JSON.stringify(store.mayoristas);
        setMayoristas(store.mayoristas as Mayorista[]);
        saveStoredData('mayoristas_v4', store.mayoristas);
      }
      if (Array.isArray(store.cotizaciones)) {
        lastSyncedJsonRef.current['cotizaciones'] = JSON.stringify(store.cotizaciones);
        setCotizaciones(store.cotizaciones as Cotizacion[]);
        saveStoredData('cotizaciones_v4', store.cotizaciones);
      }
      if (Array.isArray(store.facturasSinPedido)) {
        lastSyncedJsonRef.current['facturasSinPedido'] = JSON.stringify(store.facturasSinPedido);
        setFacturasSinPedido(store.facturasSinPedido as FacturaSinPedido[]);
        saveStoredData('facturasSinPedido_v4', store.facturasSinPedido);
      }
      if (Array.isArray(store.usuarios) && store.usuarios.length > 0) {
        lastSyncedJsonRef.current['usuarios'] = JSON.stringify(store.usuarios);
        setUsuarios(store.usuarios as UserAccount[]);
        saveStoredData('usuarios_v4', store.usuarios);
      }
      if (Array.isArray(store.syncLogs)) {
        setSyncLogs(store.syncLogs as SyncLog[]);
      }
      isInitialLoadCompletedRef.current = true;
    };

    const unsubInitialState = multiScreenSync.subscribeToInitialState((store) => {
      applyStore(store);
    });

    const unsubData = multiScreenSync.subscribeToEntityChanges((entity, data) => {
      const json = JSON.stringify(data);
      if (lastSyncedJsonRef.current[entity] === json) return; // Prevent echo bounce-back
      lastSyncedJsonRef.current[entity] = json;

      if (entity === 'pedidos' && Array.isArray(data)) {
        setPedidos(data as Pedido[]);
        saveStoredData('pedidos_v4', data);
      } else if (entity === 'catalogo' && Array.isArray(data)) {
        setCatalogo(data as CatalogoProducto[]);
        saveStoredData('catalogo_v4', data);
      } else if (entity === 'inventario' && Array.isArray(data)) {
        setInventario(data as InsumoInventario[]);
        saveStoredData('inventario_v4', data);
      } else if (entity === 'ordenesTrabajo' && Array.isArray(data)) {
        setOrdenesTrabajo(data as OrdenTrabajo[]);
        saveStoredData('ordenesTrabajo_v4', data);
      } else if (entity === 'cotizaciones' && Array.isArray(data)) {
        setCotizaciones(data as Cotizacion[]);
        saveStoredData('cotizaciones_v4', data);
      } else if (entity === 'facturasSinPedido' && Array.isArray(data)) {
        setFacturasSinPedido(data as FacturaSinPedido[]);
        saveStoredData('facturasSinPedido_v4', data);
      } else if (entity === 'mayoristas' && Array.isArray(data)) {
        setMayoristas(data as Mayorista[]);
        saveStoredData('mayoristas_v4', data);
      } else if (entity === 'usuarios' && Array.isArray(data)) {
        setUsuarios(data as UserAccount[]);
        saveStoredData('usuarios_v4', data);
      }
    });

    // Also fetch initial state via REST immediately on mount
    multiScreenSync.fetchInitialState().then((store) => {
      if (store) {
        applyStore(store);
      } else {
        isInitialLoadCompletedRef.current = true;
      }
    }).catch(() => {
      isInitialLoadCompletedRef.current = true;
    });

    return () => {
      unsubCount();
      unsubInitialState();
      unsubData();
    };
  }, []);

  // Update current user across the screen network
  useEffect(() => {
    if (currentUser) {
      multiScreenSync.updateCurrentUser(`${currentUser.nombre} (${currentUser.role})`);
    } else {
      multiScreenSync.updateCurrentUser('');
    }
  }, [currentUser]);

  // Inform other screens about active module changes
  useEffect(() => {
    multiScreenSync.updateActiveModule(activeModule);
  }, [activeModule]);

  // Register service worker on mount and ensure session is cleared so reload requires login
  useEffect(() => {
    registerNotificationServiceWorker();
    try {
      localStorage.removeItem('falpro_app_data_currentUser_v3');
      localStorage.removeItem('falpro_app_data_currentUser_v4');
    } catch {}
  }, []);

  // Sync entities outwards only when local user modifies them (preventing echo loops)
  useEffect(() => {
    if (!isInitialLoadCompletedRef.current) return;
    const json = JSON.stringify(pedidos);
    if (lastSyncedJsonRef.current['pedidos'] === json) return;
    lastSyncedJsonRef.current['pedidos'] = json;
    saveStoredData('pedidos_v4', pedidos);
    multiScreenSync.broadcastEntityChange('pedidos', pedidos);
  }, [pedidos]);

  useEffect(() => {
    if (!isInitialLoadCompletedRef.current) return;
    const json = JSON.stringify(catalogo);
    if (lastSyncedJsonRef.current['catalogo'] === json) return;
    lastSyncedJsonRef.current['catalogo'] = json;
    saveStoredData('catalogo_v4', catalogo);
    multiScreenSync.broadcastEntityChange('catalogo', catalogo);
  }, [catalogo]);

  useEffect(() => {
    if (!isInitialLoadCompletedRef.current) return;
    const json = JSON.stringify(inventario);
    if (lastSyncedJsonRef.current['inventario'] === json) return;
    lastSyncedJsonRef.current['inventario'] = json;
    saveStoredData('inventario_v4', inventario);
    multiScreenSync.broadcastEntityChange('inventario', inventario);
  }, [inventario]);

  useEffect(() => {
    if (!isInitialLoadCompletedRef.current) return;
    const json = JSON.stringify(ordenesTrabajo);
    if (lastSyncedJsonRef.current['ordenesTrabajo'] === json) return;
    lastSyncedJsonRef.current['ordenesTrabajo'] = json;
    saveStoredData('ordenesTrabajo_v4', ordenesTrabajo);
    multiScreenSync.broadcastEntityChange('ordenesTrabajo', ordenesTrabajo);
  }, [ordenesTrabajo]);

  useEffect(() => {
    if (!isInitialLoadCompletedRef.current) return;
    const json = JSON.stringify(mayoristas);
    if (lastSyncedJsonRef.current['mayoristas'] === json) return;
    lastSyncedJsonRef.current['mayoristas'] = json;
    saveStoredData('mayoristas_v4', mayoristas);
    multiScreenSync.broadcastEntityChange('mayoristas', mayoristas);
  }, [mayoristas]);

  useEffect(() => {
    if (!isInitialLoadCompletedRef.current) return;
    const json = JSON.stringify(cotizaciones);
    if (lastSyncedJsonRef.current['cotizaciones'] === json) return;
    lastSyncedJsonRef.current['cotizaciones'] = json;
    saveStoredData('cotizaciones_v4', cotizaciones);
    multiScreenSync.broadcastEntityChange('cotizaciones', cotizaciones);
  }, [cotizaciones]);

  useEffect(() => {
    if (!isInitialLoadCompletedRef.current) return;
    const json = JSON.stringify(facturasSinPedido);
    if (lastSyncedJsonRef.current['facturasSinPedido'] === json) return;
    lastSyncedJsonRef.current['facturasSinPedido'] = json;
    saveStoredData('facturasSinPedido_v4', facturasSinPedido);
    multiScreenSync.broadcastEntityChange('facturasSinPedido', facturasSinPedido);
  }, [facturasSinPedido]);

  useEffect(() => {
    if (!isInitialLoadCompletedRef.current) return;
    const json = JSON.stringify(usuarios);
    if (lastSyncedJsonRef.current['usuarios'] === json) return;
    lastSyncedJsonRef.current['usuarios'] = json;
    saveStoredData('usuarios_v4', usuarios);
    multiScreenSync.broadcastEntityChange('usuarios', usuarios);
  }, [usuarios]);

  // Open login modal automatically if there is no active session or zero users
  useEffect(() => {
    if (!currentUser || usuarios.length === 0) {
      setIsLoginModalOpen(true);
    }
  }, [currentUser, usuarios.length]);

  useEffect(() => {
    saveStoredData('syncLogs_v4', syncLogs);
  }, [syncLogs]);

  useEffect(() => {
    saveStoredData('notifications_v4', notifications);
  }, [notifications]);

  // Cloud Sync Dispatcher
  const logCloudSync = (message?: string) => {
    const text = message || 'Actualización de registros sincronizada';
    const now = new Date();
    const formatted = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    const newLog: SyncLog = {
      id: 'sync-' + Date.now(),
      fecha: formatted,
      msg: `OK: Sincronización a Pedidos_FALPRO_2026.xlsx -> ${text}`,
      estado: 'OK',
    };
    setSyncLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  // Notification Dispatcher
  const triggerNotification = (
    notifData: Omit<AppNotification, 'id' | 'timestamp' | 'fecha'>
  ) => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    const newNotification: AppNotification = {
      ...notifData,
      id: 'notif-' + Date.now() + Math.random().toString(36).substring(2, 5),
      timestamp: Date.now(),
      fecha: `${dd}/${mm}/${yy} ${hh}:${min}`,
    };

    // Update persistent state
    setNotifications((prev) => [newNotification, ...prev]);

    // Push to floating toast queue
    setToastQueue((prev) => [...prev.slice(-3), newNotification]);

    // Play subtle auditory chime
    playNotificationTone(newNotification.prioridad);

    // Native Web / Push notification
    sendBrowserNotification(newNotification);
  };

  // Automated 8-Day Delivery Deadline Checker for unfinished orders
  useEffect(() => {
    pedidos.forEach((p) => {
      const reminder = checkDelivery8DayReminder(p.fechaEntrega, p.estado);
      if (reminder.isAlert) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const storageKey = `falpro_8day_alert_${p.id}_${todayStr}`;
        if (!localStorage.getItem(storageKey)) {
          localStorage.setItem(storageKey, 'true');
          triggerNotification({
            tipo: 'recordatorio',
            prioridad: reminder.severity === 'vencido' || reminder.severity === 'hoy' ? 'urgente' : 'alta',
            titulo: `⚠️ Aviso de Entrega (8 Días): ${p.id}`,
            mensaje: `El pedido de ${p.cliente} (${p.vehiculo}${p.placa ? ` - ${p.placa}` : ''}) ${reminder.statusText}. Estado: ${p.estado}.`,
            leida: false,
            pedidoId: p.id,
            moduloDestino: 'pedidos',
          });
        }
      }
    });
  }, [pedidos]);

  // Current Permissions - checks user-level granular permissions first, falls back to role default
  const permissions =
    (currentUser && (currentUser.permissions || ROLE_PERMISSIONS[currentUser.role])) ||
    ROLE_PERMISSIONS.Consulta;
  const unreadNotificationsCount = notifications.filter((n) => !n.leida).length;

  // Compute unread team chat messages count
  const unreadChatCount = chatMessages.filter(
    (m) =>
      m.senderId !== currentUser?.id &&
      (!m.leidoPor || !m.leidoPor.includes(currentUser?.id || ''))
  ).length;

  // Background WhatsApp dispatcher helper
  const dispatchAutomatedWhatsApp = async (
    to: string,
    message: string,
    pedidoId?: string,
    tipo?: string,
    cliente?: string
  ) => {
    try {
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message, pedidoId, tipo, cliente }),
      });
    } catch (err) {
      console.warn('Background WhatsApp dispatch error:', err);
    }
  };

  // Auto-redirect if currentUser has restricted modules and activeModule is not permitted
  useEffect(() => {
    if (currentUser?.modulosPermitidos && currentUser.modulosPermitidos.length > 0) {
      if (!currentUser.modulosPermitidos.includes(activeModule)) {
        setActiveModule(currentUser.modulosPermitidos[0]);
      }
    }
  }, [currentUser, activeModule]);

  // Handlers for Orders
  const handleSaveOrder = (newOrder: Pedido) => {
    setPedidos((prev) => [newOrder, ...prev]);
    logCloudSync(`Nuevo pedido ${newOrder.id} registrado para ${newOrder.cliente} (${newOrder.placa})`);

    // Trigger Notification for new order
    triggerNotification({
      tipo: 'nuevo_pedido',
      titulo: `Nuevo Pedido: ${newOrder.id}`,
      mensaje: `Registrado para ${newOrder.cliente} (${newOrder.vehiculo} - ${newOrder.placa}) por $${newOrder.total.toLocaleString()} COP.`,
      leida: false,
      prioridad: 'alta',
      pedidoId: newOrder.id,
      moduloDestino: 'pedidos',
    });

    // Automated WhatsApp Dispatch for New Order
    const saldo = newOrder.saldo ?? Math.max(0, newOrder.total - (newOrder.abonos || []).reduce((s, a) => s + a.monto, 0));
    const autoWppMsg = `🚛 *FALPRO S.A.S. - Confirmación de Pedido ${newOrder.id}*\nHola *${newOrder.cliente}*, confirmamos la creación de tu orden para *${newOrder.vehiculo}*${newOrder.placa ? ` (Placa: ${newOrder.placa})` : ''}.\nTotal: $${newOrder.total.toLocaleString()} COP | Saldo: $${saldo.toLocaleString()} COP.\n¡Te notificaremos automáticamente cada avance de fabricación!`;
    dispatchAutomatedWhatsApp(newOrder.telefono, autoWppMsg, newOrder.id, 'nuevo_pedido', newOrder.cliente);
  };

  const handleUpdateOrderStatus = (pedidoId: string, nuevoEstado: PedidoEstado) => {
    let targetCliente = '';
    let targetVehiculo = '';
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id === pedidoId) {
          targetCliente = p.cliente;
          targetVehiculo = p.vehiculo;
          return { ...p, estado: nuevoEstado };
        }
        return p;
      })
    );
    logCloudSync(`Estado de pedido ${pedidoId} actualizado a "${nuevoEstado}"`);

    triggerNotification({
      tipo: nuevoEstado === 'Listo para Instalación' || nuevoEstado === 'Entregado' ? 'whatsapp' : 'produccion',
      titulo: nuevoEstado === 'Listo para Instalación' ? `¡Pedido Listo! Notificar por WhatsApp` : `Estado de Pedido Actualizado`,
      mensaje: nuevoEstado === 'Listo para Instalación'
        ? `El pedido ${pedidoId} (${targetCliente} - ${targetVehiculo}) está listo. ¡Notificación enviada vía WhatsApp al cliente!`
        : `El pedido ${pedidoId} fue marcado en estado "${nuevoEstado}".`,
      leida: false,
      prioridad: nuevoEstado === 'Listo para Instalación' ? 'urgente' : 'normal',
      pedidoId,
      moduloDestino: 'pedidos',
    });

    // Automated WhatsApp Dispatch for Finished / Ready Order
    if (nuevoEstado === 'Listo para Instalación') {
      const targetP = pedidos.find((p) => p.id === pedidoId);
      if (targetP) {
        const targetSaldo = targetP.saldo ?? 0;
        const readyMsg = `⚡ *FALPRO S.A.S. - ¡Tu Pedido está LISTO!*\nHola *${targetP.cliente}*, tus lujos para *${targetP.vehiculo}*${targetP.placa ? ` (Placa: ${targetP.placa})` : ''} están listos para instalación o recogida.\nSaldo pendiente: $${targetSaldo.toLocaleString()} COP.\n¡Te esperamos en nuestra sede principal FALPRO!`;
        dispatchAutomatedWhatsApp(targetP.telefono, readyMsg, pedidoId, 'pedido_listo', targetP.cliente);
      }
    }
  };

  const handleDeleteOrder = (pedidoId: string) => {
    setPedidos((prev) => prev.filter((p) => p.id !== pedidoId));
    logCloudSync(`Pedido ${pedidoId} cancelado y removido de la base activa`);
  };

  const handleUpdateOrder = (updatedOrder: Pedido) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === updatedOrder.id ? updatedOrder : p))
    );
    logCloudSync(`Pedido modificado: ${updatedOrder.id} (${updatedOrder.cliente} - ${updatedOrder.vehiculo})`);

    triggerNotification({
      tipo: 'produccion',
      titulo: `Pedido Modificado: ${updatedOrder.id}`,
      mensaje: `Datos actualizados para ${updatedOrder.cliente} (${updatedOrder.vehiculo}). Total: $${updatedOrder.total.toLocaleString()} COP.`,
      leida: false,
      prioridad: 'normal',
      pedidoId: updatedOrder.id,
      moduloDestino: 'pedidos',
    });
  };

  // Handlers for Down Payments (Abonos)
  const handleOpenAbonosModal = (pedido: Pedido) => {
    setSelectedPedidoForAbono(pedido);
  };

  const handleSaveAbono = (
    pedidoId: string,
    abonoData: { fecha: string; monto: number; metodo: string; comprobante: string; usuario: string }
  ) => {
    let nuevoSaldo = 0;
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id === pedidoId) {
          const newAbono = {
            id: 'ab-' + Date.now(),
            ...abonoData,
          };
          const updatedAbonos = [...p.abonos, newAbono];
          const totalAbonado = updatedAbonos.reduce((sum, a) => sum + a.monto, 0);
          nuevoSaldo = Math.max(0, p.total - totalAbonado);
          return {
            ...p,
            abonos: updatedAbonos,
            saldo: nuevoSaldo,
          };
        }
        return p;
      })
    );

    // Also update selected modal reference
    setSelectedPedidoForAbono((prev) => {
      if (!prev || prev.id !== pedidoId) return prev;
      const newAbono = { id: 'ab-' + Date.now(), ...abonoData };
      const updatedAbonos = [...prev.abonos, newAbono];
      const totalAbonado = updatedAbonos.reduce((sum, a) => sum + a.monto, 0);
      return {
        ...prev,
        abonos: updatedAbonos,
        saldo: Math.max(0, prev.total - totalAbonado),
      };
    });

    logCloudSync(
      `Abono de $${abonoData.monto.toLocaleString()} registrado en pedido ${pedidoId} (${abonoData.metodo})`
    );

    // Trigger Notification for payment
    triggerNotification({
      tipo: 'pago',
      titulo: `Abono Acreditado: $${abonoData.monto.toLocaleString()}`,
      mensaje: `Pedido ${pedidoId} recibió abono por ${abonoData.metodo}. Saldo restante: $${nuevoSaldo.toLocaleString()} COP.`,
      leida: false,
      prioridad: 'normal',
      pedidoId,
      moduloDestino: 'pedidos',
    });

    // Automated WhatsApp payment receipt
    const targetPedido = pedidos.find((p) => p.id === pedidoId);
    if (targetPedido) {
      const payMsg = `💰 *FALPRO S.A.S. - Comprobante de Abono*\nHola *${targetPedido.cliente}*, recibimos tu abono por *$${abonoData.monto.toLocaleString()} COP* (${abonoData.metodo}) para el pedido *${pedidoId}* (${targetPedido.vehiculo}).\nNuevo saldo pendiente: *$${nuevoSaldo.toLocaleString()} COP*.\n¡Gracias por tu confianza!`;
      dispatchAutomatedWhatsApp(targetPedido.telefono, payMsg, pedidoId, 'abono_recibido', targetPedido.cliente);
    }
  };

  const handleDeleteAbono = (pedidoId: string, abonoId: string) => {
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id === pedidoId) {
          const updatedAbonos = p.abonos.filter((a) => a.id !== abonoId);
          const totalAbonado = updatedAbonos.reduce((sum, a) => sum + a.monto, 0);
          return {
            ...p,
            abonos: updatedAbonos,
            saldo: Math.max(0, p.total - totalAbonado),
          };
        }
        return p;
      })
    );
    setSelectedPedidoForAbono((prev) => {
      if (!prev || prev.id !== pedidoId) return prev;
      const updatedAbonos = prev.abonos.filter((a) => a.id !== abonoId);
      const totalAbonado = updatedAbonos.reduce((sum, a) => sum + a.monto, 0);
      return {
        ...prev,
        abonos: updatedAbonos,
        saldo: Math.max(0, prev.total - totalAbonado),
      };
    });
    logCloudSync(
      `Abono revertido en pedido ${pedidoId} por auditoría de ${currentUser?.nombre || 'Administrador'}`
    );
  };

  // Handlers for Production (Fabricación)
  const handleUpdateStage = (
    pedidoId: string,
    etapaKey: EtapasKeys,
    nuevoEstado: EtapaEstado,
    respName?: string,
    obsText?: string
  ) => {
    let nuevoAvance = 0;
    let targetOrder: Pedido | undefined;

    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== pedidoId) return p;

        const updatedEtapas = {
          ...p.etapas,
          [etapaKey]: {
            ...p.etapas[etapaKey],
            estado: nuevoEstado,
            resp: respName || currentUser?.nombre || 'Operador',
            fecha: new Date().toLocaleDateString(),
            obs: obsText !== undefined ? obsText : p.etapas[etapaKey].obs,
          },
        };

        // Recompute progress %: (completadas / aplicables) * 100
        const etapasKeys: EtapasKeys[] = ['corte', 'doblado', 'soldado', 'pulido', 'brillado', 'alistado'];
        let aplicables = 0;
        let completadas = 0;

        etapasKeys.forEach((k) => {
          if (updatedEtapas[k].estado !== 'No aplica') {
            aplicables++;
            if (updatedEtapas[k].estado === 'Completado') {
              completadas++;
            }
          }
        });

        nuevoAvance = aplicables > 0 ? Math.round((completadas / aplicables) * 100) : 100;
        let nuevoEstadoPedido = p.estado;

        if (nuevoAvance === 100) {
          nuevoEstadoPedido = 'Listo para Instalación';
        } else if (nuevoAvance > 0 && p.estado === 'Pendiente') {
          nuevoEstadoPedido = 'En Fabricación';
        }

        targetOrder = {
          ...p,
          etapas: updatedEtapas,
          avance: nuevoAvance,
          estado: nuevoEstadoPedido,
        };

        return targetOrder;
      })
    );

    logCloudSync(`Actualización técnica en ${pedidoId}: Etapa ${etapaKey} -> ${nuevoEstado}`);

    // Trigger Notification for production stage change
    const stageLabels: Record<EtapasKeys, string> = {
      corte: 'Corte Láser',
      doblado: 'Doblado CNC',
      soldado: 'Soldado TIG',
      pulido: 'Pulido',
      brillado: 'Brillado Espejo',
      alistado: 'Alistado & Módulos LED',
    };

    triggerNotification({
      tipo: 'produccion',
      titulo: `Planta: ${stageLabels[etapaKey]} -> ${nuevoEstado}`,
      mensaje: `Pedido ${pedidoId} (${targetOrder?.placa || ''}) avanzó al ${nuevoAvance}% de fabricación.`,
      leida: false,
      prioridad: nuevoAvance === 100 ? 'alta' : 'normal',
      pedidoId,
      moduloDestino: 'produccion',
    });
  };

  const handleMarcarListo = (pedidoId: string) => {
    let orderVehiculo = '';
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== pedidoId) return p;
        orderVehiculo = p.placa ? `el vehículo (${p.placa})` : p.vehiculo ? `el vehículo ${p.vehiculo}` : `la orden ${pedidoId}`;
        const completeEtapas = { ...p.etapas };
        (Object.keys(completeEtapas) as EtapasKeys[]).forEach((k) => {
          if (completeEtapas[k].estado !== 'No aplica') {
            completeEtapas[k] = {
              ...completeEtapas[k],
              estado: 'Completado',
              resp: currentUser?.nombre || 'Operador',
              fecha: new Date().toLocaleDateString(),
            };
          }
        });
        return {
          ...p,
          etapas: completeEtapas,
          avance: 100,
          estado: 'Listo para Instalación',
        };
      })
    );
    logCloudSync(`Pedido ${pedidoId} marcado como 100% completado y Listo para Instalación`);

    triggerNotification({
      tipo: 'produccion',
      titulo: `¡Fabricación Terminada! ${pedidoId}`,
      mensaje: `Se completaron las 6 etapas técnicas para ${orderVehiculo}. El pedido está Listo para Instalación.`,
      leida: false,
      prioridad: 'urgente',
      pedidoId,
      moduloDestino: 'produccion',
    });
  };

  // Handlers for Quotes & Direct Invoices
  const handleAddCotizacion = (cot: Cotizacion) => {
    setCotizaciones((prev) => [cot, ...prev]);
    logCloudSync(`Nueva cotización ${cot.id} generada para ${cot.cliente} ($${cot.total.toLocaleString()})`);

    triggerNotification({
      tipo: 'sistema',
      titulo: `Cotización Emitida: ${cot.id}`,
      mensaje: `Generada oferta para ${cot.cliente} por valor de $${cot.total.toLocaleString()} COP (${cot.vigencia}).`,
      leida: false,
      prioridad: 'normal',
      moduloDestino: 'facturacion',
    });
  };

  const handleConvertQuoteToOrder = (cot: Cotizacion) => {
    // Mark quote as converted
    setCotizaciones((prev) =>
      prev.map((c) => (c.id === cot.id ? { ...c, estado: 'Convertida' } : c))
    );

    // Create order from quote
    const nextNumber = pedidos.length + 1;
    const newOrderCode = `FAL-2026-${String(nextNumber).padStart(5, '0')}`;
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);

    const convertedOrder: Pedido = {
      id: newOrderCode,
      fecha: `${dd}/${mm}/${yy}`,
      cliente: cot.cliente,
      telefono: cot.tel || '3100000000',
      vehiculo: cot.vehiculo || 'Tractocamión',
      placa: cot.placa || '',
      tipoCliente: 'minorista',
      vendedor: currentUser?.nombre || 'Asesor Comercial',
      llevaLuces: false,
      voltaje: '',
      colorLogos: '',
      observaciones: `Orden generada automáticamente desde cotización ${cot.id}.`,
      fotoRef: null,
      estado: 'Pendiente',
      avance: 0,
      etapas: {
        corte: { estado: 'Pendiente', resp: '-', fecha: '-', obs: '' },
        doblado: { estado: 'Pendiente', resp: '-', fecha: '-', obs: '' },
        soldado: { estado: 'Pendiente', resp: '-', fecha: '-', obs: '' },
        pulido: { estado: 'Pendiente', resp: '-', fecha: '-', obs: '' },
        brillado: { estado: 'Pendiente', resp: '-', fecha: '-', obs: '' },
        alistado: { estado: 'Pendiente', resp: '-', fecha: '-', obs: '' },
      },
      items: cot.items,
      total: cot.total,
      abonos: [],
      saldo: cot.total,
      instalacion: { fecha: 'Por coordinar', confirmada: false },
    };

    setPedidos((prev) => [convertedOrder, ...prev]);
    logCloudSync(`Cotización ${cot.id} convertida a orden de fabricación ${newOrderCode}`);

    triggerNotification({
      tipo: 'nuevo_pedido',
      titulo: `Cotización Aprobada: ${newOrderCode}`,
      mensaje: `Cotización ${cot.id} convertida a orden de fabricación para ${cot.cliente}.`,
      leida: false,
      prioridad: 'alta',
      pedidoId: newOrderCode,
      moduloDestino: 'pedidos',
    });

    alert(`¡Cotización ${cot.id} convertida con éxito en el Pedido ${newOrderCode}!`);
  };

  const handleAddFacturaSinPedido = (fac: FacturaSinPedido) => {
    setFacturasSinPedido((prev) => [fac, ...prev]);
    logCloudSync(`Factura directa ${fac.id} emitida en mostrador ($${fac.total.toLocaleString()})`);

    triggerNotification({
      tipo: 'pago',
      titulo: `Venta Directa: ${fac.id}`,
      mensaje: `Factura en mostrador emitida a ${fac.cliente} por $${fac.total.toLocaleString()} COP.`,
      leida: false,
      prioridad: 'normal',
      moduloDestino: 'facturacion',
    });
  };

  // Handlers for Catalog
  const handleAddProducto = (prod: CatalogoProducto) => {
    setCatalogo((prev) => [...prev, prod]);
    logCloudSync(`Nuevo producto agregado al catálogo: ${prod.nombre} (${prod.id})`);
  };

  const handleUpdatePrecios = (prodId: string, pMin: number, pMay: number) => {
    setCatalogo((prev) =>
      prev.map((c) =>
        c.id === prodId
          ? {
              ...c,
              pMinorista: pMin,
              pMayorista: pMay,
              updated: new Date().toLocaleDateString(),
            }
          : c
      )
    );
    logCloudSync(`Actualización de precios para ${prodId}: Minorista $${pMin} / Mayorista $${pMay}`);
  };

  const handleUpdateProducto = (prod: CatalogoProducto) => {
    setCatalogo((prev) => prev.map((c) => (c.id === prod.id ? prod : c)));
    logCloudSync(`Producto actualizado: ${prod.nombre} (${prod.id})`);
  };

  const handleDeleteProducto = (prodId: string) => {
    setCatalogo((prev) => prev.filter((c) => c.id !== prodId));
    logCloudSync(`Producto eliminado del catálogo: ${prodId}`);
  };

  // Handlers for Inventory of Lights & Workshop Supplies (Inventario de Luces e Insumos)
  const handleAddInsumo = (newInsumo: InsumoInventario) => {
    setInventario((prev) => [newInsumo, ...prev]);
    logCloudSync(`Nuevo insumo agregado: ${newInsumo.nombre} (${newInsumo.stockActual} ${newInsumo.unidadMedida})`);

    // Check low stock alert on addition
    if (newInsumo.stockActual <= newInsumo.stockMinimo) {
      triggerNotification({
        tipo: 'inventario',
        prioridad: 'urgente',
        titulo: `⚠️ ¡Alerta de Inventario! Stock Bajo`,
        mensaje: `El insumo "${newInsumo.nombre}" tiene solo ${newInsumo.stockActual} ${newInsumo.unidadMedida} disponibles (Mínimo requerido: ${newInsumo.stockMinimo}).`,
        leida: false,
        moduloDestino: 'catalogo',
      });
    }
  };

  const handleUpdateInsumo = (updatedInsumo: InsumoInventario) => {
    setInventario((prev) =>
      prev.map((i) => (i.id === updatedInsumo.id ? updatedInsumo : i))
    );
    logCloudSync(`Insumo modificado: ${updatedInsumo.nombre} (${updatedInsumo.id})`);

    if (updatedInsumo.stockActual <= updatedInsumo.stockMinimo) {
      triggerNotification({
        tipo: 'inventario',
        prioridad: 'urgente',
        titulo: `⚠️ ¡Alerta de Inventario! Stock Bajo`,
        mensaje: `El insumo "${updatedInsumo.nombre}" tiene solo ${updatedInsumo.stockActual} ${updatedInsumo.unidadMedida} disponibles (Mínimo requerido: ${updatedInsumo.stockMinimo}).`,
        leida: false,
        moduloDestino: 'catalogo',
      });
    }
  };

  const handleDeleteInsumo = (insumoId: string) => {
    setInventario((prev) => prev.filter((i) => i.id !== insumoId));
    logCloudSync(`Insumo eliminado del inventario: ${insumoId}`);
  };

  const handleAdjustStock = (insumoId: string, newStock: number, motivo: string) => {
    setInventario((prev) =>
      prev.map((i) => {
        if (i.id === insumoId) {
          const updated = {
            ...i,
            stockActual: newStock,
            ultimaReposicion: new Date().toLocaleDateString(),
          };

          if (newStock <= i.stockMinimo) {
            triggerNotification({
              tipo: 'inventario',
              prioridad: 'urgente',
              titulo: `⚠️ ¡Alerta de Inventario! Pocas Unidades`,
              mensaje: `Quedan solo ${newStock} ${i.unidadMedida} de "${i.nombre}" en bodega (Stock mínimo: ${i.stockMinimo}). ${motivo}`,
              leida: false,
              moduloDestino: 'catalogo',
            });
          }

          return updated;
        }
        return i;
      })
    );
    logCloudSync(`Ajuste de inventario en ${insumoId}: nuevo stock ${newStock} (${motivo})`);
  };

  // Handlers for Wholesalers
  const handleAddMayorista = (m: Mayorista) => {
    setMayoristas((prev) => [...prev, m]);
    logCloudSync(`Nuevo cliente mayorista registrado: ${m.empresa} (NIT ${m.nit})`);
  };

  // Handlers for Scheduling (Cronograma)
  const handleToggleConfirmacion = (pedidoId: string) => {
    let nextConf = false;
    let targetOrder: Pedido | undefined;

    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id === pedidoId) {
          nextConf = !p.instalacion.confirmada;
          targetOrder = {
            ...p,
            instalacion: {
              ...p.instalacion,
              confirmada: nextConf,
            },
          };
          return targetOrder;
        }
        return p;
      })
    );

    logCloudSync(`Estado de confirmación de cita alternado para pedido ${pedidoId}`);

    triggerNotification({
      tipo: 'cronograma',
      titulo: nextConf ? 'Cita Confirmada con Cliente' : 'Cita Pendiente de Confirmar',
      mensaje: `Turno de montaje para ${pedidoId} (${targetOrder?.placa || ''}) en ${targetOrder?.instalacion.bahia || 'Bahía 1'} quedó ${nextConf ? 'CONFIRMADO' : 'PENDIENTE'}.`,
      leida: false,
      prioridad: nextConf ? 'alta' : 'normal',
      pedidoId,
      moduloDestino: 'cronograma',
    });
  };

  const handleUpdateFechaInstalacion = (pedidoId: string, nuevaFecha: string, bahia: string) => {
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId
          ? {
              ...p,
              instalacion: {
                ...p.instalacion,
                fecha: nuevaFecha,
                bahia,
              },
            }
          : p
      )
    );
    logCloudSync(`Cita reagendada para pedido ${pedidoId} en ${bahia}: ${nuevaFecha}`);

    triggerNotification({
      tipo: 'cronograma',
      titulo: `Cita Reagendada: ${pedidoId}`,
      mensaje: `Nueva fecha asignada: ${nuevaFecha.replace('T', ' ')} en ${bahia}.`,
      leida: false,
      prioridad: 'alta',
      pedidoId,
      moduloDestino: 'cronograma',
    });
  };

  // Handlers for Work Orders (Órdenes de Trabajo)
  const handleAddOrdenTrabajo = (newOt: OrdenTrabajo) => {
    setOrdenesTrabajo((prev) => [newOt, ...prev]);
    logCloudSync(`Nueva Orden de Trabajo creada: ${newOt.id} para ${newOt.cliente} (${newOt.bahia})`);

    triggerNotification({
      tipo: 'cronograma',
      titulo: `Nueva Orden de Trabajo: ${newOt.id}`,
      mensaje: `Generada OT para ${newOt.cliente} (${newOt.vehiculo}${newOt.placa ? ` - ${newOt.placa}` : ''}) en ${newOt.bahia}. Técnico Líder: ${newOt.tecnicoLider}.`,
      leida: false,
      prioridad: newOt.prioridad === 'Urgente' ? 'urgente' : 'normal',
      moduloDestino: 'cronograma',
    });
  };

  const handleUpdateOrdenTrabajo = (updatedOt: OrdenTrabajo) => {
    setOrdenesTrabajo((prev) =>
      prev.map((ot) => (ot.id === updatedOt.id ? updatedOt : ot))
    );
    logCloudSync(`Orden de Trabajo ${updatedOt.id} actualizada: estado "${updatedOt.estado}"`);

    if (updatedOt.estado === 'Finalizada') {
      triggerNotification({
        tipo: 'cronograma',
        titulo: `¡OT Finalizada! ${updatedOt.id}`,
        mensaje: `La orden de trabajo para ${updatedOt.cliente} (${updatedOt.vehiculo}) fue finalizada en ${updatedOt.bahia}.`,
        leida: false,
        prioridad: 'alta',
        moduloDestino: 'cronograma',
      });
    }
  };

  const handleDeleteOrdenTrabajo = (otId: string) => {
    setOrdenesTrabajo((prev) => prev.filter((ot) => ot.id !== otId));
    logCloudSync(`Orden de Trabajo ${otId} eliminada`);
  };

  // Handlers for Users (strictly restricted to primary user / Administrador)
  const handleAddUsuario = (newUsr: UserAccount) => {
    if (currentUser?.role !== 'Administrador') {
      alert('Operación denegada: únicamente el Usuario Principal / Administrador tiene permisos para crear usuarios.');
      return;
    }
    setUsuarios((prev) => [...prev, newUsr]);
    logCloudSync(`Nuevo usuario creado en sistema por Administrador: @${newUsr.user} (${newUsr.role})`);
    if (!currentUser) {
      setCurrentUser(newUsr);
    }
  };

  const handleUpdateUsuario = (updatedUsr: UserAccount) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === updatedUsr.id ? updatedUsr : u))
    );
    if (currentUser?.id === updatedUsr.id) {
      setCurrentUser(updatedUsr);
    }
    logCloudSync(`Datos/Contraseña de usuario @${updatedUsr.user} actualizados`);
  };

  const handleDeleteUsuario = (userId: string) => {
    setUsuarios((prev) => prev.filter((u) => u.id !== userId));
    if (currentUser?.id === userId) {
      setCurrentUser(null);
      setIsLoginModalOpen(true);
    }
    logCloudSync(`Usuario ${userId} eliminado del sistema`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoginModalOpen(true);
  };

  const handleToggleEstadoUsuario = (userId: string) => {
    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextEstado = u.estado === 'Activo' ? 'Suspendido' : 'Activo';
          return {
            ...u,
            estado: nextEstado,
            updated: `${new Date().toLocaleDateString()} (por ${currentUser?.nombre || 'Administrador'})`,
          };
        }
        return u;
      })
    );
    logCloudSync(`Estado de cuenta de usuario ${userId} actualizado`);
  };

  // Notification management handlers
  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleDismissToast = (id: string) => {
    setToastQueue((prev) => prev.filter((t) => t.id !== id));
  };

  const handleNavigateFromNotification = (module?: ActiveModule, pedidoId?: string) => {
    if (module) {
      setActiveModule(module);
    }
  };

  // Handlers for Invoice Print Modal
  const handleOpenPrintModalForPedido = (pedido: Pedido) => {
    setInvoicePedido(pedido);
    setInvoiceCotizacion(null);
    setInvoiceFacturaSP(null);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenPrintModalForCotizacion = (cot: Cotizacion) => {
    setInvoicePedido(null);
    setInvoiceCotizacion(cot);
    setInvoiceFacturaSP(null);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenPrintModalForFacturaSP = (fac: FacturaSinPedido) => {
    setInvoicePedido(null);
    setInvoiceCotizacion(null);
    setInvoiceFacturaSP(fac);
    setIsInvoiceModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col font-sans selection:bg-[#e50914] selection:text-white">
      {/* Top Bar Navigation with Notification Bell and Multi-screen sync */}
      <Navbar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        currentUser={currentUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        connectedScreensCount={connectedScreensCount}
        connectedScreens={connectedScreens}
        onTriggerSync={() => multiScreenSync.fetchInitialState()}
        onOpenChat={() => setIsChatModalOpen(true)}
        unreadChatCount={unreadChatCount}
        onOpenWhatsApp={() => setIsWhatsAppModalOpen(true)}
        isWhatsAppConnected={isWhatsAppConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeModule === 'dashboard' && (
          <DashboardView
            pedidos={pedidos}
            cotizaciones={cotizaciones}
            onOpenOrderModal={() => setIsOrderModalOpen(true)}
            onOpenInvoiceModal={handleOpenPrintModalForPedido}
            onOpenAbonosModal={handleOpenAbonosModal}
            onNavigateTo={setActiveModule}
          />
        )}

        {activeModule === 'pedidos' && (
          <PedidosView
            pedidos={pedidos}
            onOpenNewOrderModal={() => setIsOrderModalOpen(true)}
            onOpenInvoiceModal={handleOpenPrintModalForPedido}
            onOpenAbonosModal={handleOpenAbonosModal}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdateOrder={handleUpdateOrder}
            onDeleteOrder={handleDeleteOrder}
            permissions={permissions}
            catalogo={catalogo}
            currentUser={currentUser || DEFAULT_GUEST_USER}
          />
        )}

        {activeModule === 'produccion' && (
          <ProduccionView
            pedidos={pedidos}
            onUpdateStage={handleUpdateStage}
            onMarcarListo={handleMarcarListo}
            currentUser={currentUser || DEFAULT_GUEST_USER}
          />
        )}

        {activeModule === 'facturacion' && (
          <FacturacionView
            pedidos={pedidos}
            cotizaciones={cotizaciones}
            facturasSinPedido={facturasSinPedido}
            onOpenPrintModalForPedido={handleOpenPrintModalForPedido}
            onOpenPrintModalForCotizacion={handleOpenPrintModalForCotizacion}
            onOpenPrintModalForFacturaSP={handleOpenPrintModalForFacturaSP}
            onConvertQuoteToOrder={handleConvertQuoteToOrder}
            onAddCotizacion={handleAddCotizacion}
            onAddFacturaSinPedido={handleAddFacturaSinPedido}
            permissions={permissions}
          />
        )}

        {activeModule === 'catalogo' && (
          <CatalogoView
            catalogo={catalogo}
            onAddProducto={handleAddProducto}
            onUpdateProducto={handleUpdateProducto}
            onDeleteProducto={handleDeleteProducto}
            onUpdatePrecios={handleUpdatePrecios}
            currentUser={currentUser || DEFAULT_GUEST_USER}
            permissions={permissions}
            inventario={inventario}
            onAddInsumo={handleAddInsumo}
            onUpdateInsumo={handleUpdateInsumo}
            onDeleteInsumo={handleDeleteInsumo}
            onAdjustStock={handleAdjustStock}
          />
        )}

        {activeModule === 'mayoristas' && (
          <MayoristasView
            mayoristas={mayoristas}
            onAddMayorista={handleAddMayorista}
            permissions={permissions}
          />
        )}

        {activeModule === 'cronograma' && (
          <CronogramaView
            pedidos={pedidos}
            onToggleConfirmacion={handleToggleConfirmacion}
            onUpdateFechaInstalacion={handleUpdateFechaInstalacion}
            currentUser={currentUser || DEFAULT_GUEST_USER}
            permissions={permissions}
            ordenesTrabajo={ordenesTrabajo}
            onAddOrdenTrabajo={handleAddOrdenTrabajo}
            onUpdateOrdenTrabajo={handleUpdateOrdenTrabajo}
            onDeleteOrdenTrabajo={handleDeleteOrdenTrabajo}
          />
        )}

        {activeModule === 'excelCloud' && (
          <ExcelCloudView
            logs={syncLogs}
            pedidos={pedidos}
            onTriggerSync={logCloudSync}
            permissions={permissions}
          />
        )}

        {activeModule === 'usuarios' && currentUser?.role === 'Administrador' && (
          <UsuariosView
            usuarios={usuarios}
            onAddUsuario={handleAddUsuario}
            onUpdateUsuario={handleUpdateUsuario}
            onDeleteUsuario={handleDeleteUsuario}
            onToggleEstadoUsuario={handleToggleEstadoUsuario}
            currentUser={currentUser}
          />
        )}

        {activeModule === 'resumenFinanciero' && (
          <ResumenFinancieroView
            pedidos={pedidos}
            cotizaciones={cotizaciones}
            facturasSinPedido={facturasSinPedido}
            currentUser={currentUser || DEFAULT_GUEST_USER}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#121212] border-t border-neutral-800 py-5 px-6 text-xs text-neutral-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e50914]"></span>
            <span className="font-black text-white tracking-wider">FALPRO <span className="text-xs text-neutral-400">S.A.S.</span></span>
            <span className="text-neutral-500">·</span>
            <span>Sistema Integrado de Fabricación · Lujos para vehículos</span>
          </div>
          <div className="text-[11px] text-neutral-400">
            Plataforma Multi-dispositivo (Escritorio, Tablet y Celular) · Canal Seguro de Réplica Activo
          </div>
        </div>
      </footer>

      {/* Floating Notification Toast Stack */}
      <NotificationToast
        toasts={toastQueue}
        onDismiss={handleDismissToast}
        onNavigate={handleNavigateFromNotification}
      />

      {/* Interactive Notification Center Popover */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAll}
        onDeleteNotification={handleDeleteNotification}
        onNavigateToModule={handleNavigateFromNotification}
        onOpenCreateReminder={() => setIsReminderModalOpen(true)}
      />

      {/* Create Reminder Modal */}
      <CreateReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        pedidos={pedidos}
        onAddNotification={(notif) => {
          setNotifications((prev) => [notif, ...prev]);
          setToastQueue((prev) => [...prev.slice(-3), notif]);
          playNotificationTone(notif.prioridad);
          sendBrowserNotification(notif);
        }}
      />

      {/* Global Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          if (currentUser) {
            setIsLoginModalOpen(false);
          }
        }}
        currentUser={currentUser}
        onLogin={(u) => {
          setCurrentUser(u);
          setIsLoginModalOpen(false);
        }}
        onRegisterUser={(newU) => {
          setUsuarios((prev) => {
            const exists = prev.some((x) => x.id === newU.id || x.user === newU.user);
            return exists ? prev : [...prev, newU];
          });
          setCurrentUser(newU);
          setIsLoginModalOpen(false);
          logCloudSync(`Usuario @${newU.user} registrado e ingresado`);
        }}
        onUpdateUser={handleUpdateUsuario}
        onLogout={handleLogout}
        existingUsers={usuarios}
      />

      <OrderFormModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSaveOrder={handleSaveOrder}
        catalogo={catalogo}
        currentUser={currentUser || DEFAULT_GUEST_USER}
        totalOrdersCount={pedidos.length}
      />

      <AbonosModal
        isOpen={!!selectedPedidoForAbono}
        onClose={() => setSelectedPedidoForAbono(null)}
        pedido={selectedPedidoForAbono}
        currentUser={currentUser || DEFAULT_GUEST_USER}
        onSaveAbono={handleSaveAbono}
        onDeleteAbono={handleDeleteAbono}
      />

      <InvoicePrintModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        pedido={invoicePedido}
        cotizacion={invoiceCotizacion}
        facturaSinPedido={invoiceFacturaSP}
      />

      {/* Floating Team Chat Launcher Dock */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
        <button
          onClick={() => setIsChatModalOpen(true)}
          className="p-3.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-2xl shadow-xl shadow-red-950/70 border border-red-500/40 flex items-center gap-2.5 transition-all hover:scale-105 cursor-pointer group"
          title="Abrir Chat de Taller y Usuarios FALPRO"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 group-hover:rotate-6 transition-transform" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-2.5 -right-2.5 min-w-[20px] h-5 px-1 bg-white text-red-700 text-[10px] font-black rounded-full flex items-center justify-center font-mono shadow-md animate-pulse">
                {unreadChatCount}
              </span>
            )}
          </div>
          <span className="text-xs font-black tracking-wide hidden sm:inline">
            Chat Taller
          </span>
        </button>
      </div>

      {/* User-to-User & Workshop Real-Time Chat Modal */}
      <ChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        currentUser={currentUser}
        allUsers={usuarios}
        pedidos={pedidos}
        connectedScreens={connectedScreens}
        onSelectPedido={(p) => {
          setIsChatModalOpen(false);
          setActiveModule('pedidos');
        }}
      />

      {/* WhatsApp Automation & QR Linking Modal */}
      <WhatsAppAutomationModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => {
          setIsWhatsAppModalOpen(false);
          fetch('/api/whatsapp/config')
            .then((r) => r.json())
            .then((data) => {
              if (data?.config?.connected !== undefined) {
                setIsWhatsAppConnected(Boolean(data.config.connected));
              }
            })
            .catch(() => {});
        }}
        pedidos={pedidos}
      />
    </div>
  );
}
