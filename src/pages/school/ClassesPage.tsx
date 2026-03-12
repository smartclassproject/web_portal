import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AddClassModal from '../../components/forms/AddClassModal';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { getClasses, createClass, updateClass, deleteClass } from '../../services/classService';
import type { ClassItem } from '../../services/classService';

const ClassesPage: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(search.toLowerCase()))
  );

  const fetchClasses = async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const response = await getClasses();
      setClasses(response.data || []);
    } catch (err) {
      toast.error('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [user?.schoolId]);

  const handleAddClass = async (data: { name: string; code?: string }) => {
    if (!user?.schoolId) return;
    setAddLoading(true);
    try {
      await createClass(data);
      toast.success('Class created successfully!');
      await fetchClasses();
      setIsAddModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create class');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditClass = async (data: { name: string; code?: string }) => {
    if (!selectedClass) return;
    setEditLoading(true);
    try {
      await updateClass(selectedClass._id, data);
      toast.success('Class updated successfully!');
      await fetchClasses();
      setIsEditModalOpen(false);
      setSelectedClass(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update class');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    setDeleteLoading(true);
    try {
      await deleteClass(selectedClass._id);
      toast.success('Class deleted successfully!');
      setClasses((prev) => prev.filter((c) => c._id !== selectedClass._id));
      setIsDeleteModalOpen(false);
      setSelectedClass(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete class');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading && classes.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Add Class
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Search classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {classes.length === 0 ? 'No classes yet. Add a class to get started.' : 'No classes match your search.'}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Code</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900 font-medium">{c.name}</td>
                    <td className="py-3 px-4 text-gray-600">{c.code || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedClass(c);
                          setIsEditModalOpen(true);
                        }}
                        className="text-blue-600 hover:underline mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClass(c);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <AddClassModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddClass}
          loading={addLoading}
        />
        <AddClassModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedClass(null);
          }}
          onSubmit={handleEditClass}
          initialData={selectedClass}
          isEdit
          loading={editLoading}
        />
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedClass(null);
          }}
          title="Delete Class"
          size="sm"
        >
          <div className="space-y-6">
            <p className="text-gray-700">
              Are you sure you want to delete class <strong>{selectedClass?.name}</strong>? This will fail if any
              students are assigned to this class.
            </p>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedClass(null);
                }}
                disabled={deleteLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteClass}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2"
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
      <ToastContainer position="top-right" autoClose={3000} />
    </DashboardLayout>
  );
};

export default ClassesPage;
