// WebSocket Manager simplificado para uso com Next.js
// Versão sem dependências React para fácil importação

interface WebSocketConfig {
  protocols?: string[]
  reconnectAttempts?: number
  baseDelay?: number
  maxDelay?: number
  onOpen?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
  onMessage?: (event: MessageEvent) => void
}

interface WebSocketState {
  ws: WebSocket | null
  reconnectAttempts: number
  isConnecting: boolean
  isDestroyed: boolean
  lastUrl: string | null
  lastConfig: WebSocketConfig | null
}

export class SimpleWebSocketManager {
  private static instance: SimpleWebSocketManager | null = null
  private webSockets: Map<string, WebSocketState> = new Map()

  private constructor() {}

  public static getInstance(): SimpleWebSocketManager {
    if (!SimpleWebSocketManager.instance) {
      SimpleWebSocketManager.instance = new SimpleWebSocketManager()
    }
    return SimpleWebSocketManager.instance
  }

  public connect(url: string, config: WebSocketConfig = {}): Promise<WebSocket> {
    const id = this.getConnectionId(url, config)
    let state = this.webSockets.get(id)

    if (!state) {
      state = {
        ws: null,
        reconnectAttempts: 0,
        isConnecting: false,
        isDestroyed: false,
        lastUrl: url,
        lastConfig: config
      }
      this.webSockets.set(id, state)
    }

    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve(state.ws)
    }

