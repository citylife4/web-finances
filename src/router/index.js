import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import AccountManager from '../views/AccountManager.vue'
import MonthlyEntry from '../views/MonthlyEntry.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/accounts',
    name: 'AccountManager',
    component: AccountManager
  },
  {
    path: '/entry',
    name: 'MonthlyEntry',
    component: MonthlyEntry
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
