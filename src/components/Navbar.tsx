import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Hammer,
  Receipt,
  Layers,
  Building2,
  Calendar,
  CloudUpload,
  Users,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Bell,
  LogIn,
} from 'lucide-react';
import { ActiveModule, UserAccount } from '../types';

interface NavbarProps {
  activeModule: ActiveModule;
  setActiveModule: (mod: ActiveModule) => void;
  currentUser: UserAccount | null;
  onOpenLoginModal: () => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  setActiveModule,
  currentUser,
  onOpenLoginModal,
  unreadNotificationsCount,
  onOpenNotifications,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as ActiveModule, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pedidos' as ActiveModule, label: 'Pedidos', icon: ShoppingCart },
    { id: 'produccion' as ActiveModule, label: 'Producción', icon: Hammer },
    { id: 'facturacion' as ActiveModule, label: 'Facturas/Cotiz.', icon: Receipt },
    { id: 'catalogo' as ActiveModule, label: 'Catálogo', icon: Layers },
    { id: 'mayoristas' as ActiveModule, label: 'Mayoristas', icon: Building2 },
    { id: 'cronograma' as ActiveModule, label: 'Cronograma', icon: Calendar },
    { id: 'excelCloud' as ActiveModule, label: 'Nube Excel', icon: CloudUpload },
    ...(currentUser?.role === 'Administrador'
      ? [{ id: 'usuarios' as ActiveModule, label: 'Usuarios', icon: Users }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur border-b border-neutral-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          {/* Zone 1: Brand Wordmark */}
          <div
            onClick={() => setActiveModule('dashboard')}
            className="flex items-center gap-3 cursor-pointer shrink-0 select-none group"
            title="Ir al inicio (Dashboard)"
          >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-0.5 shadow-md shadow-red-900/30 group-hover:scale-105 transition-transform overflow-hidden border border-neutral-700/60">
              <img
                src="/assets/aistudio/0536b826-dd6a-4517-a94c-df560356e50f_21824cc7.jpg"
                alt="FALPRO Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-xl font-black tracking-wider leading-none text-white flex items-center gap-1.5">
                <span>FAL<span className="text-[#e50914]">PRO</span></span>
                <span className="text-xs font-bold text-neutral-400">S.A.S.</span>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                Lujos para vehículos
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden xl:flex items-center space-x-1 flex-1 justify-center overflow-x-auto custom-scrollbar py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#e50914]' : 'text-neutral-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 2 for medium screens (Tablet) */}
          <div className="hidden lg:flex xl:hidden items-center gap-1">
            <select
              value={activeModule}
              onChange={(e) => setActiveModule(e.target.value as ActiveModule)}
              className="bg-neutral-800 border border-neutral-700 text-white text-xs rounded-lg px-3 py-1.5 font-semibold focus:outline-none focus:border-[#e50914]"
            >
              {navItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Zone 3: User Info, Notifications & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notification Bell Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg border border-neutral-700 transition cursor-pointer"
              title="Notificaciones y avisos de taller"
              aria-label="Abrir centro de notificaciones"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#e50914] text-white text-[10px] font-black rounded-full flex items-center justify-center font-mono shadow-md shadow-red-900/80 animate-in zoom-in-50">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {currentUser ? (
              <>
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-white flex items-center justify-end gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#e50914]" />
                    {currentUser.nombre}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    Rol: <span className="text-[#e50914] font-semibold">{currentUser.role}</span>
                  </span>
                </div>

                <button
                  onClick={onOpenLoginModal}
                  title="Cambiar usuario o cerrar sesión"
                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#e50914]" />
                  <span className="hidden sm:inline">Cuenta</span>
                </button>
              </>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="px-3.5 py-1.5 bg-[#e50914] hover:bg-[#b80710] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-900/40"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Ingresar al Sistema</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg border border-neutral-700"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#161616] border-t border-neutral-800 px-4 py-3 space-y-1 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="pb-2 mb-2 border-b border-neutral-800 flex justify-between items-center text-xs text-neutral-400">
            <span>Usuario: <strong className="text-white">{currentUser?.nombre || 'Sin sesión'}</strong></span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onOpenNotifications();
                  setMobileMenuOpen(false);
                }}
                className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 hover:text-white flex items-center gap-1 text-[11px] font-semibold"
              >
                <Bell className="w-3.5 h-3.5 text-[#e50914]" />
                <span>Avisos ({unreadNotificationsCount})</span>
              </button>
              {currentUser ? (
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-[#e50914] font-bold text-[10px]">
                  {currentUser.role}
                </span>
              ) : (
                <button
                  onClick={() => {
                    onOpenLoginModal();
                    setMobileMenuOpen(false);
                  }}
                  className="px-2 py-0.5 rounded bg-[#e50914] text-white font-bold text-[10px]"
                >
                  Ingresar
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveModule(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                    isActive
                      ? 'bg-neutral-800 text-white border border-neutral-700 text-[#e50914]'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-[#e50914]" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
