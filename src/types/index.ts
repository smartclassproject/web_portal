import type { ReactNode } from "react";

// Database Schema Types
export type EnrollmentSeason = "fall" | "spring" | "summer" | "winter";

export interface School {
  _id: string;
  name: string;
  location: string;
  shortCode?: string;
  numberOfTerms?: number;
  enrollmentSemestersEnabled?: EnrollmentSeason[];
  defaultEnrollmentSemester?: EnrollmentSeason | null;
  createdAt: string;
}

export interface StatCard {
  title: string;
  value: number;
  icon: ReactNode;
  gradient: string;
}

export interface AdminUser {
  _id: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  passwordSetup?: boolean;
  name?: string;
  phone?: string;
  role: "super_admin" | "school_admin";
  schoolId?: string | School;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserView {
  _id: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  status: "active" | "inactive";
  role: "super_admin" | "school_admin";
  schoolId?: School;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Major {
  _id: string;
  id?: string;
  schoolId: string | School;
  name: string;
  code: string;
  description: string;
}

export interface Student {
  _id: string;
  schoolId: string;
  name: string;
  studentId: string;
  cardId?: string;
  majorId: string | Major;
  class: string;
  classId?: string | { _id: string; name: string; code?: string };
  dateOfBirth: string;
  email?: string;
  phone?: string;
  parentFirstName?: string;
  parentLastName?: string;
  parentPhoneNumber?: string;
  profileUrl?: string;
  isActive: boolean;
  enrollmentDate?: string;
  enrollmentYear?: number;
  academicYear?: number;
  /** Grading term index (1…school.numberOfTerms) for exams and report cards. */
  entryTerm?: number;
  /** Registration intake season (Fall, Spring, …). */
  enrollmentSeason?: EnrollmentSeason;
  /** Cohort year for display, e.g. Fall 2026. */
  enrollmentCohortYear?: number;
  gender?: string;
  createdAt: string;
}

export interface Teacher {
  _id: string;
  schoolId: string;
  name: string;
  email: string;
  phone: string;
  department?: string;
  specialization?: string;
  profileUrl?: string;
  passwordSetup?: boolean;
  createdAt: string;
}

export interface Course {
  _id: string;
  schoolId: string;
  majorId: string;
  name: string;
  code: string;
  description: string;
  credits: number;
}

export interface WeeklySession {
  day: string;
  startTime: string;
  endTime: string;
}

export interface CourseSchedule {
  _id: string;
  courseId: string;
  schoolId: string;
  classroom: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  weeklySessions: WeeklySession[];
}

export interface Attendance {
  _id: string;
  studentId: Student;
  courseId: string;
  scheduleId: string;
  deviceId: Device;
  majorId?: Major;
  classroom: string;
  checkInTime: string;
  status: "Present" | "Absent" | "Late";
  notes?: string;
  sessionDate: string;
  sessionDay:
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";
  sessionStartTime?: string;
  sessionEndTime?: string;
  cardId?: string;
  deviceLocation?: string;
  // Populated fields (if available from API)
  student?: Student;
  course?: Course;
  schedule?: CourseSchedule;
}

export interface Device {
  _id: string;
  schoolId: School | string;
  classroom: string;
  location: string;
  isActive: boolean;
  installedAt: string;
  deviceType: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  firmwareVersion?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  status: "Operational" | "Maintenance" | "Offline" | "Error";
  batteryLevel: number;
  signalStrength?: number;
  lastSeen: string;
  notes?: string;
  // Populated fields (if available from API)
  school?: School;
}

// Application Types
export interface User {
  id: string;
  email: string;
  role: "super_admin" | "school_admin" | "teacher";
  schoolId?: string;
  teacherId?: string;
  name: string;
  requiresPasswordChange?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => void;
  setUserFromToken: (token: string, backendUser: Record<string, unknown>) => void;
  isLoading: boolean;
}

export interface WeeklySession {
  day: string;
  startTime: string;
  endTime: string;
}

export interface Schedule {
  _id: string;
  courseId: Course | string;
  schoolId: string;
  classroom: string;
  teacherId: Teacher | string;
  startDate: string;
  endDate: string;
  weeklySessions: WeeklySession[];
  maxStudents?: number;
  currentStudents?: number;
  isActive?: boolean;
  isCurrentlyActive?: boolean;
  availableSeats?: number;
  attendanceCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateScheduleData {
  courseId: string;
  teacherId: string;
  classroom: string;
  startDate: string;
  endDate: string;
  weeklySessions: WeeklySession[];
  maxStudents?: number;
}

export interface UpdateScheduleData {
  courseId?: string;
  teacherId?: string;
  classroom?: string;
  startDate?: string;
  endDate?: string;
  weeklySessions?: WeeklySession[];
  maxStudents?: number;
}

export interface ScheduleResponse {
  data: Schedule[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Exam {
  _id: string;
  schoolId: string;
  courseId: string | Course;
  scheduleId: string | CourseSchedule;
  teacherId: string | Teacher;
  title: string;
  description?: string;
  examDate: string;
  examTime: string;
  duration: number;
  maxScore: number;
  reportUrl?: string;
  isPublished: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Material {
  _id: string;
  schoolId: string;
  courseId: string | Course;
  teacherId: string | Teacher;
  title: string;
  description?: string;
  fileType: 'pdf' | 'ppt' | 'pptx' | 'video' | 'image' | 'document' | 'other';
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  isPublished: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Lesson {
  _id: string;
  schoolId: string;
  courseId: string | Course;
  scheduleId: string | CourseSchedule;
  teacherId: string | Teacher;
  title: string;
  description?: string;
  lessonDate: string;
  materials?: LessonMaterial[];
  isPublished: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonMaterial {
  name: string;
  url: string;
  type: 'pdf' | 'video' | 'link' | 'document';
}
