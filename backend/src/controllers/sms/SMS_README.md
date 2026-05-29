# SMS Messaging Module - Backend

## 📦 Installation

### 1. Install Required Packages

```bash
cd backend
npm install axios uuid
```

### 2. Push Database Schema

```bash
npm run db:push
```

This will create the following new tables:
- `sms_settings` - SMS API configuration
- `sms_templates` - Message templates
- `sms_logs` - SMS history and logs
- `parent_sms_preferences` - Parent opt-in/opt-out preferences

### 3. Seed Default Templates (Optional)

After starting the server, you can seed default templates by calling:

```bash
POST http://localhost:3000/api/v1/sms/templates/seed
```

Or use the frontend UI to seed templates.

---

## 🔧 API Endpoints

### SMS Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sms/settings` | Get current SMS settings |
| POST | `/api/v1/sms/settings` | Create/Update SMS settings |
| POST | `/api/v1/sms/settings/test` | Test SMS connection |
| DELETE | `/api/v1/sms/settings` | Delete SMS settings |

### SMS Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sms/templates` | Get all templates |
| GET | `/api/v1/sms/templates/default` | Get default templates |
| POST | `/api/v1/sms/templates/seed` | Seed default templates |
| GET | `/api/v1/sms/templates/:id` | Get template by ID |
| POST | `/api/v1/sms/templates` | Create new template |
| PUT | `/api/v1/sms/templates/:id` | Update template |
| DELETE | `/api/v1/sms/templates/:id` | Delete template |

### SMS Recipients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sms/recipients/absent` | Get absent students' parents |
| GET | `/api/v1/sms/recipients/fee` | Get fee defaulters' parents |
| GET | `/api/v1/sms/recipients/exam` | Get exam result recipients |

### SMS Sending

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/sms/send` | Send SMS to parents |

### SMS Logs & Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sms/logs` | Get SMS history |
| POST | `/api/v1/sms/logs/:id/retry` | Retry failed SMS |
| GET | `/api/v1/sms/statistics` | Get SMS statistics |

---

## 📝 Usage Examples

### 1. Configure SMS Settings

```javascript
POST /api/v1/sms/settings
{
  "providerName": "Custom API",
  "apiUrl": "https://sms-api.example.com/send",
  "apiPort": "",
  "apiToken": "your-api-token-here",
  "authMethod": "token",
  "tokenPlacement": "header",
  "requestMethod": "POST",
  "phoneField": "phone",
  "messageField": "message",
  "smsBalance": 1000
}
```

### 2. Test SMS Connection

```javascript
POST /api/v1/sms/settings/test
{
  "testPhone": "0700123456",
  "testMessage": "دا د ازموینې پیغام دی"
}
```

### 3. Get Absent Students' Parents

```javascript
GET /api/v1/sms/recipients/absent?institutionType=School&date=2024-01-15
```

Response:
```json
{
  "success": true,
  "message": "د غیر حاضرو زده کوونکو مور او پلار ترلاسه شول",
  "data": {
    "recipients": [
      {
        "parentId": 1,
        "parentName": "احمد",
        "parentPhone": "0700123456",
        "studentId": 5,
        "studentName": "محمد",
        "className": "دهم - الف",
        "institutionType": "School"
      }
    ],
    "count": 1,
    "date": "2024-01-15"
  }
}
```

### 4. Send SMS to Parents

```javascript
POST /api/v1/sms/send
{
  "messageType": "Absent",
  "templateId": 1,
  "recipients": [
    {
      "parentId": 1,
      "parentName": "احمد",
      "parentPhone": "0700123456",
      "studentId": 5,
      "studentName": "محمد",
      "className": "دهم - الف",
      "institutionType": "School"
    }
  ],
  "additionalData": {
    "date": "1403/01/15"
  }
}
```

Response:
```json
{
  "success": true,
  "message": "د SMS لیږل بشپړ شو",
  "data": {
    "batchId": "uuid-here",
    "results": {
      "total": 1,
      "sent": 1,
      "failed": 0,
      "details": [...]
    },
    "message": "ټول: 1، لیږل شوي: 1، ناکام: 0"
  }
}
```

### 5. Get SMS Logs

```javascript
GET /api/v1/sms/logs?status=Sent&page=1&limit=50
```

### 6. Retry Failed SMS

```javascript
POST /api/v1/sms/logs/123/retry
```

### 7. Get SMS Statistics

```javascript
GET /api/v1/sms/statistics?startDate=2024-01-01&endDate=2024-01-31&institutionType=School
```

