export interface WebSocketOptions {
    heartbeatInterval?: number;
    reconnectDelay?: number;
    timeout?: number;
    debug?: boolean;
    messageType?: 'json' | 'binary';
}
export interface WebSocketMessage {
    type: string;
    [key: string]: any;
}
declare class WebSocketWithHeartbeat {
    #private;
    constructor(url: string, options?: WebSocketOptions);
    onopen: (ev: Event) => void;
    onmessage: (ev: MessageEvent) => void;
    onclose: (ev: CloseEvent) => void;
    onerror: (ev: Event) => void;
    send(data: WebSocketMessage): void;
    close(): void;
}
export default WebSocketWithHeartbeat;
