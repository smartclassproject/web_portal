import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getDashboardSummary, getDashboardGraphs, getCreatorAnalytics } from '../../services/dashboardService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { StatCard } from '../../types';

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
  const [sections, setSections] = useState<Record<string, { total: number; label: string }>>({});
  const [graphs, setGraphs] = useState<Record<string, Array<{ month: string; value: number }>>>({});
  const [creatorCounts, setCreatorCounts] = useState<Array<{ role: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, graphsRes, creatorRes] = await Promise.all([
          getDashboardSummary(),
          getDashboardGraphs(),
          getCreatorAnalytics(),
        ]);
        setSections(summaryRes.data?.sections || {});
        setGraphs(graphsRes.data?.graphs || {});
        setCreatorCounts(creatorRes.data?.countsByCreatorRole || []);
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

  const dynamicStats = [
    {
      title: sections.students?.label || 'Total Students',
      value: sections.students?.total || 0,
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      gradient: 'from-green-500 to-green-700',
    },
    {
      title: sections.teachers?.label || 'Total Teachers',
      value: sections.teachers?.total || 0,
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      gradient: 'from-blue-400 to-blue-600',
    },
    {
      title: sections.courses?.label || 'Total Courses',
      value: sections.courses?.total || 0,
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      gradient: 'from-purple-400 to-purple-600',
    },
  ];

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

        {/* Module Graphs */}
        {Object.entries(graphs).map(([key, data]) => (
          <div key={key} className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{sections[key]?.label || key} Trend</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 14 }} />
                <YAxis tick={{ fontSize: 14 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 6, fill: '#2563eb' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}

        {/* Creator Analytics */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Created By Analytics</h2>
          <div className="overflow-x-auto">
            <table className="min-w-[500px] max-w-5xl mx-auto w-full text-left">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider">
                  <th className="py-2 font-semibold">Creator Role</th>
                  <th className="py-2 font-semibold">Total Records</th>
                </tr>
              </thead>
              <tbody>
                {creatorCounts.map((row) => (
                  <tr
                    key={row.role}
                    className="group border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition"
                  >
                    <td className="py-3 font-medium text-gray-900">{row.role}</td>
                    <td className="py-3 text-blue-600 font-semibold">{row.count}</td>
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