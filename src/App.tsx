import React, { useState, useEffect } from 'react';
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
} from './types';
import {
  INITIAL_PEDIDOS,
  INITIAL_CATALOGO,
  INITIAL_MAYORISTAS,
  INITIAL_COTIZACIONES,
  INITIAL_USUARIOS,
  INITIAL_SYNCLOGS,
  INITIAL_NOTIFICACIONES,
  ROLE_PERMISSIONS,
  loadStoredData,
  saveStoredData,
} from './data/initialData';
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
    return loadStoredData<UserAccount[]>('usuarios_v4', loadStoredData<UserAccount[]>('usuarios_v3', INITIAL_USUARIOS));
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
  const [selectedPedidoForAbono, setSelectedPedidoForAbono] = useState<Pedido | null>(null);

  // Printable invoice modal state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoicePedido, setInvoicePedido] = useState<Pedido | null>(null);
  const [invoiceCotizacion, setInvoiceCotizacion] = useState<Cotizacion | null>(null);
  const [invoiceFacturaSP, setInvoiceFacturaSP] = useState<FacturaSinPedido | null>(null);

  // Register service worker on mount and ensure session is cleared so reload requires login
  useEffect(() => {
    registerNotificationServiceWorker();
    try {
      localStorage.removeItem('falpro_app_data_currentUser_v3');
      localStorage.removeItem('falpro_app_data_currentUser_v4');
    } catch {}
  }, []);

  useEffect(() => {
    saveStoredData('pedidos_v4', pedidos);
  }, [pedidos]);

  useEffect(() => {
    saveStoredData('catalogo_v4', catalogo);
  }, [catalogo]);

  useEffect(() => {
    saveStoredData('mayoristas_v4', mayoristas);
  }, [mayoristas]);

  useEffect(() => {
    saveStoredData('cotizaciones_v4', cotizaciones);
  }, [cotizaciones]);

  useEffect(() => {
    saveStoredData('facturasSinPedido_v4', facturasSinPedido);
  }, [facturasSinPedido]);

  useEffect(() => {
    saveStoredData('usuarios_v4', usuarios);
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

  // Current Permissions
  const permissions =
    (currentUser && ROLE_PERMISSIONS[currentUser.role]) || ROLE_PERMISSIONS.Consulta;
  const unreadNotificationsCount = notifications.filter((n) => !n.leida).length;

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
  };

  const handleUpdateOrderStatus = (pedidoId: string, nuevoEstado: PedidoEstado) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
    );
    logCloudSync(`Estado de pedido ${pedidoId} actualizado a "${nuevoEstado}"`);

    triggerNotification({
      tipo: 'produccion',
      titulo: `Estado de Pedido Actualizado`,
      mensaje: `El pedido ${pedidoId} fue marcado en estado "${nuevoEstado}".`,
      leida: false,
      prioridad: nuevoEstado === 'Listo para Instalación' ? 'alta' : 'normal',
      pedidoId,
      moduloDestino: 'pedidos',
    });
  };

  const handleDeleteOrder = (pedidoId: string) => {
    setPedidos((prev) => prev.filter((p) => p.id !== pedidoId));
    logCloudSync(`Pedido ${pedidoId} cancelado y removido de la base activa`);
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

  // Handlers for Users
  const handleAddUsuario = (newUsr: UserAccount) => {
    setUsuarios((prev) => [...prev, newUsr]);
    logCloudSync(`Nuevo usuario creado en sistema: @${newUsr.user} (${newUsr.role})`);
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
      {/* Top Bar Navigation with Notification Bell */}
      <Navbar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        currentUser={currentUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
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
            onDeleteOrder={handleDeleteOrder}
            permissions={permissions}
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
    </div>
  );
}
