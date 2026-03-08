import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ImportData from '@/views/ImportData.vue'

const { mockStore } = vi.hoisted(() => ({
  mockStore: {
    categoryTypes: [],
    accounts: [],
    categories: [],
    loadCategoryTypes: vi.fn(),
    loadAccounts: vi.fn(),
    loadCategories: vi.fn(),
    addCategory: vi.fn(),
    addAccount: vi.fn(),
    saveMonthlyEntries: vi.fn()
  }
}))

vi.mock('@/store/api-store', () => ({
  store: mockStore
}))

vi.mock('@/utils/exampleXlsx', () => ({
  downloadExampleXLSX: vi.fn()
}))

const createWrapper = () => mount(ImportData, {
  global: {
    stubs: {
      'router-link': {
        template: '<a><slot /></a>'
      }
    }
  }
})

describe('ImportData View', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.categoryTypes = [
      { _id: 'type-dep', name: 'deposits' },
      { _id: 'type-inv', name: 'investments' }
    ]
    mockStore.accounts = []
    mockStore.categories = []
    mockStore.loadCategoryTypes.mockResolvedValue([])
    mockStore.loadAccounts.mockResolvedValue([])
    mockStore.loadCategories.mockResolvedValue([])
    mockStore.addCategory.mockResolvedValue({ _id: 'cat-1', name: 'Emergency Fund', typeId: 'type-dep' })
    mockStore.addAccount.mockResolvedValue({ _id: 'acc-1', name: 'Cash Wallet' })
    mockStore.saveMonthlyEntries.mockResolvedValue({})
  })

  it('parses reverse-table XLSX data using current category types', async () => {
    const wrapper = createWrapper()

    const parsed = wrapper.vm.parseReverseTableData([
      ['Bank/Wallet', 'Type', 'Category', 'Jan/2024', 'Feb/2024'],
      ['Cash Wallet', 'deposits', 'Emergency Fund', 100, 150],
      ['Ignore Me', 'unknown', 'Bad Category', 1, 2],
      ['', 'deposits', 'Blank Name', 50, 60]
    ])

    expect(parsed.accounts).toEqual([
      {
        name: 'Cash Wallet',
        typeName: 'deposits',
        typeId: 'type-dep',
        categoryName: 'Emergency Fund'
      }
    ])
    expect(parsed.entries).toEqual([
      {
        accountName: 'Cash Wallet',
        accountTypeName: 'deposits',
        accountTypeId: 'type-dep',
        categoryName: 'Emergency Fund',
        month: '2024-01',
        amount: 100
      },
      {
        accountName: 'Cash Wallet',
        accountTypeName: 'deposits',
        accountTypeId: 'type-dep',
        categoryName: 'Emergency Fund',
        month: '2024-02',
        amount: 150
      }
    ])
  })

  it('creates missing categories and accounts before saving imported entries', async () => {
    const wrapper = createWrapper()
    wrapper.vm.previewData = {
      accounts: [
        {
          name: 'Cash Wallet',
          typeId: 'type-dep',
          categoryName: 'Emergency Fund',
          exists: false
        }
      ],
      entries: [
        {
          accountName: 'Cash Wallet',
          accountTypeId: 'type-dep',
          categoryName: 'Emergency Fund',
          month: '2024-01',
          amount: 100
        }
      ],
      months: ['2024-01']
    }

    await wrapper.vm.importData()

    expect(mockStore.addCategory).toHaveBeenCalledWith({
      name: 'Emergency Fund',
      typeId: 'type-dep',
      description: 'Imported from XLSX'
    })
    expect(mockStore.addAccount).toHaveBeenCalledWith({
      name: 'Cash Wallet',
      typeId: 'type-dep',
      categoryId: 'cat-1'
    })
    expect(mockStore.saveMonthlyEntries).toHaveBeenCalledWith([
      {
        accountId: 'acc-1',
        month: '2024-01',
        amount: 100
      }
    ])
    expect(wrapper.vm.successMessage).toContain('Successfully imported 1 accounts and 1 monthly entries.')
    expect(wrapper.vm.previewData).toBe(null)
  })
})
