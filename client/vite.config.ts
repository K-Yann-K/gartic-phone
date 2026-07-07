import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
      resolve: {
        alias: {
            react: path.resolve("./node_modules/react"),
            "react-dom": path.resolve("./node_modules/react-dom"),
        },
    },
    server: {
      port: 5173,
      // Proxy les appels HTTP vers le serveur si besoin
      proxy: {
          "/ws": {
              target: "ws://localhost:3000",
              ws: true,
          },
      },
  },
})
