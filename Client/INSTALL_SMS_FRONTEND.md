# SMS Module - Frontend Installation Guide

## ✅ Files Created

### API Client
- ✅ `Client/src/data/smsApi.js` - SMS API client

### Pages
- ✅ `Client/src/routes/sms-settings.jsx` - SMS Settings page
- ✅ `Client/src/routes/sms-templates.jsx` - SMS Templates management
- ✅ `Client/src/routes/sms-parents.jsx` - Send SMS to parents
- ✅ `Client/src/routes/sms-reports.jsx` - SMS logs and reports

### Navigation
- ✅ Updated `Client/src/components/layout/Sidebar.jsx` - Added SMS menu
- ✅ Updated `Client/src/App.jsx` - Added SMS routes

---

## 🚀 Testing the Frontend

### 1. Start the Frontend

```bash
cd Client
npm run dev
```

Frontend should start on: `http://localhost:5173`

### 2. Login

Use default credentials:
- Email: `admin@school.af`
- Password: `admin123`

### 3. Navigate to SMS Module

You should see a new menu item in the sidebar:
**پیغام رسونه (SMS)** with 4 sub-items:
1. د مور او پلار پیغامونه (Parent SMS)
2. پیغام کالبدونه (Templates)
3. راپورونه او تاریخچه (Reports)
4. تنظیمات (Settings)

---

## 📋 Step-by-Step Testing

### Step 1: Configure SMS Settings

1. Go to **پیغام رسونه (SMS) → تنظیمات**
2. Fill in the form:
   - **د API پته**: `https://your-sms-api.com/send`
   - **پورټ**: Leave empty or add port if needed
   - **API ټوکن**: Your API token
   - **د تصدیق میتود**: Select `Token`
   - **د ټوکن ځای**: Select `Header`
   - **د غوښتنې میتود**: Select `POST`
   - **د ټیلیفون فیلډ نوم**: `phone`
   - **د پیغام فیلډ نوم**: `message`

3. Test the connection:
   - Enter test phone: `0700123456`
   - Enter test message: `دا د ازموینې پیغام دی`
   - Click **د اتصال ازموینه**

4. If successful, click **تنظیمات خوندي کړئ**

**Expected Behavior:**
- ✅ Connection test shows success message in green
- ✅ Save button becomes enabled after successful test
- ✅ Settings are saved to database
- ✅ Error messages appear in Pashto if connection fails

---

### Step 2: Create SMS Templates

1. Go to **پیغام رسونه (SMS) → پیغام کالبدونه**
2. Click **ډیفالټ کالبدونه** to seed default templates
3. You should see 5 templates created:
   - د غیر حاضرۍ پیغام (Absent)
   - د فیس یادونه (Fee)
   - د ازموینې بریالیتوب (Exam Pass)
   - د ازموینې ناکامي (Exam Fail)
   - د کور کار یادونه (Homework)

4. Click **نوی کالبد** to create custom template
5. Fill in:
   - **د کالبد ډول**: Select type
   - **د کالبد نوم**: Enter name
   - **پښتو پیغام**: Enter message with variables like `{studentName}`
   - Click variable buttons to insert them

**Expected Behavior:**
- ✅ Templates are displayed in cards
- ✅ Can view, edit, and delete templates
- ✅ Variable buttons insert placeholders
- ✅ Character count shows (max 500)

---

### Step 3: Send SMS to Parents

1. Go to **پیغام رسونه (SMS) → د مور او پلار پیغامونه**

2. Select filters:
   - **د موسسې ډول**: School/Center/Madrasa
   - **د پیغام ډول**: Absent/Fee/Exam
   - **نیټه**: Select date (for absent messages)

3. System automatically fetches recipients based on:
   - **Absent**: Today's absent students' parents
   - **Fee**: Parents with unpaid fees
   - **Exam**: Parents of students with exam results

4. Select a template or write custom message

5. Review recipients list:
   - Check/uncheck individual parents
   - Use "ټول وټاکئ" to select all

6. Click **پیغامونه ولیږئ (X)**

7. Confirm the dialog

8. Watch the progress bar (0-100%)

9. View results in dialog:
   - Total sent
   - Total failed
   - Detailed list with success/failure status

**Expected Behavior:**
- ✅ Recipients load automatically based on filters
- ✅ Can select/deselect recipients
- ✅ Progress bar shows during sending
- ✅ Result dialog shows detailed summary
- ✅ Failed messages show error reasons in Pashto

---

### Step 4: View Reports

1. Go to **پیغام رسونه (SMS) → راپورونه او تاریخچه**

