/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AddMajorModal from '../../components/forms/AddMajorModal';
import Modal from '../../components/ui/Modal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getSchoolMajors, createMajor, updateMajor, deleteMajor } from '../../services/majorService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { Major } from '../../types';

const MajorsPage: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  // const [limit, setLimit] = useState(10);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);

  const filtered = majors.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.code.toLowerCase().includes(search.toLowerCase())
  );

  const fetchMajors = async () => {
    if (!user?.schoolId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await getSchoolMajors(page, limit);
      setMajors(response.data || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (err) {
      const errorMessage = 'Failed to fetch majors';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMajors();
  }, [user?.schoolId, page, limit]);

  const handleAddMajor = async (majorData: { name: string; code: string; description: string }) => {
    if (!user?.schoolId) return;

    setAddLoading(true);
    try {
      const newMajor = await createMajor({
        schoolId: user.schoolId,
        name: majorData.name,
        code: majorData.code,
        description: majorData.description,
      });

      console.log(newMajor);
      

      toast.success('Major created successfully!');
      
      // Refresh the majors list to get the newly added major
      await fetchMajors();
      
      
      // Close the modal only after successful response and refresh
      setIsAddModalOpen(false);
    } catch (err) {
      toast.error('Failed to create major');
      // Don't close modal on error - let user try again
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditMajor = async (majorData: { name: string; code: string; description: string }) => {
    if (!selectedMajor) return;

    setEditLoading(true);
    try {
      const updatedMajor = await updateMajor(selectedMajor._id, {
        name: majorData.name,
        code: majorData.code,
        description: majorData.description,
      });

      setMajors(prev => prev.map(m => 
        m._id === selectedMajor._id ? updatedMajor.data : m
      ));
      toast.success('Major updated successfully!');
      setIsEditModalOpen(false);
      setSelectedMajor(null);
    } catch (err) {
      toast.error('Failed to update major');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteMajor = async () => {
    if (!selectedMajor) return;

    setDeleteLoading(true);
    try {
      await deleteMajor(selectedMajor._id);
      setMajors(prev => prev.filter(m => m._id !== selectedMajor._id));
      toast.success('Major deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedMajor(null);
    } catch (err) {
      toast.error('Failed to delete major');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditClick = (major: Major) => {
    setSelectedMajor(major);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (major: Major) => {
    setSelectedMajor(major);
    setIsDeleteModalOpen(true);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Majors', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [[
        'Name',
        'Code',
        'Description',
      ]],
      body: filtered.map(major => [
        major.name,
        major.code,
        major.description,
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    doc.save('majors.pdf');
  };

  if (loading && majors.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading majors...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Majors</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              disabled={addLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addLoading ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Adding...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Add Major
                </>
              )}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-semibold shadow flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Download PDF
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <input
            type="text"
            placeholder="Search majors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          <select className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent mt-2 md:mt-0">
            <option>All</option>
            <option>Recently Added</option>
            <option>A-Z</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-500 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Show no data image when no majors */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <img
              src="/no_data.jpg"
              alt="No data available"
              className="mx-auto w-64 h-64 object-contain mb-4"
            />
            <p className="text-gray-500 text-lg">No majors found</p>
            <p className="text-gray-400 text-sm mt-2">
              {search ? 'Try adjusting your search or add a new major' : 'Add your first major to get started'}
            </p>
          </div>
        )}

        {/* Show table only when there are majors */}
        {!loading && filtered.length > 0 && (
          <div className="overflow-x-auto bg-white rounded-xl shadow-md">
            <table className="min-w-full text-left">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Code</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((major) => (
                  <tr key={major._id} className="group border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">{major.name}</td>
                    <td className="py-3 px-4 text-green-600 font-semibold">{major.code}</td>
                    <td className="py-3 px-4 text-gray-600">{major.description}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <button 
                        onClick={() => handleEditClick(major)}
                        disabled={editLoading && selectedMajor?._id === major._id}
                        className="text-blue-500 hover:text-blue-700 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {editLoading && selectedMajor?._id === major._id ? (
                          <span className="flex items-center gap-1">
                            <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
                            Updating...
                          </span>
                        ) : (
                          'Edit'
                        )}
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(major)}
                        disabled={deleteLoading && selectedMajor?._id === major._id}
                        className="text-red-500 hover:text-red-700 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleteLoading && selectedMajor?._id === major._id ? (
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
        )}

        {/* Show pagination only when there are majors */}
        {!loading && !error && filtered.length > 0 && (
          <div className="flex justify-between items-center mt-6">
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
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

        {/* Add Major Modal */}
        <AddMajorModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            // Reset form when modal is closed
            setAddLoading(false);
          }}
          onSubmit={handleAddMajor}
          loading={addLoading}
        />

        {/* Edit Major Modal */}
        <AddMajorModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedMajor(null);
          }}
          onSubmit={handleEditMajor}
          initialData={selectedMajor}
          isEdit={true}
          loading={editLoading}
        />

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Major" size="sm">
          <div className="space-y-6">
            <p className="text-gray-700">
              Are you sure you want to delete <span className="font-bold">{selectedMajor?.name}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button 
                type="button" 
                onClick={() => setIsDeleteModalOpen(false)} 
                disabled={deleteLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteMajor} 
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

export default MajorsPage; 