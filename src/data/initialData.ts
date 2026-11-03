import {
  Pedido,
  CatalogoProducto,
  Mayorista,
  Cotizacion,
  FacturaSinPedido,
  UserAccount,
  UserRole,
  RolePermissions,
  ActiveModule,
  SyncLog,
  AppNotification,
  InsumoInventario,
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

export const DEFAULT_MODULES_BY_ROLE: Record<UserRole, ActiveModule[]> = {
  Administrador: [
    'dashboard',
    'pedidos',
    'produccion',
    'facturacion',
    'catalogo',
    'mayoristas',
    'cronograma',
    'resumenFinanciero',
    'excelCloud',
    'usuarios',
  ],
  Ventas: [
    'dashboard',
    'pedidos',
    'facturacion',
    'catalogo',
    'mayoristas',
    'resumenFinanciero',
  ],
  Producción: [
    'dashboard',
    'pedidos',
    'produccion',
    'cronograma',
    'catalogo',
  ],
  'Instalación/Envíos': [
    'dashboard',
    'pedidos',
    'cronograma',
    'produccion',
  ],
  Mayoristas: [
    'dashboard',
    'pedidos',
    'catalogo',
    'mayoristas',
  ],
  Consulta: [
    'dashboard',
    'pedidos',
    'catalogo',
  ],
};

// All collections start clean from zero without initial hardcoded values
export const INITIAL_CATALOGO: CatalogoProducto[] = [];

export const INITIAL_PEDIDOS: Pedido[] = [];

export const INITIAL_MAYORISTAS: Mayorista[] = [];

export const INITIAL_COTIZACIONES: Cotizacion[] = [];

export const DEFAULT_PRIMARY_USER: UserAccount = {
  id: 'usr-admin-principal',
  user: 'admin',
  nombre: 'Administrador Principal FALPRO',
  role: 'Administrador',
  estado: 'Activo',
  password: 'admin',
  correo: 'javiermartinz0132@gmail.com',
  preguntaSeguridad: '¿En qué municipio está la planta principal de FALPRO?',
  respuestaSeguridad: 'Chocontá',
  updated: '26/10/26',
  permissions: {
    consultar: true,
    crear: true,
    editar: true,
    eliminar: true,
    facturar: true,
    descargar: true,
    imprimir: true,
  },
  modulosPermitidos: [
    'dashboard',
    'pedidos',
    'produccion',
    'facturacion',
    'catalogo',
    'mayoristas',
    'cronograma',
    'resumenFinanciero',
    'excelCloud',
    'usuarios',
  ],
};

export const INITIAL_USUARIOS: UserAccount[] = [DEFAULT_PRIMARY_USER];

export const INITIAL_INVENTARIO: InsumoInventario[] = [];

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
