/**
 * SpendWise - Personal Expense Tracker
 * Data Layer & Business Logic
 */

// Categories Configuration
const CATEGORIES = [
  {
    id: 'Food',
    name: 'Food',
    color: '#f59e0b',       // Amber
    bgColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#f59e0b',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`
  },
  {
    id: 'Travel',
    name: 'Travel',
    color: '#06b6d4',       // Cyan
    bgColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: '#06b6d4',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M7 15h.01"></path><path d="M17 15h.01"></path></svg>`
  },
  {
    id: 'Shopping',
    name: 'Shopping',
    color: '#8b5cf6',       // Purple
    bgColor: 'rgba(139, 92, 246, 0.12)',
    borderColor: '#8b5cf6',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`
  },
  {
    id: 'Education',
    name: 'Education',
    color: '#3b82f6',       // Blue
    bgColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: '#3b82f6',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path></svg>`
  },
  {
    id: 'Bills',
    name: 'Bills',
    color: '#f97316',       // Orange
    bgColor: 'rgba(249, 115, 22, 0.12)',
    borderColor: '#f97316',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
  },
  {
    id: 'Healthcare',
    name: 'Healthcare',
    color: '#ec4899',       // Pink
    bgColor: 'rgba(236, 72, 153, 0.12)',
    borderColor: '#ec4899',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`
  },
  {
    id: 'Entertainment',
    name: 'Entertainment',
    color: '#a855f7',       // Violet
    bgColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: '#a855f7',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`
  },
  {
    id: 'Other',
    name: 'Other',
    color: '#64748b',       // Slate
    bgColor: 'rgba(100, 116, 139, 0.12)',
    borderColor: '#64748b',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`
  }
];

// Supported Currencies
const CURRENCIES = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar ($)', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (€)', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound (£)', locale: 'en-GB' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)', locale: 'ja-JP' },
  CAD: { code: 'CAD', symbol: '$', name: 'Canadian Dollar (CAD $)', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: '$', name: 'Australian Dollar (AUD $)', locale: 'en-AU' }
};

// Storage Keys
const STORAGE_KEYS = {
  EXPENSES: 'spendwise_expenses_v1',
  SETTINGS: 'spendwise_settings_v1'
};

// Default Settings
const DEFAULT_SETTINGS = {
  displayName: 'Rahul Sharma',
  currency: 'INR',
  theme: 'light'
};

/**
 * Generate Realistic Sample Expenses
 * Anchored to the current date so data always looks fresh and lively
 */
function generateSampleExpenses() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  // Helper to format YYYY-MM-DD
  const formatOffsetDate = (daysAgo) => {
    const d = new Date(year, month, day - daysAgo);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dt}`;
  };

  return [
    {
      id: 'exp_' + (Date.now() - 1000),
      title: 'Swiggy Dinner with Family',
      amount: 1250,
      category: 'Food',
      date: formatOffsetDate(0), // Today
      notes: 'Butter chicken and garlic naans from Punjab Grill'
    },
    {
      id: 'exp_' + (Date.now() - 2000),
      title: 'Metro Smart Card Recharge',
      amount: 500,
      category: 'Travel',
      date: formatOffsetDate(0), // Today
      notes: 'Commute for upcoming weeks'
    },
    {
      id: 'exp_' + (Date.now() - 3000),
      title: 'Monthly Supermarket Groceries',
      amount: 4850,
      category: 'Food',
      date: formatOffsetDate(1), // Yesterday
      notes: 'Provisions, dairy, and fruits from Nature Basket'
    },
    {
      id: 'exp_' + (Date.now() - 4000),
      title: 'Airtel Fiber Broadband Bill',
      amount: 1179,
      category: 'Bills',
      date: formatOffsetDate(2),
      notes: '300 Mbps unlimited home broadband plan'
    },
    {
      id: 'exp_' + (Date.now() - 5000),
      title: 'Amazon Electronics - Wireless Earbuds',
      amount: 2999,
      category: 'Shopping',
      date: formatOffsetDate(3),
      notes: 'Replacement for gym workouts'
    },
    {
      id: 'exp_' + (Date.now() - 6000),
      title: 'Uber Cab to City Office',
      amount: 420,
      category: 'Travel',
      date: formatOffsetDate(4),
      notes: 'Late meeting return cab'
    },
    {
      id: 'exp_' + (Date.now() - 7000),
      title: 'Apollo Pharmacy - Multivitamins',
      amount: 1280,
      category: 'Healthcare',
      date: formatOffsetDate(5),
      notes: 'Monthly supplement routine'
    },
    {
      id: 'exp_' + (Date.now() - 8000),
      title: 'Coursera Cloud Computing Course',
      amount: 3499,
      category: 'Education',
      date: formatOffsetDate(7),
      notes: 'Professional skill upskilling certification'
    },
    {
      id: 'exp_' + (Date.now() - 9000),
      title: 'PVR IMAX Movie Tickets & Snacks',
      amount: 1450,
      category: 'Entertainment',
      date: formatOffsetDate(9),
      notes: 'Weekend weekend screening with friends'
    },
    {
      id: 'exp_' + (Date.now() - 10000),
      title: 'Electricity & Water Utility Bill',
      amount: 3240,
      category: 'Bills',
      date: formatOffsetDate(12),
      notes: 'Paid online via BESCOM portal'
    },
    {
      id: 'exp_' + (Date.now() - 11000),
      title: 'Zara Casual Linen Shirts',
      amount: 3990,
      category: 'Shopping',
      date: formatOffsetDate(14),
      notes: 'Festival festive season sale'
    },
    {
      id: 'exp_' + (Date.now() - 12000),
      title: 'Dental Routine Checkup & Cleaning',
      amount: 1500,
      category: 'Healthcare',
      date: formatOffsetDate(17),
      notes: 'Annual dental dental hygiene check'
    },
    {
      id: 'exp_' + (Date.now() - 13000),
      title: 'Coffee & Snacks at Blue Tokai',
      amount: 680,
      category: 'Food',
      date: formatOffsetDate(20),
      notes: 'Remote working afternoon session'
    },
    {
      id: 'exp_' + (Date.now() - 14000),
      title: 'Pet Care & House Supplies',
      amount: 950,
      category: 'Other',
      date: formatOffsetDate(22),
      notes: 'Dog treats and cleaning detergents'
    },
    {
      id: 'exp_' + (Date.now() - 15000),
      title: 'Netflix & Spotify Subscriptions',
      amount: 848,
      category: 'Entertainment',
      date: formatOffsetDate(25),
      notes: 'Monthly digital auto-debit'
    },
    {
      id: 'exp_' + (Date.now() - 16000),
      title: 'Technical Programming Books',
      amount: 1890,
      category: 'Education',
      date: formatOffsetDate(32), // Prior month
      notes: 'System design and frontend architecture'
    },
    {
      id: 'exp_' + (Date.now() - 17000),
      title: 'Flight Ticket to Delhi',
      amount: 6400,
      category: 'Travel',
      date: formatOffsetDate(38), // Prior month
      notes: 'Family visit round trip ticket'
    },
    {
      id: 'exp_' + (Date.now() - 18000),
      title: 'Quarterly Home Maintenance',
      amount: 4500,
      category: 'Bills',
      date: formatOffsetDate(42), // Prior month
      notes: 'AC servicing and plumbing repairs'
    }
  ];
}

