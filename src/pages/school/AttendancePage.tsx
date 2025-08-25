import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getSchoolAttendance } from '../../services/attendanceService';
import type { Attendance } from '../../types';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AttendancePage: React.FC = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  
  // Applied filters (what's actually being used)
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('all');
  const [appliedDateFilter, setAppliedDateFilter] = useState('');
  
  // Track if filters have been modified
  const [filtersModified, setFiltersModified] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const attendanceResponse = await getSchoolAttendance(page, limit);
        setAttendance(attendanceResponse.data || []);
        setTotalPages(attendanceResponse.pagination?.pages || 1);
      } catch (err) {
        console.error('Failed to fetch attendance data:', err);
        const errorMessage = 'Failed to load attendance records';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, limit]);

  const filteredAttendance = attendance.filter(record => {
    const matchesSearch = 
      record.student?.name?.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      record.course?.name?.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      record.classroom.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      record.cardId?.toLowerCase().includes(appliedSearch.toLowerCase());
    
    const matchesStatus = appliedStatusFilter === 'all' || record.status === appliedStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-700';
      case 'Absent':
        return 'bg-red-100 text-red-700';
      case 'Late':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Apply filters function
  const applyFilters = () => {
    setAppliedSearch(search);
    setAppliedStatusFilter(statusFilter);
    setAppliedDateFilter(dateFilter);
    setFiltersModified(false);
  };

  // Reset filters function
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDateFilter('');
    setAppliedSearch('');
    setAppliedStatusFilter('all');
    setAppliedDateFilter('');
    setFiltersModified(false);
  };

  // Check if filters are modified
  const checkFiltersModified = () => {
    const modified = 
      search !== appliedSearch ||
      statusFilter !== appliedStatusFilter ||
      dateFilter !== appliedDateFilter;
    setFiltersModified(modified);
  };

  // Handle filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    checkFiltersModified();
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    checkFiltersModified();
  };

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
    checkFiltersModified();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#f7f8fa] py-10 px-2">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading attendance records...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f7f8fa] py-6 px-2">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
            <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
            <p className="text-gray-500">RFID-based attendance tracking system</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search by student, course, classroom..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={handleDateFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Filter Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                {filtersModified && (
                  <span className="text-sm text-orange-600 font-medium">
                    ⚠️ Filters modified - click "Apply Filters" to update results
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  disabled={!filtersModified}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-gray-600">{error}</p>
            </div>
          )}

          {/* No Data State */}
          {!loading && !error && filteredAttendance.length === 0 && (
            <div className="text-center py-12">
              <img 
                src="/no_data.jpg" 
                alt="No data available" 
                className="mx-auto w-64 h-64 object-contain mb-4"
              />
              <p className="text-gray-500 text-lg">No attendance records found</p>
              <p className="text-gray-400 text-sm mt-2">Attendance records will appear here when students check in using RFID cards</p>
            </div>
          )}

          {/* Attendance Table */}
          {!loading && !error && filteredAttendance.length > 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-200">
                      <th className="py-3 px-4 font-semibold text-sm">Student</th>
                      <th className="py-3 px-4 font-semibold text-sm">Course</th>
                      <th className="py-3 px-4 font-semibold text-sm">Classroom</th>
                      <th className="py-3 px-4 font-semibold text-sm">Check-in Time</th>
                      <th className="py-3 px-4 font-semibold text-sm">Status</th>
                      <th className="py-3 px-4 font-semibold text-sm">Session Date</th>
                      <th className="py-3 px-4 font-semibold text-sm">Card ID</th>
                      <th className="py-3 px-4 font-semibold text-sm">Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendance.map((record) => (
                      <tr key={record._id} className="group border-b last:border-b-0 border-gray-100 hover:bg-green-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900 text-sm">
                          {record.student?.name || 'Unknown Student'}
                        </td>
                        <td className="py-3 px-4 text-gray-700 text-sm">
                          {record.course?.name || 'Unknown Course'}
                        </td>
                        <td className="py-3 px-4 text-gray-700 text-sm">
                          {record.classroom}
                        </td>
                        <td className="py-3 px-4 text-gray-700 text-sm">
                          {formatDateTime(record.checkInTime)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 text-sm">
                          {formatDate(record.sessionDate)}
                        </td>
                        <td className="py-3 px-4 text-gray-700 text-sm font-mono">
                          {record.cardId || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-700 text-sm">
                          <div>
                            <div className="font-medium">{record.deviceId}</div>
                            {record.deviceLocation && (
                              <div className="text-xs text-gray-500">{record.deviceLocation}</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && filteredAttendance.length > 0 && (
            <div className="flex justify-between items-center mt-6">
              <span className="text-sm text-gray-600">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, filteredAttendance.length)} of {filteredAttendance.length} records
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50 text-base"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50 text-base"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AttendancePage; 