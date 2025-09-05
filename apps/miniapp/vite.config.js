import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import dns from 'node:dns'

// Avoid IPv6/localhost inconsistencies per Vite troubleshooting
// https://vite.dev/guide/troubleshooting#localhost-not-working
// Make Node DNS resolution order consistent with browser behavior
// This is no-op on platforms that don't support it
try { dns.setDefaultResultOrder('verbatim') } catch {}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  server: {
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
    hmr: { host: '127.0.0.1' },
  },
})
