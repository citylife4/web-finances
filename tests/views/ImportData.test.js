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

  it('preserves month alignment when the header row contains blank columns', async () => {
    const wrapper = createWrapper()

    const parsed = wrapper.vm.parseReverseTableData([
      ['Bank/Wallet', 'Type', 'Category', 'Jan/2024', '', 'Mar/2024'],
      ['Cash Wallet', 'deposits', 'Emergency Fund', 100, 999, 300]
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
        month: '2024-03',
        amount: 300
      }
    ])
  })

  it('parses Excel Date headers and formatted amount strings without corrupting values', async () => {
    const wrapper = createWrapper()

    const parsed = wrapper.vm.parseReverseTableData([
      ['Bank/Wallet', 'Type', 'Category', new Date(2024, 0, 1), new Date(2024, 1, 1), new Date(2024, 2, 1)],
      ['Brokerage', 'investments', 'Stock Portfolio', '1,234.56', '€1.234,56', '(2,500.75)']
    ])

    expect(parsed.entries).toEqual([
      {
        accountName: 'Brokerage',
        accountTypeName: 'investments',
        accountTypeId: 'type-inv',
        categoryName: 'Stock Portfolio',
        month: '2024-01',
        amount: 1234.56
      },
      {
        accountName: 'Brokerage',
        accountTypeName: 'investments',
        accountTypeId: 'type-inv',
        categoryName: 'Stock Portfolio',
        month: '2024-02',
        amount: 1234.56
      },
      {
        accountName: 'Brokerage',
        accountTypeName: 'investments',
        accountTypeId: 'type-inv',
        categoryName: 'Stock Portfolio',
        month: '2024-03',
        amount: -2500.75
      }
    ])
  })

  it('parses supported localized month headers', async () => {
    const wrapper = createWrapper()

    const parsed = wrapper.vm.parseReverseTableData([
      ['Bank/Wallet', 'Type', 'Category', 'Mär/2024', 'Mai 2024', 'Okt 2024'],
      ['Depot', 'investments', 'Stock Portfolio', 1000, 1100, 1200]
    ])

    expect(parsed.entries).toEqual([
      {
        accountName: 'Depot',
        accountTypeName: 'investments',
        accountTypeId: 'type-inv',
        categoryName: 'Stock Portfolio',
        month: '2024-03',
        amount: 1000
      },
      {
        accountName: 'Depot',
        accountTypeName: 'investments',
        accountTypeId: 'type-inv',
        categoryName: 'Stock Portfolio',
        month: '2024-05',
        amount: 1100
      },
      {
        accountName: 'Depot',
        accountTypeName: 'investments',
        accountTypeId: 'type-inv',
        categoryName: 'Stock Portfolio',
        month: '2024-10',
        amount: 1200
      }
    ])
  })

  it('parses larger worksheets without dropping aligned entries', async () => {
    const wrapper = createWrapper()
    const header = ['Bank/Wallet', 'Type', 'Category']

    for (let month = 1; month <= 24; month += 1) {
      const paddedMonth = String(((month - 1) % 12) + 1).padStart(2, '0')
      const year = 2024 + Math.floor((month - 1) / 12)
      header.push(`${paddedMonth}/${year}`)
    }

    const rows = [header]

    for (let accountIndex = 1; accountIndex <= 250; accountIndex += 1) {
      rows.push([
        `Account ${accountIndex}`,
        accountIndex % 2 === 0 ? 'deposits' : 'investments',
        accountIndex % 2 === 0 ? 'Emergency Fund' : 'Stock Portfolio',
        ...Array.from({ length: 24 }, (_, monthIndex) => accountIndex * 100 + monthIndex)
      ])
    }

    const parsed = wrapper.vm.parseReverseTableData(rows)

    expect(parsed.accounts).toHaveLength(250)
    expect(parsed.entries).toHaveLength(6000)
    expect(parsed.entries[0]).toMatchObject({
      accountName: 'Account 1',
      month: '2024-01',
      amount: 100
    })
    expect(parsed.entries.at(-1)).toMatchObject({
      accountName: 'Account 250',
      month: '2025-12',
      amount: 25023
    })
  })

  it('shows the parsed account type in the preview table', async () => {
    const wrapper = createWrapper()

    wrapper.vm.previewData = {
      accounts: [
        {
          name: 'Cash Wallet',
          typeName: 'deposits',
          typeId: 'type-dep',
          categoryName: 'Emergency Fund',
          exists: false
        }
      ],
      entries: [],
      months: []
    }

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.accounts-preview tbody tr').text()).toContain('deposits')
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
