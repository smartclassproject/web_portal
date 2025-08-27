# SmartClass - School Management System

SmartClass is a comprehensive web-based school management system designed to streamline administrative tasks, manage student and teacher information, track attendance, and organize course schedules. The system provides different interfaces for school administrators and system administrators, with role-based access control and comprehensive data management capabilities.

## 🎯 Project Overview

SmartClass is built to modernize school administration by providing a centralized platform for managing all aspects of school operations. From student enrollment to attendance tracking, from course scheduling to device management, SmartClass offers an intuitive interface that reduces administrative overhead and improves operational efficiency.

## ✨ Features

### 🔐 Authentication & Authorization
- **Secure Login System**: Role-based authentication for different user types
- **Password Management**: Forgot password functionality with secure reset
- **Session Management**: Secure session handling and token-based authentication
- **Role-Based Access Control**: Different interfaces for admin and school users

### 🏫 School Management
- **Multi-School Support**: Manage multiple schools from a single platform
- **School Information**: Complete school profiles with contact and location details
- **School Administrators**: Assign and manage administrators for each school
- **School-Specific Data**: Isolated data management per school

### 👥 User Management
- **Student Management**: Complete student profiles, enrollment, and academic tracking
- **Teacher Management**: Teacher profiles, qualifications, and assignment tracking
- **Major/Program Management**: Academic programs and specializations
- **User Roles**: Different permission levels for various user types

### 📚 Course Management
- **Course Creation**: Add new courses with detailed information including credits
- **Course Assignment**: Link courses to majors and assign teachers
- **Course Scheduling**: Organize course timetables and classroom assignments
- **Credit System**: Academic credit tracking for courses

### 📅 Schedule Management
- **Interactive Calendar**: Visual calendar interface using react-big-calendar
- **Time Slot Management**: Click on empty time slots to add new schedules
- **Schedule Editing**: Click on existing schedules to edit details
- **Flexible Time Views**: Day, week, and custom date range views
- **Smart Filtering**: Filter schedules by time period, course, or teacher

### 📊 Attendance Tracking
- **Real-time Attendance**: Track student attendance using RFID devices
- **Attendance Reports**: Generate comprehensive attendance reports
- **Filtering & Search**: Advanced filtering by date, status, and student
- **Export Functionality**: Download attendance data in PDF format

### 📱 Device Management
- **RFID Device Tracking**: Monitor and manage RFID devices across schools
- **Device Status**: Track device health, battery status, and connectivity
- **School-Specific Devices**: Isolated device management per school
- **Device Analytics**: Performance and usage statistics

### 🎨 User Interface
- **Modern Design**: Clean, responsive interface built with Tailwind CSS
- **Dashboard Layout**: Intuitive navigation with sidebar and main content areas
- **Responsive Design**: Mobile-friendly interface that works on all devices
- **Loading States**: Visual feedback during asynchronous operations
- **Toast Notifications**: User-friendly notifications using react-toastify

### 📈 Data Management
- **Pagination**: Efficient handling of large datasets
- **Search & Filtering**: Advanced search and filter capabilities
- **Data Export**: PDF export functionality for reports
- **Real-time Updates**: Live data updates and synchronization

## 🛠️ Tech Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development with comprehensive type definitions
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development

### UI Components & Libraries
- **React Big Calendar**: Interactive calendar component for schedule management
- **React Toastify**: Toast notification system for user feedback
- **Date-fns**: Modern date utility library for date manipulation
- **jsPDF**: PDF generation for reports and exports

### State Management
- **React Context**: Global state management for authentication and user data
- **React Hooks**: useState, useEffect, and custom hooks for component state

### HTTP Client
- **Axios**: HTTP client for API communication with interceptors
- **RESTful API**: Standard REST API endpoints for all operations

### Development Tools
- **ESLint**: Code quality and consistency
- **TypeScript**: Static type checking and IntelliSense
- **Vite**: Fast development and optimized builds

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SmartClass/web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with your configuration:
   ```env
   VITE_API_BASE_URL=your_api_base_url
   VITE_APP_NAME=SmartClass
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── forms/          # Form components (modals, inputs)
│   ├── layout/         # Layout components (sidebar, dashboard)
│   └── ui/             # Basic UI components (modal, buttons)
├── contexts/           # React contexts for state management
├── pages/              # Page components
│   ├── admin/          # Admin-specific pages
│   └── school/         # School-specific pages
├── services/           # API service functions
├── types/              # TypeScript type definitions
└── assets/             # Static assets and images
```

## 🔧 Configuration

### API Configuration
The application uses a centralized axios instance (`src/services/axiosInstance.ts`) for all API calls. Configure your API base URL and authentication headers here.

### Authentication
Authentication is handled through React Context (`src/contexts/AuthContext.tsx`) which manages user sessions and provides authentication state throughout the application.

### Styling
The application uses Tailwind CSS for styling. Customize the design system by modifying `tailwind.config.js`.

## 📱 User Roles & Access

### System Administrator
- Full access to all schools and data
- School creation and management
- User role assignment
- System-wide analytics and reports

### School Administrator
- Access to school-specific data only
- Student and teacher management
- Course and schedule management
- Attendance tracking and reporting
- Device monitoring (view-only)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Different permissions for different user types
- **Data Isolation**: School-specific data isolation
- **Secure API Communication**: HTTPS and secure headers
- **Session Management**: Secure session handling

## 📊 Data Export & Reporting

- **PDF Reports**: Generate and download reports in PDF format
- **Attendance Reports**: Comprehensive attendance analytics
- **Schedule Reports**: Course and schedule information
- **User Reports**: Student and teacher information

## 🎨 UI/UX Features

- **Responsive Design**: Works seamlessly on all device sizes
- **Loading States**: Visual feedback during operations
- **Toast Notifications**: User-friendly success and error messages
- **Interactive Elements**: Hover effects and smooth transitions
- **Accessibility**: Keyboard navigation and screen reader support

## 🚀 Performance Features

- **Code Splitting**: Lazy loading of components and routes
- **Optimized Builds**: Vite-powered fast builds
- **Efficient Rendering**: React optimization techniques
- **Lazy Loading**: On-demand component loading

## 🔄 State Management

- **Local State**: Component-level state with useState
- **Global State**: Application-wide state with React Context
- **API State**: Server state management with custom hooks
- **Form State**: Form data management with controlled components

## 📱 Mobile Responsiveness

- **Mobile-First Design**: Responsive design principles
- **Touch-Friendly Interface**: Optimized for touch devices
- **Adaptive Layout**: Flexible layouts for different screen sizes
- **Mobile Navigation**: Optimized navigation for mobile devices

## 🧪 Development & Testing

- **TypeScript**: Comprehensive type checking
- **ESLint**: Code quality enforcement
- **Hot Reload**: Fast development with Vite HMR
- **Error Boundaries**: Graceful error handling

## 📈 Future Enhancements

- **Real-time Notifications**: Push notifications for important events
- **Advanced Analytics**: Detailed reporting and analytics dashboard
- **Mobile App**: Native mobile applications
- **API Documentation**: Comprehensive API documentation
- **Unit Testing**: Comprehensive test coverage
- **E2E Testing**: End-to-end testing with Playwright or Cypress

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**SmartClass** - Empowering Education Through Technology 🎓✨
