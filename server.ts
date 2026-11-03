import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

// Screen information structure for real-time tracking across physical devices
interface ConnectedScreen {
  id: string;
  module: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  label: string;
  user?: string;
  lastSeen: number;
  ip?: string;
}

// Entity store structure
interface CentralStore {
  pedidos: unknown[];
  catalogo: unknown[];
  inventario: unknown[];
  ordenesTrabajo: unknown[];
  mayoristas: unknown[];
  cotizaciones: unknown[];
  facturasSinPedido: unknown[];
  usuarios: unknown[];
  notifications: unknown[];
  syncLogs: unknown[];
  chatMessages: unknown[];
  whatsappConfig: {
    connected: boolean;
    phoneNumber?: string;
    pairedAt?: string;
    provider: 'qr_gateway' | 'meta_cloud';
    apiKey?: string;
    phoneNumberId?: string;
    wabaId?: string;
    webhookUrl?: string;
    triggers: {
      onNewOrder: boolean;
      onNewAbono: boolean;
      onOrderReady: boolean;
      onStageProgress: boolean;
    };
  };
  whatsappLogs: unknown[];
  lastUpdated: number;
  [key: string]: unknown;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// Initial default primary user in case of clean start
const DEFAULT_PRIMARY_USER = {
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
};

const DEFAULT_INVENTARIO: unknown[] = [];

const DEFAULT_WHATSAPP_CONFIG = {
  connected: false,
  phoneNumber: '',
  pairedAt: '',
  provider: 'qr_gateway' as const,
  triggers: {
    onNewOrder: true,
    onNewAbono: true,
    onOrderReady: true,
    onStageProgress: false,
  },
};

// Initial welcome chat message
const INITIAL_CHAT_MESSAGES = [
  {
    id: 'msg-welcome-1',
    senderId: 'usr-admin-principal',
    senderName: 'Administrador Principal',
    senderRole: 'Administrador',
    channelId: 'general',
    texto: '👋 Bienvenidos al canal general del equipo FALPRO. Aquí coordinamos pedidos, estados de fabricación y novedades de bahía en tiempo real.',
    timestamp: Date.now() - 3600000,
    fecha: 'Hoy',
    reactions: { '👍': ['Administrador Principal'] },
    leidoPor: ['usr-admin-principal'],
  },
  {
    id: 'msg-welcome-2',
    senderId: 'usr-admin-principal',
    senderName: 'Administrador Principal',
    senderRole: 'Administrador',
    channelId: 'produccion',
    texto: '🔧 Canal de Producción activo. Reportar aquí avances de corte, doblado y pulido de aceros.',
    timestamp: Date.now() - 1800000,
    fecha: 'Hoy',
    reactions: { '⚡': ['Administrador Principal'] },
    leidoPor: ['usr-admin-principal'],
  },
];

// Load persisted store or initialize
function loadCentralStore(): CentralStore {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        pedidos: Array.isArray(parsed.pedidos) ? parsed.pedidos : [],
        catalogo: Array.isArray(parsed.catalogo) ? parsed.catalogo : [],
        inventario: Array.isArray(parsed.inventario) ? parsed.inventario : [],
        ordenesTrabajo: Array.isArray(parsed.ordenesTrabajo) ? parsed.ordenesTrabajo : [],
        mayoristas: Array.isArray(parsed.mayoristas) ? parsed.mayoristas : [],
        cotizaciones: Array.isArray(parsed.cotizaciones) ? parsed.cotizaciones : [],
        facturasSinPedido: Array.isArray(parsed.facturasSinPedido) ? parsed.facturasSinPedido : [],
        usuarios: Array.isArray(parsed.usuarios) && parsed.usuarios.length > 0 ? parsed.usuarios : [DEFAULT_PRIMARY_USER],
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        syncLogs: Array.isArray(parsed.syncLogs) ? parsed.syncLogs : [],
        chatMessages: Array.isArray(parsed.chatMessages) && parsed.chatMessages.length > 0 ? parsed.chatMessages : INITIAL_CHAT_MESSAGES,
        whatsappConfig: parsed.whatsappConfig || DEFAULT_WHATSAPP_CONFIG,
        whatsappLogs: Array.isArray(parsed.whatsappLogs) ? parsed.whatsappLogs : [],
        lastUpdated: parsed.lastUpdated || Date.now(),
      };
    }
  } catch (err) {
    console.error('Error loading central store from disk:', err);
  }

  return {
    pedidos: [],
    catalogo: [],
    inventario: DEFAULT_INVENTARIO,
    ordenesTrabajo: [],
    mayoristas: [],
    cotizaciones: [],
    facturasSinPedido: [],
    usuarios: [DEFAULT_PRIMARY_USER],
    notifications: [],
    syncLogs: [],
    chatMessages: INITIAL_CHAT_MESSAGES,
    whatsappConfig: DEFAULT_WHATSAPP_CONFIG,
    whatsappLogs: [],
    lastUpdated: Date.now(),
  };
}

