import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { StatCard } from '../../types';

const stats = [
  {
    title: 'Total Students',
    value: 245,
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    gradient: 'from-green-400 to-green-600',
  },
  {
    title: 'Total Teachers',
    value: 18,
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    title: 'Active Devices',
    value: 12,
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
    gradient: 'from-purple-400 to-purple-600',
  },
];

const attendanceData = [
  { day: 'Mon', attendance: 94 },
  { day: 'Tue', attendance: 96 },
  { day: 'Wed', attendance: 92 },
  { day: 'Thu', attendance: 95 },
  { day: 'Fri', attendance: 93 },                                                                       
];

const recentAttendances = [
  { id: '1', student: 'John Doe', course: 'Algorithms', classroom: 'A101', checkInTime: '09:05', status: 'Present' },
  { id: '2', student: 'Jane Smith', course: 'Thermodynamics', classroom: 'B205', checkInTime: '11:10', status: 'Present' },
  { id: '3', student: 'Mike Johnson', course: 'Marketing', classroom: 'C301', checkInTime: '14:02', status: 'Absent' },
  { id: '4', student: 'Sarah Wilson', course: 'Data Structures', classroom: 'A102', checkInTime: '10:15', status: 'Present' },
  { id: '5', student: 'David Brown', course: 'Physics', classroom: 'B206', checkInTime: '13:30', status: 'Present' },
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

const SchoolDashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">School Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back! Here's what's happening at your school today.</p>
          </div>
          {/* <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Add Student
          </button> */}
        </div>

        {/* Stat Cards */}
        <div className="flex flex-col sm:flex-row gap-6">
          {stats.map((stat) => (
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

        {/* Recent Attendances Table */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Attendances</h2>
            <a href="#" className="text-blue-500 text-sm font-medium hover:underline">See All</a>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[500px] max-w-7xl mx-auto w-full text-left">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider">
                  <th className="py-2 font-semibold">Student</th>
                  <th className="py-2 font-semibold">Course</th>
                  <th className="py-2 font-semibold">Classroom</th>
                  <th className="py-2 font-semibold">Check In</th>
                  <th className="py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendances.map((attendance) => (
                  <tr
                    key={attendance.id}
                    className="group border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition"
                  >
                    <td className="py-3 flex items-center gap-3 font-medium text-gray-900">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-400 to-blue-600 text-white font-bold shadow-sm">
                        {attendance.student.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                      </span>
                      <span>{attendance.student}</span>
                    </td>
                    <td className="py-3 text-blue-600 font-semibold">{attendance.course}</td>
                    <td className="py-3 text-green-600 font-semibold">{attendance.classroom}</td>
                    <td className="py-3 text-gray-600">{attendance.checkInTime}</td>
                    <td className="py-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${attendance.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{attendance.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolDashboard; 