import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/student/fees', label: 'Fees' },
  { to: '/student/materials', label: 'Study Materials' },
  { to: '/student/profile', label: 'Profile' },
  { to: '/student/help', label: 'Help' },
  { to: '/student/privacy-policy', label: 'Privacy Policy' },
  { to: '/student/change-password', label: 'Change Password' },
];

const StudentPortalLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h1 className="text-2xl font-bold text-gray-900">Student Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your fees, materials, profile, and support requests.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default StudentPortalLayout;
