/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  isSameDay,
  addDays,
  subDays,
} from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import AddScheduleModal from "../../components/forms/AddScheduleModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../../services/scheduleService";
import { getSchoolCourses } from "../../services/courseService";
import { getSchoolTeachers } from "../../services/teacherService";
import { toast } from "react-toastify";
import type {
  Course,
  CreateScheduleData,
  Schedule,
  Teacher,
  WeeklySession,
} from "../../types";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Helper function to get course name by ID
const getCourseName = (
  courses: Course[],
  courseId: Course | string
): string => {
  if (typeof courseId === "object" && courseId !== null) {
    return courseId.name;
  }
  const course = courses.find((c) => c._id === courseId);
  return course ? course.name : "Unknown Course";
};

// Helper function to get teacher name by ID
const getTeacherName = (
  teachers: Teacher[],
  teacherId: Teacher | string
): string => {
  if (typeof teacherId === "object" && teacherId !== null) {
    return teacherId.name;
  }
  const teacher = teachers.find((t) => t._id === teacherId);
  return teacher ? teacher.name : "Unknown Teacher";
};

// Define SlotInfo type locally
interface SlotInfo {
  start: Date;
  end: Date;
  slots: Date[];
  action: "select" | "click" | "doubleClick";
}

// Convert schedules to calendar events
const getCalendarEvents = (
  schedules: Schedule[],
  courses: Course[],
  teachers: Teacher[]
) => {
  const events: any[] = [];

  schedules &&
    schedules.forEach((schedule) => {
      const courseName = getCourseName(courses, schedule.courseId);
      // const teacherName = getTeacherName(teachers, schedule.teacherId);

      schedule.weeklySessions.forEach((session, sessionIndex) => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

        const dayMap = {
          Monday: 1,
          Tuesday: 2,
          Wednesday: 3,
          Thursday: 4,
          Friday: 5,
        };
        const dayOffset = dayMap[session.day as keyof typeof dayMap] || 1;

        const eventDate = new Date(startOfWeek);
        eventDate.setDate(startOfWeek.getDate() + dayOffset - 1);

        const [startHour, startMinute] = session.startTime
          .split(":")
          .map(Number);
        const [endHour, endMinute] = session.endTime.split(":").map(Number);

        const start = new Date(eventDate);
        start.setHours(startHour, startMinute, 0);

        const end = new Date(eventDate);
        end.setHours(endHour, endMinute, 0);

        events.push({
          id: `${schedule._id}-${sessionIndex}`,
          title: `${courseName} - ${schedule.classroom}`,
          start,
          end,
          resource: { ...schedule, session },
        });
      });
    });

  return events;
};

// Helper function to get day name from date
const getDayName = (date: Date): string => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getDay()];
};

// Helper function to format time
const formatTime = (date: Date): string => {
  return format(date, "HH:mm");
};

// Helper function to get schedule date from day name
const getScheduleDate = (session: WeeklySession): Date => {
  const today = new Date();
  const dayMap = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 0,
  };
  const currentDay = today.getDay();
  const targetDay = dayMap[session.day as keyof typeof dayMap] || 1;

  // Calculate days to add to get to the target day
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd <= 0) daysToAdd += 7; // If target day is this week but already passed, go to next week

  const scheduleDate = new Date(today);
  scheduleDate.setDate(today.getDate() + daysToAdd);
  return scheduleDate;
};

const SchedulesPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(
    null
  );

  // Time selection states
  const [timeView, setTimeView] = useState<"day" | "week" | "custom">("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());

  // Fetch data on component mount
  useEffect(() => {
    fetchSchedules();
    fetchCourses();
    fetchTeachers();
  }, []);

  // Refetch schedules when time view or dates change
  useEffect(() => {
    if (courses.length > 0 && teachers.length > 0) {
      fetchSchedules();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeView, selectedDate, customStartDate, customEndDate]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);

      // Build date filters based on current time view
      let startDate: string | undefined;
      let endDate: string | undefined;

      switch (timeView) {
        case "day":
          startDate = format(selectedDate, "yyyy-MM-dd");
          endDate = format(selectedDate, "yyyy-MM-dd");
          break;
        case "week": {
          const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
          const weekEnd = addDays(weekStart, 6);
          startDate = format(weekStart, "yyyy-MM-dd");
          endDate = format(weekEnd, "yyyy-MM-dd");
          break;
        }
        case "custom":
          startDate = format(customStartDate, "yyyy-MM-dd");
          endDate = format(customEndDate, "yyyy-MM-dd");
          break;
      }

      const response = await getSchedules(1, 100, startDate, endDate);
      setSchedules(response.data);
    } catch (error) {
      toast.error("Failed to fetch schedules. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await getSchoolCourses();
      setCourses(response.data || []);
    } catch (error) {
      toast.error("Failed to fetch courses. Please try again.");
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await getSchoolTeachers();
      setTeachers(response.data || []);
    } catch (error) {
      toast.error("Failed to fetch teachers. Please try again.");
    }
  };

  // Filter schedules based on search and time selection
  const filtered =
    schedules &&
    schedules.filter((schedule) => {
      const courseName = getCourseName(courses, schedule.courseId);
      const teacherName = getTeacherName(teachers, schedule.teacherId);

      const matchesSearch =
        courseName.toLowerCase().includes(search.toLowerCase()) ||
        teacherName.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      // Filter by time selection - check if any weekly session falls within the selected period
      const hasSessionInPeriod = schedule.weeklySessions.some((session) => {
        const sessionDate = getScheduleDate(session);

        switch (timeView) {
          case "day":
            return isSameDay(sessionDate, selectedDate);
          case "week": {
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return sessionDate >= weekStart && sessionDate <= weekEnd;
          }
          case "custom":
            return (
              sessionDate >= customStartDate && sessionDate <= customEndDate
            );
          default:
            return true;
        }
      });

      return hasSessionInPeriod;
    });

  const handleEventSelect = (event: any) => {
    console.log("Selected event:", event);
    setSelectedSchedule(event.resource);
    setIsEditModalOpen(true);
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    console.log("Selected slot:", slotInfo);
    setSelectedSlot(slotInfo);
    setIsAddModalOpen(true);
  };

  const handleAddSchedule = async (scheduleData: CreateScheduleData) => {
    try {
      await createSchedule(scheduleData);
      toast.success("Schedule created successfully!");
      fetchSchedules();
      setIsAddModalOpen(false);
      setSelectedSlot(null);
    } catch (error) {
      toast.error("Failed to create schedule. Please try again.");
    }
  };

  const handleEditSchedule = async (scheduleData: CreateScheduleData) => {
    if (!selectedSchedule) return;

    try {
      await updateSchedule(selectedSchedule._id, scheduleData);
      toast.success("Schedule updated successfully!");
      fetchSchedules();
      setIsEditModalOpen(false);
      setSelectedSchedule(null);
    } catch (error) {
      toast.error("Failed to update schedule. Please try again.");
    }
  };

  const handleDeleteSchedule = async (schedule: Schedule) => {
    setDeletingSchedule(schedule);
  };

  const confirmDelete = async () => {
    if (!deletingSchedule) return;

    try {
      setIsDeleting(deletingSchedule._id);
      await deleteSchedule(deletingSchedule._id);
      toast.success("Schedule deleted successfully!");
      fetchSchedules();
    } catch (error) {
      toast.error("Failed to delete schedule. Please try again.");
    } finally {
      setIsDeleting(null);
      setDeletingSchedule(null);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Schedules", 14, 16);

    // Flatten weekly sessions for PDF display
    const pdfData = filtered.flatMap((schedule) =>
      schedule.weeklySessions.map((session) => [
        getCourseName(courses, schedule.courseId),
        schedule.classroom,
        getTeacherName(teachers, schedule.teacherId),
        session.day,
        session.startTime,
        session.endTime,
        `${format(new Date(schedule.startDate), "MMM d, yyyy")} - ${format(
          new Date(schedule.endDate),
          "MMM d, yyyy"
        )}`,
      ])
    );

    autoTable(doc, {
      startY: 22,
      head: [
        [
          "Course",
          "Classroom",
          "Teacher",
          "Day",
          "Start Time",
          "End Time",
          "Date Range",
        ],
      ],
      body: pdfData,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    doc.save("schedules.pdf");
  };

  // Time navigation functions
  const goToPrevious = () => {
    switch (timeView) {
      case "day":
        setSelectedDate(subDays(selectedDate, 1));
        break;
      case "week":
        setSelectedDate(subDays(selectedDate, 7));
        break;
      case "custom":
        setCustomStartDate(subDays(customStartDate, 1));
        setCustomEndDate(subDays(customEndDate, 1));
        break;
    }
    // Fetch schedules for the new date range
    setTimeout(() => fetchSchedules(), 0);
  };

  const goToNext = () => {
    switch (timeView) {
      case "day":
        setSelectedDate(addDays(selectedDate, 1));
        break;
      case "week":
        setSelectedDate(addDays(selectedDate, 7));
        break;
      case "custom":
        setCustomStartDate(addDays(customStartDate, 1));
        setCustomEndDate(addDays(customEndDate, 1));
        break;
    }
    // Fetch schedules for the new date range
    setTimeout(() => fetchSchedules(), 0);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCustomStartDate(today);
    setCustomEndDate(today);
    // Fetch schedules for today
    setTimeout(() => fetchSchedules(), 0);
  };

  const formatDisplayDate = () => {
    switch (timeView) {
      case "day":
        return format(selectedDate, "EEEE, MMMM d, yyyy");
      case "week": {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = addDays(weekStart, 6);
        return `${format(weekStart, "MMM d")} - ${format(
          weekEnd,
          "MMM d, yyyy"
        )}`;
      }
      case "custom":
        return `${format(customStartDate, "MMM d")} - ${format(
          customEndDate,
          "MMM d, yyyy"
        )}`;
      default:
        return "";
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
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Schedule
            </button>
            <button
              onClick={fetchSchedules}
              disabled={loading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold shadow flex items-center gap-2"
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-semibold shadow flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download PDF
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                  viewMode === "table"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                  viewMode === "calendar"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Calendar
              </button>
            </div>
          </div>
          {viewMode === "calendar" && (
            <div className="text-sm text-gray-500">
              💡 Click on time slots to add new schedules, click on existing
              schedules to edit
            </div>
          )}
        </div>
        {viewMode === "table" ? (
          <>
            {/* Time Selection Controls */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Time View Selection */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">
                    Time View:
                  </span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setTimeView("day")}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                        timeView === "day"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Day
                    </button>
                    <button
                      onClick={() => setTimeView("week")}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                        timeView === "week"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setTimeView("custom")}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                        timeView === "custom"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                {/* Date Display and Navigation */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={goToPrevious}
                    className="p-2 text-gray-400 hover:text-gray-600 transition"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatDisplayDate()}
                    </div>
                    <button
                      onClick={goToToday}
                      className="text-sm text-blue-600 hover:text-blue-700 underline"
                    >
                      Go to Today
                    </button>
                  </div>

                  <button
                    onClick={goToNext}
                    className="p-2 text-gray-400 hover:text-gray-600 transition"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Custom Date Range Inputs */}
              {timeView === "custom" && (
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      From:
                    </label>
                    <input
                      type="date"
                      value={format(customStartDate, "yyyy-MM-dd")}
                      onChange={(e) =>
                        setCustomStartDate(new Date(e.target.value))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      To:
                    </label>
                    <input
                      type="date"
                      value={format(customEndDate, "yyyy-MM-dd")}
                      onChange={(e) =>
                        setCustomEndDate(new Date(e.target.value))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Search schedules..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
              <div className="text-sm text-gray-600">
                {filtered && filtered.length} schedule
                {filtered && filtered.length !== 1 ? "s" : ""} found
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="animate-spin mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Loading schedules...
                </h3>
              </div>
            ) : !filtered || filtered.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No schedules found
                </h3>
                <p className="text-gray-500 mb-4">
                  {timeView === "day" &&
                    `No schedules for ${format(
                      selectedDate,
                      "EEEE, MMMM d, yyyy"
                    )}`}
                  {timeView === "week" &&
                    `No schedules for the week of ${format(
                      startOfWeek(selectedDate, { weekStartsOn: 1 }),
                      "MMM d, yyyy"
                    )}`}
                  {timeView === "custom" &&
                    `No schedules between ${format(
                      customStartDate,
                      "MMM d, yyyy"
                    )} and ${format(customEndDate, "MMM d, yyyy")}`}
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow"
                >
                  Add Schedule
                </button>
              </div>
            ) : (
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
                      <th className="py-3 px-4 font-semibold">Date Range</th>
                      <th className="py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered &&
                      filtered.map((schedule) =>
                        schedule.weeklySessions.map((session, sessionIndex) => (
                          <tr
                            key={`${schedule._id}-${sessionIndex}`}
                            className="group border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition"
                          >
                            <td className="py-3 px-4 font-medium text-gray-900">
                              {getCourseName(courses, schedule.courseId)}
                            </td>
                            <td className="py-3 px-4 text-green-600 font-semibold">
                              {schedule.classroom}
                            </td>
                            <td className="py-3 px-4 text-blue-600 font-semibold">
                              {getTeacherName(teachers, schedule.teacherId)}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {session.day}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {session.startTime}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {session.endTime}
                            </td>
                            <td className="py-3 px-4 text-gray-500 text-sm">
                              {format(new Date(schedule.startDate), "MMM d")} -{" "}
                              {format(
                                new Date(schedule.endDate),
                                "MMM d, yyyy"
                              )}
                            </td>
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
                              <button
                                onClick={() => handleDeleteSchedule(schedule)}
                                className="text-red-500 hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6">
            <Calendar
              localizer={localizer}
              events={getCalendarEvents(schedules, courses, teachers)}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              onSelectEvent={handleEventSelect}
              onSelectSlot={handleSelectSlot}
              selectable={true}
              views={["week", "day"]}
              defaultView="week"
              step={60}
              timeslots={1}
              min={new Date(0, 0, 0, 8, 0, 0)}
              max={new Date(0, 0, 0, 18, 0, 0)}
              eventPropGetter={() => ({
                style: {
                  backgroundColor: "#3B82F6",
                  borderRadius: "4px",
                  opacity: 0.8,
                  color: "white",
                  border: "0px",
                  display: "block",
                  cursor: "pointer",
                },
              })}
              slotPropGetter={() => ({
                style: {
                  cursor: "pointer",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                },
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
          courses={courses}
          teachers={teachers}
          initialData={
            selectedSlot
              ? {
                  startDate: format(selectedSlot.start, "yyyy-MM-dd"),
                  endDate: format(selectedSlot.end, "yyyy-MM-dd"),
                  weeklySessions: [
                    {
                      day: getDayName(selectedSlot.start),
                      startTime: formatTime(selectedSlot.start),
                      endTime: formatTime(selectedSlot.end),
                    },
                  ],
                }
              : undefined
          }
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
          courses={courses}
          teachers={teachers}
          initialData={
            selectedSchedule
              ? {
                  courseId:
                    typeof selectedSchedule.courseId === "string"
                      ? selectedSchedule.courseId
                      : selectedSchedule.courseId._id,
                  classroom: selectedSchedule.classroom,
                  teacherId:
                    typeof selectedSchedule.teacherId === "string"
                      ? selectedSchedule.teacherId
                      : selectedSchedule.teacherId._id,
                  startDate: selectedSchedule.startDate,
                  endDate: selectedSchedule.endDate,
                  weeklySessions: selectedSchedule.weeklySessions,
                  maxStudents: selectedSchedule.maxStudents,
                }
              : undefined
          }
          title="Edit Schedule"
          submitButtonText="Update Schedule"
        />

        {/* Delete Confirmation Modal */}
        {deletingSchedule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Delete Schedule
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this schedule? This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingSchedule(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting === deletingSchedule._id}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {isDeleting === deletingSchedule._id ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SchedulesPage;
