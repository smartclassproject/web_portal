import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import type { Lesson, Course, LessonMaterial } from '../../types';

interface AddLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lessonData: {
    courseId: string;
    title: string;
    description?: string;
    lessonDate: string;
    materials?: LessonMaterial[];
    isPublished?: boolean;
  }) => void;
  initialData?: Lesson | null;
  courses: Course[];
  isEdit?: boolean;
  loading?: boolean;
}

const AddLessonModal: React.FC<AddLessonModalProps> = ({
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
    lessonDate: '',
    materials: [] as LessonMaterial[],
    isPublished: false
  });
  const [newMaterial, setNewMaterial] = useState({ name: '', url: '', type: 'link' as const });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        courseId: typeof initialData.courseId === 'string' ? initialData.courseId : initialData.courseId._id,
        title: initialData.title,
        description: initialData.description || '',
        lessonDate: initialData.lessonDate.split('T')[0],
        materials: initialData.materials || [],
        isPublished: initialData.isPublished
      });
    }
  }, [initialData, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddMaterial = () => {
    if (newMaterial.name && newMaterial.url) {
      setFormData({
        ...formData,
        materials: [...formData.materials, newMaterial]
      });
      setNewMaterial({ name: '', url: '', type: 'link' });
    }
  };

  const handleRemoveMaterial = (index: number) => {
    setFormData({
      ...formData,
      materials: formData.materials.filter((_, i) => i !== index)
    });
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        courseId: '',
        title: '',
        description: '',
        lessonDate: '',
        materials: [],
        isPublished: false
      });
      setNewMaterial({ name: '', url: '', type: 'link' });
      setErrors({});
    }
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.courseId.trim()) newErrors.courseId = 'Course is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.lessonDate) newErrors.lessonDate = 'Date is required';
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
        lessonDate: formData.lessonDate,
        materials: formData.materials.length > 0 ? formData.materials : undefined,
        isPublished: formData.isPublished
      });
      if (!loading) {
        setFormData({
          courseId: '',
          title: '',
          description: '',
          lessonDate: '',
          materials: [],
          isPublished: false
        });
        setNewMaterial({ name: '', url: '', type: 'link' });
        setErrors({});
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? "Edit Chapter" : "Add New Chapter"} size="lg">
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
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Chapter Title *</label>
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
            rows={4}
          />
        </div>
        <div>
          <label htmlFor="lessonDate" className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
          <input
            type="date"
            id="lessonDate"
            name="lessonDate"
            value={formData.lessonDate}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.lessonDate ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.lessonDate && <p className="mt-1 text-sm text-red-600">{errors.lessonDate}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Materials</label>
          <div className="space-y-2 mb-2">
            {formData.materials.map((material, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="flex-1 text-sm">{material.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMaterial(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Material name"
              value={newMaterial.name}
              onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2"
            />
            <input
              type="url"
              placeholder="URL"
              value={newMaterial.url}
              onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2"
            />
            <select
              value={newMaterial.type}
              onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value as any })}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="link">Link</option>
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
            </select>
            <button
              type="button"
              onClick={handleAddMaterial}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Add
            </button>
          </div>
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
              isEdit ? 'Update Chapter' : 'Create Chapter'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddLessonModal;
