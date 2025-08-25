import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import type { Teacher } from '../../types';

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (teacherData: { name: string; email: string; phone: string; department?: string; specialization?: string; profileUrl?: string }) => void;
  initialData?: Teacher | null;
  isEdit?: boolean;
  loading?: boolean;
}

const AddTeacherModal: React.FC<AddTeacherModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  isEdit = false, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    specialization: '',
    profileUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone,
        department: initialData.department || '',
        specialization: initialData.specialization || '',
        profileUrl: initialData.profileUrl || '',
      });
    }
  }, [initialData, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', email: '', phone: '', department: '', specialization: '', profileUrl: '' });
      setErrors({});
    }
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        department: formData.department.trim() || undefined,
        specialization: formData.specialization.trim() || undefined,
        profileUrl: formData.profileUrl.trim() || undefined,
      });
      // Don't close modal here - let parent component handle it after API response
      if (!loading) {
        setFormData({ name: '', email: '', phone: '', department: '', specialization: '', profileUrl: '' });
        setErrors({});
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? "Edit Teacher" : "Add New Teacher"} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g., teacher@school.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g., 123-456-7890"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </div>
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Computer Science"
            />
          </div>
          <div>
            <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
            <input
              type="text"
              id="specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Software Engineering"
            />
          </div>
          <div>
            <label htmlFor="profileUrl" className="block text-sm font-medium text-gray-700 mb-2">Profile URL</label>
            <input
              type="url"
              id="profileUrl"
              name="profileUrl"
              value={formData.profileUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/profile.jpg"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button type="button" onClick={handleClose} disabled={loading} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                {isEdit ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              isEdit ? 'Update Teacher' : 'Add Teacher'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTeacherModal; 