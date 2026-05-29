# Promotion Module - Quick Visual Guide

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    STUDENT PROMOTION MODULE                                ║
║                         Quick Reference                                    ║
╚═══════════════════════════════════════════════════════════════════════════╝


┌───────────────────────────────────────────────────────────────────────────┐
│                        3 PROMOTION TYPES                                   │
└───────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
    │  1. INDIVIDUAL      │      │  2. BULK CLASS      │      │  3. YEAR-END        │
    │     PROMOTION       │      │     PROMOTION       │      │    PROMOTION        │
    ├─────────────────────┤      ├─────────────────────┤      ├─────────────────────┤
    │ • One student       │      │ • Entire class      │      │ • All classes       │
    │ • Manual selection  │      │ • Selected students │      │ • All students      │
    │ • Quick process     │      │ • Batch processing  │      │ • Automated rules   │
    │ • Immediate         │      │ • Progress tracking │      │ • End of year       │
    └─────────────────────┘      └─────────────────────┘      └─────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                     INDIVIDUAL PROMOTION FLOW                              │
└───────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ Search       │
    │ Student      │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ Student: Ahmad Khan          │
    │ Current: Grade 5 (School)    │
    │ Roll: 001                    │
    │ Year: 1403                   │
    └──────┬───────────────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ Select Target Class:         │
    │ ○ Grade 6 (Promote)         │
    │ ○ Grade 5 (Repeat)          │
    │ ○ Other                      │
    └──────┬───────────────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ Preview:                     │
    │ From: Grade 5 (1403)        │
    │ To:   Grade 6 (1404)        │
    │                              │
    │ Changes:                     │
    │ • Class: 5 → 6              │
    │ • Year: 1403 → 1404         │
    │ • Section: A → A            │
    └──────┬───────────────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ [Cancel]  [Confirm Promote]  │
    └──────┬───────────────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ ✓ Student promoted!          │
    │ Ahmad is now in Grade 6      │
    └──────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                      BULK PROMOTION FLOW                                   │
└───────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ Select       │
    │ Source Class │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────────────────────────────────┐
    │ Class: Grade 5 (School, 1403)                    │
    │ Total Students: 45                               │
    │                                                  │
    │ Filters:                                         │
    │ [✓] Marks >= 40%  [✓] Attendance >= 75%        │
    └──────┬───────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────────┐
    │ Student List:                                    │
    │                                                  │
    │ [✓] 001 Ahmad Khan      85%  90%  ✓ Eligible   │
    │ [✓] 002 Fatima Ali      92%  95%  ✓ Eligible   │
    │ [✓] 003 Hassan Omar     78%  88%  ✓ Eligible   │
    │ [ ] 004 Zainab Shah     35%  70%  ✗ Not Eligible│
    │ [✓] 005 Bilal Ahmed     88%  92%  ✓ Eligible   │
    │                                                  │
    │ Selected: 40 / 45 students                       │
    │ [Select All] [Select Eligible Only]             │
    └──────┬───────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────────┐
    │ Target Class: Grade 6                            │
    │ Academic Year: 1404                              │
    └──────┬───────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────────┐
    │ Preview Summary:                                 │
    │                                                  │
    │ Total Selected: 40 students                      │
    │ Will be promoted to: Grade 6 (1404)             │
    │                                                  │
    │ Breakdown:                                       │
    │ • Promoted: 40                                   │
    │ • Repeated: 5 (not selected)                    │
    │                                                  │
    │ [Cancel]  [Confirm Bulk Promotion]              │
    └──────┬───────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────────┐
    │ Processing...                                    │
    │ ████████████████░░░░░░░░░░ 65% (26/40)         │
    │                                                  │
    │ Promoting: Hassan Omar                           │
    └──────┬───────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────────┐
    │ ✓ Bulk Promotion Complete!                       │
    │                                                  │
    │ Successfully promoted: 40 students               │
    │ Failed: 0                                        │
    │                                                  │
    │ [View Details] [Download Report]                │
    └──────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                     YEAR-END PROMOTION FLOW                                │
