<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2>Financial Dashboard</h2>
      <p class="subtitle">Track your wealth progression over time</p>
    </div>

    <!-- Loading State -->
    <div v-if="store.loading" class="loading-state">
      <p>Loading your financial data...</p>
    </div>

    <!-- Error State -->
    <div v-if="store.error" class="error-state">
      <p>⚠️ {{ store.error }}</p>
      <button @click="store.initialize()" class="btn btn-primary">Retry</button>
    </div>

    <!-- Dashboard Content -->
    <div v-if="!store.loading && !store.error">
      <!-- Summary Cards -->
      <div class="summary-cards">
      <div class="card deposits">
        <div class="card-header">
          <h3>💳 Total Deposits</h3>
        </div>
        <div class="card-amount">
          {{ formatCurrency(totalDeposits) }}
        </div>
      </div>
      
      <div class="card investments">
        <div class="card-header">
          <h3>📈 Total Investments</h3>
        </div>
        <div class="card-amount">
          {{ formatCurrency(totalInvestments) }}
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
      <div class="chart-container">
        <h3>Wealth Progression Over Time</h3>
        <canvas ref="progressionChart"></canvas>
      </div>
      
      <div class="chart-container">
        <h3>Assets Breakdown</h3>
        <canvas ref="breakdownChart"></canvas>
      </div>

      <div class="chart-container" v-if="categoryBreakdown.length > 0">
        <h3>Category Breakdown</h3>
        <canvas ref="categoryChart"></canvas>
      </div>
    </div>

    <!-- Category Insights -->
    <div v-if="categoryInsights.length > 0" class="category-insights">
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
    <div class="recent-entries">
      <h3>Recent Entries</h3>
      <div v-if="recentEntries.length === 0" class="no-data">
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
import { store, ACCOUNT_TYPES } from '../store/api-store'
import { format } from 'date-fns'

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

    const totalDeposits = computed(() => {
      try {
        return store.getTotalByType(ACCOUNT_TYPES.DEPOSITS)
      } catch (error) {
        console.error('Error calculating total deposits:', error)
        return 0
      }
    })
    
    const totalInvestments = computed(() => {
      try {
        return store.getTotalByType(ACCOUNT_TYPES.INVESTMENTS)
      } catch (error) {
        console.error('Error calculating total investments:', error)
        return 0
      }
    })
    
    const totalNetWorth = computed(() => 
      totalDeposits.value + totalInvestments.value
    )

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
          const latestEntry = store.monthlyEntries
            .filter(entry => {
              const entryAccountId = typeof entry.accountId === 'string' ? entry.accountId : entry.accountId._id
              return entryAccountId === account._id
            })
            .sort((a, b) => new Date(b.month) - new Date(a.month))[0]
          
          group.total += latestEntry ? latestEntry.amount : 0
        })
        
        if (group.total > 0) {
          breakdown.push({
            name: group.category.name,
            type: group.category.type,
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
        const parentTotal = item.type === ACCOUNT_TYPES.DEPOSITS ? totalDeposits.value : totalInvestments.value
        const percentage = parentTotal > 0 ? ((item.total / parentTotal) * 100).toFixed(1) : 0
        
        insights.push({
          name: item.name,
          parentType: item.type === ACCOUNT_TYPES.DEPOSITS ? 'Deposits' : 'Investments',
          total: item.total,
          percentage,
          accountCount: item.accountCount
        })
      })
      
      return insights.sort((a, b) => b.total - a.total)
    })

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(amount)
    }

    const formatMonth = (monthString) => {
      return format(new Date(monthString + '-01'), 'MMMM yyyy')
    }

    const getAccountName = (entry) => {
      // Handle both old localStorage format and new API format
      if (typeof entry.accountId === 'string') {
        const account = store.accounts.find(acc => acc._id === entry.accountId)
        return account ? account.name : 'Unknown Account'
      } else if (entry.accountId && entry.accountId.name) {
        return entry.accountId.name
      }
      return 'Unknown Account'
    }

    const createProgressionChart = async () => {
      if (progressionChartInstance) {
        progressionChartInstance.destroy()
      }

      try {
        const monthlyTotals = await store.getMonthlyTotals()
        
        if (monthlyTotals.length === 0) return

        const ctx = progressionChart.value.getContext('2d')
        progressionChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: monthlyTotals.map(data => format(new Date(data.month + '-01'), 'MMM yyyy')),
          datasets: [
            {
              label: 'Total Net Worth',
              data: monthlyTotals.map(data => data.total),
              borderColor: '#667eea',
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Deposits',
              data: monthlyTotals.map(data => data.deposits),
              borderColor: '#f093fb',
              backgroundColor: 'rgba(240, 147, 251, 0.1)',
              fill: false,
              tension: 0.4
            },
            {
              label: 'Investments',
              data: monthlyTotals.map(data => data.investments),
              borderColor: '#f5576c',
              backgroundColor: 'rgba(245, 87, 108, 0.1)',
              fill: false,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value)
                }
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' + new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(context.parsed.y)
                }
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
      breakdownChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Deposits', 'Investments'],
          datasets: [{
            data: [totalDeposits.value, totalInvestments.value],
            backgroundColor: ['#f093fb', '#f5576c'],
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
                  return context.label + ': ' + new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(context.parsed) + ' (' + percentage + '%)'
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
                  const parentTotal = item.type === ACCOUNT_TYPES.DEPOSITS ? totalDeposits.value : totalInvestments.value
                  const percentage = parentTotal > 0 ? ((context.parsed / parentTotal) * 100).toFixed(1) : 0
                  return `${context.label}: ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(context.parsed)} (${percentage}% of ${item.type})`
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
      // Ensure store is initialized (in case user navigates directly to dashboard)
      if (store.accounts.length === 0 && store.categories.length === 0) {
        await store.initialize()
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
      totalDeposits,
      totalInvestments,
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
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 3rem;
}

.dashboard-header h2 {
  margin: 0;
  font-size: 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #666;
  margin-top: 0.5rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.card {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  transition: transform 0.3s;
}

.card:hover {
  transform: translateY(-5px);
}

.card.deposits {
  border-left: 5px solid #f093fb;
}

.card.investments {
  border-left: 5px solid #f5576c;
}

.card.total {
  border-left: 5px solid #667eea;
}

.card-header h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.card-amount {
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
}

.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.chart-container {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  height: 400px;
}

.chart-container h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
}

.chart-container canvas {
  height: 300px !important;
}

.recent-entries {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.recent-entries h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
}

.no-data {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.entry-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
}

.entry-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.entry-month {
  color: #666;
  font-size: 0.9rem;
}

.entry-amount {
  font-weight: bold;
  font-size: 1.1rem;
  color: #333;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.loading-state p {
  font-size: 1.2rem;
  color: #666;
}

.error-state p {
  font-size: 1.1rem;
  color: #dc3545;
  margin-bottom: 1rem;
}

/* Category Insights */
.category-insights {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  margin-bottom: 3rem;
}

.category-insights h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.insight-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 10px;
  padding: 1.5rem;
  border-left: 4px solid;
  transition: transform 0.3s, box-shadow 0.3s;
}

.insight-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.insight-card:nth-child(4n+1) {
  border-left-color: #667eea;
}

.insight-card:nth-child(4n+2) {
  border-left-color: #f093fb;
}

.insight-card:nth-child(4n+3) {
  border-left-color: #4facfe;
}

.insight-card:nth-child(4n+4) {
  border-left-color: #43e97b;
}

.insight-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.insight-header h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.parent-type {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.insight-amount {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.insight-percentage {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.insight-accounts {
  color: #888;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .dashboard {
    padding: 1rem;
  }
  
  .dashboard-header h2 {
    font-size: 2rem;
  }
  
  .insights-grid {
    grid-template-columns: 1fr;
  }
}
</style>
