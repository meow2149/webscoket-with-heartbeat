# webSocketWithHeartbeat

## Description
`webSocketWithHeartbeat` is a simple project to demonstrate a WebSocket connection with a heartbeat mechanism.

## Installation
```sh
npm install --save websocket-with-heartbeat
```

## Usage
```javascript
// 1.ES Module
import WebSocketWithHeartbeat from 'websocket-with-heartbeat'
// 2.CommonJS
const WebSocketWithHeartbeat = require('websocket-with-heartbeat')
// 3.CDN
<script src="https://cdn.jsdelivr.net/npm/websocket-with-heartbeat/dist/websocket-with-heartbeat.min.js"></script>

const socket = new WebSocketWithHeartbeat('https://example.com')

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
socket.send('Hello, WebSocket!')
```

## Configuration
### Interface
```javascript
/**
 * @interface WebSocketOptions
 * @description 配置 WebSocketWithHeartbeat 实例的可选项。
 * @property {number} [heartbeatInterval=30000] - 心跳间隔时间，单位为毫秒，默认为 30000。
 * @property {number} [reconnectInterval=5000] - 重连间隔时间，单位为毫秒，默认为 5000。
 * @property {number} [maxReconnectAttempts=0] - 最大重连次数，默认为 0 表示无限制。
 * @property {number} [maxReconnectInterval=5000] - 最大重连间隔时间，单位为毫秒，默认为 5000。
 * @property {number} [timeout=5000] - 超时时间，单位为毫秒，默认为 5000。
 * @property {boolean} [debug=false] - 开启 debug 模式后将打印日志, 默认为 false。
 * @property {'client' | 'server'} [heartbeatInitiator='client'] - 心跳发起方，默认为 'client'。
 * @property {boolean} [singleton=false] - 是否为单例模式，默认为 false。
 */
interface WebSocketOptions {
    heartbeatInterval: number
    reconnectInterval: number
    maxReconnectAttempts: number
    maxReconnectInterval: number
    timeout: number
    debug: boolean
    heartbeatInitiator: 'client' | 'server'
    singleton: boolean
}
```
### Defaults
```javascript
const defaultOptions: WebSocketOptions = {
    heartbeatInterval: 1000 * 30,
    reconnectInterval: 1000 * 5,
    maxReconnectAttempts: 0,
    maxReconnectInterval: 1000 * 5,
    timeout: 1000 * 5,
    debug: false,
    heartbeatInitiator: 'client',
    singleton: false
}
```