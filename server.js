const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============== JSON FILE DATABASE ==============
const DB_PATH = path.join(__dirname, 'data');

function ensureDB() {
  if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH, { recursive: true });
  
  const files = ['suppliers.json', 'customers.json', 'collections.json', 'deliveries.json', 'payments.json'];
  files.forEach(f => {
    const p = path.join(DB_PATH, f);
    if (!fs.existsSync(p)) fs.writeFileSync(p, '[]', 'utf8');
  });
}

function readDB(file) {
  ensureDB();
  const p = path.join(DB_PATH, file);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeDB(file, data) {
  ensureDB();
  const p = path.join(DB_PATH, file);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ============== API ROUTES ==============

// --- SUPPLIERS ---
app.get('/api/suppliers', (req, res) => {
  res.json(readDB('suppliers.json'));
});

app.post('/api/suppliers', (req, res) => {
  const data = readDB('suppliers.json');
  const supplier = { id: genId(), ...req.body, createdAt: new Date().toISOString() };
  data.push(supplier);
  writeDB('suppliers.json', data);
  res.status(201).json(supplier);
});

app.put('/api/suppliers/:id', (req, res) => {
  const data = readDB('suppliers.json');
  const idx = data.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Supplier not found' });
  data[idx] = { ...data[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeDB('suppliers.json', data);
  res.json(data[idx]);
});

app.delete('/api/suppliers/:id', (req, res) => {
  let data = readDB('suppliers.json');
  data = data.filter(s => s.id !== req.params.id);
  writeDB('suppliers.json', data);
  res.json({ message: 'Deleted' });
});

// --- CUSTOMERS ---
app.get('/api/customers', (req, res) => {
  res.json(readDB('customers.json'));
});

app.post('/api/customers', (req, res) => {
  const data = readDB('customers.json');
  const customer = { id: genId(), ...req.body, createdAt: new Date().toISOString() };
  data.push(customer);
  writeDB('customers.json', data);
  res.status(201).json(customer);
});

app.put('/api/customers/:id', (req, res) => {
  const data = readDB('customers.json');
  const idx = data.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Customer not found' });
  data[idx] = { ...data[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeDB('customers.json', data);
  res.json(data[idx]);
});

app.delete('/api/customers/:id', (req, res) => {
  let data = readDB('customers.json');
  data = data.filter(c => c.id !== req.params.id);
  writeDB('customers.json', data);
  res.json({ message: 'Deleted' });
});

// --- MILK COLLECTION (from suppliers) ---
app.get('/api/collections', (req, res) => {
  const data = readDB('collections.json');
  const { from, to, supplierId } = req.query;
  let filtered = data;
  if (from) filtered = filtered.filter(c => c.date >= from);
  if (to) filtered = filtered.filter(c => c.date <= to);
  if (supplierId) filtered = filtered.filter(c => c.supplierId === supplierId);
  res.json(filtered);
});

app.post('/api/collections', (req, res) => {
  const data = readDB('collections.json');
  const collection = { id: genId(), ...req.body, createdAt: new Date().toISOString() };
  data.push(collection);
  writeDB('collections.json', data);
  res.status(201).json(collection);
});

app.delete('/api/collections/:id', (req, res) => {
  let data = readDB('collections.json');
  data = data.filter(c => c.id !== req.params.id);
  writeDB('collections.json', data);
  res.json({ message: 'Deleted' });
});

// --- DELIVERIES (to customers) ---
app.get('/api/deliveries', (req, res) => {
  const data = readDB('deliveries.json');
  const { from, to, customerId } = req.query;
  let filtered = data;
  if (from) filtered = filtered.filter(d => d.date >= from);
  if (to) filtered = filtered.filter(d => d.date <= to);
  if (customerId) filtered = filtered.filter(d => d.customerId === customerId);
  res.json(filtered);
});

app.post('/api/deliveries', (req, res) => {
  const data = readDB('deliveries.json');
  const delivery = { id: genId(), ...req.body, createdAt: new Date().toISOString() };
  data.push(delivery);
  writeDB('deliveries.json', data);
  res.status(201).json(delivery);
});

app.delete('/api/deliveries/:id', (req, res) => {
  let data = readDB('deliveries.json');
  data = data.filter(d => d.id !== req.params.id);
  writeDB('deliveries.json', data);
  res.json({ message: 'Deleted' });
});

// --- PAYMENTS ---
app.get('/api/payments', (req, res) => {
  const data = readDB('payments.json');
  res.json(data);
});

app.post('/api/payments', (req, res) => {
  const data = readDB('payments.json');
  const payment = { id: genId(), ...req.body, createdAt: new Date().toISOString() };
  data.push(payment);
  writeDB('payments.json', data);
  res.status(201).json(payment);
});

app.delete('/api/payments/:id', (req, res) => {
  let data = readDB('payments.json');
  data = data.filter(p => p.id !== req.params.id);
  writeDB('payments.json', data);
  res.json({ message: 'Deleted' });
});

// --- DASHBOARD STATS ---
app.get('/api/dashboard', (req, res) => {
  const suppliers = readDB('suppliers.json');
  const customers = readDB('customers.json');
  const collections = readDB('collections.json');
  const deliveries = readDB('deliveries.json');
  const payments = readDB('payments.json');

  const today = new Date().toISOString().split('T')[0];
  
  const todayCollections = collections.filter(c => c.date === today);
  const todayDeliveries = deliveries.filter(d => d.date === today);
  
  const totalMilkCollected = collections.reduce((sum, c) => sum + (parseFloat(c.quantity) || 0), 0);
  const totalMilkDelivered = deliveries.reduce((sum, d) => sum + (parseFloat(d.quantity) || 0), 0);
  const totalPayments = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  res.json({
    totalSuppliers: suppliers.length,
    totalCustomers: customers.length,
    todayCollection: todayCollections.reduce((s, c) => s + (parseFloat(c.quantity) || 0), 0),
    todayDelivery: todayDeliveries.reduce((s, d) => s + (parseFloat(d.quantity) || 0), 0),
    totalMilkCollected: totalMilkCollected.toFixed(2),
    totalMilkDelivered: totalMilkDelivered.toFixed(2),
    totalPayments: totalPayments.toFixed(2),
    todayCollectionCount: todayCollections.length,
    todayDeliveryCount: todayDeliveries.length
  });
});

// --- REPORTS ---
app.get('/api/reports/monthly', (req, res) => {
  const collections = readDB('collections.json');
  const deliveries = readDB('deliveries.json');
  const payments = readDB('payments.json');

  const monthlyData = {};

  collections.forEach(c => {
    const month = c.date.substring(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { collected: 0, delivered: 0, payments: 0 };
    monthlyData[month].collected += parseFloat(c.quantity) || 0;
  });

  deliveries.forEach(d => {
    const month = d.date.substring(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { collected: 0, delivered: 0, payments: 0 };
    monthlyData[month].delivered += parseFloat(d.quantity) || 0;
  });

  payments.forEach(p => {
    const month = p.date.substring(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { collected: 0, delivered: 0, payments: 0 };
    monthlyData[month].payments += parseFloat(p.amount) || 0;
  });

  const result = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      collected: data.collected.toFixed(2),
      delivered: data.delivered.toFixed(2),
      payments: data.payments.toFixed(2)
    }));

  res.json(result);
});

// Serve index.html for all non-API routes
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🥛 Milk Management System running at http://localhost:${PORT}\n`);
});
