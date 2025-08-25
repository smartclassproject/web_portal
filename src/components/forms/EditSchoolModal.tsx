import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import type { School } from '../../types';

interface SchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (school: Partial<School>) => void;
  mode: 'create' | 'edit';
  school?: School;
  loading?: boolean;
}

const SchoolModal: React.FC<SchoolModalProps> = ({ isOpen, onClose, onSubmit, mode, school, loading }) => {
  const [formData, setFormData] = useState({ name: '', location: '' });
  const [errors, setErrors] = useState<{ name?: string; location?: string }>({});

  useEffect(() => {
    if (mode === 'edit' && school) {
      setFormData({ name: school.name, location: school.location });
    } else {
      setFormData({ name: '', location: '' });
    }
  }, [mode, school, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: { name?: string; location?: string } = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      if (mode === 'edit' && school) {
        onSubmit({ ...school, ...formData });
      } else {
        onSubmit({ ...formData });
      }
      setErrors({});
      // Do not call onClose here; parent will close modal after API call
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit School' : 'Add School'} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">School Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter school name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter location"
          />
          {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
          <button type="submit" className={`px-4 py-2 ${mode === 'edit' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg font-medium transition-colors`} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                {mode === 'edit' ? 'Saving...' : 'Adding...'}
              </span>
            ) : (
              mode === 'edit' ? 'Save Changes' : 'Add School'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SchoolModal; 