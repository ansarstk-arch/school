import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── TEACHER UPLOAD ────────────────────────────────────────────────────────────

// Create upload directory if it doesn't exist
const teacherUploadDir = path.join(__dirname, '../../uploads/teachers');
if (!fs.existsSync(teacherUploadDir)) {
  fs.mkdirSync(teacherUploadDir, { recursive: true });
}

// Configure multer storage for teachers
const teacherStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, teacherUploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `teacher-${uniqueSuffix}${ext}`);
  }
});

// ─── STUDENT UPLOAD ────────────────────────────────────────────────────────────

// Create base student upload directory
const studentBaseDir = path.join(__dirname, '../../uploads/students');
if (!fs.existsSync(studentBaseDir)) {
  fs.mkdirSync(studentBaseDir, { recursive: true });
}

// Configure multer storage for students (dynamic folder based on enrollment)
const studentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Default to School if no enrollment specified
    let enrollmentType = 'School';
    
    // Try to get enrollment type from request body
    if (req.body.enrollments) {
      try {
        const enrollments = typeof req.body.enrollments === 'string' 
          ? JSON.parse(req.body.enrollments) 
          : req.body.enrollments;
        
        if (Array.isArray(enrollments) && enrollments.length > 0) {
          enrollmentType = enrollments[0]; // Use first enrollment type
        }
      } catch (e) {
        console.error('Error parsing enrollments:', e);
      }
    }
    
    // Create enrollment-specific directory
    const uploadDir = path.join(studentBaseDir, enrollmentType);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `student-${uniqueSuffix}${ext}`);
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('یوازې د انځور فایلونه (JPG, PNG, WEBP) منل کیږي'), false);
  }
};

// Configure multer for teachers
const upload = multer({
  storage: teacherStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

// Configure multer for students
export const studentUpload = multer({
  storage: studentStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

export default upload;

// ─── EXPENSE UPLOAD ───────────────────────────────────────────────────────────
// Create upload directory for expenses
const expenseUploadDir = path.join(__dirname, '../../uploads/expenses');
if (!fs.existsSync(expenseUploadDir)) {
  fs.mkdirSync(expenseUploadDir, { recursive: true });
}

const expenseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, expenseUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `expense-${uniqueSuffix}${ext}`);
  }
});

export const expenseUpload = multer({
  storage: expenseStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});