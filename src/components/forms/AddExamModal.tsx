import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import type { Exam, Course } from '../../types';

interface AddExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (examData: {
    courseId: string;
    title: string;
    description?: string;
    examDate: string;
    examTime: string;
    duration?: number;
    maxScore?: number;
    reportUrl?: string;
    isPublished?: boolean;
  }) => void;
  initialData?: Exam | null;
  courses: Course[];
  isEdit?: boolean;
  loading?: boolean;
}

const AddExamModal: React.FC<AddExamModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  courses,
  isEdit = false,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    examDate: '',
    examTime: '',
    duration: 120,
    maxScore: 100,
    reportUrl: '',
    isPublished: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        courseId: typeof initialData.courseId === 'string' ? initialData.courseId : initialData.courseId._id,
        title: initialData.title,
        description: initialData.description || '',
        examDate: initialData.examDate.split('T')[0],
        examTime: initialData.examTime,
        duration: initialData.duration || 120,
        maxScore: initialData.maxScore || 100,
        reportUrl: initialData.reportUrl || '',
        isPublished: initialData.isPublished
      });
    }
  }, [initialData, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        courseId: '',
        title: '',
        description: '',
        examDate: '',
        examTime: '',
        duration: 120,
        maxScore: 100,
        reportUrl: '',
        isPublished: false
      });
      setErrors({});
    }
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.courseId.trim()) newErrors.courseId = 'Course is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.examDate) newErrors.examDate = 'Exam date is required';
    if (!formData.examTime) newErrors.examTime = 'Exam time is required';
    if (formData.reportUrl && !/^https?:\/\/.+/.test(formData.reportUrl)) {
      newErrors.reportUrl = 'Invalid URL format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        courseId: formData.courseId.trim(),
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        examDate: formData.examDate,
        examTime: formData.examTime,
        duration: formData.duration || undefined,
        maxScore: formData.maxScore || undefined,
        reportUrl: formData.reportUrl.trim() || undefined,
        isPublished: formData.isPublished
      });
      if (!loading) {
        setFormData({
          courseId: '',
          title: '',
          description: '',
          examDate: '',
          examTime: '',
          duration: 120,
          maxScore: 100,
          reportUrl: '',
          isPublished: false
        });
        setErrors({});
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? "Edit Exam" : "Post New Exam"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-2">Course *</label>
          <select
            id="courseId"
            name="courseId"
            value={formData.courseId}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.courseId ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select a course</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>{course.name}</option>
            ))}
          </select>
          {errors.courseId && <p className="mt-1 text-sm text-red-600">{errors.courseId}</p>}
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="examDate" className="block text-sm font-medium text-gray-700 mb-2">Exam Date *</label>
            <input
              type="date"
              id="examDate"
              name="examDate"
              value={formData.examDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.examDate ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.examDate && <p className="mt-1 text-sm text-red-600">{errors.examDate}</p>}
          </div>
          <div>
            <label htmlFor="examTime" className="block text-sm font-medium text-gray-700 mb-2">Exam Time *</label>
            <input
              type="time"
              id="examTime"
              name="examTime"
              value={formData.examTime}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.examTime ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.examTime && <p className="mt-1 text-sm text-red-600">{errors.examTime}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="maxScore" className="block text-sm font-medium text-gray-700 mb-2">Max Score</label>
            <input
              type="number"
              id="maxScore"
              name="maxScore"
              value={formData.maxScore}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label htmlFor="reportUrl" className="block text-sm font-medium text-gray-700 mb-2">Report URL</label>
          <input
            type="url"
            id="reportUrl"
            name="reportUrl"
            value={formData.reportUrl}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.reportUrl ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="https://example.com/report.pdf"
          />
          {errors.reportUrl && <p className="mt-1 text-sm text-red-600">{errors.reportUrl}</p>}
        </div>
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Publish to students</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEdit ? 'Update Exam' : 'Create Exam'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddExamModal;
