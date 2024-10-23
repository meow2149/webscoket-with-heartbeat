interface WebSocketOptions {
  heartbeatInterval?: number
  reconnectDelay?: number
  timeout?: number
  debug?: boolean
}

interface WebSocketMessage {
  type: string
  [key: string]: any
}

const defaultOptions = {
  heartbeatInterval: 30 * 1000,
  reconnectDelay: 5 * 1000,
  timeout: 5 * 1000,
  debug: false
}

class WebSocketWithHeartbeat {
  private readonly options: Required<WebSocketOptions>
  private readonly url: string
  private webSocket: WebSocket | null = null
  private isManualClosed = false
  private heartbeat = {
    ping: 'ping',
    pong: 'pong'
  }

  private heartbeatTimer: ReturnType<typeof setInterval> | undefined
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined
  private preCloseTimer: ReturnType<typeof setTimeout> | undefined

  constructor(url: string, options?: WebSocketOptions) {
    this.options = { ...defaultOptions, ...options }
    this.url = url.replace(/^http/, 'ws')
    this.connect()
  }

  private connect() {
    this.webSocket = new WebSocket(this.url)
    this.webSocket.onopen = this.onOpen.bind(this)
    this.webSocket.onmessage = this.onMessage.bind(this)
    this.webSocket.onclose = this.onClose.bind(this)
    this.webSocket.onerror = this.onError.bind(this)
  }

  // Official WebSocket API
  public onopen: (ev: Event) => void = () => {}
  public onmessage: (ev: MessageEvent) => void = () => {}
  public onclose: (ev: CloseEvent) => void = () => {}
  public onerror: (ev: Event) => void = () => {}
  public send(data: string) {
    if (this.webSocket?.readyState === WebSocket.OPEN) {
      this.webSocket.send(data)
      this.debugLog('Message sent:', data)
    }
  }
  public close() {
    this.debugLog('Manual disconnection initiated.')
    this.isManualClosed = true
    this.webSocket?.close()
    this.stopHeartbeat()
  }

  // Custom WebSocket API
  private onOpen(ev: Event) {
    this.debugLog('Connection established.')
    this.onopen(ev)
    this.startHeartbeat()
  }
  private onMessage(ev: MessageEvent) {
    this.debugLog('Message received:', ev.data)
    const data: WebSocketMessage = JSON.parse(ev.data)
    if (data.type === this.heartbeat.pong) {
      this.debugLog('Heartbeat response received. Connection maintained.')
      clearTimeout(this.preCloseTimer)
      this.preCloseTimer = undefined
    } else {
      this.onmessage(ev)
    }
  }
  private onClose(event: CloseEvent) {
    this.debugLog('Connection closed.')
    this.onclose(event)
    if (!this.isManualClosed) {
      this.stopHeartbeat()
      this.reconnect()
    }
  }
  private onError(error: Event) {
    this.debugLog('An error occurred:', error)
    this.onerror(error)
  }

  // Other methods
  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.webSocket?.readyState === WebSocket.OPEN) {
        const data = JSON.stringify({ type: this.heartbeat.ping })
        this.webSocket.send(data)
        this.debugLog('Message sent:', data)
        this.preClose()
      }
    }, this.options.heartbeatInterval)
  }
  private stopHeartbeat() {
    clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = undefined
  }
  private reconnect() {
    this.reconnectTimer = setTimeout(() => {
      this.debugLog('Attempting to reconnect...')
      this.connect()
      this.stopReconnect()
    }, this.options.reconnectDelay)
  }
  private stopReconnect() {
    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = undefined
  }
  private preClose() {
    this.debugLog(`No heartbeat response. Closing connection in ${this.options.timeout}ms...`)
    this.preCloseTimer = setTimeout(() => {
      this.webSocket?.close()
      clearTimeout(this.preCloseTimer)
      this.preCloseTimer = undefined
    }, this.options.timeout)
  }
  private debugLog(...data: any[]) {
    if (this.options.debug) {
      console.log(
        '%c WebSocketWithHeartbeat',
        'background:#222;color:#ffd700;padding:4px;border-radius:5px;',
        ...data
      )
    }
  }
}

export default WebSocketWithHeartbeat
