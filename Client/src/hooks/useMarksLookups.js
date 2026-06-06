import { useState, useEffect, useMemo, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { currentShamsiYear } from "@/lib/afghan-date";
import * as examApi from "@/data/examApi";
import { getAllClasses } from "@/data/classApi";
import * as marksApi from "@/data/marksApi";

export function parseAssignedClasses(exam) {
  if (!exam?.assignedClasses) return [];
  if (typeof exam.assignedClasses === "string") {
    try {
      return JSON.parse(exam.assignedClasses).map(Number);
    } catch {
      return [];
    }
  }
  return (exam.assignedClasses || []).map(Number);
}

export function useMarksLookups({ academicYear: yearProp, examId, institutionType } = {}) {
  const session = useStore((s) => s.session);
  const academicYear = yearProp || session || String(currentShamsiYear());

  const [exams, setExams] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const loadExams = useCallback(async () => {
    setLoadingExams(true);
    try {
      const res = await examApi.getAllExams({
        academicYear,
        institutionType,
        limit: 200,
      });
      if (res.success) setExams(res.data.exams || []);
    } catch {
      setExams([]);
    } finally {
      setLoadingExams(false);
    }
  }, [academicYear, institutionType]);

  const loadClasses = useCallback(async () => {
    if (!institutionType) {
      setAllClasses([]);
      return;
    }
    setLoadingClasses(true);
    try {
      const res = await getAllClasses({
        type: institutionType,
        academicYear,
        limit: 200,
      });
      if (res.success) setAllClasses(res.data.classes || []);
    } catch {
      setAllClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }, [institutionType, academicYear]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const selectedExam = useMemo(
    () => exams.find((e) => String(e.id) === String(examId)),
    [exams, examId]
  );

  const classes = useMemo(() => {
    if (!examId || !selectedExam) return allClasses;
    const ids = parseAssignedClasses(selectedExam);
    if (ids.length === 0) return allClasses;
    return allClasses.filter((c) => ids.includes(Number(c.id)));
  }, [allClasses, examId, selectedExam]);

  const loadSubjectsForClass = useCallback(
    async (classId, instType, onlyConfigured = false) => {
      if (!examId || !classId || !instType) {
        setSubjects([]);
        return [];
      }
      setLoadingSubjects(true);
      try {
        const res = await marksApi.getSubjectsForExamClass(examId, classId, instType);
        if (res.success) {
          let list = res.data.subjects || [];
          if (onlyConfigured) list = list.filter((s) => s.config);
          const mapped = list.map((s) => ({
            value: String(s.subjectId),
            label: s.subjectName,
            config: s.config,
          }));
          setSubjects(mapped);
          return mapped;
        }
      } catch {
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
      return [];
    },
    [examId]
  );

  return {
    academicYear,
    exams,
    classes,
    allClasses,
    subjects,
    setSubjects,
    selectedExam,
    loadingExams,
    loadingClasses,
    loadingSubjects,
    loadExams,
    loadClasses,
    loadSubjectsForClass,
    parseAssignedClasses,
  };
}
