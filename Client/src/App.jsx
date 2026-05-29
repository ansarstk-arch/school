import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { AppLayout } from "./components/layout/AppLayout";
import { useStore } from "./store/useStore";
import LoginPage from "./routes/login";
import Dashboard from "./routes/index";
import StudentsPage from "./routes/students";
import StudentDetail from "./routes/students.$id";
import TeachersPage from "./routes/teachers";
import ParentsPage from "./routes/parents";
import StaffPage from "./routes/staff-management";
import ClassesPage from "./routes/classes";
import SubjectsPage from "./routes/subjects";
import StudentAttendancePage from "./routes/attendance-students";
import StaffAttendancePage from "./routes/attendance-staff";
import AttendanceSettingsPage from "./routes/attendance-settings";
import ExamsPage from "./routes/exams";
import CertificatesPage from "./routes/certificates";
import IdCardsPage from "./routes/id-cards";
import ExpensesPage from "./routes/expenses";
import RevenuePage from "./routes/revenue";
import ReportsPage from "./routes/reports";
import SalariesPage from "./routes/salaries";
import MarksExamConfigPage from "./routes/marks-exam-config";
import MarksEntryPage from "./routes/marks-entry";
import MarksListPage from "./routes/marks-list";
import MarksResultPrepPage from "./routes/marks-result-prep";
import ReportCardsPage from "./routes/report-cards";
import PromotionSinglePage from "./routes/promotions-single";
import PromotionClassPage from "./routes/promotions-class";
import PromotionHistoryPage from "./routes/promotions-history";
import SmsParentsPage from "./routes/sms-parents";
import SmsTemplatesPage from "./routes/sms-templates";
import SmsReportsPage from "./routes/sms-reports";
import SmsSettingsPage from "./routes/sms-settings";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">پاڼه ونه موندل شوه</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          هغه پاڼه چې تاسو یې لټوئ شتون نلري یا لیږدول شوې ده.
        </p>
        <a href="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          کور ته ورګرځئ
        </a>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App() {
  const verifyAuth = useStore((s) => s.verifyAuth);

  // Verify authentication on mount
  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />

        {/* Protected — all under /dashboard */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/parents" element={<ParentsPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/attendance/students" element={<StudentAttendancePage />} />
          <Route path="/attendance/staff" element={<StaffAttendancePage />} />
          <Route path="/attendance/settings" element={<AttendanceSettingsPage />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="/marks/config" element={<MarksExamConfigPage />} />
          <Route path="/marks/entry" element={<MarksEntryPage />} />
          <Route path="/marks/list" element={<MarksListPage />} />
          <Route path="/marks/result-prep" element={<MarksResultPrepPage />} />
          <Route path="/marks/itla-nama" element={<ReportCardsPage />} />
          <Route path="/promotions/single" element={<PromotionSinglePage />} />
          <Route path="/promotions/class" element={<PromotionClassPage />} />
          <Route path="/promotions/history" element={<PromotionHistoryPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/id-cards" element={<IdCardsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/revenue" element={<RevenuePage />} />
          <Route path="/salaries" element={<SalariesPage />} />
          <Route path="/advances" element={<Navigate to="/salaries?tab=advances" replace />} />
          <Route path="/sms/parents" element={<SmsParentsPage />} />
          <Route path="/sms/templates" element={<SmsTemplatesPage />} />
          <Route path="/sms/reports" element={<SmsReportsPage />} />
          <Route path="/sms/settings" element={<SmsSettingsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  );
}