/**
 * Storage Manager
 */
const StorageManager = {
  getExpenses() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (!stored) {
        // Initialize with realistic sample expenses
        const samples = generateSampleExpenses();
        this.saveExpenses(samples);
        return samples;
      }
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Error reading expenses from localStorage:', err);
      return [];
    }
  },

  saveExpenses(expenses) {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      return true;
    } catch (err) {
      console.error('Error saving expenses to localStorage:', err);
      return false;
    }
  },

  getSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!stored) {
        this.saveSettings(DEFAULT_SETTINGS);
        return { ...DEFAULT_SETTINGS };
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch (err) {
      console.error('Error reading settings from localStorage:', err);
      return { ...DEFAULT_SETTINGS };
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (err) {
      console.error('Error saving settings to localStorage:', err);
      return false;
    }
  },

  clearAllData() {
    try {
      localStorage.removeItem(STORAGE_KEYS.EXPENSES);
      return true;
    } catch (err) {
      console.error('Error clearing data:', err);
      return false;
    }
  },

  resetToSampleData() {
    const samples = generateSampleExpenses();
    this.saveExpenses(samples);
    return samples;
  }
};

/**
 * Calculation Engine & Helpers
 */
const ExpenseCalc = {
  /**
   * Calculate Total Expenses
   */
  getTotalAmount(expenses) {
    if (!Array.isArray(expenses) || expenses.length === 0) return 0;
    return expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  },

  /**
   * Calculate Today's Expenses (based on local user date YYYY-MM-DD)
   */
  getTodayAmount(expenses) {
    if (!Array.isArray(expenses) || expenses.length === 0) return 0;
    const todayStr = this.getTodayDateString();
    return expenses
      .filter(item => item.date === todayStr)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  },

  /**
   * Get Category with highest total spend
   */
  getMostUsedCategory(expenses) {
    if (!Array.isArray(expenses) || expenses.length === 0) {
      return { name: 'None', amount: 0, percentage: 0 };
    }
    const catTotals = {};
    let grandTotal = 0;

    expenses.forEach(item => {
      const cat = item.category || 'Other';
      const amt = Number(item.amount) || 0;
      catTotals[cat] = (catTotals[cat] || 0) + amt;
      grandTotal += amt;
    });

    let topCategory = 'None';
    let maxAmount = 0;

    for (const [cat, amt] of Object.entries(catTotals)) {
      if (amt > maxAmount) {
        maxAmount = amt;
        topCategory = cat;
      }
    }

    const percentage = grandTotal > 0 ? Math.round((maxAmount / grandTotal) * 100) : 0;
    return { name: topCategory, amount: maxAmount, percentage };
  },

  /**
   * Calculate Category Breakdown (totals and percentages)
   */
  getCategoryBreakdown(expenses) {
    const grandTotal = this.getTotalAmount(expenses);
    const catMap = {};

    CATEGORIES.forEach(cat => {
      catMap[cat.id] = {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        bgColor: cat.bgColor,
        icon: cat.icon,
        total: 0,
        count: 0,
        percentage: 0
      };
    });

    if (Array.isArray(expenses)) {
      expenses.forEach(item => {
        const catId = item.category && catMap[item.category] ? item.category : 'Other';
        const amt = Number(item.amount) || 0;
        catMap[catId].total += amt;
        catMap[catId].count += 1;
      });
    }

    const result = Object.values(catMap).map(cat => ({
      ...cat,
      percentage: grandTotal > 0 ? Number(((cat.total / grandTotal) * 100).toFixed(1)) : 0
    }));

    // Sort by highest spending first
    return result.sort((a, b) => b.total - a.total);
  },

  /**
   * Calculate Monthly Spending Trend for the last N months
   */
  getMonthlyTrend(expenses, numMonths = 6) {
    const now = new Date();
    const months = [];

    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1; // 1-12
      const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      months.push({ key: monthKey, label, year, month: monthNum, total: 0, count: 0 });
    }

    if (Array.isArray(expenses)) {
      expenses.forEach(item => {
        if (!item.date) return;
        const itemMonthKey = item.date.substring(0, 7); // 'YYYY-MM'
        const match = months.find(m => m.key === itemMonthKey);
        if (match) {
          match.total += Number(item.amount) || 0;
          match.count += 1;
        }
      });
    }

    return months;
  },

  /**
   * Filter expenses for a specific Year & Month ('YYYY-MM')
   */
  getExpensesForMonth(expenses, monthKey) {
    if (!Array.isArray(expenses) || !monthKey) return [];
    return expenses.filter(item => item.date && item.date.startsWith(monthKey));
  },

  /**
   * Get unique months available in expenses, plus current month
   */
  getAvailableMonths(expenses) {
    const monthSet = new Set();
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthSet.add(currentKey);

    if (Array.isArray(expenses)) {
      expenses.forEach(item => {
        if (item.date && item.date.length >= 7) {
          monthSet.add(item.date.substring(0, 7));
        }
      });
    }

    const sorted = Array.from(monthSet).sort().reverse();
    return sorted.map(key => {
      const [year, month] = key.split('-').map(Number);
      const d = new Date(year, month - 1, 1);
      const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      return { key, label, year, month };
    });
  },

  /**
   * Get helper string for today's date YYYY-MM-DD
   */
  getTodayDateString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  /**
   * Format Currency using configured currency
   */
  formatCurrency(amount, currencyCode = 'INR') {
    const num = Number(amount) || 0;
    const config = CURRENCIES[currencyCode] || CURRENCIES.INR;

    try {
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.code,
        minimumFractionDigits: num % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
      }).format(num);
    } catch {
      return `${config.symbol} ${num.toLocaleString()}`;
    }
  },

  /**
   * Format Date nicely (e.g., "Today", "Yesterday", or "21 Oct 2026")
   */
  formatDateNice(dateStr) {
    if (!dateStr) return '';
    const today = this.getTodayDateString();
    
    // Yesterday
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (dateStr === today) {
      return 'Today';
    } else if (dateStr === yesterday) {
      return 'Yesterday';
    }

    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  },

  /**
   * Get Category Object by id
   */
  getCategoryInfo(categoryId) {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
  }
};
