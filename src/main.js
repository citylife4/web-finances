import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { authStore } from './store/auth-store'
import { store } from './store/api-store'

async function bootstrap() {
  try {
    await authStore.initialize()
    if (authStore.isAuthenticated) {
      await store.initialize()
    }
  } finally {
    createApp(App).use(router).mount('#app')
  }
}

bootstrap()
