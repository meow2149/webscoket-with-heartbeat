# webSocket-Heartbeat

## Description
`webSocket-Heartbeat` is a simple project to demonstrate a WebSocket connection with a heartbeat mechanism.

## Installation
```sh
npm install --save websocket-heartbeat
```

## Usage
```javascript
import createWebSocket from 'websocket-heartbeat'

const socket = createWebSocket('https://example.com')

socket.onopen = () => {
    console.log('WebSocket connection established')
}
socket.onmessage = (event: Event) => {
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