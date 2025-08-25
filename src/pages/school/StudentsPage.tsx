import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AddStudentModal from '../../components/forms/AddStudentModal';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { getSchoolStudents, createStudent, updateStudent, deleteStudent } from '../../services/studentService';
import { getSchoolMajors } from '../../services/majorService';
import type { Student, Major } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [majorsLoading, setMajorsLoading] = useState(false);
  const [error, setError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.studentId.toLowerCase().includes(search.toLowerCase()) ||
    s.cardId.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const fetchStudents = async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    setError('');
    try {
      const response = await getSchoolStudents(page, limit);
      setStudents(response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch students');
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchMajors = async () => {
    if (!user?.schoolId) return;
    setMajorsLoading(true);
    try {
      const response = await getSchoolMajors();
      setMajors(response.data || []);
    } catch (err: any) {
      toast.error('Failed to fetch majors');
    } finally {
      setMajorsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchMajors();
  }, [user?.schoolId, page]);

  const handleAddStudent = async (studentData: { 
    name: string; 
    studentId: string; 
    cardId: string; 
    majorId: string; 
    class: string; 
    dateOfBirth: string; 
    email: string; 
    phone?: string; 
    profileUrl?: string; 
    isActive: boolean; 
    enrollmentDate: string; 
  }) => {

    if (!user?.schoolId) return;
    console.log("We got this error in creating student", studentData);
    setAddLoading(true);
    try {
      const response = await createStudent({
        schoolId: user.schoolId,
        ...studentData,
      });

      if (response.success === true) {
      toast.success('Student created successfully!');
        // Refresh the students list to get the newly added student
        await fetchStudents();
        // Close the modal only after successful response and refresh
      } else {
        toast.error(response.data.message);
        console.log("We got this error in creating student", response);
      }
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.log("We got this error in creating student", err.response.data.message);
      toast.error(err.response.data.message || 'Failed to create student');
      // Don't close modal on error - let user try again
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditStudent = async (studentData: { 
    name: string; 
    studentId: string; 
    cardId: string; 
    class: string; 
    dateOfBirth: string; 
    email: string; 
    phone?: string; 
    isActive: boolean; 
  }) => {
    if (!selectedStudent) return;
    setEditLoading(true);
    try {
      await updateStudent(selectedStudent._id, studentData);
      toast.success('Student updated successfully!');
      // Refresh the students list
      await fetchStudents();
      setIsEditModalOpen(false);
      setSelectedStudent(null);
    } catch (err) {
      toast.error('Failed to update student');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    setDeleteLoading(true);
    try {
      await deleteStudent(selectedStudent._id);
      toast.success('Student deleted successfully!');
      setStudents(prev => prev.filter(s => s._id !== selectedStudent._id));
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
    } catch (err) {
      toast.error('Failed to delete student');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditClick = (student: Student) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // const getMajorName = (majorId: string) => {
  //   const major = majors.find(m => m._id === majorId);
  //   return major ? major.name : 'Unknown Major';
  // };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Students', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [[
        'Name',
        'Student ID',
        'Card ID',
        'Major',
        'Class',
        'Email',
        'Status',
        'Enrollment Date',
      ]],
      body: filteredStudents.map(student => [
        student.name,
        student.studentId,
        student.cardId,
        (student.majorId as Major).name,
        student.class,
        student.email,
        student.isActive ? 'Active' : 'Inactive',
        new Date(student.enrollmentDate).toLocaleDateString(),
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    doc.save('students.pdf');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading students...</p>
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
              onClick={fetchStudents}
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
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
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
                  Add Student
                </>
              )}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-semibold shadow flex items-center gap-2"
            >
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
            placeholder="Search students by name, ID, card ID, or email..."
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

        {students.length === 0 ? (
          <div className="text-center py-12">
            <img src="/no_data.jpg" alt="No data" className="w-32 h-32 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first student.</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Add Student
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto bg-white rounded-xl shadow-md">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Name</th>
                    <th className="py-3 px-4 font-semibold">Student ID</th>
                    <th className="py-3 px-4 font-semibold">Card ID</th>
                    <th className="py-3 px-4 font-semibold">Major</th>
                    <th className="py-3 px-4 font-semibold">Class</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Age</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Enrollment Date</th>
                    <th className="py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="group border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition">
                      <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-400 to-blue-600 text-white font-bold shadow-sm">
                          {student.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </span>
                        <span>{student.name}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{student.studentId}</td>
                      <td className="py-3 px-4 text-gray-600">{student.cardId}</td>
                      <td className="py-3 px-4 text-green-600 font-semibold">{(student.majorId as Major).name}</td>
                      <td className="py-3 px-4 text-gray-600">{student.class}</td>
                      <td className="py-3 px-4 text-gray-600">{student.email}</td>
                      <td className="py-3 px-4 text-gray-600">{calculateAge(student.dateOfBirth)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(student.enrollmentDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <button
                          onClick={() => handleEditClick(student)}
                          disabled={editLoading && selectedStudent?._id === student._id}
                          className="text-blue-500 hover:text-blue-700 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {editLoading && selectedStudent?._id === student._id ? (
                            <span className="flex items-center gap-1">
                              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
                              Updating...
                            </span>
                          ) : (
                            'Edit'
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(student)}
                          disabled={deleteLoading && selectedStudent?._id === student._id}
                          className="text-red-500 hover:text-red-700 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleteLoading && selectedStudent?._id === student._id ? (
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

        {/* Add Student Modal */}
        <AddStudentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddStudent}
          majors={majors}
          loading={addLoading}
        />

        {/* Edit Student Modal */}
        <AddStudentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedStudent(null);
          }}
          onSubmit={handleEditStudent}
          majors={majors}
          initialData={selectedStudent}
          isEdit={true}
          loading={editLoading}
        />

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Student" size="sm">
          <div className="space-y-6">
            <p className="text-gray-700">
              Are you sure you want to delete Student <span className="font-bold">{selectedStudent?.name}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button 
                type="button" 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedStudent(null);
                }} 
                disabled={deleteLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteStudent} 
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
      
      {/* Toast Container for notifications */}
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false} 
        newestOnTop 
        closeOnClick 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
      />
    </DashboardLayout>
  );
};

export default StudentsPage; 