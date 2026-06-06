# Attendance System - Quick Reference Card

## 🚀 Quick Actions

### Daily Morning Routine
```
1. Open QR Scanner
2. Students scan as they arrive
3. At 9:00 AM → Auto-absence marks remaining students
4. Late arrivals can still scan
```

### Manual Attendance
```
1. Select Class + Date
2. Click "Manage Attendance"
3. Bulk mark all Present
4. Mark exceptions (Absent/Leave)
5. Click "Save"
```

### Download Report
```
1. Scroll to "Download Report"
2. Select Class
3. Choose Period (Daily/Monthly/Yearly)
4. Click "Excel Download"
```

---

## ⚙️ Settings Configuration

| Setting | Default | Purpose |
|---------|---------|---------|
| Check-in Time | 08:00 | When staff should arrive |
| Check-out Time | 15:00 | When staff should leave |
| Absence Marking Time | 09:00 | When auto-absence runs |
| QR Code Validity | 24 hours | How long QR codes last |

---

## 📊 Excel Report Features

### What's Included
✅ School name and branding  
✅ Report type and date range  
✅ Summary statistics (Total, Present %, Absent %, Leave %)  
✅ Detailed attendance table  
✅ Color-coded status (🟢 Present, 🔴 Absent, 🟡 Leave)  
✅ Auto-filter on all columns  
✅ Professional formatting  

### Report Types
- **Daily**: Single day snapshot
- **Monthly**: 30-day summary with percentages
- **Yearly**: Annual overview with trends

---

## 🔍 QR Code Behavior

| Scenario | What Happens | Message |
|----------|--------------|---------|
| First scan today | ✅ Marked Present | حاضر ثبت شو ✓ |
| Already present | ⚠️ Rejected | د نن ورځې حاضري مخکې ثبت شوې |
| Marked absent → Scan | ✅ Changed to Present | غیر حاضر څخه حاضر ته بدل شو ✓ |
| Scan twice quickly | ⚠️ Rejected | دمخه سکین شوی |

---

## ⏰ Daily Timeline Example

```
08:00 AM ─────► School opens, QR scanner active
     │
08:00-09:00 ─► Students arrive and scan
     │
09:00 AM ─────► AUTO-ABSENCE runs automatically
     │          • Marks all non-scanned as Absent
     │          • Takes 2-10 seconds
     │
09:00+ ───────► Late arrivals scan QR
     │          • Status changes Absent → Present
     │
15:00 PM ─────► School ends
     │
Anytime ──────► Download reports
```

---

## 📱 User Interface Guide

### Attendance Students Page

```
┌─────────────────────────────────────────────┐
│ د زده کوونکو حاضري                          │
├─────────────────────────────────────────────┤
│                                              │
│  [Manual/QR] [School ▼] [Class ▼] [Date]   │
│                                              │
│  [د حاضرۍ مدیریت] ◄─ Click to start        │
│                                              │
├─────────────────────────────────────────────┤
│  Statistics Dashboard (after loading)       │
│  ┌─────┬──────┬───────┬────────┬─────────┐ │
│  │Total│Present│Absent │ Leave  │Undefined│ │
│  │ 35  │  30   │  4    │   1    │    0    │ │
│  └─────┴──────┴───────┴────────┴─────────┘ │
├─────────────────────────────────────────────┤
│  Student List Table                         │
│  [Search box]      [Bulk: Present/Absent]   │
│                                              │
│  # | Name | Father | Status | Actions       │
│  1 | Ahmad | Karim | [P][A][L][Clear]      │
│  2 | Bilal | Sami  | [P][A][L][Clear]      │
│                                              │
│            [حاضرۍ ثبت کړئ] ◄─ Click to save │
├─────────────────────────────────────────────┤
│  Download Report Section                    │
│  [Class ▼] [Period ▼] [Dates]              │
│  [📊 Excel راپور ډاونلوډ] ◄─ Download      │
└─────────────────────────────────────────────┘
```

---

## 🎯 Status Button Colors

| Status | Button Color | Use When |
|--------|-------------|----------|
| **Present** | 🟢 Green | Student is in school |
| **Absent** | 🔴 Red | Student didn't come |
| **Leave** | 🟡 Yellow | Student has permission to be absent |
| **Clear** | ⚪ Gray | Remove marking |

---

## 💡 Pro Tips

### Time Savers
1. **Use Bulk Actions**: Mark all present first, then exceptions
2. **QR Method**: Faster for large classes
3. **Auto-Absence**: Let system mark absent automatically

### Best Practices
1. **Daily Reports**: Generate at end of each week
2. **Monthly Reports**: Create for management meetings  
3. **Yearly Reports**: Archive for records

