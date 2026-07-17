// ============== API HELPER ==============
const API = '/api';

async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  return res.json();
}

// ============== TOAST ==============
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============== NAVIGATION ==============
function showPage(page) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  document.getElementById(`page-${page}`).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  
  const titles = {
    dashboard: '📊 Dashboard',
    suppliers: '🚜 Suppliers / Dealers',
    customers: '👥 Customers',
    collections: '📥 Milk Collection',
    deliveries: '🚚 Milk Delivery',
    payments: '💰 Payments',
    reports: '📈 Reports'
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  
  // Load data for each page
  switch(page) {
    case 'dashboard': loadDashboard(); break;
    case 'suppliers': loadSuppliers(); break;
    case 'customers': loadCustomers(); break;
    case 'collections': loadCollections(); loadSupplierFilters(); break;
    case 'deliveries': loadDeliveries(); loadCustomerFilters(); break;
    case 'payments': loadPayments(); break;
    case 'reports': loadReports(); break;
  }
  
  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ============== MODALS ==============
function openModal(id) {
  document.getElementById(id).classList.add('show');
  // Pre-fill date with today
  const dateInput = document.querySelector(`#${id} input[type="date"]`);
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  
  // Load supplier/customer selects
  if (id === 'collectionModal') loadSupplierSelect();
  if (id === 'deliveryModal') loadCustomerSelect();
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show');
  const form = document.querySelector(`#${id} form`);
  if (form) form.reset();
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('show');
    }
  });
});

