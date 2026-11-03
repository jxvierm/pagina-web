/**
 * Multi-Screen Real-Time Synchronization Service for FALPRO S.A.S.
 * Enables instantaneous bi-directional state synchronization across multiple physical devices:
 * - Smart phones (vendedores y clientes)
 * - Tablets en planta y taller de producción
 * - Computadores de escritorio en administración y facturación
 * Uses WebSockets with HTTP REST persistence and BroadcastChannel local fallbacks.
 */

export interface ConnectedScreenInfo {
  id: string;
  module: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  label: string;
  user?: string;
  lastSeen: number;
  ip?: string;
}

export type EntityUpdateCallback = (entity: string, data: unknown, screenId: string) => void;
export type ScreenCountCallback = (count: number, screens: ConnectedScreenInfo[]) => void;
export type InitialStateCallback = (store: Record<string, unknown>) => void;
export type ChatMessageCallback = (message: any) => void;
export type ChatTypingCallback = (data: { user: string; channelId: string; isTyping: boolean }) => void;
export type ChatReactionCallback = (data: { messageId: string; reactions: Record<string, string[]> }) => void;

class MultiScreenSyncService {
  private screenId: string;
  private deviceType: 'mobile' | 'tablet' | 'desktop';
  private screenLabel: string;
  private currentUser: string = '';
  private channel: BroadcastChannel | null = null;
  private socket: WebSocket | null = null;
  private eventSource: EventSource | null = null;
  private currentModule: string = 'dashboard';
  private entityListeners: Set<EntityUpdateCallback> = new Set();
  private screenCountListeners: Set<ScreenCountCallback> = new Set();
  private initialStateListeners: Set<InitialStateCallback> = new Set();
  private chatMessageListeners: Set<ChatMessageCallback> = new Set();
  private chatTypingListeners: Set<ChatTypingCallback> = new Set();
  private chatReactionListeners: Set<ChatReactionCallback> = new Set();
  private knownScreens: Map<string, ConnectedScreenInfo> = new Map();
  private pingInterval: number | null = null;
  private cleanupInterval: number | null = null;
  private reconnectTimeout: number | null = null;
  private isInitialized = false;

  constructor() {
    // Generate or retrieve persistent screen ID for this browser session
    const storedId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('falpro_screen_id') : null;
    if (storedId) {
      this.screenId = storedId;
    } else {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      this.screenId = `FALPRO-${randomSuffix}`;
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('falpro_screen_id', this.screenId);
      }
    }

    // Detect device physical form factor
    this.deviceType = this.detectDeviceType();
    this.screenLabel = this.generateDeviceLabel(this.deviceType, this.screenId);
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    const ua = navigator.userAgent.toLowerCase();
    const width = window.innerWidth;

