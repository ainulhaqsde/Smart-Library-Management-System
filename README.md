# Smart Library Management System

Production-oriented full-stack library operations application built with HTML, CSS, JavaScript, Node.js, Express, MongoDB Atlas, and JWT authentication.

## Features

- Admin and Student role-based access
- Secure login, registration, and password recovery
- Book catalog with copies, availability, metadata, cover URL, shelf, and status
- Student account management and activation controls
- Admin-controlled book issue and return workflow
- Server-side 7-day due date and ₹10/day overdue fine calculation
- Fine payment history
- Categories, dashboards, search, responsive tables, and premium light/dark UI
- MongoDB transactions for issue/return copy consistency
- Helmet, CORS, environment-based secrets, and centralized API errors

## Local Setup

1. Install Node.js 20+ and create a MongoDB Atlas database.
2. Copy `.env.example` to `.env` and replace all placeholder credentials.
3. Run `npm install`.
4. Run `npm run seed:admin` once to create/update the admin account.
5. Run `npm run dev` and open `http://localhost:5000`.

## Environment

`MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` are required for initial setup.

Configure SMTP variables to enable real password-reset email.

Never commit `.env`.

## Production Architecture

Recommended:

GitHub repository → Web host/deployment platform → Node/Express service → MongoDB Atlas

Set `APP_URL` and `CLIENT_URL` to your production origin and:

`NODE_ENV=production`

The current Express server is a traditional long-running Node service.

If Vercel is used for the frontend only, deploy the Express API on a Node host such as Render/Railway and configure the frontend/API origin accordingly.

If you want a single Vercel deployment, refactor the API entry point for Vercel serverless functions before production deployment.

## API Groups

- `/api/auth` — Authentication and recovery
- `/api/books` — Catalog management
- `/api/users` — Student management/profile
- `/api/borrowings` — Issue/return/history
- `/api/fines` — Fine history/payment
- `/api/categories` — Category management
- `/api/dashboard/stats` — Role-specific dashboard statistics
- `/api/health` — Health check

## Production Checklist

- Use a strong JWT secret
- Use an Atlas least-privilege database user
- Configure Atlas network rules
- Enable HTTPS
- Configure production SMTP
- Restrict the CORS origin
- Use a strong admin password
- Configure database backups and monitoring
- Test role isolation
- Test duplicate ISBN and Student IDs
- Test concurrent issue/return operations
- Test due-date boundary cases
- Test password-reset expiry
- Test mobile layouts before launch