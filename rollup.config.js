import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'umd',
      name: 'WebSocketWithHeartbeat'
    },
    {
      file: 'dist/websocket-with-heartbeat.js',
      format: 'iife',
      name: 'WebSocketWithHeartbeat'
    },
    {
      file: 'dist/websocket-with-heartbeat.min.js',
      format: 'iife',
      name: 'WebSocketWithHeartbeat',
      plugins: [
        terser()
      ]
    }
  ],
  plugins: [
    typescript()
  ]
}