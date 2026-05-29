# 📱 SMS Messaging Module - Complete Documentation

## 🎯 Overview

A comprehensive SMS messaging system for sending notifications to parents about:
- Student absences
- Fee reminders
- Exam results (pass/fail/top positions)
- Homework assignments
- Custom messages

---

## ✨ Features

### ✅ Backend Features
- SMS API configuration with multiple auth methods
- Connection testing before saving settings
- Message templates with variable support
- Automatic recipient fetching based on criteria
- Batch SMS sending with progress tracking
- Comprehensive logging and history
- Retry failed messages
- Statistics and reports
- Parent opt-in/opt-out preferences
- Offline-first database storage

### ✅ Frontend Features
- Intuitive UI matching project design
- Real-time progress tracking (0-100%)
- Recipient selection with filters
- Template management
- Detailed success/failure reports
- Statistics dashboard
- Retry functionality
- Full Pashto language support
- Mobile responsive design
- Offline support

---

## 📦 Installation

### Backend Setup

1. **Install Dependencies**
```bash
cd backend
npm install axios uuid
```

2. **Update Database Schema**
```bash
npm run db:push
```

3. **Start Backend**
```bash
npm run dev
```

4. **Seed Default Templates** (Optional)
```bash
curl -X POST http://localhost:3000/api/v1/sms/templates/seed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Frontend Setup

1. **Start Frontend**
```bash
cd Client
npm run dev
```

2. **Access Application**
- URL: `http://localhost:5173`
- Login: `admin@school.af` / `admin123`

---

## 🗄️ Database Tables

### sms_settings
Stores SMS API configuration:
- API URL, port, token
- Authentication method and placement
- Phone/message field names
- SMS balance
- Last tested timestamp

### sms_templates
Message templates with variables:
- Template type (Absent/Fee/Exam/Homework)
- Template name
- Pashto and Dari messages
- Available variables
- Active status

### sms_logs
Complete SMS history:
- Batch ID for grouping
- Recipient details
- Student information
- Message content
- Status (Sent/Failed/Pending)
- Failure reason
- Retry count
- API response

### parent_sms_preferences
Parent opt-in/opt-out settings:
- Receive absent SMS
- Receive fee SMS
- Receive exam SMS
- Receive homework SMS
- Blocked status

---

## 🔧 Configuration

### Step 1: Configure SMS Settings

Navigate to: **پیغام رسونه (SMS) → تنظیمات**

Fill in:
1. **API URL**: Your SMS provider API endpoint
2. **Port**: Optional port number
3. **API Token**: Your authentication token
4. **Auth Method**: token/basic/bearer
5. **Token Placement**: header/query/body
6. **Request Method**: POST/GET
7. **Phone Field**: API field name for phone number
8. **Message Field**: API field name for message

### Step 2: Test Connection

1. Enter test phone number
2. Enter test message
3. Click "د اتصال ازموینه" (Test Connection)
4. Wait for success message
5. Click "تنظیمات خوندي کړئ" (Save Settings)

**Important:** Settings cannot be saved without successful connection test!

### Step 3: Create Templates

Navigate to: **پیغام رسونه (SMS) → پیغام کالبدونه**

Option A: Seed default templates
- Click "ډیفالټ کالبدونه" button
- 5 templates will be created automatically

Option B: Create custom template
- Click "نوی کالبد" button
- Select template type
- Enter template name
- Write message with variables
- Use variable buttons to insert placeholders

---

## 📤 Sending SMS

### Step 1: Select Filters

Navigate to: **پیغام رسونه (SMS) → د مور او پلار پیغامونه**

1. **Institution Type**: School/Center/Madrasa
2. **Message Type**: Absent/Fee/Exam
3. **Date**: For absent messages

### Step 2: Review Recipients

System automatically fetches:
- **Absent**: Parents of today's absent students
- **Fee**: Parents with unpaid fees
- **Exam**: Parents of students with exam results

### Step 3: Select Template

Choose from:
- Pre-defined templates
- Custom message

### Step 4: Select Recipients

- Check/uncheck individual parents
- Use "ټول وټاکئ" to select all
- Review phone numbers

### Step 5: Send Messages

1. Click "پیغامونه ولیږئ (X)"
2. Confirm in dialog
3. Watch progress bar (0-100%)
4. View detailed results

---

## 📊 Reports & Analytics

Navigate to: **پیغام رسونه (SMS) → راپورونه او تاریخچه**

### Statistics Dashboard
- Total messages sent
- Successful deliveries
- Failed messages
- Success rate percentage

### Logs Table
- Date and time
- Recipient name and phone
- Student name
- Message type
- Status badge
- Retry button for failed messages

### Filters
- By status (Sent/Failed/Pending)
- By message type
- Pagination support

---

## 🔄 Message Flow

```
1. Admin selects institution type and message type
   ↓
2. System fetches eligible recipients
   ↓
3. Admin reviews and selects recipients
   ↓
4. Admin selects template or writes custom message
   ↓
5. Admin clicks "Send SMS"
   ↓
6. System creates batch with unique ID
   ↓
7. For each recipient:
   - Replace template variables
   - Call SMS API
   - Log result (success/failure)
   - Update progress
   ↓
8. Show final summary
   ↓
9. Store in logs for future reference
```

---

## 📝 Template Variables

### Common Variables (All Templates)
- `{parentName}` - Parent's name
- `{studentName}` - Student's name
- `{className}` - Class name with section
- `{date}` - Current date
- `{institutionType}` - School/Center/Madrasa

### Absent SMS
No additional variables

### Fee SMS
- `{month}` - Fee month
- `{amount}` - Outstanding amount

