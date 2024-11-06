(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.WebSocketWithHeartbeat = factory());
})(this, (function () { 'use strict';

    const defaultOptions = {
        heartbeatInterval: 30 * 1000,
        reconnectDelay: 5 * 1000,
        timeout: 5 * 1000,
        debug: false,
        messageType: 'json'
    };
    class WebSocketWithHeartbeat {
        #options;
        #isPageVisible = true;
        #url;
        #webSocket = null;
        #isManualClosed = false;
        #heartbeatTimer;
        #reconnectTimer;
        #preCloseTimer;
        constructor(url, options) {
            this.#options = { ...defaultOptions, ...options };
            this.#url = url.replace(/^http/, 'ws');
            this.#connect();
            document.addEventListener('visibilitychange', () => {
                this.#isPageVisible = document.visibilityState === 'visible';
                if (this.#isPageVisible) {
                    this.#connect();
                }
                else {
                    this.#destroy();
                }
            });
        }
        #connect() {
            if (this.#webSocket?.readyState === WebSocket.CONNECTING ||
                this.#webSocket?.readyState === WebSocket.OPEN) {
                return;
            }
            this.#destroy();
            const ws = new WebSocket(this.#url);
            ws.onopen = (ev) => this.#onOpen(ev);
            ws.onmessage = (ev) => this.#onMessage(ev);
            ws.onclose = (ev) => this.#onClose(ev);
            ws.onerror = (ev) => this.#onError(ev);
            this.#webSocket = ws;
        }
        // Official WebSocket API
        onopen = () => { };
        onmessage = () => { };
        onclose = () => { };
        onerror = () => { };
        send(data) {
            if (this.#webSocket?.readyState === WebSocket.OPEN) {
                const jsonData = JSON.stringify(data);
                if (this.#options.messageType === 'binary') {
                    const blob = new Blob([jsonData], { type: 'application/json' });
                    this.#webSocket.send(blob);
                }
                else {
                    this.#webSocket.send(jsonData);
                }
                this.#debugLog('Message sent:', data);
            }
        }
        close() {
            this.#debugLog('Manual disconnection initiated.');
            this.#isManualClosed = true;
            this.#destroy();
        }
        // Custom WebSocket API
        #onOpen = (ev) => {
            this.#debugLog('Connection established.');
            this.onopen(ev);
            this.#stopHeartbeat();
            this.#startHeartbeat();
        };
        #onMessage = async (ev) => {
            let jsonData;
            if (this.#options.messageType === 'binary') {
                const blob = ev.data;
                jsonData = await blob.text();
            }
            else {
                jsonData = ev.data;
            }
            const data = JSON.parse(jsonData);
            this.#debugLog('Message received:', data);
            if (data.type === 'pong' && this.#preCloseTimer) {
                this.#debugLog('Heartbeat response received. Connection maintained.');
                clearTimeout(this.#preCloseTimer);
                this.#preCloseTimer = undefined;
            }
            else {
                this.onmessage(new MessageEvent('message', { data }));
            }
        };
        #onClose = (ev) => {
            this.#debugLog('Connection closed.');
            this.#destroy();
            this.onclose(ev);
            if (!this.#isManualClosed) {
                this.#reconnect();
            }
        };
        #onError = (ev) => {
            this.#debugLog('An error occurred:', ev);
            this.onerror(ev);
            if (this.#webSocket?.readyState === WebSocket.OPEN) {
                this.#webSocket.close();
            }
        };
        // Other methods
        #startHeartbeat = () => {
            this.#stopHeartbeat();
            if (this.#webSocket?.readyState === WebSocket.OPEN && this.#isPageVisible) {
                this.#sendHeartbeat();
                this.#heartbeatTimer = setInterval(() => {
                    this.#sendHeartbeat();
                }, this.#options.heartbeatInterval);
            }
        };
        #sendHeartbeat = () => {
            if (this.#webSocket?.readyState !== WebSocket.OPEN) {
                this.#stopHeartbeat();
                return;
            }
            const data = { type: 'ping' };
            const jsonData = JSON.stringify(data);
            if (this.#options.messageType === 'binary') {
                const blob = new Blob([jsonData], { type: 'application/json' });
                this.#webSocket.send(blob);
            }
            else {
                this.#webSocket.send(jsonData);
            }
            this.#debugLog('Heartbeat sent:', data);
            this.#preClose();
        };
        #stopHeartbeat = () => {
            clearInterval(this.#heartbeatTimer);
            this.#heartbeatTimer = undefined;
        };
        #reconnect = () => {
            this.#stopReconnect();
            if (this.#isPageVisible) {
                this.#reconnectTimer = setTimeout(() => {
                    this.#debugLog('Attempting to reconnect...');
                    this.#isManualClosed = false;
                    this.#connect();
                }, this.#options.reconnectDelay);
            }
        };
        #stopReconnect = () => {
            clearTimeout(this.#reconnectTimer);
            this.#reconnectTimer = undefined;
        };
        #preClose = () => {
            this.#debugLog(`No heartbeat response. Closing connection in ${this.#options.timeout}ms...`);
            this.#preCloseTimer = setTimeout(() => {
                this.#webSocket?.close();
                clearTimeout(this.#preCloseTimer);
                this.#preCloseTimer = undefined;
            }, this.#options.timeout);
        };
        #destroy = () => {
            this.#stopHeartbeat();
            this.#stopReconnect();
            if (this.#preCloseTimer) {
                clearTimeout(this.#preCloseTimer);
                this.#preCloseTimer = undefined;
            }
            if (this.#webSocket) {
                this.#webSocket.onopen = null;
                this.#webSocket.onmessage = null;
                this.#webSocket.onclose = null;
                this.#webSocket.onerror = null;
                if (this.#webSocket.readyState === WebSocket.OPEN) {
                    this.#webSocket.close();
                }
                this.#webSocket = null;
            }
        };
        #debugLog = (...data) => {
            if (this.#options.debug) {
                console.log('%c WebSocketWithHeartbeat', 'background:#222;color:#ffd700;padding:4px;border-radius:4px;', ...data);
            }
        };
    }

    return WebSocketWithHeartbeat;

}));
