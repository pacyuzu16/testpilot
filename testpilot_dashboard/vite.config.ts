import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { spawn } from 'child_process'
import * as path from 'path'

// Dev-only plugin: POST /api/scan streams testpilot_scan.py output
function scanPlugin(): Plugin {
  return {
    name: 'testpilot-scan',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/scan', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end('Method Not Allowed')
          return
        }
        res.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
        })

        const scriptPath = path.resolve(__dirname, '../scripts/testpilot_scan.py')
        const child = spawn('python3', [scriptPath], {
          cwd: path.resolve(__dirname, '..'),
          env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', PY_COLORS: '0' },
        })

        child.stdout.on('data', (data: Buffer) => {
          res.write(data.toString())
        })
        child.stderr.on('data', (data: Buffer) => {
          res.write(data.toString())
        })
        child.on('close', (code: number) => {
          res.write(`\n\n[Scan finished with exit code ${code}]\n`)
          res.end()
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/testpilot/',
  plugins: [react(), scanPlugin()],
  // The scan rewrites these files; don't let that trigger a full page reload mid-demo
  server: {
    watch: { ignored: ['**/public/report.json', '**/public/history.json'] },
  },
  build: {
    outDir: 'dist',
  },
})
