# SMS Module - Installation & Setup Guide

## 📦 Step 1: Install Dependencies

```bash
cd backend
npm install axios uuid
```

## 🗄️ Step 2: Update Database Schema

```bash
npm run db:push
```

This will create 4 new tables:
- ✅ `sms_settings` - SMS API configuration
- ✅ `sms_templates` - Message templates  
- ✅ `sms_logs` - SMS history
- ✅ `parent_sms_preferences` - Parent preferences

## 🚀 Step 3: Start Backend Server

```bash
npm run dev
```

Server should start on: `http://localhost:3000`

## 🧪 Step 4: Test the API

### 4.1 Seed Default Templates

```bash
curl -X POST http://localhost:3000/api/v1/sms/templates/seed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "message": "ډیفالټ کالبدونه بریالیتوب سره جوړ شول",
  "data": {
    "count": 5
  }
}
```

### 4.2 Configure SMS Settings

```bash
curl -X POST http://localhost:3000/api/v1/sms/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providerName": "Custom API",
    "apiUrl": "https://your-sms-api.com/send",
    "apiToken": "your-token-here",
    "authMethod": "token",
    "tokenPlacement": "header",
    "requestMethod": "POST",
    "phoneField": "phone",
    "messageField": "message"
  }'
```

### 4.3 Test SMS Connection

```bash
curl -X POST http://localhost:3000/api/v1/sms/settings/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "testPhone": "0700123456",
    "testMessage": "دا د ازموینې پیغام دی"
  }'
```

### 4.4 Get Absent Students' Parents

```bash
curl -X GET "http://localhost:3000/api/v1/sms/recipients/absent?institutionType=School&date=2024-01-15" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4.5 Send SMS

```bash
curl -X POST http://localhost:3000/api/v1/sms/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
    ]
  }'
```

## 📊 Step 5: Verify Installation

### Check Tables Created

```bash
npm run db:studio
```

Open Drizzle Studio and verify these tables exist:
- sms_settings
- sms_templates
- sms_logs
- parent_sms_preferences

### Check Routes Registered

The following routes should be available:

**Settings:**
- GET `/api/v1/sms/settings`
- POST `/api/v1/sms/settings`
- POST `/api/v1/sms/settings/test`
- DELETE `/api/v1/sms/settings`

**Templates:**
- GET `/api/v1/sms/templates`
- POST `/api/v1/sms/templates`
- GET `/api/v1/sms/templates/:id`
- PUT `/api/v1/sms/templates/:id`
- DELETE `/api/v1/sms/templates/:id`
- POST `/api/v1/sms/templates/seed`

**Recipients:**
- GET `/api/v1/sms/recipients/absent`
- GET `/api/v1/sms/recipients/fee`
- GET `/api/v1/sms/recipients/exam`

**Sending:**
- POST `/api/v1/sms/send`

**Logs:**
- GET `/api/v1/sms/logs`
- POST `/api/v1/sms/logs/:id/retry`
- GET `/api/v1/sms/statistics`

## 🔧 Troubleshooting

### Issue: Tables not created

**Solution:**
```bash
# Delete database and recreate
rm backend/database/school.db
npm run db:push
npm run db:seed
```

### Issue: axios or uuid not found

**Solution:**
```bash
npm install axios uuid
```

### Issue: Routes not working

**Solution:**
Check that `smsRoutes` is imported in `routes.js`:
```javascript
import smsRoutes from "./sms/sms.route.js";
router.use("/sms", smsRoutes);
```

### Issue: SMS API connection fails

**Solution:**
1. Check API URL is correct
2. Verify API token is valid
3. Check authMethod and tokenPlacement settings
4. Test with Postman first
5. Check error message in Pashto for specific issue

## ✅ Verification Checklist

- [ ] Dependencies installed (axios, uuid)
- [ ] Database schema updated (4 new tables)
- [ ] Server starts without errors
- [ ] Default templates seeded
- [ ] SMS settings configured
- [ ] Test SMS connection successful
- [ ] Can fetch recipients
- [ ] Can send SMS
- [ ] SMS logs are created
- [ ] Statistics endpoint works

## 📝 Next Steps

1. ✅ Backend is complete
2. ⏭️ Build Frontend UI
3. ⏭️ Add to sidebar navigation
4. ⏭️ Test complete flow

## 🎯 Default Templates Created

1. **Absent** - د غیر حاضرۍ پیغام
2. **Fee** - د فیس یادونه
3. **ExamPass** - د ازموینې بریالیتوب
4. **ExamFail** - د ازموینې ناکامي
5. **Homework** - د کور کار یادونه

## 📞 Support

If you encounter any issues:
1. Check server logs: `backend/logs/`
2. Check database: `npm run db:studio`
3. Verify all files are created correctly
4. Ensure all imports are correct

---

**Backend SMS Module is now complete! ✅**

Ready to build the Frontend? Let me know!
