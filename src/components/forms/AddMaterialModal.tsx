import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import type { Material, Course } from '../../types';

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (materialData: {
    courseId: string;
    title: string;
    description?: string;
    fileType: 'pdf' | 'ppt' | 'pptx' | 'video' | 'image' | 'document' | 'other';
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
    isPublished?: boolean;
  }) => void;
  initialData?: Material | null;
  courses: Course[];
  isEdit?: boolean;
  loading?: boolean;
}

const AddMaterialModal: React.FC<AddMaterialModalProps> = ({
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
    fileType: 'pdf' as 'pdf' | 'ppt' | 'pptx' | 'video' | 'image' | 'document' | 'other',
    fileUrl: '',
    fileName: '',
    fileSize: 0,
    isPublished: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        courseId: typeof initialData.courseId === 'string' ? initialData.courseId : initialData.courseId._id,
        title: initialData.title,
        description: initialData.description || '',
        fileType: initialData.fileType,
        fileUrl: initialData.fileUrl,
        fileName: initialData.fileName || '',
        fileSize: initialData.fileSize || 0,
        isPublished: initialData.isPublished
      });
    }
  }, [initialData, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'fileSize') {
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
        fileType: 'pdf',
        fileUrl: '',
        fileName: '',
        fileSize: 0,
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
    if (!formData.fileUrl.trim()) newErrors.fileUrl = 'File URL is required';
    else if (!/^https?:\/\/.+/.test(formData.fileUrl)) newErrors.fileUrl = 'Invalid URL format';
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
        fileType: formData.fileType,
        fileUrl: formData.fileUrl.trim(),
        fileName: formData.fileName.trim() || undefined,
        fileSize: formData.fileSize || undefined,
        isPublished: formData.isPublished
      });
      if (!loading) {
        setFormData({
          courseId: '',
          title: '',
          description: '',
          fileType: 'pdf',
          fileUrl: '',
          fileName: '',
          fileSize: 0,
          isPublished: false
        });
        setErrors({});
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? "Edit Material" : "Upload New Material"} size="lg">
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
            placeholder="e.g., Physics Chapter 1 Notes"
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
            placeholder="Optional description of the material"
          />
        </div>
        <div>
          <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 mb-2">File Type *</label>
          <select
            id="fileType"
            name="fileType"
            value={formData.fileType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="pdf">PDF</option>
            <option value="ppt">PowerPoint (PPT)</option>
            <option value="pptx">PowerPoint (PPTX)</option>
            <option value="video">Video</option>
            <option value="image">Image</option>
            <option value="document">Document</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="fileUrl" className="block text-sm font-medium text-gray-700 mb-2">File URL *</label>
          <input
            type="url"
            id="fileUrl"
            name="fileUrl"
            value={formData.fileUrl}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.fileUrl ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="https://example.com/file.pdf"
          />
          {errors.fileUrl && <p className="mt-1 text-sm text-red-600">{errors.fileUrl}</p>}
          <p className="mt-1 text-xs text-gray-500">Upload your file to a cloud storage service and paste the URL here</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-2">File Name</label>
            <input
              type="text"
              id="fileName"
              name="fileName"
              value={formData.fileName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional file name"
            />
          </div>
          <div>
            <label htmlFor="fileSize" className="block text-sm font-medium text-gray-700 mb-2">File Size (bytes)</label>
            <input
              type="number"
              id="fileSize"
              name="fileSize"
              value={formData.fileSize}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional file size"
            />
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
                {isEdit ? 'Updating...' : 'Uploading...'}
              </>
            ) : (
              isEdit ? 'Update Material' : 'Upload Material'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMaterialModal;
