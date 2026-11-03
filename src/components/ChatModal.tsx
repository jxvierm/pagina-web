import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Paperclip,
  Smile,
  Hash,
  User,
  Users,
  Search,
  Check,
  CheckCheck,
  Truck,
  Image as ImageIcon,
  Minimize2,
  Maximize2,
  Sparkles,
  Radio,
  FileText,
  AlertCircle,
  ThumbsUp,
  Flame,
  Zap,
  Wrench,
  Heart,
} from 'lucide-react';
import {
  ChatMessage,
  ChatChannel,
  UserAccount,
  Pedido,
  UserRole,
} from '../types';
import { multiScreenSync, ConnectedScreenInfo } from '../services/multiScreenSyncService';
import { playNotificationTone } from '../services/notificationService';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  allUsers: UserAccount[];
  pedidos: Pedido[];
  connectedScreens?: ConnectedScreenInfo[];
  onSelectPedido?: (pedido: Pedido) => void;
}

const CHANNELS: ChatChannel[] = [
  {
    id: 'general',
    nombre: 'General Taller',
    descripcion: 'Canal general de coordinación de todo el equipo FALPRO',
    tipo: 'general',
    icono: '🏢',
  },
  {
    id: 'produccion',
    nombre: 'Producción & Aceros',
    descripcion: 'Corte, doblado, soldadura, pulido y consumo de insumos',
    tipo: 'produccion',
    icono: '🏭',
  },
  {
    id: 'ventas',
    nombre: 'Ventas & Mostrador',
    descripcion: 'Cotizaciones, nuevos pedidos, abonos y atención a clientes',
    tipo: 'ventas',
    icono: '💼',
  },
  {
    id: 'instalacion',
    nombre: 'Bahía & Montajes',
    descripcion: 'Llegada de camiones, placas, turnos y entrega de lujos',
    tipo: 'instalacion',
    icono: '🔧',
  },
];

