/**
 * SpendWise - Personal Expense Tracker
 * Main Application Controller & View Router
 */

const App = {
  // Application State
  state: {
    expenses: [],
    settings: { ...DEFAULT_SETTINGS },
    currentView: 'dashboard',
    editingExpenseId: null,
    deletingExpenseId: null,
    filters: {
      search: '',
      category: 'all',
      dateRange: 'all',
      customStartDate: '',
      customEndDate: '',
      sort: 'newest'
    },
    reportsSelectedMonth: ''
  },

  /**
   * Initialize Application
   */
  init() {
    // Load Settings & Expenses from Storage
    this.state.settings = StorageManager.getSettings();
    this.state.expenses = StorageManager.getExpenses();

    // Apply saved theme
    this.applyTheme(this.state.settings.theme);

    // Set initial reports month (Current Month: YYYY-MM)
    const now = new Date();
    this.state.reportsSelectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Setup Category Dropdown in Add/Edit Modal & Filter
    this.populateCategoryOptions();

    // Setup Currency Dropdown in Settings
    this.populateCurrencyOptions();

    // Setup Event Listeners
    this.bindEvents();

    // Handle initial route
    const initialHash = window.location.hash.replace('#', '') || 'dashboard';
    this.navigateTo(initialHash);

    // Initial render
    this.renderAll();
  },

  /**
   * Apply Theme (light / dark)
   */
  applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  },

  /**
   * Bind DOM & Window Event Listeners
   */
  bindEvents() {
    // Hash change for navigation
    window.addEventListener('hashchange', () => {
      const route = window.location.hash.replace('#', '') || 'dashboard';
      this.navigateTo(route);
    });

    // Sidebar navigation clicks
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-view');
        window.location.hash = targetView;
        this.closeMobileSidebar();
      });
    });

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => this.toggleMobileSidebar(true));
    }
    if (closeSidebarBtn) {
      closeSidebarBtn.addEventListener('click', () => this.toggleMobileSidebar(false));
    }
    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', () => this.toggleMobileSidebar(false));
    }

    // Modal Add Expense Triggers
    document.querySelectorAll('.btn-open-add-expense').forEach(btn => {
      btn.addEventListener('click', () => this.openExpenseModal());
    });

    // Modal Close Triggers
    const expenseModal = document.getElementById('expenseModal');
    const closeExpenseModalBtn = document.getElementById('closeExpenseModalBtn');
    const cancelExpenseBtn = document.getElementById('cancelExpenseBtn');

    if (closeExpenseModalBtn) {
      closeExpenseModalBtn.addEventListener('click', () => this.closeExpenseModal());
    }
    if (cancelExpenseBtn) {
      cancelExpenseBtn.addEventListener('click', () => this.closeExpenseModal());
    }
    if (expenseModal) {
      expenseModal.addEventListener('click', (e) => {
        if (e.target === expenseModal) this.closeExpenseModal();
      });
    }

    // Expense Form Submit
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
      expenseForm.addEventListener('submit', (e) => this.handleExpenseSubmit(e));
    }

    // Delete Modal Actions
    const deleteModal = document.getElementById('deleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());
    }
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => this.executeDeleteExpense());
    }
    if (deleteModal) {
      deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) this.closeDeleteModal();
      });
    }

    // Clear All Modal Actions
    const clearAllModal = document.getElementById('clearAllModal');
    const cancelClearAllBtn = document.getElementById('cancelClearAllBtn');
    const confirmClearAllBtn = document.getElementById('confirmClearAllBtn');
    const triggerClearAllBtn = document.getElementById('triggerClearAllBtn');

    if (triggerClearAllBtn) {
      triggerClearAllBtn.addEventListener('click', () => this.openClearAllModal());
    }
    if (cancelClearAllBtn) {
      cancelClearAllBtn.addEventListener('click', () => this.closeClearAllModal());
    }
    if (confirmClearAllBtn) {
      confirmClearAllBtn.addEventListener('click', () => this.executeClearAllData());
    }
    if (clearAllModal) {
      clearAllModal.addEventListener('click', (e) => {
        if (e.target === clearAllModal) this.closeClearAllModal();
      });
    }

    // Reset to Sample Data Trigger (in Settings)
    const loadSampleDataBtn = document.getElementById('loadSampleDataBtn');
    if (loadSampleDataBtn) {
      loadSampleDataBtn.addEventListener('click', () => this.handleResetSampleData());
    }

    // Settings Profile Form
    const settingsProfileForm = document.getElementById('settingsProfileForm');
    if (settingsProfileForm) {
      settingsProfileForm.addEventListener('submit', (e) => this.handleSaveSettingsProfile(e));
    }

    // Settings Currency Select
    const currencySelect = document.getElementById('settingsCurrencySelect');
    if (currencySelect) {
      currencySelect.addEventListener('change', (e) => this.handleCurrencyChange(e.target.value));
    }

    // Settings Theme Toggle
    const themeRadios = document.querySelectorAll('input[name="themeChoice"]');
    themeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => this.handleThemeChange(e.target.value));
    });

    // Transactions Search & Filters
    const searchInput = document.getElementById('trxSearchInput');
    const categoryFilter = document.getElementById('trxCategoryFilter');
    const dateRangeFilter = document.getElementById('trxDateRangeFilter');
    const sortFilter = document.getElementById('trxSortFilter');
    const resetFiltersBtn = document.getElementById('trxResetFiltersBtn');
    const customDateStart = document.getElementById('trxCustomStartDate');
    const customDateEnd = document.getElementById('trxCustomEndDate');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.filters.search = e.target.value.trim().toLowerCase();
        this.renderTransactionsView();
      });
    }

    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        this.state.filters.category = e.target.value;
        this.renderTransactionsView();
      });
    }

    if (dateRangeFilter) {
      dateRangeFilter.addEventListener('change', (e) => {
        this.state.filters.dateRange = e.target.value;
        const customWrapper = document.getElementById('trxCustomDateWrapper');
        if (customWrapper) {
          customWrapper.style.display = e.target.value === 'custom' ? 'flex' : 'none';
        }
        this.renderTransactionsView();
      });
    }

    if (customDateStart) {
      customDateStart.addEventListener('change', (e) => {
        this.state.filters.customStartDate = e.target.value;
        this.renderTransactionsView();
      });
    }

    if (customDateEnd) {
      customDateEnd.addEventListener('change', (e) => {
        this.state.filters.customEndDate = e.target.value;
        this.renderTransactionsView();
      });
    }

    if (sortFilter) {
      sortFilter.addEventListener('change', (e) => {
        this.state.filters.sort = e.target.value;
        this.renderTransactionsView();
      });
    }

    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => this.resetFilters());
    }

    // Reports Month Selector
    const reportsMonthSelect = document.getElementById('reportsMonthSelect');
    if (reportsMonthSelect) {
      reportsMonthSelect.addEventListener('change', (e) => {
        this.state.reportsSelectedMonth = e.target.value;
        this.renderReportsView();
      });
    }

    // Global keyboard Escape to close modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeExpenseModal();
        this.closeDeleteModal();
        this.closeClearAllModal();
        this.toggleMobileSidebar(false);
      }
    });
  },

  /**
   * Populate Category Select Options in Modal and Filter
   */
  populateCategoryOptions() {
    const formCategorySelect = document.getElementById('expenseCategory');
    const filterCategorySelect = document.getElementById('trxCategoryFilter');

    if (formCategorySelect) {
      formCategorySelect.innerHTML = `
        <option value="" disabled selected>Select a category...</option>
        ${CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      `;
    }

    if (filterCategorySelect) {
      filterCategorySelect.innerHTML = `
        <option value="all">All Categories</option>
        ${CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      `;
    }
  },

  /**
   * Populate Currency Options in Settings
   */
  populateCurrencyOptions() {
    const select = document.getElementById('settingsCurrencySelect');
    if (!select) return;

    select.innerHTML = Object.values(CURRENCIES).map(curr => `
      <option value="${curr.code}" ${this.state.settings.currency === curr.code ? 'selected' : ''}>
        ${curr.name}
      </option>
    `).join('');
  },

  /**
   * Navigate to View
   */
  navigateTo(viewId) {
    const validViews = ['dashboard', 'transactions', 'reports', 'settings'];
    const activeView = validViews.includes(viewId) ? viewId : 'dashboard';
    this.state.currentView = activeView;

    // Toggle View Sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });
    const targetSection = document.getElementById(`view-${activeView}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Update Navigation links active state
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-view') === activeView) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update mobile top bar title
    const viewTitleEl = document.getElementById('mobileViewTitle');
    if (viewTitleEl) {
      const titles = {
        dashboard: 'Dashboard',
        transactions: 'Transactions',
        reports: 'Monthly Reports',
        settings: 'Settings'
      };
      viewTitleEl.textContent = titles[activeView] || 'SpendWise';
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Render corresponding view
    if (activeView === 'dashboard') {
      this.renderDashboardView();
    } else if (activeView === 'transactions') {
      this.renderTransactionsView();
    } else if (activeView === 'reports') {
      this.renderReportsView();
    } else if (activeView === 'settings') {
      this.renderSettingsView();
    }
  },

  /**
   * Mobile Sidebar Drawer Toggle
   */
  toggleMobileSidebar(open) {
    const sidebar = document.getElementById('appSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!sidebar || !backdrop) return;

    if (open) {
      sidebar.classList.add('open');
      backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    } else {
      sidebar.classList.remove('open');
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  closeMobileSidebar() {
    this.toggleMobileSidebar(false);
  },

  /**
   * Render All Views & Global Elements
   */
  renderAll() {
    this.renderGlobalUser();
    this.renderDashboardView();
    this.renderTransactionsView();
    this.renderReportsView();
    this.renderSettingsView();
  },

  /**
   * Render Global User Header & Display Name
   */
  renderGlobalUser() {
    const name = this.state.settings.displayName || 'Rahul Sharma';
    
    // Greeting in Dashboard
    const welcomeNameEl = document.getElementById('welcomeUserName');
    if (welcomeNameEl) welcomeNameEl.textContent = name;

    // Sidebar User Pill
    const sidebarUserNameEl = document.getElementById('sidebarUserName');
    if (sidebarUserNameEl) sidebarUserNameEl.textContent = name;

    const sidebarUserInitials = document.getElementById('sidebarUserInitials');
    if (sidebarUserInitials) {
      const parts = name.trim().split(' ');
      const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
      sidebarUserInitials.textContent = initials;
    }

    // Current Date formatting
    const currentDateEl = document.getElementById('currentDateDisplay');
    if (currentDateEl) {
      const now = new Date();
      currentDateEl.textContent = now.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  },

  /**
   * 1. Render Dashboard View
   */
  renderDashboardView() {
    const expenses = this.state.expenses;
    const curr = this.state.settings.currency;

    // Calculations
    const totalSpent = ExpenseCalc.getTotalAmount(expenses);
    const totalTransactions = expenses.length;
    const todaySpent = ExpenseCalc.getTodayAmount(expenses);
    const mostUsed = ExpenseCalc.getMostUsedCategory(expenses);

    // Update Summary Cards
    const elTotalAmount = document.getElementById('dashTotalAmount');
    const elTotalTrx = document.getElementById('dashTotalTransactions');
    const elTodayAmount = document.getElementById('dashTodayAmount');
    const elTopCatName = document.getElementById('dashTopCategoryName');
    const elTopCatSub = document.getElementById('dashTopCategorySub');

    if (elTotalAmount) elTotalAmount.textContent = ExpenseCalc.formatCurrency(totalSpent, curr);
    if (elTotalTrx) elTotalTrx.textContent = totalTransactions.toLocaleString();
    if (elTodayAmount) elTodayAmount.textContent = ExpenseCalc.formatCurrency(todaySpent, curr);
    
    if (elTopCatName && elTopCatSub) {
      if (mostUsed.name !== 'None' && mostUsed.amount > 0) {
        elTopCatName.textContent = mostUsed.name;
        elTopCatSub.textContent = `${ExpenseCalc.formatCurrency(mostUsed.amount, curr)} (${mostUsed.percentage}%)`;
      } else {
        elTopCatName.textContent = 'None';
        elTopCatSub.textContent = 'No expenses recorded';
      }
    }

    // Render Recent Transactions (Latest 5)
    this.renderRecentTransactions();

    // Render Dashboard Charts
    ChartManager.renderDashboardTrend(expenses, curr);
    ChartManager.renderDashboardCategory(expenses, curr);
  },

  /**
   * Render Recent Transactions on Dashboard
   */
  renderRecentTransactions() {
    const container = document.getElementById('recentTransactionsList');
    if (!container) return;

    const curr = this.state.settings.currency;

    // Sort by date desc, then by id
    const sorted = [...this.state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sorted.slice(0, 5);

    if (recent.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
          <h4>No Expenses Yet</h4>
          <p>Start recording your daily spending to see them reflected on your dashboard.</p>
          <button class="btn btn-primary btn-sm btn-open-add-expense" style="margin-top: 12px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add First Expense
          </button>
        </div>
      `;

      // Rebind trigger for the button inside empty state
      const addBtn = container.querySelector('.btn-open-add-expense');
      if (addBtn) {
        addBtn.addEventListener('click', () => this.openExpenseModal());
      }
      return;
    }

    container.innerHTML = `
      <div class="transaction-list-group">
        ${recent.map(item => this.createTransactionListItemHTML(item, curr)).join('')}
      </div>
    `;

    // Attach actions
    this.attachTransactionActionListeners(container);
  },

  /**
   * 2. Render Expense History / Transactions View
   */
  renderTransactionsView() {
    const container = document.getElementById('transactionsTableContainer');
    const countBadge = document.getElementById('trxCountBadge');
    const summaryText = document.getElementById('trxSummaryText');
    const curr = this.state.settings.currency;

    let filtered = [...this.state.expenses];

    // Filter by Search Query
    if (this.state.filters.search) {
      const q = this.state.filters.search;
      filtered = filtered.filter(item => {
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const notesMatch = (item.notes || '').toLowerCase().includes(q);
        return titleMatch || notesMatch;
      });
    }

    // Filter by Category
    if (this.state.filters.category && this.state.filters.category !== 'all') {
      filtered = filtered.filter(item => item.category === this.state.filters.category);
    }

    // Filter by Date Range
    const todayStr = ExpenseCalc.getTodayDateString();
    const now = new Date();

    if (this.state.filters.dateRange === 'today') {
      filtered = filtered.filter(item => item.date === todayStr);
    } else if (this.state.filters.dateRange === 'week') {
      const startOfWeek = new Date(now);
      const dayOfWeek = now.getDay() || 7; // Sunday=7
      startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
      const startStr = startOfWeek.toISOString().substring(0, 10);
      filtered = filtered.filter(item => item.date >= startStr && item.date <= todayStr);
    } else if (this.state.filters.dateRange === 'month') {
      const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      filtered = filtered.filter(item => item.date && item.date.startsWith(monthPrefix));
    } else if (this.state.filters.dateRange === 'year') {
      const yearPrefix = `${now.getFullYear()}-`;
      filtered = filtered.filter(item => item.date && item.date.startsWith(yearPrefix));
    } else if (this.state.filters.dateRange === 'custom') {
      const start = this.state.filters.customStartDate;
      const end = this.state.filters.customEndDate;
      if (start) {
        filtered = filtered.filter(item => item.date >= start);
      }
      if (end) {
        filtered = filtered.filter(item => item.date <= end);
      }
    }

    // Sort Transactions
    const sort = this.state.filters.sort;
    filtered.sort((a, b) => {
      if (sort === 'newest') {
        return new Date(b.date) - new Date(a.date) || b.id.localeCompare(a.id);
      } else if (sort === 'oldest') {
        return new Date(a.date) - new Date(b.date) || a.id.localeCompare(b.id);
      } else if (sort === 'highest') {
        return Number(b.amount) - Number(a.amount);
      } else if (sort === 'lowest') {
        return Number(a.amount) - Number(b.amount);
      }
      return 0;
    });

    // Update Badges & Summary Counts
    if (countBadge) countBadge.textContent = filtered.length;
    if (summaryText) {
      const totalCount = this.state.expenses.length;
      if (filtered.length === totalCount) {
        summaryText.textContent = `Showing all ${totalCount} transactions`;
      } else {
        summaryText.textContent = `Showing ${filtered.length} of ${totalCount} transactions (filtered)`;
      }
    }

    // Render Table or Empty State
    if (!container) return;

    if (filtered.length === 0) {
      const isFiltered = this.state.filters.search || this.state.filters.category !== 'all' || this.state.filters.dateRange !== 'all';
      
      container.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h4>${isFiltered ? 'No Transactions Match Filters' : 'No Transactions Recorded Yet'}</h4>
          <p>${isFiltered ? 'Try clearing your search query or adjusting your filters to view more records.' : 'Click "+ Add Expense" to begin tracking your financial expenses.'}</p>
          <div style="display: flex; gap: 10px; justify-content: center; margin-top: 14px;">
            ${isFiltered ? `
              <button class="btn btn-secondary btn-sm" id="emptyStateResetFiltersBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                Reset Filters
              </button>
            ` : ''}
            <button class="btn btn-primary btn-sm btn-open-add-expense">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add Expense
            </button>
          </div>
        </div>
      `;

      const resetBtn = container.querySelector('#emptyStateResetFiltersBtn');
      if (resetBtn) resetBtn.addEventListener('click', () => this.resetFilters());

      const addBtn = container.querySelector('.btn-open-add-expense');
      if (addBtn) addBtn.addEventListener('click', () => this.openExpenseModal());
      return;
    }

    // Responsive Table Markup
    container.innerHTML = `
      <div class="table-responsive">
        <table class="transactions-table">
          <thead>
            <tr>
              <th>Expense Details</th>
              <th>Category</th>
              <th>Date</th>
              <th style="text-align: right;">Amount</th>
              <th style="text-align: center; width: 110px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(item => this.createTransactionTableRowHTML(item, curr)).join('')}
          </tbody>
        </table>
      </div>
    `;

    this.attachTransactionActionListeners(container);
  },

  /**
   * Helper: Generate Transaction Table Row HTML
   */
  createTransactionTableRowHTML(item, currencyCode) {
    const cat = ExpenseCalc.getCategoryInfo(item.category);
    const dateFormatted = ExpenseCalc.formatDateNice(item.date);
    const amountFormatted = ExpenseCalc.formatCurrency(item.amount, currencyCode);

    return `
      <tr data-id="${item.id}">
        <td>
          <div class="cell-title-group">
            <span class="cell-title-icon" style="background-color: ${cat.bgColor}; color: ${cat.color};">
              ${cat.icon}
            </span>
            <div class="cell-title-text">
              <span class="expense-title-text">${this.escapeHTML(item.title)}</span>
              ${item.notes ? `<span class="expense-notes-snippet" title="${this.escapeHTML(item.notes)}">${this.escapeHTML(item.notes)}</span>` : ''}
            </div>
          </div>
        </td>
        <td>
          <span class="badge category-badge" style="background-color: ${cat.bgColor}; color: ${cat.color}; border: 1px solid ${cat.borderColor}33;">
            ${cat.name}
          </span>
        </td>
        <td>
          <span class="cell-date">${dateFormatted}</span>
        </td>
        <td style="text-align: right;">
          <span class="cell-amount expense-amount-negative">-${amountFormatted}</span>
        </td>
        <td style="text-align: center;">
          <div class="action-buttons-group">
            <button class="btn-icon btn-action-edit" data-id="${item.id}" title="Edit Expense" aria-label="Edit Expense">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-icon btn-action-delete" data-id="${item.id}" title="Delete Expense" aria-label="Delete Expense">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  },

  /**
   * Helper: Generate Recent Transaction List Item HTML
   */
  createTransactionListItemHTML(item, currencyCode) {
    const cat = ExpenseCalc.getCategoryInfo(item.category);
    const dateFormatted = ExpenseCalc.formatDateNice(item.date);
    const amountFormatted = ExpenseCalc.formatCurrency(item.amount, currencyCode);

    return `
      <div class="recent-trx-item" data-id="${item.id}">
        <div class="trx-item-left">
          <div class="trx-cat-icon" style="background-color: ${cat.bgColor}; color: ${cat.color};">
            ${cat.icon}
          </div>
          <div class="trx-details">
            <div class="trx-title-row">
              <span class="trx-title">${this.escapeHTML(item.title)}</span>
              <span class="badge category-badge-sm" style="background-color: ${cat.bgColor}; color: ${cat.color};">
                ${cat.name}
              </span>
            </div>
            <div class="trx-meta">
              <span class="trx-date">${dateFormatted}</span>
              ${item.notes ? `<span class="trx-notes" title="${this.escapeHTML(item.notes)}">• ${this.escapeHTML(item.notes)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="trx-item-right">
          <span class="trx-amount expense-amount-negative">-${amountFormatted}</span>
          <div class="trx-actions">
            <button class="btn-icon-sm btn-action-edit" data-id="${item.id}" title="Edit Expense">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-icon-sm btn-action-delete" data-id="${item.id}" title="Delete Expense">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Attach Edit & Delete Listeners to dynamic transaction rows
   */
  attachTransactionActionListeners(parentContainer) {
    parentContainer.querySelectorAll('.btn-action-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.openExpenseModal(id);
      });
    });

    parentContainer.querySelectorAll('.btn-action-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.openDeleteModal(id);
      });
    });
  },

  /**
   * Reset Filter State
   */
  resetFilters() {
    this.state.filters = {
      search: '',
      category: 'all',
      dateRange: 'all',
      customStartDate: '',
      customEndDate: '',
      sort: 'newest'
    };

    const s = document.getElementById('trxSearchInput');
    const c = document.getElementById('trxCategoryFilter');
    const d = document.getElementById('trxDateRangeFilter');
    const sort = document.getElementById('trxSortFilter');
    const customWrapper = document.getElementById('trxCustomDateWrapper');
    const start = document.getElementById('trxCustomStartDate');
    const end = document.getElementById('trxCustomEndDate');

    if (s) s.value = '';
    if (c) c.value = 'all';
    if (d) d.value = 'all';
    if (sort) sort.value = 'newest';
    if (customWrapper) customWrapper.style.display = 'none';
    if (start) start.value = '';
    if (end) end.value = '';

    this.renderTransactionsView();
  },

  /**
   * 3. Render Monthly Reports View
   */
  renderReportsView() {
    const expenses = this.state.expenses;
    const curr = this.state.settings.currency;

    // Populate Available Months Selector
    const monthSelect = document.getElementById('reportsMonthSelect');
    const availableMonths = ExpenseCalc.getAvailableMonths(expenses);

    if (monthSelect) {
      // Keep selected or fallback
      let selected = this.state.reportsSelectedMonth;
      if (!availableMonths.find(m => m.key === selected)) {
        selected = availableMonths[0]?.key || selected;
        this.state.reportsSelectedMonth = selected;
      }

      monthSelect.innerHTML = availableMonths.map(m => `
        <option value="${m.key}" ${m.key === selected ? 'selected' : ''}>
          ${m.label}
        </option>
      `).join('');
    }

    // Filter expenses for selected month
    const selectedKey = this.state.reportsSelectedMonth;
    const monthExpenses = ExpenseCalc.getExpensesForMonth(expenses, selectedKey);

    // Calculate Summary Metrics
    const totalMonthSpent = ExpenseCalc.getTotalAmount(monthExpenses);
    const monthTrxCount = monthExpenses.length;

    // Calculate Days in Month for Daily Average
    let daysToDivide = 30;
    if (selectedKey) {
      const [y, m] = selectedKey.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      const now = new Date();
      if (y === now.getFullYear() && (m - 1) === now.getMonth()) {
        // If current month, divide by current day of month so average is accurate!
        daysToDivide = Math.max(1, now.getDate());
      } else {
        daysToDivide = daysInMonth;
      }
    }
    const dailyAverage = totalMonthSpent > 0 ? (totalMonthSpent / daysToDivide) : 0;

    // Highest Expense in Selected Month
    let highestExpense = null;
    if (monthExpenses.length > 0) {
      highestExpense = [...monthExpenses].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
    }

    // Update Metric Cards
    const elMonthTotal = document.getElementById('reportsTotalAmount');
    const elMonthAvg = document.getElementById('reportsDailyAverage');
    const elHighestExp = document.getElementById('reportsHighestExpense');
    const elMonthTrx = document.getElementById('reportsTransactionCount');

    if (elMonthTotal) elMonthTotal.textContent = ExpenseCalc.formatCurrency(totalMonthSpent, curr);
    if (elMonthAvg) elMonthAvg.textContent = ExpenseCalc.formatCurrency(dailyAverage, curr) + '/day';
    
    if (elHighestExp) {
      if (highestExpense) {
        elHighestExp.textContent = `${highestExpense.title} (${ExpenseCalc.formatCurrency(highestExpense.amount, curr)})`;
      } else {
        elHighestExp.textContent = 'None';
      }
    }

    if (elMonthTrx) elMonthTrx.textContent = monthTrxCount.toLocaleString();

    // Render Charts
    ChartManager.renderReportsTrend(expenses, curr);
    ChartManager.renderReportsCategory(monthExpenses, curr);

    // Render Category Breakdown Table
    this.renderReportsCategoryTable(monthExpenses, totalMonthSpent, curr);
  },

  /**
   * Render Reports Detailed Category Breakdown Table
   */
  renderReportsCategoryTable(monthExpenses, totalSpent, currencyCode) {
    const container = document.getElementById('reportsCategoryTableContainer');
    if (!container) return;

    const breakdown = ExpenseCalc.getCategoryBreakdown(monthExpenses);

    if (monthExpenses.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="padding: 24px;">
          <p style="color: var(--color-text-muted); font-size: 14px;">No expense records found for the selected month.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table class="reports-breakdown-table">
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align: right;">Spent Amount</th>
            <th style="width: 32%;">Distribution</th>
            <th style="text-align: right;">Transactions</th>
          </tr>
        </thead>
        <tbody>
          ${breakdown.map(item => {
            if (item.total === 0) return '';
            return `
              <tr>
                <td>
                  <div class="cell-title-group">
                    <span class="cell-title-icon" style="background-color: ${item.bgColor}; color: ${item.color};">
                      ${item.icon}
                    </span>
                    <span style="font-weight: 600; color: var(--color-text);">${item.name}</span>
                  </div>
                </td>
                <td style="text-align: right; font-weight: 700; color: var(--color-expense);">
                  -${ExpenseCalc.formatCurrency(item.total, currencyCode)}
                </td>
                <td>
                  <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${item.percentage}%; background-color: ${item.color};"></div>
                  </div>
                  <span class="progress-bar-label">${item.percentage}%</span>
                </td>
                <td style="text-align: right; color: var(--color-text-muted); font-weight: 500;">
                  ${item.count}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  },

  /**
   * 4. Render Settings View
   */
  renderSettingsView() {
    const settings = this.state.settings;

    const nameInput = document.getElementById('settingsDisplayNameInput');
    if (nameInput) nameInput.value = settings.displayName || 'Rahul Sharma';

    const currencySelect = document.getElementById('settingsCurrencySelect');
    if (currencySelect) currencySelect.value = settings.currency || 'INR';

    const themeLight = document.getElementById('themeRadioLight');
    const themeDark = document.getElementById('themeRadioDark');
    if (themeLight && themeDark) {
      if (settings.theme === 'dark') {
        themeDark.checked = true;
      } else {
        themeLight.checked = true;
      }
    }

    // Storage count
    const storageCountEl = document.getElementById('settingsStorageCount');
    if (storageCountEl) {
      storageCountEl.textContent = `${this.state.expenses.length} expense records currently stored in your browser's persistent storage.`;
    }
  },

  /**
   * Open Expense Modal (Add or Edit Mode)
   */
  openExpenseModal(expenseId = null) {
    const modal = document.getElementById('expenseModal');
    const form = document.getElementById('expenseForm');
    const modalTitle = document.getElementById('expenseModalTitle');
    const submitBtn = document.getElementById('submitExpenseBtn');

    if (!modal || !form) return;

    this.clearFormErrors();
    this.state.editingExpenseId = expenseId;

    if (expenseId) {
      // Edit Mode
      const expense = this.state.expenses.find(e => e.id === expenseId);
      if (!expense) return;

      modalTitle.textContent = 'Edit Expense';
      submitBtn.textContent = 'Update Expense';

      document.getElementById('expenseTitle').value = expense.title || '';
      document.getElementById('expenseAmount').value = expense.amount || '';
      document.getElementById('expenseCategory').value = expense.category || '';
      document.getElementById('expenseDate').value = expense.date || ExpenseCalc.getTodayDateString();
      document.getElementById('expenseNotes').value = expense.notes || '';
    } else {
      // Add Mode
      modalTitle.textContent = 'Add New Expense';
      submitBtn.textContent = 'Save Expense';

      form.reset();
      document.getElementById('expenseDate').value = ExpenseCalc.getTodayDateString();
      document.getElementById('expenseCategory').value = '';
    }

    modal.classList.add('active');
    setTimeout(() => {
      const titleInput = document.getElementById('expenseTitle');
      if (titleInput) titleInput.focus();
    }, 100);
  },

  /**
   * Close Expense Modal
   */
  closeExpenseModal() {
    const modal = document.getElementById('expenseModal');
    if (modal) modal.classList.remove('active');
    this.state.editingExpenseId = null;
    this.clearFormErrors();
  },

  /**
   * Clear Form Validation Errors
   */
  clearFormErrors() {
    document.querySelectorAll('.form-group').forEach(group => {
      group.classList.remove('has-error');
      const errEl = group.querySelector('.form-error-msg');
      if (errEl) errEl.textContent = '';
    });
  },

  /**
   * Show Form Field Error
   */
  setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    const group = field.closest('.form-group');
    if (group) {
      group.classList.add('has-error');
      const errEl = group.querySelector('.form-error-msg');
      if (errEl) errEl.textContent = message;
    }
  },

  /**
   * Handle Expense Form Submission
   */
  handleExpenseSubmit(e) {
    e.preventDefault();
    this.clearFormErrors();

    const titleInput = document.getElementById('expenseTitle');
    const amountInput = document.getElementById('expenseAmount');
    const categoryInput = document.getElementById('expenseCategory');
    const dateInput = document.getElementById('expenseDate');
    const notesInput = document.getElementById('expenseNotes');

    const title = titleInput.value.trim();
    const amountVal = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;
    const notes = notesInput.value.trim();

    let hasError = false;

    // Validation: Title
    if (!title) {
      this.setFieldError('expenseTitle', 'Please enter an expense title.');
      hasError = true;
    }

    // Validation: Amount (> 0)
    if (isNaN(amountVal) || amountVal <= 0) {
      this.setFieldError('expenseAmount', 'Please enter an amount greater than zero.');
      hasError = true;
    }

    // Validation: Category
    if (!category) {
      this.setFieldError('expenseCategory', 'Please select an expense category.');
      hasError = true;
    }

    // Validation: Date
    if (!date) {
      this.setFieldError('expenseDate', 'Please select a valid date.');
      hasError = true;
    }

    if (hasError) return;

    if (this.state.editingExpenseId) {
      // Update existing expense
      const index = this.state.expenses.findIndex(e => e.id === this.state.editingExpenseId);
      if (index !== -1) {
        this.state.expenses[index] = {
          ...this.state.expenses[index],
          title,
          amount: Math.round(amountVal * 100) / 100,
          category,
          date,
          notes
        };
        StorageManager.saveExpenses(this.state.expenses);
        this.showToast('Expense updated successfully!', 'success');
      }
    } else {
      // Create new expense
      const newExpense = {
        id: 'exp_' + Date.now(),
        title,
        amount: Math.round(amountVal * 100) / 100,
        category,
        date,
        notes
      };
      this.state.expenses.unshift(newExpense);
      StorageManager.saveExpenses(this.state.expenses);
      this.showToast('Expense recorded successfully!', 'success');
    }

    this.closeExpenseModal();

    // Refresh UI & active view immediately
    this.renderDashboardView();
    this.renderTransactionsView();
    this.renderReportsView();
    this.renderSettingsView();
  },

  /**
   * Open Delete Confirmation Modal
   */
  openDeleteModal(expenseId) {
    const expense = this.state.expenses.find(e => e.id === expenseId);
    if (!expense) return;

    this.state.deletingExpenseId = expenseId;

    const modal = document.getElementById('deleteModal');
    const detailsContainer = document.getElementById('deleteExpenseDetails');
    const curr = this.state.settings.currency;

    if (detailsContainer) {
      detailsContainer.innerHTML = `
        <div class="delete-summary-pill">
          <strong>${this.escapeHTML(expense.title)}</strong>
          <span>${ExpenseCalc.formatCurrency(expense.amount, curr)} • ${ExpenseCalc.formatDateNice(expense.date)}</span>
        </div>
      `;
    }

    if (modal) modal.classList.add('active');
  },

  /**
   * Close Delete Modal
   */
  closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('active');
    this.state.deletingExpenseId = null;
  },

  /**
   * Execute Delete Expense
   */
  executeDeleteExpense() {
    const id = this.state.deletingExpenseId;
    if (!id) return;

    this.state.expenses = this.state.expenses.filter(e => e.id !== id);
    StorageManager.saveExpenses(this.state.expenses);

    this.closeDeleteModal();
    this.showToast('Expense deleted.', 'info');

    // Immediately update views and charts
    this.renderDashboardView();
    this.renderTransactionsView();
    this.renderReportsView();
    this.renderSettingsView();
  },

  /**
   * Open Clear All Confirmation Modal
   */
  openClearAllModal() {
    const modal = document.getElementById('clearAllModal');
    if (modal) modal.classList.add('active');
  },

  /**
   * Close Clear All Modal
   */
  closeClearAllModal() {
    const modal = document.getElementById('clearAllModal');
    if (modal) modal.classList.remove('active');
  },

  /**
   * Execute Clear All Data
   */
  executeClearAllData() {
    this.state.expenses = [];
    StorageManager.clearAllData();

    this.closeClearAllModal();
    this.showToast('All expense records have been wiped clean.', 'warning');

    this.renderDashboardView();
    this.renderTransactionsView();
    this.renderReportsView();
    this.renderSettingsView();
  },

  /**
   * Reset / Load Realistic Demo Data
   */
  handleResetSampleData() {
    const samples = StorageManager.resetToSampleData();
    this.state.expenses = samples;

    this.showToast('Realistic demo data restored!', 'success');

    this.renderDashboardView();
    this.renderTransactionsView();
    this.renderReportsView();
    this.renderSettingsView();
  },

  /**
   * Save Settings Display Name
   */
  handleSaveSettingsProfile(e) {
    e.preventDefault();
    const input = document.getElementById('settingsDisplayNameInput');
    if (!input) return;

    const newName = input.value.trim() || 'Rahul Sharma';
    this.state.settings.displayName = newName;
    StorageManager.saveSettings(this.state.settings);

    this.renderGlobalUser();
    this.showToast('Display name updated!', 'success');
  },

  /**
   * Handle Currency Change
   */
  handleCurrencyChange(newCurrency) {
    if (!CURRENCIES[newCurrency]) return;

    this.state.settings.currency = newCurrency;
    StorageManager.saveSettings(this.state.settings);

    this.showToast(`Preferred currency switched to ${CURRENCIES[newCurrency].name}.`, 'info');

    // Re-render everything to update currency symbols and charts
    this.renderDashboardView();
    this.renderTransactionsView();
    this.renderReportsView();
  },

  /**
   * Handle Theme Change (Light / Dark)
   */
  handleThemeChange(theme) {
    this.state.settings.theme = theme;
    StorageManager.saveSettings(this.state.settings);
    this.applyTheme(theme);

    // Refresh charts so their grid lines match theme
    ChartManager.refreshAll(
      this.state.expenses,
      ExpenseCalc.getExpensesForMonth(this.state.expenses, this.state.reportsSelectedMonth),
      this.state.settings.currency
    );

    this.showToast(`Theme switched to ${theme === 'dark' ? 'Dark' : 'Light'} Mode.`, 'info');
  },

  /**
   * Toast Notification Helper
   */
  showToast(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
      success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
      info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
      warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
      error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
    };

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.success}</div>
      <div class="toast-content">${this.escapeHTML(message)}</div>
      <button class="toast-close-btn" aria-label="Close notification">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    container.appendChild(toast);

    // Auto dismiss
    const dismiss = () => {
      toast.classList.add('hiding');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    };

    const timer = setTimeout(dismiss, duration);

    toast.querySelector('.toast-close-btn').addEventListener('click', () => {
      clearTimeout(timer);
      dismiss();
    });
  },

  /**
   * Escape HTML to prevent XSS
   */
  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};

// Initialize Application once DOM is fully ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
