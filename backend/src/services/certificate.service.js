import { eq, and, inArray } from "drizzle-orm";
import db from "../configs/db/db.config.js";
import {
  students,
  classes,
  exams,
  subjects,
  studentMarks,
  examSubjectConfig,
  subjectClasses,
} from "../db/schema.js";
import {
  DEFAULT_SCHOOL_EXAM_TITLES,
  resolveCertificateExamType,
} from "./schoolExamHelpers.util.js";

const parseAssignedClasses = (assignedClasses) => {
  if (typeof assignedClasses === "string") {
    try {
      return JSON.parse(assignedClasses);
    } catch {
      return [];
    }
  }
  return Array.isArray(assignedClasses) ? assignedClasses : [];
};

/** Exams required for a certificate based on selected exam */
export const getRequiredExamTitles = (exam) => {
  const certType = resolveCertificateExamType(exam);
  if (certType === "FirstTerm") return ["څلور نیمه"];
  if (certType === "Annual") return ["څلور نیمه", "سالانه"];
  return [exam.examTitle];
};

export const getExamsForCertificate = async (exam) => {
  const titles = getRequiredExamTitles(exam);
  return db
    .select()
    .from(exams)
    .where(
      and(
        eq(exams.institutionType, exam.institutionType),
        eq(exams.academicYear, exam.academicYear),
        inArray(exams.examTitle, titles)
      )
    );
};

export const getClassSubjects = async (classId, institutionType, academicYear) =>
  db
    .select({
      subjectId: subjects.id,
      subjectName: subjects.name,
    })
    .from(subjectClasses)
    .innerJoin(subjects, eq(subjectClasses.subjectId, subjects.id))
    .where(
      and(
        eq(subjectClasses.classId, Number(classId)),
        eq(subjects.type, institutionType),
        eq(subjects.academicYear, academicYear)
      )
    )
    .orderBy(subjects.name);

export const isStudentMarksComplete = (subjectMarksMap, classSubjects, requiredExamTitles) => {
  if (classSubjects.length === 0) return false;

  for (const subject of classSubjects) {
    const entry = subjectMarksMap[subject.subjectId];
    if (!entry) return false;

    for (const title of requiredExamTitles) {
      if (title === "څلور نیمه") {
        if (!entry.firstTerm || entry.firstTerm.obtainedMarks === null || entry.firstTerm.obtainedMarks === undefined) {
          return false;
        }
      } else if (title === "سالانه") {
        if (!entry.annual || entry.annual.obtainedMarks === null || entry.annual.obtainedMarks === undefined) {
          return false;
        }
      } else {
        if (!entry.single || entry.single.obtainedMarks === null || entry.single.obtainedMarks === undefined) {
          return false;
        }
      }
    }
  }
  return true;
};

export const buildSubjectMarksMap = (classSubjects, marksData, primaryExamTitle) => {
  const subjectMarksMap = {};

  classSubjects.forEach((subject) => {
    subjectMarksMap[subject.subjectId] = {
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      firstTerm: null,
      annual: null,
      single: null,
    };
  });

  marksData.forEach((mark) => {
    if (!subjectMarksMap[mark.subjectId]) return;

    const payload = {
      obtainedMarks: mark.obtainedMarks,
      totalMarks: mark.totalMarks,
      passingMarks: mark.passingMarks,
      status: mark.status,
    };

    if (mark.examTitle === "څلور نیمه") {
      subjectMarksMap[mark.subjectId].firstTerm = payload;
    } else if (mark.examTitle === "سالانه") {
      subjectMarksMap[mark.subjectId].annual = payload;
    } else if (mark.examTitle === primaryExamTitle) {
      subjectMarksMap[mark.subjectId].single = { ...payload, examTitle: mark.examTitle };
    }
  });

  return subjectMarksMap;
};

export const buildReportCardSummary = (subjectMarksMap, certExamType) => {
  let firstTermTotal = 0;
  let firstTermObtained = 0;
  let annualTotal = 0;
  let annualObtained = 0;
  let overallStatus = "Pass";

  Object.values(subjectMarksMap).forEach((subject) => {
    if (subject.firstTerm) {
      firstTermTotal += subject.firstTerm.totalMarks || 0;
      firstTermObtained += subject.firstTerm.obtainedMarks || 0;
      if (subject.firstTerm.status === "Fail" || subject.firstTerm.status === "Absent") {
        overallStatus = "Fail";
      }
    }
    if (subject.annual) {
      annualTotal += subject.annual.totalMarks || 0;
      annualObtained += subject.annual.obtainedMarks || 0;
      if (subject.annual.status === "Fail" || subject.annual.status === "Absent") {
        overallStatus = "Fail";
      }
    }
    if (subject.single) {
      annualTotal += subject.single.totalMarks || 0;
      annualObtained += subject.single.obtainedMarks || 0;
      if (subject.single.status === "Fail" || subject.single.status === "Absent") {
        overallStatus = "Fail";
      }
    }
  });

  const showBoth = certExamType === "Annual";
  const grandTotal = showBoth ? firstTermTotal + annualTotal : certExamType === "FirstTerm" ? firstTermTotal : annualTotal;
  const grandObtained = showBoth ? firstTermObtained + annualObtained : certExamType === "FirstTerm" ? firstTermObtained : annualObtained;
  const percentage = grandTotal > 0 ? ((grandObtained / grandTotal) * 100).toFixed(2) : 0;

  let grade = "F";
  if (percentage >= 90) grade = "A+";
  else if (percentage >= 80) grade = "A";
  else if (percentage >= 70) grade = "B";
  else if (percentage >= 60) grade = "C";
  else if (percentage >= 50) grade = "D";

  return {
    firstTermTotal,
    firstTermObtained,
    annualTotal,
    annualObtained,
    grandTotal,
    grandObtained,
    percentage: parseFloat(percentage),
    grade,
    status: overallStatus,
  };
};

