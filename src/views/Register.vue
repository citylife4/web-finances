<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Create Account</h2>
      
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input
            id="name"
            v-model="name"
            type="text"
            required
            placeholder="Enter your name"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="Enter your email"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="8"
            placeholder="At least 8 characters"
            :disabled="loading"
          />
          <small class="password-hint">
            Must be at least 8 characters with uppercase, lowercase, and number
          </small>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            placeholder="Confirm your password"
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Register' }}
        </button>
      </form>

      <p class="auth-switch">
        Already have an account? 
        <router-link to="/login">Login here</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { authStore } from '../store/auth-store'

export default {
  name: 'Register',
  data() {
    return {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      error: null,
      loading: false
    }
  },
  methods: {
    async handleRegister() {
      this.error = null

      // Validate passwords match
      if (this.password !== this.confirmPassword) {
        this.error = 'Passwords do not match'
        return
      }

      // Validate password length
      if (this.password.length < 8) {
        this.error = 'Password must be at least 8 characters'
        return
      }

      // Validate password requirements
      if (!/[A-Z]/.test(this.password)) {
        this.error = 'Password must contain at least one uppercase letter'
        return
      }
      if (!/[a-z]/.test(this.password)) {
        this.error = 'Password must contain at least one lowercase letter'
        return
      }
      if (!/[0-9]/.test(this.password)) {
        this.error = 'Password must contain at least one number'
        return
      }

      this.loading = true

      try {
        await authStore.register({
          name: this.name,
          email: this.email,
          password: this.password
        })
        
        // Initialize store with user data after successful registration
        const { store } = await import('../store/api-store')
        await store.initialize()
        
        // Redirect to dashboard after successful registration
        this.$router.push('/')
      } catch (error) {
        this.error = error.response?.data?.error || 'Registration failed. Please try again.'
        console.error('Registration error:', error)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 60px);
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.auth-card h2 {
  margin-top: 0;
  margin-bottom: 30px;
  color: #2c3e50;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-switch {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.auth-switch a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.auth-switch a:hover {
  text-decoration: underline;
}

.password-hint {
  display: block;
  margin-top: 4px;
  color: #666;
  font-size: 12px;
}
</style>
