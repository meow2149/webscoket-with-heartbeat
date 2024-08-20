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
    heartbeatInterval?: number;
    reconnectInterval?: number;
    heartbeatMessage?: string;
    maxReconnectAttempts?: number;
    debug?: boolean;
}
/**
 * @class WebSocketWithHeartbeat
 * @description 封装了带心跳机制和重连功能的 WebSocket 客户端类。
 */
declare class WebSocketWithHeartbeat {
    private readonly heartbeatInterval;
    private readonly reconnectInterval;
    private readonly heartbeatMessage;
    private readonly maxReconnectAttempts;
    private readonly debug;
    private readonly url;
    private heartbeatTimer;
    private reconnectTimer;
    private reconnectAttempts;
    private ws;
    onopen: () => void;
    onmessage: (event: MessageEvent) => void;
    onclose: () => void;
    onerror: (error: Event) => void;
    /**
     * @constructor
     * @param {string} url - 服务器的 URL，支持 HTTP HTTPS WS WSS协议。
     * @param {WebSocketOptions} [options={}] - 可选配置对象，用于覆盖默认配置。
     */
    constructor(url: string, options?: WebSocketOptions);
    /**
     * @private
     * @method connect
     * @description 建立 WebSocket 连接，并绑定事件回调函数。
     */
    private connect;
    /**
     * @method onOpen
     * @description WebSocket 连接建立后的回调函数。
     */
    private onOpen;
    /**
     * @method onMessage
     * @description 接收到服务器消息时的回调函数。
     * @param {MessageEvent} event - WebSocket 消息事件。
     */
    private onMessage;
    /**
     * @method onClose
     * @description WebSocket 连接关闭后的回调函数。
     */
    private onClose;
    /**
     * @method onError
     * @description WebSocket 发生错误时的回调函数。
     * @param {Event} error - WebSocket 错误事件。
     */
    private onError;
    /**
     * @method send
     * @description 通过 WebSocket 发送消息。
     * @param {string} message - 要发送的消息内容。
     */
    send(message: string): void;
    /**
     * @private
     * @method startHeartbeat
     * @description 启动心跳检测，定期发送心跳消息。
     */
    private startHeartbeat;
    /**
     * @private
     * @method resetHeartbeat
     * @description 重置心跳检测。
     */
    private resetHeartbeat;
    /**
     * @private
     * @method stopHeartbeat
     * @description 停止心跳检测。
     */
    private stopHeartbeat;
    /**
     * @private
     * @method reconnect
     * @description 尝试重连 WebSocket。
     */
    private reconnect;
}
export default WebSocketWithHeartbeat;
