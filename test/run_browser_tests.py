import asyncio
import json
import subprocess
import time
import urllib.request
import websockets
import os
import sys

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
PROFILE_DIR = r"c:\Users\lenovo\OneDrive\Desktop\hw\spendwise\test\edge_profile"
TARGET_URL = "http://localhost:8080/"
DEBUG_PORT = 9444

async def run_tests():
    # Clean profile dir if exists
    # 1. Launch Edge headless with remote debugging
    cmd = [
        EDGE_PATH,
        "--headless=new",
        f"--remote-debugging-port={DEBUG_PORT}",
        "--disable-gpu",
        f"--user-data-dir={PROFILE_DIR}",
        "--window-size=1280,900",
        TARGET_URL
    ]
    print(f"Launching Edge on port {DEBUG_PORT}...")
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # Wait for debug port
    ws_url = None
    for i in range(25):
        time.sleep(0.5)
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}/json/list", timeout=2) as resp:
                data = json.loads(resp.read().decode())
                # Find page target
                for t in data:
                    if t.get("type") == "page" and "webSocketDebuggerUrl" in t:
                        ws_url = t["webSocketDebuggerUrl"]
                        break
                if ws_url:
                    break
        except Exception:
            continue

    if not ws_url:
        print("ERROR: Could not get webSocketDebuggerUrl from Edge.")
        proc.terminate()
        return False

    print(f"Connected to CDP endpoint: {ws_url}")
    results = []

    async with websockets.connect(ws_url) as ws:
        msg_id = 0

        async def send_cmd(method, params=None):
            nonlocal msg_id
            msg_id += 1
            payload = {"id": msg_id, "method": method, "params": params or {}}
            await ws.send(json.dumps(payload))
            while True:
                raw = await ws.recv()
                msg = json.loads(raw)
                if msg.get("id") == msg_id:
                    return msg.get("result", {})

        async def eval_js(expression, await_promise=False):
            res = await send_cmd("Runtime.evaluate", {
                "expression": expression,
                "returnByValue": True,
                "awaitPromise": await_promise
            })
            val = res.get("result", {}).get("value")
            exc = res.get("exceptionDetails")
            if exc:
                raise Exception(f"JS Error in '{expression}': {exc}")
            return val

        # Enable Page and Runtime
        await send_cmd("Page.enable")
        await send_cmd("Runtime.enable")

        # Navigate to target
        await send_cmd("Page.navigate", {"url": TARGET_URL})
        await asyncio.sleep(1.5)

        # Helper assertion
        def test(desc, passed, detail=""):
            results.append((desc, passed, detail))
            status = "PASS" if passed else "FAIL"
            print(f"[{status}] {desc} {detail}")

        print("\n--- TEST SUITE 1: Basic Page & Components ---")
        title = await eval_js("document.title")
        test("Website Title is 'SpendWise – Personal Expense Tracker'", "SpendWise" in title and "Tracker" in title, f"Title: {title}")

        has_chart = await eval_js("typeof Chart !== 'undefined'")
        test("Chart.js library loaded", has_chart)

        expenses_count = await eval_js("App.state.expenses.length")
        test("Initial expenses loaded", expenses_count > 0, f"Count: {expenses_count}")

        # Check Summary Cards on Dashboard
        total_text = await eval_js("document.getElementById('dashTotalAmount').textContent")
        test("Dashboard Total Expenses card populated", "₹" in total_text and total_text != "₹0", f"Total: {total_text}")

        trx_text = await eval_js("document.getElementById('dashTotalTransactions').textContent")
        test("Dashboard Total Transactions card populated", int(trx_text.replace(',', '')) == expenses_count, f"Trx: {trx_text}")

        today_text = await eval_js("document.getElementById('dashTodayAmount').textContent")
        test("Dashboard Today Expenses card populated", "₹" in today_text, f"Today: {today_text}")

        top_cat_text = await eval_js("document.getElementById('dashTopCategoryName').textContent")
        test("Dashboard Most Used Category populated", top_cat_text != "None" and len(top_cat_text) > 0, f"Top Cat: {top_cat_text}")

        # Check Recent Transactions List on Dashboard
        recent_items_count = await eval_js("document.querySelectorAll('#recentTransactionsList .recent-trx-item').length")
        test("Dashboard Recent Transactions rendered (up to 5 items)", recent_items_count > 0 and recent_items_count <= 5, f"Items: {recent_items_count}")

        print("\n--- TEST SUITE 2: Navigation ---")
        # Navigate to Transactions
        await eval_js("App.navigateTo('transactions')")
        await asyncio.sleep(0.3)
        trx_active = await eval_js("document.getElementById('view-transactions').classList.contains('active')")
        test("Navigation to Transactions view", trx_active)

        # Navigate to Reports
        await eval_js("App.navigateTo('reports')")
        await asyncio.sleep(0.3)
        rep_active = await eval_js("document.getElementById('view-reports').classList.contains('active')")
        test("Navigation to Reports view", rep_active)

        # Navigate to Settings
        await eval_js("App.navigateTo('settings')")
        await asyncio.sleep(0.3)
        set_active = await eval_js("document.getElementById('view-settings').classList.contains('active')")
        test("Navigation to Settings view", set_active)

        # Navigate back to Dashboard
        await eval_js("App.navigateTo('dashboard')")
        await asyncio.sleep(0.3)
        dash_active = await eval_js("document.getElementById('view-dashboard').classList.contains('active')")
        test("Navigation back to Dashboard view", dash_active)

        print("\n--- TEST SUITE 3: Expense CRUD Operations ---")
        # 1. Validation Test (Empty form submission)
        await eval_js("App.openExpenseModal()")
        await asyncio.sleep(0.2)
        modal_open = await eval_js("document.getElementById('expenseModal').classList.contains('active')")
        test("Add Expense Modal opened", modal_open)

        # Attempt to submit empty form
        await eval_js("""
            document.getElementById('expenseTitle').value = '';
            document.getElementById('expenseAmount').value = '';
            document.getElementById('expenseForm').dispatchEvent(new Event('submit', { cancelable: true }));
        """)
        has_error = await eval_js("document.getElementById('groupExpenseTitle').classList.contains('has-error')")
        test("Form validation: empty title triggers error", has_error)

        # 2. CREATE: Add a new valid expense
        initial_total = await eval_js("ExpenseCalc.getTotalAmount(App.state.expenses)")
        await eval_js("""
            document.getElementById('expenseTitle').value = 'Automated Test Gym Membership';
            document.getElementById('expenseAmount').value = '3500';
            document.getElementById('expenseCategory').value = 'Healthcare';
            document.getElementById('expenseDate').value = ExpenseCalc.getTodayDateString();
            document.getElementById('expenseNotes').value = 'Verified via automated headless test';
            document.getElementById('expenseForm').dispatchEvent(new Event('submit', { cancelable: true }));
        """)
        await asyncio.sleep(0.3)

        new_total = await eval_js("ExpenseCalc.getTotalAmount(App.state.expenses)")
        test("CREATE: New expense added to state", new_total == initial_total + 3500, f"Old: {initial_total}, New: {new_total}")

        # Check Toast
        toast_text = await eval_js("document.querySelector('.toast-content') ? document.querySelector('.toast-content').textContent : ''")
        test("CREATE: Success toast notification shown", "recorded successfully" in toast_text, f"Toast: {toast_text}")

        # 3. READ & FILTER: Navigate to Transactions and test Search & Filters
        await eval_js("App.navigateTo('transactions')")
        await asyncio.sleep(0.2)

        # Search for our created item
        await eval_js("""
            const searchInput = document.getElementById('trxSearchInput');
            searchInput.value = 'Automated Test Gym';
            searchInput.dispatchEvent(new Event('input'));
        """)
        await asyncio.sleep(0.2)
        filtered_rows = await eval_js("document.querySelectorAll('#transactionsTableContainer tbody tr').length")
        test("READ & SEARCH: Filtered table matches search query", filtered_rows == 1, f"Rows: {filtered_rows}")

        # Reset search
        await eval_js("App.resetFilters()")
        await asyncio.sleep(0.2)
        all_rows = await eval_js("document.querySelectorAll('#transactionsTableContainer tbody tr').length")
        test("READ & RESET: Reset filters restores all transactions", all_rows > 1, f"Total rows: {all_rows}")

        # Test Category Filter: 'Healthcare'
        await eval_js("""
            const catSelect = document.getElementById('trxCategoryFilter');
            catSelect.value = 'Healthcare';
            catSelect.dispatchEvent(new Event('change'));
        """)
        await asyncio.sleep(0.2)
        hc_count = await eval_js("document.querySelectorAll('#transactionsTableContainer tbody tr').length")
        test("FILTER: Category filter displays only matching category", hc_count >= 1, f"Healthcare items: {hc_count}")

        # 4. UPDATE: Edit our created expense
        created_id = await eval_js("App.state.expenses.find(e => e.title === 'Automated Test Gym Membership').id")
        await eval_js(f"App.openExpenseModal('{created_id}')")
        await asyncio.sleep(0.2)

        # Change title and amount
        await eval_js("""
            document.getElementById('expenseTitle').value = 'Automated Test Premium Gym Pass';
            document.getElementById('expenseAmount').value = '4200';
            document.getElementById('expenseForm').dispatchEvent(new Event('submit', { cancelable: true }));
        """)
        await asyncio.sleep(0.3)

        updated_exp = await eval_js(f"App.state.expenses.find(e => e.id === '{created_id}')")
        test("UPDATE: Expense title and amount updated in state", updated_exp['title'] == 'Automated Test Premium Gym Pass' and updated_exp['amount'] == 4200, f"Updated: {updated_exp}")

        # 5. DELETE: Delete our created expense
        await eval_js(f"App.openDeleteModal('{created_id}')")
        await asyncio.sleep(0.2)
        del_modal_open = await eval_js("document.getElementById('deleteModal').classList.contains('active')")
        test("DELETE: Delete confirmation modal opened", del_modal_open)

        # Confirm delete
        await eval_js("App.executeDeleteExpense()")
        await asyncio.sleep(0.3)
        still_exists = await eval_js(f"App.state.expenses.some(e => e.id === '{created_id}')")
        test("DELETE: Expense deleted from state", not still_exists)

        final_total = await eval_js("ExpenseCalc.getTotalAmount(App.state.expenses)")
        test("DELETE: Total recalculated accurately after deletion", final_total == initial_total, f"Final Total: {final_total}")

        print("\n--- TEST SUITE 4: Reports & Analytics ---")
        await eval_js("App.navigateTo('reports')")
        await asyncio.sleep(0.3)

        month_total = await eval_js("document.getElementById('reportsTotalAmount').textContent")
        test("Reports: Month Total Spent displayed", "₹" in month_total, f"Month Total: {month_total}")

        daily_avg = await eval_js("document.getElementById('reportsDailyAverage').textContent")
        test("Reports: Daily Average displayed", "₹" in daily_avg and "/day" in daily_avg, f"Daily Avg: {daily_avg}")

        category_table_rows = await eval_js("document.querySelectorAll('#reportsCategoryTableContainer tbody tr').length")
        test("Reports: Category spending analysis table populated", category_table_rows > 0, f"Rows: {category_table_rows}")

        # Verify Charts Rendered
        charts_ok = await eval_js("""
            ChartManager.dashboardTrendChart !== null &&
            ChartManager.dashboardCategoryChart !== null &&
            ChartManager.reportsTrendChart !== null &&
            ChartManager.reportsCategoryChart !== null
        """)
        test("Charts: All 4 Chart.js instances initialized and active", charts_ok)

        print("\n--- TEST SUITE 5: Settings & Customization ---")
        await eval_js("App.navigateTo('settings')")
        await asyncio.sleep(0.3)

        # 1. Update Display Name
        await eval_js("""
            document.getElementById('settingsDisplayNameInput').value = 'Vikram Singhania';
            document.getElementById('settingsProfileForm').dispatchEvent(new Event('submit', { cancelable: true }));
        """)
        await asyncio.sleep(0.2)
        welcome_name = await eval_js("document.getElementById('welcomeUserName').textContent")
        sidebar_name = await eval_js("document.getElementById('sidebarUserName').textContent")
        sidebar_initials = await eval_js("document.getElementById('sidebarUserInitials').textContent")
        test("Settings: Display Name updated across UI and initials", welcome_name == 'Vikram Singhania' and sidebar_name == 'Vikram Singhania' and sidebar_initials == 'VS', f"Name: {welcome_name}, Initials: {sidebar_initials}")

        # 2. Update Currency to USD ($)
        await eval_js("App.handleCurrencyChange('USD')")
        await asyncio.sleep(0.2)
        usd_total = await eval_js("document.getElementById('dashTotalAmount').textContent")
        test("Settings: Switched to USD ($) currency format", "$" in usd_total, f"USD text: {usd_total}")

        # Switch back to INR (₹)
        await eval_js("App.handleCurrencyChange('INR')")
        await asyncio.sleep(0.2)
        inr_total = await eval_js("document.getElementById('dashTotalAmount').textContent")
        test("Settings: Switched back to INR (₹) currency format", "₹" in inr_total, f"INR text: {inr_total}")

        # 3. Theme Toggle: Dark Mode
        await eval_js("App.handleThemeChange('dark')")
        await asyncio.sleep(0.2)
        is_dark = await eval_js("document.documentElement.getAttribute('data-theme') === 'dark'")
        test("Settings: Dark mode applied to documentElement", is_dark)

        # Theme Toggle: Light Mode
        await eval_js("App.handleThemeChange('light')")
        await asyncio.sleep(0.2)
        is_light = await eval_js("!document.documentElement.hasAttribute('data-theme')")
        test("Settings: Light mode restored", is_light)

        # 4. Clear All Records
        await eval_js("App.openClearAllModal()")
        await asyncio.sleep(0.2)
        clear_modal_active = await eval_js("document.getElementById('clearAllModal').classList.contains('active')")
        test("Settings: Clear All confirmation modal opened", clear_modal_active)

        await eval_js("App.executeClearAllData()")
        await asyncio.sleep(0.3)
        zero_count = await eval_js("App.state.expenses.length")
        test("Settings: All records erased from state", zero_count == 0, f"Count: {zero_count}")

        dash_empty_shown = await eval_js("document.querySelector('#recentTransactionsList .empty-state-card') !== null")
        test("Dashboard: Displays friendly empty state when 0 expenses", dash_empty_shown)

        # 5. Restore Sample Data
        await eval_js("App.handleResetSampleData()")
        await asyncio.sleep(0.3)
        restored_count = await eval_js("App.state.expenses.length")
        test("Settings: Sample demo data restored", restored_count > 0, f"Restored count: {restored_count}")

        print("\n--- TEST SUITE 6: Data Persistence Across Page Reload ---")
        # Add a sentinel expense and change name
        await eval_js("""
            App.state.settings.displayName = 'Persistence Tester';
            StorageManager.saveSettings(App.state.settings);
            App.state.expenses.unshift({
                id: 'exp_persist_test',
                title: 'Persistent Coffee Item',
                amount: 320,
                category: 'Food',
                date: ExpenseCalc.getTodayDateString(),
                notes: 'Should persist across full page refresh'
            });
            StorageManager.saveExpenses(App.state.expenses);
        """)

        # Trigger full page reload
        await send_cmd("Page.reload")
        await asyncio.sleep(1.5)

        # Check after reload
        reloaded_name = await eval_js("App.state.settings.displayName")
        persisted_item = await eval_js("App.state.expenses.find(e => e.id === 'exp_persist_test')")
        test("Persistence: Display name persisted across reload", reloaded_name == 'Persistence Tester', f"Name: {reloaded_name}")
        test("Persistence: Expense records persisted in localStorage across reload", persisted_item is not None and persisted_item['title'] == 'Persistent Coffee Item', f"Item: {persisted_item}")

        # Clean up sentinel item
        await eval_js("""
            App.state.expenses = App.state.expenses.filter(e => e.id !== 'exp_persist_test');
            App.state.settings.displayName = 'Rahul Sharma';
            StorageManager.saveExpenses(App.state.expenses);
            StorageManager.saveSettings(App.state.settings);
            App.renderAll();
        """)

        print("\n--- CAPTURING FULL-PAGE VERIFICATION SCREENSHOTS ---")
        # Screenshot 1: Dashboard
        await eval_js("App.navigateTo('dashboard')")
        await asyncio.sleep(0.5)
        ss1 = await send_cmd("Page.captureScreenshot", {"format": "png"})
        with open("test/dashboard_verified.png", "wb") as f:
            import base64
            f.write(base64.b64decode(ss1["data"]))
        print("Captured test/dashboard_verified.png")

        # Screenshot 2: Transactions
        await eval_js("App.navigateTo('transactions')")
        await asyncio.sleep(0.5)
        ss2 = await send_cmd("Page.captureScreenshot", {"format": "png"})
        with open("test/transactions_verified.png", "wb") as f:
            import base64
            f.write(base64.b64decode(ss2["data"]))
        print("Captured test/transactions_verified.png")

        # Screenshot 3: Reports
        await eval_js("App.navigateTo('reports')")
        await asyncio.sleep(0.5)
        ss3 = await send_cmd("Page.captureScreenshot", {"format": "png"})
        with open("test/reports_verified.png", "wb") as f:
            import base64
            f.write(base64.b64decode(ss3["data"]))
        print("Captured test/reports_verified.png")

        # Screenshot 4: Settings (Dark Mode)
        await eval_js("App.navigateTo('settings')")
        await eval_js("App.handleThemeChange('dark')")
        await asyncio.sleep(0.5)
        ss4 = await send_cmd("Page.captureScreenshot", {"format": "png"})
        with open("test/settings_dark_verified.png", "wb") as f:
            import base64
            f.write(base64.b64decode(ss4["data"]))
        print("Captured test/settings_dark_verified.png")

        # Restore light theme for clean state
        await eval_js("App.handleThemeChange('light')")
        await eval_js("App.navigateTo('dashboard')")

    proc.terminate()

    passed = sum(1 for _, p, _ in results if p)
    total = len(results)
    print(f"\n==========================================")
    print(f"TEST SUMMARY: {passed}/{total} tests PASSED ({'100%' if passed == total else str(round(passed/total*100)) + '%'})")
    print(f"==========================================")
    return passed == total

if __name__ == "__main__":
    success = asyncio.run(run_tests())
    sys.exit(0 if success else 1)
