import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmModal from '@/components/ConfirmModal.vue'

let wrapper

const createWrapper = (props = {}) => {
  wrapper = mount(ConfirmModal, {
    props: {
      message: 'Are you sure?',
      ...props
    },
    attachTo: document.body
  })
  return wrapper
}

// Helper: find element in document.body (teleported content)
const findInBody = (selector) => document.querySelector(selector)

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

describe('ConfirmModal Component', () => {
  it('is not visible by default', () => {
    createWrapper({ visible: false })
    expect(findInBody('.confirm-overlay')).toBeNull()
  })

  it('renders when visible is true', () => {
    createWrapper({ visible: true })
    expect(findInBody('.confirm-overlay')).not.toBeNull()
    expect(findInBody('.confirm-message').textContent).toBe('Are you sure?')
  })

  it('displays the provided title', () => {
    createWrapper({ visible: true, title: 'Delete Item' })
    expect(findInBody('.confirm-title').textContent).toBe('Delete Item')
  })

  it('displays custom confirm and cancel text', () => {
    createWrapper({
      visible: true,
      confirmText: 'Yes, Delete',
      cancelText: 'No, Keep'
    })
    expect(findInBody('[data-cy="confirm-accept"]').textContent.trim()).toBe('Yes, Delete')
    expect(findInBody('[data-cy="confirm-cancel"]').textContent.trim()).toBe('No, Keep')
  })

  it('emits confirm event when accept button clicked', async () => {
    const wrapper = createWrapper({ visible: true })
    findInBody('[data-cy="confirm-accept"]').click()
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('emits cancel event when cancel button clicked', async () => {
    const wrapper = createWrapper({ visible: true })
    findInBody('[data-cy="confirm-cancel"]').click()
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('applies btn-danger class when dangerous is true', () => {
    createWrapper({ visible: true, dangerous: true })
    const btn = findInBody('[data-cy="confirm-accept"]')
    expect(btn.classList.contains('btn-danger')).toBe(true)
    expect(btn.classList.contains('btn-primary')).toBe(false)
  })

  it('applies btn-primary class when dangerous is false', () => {
    createWrapper({ visible: true, dangerous: false })
    const btn = findInBody('[data-cy="confirm-accept"]')
    expect(btn.classList.contains('btn-primary')).toBe(true)
    expect(btn.classList.contains('btn-danger')).toBe(false)
  })

  it('has correct data-cy attributes', () => {
    createWrapper({ visible: true })
    expect(findInBody('[data-cy="confirm-modal"]')).not.toBeNull()
    expect(findInBody('[data-cy="confirm-accept"]')).not.toBeNull()
    expect(findInBody('[data-cy="confirm-cancel"]')).not.toBeNull()
  })
})

