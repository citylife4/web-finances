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
    // Reduce target for faster builds
    target: 'es2015',
    // Remove console and debugger statements in production
    esbuild: {
      drop: ['console', 'debugger'],
      // Disable legal comments to reduce processing
      legalComments: 'none'
    },
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 1000,
    // Limit worker threads for low-memory systems
    commonjsOptions: {
      transformMixedEsModules: true
    },
    // Optimize chunks for better caching with minimal memory
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router']
        },
        // Reduce chunk size for lower memory usage
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})