    if (/ipad|tablet|(android(?!.*mobile))/i.test(ua) || (width >= 600 && width <= 1024)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua) || width < 600) {
      return 'mobile';
    }
    return 'desktop';
  }

  private generateDeviceLabel(type: 'mobile' | 'tablet' | 'desktop', id: string): string {
    const shortId = id.replace('FALPRO-', '');
    switch (type) {
      case 'mobile':
        return `Móvil (${shortId})`;
      case 'tablet':
        return `Tablet Taller (${shortId})`;
      case 'desktop':
      default:
        return `PC Oficina (${shortId})`;
    }
  }

  public init(initialModule: string = 'dashboard', initialUser?: string) {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;
    this.currentModule = initialModule;
    if (initialUser) this.currentUser = initialUser;

    // Register our screen locally
    const selfInfo: ConnectedScreenInfo = {
      id: this.screenId,
      module: this.currentModule,
      deviceType: this.deviceType,
      label: this.screenLabel,
      user: this.currentUser || undefined,
      lastSeen: Date.now(),
    };
    this.knownScreens.set(this.screenId, selfInfo);

    // 1. Initialize local BroadcastChannel for zero-latency communication across local tabs
    if ('BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('falpro_realtime_multiscreen');
        this.channel.onmessage = (event) => this.handleLocalMessage(event.data);
      } catch (e) {
        console.warn('BroadcastChannel not available:', e);
      }
    }

    // 2. Storage event fallback for same-device cross-tab sync
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith('falpro_app_data_') && event.newValue) {
        const entity = event.key.replace('falpro_app_data_', '').replace('_v4', '');
        try {
          const parsed = JSON.parse(event.newValue);
          this.notifyEntityListeners(entity, parsed, 'storage_local');
        } catch {}
      }
    });

    // 3. Connect to server WebSocket for cross-device real-time sync
    this.connectWebSocket();

    // 4. Connect to SSE fallback
    this.connectSSE();

    // 5. Fetch initial central state from server immediately
    this.fetchInitialState();

    // 6. Regular heartbeat to keep connection alive and update presence
    this.pingInterval = window.setInterval(() => {
      this.sendHeartbeat();
    }, 3500);

    // 7. Cleanup inactive screens locally every 4 seconds
    this.cleanupInterval = window.setInterval(() => {
      const now = Date.now();
      let changed = false;
      this.knownScreens.forEach((info, id) => {
        if (id !== this.screenId && now - info.lastSeen > 9500) {
          this.knownScreens.delete(id);
          changed = true;
        }
      });
      if (changed) {
        this.notifyScreenCountListeners();
      }
    }, 4000);

    // 8. Gracefully notify when leaving
    window.addEventListener('beforeunload', () => {
      this.sendLeave();
    });

    this.notifyScreenCountListeners();
  }

  private connectWebSocket() {
    if (typeof window === 'undefined') return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        // Send join packet with device metadata
        this.sendWsMessage({
          type: 'SCREEN_JOIN',
          screenId: this.screenId,
          module: this.currentModule,
          deviceType: this.deviceType,
          label: this.screenLabel,
          user: this.currentUser,
          timestamp: Date.now(),
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (e) {
          console.warn('Error parsing incoming WS message:', e);
        }
      };

      this.socket.onerror = () => {
        // Silently will trigger onclose and retry
      };

      this.socket.onclose = () => {
        this.socket = null;
        if (!this.reconnectTimeout) {
          this.reconnectTimeout = window.setTimeout(() => {
            this.reconnectTimeout = null;
            this.connectWebSocket();
          }, 3000);
        }
      };
    } catch (err) {
      console.warn('Could not establish WebSocket connection:', err);
    }
  }

  private connectSSE() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    try {
      this.eventSource = new EventSource('/api/sync/events');

      this.eventSource.addEventListener('screens', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (Array.isArray(parsed.screens)) {
            this.updateScreensList(parsed.screens);
          }
        } catch {}
      });

      this.eventSource.addEventListener('data_sync', (e) => {
        try {
          const { entity, data, sourceScreenId } = JSON.parse(e.data);
          if (sourceScreenId !== this.screenId) {
            this.notifyEntityListeners(entity, data, sourceScreenId);
          }
        } catch {}
      });
    } catch (err) {
      console.warn('SSE fallback not initialized:', err);
    }
  }

  private sendWsMessage(msg: Record<string, unknown>) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(msg));
        return true;
      } catch (err) {
        console.warn('Error sending WS message:', err);
      }
    }
    return false;
  }

  private handleServerMessage(msg: Record<string, unknown>) {
    if (!msg || typeof msg !== 'object') return;
    const { type, entity, data, sourceScreenId, screens, store } = msg;

    if (type === 'DATA_SYNC' && entity) {
      if (sourceScreenId !== this.screenId) {
        this.notifyEntityListeners(String(entity), data, String(sourceScreenId));
      }
    } else if (type === 'SCREENS_UPDATE' && Array.isArray(screens)) {
      this.updateScreensList(screens as ConnectedScreenInfo[]);
    } else if ((type === 'STATE_RESPONSE' || type === 'CONNECTED_ACK') && store) {
      if (Array.isArray(screens)) {
        this.updateScreensList(screens as ConnectedScreenInfo[]);
      }
      this.notifyInitialStateListeners(store as Record<string, unknown>);
    } else if (type === 'CHAT_MESSAGE_RECEIVED' && msg.message) {
      this.chatMessageListeners.forEach((cb) => {
        try {
          cb(msg.message);
        } catch (e) {
          console.warn('Chat listener error:', e);
        }
      });
    } else if (type === 'CHAT_TYPING') {
      this.chatTypingListeners.forEach((cb) => {
        try {
          cb({
            user: String(msg.user || ''),
            channelId: String(msg.channelId || ''),
            isTyping: Boolean(msg.isTyping),
          });
        } catch (e) {
          console.warn('Typing listener error:', e);
        }
      });
    } else if (type === 'CHAT_REACTION_UPDATED') {
      this.chatReactionListeners.forEach((cb) => {
        try {
          cb({
            messageId: String(msg.messageId),
            reactions: (msg.reactions as Record<string, string[]>) || {},
          });
        } catch (e) {
          console.warn('Reaction listener error:', e);
        }
      });
    }
  }

  private handleLocalMessage(data: Record<string, unknown>) {
    if (!data || typeof data !== 'object') return;
    const { type, screenId, entity, module } = data;
    if (screenId === this.screenId) return;

    if (type === 'DATA_SYNC' && entity) {
      this.notifyEntityListeners(String(entity), (data as { data: unknown }).data, String(screenId));
    } else if (type === 'CHAT_MESSAGE_RECEIVED' && data.message) {
      this.chatMessageListeners.forEach((cb) => {
        try { cb(data.message); } catch {}
      });
    } else if (type === 'CHAT_TYPING') {
      this.chatTypingListeners.forEach((cb) => {
        try {
          cb({
            user: String(data.user || ''),
            channelId: String(data.channelId || ''),
            isTyping: Boolean(data.isTyping),
          });
        } catch {}
      });
    } else if (type === 'CHAT_REACTION_UPDATED') {
      this.chatReactionListeners.forEach((cb) => {
        try {
          cb({
            messageId: String(data.messageId),
            reactions: (data.reactions as Record<string, string[]>) || {},
          });
        } catch {}
      });
    } else if (type === 'SCREEN_JOIN' || type === 'HEARTBEAT_PING') {
      this.knownScreens.set(String(screenId), {
        id: String(screenId),
        module: String(module || 'dashboard'),
        deviceType: (data.deviceType as 'mobile' | 'tablet' | 'desktop') || 'desktop',
        label: String(data.label || screenId),
        user: data.user ? String(data.user) : undefined,
        lastSeen: Date.now(),
      });
      this.notifyScreenCountListeners();
    } else if (type === 'SCREEN_LEAVE') {
      this.knownScreens.delete(String(screenId));
      this.notifyScreenCountListeners();
    }
  }

  private updateScreensList(screens: ConnectedScreenInfo[]) {
    // Preserve self
    const self = this.knownScreens.get(this.screenId);
    this.knownScreens.clear();
    if (self) this.knownScreens.set(this.screenId, self);

    screens.forEach((s) => {
      this.knownScreens.set(s.id, {
        ...s,
        lastSeen: Date.now(),
      });
    });
    this.notifyScreenCountListeners();
  }

  public async fetchInitialState(): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch('/api/sync/state');
      if (res.ok) {
        const json = await res.json();
        if (json.store) {
          if (Array.isArray(json.screens)) {
            this.updateScreensList(json.screens);
          }
          this.notifyInitialStateListeners(json.store);
          return json.store;
        }
      }
    } catch (err) {
      console.warn('Could not fetch initial server state:', err);
    }
    return null;
  }

  public updateActiveModule(moduleName: string) {
    this.currentModule = moduleName;
    const self = this.knownScreens.get(this.screenId);
    if (self) {
      self.module = moduleName;
      self.lastSeen = Date.now();
    }
    this.sendHeartbeat();
  }

  public updateCurrentUser(userName: string) {
    this.currentUser = userName;
    const self = this.knownScreens.get(this.screenId);
    if (self) {
      self.user = userName;
      self.lastSeen = Date.now();
    }
    this.sendHeartbeat();
  }

  public broadcastEntityChange(entity: string, data: unknown) {
    const payload = {
      type: 'DATA_SYNC',
      screenId: this.screenId,
      entity,
      data,
      module: this.currentModule,
      deviceType: this.deviceType,
      label: this.screenLabel,
      user: this.currentUser,
      timestamp: Date.now(),
    };

    // 1. Post to local BroadcastChannel (for instant tab sync)
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (err) {
        console.warn('Channel post error:', err);
      }
    }

    // 2. Send through WebSocket to all other devices
    const sentWs = this.sendWsMessage(payload);

    // 3. Fallback & persistence via REST endpoint
    fetch('/api/sync/entity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity,
        data,
        screenId: this.screenId,
        module: this.currentModule,
        deviceType: this.deviceType,
        label: this.screenLabel,
        user: this.currentUser,
      }),
    }).catch((err) => {
      if (!sentWs) {
        console.warn('Failed to sync entity via REST:', err);
      }
    });
  }

  private sendHeartbeat() {
    const msg = {
      type: 'HEARTBEAT_PING',
      screenId: this.screenId,
      module: this.currentModule,
      deviceType: this.deviceType,
      label: this.screenLabel,
      user: this.currentUser,
      timestamp: Date.now(),
    };

    // Over WebSocket
    const sentWs = this.sendWsMessage(msg);

    // BroadcastChannel local
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch {}
    }

    // Periodic HTTP heartbeat fallback
    if (!sentWs) {
      fetch('/api/sync/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenId: this.screenId,
          module: this.currentModule,
          deviceType: this.deviceType,
          label: this.screenLabel,
          user: this.currentUser,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.screens)) {
            this.updateScreensList(data.screens);
          }
        })
        .catch(() => {});
    }
  }

  private sendLeave() {
    const msg = {
      type: 'SCREEN_LEAVE',
      screenId: this.screenId,
      timestamp: Date.now(),
    };
    this.sendWsMessage(msg);
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch {}
    }
    // Beacon for page unload
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/sync/heartbeat',
        JSON.stringify({ screenId: this.screenId, leave: true })
      );
    }
  }

  public subscribeToEntityChanges(cb: EntityUpdateCallback): () => void {
    this.entityListeners.add(cb);
    return () => this.entityListeners.delete(cb);
  }

  public subscribeToScreenCount(cb: ScreenCountCallback): () => void {
    this.screenCountListeners.add(cb);
    cb(this.knownScreens.size, Array.from(this.knownScreens.values()));
    return () => this.screenCountListeners.delete(cb);
  }

  public subscribeToInitialState(cb: InitialStateCallback): () => void {
    this.initialStateListeners.add(cb);
    return () => this.initialStateListeners.delete(cb);
  }

  public getScreenId(): string {
    return this.screenId;
  }

  public getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    return this.deviceType;
  }

  public getScreenLabel(): string {
    return this.screenLabel;
  }

  public getConnectedCount(): number {
    return this.knownScreens.size;
  }

  public getConnectedScreens(): ConnectedScreenInfo[] {
    return Array.from(this.knownScreens.values());
  }

  private notifyEntityListeners(entity: string, data: unknown, sourceScreenId: string) {
    this.entityListeners.forEach((cb) => {
      try {
        cb(entity, data, sourceScreenId);
      } catch (e) {
        console.error('Error in multi-screen entity listener:', e);
      }
    });
  }

  private notifyScreenCountListeners() {
    const list = Array.from(this.knownScreens.values());
    const count = list.length;
    this.screenCountListeners.forEach((cb) => {
      try {
        cb(count, list);
      } catch (e) {
        console.error('Error in screen count listener:', e);
      }
    });
  }

  private notifyInitialStateListeners(store: Record<string, unknown>) {
    this.initialStateListeners.forEach((cb) => {
      try {
        cb(store);
      } catch (e) {
        console.error('Error in initial state listener:', e);
      }
    });
  }

  // --- Chat Methods & Real-Time Dispatch ---

  public sendChatMessage(messageData: unknown) {
    const payload = messageData as Record<string, unknown>;
    // 1. Send via WebSocket for instant distribution
    const sentWs = this.sendWsMessage({
      type: 'CHAT_SEND_MESSAGE',
      screenId: this.screenId,
      data: payload,
      timestamp: Date.now(),
    });

    // 2. BroadcastChannel for cross-tab sync in same browser
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'CHAT_MESSAGE_RECEIVED',
          message: payload,
          screenId: this.screenId,
        });
      } catch {}
    }

    // 3. REST API persistence & SSE fallback
    fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => {
      if (!sentWs) {
        console.warn('Could not post chat message to REST:', err);
      }
    });
  }

  public sendTyping(user: string, channelId: string, isTyping: boolean) {
    this.sendWsMessage({
      type: 'CHAT_TYPING',
      screenId: this.screenId,
      data: { user, channelId, isTyping },
    });
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'CHAT_TYPING',
          screenId: this.screenId,
          user,
          channelId,
          isTyping,
        });
      } catch {}
    }
  }

  public sendReaction(messageId: string, emoji: string, username: string) {
    this.sendWsMessage({
      type: 'CHAT_REACTION',
      screenId: this.screenId,
      data: { messageId, emoji, username },
    });
    fetch('/api/chat/reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, emoji, username }),
    }).catch(() => {});
  }

  public markChatAsRead(channelId: string, userId: string) {
    this.sendWsMessage({
      type: 'CHAT_MARK_READ',
      screenId: this.screenId,
      data: { channelId, userId },
    });
    fetch('/api/chat/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId, userId }),
    }).catch(() => {});
  }

  public subscribeToChatMessages(cb: ChatMessageCallback): () => void {
    this.chatMessageListeners.add(cb);
    return () => this.chatMessageListeners.delete(cb);
  }

  public subscribeToTyping(cb: ChatTypingCallback): () => void {
    this.chatTypingListeners.add(cb);
    return () => this.chatTypingListeners.delete(cb);
  }

  public subscribeToReactions(cb: ChatReactionCallback): () => void {
    this.chatReactionListeners.add(cb);
    return () => this.chatReactionListeners.delete(cb);
  }
}

export const multiScreenSync = new MultiScreenSyncService();
