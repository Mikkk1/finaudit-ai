import React from 'react';
import { Clock, User, AlertCircle, Edit, Eye, Download, Upload, Trash2 } from 'lucide-react';

interface Activity {
  action: string;
  user: string;
  timestamp: string;
  type?: string;
}

interface ActivityLogPanelProps {
  document: {
    activityLog: Activity[];
  };
}

const ActivityLogPanel: React.FC<ActivityLogPanelProps> = ({ document }) => {
  const getActivityIcon = (action: string) => {
    if (action.toLowerCase().includes('edit')) return Edit;
    if (action.toLowerCase().includes('view')) return Eye;
    if (action.toLowerCase().includes('download')) return Download;
    if (action.toLowerCase().includes('upload')) return Upload;
    if (action.toLowerCase().includes('delete')) return Trash2;
    if (action.toLowerCase().includes('error')) return AlertCircle;
    return Clock;
  };

  const getActivityColor = (action: string) => {
    if (action.toLowerCase().includes('error')) return 'text-error-red';
    if (action.toLowerCase().includes('delete')) return 'text-warning-orange';
    if (action.toLowerCase().includes('edit')) return 'text-soft-gold';
    if (action.toLowerCase().includes('upload')) return 'text-success-green';
    return 'text-slate-gray';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="bg-secondary-bg rounded-xl shadow-card border border-light-border animate-fadeIn">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-navy-blue to-[#004D99] rounded-t-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Activity Log</h3>
          <span className="text-sm text-primary-bg px-3 py-1 rounded-full bg-opacity-20 bg-white">
            {document.activityLog.length} activities
          </span>
        </div>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-light-border">
        {document.activityLog.map((activity, index) => {
          const IconComponent = getActivityIcon(activity.action);
          const iconColor = getActivityColor(activity.action);

          return (
            <div
              key={index}
              className="px-6 py-4 hover:bg-primary-bg transition-colors duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className={`${iconColor} p-2 rounded-lg bg-primary-bg`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-dark-text font-medium truncate">
                      {activity.action}
                    </p>
                    <span className="text-sm text-muted-text">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex items-center mt-1">
                    <User className="h-4 w-4 text-slate-gray mr-1" />
                    <p className="text-sm text-slate-gray truncate">
                      {activity.user}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {document.activityLog.length === 0 && (
        <div className="px-6 py-8 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-text mb-3" />
          <p className="text-dark-text font-medium">No activity yet</p>
          <p className="text-sm text-muted-text mt-1">
            Activities will appear here when users interact with the document
          </p>
        </div>
      )}
    </div>
  );
};

export default ActivityLogPanel;