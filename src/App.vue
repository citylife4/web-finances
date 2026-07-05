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
import { useRouter } from 'vue-router'
import NavBar from './components/NavBar.vue'
import { store } from './store/api-store'
import { authStore } from './store/auth-store'

export default {
  name: 'App',
  components: {
    NavBar
  },
  setup() {
    const router = useRouter()

    // Token refresh failed: auth-store already cleared the session,
    // we just need to send the user back to the login page
    const handleLogout = () => {
      router.push('/login')
    }

    onMounted(() => {
      if (authStore.isAuthenticated) {
        store.initialize()
      }

      window.addEventListener('auth:logout', handleLogout)
    })

    onUnmounted(() => {
      window.removeEventListener('auth:logout', handleLogout)
    })
  }
}
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 1rem;
}
</style>
