# 🚀 SMS Module - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Install Backend Dependencies (30 seconds)
```bash
cd backend
npm install axios uuid
```

### Step 2: Update Database (30 seconds)
```bash
npm run db:push
```

### Step 3: Start Servers (30 seconds)
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd Client
npm run dev
```

### Step 4: Login (30 seconds)
- Open: `http://localhost:5173`
- Email: `admin@school.af`
- Password: `admin123`

### Step 5: Configure SMS (2 minutes)
1. Click **پیغام رسونه (SMS)** in sidebar
2. Click **تنظیمات** (Settings)
3. Fill in your SMS API details:
   - API URL: `https://your-sms-api.com/send`
   - API Token: `your-token-here`
   - Auth Method: `Token`
   - Token Placement: `Header`
4. Click **د اتصال ازموینه** (Test Connection)
5. If successful, click **تنظیمات خوندي کړئ** (Save)

### Step 6: Create Templates (1 minute)
1. Click **پیغام کالبدونه** (Templates)
2. Click **ډیفالټ کالبدونه** (Default Templates)
3. Done! 5 templates created

### Step 7: Send Your First SMS (1 minute)
1. Click **د مور او پلار پیغامونه** (Parent SMS)
2. Select filters (Institution Type, Message Type)
3. Select recipients
4. Select template
5. Click **پیغامونه ولیږئ** (Send Messages)
6. Watch progress bar
7. View results!

---

## ✅ Verification

Your SMS module is working if you can:
- [x] See SMS menu in sidebar
- [x] Configure and test settings
- [x] Create templates
- [x] Fetch recipients
- [x] Send SMS with progress
- [x] View logs and statistics

---

## 🎯 What You Get

### 4 Pages
1. **Settings** - Configure SMS API
2. **Templates** - Manage message templates
3. **Parent SMS** - Send messages to parents
4. **Reports** - View logs and statistics

### Key Features
- ✅ Automatic recipient fetching
- ✅ Progress tracking (0-100%)
- ✅ Success/failure reports
- ✅ Retry failed messages
- ✅ Full Pashto support
- ✅ Offline-first design
- ✅ Mobile responsive

---

## 📋 Files Created

### Backend (8 files)
```
backend/src/
├── controllers/sms/
│   ├── sms.controller.js
│   ├── sms-settings.controller.js
│   └── sms-templates.controller.js
├── routes/sms/
│   └── sms.route.js
├── services/sms/
│   ├── sms-sender.service.js
│   └── sms-template.service.js
├── validators/sms/
│   └── sms.validator.js
└── utils/
    └── smsHelpers.util.js
```

### Frontend (5 files)
```
Client/src/
├── data/
│   └── smsApi.js
└── routes/
    ├── sms-settings.jsx
    ├── sms-templates.jsx
    ├── sms-parents.jsx
    └── sms-reports.jsx
```

### Database (4 tables)
- `sms_settings` - API configuration
- `sms_templates` - Message templates
- `sms_logs` - SMS history
- `parent_sms_preferences` - Parent preferences

---

## 🔧 Common Issues

### Issue: SMS menu not showing
**Fix**: Clear browser cache and reload

### Issue: Can't save settings
**Fix**: Test connection first (must succeed)

### Issue: No recipients showing
**Fix**: Ensure students have attendance/fee records

### Issue: API calls failing
**Fix**: Check backend is running on port 3000

---

## 📚 Documentation

- **Full Documentation**: `SMS_MODULE_COMPLETE.md`
- **Backend Guide**: `backend/INSTALL_SMS.md`
- **Frontend Guide**: `Client/INSTALL_SMS_FRONTEND.md`
- **API Docs**: `backend/src/controllers/sms/SMS_README.md`

---

## 🎉 You're Done!

Your SMS module is now ready to use!

**Next Steps:**
1. Configure your real SMS API
2. Test with real phone numbers
3. Train your team
4. Start sending messages!

---

**Need Help?**
- Check browser console for errors
- Check backend logs
- Review error messages (in Pashto)
- Test API with Postman

**Built with ❤️ for Afghan Schools**
