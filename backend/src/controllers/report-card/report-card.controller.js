import { eq, and, inArray, sql } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import {
  students,
  classes,
  exams,
  subjects,
  studentMarks,
  examSubjectConfig,
  subjectClasses,
} from "../../db/schema.js";
import ApiError from "../../utils/ApiError.util.js";

// ─── GET REPORT CARD DATA FOR SINGLE STUDENT ──────────────────────────────────
export const getStudentReportCard = asyncHandler(async (req, res) => {
  const { studentId, examType, academicYear } = req.query;

  if (!studentId || !examType || !academicYear) {
    throw new ApiError(400, "د زده کوونکي پېژندنه، د امتحان ډول او تعلیمي کال اړین دي");
  }

  // Get student details
  const [student] = await db
    .select({
      id: students.id,
      rollNumber: students.rollNumber,
      fullName: students.fullName,
      fatherName: students.fatherName,
      classId: students.classId,
      image: students.image,
    })
    .from(students)
    .where(eq(students.id, Number(studentId)));

  if (!student) {
    throw new ApiError(404, "زده کوونکی ونه موندل شو");
  }

  // Get class details
  const [classInfo] = await db
    .select({
      id: classes.id,
      name: classes.name,
      section: classes.section,
    })
    .from(classes)
    .where(eq(classes.id, student.classId));

  if (!classInfo) {
    throw new ApiError(404, "ټولګی ونه موندل شو");
  }

  // Determine which exams to fetch based on examType
  let examTitles = [];
  if (examType === "FirstTerm") {
    examTitles = ["څلور نیمه"];
  } else if (examType === "Annual") {
    examTitles = ["څلور نیمه", "سالانه"];
  } else {
    throw new ApiError(400, "د امتحان ډول باید FirstTerm یا Annual وي");
  }

  // Get exams
  const examsList = await db
    .select()
    .from(exams)
    .where(
      and(
        eq(exams.institutionType, "School"),
        eq(exams.academicYear, academicYear),
        inArray(exams.examTitle, examTitles)
      )
    );

  if (examsList.length === 0) {
    throw new ApiError(404, "امتحانونه ونه موندل شول");
  }

  const examIds = examsList.map((e) => e.id);

  // Get all subjects for this class
  const classSubjects = await db
    .select({
      subjectId: subjects.id,
      subjectName: subjects.name,
    })
    .from(subjectClasses)
    .innerJoin(subjects, eq(subjectClasses.subjectId, subjects.id))
    .where(
      and(
        eq(subjectClasses.classId, classInfo.id),
        eq(subjects.type, "School"),
        eq(subjects.academicYear, academicYear)
      )
    )
    .orderBy(subjects.name);

  // Get all marks for this student in these exams
  const marksData = await db
    .select({
      examId: studentMarks.examId,
      subjectId: studentMarks.subjectId,
      obtainedMarks: studentMarks.obtainedMarks,
      status: studentMarks.status,
      examTitle: exams.examTitle,
      subjectName: subjects.name,
      totalMarks: examSubjectConfig.totalMarks,
      passingMarks: examSubjectConfig.passingMarks,
    })
    .from(studentMarks)
    .innerJoin(exams, eq(studentMarks.examId, exams.id))
    .innerJoin(subjects, eq(studentMarks.subjectId, subjects.id))
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
        eq(studentMarks.studentId, Number(studentId)),
        inArray(studentMarks.examId, examIds)
      )
    );

  // Organize marks by subject and exam
  const subjectMarksMap = {};
  
  classSubjects.forEach((subject) => {
    subjectMarksMap[subject.subjectId] = {
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      firstTerm: null,
      annual: null,
    };
  });

  marksData.forEach((mark) => {
    if (subjectMarksMap[mark.subjectId]) {
      if (mark.examTitle === "څلور نیمه") {
        subjectMarksMap[mark.subjectId].firstTerm = {
          obtainedMarks: mark.obtainedMarks,
          totalMarks: mark.totalMarks,
          passingMarks: mark.passingMarks,
          status: mark.status,
        };
      } else if (mark.examTitle === "سالانه") {
        subjectMarksMap[mark.subjectId].annual = {
          obtainedMarks: mark.obtainedMarks,
          totalMarks: mark.totalMarks,
          passingMarks: mark.passingMarks,
          status: mark.status,
        };
      }
    }
  });

  // Calculate totals
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
  });

  const grandTotal = firstTermTotal + annualTotal;
  const grandObtained = firstTermObtained + annualObtained;
  const percentage = grandTotal > 0 ? ((grandObtained / grandTotal) * 100).toFixed(2) : 0;

  // Determine grade based on percentage
  let grade = "F";
  if (percentage >= 90) grade = "A+";
  else if (percentage >= 80) grade = "A";
  else if (percentage >= 70) grade = "B";
  else if (percentage >= 60) grade = "C";
  else if (percentage >= 50) grade = "D";

  res.respond(200, "د زده کوونکي اطلاع نامه ترلاسه شوه", {
    student: {
      id: student.id,
      rollNumber: student.rollNumber,
      fullName: student.fullName,
      fatherName: student.fatherName,
      image: student.image,
    },
    class: {
      name: classInfo.name,
      section: classInfo.section,
    },
    academicYear,
    examType,
    subjects: Object.values(subjectMarksMap),
    summary: {
      firstTermTotal,
      firstTermObtained,
      annualTotal,
      annualObtained,
      grandTotal,
      grandObtained,
      percentage: parseFloat(percentage),
      grade,
      status: overallStatus,
    },
  });
});

