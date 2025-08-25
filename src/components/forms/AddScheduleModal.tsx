import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (scheduleData: any) => void;
  courses: Array<{ id: string; name: string }>;
  teachers: Array<{ id: string; name: string }>;
  initialData?: {
    courseId?: string;
    classroom?: string;
    teacherId?: string;
    day?: string;
    startTime?: string;
    endTime?: string;
  };
  title?: string;
  submitButtonText?: string;
}

const AddScheduleModal: React.FC<AddScheduleModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  courses, 
  teachers, 
  initialData, 
  title = "Add New Schedule",
  submitButtonText = "Add Schedule"
}) => {
  const [formData, setFormData] = useState({
    courseId: initialData?.courseId || '',
    classroom: initialData?.classroom || '',
    teacherId: initialData?.teacherId || '',
    day: initialData?.day || '',
    startTime: initialData?.startTime || '',
    endTime: initialData?.endTime || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        courseId: initialData.courseId || '',
        classroom: initialData.classroom || '',
        teacherId: initialData.teacherId || '',
        day: initialData.day || '',
        startTime: initialData.startTime || '',
        endTime: initialData.endTime || '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.courseId) {
      newErrors.courseId = 'Course is required';
    }

    if (!formData.classroom.trim()) {
      newErrors.classroom = 'Classroom is required';
    }

    if (!formData.teacherId) {
      newErrors.teacherId = 'Teacher is required';
    }

    if (!formData.day) {
      newErrors.day = 'Day is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    } else if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      if (end <= start) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        ...formData,
        createdAt: new Date().toISOString(),
      });
      
      // Reset form
      setFormData({
        courseId: '',
        classroom: '',
        teacherId: '',
        day: '',
        startTime: '',
        endTime: '',
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Course */}
          <div>
            <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-2">
              Course *
            </label>
            <select
              id="courseId"
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.courseId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
            {errors.courseId && <p className="mt-1 text-sm text-red-600">{errors.courseId}</p>}
          </div>

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

          {/* Teacher */}
          <div>
            <label htmlFor="teacherId" className="block text-sm font-medium text-gray-700 mb-2">
              Teacher *
            </label>
            <select
              id="teacherId"
              name="teacherId"
              value={formData.teacherId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.teacherId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a teacher</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
            {errors.teacherId && <p className="mt-1 text-sm text-red-600">{errors.teacherId}</p>}
          </div>

          {/* Day */}
          <div>
            <label htmlFor="day" className="block text-sm font-medium text-gray-700 mb-2">
              Day *
            </label>
            <select
              id="day"
              name="day"
              value={formData.day}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.day ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a day</option>
              {days.map(day => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            {errors.day && <p className="mt-1 text-sm text-red-600">{errors.day}</p>}
          </div>

          {/* Start Time */}
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
              Start Time *
            </label>
            <input
              type="time"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.startTime ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>}
          </div>

          {/* End Time */}
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
              End Time *
            </label>
            <input
              type="time"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.endTime ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>}
          </div>
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
            {submitButtonText}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddScheduleModal; 