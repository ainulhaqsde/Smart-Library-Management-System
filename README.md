# 📚 Smart Library Management System

### Modern Full-Stack Library Operations Platform

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?logo=jsonwebtokens)
![Vercel](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)
![Status](https://img.shields.io/badge/Status-Development-yellow)

**Smart Library Management System** is a full-stack library operations platform designed to simplify book management, student accounts, borrowing, returns, overdue tracking, fines, and everyday library administration.

It combines **role-based authentication, real-time book availability, student self-borrowing, automated return processing, server-side fine calculation, inventory management, and responsive dashboards** into one modern library management platform.

> **Smarter Library Management. Simple, Secure & Efficient.**

---

## 🚀 Live Demo

### 🌐 Application

`Coming Soon`

### ⚙️ Backend API

`Coming Soon`

---

## ✨ Features

- 🔐 Admin & Student Authentication
- 🛡️ Role-Based Access Control
- 👨‍💼 Admin Dashboard
- 🎓 Student Dashboard
- 📚 Complete Book Catalog
- 🔎 Book Search
- ➕ Admin Book Management
- 👥 Student Account Management
- 📖 Student Self-Borrowing
- ↗️ Admin Book Issue
- ↩️ Student & Admin Book Return
- ⏱️ Automatic 7-Day Due Date
- 💰 ₹10/Day Overdue Fine
- 🚫 Duplicate Borrow Prevention
- 🚫 Duplicate Return Prevention
- 📊 Real-Time Availability Tracking
- 🗂️ Category Management
- 💳 Fine History & Payment Status
- 🔑 Forgot Password
- 📧 Email-Based Password Recovery
- 🔒 JWT Authentication
- 🗃️ MongoDB Atlas Persistence
- 🌙 Light & Dark Mode
- 📱 Responsive User Interface
- ☁️ Production-Ready Architecture

---

## 🧠 What is Smart Library Management System?

Traditional library management can become difficult when book inventory, student records, borrowing, returns, and overdue fines are maintained separately.

**Smart Library Management System** provides one centralized platform for managing these operations.

The system helps libraries manage:

- Available books
- Total inventory
- Student accounts
- Active borrowings
- Book returns
- Due dates
- Overdue books
- Fine calculations
- Fine payments
- Categories
- Library statistics

---

## 🔄 How It Works

```text
                    SMART LIBRARY
                          │
               ┌──────────┴──────────┐
               │                     │
             ADMIN                STUDENT
               │                     │
       Manage Library          Browse Books
               │                     │
       Issue / Return              Borrow
               │                     │
               └──────────┬──────────┘
                          ↓
                  Express REST API
                          ↓
                    MongoDB Atlas
                          ↓
               Borrowing Management
                          ↓
              Due Date + Fine System
                          ↓
                  Library Dashboard
```

### Student Borrowing Flow

```text
Student Login
      ↓
Browse Books
      ↓
Select Available Book
      ↓
Borrow
      ↓
Backend Validates Request
      ↓
Available Copies - 1
      ↓
7-Day Due Date Created
      ↓
My Borrowings
      ↓
Return Book
      ↓
Fine Calculated if Overdue
      ↓
Available Copies + 1
```

---

# 👨‍💼 Admin Dashboard

Administrators can manage the complete library system.

The dashboard can display:

- 📚 Total Copies
- 📖 Available Books
- ↗️ Active Loans
- ⚠️ Overdue Books
- 👥 Students
- 💰 Outstanding Fines
- ✅ Paid Fines
- 🗂️ Total Book Titles
- 🕒 Recent Circulation

---

# 🎓 Student Dashboard

Students receive their own restricted library workspace.

Students can:

- 📚 Browse books
- 🔎 Search the catalog
- 📖 Borrow available books
- ↩️ Return borrowed books
- 🕒 Check due dates
- ⚠️ View overdue books
- 💰 View fines
- 📜 View borrowing history
- 👤 Manage their profile

Students cannot access administrator management features.

---

# 📚 Book Management

Administrators can manage the library catalog.

Each book can contain:

```text
Title
Author
Category
ISBN
Description
Cover Image
Publisher
Publication Year
Language
Total Copies
Available Copies
Shelf Location
Status
```

The system automatically tracks available inventory when books are borrowed or returned.

---

# 🔄 Borrow & Return Management

The platform supports both **Admin Issue** and **Student Self-Borrowing**.

### Admin Flow

```text
Admin
  ↓
Select Student
  ↓
Select Available Book
  ↓
Issue Book
  ↓
Borrowing Created
```

### Student Flow

```text
Student
  ↓
Browse Books
  ↓
Borrow
  ↓
My Borrowings
  ↓
Return
```

Important protections include:

- Available-copy validation
- Active-student validation
- Duplicate borrowing prevention
- Duplicate return prevention
- Server-side inventory updates
- MongoDB transactions

---

# ⏱️ Due Date & Fine System

Every borrowing receives a **7-day borrowing period**.

If the book is returned after its due date:

```text
Overdue Fine = Number of Overdue Days × ₹10
```

Example:

```text
Due Date
   ↓
3 Days Late
   ↓
3 × ₹10
   ↓
₹30 Fine
```

Fine calculations are performed by the backend rather than trusted to the browser.

---

# 🛠️ Technology Stack

## 💻 Frontend

- 🌐 HTML5
- 🎨 CSS3
- 🟨 JavaScript
- 🔗 Fetch API
- 📱 Responsive Web Design

## ⚙️ Backend

- 🟢 Node.js
- 🚂 Express.js
- 🔗 REST API
- 🔐 JWT Authentication
- 🔒 bcrypt
- 🗂️ Mongoose

## 🗃️ Database

- 🍃 MongoDB
- ☁️ MongoDB Atlas

## 🔒 Security

- 🛡️ Helmet
- 🌐 CORS
- 🔐 JWT
- 🔒 bcrypt
- 🔑 Environment Variables
- 👮 Role-Based Middleware

## ☁️ Deployment

- 💻 GitHub — Source Code
- ▲ Vercel — Deployment
- 🍃 MongoDB Atlas — Cloud Database

---

# 📂 Project Structure

```text
Smart-Library-Management-System/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Book.js
│   │   ├── Borrow.js
│   │   ├── Category.js
│   │   ├── Fine.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── books.js
│   │   ├── borrows.js
│   │   ├── categories.js
│   │   ├── dashboard.js
│   │   ├── fines.js
│   │   └── users.js
│   ├── scripts/
│   │   └── createAdmin.js
│   └── server.js
│
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── index.html
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

---

# 🔐 Authentication

The application includes:

- Student Registration
- Admin & Student Login
- Logout
- JWT Authentication
- Protected APIs
- Role-Based Authorization
- Forgot Password
- Password Reset
- Secure Password Hashing

### Password Reset Flow

```text
User enters registered email
        ↓
Backend verifies account
        ↓
Secure reset token generated
        ↓
Reset email sent
        ↓
User opens reset link
        ↓
New password submitted
        ↓
Password securely hashed
        ↓
User can login using new password
```

---

# 🔒 Security

Important security practices include:

- 🔐 JWT-based authentication
- 🔒 bcrypt password hashing
- 🛡️ Helmet security headers
- 🌐 Controlled CORS
- 👮 Role-based authorization
- 🔑 Environment-based secrets
- 🚫 `.env` excluded from Git
- 🗃️ MongoDB credentials stored server-side
- 🚫 Duplicate ISBN protection
- 🚫 Duplicate active borrowing protection
- 🔄 Transaction-based inventory updates

Sensitive values such as:

```text
MONGO_URI
JWT_SECRET
ADMIN_PASSWORD
SMTP_USER
SMTP_PASS
```

must never be committed to GitHub.

---

# ⚙️ Installation & Local Development

## 1️⃣ Clone Repository

```bash
git clone https://github.com/ainulhaqsde/Smart-Library-Management-System.git
```

```bash
cd Smart-Library-Management-System
```

## 2️⃣ Install Dependencies

```bash
npm install
```

## 3️⃣ Configure Environment

Create:

```text
.env
```

using:

```text
.env.example
```

as the template.

## 4️⃣ Create Admin

```bash
npm run seed:admin
```

## 5️⃣ Start Application

```bash
npm run dev
```

Local application:

```text
http://localhost:5000
```

---

# 🌐 Production Deployment

```text
                 SMART LIBRARY
                       │
                 GitHub Repository
                       │
                     Vercel
                       │
              Node.js + Express API
                       │
                  MongoDB Atlas
```

Production environment variables should be configured through the hosting platform rather than committed to GitHub.

---

# 🧪 Project Testing

Before production launch:

- [x] Admin Login
- [x] Student Login
- [x] Student Registration
- [x] JWT Authentication
- [x] Role-Based Navigation
- [x] Book Management
- [x] Student Management
- [x] Book Search
- [x] Admin Book Issue
- [x] Student Self-Borrow
- [x] Admin Book Return
- [x] Student Book Return
- [x] Duplicate Borrow Protection
- [x] Duplicate Return Protection
- [x] Availability Updates
- [x] Due-Date Generation
- [x] Fine Calculation
- [x] Fine History
- [x] Category Management
- [x] Light Mode
- [x] Dark Mode
- [x] Responsive Interface
- [ ] Production Deployment
- [ ] Production Password Reset Verification

---

# 📱 Responsive Design

The interface is designed for:

- 🖥️ Desktop
- 💻 Laptop
- 📱 Tablet
- 📲 Mobile

Responsive behavior covers:

- Authentication
- Dashboard
- Navigation
- Book catalog
- Student management
- Borrowings
- Fines
- Categories
- Profile
- Modal forms
- Data tables

---

# 🔮 Future Improvements

Potential future features include:

- 📷 Student profile image uploads
- 📕 Book cover uploads
- 🔍 Advanced catalog filtering
- 📊 Advanced analytics
- 🔔 Due-date notifications
- 📧 Automated overdue emails
- 📱 PWA support
- 📷 ISBN/barcode scanning
- 📤 Report export
- 📄 PDF reports
- 🧪 Automated testing
- 📡 Production monitoring
- 🔄 CI/CD improvements

---

# 🎯 Project Goal

The goal of the **Smart Library Management System** is to transform traditional library operations into a secure and efficient digital workflow.

```text
Library Collection
       ↓
Digital Catalog
       ↓
Student / Admin Access
       ↓
Borrow & Return Management
       ↓
Inventory Tracking
       ↓
Due Dates & Fine Management
       ↓
Smart Library Operations
```

### Manage → Borrow → Track → Return

---

# 📌 Project Details

**Project Name:** `Smart Library Management System`

**GitHub Repository:** `Smart-Library-Management-System`

**Architecture:** `Full Stack`

**Frontend:** `HTML + CSS + JavaScript`

**Backend:** `Node.js + Express`

**Database:** `MongoDB Atlas`

**Authentication:** `JWT`

**Status:** `Development`

---

# 🔗 Important Links

### 💻 GitHub Repository

https://github.com/ainulhaqsde/Smart-Library-Management-System

### 🌐 Live Application

`Coming Soon`

---

# 👨‍💻 Developer

**Developed by Ainul Haq**

```text
Frontend
   +
Backend
   +
MongoDB Atlas
   +
Authentication
   +
Cloud Deployment
   ↓
📚 SMART LIBRARY MANAGEMENT SYSTEM
```

---

# 📜 Copyright

```text
© 2026 Smart Library Management System. All Rights Reserved.
```

---

# ⭐ Support

If you find the **Smart Library Management System** useful, consider giving the GitHub repository a ⭐.

Feedback, suggestions, and contributions are welcome.

---

# 📚 Smart Library Management System

### Modern Full-Stack Library Operations Platform

> **Smarter Library Management. Simple, Secure & Efficient.**

### Manage → Borrow → Track → Return

**Developed by Ainul Haq**
