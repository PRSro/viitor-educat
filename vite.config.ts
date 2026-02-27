import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    allowedHosts: ['kenia-posttraumatic-jocelyn.ngrok-free.dev'],
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/student': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/courses': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/teachers': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/profiles': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/lessons': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/upload': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
