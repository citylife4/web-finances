import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { authStore } from './store/auth-store'

// Initialize auth store before mounting app
authStore.initialize().finally(() => {
  createApp(App).use(router).mount('#app')
})
