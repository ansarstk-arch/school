# School Management System (ERP)

A comprehensive offline-first school management system built with React (frontend) and Node.js + Express (backend).

## 🚀 Features

- **Authentication System**: Email + Password based authentication with JWT
- **Multi-Enrollment**: Students can enroll in School, Center, and/or Madrasa
- **Staff Management**: Role-based access control (Admin, Registrar, Teacher, Accountant)
- **Student Management**: Complete student records with attendance and grades
- **Teacher Management**: Teacher profiles with subjects and schedules
- **Class Management**: Classes with sections and supervisors
- **Attendance Tracking**: Daily attendance for all students
- **Exam Management**: Create exams and record results
- **Fee Management**: Track student fee payments
- **Expense Tracking**: Record and categorize expenses
- **Reports & Analytics**: Generate various reports
- **Print Features**: ID Cards, Certificates, Fee Receipts, Result Cards

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn

## 🛠️ Installation

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (already created):
```env
PORT=3000
NODE_ENV=development
DB_MODE=local
LOCAL_DATABASE_URL=file:./database/school.db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=http://localhost:5173
```

4. Create database and run migrations:
```bash
npm run db:push
```

5. Seed database with initial users:
```bash
npm run db:seed
```

6. Start backend server:
```bash
npm run dev
```

Backend will run on: `http://localhost:3000`

### Frontend Setup

1. Navigate to Client folder:
```bash
cd Client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (already created):
```env
VITE_API_URL=http://localhost:3000/api/v1
```

4. Start frontend development server:
```bash
npm run dev
```

Frontend will run on: `http://localhost:5173`

## 🔐 Default Login Credentials

### Admin Account
- **Email**: `admin@school.af`
- **Password**: `admin123`
- **Role**: Admin (Full Access)

### Registrar Account
- **Email**: `registrar@school.af`
- **Password**: `registrar123`
- **Role**: Registrar (Limited Access)

## 📁 Project Structure

```
.
├── backend/
│   ├── database/           # SQLite database files
│   ├── drizzle/           # Database migrations
│   ├── logs/              # Application logs
│   ├── src/
│   │   ├── configs/       # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── db/            # Database schema and connection
│   │   ├── middlewares/   # Express middlewares
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Utility functions
│   │   └── validator/     # Request validators
│   ├── app.js             # Express app setup
│   └── server.js          # Server entry point
│
└── Client/
    ├── src/
    │   ├── components/    # React components
    │   ├── lib/           # Utility libraries
    │   ├── routes/        # Page components
    │   ├── services/      # API services
    │   ├── store/         # Zustand state management
    │   └── App.jsx        # Main app component
    └── index.html
```

## 🔧 Available Scripts

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run db:generate` - Generate database migrations
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:seed` - Seed database with initial data

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🗄️ Database

The system uses SQLite for offline-first functionality. The database file is located at:
```
backend/database/school.db
```

### Database Tables
- `staff` - System users with role-based permissions
- `teachers` - Teaching staff
- `students` - Student records
- `studentEnrollments` - Multi-enrollment tracking
- `parents` - Parent accounts
- `classes` - Class definitions
- `subjects` - Subject catalog
- `attendance` - Daily attendance
- `exams` - Exam definitions
- `examResults` - Student exam scores
- `expenses` - Expense tracking
- `feePayments` - Fee payment records

## 🔐 Authentication Flow

1. User enters email and password
2. Backend validates credentials
3. JWT tokens (access + refresh) are generated
4. Tokens stored in localStorage
5. Access token sent with each API request
6. Refresh token used to get new access token when expired

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new staff
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/verify` - Verify token
- `PATCH /api/v1/auth/change-password` - Change password

### Coming Soon
- Students CRUD
- Teachers CRUD
- Classes CRUD
- Attendance
- Exams
- Fees
- Expenses
- Reports

## 🎨 UI Features

- **RTL Support**: Full Pashto language support
- **Dark Mode**: Toggle between light and dark themes
- **Responsive**: Works on desktop, tablet, and mobile
- **Print Support**: Print ID cards, certificates, receipts
- **Shamsi Calendar**: Afghan Solar Calendar support
- **Advanced Filtering**: Filter data by multiple criteria

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Token rotation on refresh
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- HPP (HTTP Parameter Pollution) protection
- Input validation with express-validator
- SQL injection protection (Drizzle ORM)

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3000 is available
- Verify `.env` file exists and is configured correctly
- Run `npm install` to ensure all dependencies are installed

### Frontend can't connect to backend
- Ensure backend is running on port 3000
- Check `VITE_API_URL` in frontend `.env` file
- Verify CORS settings in backend

### Database errors
- Delete `backend/database/school.db` and run `npm run db:push` again
- Run `npm run db:seed` to recreate initial users

### Login not working
- Clear browser localStorage
- Check browser console for errors
- Verify backend is running and accessible

## 📝 License

MIT License

## 👥 Support

For issues and questions, please create an issue in the repository.

---

**Built with ❤️ for Afghan Schools**
