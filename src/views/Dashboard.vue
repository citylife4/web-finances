<template>
  <div class="dashboard page">
    <div class="page-header">
      <h2>Financial Dashboard</h2>
      <p class="subtitle">Track your wealth progression over time</p>
    </div>

    <!-- Loading State -->
    <div v-if="store.loading" class="panel empty-state">
      <p>Loading your financial data...</p>
    </div>

    <!-- Error State -->
    <div v-if="store.error" class="panel error-state">
      <p>⚠️ {{ store.error }}</p>
      <button @click="store.initialize()" class="btn btn-primary">Retry</button>
    </div>

    <!-- Dashboard Content -->
    <div v-if="!store.loading && !store.error">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <!-- Dynamic type cards -->
        <div 
          v-for="categoryType in store.categoryTypes" 
          :key="categoryType._id"
          class="card"
          :style="{ borderTopColor: categoryType.color }"
        >
          <div class="card-header">
            <h3>{{ categoryType.icon }} Total {{ categoryType.displayName }}</h3>
          </div>
          <div class="card-amount">
            {{ formatCurrency(getTotalByTypeId(categoryType._id)) }}
          </div>
        </div>
      
        <div class="card total">
          <div class="card-header">
            <h3>💎 Total Net Worth</h3>
          </div>
          <div class="card-amount">
            {{ formatCurrency(totalNetWorth) }}
          </div>
        </div>
      </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <div class="chart-container panel">
        <h3>Wealth Progression Over Time</h3>
        <canvas ref="progressionChart"></canvas>
      </div>

      <div class="chart-container panel">
        <h3>Assets Breakdown</h3>
        <canvas ref="breakdownChart"></canvas>
      </div>

      <div class="chart-container panel" v-if="categoryBreakdown.length > 0">
        <h3>Category Breakdown</h3>
        <canvas ref="categoryChart"></canvas>
      </div>
    </div>

    <!-- Category Insights -->
    <div v-if="categoryInsights.length > 0" class="category-insights panel">
      <h3>Category Analysis</h3>
      <div class="insights-grid">
        <div 
          v-for="insight in categoryInsights" 
          :key="insight.categoryId || 'no-category'"
          class="insight-card"
        >
          <div class="insight-header">
            <h4>{{ insight.name }}</h4>
            <span class="parent-type">{{ insight.parentType }}</span>
          </div>
          <div class="insight-amount">
            {{ formatCurrency(insight.total) }}
          </div>
          <div class="insight-percentage">
            {{ insight.percentage }}% of {{ insight.parentType }}
          </div>
          <div class="insight-accounts">
            {{ insight.accountCount }} account{{ insight.accountCount !== 1 ? 's' : '' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Entries -->
    <div class="recent-entries panel">
      <h3>Recent Entries</h3>
      <div v-if="recentEntries.length === 0" class="empty-state">
        No entries yet. <router-link to="/entry">Add your first entry</router-link>
      </div>
      <div v-else class="entries-list">
        <div v-for="entry in recentEntries" :key="entry._id" class="entry-item">
          <div class="entry-info">
            <strong>{{ getAccountName(entry) }}</strong>
            <span class="entry-month">{{ formatMonth(entry.month) }}</span>
          </div>
          <div class="entry-amount">
            {{ formatCurrency(entry.amount) }}
          </div>
        </div>
      </div>
    </div>
    </div> <!-- Close the conditional content div -->
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Chart, registerables } from 'chart.js'
import { store, idOf } from '../store/api-store'
import { formatCurrency, formatMonth, formatMonthShort } from '../utils/format'

Chart.register(...registerables)

export default {
  name: 'Dashboard',
  setup() {
    const progressionChart = ref(null)
    const breakdownChart = ref(null)
    const categoryChart = ref(null)
    let progressionChartInstance = null
    let breakdownChartInstance = null
    let categoryChartInstance = null

    // Cleanup function to destroy all chart instances
    const destroyCharts = () => {
      if (progressionChartInstance) {
        progressionChartInstance.destroy()
        progressionChartInstance = null
      }
      if (breakdownChartInstance) {
        breakdownChartInstance.destroy()
        breakdownChartInstance = null
      }
      if (categoryChartInstance) {
        categoryChartInstance.destroy()
        categoryChartInstance = null
      }
    }

    const getLatestAmount = (accountId) => {
      const latestEntry = store.monthlyEntries
        .filter(entry => idOf(entry.accountId) === accountId)
        .sort((a, b) => new Date(b.month) - new Date(a.month))[0]
      return latestEntry ? latestEntry.amount : 0
    }

    const getTotalByTypeId = (typeId) => {
      return store.accounts
        .filter(acc => idOf(acc.typeId) === typeId)
        .reduce((total, account) => total + getLatestAmount(account._id), 0)
    }

    const totalNetWorth = computed(() => {
      return store.accounts.reduce((total, account) => total + getLatestAmount(account._id), 0)
    })

    const recentEntries = computed(() => 
      store.monthlyEntries
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    )

    const categoryBreakdown = computed(() => {
      const breakdown = []
      
      // Group accounts by category
      const categoryGroups = {}
      
      store.accounts.forEach(account => {
        if (account.categoryId) {
          const key = account.categoryId._id
          if (!categoryGroups[key]) {
            categoryGroups[key] = {
              category: account.categoryId,
              accounts: [],
              total: 0
            }
          }
          categoryGroups[key].accounts.push(account)
        }
      })
      
      // Calculate totals for each category
      Object.values(categoryGroups).forEach(group => {
        group.accounts.forEach(account => {
          group.total += getLatestAmount(account._id)
        })

        if (group.total > 0) {
          breakdown.push({
            name: group.category.name,
            typeId: group.category.typeId,
            total: group.total,
            accountCount: group.accounts.length
          })
        }
      })
      
      return breakdown.sort((a, b) => b.total - a.total)
    })

    const categoryInsights = computed(() => {
      const insights = []
      
      // Add insights for categories
      categoryBreakdown.value.forEach(item => {
        const typeId = idOf(item.typeId)
        const categoryType = store.categoryTypes.find(t => t._id === typeId)
        const parentTotal = getTotalByTypeId(typeId)
        const percentage = parentTotal > 0 ? ((item.total / parentTotal) * 100).toFixed(1) : 0
        
        insights.push({
          name: item.name,
          parentType: categoryType?.displayName || 'Unknown',
          total: item.total,
          percentage,
          accountCount: item.accountCount
        })
      })
      
      return insights.sort((a, b) => b.total - a.total)
    })

    const getAccountName = (entry) => {
      if (entry.accountId?.name) return entry.accountId.name
      const account = store.accounts.find(acc => acc._id === idOf(entry.accountId))
      return account ? account.name : 'Unknown Account'
    }

    const createProgressionChart = async () => {
      if (progressionChartInstance) {
        progressionChartInstance.destroy()
      }

      try {
        const monthlyTotals = await store.getMonthlyTotals()
        
        if (monthlyTotals.length === 0) return

        const ctx = progressionChart.value.getContext('2d')
        
        // Create dynamic datasets for each category type
        const datasets = [
          {
            label: 'Total Net Worth',
            data: monthlyTotals.map(data => data.total),
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
        
        // Add a dataset for each category type found in the data
        const typeDatasets = {}
        store.categoryTypes.forEach(type => {
          typeDatasets[type.name] = {
            label: type.displayName,
            data: monthlyTotals.map(data => {
              const typeData = data.typeBreakdown?.find(t => t.typeName === type.name)
              return typeData ? typeData.total : 0
            }),
            borderColor: type.color,
            backgroundColor: type.color + '20', // Add transparency
            fill: false,
            tension: 0.4
          }
        })
        
        datasets.push(...Object.values(typeDatasets))
        
        progressionChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: monthlyTotals.map(data => formatMonthShort(data.month)),
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => formatCurrency(value)
              }
            }
          },
          plugins: {
            tooltip: {
              enabled: true,
              position: 'nearest',
              yAlign: 'bottom',
              callbacks: {
                label: (context) => context.dataset.label + ': ' + formatCurrency(context.parsed.y)
              }
            }
          }
        }
      })
      } catch (error) {
        console.error('Error creating progression chart:', error)
      }
    }

    const createBreakdownChart = () => {
      if (breakdownChartInstance) {
        breakdownChartInstance.destroy()
      }

      if (totalNetWorth.value === 0) return

      const ctx = breakdownChart.value.getContext('2d')
      
      // Get labels and data for each category type
      const labels = store.categoryTypes.map(type => type.displayName)
      const data = store.categoryTypes.map(type => getTotalByTypeId(type._id))
      const colors = store.categoryTypes.map(type => type.color)
      
      breakdownChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const percentage = ((context.parsed / totalNetWorth.value) * 100).toFixed(1)
                  return context.label + ': ' + formatCurrency(context.parsed) + ' (' + percentage + '%)'
                }
              }
            }
          }
        }
      })
    }

    const createCategoryChart = () => {
      if (categoryChartInstance) {
        categoryChartInstance.destroy()
      }

      if (categoryBreakdown.value.length === 0) return

      const ctx = categoryChart.value.getContext('2d')
      
      // Generate different colors for each category
      const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c', 
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
        '#fad0c4', '#ffd1ff', '#c2e9fb', '#a1c4fd'
      ]

      categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: categoryBreakdown.value.map(item => item.name),
          datasets: [{
            data: categoryBreakdown.value.map(item => item.total),
            backgroundColor: colors.slice(0, categoryBreakdown.value.length),
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const item = categoryBreakdown.value[context.dataIndex]
                  const typeId = idOf(item.typeId)
                  const categoryType = store.categoryTypes.find(t => t._id === typeId)
                  const parentTotal = getTotalByTypeId(typeId)
                  const percentage = parentTotal > 0 ? ((context.parsed / parentTotal) * 100).toFixed(1) : 0
                  return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}% of ${categoryType?.displayName || 'Unknown'})`
                }
              }
            },
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true
              }
            }
          }
        }
      })
    }

    onMounted(async () => {
      // Always reload data to ensure we have the latest category types, categories, and accounts
      try {
        await Promise.all([
          store.loadCategoryTypes(),
          store.loadAccounts(),
          store.loadCategories(),
          store.loadEntries()
        ])
      } catch (error) {
        console.error('Failed to load data:', error)
      }

      await createProgressionChart()
      createBreakdownChart()
      createCategoryChart()
    })

    // Clean up chart instances to prevent memory leaks
    onUnmounted(() => {
      destroyCharts()
    })

    return {
      store,
      getTotalByTypeId,
      totalNetWorth,
      recentEntries,
      categoryBreakdown,
      categoryInsights,
      progressionChart,
      breakdownChart,
      categoryChart,
      formatCurrency,
      formatMonth,
      getAccountName
    }
  }
}
</script>

<style scoped>
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-header h3 {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.card-amount {
  font-size: 1.9rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.chart-container {
  min-height: 430px;
  position: relative;
  /* allow grid tracks to shrink below the canvas' intrinsic size */
  min-width: 0;
}

.chart-container canvas {
  max-height: 340px !important;
  height: 340px !important;
  max-width: 100% !important;
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.entry-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1rem;
  background: var(--color-surface-muted);
  border-radius: var(--radius-md);
}

.entry-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.entry-month {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.entry-amount {
  font-weight: 700;
  color: var(--color-text);
}

.error-state {
  text-align: center;
  margin-bottom: 1.5rem;
}

.error-state p {
  color: var(--color-danger);
  margin-bottom: 1rem;
}

/* Category Insights */
.category-insights {
  margin-bottom: 1.5rem;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.insight-card {
  background: var(--color-surface-muted);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  border-left: 4px solid var(--color-primary);
}

.insight-card:nth-child(4n+2) {
  border-left-color: #b473d6;
}

.insight-card:nth-child(4n+3) {
  border-left-color: #4facfe;
}

.insight-card:nth-child(4n+4) {
  border-left-color: #34c98e;
}

.insight-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.insight-header h4 {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 600;
}

.parent-type {
  background: rgba(91, 110, 232, 0.1);
  color: var(--color-primary-dark);
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.insight-amount {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.35rem;
}

.insight-percentage {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  margin-bottom: 0.2rem;
}

.insight-accounts {
  color: var(--color-text-soft);
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .charts-section {
    grid-template-columns: 1fr;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }
}
</style>
