import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { getPartnerRecentAttendance } from '@/store/attendance/attendanceSlice';
import { useAttendanceError } from '@/hooks/useAttendanceError';
import { format } from 'date-fns';

interface RecentAttendanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: number;
  partnerName: string;
}

const RecentAttendanceDialog: React.FC<RecentAttendanceDialogProps> = ({
  isOpen,
  onClose,
  partnerId,
  partnerName,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  useAttendanceError();
  const { recentAttendance, loading } = useSelector(
    (state: RootState) => state.attendance
  );

  useEffect(() => {
    if (isOpen && partnerId) {
      dispatch(getPartnerRecentAttendance(partnerId));
    }
  }, [isOpen, partnerId, dispatch]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      case 'excused':
        return <Badge className="bg-blue-100 text-blue-800">Excused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recent Attendance - {partnerName}</DialogTitle>
          <DialogDescription>
            Recent attendance records for this partner
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading recent attendance...</p>
            </div>
          ) : recentAttendance.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent attendance records found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">
                          {record.batch_session?.batch?.name || 'Unknown Batch'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {record.batch_session?.date 
                            ? format(new Date(record.batch_session.date), 'PPP')
                            : 'Unknown Date'
                          }
                        </p>
                      </div>
                    </div>
                    {record.notes && (
                      <p className="text-sm text-gray-600 mt-1">{record.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(record.status)}
                    <p className="text-xs text-gray-400">
                      {format(new Date(record.marked_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecentAttendanceDialog;
