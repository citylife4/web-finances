<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="confirm-overlay" data-cy="confirm-modal" @click.self="cancel">
        <div class="confirm-dialog" role="alertdialog" :aria-label="title">
          <h3 class="confirm-title">{{ title }}</h3>
          <p class="confirm-message">{{ message }}</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" data-cy="confirm-cancel" @click="cancel">{{ cancelText }}</button>
            <button
              class="btn"
              :class="dangerous ? 'btn-danger' : 'btn-primary'"
              data-cy="confirm-accept"
              @click="confirm"
              ref="confirmBtn"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { ref, watch, nextTick } from 'vue'

export default {
  name: 'ConfirmModal',
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: 'Confirm' },
    message: { type: String, required: true },
    confirmText: { type: String, default: 'Confirm' },
    cancelText: { type: String, default: 'Cancel' },
    dangerous: { type: Boolean, default: false }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const confirmBtn = ref(null)

    watch(() => props.visible, async (val) => {
      if (val) {
        await nextTick()
        confirmBtn.value?.focus()
      }
    })

    const confirm = () => emit('confirm')
    const cancel = () => emit('cancel')

    return { confirm, cancel, confirmBtn }
  }
}
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.confirm-dialog {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.confirm-title {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
  color: #333;
}

.confirm-message {
  margin: 0 0 1.5rem;
  color: #666;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn {
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #e9ecef;
  color: #495057;
}

.btn-secondary:hover {
  background: #dee2e6;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .confirm-dialog,
.modal-leave-active .confirm-dialog {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .confirm-dialog {
  transform: scale(0.95);
}
</style>
