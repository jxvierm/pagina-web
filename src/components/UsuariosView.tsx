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
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { ROLE_PERMISSIONS } from '../data/initialData';

interface UsuariosViewProps {
  usuarios: UserAccount[];
  onAddUsuario: (u: UserAccount) => void;
  onUpdateUsuario?: (u: UserAccount) => void;
  onDeleteUsuario?: (userId: string) => void;
  onToggleEstadoUsuario: (userId: string) => void;
  currentUser: UserAccount;
}

export const UsuariosView: React.FC<UsuariosViewProps> = ({
  usuarios,
  onAddUsuario,
  onUpdateUsuario,
  onDeleteUsuario,
  onToggleEstadoUsuario,
  currentUser,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [user, setUser] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Ventas');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [preguntaSeguridad, setPreguntaSeguridad] = useState('¿En qué municipio está la planta principal de FALPRO?');
  const [respuestaSeguridad, setRespuestaSeguridad] = useState('Chocontá');
  const [errorMsg, setErrorMsg] = useState('');

  // Password change modal state
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

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

    const newUsr: UserAccount = {
      id: 'usr-' + Date.now(),
      user: cleanUser,
      nombre: nombre.trim() || cleanUser,
      role,
      password,
      correo: email.trim() || undefined,
      preguntaSeguridad,
      respuestaSeguridad: respuestaSeguridad.trim() || 'Chocontá',
      estado: 'Activo',
      updated: `${new Date().toLocaleDateString()} (por ${currentUser.nombre})`,
    };

    onAddUsuario(newUsr);
    setShowAddModal(false);
    setUser('');
    setNombre('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole('Ventas');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-6 bg-[#e50914] rounded-sm"></span>
            USUARIOS, CONTRASEÑAS Y PERMISOS (RBAC)
          </h1>
          <p className="text-xs text-neutral-400">
            Gestión de cuentas con contraseña cifrada y control de acceso granular por función operativa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setErrorMsg('');
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
            <Users className="w-4 h-4 text-[#e50914]" /> Cuentas Registradas en la Plataforma ({usuarios.length})
          </h2>
          <span className="text-xs text-neutral-500">Módulo exclusivo de Administrador</span>
        </div>

        {usuarios.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center mx-auto border border-neutral-800 text-[#e50914]">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white">No hay usuarios registrados</div>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              La lista de usuarios ha comenzado desde cero. Cree el primer usuario del sistema con su contraseña personal para continuar.
            </p>
            <button
              onClick={() => {
                setErrorMsg('');
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-[#e50914] text-white rounded-lg text-xs font-bold shadow-md shadow-red-900/30 hover:bg-[#b80710] transition inline-flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Registrar Primer Usuario
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-neutral-900 text-neutral-300 uppercase">
                <tr className="border-b border-neutral-800">
                  <th className="p-3">Usuario</th>
                  <th className="p-3">Nombre Completo</th>
                  <th className="p-3">Rol Asignado</th>
                  <th className="p-3">Contraseña</th>
                  <th className="p-3">Permisos Clave</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Última Modificación</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {usuarios.map((u) => {
                  const perms = ROLE_PERMISSIONS[u.role] || ROLE_PERMISSIONS.Consulta;
                  const isActive = u.estado === 'Activo';
                  const isCurrent = u.id === currentUser.id || u.user === currentUser.user;
                  return (
                    <tr key={u.id} className="hover:bg-neutral-900/50 transition">
                      <td className="p-3 font-mono font-bold text-white">
                        @{u.user}
                        {isCurrent && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-neutral-800 text-neutral-400 border border-neutral-700">
                            Actual
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-neutral-200">{u.nombre}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#e50914] text-white">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <span className="tracking-widest text-neutral-500">••••••••</span>
                          <button
                            onClick={() => {
                              setSelectedUserForPassword(u);
                              setNewPassword('');
                              setConfirmNewPassword('');
                            }}
                            className="p-1 hover:text-white text-neutral-400 rounded hover:bg-neutral-800 transition cursor-pointer"
                            title="Cambiar contraseña de este usuario"
                          >
                            <Key className="w-3.5 h-3.5 text-neutral-400 hover:text-amber-400" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-[11px] text-neutral-400">
                        {perms.crear && <span className="text-green-400 mr-2">✓ Crear</span>}
                        {perms.editar && <span className="text-blue-400 mr-2">✓ Editar</span>}
                        {perms.facturar && <span className="text-amber-400 mr-2">✓ Facturar</span>}
                        {perms.eliminar && <span className="text-red-400 mr-2">✓ Eliminar</span>}
                      </td>
                      <td className="p-3">
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
                      <td className="p-3 font-mono text-[10px] text-neutral-500">{u.updated}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onToggleEstadoUsuario(u.id)}
                            className={`px-2 py-1 text-[10px] font-bold rounded transition flex items-center gap-1 cursor-pointer ${
                              isActive
                                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                                : 'bg-green-950 hover:bg-green-900 text-green-300 border border-green-800'
                            }`}
                            title={isActive ? 'Suspender usuario' : 'Activar usuario'}
                          >
                            <Power className="w-3 h-3" />
                            {isActive ? 'Suspender' : 'Activar'}
                          </button>

                          {onDeleteUsuario && (
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
                              className="p-1 hover:bg-red-950 text-neutral-500 hover:text-red-400 rounded transition cursor-pointer"
                              title="Eliminar usuario permanentemente"
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

      {/* Permissions Matrix */}
      <div className="bg-[#141414] border border-neutral-800 rounded-xl p-5 shadow space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#e50914]" />
          Matriz de Autorizaciones y Capacidades por Perfil
        </h3>
        <p className="text-xs text-neutral-400">
          Esta matriz define los permisos de visualización, creación, facturación y descarga implementados en la aplicación:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-900 text-neutral-300 uppercase">
              <tr className="border-b border-neutral-800">
                <th className="p-2.5">Rol Operativo</th>
                <th className="p-2.5 text-center">Consultar</th>
                <th className="p-2.5 text-center">Crear Pedido</th>
                <th className="p-2.5 text-center">Editar Fábrica</th>
                <th className="p-2.5 text-center">Facturar / Cotizar</th>
                <th className="p-2.5 text-center">Descargar Excel</th>
                <th className="p-2.5 text-center">Eliminar Registros</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {rolesList.map((r) => {
                const p = ROLE_PERMISSIONS[r];
                return (
                  <tr key={r} className="hover:bg-neutral-900/40">
                    <td className="p-2.5 font-bold text-white">{r}</td>
                    <td className="p-2.5 text-center">
                      {p.consultar ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <XIcon className="w-4 h-4 text-neutral-600 mx-auto" />}
                    </td>
                    <td className="p-2.5 text-center">
                      {p.crear ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <XIcon className="w-4 h-4 text-neutral-600 mx-auto" />}
                    </td>
                    <td className="p-2.5 text-center">
                      {p.editar ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <XIcon className="w-4 h-4 text-neutral-600 mx-auto" />}
                    </td>
                    <td className="p-2.5 text-center">
                      {p.facturar ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <XIcon className="w-4 h-4 text-neutral-600 mx-auto" />}
                    </td>
                    <td className="p-2.5 text-center">
                      {p.descargar ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <XIcon className="w-4 h-4 text-neutral-600 mx-auto" />}
                    </td>
                    <td className="p-2.5 text-center">
                      {p.eliminar ? <Check className="w-4 h-4 text-red-500 mx-auto" /> : <XIcon className="w-4 h-4 text-neutral-600 mx-auto" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#e50914]" /> CREAR NUEVO USUARIO DEL SISTEMA
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Nombre de Usuario (Login)*
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-neutral-500 font-mono text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="ej. jmartinez o admin"
                    className="w-full bg-neutral-900 border border-neutral-700 pl-8 pr-3 py-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Nombre Completo y Cargo*
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Javier Martínez - Gerente de Operaciones"
                  className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Rol Asignado en Planta / Oficina*
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-neutral-900 border border-neutral-700 p-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                >
                  <option value="Administrador">Administrador (Acceso total)</option>
                  <option value="Ventas">Ventas (Pedidos, Clientes, Facturas)</option>
                  <option value="Producción">Producción (Tablero de fabricación)</option>
                  <option value="Instalación/Envíos">Instalación / Envíos</option>
                  <option value="Mayoristas">Mayoristas</option>
                  <option value="Consulta">Consulta (Solo lectura)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Contraseña*
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mín. 4 caracteres"
                      className="w-full bg-neutral-900 border border-neutral-700 pl-8 pr-8 py-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
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
                  <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                    Confirmar Contraseña*
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repetir clave"
                      className="w-full bg-neutral-900 border border-neutral-700 pl-8 pr-3 py-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                  Correo Electrónico (para notificaciones y recuperación)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ej. operario@falpro.com"
                    className="w-full bg-neutral-900 border border-neutral-700 pl-8 pr-3 py-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-neutral-900/60 rounded border border-neutral-800 space-y-2">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  Pregunta de Seguridad (Recuperación de Clave)
                </span>
                <select
                  value={preguntaSeguridad}
                  onChange={(e) => setPreguntaSeguridad(e.target.value)}
                  className="w-full bg-black border border-neutral-700 p-1.5 rounded text-[11px] text-white focus:outline-none focus:border-[#e50914]"
                >
                  <option value="¿En qué municipio está la planta principal de FALPRO?">
                    ¿En qué municipio está la planta principal de FALPRO?
                  </option>
                  <option value="¿Cuál es el nombre de su primera mascota?">
                    ¿Cuál es el nombre de su primera mascota?
                  </option>
                  <option value="¿Cuál es la placa de su primer vehículo?">
                    ¿Cuál es la placa de su primer vehículo?
                  </option>
                  <option value="¿Cuál es su ciudad o municipio de nacimiento?">
                    ¿Cuál es su ciudad o municipio de nacimiento?
                  </option>
                </select>
                <input
                  type="text"
                  value={respuestaSeguridad}
                  onChange={(e) => setRespuestaSeguridad(e.target.value)}
                  placeholder="Respuesta secreta (ej. Chocontá)"
                  className="w-full bg-black border border-neutral-700 p-1.5 rounded text-[11px] text-white focus:outline-none focus:border-[#e50914]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded text-xs font-bold shadow-lg shadow-red-900/40 cursor-pointer"
                >
                  Crear Usuario con Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambiar Contraseña */}
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

            <div className="text-xs text-neutral-400">
              Modificando clave para: <strong className="text-white">@{selectedUserForPassword.user}</strong> ({selectedUserForPassword.nombre})
            </div>

            {passwordChangeSuccess ? (
              <div className="p-3 bg-green-950/80 border border-green-800 text-green-300 text-xs rounded text-center font-bold">
                ✓ Contraseña actualizada correctamente
              </div>
            ) : (
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
                      className="absolute right-2.5 top-2 text-neutral-400 hover:text-white"
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
                      placeholder="Repetir nueva clave"
                      className="w-full bg-neutral-900 border border-neutral-700 pl-8 pr-3 py-2 rounded text-xs text-white focus:outline-none focus:border-[#e50914]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForPassword(null)}
                    className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#e50914] hover:bg-[#b80710] text-white rounded text-xs font-bold cursor-pointer"
                  >
                    Guardar Contraseña
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
