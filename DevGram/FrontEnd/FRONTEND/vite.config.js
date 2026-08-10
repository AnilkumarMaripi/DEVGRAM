import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  root: __dirname,
  plugins: [
    react({
      babel: {
        plugins: [
          ["babel-plugin-react-compiler"]
        ]
      }
    })
  ],
  base: '/',
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html')
    }
  },
  server: {
    historyApiFallback: true,
  },
})



