import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Check,
  X as XIcon,
  Lock,
  Key,
  Eye,
  EyeOff,
  Power,
  Trash2,
  AlertTriangle,
  Mail,
  ShieldAlert,
  Settings,
  LayoutDashboard,
  ShoppingCart,
  Hammer,
  Receipt,
  Layers,
  Building2,
  Calendar,
  CloudUpload,
  DollarSign,
  HelpCircle,
  Sliders,
  CheckSquare,
  Square,
} from 'lucide-react';
import { UserAccount, UserRole, RolePermissions, ActiveModule } from '../types';
import { ROLE_PERMISSIONS, DEFAULT_MODULES_BY_ROLE } from '../data/initialData';

interface UsuariosViewProps {
  usuarios: UserAccount[];
  onAddUsuario: (u: UserAccount) => void;
  onUpdateUsuario?: (u: UserAccount) => void;
  onDeleteUsuario?: (userId: string) => void;
  onToggleEstadoUsuario: (userId: string) => void;
  currentUser: UserAccount;
}

// Module configuration metadata for granular screen selection
interface ModuleMeta {
  id: ActiveModule;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const AVAILABLE_MODULES: ModuleMeta[] = [
  {
    id: 'dashboard',
    label: 'Dashboard Principal',
    icon: LayoutDashboard,
    description: 'Métricas generales, accesos rápidos y estado del taller',
  },
  {
    id: 'pedidos',
    label: 'Pedidos y Clientes',
    icon: ShoppingCart,
    description: 'Gestión de pedidos, registro de clientes y abonos',
  },
  {
    id: 'produccion',
    label: 'Producción (Taller)',
    icon: Hammer,
    description: 'Avance de fabricación en 6 etapas y control de ensamble',
  },
  {
    id: 'facturacion',
    label: 'Facturación y Cotizaciones',
    icon: Receipt,
    description: 'Emisión de cotizaciones, facturas directas y comprobantes',
  },
  {
    id: 'catalogo',
    label: 'Catálogo e Inventario',
    icon: Layers,
    description: 'Precios de accesorios inox e inventario de luces LED del taller',
  },
  {
    id: 'mayoristas',
    label: 'Clientes Mayoristas',
    icon: Building2,
    description: 'Directorio comercial de empresas aliadas y distribuidores',
  },
  {
    id: 'cronograma',
    label: 'Cronograma y Órdenes de Trabajo',
    icon: Calendar,
    description: 'Agenda de bahías, montaje y órdenes de trabajo (OT)',
  },
  {
    id: 'resumenFinanciero',
    label: 'Resumen Financiero y Ventas',
    icon: DollarSign,
    description: 'Balances totales por mes y año, recaudos y cartera pendiente',
  },
  {
    id: 'excelCloud',
    label: 'Nube Excel y Respaldo',
    icon: CloudUpload,
    description: 'Historial de sincronización y descarga de planillas Excel',
  },
  {
    id: 'usuarios',
    label: 'Gestión de Usuarios',
    icon: Users,
    description: 'Control de accesos y permisos (Solo Administrador)',
  },
];

// Operational function permissions metadata
interface PermissionMeta {
  key: keyof RolePermissions;
  label: string;
  desc: string;
}

const AVAILABLE_PERMISSIONS: PermissionMeta[] = [
  {
    key: 'consultar',
    label: 'Consultar Registros',
    desc: 'Visualizar pedidos, cotizaciones, inventario y catálogo.',
  },
  {
    key: 'crear',
    label: 'Crear Pedidos / Cotizaciones',
    desc: 'Registrar nuevos pedidos de clientes, cotizaciones y productos.',
  },
  {
    key: 'editar',
    label: 'Editar Pedidos y Registros',
    desc: 'Modificar datos de pedidos existentes, ítems y etapas.',
  },
  {
    key: 'eliminar',
    label: 'Eliminar Pedidos (Crítico)',
    desc: 'Borrar pedidos y registros de forma permanente del sistema.',
  },
  {
    key: 'facturar',
    label: 'Facturar y Cobrar Abonos',
    desc: 'Generar facturas de venta y registrar abonos en caja.',
  },
  {
    key: 'descargar',
    label: 'Descargar Excel y Reportes',
    desc: 'Exportar archivos CSV y planillas de control financiero.',
  },
  {
    key: 'imprimir',
    label: 'Imprimir Documentos',
    desc: 'Imprimir recibos de caja, facturas, comprobantes y órdenes de trabajo.',
  },
];

export const UsuariosView: React.FC<UsuariosViewProps> = ({
  usuarios,
  onAddUsuario,
  onUpdateUsuario,
  onDeleteUsuario,
  onToggleEstadoUsuario,
  currentUser,
}) => {
  // Modal states - start clean without prefilled values
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserForEditPerms, setSelectedUserForEditPerms] = useState<UserAccount | null>(null);

