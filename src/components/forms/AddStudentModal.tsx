import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import type { Student, Major } from '../../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (studentData: { 
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
  }) => void;
  majors: Major[];
  initialData?: Student | null;
  isEdit?: boolean;
  loading?: boolean;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  majors, 
  initialData, 
  isEdit = false, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    cardId: '',
    majorId: '',
    class: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    profileUrl: '',
    isActive: true,
    enrollmentDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});


  console.log("initialData", initialData);

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        name: initialData.name,
        studentId: initialData.studentId,
        cardId: initialData.cardId,
        majorId: (initialData.majorId as Major).id as string,
        class: initialData.class,
        dateOfBirth: initialData.dateOfBirth.split('T')[0],
        email: initialData.email,
        phone: initialData.phone || '',
        profileUrl: initialData.profileUrl || '',
        isActive: initialData.isActive,
        enrollmentDate: initialData.enrollmentDate.split('T')[0],
      });
    }
  }, [initialData, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    }

    if (!formData.cardId.trim()) {
      newErrors.cardId = 'Card ID is required';
    }

    if (!formData.majorId) {
      newErrors.majorId = 'Major is required';
    }

    if (!formData.class.trim()) {
      newErrors.class = 'Class is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of Birth is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.enrollmentDate) {
      newErrors.enrollmentDate = 'Enrollment Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        name: formData.name.trim(),
        studentId: formData.studentId.trim(),
        cardId: formData.cardId.trim(),
        majorId: formData.majorId,
        class: formData.class.trim(),
        dateOfBirth: formData.dateOfBirth,
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        profileUrl: formData.profileUrl.trim() || undefined,
        isActive: formData.isActive,
        enrollmentDate: formData.enrollmentDate,
      });
      
      // Don't close modal here - let parent component handle it after API response
      if (!loading) {
        // setFormData({
        //   name: '',
        //   studentId: '',
        //   cardId: '',
        //   majorId: '',
        //   class: '',
        //   dateOfBirth: '',
        //   email: '',
        //   phone: '',
        //   profileUrl: '',
        //   isActive: true,
        //   enrollmentDate: '',
        // });
        setErrors({});
      }
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        studentId: '',
        cardId: '',
        majorId: '',
        class: '',
        dateOfBirth: '',
        email: '',
        phone: '',
        profileUrl: '',
        isActive: true,
        enrollmentDate: '',
      });
      setErrors({});
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? "Edit Student" : "Add New Student"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
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
              placeholder="Enter full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Student ID */}
          <div>
            <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
              Student ID *
            </label>
            <input
              type="text"
              id="studentId"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.studentId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 2024001"
            />
            {errors.studentId && <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>}
          </div>

          {/* Card ID */}
          <div>
            <label htmlFor="cardId" className="block text-sm font-medium text-gray-700 mb-2">
              Card ID *
            </label>
            <input
              type="text"
              id="cardId"
              name="cardId"
              value={formData.cardId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.cardId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., RFID001"
            />
            {errors.cardId && <p className="mt-1 text-sm text-red-600">{errors.cardId}</p>}
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

          {/* Class */}
          <div>
            <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-2">
              Class *
            </label>
            <input
              type="text"
              id="class"
              name="class"
              value={formData.class}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.class ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., A, B, C"
            />
            {errors.class && <p className="mt-1 text-sm text-red-600">{errors.class}</p>}
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth *
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., john.doe@student.edu"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., +1234567890"
            />
          </div>

          {/* Enrollment Date */}
          <div>
            <label htmlFor="enrollmentDate" className="block text-sm font-medium text-gray-700 mb-2">
              Enrollment Date *
            </label>
            <input
              type="date"
              id="enrollmentDate"
              name="enrollmentDate"
              value={formData.enrollmentDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.enrollmentDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.enrollmentDate && <p className="mt-1 text-sm text-red-600">{errors.enrollmentDate}</p>}
          </div>

          {/* Profile URL */}
          <div>
            <label htmlFor="profileUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Profile URL
            </label>
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

          {/* Is Active */}
          <div>
            <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-1">
              Student Status
            </label>
            <select
              id="isActive"
              name="isActive"
              value={formData.isActive ? "active" : "inactive"}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "active" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active </option>
              <option value="inactive">Inactive </option>
            </select>
          </div>
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
              isEdit ? 'Update Student' : 'Add Student'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddStudentModal; 