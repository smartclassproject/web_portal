import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import SetupPasswordPage from './pages/SetupPasswordPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import SchoolDashboard from './pages/school/SchoolDashboard';
import TeachersPage from './pages/school/TeachersPage';
import StudentsPage from './pages/school/StudentsPage';
import MajorsPage from './pages/school/MajorsPage';
import ClassesPage from './pages/school/ClassesPage';
import CoursesPage from './pages/school/CoursesPage';
import SchedulesPage from './pages/school/SchedulesPage';
import DevicesPage from './pages/school/DevicesPage';
import AttendancePage from './pages/school/AttendancePage';
import AdminAttendancePage from './pages/admin/AttendancePage';
import AdminDevicesPage from './pages/admin/DevicesPage';
import SchoolsPage from './pages/admin/SchoolsPage';
import SchoolAdminsPage from './pages/admin/SchoolAdminsPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherCalendarPage from './pages/teacher/TeacherCalendarPage';
import TeacherExamsPage from './pages/teacher/TeacherExamsPage';
import TeacherLessonsPage from './pages/teacher/TeacherLessonsPage';
import TeacherStudentsPage from './pages/teacher/TeacherStudentsPage';
import TeacherMaterialsPage from './pages/teacher/TeacherMaterialsPage';
import TeacherTermResultsPage from './pages/teacher/TeacherTermResultsPage';
import SchoolSettingsPage from './pages/school/SchoolSettingsPage';
import SchoolAccountPage from './pages/school/SchoolAccountPage';
import SchoolStaffAccountPage from './pages/school/SchoolStaffAccountPage';
import TeacherAccountPage from './pages/teacher/TeacherAccountPage';
import AdminAccountPage from './pages/admin/AdminAccountPage';
import ReportCardsPage from './pages/school/ReportCardsPage';
import FeesPage from './pages/school/FeesPage';
import AnnouncementsPage from './pages/school/AnnouncementsPage';
import InquiriesPage from './pages/school/InquiriesPage';
import SchoolStaffPage from './pages/school/SchoolStaffPage';
import './index.css';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import TeacherSetPasswordPage from './pages/TeacherSetPasswordPage';
import StudentPortalLayout from './pages/student/StudentPortalLayout';
import StudentFeesPage from './pages/student/StudentFeesPage';
import StudentMaterialsPage from './pages/student/StudentMaterialsPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import StudentHelpPage from './pages/student/StudentHelpPage';
import StudentPrivacyPolicyPage from './pages/student/StudentPrivacyPolicyPage';
import StudentChangePasswordPage from './pages/student/StudentChangePasswordPage';
import NotAuthorizedPage from './pages/NotAuthorizedPage';

// Route protection component
const RequireAuth: React.FC<{
  children: React.ReactNode;
  role?: 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'school_staff';
  roles?: Array<'super_admin' | 'school_admin' | 'teacher' | 'student' | 'school_staff'>;
  moduleKey?: string;
}> = ({ children, role, roles, moduleKey }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  const allowedRoles = roles || (role ? [role] : []);
  if (allowedRoles.length && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  if (moduleKey && user.role === 'school_staff' && !(user.modules || []).includes(moduleKey)) {
    return <Navigate to="/not-authorized" replace />;
  }
  return <>{children}</>;
};

// After login, redirect to the correct dashboard
const RedirectToDashboard: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'super_admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (user.role === 'student') return <Navigate to="/student/fees" replace />;
  if (user.role === 'school_staff') return <Navigate to="/school/dashboard" replace />;
  return <Navigate to="/school/dashboard" replace />;
};

