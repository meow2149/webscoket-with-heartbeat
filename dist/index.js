// 默认配置
const defaultOptions = {
    heartbeatInterval: 30000,
    reconnectInterval: 5000,
    heartbeatMessage: 'ping',
    maxReconnectAttempts: 0,
    debug: false
};
/**
 * @class WebSocketWithHeartbeat
 * @description 封装了带心跳机制和重连功能的 WebSocket 客户端类。
 */
class WebSocketWithHeartbeat {
    heartbeatInterval;
    reconnectInterval;
    heartbeatMessage;
    maxReconnectAttempts;
    debug;
    url;
    heartbeatTimer = null;
    reconnectTimer = null;
    reconnectAttempts = 0;
    ws = null;
    onopen = () => { };
    onmessage = () => { };
    onclose = () => { };
    onerror = () => { };
    /**
     * @constructor
     * @param {string} url - 服务器的 URL，支持 HTTP HTTPS WS WSS协议。
     * @param {WebSocketOptions} [options={}] - 可选配置对象，用于覆盖默认配置。
     */
    constructor(url, options = {}) {
        const config = { ...defaultOptions, ...options };
        this.heartbeatInterval = config.heartbeatInterval;
        this.reconnectInterval = config.reconnectInterval;
        this.heartbeatMessage = config.heartbeatMessage;
        this.maxReconnectAttempts = config.maxReconnectAttempts;
        this.debug = config.debug;
        this.url = url.replace(/^http/, 'ws');
        this.connect();
    }
    /**
     * @private
     * @method connect
     * @description 建立 WebSocket 连接，并绑定事件回调函数。
     */
    connect() {
        this.ws = new WebSocket(this.url);
        this.ws.onopen = () => this.onOpen();
        this.ws.onmessage = (event) => this.onMessage(event);
        this.ws.onclose = () => this.onClose();
        this.ws.onerror = (error) => this.onError(error);
    }
    /**
     * @method onOpen
     * @description WebSocket 连接建立后的回调函数。
     */
    onOpen() {
        this.onopen();
        if (this.debug)
            console.log('WebSocket连接已建立');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
    }
    /**
     * @method onMessage
     * @description 接收到服务器消息时的回调函数。
     * @param {MessageEvent} event - WebSocket 消息事件。
     */
    onMessage(event) {
        this.onmessage(event);
        const message = event.data;
        if (this.debug)
            console.log('收到服务器消息:', message);
        if (message === 'pong') {
            this.resetHeartbeat();
        }
    }
    /**
     * @method onClose
     * @description WebSocket 连接关闭后的回调函数。
     */
    onClose() {
        this.onclose();
        if (this.debug)
            console.log('WebSocket连接已关闭，尝试重连...');
        this.stopHeartbeat();
        this.reconnect();
    }
    /**
     * @method onError
     * @description WebSocket 发生错误时的回调函数。
     * @param {Event} error - WebSocket 错误事件。
     */
    onError(error) {
        this.onerror(error);
        if (this.debug)
            console.error('WebSocket错误:', error);
    }
    /**
     * @method send
     * @description 通过 WebSocket 发送消息。
     * @param {string} message - 要发送的消息内容。
     */
    send(message) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(message);
            if (this.debug)
                console.log('发送消息:', message);
        }
        else {
            if (this.debug)
                console.warn('WebSocket 连接未打开，无法发送消息');
        }
    }
    /**
     * @private
     * @method startHeartbeat
     * @description 启动心跳检测，定期发送心跳消息。
     */
    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                const message = this.heartbeatMessage;
                this.ws.send(message);
                if (this.debug)
                    console.log('发送心跳消息:', message);
            }
        }, this.heartbeatInterval);
    }
    /**
     * @private
     * @method resetHeartbeat
     * @description 重置心跳检测。
     */
    resetHeartbeat() {
        this.stopHeartbeat();
        this.startHeartbeat();
    }
    /**
     * @private
     * @method stopHeartbeat
     * @description 停止心跳检测。
     */
    stopHeartbeat() {
        if (this.heartbeatTimer !== null) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    /**
     * @private
     * @method reconnect
     * @description 尝试重连 WebSocket。
     */
    reconnect() {
        if (this.maxReconnectAttempts === 0 || this.reconnectAttempts < this.maxReconnectAttempts) {
            if (this.reconnectTimer === null) {
                this.reconnectTimer = setTimeout(() => {
                    this.reconnectAttempts++;
                    this.connect();
                    this.reconnectTimer = null;
                }, this.reconnectInterval);
            }
        }
        else {
            if (this.debug)
                console.warn('达到最大重连次数，停止重连');
        }
    }
}
export default WebSocketWithHeartbeat;
