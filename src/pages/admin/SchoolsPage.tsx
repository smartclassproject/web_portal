import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SchoolModal from '../../components/forms/EditSchoolModal';
import DeleteSchoolModal from '../../components/forms/DeleteSchoolModal';
import type { School } from '../../types';
import { getSchools, createSchool, updateSchool, deleteSchool } from '../../services/schoolService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SchoolsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [addEditLoading, setAddEditLoading] = useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const schoolsResponse = await getSchools(page, limit);
        setSchools(schoolsResponse.data || []);
      } catch (err) {
        console.error('Failed to fetch schools data:', err);
        const errorMessage = 'Failed to load schools';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, limit]);

  const handleSchoolSubmit = async (school: Partial<School>) => {
    setAddEditLoading(true);
    setError(null);
    try {
      if (modalMode === 'edit' && selectedSchool && school.name && school.location) {
        await updateSchool(selectedSchool._id, { name: school.name, location: school.location });
        toast.success('School updated successfully');
      } else if (school.name && school.location) {
        await createSchool({ name: school.name, location: school.location });
        toast.success('School added successfully');
      }
      // Refresh list
      const schoolsResponse = await getSchools(page, limit);
      setSchools(schoolsResponse.data || []);
      setIsSchoolModalOpen(false);
      setSelectedSchool(null);
    } catch (err) {
      setError('Failed to save school');
      toast.error('Failed to save school');
    } finally {
      setAddEditLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    setError(null);
    try {
      await deleteSchool(id);
      toast.success('School deleted successfully');
      // Refresh list
      const schoolsResponse = await getSchools(page, limit);
      setSchools(schoolsResponse.data || []);
      setIsDeleteOpen(false);
      setSelectedSchool(null);
    } catch (err) {
      setError('Failed to delete school');
      toast.error('Failed to delete school');
    } finally {
      setDeleteLoading(false);
    }
  };
  const filtered = schools.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.location.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#f7f8fa] py-10 px-2">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading schools...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <div className="space-y-8 max-w-6xl mx-auto">
      {/* <div className="max-w-5xl mx-auto space-y-8"> */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
          <div className="flex gap-2">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded-lg font-semibold shadow flex items-center gap-2" onClick={() => { setModalMode('create'); setSelectedSchool(null); setIsSchoolModalOpen(true); }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Add School
            </button>
            <button className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 text-sm rounded-lg font-semibold shadow flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <input
            type="text"
            placeholder="Search schools..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
          />
          <select className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent mt-2 md:mt-0">
            <option>All</option>
            <option>Recently Added</option>
            <option>A-Z</option>
          </select>
        </div>
        {/* {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading schools...</p>
          </div>
        )} */}
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
        <div className="overflow-x-auto bg-white rounded-xl shadow-md">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-200">
                <th className="py-3 px-4 font-semibold text-sm">Name</th>
                <th className="py-3 px-4 font-semibold text-sm">Location</th>
                <th className="py-3 px-4 font-semibold text-sm">Created At</th>
                <th className="py-3 px-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((school, key) => (
                <tr key={school._id} className="group border-b last:border-b-0 border-gray-100 hover:bg-green-50 transition">
                  <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-3 text-sm">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-green-400 to-green-600 text-white font-bold shadow-sm">
                      {school.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </span>
                    <span>{school.name}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-sm">{school.location}</td>
                  <td className="py-3 px-4 text-gray-600 text-sm">{school.createdAt}</td>
                  <td className="py-3 px-4 flex gap-2 text-sm">
                    <button className="text-blue-500 hover:underline" onClick={() => { setSelectedSchool(school); setModalMode('edit'); setIsSchoolModalOpen(true); }}>Edit</button>
                    <button className="text-red-500 hover:underline" onClick={() => { setSelectedSchool(school); setIsDeleteOpen(true); }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <SchoolModal
        isOpen={isSchoolModalOpen}
        onClose={() => { setIsSchoolModalOpen(false); setSelectedSchool(null); }}
        onSubmit={handleSchoolSubmit}
        mode={modalMode}
        school={modalMode === 'edit' ? selectedSchool ?? undefined : undefined}
        loading={addEditLoading}
      />
      {selectedSchool && <DeleteSchoolModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} school={selectedSchool} onDelete={() => handleDelete(selectedSchool._id)} loading={deleteLoading} />}
    </DashboardLayout>
  );
};

export default SchoolsPage; 