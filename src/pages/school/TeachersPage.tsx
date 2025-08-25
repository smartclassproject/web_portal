import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AddTeacherModal from '../../components/forms/AddTeacherModal';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { getSchoolTeachers, createTeacher, updateTeacher, deleteTeacher } from '../../services/teacherService';
import type { Teacher } from '../../types';

const TeachersPage: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    (t.department && t.department.toLowerCase().includes(search.toLowerCase())) ||
    (t.specialization && t.specialization.toLowerCase().includes(search.toLowerCase()))
  );

  const fetchTeachers = async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    setError('');
    try {
      const response = await getSchoolTeachers(page, limit);
      setTeachers(response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch teachers');
      toast.error('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [user?.schoolId, page]);

  const handleAddTeacher = async (teacherData: { name: string; email: string; phone: string; department?: string; specialization?: string; profileUrl?: string }) => {
    if (!user?.schoolId) return;
    setAddLoading(true);
    try {
      await createTeacher({
        schoolId: user.schoolId,
        ...teacherData,
      });
      toast.success('Teacher created successfully!');
      // Refresh the teachers list to get the newly added teacher
      await fetchTeachers();
      // Close the modal only after successful response and refresh
      setIsAddModalOpen(false);
    } catch (err) {
      toast.error('Failed to create teacher');
      // Don't close modal on error - let user try again
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditTeacher = async (teacherData: { name: string; email: string; phone: string; department?: string; specialization?: string; profileUrl?: string }) => {
    if (!selectedTeacher) return;
    setEditLoading(true);
    try {
      await updateTeacher(selectedTeacher._id, teacherData);
      toast.success('Teacher updated successfully!');
      // Refresh the teachers list
      await fetchTeachers();
      setIsEditModalOpen(false);
      setSelectedTeacher(null);
    } catch (err) {
      toast.error('Failed to update teacher');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;
    setDeleteLoading(true);
    try {
      await deleteTeacher(selectedTeacher._id);
      toast.success('Teacher deleted successfully!');
      setTeachers(prev => prev.filter(t => t._id !== selectedTeacher._id));
      setIsDeleteModalOpen(false);
      setSelectedTeacher(null);
    } catch (err) {
      toast.error('Failed to delete teacher');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading teachers...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchTeachers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              disabled={addLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addLoading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Adding...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Teacher
                </>
              )}
            </button>
            <button className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-semibold shadow flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <input
            type="text"
            placeholder="Search teachers by name, email, department, or specialization..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          <select className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent mt-2 md:mt-0">
            <option>All</option>
            <option>Recently Added</option>
            <option>A-Z</option>
          </select>
        </div>

        {teachers.length === 0 ? (
          <div className="text-center py-12">
            <img src="/no_data.jpg" alt="No data" className="w-32 h-32 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first teacher.</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Add Teacher
            </button>
          </div>
        ) : (
          <>
            <div className="relative overflow-x-auto bg-white rounded-xl shadow-md">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Name</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Phone</th>
                    <th className="py-3 px-4 font-semibold">Department</th>
                    <th className="py-3 px-4 font-semibold">Specialization</th>
                    <th className="py-3 px-4 font-semibold">Created At</th>
                    <th className="py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher._id} className="group border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition">
                      <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-400 to-blue-600 text-white font-bold shadow-sm">
                          {teacher.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </span>
                        <span>{teacher.name}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{teacher.email}</td>
                      <td className="py-3 px-4 text-gray-600">{teacher.phone}</td>
                      <td className="py-3 px-4 text-gray-600">{teacher.department || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{teacher.specialization || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(teacher.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <button
                          onClick={() => handleEditClick(teacher)}
                          disabled={editLoading && selectedTeacher?._id === teacher._id}
                          className="text-blue-500 hover:text-blue-700 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {editLoading && selectedTeacher?._id === teacher._id ? (
                            <span className="flex items-center gap-1">
                              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
                              Updating...
                            </span>
                          ) : (
                            'Edit'
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(teacher)}
                          disabled={deleteLoading && selectedTeacher?._id === teacher._id}
                          className="text-red-500 hover:text-red-700 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleteLoading && selectedTeacher?._id === teacher._id ? (
                            <span className="flex items-center gap-1">
                              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
                              Deleting...
                            </span>
                          ) : (
                            'Delete'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>


            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Add Teacher Modal */}
        <AddTeacherModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddTeacher}
          loading={addLoading}
        />

        {/* Edit Teacher Modal */}
        <AddTeacherModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTeacher(null);
          }}
          onSubmit={handleEditTeacher}
          initialData={selectedTeacher}
          isEdit={true}
          loading={editLoading}
        />

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Teacher" size="sm">
          <div className="space-y-6">
            <p className="text-gray-700">
              Are you sure you want to delete Teacher <span className="font-bold">{selectedTeacher?.name}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button 
                type="button" 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedTeacher(null);
                }} 
                disabled={deleteLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteTeacher} 
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default TeachersPage; 