export const buildClassCertificates = async (exam, classId, { eligibleOnly = true } = {}) => {
  const certExamType = resolveCertificateExamType(exam);
  const requiredExamTitles = getRequiredExamTitles(exam);
  const examsList = await getExamsForCertificate(exam);

  if (examsList.length === 0) {
    return { class: null, certificates: [], skipped: 0, examType: certExamType };
  }

  const examIds = examsList.map((e) => e.id);

  const [classInfo] = await db
    .select({ id: classes.id, name: classes.name, section: classes.section })
    .from(classes)
    .where(eq(classes.id, Number(classId)));

  if (!classInfo) {
    return { class: null, certificates: [], skipped: 0, examType: certExamType };
  }

  const classSubjects = await getClassSubjects(classId, exam.institutionType, exam.academicYear);
  const studentsList = await db
    .select({
      id: students.id,
      rollNumber: students.rollNumber,
      fullName: students.fullName,
      fatherName: students.fatherName,
      grandFatherName: students.grandFatherName,
      image: students.image,
    })
    .from(students)
    .where(eq(students.classId, Number(classId)))
    .orderBy(students.rollNumber);

  if (studentsList.length === 0) {
    return { class: classInfo, certificates: [], skipped: 0, examType: certExamType };
  }

  const studentIds = studentsList.map((s) => s.id);
  const marksData = await db
    .select({
      studentId: studentMarks.studentId,
      subjectId: studentMarks.subjectId,
      obtainedMarks: studentMarks.obtainedMarks,
      status: studentMarks.status,
      examTitle: exams.examTitle,
      totalMarks: examSubjectConfig.totalMarks,
      passingMarks: examSubjectConfig.passingMarks,
    })
    .from(studentMarks)
    .innerJoin(exams, eq(studentMarks.examId, exams.id))
    .leftJoin(
      examSubjectConfig,
      and(
        eq(examSubjectConfig.examId, studentMarks.examId),
        eq(examSubjectConfig.classId, studentMarks.classId),
        eq(examSubjectConfig.subjectId, studentMarks.subjectId)
      )
    )
    .where(
      and(
        inArray(studentMarks.studentId, studentIds),
        inArray(studentMarks.examId, examIds),
        eq(studentMarks.classId, Number(classId))
      )
    );

  let skipped = 0;
  const certificates = [];

  for (const student of studentsList) {
    const studentMarksData = marksData.filter((m) => m.studentId === student.id);
    const subjectMarksMap = buildSubjectMarksMap(classSubjects, studentMarksData, exam.examTitle);
    const complete = isStudentMarksComplete(subjectMarksMap, classSubjects, requiredExamTitles);

    if (eligibleOnly && !complete) {
      skipped += 1;
      continue;
    }

    certificates.push({
      student: {
        id: student.id,
        rollNumber: student.rollNumber,
        fullName: student.fullName,
        fatherName: student.fatherName,
        grandFatherName: student.grandFatherName,
        image: student.image,
      },
      class: {
        name: classInfo.name,
        section: classInfo.section,
      },
      academicYear: exam.academicYear,
      examTitle: exam.examTitle,
      examType: certExamType,
      subjects: Object.values(subjectMarksMap),
      summary: buildReportCardSummary(subjectMarksMap, certExamType),
      marksComplete: complete,
    });
  }

  return {
    class: classInfo,
    certificates,
    skipped,
    examType: certExamType,
    totalStudents: studentsList.length,
  };
};

export const getClassesForExamRecord = async (exam) => {
  const classIds = parseAssignedClasses(exam.assignedClasses).map(Number).filter(Boolean);
  if (classIds.length === 0) return [];

  return db
    .select({
      id: classes.id,
      name: classes.name,
      section: classes.section,
      type: classes.type,
      academicYear: classes.academicYear,
    })
    .from(classes)
    .where(inArray(classes.id, classIds))
    .orderBy(classes.name, classes.section);
};

export { DEFAULT_SCHOOL_EXAM_TITLES, resolveCertificateExamType, parseAssignedClasses };
