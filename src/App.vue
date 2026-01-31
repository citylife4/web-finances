<template>
  <div id="app">
    <NavBar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { onMounted, onUnmounted } from 'vue'
import NavBar from './components/NavBar.vue'
import { store } from './store/api-store'
import { setAccessToken } from './services/api'

export default {
  name: 'App',
  components: {
    NavBar
  },
  setup() {
    // Handle logout events from token refresh failures
    const handleLogout = () => {
      // Clear local state and redirect to login
      console.log('Session expired, logging out...')
      // You can add router navigation here when auth views are implemented
    }

    onMounted(() => {
      // Initialize the store after Vue app is mounted
      store.initialize()
      
      // Listen for auth logout events
      window.addEventListener('auth:logout', handleLogout)
    })

    onUnmounted(() => {
      window.removeEventListener('auth:logout', handleLogout)
    })

    return { store }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 2rem;
}

/* Global styles */
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

/* Responsive design */
@media (max-width: 768px) {
  .main-content {
    padding-top: 1rem;
  }
}
</style>