    if (state.isConnecting) {
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          const currentState = this.webSockets.get(id)
          if (currentState?.ws && currentState.ws.readyState === WebSocket.OPEN) {
            resolve(currentState.ws)
          } else if (currentState?.isConnecting) {
            setTimeout(checkConnection, 100)
          } else {
            reject(new Error('WebSocket connection failed'))
          }
        }
        checkConnection()
      })
    }

    return this.createConnection(url, config)
  }

  private async createConnection(url: string, config: WebSocketConfig): Promise<WebSocket> {
    const id = this.getConnectionId(url, config)
    const state = this.webSockets.get(id)

    if (!state || state.isDestroyed) {
      throw new Error('WebSocket state is invalid')
    }

    state.isConnecting = true

    try {
      console.log(`[WS] Connecting to: ${url} (attempt ${state.reconnectAttempts + 1})`)

      const ws = new WebSocket(url, config.protocols)

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close()
          state.isConnecting = false
          reject(new Error('WebSocket connection timeout'))
        }, 10000)

        ws.onopen = (event) => {
          clearTimeout(timeout)
          console.log(`[WS] Connected to: ${url}`)

          state.ws = ws
          state.isConnecting = false
          state.reconnectAttempts = 0

          this.setupEventListeners(ws, url, config)

          if (config.onOpen) {
            config.onOpen(event)
          }

          resolve(ws)
        }

        ws.onclose = (event) => {
          clearTimeout(timeout)
          console.log(`[WS] Disconnected from: ${url} (${event.code}) - ${event.reason}`)

          state.isConnecting = false
          state.ws = null

          if (config.onClose) {
            config.onClose(event)
          }

          if (!state.isDestroyed && !this.wasCleanClose(event.code)) {
            this.scheduleReconnect(url, config)
          }
        }

        ws.onerror = (event) => {
          clearTimeout(timeout)
          console.error(`[WS] Error connecting to: ${url}`, event)

          state.isConnecting = false

          if (config.onError) {
            config.onError(event)
          }

          reject(new Error('WebSocket connection failed'))
        }

        ws.onmessage = (event) => {
          if (config.onMessage) {
            config.onMessage(event)
          }
        }
      })

    } catch (error) {
      state.isConnecting = false
      throw error
    }
  }

  private setupEventListeners(ws: WebSocket, url: string, config: WebSocketConfig) {
    const id = this.getConnectionId(url, config)
    const state = this.webSockets.get(id)

    if (!state) return

    ws.onclose = (event) => {
      console.log(`[WS] Disconnected from: ${url} (${event.code}) - ${event.reason}`)
      state.isConnecting = false
      state.ws = null

      if (config.onClose) {
        config.onClose(event)
      }

      if (!state.isDestroyed && !this.wasCleanClose(event.code)) {
        this.scheduleReconnect(url, config)
      }
    }

    ws.onerror = (event) => {
      console.error(`[WS] WebSocket error for: ${url}`, event)

      if (config.onError) {
        config.onError(event)
      }
    }

    ws.onmessage = (event) => {
      if (config.onMessage) {
        config.onMessage(event)
      }
    }
  }

  private scheduleReconnect(url: string, config: WebSocketConfig) {
    const id = this.getConnectionId(url, config)
    const state = this.webSockets.get(id)

    if (!state || state.isDestroyed || state.reconnectAttempts >= (config.reconnectAttempts || 5)) {
      console.log(`[WS] Max reconnection attempts reached for: ${url}`)
      return
    }

    state.reconnectAttempts++

    const baseDelay = config.baseDelay || 1000
    const maxDelay = config.maxDelay || 30000
    const delay = Math.min(baseDelay * Math.pow(2, state.reconnectAttempts - 1), maxDelay)
    const jitter = Math.random() * 0.1 * delay

    const totalDelay = delay + jitter
    console.log(`[WS] Scheduling reconnection to ${url} in ${Math.round(totalDelay)}ms (attempt ${state.reconnectAttempts})`)

    setTimeout(() => {
      if (!state.isDestroyed) {
        this.createConnection(url, config).catch(error => {
          console.error(`[WS] Reconnection failed for: ${url}`, error)
        })
      }
    }, totalDelay)
  }

  public disconnect(url: string, config: WebSocketConfig = {}) {
    const id = this.getConnectionId(url, config)
    const state = this.webSockets.get(id)

    if (state && state.ws) {
      state.isDestroyed = true
      state.ws.close(1000, 'Client disconnect')
      state.ws = null
    }
  }

  public disconnectAll() {
    this.webSockets.forEach((state, id) => {
      if (state.ws) {
        state.isDestroyed = true
        state.ws.close(1000, 'Client disconnect all')
      }
    })
    this.webSockets.clear()
  }

  public isConnected(url: string, config: WebSocketConfig = {}): boolean {
    const id = this.getConnectionId(url, config)
    const state = this.webSockets.get(id)
    return state?.ws?.readyState === WebSocket.OPEN || false
  }

  public send(url: string, data: string | ArrayBufferLike | Blob, config: WebSocketConfig = {}): boolean {
    if (!this.isConnected(url, config)) {
      console.warn(`[WS] Cannot send message - not connected to: ${url}`)
      return false
    }

    const id = this.getConnectionId(url, config)
    const state = this.webSockets.get(id)

    if (state?.ws?.readyState === WebSocket.OPEN) {
      try {
        state.ws.send(data)
        return true
      } catch (error) {
        console.error(`[WS] Failed to send message to: ${url}`, error)
        return false
      }
    }

    return false
  }

  public getState(url: string, config: WebSocketConfig = {}) {
    const id = this.getConnectionId(url, config)
    const state = this.webSockets.get(id)

    if (!state) return null

    return {
      readyState: state.ws?.readyState || WebSocket.CLOSED,
      reconnectAttempts: state.reconnectAttempts,
      isConnecting: state.isConnecting,
      url: state.lastUrl
    }
  }

  private getConnectionId(url: string, config: WebSocketConfig): string {
    const protocols = config.protocols?.join(',') || ''
    return `${url}:${protocols}`
  }

  private wasCleanClose(code: number): boolean {
    return code === 1000 || code === 1001
  }

  public cleanup() {
    const inactiveConnections: string[] = []

    this.webSockets.forEach((state, id) => {
      if (!state.ws || state.ws.readyState === WebSocket.CLOSED) {
        inactiveConnections.push(id)
      }
    })

    inactiveConnections.forEach(id => {
      this.webSockets.delete(id)
    })
  }

  public getStats() {
    let totalConnections = 0
    let activeConnections = 0
    let connectingConnections = 0

    this.webSockets.forEach(state => {
      totalConnections++
      if (state.ws?.readyState === WebSocket.OPEN) {
        activeConnections++
      } else if (state.isConnecting) {
        connectingConnections++
      }
    })

    return {
      total: totalConnections,
      active: activeConnections,
      connecting: connectingConnections,
      inactive: totalConnections - activeConnections - connectingConnections
    }
  }
}

// Singleton export
export const wsManager = SimpleWebSocketManager.getInstance()

// Função utilitária para verificar se WebSocket está disponível
export function isWebSocketSupported(): boolean {
  return typeof WebSocket !== 'undefined'
}

// Função para criar WebSocket com fallback automático
export function createWebSocketWithFallback(
  url: string,
  config: WebSocketConfig = {},
  fallback?: () => void
) {
  if (!isWebSocketSupported()) {
    console.warn('[WS] WebSocket not supported, using fallback')
    if (fallback) fallback()
    return null
  }

  return wsManager.connect(url, config).catch(error => {
    console.error('[WS] WebSocket connection failed:', error)
    if (fallback) fallback()
    return null
  })
}