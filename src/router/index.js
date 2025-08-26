import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import AccountManager from '../views/AccountManager.vue'
import MonthlyEntry from '../views/MonthlyEntry.vue'
import ImportData from '../views/ImportData.vue'
import SubcategoryManager from '../views/SubcategoryManager.vue'

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
    path: '/subcategories',
    name: 'SubcategoryManager',
    component: SubcategoryManager
  },
  {
    path: '/entry',
    name: 'MonthlyEntry',
    component: MonthlyEntry
  },
  {
    path: '/import',
    name: 'ImportData',
    component: ImportData
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
