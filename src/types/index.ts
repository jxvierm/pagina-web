export type UserRole =
  | 'Administrador'
  | 'Ventas'
  | 'Producción'
  | 'Instalación/Envíos'
  | 'Mayoristas'
  | 'Consulta';

export interface RolePermissions {
  consultar: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
  facturar: boolean;
  descargar: boolean;
  imprimir: boolean;
}

export interface UserAccount {
  id: string;
  user: string;
  nombre: string;
  role: UserRole;
  estado: 'Activo' | 'Suspendido';
  password?: string;
  correo?: string;
  preguntaSeguridad?: string;
  respuestaSeguridad?: string;
  updated: string;
}

export type EtapaEstado = 'Pendiente' | 'En proceso' | 'Completado' | 'No aplica' | 'Bloqueado';

export interface EtapaInfo {
  estado: EtapaEstado;
  resp: string;
  fecha: string;
  obs: string;
}

export type EtapasKeys = 'corte' | 'doblado' | 'soldado' | 'pulido' | 'brillado' | 'alistado';

export interface OrderItem {
  id: string;
  producto: string;
  desc: string;
  cant: number;
  vUnit: number;
  total: number;
  categoria?: 'Aceros' | 'Luces' | 'Otro';
}

export interface Abono {
  id: string;
  fecha: string;
  monto: number;
  metodo: string;
  comprobante: string;
  usuario: string;
}

export type PedidoEstado =
  | 'Pendiente'
  | 'En Fabricación'
  | 'Listo para Instalación'
  | 'Entregado'
  | 'Cancelado';

export interface Pedido {
  id: string;
  fecha: string;
  cliente: string;
  telefono: string;
  vehiculo: string;
  placa?: string;
  tipoCliente: 'minorista' | 'mayorista';
  vendedor: string;
  llevaLuces: boolean;
  voltaje?: '12V' | '24V' | '';
  colorLogos?: string;
  observaciones: string;
  fotoRef?: string | null;
  estado: PedidoEstado;
  avance: number;
  etapas: Record<EtapasKeys, EtapaInfo>;
  items: OrderItem[];
  total: number;
  abonos: Abono[];
  saldo: number;
  instalacion: {
    fecha: string;
    confirmada: boolean;
    bahia?: string;
    notas?: string;
  };
}

export interface CatalogoProducto {
  id: string;
  nombre: string;
  categoria: 'Aceros' | 'Luces';
  desc: string;
  pMinorista: number;
  pMayorista: number;
  updated: string;
  imagen?: string;
}

export interface Mayorista {
  id: string;
  nit: string;
  empresa: string;
  contacto: string;
  tel: string;
  dir: string;
  lista: string;
  saldoTotal: number;
}

export interface Cotizacion {
  id: string;
  cliente: string;
  tel: string;
  vehiculo: string;
  placa?: string;
  total: number;
  vigencia: string;
  estado: 'Pendiente' | 'Aprobada' | 'Convertida' | 'Rechazada';
  items: OrderItem[];
  fecha: string;
  observaciones?: string;
}

export interface FacturaSinPedido {
  id: string;
  fecha: string;
  cliente: string;
  nitOCedula: string;
  telefono: string;
  items: OrderItem[];
  subtotal: number;
  impuesto: number;
  total: number;
  abono: number;
  saldo: number;
  metodoPago: string;
  notas: string;
}

export interface SyncLog {
  id: string;
  fecha: string;
  msg: string;
  estado: 'OK' | 'ALERTA';
}

export type ActiveModule =
  | 'dashboard'
  | 'pedidos'
  | 'produccion'
  | 'facturacion'
  | 'catalogo'
  | 'mayoristas'
  | 'cronograma'
  | 'excelCloud'
  | 'usuarios';

export type NotificationType =
  | 'nuevo_pedido'
  | 'produccion'
  | 'cronograma'
  | 'recordatorio'
  | 'pago'
  | 'sistema';

export type NotificationPriority = 'normal' | 'alta' | 'urgente';

export interface AppNotification {
  id: string;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  fecha: string;
  timestamp: number;
  leida: boolean;
  prioridad: NotificationPriority;
  pedidoId?: string;
  moduloDestino?: ActiveModule;
}