// ─── GET REPORT CARDS FOR ENTIRE CLASS ────────────────────────────────────────
export const getClassReportCards = asyncHandler(async (req, res) => {
  const { classId, examType, academicYear } = req.query;

  if (!classId || !examType || !academicYear) {
    throw new ApiError(400, "د ټولګي پېژندنه، د امتحان ډول او تعلیمي کال اړین دي");
  }

  // Get class details
  const [classInfo] = await db
    .select({
      id: classes.id,
      name: classes.name,
      section: classes.section,
    })
    .from(classes)
    .where(eq(classes.id, Number(classId)));

  if (!classInfo) {
    throw new ApiError(404, "ټولګی ونه موندل شو");
  }

  // Get all students in this class
  const studentsList = await db
    .select({
      id: students.id,
      rollNumber: students.rollNumber,
      fullName: students.fullName,
      fatherName: students.fatherName,
      image: students.image,
    })
    .from(students)
    .where(eq(students.classId, Number(classId)))
    .orderBy(students.rollNumber);

  if (studentsList.length === 0) {
    throw new ApiError(404, "په دې ټولګي کې زده کوونکي ونه موندل شول");
  }

  // Determine which exams to fetch
  let examTitles = [];
  if (examType === "FirstTerm") {
    examTitles = ["څلور نیمه"];
  } else if (examType === "Annual") {
    examTitles = ["څلور نیمه", "سالانه"];
  } else {
    throw new ApiError(400, "د امتحان ډول باید FirstTerm یا Annual وي");
  }

  // Get exams
  const examsList = await db
    .select()
    .from(exams)
    .where(
      and(
        eq(exams.institutionType, "School"),
        eq(exams.academicYear, academicYear),
        inArray(exams.examTitle, examTitles)
      )
    );

  if (examsList.length === 0) {
    throw new ApiError(404, "امتحانونه ونه موندل شول");
  }

  const examIds = examsList.map((e) => e.id);

  // Get all subjects for this class
  const classSubjects = await db
    .select({
      subjectId: subjects.id,
      subjectName: subjects.name,
    })
    .from(subjectClasses)
    .innerJoin(subjects, eq(subjectClasses.subjectId, subjects.id))
    .where(
      and(
        eq(subjectClasses.classId, classInfo.id),
        eq(subjects.type, "School"),
        eq(subjects.academicYear, academicYear)
      )
    )
    .orderBy(subjects.name);

  // Get all marks for all students in these exams
  const studentIds = studentsList.map((s) => s.id);
  const marksData = await db
    .select({
      studentId: studentMarks.studentId,
      examId: studentMarks.examId,
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
        inArray(studentMarks.examId, examIds)
      )
    );

  // Organize data per student
  const reportCards = studentsList.map((student) => {
    const subjectMarksMap = {};

    classSubjects.forEach((subject) => {
      subjectMarksMap[subject.subjectId] = {
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        firstTerm: null,
        annual: null,
      };
    });

    const studentMarksData = marksData.filter((m) => m.studentId === student.id);

    studentMarksData.forEach((mark) => {
      if (subjectMarksMap[mark.subjectId]) {
        if (mark.examTitle === "څلور نیمه") {
          subjectMarksMap[mark.subjectId].firstTerm = {
            obtainedMarks: mark.obtainedMarks,
            totalMarks: mark.totalMarks,
            passingMarks: mark.passingMarks,
            status: mark.status,
          };
        } else if (mark.examTitle === "سالانه") {
          subjectMarksMap[mark.subjectId].annual = {
            obtainedMarks: mark.obtainedMarks,
            totalMarks: mark.totalMarks,
            passingMarks: mark.passingMarks,
            status: mark.status,
          };
        }
      }
    });

    // Calculate totals
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
    });

    const grandTotal = firstTermTotal + annualTotal;
    const grandObtained = firstTermObtained + annualObtained;
    const percentage = grandTotal > 0 ? ((grandObtained / grandTotal) * 100).toFixed(2) : 0;

    let grade = "F";
    if (percentage >= 90) grade = "A+";
    else if (percentage >= 80) grade = "A";
    else if (percentage >= 70) grade = "B";
    else if (percentage >= 60) grade = "C";
    else if (percentage >= 50) grade = "D";

    return {
      student: {
        id: student.id,
        rollNumber: student.rollNumber,
        fullName: student.fullName,
        fatherName: student.fatherName,
        image: student.image,
      },
      subjects: Object.values(subjectMarksMap),
      summary: {
        firstTermTotal,
        firstTermObtained,
        annualTotal,
        annualObtained,
        grandTotal,
        grandObtained,
        percentage: parseFloat(percentage),
        grade,
        status: overallStatus,
      },
    };
  });

  res.respond(200, "د ټولګي اطلاع نامې ترلاسه شوې", {
    class: {
      name: classInfo.name,
      section: classInfo.section,
    },
    academicYear,
    examType,
    reportCards,
  });
});

export default {
  getStudentReportCard,
  getClassReportCards,
};