Response:
```json
{
  "success": true,
  "message": "د SMS احصائیې ترلاسه شوې",
  "data": {
    "stats": {
      "total": 150,
      "sent": 145,
      "failed": 5,
      "pending": 0,
      "successRate": "96.67"
    },
    "byType": [
      { "messageType": "Absent", "count": 80 },
      { "messageType": "Fee", "count": 50 },
      { "messageType": "ExamPass", "count": 20 }
    ]
  }
}
```

---

## 🔐 Authentication

All endpoints require authentication. Include JWT token in Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 📋 Template Variables

### Common Variables (All Templates)
- `{parentName}` - د مور/پلار نوم
- `{studentName}` - د زده کوونکي نوم
- `{className}` - د ټولګي نوم
- `{institutionType}` - د موسسې ډول
- `{date}` - نیټه

### Absent SMS
No additional variables

### Fee SMS
- `{month}` - میاشت
- `{amount}` - مقدار

### Exam Pass SMS
- `{examName}` - د ازموینې نوم
- `{position}` - مقام (لومړی، دویم، دریم)
- `{totalMarks}` - ټولې نمرې
- `{obtainedMarks}` - ترلاسه شوې نمرې
- `{percentage}` - سلنه

### Exam Fail SMS
- `{examName}` - د ازموینې نوم
- `{totalMarks}` - ټولې نمرې
- `{obtainedMarks}` - ترلاسه شوې نمرې

### Homework SMS
- `{subject}` - مضمون
- `{dueDate}` - د سپارلو نیټه

---

## 🚨 Error Messages (Pashto)

| Error | Message |
|-------|---------|
| No connection | د انټرنیټ اتصال نشته. مهرباني وکړئ خپل هاټسپاټ وګورئ |
| Invalid token | د تصدیق تېروتنه. مهرباني وکړئ ټوکن وګورئ |
| Invalid URL | API پته ونه موندل شوه |
| Timeout | د API غوښتنه ډیره وخت ونیوه |
| 401 | د تصدیق تېروتنه. مهرباني وکړئ ټوکن په بل ځای کې ولګوئ |
| 403 | اجازه نشته |
| 500 | د سرور تېروتنه |

---

## 🔄 SMS Sending Flow

1. Admin selects message type (Absent/Fee/Exam)
2. System fetches recipients based on criteria
3. Admin reviews and can exclude specific parents
4. Admin selects template or writes custom message
5. Admin clicks "Send SMS"
6. Backend creates batch with unique batchId
7. Backend processes each SMS:
   - Replace template variables
   - Call SMS API
   - Log result (success/failure)
8. Return summary (sent: X, failed: Y)

---

## 📊 Database Schema

### sms_settings
- id, providerName, apiUrl, apiPort, apiToken, apiUsername, apiPassword
- authMethod, tokenPlacement, requestMethod, phoneField, messageField
- isActive, smsBalance, lastTestedAt, createdAt, updatedAt

### sms_templates
- id, templateType, templateName, messagePs, messageDa, variables
- isActive, createdAt, updatedAt

### sms_logs
- id, batchId, recipientType, recipientId, recipientName, recipientPhone
- studentId, studentName, institutionType, messageType, messageContent
- status, sentAt, failureReason, retryCount, apiResponse, sentBy
- createdAt, updatedAt

### parent_sms_preferences
- id, parentId, receiveAbsentSms, receiveFeeSms, receiveExamSms
- receiveHomeworkSms, isBlocked, createdAt, updatedAt

---

## ✅ Features Implemented

- ✅ SMS Settings CRUD
- ✅ SMS Templates CRUD with default templates
- ✅ Get absent students' parents
- ✅ Get fee defaulters' parents
- ✅ Get exam result recipients (pass/fail/top 3)
- ✅ Send SMS with template variables
- ✅ SMS logging and history
- ✅ Retry failed SMS
- ✅ SMS statistics and reports
- ✅ Parent preferences (opt-in/opt-out)
- ✅ Multiple authentication methods (token/basic/bearer)
- ✅ Flexible token placement (header/query/body)
- ✅ Comprehensive error handling in Pashto
- ✅ Request validation
- ✅ Batch tracking with UUID

---

## 🎯 Next Steps

1. Install packages: `npm install axios uuid`
2. Push database schema: `npm run db:push`
3. Start server: `npm run dev`
4. Test endpoints using Postman or frontend
5. Configure SMS settings via API
6. Seed default templates
7. Test SMS sending

---

## 📞 Support

For issues or questions, refer to the main README.md or create an issue in the repository.
