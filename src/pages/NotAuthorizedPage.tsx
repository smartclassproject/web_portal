import React from 'react';
import { Link } from 'react-router-dom';

const NotAuthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Authorized</h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to access this module.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotAuthorizedPage;
