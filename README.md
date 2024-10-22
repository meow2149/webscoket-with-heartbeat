# webSocketWithHeartbeat

## Description
`webSocketWithHeartbeat` is a simple and lightweight library for WebSocket with a built-in heartbeat mechanism. It ensures stable and persistent WebSocket connections by periodically sending ping messages to the server and reconnecting when necessary.

## Principle
The client sends a ping message to the server every `heartbeatInterval` milliseconds. If the client doesn't receive a pong response within a certain time (`timeout`), it assumes the connection is broken and attempts to reconnect automatically.

## Installation
```sh
npm install websocket-with-heartbeat
```

## Usage
```javascript
// 1. ES Module
import WebSocketWithHeartbeat from 'websocket-with-heartbeat'

// 2. CommonJS
const WebSocketWithHeartbeat = require('websocket-with-heartbeat')

// 3. CDN
<script src="https://cdn.jsdelivr.net/npm/websocket-with-heartbeat/dist/websocket-with-heartbeat.min.js"></script>

const socket = new WebSocketWithHeartbeat('https://example.com')

// Handle WebSocket events
socket.onopen = () => {
    console.log('WebSocket connection established')
}

socket.onmessage = (event: MessageEvent) => {
    const data = event.data
    console.log('WebSocket message received:', data)
}

socket.onclose = () => {
    console.log('WebSocket connection closed')
}

socket.onerror = (error: Event) => {
    console.error('WebSocket error:', error)
}

// Send a message
socket.send(JSON.stringify({
    type: 'example_type',
    // ... other message properties
}))

// Manually close the WebSocket connection
socket.close()
```

## Configuration

### Interface

```javascript
interface WebSocketOptions {
    heartbeatInterval: number // Time interval between heartbeat pings (in ms)
    reconnectDelay: number    // Delay after disconnection (in ms)
    timeout: number           // Timeout for receiving a pong response (in ms)
    debug: boolean            // Enable/disable debug logging
}

interface WebSocketMessage {
  type: string       // Message type, e.g., 'ping', 'pong', etc.
  [key: string]: any // Message payload
}
```

### Defaults

```javascript
const defaultOptions: WebSocketOptions = {
    heartbeatInterval: 30 * 1000, // 30 seconds
    reconnectDelay: 5 * 1000,     // 5 seconds
    timeout: 5 * 1000,            // 5 seconds 
    debug: false                  // Debug logging disabled by default
}
```
