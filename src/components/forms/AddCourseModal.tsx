import React, { useState } from 'react';
import Modal from '../ui/Modal';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (courseData: any) => void;
  majors: Array<{ _id: string; name: string }>;
}

const AddCourseModal: React.FC<AddCourseModalProps> = ({ isOpen, onClose, onSubmit, majors }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    majorId: '',
    description: '',
    credits: 3,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Course name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Course code is required';
    } else if (formData.code.length > 10) {
      newErrors.code = 'Course code must be 10 characters or less';
    }

    if (!formData.majorId) {
      newErrors.majorId = 'Major is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.credits || formData.credits < 1) {
      newErrors.credits = 'Credits must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await onSubmit({
          ...formData,
          createdAt: new Date().toISOString(),
        });
        
        // Reset form
        setFormData({
          name: '',
          code: '',
          majorId: '',
          description: '',
          credits: 3,
        });
        setErrors({});
        onClose();
      } catch (error) {
        // Error handling is done in the parent component
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Course" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Course Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Course Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Introduction to Algorithms"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Course Code */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Course Code *
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              maxLength={10}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.code ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., CS101"
            />
            {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
          </div>

          {/* Major */}
          <div>
            <label htmlFor="majorId" className="block text-sm font-medium text-gray-700 mb-2">
              Major *
            </label>
            <select
              id="majorId"
              name="majorId"
              value={formData.majorId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.majorId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a major</option>
              {majors.map(major => (
                <option key={major._id} value={major._id}>
                  {major.name}
                </option>
              ))}
            </select>
            {errors.majorId && <p className="mt-1 text-sm text-red-600">{errors.majorId}</p>}
          </div>

          {/* Credits */}
          <div>
            <label htmlFor="credits" className="block text-sm font-medium text-gray-700 mb-2">
              Credits *
            </label>
            <input
              type="number"
              id="credits"
              name="credits"
              value={formData.credits}
              onChange={handleChange}
              min="1"
              max="10"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.credits ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="3"
            />
            {errors.credits && <p className="mt-1 text-sm text-red-600">{errors.credits}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter a brief description of the course..."
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Adding...
              </>
            ) : (
              'Add Course'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddCourseModal; 