import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { StatCard, Student, Teacher, Device, Attendance } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getSchoolStudents } from '../../services/studentService';
import { getSchoolTeachers } from '../../services/teacherService';
import { getSchoolDevices } from '../../services/deviceService';
import { getSchoolAttendance } from '../../services/attendanceService';

// Utility function to get initials from name
const getInitials = (name: string) => {
  return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
};

// Utility function to format time
const formatTime = (timeString: string) => {
  if (!timeString) return '';
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

// Utility function to get day abbreviation
const getDayAbbr = (day: string) => {
  const dayMap: { [key: string]: string } = {
    'Monday': 'Mon',
    'Tuesday': 'Tue', 
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri',
    'Saturday': 'Sat',
    'Sunday': 'Sun'
  };
  return dayMap[day] || day;
};

const SchoolDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard data state
  const [stats, setStats] = useState<StatCard[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [recentAttendances, setRecentAttendances] = useState<Attendance[]>([]);
  
  // Raw data state
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);

  // Fetch dashboard data
  const fetchDashboardData = async (isRefresh = false) => {
    if (!user?.schoolId) {
      setError('School ID not found');
      setIsLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch data in parallel
      const [studentsResponse, teachersResponse, devicesResponse, attendanceResponse] = await Promise.all([
        getSchoolStudents(1, 1000), // Get all students for counting
        getSchoolTeachers(1, 1000), // Get all teachers for counting
        getSchoolDevices(1, 1000), // Get all devices for counting
        getSchoolAttendance(1, 100) // Get recent attendance records
      ]);

      const studentsData = studentsResponse.data || [];
      const teachersData = teachersResponse.data || [];
      const devicesData = devicesResponse.data || [];
      const attendanceData = attendanceResponse.data || [];

      setStudents(studentsData);
      setTeachers(teachersData);
      setDevices(devicesData);
      setAttendanceRecords(attendanceData);

      // Update stats
      const updatedStats: StatCard[] = [
        {
          title: 'Total Students',
          value: studentsData.length,
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          ),
          gradient: 'from-green-400 to-green-600',
        },
        {
          title: 'Total Teachers',
          value: teachersData.length,
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
          gradient: 'from-blue-400 to-blue-600',
        },
        {
          title: 'Active Devices',
          value: devicesData.filter((device: Device) => device.isActive && device.status === 'Operational').length,
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          ),
          gradient: 'from-purple-400 to-purple-600',
        },
      ];

      setStats(updatedStats);

      // Process attendance data for the chart
      const today = new Date();
      const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const weekData = weekDays.map(day => {
        const dayAttendances = attendanceData.filter((att: Attendance) => 
          att.sessionDay === day && 
          new Date(att.sessionDate).toDateString() === today.toDateString()
        );
        
        if (dayAttendances.length === 0) {
          return { day: getDayAbbr(day), attendance: 0 };
        }

        const presentCount = dayAttendances.filter((att: Attendance) => att.status === 'Present').length;
        const totalCount = dayAttendances.length;
        const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
        
        return { day: getDayAbbr(day), attendance: attendancePercentage };
      });

      setAttendanceData(weekData);

      // Set recent attendances (last 5)
      const recentAtts = attendanceData
        .sort((a: Attendance, b: Attendance) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
        .slice(0, 5);
      
      setRecentAttendances(recentAtts);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.schoolId]);

  const StatCard = ({ title, value, icon, gradient }: StatCard) => (
    <div className={`flex-1 min-w-[180px] bg-gradient-to-tr ${gradient} rounded-xl shadow-md p-5 flex items-center gap-4`}> 
      <div className="bg-white/20 rounded-lg p-3 flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-white text-2xl font-bold">{value}</div>
        <div className="text-white/80 text-sm font-medium">{title}</div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-8 max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Dashboard</div>
            <div className="text-red-500 mb-4">{error}</div>
            <button 
              onClick={() => fetchDashboardData(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Try Again
            </button>
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
            <h1 className="text-3xl font-bold text-gray-900">School Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back! Here's what's happening at your school today.</p>
          </div>
          <button 
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2 rounded-lg font-semibold shadow flex items-center gap-2"
          >
            {isRefreshing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
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
          {attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 14 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 14 }} />
                <Tooltip />
                <Line type="monotone" dataKey="attendance" stroke="#43A047" strokeWidth={3} dot={{ r: 6, fill: '#43A047' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <div className="text-lg font-medium mb-2">No attendance data available</div>
              <div className="text-sm">Attendance records will appear here once students start checking in.</div>
            </div>
          )}
        </div>

        {/* Recent Attendances Table */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Attendances</h2>
            <a href="/attendance" className="text-blue-500 text-sm font-medium hover:underline">See All</a>
          </div>
          {recentAttendances.length > 0 ? (
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
                      key={attendance._id}
                      className="group border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition"
                    >
                      <td className="py-3 flex items-center gap-3 font-medium text-gray-900">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-400 to-blue-600 text-white font-bold shadow-sm">
                          {attendance.student ? getInitials(attendance.student.name) : 'N/A'}
                        </span>
                        <span>{attendance.student?.name || 'Unknown Student'}</span>
                      </td>
                      <td className="py-3 text-blue-600 font-semibold">
                        {attendance.course?.name || 'Unknown Course'}
                      </td>
                      <td className="py-3 text-green-600 font-semibold">{attendance.classroom}</td>
                      <td className="py-3 text-gray-600">
                        {formatTime(attendance.checkInTime)}
                      </td>
                      <td className="py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          attendance.status === 'Present' 
                            ? 'bg-green-100 text-green-700' 
                            : attendance.status === 'Late'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {attendance.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <div className="text-lg font-medium mb-2">No recent attendance records</div>
              <div className="text-sm">Attendance records will appear here once students start checking in.</div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolDashboard; 