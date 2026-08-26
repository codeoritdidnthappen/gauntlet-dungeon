import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// publicDir stays Vite's default `public/` — files there are copied to the
// build root untouched and served from `/` (favicon.svg, robots.txt, etc).
//
// Game art in `assets/` and music in `audio/` are imported as modules instead,
// so Vite hashes and bundles them. Both folders keep their existing layout.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3486,
  },
  preview: {
    port: 3486,
  },
})
