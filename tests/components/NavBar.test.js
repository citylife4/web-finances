import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NavBar from '@/components/NavBar.vue'
import { createRouter, createWebHistory } from 'vue-router'

// Create a mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
    { path: '/dashboard', name: 'Dashboard', component: { template: '<div>Dashboard</div>' } },
    { path: '/accounts', name: 'Accounts', component: { template: '<div>Accounts</div>' } }
  ]
})

describe('NavBar Component', () => {
  beforeEach(async () => {
    await router.push('/')
    await router.isReady()
  })

  it('renders navigation links', () => {
    const wrapper = mount(NavBar, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.text()).toContain('Dashboard')
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
})
