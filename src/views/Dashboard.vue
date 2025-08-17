<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2>Financial Dashboard</h2>
      <p class="subtitle">Track your wealth progression over time</p>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="card deposits">
        <div class="card-header">
          <h3>💳 Total Deposits</h3>
        </div>
        <div class="card-amount">
          ${{ formatCurrency(totalDeposits) }}
        </div>
      </div>
      
      <div class="card investments">
        <div class="card-header">
          <h3>📈 Total Investments</h3>
        </div>
        <div class="card-amount">
          ${{ formatCurrency(totalInvestments) }}
        </div>
      </div>
      
      <div class="card total">
        <div class="card-header">
          <h3>💎 Total Net Worth</h3>
        </div>
        <div class="card-amount">
          ${{ formatCurrency(totalNetWorth) }}
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
            ${{ formatCurrency(entry.amount) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { Chart, registerables } from 'chart.js'
import { store, ACCOUNT_TYPES } from '../store/api-store'
import { format } from 'date-fns'

Chart.register(...registerables)

export default {
  name: 'Dashboard',
  setup() {
    const progressionChart = ref(null)
    const breakdownChart = ref(null)
    let progressionChartInstance = null
    let breakdownChartInstance = null

    const totalDeposits = computed(() => 
      store.getTotalByType(ACCOUNT_TYPES.DEPOSITS)
    )
    
    const totalInvestments = computed(() => 
      store.getTotalByType(ACCOUNT_TYPES.INVESTMENTS)
    )
    
    const totalNetWorth = computed(() => 
      totalDeposits.value + totalInvestments.value
    )

    const recentEntries = computed(() => 
      store.monthlyEntries
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    )

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US').format(amount)
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
                  return '$' + new Intl.NumberFormat('en-US').format(value)
                }
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': $' + new Intl.NumberFormat('en-US').format(context.parsed.y)
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
                  return context.label + ': $' + new Intl.NumberFormat('en-US').format(context.parsed) + ' (' + percentage + '%)'
                }
              }
            }
          }
        }
      })
    }

    onMounted(async () => {
      await createProgressionChart()
      createBreakdownChart()
    })

    return {
      totalDeposits,
      totalInvestments,
      totalNetWorth,
      recentEntries,
      progressionChart,
      breakdownChart,
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
}
</style>
