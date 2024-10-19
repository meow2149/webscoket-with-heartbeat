(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.WebSocketWithHeartbeat = factory());
})(this, (function () { 'use strict';

    /**
     * @constant defaultOptions
     * @description 默认配置项。
     */
    const defaultOptions = {
        heartbeatInterval: 30 * 1000,
        reconnectInterval: 5 * 1000,
        maxReconnectAttempts: 0,
        maxReconnectInterval: 5 * 1000,
        // timeout: 1000 * 5,
        debug: false
        // heartbeatInitiator: 'client',
        // singleton: false
    };
    /**
     * @class WebSocketWithHeartbeat
     * @description 封装了带心跳机制和重连功能的 WebSocket 客户端类。
     */
    class WebSocketWithHeartbeat {
        // private static instance: WebSocketWithHeartbeat | null = null
        heartbeatInterval;
        reconnectInterval;
        maxReconnectAttempts;
        maxReconnectInterval;
        // private readonly timeout: number
        debug;
        // private readonly heartbeatInitiator: 'client' | 'server'
        // private readonly singleton: boolean
        url;
        heartbeatTimer = null;
        // private heartbeatCheckTimer: ReturnType<typeof setTimeout> | null = null
        reconnectTimer = null;
        reconnectAttempts = 0;
        // private readonly initialReconnectInterval: number
        ws = null;
        onopen = () => { };
        onmessage = () => { };
        onclose = () => { };
        onerror = () => { };
        /**
         * @constructor
         * @param {string} url - 服务器的 URL，支持 HTTP HTTPS WS WSS协议。
         * @param {WebSocketOptions} options - 配置项。
         */
        constructor(url, options) {
            const config = { ...defaultOptions, ...options };
            this.heartbeatInterval = config.heartbeatInterval;
            this.reconnectInterval = config.reconnectInterval;
            this.maxReconnectAttempts = config.maxReconnectAttempts;
            this.maxReconnectInterval = config.maxReconnectInterval;
            // this.timeout = config.timeout
            this.debug = config.debug;
            // this.heartbeatInitiator = config.heartbeatInitiator
            // this.singleton = config.singleton
            this.url = url.replace(/^http/, 'ws');
            // this.initialReconnectInterval = this.reconnectInterval
            // if (this.singleton && WebSocketWithHeartbeat.instance) {
            //   return WebSocketWithHeartbeat.instance
            // }
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
         * @private
         * @method onOpen
         * @description WebSocket 连接建立后的回调函数。
         */
        onOpen() {
            this.onopen();
            this.log('WebSocket连接已建立');
            this.reconnectAttempts = 0;
            // this.reconnectInterval = this.initialReconnectInterval
            // if (this.heartbeatInitiator === 'client') {
            this.startHeartbeat();
            // } else {
            //   this.startHeartbeatCheck()
            // }
        }
        /**
         * @private
         * @method onMessage
         * @description 接收到服务器消息时的回调函数。
         * @param {MessageEvent} event - WebSocket 消息事件。
         */
        onMessage(event) {
            try {
                const message = JSON.parse(event.data);
                this.log('收到服务器消息:', message);
                if (message.type === 'pong') {
                    // if (this.heartbeatInitiator === 'client') {
                    this.resetHeartbeat();
                    // } else {
                    //   this.resetHeartbeatCheck()
                    // }
                }
                else {
                    this.onmessage(event);
                }
            }
            catch (error) {
                this.log(error);
            }
        }
        /**
         * @private
         * @method onClose
         * @description WebSocket 连接关闭后的回调函数。
         */
        onClose() {
            this.onclose();
            this.log('WebSocket连接已关闭，尝试重连...');
            this.cleanup();
            this.reconnect();
        }
        /**
         * @private
         * @method onError
         * @description WebSocket 发生错误时的回调函数。
         * @param {Event} error - WebSocket 错误事件。
         */
        onError(error) {
            this.onerror(error);
            this.log('WebSocket错误:', error);
        }
        /**
         * @public
         * @method send
         * @description 通过 WebSocket 发送消息。
         * @param {string} message - 要发送的消息内容。
         */
        send(message) {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(message);
                this.log('发送消息:', message);
            }
            else {
                this.log('WebSocket 连接未打开，无法发送消息');
            }
        }
        /**
         * @private
         * @method startHeartbeat
         * @description 启动心跳，定期发送心跳消息。
         */
        startHeartbeat() {
            this.stopHeartbeat();
            this.heartbeatTimer = setInterval(() => {
                if (this.ws?.readyState === WebSocket.OPEN) {
                    const message = {
                        type: 'ping'
                    };
                    this.ws.send(JSON.stringify(message));
                    this.log('发送心跳消息:', message);
                }
            }, this.heartbeatInterval);
        }
        // /**
        //  * @private
        //  * @method startHeartbeatCheck
        //  * @description 启动心跳检测，定期检测是否接收到心跳消息。
        //  */
        // private startHeartbeatCheck() {
        //   this.stopHeartbeatCheck()
        //   this.heartbeatCheckTimer = setTimeout(() => {
        //     this.log('心跳超时，连接断开，尝试重连...')
        //     this.onClose()
        //   }, this.heartbeatInterval + this.timeout)
        // }
        /**
         * @private
         * @method resetHeartbeat
         * @description 重置心跳。
         */
        resetHeartbeat() {
            this.stopHeartbeat();
            this.startHeartbeat();
        }
        // /**
        //  * @private
        //  * @method resetHeartbeatCheck
        //  * @description 重置心跳检测。
        //  */
        // private resetHeartbeatCheck() {
        //   this.stopHeartbeatCheck()
        //   this.startHeartbeatCheck()
        // }
        /**
         * @private
         * @method stopHeartbeat
         * @description 停止心跳。
         */
        stopHeartbeat() {
            if (this.heartbeatTimer !== null) {
                clearInterval(this.heartbeatTimer);
                this.heartbeatTimer = null;
            }
        }
        // /**
        //  * @private
        //  * @method stopHeartbeatCheck
        //  * @description 停止心跳检测。
        //  */
        // private stopHeartbeatCheck() {
        //   if (this.heartbeatCheckTimer !== null) {
        //     clearTimeout(this.heartbeatCheckTimer)
        //     this.heartbeatCheckTimer = null
        //   }
        // }
        /**
         * @private
         * @method cleanup
         * @description 停止重连计时器。
         */
        cleanup() {
            this.stopHeartbeat();
            // this.stopHeartbeatCheck()
            if (this.reconnectTimer !== null) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
        }
        /**
         * @private
         * @method log
         * @description 打印日志。
         * @param {...any[]} data - 要打印的数据。
         */
        log(...data) {
            if (this.debug) {
                console.log(...data);
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
                        // this.reconnectInterval = Math.min(
                        //   (this.reconnectInterval += this.initialReconnectInterval),
                        //   this.maxReconnectInterval
                        // )
                        this.connect();
                        this.reconnectTimer = null;
                    }, this.reconnectInterval);
                }
            }
            else {
                this.log('达到最大重连次数，停止重连');
            }
        }
    }

    return WebSocketWithHeartbeat;

}));
