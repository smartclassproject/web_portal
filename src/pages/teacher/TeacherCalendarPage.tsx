import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getSchedules, updateSchedule } from '../../services/scheduleService';
import { getSchoolCourses } from '../../services/courseService';
import { toast } from 'react-toastify';
import type { Schedule, Course, WeeklySession } from '../../types';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const TeacherCalendarPage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schedulesRes, coursesRes] = await Promise.all([
        getSchedules(1, 100),
        getSchoolCourses(1, 100)
      ]);
      setSchedules(schedulesRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (error) {
      toast.error('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const getCalendarEvents = () => {
    const events: any[] = [];
    schedules.forEach((schedule) => {
      const course = typeof schedule.courseId === 'object' 
        ? schedule.courseId 
        : courses.find(c => c._id === schedule.courseId);
      const courseName = course?.name || 'Unknown Course';

      schedule.weeklySessions.forEach((session, idx) => {
        const today = new Date();
        const startOfWeekDate = new Date(today);
        startOfWeekDate.setDate(today.getDate() - today.getDay() + 1);

        const dayMap: { [key: string]: number } = {
          Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5
        };
        const dayOffset = dayMap[session.day] || 1;
        const eventDate = new Date(startOfWeekDate);
        eventDate.setDate(startOfWeekDate.getDate() + dayOffset - 1);

        const [startHour, startMin] = session.startTime.split(':').map(Number);
        const [endHour, endMin] = session.endTime.split(':').map(Number);

        const start = new Date(eventDate);
        start.setHours(startHour, startMin, 0);
        const end = new Date(eventDate);
        end.setHours(endHour, endMin, 0);

        events.push({
          id: `${schedule._id}-${idx}`,
          title: `${courseName} - ${schedule.classroom}`,
          start,
          end,
          resource: { ...schedule, session }
        });
      });
    });
    return events;
  };

  const handleEventSelect = (event: any) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  const handleUpdateSchedule = async (scheduleId: string, updates: Partial<Schedule>) => {
    try {
      await updateSchedule(scheduleId, updates);
      toast.success('Schedule updated successfully');
      setIsEditModalOpen(false);
      setSelectedEvent(null);
      fetchData();
    } catch (error) {
      toast.error('Error updating schedule');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Calendar</h1>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <Calendar
            localizer={localizer}
            events={getCalendarEvents()}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            onSelectEvent={handleEventSelect}
            views={['week', 'day']}
            defaultView="week"
            step={60}
            min={new Date(0, 0, 0, 8, 0, 0)}
            max={new Date(0, 0, 0, 18, 0, 0)}
            eventPropGetter={() => ({
              style: {
                backgroundColor: '#3B82F6',
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block',
                cursor: 'pointer'
              }
            })}
          />
        </div>

        {isEditModalOpen && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Edit Schedule</h2>
              <p className="text-gray-600 mb-4">
                Schedule editing functionality can be implemented here. 
                Teachers can modify classroom, time, or other schedule details.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherCalendarPage;
