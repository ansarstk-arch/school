# API Testing Guide

## Test Authentication Endpoints

### 1. Health Check
```bash
curl http://localhost:3000/health
```

Expected Response:
```json
{
  "success": true,
  "status": 200,
  "message": "Server is running",
  "environment": "development",
  "db": {
    "mode": "local",
    "status": "ok"
  },
  "timestamp": "2026-05-17T...",
  "uptime": "10s"
}
```

---

### 2. Login (Admin)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.af",
    "password": "admin123"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "ننوتل بریالی شو",
  "status": 200,
  "data": {
    "user": {
      "id": 1,
      "name": "مدیر سیسټم",
      "email": "admin@school.af",
      "role": "admin",
      "permissions": "{...}"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Login (Registrar)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "registrar@school.af",
    "password": "registrar123"
  }'
```

---

### 4. Verify Token
```bash
# Replace YOUR_ACCESS_TOKEN with actual token from login
curl -X GET http://localhost:3000/api/v1/auth/verify \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "message": "تایید شو",
  "status": 200,
  "data": {
    "user": {
      "id": 1,
      "name": "مدیر سیسټم",
      "email": "admin@school.af",
      "role": "admin",
      "permissions": "{...}",
      "status": "active",
      "createdAt": "2026-05-17T..."
    }
  }
}
```

---

### 5. Change Password
```bash
# Replace YOUR_ACCESS_TOKEN with actual token
curl -X PATCH http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "admin123",
    "newPassword": "newpassword123"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "پاسورډ بدل شو",
  "status": 200
}
```

---

### 6. Logout
```bash
# Replace YOUR_ACCESS_TOKEN with actual token
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "message": "وتل بریالی شو",
  "status": 200
}
```

---

## Error Responses

### Invalid Credentials
```json
{
  "success": false,
  "message": "بریښنالیک یا پاسورډ سم نه دی",
  "status": 400
}
```

### Unauthorized (No Token)
```json
{
  "success": false,
  "message": "غیر مجاز",
  "status": 401
}
```

### Account Inactive
```json
{
  "success": false,
  "message": "حساب غیر فعال دی",
  "status": 403
}
```

### Validation Error
```json
{
  "success": false,
  "message": "بریښنالیک اړین دی",
  "status": 400
}
```

### Server Error
```json
{
  "success": false,
  "message": "داخلي سرور خرابي",
  "status": 500
}
```

---

## Testing with Postman/Thunder Client

### 1. Create Environment Variables
- `BASE_URL`: `http://localhost:3000/api/v1`
- `ACCESS_TOKEN`: (will be set after login)
- `REFRESH_TOKEN`: (will be set after login)

### 2. Login Request
- Method: POST
- URL: `{{BASE_URL}}/auth/login`
- Body (JSON):
```json
{
  "email": "admin@school.af",
  "password": "admin123"
}
```
- Save `accessToken` and `refreshToken` from response

### 3. Protected Requests
- Add header: `Authorization: Bearer {{ACCESS_TOKEN}}`
- Add header: `x-refresh-token: {{REFRESH_TOKEN}}`

---

## Frontend Testing

### 1. Open Browser
Navigate to: `http://localhost:5173`

### 2. Login
- Email: `admin@school.af`
- Password: `admin123`

### 3. Check Browser Console
- Should see no errors
- Check Network tab for API calls
- Verify tokens in localStorage

### 4. Test Features
- Login/Logout
- Change Password
- Token refresh (wait 15 minutes or manually expire token)
- Protected routes

---

## Common Issues

### 1. CORS Error
**Solution:** Ensure backend CORS is configured for `http://localhost:5173`

### 2. 500 Error
**Solution:** Check backend console for detailed error logs

### 3. Token Expired
**Solution:** Refresh token should automatically renew access token

### 4. Database Error
**Solution:** Run `npm run db:push` and `npm run db:seed`
