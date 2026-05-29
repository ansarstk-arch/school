# Authentication System Guide

## Overview

The authentication system uses email + password with JWT tokens (access + refresh tokens) for secure authentication.

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   Frontend  │ ◄─────► │   Backend   │ ◄─────► │   Database   │
│   (React)   │  HTTP   │  (Express)  │  SQL    │   (SQLite)   │
└─────────────┘         └─────────────┘         └──────────────┘
```

## Authentication Flow

### 1. Login Process

```javascript
// User enters credentials
{ email: "admin@school.af", password: "admin123" }

// Frontend sends POST request
POST /api/v1/auth/login
Body: { email, password }

// Backend validates
1. Check if email exists
2. Verify password with bcrypt
3. Check if account is active
4. Generate JWT tokens

// Backend responds
{
  success: true,
  message: "ننوتل بریالی شو",
  status: 200,
  data: {
    user: { id, name, email, role, permissions },
    accessToken: "eyJhbGc...",
    refreshToken: "eyJhbGc..."
  }
}

// Frontend stores
1. Tokens in localStorage
2. User data in localStorage
3. Updates Zustand store
4. Redirects to /dashboard
```

### 2. Protected API Requests

```javascript
// Frontend sends request with token
GET /api/v1/auth/verify
Headers: {
  Authorization: "Bearer <accessToken>",
  x-refresh-token: "<refreshToken>"
}

// Backend middleware checks
1. Extract access token from Authorization header
2. Verify access token
3. If valid → proceed to route handler
4. If expired → check refresh token
5. If refresh valid → generate new tokens
6. Return new tokens in response headers
```

### 3. Token Rotation

```javascript
// When access token expires
1. Backend detects expired access token
2. Checks refresh token
3. Generates new access + refresh tokens
4. Returns in response headers:
   - x-new-access-token
   - x-new-refresh-token
5. Frontend automatically updates tokens
```

### 4. Logout Process

```javascript
// User clicks logout
POST /api/v1/auth/logout

// Frontend clears
1. Tokens from localStorage
2. User data from localStorage
3. Zustand store state
4. Redirects to login page
```

## Token Details

### Access Token
- **Purpose**: Authenticate API requests
- **Expiry**: 15 minutes
- **Storage**: localStorage
- **Usage**: Sent in Authorization header

### Refresh Token
- **Purpose**: Get new access token
- **Expiry**: 7 days
- **Storage**: localStorage
- **Usage**: Sent in x-refresh-token header

## Error Handling

### Frontend Error Handling

```javascript
try {
  const result = await authService.login(credentials);
  // Success
} catch (error) {
  // error is ApiError instance
  // error.message contains user-friendly Pashto message
  // error.status contains HTTP status code
  toast.error(error.message);
}
```

### Backend Error Responses

```javascript
// Validation Error (400)
{
  success: false,
  message: "بریښنالیک اړین دی",
  status: 400
}

// Authentication Error (401)
{
  success: false,
  message: "غیر مجاز",
  status: 401
}

// Forbidden Error (403)
{
  success: false,
  message: "حساب غیر فعال دی",
  status: 403
}

// Not Found Error (404)
{
  success: false,
  message: "کارمند ونه موندل شو",
  status: 404
}

// Server Error (500)
{
  success: false,
  message: "داخلي سرور خرابي",
  status: 500
}
```

## Security Features

### 1. Password Security
- Passwords hashed with bcrypt (10 rounds)
- Minimum 6 characters required
- Never stored in plain text

### 2. Token Security
- JWT signed with secret key
- Short-lived access tokens (15 min)
- Refresh token rotation
- Tokens stored in localStorage (XSS protection via CSP)

### 3. API Security
- Rate limiting (100 req/15min)
- CORS protection
- HPP protection
- Input validation
- SQL injection protection (ORM)

### 4. Account Security
- Account status check (active/inactive)
- Role-based access control
- Permission-based features

## API Client Implementation

### ApiClient Class

```javascript
class ApiClient {
  constructor() {
    this.accessToken = localStorage.getItem("accessToken");
    this.refreshToken = localStorage.getItem("refreshToken");
  }

  async request(endpoint, options) {
    // 1. Add tokens to headers
    // 2. Make fetch request
    // 3. Check for new tokens in response headers
    // 4. Update tokens if present
    // 5. Parse response
    // 6. Handle errors
    // 7. Return data
  }
}
```

### Error Handling

```javascript
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}
```

## State Management (Zustand)

```javascript
const useStore = create((set, get) => ({
  // State
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,

  // Actions
  login: async (credentials) => { /* ... */ },
  logout: async () => { /* ... */ },
  verifyAuth: async () => { /* ... */ },
  changePassword: async (data) => { /* ... */ },
  clearError: () => { /* ... */ },
}));
```

## Testing Authentication

### 1. Test Login
```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd Client
npm run dev

# Open browser
http://localhost:5173

# Login with
Email: admin@school.af
Password: admin123
```

### 2. Test Token Rotation
```javascript
// Wait 15 minutes for access token to expire
// Make any API request
// Check browser DevTools → Network → Response Headers
// Should see: x-new-access-token and x-new-refresh-token
```

### 3. Test Logout
```javascript
// Click logout button
// Check localStorage (should be empty)
// Try accessing /dashboard (should redirect to login)
```

### 4. Test Protected Routes
```javascript
// Without login, try accessing:
http://localhost:5173/dashboard
// Should redirect to login page
```

## Common Issues & Solutions

### Issue: "د شبکې سره اړیکه نشته"
**Solution**: Backend is not running. Start with `npm run dev`

### Issue: "غیر مجاز" (Unauthorized)
**Solution**: 
- Clear localStorage
- Login again
- Check if tokens are being sent in headers

### Issue: "بریښنالیک یا پاسورډ سم نه دی"
**Solution**:
- Verify credentials
- Check if user exists in database
- Run `npm run db:seed` to recreate users

### Issue: CORS Error
**Solution**:
- Check FRONTEND_URL in backend .env
- Verify VITE_API_URL in frontend .env
- Restart both servers

### Issue: Token not refreshing
**Solution**:
- Check refresh token expiry (7 days)
- Clear localStorage and login again
- Check backend logs for errors

## Best Practices

1. **Never log tokens** in production
2. **Always use HTTPS** in production
3. **Rotate JWT secret** regularly
4. **Implement token blacklist** for logout
5. **Add 2FA** for admin accounts
6. **Monitor failed login attempts**
7. **Implement password reset** flow
8. **Add email verification**
9. **Use secure cookies** instead of localStorage (future)
10. **Implement session management**

## Future Enhancements

- [ ] Email verification
- [ ] Password reset via email
- [ ] Two-factor authentication (2FA)
- [ ] Session management
- [ ] Login history
- [ ] Failed login attempt tracking
- [ ] Account lockout after failed attempts
- [ ] Remember me functionality
- [ ] Social login (Google, Facebook)
- [ ] Biometric authentication

---

**Last Updated**: May 17, 2026
