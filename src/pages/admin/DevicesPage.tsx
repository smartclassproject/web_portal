/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import { getDevices, createDevice, updateDevice, deleteDevice } from '../../services/deviceService';
import { getSchools } from '../../services/schoolService';
import type { Device, School } from '../../types';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  // const [limit, setLimit] = useState(10);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [isActiveFilter, setIsActiveFilter] = useState('all');
  
  // Applied filters
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('all');
  const [appliedSchoolFilter, setAppliedSchoolFilter] = useState('all');
  const [appliedIsActiveFilter, setAppliedIsActiveFilter] = useState('all');
  const [filtersModified, setFiltersModified] = useState(false);
  
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    schoolId: '',
    classroom: '',
    location: '',
    deviceType: 'RFID Reader',
    serialNumber: '',
    model: 'RFID-Reader-01',
    manufacturer: '',
    firmwareVersion: '1.0.0',
    status: 'Operational',
    isActive: true,
    notes: ''
  });
  const [errors, setErrors] = useState<any>({});

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
        if (appliedSchoolFilter !== 'all') params.append('schoolId', appliedSchoolFilter);
        if (appliedStatusFilter !== 'all') params.append('status', appliedStatusFilter);
        if (appliedIsActiveFilter !== 'all') params.append('isActive', appliedIsActiveFilter === 'active' ? 'true' : 'false');

        const [devicesResponse, schoolsResponse] = await Promise.all([
          getDevices(page, limit, params.toString()),
          getSchools()
        ]);

        setDevices(devicesResponse.data || []);
        setTotalPages(devicesResponse.pagination?.pages || 1);
        setSchools(schoolsResponse.data || []);
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
  }, [page, limit, appliedSearch, appliedSchoolFilter, appliedStatusFilter, appliedIsActiveFilter]);

  const filteredDevices = devices.filter(device => {
    const matchesSearch = 
      device.classroom.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      device.location.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      device.deviceType?.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      device.serialNumber?.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      device.model?.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      device.manufacturer?.toLowerCase().includes(appliedSearch.toLowerCase());
    
    const matchesStatus = appliedStatusFilter === 'all' || device.status === appliedStatusFilter;
    const matchesSchool = appliedSchoolFilter === 'all' || device.schoolId === appliedSchoolFilter;
    const matchesActive = appliedIsActiveFilter === 'all' || 
      (appliedIsActiveFilter === 'active' && device.isActive) ||
      (appliedIsActiveFilter === 'inactive' && !device.isActive);
    
    return matchesSearch && matchesStatus && matchesSchool && matchesActive;
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const applyFilters = () => {
    setAppliedSearch(search);
    setAppliedStatusFilter(statusFilter);
    setAppliedSchoolFilter(schoolFilter);
    setAppliedIsActiveFilter(isActiveFilter);
    setFiltersModified(false);
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSchoolFilter('all');
    setIsActiveFilter('all');
    setAppliedSearch('');
    setAppliedStatusFilter('all');
    setAppliedSchoolFilter('all');
    setAppliedIsActiveFilter('all');
    setFiltersModified(false);
  };

  const checkFiltersModified = () => {
    const modified = 
      search !== appliedSearch ||
      statusFilter !== appliedStatusFilter ||
      schoolFilter !== appliedSchoolFilter ||
      isActiveFilter !== appliedIsActiveFilter;
    setFiltersModified(modified);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev: any) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.schoolId.trim()) newErrors.schoolId = 'School is required';
    if (!formData.classroom.trim()) newErrors.classroom = 'Classroom is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.deviceType.trim()) newErrors.deviceType = 'Device type is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setAddLoading(true);
      setError(null);
      try {
        await createDevice({
          schoolId: formData.schoolId,
          classroom: formData.classroom,
          location: formData.location,
          deviceType: formData.deviceType,
          serialNumber: formData.serialNumber,
          model: formData.model,
          manufacturer: formData.manufacturer,
          firmwareVersion: formData.firmwareVersion,
          status: formData.status as 'Operational' | 'Maintenance' | 'Offline' | 'Error',
          isActive: formData.isActive,
          batteryLevel: 100,
          signalStrength: 100,
          notes: formData.notes
        });
        
        toast.success('RFID device created successfully');
        
        // Refresh the list
        const devicesResponse = await getDevices(page, limit);
        setDevices(devicesResponse.data || []);
        
        // Reset form
        setFormData({
          schoolId: '',
          classroom: '',
          location: '',
          deviceType: 'RFID Reader',
          serialNumber: '',
          model: 'RFID-Reader-01',
          manufacturer: '',
          firmwareVersion: '1.0.0',
          status: 'Operational',
          isActive: true,
          notes: ''
        });
        setErrors({});
        setIsAddOpen(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError('Failed to create RFID device');
        toast.error('Failed to create RFID device');
      } finally {
        setAddLoading(false);
      }
    }
  };

  const handleEditClick = (device: Device) => {
    setSelectedDevice(device);
    setFormData({
      schoolId: typeof device.schoolId === 'string' ? device.schoolId : device.schoolId._id,
      classroom: device.classroom,
      location: device.location,
      deviceType: device.deviceType,
      serialNumber: device.serialNumber || '',
      model: device.model || 'RFID-Reader-01',
      manufacturer: device.manufacturer || '',
      firmwareVersion: device.firmwareVersion || '1.0.0',
      status: device.status,
      isActive: device.isActive,
      notes: device.notes || ''
    });
    setErrors({});
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && selectedDevice) {
      setEditLoading(true);
      setError(null);
      try {
        await updateDevice(selectedDevice._id, {
          classroom: formData.classroom,
          location: formData.location,
          deviceType: formData.deviceType,
          serialNumber: formData.serialNumber,
          model: formData.model,
          manufacturer: formData.manufacturer,
          firmwareVersion: formData.firmwareVersion,
          status: formData.status as 'Operational' | 'Maintenance' | 'Offline' | 'Error',
          isActive: formData.isActive,
          notes: formData.notes
        });
        
        toast.success('RFID device updated successfully');
        
        // Refresh the list
        const devicesResponse = await getDevices(page, limit);
        setDevices(devicesResponse.data || []);
        
        setIsEditOpen(false);
        setSelectedDevice(null);
        setFormData({
          schoolId: '',
          classroom: '',
          location: '',
          deviceType: 'RFID Reader',
          serialNumber: '',
          model: 'RFID-Reader-01',
          manufacturer: '',
          firmwareVersion: '1.0.0',
          status: 'Operational',
          isActive: true,
          notes: ''
        });
        setErrors({});
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError('Failed to update RFID device');
        toast.error('Failed to update RFID device');
      } finally {
        setEditLoading(false);
      }
    }
  };

  const handleDeleteClick = (device: Device) => {
    setSelectedDevice(device);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDevice) return;
    
    setDeleteLoading(true);
    setError(null);
    try {
      await deleteDevice(selectedDevice._id);
      
      toast.success('RFID device deleted successfully');
      
      // Refresh the list
      const devicesResponse = await getDevices(page, limit);
      setDevices(devicesResponse.data || []);
      
      setIsDeleteOpen(false);
      setSelectedDevice(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError('Failed to delete RFID device');
      toast.error('Failed to delete RFID device');
    } finally {
      setDeleteLoading(false);
    }
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
            <div className="flex gap-2">
              <button 
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow flex items-center gap-2 text-base"
                onClick={() => setIsAddOpen(true)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Device
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
                <select
                  value={schoolFilter}
                  onChange={(e) => { setSchoolFilter(e.target.value); checkFiltersModified(); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Schools</option>
                  {schools.map((school) => (
                    <option key={school._id} value={school._id}>
                      {school.name}
                    </option>
                  ))}
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
                      <th className="py-3 px-4 font-semibold text-sm">School</th>
                      <th className="py-3 px-4 font-semibold text-sm">Classroom</th>
                      <th className="py-3 px-4 font-semibold text-sm">Status</th>
                      <th className="py-3 px-4 font-semibold text-sm">Active Status</th>
                      <th className="py-3 px-4 font-semibold text-sm">Last Seen</th>
                      <th className="py-3 px-4 font-semibold text-sm">Actions</th>
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
                          {typeof device.schoolId === 'string' 
                            ? schools.find(school => school._id === device.schoolId)?.name || 'Unknown School'
                            : device.schoolId?.name || 'Unknown School'
                          }
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
                          {formatDateTime(device.lastSeen)}
                        </td>
                        <td className="py-3 px-4 flex gap-2 text-sm">
                          <button className="text-blue-500 hover:underline">View</button>
                          <button 
                            className="text-green-500 hover:underline"
                            onClick={() => handleEditClick(device)}
                          >
                            Edit
                          </button>
                          <button 
                            className="text-red-500 hover:underline"
                            onClick={() => handleDeleteClick(device)}
                          >
                            Delete
                          </button>
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

          {/* Add Device Modal */}
          <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New RFID Device" size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700 mb-2">School *</label>
                  <select 
                    id="schoolId" 
                    name="schoolId" 
                    value={formData.schoolId} 
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.schoolId ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select a school</option>
                    {schools.map((school) => (
                      <option key={school._id} value={school._id}>{school.name}</option>
                    ))}
                  </select>
                  {errors.schoolId && <p className="mt-1 text-sm text-red-600">{errors.schoolId}</p>}
                </div>
                <div>
                  <label htmlFor="deviceType" className="block text-sm font-medium text-gray-700 mb-2">Device Type *</label>
                  <select 
                    id="deviceType" 
                    name="deviceType" 
                    value={formData.deviceType} 
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.deviceType ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="RFID Reader">RFID Reader</option>
                    <option value="RFID Scanner">RFID Scanner</option>
                  </select>
                  {errors.deviceType && <p className="mt-1 text-sm text-red-600">{errors.deviceType}</p>}
                </div>
                <div>
                  <label htmlFor="classroom" className="block text-sm font-medium text-gray-700 mb-2">Classroom *</label>
                  <input 
                    type="text" 
                    id="classroom" 
                    name="classroom" 
                    value={formData.classroom} 
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.classroom ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g., Room 101"
                  />
                  {errors.classroom && <p className="mt-1 text-sm text-red-600">{errors.classroom}</p>}
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input 
                    type="text" 
                    id="location" 
                    name="location" 
                    value={formData.location} 
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g., Building A, Floor 1"
                  />
                  {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                </div>
                <div>
                  <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                  <input 
                    type="text" 
                    id="serialNumber" 
                    name="serialNumber" 
                    value={formData.serialNumber} 
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., RFID-001-2024"
                  />
                </div>
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <select 
                    id="model" 
                    name="model" 
                    value={formData.model} 
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="RFID-Reader-01">RFID-Reader-01</option>
                    <option value="RFID-Reader-02">RFID-Reader-02</option>
                    <option value="RFID-Reader-Pro">RFID-Reader-Pro</option>
                    <option value="RFID-Reader-Ultra">RFID-Reader-Ultra</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                  <input 
                    type="text" 
                    id="manufacturer" 
                    name="manufacturer" 
                    value={formData.manufacturer} 
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., TechCorp"
                  />
                </div>
                <div>
                  <label htmlFor="firmwareVersion" className="block text-sm font-medium text-gray-700 mb-2">Firmware Version</label>
                  <select 
                    id="firmwareVersion" 
                    name="firmwareVersion" 
                    value={formData.firmwareVersion} 
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="1.0.0">1.0.0</option>
                    <option value="1.1.0">1.1.0</option>
                    <option value="1.2.0">1.2.0</option>
                    <option value="2.0.0">2.0.0</option>
                    <option value="2.1.0">2.1.0</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">Device Status</label>
                  <select 
                    id="status" 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Operational">Operational</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Offline">Offline</option>
                    <option value="Error">Error</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-2">Active Status</label>
                  <select 
                    id="isActive" 
                    name="isActive" 
                    value={formData.isActive.toString()} 
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea 
                  id="notes" 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Additional notes about the device..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)} 
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors" 
                  disabled={addLoading}
                >
                  {addLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Adding...
                    </span>
                  ) : 'Add Device'}
                </button>
              </div>
            </form>
          </Modal>

          {/* Edit Device Modal */}
          <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit RFID Device" size="lg">
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700 mb-2">School *</label>
                  <select 
                    id="schoolId" 
                    name="schoolId" 
                    value={formData.schoolId} 
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.schoolId ? 'border-red-500' : 'border-gray-300'}`}
                    disabled
                  >
                    <option value="">Select a school</option>
                    {schools.map((school) => (
                      <option key={school._id} value={school._id}>{school.name}</option>
                    ))}
                  </select>
                  {errors.schoolId && <p className="mt-1 text-sm text-red-600">{errors.schoolId}</p>}
                </div>
                <div>
                  <label htmlFor="deviceType" className="block text-sm font-medium text-gray-700 mb-2">Device Type *</label>
                  <select 
                    id="deviceType" 
                    name="deviceType" 
                    value={formData.deviceType} 
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.deviceType ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="RFID Reader">RFID Reader</option>
                    <option value="RFID Scanner">RFID Scanner</option>
                    <option value="RFID Antenna">RFID Antenna</option>
                    <option value="RFID Controller">RFID Controller</option>
                  </select>
                  {errors.deviceType && <p className="mt-1 text-sm text-red-600">{errors.deviceType}</p>}
                </div>
                <div>
                  <label htmlFor="classroom" className="block text-sm font-medium text-gray-700 mb-2">Classroom *</label>
                  <input 
                    type="text" 
                    id="classroom" 
                    name="classroom" 
                    value={formData.classroom} 
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.classroom ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g., Room 101"
                  />
                  {errors.classroom && <p className="mt-1 text-sm text-red-600">{errors.classroom}</p>}
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input 
                    type="text" 
                    id="location" 
                    name="location" 
                    value={formData.location} 
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g., Building A, Floor 1"
                  />
                  {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                </div>
                <div>
                  <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                  <input 
                    type="text" 
                    id="serialNumber" 
                    name="serialNumber" 
                    value={formData.serialNumber} 
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., RFID-001-2024"
                  />
                </div>
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <select 
                    id="model" 
                    name="model" 
                    value={formData.model} 
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="RFID-Reader-01">RFID-Reader-01</option>
                    <option value="RFID-Reader-02">RFID-Reader-02</option>
                    <option value="RFID-Reader-Pro">RFID-Reader-Pro</option>
                    <option value="RFID-Reader-Ultra">RFID-Reader-Ultra</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                  <input 
                    type="text" 
                    id="manufacturer" 
                    name="manufacturer" 
                    value={formData.manufacturer} 
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., TechCorp"
                  />
                </div>
                <div>
                  <label htmlFor="firmwareVersion" className="block text-sm font-medium text-gray-700 mb-2">Firmware Version</label>
                  <select 
                    id="firmwareVersion" 
                    name="firmwareVersion" 
                    value={formData.firmwareVersion} 
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="1.0.0">1.0.0</option>
                    <option value="1.1.0">1.1.0</option>
                    <option value="1.2.0">1.2.0</option>
                    <option value="2.0.0">2.0.0</option>
                    <option value="2.1.0">2.1.0</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">Device Status</label>
                  <select 
                    id="status" 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Operational">Operational</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Offline">Offline</option>
                    <option value="Error">Error</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-2">Active Status</label>
                  <select 
                    id="isActive" 
                    name="isActive" 
                    value={formData.isActive.toString()} 
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea 
                  id="notes" 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Additional notes about the device..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setIsEditOpen(false)} 
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors" 
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Updating...
                    </span>
                  ) : 'Update Device'}
                </button>
              </div>
            </form>
          </Modal>

          {/* Delete Device Modal */}
          <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete RFID Device" size="md">
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Delete RFID Device</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to delete this RFID device? This action cannot be undone.
                </p>
                {selectedDevice && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-1">Device Details:</p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Type:</span> {selectedDevice.deviceType}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Classroom:</span> {selectedDevice.classroom}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Location:</span> {selectedDevice.location}
                    </p>
                    {selectedDevice.serialNumber && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Serial:</span> {selectedDevice.serialNumber}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setIsDeleteOpen(false)} 
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors" 
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Deleting...
                    </span>
                  ) : 'Delete Device'}
                </button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
      <ToastContainer />
    </DashboardLayout>
  );
};

export default DevicesPage; 