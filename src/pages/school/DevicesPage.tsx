import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getSchoolDevices } from '../../services/deviceService';
import type { Device } from '../../types';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  // const [limit, setLimit] = useState(10);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isActiveFilter, setIsActiveFilter] = useState('all');
  
  // Applied filters
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('all');
  const [appliedIsActiveFilter, setAppliedIsActiveFilter] = useState('all');
  const [filtersModified, setFiltersModified] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Build query parameters
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        
        if (appliedSearch) params.append('search', appliedSearch);
        if (appliedStatusFilter !== 'all') params.append('status', appliedStatusFilter);
        if (appliedIsActiveFilter !== 'all') params.append('isActive', appliedIsActiveFilter === 'active' ? 'true' : 'false');

        const devicesResponse = await getSchoolDevices(page, limit, params.toString());
        setDevices(devicesResponse.data || []);
        setTotalPages(devicesResponse.pagination?.pages || 1);
      } catch (err) {
        console.error('Failed to fetch devices data:', err);
        const errorMessage = 'Failed to load RFID devices';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, limit, appliedSearch, appliedStatusFilter, appliedIsActiveFilter]);

  const filteredDevices = devices.filter(device => {
    const matchesSearch = 
      device.classroom.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      device.location.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      device.deviceType?.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      device.serialNumber?.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      device.model?.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      device.manufacturer?.toLowerCase().includes(appliedSearch.toLowerCase());
    
    const matchesStatus = appliedStatusFilter === 'all' || device.status === appliedStatusFilter;
    const matchesActive = appliedIsActiveFilter === 'all' || 
      (appliedIsActiveFilter === 'active' && device.isActive) ||
      (appliedIsActiveFilter === 'inactive' && !device.isActive);
    
    return matchesSearch && matchesStatus && matchesActive;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operational': return 'bg-green-100 text-green-700';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-700';
      case 'Offline': return 'bg-gray-100 text-gray-700';
      case 'Error': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level >= 80) return 'text-green-600';
    if (level >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const applyFilters = () => {
    setAppliedSearch(search);
    setAppliedStatusFilter(statusFilter);
    setIsActiveFilter(isActiveFilter);
    setFiltersModified(false);
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setIsActiveFilter('all');
    setAppliedSearch('');
    setAppliedStatusFilter('all');
    setAppliedIsActiveFilter('all');
    setFiltersModified(false);
  };

  const checkFiltersModified = () => {
    const modified = 
      search !== appliedSearch ||
      statusFilter !== appliedStatusFilter ||
      isActiveFilter !== appliedIsActiveFilter;
    setFiltersModified(modified);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#f7f8fa] py-10 px-2">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading RFID devices...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f7f8fa] py-10 px-2">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10 mt-4">
            <h1 className="text-3xl font-bold text-gray-900">RFID Devices</h1>
            <p className="text-gray-500">View and monitor RFID devices in your school</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search by classroom, location, model..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); checkFiltersModified(); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); checkFiltersModified(); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="Operational">Operational</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Offline">Offline</option>
                  <option value="Error">Error</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Active Status</label>
                <select
                  value={isActiveFilter}
                  onChange={(e) => { setIsActiveFilter(e.target.value); checkFiltersModified(); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Devices</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
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
          {!loading && !error && filteredDevices.length === 0 && (
            <div className="text-center py-12">
              <img 
                src="/no_data.jpg" 
                alt="No data available" 
                className="mx-auto w-64 h-64 object-contain mb-4"
              />
              <p className="text-gray-500 text-lg">No RFID devices found</p>
              <p className="text-gray-400 text-sm mt-2">RFID devices will appear here when they are added to the system</p>
            </div>
          )}

          {/* Devices Table */}
          {!loading && !error && filteredDevices.length > 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-200">
                      <th className="py-3 px-4 font-semibold text-sm">Device</th>
                      <th className="py-3 px-4 font-semibold text-sm">Classroom</th>
                      <th className="py-3 px-4 font-semibold text-sm">Status</th>
                      <th className="py-3 px-4 font-semibold text-sm">Active Status</th>
                      <th className="py-3 px-4 font-semibold text-sm">Battery Level</th>
                      <th className="py-3 px-4 font-semibold text-sm">Last Seen</th>
                      <th className="py-3 px-4 font-semibold text-sm">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevices.map((device) => (
                      <tr key={device._id} className="group border-b last:border-b-0 border-gray-100 hover:bg-green-50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{device.deviceType}</div>
                              <div className="text-xs text-gray-500">{device.serialNumber || 'No Serial'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700 text-sm">
                          <div>
                            <div className="font-medium">{device.classroom}</div>
                            <div className="text-xs text-gray-500">{device.location}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(device.status)}`}>
                            {device.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${device.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {device.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getBatteryColor(device.batteryLevel)}`}
                                style={{ width: `${device.batteryLevel}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs font-medium ${getBatteryColor(device.batteryLevel)}`}>
                              {device.batteryLevel}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700 text-sm">
                          {formatDateTime(device.lastSeen)}
                        </td>
                        <td className="py-3 px-4 text-gray-700 text-sm">
                          <div className="space-y-1">
                            {device.model && (
                              <div className="text-xs">
                                <span className="font-medium">Model:</span> {device.model}
                              </div>
                            )}
                            {device.manufacturer && (
                              <div className="text-xs">
                                <span className="font-medium">Manufacturer:</span> {device.manufacturer}
                              </div>
                            )}
                            {device.firmwareVersion && (
                              <div className="text-xs">
                                <span className="font-medium">Firmware:</span> {device.firmwareVersion}
                              </div>
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
          {!loading && !error && filteredDevices.length > 0 && (
            <div className="flex justify-between items-center mt-6">
              <span className="text-sm text-gray-600">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, filteredDevices.length)} of {filteredDevices.length} devices
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

export default DevicesPage; 