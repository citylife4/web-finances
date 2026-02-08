import { createRouter, createWebHistory } from 'vue-router'
import { authStore } from '../store/auth-store'
import Dashboard from '../views/Dashboard.vue'
import AccountManager from '../views/AccountManager.vue'
import MonthlyEntry from '../views/MonthlyEntry.vue'
import ImportData from '../views/ImportData.vue'
import CategoryManager from '../views/CategoryManager.vue'
import CategoryTypeManager from '../views/CategoryTypeManager.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/accounts',
    name: 'AccountManager',
    component: AccountManager,
    meta: { requiresAuth: true }
  },
  {
    path: '/categories',
    name: 'CategoryManager',
    component: CategoryManager,
    meta: { requiresAuth: true }
  },
  {
    path: '/category-types',
    name: 'CategoryTypeManager',
    component: CategoryTypeManager,
    meta: { requiresAuth: true }
  },
  {
    path: '/entry',
    name: 'MonthlyEntry',
    component: MonthlyEntry,
    meta: { requiresAuth: true }
  },
  {
    path: '/import',
    name: 'ImportData',
    component: ImportData,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)

  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login if trying to access protected route
    next('/login')
  } else if (requiresGuest && authStore.isAuthenticated) {
    // Redirect to dashboard if already logged in and trying to access login/register
    next('/')
  } else {
    next()
  }
})

export default router