2. View statistics cards:
   - Total messages
   - Sent messages
   - Failed messages
   - Success rate percentage

3. Filter logs:
   - By status (Sent/Failed/Pending)
   - By message type

4. View detailed logs table:
   - Date and time
   - Recipient name and phone
   - Student name
   - Message type
   - Status badge

5. For failed messages, click **بیا هڅه** to retry

**Expected Behavior:**
- ✅ Statistics update in real-time
- ✅ Logs table shows all sent messages
- ✅ Can filter by status and type
- ✅ Retry button works for failed messages
- ✅ Pagination works correctly

---

## 🎨 UI/UX Features

### Design Consistency
- ✅ Matches existing project design
- ✅ Uses same color scheme and components
- ✅ RTL support for Pashto text
- ✅ Responsive on all screen sizes

### User Experience
- ✅ Loading states with spinners
- ✅ Progress bars for long operations
- ✅ Toast notifications for feedback
- ✅ Confirmation dialogs for destructive actions
- ✅ Clear error messages in Pashto
- ✅ Disabled states when settings not configured

### Offline Support
- ✅ All data cached in browser
- ✅ Works without internet (except SMS sending)
- ✅ Settings stored in database
- ✅ Templates stored locally

---

## 🔧 Troubleshooting

### Issue: SMS menu not showing in sidebar

**Solution:**
1. Check `Sidebar.jsx` has MessageSquare import
2. Verify SMS menu items are added to items array
3. Clear browser cache and reload

### Issue: Routes not working

**Solution:**
1. Check `App.jsx` has SMS route imports
2. Verify routes are added inside ProtectedRoute
3. Check file names match exactly

### Issue: API calls failing

**Solution:**
1. Verify backend is running on port 3000
2. Check `VITE_API_URL` in `.env` file
3. Open browser console to see error details
4. Verify JWT token is valid

### Issue: Settings page not saving

**Solution:**
1. Test connection first before saving
2. Check all required fields are filled
3. Verify API URL format is correct (https://...)
4. Check backend logs for errors

### Issue: No recipients showing

**Solution:**
1. Ensure students have attendance records (for absent)
2. Ensure students have unpaid fees (for fee messages)
3. Ensure parents are linked to students
4. Check backend API response in network tab

---

## ✅ Verification Checklist

- [ ] SMS menu appears in sidebar
- [ ] All 4 SMS pages load without errors
- [ ] Settings page can test connection
- [ ] Settings page saves successfully
- [ ] Templates page loads default templates
- [ ] Can create/edit/delete templates
- [ ] Parents page fetches recipients
- [ ] Can select/deselect recipients
- [ ] Can send SMS with progress bar
- [ ] Result dialog shows correct summary
- [ ] Reports page shows statistics
- [ ] Logs table displays sent messages
- [ ] Can retry failed messages
- [ ] All error messages in Pashto
- [ ] UI matches project design
- [ ] Works on mobile/tablet/desktop

---

## 🎯 Key Features Implemented

### SMS Settings Page
- ✅ API configuration form
- ✅ Connection testing before save
- ✅ Multiple auth methods (token/basic/bearer)
- ✅ Token placement options (header/query/body)
- ✅ Detailed error messages in Pashto
- ✅ Save disabled until test succeeds

### SMS Templates Page
- ✅ Template CRUD operations
- ✅ Seed default templates
- ✅ Variable insertion buttons
- ✅ Character counter
- ✅ Preview functionality
- ✅ Template type filtering

### SMS Parents Page
- ✅ Institution type filter
- ✅ Message type filter
- ✅ Auto-fetch recipients
- ✅ Select/deselect recipients
- ✅ Template selection
- ✅ Custom message option
- ✅ Progress tracking (0-100%)
- ✅ Detailed result dialog

### SMS Reports Page
- ✅ Statistics dashboard
- ✅ Logs table with filters
- ✅ Status badges (sent/failed/pending)
- ✅ Retry failed messages
- ✅ Pagination
- ✅ Date/time formatting

---

## 📱 Mobile Responsiveness

All pages are fully responsive:
- ✅ Settings form stacks on mobile
- ✅ Templates display in single column
- ✅ Recipients list scrollable
- ✅ Reports table scrolls horizontally
- ✅ Sidebar collapses on mobile

---

## 🎉 Success!

Your SMS module is now complete and ready to use!

**Next Steps:**
1. Configure your real SMS API credentials
2. Test with real phone numbers
3. Monitor logs and statistics
4. Train users on the system

---

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Check backend logs
3. Verify database has SMS tables
4. Ensure all dependencies are installed

**Built with ❤️ for Afghan Schools**
