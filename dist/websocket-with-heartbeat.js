var WebSocketWithHeartbeat = (function () {
    'use strict';

    const defaultOptions = {
        heartbeatInterval: 30 * 1000,
        reconnectDelay: 5 * 1000,
        timeout: 5 * 1000,
        debug: false
    };
    class WebSocketWithHeartbeat {
        options;
        url;
        webSocket = null;
        isManualClosed = false;
        heartbeat = {
            ping: 'ping',
            pong: 'pong'
        };
        heartbeatTimer;
        reconnectTimer;
        preCloseTimer;
        constructor(url, options) {
            this.options = { ...defaultOptions, ...options };
            this.url = url.replace(/^http/, 'ws');
            this.connect();
        }
        connect() {
            this.webSocket = new WebSocket(this.url);
            this.webSocket.onopen = this.onOpen.bind(this);
            this.webSocket.onmessage = this.onMessage.bind(this);
            this.webSocket.onclose = this.onClose.bind(this);
            this.webSocket.onerror = this.onError.bind(this);
        }
        // Official WebSocket API
        onopen = () => { };
        onmessage = () => { };
        onclose = () => { };
        onerror = () => { };
        send(data) {
            if (this.webSocket?.readyState === WebSocket.OPEN) {
                this.webSocket.send(data);
                this.debugLog('Sent:', data);
            }
        }
        close() {
            this.debugLog('Disconnect manually.');
            this.isManualClosed = true;
            this.webSocket?.close();
            this.stopHeartbeat();
        }
        // Custom WebSocket API
        onOpen(ev) {
            this.debugLog('Connected.');
            this.onopen(ev);
            this.startHeartbeat();
        }
        onMessage(ev) {
            this.debugLog('Received:', ev.data);
            const data = JSON.parse(ev.data);
            if (data.type === this.heartbeat.pong) {
                this.debugLog('Closing cancelled.');
                clearTimeout(this.preCloseTimer);
                this.preCloseTimer = undefined;
            }
            else {
                this.onmessage(ev);
            }
        }
        onClose(event) {
            this.debugLog('Disconnected.');
            this.onclose(event);
            if (!this.isManualClosed) {
                this.stopHeartbeat();
                this.reconnect();
            }
        }
        onError(error) {
            this.debugLog('Error occurred:', error);
            this.onerror(error);
        }
        // Other methods
        startHeartbeat() {
            this.heartbeatTimer = setInterval(() => {
                if (this.webSocket?.readyState === WebSocket.OPEN) {
                    this.webSocket.send(JSON.stringify({ type: this.heartbeat.ping }));
                    this.preClose();
                }
            }, this.options.heartbeatInterval);
        }
        stopHeartbeat() {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }
        reconnect() {
            this.reconnectTimer = setTimeout(() => {
                this.debugLog('Reconnecting...');
                this.connect();
                this.stopReconnect();
            }, this.options.reconnectDelay);
        }
        stopReconnect() {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
        preClose() {
            this.debugLog(`Closing in ${this.options.timeout}ms...`);
            this.preCloseTimer = setTimeout(() => {
                this.webSocket?.close();
                clearTimeout(this.preCloseTimer);
                this.preCloseTimer = undefined;
            }, this.options.timeout);
        }
        debugLog(...data) {
            if (this.options.debug) {
                console.log('%c WebSocketWithHeartbeat', 'background:#222;color:#ffd700;padding:4px;border-radius:5px;', ...data);
            }
        }
    }

    return WebSocketWithHeartbeat;

})();
