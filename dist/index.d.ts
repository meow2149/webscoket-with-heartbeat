/**
 * @interface WebSocketOptions
 * @description 配置 WebSocketWithHeartbeat 实例的可选项。
 * @property {number} [heartbeatInterval=30000] - 心跳间隔时间，单位为毫秒，默认为 30s。
 * @property {number} [reconnectInterval=5000] - 重连间隔时间，单位为毫秒，默认为 5s。
 * @property {number} [maxReconnectAttempts=0] - 最大重连次数，默认为 0 表示无限制。
 * @property {number} [maxReconnectInterval=5000] - 最大重连间隔时间，单位为毫秒，默认为 5s。
 // * @property {number} [timeout=5000] - 超时时间，单位为毫秒，默认为 5s。
 * @property {boolean} [debug=false] - 开启 debug 模式后将打印日志, 默认为 false。
 // * @property {'client' | 'server'} [heartbeatInitiator='client'] - 心跳发起方，默认为 'client'。
 // * @property {boolean} [singleton=false] - 是否为单例模式，默认为 false。
 */
interface WebSocketOptions {
    heartbeatInterval: number;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    maxReconnectInterval: number;
    debug: boolean;
}
/**
 * @class WebSocketWithHeartbeat
 * @description 封装了带心跳机制和重连功能的 WebSocket 客户端类。
 */
declare class WebSocketWithHeartbeat {
    private readonly heartbeatInterval;
    private reconnectInterval;
    private readonly maxReconnectAttempts;
    private readonly maxReconnectInterval;
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
     * @param {WebSocketOptions} options - 配置项。
     */
    constructor(url: string, options?: WebSocketOptions);
    /**
     * @private
     * @method connect
     * @description 建立 WebSocket 连接，并绑定事件回调函数。
     */
    private connect;
    /**
     * @private
     * @method onOpen
     * @description WebSocket 连接建立后的回调函数。
     */
    private onOpen;
    /**
     * @private
     * @method onMessage
     * @description 接收到服务器消息时的回调函数。
     * @param {MessageEvent} event - WebSocket 消息事件。
     */
    private onMessage;
    /**
     * @private
     * @method onClose
     * @description WebSocket 连接关闭后的回调函数。
     */
    private onClose;
    /**
     * @private
     * @method onError
     * @description WebSocket 发生错误时的回调函数。
     * @param {Event} error - WebSocket 错误事件。
     */
    private onError;
    /**
     * @public
     * @method send
     * @description 通过 WebSocket 发送消息。
     * @param {string} message - 要发送的消息内容。
     */
    send(message: string): void;
    /**
     * @private
     * @method startHeartbeat
     * @description 启动心跳，定期发送心跳消息。
     */
    private startHeartbeat;
    /**
     * @private
     * @method resetHeartbeat
     * @description 重置心跳。
     */
    private resetHeartbeat;
    /**
     * @private
     * @method stopHeartbeat
     * @description 停止心跳。
     */
    private stopHeartbeat;
    /**
     * @private
     * @method cleanup
     * @description 停止重连计时器。
     */
    private cleanup;
    /**
     * @private
     * @method log
     * @description 打印日志。
     * @param {...any[]} data - 要打印的数据。
     */
    private log;
    /**
     * @private
     * @method reconnect
     * @description 尝试重连 WebSocket。
     */
    private reconnect;
}
export default WebSocketWithHeartbeat;