└───────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ Select Year  │
    │ & Institution│
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────────────────────────────────┐
    │ Academic Year: 1403 → 1404                       │
    │ Institution: School                              │
    │                                                  │
    │ Classes to Promote:                              │
    │ [✓] Grade 1 → Grade 2  (50 students)            │
    │ [✓] Grade 2 → Grade 3  (45 students)            │
    │ [✓] Grade 3 → Grade 4  (48 students)            │
    │ [✓] Grade 4 → Grade 5  (42 students)            │
    │ [✓] Grade 5 → Grade 6  (45 students)            │
    │ ...                                              │
    │                                                  │
    │ Total: 500 students across 12 classes            │
    └──────┬───────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────────┐
    │ Promotion Rules:                                 │
    │                                                  │
    │ Minimum Percentage: [40] %                       │
    │ Minimum Attendance: [75] %                       │
    │ [✓] Must pass all subjects                       │
    │ [ ] Auto-promote eligible students               │
    └──────┬───────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────────┐
    │ Preview:                                         │
    │                                                  │
    │ Total Students: 500                              │
    │ Eligible for Promotion: 450 (90%)               │
    │ Will Repeat: 35 (7%)                            │
    │ Detained: 15 (3%)                               │
    │                                                  │
    │ Class-wise breakdown:                            │
    │ Grade 1: 48/50 promoted, 2 repeat               │
    │ Grade 2: 43/45 promoted, 2 repeat               │
    │ ...                                              │
    │                                                  │
    │ [Cancel]  [Start Year-End Promotion]            │
    └──────┬───────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────────┐
    │ Processing Year-End Promotion...                 │
    │                                                  │
    │ Overall Progress:                                │
    │ ████████████░░░░░░░░░░░░░░ 50% (250/500)       │
    │                                                  │
    │ Current: Grade 6 → Grade 7                       │
    │ ████████████████████░░░░░░ 80% (36/45)         │
    │                                                  │
    │ Completed:                                       │
    │ ✓ Grade 1 → Grade 2 (48 students)               │
    │ ✓ Grade 2 → Grade 3 (43 students)               │
    │ ✓ Grade 3 → Grade 4 (46 students)               │
    │ ✓ Grade 4 → Grade 5 (40 students)               │
    │ ✓ Grade 5 → Grade 6 (43 students)               │
    │ ⏳ Grade 6 → Grade 7 (in progress...)            │
    └──────┬───────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────────┐
    │ ✓ Year-End Promotion Complete!                   │
    │                                                  │
    │ Summary:                                         │
    │ • Total Processed: 500 students                  │
    │ • Promoted: 450 (90%)                           │
    │ • Repeated: 35 (7%)                             │
    │ • Detained: 15 (3%)                             │
    │ • Failed: 0 (0%)                                │
    │                                                  │
    │ [View Detailed Report] [Download PDF]           │
    └──────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                        DATABASE STRUCTURE                                  │
└───────────────────────────────────────────────────────────────────────────┘

    studentPromotions                    promotionBatches
    ┌─────────────────────┐             ┌─────────────────────┐
    │ id                  │             │ id                  │
    │ student_id          │             │ batch_name          │
    │ from_class_id       │             │ from_class_id       │
    │ from_academic_year  │             │ to_class_id         │
    │ to_class_id         │             │ total_students      │
    │ to_academic_year    │             │ promoted_count      │
    │ promotion_type      │             │ status              │
    │ promotion_status    │             │ started_at          │
    │ promotion_date      │             │ completed_at        │
    │ based_on            │             └─────────────────────┘
    │ total_marks         │
    │ obtained_marks      │             promotionRules
    │ percentage          │             ┌─────────────────────┐
    │ promoted_by         │             │ id                  │
    │ is_active           │             │ rule_name           │
    └─────────────────────┘             │ institution_type    │
                                        │ from_class_id       │
                                        │ min_percentage      │
                                        │ min_attendance      │
                                        │ auto_promote        │
                                        └─────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                         PROMOTION STATUSES                                 │
└───────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐  Student passed all criteria
    │  PROMOTED   │  → Moved to next class
    └─────────────┘

    ┌─────────────┐  Student failed criteria
    │  REPEATED   │  → Stays in same class
    └─────────────┘

    ┌─────────────┐  Low attendance
    │  DETAINED   │  → Cannot appear in exams
    └─────────────┘

    ┌─────────────┐  Moved to another school
    │ TRANSFERRED │  → Left institution
    └─────────────┘

    ┌─────────────┐  Completed final class
    │  GRADUATED  │  → Finished education
    └─────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                         KEY FEATURES                                       │
