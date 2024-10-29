export interface WebSocketOptions {
    heartbeatInterval?: number;
    reconnectDelay?: number;
    timeout?: number;
    debug?: boolean;
}
export interface WebSocketMessage {
    type: string;
    [key: string]: any;
}
declare class WebSocketWithHeartbeat {
    private readonly options;
    private readonly url;
    private webSocket;
    private isManualClosed;
    private heartbeat;
    private heartbeatTimer;
    private reconnectTimer;
    private preCloseTimer;
    constructor(url: string, options?: WebSocketOptions);
    private connect;
    onopen: (ev: Event) => void;
    onmessage: (ev: MessageEvent) => void;
    onclose: (ev: CloseEvent) => void;
    onerror: (ev: Event) => void;
    send(data: string): void;
    close(): void;
    private onOpen;
    private onMessage;
    private onClose;
    private onError;
    private startHeartbeat;
    private sendHeartbeat;
    private stopHeartbeat;
    private reconnect;
    private stopReconnect;
    private preClose;
    private cleanup;
    private debugLog;
}
export default WebSocketWithHeartbeat;
