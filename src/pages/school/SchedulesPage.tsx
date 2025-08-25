import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameDay, addDays, subDays } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import AddScheduleModal from '../../components/forms/AddScheduleModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const mockSchedules = [
  { id: '1', course: 'Algorithms', courseId: '1', classroom: 'A101', teacher: 'Alice Johnson', teacherId: '1', day: 'Monday', startTime: '09:00', endTime: '10:30' },
  { id: '2', course: 'Thermodynamics', courseId: '2', classroom: 'B205', teacher: 'Bob Smith', teacherId: '2', day: 'Tuesday', startTime: '11:00', endTime: '12:30' },
  { id: '3', course: 'Marketing', courseId: '3', classroom: 'C301', teacher: 'Carol Lee', teacherId: '3', day: 'Wednesday', startTime: '14:00', endTime: '15:30' },
];
const mockCourses = [
  { id: '1', name: 'Algorithms' },
  { id: '2', name: 'Thermodynamics' },
  { id: '3', name: 'Marketing' },
];
const mockTeachers = [
  { id: '1', name: 'Alice Johnson' },
  { id: '2', name: 'Bob Smith' },
  { id: '3', name: 'Carol Lee' },
];

// Define SlotInfo type locally
interface SlotInfo {
  start: Date;
  end: Date;
  slots: Date[];
  action: 'select' | 'click' | 'doubleClick';
}

// Convert schedules to calendar events
const getCalendarEvents = (schedules: any[]) => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

  return schedules.map((schedule, index) => {
    const dayMap = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 };
    const dayOffset = dayMap[schedule.day as keyof typeof dayMap] || 1;
    
    const eventDate = new Date(startOfWeek);
    eventDate.setDate(startOfWeek.getDate() + dayOffset - 1);
    
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    
    const start = new Date(eventDate);
    start.setHours(startHour, startMinute, 0);
    
    const end = new Date(eventDate);
    end.setHours(endHour, endMinute, 0);
    
    return {
      id: schedule.id,
      title: `${schedule.course} - ${schedule.classroom}`,
      start,
      end,
      resource: schedule,
    };
  });
};

// Helper function to get day name from date
const getDayName = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

// Helper function to format time
const formatTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

// Helper function to get schedule date from day name
const getScheduleDate = (schedule: any): Date => {
  const today = new Date();
  const dayMap = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 0 };
  const currentDay = today.getDay();
  const targetDay = dayMap[schedule.day as keyof typeof dayMap] || 1;
  
  // Calculate days to add to get to the target day
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd <= 0) daysToAdd += 7; // If target day is this week but already passed, go to next week
  
  const scheduleDate = new Date(today);
  scheduleDate.setDate(today.getDate() + daysToAdd);
  return scheduleDate;
};

const SchedulesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [schedules, setSchedules] = useState(mockSchedules);
  
  // Time selection states
  const [timeView, setTimeView] = useState<'day' | 'week' | 'custom'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  
  // Filter schedules based on search and time selection
  const filtered = schedules.filter(schedule => {
    const matchesSearch = schedule.course.toLowerCase().includes(search.toLowerCase()) || 
                         schedule.teacher.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Filter by time selection
    const scheduleDate = getScheduleDate(schedule);
    
    switch (timeView) {
      case 'day':
        return isSameDay(scheduleDate, selectedDate);
      case 'week':
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return scheduleDate >= weekStart && scheduleDate <= weekEnd;
      case 'custom':
        return scheduleDate >= customStartDate && scheduleDate <= customEndDate;
      default:
        return true;
    }
  });

  const handleEventSelect = (event: any) => {
    console.log('Selected event:', event);
    setSelectedSchedule(event.resource);
    setIsEditModalOpen(true);
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    console.log('Selected slot:', slotInfo);
    setSelectedSlot(slotInfo);
    setIsAddModalOpen(true);
  };

  const handleAddSchedule = (scheduleData: any) => {
    const newSchedule = {
      id: (schedules.length + 1).toString(),
      course: mockCourses.find(c => c.id === scheduleData.courseId)?.name || '',
      courseId: scheduleData.courseId,
      classroom: scheduleData.classroom,
      teacher: mockTeachers.find(t => t.id === scheduleData.teacherId)?.name || '',
      teacherId: scheduleData.teacherId,
      day: scheduleData.day,
      startTime: scheduleData.startTime,
      endTime: scheduleData.endTime,
      createdAt: scheduleData.createdAt,
    };
    setSchedules([newSchedule, ...schedules]);
    setIsAddModalOpen(false);
    setSelectedSlot(null);
  };

  const handleEditSchedule = (scheduleData: any) => {
    if (!selectedSchedule) return;
    
    const updatedSchedules = schedules.map(schedule => 
      schedule.id === selectedSchedule.id 
        ? {
            ...schedule,
            course: mockCourses.find(c => c.id === scheduleData.courseId)?.name || '',
            courseId: scheduleData.courseId,
            classroom: scheduleData.classroom,
            teacher: mockTeachers.find(t => t.id === scheduleData.teacherId)?.name || '',
            teacherId: scheduleData.teacherId,
            day: scheduleData.day,
            startTime: scheduleData.startTime,
            endTime: scheduleData.endTime,
          }
        : schedule
    );
    
    setSchedules(updatedSchedules);
    setIsEditModalOpen(false);
    setSelectedSchedule(null);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Schedules', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [[
        'Course',
        'Classroom',
        'Teacher',
        'Day',
        'Start Time',
        'End Time',
      ]],
      body: filtered.map(schedule => [
        schedule.course,
        schedule.classroom,
        schedule.teacher,
        schedule.day,
        schedule.startTime,
        schedule.endTime,
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    doc.save('schedules.pdf');
  };

  // Time navigation functions
  const goToPrevious = () => {
    switch (timeView) {
      case 'day':
        setSelectedDate(subDays(selectedDate, 1));
        break;
      case 'week':
        setSelectedDate(subDays(selectedDate, 7));
        break;
      case 'custom':
        setCustomStartDate(subDays(customStartDate, 1));
        setCustomEndDate(subDays(customEndDate, 1));
        break;
    }
  };

  const goToNext = () => {
    switch (timeView) {
      case 'day':
        setSelectedDate(addDays(selectedDate, 1));
        break;
      case 'week':
        setSelectedDate(addDays(selectedDate, 7));
        break;
      case 'custom':
        setCustomStartDate(addDays(customStartDate, 1));
        setCustomEndDate(addDays(customEndDate, 1));
        break;
    }
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCustomStartDate(today);
    setCustomEndDate(today);
  };

  const formatDisplayDate = () => {
    switch (timeView) {
      case 'day':
        return format(selectedDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = addDays(weekStart, 6);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'custom':
        return `${format(customStartDate, 'MMM d')} - ${format(customEndDate, 'MMM d, yyyy')}`;
      default:
        return '';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Add Schedule
            </button>
            <button
              onClick={handleDownloadPDF}
              className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-semibold shadow flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Download PDF
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                  viewMode === 'calendar'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Calendar
              </button>
            </div>
          </div>
          {viewMode === 'calendar' && (
            <div className="text-sm text-gray-500">
              💡 Click on time slots to add new schedules, click on existing schedules to edit
            </div>
          )}
        </div>
        {viewMode === 'table' ? (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
              <input
                type="text"
                placeholder="Search schedules..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <select className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent mt-2 md:mt-0">
                <option>All</option>
                <option>Monday</option>
                <option>Tuesday</option>
                <option>Wednesday</option>
                <option>Thursday</option>
                <option>Friday</option>
              </select>
            </div>
            <div className="overflow-x-auto bg-white rounded-xl shadow-md">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Course</th>
                    <th className="py-3 px-4 font-semibold">Classroom</th>
                    <th className="py-3 px-4 font-semibold">Teacher</th>
                    <th className="py-3 px-4 font-semibold">Day</th>
                    <th className="py-3 px-4 font-semibold">Start Time</th>
                    <th className="py-3 px-4 font-semibold">End Time</th>
                    <th className="py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((schedule, idx) => (
                    <tr key={schedule.id} className="group border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition">
                      <td className="py-3 px-4 font-medium text-gray-900">{schedule.course}</td>
                      <td className="py-3 px-4 text-green-600 font-semibold">{schedule.classroom}</td>
                      <td className="py-3 px-4 text-blue-600 font-semibold">{schedule.teacher}</td>
                      <td className="py-3 px-4 text-gray-600">{schedule.day}</td>
                      <td className="py-3 px-4 text-gray-600">{schedule.startTime}</td>
                      <td className="py-3 px-4 text-gray-600">{schedule.endTime}</td>
                      <td className="py-3 px-4 flex gap-2">
                        <button 
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setIsEditModalOpen(true);
                          }}
                          className="text-blue-500 hover:underline"
                        >
                          Edit
                        </button>
                        <button className="text-red-500 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6">
            <Calendar
              localizer={localizer}
              events={getCalendarEvents(schedules)}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              onSelectEvent={handleEventSelect}
              onSelectSlot={handleSelectSlot}
              selectable={true}
              views={['week', 'day']}
              defaultView="week"
              step={60}
              timeslots={1}
              min={new Date(0, 0, 0, 8, 0, 0)}
              max={new Date(0, 0, 0, 18, 0, 0)}
              eventPropGetter={(event: any) => ({
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
              slotPropGetter={(date: any) => ({
                style: {
                  cursor: 'pointer',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }
              })}
            />
          </div>
        )}
        
        {/* Add Schedule Modal */}
        <AddScheduleModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedSlot(null);
          }}
          onSubmit={handleAddSchedule}
          courses={mockCourses}
          teachers={mockTeachers}
          initialData={selectedSlot ? {
            day: getDayName(selectedSlot.start),
            startTime: formatTime(selectedSlot.start),
            endTime: formatTime(selectedSlot.end),
          } : undefined}
          title="Add New Schedule"
        />

        {/* Edit Schedule Modal */}
        <AddScheduleModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedSchedule(null);
          }}
          onSubmit={handleEditSchedule}
          courses={mockCourses}
          teachers={mockTeachers}
          initialData={selectedSchedule ? {
            courseId: selectedSchedule.courseId,
            classroom: selectedSchedule.classroom,
            teacherId: selectedSchedule.teacherId,
            day: selectedSchedule.day,
            startTime: selectedSchedule.startTime,
            endTime: selectedSchedule.endTime,
          } : undefined}
          title="Edit Schedule"
          submitButtonText="Update Schedule"
        />
      </div>
    </DashboardLayout>
  );
};

export default SchedulesPage; 