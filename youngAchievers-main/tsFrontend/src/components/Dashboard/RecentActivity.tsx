import React from 'react';
import { User, Clock } from 'lucide-react';
import { useAppSelector } from '@/hooks/reduxHooks/hooks';

interface ActivityItem {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  action: string;
  target: string;
  timestamp: string;
}

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
};

const RecentActivity: React.FC = () => {
  const { stats, loading } = useAppSelector((state) => state.dashboard);

  // Convert recent activities from dashboard stats to ActivityItem format
  const activities: ActivityItem[] = stats?.recent_activities?.map(log => ({
    id: log.id.toString(),
    user: {
      name: log.user,
      avatar: undefined // Add avatar if available
    },
    action: log.action.toLowerCase(),
    target: log.target,
    timestamp: formatTimeAgo(log.created_at)
  })) || [];

  if (loading || !stats) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <div className="px-6 py-8 text-center text-gray-500">
          Loading recent activities...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="px-6 py-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-gray-100 p-2">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>{' '}
                    {activity.action} {activity.target}
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="mr-1 h-3 w-3" />
                    {activity.timestamp}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            No recent activities
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;