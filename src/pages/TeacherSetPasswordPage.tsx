import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherSetPassword } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const TeacherSetPasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('');

  useEffect(() => {
    // Get email and default password from session storage
    const storedEmail = sessionStorage.getItem('teacherEmail');
    const storedDefaultPassword = sessionStorage.getItem('defaultPassword');

    if (storedEmail && storedDefaultPassword) {
      setEmail(storedEmail);
      setDefaultPassword(storedDefaultPassword);
    } else if (user?.email && user?.requiresPasswordChange) {
      // If user is logged in but needs to change password
      setEmail(user.email);
      if (!storedDefaultPassword) {
        // If default password is not in session, show a message
        // The user will need to enter their current default password
        // For now, we'll still require it from session storage
        // In a real scenario, we might want to prompt for current password
      } else {
        setDefaultPassword(storedDefaultPassword);
      }
    } else if (!storedEmail || !storedDefaultPassword) {
      // If not found and user doesn't require password change, redirect to login
      if (!user?.requiresPasswordChange) {
        navigate('/login');
        return;
      }
    }
  }, [navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword === defaultPassword) {
      setError('New password must be different from the default password');
      return;
    }

    setLoading(true);

    try {
      const result = await teacherSetPassword(email, defaultPassword, newPassword);

      if (result.success) {
        // Clear session storage
        sessionStorage.removeItem('teacherEmail');
        sessionStorage.removeItem('defaultPassword');

        // Store user data and token
        const { token, user: updatedUser } = result.data;
        // Remove requiresPasswordChange flag after password is set
        const userWithoutPasswordChange = { ...updatedUser, requiresPasswordChange: false };
        localStorage.setItem('user', JSON.stringify(userWithoutPasswordChange));
        localStorage.setItem('token', token);

        // Update auth context
        if (login) {
          // Refresh the user in context
          window.location.reload();
        }

        toast.success('Password set successfully! Welcome to SmartClass.');
        
        // Redirect to teacher dashboard
        navigate('/teacher/dashboard');
      } else {
        setError(result.message || 'Failed to set password');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to set password';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg mb-6">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Set Your Password
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            First-time Login
          </p>
          <p className="text-sm text-gray-500">
            Please set a new password for your account
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-200 text-red-500 px-4 py-3 rounded-lg text-sm flex items-center">
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-3">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                placeholder="Enter your new password"
                minLength={4}
              />
              <p className="mt-1 text-xs text-gray-500">Must be at least 4 characters long</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-3">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                placeholder="Confirm your new password"
                minLength={4}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-green-100 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    Setting password...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Set Password
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            &copy; 2026 SmartClass Portal. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherSetPasswordPage;
