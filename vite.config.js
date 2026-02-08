import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    minify: 'esbuild',
    // Disable source maps in production to reduce memory usage
    sourcemap: false,
    // Remove console and debugger statements in production
    esbuild: {
      drop: ['console', 'debugger']
    },
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 1000,
    // Optimize chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router'],
          'chart-vendor': ['chart.js', 'vue-chartjs'],
          'utils-vendor': ['axios', 'date-fns', 'xlsx']
        }
      }
    }
  }
})
