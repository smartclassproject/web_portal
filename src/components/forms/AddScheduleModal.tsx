import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import type { Course, CreateScheduleData, Teacher, WeeklySession } from '../../types';
// import { WeeklySession, CreateScheduleData } from '../../services/scheduleService';

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (scheduleData: CreateScheduleData) => void;
  courses: Course[];
  teachers: Teacher[];
  initialData?: {
    courseId?: string;
    classroom?: string;
    teacherId?: string;
    startDate?: string;
    endDate?: string;
    weeklySessions?: WeeklySession[];
    maxStudents?: number;
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
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    maxStudents: initialData?.maxStudents || 30,
  });
  
  const [weeklySessions, setWeeklySessions] = useState<WeeklySession[]>(
    initialData?.weeklySessions || [{ day: 'Monday', startTime: '09:00', endTime: '10:30' }]
  );
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sessionErrors, setSessionErrors] = useState<Record<number, Record<string, string>>>({});

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        courseId: initialData.courseId || '',
        classroom: initialData.classroom || '',
        teacherId: initialData.teacherId || '',
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        maxStudents: initialData.maxStudents || 30,
      });
      setWeeklySessions(initialData.weeklySessions || [{ day: 'Monday', startTime: '09:00', endTime: '10:30' }]);
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

  const handleSessionChange = (index: number, field: keyof WeeklySession, value: string) => {
    const updatedSessions = [...weeklySessions];
    updatedSessions[index] = { ...updatedSessions[index], [field]: value };
    setWeeklySessions(updatedSessions);
    
    // Clear session error when user starts typing
    if (sessionErrors[index]?.[field]) {
      setSessionErrors(prev => ({
        ...prev,
        [index]: { ...prev[index], [field]: '' }
      }));
    }
  };

  const addWeeklySession = () => {
    setWeeklySessions([...weeklySessions, { day: 'Monday', startTime: '09:00', endTime: '10:30' }]);
  };

  const removeWeeklySession = (index: number) => {
    if (weeklySessions.length > 1) {
      const updatedSessions = weeklySessions.filter((_, i) => i !== index);
      setWeeklySessions(updatedSessions);
      
      // Remove session errors for deleted session
      const updatedErrors = { ...sessionErrors };
      delete updatedErrors[index];
      setSessionErrors(updatedErrors);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const newSessionErrors: Record<number, Record<string, string>> = {};

    if (!formData.courseId) {
      newErrors.courseId = 'Course is required';
    }

    if (!formData.classroom.trim()) {
      newErrors.classroom = 'Classroom is required';
    }

    if (!formData.teacherId) {
      newErrors.teacherId = 'Teacher is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (formData.maxStudents && formData.maxStudents <= 0) {
      newErrors.maxStudents = 'Max students must be greater than 0';
    }

    // Validate weekly sessions
    weeklySessions.forEach((session, index) => {
      const sessionError: Record<string, string> = {};
      
      if (!session.day) {
        sessionError.day = 'Day is required';
      }

      if (!session.startTime) {
        sessionError.startTime = 'Start time is required';
      }

      if (!session.endTime) {
        sessionError.endTime = 'End time is required';
      } else if (session.startTime && session.endTime) {
        const start = new Date(`2000-01-01T${session.startTime}`);
        const end = new Date(`2000-01-01T${session.endTime}`);
        if (end <= start) {
          sessionError.endTime = 'End time must be after start time';
        }
      }

      if (Object.keys(sessionError).length > 0) {
        newSessionErrors[index] = sessionError;
      }
    });

    setErrors(newErrors);
    setSessionErrors(newSessionErrors);
    
    return Object.keys(newErrors).length === 0 && Object.keys(newSessionErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const scheduleData: CreateScheduleData = {
        courseId: formData.courseId,
        classroom: formData.classroom,
        teacherId: formData.teacherId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        weeklySessions: weeklySessions,
        maxStudents: formData.maxStudents,
      };
      
      onSubmit(scheduleData);
      
      // Reset form
      setFormData({
        courseId: '',
        classroom: '',
        teacherId: '',
        startDate: '',
        endDate: '',
        maxStudents: 30,
      });
      setWeeklySessions([{ day: 'Monday', startTime: '09:00', endTime: '10:30' }]);
      setErrors({});
      setSessionErrors({});
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
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
                <option key={course._id} value={course._id}>
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
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
            </select>
            {errors.teacherId && <p className="mt-1 text-sm text-red-600">{errors.teacherId}</p>}
          </div>

          {/* Max Students */}
          <div>
            <label htmlFor="maxStudents" className="block text-sm font-medium text-gray-700 mb-2">
              Max Students
            </label>
            <input
              type="number"
              id="maxStudents"
              name="maxStudents"
              value={formData.maxStudents}
              onChange={handleChange}
              min="1"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.maxStudents ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="30"
            />
            {errors.maxStudents && <p className="mt-1 text-sm text-red-600">{errors.maxStudents}</p>}
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.startDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.endDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
          </div>
        </div>

        {/* Weekly Sessions */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Weekly Sessions</h3>
            <button
              type="button"
              onClick={addWeeklySession}
              className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
            >
              + Add Session
            </button>
          </div>
          
          <div className="space-y-4">
            {weeklySessions.map((session, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Session {index + 1}</h4>
                  {weeklySessions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWeeklySession(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Day */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Day *</label>
                    <select
                      value={session.day}
                      onChange={(e) => handleSessionChange(index, 'day', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        sessionErrors[index]?.day ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {days.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    {sessionErrors[index]?.day && (
                      <p className="mt-1 text-sm text-red-600">{sessionErrors[index].day}</p>
                    )}
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                    <input
                      type="time"
                      value={session.startTime}
                      onChange={(e) => handleSessionChange(index, 'startTime', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        sessionErrors[index]?.startTime ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {sessionErrors[index]?.startTime && (
                      <p className="mt-1 text-sm text-red-600">{sessionErrors[index].startTime}</p>
                    )}
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                    <input
                      type="time"
                      value={session.endTime}
                      onChange={(e) => handleSessionChange(index, 'endTime', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        sessionErrors[index]?.endTime ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {sessionErrors[index]?.endTime && (
                      <p className="mt-1 text-sm text-red-600">{sessionErrors[index].endTime}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
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