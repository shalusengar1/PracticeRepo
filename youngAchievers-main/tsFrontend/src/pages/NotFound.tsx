
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NotFound: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-brand-blue">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800">Page Not Found</h2>
        <p className="text-gray-600 max-w-md">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link
          to="/dashboard"
          className="inline-block px-6 py-3 mt-4 bg-brand-blue text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
