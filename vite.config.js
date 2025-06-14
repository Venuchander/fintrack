import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // allows access from network devices (not just localhost)
    port: 5173,       // default Vite port, change if needed
    watch: {
      usePolling: true, // helpful for environments like Docker or WSL where file watching can be problematic
    },
  },
})
