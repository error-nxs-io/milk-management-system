# 🥛 Milk Management System

A complete, full-stack **Dairy / Milk Management System** built with **Node.js + Express** and a beautiful responsive frontend.

![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![Express](https://img.shields.io/badge/Express-4.x-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

### 📊 Dashboard
- Real-time statistics overview
- Today's collection & delivery summary
- Total supplier & customer count

### 🚜 Supplier Management
- Add, edit, delete milk suppliers (dealers)
- Track milk type (Cow / Buffalo / Mixed)
- Set rate per litre

### 👥 Customer Management
- Add, edit, delete customers
- Track daily quantity & rate per litre

### 📥 Milk Collection
- Record daily milk collection from suppliers
- Track morning & evening shifts
- Record fat percentage
- Auto-calculate amount based on rate

### 🚚 Milk Delivery
- Record milk deliveries to customers
- Track quantity and shift
- Auto-calculate billing amount

### 💰 Payments
- Record payments to suppliers (outgoing)
- Record payments from customers (incoming)
- Multiple payment modes: Cash, UPI, Bank Transfer
- Add notes for reference

### 📈 Reports
- Monthly collection vs delivery chart
- Monthly summary table
- Net milk balance tracking

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/milk-management-system.git
cd milk-management-system

# Install dependencies
npm install

# Start the server
npm start
```

### Access the app
Open your browser and go to: **http://localhost:3000**

---

## 📁 Project Structure

```
milk-management-system/
├── server.js              # Express backend with REST API
├── package.json
├── README.md
├── .gitignore
├── data/                  # JSON file-based database
│   ├── suppliers.json
│   ├── customers.json
│   ├── collections.json
│   ├── deliveries.json
│   └── payments.json
└── public/                # Frontend
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Dashboard statistics |
| GET/POST | `/api/suppliers` | List / Create suppliers |
| PUT/DELETE | `/api/suppliers/:id` | Update / Delete supplier |
| GET/POST | `/api/customers` | List / Create customers |
| PUT/DELETE | `/api/customers/:id` | Update / Delete customer |
| GET/POST | `/api/collections` | List / Create milk collections |
| DELETE | `/api/collections/:id` | Delete collection |
| GET/POST | `/api/deliveries` | List / Create milk deliveries |
| DELETE | `/api/deliveries/:id` | Delete delivery |
| GET/POST | `/api/payments` | List / Create payments |
| DELETE | `/api/payments/:id` | Delete payment |
| GET | `/api/reports/monthly` | Monthly report data |

---

## 🛠 Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Database:** JSON file-based (no external DB required)
- **No frameworks** - Lightweight and fast!

---

## 📸 Screenshots

> Add screenshots here after running the app

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Support

If you find this useful, please ⭐ star this repository!
