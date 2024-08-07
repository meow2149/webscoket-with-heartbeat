# webSocketWithHeartbeat

## Description
`webSocketWithHeartbeat` is a simple project to demonstrate a WebSocket connection with a heartbeat mechanism.

## Installation
```sh
npm install --save websocketwithheartbeat
```

## Usage
```javascript
import createWebSocket from 'webSocketWithHeartbeat'

const socket = createWebSocket('https://example.com')

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