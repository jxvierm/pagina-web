import {
  Pedido,
  CatalogoProducto,
  Mayorista,
  Cotizacion,
  FacturaSinPedido,
  UserAccount,
  UserRole,
  RolePermissions,
  SyncLog,
  AppNotification,
} from '../types';

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  Administrador: {
    consultar: true,
    crear: true,
    editar: true,
    eliminar: true,
    facturar: true,
    descargar: true,
    imprimir: true,
  },
  Ventas: {
    consultar: true,
    crear: true,
    editar: true,
    eliminar: false,
    facturar: true,
    descargar: true,
    imprimir: true,
  },
  Producción: {
    consultar: true,
    crear: false,
    editar: true,
    eliminar: false,
    facturar: false,
    descargar: false,
    imprimir: true,
  },
  'Instalación/Envíos': {
    consultar: true,
    crear: false,
    editar: true,
    eliminar: false,
    facturar: false,
    descargar: false,
    imprimir: true,
  },
  Mayoristas: {
    consultar: true,
    crear: true,
    editar: false,
    eliminar: false,
    facturar: false,
    descargar: true,
    imprimir: true,
  },
  Consulta: {
    consultar: true,
    crear: false,
    editar: false,
    eliminar: false,
    facturar: false,
    descargar: false,
    imprimir: true,
  },
};

// All mock/demo data removed - platform starts completely clean from zero
export const INITIAL_CATALOGO: CatalogoProducto[] = [];

export const INITIAL_PEDIDOS: Pedido[] = [];

export const INITIAL_MAYORISTAS: Mayorista[] = [];

export const INITIAL_COTIZACIONES: Cotizacion[] = [];

export const INITIAL_USUARIOS: UserAccount[] = [];

export const INITIAL_SYNCLOGS: SyncLog[] = [];

export const INITIAL_NOTIFICACIONES: AppNotification[] = [];

// Local storage key helpers
const STORAGE_PREFIX = 'falpro_app_data_';

export function loadStoredData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

export function saveStoredData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}
