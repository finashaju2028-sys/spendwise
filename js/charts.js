/**
 * SpendWise - Personal Expense Tracker
 * Chart.js Integration & Visualization Manager
 */

const ChartManager = {
  // Chart instances
  dashboardTrendChart: null,
  dashboardCategoryChart: null,
  reportsTrendChart: null,
  reportsCategoryChart: null,

  /**
   * Helper to get theme-aware colors
   */
  getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      textColor: isDark ? '#94a3b8' : '#64748b',
      textMuted: isDark ? '#64748b' : '#94a3b8',
      gridColor: isDark ? 'rgba(51, 65, 85, 0.35)' : 'rgba(226, 232, 240, 0.8)',
      tooltipBg: isDark ? '#1e293b' : '#0f172a',
      tooltipText: '#ffffff',
      navyPrimary: '#1e3a8a',
      navyAccent: '#2563eb',
      navyHover: '#1d4ed8'
    };
  },

  /**
   * Safe destruction of an existing chart
   */
  destroyChart(chartKey) {
    if (this[chartKey] && typeof this[chartKey].destroy === 'function') {
      this[chartKey].destroy();
      this[chartKey] = null;
    }
  },

  /**
   * 1. Dashboard Monthly Spending Bar Chart
   */
  renderDashboardTrend(expenses, currencyCode = 'INR') {
    const canvas = document.getElementById('dashboardTrendCanvas');
    if (!canvas || typeof Chart === 'undefined') return;

    this.destroyChart('dashboardTrendChart');

    const monthlyData = ExpenseCalc.getMonthlyTrend(expenses, 6);
    const theme = this.getThemeColors();
    const currency = CURRENCIES[currencyCode] || CURRENCIES.INR;

    const labels = monthlyData.map(m => m.label);
    const dataValues = monthlyData.map(m => m.total);

    // If completely empty, show friendly placeholder
    const allZero = dataValues.every(v => v === 0);

    const ctx = canvas.getContext('2d');
    
    // Create subtle gradient for bars
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, '#2563eb');
    gradient.addColorStop(1, '#60a5fa');

    this.dashboardTrendChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Expenses',
          data: dataValues,
          backgroundColor: allZero ? 'rgba(148, 163, 184, 0.2)' : gradient,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 38
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            padding: 12,
            cornerRadius: 8,
            boxPadding: 4,
            callbacks: {
              label: (context) => {
                const val = context.raw || 0;
                return ` Spent: ${ExpenseCalc.formatCurrency(val, currencyCode)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: theme.textColor,
              font: { family: 'inherit', size: 12 }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: theme.gridColor,
              drawBorder: false
            },
            ticks: {
              color: theme.textColor,
              font: { family: 'inherit', size: 11 },
              callback: (value) => {
                if (value >= 100000) return `${currency.symbol}${(value / 100000).toFixed(1)}L`;
                if (value >= 1000) return `${currency.symbol}${(value / 1000).toFixed(0)}k`;
                return `${currency.symbol}${value}`;
              }
            }
          }
        }
      }
    });
  },

  /**
   * 2. Dashboard Category Breakdown Doughnut Chart
   */
  renderDashboardCategory(expenses, currencyCode = 'INR') {
    const canvas = document.getElementById('dashboardCategoryCanvas');
    if (!canvas || typeof Chart === 'undefined') return;

    this.destroyChart('dashboardCategoryChart');

    const breakdown = ExpenseCalc.getCategoryBreakdown(expenses).filter(c => c.total > 0);
    const theme = this.getThemeColors();

    const emptyWrapper = document.getElementById('dashboardCategoryEmpty');
    if (breakdown.length === 0) {
      if (emptyWrapper) emptyWrapper.style.display = 'flex';
      canvas.style.display = 'none';
      return;
    } else {
      if (emptyWrapper) emptyWrapper.style.display = 'none';
      canvas.style.display = 'block';
    }

    const labels = breakdown.map(c => c.name);
    const dataValues = breakdown.map(c => c.total);
    const bgColors = breakdown.map(c => c.color);

    this.dashboardCategoryChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1e293b' : '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: theme.textColor,
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 14,
              font: { family: 'inherit', size: 12 }
            }
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            padding: 12,
            cornerRadius: 8,
            boxPadding: 4,
            callbacks: {
              label: (context) => {
                const val = context.raw || 0;
                const total = dataValues.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${ExpenseCalc.formatCurrency(val, currencyCode)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  },

  /**
   * 3. Reports Monthly Spending Bar Chart
   */
  renderReportsTrend(expenses, currencyCode = 'INR') {
    const canvas = document.getElementById('reportsTrendCanvas');
    if (!canvas || typeof Chart === 'undefined') return;

    this.destroyChart('reportsTrendChart');

    const monthlyData = ExpenseCalc.getMonthlyTrend(expenses, 12);
    const theme = this.getThemeColors();
    const currency = CURRENCIES[currencyCode] || CURRENCIES.INR;

    const labels = monthlyData.map(m => m.label);
    const dataValues = monthlyData.map(m => m.total);

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, '#1e3a8a');
    gradient.addColorStop(1, '#3b82f6');

    this.reportsTrendChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Monthly Total',
          data: dataValues,
          backgroundColor: gradient,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 42
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const val = context.raw || 0;
                return ` Spending: ${ExpenseCalc.formatCurrency(val, currencyCode)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: theme.textColor,
              font: { family: 'inherit', size: 12 }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: theme.gridColor,
              drawBorder: false
            },
            ticks: {
              color: theme.textColor,
              font: { family: 'inherit', size: 11 },
              callback: (value) => {
                if (value >= 100000) return `${currency.symbol}${(value / 100000).toFixed(1)}L`;
                if (value >= 1000) return `${currency.symbol}${(value / 1000).toFixed(0)}k`;
                return `${currency.symbol}${value}`;
              }
            }
          }
        }
      }
    });
  },

  /**
   * 4. Reports Category Breakdown Doughnut Chart (for selected month)
   */
  renderReportsCategory(monthExpenses, currencyCode = 'INR') {
    const canvas = document.getElementById('reportsCategoryCanvas');
    if (!canvas || typeof Chart === 'undefined') return;

    this.destroyChart('reportsCategoryChart');

    const breakdown = ExpenseCalc.getCategoryBreakdown(monthExpenses).filter(c => c.total > 0);
    const theme = this.getThemeColors();

    const emptyWrapper = document.getElementById('reportsCategoryEmpty');
    if (breakdown.length === 0) {
      if (emptyWrapper) emptyWrapper.style.display = 'flex';
      canvas.style.display = 'none';
      return;
    } else {
      if (emptyWrapper) emptyWrapper.style.display = 'none';
      canvas.style.display = 'block';
    }

    const labels = breakdown.map(c => c.name);
    const dataValues = breakdown.map(c => c.total);
    const bgColors = breakdown.map(c => c.color);

    this.reportsCategoryChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1e293b' : '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: theme.textColor,
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 12,
              font: { family: 'inherit', size: 12 }
            }
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const val = context.raw || 0;
                const total = dataValues.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${ExpenseCalc.formatCurrency(val, currencyCode)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  },

  /**
   * Refresh all active charts when theme or data changes
   */
  refreshAll(expenses, selectedMonthExpenses, currencyCode) {
    this.renderDashboardTrend(expenses, currencyCode);
    this.renderDashboardCategory(expenses, currencyCode);
    this.renderReportsTrend(expenses, currencyCode);
    this.renderReportsCategory(selectedMonthExpenses, currencyCode);
  }
};