  // Add User Form states - all empty without initial values
  const [user, setUser] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Ventas');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [preguntaSeguridad, setPreguntaSeguridad] = useState('');
  const [respuestaSeguridad, setRespuestaSeguridad] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Granular permissions states for Add User
  const [selectedPermissions, setSelectedPermissions] = useState<RolePermissions>({
    consultar: true,
    crear: true,
    editar: true,
    eliminar: false,
    facturar: true,
    descargar: true,
    imprimir: true,
  });

  // Allowed screen modules for Add User
  const [selectedModules, setSelectedModules] = useState<ActiveModule[]>([
    'dashboard',
    'pedidos',
    'facturacion',
    'catalogo',
    'mayoristas',
    'resumenFinanciero',
  ]);

  // Edit Permissions Modal states
  const [editPermsRole, setEditPermsRole] = useState<UserRole>('Ventas');
  const [editPermsState, setEditPermsState] = useState<RolePermissions>({ ...ROLE_PERMISSIONS.Consulta });
  const [editModulesState, setEditModulesState] = useState<ActiveModule[]>([]);

  // Password change modal state
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // When base role changes in Add Modal, load sensible preset template but allow manual customization
  const handleRolePresetChange = (newRole: UserRole) => {
    setRole(newRole);
    setSelectedPermissions({ ...ROLE_PERMISSIONS[newRole] });
    setSelectedModules([...DEFAULT_MODULES_BY_ROLE[newRole]]);
  };

  // Toggle single permission for Add User
  const togglePermission = (key: keyof RolePermissions) => {
    setSelectedPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle single module for Add User
  const toggleModule = (modId: ActiveModule) => {
    setSelectedModules((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]
    );
  };

  // Toggle single permission for Edit Modal
  const toggleEditPermission = (key: keyof RolePermissions) => {
    setEditPermsState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle single module for Edit Modal
  const toggleEditModule = (modId: ActiveModule) => {
    setEditModulesState((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]
    );
  };

  // Open Edit Permissions Modal
  const handleOpenEditPerms = (targetUser: UserAccount) => {
    setSelectedUserForEditPerms(targetUser);
    setEditPermsRole(targetUser.role);
    setEditPermsState(
      targetUser.permissions
        ? { ...targetUser.permissions }
        : { ...(ROLE_PERMISSIONS[targetUser.role] || ROLE_PERMISSIONS.Consulta) }
    );
    setEditModulesState(
      targetUser.modulosPermitidos && targetUser.modulosPermitidos.length > 0
        ? [...targetUser.modulosPermitidos]
        : [...(DEFAULT_MODULES_BY_ROLE[targetUser.role] || ['dashboard', 'pedidos'])]
    );
  };

  // Save edited permissions and modules
  const handleSaveEditedPerms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEditPerms || !onUpdateUsuario) return;

    // Must select at least one screen module
    if (editModulesState.length === 0) {
      alert('Debe seleccionar al menos una pantalla o módulo visible para el usuario.');
      return;
    }

    const updated: UserAccount = {
      ...selectedUserForEditPerms,
      role: editPermsRole,
      permissions: editPermsState,
      modulosPermitidos: editModulesState,
      updated: `${new Date().toLocaleDateString()} (Permisos configurados)`,
    };

    onUpdateUsuario(updated);
    setSelectedUserForEditPerms(null);
  };

  // Save new user
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (currentUser.role !== 'Administrador') {
      setErrorMsg('Operación denegada: únicamente el Administrador puede crear nuevos usuarios.');
      return;
    }