const SchoolAccountRoute: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'school_staff') {
    return <SchoolStaffAccountPage />;
  }
  return <SchoolAccountPage />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/setup-password" element={<SetupPasswordPage />} />
          <Route path="/teacher/set-password" element={<TeacherSetPasswordPage />} />
          <Route path="/not-authorized" element={<NotAuthorizedPage />} />
          <Route path="/" element={<RedirectToDashboard />} />
          <Route
            path="/admin/dashboard"
            element={
              <RequireAuth role="super_admin">
                <AdminDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/schools"
            element={
              <RequireAuth role="super_admin">
                <SchoolsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/school-admins"
            element={
              <RequireAuth role="super_admin">
                <SchoolAdminsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/attendance"
            element={
              <RequireAuth role="super_admin">
                <AdminAttendancePage />
              </RequireAuth>
            }
          />
           <Route
            path="/admin/devices"
            element={
              <RequireAuth role="super_admin">
                <AdminDevicesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/account"
            element={
              <RequireAuth role="super_admin">
                <AdminAccountPage />
              </RequireAuth>
            }
          />
          <Route
            path="/school/dashboard"
            element={
              <RequireAuth roles={['school_admin', 'school_staff']}>
                <SchoolDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/school/teachers"
            element={
              <RequireAuth roles={['school_admin', 'school_staff']} moduleKey="teachers">
                <TeachersPage />
              </RequireAuth>
            }
          />
          <Route
            path="/school/students"
            element={
              <RequireAuth roles={['school_admin', 'school_staff']} moduleKey="students">
                <StudentsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/school/majors"
            element={
              <RequireAuth roles={['school_admin', 'school_staff']} moduleKey="courses">
                <MajorsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/school/classes"
            element={
              <RequireAuth roles={['school_admin', 'school_staff']} moduleKey="courses">
                <ClassesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/school/courses"
            element={
              <RequireAuth roles={['school_admin', 'school_staff']} moduleKey="courses">
                <CoursesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/school/schedules"
            element={
              <RequireAuth roles={['school_admin', 'school_staff']} moduleKey="courses">
                <SchedulesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/school/devices"
            element={
              <RequireAuth role="school_admin">
                <DevicesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/school/attendance"
            element={
              <RequireAuth roles={['school_admin', 'school_staff']} moduleKey="reports">
                <AttendancePage />
              </RequireAuth>
            }
          />
          <Route
            path="/school/report-cards"
            element={
              <RequireAuth roles={['school_admin', 'school_staff']} moduleKey="reports">
                <ReportCardsPage />
              </RequireAuth>
            }
          />

          <Route
            path="/school/fees"
            element={
              <RequireAuth roles={['school_admin', 'school_staff']} moduleKey="finance">
                <FeesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/school/announcements"
            element={
              <RequireAuth roles={['school_admin', 'school_staff']} moduleKey="announcements">
                <AnnouncementsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/school/inquiries"
            element={
              <RequireAuth roles={['school_admin', 'school_staff']} moduleKey="inquiries">
                <InquiriesPage />
              </RequireAuth>
            }
          />

          <Route
            path="/school/staff"
            element={
              <RequireAuth role="school_admin">
                <SchoolStaffPage />
              </RequireAuth>
            }
          />

          <Route
            path="/school/settings"
            element={
              <RequireAuth role="school_admin">
                <SchoolSettingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/school/account"
            element={
              <RequireAuth roles={['school_admin', 'school_staff']}>
                <SchoolAccountRoute />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher/dashboard"
            element={
              <RequireAuth role="teacher">
                <TeacherDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher/calendar"
            element={
              <RequireAuth role="teacher">
                <TeacherCalendarPage />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher/exams"
            element={
              <RequireAuth role="teacher">
                <TeacherExamsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher/lessons"
            element={
              <RequireAuth role="teacher">
                <TeacherLessonsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher/materials"
            element={
              <RequireAuth role="teacher">
                <TeacherMaterialsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher/students"
            element={
              <RequireAuth role="teacher">
                <TeacherStudentsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher/term-results"
            element={
              <RequireAuth role="teacher">
                <TeacherTermResultsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher/account"
            element={
              <RequireAuth role="teacher">
                <TeacherAccountPage />
              </RequireAuth>
            }
          />
          <Route
            path="/student"
            element={
              <RequireAuth role="student">
                <StudentPortalLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/student/fees" replace />} />
            <Route path="fees" element={<StudentFeesPage />} />
            <Route path="materials" element={<StudentMaterialsPage />} />
            <Route path="profile" element={<StudentProfilePage />} />
            <Route path="help" element={<StudentHelpPage />} />
            <Route path="privacy-policy" element={<StudentPrivacyPolicyPage />} />
            <Route path="change-password" element={<StudentChangePasswordPage />} />
          </Route>
          {/* Add more protected routes here for other pages */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
