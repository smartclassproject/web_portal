import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AddCourseModal from '../../components/forms/AddCourseModal';
import EditCourseModal from '../../components/forms/EditCourseModal';
import Modal from '../../components/ui/Modal';
import { getSchoolCourses, createCourse, updateCourse, deleteCourse } from '../../services/courseService';
import { getSchoolMajors } from '../../services/majorService';
import type { Course, Major } from '../../types';
import { toast } from 'react-toastify';

const CoursesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [majors, setMajors] = useState<Array<{ _id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    fetchCourses();
    fetchMajors();
  }, [currentPage]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await getSchoolCourses(currentPage, 10);
      setCourses(response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMajors = async () => {
    try {
      const response = await getSchoolMajors();
      setMajors(response.data || []);
    } catch (error) {
      console.error('Error fetching majors:', error);
      toast.error('Failed to fetch majors. Please try again.');
    }
  };

  const handleDeleteCourse = (course: Course) => {
    setDeletingCourse(course);
  };

  const confirmDelete = async () => {
    if (!deletingCourse) return;

    try {
      setIsDeleting(deletingCourse._id);
      await deleteCourse(deletingCourse._id);
      fetchCourses(); // Refresh the list
      toast.success('Course deleted successfully!');
      setDeletingCourse(null);
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };



  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsEditModalOpen(true);
  };



  const handleUpdateCourse = async (courseData: any) => {
    if (!editingCourse) return;

    try {
      await updateCourse(editingCourse._id, courseData);
      fetchCourses(); // Refresh the list
      toast.success('Course updated successfully!');
      setIsEditModalOpen(false);
      setEditingCourse(null);
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course. Please try again.');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Add Course
            </button>
            <button className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-semibold shadow flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Download PDF
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            <button
              onClick={fetchCourses}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
          </div>
          <select className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent mt-2 md:mt-0">
            <option>All</option>
            <option>Recently Added</option>
            <option>A-Z</option>
          </select>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <img src="/no_data.jpg" alt="No courses" className="w-32 h-32 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-500 mb-4">
              {search ? 'Try adjusting your search terms.' : 'Get started by adding your first course.'}
            </p>
            {!search && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Add Your First Course
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-md">
            <table className="min-w-full text-left">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Code</th>
                  <th className="py-3 px-4 font-semibold">Major</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold">Credits</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((course, idx) => (
                  <tr key={course._id} className="group border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">{course.name}</td>
                    <td className="py-3 px-4 text-green-600 font-semibold">{course.code}</td>
                    <td className="py-3 px-4 text-blue-600 font-semibold">
                      {(course.majorId as unknown as Major)?.name || 'Unknown Major'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{course.description}</td>
                    <td className="py-3 px-4 text-purple-600 font-semibold">{course.credits}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <button
                        onClick={() => handleEditCourse(course)}
                        className="text-blue-500 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course)}
                        disabled={isDeleting === course._id}
                        className="text-red-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting === course._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Add Course Modal */}
        <AddCourseModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={async (courseData) => {
            try {
              await createCourse(courseData);
              fetchCourses(); // Refresh the list
              toast.success('Course created successfully!');
            } catch (error) {
              console.error('Error creating course:', error);
              toast.error('Failed to create course. Please try again.');
            }
          }}
          majors={majors}
        />

        {/* Edit Course Modal */}
        <EditCourseModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCourse(null);
          }}
          onSubmit={handleUpdateCourse}
          course={editingCourse}
          majors={majors}
        />

        {/* Delete Confirmation Modal */}
        {deletingCourse && (
          <Modal isOpen={!!deletingCourse} onClose={() => setDeletingCourse(null)} title="Confirm Delete" size="md">
            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete the course <strong>"{deletingCourse.name}"</strong>?
              </p>
              <p className="text-sm text-gray-500">
                This action cannot be undone. All associated data will be permanently removed.
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setDeletingCourse(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting === deletingCourse._id}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isDeleting === deletingCourse._id ? 'Deleting...' : 'Delete Course'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CoursesPage; 