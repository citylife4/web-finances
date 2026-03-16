import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NavBar from '@/components/NavBar.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { authStore } from '@/store/auth-store'

// Create a mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
    { path: '/dashboard', name: 'Dashboard', component: { template: '<div>Dashboard</div>' } },
    { path: '/accounts', name: 'Accounts', component: { template: '<div>Accounts</div>' } },
    { path: '/categories', name: 'Categories', component: { template: '<div>Categories</div>' } },
    { path: '/category-types', name: 'Category Types', component: { template: '<div>Category Types</div>' } },
    { path: '/entry', name: 'Monthly Entry', component: { template: '<div>Monthly Entry</div>' } },
    { path: '/import', name: 'Import Data', component: { template: '<div>Import Data</div>' } },
    { path: '/login', name: 'Login', component: { template: '<div>Login</div>' } },
    { path: '/register', name: 'Register', component: { template: '<div>Register</div>' } }
  ]
})

describe('NavBar Component', () => {
  beforeEach(async () => {
    authStore.user = { name: 'Test User', email: 'test@example.com' }
    authStore.isAuthenticated = true
    await router.push('/')
    await router.isReady()
  })

  it('renders authenticated navigation links', () => {
    const wrapper = mount(NavBar, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.text()).toContain('Manage Accounts')
    expect(wrapper.text()).toContain('Logout')
  })

  it('has router-link components', () => {
    const wrapper = mount(NavBar, {
      global: {
        plugins: [router]
      }
    })

    const links = wrapper.findAll('a, router-link')
    expect(links.length).toBeGreaterThan(0)
  })

  it('renders login/register links when unauthenticated', () => {
    authStore.user = null
    authStore.isAuthenticated = false

    const wrapper = mount(NavBar, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.text()).toContain('Login')
    expect(wrapper.text()).toContain('Register')
    expect(wrapper.text()).not.toContain('Dashboard')
  })
})