let centralStore: CentralStore = loadCentralStore();

// Debounced persist to disk
let saveTimeout: NodeJS.Timeout | null = null;
function persistStoreDebounced() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(centralStore, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write central store:', err);
    }
  }, 300);
}

// Active screens tracker
const activeScreens = new Map<string, ConnectedScreen>();
const sseClients = new Set<Response>();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON Body parsing for API and image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Create HTTP server
  const server = http.createServer(app);

  // WebSocket Server attached to /ws
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Map each WS connection to its screenId
  const socketScreenMap = new Map<WebSocket, string>();

  function broadcastWs(message: Record<string, unknown>, excludeSocket?: WebSocket) {
    const raw = JSON.stringify(message);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client !== excludeSocket) {
        try {
          client.send(raw);
        } catch (err) {
          console.warn('WS send error:', err);
        }
      }
    });
  }

  function broadcastSSE(event: string, data: unknown) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach((res) => {
      try {
        res.write(payload);
      } catch (err) {
        console.warn('SSE send error:', err);
      }
    });
  }

  function broadcastScreensUpdate() {
    const screens = Array.from(activeScreens.values());
    const count = screens.length;
    const msg = {
      type: 'SCREENS_UPDATE',
      count,
      screens,
      timestamp: Date.now(),
    };
    broadcastWs(msg);
    broadcastSSE('screens', { count, screens });
  }

  // Clean up inactive screens every 4 seconds
  setInterval(() => {
    const now = Date.now();
    let changed = false;
    activeScreens.forEach((screen, id) => {
      // Screen inactive for more than 10 seconds
      if (now - screen.lastSeen > 10000) {
        activeScreens.delete(id);
        changed = true;
      }
    });

    if (changed) {
      broadcastScreensUpdate();
    }
  }, 4000);

  wss.on('connection', (ws, req) => {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Local';

    ws.on('message', (dataBuffer) => {
      try {
        const message = JSON.parse(dataBuffer.toString());
        const { type, screenId, module, deviceType, label, user, entity, data } = message;

        if (screenId) {
          socketScreenMap.set(ws, screenId);

          // Update screen registry
          activeScreens.set(screenId, {
            id: screenId,
            module: module || 'dashboard',
            deviceType: deviceType || 'desktop',
            label: label || `Pantalla (${screenId})`,
            user: user || undefined,
            lastSeen: Date.now(),
            ip: clientIp,
          });
        }

        if (type === 'SCREEN_JOIN' || type === 'HEARTBEAT_PING') {
          // Send current state and screens list
          broadcastScreensUpdate();
        } else if (type === 'REQUEST_STATE') {
          // Send complete store directly to requesting socket
          ws.send(
            JSON.stringify({
              type: 'STATE_RESPONSE',
              store: centralStore,
              screens: Array.from(activeScreens.values()),
              timestamp: Date.now(),
            })
          );
        } else if (type === 'DATA_SYNC' && entity) {
          // Update central store
          const key = entity as keyof CentralStore;
          if (key in centralStore && key !== 'lastUpdated') {
            (centralStore as Record<string, unknown>)[key] = data;
            centralStore.lastUpdated = Date.now();
            persistStoreDebounced();
          }

          // Forward to ALL other connected screens instantly
          broadcastWs(
            {
              type: 'DATA_SYNC',
              entity,
              data,
              sourceScreenId: screenId,
              timestamp: Date.now(),
            },
            ws // exclude sender
          );

          // Also broadcast to any SSE clients
          broadcastSSE('data_sync', { entity, data, sourceScreenId: screenId });
        } else if (type === 'CHAT_SEND_MESSAGE' && data) {
          const newMsg = data as Record<string, unknown>;
          if (!newMsg.id) {
            newMsg.id = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
          }
          if (!newMsg.timestamp) {
            newMsg.timestamp = Date.now();
          }

          // Append to store (keep last 500)
          centralStore.chatMessages = [...centralStore.chatMessages.slice(-499), newMsg];
          centralStore.lastUpdated = Date.now();
          persistStoreDebounced();

          // Broadcast to all connected clients including sender
          const chatBroadcast = {
            type: 'CHAT_MESSAGE_RECEIVED',
            message: newMsg,
            sourceScreenId: screenId,
            timestamp: Date.now(),
          };
          broadcastWs(chatBroadcast);
          broadcastSSE('chat_message', newMsg);
        } else if (type === 'CHAT_TYPING') {
          // Broadcast typing indicator to other clients
          broadcastWs(
            {
              type: 'CHAT_TYPING',
              user: data?.user || user,
              channelId: data?.channelId,
              isTyping: data?.isTyping,
              sourceScreenId: screenId,
            },
            ws // exclude sender
          );
        } else if (type === 'CHAT_REACTION' && data) {
          const { messageId, emoji, username } = data as { messageId: string; emoji: string; username: string };
          if (messageId && emoji && username) {
            const list = centralStore.chatMessages as Array<{
              id: string;
              reactions?: Record<string, string[]>;
              [key: string]: unknown;
            }>;
            const target = list.find((m) => m.id === messageId);
            if (target) {
              if (!target.reactions) target.reactions = {};
              const currentUsers = target.reactions[emoji] || [];
              if (currentUsers.includes(username)) {
                target.reactions[emoji] = currentUsers.filter((u) => u !== username);
                if (target.reactions[emoji].length === 0) {
                  delete target.reactions[emoji];
                }
              } else {
                target.reactions[emoji] = [...currentUsers, username];
              }
              centralStore.lastUpdated = Date.now();
              persistStoreDebounced();

              broadcastWs({
                type: 'CHAT_REACTION_UPDATED',
                messageId,
                reactions: target.reactions,
                timestamp: Date.now(),
              });
            }
          }
        } else if (type === 'CHAT_MARK_READ' && data) {
          const { channelId, userId } = data as { channelId: string; userId: string };
          if (channelId && userId) {
            const list = centralStore.chatMessages as Array<{
              channelId: string;
              leidoPor?: string[];
              [key: string]: unknown;
            }>;
            let updatedAny = false;
            list.forEach((m) => {
              if (m.channelId === channelId) {
                if (!m.leidoPor) m.leidoPor = [];
                if (!m.leidoPor.includes(userId)) {
                  m.leidoPor.push(userId);
                  updatedAny = true;
                }
              }
            });
            if (updatedAny) {
              centralStore.lastUpdated = Date.now();
              persistStoreDebounced();
            }
          }
        } else if (type === 'SCREEN_LEAVE' && screenId) {
          activeScreens.delete(screenId);
          broadcastScreensUpdate();
        }
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    });

    ws.on('close', () => {
      const screenId = socketScreenMap.get(ws);
      if (screenId) {
        socketScreenMap.delete(ws);
        activeScreens.delete(screenId);
        broadcastScreensUpdate();
      }
    });

    // Send immediate initial sync acknowledgment
    ws.send(
      JSON.stringify({
        type: 'CONNECTED_ACK',
        store: centralStore,
        screens: Array.from(activeScreens.values()),
        timestamp: Date.now(),
      })
    );
  });

  // REST API Endpoints for cross-device sync & fallback

  // 1. Get complete central store state
  app.get('/api/sync/state', (_req: Request, res: Response) => {
    res.json({
      success: true,
      store: centralStore,
      screens: Array.from(activeScreens.values()),
      count: activeScreens.size,
      timestamp: Date.now(),
    });
  });

  // 2. Broadcast and persist entity changes from any device
  app.post('/api/sync/entity', (req: Request, res: Response) => {
    const { entity, data, screenId, deviceType, label, user } = req.body;
    if (!entity) {
      res.status(400).json({ error: 'Missing entity field' });
      return;
    }

    // Refresh presence
    if (screenId) {
      activeScreens.set(screenId, {
        id: screenId,
        module: req.body.module || 'dashboard',
        deviceType: deviceType || 'desktop',
        label: label || `Pantalla (${screenId})`,
        user: user || undefined,
        lastSeen: Date.now(),
      });
    }

    // Update central store
    const key = entity as keyof CentralStore;
    if (key in centralStore && key !== 'lastUpdated') {
      (centralStore as Record<string, unknown>)[key] = data;
      centralStore.lastUpdated = Date.now();
      persistStoreDebounced();
    }

    // Exclude the sender's socket from WS broadcast if screenId is known
    let excludeSocket: WebSocket | undefined;
    if (screenId) {
      socketScreenMap.forEach((sId, ws) => {
        if (sId === screenId) excludeSocket = ws;
      });
    }

    // Broadcast to all other WebSocket clients
    broadcastWs(
      {
        type: 'DATA_SYNC',
        entity,
        data,
        sourceScreenId: screenId,
        timestamp: Date.now(),
      },
      excludeSocket
    );

    // Broadcast to SSE clients
    broadcastSSE('data_sync', { entity, data, sourceScreenId: screenId });

    res.json({ success: true, timestamp: Date.now() });
  });

  // 3. Heartbeat presence ping
  app.post('/api/sync/heartbeat', (req: Request, res: Response) => {
    const { screenId, module, deviceType, label, user } = req.body;
    if (screenId) {
      activeScreens.set(screenId, {
        id: screenId,
        module: module || 'dashboard',
        deviceType: deviceType || 'desktop',
        label: label || `Pantalla (${screenId})`,
        user: user || undefined,
        lastSeen: Date.now(),
      });
      broadcastScreensUpdate();
    }
    res.json({
      success: true,
      screens: Array.from(activeScreens.values()),
      count: activeScreens.size,
    });
  });

  // 4. Get active connected screens list
  app.get('/api/sync/screens', (_req: Request, res: Response) => {
    res.json({
      success: true,
      screens: Array.from(activeScreens.values()),
      count: activeScreens.size,
    });
  });

  // 5. Server-Sent Events (SSE) fallback stream
  app.get('/api/sync/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);

    // Initial greeting
    res.write(`event: connected\ndata: ${JSON.stringify({ screens: Array.from(activeScreens.values()) })}\n\n`);

    // Ping to keep connection alive
    const keepAlive = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(keepAlive);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  // ==========================================
  // CHAT ENDPOINTS (Entre Usuarios FALPRO)
  // ==========================================
  
  // 1. Get chat messages (with optional channel filter)
  app.get('/api/chat/messages', (req: Request, res: Response) => {
    const { channelId } = req.query;
    let messages = centralStore.chatMessages as Array<{ channelId?: string; recipientId?: string; senderId?: string }>;
    if (channelId && typeof channelId === 'string') {
      messages = messages.filter((m) => m.channelId === channelId);
    }
    res.json({
      success: true,
      messages,
      total: messages.length,
      timestamp: Date.now(),
    });
  });

  // 2. Send chat message
  app.post('/api/chat/messages', (req: Request, res: Response) => {
    const {
      senderId,
      senderName,
      senderRole,
      channelId,
      recipientId,
      recipientName,
      texto,
      adjuntoFoto,
      pedidoIdRef,
      placaRef,
    } = req.body;

    if (!texto && !adjuntoFoto) {
      res.status(400).json({ error: 'El mensaje debe contener texto o una imagen' });
      return;
    }

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');

    const newMsg = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      senderId: senderId || 'usr-anon',
      senderName: senderName || 'Usuario Taller',
      senderRole: senderRole || 'Ventas',
      channelId: channelId || 'general',
      recipientId: recipientId || undefined,
      recipientName: recipientName || undefined,
      texto: String(texto || '').trim(),
      adjuntoFoto: adjuntoFoto || null,
      pedidoIdRef: pedidoIdRef || null,
      placaRef: placaRef || null,
      timestamp: Date.now(),
      fecha: `${dd}/${mm} ${hh}:${min}`,
      reactions: {},
      leidoPor: senderId ? [senderId] : [],
    };

    centralStore.chatMessages = [...centralStore.chatMessages.slice(-499), newMsg];
    centralStore.lastUpdated = Date.now();
    persistStoreDebounced();

    // Broadcast to WebSocket and SSE
    broadcastWs({
      type: 'CHAT_MESSAGE_RECEIVED',
      message: newMsg,
      timestamp: Date.now(),
    });
    broadcastSSE('chat_message', newMsg);

    res.json({ success: true, message: newMsg });
  });

  // 3. React to chat message
  app.post('/api/chat/reaction', (req: Request, res: Response) => {
    const { messageId, emoji, username } = req.body;
    if (!messageId || !emoji || !username) {
      res.status(400).json({ error: 'Faltan parámetros requeridos (messageId, emoji, username)' });
      return;
    }

    const list = centralStore.chatMessages as Array<{
      id: string;
      reactions?: Record<string, string[]>;
      [key: string]: unknown;
    }>;
    const target = list.find((m) => m.id === messageId);
    if (!target) {
      res.status(404).json({ error: 'Mensaje no encontrado' });
      return;
    }

    if (!target.reactions) target.reactions = {};
    const currentUsers = target.reactions[emoji] || [];
    if (currentUsers.includes(username)) {
      target.reactions[emoji] = currentUsers.filter((u) => u !== username);
      if (target.reactions[emoji].length === 0) {
        delete target.reactions[emoji];
      }
    } else {
      target.reactions[emoji] = [...currentUsers, username];
    }

    centralStore.lastUpdated = Date.now();
    persistStoreDebounced();

    broadcastWs({
      type: 'CHAT_REACTION_UPDATED',
      messageId,
      reactions: target.reactions,
      timestamp: Date.now(),
    });

    res.json({ success: true, reactions: target.reactions });
  });

  // 4. Delete chat message
  app.delete('/api/chat/messages/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const initialLen = centralStore.chatMessages.length;
    centralStore.chatMessages = (centralStore.chatMessages as Array<{ id: string }>).filter((m) => m.id !== id);

    if (centralStore.chatMessages.length !== initialLen) {
      centralStore.lastUpdated = Date.now();
      persistStoreDebounced();

      broadcastWs({
        type: 'CHAT_MESSAGE_DELETED',
        messageId: id,
        timestamp: Date.now(),
      });
    }

    res.json({ success: true });
  });

  // 5. Mark channel messages as read
  app.post('/api/chat/mark-read', (req: Request, res: Response) => {
    const { channelId, userId } = req.body;
    if (channelId && userId) {
      const list = centralStore.chatMessages as Array<{
        channelId: string;
        leidoPor?: string[];
        [key: string]: unknown;
      }>;
      let count = 0;
      list.forEach((m) => {
        if (m.channelId === channelId) {
          if (!m.leidoPor) m.leidoPor = [];
          if (!m.leidoPor.includes(userId)) {
            m.leidoPor.push(userId);
            count++;
          }
        }
      });
      if (count > 0) {
        centralStore.lastUpdated = Date.now();
        persistStoreDebounced();
      }
    }
    res.json({ success: true });
  });

  // ==========================================
  // WHATSAPP AUTOMATION ENDPOINTS
  // ==========================================

  // 1. Get WhatsApp connection config and status
  app.get('/api/whatsapp/config', (_req: Request, res: Response) => {
    res.json({
      success: true,
      config: centralStore.whatsappConfig,
      logsCount: centralStore.whatsappLogs.length,
    });
  });

  // 2. Save WhatsApp settings and triggers
  app.post('/api/whatsapp/config', (req: Request, res: Response) => {
    const updates = req.body;
    centralStore.whatsappConfig = {
      ...centralStore.whatsappConfig,
      ...updates,
      triggers: {
        ...centralStore.whatsappConfig.triggers,
        ...(updates.triggers || {}),
      },
    };
    centralStore.lastUpdated = Date.now();
    persistStoreDebounced();

    broadcastWs({
      type: 'WHATSAPP_CONFIG_UPDATED',
      config: centralStore.whatsappConfig,
      timestamp: Date.now(),
    });

    res.json({ success: true, config: centralStore.whatsappConfig });
  });

  // 3. Pair device via QR / link code
  app.post('/api/whatsapp/pair-qr', (req: Request, res: Response) => {
    const { phoneNumber, action } = req.body;

    if (action === 'confirm' && phoneNumber) {
      centralStore.whatsappConfig.connected = true;
      centralStore.whatsappConfig.phoneNumber = phoneNumber;
      centralStore.whatsappConfig.pairedAt = new Date().toLocaleString('es-CO');
      centralStore.lastUpdated = Date.now();
      persistStoreDebounced();

      broadcastWs({
        type: 'WHATSAPP_STATUS_CHANGE',
        connected: true,
        phoneNumber,
        timestamp: Date.now(),
      });

      res.json({
        success: true,
        connected: true,
        phoneNumber,
        pairedAt: centralStore.whatsappConfig.pairedAt,
        message: 'WhatsApp vinculado exitosamente',
      });
      return;
    }

    // Generate pairing payload
    const pairingToken = 'falpro-wpp-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const qrPayload = `2@${pairingToken},${Date.now()},FALPRO_SAS_ERP`;

    res.json({
      success: true,
      qrPayload,
      pairingToken,
      expiresInSeconds: 60,
    });
  });

  // 4. Disconnect WhatsApp
  app.post('/api/whatsapp/disconnect', (_req: Request, res: Response) => {
    centralStore.whatsappConfig.connected = false;
    centralStore.whatsappConfig.phoneNumber = '';
    centralStore.whatsappConfig.pairedAt = '';
    centralStore.lastUpdated = Date.now();
    persistStoreDebounced();

    broadcastWs({
      type: 'WHATSAPP_STATUS_CHANGE',
      connected: false,
      timestamp: Date.now(),
    });

    res.json({ success: true, message: 'WhatsApp desvinculado' });
  });

  // 5. Send automated message in background
  app.post('/api/whatsapp/send', (req: Request, res: Response) => {
    const { to, message, pedidoId, tipo, cliente } = req.body;
    if (!to || !message) {
      res.status(400).json({ error: 'Faltan destinatario o contenido del mensaje' });
      return;
    }

    // Clean phone number
    const cleanPhone = String(to).replace(/\D/g, '');
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    const logEntry = {
      id: 'wlog-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      destinatario: cleanPhone,
      cliente: cliente || 'Cliente General',
      pedidoId: pedidoId || null,
      tipo: tipo || 'general',
      mensaje: message,
      estado: 'ENVIADO',
      fecha: `${dd}/${mm}/${yy} ${hh}:${min}`,
      timestamp: Date.now(),
    };

    centralStore.whatsappLogs = [logEntry, ...centralStore.whatsappLogs.slice(0, 99)];
    centralStore.lastUpdated = Date.now();
    persistStoreDebounced();

    broadcastWs({
      type: 'WHATSAPP_MESSAGE_SENT',
      log: logEntry,
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      messageId: logEntry.id,
      destinatario: cleanPhone,
      estado: 'ENVIADO',
      timestamp: Date.now(),
    });
  });

  // 6. Get dispatch history
  app.get('/api/whatsapp/logs', (_req: Request, res: Response) => {
    res.json({
      success: true,
      logs: centralStore.whatsappLogs,
      total: centralStore.whatsappLogs.length,
    });
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'FALPRO S.A.S. Multi-Screen Server',
      connectedScreens: activeScreens.size,
      time: new Date().toISOString(),
    });
  });

  // Integrate Vite middleware in development or serve static in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start listening on port 3000
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[FALPRO S.A.S.] Multi-device synchronization server running at http://0.0.0.0:${PORT}`);
    console.log(`[FALPRO S.A.S.] Real-time WebSocket listening at /ws`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting FALPRO server:', err);
  process.exit(1);
});
