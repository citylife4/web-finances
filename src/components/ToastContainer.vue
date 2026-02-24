<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="'toast-' + toast.type"
        @click="remove(toast.id)"
      >
        <span class="toast-icon">{{ icons[toast.type] }}</span>
        <span class="toast-text">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script>
import { reactive } from 'vue'

const toasts = reactive([])
let nextId = 0

export function useToast() {
  const add = (message, type = 'info', duration = 3500) => {
    const id = nextId++
    toasts.push({ id, message, type })
    setTimeout(() => {
      const idx = toasts.findIndex(t => t.id === id)
      if (idx !== -1) toasts.splice(idx, 1)
    }, duration)
  }

  return {
    success: (msg, duration) => add(msg, 'success', duration),
    error: (msg, duration) => add(msg, 'error', duration ?? 5000),
    info: (msg, duration) => add(msg, 'info', duration),
    warn: (msg, duration) => add(msg, 'warn', duration)
  }
}

export default {
  name: 'ToastContainer',
  setup() {
    const icons = { success: '✓', error: '✗', info: 'ℹ', warn: '⚠' }
    const remove = (id) => {
      const idx = toasts.findIndex(t => t.id === id)
      if (idx !== -1) toasts.splice(idx, 1)
    }
    return { toasts, icons, remove }
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  pointer-events: auto;
  min-width: 250px;
  max-width: 400px;
}

.toast-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.toast-text {
  line-height: 1.4;
}

.toast-success {
  background: #28a745;
}

.toast-error {
  background: #dc3545;
}

.toast-info {
  background: #667eea;
}

.toast-warn {
  background: #ffc107;
  color: #333;
}

/* Transitions */
.toast-enter-active {
  transition: all 0.3s ease;
}

.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
