import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import type { Major } from '../../types';

interface AddMajorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (majorData: { name: string; code: string; description: string }) => void;
  initialData?: Major | null;
  isEdit?: boolean;
  loading?: boolean;
}

const AddMajorModal: React.FC<AddMajorModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  isEdit = false,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        name: initialData.name,
        code: initialData.code,
        description: initialData.description,
      });
    } else {
      // Reset form for add mode
      setFormData({
        name: '',
        code: '',
        description: '',
      });
    }
    setErrors({});
  }, [initialData, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      newErrors.name = 'Major name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Major code is required';
    } else if (formData.code.length > 10) {
      newErrors.code = 'Major code must be 10 characters or less';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim(),
      });
      
      // Don't close modal here - let the parent component handle it after API response
      // Only reset form if not in loading state
      if (!loading) {
        setFormData({
          name: '',
          code: '',
          description: '',
        });
        setErrors({});
      }
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? "Edit Major" : "Add New Major"} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Major Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Major Name *
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
            placeholder="e.g., Computer Science"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Major Code */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
            Major Code *
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
            placeholder="e.g., CS"
          />
          {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
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
            placeholder="Enter a brief description of the major..."
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* Form Actions */}
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
                {isEdit ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              isEdit ? 'Update Major' : 'Add Major'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMajorModal; 