### Shortcuts
- **Tab**: Navigate between fields
- **Enter**: Submit/Save
- **Esc**: Close QR scanner

---

## ❗ Common Issues

### "Settings won't save"
**Solution**: Refresh page, default times should load

### "QR doesn't work for absent student"
**Solution**: Verify date matches, the feature now works

### "Excel file is empty"
**Solution**: Check date range has attendance data

### "PDF button still showing"
**Solution**: Clear browser cache, PDF was removed

---

## 📋 Daily Checklist

**Morning** (8:00 AM)
- [ ] Open QR Scanner OR Manual attendance
- [ ] Students mark attendance
- [ ] Wait for auto-absence at 9:00 AM

**During Day** (9:00 AM+)
- [ ] Late arrivals scan QR code
- [ ] Check statistics dashboard

**End of Day**
- [ ] Review attendance
- [ ] Generate daily report (optional)

**Weekly** (Friday)
- [ ] Download weekly reports
- [ ] Review attendance trends

**Monthly** (Last day)
- [ ] Generate monthly report
- [ ] Share with administration
- [ ] Archive for records

---

## 🔢 Statistics Explained

### Attendance Percentage
```
Present % = (Present Days ÷ Total Days) × 100
```

### Example
- Total Days: 20
- Present: 18
- Absent: 2
- **Attendance %: 90%**

### Color Coding in Reports
- **🟢 Green (≥90%)**: Excellent attendance
- **🟡 Yellow (75-89%)**: Good attendance
- **🔴 Red (<75%)**: Poor attendance

---

## 📞 Quick Help

### Check Logs
**Backend**: `backend/logs/combined.log`  
**Frontend**: Browser console (F12)

### Restart Services
```bash
# Backend
cd backend
npm run dev

# Frontend  
cd Client
npm run dev
```

### Database Check
```bash
cd backend/database
# Check if school.db exists
```

---

## 📚 Documentation Files

1. **ATTENDANCE_SYSTEM_COMPLETE_FIX.md** - Complete technical details
2. **ATTENDANCE_USER_GUIDE.md** - Detailed user manual
3. **ATTENDANCE_FLOW_DIAGRAM.md** - Visual system flows
4. **ATTENDANCE_IMPLEMENTATION_SUMMARY.md** - Executive overview
5. **ATTENDANCE_TESTING_CHECKLIST.md** - Testing procedures
6. **ATTENDANCE_QUICK_REFERENCE.md** - This file

---

## ✅ System Status

| Component | Status | Notes |
|-----------|--------|-------|
| Settings Page | ✅ Working | Default times load correctly |
| Manual Attendance | ✅ Working | Full functionality |
| QR Attendance | ✅ Working | Absent → Present works |
| Auto-Absence | ✅ Working | Runs daily at configured time |
| Excel Reports | ✅ Working | Professional formatting |
| PDF Export | ✅ Removed | Excel only |

---

## 🎓 Training Time

- **Basic User**: 15 minutes
- **Admin User**: 30 minutes
- **Technical Setup**: 1 hour

---

## 📅 Maintenance

### Daily
- ✅ Automatic (cron jobs run)

### Weekly
- Archive old reports (optional)

### Monthly
- Generate monthly reports
- Review attendance trends

### Yearly
- Generate annual reports
- Database backup recommended

---

## 🌟 Key Features

1. ✅ **Smart QR Scanning** - Scan to mark present instantly
2. ✅ **Auto-Absence** - Automatic daily marking
3. ✅ **Flexible Updates** - Late arrivals can scan
4. ✅ **Professional Reports** - Excel with branding
5. ✅ **Real-time Stats** - Live attendance dashboard
6. ✅ **Multi-period Reports** - Daily/Monthly/Yearly

---

## 🚦 Status Indicators

### Online/Offline
- **🟢 Online**: Cloud icon green - all features work
- **🔴 Offline**: Cloud icon red - local features only

### Scanner Status
- **📷 Camera ON**: QR scanner active
- **🔌 USB ACTIVE**: Hardware scanner connected
- **⏸️ READY**: Scanner idle, ready to use

---

## 💾 Data Storage

| Data Type | Storage Location | Retention |
|-----------|-----------------|-----------|
| Attendance Records | SQLite Database | Permanent |
| Settings | Database | Until changed |
| Reports | Downloads folder | User manages |
| Logs | backend/logs/ | Rolling (30 days) |

---

## 🔐 Security Notes

- ✅ Login required for all operations
- ✅ QR codes encrypted and time-limited
- ✅ Audit trail for all changes
- ✅ Session timeout after inactivity

---

**Version**: 2.0.0  
**Last Updated**: June 1, 2026  
**Status**: Production Ready ✅

---

**Print this page for quick desk reference!** 📋
