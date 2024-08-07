/**
 * @interface WebSocketOptions
 * @description 配置 WebSocketWithHeartbeat 实例的可选项。
 * @property {number} [heartbeatInterval=30000] - 心跳间隔时间，单位为毫秒。
 * @property {number} [reconnectInterval=5000] - 重连间隔时间，单位为毫秒。
 * @property {string} [heartbeatMessage='ping'] - 心跳消息内容。
 * @property {number} [maxReconnectAttempts=0] - 最大重连次数，默认为 0 表示无限制。
 * @property {boolean} [debug=false] - 开启 debug 模式后将打印日志。
 */
interface WebSocketOptions {
    heartbeatInterval?: number
    reconnectInterval?: number
    heartbeatMessage?: string
    maxReconnectAttempts?: number
    debug?: boolean
}

// 默认配置
const defaultOptions: WebSocketOptions = {
    heartbeatInterval: 30000,
    reconnectInterval: 5000,
    heartbeatMessage: 'ping',
    maxReconnectAttempts: 0,
    debug: false
}

/**
 * @class WebSocketWithHeartbeat
 * @description 封装了带心跳机制和重连功能的 WebSocket 客户端类。
 */
class WebSocketWithHeartbeat {
    private readonly url: string
    private readonly wsUrl: string

    private readonly heartbeatInterval: number
    private readonly reconnectInterval: number
    private readonly heartbeatMessage: string
    private readonly maxReconnectAttempts: number
    private readonly debug: boolean

    private heartbeatTimer: number | null = null
    private reconnectTimer: number | null = null
    private reconnectAttempts: number = 0
    private ws: WebSocket | null = null

    public onopen: () => void = () => {};
    public onmessage: (event: MessageEvent) => void = () => {};
    public onclose: () => void = () => {};
    public onerror: (error: Event) => void = () => {};

    /**
     * @constructor
     * @param {string} url - 服务器的 URL，支持 HTTP HTTPS WS WSS协议。
     * @param {WebSocketOptions} [options={}] - 可选配置对象，用于覆盖默认配置。
     */
    constructor(url: string, options: WebSocketOptions = {}) {
        const config = { ...defaultOptions, ...options }
        this.url = url
        this.wsUrl = this.convertToWsUrl(this.url)
        this.heartbeatInterval = config.heartbeatInterval!
        this.reconnectInterval = config.reconnectInterval!
        this.heartbeatMessage = config.heartbeatMessage!
        this.maxReconnectAttempts = config.maxReconnectAttempts!
        this.debug = config.debug!
        this.connect()
    }

    /**
     * @private
     * @method convertToWsUrl
     * @description 将 HTTP 或 HTTPS URL 转换为 WebSocket URL。
     * @param {string} url - 原始 URL。
     * @returns {string} - 转换后的 WebSocket URL。
     */
    private convertToWsUrl(url: string): string {
        return url.replace(/^http/, 'ws')
    }

    /**
     * @private
     * @method connect
     * @description 建立 WebSocket 连接，并绑定事件回调函数。
     */
    private connect() {
        this.ws = new WebSocket(this.wsUrl)
        this.ws.onopen = () => this.onOpen()
        this.ws.onmessage = (event) => this.onMessage(event)
        this.ws.onclose = () => this.onClose()
        this.ws.onerror = (error) => this.onError(error)
    }

    /**
     * @method onOpen
     * @description WebSocket 连接建立后的回调函数。
     */
    private onOpen(): void {
        this.onopen()
        if (this.debug) console.log('WebSocket连接已建立')
        this.reconnectAttempts = 0
        this.startHeartbeat()
    }

    /**
     * @method onMessage
     * @description 接收到服务器消息时的回调函数。
     * @param {MessageEvent} event - WebSocket 消息事件。
     */
    private onMessage(event: MessageEvent): void {
        this.onmessage(event)
        const message = event.data
        if (this.debug) console.log('收到服务器消息:', message)
        if (message === 'pong') {
            this.resetHeartbeat()
        }
    }

    /**
     * @method onClose
     * @description WebSocket 连接关闭后的回调函数。
     */
    private onClose(): void {
        this.onclose()
        if (this.debug) console.log('WebSocket连接已关闭，尝试重连...')
        this.stopHeartbeat()
        this.reconnect()
    }

    /**
     * @method onError
     * @description WebSocket 发生错误时的回调函数。
     * @param {Event} error - WebSocket 错误事件。
     */
    private onError(error: Event): void {
        this.onerror(error)
        if (this.debug) console.error('WebSocket错误:', error)
    }

    /**
     * @method send
     * @description 通过 WebSocket 发送消息。
     * @param {string} message - 要发送的消息内容。
     */
    public send(message: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(message);
            if (this.debug) console.log('发送消息:', message);
        } else {
            if (this.debug) console.warn('WebSocket 连接未打开，无法发送消息');
        }
    }

    /**
     * @private
     * @method startHeartbeat
     * @description 启动心跳检测，定期发送心跳消息。
     */
    private startHeartbeat() {
        this.stopHeartbeat()
        this.heartbeatTimer = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                const message = this.heartbeatMessage
                this.ws.send(message)
                if (this.debug) console.log('发送心跳消息:', message)
            }
        }, this.heartbeatInterval)
    }

    /**
     * @private
     * @method resetHeartbeat
     * @description 重置心跳检测。
     */
    private resetHeartbeat() {
        this.stopHeartbeat()
        this.startHeartbeat()
    }

    /**
     * @private
     * @method stopHeartbeat
     * @description 停止心跳检测。
     */
    private stopHeartbeat() {
        if (this.heartbeatTimer !== null) {
            clearInterval(this.heartbeatTimer)
            this.heartbeatTimer = null
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
                    this.connect()
                    this.reconnectTimer = null
                }, this.reconnectInterval)
            }
        } else {
            if (this.debug) console.warn('达到最大重连次数，停止重连')
        }
    }
}

export { WebSocketWithHeartbeat as CreateWebSocket }