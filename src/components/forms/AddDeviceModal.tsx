import React, { useState } from 'react';
import Modal from '../ui/Modal';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deviceData: any) => void;
}

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    classroom: '',
    location: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.classroom.trim()) {
      newErrors.classroom = 'Classroom is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        ...formData,
        installedAt: new Date().toISOString(),
      });
      
      // Reset form
      setFormData({
        classroom: '',
        location: '',
        isActive: true,
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New RFID Device" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Classroom */}
        <div>
          <label htmlFor="classroom" className="block text-sm font-medium text-gray-700 mb-2">
            Classroom *
          </label>
          <input
            type="text"
            id="classroom"
            name="classroom"
            value={formData.classroom}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.classroom ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., A101, B205"
          />
          {errors.classroom && <p className="mt-1 text-sm text-red-600">{errors.classroom}</p>}
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.location ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., First Floor, Second Floor"
          />
          {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
        </div>

        {/* Is Active */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
            Device is active
          </label>
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Add Device
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddDeviceModal; 