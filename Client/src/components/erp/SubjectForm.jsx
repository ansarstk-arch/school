import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { ShamsiYearPicker } from "@/components/erp/ShamsiYearPicker";
import { ACTIVE_SESSION } from "@/constants";
import * as subjectApi from "@/data/subjectApi";

const SEL = "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring";
const F = ({ label, opt, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}{opt && <span className="opacity-40 ml-1">(اختیاري)</span>}</span>
    {children}
  </label>
);

const TYPES = [
  { value: "School", label: "ښوونځی" },
  { value: "Center", label: "مرکز" },
  { value: "Madrasa", label: "مدرسه" },
];

export function SubjectForm({ subject, errors, setErrors }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("School");
  const [classIds, setClassIds] = useState([]);
  const [academicYear, setAcademicYear] = useState(ACTIVE_SESSION);
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Initialize form when subject changes
  useEffect(() => {
    if (subject && subject.id) {
      setName(subject.name || "");
      setType(subject.type || "School");
      setClassIds(subject.classIds || []);
      setAcademicYear(subject.academicYear || ACTIVE_SESSION);
      fetchClasses(subject.type || "School");
    } else {
      setName("");
      setType("School");
      setClassIds([]);
      setAcademicYear(ACTIVE_SESSION);
      fetchClasses("School");
    }
  }, [subject]);

  const fetchClasses = async (typeValue) => {
    try {
      setLoadingClasses(true);
      const response = await subjectApi.getClassesByType(typeValue, ACTIVE_SESSION);
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setType(newType);
    setClassIds([]);
    if (errors.type) {
      setErrors((prev) => ({ ...prev, type: "" }));
    }
    fetchClasses(newType);
  };

  const handleYearChange = (year) => {
    setAcademicYear(year);
    if (errors.academicYear) {
      setErrors((prev) => ({ ...prev, academicYear: "" }));
    }
  };

  const toggleClass = (id) => {
    setClassIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((c) => c !== id);
      } else {
        return [...prev, id];
      }
    });
    if (errors.classIds) {
      setErrors((prev) => ({ ...prev, classIds: "" }));
    }
  };

  const selectAllClasses = () => {
    setClassIds(classes.map(c => c.id));
    if (errors.classIds) {
      setErrors((prev) => ({ ...prev, classIds: "" }));
    }
  };

  const deselectAllClasses = () => {
    setClassIds([]);
  };

  const allSelected = classes.length > 0 && classIds.length === classes.length;

  // Expose form data to parent
  useEffect(() => {
    // Store in a way parent can access
    if (window.__subjectFormData) {
      window.__subjectFormData = { name, type, classIds, academicYear };
    }
  }, [name, type, classIds, academicYear]);

  // Initialize global reference
  useEffect(() => {
    window.__subjectFormData = { name, type, classIds, academicYear };
    return () => {
      delete window.__subjectFormData;
    };
  }, []);

  return (
    <div className="space-y-3">
      {/* Subject Name */}
      <div>
        <F label="د مضمون نوم">
          <Input
            value={name}
            handleChanges={handleNameChange}
            placeholder="د مضمون نوم"
          />
        </F>
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
      </div>

      {/* Institution Type */}
      <div>
        <F label="ډول">
          <select
            value={type}
            onChange={handleTypeChange}
            className={SEL}
          >
            {TYPES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </F>
        {errors.type && <p className="text-xs text-destructive mt-1">{errors.type}</p>}
      </div>

      {/* Academic Year */}
      <div>
        <F label="تعلیمي کال">
          <ShamsiYearPicker
            value={academicYear}
            onChange={handleYearChange}
            placeholder="تعلیمي کال غوره کړئ"
            error={errors.academicYear}
          />
        </F>
      </div>

      {/* Class Multi-Select */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">
          ټولګي وټاکئ
          {classIds.length > 0 && <span className="ml-1 text-primary font-medium">({classIds.length} ټاکل شوي)</span>}
        </p>

        {loadingClasses ? (
          <div className="border border-border rounded p-3 text-center text-xs text-muted-foreground">
            د ټولګيو په ترلاسه کولو کې...
          </div>
        ) : classes.length === 0 ? (
          <div className="border border-border rounded p-3 text-center text-xs text-muted-foreground">
            د دې ډول لپاره هیڅ ټولګی نشته
          </div>
        ) : (
          <div className="border border-border rounded divide-y divide-border max-h-48 overflow-y-auto">
            {/* Select All Header */}
            <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted cursor-pointer bg-muted/50 font-medium">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    selectAllClasses();
                  } else {
                    deselectAllClasses();
                  }
                }}
                className="rounded border-input accent-primary"
              />
              <span className="text-sm flex-1">ټول ټولګي</span>
            </label>

            {/* Individual Classes */}
            {classes.map((c) => {
              const checked = classIds.includes(c.id);
              return (
                <label key={c.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleClass(c.id)}
                    className="rounded border-input accent-primary"
                  />
                  <span className="text-sm flex-1">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.section}</span>
                </label>
              );
            })}
          </div>
        )}
        {errors.classIds && <p className="text-xs text-destructive mt-1">{errors.classIds}</p>}
      </div>
    </div>
  );
}
