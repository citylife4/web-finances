import { createRouter, createWebHistory } from 'vue-router'
import { authStore } from '../store/auth-store'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/accounts',
    name: 'AccountManager',
    component: () => import('../views/AccountManager.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/categories',
    name: 'CategoryManager',
    component: () => import('../views/CategoryManager.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/category-types',
    name: 'CategoryTypeManager',
    component: () => import('../views/CategoryTypeManager.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/entry',
    name: 'MonthlyEntry',
    component: () => import('../views/MonthlyEntry.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/import',
    name: 'ImportData',
    component: () => import('../views/ImportData.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/'
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
