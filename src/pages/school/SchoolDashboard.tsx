import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardSummary, getDashboardGraphs } from '../../services/dashboardService';

const SchoolDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, { total: number; label: string }>>({});
  const [graphs, setGraphs] = useState<Record<string, Array<{ month: string; value: number }>>>({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.schoolId) {
        setError('School ID not found');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const [summaryRes, graphsRes] = await Promise.all([
          getDashboardSummary(),
          getDashboardGraphs(),
        ]);
        setSections(summaryRes.data?.sections || {});
        setGraphs(graphsRes.data?.graphs || {});
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [user?.schoolId]);

  const cardOrder = ['students', 'teachers', 'courses', 'announcements', 'inquiries'];
  const cardGradients: Record<string, string> = {
    students: 'from-green-400 to-green-600',
    teachers: 'from-blue-400 to-blue-600',
    courses: 'from-purple-400 to-purple-600',
    announcements: 'from-amber-400 to-amber-600',
    inquiries: 'from-cyan-400 to-cyan-600',
  };

  const cards = useMemo(() => {
    return cardOrder
      .filter((key) => sections[key])
      .map((key) => ({
        key,
        title: sections[key].label,
        value: sections[key].total,
        gradient: cardGradients[key] || 'from-gray-400 to-gray-600',
      }));
  }, [sections]);

  const graphOrder = ['students', 'teachers', 'courses', 'announcements', 'inquiries'];

  const StatCard = ({ title, value, gradient }: { title: string; value: number; gradient: string }) => (
    <div className={`flex-1 min-w-[180px] bg-gradient-to-tr ${gradient} rounded-xl shadow-md p-5`}>
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
              onClick={() => window.location.reload()}
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
          <button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow">
            Refresh
          </button>
        </div>

        {/* Stat Cards */}
        <div className="flex flex-col sm:flex-row gap-6">
          {cards.map((stat) => (
            <StatCard key={stat.key} title={stat.title} value={stat.value} gradient={stat.gradient} />
          ))}
        </div>

        {graphOrder.filter((key) => Array.isArray(graphs[key]) && graphs[key].length > 0).map((key) => (
          <div key={key} className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{sections[key]?.label || key} Trend</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={graphs[key]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 14 }} />
                <YAxis tick={{ fontSize: 14 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 5, fill: '#2563eb' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default SchoolDashboard; 