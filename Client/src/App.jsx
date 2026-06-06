import { Routes, Route, Navigate } from "react-router-dom";

import { useEffect } from "react";

import { Toaster } from "sonner";

import { AppLayout } from "./components/layout/AppLayout";

import { useStore } from "./store/useStore";

import { canAccessModule, getDefaultHomeRoute, hasDashboardAccess } from "./lib/permissions";

import { AccessDenied } from "./components/erp/AccessDenied";

import LoginPage from "./routes/login";

import Dashboard from "./routes/index";

import StudentsPage from "./routes/students";

import StudentDetail from "./routes/students.$id";

import TeachersPage from "./routes/teachers";

import ParentNumbersPage from "./routes/parent-numbers";

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

import InventoryPage from "./routes/inventory";

import TeacherDashboard from "./routes/teacher-dashboard";



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



function PermissionRoute({ module, children }) {
  const user = useStore((s) => s.user);

  if (user?.role === "teacher") return <Navigate to="/teacher/dashboard" replace />;

  const allowed =
    user?.role === "admin" ||
    (module === "dashboard"
      ? hasDashboardAccess(user?.permissions, user?.role)
      : canAccessModule(user?.permissions, user?.role, module));

  if (allowed) return children;

  return <AccessDenied />;
}



function TeacherOnly({ children }) {

  const user = useStore((s) => s.user);

  if (user?.role !== "teacher") return <Navigate to={getDefaultHomeRoute(user)} replace />;

  return children;

}



function HomeRedirect() {

  const user = useStore((s) => s.user);

  return <Navigate to={getDefaultHomeRoute(user)} replace />;

}



export default function App() {

  const verifyAuth = useStore((s) => s.verifyAuth);



  useEffect(() => {

    verifyAuth();

  }, [verifyAuth]);



  return (

    <>

      <Routes>

        <Route path="/" element={<LoginPage />} />



        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>

          <Route path="/home" element={<HomeRedirect />} />

          <Route path="/teacher/dashboard" element={<TeacherOnly><TeacherDashboard /></TeacherOnly>} />

          <Route path="/dashboard" element={<PermissionRoute module="dashboard"><Dashboard /></PermissionRoute>} />

          <Route path="/students" element={<PermissionRoute module="students"><StudentsPage /></PermissionRoute>} />

          <Route path="/students/:id" element={<PermissionRoute module="students"><StudentDetail /></PermissionRoute>} />

          <Route path="/teachers" element={<PermissionRoute module="teachers"><TeachersPage /></PermissionRoute>} />

          <Route path="/parents" element={<PermissionRoute module="parents"><ParentNumbersPage /></PermissionRoute>} />

          <Route path="/parent-numbers" element={<PermissionRoute module="parents"><ParentNumbersPage /></PermissionRoute>} />

          <Route path="/staff" element={<PermissionRoute module="staff"><StaffPage /></PermissionRoute>} />

          <Route path="/classes" element={<PermissionRoute module="classes"><ClassesPage /></PermissionRoute>} />

          <Route path="/subjects" element={<PermissionRoute module="subjects"><SubjectsPage /></PermissionRoute>} />

          <Route path="/attendance/students" element={<PermissionRoute module="attendance"><StudentAttendancePage /></PermissionRoute>} />

          <Route path="/attendance/staff" element={<PermissionRoute module="attendance"><StaffAttendancePage /></PermissionRoute>} />

          <Route path="/attendance/settings" element={<PermissionRoute module="attendance"><AttendanceSettingsPage /></PermissionRoute>} />

          <Route path="/exams" element={<PermissionRoute module="exams"><ExamsPage /></PermissionRoute>} />

          <Route path="/marks/config" element={<PermissionRoute module="marks"><MarksExamConfigPage /></PermissionRoute>} />

          <Route path="/marks/entry" element={<PermissionRoute module="marks"><MarksEntryPage /></PermissionRoute>} />

          <Route path="/marks/list" element={<PermissionRoute module="marks"><MarksListPage /></PermissionRoute>} />

          <Route path="/marks/result-prep" element={<PermissionRoute module="marks"><MarksResultPrepPage /></PermissionRoute>} />

          <Route path="/marks/itla-nama" element={<PermissionRoute module="marks"><ReportCardsPage /></PermissionRoute>} />

          <Route path="/promotions/single" element={<PermissionRoute module="promotions"><PromotionSinglePage /></PermissionRoute>} />

          <Route path="/promotions/class" element={<PermissionRoute module="promotions"><PromotionClassPage /></PermissionRoute>} />

          <Route path="/promotions/history" element={<PermissionRoute module="promotions"><PromotionHistoryPage /></PermissionRoute>} />

          <Route path="/certificates" element={<PermissionRoute module="certificates"><CertificatesPage /></PermissionRoute>} />

          <Route path="/id-cards" element={<PermissionRoute module="id_cards"><IdCardsPage /></PermissionRoute>} />

          <Route path="/expenses" element={<PermissionRoute module="expenses"><ExpensesPage /></PermissionRoute>} />

          <Route path="/revenue" element={<PermissionRoute module="revenue"><RevenuePage /></PermissionRoute>} />

          <Route path="/inventory" element={<PermissionRoute module="inventory"><InventoryPage /></PermissionRoute>} />

          <Route path="/salaries" element={<PermissionRoute module="salaries"><SalariesPage /></PermissionRoute>} />

          <Route path="/advances" element={<Navigate to="/salaries?tab=advances" replace />} />

          <Route path="/sms/parents" element={<PermissionRoute module="sms"><SmsParentsPage /></PermissionRoute>} />

          <Route path="/sms/templates" element={<PermissionRoute module="sms"><SmsTemplatesPage /></PermissionRoute>} />

          <Route path="/sms/reports" element={<PermissionRoute module="sms"><SmsReportsPage /></PermissionRoute>} />

          <Route path="/sms/settings" element={<PermissionRoute module="sms"><SmsSettingsPage /></PermissionRoute>} />

          <Route path="/reports" element={<PermissionRoute module="reports"><ReportsPage /></PermissionRoute>} />

        </Route>



        <Route path="*" element={<NotFound />} />

      </Routes>

      <Toaster richColors position="top-right" />

    </>

  );

}

