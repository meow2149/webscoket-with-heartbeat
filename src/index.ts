/**
 * @interface WebSocketOptions
 * @description 配置 WebSocketWithHeartbeat 实例的可选项。
 * @property {number} [heartbeatInterval=30000] - 心跳间隔时间，单位为毫秒，默认为 30000。
 * @property {number} [reconnectInterval=5000] - 重连间隔时间，单位为毫秒，默认为 5000。
 * @property {number} [maxReconnectAttempts=0] - 最大重连次数，默认为 0 表示无限制。
 * @property {number} [maxReconnectInterval=5000] - 最大重连间隔时间，单位为毫秒，默认为 5000。
 * @property {number} [timeout=5000] - 超时时间，单位为毫秒，默认为 5000。
 * @property {boolean} [debug=false] - 开启 debug 模式后将打印日志, 默认为 false。
 * @property {'client' | 'server'} [heartbeatInitiator='client'] - 心跳发起方，默认为 'client'。
 * @property {boolean} [singleton=false] - 是否为单例模式，默认为 false。
 */
interface WebSocketOptions {
  heartbeatInterval: number
  reconnectInterval: number
  maxReconnectAttempts: number
  maxReconnectInterval: number
  timeout: number
  debug: boolean
  heartbeatInitiator: 'client' | 'server'
  singleton: boolean
}

/**
 * @interface WebSocketMessage
 * @description WebSocket 消息对象的类型。
 * @property {string} type - 消息类型。
 * @property {string} data - 消息内容。
 */
interface WebSocketMessage {
  type: string
  data: string
}

/**
 * @constant defaultOptions
 * @description 默认配置项。
 */
const defaultOptions: WebSocketOptions = {
  heartbeatInterval: 1000 * 30,
  reconnectInterval: 1000 * 5,
  maxReconnectAttempts: 0,
  maxReconnectInterval: 1000 * 5,
  timeout: 1000 * 5,
  debug: false,
  heartbeatInitiator: 'client',
  singleton: false
}

/**
 * @class WebSocketWithHeartbeat
 * @description 封装了带心跳机制和重连功能的 WebSocket 客户端类。
 */
class WebSocketWithHeartbeat {
  private static instance: WebSocketWithHeartbeat | null = null

  private readonly heartbeatInterval: number
  private reconnectInterval: number
  private readonly maxReconnectAttempts: number
  private readonly maxReconnectInterval: number
  private readonly timeout: number
  private readonly debug: boolean
  private readonly heartbeatInitiator: 'client' | 'server'
  private readonly singleton: boolean

  private readonly url: string

  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private heartbeatCheckTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts: number = 0
  private readonly initialReconnectInterval: number
  private ws: WebSocket | null = null

  public onopen: () => void = () => {}
  public onmessage: (event: MessageEvent) => void = () => {}
  public onclose: () => void = () => {}
  public onerror: (error: Event) => void = () => {}

  /**
   * @constructor
   * @param {string} url - 服务器的 URL，支持 HTTP HTTPS WS WSS协议。
   * @param {Partial<WebSocketOptions>} [options={}] - 可选配置对象，用于覆盖默认配置。
   */
  constructor(url: string, options: Partial<WebSocketOptions> = {}) {
    const config = { ...defaultOptions, ...options }
    this.heartbeatInterval = config.heartbeatInterval
    this.reconnectInterval = config.reconnectInterval
    this.maxReconnectAttempts = config.maxReconnectAttempts
    this.maxReconnectInterval = config.maxReconnectInterval
    this.timeout = config.timeout
    this.debug = config.debug
    this.heartbeatInitiator = config.heartbeatInitiator
    this.singleton = config.singleton
    this.url = url.replace(/^http/, 'ws')
    this.initialReconnectInterval = this.reconnectInterval
    if (this.singleton && WebSocketWithHeartbeat.instance) {
      return WebSocketWithHeartbeat.instance
    }
    this.connect()
  }

  /**
   * @private
   * @method connect
   * @description 建立 WebSocket 连接，并绑定事件回调函数。
   */
  private connect() {
    this.ws = new WebSocket(this.url)
    this.ws.onopen = () => this.onOpen()
    this.ws.onmessage = (event) => this.onMessage(event)
    this.ws.onclose = () => this.onClose()
    this.ws.onerror = (error) => this.onError(error)
  }