// ============== DASHBOARD ==============
async function loadDashboard() {
  const stats = await api('/dashboard');
  
  document.getElementById('dashboardStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon blue">🚜</div>
      <div class="stat-info">
        <h3>${stats.totalSuppliers}</h3>
        <p>Total Suppliers</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon purple">👥</div>
      <div class="stat-info">
        <h3>${stats.totalCustomers}</h3>
        <p>Total Customers</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green">📥</div>
      <div class="stat-info">
        <h3>${stats.todayCollection} L</h3>
        <p>Today's Collection (${stats.todayCollectionCount} entries)</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon yellow">🚚</div>
      <div class="stat-info">
        <h3>${stats.todayDelivery} L</h3>
        <p>Today's Delivery (${stats.todayDeliveryCount} entries)</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon blue">📊</div>
      <div class="stat-info">
        <h3>${stats.totalMilkCollected} L</h3>
        <p>Total Milk Collected</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green">📦</div>
      <div class="stat-info">
        <h3>${stats.totalMilkDelivered} L</h3>
        <p>Total Milk Delivered</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon red">💰</div>
      <div class="stat-info">
        <h3>₹${stats.totalPayments}</h3>
        <p>Total Payments</p>
      </div>
    </div>
  `;

  // Today's collections
  const today = new Date().toISOString().split('T')[0];
  const collections = await api(`/collections?from=${today}&to=${today}`);
  const suppliers = await api('/suppliers');
  const supplierMap = {};
  suppliers.forEach(s => supplierMap[s.id] = s.name);

  if (collections.length === 0) {
    document.getElementById('todayCollectionsTable').innerHTML = '<div class="empty-state"><p>No collections today</p></div>';
  } else {
    let html = '<table><thead><tr><th>Supplier</th><th>Shift</th><th>Qty (L)</th><th>Fat</th></tr></thead><tbody>';
    collections.forEach(c => {
      html += `<tr><td>${supplierMap[c.supplierId] || 'Unknown'}</td><td>${c.shift || '-'}</td><td>${c.quantity} L</td><td>${c.fat || '-'}%</td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('todayCollectionsTable').innerHTML = html;
  }

  // Today's deliveries
  const deliveries = await api(`/deliveries?from=${today}&to=${today}`);
  const customers = await api('/customers');
  const customerMap = {};
  customers.forEach(c => customerMap[c.id] = c.name);

  if (deliveries.length === 0) {
    document.getElementById('todayDeliveriesTable').innerHTML = '<div class="empty-state"><p>No deliveries today</p></div>';
  } else {
    let html = '<table><thead><tr><th>Customer</th><th>Shift</th><th>Qty (L)</th><th>Amount</th></tr></thead><tbody>';
    deliveries.forEach(d => {
      const amount = d.rate ? (parseFloat(d.quantity) * parseFloat(d.rate)).toFixed(2) : '-';
      html += `<tr><td>${customerMap[d.customerId] || 'Unknown'}</td><td>${d.shift || '-'}</td><td>${d.quantity} L</td><td>₹${amount}</td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('todayDeliveriesTable').innerHTML = html;
  }
}

// ============== SUPPLIERS ==============
async function loadSuppliers() {
  const data = await api('/suppliers');
  
  if (data.length === 0) {
    document.getElementById('suppliersTable').innerHTML = `
      <div class="empty-state">
        <div class="icon">🚜</div>
        <h3>No Suppliers Yet</h3>
        <p>Add your first milk supplier to get started</p>
        <button class="btn btn-primary" onclick="openModal('supplierModal')">+ Add Supplier</button>
      </div>`;
    return;
  }

  let html = '<table><thead><tr><th>Name</th><th>Phone</th><th>Area</th><th>Milk Type</th><th>Rate (₹/L)</th><th>Actions</th></tr></thead><tbody>';
  data.forEach(s => {
    const typeBadge = s.milkType === 'cow' ? 'badge-success' : s.milkType === 'buffalo' ? 'badge-warning' : 'badge-info';
    html += `<tr>
      <td><strong>${s.name}</strong></td>
      <td>${s.phone || '-'}</td>
      <td>${s.area || '-'}</td>
      <td><span class="badge ${typeBadge}">${(s.milkType || 'cow').toUpperCase()}</span></td>
      <td>₹${s.rate || '-'}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteSupplier('${s.id}')">🗑 Delete</button></td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('suppliersTable').innerHTML = html;
}

async function saveSupplier(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  await api('/suppliers', 'POST', data);
  closeModal('supplierModal');
  form.reset();
  showToast('✅ Supplier added successfully!');
  loadSuppliers();
}

async function deleteSupplier(id) {
  if (!confirm('Are you sure you want to delete this supplier?')) return;
  await api(`/suppliers/${id}`, 'DELETE');
  showToast('🗑 Supplier deleted', 'info');
  loadSuppliers();
}

// ============== CUSTOMERS ==============
async function loadCustomers() {
  const data = await api('/customers');
  
  if (data.length === 0) {
    document.getElementById('customersTable').innerHTML = `
      <div class="empty-state">
        <div class="icon">👥</div>
        <h3>No Customers Yet</h3>
        <p>Add your first customer to start deliveries</p>
        <button class="btn btn-primary" onclick="openModal('customerModal')">+ Add Customer</button>
      </div>`;
    return;
  }

  let html = '<table><thead><tr><th>Name</th><th>Phone</th><th>Area</th><th>Daily Qty</th><th>Rate (₹/L)</th><th>Actions</th></tr></thead><tbody>';
  data.forEach(c => {
    html += `<tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.phone || '-'}</td>
      <td>${c.area || '-'}</td>
      <td>${c.dailyQty || '-'} L</td>
      <td>₹${c.rate || '-'}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteCustomer('${c.id}')">🗑 Delete</button></td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('customersTable').innerHTML = html;
}

async function saveCustomer(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  await api('/customers', 'POST', data);
  closeModal('customerModal');
  form.reset();
  showToast('✅ Customer added successfully!');
  loadCustomers();
}

async function deleteCustomer(id) {
  if (!confirm('Are you sure you want to delete this customer?')) return;
  await api(`/customers/${id}`, 'DELETE');
  showToast('🗑 Customer deleted', 'info');
  loadCustomers();
}

// ============== COLLECTIONS ==============
async function loadSupplierFilters() {
  const suppliers = await api('/suppliers');
  const options = suppliers.map(s => `<option value="${s.id}">${s.name} (${s.area || ''})</option>`).join('');
  document.getElementById('filterColSupplier').innerHTML = '<option value="">All Suppliers</option>' + options;
}

async function loadSupplierSelect() {
  const suppliers = await api('/suppliers');
  const options = suppliers.map(s => `<option value="${s.id}" data-rate="${s.rate || ''}">${s.name} - ${s.milkType || 'cow'} (₹${s.rate || '-'}/L)</option>`).join('');
  document.getElementById('colSupplierSelect').innerHTML = '<option value="">-- Select Supplier --</option>' + options;
  
  // Auto-fill rate on select change
  document.getElementById('colSupplierSelect').onchange = function() {
    const opt = this.options[this.selectedIndex];
    const rate = opt.dataset.rate;
    if (rate) {
      const rateInput = document.querySelector('#collectionForm input[name="rate"]');
      if (rateInput) rateInput.value = rate;
    }
  };
}

async function loadCollections() {
  const from = document.getElementById('filterColFrom').value;
  const to = document.getElementById('filterColTo').value;
  const supplierId = document.getElementById('filterColSupplier').value;
  
  let query = '?';
  if (from) query += `from=${from}&`;
  if (to) query += `to=${to}&`;
  if (supplierId) query += `supplierId=${supplierId}&`;
  
  const data = await api(`/collections${query}`);
  const suppliers = await api('/suppliers');
  const supplierMap = {};
  suppliers.forEach(s => supplierMap[s.id] = s.name);

  if (data.length === 0) {
    document.getElementById('collectionsTable').innerHTML = `
      <div class="empty-state">
        <div class="icon">📥</div>
        <h3>No Collections Found</h3>
        <p>Start recording milk collection from suppliers</p>
      </div>`;
    return;
  }

  let html = '<table><thead><tr><th>Date</th><th>Supplier</th><th>Shift</th><th>Qty (L)</th><th>Fat %</th><th>Rate (₹/L)</th><th>Total (₹)</th><th>Actions</th></tr></thead><tbody>';
  data.forEach(c => {
    const total = c.rate ? (parseFloat(c.quantity) * parseFloat(c.rate)).toFixed(2) : '-';
    html += `<tr>
      <td>${c.date}</td>
      <td><strong>${supplierMap[c.supplierId] || 'Unknown'}</strong></td>
      <td><span class="badge ${c.shift === 'morning' ? 'badge-warning' : 'badge-info'}">${c.shift || '-'}</span></td>
      <td>${c.quantity} L</td>
      <td>${c.fat || '-'}%</td>
      <td>₹${c.rate || '-'}</td>
      <td><strong>₹${total}</strong></td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteCollection('${c.id}')">🗑</button></td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('collectionsTable').innerHTML = html;
}

async function saveCollection(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  await api('/collections', 'POST', data);
  closeModal('collectionModal');
  form.reset();
  showToast('✅ Milk collection recorded!');
  loadCollections();
}

async function deleteCollection(id) {
  if (!confirm('Delete this collection record?')) return;
  await api(`/collections/${id}`, 'DELETE');
  showToast('🗑 Record deleted', 'info');
  loadCollections();
}

// ============== DELIVERIES ==============
async function loadCustomerFilters() {
  const customers = await api('/customers');
  const options = customers.map(c => `<option value="${c.id}">${c.name} (${c.area || ''})</option>`).join('');
  document.getElementById('filterDelCustomer').innerHTML = '<option value="">All Customers</option>' + options;
}

async function loadCustomerSelect() {
  const customers = await api('/customers');
  const options = customers.map(c => `<option value="${c.id}" data-rate="${c.rate || ''}">${c.name} - ${c.area || ''} (₹${c.rate || '-'}/L)</option>`).join('');
  document.getElementById('delCustomerSelect').innerHTML = '<option value="">-- Select Customer --</option>' + options;
  
  document.getElementById('delCustomerSelect').onchange = function() {
    const opt = this.options[this.selectedIndex];
    const rate = opt.dataset.rate;
    if (rate) {
      const rateInput = document.querySelector('#deliveryForm input[name="rate"]');
      if (rateInput) rateInput.value = rate;
    }
  };
}

async function loadDeliveries() {
  const from = document.getElementById('filterDelFrom').value;
  const to = document.getElementById('filterDelTo').value;
  const customerId = document.getElementById('filterDelCustomer').value;
  
  let query = '?';
  if (from) query += `from=${from}&`;
  if (to) query += `to=${to}&`;
  if (customerId) query += `customerId=${customerId}&`;
  
  const data = await api(`/deliveries${query}`);
  const customers = await api('/customers');
  const customerMap = {};
  customers.forEach(c => customerMap[c.id] = c.name);

  if (data.length === 0) {
    document.getElementById('deliveriesTable').innerHTML = `
      <div class="empty-state">
        <div class="icon">🚚</div>
        <h3>No Deliveries Found</h3>
        <p>Start recording milk deliveries to customers</p>
      </div>`;
    return;
  }

  let html = '<table><thead><tr><th>Date</th><th>Customer</th><th>Shift</th><th>Qty (L)</th><th>Rate (₹/L)</th><th>Total (₹)</th><th>Actions</th></tr></thead><tbody>';
  data.forEach(d => {
    const total = d.rate ? (parseFloat(d.quantity) * parseFloat(d.rate)).toFixed(2) : '-';
    html += `<tr>
      <td>${d.date}</td>
      <td><strong>${customerMap[d.customerId] || 'Unknown'}</strong></td>
      <td><span class="badge ${d.shift === 'morning' ? 'badge-warning' : 'badge-info'}">${d.shift || '-'}</span></td>
      <td>${d.quantity} L</td>
      <td>₹${d.rate || '-'}</td>
      <td><strong>₹${total}</strong></td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteDelivery('${d.id}')">🗑</button></td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('deliveriesTable').innerHTML = html;
}

async function saveDelivery(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  await api('/deliveries', 'POST', data);
  closeModal('deliveryModal');
  form.reset();
  showToast('✅ Milk delivery recorded!');
  loadDeliveries();
}

async function deleteDelivery(id) {
  if (!confirm('Delete this delivery record?')) return;
  await api(`/deliveries/${id}`, 'DELETE');
  showToast('🗑 Record deleted', 'info');
  loadDeliveries();
}

// ============== PAYMENTS ==============
async function updatePayPersonSelect() {
  const type = document.getElementById('payTypeSelect').value;
  const select = document.getElementById('payPersonSelect');
  
  if (!type) {
    select.innerHTML = '<option value="">-- Select Type first --</option>';
    return;
  }
  
  const data = type === 'supplier' ? await api('/suppliers') : await api('/customers');
  const options = data.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  select.innerHTML = `<option value="">-- Select ${type === 'supplier' ? 'Supplier' : 'Customer'} --</option>` + options;
}

async function loadPayments() {
  const data = await api('/payments');
  const suppliers = await api('/suppliers');
  const customers = await api('/customers');
  
  const personMap = {};
  suppliers.forEach(s => personMap[s.id] = s.name);
  customers.forEach(c => personMap[c.id] = c.name);

  if (data.length === 0) {
    document.getElementById('paymentsTable').innerHTML = `
      <div class="empty-state">
        <div class="icon">💰</div>
        <h3>No Payments Yet</h3>
        <p>Record payments to suppliers or from customers</p>
      </div>`;
    return;
  }

  let html = '<table><thead><tr><th>Date</th><th>Type</th><th>Person</th><th>Amount</th><th>Mode</th><th>Note</th><th>Actions</th></tr></thead><tbody>';
  data.sort((a, b) => b.date.localeCompare(a.date)).forEach(p => {
    const typeBadge = p.type === 'supplier' ? 'badge-danger' : 'badge-success';
    const typeLabel = p.type === 'supplier' ? 'Paid (Supplier)' : 'Received (Customer)';
    html += `<tr>
      <td>${p.date}</td>
      <td><span class="badge ${typeBadge}">${typeLabel}</span></td>
      <td><strong>${personMap[p.personId] || 'Unknown'}</strong></td>
      <td><strong>₹${p.amount}</strong></td>
      <td>${p.mode || 'cash'}</td>
      <td>${p.note || '-'}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deletePayment('${p.id}')">🗑</button></td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('paymentsTable').innerHTML = html;
}

async function savePayment(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  await api('/payments', 'POST', data);
  closeModal('paymentModal');
  form.reset();
  showToast('✅ Payment recorded!');
  loadPayments();
}

async function deletePayment(id) {
  if (!confirm('Delete this payment record?')) return;
  await api(`/payments/${id}`, 'DELETE');
  showToast('🗑 Payment deleted', 'info');
  loadPayments();
}

// ============== REPORTS ==============
async function loadReports() {
  const data = await api('/reports/monthly');
  
  // Table
  if (data.length === 0) {
    document.getElementById('reportsTable').innerHTML = '<div class="empty-state"><p>No data for reports yet. Start adding collections and deliveries!</p></div>';
    document.getElementById('chartArea').innerHTML = '<div class="empty-state"><p>No data to show chart</p></div>';
    return;
  }

  let html = '<table><thead><tr><th>Month</th><th>Collected (L)</th><th>Delivered (L)</th><th>Net (L)</th><th>Payments (₹)</th></tr></thead><tbody>';
  data.forEach(r => {
    const net = (parseFloat(r.collected) - parseFloat(r.delivered)).toFixed(2);
    html += `<tr>
      <td><strong>${r.month}</strong></td>
      <td>${r.collected} L</td>
      <td>${r.delivered} L</td>
      <td><strong>${net} L</strong></td>
      <td>₹${r.payments}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('reportsTable').innerHTML = html;

  // Simple bar chart
  const maxVal = Math.max(...data.map(d => Math.max(parseFloat(d.collected), parseFloat(d.delivered))), 1);
  const chartHeight = 260;
  const barWidth = 50;
  const groupWidth = 130;
  
  let chartHTML = '';
  data.forEach((d, i) => {
    const x = i * groupWidth + 20;
    const hCollected = (parseFloat(d.collected) / maxVal) * chartHeight;
    const hDelivered = (parseFloat(d.delivered) / maxVal) * chartHeight;
    
    chartHTML += `
      <div class="chart-bar collected" style="left:${x}px;height:${hCollected}px;width:${barWidth * 0.45}px;" title="Collected: ${d.collected}L"></div>
      <div class="chart-bar delivered" style="left:${x + barWidth * 0.5}px;height:${hDelivered}px;width:${barWidth * 0.45}px;" title="Delivered: ${d.delivered}L"></div>
      <div class="chart-label" style="left:${x - 10}px;">${d.month}</div>
    `;
  });
  
  document.getElementById('chartArea').innerHTML = chartHTML;
  document.getElementById('chartArea').style.width = `${data.length * groupWidth + 40}px`;
}

// ============== INIT ==============
function init() {
  // Set date in top bar
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('dateDisplay').textContent = now.toLocaleDateString('en-IN', options);
  
  // Load dashboard
  loadDashboard();
}

init();
