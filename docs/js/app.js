// Milk Management System - Client-Side Application
// Uses localStorage for data persistence

// ============ DATA LAYER ============
const DB = {
    get(key) {
        try {
            return JSON.parse(localStorage.getItem('milk_' + key)) || [];
        } catch { return []; }
    },
    set(key, data) {
        localStorage.setItem('milk_' + key, JSON.stringify(data));
    },
    nextId(key) {
        const items = this.get(key);
        return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
    }
};

// ============ UTILITIES ============
function today() {
    return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function monthStart() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

function monthName() {
    return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function flash(message, type = 'success') {
    const container = document.getElementById('flashContainer');
    const el = document.createElement('div');
    el.className = 'flash ' + type;
    el.textContent = message;
    container.prepend(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 4000);
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ============ NAVIGATION ============
let currentBillingCustomerId = null;

function navigateTo(page, subpage) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Update nav
    document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));

    const pageId = 'page-' + page;
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Set nav active
    const navLink = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (navLink) navLink.classList.add('active');

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');

    // Render page data
    switch (page) {
        case 'dashboard': renderDashboard(); break;
        case 'customers': renderCustomerList(); break;
        case 'entries':
            document.getElementById('entryDateFilter').value = today();
            renderEntries();
            break;
        case 'billing': renderBilling(); break;
        case 'reports': renderReports(); break;
    }
}

// Nav link clicks
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.page);
        });
    });

    // Set today's date
    const dashDate = document.getElementById('dashDate');
    if (dashDate) {
        const d = new Date();
        dashDate.textContent = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' — Overview of today\'s activity';
    }

    // Initial render
    navigateTo('dashboard');
});