  /**
   * @private
   * @method onOpen
   * @description WebSocket 连接建立后的回调函数。
   */
  private onOpen() {
    this.onopen()
    this.log('WebSocket连接已建立')
    this.reconnectAttempts = 0
    this.reconnectInterval = this.initialReconnectInterval
    if (this.heartbeatInitiator === 'client') {
      this.startHeartbeat()
    } else {
      this.startHeartbeatCheck()
    }
  }

  /**
   * @private
   * @method onMessage
   * @description 接收到服务器消息时的回调函数。
   * @param {MessageEvent} event - WebSocket 消息事件。
   */
  private onMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      this.log('收到服务器消息:', message)
      if (message.type === 'heartbeat') {
        if (this.heartbeatInitiator === 'client') {
          this.resetHeartbeat()
        } else {
          this.resetHeartbeatCheck()
        }
      } else {
        this.onmessage(event)
      }
    } catch (error) {
      this.log(error)
    }
  }

  /**
   * @private
   * @method onClose
   * @description WebSocket 连接关闭后的回调函数。
   */
  private onClose() {
    this.onclose()
    this.log('WebSocket连接已关闭，尝试重连...')
    this.cleanup()
    this.reconnect()
  }

  /**
   * @private
   * @method onError
   * @description WebSocket 发生错误时的回调函数。
   * @param {Event} error - WebSocket 错误事件。
   */
  private onError(error: Event) {
    this.onerror(error)
    this.log('WebSocket错误:', error)
  }

  /**
   * @public
   * @method send
   * @description 通过 WebSocket 发送消息。
   * @param {string} message - 要发送的消息内容。
   */
  public send(message: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message)
      this.log('发送消息:', message)
    } else {
      this.log('WebSocket 连接未打开，无法发送消息')
    }
  }

  /**
   * @private
   * @method startHeartbeat
   * @description 启动心跳，定期发送心跳消息。
   */
  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const message = {
          type: 'heartbeat',
          data: 'ping'
        }
        this.ws.send(JSON.stringify(message))
        this.log('发送心跳消息:', message)
      }
    }, this.heartbeatInterval)
  }

  /**
   * @private
   * @method startHeartbeatCheck
   * @description 启动心跳检测，定期检测是否接收到心跳消息。
   */
  private startHeartbeatCheck() {
    this.stopHeartbeatCheck()
    this.heartbeatCheckTimer = setTimeout(() => {
      this.log('心跳超时，连接断开，尝试重连...')
      this.onClose()
    }, this.heartbeatInterval + this.timeout)
  }

  /**
   * @private
   * @method resetHeartbeat
   * @description 重置心跳。
   */
  private resetHeartbeat() {
    this.stopHeartbeat()
    this.startHeartbeat()
  }

  /**
   * @private
   * @method resetHeartbeatCheck
   * @description 重置心跳检测。
   */
  private resetHeartbeatCheck() {
    this.stopHeartbeatCheck()
    this.startHeartbeatCheck()
  }

  /**
   * @private
   * @method stopHeartbeat
   * @description 停止心跳。
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * @private
   * @method stopHeartbeatCheck
   * @description 停止心跳检测。
   */
  private stopHeartbeatCheck() {
    if (this.heartbeatCheckTimer !== null) {
      clearTimeout(this.heartbeatCheckTimer)
      this.heartbeatCheckTimer = null
    }
  }

  /**
   * @private
   * @method cleanup
   * @description 停止重连计时器。
   */
  private cleanup() {
    this.stopHeartbeat()
    this.stopHeartbeatCheck()
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /**
   * @private
   * @method log
   * @description 打印日志。
   * @param {...any[]} data - 要打印的数据。
   */
  private log(...data: any[]) {
    if (this.debug) {
      console.log(...data)
    }
  }

  /**
   * @private
   * @method reconnect
   * @description 尝试重连 WebSocket。
   */
  private reconnect() {
    if (this.maxReconnectAttempts === 0 || this.reconnectAttempts < this.maxReconnectAttempts) {
      if (this.reconnectTimer === null) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectAttempts++
          this.reconnectInterval = Math.min(
            (this.reconnectInterval += this.initialReconnectInterval),
            this.maxReconnectInterval
          )
          this.connect()
          this.reconnectTimer = null
        }, this.reconnectInterval)
      }
    } else {
      this.log('达到最大重连次数，停止重连')
    }
  }
}

export default WebSocketWithHeartbeat
