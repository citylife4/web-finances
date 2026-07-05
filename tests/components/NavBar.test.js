import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NavBar from '@/components/NavBar.vue'
import { authStore } from '@/store/auth-store'
import { createRouter, createWebHistory } from 'vue-router'

// Create a mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
    { path: '/login', name: 'Login', component: { template: '<div>Login</div>' } },
    { path: '/accounts', name: 'Accounts', component: { template: '<div>Accounts</div>' } }
  ]
})

const mountNavBar = () => mount(NavBar, {
  global: {
    plugins: [router]
  }
})

describe('NavBar Component', () => {
  beforeEach(async () => {
    await router.push('/')
    await router.isReady()
  })

  it('renders app navigation when authenticated', () => {
    authStore.isAuthenticated = true
    authStore.user = { name: 'Test User', email: 'test@example.com' }

    const wrapper = mountNavBar()

    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.text()).toContain('Test User')
  })

  it('renders login/register links when not authenticated', () => {
    authStore.isAuthenticated = false
    authStore.user = null

    const wrapper = mountNavBar()

    expect(wrapper.text()).toContain('Login')
    expect(wrapper.text()).toContain('Register')
    expect(wrapper.text()).not.toContain('Dashboard')
  })

  it('has router-link components', () => {
    authStore.isAuthenticated = true
    const wrapper = mountNavBar()

    const links = wrapper.findAll('a, router-link')
    expect(links.length).toBeGreaterThan(0)
  })
})
