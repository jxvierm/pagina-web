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
  permissions?: RolePermissions;
  modulosPermitidos?: ActiveModule[];
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
  cant: number | '';
  vUnit: number | '';
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
  fechaEntrega?: string;
  whatsappNotificado?: boolean;
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
  | 'resumenFinanciero'
  | 'excelCloud'
  | 'usuarios';

export type NotificationType =
  | 'nuevo_pedido'
  | 'produccion'
  | 'cronograma'
  | 'recordatorio'
  | 'pago'
  | 'sistema'
  | 'inventario'
  | 'whatsapp'
  | 'chat';

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

export type CategoriaInsumo =
  | 'Luces LED'
  | 'Insumos Taller'
  | 'Abrasivos y Pulido'
  | 'Soldadura y Gases'
  | 'Tornillería y Fijación';

export interface InsumoInventario {
  id: string;
  nombre: string;
  categoria: CategoriaInsumo;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string; // 'Und', 'Metros', 'Rollos', 'Tubos', 'Kg', 'Kits'
  ubicacion?: string;
  costoUnitario?: number;
  ultimaReposicion?: string;
  notas?: string;
}

export type EstadoOrdenTrabajo =
  | 'Pendiente'
  | 'En Bahía / En Proceso'
  | 'Control de Calidad'
  | 'Finalizada'
  | 'Cancelada';

export type TipoTrabajoOT =
  | 'Instalación de Lujos Inox'
  | 'Instalación Eléctrica / Módulos LED'
  | 'Montaje Completo (Acero + Luces)'
  | 'Ajuste / Mantenimiento en Bahía'
  | 'Embalaje y Despacho';

export interface TareaOrdenTrabajo {
  id: string;
  descripcion: string;
  completada: boolean;
  responsable?: string;
  tiempoEstimadoMin?: number;
}

export interface ControlCalidadOT {
  fijacionMecanica: boolean;
  pruebaElectrica: boolean;
  brilladoLimpieza: boolean;
  aprobadoPor?: string;
}

export interface OrdenTrabajo {
  id: string;
  pedidoId?: string;
  cliente: string;
  telefono: string;
  vehiculo: string;
  placa?: string;
  bahia: string;
  fechaCreacion: string;
  fechaProgramada: string;
  horaProgramada?: string;
  tecnicoLider: string;
  tipoTrabajo: TipoTrabajoOT;
  prioridad: 'Normal' | 'Alta' | 'Urgente';
  estado: EstadoOrdenTrabajo;
  materiales?: string;
  observaciones?: string;
  tareas: TareaOrdenTrabajo[];
  controlCalidad?: ControlCalidadOT;
  kilometraje?: string;
}

export type ChatChannelType = 'general' | 'produccion' | 'ventas' | 'instalacion' | 'direct';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  channelId: string; // 'general' | 'produccion' | 'ventas' | 'instalacion' | 'dm_${userId1}_${userId2}'
  recipientId?: string; // For 1-on-1 direct messages
  recipientName?: string;
  texto: string;
  timestamp: number;
  fecha: string;
  adjuntoFoto?: string | null;
  pedidoIdRef?: string | null;
  placaRef?: string | null;
  reactions?: Record<string, string[]>; // emoji -> array of usernames
  leidoPor?: string[]; // user IDs who have seen the message
}

export interface ChatChannel {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: ChatChannelType;
  icono?: string;
  badge?: number;
  miembros?: string[];
}



