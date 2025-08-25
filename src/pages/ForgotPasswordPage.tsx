import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/authService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setSubmitted(true);
      toast.success('Password reset link sent to your email!');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send reset link. Please try again.');
      toast.error('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto animate-fade-in">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="mx-auto h-20 w-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg mb-6 transform hover:scale-105 transition-transform duration-300">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Check Your Email
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Reset Link Sent
            </p>
            <p className="text-sm text-gray-500">
              We've sent a password reset link to your email address
            </p>
          </div>

          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 transform hover:shadow-2xl transition-all duration-300">
            <div className="text-center space-y-6">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Sent Successfully</h3>
                <p className="text-gray-600 mb-4">
                  We've sent a password reset link to <span className="font-medium text-gray-900">{email}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Please check your email and click the link to reset your password. The link will expire in 1 hour.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Didn't receive the email?</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Check your spam folder or try requesting a new link.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  Send Another Link
                </button>
                
                <Link
                  to="/login"
                  className="block w-full text-center text-green-600 hover:text-green-700 font-medium py-3 px-4 rounded-xl border border-green-200 hover:border-green-300 transition-all duration-200"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              &copy; 2024 SmartClass Portal. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto animate-fade-in">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg mb-6 transform hover:scale-105 transition-transform duration-300">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Forgot Password
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Reset Your Password
          </p>
          <p className="text-sm text-gray-500">
            Enter your email to receive a reset link
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 transform hover:shadow-2xl transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Enter your email address"
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
                    Sending Reset Link...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Reset Link
                  </span>
                )}
              </button>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors duration-200"
              >
                ← Back to Login
              </Link>
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
    </div>
  );
};

export default ForgotPasswordPage;
