import React, { useEffect } from 'react';
import { Users, BookOpen, Building, Calendar, Award, Users2, BarChart2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import { Link } from 'react-router-dom'; // Import Link
import { fetchDashboardStats } from '@/store/dashboard/dashboardSlice';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: string; positive: boolean };
  linkTo?: string; // Add linkTo prop
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, trend, linkTo }) => {
  const cardContent = (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.positive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-brand-blue/10 rounded-lg">
          <Icon size={24} className="text-brand-blue" />
        </div>
      </div>
    </div>
  );

  return linkTo ? (
    <Link to={linkTo} className="block h-full">{cardContent}</Link>
  ) : (
    cardContent
  );
};

const DashboardMetrics: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stats, loading } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
      <MetricCard 
        title="Total Users" 
        value={stats.total_users} 
        icon={Users}
        linkTo="/users"
        trend={{ value: `${Math.abs(stats.user_growth).toFixed(1)}%`, positive: stats.user_growth > 0 }}
      />
      <MetricCard 
        title="Total Batches" 
        value={stats.total_batches} 
        icon={BookOpen}
        linkTo="/batches"
        trend={{ value: `${Math.abs(stats.batch_growth).toFixed(1)}%`, positive: stats.batch_growth > 0 }}
      />
      <MetricCard 
        title="Active Venues" 
        value={stats.active_venues} 
        icon={Building}
        linkTo="/venues"
      />
      <MetricCard 
        title="Upcoming Sessions" 
        value={stats.upcoming_events} 
        icon={Calendar}
        linkTo="/batches" // Or a future /calendar page
      />
      <MetricCard 
        title="Total Programs" 
        value={stats.total_programs} 
        icon={Award}
        linkTo="/settings/programs"
      />
      <MetricCard 
        title="Active Partners" 
        value={stats.active_partners} 
        icon={Users2}
        linkTo="/partners"
      />
      <MetricCard 
        title="Total Sessions" 
        value={stats.total_sessions} 
        icon={BarChart2}
        linkTo="/batches" // Navigates to batch management where session routines are
      />
      <MetricCard 
        title="Completed Sessions" 
        value={stats.completed_sessions} 
        icon={Calendar}
        linkTo="/batches" // Navigates to batch management
      />
    </div>
  );
};

export default DashboardMetrics;
