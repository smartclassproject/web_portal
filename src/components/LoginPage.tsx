import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'super_admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/school/dashboard');
      }
    }
  }, [user, navigate]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const user = await login({ email, password });
      
      // Redirect based on user role
      if (user.role === 'super_admin') {
        navigate('/admin/dashboard');
      } else if(user.role === 'school_admin'){
        navigate('/school/dashboard');
      }else{
        setError('Unknown user role!');
      }
    } catch (error) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto animate-fade-in">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg mb-6 transform hover:scale-105 transition-transform duration-300">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            SmartClass Portal
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Welcome Back
          </p>
          <p className="text-sm text-gray-500">
            Sign in to your account
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 transform hover:shadow-2xl transition-all duration-300">
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
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                placeholder="Enter your password"
              />
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link 
                to="/forgot-password" 
                className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors duration-200"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-green-100 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <span className="flex items-center gap-3">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            &copy; 2024 SmartClass Portal. All rights reserved.
          </p>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default LoginPage; 