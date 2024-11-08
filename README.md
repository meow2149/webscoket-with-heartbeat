# WebSocketWithHeartbeat

A TypeScript WebSocket client wrapper with built-in heartbeat mechanism and auto-reconnection support.

## Features
- Automatic heartbeat detection (`ping`/`pong`)
- Auto-reconnection on connection loss
- Page visibility-based connection management
- Strict message type checking
- Support for JSON/binary message format
- Full TypeScript support

## Installation
```sh
npm install websocket-with-heartbeat
```

## Usage

### Basic Example
```typescript
import WebSocketWithHeartbeat, { WebSocketMessage } from 'websocket-with-heartbeat'

// Initialize
const ws = new WebSocketWithHeartbeat('wss://example.com', {
  debug: true
})

// Manual connection
ws.connect()

// Handle incoming messages
ws.onmessage = (event) => {
  const message: WebSocketMessage = event.data
  switch (message.type) {
    case 'chat':
      console.log('Chat message:', message.content)
      break
    case 'notification':
      console.log('Notification:', message.text)
      break
  }
}

// Send message
ws.send({
  type: 'chat',
  content: 'Hello!',
  timestamp: Date.now()
})
```

### Message Type Definition
All messages must follow the `WebSocketMessage` interface:
```typescript
interface WebSocketMessage {
  type: string;
  [key: string]: any;
}
```

**Note:** The `type` field is required for all messages. Messages not following this format will be rejected.

### Reserved Message Types
- `ping`: Used internally for heartbeat requests
- `pong`: Used internally for heartbeat responses

### Configuration Options
```typescript
interface WebSocketOptions {
  heartbeatInterval?: number;  // Heartbeat interval (default: 30000ms)
  reconnectDelay?: number;     // Delay before reconnection attempts (default: 5000ms)
  timeout?: number;            // Heartbeat timeout (default: 5000ms)
  debug?: boolean;             // Enable debug logs (default: false)
  messageType?: 'json' | 'binary';  // Message format (default: 'json')
}
```

### Event Handlers
```typescript
ws.onopen = (event: Event) => {
  console.log('Connected')
}

ws.onmessage = (event: { data: WebSocketMessage }) => {
  // Note: event is not a native MessageEvent
  console.log('Message received:', event.data)
}

ws.onclose = (event: CloseEvent) => {
  console.log('Disconnected')
}

ws.onerror = (event: Event) => {
  console.log('Error occurred')
}
```

### Connection Management
```typescript
// Manual close
ws.close()

// Connection automatically manages based on page visibility:
// - Connects when page becomes visible
// - Disconnects when page becomes hidden
```

### Debug Mode
When `debug: true` is set, the library will log detailed connection and message information to the console.

## License
MIT