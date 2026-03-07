import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const BACKEND = 'http://localhost:3001';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 3000,
    hmr: {
      overlay: false,
    },
    proxy: {
      // Auth
      '/auth': { target: BACKEND, changeOrigin: true },
      // API (no path rewrite — backend has /api/music, etc.)
      '/api': { target: BACKEND, changeOrigin: true },
      // Courses & learning
      '/courses': { target: BACKEND, changeOrigin: true },
      '/lessons': { target: BACKEND, changeOrigin: true },
      '/quizzes': { target: BACKEND, changeOrigin: true },
      '/flashcards': { target: BACKEND, changeOrigin: true },
      '/resources': { target: BACKEND, changeOrigin: true },
      // User & profile
      '/profile': { target: BACKEND, changeOrigin: true },
      '/profiles': { target: BACKEND, changeOrigin: true },
      '/student': { target: BACKEND, changeOrigin: true },
      '/settings': { target: BACKEND, changeOrigin: true },
      // Content
      '/articles': { target: BACKEND, changeOrigin: true },
      '/file-articles': { target: BACKEND, changeOrigin: true },
      '/news': { target: BACKEND, changeOrigin: true },
      '/comments': { target: BACKEND, changeOrigin: true },
      '/forum': { target: BACKEND, changeOrigin: true },
      // Discovery
      '/search': { target: BACKEND, changeOrigin: true },
      '/bookmarks': { target: BACKEND, changeOrigin: true },
      '/notifications': { target: BACKEND, changeOrigin: true },
      '/analytics': { target: BACKEND, changeOrigin: true },
      // Admin & teachers
      '/admin': { target: BACKEND, changeOrigin: true },
      '/teachers': { target: BACKEND, changeOrigin: true },
      '/portal': { target: BACKEND, changeOrigin: true },
      // Uploads & media
      '/upload': { target: BACKEND, changeOrigin: true },
      // Health
      '/health': { target: BACKEND, changeOrigin: true },
      '/ready': { target: BACKEND, changeOrigin: true },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
