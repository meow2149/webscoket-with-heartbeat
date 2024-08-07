var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
// 默认配置
var defaultOptions = {
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
var WebSocketWithHeartbeat = /** @class */ (function () {
    /**
     * @constructor
     * @param {string} url - 服务器的 URL，支持 HTTP HTTPS WS WSS协议。
     * @param {WebSocketOptions} [options={}] - 可选配置对象，用于覆盖默认配置。
     */
    function WebSocketWithHeartbeat(url, options) {
        if (options === void 0) { options = {}; }
        this.heartbeatTimer = null;
        this.reconnectTimer = null;
        this.reconnectAttempts = 0;
        this.ws = null;
        this.onopen = function () { };
        this.onmessage = function () { };
        this.onclose = function () { };
        this.onerror = function () { };
        var config = __assign(__assign({}, defaultOptions), options);
        this.url = url;
        this.wsUrl = this.convertToWsUrl(this.url);
        this.heartbeatInterval = config.heartbeatInterval;
        this.reconnectInterval = config.reconnectInterval;
        this.heartbeatMessage = config.heartbeatMessage;
        this.maxReconnectAttempts = config.maxReconnectAttempts;
        this.debug = config.debug;
        this.connect();
    }
    /**
     * @private
     * @method convertToWsUrl
     * @description 将 HTTP 或 HTTPS URL 转换为 WebSocket URL。
     * @param {string} url - 原始 URL。
     * @returns {string} - 转换后的 WebSocket URL。
     */
    WebSocketWithHeartbeat.prototype.convertToWsUrl = function (url) {
        return url.replace(/^http/, 'ws');
    };
    /**
     * @private
     * @method connect
     * @description 建立 WebSocket 连接，并绑定事件回调函数。
     */
    WebSocketWithHeartbeat.prototype.connect = function () {
        var _this = this;
        this.ws = new WebSocket(this.wsUrl);
        this.ws.onopen = function () { return _this.onOpen(); };
        this.ws.onmessage = function (event) { return _this.onMessage(event); };
        this.ws.onclose = function () { return _this.onClose(); };
        this.ws.onerror = function (error) { return _this.onError(error); };
    };
    /**
     * @method onOpen
     * @description WebSocket 连接建立后的回调函数。
     */
    WebSocketWithHeartbeat.prototype.onOpen = function () {
        this.onopen();
        if (this.debug)
            console.log('WebSocket连接已建立');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
    };
    /**
     * @method onMessage
     * @description 接收到服务器消息时的回调函数。
     * @param {MessageEvent} event - WebSocket 消息事件。
     */
    WebSocketWithHeartbeat.prototype.onMessage = function (event) {
        this.onmessage(event);
        var message = event.data;
        if (this.debug)
            console.log('收到服务器消息:', message);
        if (message === 'pong') {
            this.resetHeartbeat();
        }
    };
    /**
     * @method onClose
     * @description WebSocket 连接关闭后的回调函数。
     */
    WebSocketWithHeartbeat.prototype.onClose = function () {
        this.onclose();
        if (this.debug)
            console.log('WebSocket连接已关闭，尝试重连...');
        this.stopHeartbeat();
        this.reconnect();
    };
    /**
     * @method onError
     * @description WebSocket 发生错误时的回调函数。
     * @param {Event} error - WebSocket 错误事件。
     */
    WebSocketWithHeartbeat.prototype.onError = function (error) {
        this.onerror(error);
        if (this.debug)
            console.error('WebSocket错误:', error);
    };
    /**
     * @method send
     * @description 通过 WebSocket 发送消息。
     * @param {string} message - 要发送的消息内容。
     */
    WebSocketWithHeartbeat.prototype.send = function (message) {
        var _a;
        if (((_a = this.ws) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN) {
            this.ws.send(message);
            if (this.debug)
                console.log('发送消息:', message);
        }
        else {
            if (this.debug)
                console.warn('WebSocket 连接未打开，无法发送消息');
        }
    };
    /**
     * @private
     * @method startHeartbeat
     * @description 启动心跳检测，定期发送心跳消息。
     */
    WebSocketWithHeartbeat.prototype.startHeartbeat = function () {
        var _this = this;
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(function () {
            var _a;
            if (((_a = _this.ws) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN) {
                var message = _this.heartbeatMessage;
                _this.ws.send(message);
                if (_this.debug)
                    console.log('发送心跳消息:', message);
            }
        }, this.heartbeatInterval);
    };
    /**
     * @private
     * @method resetHeartbeat
     * @description 重置心跳检测。
     */
    WebSocketWithHeartbeat.prototype.resetHeartbeat = function () {
        this.stopHeartbeat();
        this.startHeartbeat();
    };
    /**
     * @private
     * @method stopHeartbeat
     * @description 停止心跳检测。
     */
    WebSocketWithHeartbeat.prototype.stopHeartbeat = function () {
        if (this.heartbeatTimer !== null) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    };
    /**
     * @private
     * @method reconnect
     * @description 尝试重连 WebSocket。
     */
    WebSocketWithHeartbeat.prototype.reconnect = function () {
        var _this = this;
        if (this.maxReconnectAttempts === 0 || this.reconnectAttempts < this.maxReconnectAttempts) {
            if (this.reconnectTimer === null) {
                this.reconnectTimer = setTimeout(function () {
                    _this.reconnectAttempts++;
                    _this.connect();
                    _this.reconnectTimer = null;
                }, this.reconnectInterval);
            }
        }
        else {
            if (this.debug)
                console.warn('达到最大重连次数，停止重连');
        }
    };
    return WebSocketWithHeartbeat;
}());
export { WebSocketWithHeartbeat as CreateWebSocket };