// ============ DASHBOARD ============
function renderDashboard() {
    const customers = DB.get('customers');
    const entries = DB.get('entries');
    const payments = DB.get('payments');
    const t = today();
    const ms = monthStart();

    const todayEntries = entries.filter(e => e.date === t);
    const todayCollection = todayEntries.reduce((s, e) => s + e.quantity_liters, 0);
    const todayRevenue = todayEntries.reduce((s, e) => s + e.total_amount, 0);

    // Total pending
    let totalPending = 0;
    customers.forEach(c => {
        const billed = entries.filter(e => e.customer_id === c.id).reduce((s, e) => s + e.total_amount, 0);
        const paid = payments.filter(p => p.customer_id === c.id).reduce((s, p) => s + p.amount, 0);
        const pend = billed - paid;
        if (pend > 0) totalPending += pend;
    });

    const monthEntries = entries.filter(e => e.date >= ms && e.date <= t);
    const monthCollection = monthEntries.reduce((s, e) => s + e.quantity_liters, 0);

    document.getElementById('dashStats').innerHTML = `
        <div class="stat-card blue">
            <div class="stat-icon">👥</div>
            <div class="stat-value">${customers.length}</div>
            <div class="stat-label">Total Customers</div>
        </div>
        <div class="stat-card green">
            <div class="stat-icon">🥛</div>
            <div class="stat-value">${todayCollection.toFixed(1)} L</div>
            <div class="stat-label">Today's Collection</div>
        </div>
        <div class="stat-card orange">
            <div class="stat-icon">💵</div>
            <div class="stat-value">₹${todayRevenue.toFixed(0)}</div>
            <div class="stat-label">Today's Revenue</div>
        </div>
        <div class="stat-card red">
            <div class="stat-icon">⏳</div>
            <div class="stat-value">₹${totalPending.toFixed(0)}</div>
            <div class="stat-label">Total Pending</div>
        </div>
    `;

    // Monthly collection card
    const monthCard = `
        <div class="card" style="margin-bottom:24px;">
            <div class="card-title">📦 Monthly Collection: ${monthCollection.toFixed(1)} Liters</div>
            <p style="color:var(--text-muted);">${monthName()}</p>
        </div>
    `;
    // Insert before today's entries card
    const entriesCard = document.querySelector('#page-dashboard .card');
    if (entriesCard && !document.querySelector('#page-dashboard .month-card-inserted')) {
        entriesCard.insertAdjacentHTML('beforebegin', monthCard);
    }

    // Today's entries table
    const container = document.getElementById('todayEntries');
    if (todayEntries.length === 0) {
        container.innerHTML = '<div class="empty-state">No entries for today yet.</div>';
    } else {
        let html = '<div class="table-responsive"><table><thead><tr><th>Customer</th><th>Shift</th><th>Quantity (L)</th><th>Rate (₹/L)</th><th>Amount (₹)</th></tr></thead><tbody>';
        todayEntries.forEach(e => {
            const cust = customers.find(c => c.id === e.customer_id);
            html += `<tr>
                <td>${cust ? cust.name : 'Unknown'}</td>
                <td><span class="badge badge-${e.shift}">${e.shift.charAt(0).toUpperCase() + e.shift.slice(1)}</span></td>
                <td>${e.quantity_liters}</td>
                <td>₹${e.rate_per_liter}</td>
                <td>₹${e.total_amount}</td>
            </tr>`;
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;
    }
}

// ============ CUSTOMERS ============
function renderCustomerList() {
    const customers = DB.get('customers');
    const search = (document.getElementById('searchCustomer')?.value || '').toLowerCase();
    const filtered = customers.filter(c => c.name.toLowerCase().includes(search) || (c.phone || '').includes(search));
    const container = document.getElementById('customerListContainer');

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">No customers found. Add your first customer!</div>';
        return;
    }

    let html = '<div class="table-responsive"><table><thead><tr><th>#</th><th>Name</th><th>Phone</th><th>Address</th><th>Rate (₹/L)</th><th>Actions</th></tr></thead><tbody>';
    filtered.forEach((c, i) => {
        html += `<tr>
            <td>${i + 1}</td>
            <td><strong>${c.name}</strong></td>
            <td>${c.phone || '-'}</td>
            <td>${c.address || '-'}</td>
            <td>₹${c.rate_per_liter}</td>
            <td><div class="action-btns">
                <button class="btn btn-primary btn-sm" onclick="editCustomer(${c.id})">✏️ Edit</button>
                <button class="btn btn-success btn-sm" onclick="viewCustomerBilling(${c.id})">💰 Bill</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCustomer(${c.id})">🗑️ Delete</button>
            </div></td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function showAddCustomerForm() {
    document.getElementById('custFormTitle').textContent = '➕ Add New Customer';
    document.getElementById('custEditId').value = '';
    document.getElementById('customerForm').reset();
    document.getElementById('custRate').value = '60';

    // Show form page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-customer-form').classList.add('active');
}

function editCustomer(id) {
    const customers = DB.get('customers');
    const c = customers.find(x => x.id === id);
    if (!c) return;

    document.getElementById('custFormTitle').textContent = '✏️ Edit Customer';
    document.getElementById('custEditId').value = id;
    document.getElementById('custName').value = c.name;
    document.getElementById('custPhone').value = c.phone || '';
    document.getElementById('custAddress').value = c.address || '';
    document.getElementById('custRate').value = c.rate_per_liter;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-customer-form').classList.add('active');
}

function saveCustomer(e) {
    e.preventDefault();
    const customers = DB.get('customers');
    const editId = document.getElementById('custEditId').value;

    const data = {
        name: document.getElementById('custName').value.trim(),
        phone: document.getElementById('custPhone').value.trim(),
        address: document.getElementById('custAddress').value.trim(),
        rate_per_liter: parseFloat(document.getElementById('custRate').value)
    };

    if (editId) {
        const idx = customers.findIndex(c => c.id === parseInt(editId));
        if (idx >= 0) {
            customers[idx] = { ...customers[idx], ...data };
            DB.set('customers', customers);
            flash('Customer updated successfully!');
        }
    } else {
        data.id = DB.nextId('customers');
        data.created_at = new Date().toISOString();
        customers.push(data);
        DB.set('customers', customers);
        flash('Customer added successfully!');
    }

    navigateTo('customers');
}

function deleteCustomer(id) {
    if (!confirm('Are you sure you want to delete this customer? All their entries will also be deleted.')) return;

    let customers = DB.get('customers');
    let entries = DB.get('entries');
    let payments = DB.get('payments');

    customers = customers.filter(c => c.id !== id);
    entries = entries.filter(e => e.customer_id !== id);
    payments = payments.filter(p => p.customer_id !== id);

    DB.set('customers', customers);
    DB.set('entries', entries);
    DB.set('payments', payments);

    flash('Customer deleted successfully!');
    renderCustomerList();
}

// ============ ENTRIES ============
function renderEntries() {
    const filterDate = document.getElementById('entryDateFilter').value || today();
    const entries = DB.get('entries');
    const customers = DB.get('customers');

    const morningEntries = entries.filter(e => e.date === filterDate && e.shift === 'morning');
    const eveningEntries = entries.filter(e => e.date === filterDate && e.shift === 'evening');

    const container = document.getElementById('entriesContainer');

    function renderShiftTable(title, icon, items) {
        if (items.length === 0) {
            return `<div class="card"><div class="card-title">${icon} ${title}</div><div class="empty-state">No ${title.toLowerCase()} entries</div></div>`;
        }
        let html = `<div class="card"><div class="card-title">${icon} ${title}</div><div class="table-responsive"><table><thead><tr><th>Customer</th><th>Qty (L)</th><th>Rate</th><th>Amount</th></tr></thead><tbody>`;
        items.forEach(e => {
            const cust = customers.find(c => c.id === e.customer_id);
            html += `<tr><td>${cust ? cust.name : 'Unknown'}</td><td>${e.quantity_liters}</td><td>₹${e.rate_per_liter}</td><td>₹${e.total_amount}</td></tr>`;
        });
        html += '</tbody></table></div></div>';
        return html;
    }

    container.innerHTML = renderShiftTable('Morning Shift', '🌅', morningEntries) + renderShiftTable('Evening Shift', '🌆', eveningEntries);
}

function showAddEntryForm() {
    const customers = DB.get('customers');
    const select = document.getElementById('entryCustomer');
    select.innerHTML = '<option value="">-- Select Customer --</option>';
    customers.forEach(c => {
        select.innerHTML += `<option value="${c.id}" data-rate="${c.rate_per_liter}">${c.name} (₹${c.rate_per_liter}/L)</option>`;
    });

    document.getElementById('entryDate').value = today();
    document.getElementById('entryQty').value = '';
    document.getElementById('entryRate').value = '60';
    document.getElementById('entryTotal').value = '';
    document.getElementById('entryShift').value = 'morning';

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-entry-form').classList.add('active');
}

function updateEntryRate() {
    const select = document.getElementById('entryCustomer');
    const selected = select.options[select.selectedIndex];
    const rate = selected.getAttribute('data-rate');
    if (rate) {
        document.getElementById('entryRate').value = rate;
        updateEntryTotal();
    }
}

function updateEntryTotal() {
    const qty = parseFloat(document.getElementById('entryQty').value) || 0;
    const rate = parseFloat(document.getElementById('entryRate').value) || 0;
    document.getElementById('entryTotal').value = '₹' + (qty * rate).toFixed(2);
}

function saveEntry(e) {
    e.preventDefault();
    const entries = DB.get('entries');

    const qty = parseFloat(document.getElementById('entryQty').value);
    const rate = parseFloat(document.getElementById('entryRate').value);

    entries.push({
        id: DB.nextId('entries'),
        customer_id: parseInt(document.getElementById('entryCustomer').value),
        date: document.getElementById('entryDate').value,
        quantity_liters: qty,
        rate_per_liter: rate,
        total_amount: qty * rate,
        shift: document.getElementById('entryShift').value,
        created_at: new Date().toISOString()
    });

    DB.set('entries', entries);
    flash('Milk entry added successfully!');
    navigateTo('entries');
}

// ============ BILLING ============
function renderBilling() {
    const customers = DB.get('customers');
    const entries = DB.get('entries');
    const payments = DB.get('payments');
    const container = document.getElementById('billingContainer');

    if (customers.length === 0) {
        container.innerHTML = '<div class="empty-state">No billing data available.</div>';
        return;
    }

    let html = '<div class="table-responsive"><table><thead><tr><th>#</th><th>Customer</th><th>Total Billed (₹)</th><th>Total Paid (₹)</th><th>Pending (₹)</th><th>Status</th><th>Actions</th></tr></thead><tbody>';

    customers.forEach((c, i) => {
        const billed = entries.filter(e => e.customer_id === c.id).reduce((s, e) => s + e.total_amount, 0);
        const paid = payments.filter(p => p.customer_id === c.id).reduce((s, p) => s + p.amount, 0);
        const pending = billed - paid;

        html += `<tr>
            <td>${i + 1}</td>
            <td><strong>${c.name}</strong></td>
            <td>₹${billed.toFixed(0)}</td>
            <td>₹${paid.toFixed(0)}</td>
            <td>₹${pending.toFixed(0)}</td>
            <td>${pending <= 0 ? '<span class="badge badge-success">✅ Cleared</span>' : '<span class="badge badge-danger">⏳ Pending</span>'}</td>
            <td><button class="btn btn-primary btn-sm" onclick="viewCustomerBilling(${c.id})">View Details</button></td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function viewCustomerBilling(id) {
    currentBillingCustomerId = id;
    const customers = DB.get('customers');
    const entries = DB.get('entries');
    const payments = DB.get('payments');

    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    document.getElementById('custBillTitle').textContent = `💰 ${customer.name} — Billing Details`;
    document.getElementById('custBillSubtitle').textContent = `Phone: ${customer.phone || 'N/A'} | Rate: ₹${customer.rate_per_liter}/L`;

    const custEntries = entries.filter(e => e.customer_id === id).sort((a, b) => b.date.localeCompare(a.date));
    const custPayments = payments.filter(p => p.customer_id === id).sort((a, b) => b.date.localeCompare(a.date));

    const totalBilled = custEntries.reduce((s, e) => s + e.total_amount, 0);
    const totalPaid = custPayments.reduce((s, p) => s + p.amount, 0);
    const pending = totalBilled - totalPaid;

    document.getElementById('custBillStats').innerHTML = `
        <div class="stat-card blue">
            <div class="stat-value">₹${totalBilled.toFixed(0)}</div>
            <div class="stat-label">Total Billed</div>
        </div>
        <div class="stat-card green">
            <div class="stat-value">₹${totalPaid.toFixed(0)}</div>
            <div class="stat-label">Total Paid</div>
        </div>
        <div class="stat-card red">
            <div class="stat-value">₹${pending.toFixed(0)}</div>
            <div class="stat-label">Pending Amount</div>
        </div>
    `;

    let detailsHtml = '<div class="card"><div class="card-title">📝 Milk Entries</div>';
    if (custEntries.length === 0) {
        detailsHtml += '<div class="empty-state">No entries yet</div>';
    } else {
        detailsHtml += '<div class="table-responsive"><table><thead><tr><th>Date</th><th>Shift</th><th>Qty (L)</th><th>Amount (₹)</th></tr></thead><tbody>';
        custEntries.forEach(e => {
            detailsHtml += `<tr><td>${formatDate(e.date)}</td><td><span class="badge badge-${e.shift}">${e.shift.charAt(0).toUpperCase() + e.shift.slice(1)}</span></td><td>${e.quantity_liters}</td><td>₹${e.total_amount}</td></tr>`;
        });
        detailsHtml += '</tbody></table></div>';
    }
    detailsHtml += '</div>';

    detailsHtml += '<div class="card"><div class="card-title">💳 Payment History</div>';
    if (custPayments.length === 0) {
        detailsHtml += '<div class="empty-state">No payments yet</div>';
    } else {
        detailsHtml += '<div class="table-responsive"><table><thead><tr><th>Date</th><th>Amount (₹)</th><th>Method</th><th>Note</th></tr></thead><tbody>';
        custPayments.forEach(p => {
            detailsHtml += `<tr><td>${formatDate(p.date)}</td><td>₹${p.amount}</td><td>${p.method.charAt(0).toUpperCase() + p.method.slice(1)}</td><td>${p.note || '-'}</td></tr>`;
        });
        detailsHtml += '</tbody></table></div>';
    }
    detailsHtml += '</div>';

    document.getElementById('custBillDetails').innerHTML = detailsHtml;

    // Show page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-customer-billing').classList.add('active');
}

function savePayment(e) {
    e.preventDefault();
    if (!currentBillingCustomerId) return;

    const payments = DB.get('payments');
    payments.push({
        id: DB.nextId('payments'),
        customer_id: currentBillingCustomerId,
        amount: parseFloat(document.getElementById('payAmount').value),
        method: document.getElementById('payMethod').value,
        note: document.getElementById('payNote').value.trim(),
        date: today(),
        created_at: new Date().toISOString()
    });

    DB.set('payments', payments);
    flash('Payment recorded successfully!');
    document.getElementById('payAmount').value = '';
    document.getElementById('payNote').value = '';
    viewCustomerBilling(currentBillingCustomerId);
}

// ============ REPORTS ============
function renderReports() {
    const entries = DB.get('entries');
    const ms = monthStart();
    const t = today();

    document.getElementById('reportSubtitle').textContent = `${monthName()} — Daily collection summary`;

    // Group by date
    const dailyMap = {};
    entries.filter(e => e.date >= ms && e.date <= t).forEach(e => {
        if (!dailyMap[e.date]) dailyMap[e.date] = { qty: 0, amt: 0 };
        dailyMap[e.date].qty += e.quantity_liters;
        dailyMap[e.date].amt += e.total_amount;
    });

    const dailyData = Object.entries(dailyMap).sort((a, b) => a[0].localeCompare(b[0]));
    const totalQty = dailyData.reduce((s, d) => s + d[1].qty, 0);
    const totalAmt = dailyData.reduce((s, d) => s + d[1].amt, 0);

    document.getElementById('reportStats').innerHTML = `
        <div class="stat-card green">
            <div class="stat-value">${totalQty.toFixed(1)} L</div>
            <div class="stat-label">Total Collection (This Month)</div>
        </div>
        <div class="stat-card orange">
            <div class="stat-value">₹${totalAmt.toFixed(0)}</div>
            <div class="stat-label">Total Revenue (This Month)</div>
        </div>
    `;

    const container = document.getElementById('reportTable');
    if (dailyData.length === 0) {
        container.innerHTML = '<div class="empty-state">No data for this month yet.</div>';
        return;
    }

    let html = '<div class="table-responsive"><table><thead><tr><th>Date</th><th>Collection (Liters)</th><th>Revenue (₹)</th></tr></thead><tbody>';
    dailyData.forEach(([date, data]) => {
        html += `<tr><td>${formatDate(date)}</td><td>${data.qty.toFixed(1)} L</td><td>₹${data.amt.toFixed(0)}</td></tr>`;
    });
    html += `<tr class="total-row"><td>TOTAL</td><td>${totalQty.toFixed(1)} L</td><td>₹${totalAmt.toFixed(0)}</td></tr>`;
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ============ IMPORT / EXPORT ============
function exportData() {
    const data = {
        customers: DB.get('customers'),
        entries: DB.get('entries'),
        payments: DB.get('payments'),
        exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `milk-management-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash('Data exported successfully!');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.customers) DB.set('customers', data.customers);
            if (data.entries) DB.set('entries', data.entries);
            if (data.payments) DB.set('payments', data.payments);
            flash('Data imported successfully!');
            navigateTo('dashboard');
        } catch (err) {
            flash('Error importing data: Invalid file format', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}
