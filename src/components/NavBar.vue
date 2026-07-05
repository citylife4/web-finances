<template>
  <nav class="navbar">
    <div class="nav-container">
      <router-link :to="authStore.isAuthenticated ? '/' : '/login'" class="nav-brand">
        💰 <span class="brand-text">Finance Tracker</span>
      </router-link>
      <div v-if="authStore.isAuthenticated" class="nav-links">
        <router-link to="/" class="nav-link">Dashboard</router-link>
        <router-link to="/accounts" class="nav-link">Accounts</router-link>
        <router-link to="/categories" class="nav-link">Categories</router-link>
        <router-link to="/category-types" class="nav-link">Types</router-link>
        <router-link to="/entry" class="nav-link">Monthly Entry</router-link>
        <router-link to="/import" class="nav-link">Import</router-link>
        <div class="nav-user">
          <span class="user-name" :title="authStore.user?.email">{{ authStore.user?.name || authStore.user?.email }}</span>
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
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.65rem 2rem;
}

.nav-brand {
  font-size: 1.15rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.brand-text {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  flex-wrap: wrap;
}

.nav-link {
  color: var(--color-text-muted);
  text-decoration: none;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  font-size: 0.92rem;
  font-weight: 500;
  transition: background-color 0.15s ease, color 0.15s ease;
  white-space: nowrap;
}

.nav-link:hover {
  color: var(--color-text);
  background-color: var(--color-surface-muted);
}

.nav-link.router-link-exact-active {
  color: var(--color-primary-dark);
  background-color: rgba(91, 110, 232, 0.1);
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-left: 0.9rem;
  margin-left: 0.4rem;
  border-left: 1px solid var(--color-border);
}

.user-name {
  font-size: 0.88rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-logout {
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.88rem;
  font-family: inherit;
  white-space: nowrap;
}

.btn-logout:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
  background: var(--color-danger-bg);
}

@media (max-width: 900px) {
  .nav-container {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
  }

  .nav-links {
    justify-content: center;
  }

  .nav-user {
    border-left: none;
    padding-left: 0;
    margin-left: 0;
  }
}
</style>
