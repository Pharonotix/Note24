import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared'),
        // Excalidraw's lazy mermaid importer — stubbed out (see mermaidStub.ts);
        // the real package adds ~10MB of diagram chunks Note24 never uses.
        '@excalidraw/mermaid-to-excalidraw': resolve('src/renderer/src/lib/mermaidStub.ts')
      }
    },
    plugins: [react()]
  }
})
