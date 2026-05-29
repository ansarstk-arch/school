import { currentShamsiYear, getSessions } from "@/lib/afghan-date";

export const APP_NAME = "سرتاچ حیفي خصوصي ښونځي او وړکتون";
export const APP_TAGLINE = "۹ ناحیه کندهار";

export const SCHOOL_INFO = {
  name: "سرتاچ حیفي خصوصي ښونځي او وړکتون",
  address: "۹ ناحیه کندهار",
  phone: "۰۷۹۹۹۹۹۹۹۹",
};

export const SESSIONS = getSessions(3);
export const ACTIVE_SESSION = String(currentShamsiYear());

export const STUDENT_TYPES = ["ښوونځی", "مرکز"];

export const GRADES = [
  { min: 90, grade: "اعلا", gpa: 4.0 },
  { min: 80, grade: "ډېر ښه", gpa: 3.7 },
  { min: 70, grade: "ښه", gpa: 3.3 },
  { min: 60, grade: "منځنی", gpa: 3.0 },
  { min: 50, grade: "بسنه", gpa: 2.5 },
  { min: 40, grade: "کمزوری", gpa: 2.0 },
  { min: 0, grade: "ناکام", gpa: 0.0 },
];

export function calcGrade(percentage) {
  return GRADES.find((g) => percentage >= g.min) || GRADES[GRADES.length - 1];
}

export const DEFAULT_SUBJECTS = [
  "ریاضي", "فزیک", "کیمیا", "بیولوژي", "انګلیسي",
  "کمپیوټر", "اسلامیات", "تاریخ", "جغرافیه",
  "پښتو", "دري", "هنر",
];