└───────────────────────────────────────────────────────────────────────────┘

    ✅ Individual Student Promotion
       • Search by name/roll number
       • Select target class
       • Preview before confirm
       • Instant promotion

    ✅ Bulk Class Promotion
       • Select entire class
       • Filter by criteria (marks, attendance)
       • Multi-select students
       • Batch processing with progress
       • Success/failure summary

    ✅ Year-End Promotion
       • Promote all classes at once
       • Apply promotion rules automatically
       • Process in chunks (performance)
       • Detailed progress tracking
       • Comprehensive reports

    ✅ Promotion Rules
       • Define criteria (marks, attendance)
       • Assign to classes
       • Auto-promotion option
       • Enable/disable rules

    ✅ Rollback Functionality
       • Undo individual promotions
       • Undo bulk promotions
       • Restore student data
       • Audit trail maintained

    ✅ Reports & History
       • Promotion history per student
       • Class-wise promotion reports
       • Summary statistics
       • Export to Excel/PDF


┌───────────────────────────────────────────────────────────────────────────┐
│                      VALIDATION RULES                                      │
└───────────────────────────────────────────────────────────────────────────┘

    ✗ Cannot promote to same class (unless repeating)
    ✗ Cannot promote to lower class (unless manual override)
    ✗ Cannot promote if already promoted this year
    ✗ Target class must exist
    ✗ Target class must be same institution type
    ✗ Cannot promote graduated students
    ✗ Cannot promote transferred students
    ✗ Cannot promote without valid academic year


┌───────────────────────────────────────────────────────────────────────────┐
│                      CLASS PROGRESSION                                     │
└───────────────────────────────────────────────────────────────────────────┘

    SCHOOL:
    Grade 1 → Grade 2 → Grade 3 → ... → Grade 12 → Graduated

    CENTER:
    Level 1 → Level 2 → Level 3 → ... → Completed

    MADRASA:
    Hifz 1 → Hifz 2 → ... → Alim → Completed


┌───────────────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION PHASES                                   │
└───────────────────────────────────────────────────────────────────────────┘

    PHASE 1: MVP (Week 1-2)
    ├─ Database tables
    ├─ Individual promotion
    ├─ Bulk promotion
    └─ Basic validation

    PHASE 2: Core Features (Week 3-4)
    ├─ Frontend pages
    ├─ Promotion forms
    ├─ Preview modals
    └─ History tracking

    PHASE 3: Advanced (Week 5-6)
    ├─ Year-end promotion
    ├─ Promotion rules
    ├─ Rollback functionality
    └─ Progress tracking

    PHASE 4: Reports (Week 7-8)
    ├─ Summary reports
    ├─ Excel/PDF export
    ├─ Charts & statistics
    └─ UI polish

    PHASE 5: Testing (Week 9-10)
    ├─ Integration testing
    ├─ Bug fixes
    ├─ Documentation
    └─ Deployment


┌───────────────────────────────────────────────────────────────────────────┐
│                         API ENDPOINTS                                      │
└───────────────────────────────────────────────────────────────────────────┘

    Promotions:
    POST   /api/v1/promotions/individual
    POST   /api/v1/promotions/bulk
    POST   /api/v1/promotions/year-end
    GET    /api/v1/promotions
    GET    /api/v1/promotions/:id
    PUT    /api/v1/promotions/:id/rollback
    GET    /api/v1/promotions/student/:id/history
    GET    /api/v1/promotions/class/:id/eligible
    POST   /api/v1/promotions/preview

    Batches:
    POST   /api/v1/promotion-batches
    GET    /api/v1/promotion-batches
    GET    /api/v1/promotion-batches/:id
    PUT    /api/v1/promotion-batches/:id/execute
    PUT    /api/v1/promotion-batches/:id/rollback

    Rules:
    POST   /api/v1/promotion-rules
    GET    /api/v1/promotion-rules
    PUT    /api/v1/promotion-rules/:id
    DELETE /api/v1/promotion-rules/:id

    Reports:
    GET    /api/v1/promotions/reports/summary
    GET    /api/v1/promotions/reports/export/excel
    GET    /api/v1/promotions/reports/export/pdf


╔═══════════════════════════════════════════════════════════════════════════╗
║                           READY TO IMPLEMENT!                              ║
╚═══════════════════════════════════════════════════════════════════════════╝

    Next Steps:
    1. ✅ Review and approve plan
    2. ⏳ Start with database schema
    3. ⏳ Build backend APIs
    4. ⏳ Create frontend pages
    5. ⏳ Test thoroughly
    6. ⏳ Deploy to production

    Estimated Timeline: 10 weeks for full implementation
    MVP Ready: 2 weeks
```
