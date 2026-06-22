import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const appVersion = Date.now().toString()

function versionFile() {
  return {
    name: 'version-file',
    writeBundle(options) {
      writeFileSync(
        resolve(options.dir, 'version.json'),
        JSON.stringify({ version: appVersion }),
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), versionFile()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
})