### Exam Pass SMS
- `{examName}` - Exam name
- `{position}` - Rank (1st/2nd/3rd)
- `{totalMarks}` - Total possible marks
- `{obtainedMarks}` - Marks obtained
- `{percentage}` - Percentage

### Exam Fail SMS
- `{examName}` - Exam name
- `{totalMarks}` - Total possible marks
- `{obtainedMarks}` - Marks obtained

### Homework SMS
- `{subject}` - Subject name
- `{dueDate}` - Due date

---

## 🚨 Error Handling

### Connection Errors (Pashto)

| Error | Message |
|-------|---------|
| No internet | د انټرنیټ اتصال نشته. مهرباني وکړئ خپل هاټسپاټ وګورئ |
| Invalid token | د تصدیق تېروتنه. مهرباني وکړئ ټوکن وګورئ |
| Invalid URL | API پته ونه موندل شوه |
| Timeout | د API غوښتنه ډیره وخت ونیوه |
| 401 | د تصدیق تېروتنه. مهرباني وکړئ ټوکن په بل ځای کې ولګوئ |
| 403 | اجازه نشته |
| 500 | د سرور تېروتنه |

### Validation Errors
- Settings not configured
- No recipients selected
- No template selected
- Invalid phone number format
- Message too long (>500 chars)

---

## 🔐 Security Features

- JWT authentication required
- Password/token masking in UI
- SQL injection protection (Drizzle ORM)
- Input validation on both client and server
- Rate limiting on API endpoints
- Secure token storage
- Parent opt-out support

---

## 📱 Mobile Support

All pages are fully responsive:
- Settings form adapts to screen size
- Templates display in grid/list
- Recipients list scrollable
- Reports table horizontal scroll
- Touch-friendly buttons
- Sidebar collapses on mobile

---

## 🎨 UI/UX Highlights

- **Consistent Design**: Matches existing project style
- **RTL Support**: Full Pashto language support
- **Loading States**: Spinners and progress bars
- **Toast Notifications**: Success/error feedback
- **Confirmation Dialogs**: For destructive actions
- **Status Badges**: Color-coded (green/red/yellow)
- **Disabled States**: When prerequisites not met
- **Keyboard Navigation**: Accessible forms

---

## 🧪 Testing Checklist

### Backend Testing
- [ ] SMS settings CRUD works
- [ ] Connection test succeeds
- [ ] Templates CRUD works
- [ ] Seed templates works
- [ ] Absent recipients fetched correctly
- [ ] Fee recipients fetched correctly
- [ ] SMS sending works
- [ ] Logs are created
- [ ] Retry works
- [ ] Statistics calculated correctly

### Frontend Testing
- [ ] SMS menu appears in sidebar
- [ ] All pages load without errors
- [ ] Settings page saves after test
- [ ] Templates page CRUD works
- [ ] Parents page fetches recipients
- [ ] Can send SMS with progress
- [ ] Result dialog shows correctly
- [ ] Reports page displays logs
- [ ] Retry button works
- [ ] All text in Pashto
- [ ] Mobile responsive

---

## 📈 Performance

- **Batch Processing**: SMS sent sequentially with 100ms delay
- **Progress Tracking**: Real-time updates
- **Pagination**: Logs limited to 20 per page
- **Caching**: Settings and templates cached
- **Offline Support**: Works without internet (except sending)

---

## 🔄 Future Enhancements

Potential additions:
- [ ] Scheduled SMS (send at specific time)
- [ ] SMS templates in Dari language
- [ ] Bulk upload recipients from Excel
- [ ] SMS cost tracking
- [ ] Delivery reports from provider
- [ ] SMS balance alerts
- [ ] Parent reply handling
- [ ] SMS campaigns
- [ ] A/B testing templates
- [ ] Analytics dashboard

---

## 🐛 Troubleshooting

### Backend Issues

**Issue**: Tables not created
```bash
rm backend/database/school.db
npm run db:push
npm run db:seed
```

**Issue**: axios/uuid not found
```bash
npm install axios uuid
```

**Issue**: Routes not working
- Check `routes.js` imports smsRoutes
- Verify `router.use("/sms", smsRoutes)`

### Frontend Issues

**Issue**: SMS menu not showing
- Check Sidebar.jsx has MessageSquare import
- Verify SMS items in items array
- Clear browser cache

**Issue**: API calls failing
- Verify backend running on port 3000
- Check VITE_API_URL in .env
- Check JWT token validity

**Issue**: No recipients showing
- Ensure attendance records exist
- Ensure parents linked to students
- Check backend API response

---

## 📞 Support

For issues:
1. Check browser console
2. Check backend logs
3. Verify database tables
4. Test API with Postman
5. Review error messages

---

## 🎉 Success Criteria

Your SMS module is working correctly if:
- ✅ Can configure and test SMS settings
- ✅ Can create and manage templates
- ✅ Can fetch recipients automatically
- ✅ Can send SMS with progress tracking
- ✅ Can view logs and statistics
- ✅ Can retry failed messages
- ✅ All error messages in Pashto
- ✅ UI matches project design
- ✅ Works offline (except sending)

---

## 📄 API Documentation

Full API documentation available in:
- `backend/src/controllers/sms/SMS_README.md`

---

## 🏆 Credits

**Built with ❤️ for Afghan Schools**

Technology Stack:
- Backend: Node.js, Express, Drizzle ORM, SQLite
- Frontend: React, Vite, TailwindCSS, shadcn/ui
- Language: Pashto (RTL support)
- Architecture: Offline-first

---

**SMS Module is now complete and production-ready! 🚀**
