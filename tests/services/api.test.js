import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }))
  }
}))

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Token Management', () => {
    it('should store access token in localStorage', async () => {
      // Dynamic import to get fresh module
      const { setAccessToken, getAccessToken } = await import('@/services/api.js')
      
      setAccessToken('test-token-123')
      
      expect(localStorage.getItem('accessToken')).toBe('test-token-123')
      expect(getAccessToken()).toBe('test-token-123')
    })

    it('should clear access token when set to null', async () => {
      const { setAccessToken } = await import('@/services/api.js')
      
      localStorage.setItem('accessToken', 'existing-token')
      setAccessToken(null)
      
      expect(localStorage.getItem('accessToken')).toBeNull()
    })
  })
})