    const cleanUser = user.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUser) {
      setErrorMsg('El nombre de usuario es obligatorio.');
      return;
    }

    if (usuarios.some((u) => u.user.toLowerCase() === cleanUser)) {
      setErrorMsg('Este nombre de usuario ya está registrado. Elija otro.');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    if (selectedModules.length === 0) {
      setErrorMsg('Seleccione al menos una pantalla que aparecerá al usuario.');
      return;
    }

    const newUsr: UserAccount = {
      id: 'usr-' + Date.now(),
      user: cleanUser,
      nombre: nombre.trim() || cleanUser,
      role,
      password,
      correo: email.trim() || undefined,
      preguntaSeguridad: preguntaSeguridad.trim() || undefined,
      respuestaSeguridad: respuestaSeguridad.trim() || undefined,
      estado: 'Activo',
      updated: `${new Date().toLocaleDateString()} (por ${currentUser.nombre})`,
      permissions: selectedPermissions,
      modulosPermitidos: selectedModules,
    };

    onAddUsuario(newUsr);
    setShowAddModal(false);

    // Reset fields to empty values
    setUser('');
    setNombre('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPreguntaSeguridad('');
    setRespuestaSeguridad('');
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword) return;

    if (!newPassword || newPassword.length < 4) {
      alert('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    if (onUpdateUsuario) {
      onUpdateUsuario({
        ...selectedUserForPassword,
        password: newPassword,
        updated: `${new Date().toLocaleDateString()} (Clave actualizada)`,
      });
    }

    setPasswordChangeSuccess(true);
    setTimeout(() => {
      setPasswordChangeSuccess(false);
      setSelectedUserForPassword(null);
      setNewPassword('');
      setConfirmNewPassword('');
    }, 1200);
  };

  const rolesList: UserRole[] = [
    'Administrador',
    'Ventas',
    'Producción',
    'Instalación/Envíos',
    'Mayoristas',
    'Consulta',
  ];

  if (currentUser.role !== 'Administrador') {
    return (
      <div className="p-8 bg-[#141414] border border-red-900/40 rounded-2xl text-center max-w-lg mx-auto space-y-4 my-12 animate-in fade-in">
        <div className="w-14 h-14 bg-red-950/60 rounded-2xl flex items-center justify-center mx-auto border border-red-800 text-[#e50914]">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-white uppercase font-mono">
          Acceso Restringido a Administrador
        </h2>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Únicamente el Usuario Principal con rol de Administrador tiene autorización para crear y gestionar cuentas de usuario en el sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900/80 p-5 rounded-2xl border border-neutral-800 shadow-lg">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 font-mono">
            <span className="w-2.5 h-6 bg-[#e50914] rounded-sm"></span>
            USUARIOS, FUNCIONES Y CONTROL DE PANTALLAS
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Configure las funciones operativas una por una y seleccione exactamente qué pestañas aparecerán en la pantalla de cada colaborador.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setErrorMsg('');
              setUser('');
              setNombre('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setPreguntaSeguridad('');
              setRespuestaSeguridad('');
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-[#e50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-900/40 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Crear Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#141414] border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#e50914]" /> Cuentas Registradas en FALPRO ({usuarios.length})
          </h2>
          <span className="text-xs text-neutral-500 font-mono">Panel de Control de Acceso</span>
        </div>

        {usuarios.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center mx-auto border border-neutral-800 text-[#e50914]">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white">No hay usuarios registrados</div>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Cree el primer usuario con sus funciones específicas y módulos de pantalla seleccionados.
            </p>
            <button
              onClick={() => {
                setErrorMsg('');
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-[#e50914] text-white rounded-lg text-xs font-bold shadow-md shadow-red-900/30 hover:bg-[#b80710] transition inline-flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Registrar Usuario
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-neutral-900 text-neutral-300 uppercase text-[10px] font-bold">
                <tr className="border-b border-neutral-800">
                  <th className="p-3">Usuario</th>
                  <th className="p-3">Nombre y Cargo</th>
                  <th className="p-3">Rol Base</th>
                  <th className="p-3">Funciones Permitidas (1 a 1)</th>
                  <th className="p-3">Pantallas Visibles</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {usuarios.map((u) => {
                  const perms = u.permissions || ROLE_PERMISSIONS[u.role] || ROLE_PERMISSIONS.Consulta;
                  const modules =
                    u.modulosPermitidos && u.modulosPermitidos.length > 0
                      ? u.modulosPermitidos
                      : DEFAULT_MODULES_BY_ROLE[u.role] || ['dashboard', 'pedidos'];
                  const isActive = u.estado === 'Activo';
                  const isCurrent = u.id === currentUser.id || u.user === currentUser.user;
                  const isPrimary = u.user === 'admin' || u.id === 'usr-admin-principal';

                  return (
                    <tr key={u.id} className="hover:bg-neutral-900/50 transition">
                      {/* Username */}
                      <td className="p-3 font-mono font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>@{u.user}</span>
                          {isPrimary && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-950 text-red-300 border border-red-800 font-sans font-bold">
                              Principal
                            </span>
                          )}
                          {isCurrent && !isPrimary && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-neutral-800 text-neutral-400 border border-neutral-700">
                              Usted
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="p-3 font-semibold text-neutral-200">
                        {u.nombre}
                        {u.correo && (
                          <div className="text-[10px] text-neutral-500 font-normal">{u.correo}</div>
                        )}
                      </td>

                      {/* Base Role */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-[#e50914]/90 text-white shadow-sm">
                          {u.role}
                        </span>
                      </td>

                      {/* Individual Operational Functions */}
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {perms.consultar && (
                            <span className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded text-[9px] font-medium border border-neutral-700">
                              Consultar
                            </span>
                          )}
                          {perms.crear && (
                            <span className="px-1.5 py-0.5 bg-green-950/80 text-green-300 rounded text-[9px] font-bold border border-green-800">
                              Crear
                            </span>
                          )}
                          {perms.editar && (
                            <span className="px-1.5 py-0.5 bg-blue-950/80 text-blue-300 rounded text-[9px] font-bold border border-blue-800">
                              Editar
                            </span>
                          )}
                          {perms.facturar && (
                            <span className="px-1.5 py-0.5 bg-amber-950/80 text-amber-300 rounded text-[9px] font-bold border border-amber-800">
                              Facturar
                            </span>
                          )}
                          {perms.eliminar && (
                            <span className="px-1.5 py-0.5 bg-red-950/80 text-red-300 rounded text-[9px] font-bold border border-red-800">
                              Eliminar
                            </span>
                          )}
                          {perms.descargar && (
                            <span className="px-1.5 py-0.5 bg-purple-950/80 text-purple-300 rounded text-[9px] font-medium border border-purple-800">
                              Excel
                            </span>
                          )}
                          {perms.imprimir && (
                            <span className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded text-[9px] font-medium border border-neutral-700">
                              Imprimir
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Visible Screen Modules */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-neutral-800 text-emerald-400 border border-neutral-700 rounded text-[10px] font-mono font-bold">
                            {modules.length} {modules.length === 1 ? 'pantalla' : 'pantallas'}
                          </span>
                          <span className="text-[10px] text-neutral-400 truncate max-w-[160px]" title={modules.join(', ')}>
                            {modules.slice(0, 3).join(', ')}
                            {modules.length > 3 ? '...' : ''}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isActive
                              ? 'bg-green-950 text-green-300 border border-green-800'
                              : 'bg-red-950 text-red-400 border border-red-900'
                          }`}
                        >
                          {u.estado}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Granular permissions & screens button */}
                          <button
                            onClick={() => handleOpenEditPerms(u)}
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded border border-neutral-700 transition cursor-pointer"
                            title="Editar funciones operativas y pantallas visibles"
                          >
                            <Sliders className="w-3.5 h-3.5 text-blue-400" />
                          </button>

                          {/* Change password button */}
                          <button
                            onClick={() => {
                              setSelectedUserForPassword(u);
                              setNewPassword('');
                              setConfirmNewPassword('');
                            }}
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded border border-neutral-700 transition cursor-pointer"
                            title="Cambiar contraseña"
                          >
                            <Key className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          {/* Toggle Active/Suspended */}
                          {!isPrimary && (
                            <button
                              onClick={() => onToggleEstadoUsuario(u.id)}
                              className={`p-1.5 rounded transition cursor-pointer ${
                                isActive
                                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700'
                                  : 'bg-green-950 hover:bg-green-900 text-green-300 border border-green-800'
                              }`}
                              title={isActive ? 'Suspender cuenta' : 'Activar cuenta'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          {onDeleteUsuario && !isPrimary && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `¿Está seguro de eliminar permanentemente la cuenta de @${u.user} (${u.nombre})?`
                                  )
                                ) {
                                  onDeleteUsuario(u.id);
                                }
                              }}
                              className="p-1.5 bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 rounded border border-neutral-700 transition cursor-pointer"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: CREAR NUEVO USUARIO CON CONFIGURACIÓN DE FUNCIONES Y PANTALLAS */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-white my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-950 border border-red-800 rounded-lg text-[#e50914]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                    Crear Nuevo Usuario y Configurar Pantalla
                  </h3>
                  <p className="text-[10px] text-neutral-400">
                    Defina credenciales, active funciones una a una y elija las pestañas visibles
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} autoComplete="off" className="space-y-4">
              {/* Bloque 1: Datos de Acceso */}
              <div className="bg-neutral-900/70 p-3.5 rounded-xl border border-neutral-800 space-y-3">
                <span className="text-[11px] font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e50914]"></span>
                  1. Datos de Identificación y Acceso (Campos en blanco)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-neutral-400 mb-1">
                      Nombre de Usuario (Login)*
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-neutral-500 font-mono text-xs">@</span>
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
                        placeholder="ej. jperez"
                        className="w-full bg-neutral-950 border border-neutral-700 pl-8 pr-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-neutral-400 mb-1">
                      Nombre Completo y Cargo*
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Juan Pérez - Técnico Soldadura"
                      className="w-full bg-neutral-950 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-neutral-400 mb-1">
                      Contraseña*
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2 text-neutral-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="w-full bg-neutral-950 border border-neutral-700 pl-8 pr-8 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2 text-neutral-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-neutral-400 mb-1">
                      Confirmar Contraseña*
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2 text-neutral-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita la contraseña"
                        className="w-full bg-neutral-950 border border-neutral-700 pl-8 pr-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-neutral-400 mb-1">
                      Correo Electrónico (Opcional)
                    </label>
                    <input
                      type="email"
                      autoComplete="off"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@falpro.com"
                      className="w-full bg-neutral-950 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-neutral-400 mb-1">
                      Rol Base de Referencia
                    </label>
                    <select
                      value={role}
                      onChange={(e) => handleRolePresetChange(e.target.value as UserRole)}
                      className="w-full bg-neutral-950 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                    >
                      {rolesList.map((r) => (
                        <option key={r} value={r}>
                          {r} (Cargar plantilla)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Funciones Operativas (Una por Una) */}
              <div className="bg-neutral-900/70 p-3.5 rounded-xl border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    2. Funciones Operativas Permitidas (Seleccionar una por una)
                  </span>
                  <div className="flex gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPermissions({
                          consultar: true,
                          crear: true,
                          editar: true,
                          eliminar: true,
                          facturar: true,
                          descargar: true,
                          imprimir: true,
                        })
                      }
                      className="text-blue-400 hover:underline cursor-pointer"
                    >
                      Todas
                    </button>
                    <span className="text-neutral-600">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPermissions({
                          consultar: true,
                          crear: false,
                          editar: false,
                          eliminar: false,
                          facturar: false,
                          descargar: false,
                          imprimir: false,
                        })
                      }
                      className="text-neutral-400 hover:underline cursor-pointer"
                    >
                      Solo Consulta
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = selectedPermissions[perm.key];
                    return (
                      <label
                        key={perm.key}
                        onClick={() => togglePermission(perm.key)}
                        className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition cursor-pointer select-none ${
                          isChecked
                            ? 'bg-blue-950/40 border-blue-600/60 text-white'
                            : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent onClick
                          className="mt-0.5 rounded text-[#e50914] focus:ring-0 bg-neutral-900 border-neutral-700 cursor-pointer"
                        />
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1">
                            <span>{perm.label}</span>
                            {perm.key === 'eliminar' && (
                              <span className="text-[9px] text-[#e50914] bg-red-950 px-1 py-0.2 rounded border border-red-900">
                                Restringido
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                            {perm.desc}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Bloque 3: Pantallas y Módulos Visibles (Lo que le aparecerá en pantalla) */}
              <div className="bg-neutral-900/70 p-3.5 rounded-xl border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    3. Pantallas que le aparecerán al usuario ({selectedModules.length} seleccionadas)
                  </span>
                  <div className="flex gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedModules(AVAILABLE_MODULES.map((m) => m.id))
                      }
                      className="text-emerald-400 hover:underline cursor-pointer"
                    >
                      Todas las pantallas
                    </button>
                    <span className="text-neutral-600">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedModules(['dashboard', 'pedidos'])}
                      className="text-neutral-400 hover:underline cursor-pointer"
                    >
                      Básicas
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {AVAILABLE_MODULES.map((mod) => {
                    const isVisible = selectedModules.includes(mod.id);
                    const Icon = mod.icon;
                    return (
                      <label
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={`p-2.5 rounded-lg border flex items-center justify-between transition cursor-pointer select-none ${
                          isVisible
                            ? 'bg-emerald-950/30 border-emerald-600/60 text-white'
                            : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:border-neutral-700 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-1.5 rounded-md ${
                              isVisible
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-neutral-900 text-neutral-500'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs">{mod.label}</div>
                            <div className="text-[9px] text-neutral-400 leading-tight">
                              {mod.description}
                            </div>
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => {}}
                          className="rounded text-emerald-500 focus:ring-0 bg-neutral-900 border-neutral-700 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-bold shadow-lg shadow-red-900/40 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Guardar y Asignar Pantallas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR PERMISOS Y PANTALLAS DE USUARIO EXISTENTE */}
      {selectedUserForEditPerms && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-white my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-950 border border-blue-800 rounded-lg text-blue-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                    Editar Funciones y Pantallas · @{selectedUserForEditPerms.user}
                  </h3>
                  <p className="text-[10px] text-neutral-400">
                    {selectedUserForEditPerms.nombre} ({selectedUserForEditPerms.role})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForEditPerms(null)}
                className="text-neutral-400 hover:text-white cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedPerms} className="space-y-4">
              {/* Rol Base */}
              <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-white uppercase">Rol Base</label>
                  <p className="text-[10px] text-neutral-400">Determina el perfil general del usuario</p>
                </div>
                <select
                  value={editPermsRole}
                  onChange={(e) => setEditPermsRole(e.target.value as UserRole)}
                  className="bg-neutral-950 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#e50914]"
                >
                  {rolesList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Funciones Operativas */}
              <div className="bg-neutral-900/70 p-3.5 rounded-xl border border-neutral-800 space-y-2.5">
                <span className="text-[11px] font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  Funciones Operativas Asignadas
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = editPermsState[perm.key];
                    return (
                      <label
                        key={perm.key}
                        onClick={() => toggleEditPermission(perm.key)}
                        className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition cursor-pointer select-none ${
                          isChecked
                            ? 'bg-blue-950/40 border-blue-600/60 text-white'
                            : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-[#e50914] focus:ring-0 bg-neutral-900 border-neutral-700 cursor-pointer"
                        />
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1">
                            <span>{perm.label}</span>
                            {perm.key === 'eliminar' && (
                              <span className="text-[9px] text-[#e50914] bg-red-950 px-1 py-0.2 rounded border border-red-900">
                                Restringido
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                            {perm.desc}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Pantallas Visibles */}
              <div className="bg-neutral-900/70 p-3.5 rounded-xl border border-neutral-800 space-y-2.5">
                <span className="text-[11px] font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  Pantallas que le aparecerán ({editModulesState.length} activas)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {AVAILABLE_MODULES.map((mod) => {
                    const isVisible = editModulesState.includes(mod.id);
                    const Icon = mod.icon;
                    return (
                      <label
                        key={mod.id}
                        onClick={() => toggleEditModule(mod.id)}
                        className={`p-2.5 rounded-lg border flex items-center justify-between transition cursor-pointer select-none ${
                          isVisible
                            ? 'bg-emerald-950/30 border-emerald-600/60 text-white'
                            : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:border-neutral-700 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-1.5 rounded-md ${
                              isVisible
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-neutral-900 text-neutral-500'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs">{mod.label}</div>
                            <div className="text-[9px] text-neutral-400 leading-tight">
                              {mod.description}
                            </div>
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => {}}
                          className="rounded text-emerald-500 focus:ring-0 bg-neutral-900 border-neutral-700 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setSelectedUserForEditPerms(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-bold shadow-lg shadow-red-900/40 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Actualizar Permisos y Pantallas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CAMBIAR CONTRASEÑA */}
      {selectedUserForPassword && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-neutral-800 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" /> CAMBIAR CONTRASEÑA
              </h3>
              <button
                onClick={() => setSelectedUserForPassword(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              Modificando clave para: <strong className="text-white">@{selectedUserForPassword.user}</strong> ({selectedUserForPassword.nombre})
            </p>

            {passwordChangeSuccess && (
              <div className="p-2.5 rounded bg-green-950/80 border border-green-800 text-green-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>¡Contraseña actualizada exitosamente!</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Nueva Contraseña*
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full bg-neutral-900 border border-neutral-700 pl-8 pr-8 py-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Confirmar Nueva Contraseña*
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repita la clave"
                    className="w-full bg-neutral-900 border border-neutral-700 pl-8 pr-3 py-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setSelectedUserForPassword(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold cursor-pointer"
                >
                  Guardar Nueva Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
