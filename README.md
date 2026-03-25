# 💸 Real-Time Expense Tracker

A modern full-stack web application that allows users to track, manage, and analyze expenses in real-time with an interactive dashboard and data visualizations.

---

## 🚀 Key Highlights

* ⚡ Real-time expense tracking (instant UI updates)
* 📊 Interactive analytics dashboard (Chart.js)
* 🧠 Category-wise spending insights
* 📅 Monthly expense trends
* 🎯 Clean, modern, and responsive UI
* 🔄 Dynamic updates without page reload

---

## 🧱 Tech Stack

### Frontend

* HTML5
* CSS3 (Responsive + Modern UI)
* JavaScript (Vanilla JS + Fetch API)

### Backend

* Python (Flask)
* Flask-CORS

### Database

* MongoDB (NoSQL)
* PyMongo

### Visualization

* Chart.js

---

## 📸 Screenshots

> Add screenshots here to showcase your UI

* Dashboard
* Expense List
* Analytics Charts

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Dakshanreddym/Real-Time-Expense.git
cd Real-Time-Expense
```

---

### 2️⃣ Backend Setup

```bash
cd backend
python -m venv .venv
```

#### Activate Virtual Environment

**Windows (PowerShell):**

```bash
.venv\Scripts\activate
```

**Windows (CMD):**

```bash
.venv\Scripts\activate.bat
```

---

#### Install Dependencies

```bash
pip install -r requirements.txt
```

---

#### Run Server

```bash
python app.py
```

---

### 3️⃣ Frontend Setup

Open:

```bash
frontend/index.html
```

Or use Live Server in VS Code.

---

## 🌐 API Endpoints

| Method | Endpoint          | Description          |
| ------ | ----------------- | -------------------- |
| POST   | /add              | Add new expense      |
| GET    | /expenses         | Fetch all expenses   |
| DELETE | /delete/<id>      | Delete expense       |
| GET    | /category-summary | Category-wise totals |
| GET    | /monthly-summary  | Monthly analytics    |

---

## 📊 Features Breakdown

### 💰 Expense Management

* Add expenses with category, amount, date
* Delete expenses instantly
* View structured list of transactions

---

### 📈 Analytics Dashboard

* Pie chart → Category-wise distribution
* Bar chart → Monthly spending trends
* Real-time updates on data change

---

## 🧠 Why MongoDB?

* Flexible schema for dynamic expense data
* Easy to extend (add tags, notes, receipts)
* Efficient aggregation for analytics

---

## ⚡ Future Enhancements

* 🔐 Authentication (Login/Signup with JWT)
* 🌙 Dark mode
* 📤 Export reports (CSV/PDF)
* 🧾 Receipt scanning (OCR)
* 🤖 AI-based spending insights

---

## 🧑‍💻 Author

**Dakshan Reddy**
GitHub: https://github.com/Dakshanreddym

---

## ⭐ Support

If you found this project useful:

* ⭐ Star the repo
* 🍴 Fork it
* 🚀 Share it

---

## 📌 Status

🚧 Actively improving and adding features
