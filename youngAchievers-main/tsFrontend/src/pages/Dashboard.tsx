
import React from 'react';
import DashboardMetrics from '../components/Dashboard/DashboardMetrics';
import { Link } from 'react-router-dom'; // Import Link
import RecentActivity from '../components/Dashboard/RecentActivity';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight animate-fade-in">
        Admin Dashboard
      </h1>
      
      <DashboardMetrics />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="col-span-1 lg:col-span-2">
          <RecentActivity />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2 md:space-y-3">
            <Link to="/users/new" className="block">
              <button className="w-full py-2.5 px-4 rounded-lg bg-gray-50 text-left text-gray-800 hover:bg-gray-100 transition-colors">
                Create New User
              </button>
            </Link>
            <Link 
              to="/batches" 
              state={{ openAddBatchSheet: true }} 
              className="block"
            >
              <button className="w-full py-2.5 px-4 rounded-lg bg-gray-50 text-left text-gray-800 hover:bg-gray-100 transition-colors">
                Add New Batch
              </button>
            </Link>
            <Link 
              to="/venues" 
              state={{ openAddVenueDialog: true }} 
              className="block"
            >
              <button className="w-full py-2.5 px-4 rounded-lg bg-gray-50 text-left text-gray-800 hover:bg-gray-100 transition-colors">
                Register Venue
              </button>
            </Link>
            {/* <Link to="/reports" className="block"> 
              <button className="w-full py-2.5 px-4 rounded-lg bg-gray-50 text-left text-gray-800 hover:bg-gray-100 transition-colors">
                View Reports
              </button>
            </Link> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
