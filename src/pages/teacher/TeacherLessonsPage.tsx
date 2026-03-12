import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AddLessonModal from '../../components/forms/AddLessonModal';
import { getLessons, createLesson, updateLesson, deleteLesson } from '../../services/lessonService';
import { getSchedules } from '../../services/scheduleService';
import { getSchoolCourses } from '../../services/courseService';
import { toast } from 'react-toastify';
import type { Lesson, Schedule, Course, LessonMaterial } from '../../types';

const TeacherLessonsPage: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lessonsRes, schedulesRes, coursesRes] = await Promise.all([
        getLessons(1, 100),
        getSchedules(1, 100),
        getSchoolCourses(1, 100)
      ]);
      setLessons(lessonsRes.data || []);
      setSchedules(schedulesRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (error) {
      toast.error('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (lessonData: {
    courseId: string;
    scheduleId: string;
    title: string;
    description?: string;
    lessonDate: string;
    materials?: LessonMaterial[];
    isPublished?: boolean;
  }) => {
    setSubmitLoading(true);
    try {
      if (selectedLesson) {
        await updateLesson(selectedLesson._id, lessonData);
        toast.success('Lesson updated successfully');
      } else {
        await createLesson(lessonData);
        toast.success('Lesson created successfully');
      }
      setIsModalOpen(false);
      setSelectedLesson(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error saving lesson');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      try {
        await deleteLesson(id);
        toast.success('Lesson deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Error deleting lesson');
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lessons</h1>
            <p className="text-sm text-gray-500 mt-1">
              Post lesson plans and class content for specific dates. Attach materials, links, and resources for each lesson.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedLesson(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Post Lesson
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lessons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No lessons</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by posting a new lesson plan.</p>
                      <div className="mt-6">
                        <button
                          onClick={() => {
                            setSelectedLesson(null);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Post Lesson
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                lessons.map((lesson) => {
                  const course = typeof lesson.courseId === 'object' 
                    ? lesson.courseId 
                    : courses.find(c => c._id === lesson.courseId);
                  return (
                    <tr key={lesson._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {lesson.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lesson.lessonDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          lesson.isPublished 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {lesson.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedLesson(lesson);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                        <button
                          onClick={() => handleDelete(lesson._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AddLessonModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLesson(null);
          }}
          onSubmit={handleSubmit}
          initialData={selectedLesson}
          courses={courses}
          schedules={schedules}
          isEdit={!!selectedLesson}
          loading={submitLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default TeacherLessonsPage;
