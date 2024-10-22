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
      this.debugLog('Sent:', data)
    }
  }
  public close() {
    this.debugLog('Disconnect manually.')
    this.isManualClosed = true
    this.webSocket?.close()
    this.stopHeartbeat()
  }

  // Custom WebSocket API
  private onOpen(ev: Event) {
    this.debugLog('Connected.')
    this.onopen(ev)
    this.startHeartbeat()
  }
  private onMessage(ev: MessageEvent) {
    this.debugLog('Received:', ev.data)
    const data: WebSocketMessage = JSON.parse(ev.data)
    if (data.type === this.heartbeat.pong) {
      this.debugLog('Closing cancelled.')
      this.stopPreClose()
    } else {
      this.onmessage(ev)
    }
  }
  private onClose(event: CloseEvent) {
    this.debugLog('Disconnected.')
    this.onclose(event)
    if (!this.isManualClosed) {
      this.stopHeartbeat()
      this.reconnect()
    }
  }
  private onError(error: Event) {
    this.debugLog('Error occurred:', error)
    this.onerror(error)
  }

  // Other methods
  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.webSocket?.readyState === WebSocket.OPEN) {
        this.webSocket.send(JSON.stringify({ type: this.heartbeat.ping }))
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
      this.debugLog('Reconnecting...')
      this.connect()
      this.stopReconnect()
    }, this.options.reconnectDelay)
  }
  private stopReconnect() {
    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = undefined
  }
  private preClose() {
    this.debugLog(`Closing in ${this.options.timeout}ms...`)
    this.preCloseTimer = setTimeout(() => {
      this.webSocket?.close()
      this.stopPreClose()
    }, this.options.timeout)
  }
  private stopPreClose() {
    clearTimeout(this.preCloseTimer)
    this.preCloseTimer = undefined
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
