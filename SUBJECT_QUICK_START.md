# 🚀 Subject Module - Quick Start Guide (5 Minutes)

## ⚡ Get Started in 5 Minutes

### Step 1: Start Backend (1 minute)
```bash
cd backend
npm run dev
```
✅ Backend running on `http://localhost:3000`

### Step 2: Start Frontend (1 minute)
```bash
cd Client
npm run dev
```
✅ Frontend running on `http://localhost:5173`

### Step 3: Navigate to Subjects (1 minute)
1. Open `http://localhost:5173` in browser
2. Login with your credentials
3. Click "مضامین" in the sidebar

### Step 4: Create Your First Subject (2 minutes)
1. Click "نوی مضمون" button
2. Fill in the form:
   - **Subject Name**: ریاضي
   - **Type**: ښوونځی
   - **Classes**: Select at least one class
3. Click "ثبتول"
4. ✅ Subject created!

---

## 📋 What You Can Do

### Create Subject
```
Click "نوی مضمون" → Fill form → Click "ثبتول"
```

### View Subject
```
Click eye icon in table → See details
```

### Edit Subject
```
Click pencil icon → Modify → Click "ثبتول"
```

### Delete Subject
```
Click trash icon → Confirm → Subject deleted
```

### Filter Subjects
```
Use FilterBar → Enter name or select type → Results update
```

### Paginate
```
Use page buttons at bottom → Navigate pages
```

---

## 🎯 Common Tasks

### Task 1: Create Math Subject for School
```
1. Click "نوی مضمون"
2. Name: ریاضي
3. Type: ښوونځی
4. Classes: Select ټولګی ۸, ټولګی ۹
5. Click "ثبتول"
```

### Task 2: Find All Physics Subjects
```
1. Use FilterBar
2. Enter: فزیک
3. Results show all physics subjects
```

### Task 3: Edit Subject Type
```
1. Click pencil icon
2. Change type
3. Classes auto-update
4. Click "ثبتول"
```

### Task 4: Delete Subject
```
1. Click trash icon
2. Confirm deletion
3. Subject removed
```

---

## ⚠️ Important Notes

### Required Fields
- ✅ Subject Name (required)
- ✅ Institution Type (required)
- ✅ At least 1 Class (required)

### Validation Rules
- Subject name: 2-100 characters
- Only Pashto, Dari, or English
- No duplicate subjects (same name + type + year)
- Classes must match type and year

### Error Messages
All error messages are in Pashto:
- "د مضمون نوم اړین دی" = Subject name required
- "لږترلږه یو ټولګی وټاکئ" = Select at least one class
- "دا مضمون دمخه شتون لري" = Subject already exists

---

## 🔧 Troubleshooting

### "Page not loading"
```
✓ Check backend is running
✓ Check frontend is running
✓ Check browser console for errors
✓ Verify API URL in .env
```

### "Classes not showing"
```
✓ Verify classes exist in database
✓ Check institution type is selected
✓ Check academic year matches
✓ Refresh page
```

### "Cannot create subject"
```
✓ Check all required fields filled
✓ Check validation errors
✓ Check subject doesn't already exist
✓ Check at least one class selected
```

### "Database error"
```
✓ Restart backend: npm run dev
✓ Check database connection
✓ Check database file exists
```

---

## 📚 Learn More

### Quick Reference
→ Read: `SUBJECT_QUICK_REFERENCE.md` (3 min)

### Detailed Guide
→ Read: `SUBJECT_MODULE_GUIDE.md` (15 min)

### Setup & Deployment
→ Read: `SUBJECT_SETUP_DEPLOYMENT.md` (15 min)

### Architecture
→ Read: `SUBJECT_ARCHITECTURE_DIAGRAMS.md` (10 min)

---

## 🎓 Key Concepts

### Subject
A course or subject taught in school (e.g., Math, Physics, English)

### Institution Type
Where the subject is taught:
- **ښوونځی** = School
- **مرکز** = Center
- **مدرسه** = Madrasa

### Classes
Groups of students (e.g., Class 8, Class 9)

### Academic Year
The school year (e.g., 1404)

---

## ✅ Verification Checklist

Before using, verify:
- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] Can access subjects page
- [ ] Can see "نوی مضمون" button
- [ ] Can create a subject
- [ ] Can see subject in table
- [ ] Can edit subject
- [ ] Can delete subject
- [ ] Filtering works
- [ ] Pagination works

---

## 🎯 Next Steps

### After Creating First Subject
1. Create more subjects
2. Try filtering
3. Try editing
4. Try deleting
5. Read documentation

### When Ready to Deploy
1. Read: `SUBJECT_SETUP_DEPLOYMENT.md`
2. Follow: Deployment checklist
3. Test: All functionality
4. Deploy: To production

---

## 💡 Pro Tips

### Tip 1: Use Filters
Use FilterBar to quickly find subjects instead of scrolling

### Tip 2: Check Validation
Read error messages carefully - they tell you what's wrong

### Tip 3: Select Classes Carefully
Make sure classes match the institution type

### Tip 4: Use Pagination
With many subjects, use pagination to navigate

### Tip 5: Backup Database
Before making changes, backup your database

---

## 🆘 Need Help?

### Quick Questions
→ Check: `SUBJECT_QUICK_REFERENCE.md`

### Detailed Help
→ Check: `SUBJECT_MODULE_GUIDE.md`

### Setup Issues
→ Check: `SUBJECT_SETUP_DEPLOYMENT.md`

### Debugging
→ Check: Browser console and server logs

---

## 🎉 You're Ready!

You now have everything to:
- ✅ Create subjects
- ✅ View subjects
- ✅ Edit subjects
- ✅ Delete subjects
- ✅ Filter subjects
- ✅ Paginate subjects

**Start using the Subject Module now! 🚀**

---

## 📞 Quick Reference

| Action | Steps |
|--------|-------|
| Create | Click "نوی مضمون" → Fill form → "ثبتول" |
| View | Click eye icon |
| Edit | Click pencil icon → Modify → "ثبتول" |
| Delete | Click trash icon → Confirm |
| Filter | Use FilterBar → Enter criteria |
| Paginate | Use page buttons |

---

## 🔗 Important Links

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **API**: http://localhost:3000/api/v1/subjects
- **Database**: backend/database/school.db

---

**Version**: 1.0.0  
**Status**: Ready to Use  
**Time to First Subject**: ~5 minutes

**Happy creating! 🎓**
