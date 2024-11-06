export interface WebSocketOptions {
  heartbeatInterval?: number
  reconnectDelay?: number
  timeout?: number
  debug?: boolean
  messageType?: 'json' | 'binary'
}

export interface WebSocketMessage {
  type: string
  [key: string]: any
}

const defaultOptions = {
  heartbeatInterval: 30 * 1000,
  reconnectDelay: 5 * 1000,
  timeout: 5 * 1000,
  debug: false,
  messageType: 'json' as const
}

class WebSocketWithHeartbeat {
  readonly #options: Required<WebSocketOptions>
  #isPageVisible = true
  readonly #url: string
  #webSocket: WebSocket | null = null
  #isManualClosed = false
  #heartbeatTimer: ReturnType<typeof setInterval> | undefined
  #reconnectTimer: ReturnType<typeof setTimeout> | undefined
  #preCloseTimer: ReturnType<typeof setTimeout> | undefined

  constructor(url: string, options?: WebSocketOptions) {
    this.#options = { ...defaultOptions, ...options }
    this.#url = url.replace(/^http/, 'ws')
    this.#connect()
    document.addEventListener('visibilitychange', () => {
      this.#isPageVisible = document.visibilityState === 'visible'
      if (this.#isPageVisible) {
        this.#connect()
      } else {
        this.#destroy()
      }
    })
  }

  #connect() {
    if (
      this.#webSocket?.readyState === WebSocket.CONNECTING ||
      this.#webSocket?.readyState === WebSocket.OPEN
    ) {
      return
    }
    this.#destroy()
    const ws = new WebSocket(this.#url)
    ws.onopen = (ev: Event) => this.#onOpen(ev)
    ws.onmessage = (ev: MessageEvent) => this.#onMessage(ev)
    ws.onclose = (ev: CloseEvent) => this.#onClose(ev)
    ws.onerror = (ev: Event) => this.#onError(ev)
    this.#webSocket = ws
  }

  // Official WebSocket API
  onopen: (ev: Event) => void = () => {}
  onmessage: (ev: MessageEvent) => void = () => {}
  onclose: (ev: CloseEvent) => void = () => {}
  onerror: (ev: Event) => void = () => {}
  send(data: WebSocketMessage) {
    if (this.#webSocket?.readyState === WebSocket.OPEN) {
      const jsonData = JSON.stringify(data)
      if (this.#options.messageType === 'binary') {
        const blob = new Blob([jsonData], { type: 'application/json' })
        this.#webSocket.send(blob)
      } else {
        this.#webSocket.send(jsonData)
      }
      this.#debugLog('Message sent:', data)
    }
  }
  close() {
    this.#debugLog('Manual disconnection initiated.')
    this.#isManualClosed = true
    this.#destroy()
  }

  // Custom WebSocket API
  #onOpen = (ev: Event) => {
    this.#debugLog('Connection established.')
    this.onopen(ev)
    this.#stopHeartbeat()
    this.#startHeartbeat()
  }
  #onMessage = async (ev: MessageEvent) => {
    let jsonData: string
    if (this.#options.messageType === 'binary') {
      const blob: Blob = ev.data
      jsonData = await blob.text()
    } else {
      jsonData = ev.data
    }
    const data: WebSocketMessage = JSON.parse(jsonData)
    this.#debugLog('Message received:', data)
    if (data.type === 'pong' && this.#preCloseTimer) {
      this.#debugLog('Heartbeat response received. Connection maintained.')
      clearTimeout(this.#preCloseTimer)
      this.#preCloseTimer = undefined
    } else {
      this.onmessage(new MessageEvent('message', { data }))
    }
  }
  #onClose = (ev: CloseEvent) => {
    this.#debugLog('Connection closed.')
    this.#destroy()
    this.onclose(ev)
    if (!this.#isManualClosed) {
      this.#reconnect()
    }
  }
  #onError = (ev: Event) => {
    this.#debugLog('An error occurred:', ev)
    this.onerror(ev)
    if (this.#webSocket?.readyState === WebSocket.OPEN) {
      this.#webSocket.close()
    }
  }

  // Other methods
  #startHeartbeat = () => {
    this.#stopHeartbeat()
    if (this.#webSocket?.readyState === WebSocket.OPEN && this.#isPageVisible) {
      this.#sendHeartbeat()
      this.#heartbeatTimer = setInterval(() => {
        this.#sendHeartbeat()
      }, this.#options.heartbeatInterval)
    }
  }
  #sendHeartbeat = () => {
    if (this.#webSocket?.readyState !== WebSocket.OPEN) {
      this.#stopHeartbeat()
      return
    }
    const data = { type: 'ping' }
    const jsonData = JSON.stringify(data)
    if (this.#options.messageType === 'binary') {
      const blob = new Blob([jsonData], { type: 'application/json' })
      this.#webSocket.send(blob)
    } else {
      this.#webSocket.send(jsonData)
    }
    this.#debugLog('Heartbeat sent:', data)
    this.#preClose()
  }
  #stopHeartbeat = () => {
    clearInterval(this.#heartbeatTimer)
    this.#heartbeatTimer = undefined
  }
  #reconnect = () => {
    this.#stopReconnect()
    if (this.#isPageVisible) {
      this.#reconnectTimer = setTimeout(() => {
        this.#debugLog('Attempting to reconnect...')
        this.#isManualClosed = false
        this.#connect()
      }, this.#options.reconnectDelay)
    }
  }
  #stopReconnect = () => {
    clearTimeout(this.#reconnectTimer)
    this.#reconnectTimer = undefined
  }
  #preClose = () => {
    this.#debugLog(`No heartbeat response. Closing connection in ${this.#options.timeout}ms...`)
    this.#preCloseTimer = setTimeout(() => {
      this.#webSocket?.close()
      clearTimeout(this.#preCloseTimer)
      this.#preCloseTimer = undefined
    }, this.#options.timeout)
  }
  #destroy = () => {
    this.#stopHeartbeat()
    this.#stopReconnect()
    if (this.#preCloseTimer) {
      clearTimeout(this.#preCloseTimer)
      this.#preCloseTimer = undefined
    }
    if (this.#webSocket) {
      this.#webSocket.onopen = null
      this.#webSocket.onmessage = null
      this.#webSocket.onclose = null
      this.#webSocket.onerror = null
      if (this.#webSocket.readyState === WebSocket.OPEN) {
        this.#webSocket.close()
      }
      this.#webSocket = null
    }
  }
  #debugLog = (...data: any[]) => {
    if (this.#options.debug) {
      console.log(
        '%c WebSocketWithHeartbeat',
        'background:#222;color:#ffd700;padding:4px;border-radius:4px;',
        ...data
      )
    }
  }
}

export default WebSocketWithHeartbeat
