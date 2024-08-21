# webSocketWithHeartbeat

## Description
`webSocketWithHeartbeat` is a simple project to demonstrate a WebSocket connection with a heartbeat mechanism.

## Installation
```sh
npm install --save websocketwithheartbeat
```

## Usage
```javascript
import WebSocketWithHeartbeat from 'webSocketWithHeartbeat'

const socket = new WebSocketWithHeartbeat('https://example.com')
// if you need to create multiple instances, use getInstance()
const socket = WebSocketWithHeartbeat.getInstance('https://example.com')

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