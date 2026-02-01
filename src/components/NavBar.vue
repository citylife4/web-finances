<template>
  <nav class="navbar">
    <div class="nav-container">
      <h1 class="nav-title">💰 Finance Tracker</h1>
      <div v-if="authStore.isAuthenticated" class="nav-links">
        <router-link to="/" class="nav-link">Dashboard</router-link>
        <router-link to="/accounts" class="nav-link">Manage Accounts</router-link>
        <router-link to="/categories" class="nav-link">Categories</router-link>
        <router-link to="/entry" class="nav-link">Monthly Entry</router-link>
        <router-link to="/import" class="nav-link">Import Data</router-link>
        <div class="nav-user">
          <span class="user-name">👤 {{ authStore.user?.name || authStore.user?.email }}</span>
          <button @click="handleLogout" class="btn-logout">Logout</button>
        </div>
      </div>
      <div v-else class="nav-links">
        <router-link to="/login" class="nav-link">Login</router-link>
        <router-link to="/register" class="nav-link">Register</router-link>
      </div>
    </div>
  </nav>
</template>

<script>
import { authStore } from '../store/auth-store'

export default {
  name: 'NavBar',
  data() {
    return {
      authStore
    }
  },
  methods: {
    async handleLogout() {
      await authStore.logout()
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
}

.nav-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
}

.nav-links {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  transition: background-color 0.3s;
  white-space: nowrap;
}

.nav-link:hover,
.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-left: 1rem;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
}

.user-name {
  font-size: 0.9rem;
  white-space: nowrap;
}

.btn-logout {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.4rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
  white-space: nowrap;
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .nav-links {
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .nav-user {
    border-left: none;
    padding-left: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.3);
    padding-top: 0.5rem;
  }
}
</style>
