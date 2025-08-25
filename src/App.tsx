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
import CoursesPage from './pages/school/CoursesPage';
import SchedulesPage from './pages/school/SchedulesPage';
import DevicesPage from './pages/school/DevicesPage';
import AttendancePage from './pages/school/AttendancePage';
import AdminAttendancePage from './pages/admin/AttendancePage';
import AdminDevicesPage from './pages/admin/DevicesPage';
import SchoolsPage from './pages/admin/SchoolsPage';
import SchoolAdminsPage from './pages/admin/SchoolAdminsPage';
import './index.css';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// Route protection component
const RequireAuth: React.FC<{ children: React.ReactNode; role?: 'super_admin' | 'school_admin' }> = ({ children, role }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// After login, redirect to the correct dashboard
const RedirectToDashboard: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'super_admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/school/dashboard" replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/setup-password" element={<SetupPasswordPage />} />
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
            path="/school/dashboard"
            element={
              <RequireAuth role="school_admin">
                <SchoolDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/school/teachers"
            element={
              <RequireAuth role="school_admin">
                <TeachersPage />
              </RequireAuth>
            }
          />
          <Route
            path="/school/students"
            element={
              <RequireAuth role="school_admin">
                <StudentsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/school/majors"
            element={
              <RequireAuth role="school_admin">
                <MajorsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/school/courses"
            element={
              <RequireAuth role="school_admin">
                <CoursesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/school/schedules"
            element={
              <RequireAuth role="school_admin">
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
              <RequireAuth role="school_admin">
                <AttendancePage />
              </RequireAuth>
            }
          />
          {/* Add more protected routes here for other pages */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
