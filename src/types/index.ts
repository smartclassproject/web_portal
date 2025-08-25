// Database Schema Types
export interface School {
  _id: string;
  name: string;
  location: string;
  createdAt: string;
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
  role: 'super_admin' | 'school_admin';
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
  status: 'active' | 'inactive';
  role: 'super_admin' | 'school_admin';
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
  cardId: string;
  majorId: string | Major;
  class: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
  profileUrl?: string;
  isActive: boolean;
  enrollmentDate: string;
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
  studentId: string;
  courseId: string;
  scheduleId: string;
  deviceId: string;
  classroom: string;
  checkInTime: string;
  status: 'Present' | 'Absent' | 'Late';
  notes?: string;
  sessionDate: string;
  sessionDay: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
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
  status: 'Operational' | 'Maintenance' | 'Offline' | 'Error';
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
  role: 'super_admin' | 'school_admin';
  schoolId?: string;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
} 