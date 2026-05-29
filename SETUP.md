# School Management System - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

---

## Backend Setup

### 1. Navigate to backend folder
```bash
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
The `.env` file is already configured for local SQLite database:

```env
PORT=3000
NODE_ENV=development
DB_MODE=local
LOCAL_DATABASE_URL=file:./database/school.db
ACCESS_TOKEN_SECRET=your-super-secret-jwt-key-change-this-in-production
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-this-in-production
FRONTEND_URL=http://localhost:5173
```

### 4. Database Setup
The database is already created and seeded with initial users.

If you need to reset the database:
```bash
# Push schema to database
npm run db:push

# Seed with initial users
npm run db:seed
```

### 5. Start Backend Server
```bash
npm run dev
```

Server will run on: `http://localhost:3000`

---

## Frontend Setup

### 1. Navigate to Client folder
```bash
cd Client
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
The `.env` file is already configured:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 4. Start Frontend Development Server
```bash
npm run dev
```

Frontend will run on: `http://localhost:5173`

---

## 🔐 Default Login Credentials

### Admin Account
- **Email:** `admin@school.af`
- **Password:** `admin123`
- **Role:** Admin (Full Access)

### Registrar Account
- **Email:** `registrar@school.af`
- **Password:** `registrar123`
- **Role:** Registrar (Limited Access)

---

## 📁 Project Structure

```
School Management System/
├── backend/
│   ├── database/           # SQLite database files
│   │   ├── school.db      # Main database (auto-generated)
│   │   └── seed.js        # Database seeding script
│   ├── src/
│   │   ├── configs/       # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   │   └── auth/      # Authentication controller
│   │   ├── db/            # Database schema and connection
│   │   ├── middlewares/   # Express middlewares
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Utility functions
│   │   └── validator/     # Request validators
│   ├── .env               # Environment variables
│   ├── app.js             # Express app configuration
│   └── server.js          # Server entry point
│
└── Client/
    ├── src/
    │   ├── components/    # React components
    │   │   ├── erp/      # ERP-specific components
    │   │   ├── layout/   # Layout components
    │   │   ├── print/    # Print templates
    │   │   └── ui/       # UI components
    │   ├── lib/          # Utility libraries
    │   │   └── api-client.js  # API client with error handling
    │   ├── routes/       # Page components
    │   │   └── login.jsx # Login page
    │   ├── services/     # API services
    │   │   └── auth.service.js  # Authentication service
    │   ├── store/        # Zustand state management
    │   └── App.jsx       # Main app component
    └── .env              # Environment variables
```

---

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new staff
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/verify` - Verify token
- `PATCH /api/v1/auth/change-password` - Change password

### Health Check
- `GET /health` - Server health status

---

## 🛠️ Development Commands

### Backend
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run db:push      # Push schema changes to database
npm run db:seed      # Seed database with initial data
npm run db:studio    # Open Drizzle Studio (database GUI)
npm run db:generate  # Generate migrations
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## 🔐 Authentication Flow

1. **Login:**
   - User enters email and password
   - Backend validates credentials
   - Returns access token (15min) and refresh token (7 days)
   - Tokens stored in localStorage

2. **Token Refresh:**
   - When access token expires, refresh token is used automatically
   - New tokens are returned in response headers
   - Frontend updates tokens seamlessly

3. **Logout:**
   - Clears all tokens from localStorage
   - Redirects to login page

---

## 🐛 Troubleshooting

### Backend Issues

**Database connection error:**
```bash
# Delete database and recreate
rm database/school.db
npm run db:push
npm run db:seed
```

**Port already in use:**
```bash
# Change PORT in .env file
PORT=3001
```

### Frontend Issues

**API connection error:**
- Ensure backend is running on port 3000
- Check VITE_API_URL in `.env`
- Check browser console for CORS errors

**Login not working:**
- Clear browser localStorage
- Check Network tab in DevTools
- Verify backend is running

---

## 📝 Features Implemented

### ✅ Authentication System
- Email + Password login
- JWT token-based authentication
- Automatic token refresh
- Role-based access control
- Change password functionality
- Secure password hashing (bcrypt)

### ✅ Backend
- Express.js REST API
- SQLite database (offline-first)
- Drizzle ORM
- Input validation
- Error handling
- CORS configuration
- Rate limiting
- Security middlewares

### ✅ Frontend
- React 19 with Vite
- Zustand state management
- TailwindCSS styling
- React Router v7
- Toast notifications (Sonner)
- Responsive design
- RTL support (Pashto)
- Protected routes

---

## 🔜 Next Steps

1. Implement CRUD operations for:
   - Students
   - Teachers
   - Classes
   - Subjects
   - Attendance
   - Exams
   - Expenses
   - Fee Payments

2. Add dashboard statistics
3. Implement reports generation
4. Add data export (CSV/Excel)
5. Implement print functionality

---

## 📞 Support

For issues or questions, please check:
- Backend logs in terminal
- Browser console (F12)
- Network tab in DevTools

---

## 🔒 Security Notes

- Change JWT secrets in production
- Use HTTPS in production
- Never commit `.env` file
- Database file is gitignored
- Passwords are hashed with bcrypt
- Input validation on all endpoints
- Rate limiting enabled
- CORS properly configured

---

## 📄 License

This project is for educational purposes.
