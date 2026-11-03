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
  Monitor,
  Smartphone,
  Tablet,
  Radio,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  MessageSquare,
  MessageCircle,
} from 'lucide-react';
import { ActiveModule, UserAccount } from '../types';
import { ConnectedScreenInfo } from '../services/multiScreenSyncService';

interface NavbarProps {
  activeModule: ActiveModule;
  setActiveModule: (mod: ActiveModule) => void;
  currentUser: UserAccount | null;
  onOpenLoginModal: () => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  connectedScreensCount?: number;
  connectedScreens?: ConnectedScreenInfo[];
  onTriggerSync?: () => void;
  onOpenChat?: () => void;
  unreadChatCount?: number;
  onOpenWhatsApp?: () => void;
  isWhatsAppConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  setActiveModule,
  currentUser,
  onOpenLoginModal,
  unreadNotificationsCount,
  onOpenNotifications,
  connectedScreensCount = 1,
  connectedScreens = [],
  onTriggerSync,
  onOpenChat,
  unreadChatCount = 0,
  onOpenWhatsApp,
  isWhatsAppConnected = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [screensPopoverOpen, setScreensPopoverOpen] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);

  // Complete list of all system modules
  const allNavItems = [
    { id: 'dashboard' as ActiveModule, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pedidos' as ActiveModule, label: 'Pedidos', icon: ShoppingCart },
    { id: 'produccion' as ActiveModule, label: 'Producción', icon: Hammer },
    { id: 'facturacion' as ActiveModule, label: 'Facturas/Cotiz.', icon: Receipt },
    { id: 'catalogo' as ActiveModule, label: 'Catálogo', icon: Layers },
    { id: 'mayoristas' as ActiveModule, label: 'Mayoristas', icon: Building2 },
    { id: 'cronograma' as ActiveModule, label: 'Cronograma', icon: Calendar },
    { id: 'resumenFinanciero' as ActiveModule, label: 'Resumen Financiero', icon: DollarSign },
    { id: 'excelCloud' as ActiveModule, label: 'Nube Excel', icon: CloudUpload },
    { id: 'usuarios' as ActiveModule, label: 'Usuarios', icon: Users },
  ];

  // Filter dynamically based on what the administrator configured for this specific user's screen
  const navItems = allNavItems.filter((item) => {
    if (currentUser?.modulosPermitidos && currentUser.modulosPermitidos.length > 0) {
      return currentUser.modulosPermitidos.includes(item.id);
    }
    // Default fallback if not customized yet
    if (item.id === 'usuarios') {
      return currentUser?.role === 'Administrador';
    }
    return true;
  });

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

          {/* Zone 3: Multi-screen indicator, Notifications & User Info */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Multi-screen sync indicator with interactive device panel */}
            <div className="relative">
              <button
                onClick={() => setScreensPopoverOpen(!screensPopoverOpen)}
                title={`Sincronización multipantalla activa en tiempo real (${connectedScreensCount} pantalla${connectedScreensCount > 1 ? 's' : ''} conectada${connectedScreensCount > 1 ? 's' : ''}). Clic para ver dispositivos.`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-600/50 rounded-lg text-xs transition cursor-pointer select-none"
              >
                <div className="relative flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 absolute inline-block animate-ping"></span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-300">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">
                    {connectedScreensCount > 1 ? `${connectedScreensCount} Pantallas en Red` : 'Multipantalla Activa'}
                  </span>
                  <span className="sm:hidden font-bold text-emerald-400">
                    {connectedScreensCount}
                  </span>
                </div>
              </button>

              {screensPopoverOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setScreensPopoverOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-neutral-900 border border-neutral-700/80 rounded-xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 backdrop-blur-md">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-950/60 border border-emerald-700/40 rounded-lg">
                          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            Sincronización Multipantalla
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-mono rounded border border-emerald-500/20">
                              EN VIVO
                            </span>
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {connectedScreensCount} {connectedScreensCount === 1 ? 'dispositivo conectado' : 'dispositivos en tiempo real'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setScreensPopoverOpen(false)}
                        className="text-neutral-500 hover:text-white p-1 rounded-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="py-2 space-y-2 max-h-60 overflow-y-auto custom-scrollbar my-2">
                      {connectedScreens.length > 0 ? (
                        connectedScreens.map((screen) => {
                          const isSelf = screen.id === sessionStorage.getItem('falpro_screen_id');
                          const Icon =
                            screen.deviceType === 'mobile'
                              ? Smartphone
                              : screen.deviceType === 'tablet'
                              ? Tablet
                              : Monitor;

                          return (
                            <div
                              key={screen.id}
                              className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition ${
                                isSelf
                                  ? 'bg-neutral-800/80 border-[#e50914]/40'
                                  : 'bg-neutral-900/90 border-neutral-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-neutral-800 rounded-md border border-neutral-700">
                                  <Icon className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div>
                                  <div className="font-semibold text-white flex items-center gap-1.5">
                                    <span>{screen.label || screen.id}</span>
                                    {isSelf && (
                                      <span className="text-[9px] px-1 py-0.2 bg-[#e50914]/20 text-[#e50914] font-bold rounded">
                                        ESTA PANTALLA
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-neutral-400 flex items-center gap-2">
                                    <span>Módulo: <strong className="text-neutral-300 capitalize">{screen.module || 'Dashboard'}</strong></span>
                                    {screen.user && (
                                      <span className="text-neutral-500">· {screen.user}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span>Activo</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-xs text-neutral-400">
                          Sincronizando pantallas...
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-neutral-500">
                        ⚡ Cambios instantáneos en todos los dispositivos
                      </div>
                      <button
                        onClick={async () => {
                          setIsSyncingNow(true);
                          if (onTriggerSync) onTriggerSync();
                          setTimeout(() => setIsSyncingNow(false), 800);
                        }}
                        disabled={isSyncingNow}
                        className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg border border-neutral-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin text-emerald-400' : ''}`} />
                        <span>{isSyncingNow ? 'Sincronizado' : 'Sincronizar'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* WhatsApp Gateway Automation Button */}
            <button
              onClick={onOpenWhatsApp}
              className={`relative p-2 rounded-lg border transition cursor-pointer flex items-center justify-center ${
                isWhatsAppConnected
                  ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border-emerald-600/50'
                  : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
              }`}
              title={
                isWhatsAppConnected
                  ? 'WhatsApp Enlazado (Envíos automáticos activos)'
                  : 'Enlazar WhatsApp para envíos automáticos'
              }
              aria-label="Enlace WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span
                className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#121212] ${
                  isWhatsAppConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </button>

            {/* User Team Chat Button */}
            <button
              onClick={onOpenChat}
              className="relative p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg border border-neutral-700 transition cursor-pointer"
              title="Chat de taller y equipo FALPRO"
              aria-label="Abrir chat entre usuarios"
            >
              <MessageSquare className="w-4 h-4" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#e50914] text-white text-[10px] font-black rounded-full flex items-center justify-center font-mono shadow-md shadow-red-900/80 animate-in zoom-in-50">
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </span>
              )}
            </button>

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
        <div className="xl:hidden bg-[#161616] border-t border-neutral-800 px-4 py-3 space-y-2 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="pb-2 border-b border-neutral-800 flex flex-wrap justify-between items-center gap-2 text-xs text-neutral-400">
            <span>Usuario: <strong className="text-white">{currentUser?.nombre || 'Sin sesión'}</strong></span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  if (onOpenWhatsApp) onOpenWhatsApp();
                  setMobileMenuOpen(false);
                }}
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 border ${
                  isWhatsAppConnected
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenChat) onOpenChat();
                  setMobileMenuOpen(false);
                }}
                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center gap-1 text-[11px] font-semibold"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#e50914]" />
                <span>Chat {unreadChatCount > 0 ? `(${unreadChatCount})` : ''}</span>
              </button>

              <button
                onClick={() => {
                  onOpenNotifications();
                  setMobileMenuOpen(false);
                }}
                className="px-2 py-1 rounded bg-neutral-800 text-neutral-200 hover:text-white flex items-center gap-1 text-[11px] font-semibold border border-neutral-700"
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
