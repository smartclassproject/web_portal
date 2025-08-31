import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getSchools } from '../../services/schoolService';
import { getSchoolAdmins } from '../../services/adminService';
import { getDevices } from '../../services/deviceService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { School, Device, StatCard } from '../../types';

const attendanceData = [
  { day: 'Mon', attendance: 92 },
  { day: 'Tue', attendance: 95 },
  { day: 'Wed', attendance: 90 },
  { day: 'Thu', attendance: 93 },
  { day: 'Fri', attendance: 91 },
];

const StatCard = ({ title, value, icon, gradient }: StatCard) => (
  <div className={`flex-1 min-w-[180px] bg-gradient-to-tr ${gradient} rounded-xl shadow-md p-5 flex items-center gap-4`}> 
    <div className="bg-white/20 rounded-lg p-3 flex items-center justify-center">{icon}</div>
    <div>
      <div className="text-white text-2xl font-bold">{value}</div>
      <div className="text-white/80 text-sm font-medium">{title}</div>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  // const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch schools, admins, and devices in parallel
        const [schoolsResponse, devicesResponse] = await Promise.all([
          getSchools(),
          getSchoolAdmins(1, 100), // Get all admins for stats
          getDevices(1, 1000) // Get all devices for stats
        ]);

        setSchools(schoolsResponse.data || []);
        setDevices(devicesResponse.data || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate stats from real data
  const totalSchools = schools.length;
  const totalStudents = 0; // TODO: Get from students API when available
  const activeDevices = devices.filter(device => device.isActive).length;

  // Update stats with real data
  const dynamicStats = [
    {
      title: 'Total Schools',
      value: totalSchools,
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      gradient: 'from-green-500 to-green-700',
    },
    {
      title: 'Total Students',
      value: totalStudents,
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      gradient: 'from-blue-400 to-blue-600',
    },
    {
      title: 'Active Devices',
      value: activeDevices,
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      gradient: 'from-purple-400 to-purple-600',
    },
  ];

  // Get recent schools (latest 3)
  const recentSchools = schools.slice(0, 3).map(school => ({
    id: school._id,
    name: school.name,
    location: school.location,
    students: 0, // TODO: Get from students API when available
    status: 'Active'
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-8 max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Overview of all schools and system statistics</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="flex flex-col sm:flex-row gap-6">
          {dynamicStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Attendance Graph */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Attendance This Week</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 14 }} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 14 }} />
              <Tooltip />
              <Line type="monotone" dataKey="attendance" stroke="#43A047" strokeWidth={3} dot={{ r: 6, fill: '#43A047' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Schools Table */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Schools</h2>
            <a href="/admin/schools" className="text-blue-500 text-sm font-medium hover:underline">See All</a>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[500px] max-w-5xl mx-auto w-full text-left">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider">
                  <th className="py-2 font-semibold">School</th>
                  <th className="py-2 font-semibold">Location</th>
                  <th className="py-2 font-semibold">Students</th>
                  <th className="py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSchools.map((school) => (
                  <tr
                    key={school.id}
                    className="group border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition"
                  >
                    <td className="py-3 flex items-center gap-3 font-medium text-gray-900">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-green-400 to-green-600 text-white font-bold shadow-sm">
                        {school.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </span>
                      <span>{school.name}</span>
                    </td>
                    <td className="py-3 text-gray-600">{school.location}</td>
                    <td className="py-3 text-blue-600 font-semibold">{school.students}</td>
                    <td className="py-3">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        {school.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* <ToastContainer /> */}
    </DashboardLayout>
  );
};

export default AdminDashboard; 