const QUICK_EMOJIS = ['👍', '🔥', '⚡', '✅', '🛠️', '🚛', '❤️', '👏'];

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  pedidos,
  connectedScreens = [],
  onSelectPedido,
}) => {
  const [activeTab, setActiveTab] = useState<'channels' | 'direct'>('channels');
  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [selectedRecipient, setSelectedRecipient] = useState<UserAccount | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPedidoRef, setSelectedPedidoRef] = useState<string>('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // user -> channelId
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Derive conversation key for Direct Messages
  const getDmChannelId = (userA: string, userB: string) => {
    const sorted = [userA, userB].sort();
    return `dm_${sorted[0]}_${sorted[1]}`;
  };

  const currentConversationId =
    activeTab === 'channels'
      ? activeChannelId
      : selectedRecipient && currentUser
      ? getDmChannelId(currentUser.id, selectedRecipient.id)
      : '';

  // Initial load of messages from server
  useEffect(() => {
    fetch('/api/chat/messages')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      })
      .catch((err) => console.warn('Could not load chat messages:', err));
  }, []);

  // Listen to incoming real-time chat messages
  useEffect(() => {
    const unsubMsg = multiScreenSync.subscribeToChatMessages((incomingMsg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === incomingMsg.id)) {
          return prev;
        }
        return [...prev, incomingMsg];
      });

      // Play soft synthesized sound if message is not from self
      if (incomingMsg.senderId !== currentUser?.id) {
        try {
          playNotificationTone('normal');
        } catch {}
      }
    });

    const unsubTyping = multiScreenSync.subscribeToTyping(({ user, channelId, isTyping }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (isTyping) {
          next[user] = channelId;
        } else {
          delete next[user];
        }
        return next;
      });
    });

    const unsubReaction = multiScreenSync.subscribeToReactions(({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
      );
    });

    return () => {
      unsubMsg();
      unsubTyping();
      unsubReaction();
    };
  }, [currentUser]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentConversationId, isOpen]);

  // Mark messages in active channel as read
  useEffect(() => {
    if (isOpen && currentConversationId && currentUser) {
      multiScreenSync.markChatAsRead(currentConversationId, currentUser.id);
    }
  }, [isOpen, currentConversationId, currentUser, messages.length]);

  if (!isOpen) return null;

  // Check if a user is currently online on any screen
  const isUserOnline = (user: UserAccount) => {
    return connectedScreens.some(
      (s) => s.user?.toLowerCase().includes(user.user.toLowerCase()) ||
             s.user?.toLowerCase().includes(user.nombre.toLowerCase())
    );
  };

  // Filter messages for current conversation
  const visibleMessages = messages.filter((m) => {
    if (!currentConversationId) return false;
    if (m.channelId !== currentConversationId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.texto.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q) ||
        (m.pedidoIdRef && m.pedidoIdRef.toLowerCase().includes(q)) ||
        (m.placaRef && m.placaRef.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Calculate unread counts per channel / DM
  const getUnreadCount = (channelOrDmId: string) => {
    if (!currentUser) return 0;
    return messages.filter(
      (m) =>
        m.channelId === channelOrDmId &&
        m.senderId !== currentUser.id &&
        (!m.leidoPor || !m.leidoPor.includes(currentUser.id))
    ).length;
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedImage) return;
    if (!currentUser) return;

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');

    // Find referenced order details
    const refOrder = pedidos.find((p) => p.id === selectedPedidoRef);

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      senderId: currentUser.id,
      senderName: currentUser.nombre,
      senderRole: currentUser.role,
      channelId: currentConversationId,
      recipientId: selectedRecipient ? selectedRecipient.id : undefined,
      recipientName: selectedRecipient ? selectedRecipient.nombre : undefined,
      texto: inputText.trim(),
      adjuntoFoto: attachedImage,
      pedidoIdRef: selectedPedidoRef || null,
      placaRef: refOrder?.placa || null,
      timestamp: Date.now(),
      fecha: `${dd}/${mm} ${hh}:${min}`,
      reactions: {},
      leidoPor: [currentUser.id],
    };

    // Optimistic local add
    setMessages((prev) => [...prev, newMsg]);

    // Dispatch via real-time WebSocket & REST
    multiScreenSync.sendChatMessage(newMsg);

    // Stop typing
    multiScreenSync.sendTyping(currentUser.nombre, currentConversationId, false);

    // Reset input
    setInputText('');
    setAttachedImage(null);
    setSelectedPedidoRef('');
    setShowOrderPicker(false);
    setShowEmojiPicker(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!currentUser) return;

    multiScreenSync.sendTyping(currentUser.nombre, currentConversationId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      multiScreenSync.sendTyping(currentUser.nombre, currentConversationId, false);
    }, 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('La imagen no debe superar los 8MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    multiScreenSync.sendReaction(messageId, emoji, currentUser.nombre);
  };

  // Active conversation title & metadata
  const currentChannel = CHANNELS.find((c) => c.id === activeChannelId);

  // Active typing list for current channel
  const activeTypingNow = Object.entries(typingUsers)
    .filter(([user, chId]) => chId === currentConversationId && user !== currentUser?.nombre)
    .map(([user]) => user);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div
        className={`bg-[#121212] border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white transition-all duration-200 ${
          isMaximized
            ? 'w-full h-full max-w-none max-h-none rounded-none'
            : 'w-full max-w-5xl h-[88vh] max-h-[780px]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="bg-[#181818] border-b border-neutral-800 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-md shadow-red-950/60 font-black">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base tracking-wide text-white flex items-center gap-1.5">
                  CHAT DE TALLER & EQUIPO
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                    EN VIVO
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-neutral-400">
                Comunicación en tiempo real entre vendedores, operarios de taller y administración
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
              title={isMaximized ? 'Restaurar tamaño' : 'Maximizar'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
              title="Cerrar chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: Two-column layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Channels & Direct Messages Sidebar */}
          <div className="w-72 sm:w-80 bg-[#161616] border-r border-neutral-800/80 flex flex-col shrink-0">
            {/* Tabs selector */}
            <div className="p-2 border-b border-neutral-800 flex gap-1">
              <button
                onClick={() => setActiveTab('channels')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'channels'
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
                }`}
              >
                <Hash className="w-3.5 h-3.5 text-[#e50914]" />
                <span>Canales ({CHANNELS.length})</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('direct');
                  if (!selectedRecipient && allUsers.length > 0) {
                    const firstOther = allUsers.find((u) => u.id !== currentUser?.id);
                    if (firstOther) setSelectedRecipient(firstOther);
                  }
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'direct'
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Directos ({Math.max(0, allUsers.length - (currentUser ? 1 : 0))})</span>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {activeTab === 'channels' ? (
                <>
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    Áreas de Trabajo
                  </div>
                  {CHANNELS.map((ch) => {
                    const isSelected = activeChannelId === ch.id;
                    const unread = getUnreadCount(ch.id);
                    return (
                      <button
                        key={ch.id}
                        onClick={() => {
                          setActiveChannelId(ch.id);
                          setSearchQuery('');
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-800 text-white border border-[#e50914]/50 shadow-md'
                            : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base shrink-0">{ch.icono}</span>
                          <div className="truncate">
                            <div className="text-xs font-bold flex items-center gap-1 text-white truncate">
                              <span>#</span>
                              <span>{ch.nombre}</span>
                            </div>
                            <div className="text-[10px] text-neutral-400 truncate">
                              {ch.descripcion}
                            </div>
                          </div>
                        </div>

                        {unread > 0 && (
                          <span className="px-1.5 py-0.5 bg-[#e50914] text-white text-[10px] font-mono font-black rounded-full shrink-0 shadow-md shadow-red-900/60 animate-pulse">
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </>
              ) : (
                <>
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    Compañeros de Taller
                  </div>
                  {allUsers
                    .filter((u) => u.id !== currentUser?.id)
                    .map((user) => {
                      const isSelected = selectedRecipient?.id === user.id;
                      const dmId = currentUser ? getDmChannelId(currentUser.id, user.id) : '';
                      const unread = getUnreadCount(dmId);
                      const online = isUserOnline(user);

                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedRecipient(user);
                            setSearchQuery('');
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-neutral-800 text-white border border-emerald-500/50 shadow-md'
                              : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center font-bold text-xs text-white uppercase">
                                {user.nombre.slice(0, 2)}
                              </div>
                              <span
                                className={`w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-[#161616] ${
                                  online ? 'bg-emerald-500' : 'bg-neutral-600'
                                }`}
                              />
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                                <span>{user.nombre}</span>
                              </div>
                              <div className="text-[10px] text-neutral-400 flex items-center gap-1.5">
                                <span className="font-semibold text-neutral-300">{user.role}</span>
                                <span>·</span>
                                <span className={online ? 'text-emerald-400' : 'text-neutral-500'}>
                                  {online ? 'En línea' : 'Desconectado'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {unread > 0 && (
                            <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[10px] font-mono font-black rounded-full shrink-0 shadow-md">
                              {unread}
                            </span>
                          )}
                        </button>
                      );
                    })}

                  {allUsers.filter((u) => u.id !== currentUser?.id).length === 0 && (
                    <div className="text-center py-8 text-neutral-500 text-xs">
                      No hay otros usuarios registrados en el sistema. Puedes crearlos en el módulo «Usuarios».
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Current user badge on bottom of sidebar */}
            {currentUser && (
              <div className="p-3 bg-[#131313] border-t border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-7 h-7 rounded-lg bg-red-600/30 border border-red-600/40 flex items-center justify-center font-bold text-[11px] text-[#e50914] uppercase">
                    {currentUser.nombre.slice(0, 2)}
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-white text-[11px] truncate">{currentUser.nombre}</div>
                    <div className="text-[10px] text-neutral-400 truncate">{currentUser.role}</div>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Sesión activa" />
              </div>
            )}
          </div>

          {/* Right Column: Chat History & Composer */}
          <div className="flex-1 flex flex-col bg-[#0e0e0e] overflow-hidden">
            {/* Active chat header */}
            <div className="bg-[#141414] border-b border-neutral-800 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {activeTab === 'channels' ? (
                  <>
                    <span className="text-xl">{currentChannel?.icono}</span>
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>#{currentChannel?.nombre}</span>
                        <span className="text-[10px] text-neutral-400 font-normal hidden sm:inline">
                          — {currentChannel?.descripcion}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        Mensajes visibles para todo el taller
                      </div>
                    </div>
                  </>
                ) : selectedRecipient ? (
                  <>
                    <div className="relative">
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-white uppercase">
                        {selectedRecipient.nombre.slice(0, 2)}
                      </div>
                      <span
                        className={`w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 border border-black ${
                          isUserOnline(selectedRecipient) ? 'bg-emerald-500' : 'bg-neutral-600'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>{selectedRecipient.nombre}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-neutral-800 text-neutral-300 rounded font-semibold">
                          {selectedRecipient.role}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-neutral-400">
                        {isUserOnline(selectedRecipient) ? (
                          <span className="text-emerald-400">● Conectado en tiempo real</span>
                        ) : (
                          <span>○ Desconectado</span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-neutral-400">Selecciona un usuario para chatear</div>
                )}
              </div>

              {/* Message Search input */}
              <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg text-xs max-w-[200px] w-full">
                <Search className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en chat..."
                  className="bg-transparent text-white text-[11px] focus:outline-none w-full"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-neutral-500 hover:text-white text-[10px]"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {visibleMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-semibold text-neutral-300">
                    {searchQuery ? 'No hay mensajes que coincidan con la búsqueda' : 'No hay mensajes aún en esta conversación'}
                  </div>
                  <p className="text-[11px] text-neutral-500 max-w-xs">
                    {activeTab === 'channels'
                      ? 'Escribe un mensaje para coordinar al equipo en esta área de trabajo.'
                      : 'Envía un mensaje privado a tu compañero para coordinar tareas o pedidos.'}
                  </p>
                </div>
              ) : (
                visibleMessages.map((msg, index) => {
                  const isMine = msg.senderId === currentUser?.id;
                  const refOrder = msg.pedidoIdRef ? pedidos.find((p) => p.id === msg.pedidoIdRef) : null;

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex gap-2.5 items-end ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Avatar for others */}
                      {!isMine && (
                        <div
                          className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[11px] font-bold text-neutral-200 shrink-0 uppercase select-none mb-1"
                          title={`${msg.senderName} (${msg.senderRole})`}
                        >
                          {msg.senderName.slice(0, 2)}
                        </div>
                      )}

                      <div className={`max-w-[82%] sm:max-w-[70%] space-y-1 ${isMine ? 'items-end' : 'items-start'}`}>
                        {/* Sender info */}
                        {!isMine && (
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 px-1">
                            <span className="font-bold text-neutral-300">{msg.senderName}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-400">
                              {msg.senderRole}
                            </span>
                            <span>·</span>
                            <span>{msg.fecha}</span>
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`rounded-2xl p-3 text-xs shadow-md transition ${
                            isMine
                              ? 'bg-gradient-to-br from-red-700 to-red-900 text-white rounded-br-xs border border-red-600/50'
                              : 'bg-neutral-800/90 text-neutral-100 rounded-bl-xs border border-neutral-700/70'
                          }`}
                        >
                          {/* Order Reference Card inside bubble */}
                          {msg.pedidoIdRef && (
                            <div
                              onClick={() => {
                                if (refOrder && onSelectPedido) {
                                  onSelectPedido(refOrder);
                                }
                              }}
                              className={`mb-2 p-2 rounded-xl flex items-center justify-between gap-2 border text-[11px] cursor-pointer transition ${
                                isMine
                                  ? 'bg-black/30 border-red-500/40 hover:bg-black/40'
                                  : 'bg-black/40 border-neutral-700 hover:border-[#e50914]/60 hover:bg-black/60'
                              }`}
                              title="Clic para ver o gestionar este pedido"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <div className="truncate">
                                  <div className="font-mono font-black text-amber-300 truncate">
                                    {msg.pedidoIdRef}
                                    {msg.placaRef ? ` (${msg.placaRef})` : ''}
                                  </div>
                                  {refOrder && (
                                    <div className="text-[10px] text-neutral-300 truncate">
                                      {refOrder.cliente} · {refOrder.vehiculo}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-300 font-mono shrink-0">
                                {refOrder?.estado || 'Pedido'}
                              </span>
                            </div>
                          )}

                          {/* Image Attachment */}
                          {msg.adjuntoFoto && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-neutral-700/60 bg-black/40">
                              <img
                                src={msg.adjuntoFoto}
                                alt="Adjunto de taller"
                                onClick={() => setPreviewImage(msg.adjuntoFoto || null)}
                                className="max-h-60 w-auto rounded-lg object-contain cursor-zoom-in hover:opacity-95 transition"
                              />
                            </div>
                          )}

                          {/* Text Content */}
                          {msg.texto && (
                            <div className="whitespace-pre-wrap break-words leading-relaxed">
                              {msg.texto}
                            </div>
                          )}

                          {/* Timestamp and ticks for own messages */}
                          {isMine && (
                            <div className="flex items-center justify-end gap-1 text-[9px] text-red-200/80 mt-1">
                              <span>{msg.fecha}</span>
                              <CheckCheck className="w-3 h-3 text-red-200" />
                            </div>
                          )}
                        </div>

                        {/* Reactions and Quick Add Button */}
                        <div className="flex flex-wrap items-center gap-1 px-1">
                          {msg.reactions &&
                            Object.entries(msg.reactions).map(([emoji, users]) => {
                              if (!users || users.length === 0) return null;
                              const userReacted = currentUser && users.includes(currentUser.nombre);
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => handleToggleReaction(msg.id, emoji)}
                                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 border transition cursor-pointer ${
                                    userReacted
                                      ? 'bg-red-950/70 text-red-300 border-red-700/70'
                                      : 'bg-neutral-850 text-neutral-300 border-neutral-700 hover:bg-neutral-800'
                                  }`}
                                  title={`Reaccionaron: ${users.join(', ')}`}
                                >
                                  <span>{emoji}</span>
                                  <span>{users.length}</span>
                                </button>
                              );
                            })}

                          {/* Quick Emoji Reaction Pill */}
                          <div className="relative group inline-block">
                            <button
                              className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-full text-[10px] transition cursor-pointer"
                              title="Reaccionar"
                            >
                              <Smile className="w-3 h-3" />
                            </button>
                            <div className="hidden group-hover:flex absolute left-0 bottom-full mb-1 bg-neutral-900 border border-neutral-700 rounded-lg p-1 shadow-xl z-20 gap-1 animate-in fade-in zoom-in-95">
                              {QUICK_EMOJIS.slice(0, 5).map((em) => (
                                <button
                                  key={em}
                                  onClick={() => handleToggleReaction(msg.id, em)}
                                  className="hover:scale-125 transition text-xs p-1 cursor-pointer"
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Active Typing Notification */}
            {activeTypingNow.length > 0 && (
              <div className="px-4 py-1 bg-[#111] text-[11px] text-neutral-400 flex items-center gap-1.5 animate-pulse border-t border-neutral-850">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>
                  <strong>{activeTypingNow.join(', ')}</strong> {activeTypingNow.length === 1 ? 'está' : 'están'} escribiendo...
                </span>
              </div>
            )}

            {/* Attachments preview bar */}
            {(attachedImage || selectedPedidoRef) && (
              <div className="p-2.5 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2 flex-wrap text-xs">
                {selectedPedidoRef && (
                  <div className="bg-red-950/60 border border-red-700/60 text-red-200 px-2.5 py-1 rounded-lg flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-[#e50914]" />
                    <span className="font-mono font-bold">Referencia: {selectedPedidoRef}</span>
                    <button
                      onClick={() => setSelectedPedidoRef('')}
                      className="text-neutral-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {attachedImage && (
                  <div className="relative group bg-neutral-800 border border-neutral-700 p-1 rounded-lg flex items-center gap-2">
                    <img
                      src={attachedImage}
                      alt="Preview"
                      className="w-10 h-10 object-cover rounded"
                    />
                    <span className="text-[10px] text-neutral-300">Foto adjunta</span>
                    <button
                      onClick={() => setAttachedImage(null)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Quitar foto"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Order Picker Drawer */}
            {showOrderPicker && (
              <div className="p-3 bg-neutral-900 border-t border-neutral-800 space-y-2 animate-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#e50914]" /> Selecciona un pedido para vincular
                  </span>
                  <button
                    onClick={() => setShowOrderPicker(false)}
                    className="text-neutral-400 hover:text-white text-xs"
                  >
                    ✕ Cerrar
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto custom-scrollbar">
                  {pedidos.slice(0, 12).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPedidoRef(p.id);
                        setShowOrderPicker(false);
                      }}
                      className="text-left p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 text-xs transition cursor-pointer flex justify-between items-center"
                    >
                      <div className="truncate">
                        <div className="font-mono font-bold text-white truncate">{p.id}</div>
                        <div className="text-[10px] text-neutral-300 truncate">
                          {p.cliente} ({p.vehiculo})
                        </div>
                      </div>
                      {p.placa && (
                        <span className="font-mono text-[10px] text-amber-400 font-bold shrink-0">
                          {p.placa}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Emoji Quick Picker */}
            {showEmojiPicker && (
              <div className="p-2 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-neutral-400 uppercase font-mono mr-1">Reacciones rápidas:</span>
                {QUICK_EMOJIS.map((em) => (
                  <button
                    key={em}
                    onClick={() => {
                      setInputText((prev) => prev + em);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1.5 text-base hover:scale-125 transition cursor-pointer"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}

            {/* Message Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-[#141414] border-t border-neutral-800 flex items-center gap-2 shrink-0"
            >
              {/* Attachments Actions */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowOrderPicker(!showOrderPicker)}
                  className={`p-2 rounded-lg transition cursor-pointer ${
                    selectedPedidoRef || showOrderPicker
                      ? 'bg-red-950 text-[#e50914] border border-red-700'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                  title="Vincular pedido o placa a este mensaje"
                >
                  <Truck className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-lg transition cursor-pointer ${
                    attachedImage
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                  title="Adjuntar foto de fabricación o vehículo"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                  title="Insertar emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>

              {/* Text Input Field */}
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={
                  activeTab === 'channels'
                    ? `Enviar mensaje a #${currentChannel?.nombre || 'canal'}...`
                    : `Mensaje directo para ${selectedRecipient?.nombre || 'usuario'}...`
                }
                className="flex-1 bg-neutral-900 border border-neutral-700 focus:border-[#e50914] text-xs text-white px-3 py-2.5 rounded-xl focus:outline-none transition"
              />

              {/* Submit button */}
              <button
                type="submit"
                disabled={!inputText.trim() && !attachedImage}
                className="px-4 py-2.5 bg-[#e50914] hover:bg-[#b80710] disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-950/50"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Enviar</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Full-screen Image Preview Zoom Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/95 z-60 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={previewImage}
            alt="Ampliación"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg border border-neutral-800"
          />
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
