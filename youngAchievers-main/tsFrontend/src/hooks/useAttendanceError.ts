import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useToast } from '@/hooks/use-toast';
import { clearError } from '@/store/attendance/attendanceSlice';

export const useAttendanceError = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const error = useSelector((state: RootState) => state.attendance.error);

  useEffect(() => {
    if (error) {
      toast({
        title: "Attendance Error",
        description: error,
        variant: "destructive",
      });
      dispatch(clearError());
    }
  }, [error, toast, dispatch]);

  return { error };
}; 