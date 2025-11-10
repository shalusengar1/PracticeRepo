import { useState } from 'react';
import { format } from 'date-fns';
import { Session } from '@/types/session';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import { fetchSessionsByBatchId } from '@/store/batch/sessionDetailsSlice';
import sessionService from '@/api/sessionService';
import { toast } from "@/hooks/use-toast";
import { Batch } from '@/store/batch/batchSlice';
import { logBatchSessionActivity } from '@/utils/activityLogger';

export const useSessionManagement = (batch: Batch | undefined) => {
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const { sessions } = useAppSelector((state) => state.sessionDetails);

  const handleRescheduleClick = (session: Session) => {
    setSelectedSession(session);
    setNewDate(new Date(session.date));
    setNewStartTime(session.start_time || '');
    setNewEndTime(session.end_time || '');
    setRescheduleReason('');
    setIsRescheduleDialogOpen(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedSession || !newDate || !newStartTime || !newEndTime || !rescheduleReason.trim() || !batch) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields for rescheduling.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      // Format the date as YYYY-MM-DD for the API
      const formattedDate = format(newDate, 'yyyy-MM-dd');
      
      // Format the time values to include seconds (HH:mm -> HH:mm:ss)
      // Check if the time is already in HH:mm:ss format by counting the colons
      const formattedStartTime = newStartTime.split(':').length === 3 ? newStartTime : newStartTime + ':00';
      const formattedEndTime = newEndTime.split(':').length === 3 ? newEndTime : newEndTime + ':00';

      // Get the sequential session number
      const sessionNumber = sessions.findIndex(s => s.id === selectedSession.id) + 1;

      // Store original values for logging
      const oldValues = {
        date: selectedSession.date,
        start_time: selectedSession.start_time,
        end_time: selectedSession.end_time,
        status: selectedSession.status
      };

      const newValues = {
        date: formattedDate,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        notes: rescheduleReason,
        status: 'rescheduled'  // Update status to rescheduled
      };
      
      await sessionService.rescheduleSession(parseInt(selectedSession.id), newValues);

      // Log the rescheduling action with the correct session number and batch name
      logBatchSessionActivity(
        dispatch,
        'Session Rescheduled',
        `${batch.name} - Session ${sessionNumber}`,
        `Session ${sessionNumber} of batch "${batch.name}" was rescheduled , from ${format(new Date(selectedSession.date), 'MMMM d, yyyy')} (${selectedSession.start_time} - ${selectedSession.end_time}) to ${format(newDate, 'MMMM d, yyyy')} (${formattedStartTime} - ${formattedEndTime}). Reason: ${rescheduleReason}`,
        oldValues,
        newValues,
        parseInt(selectedSession.id)
      );

      // Refresh the sessions data
      if (batch?.id) {
        dispatch(fetchSessionsByBatchId(parseInt(batch.id)));
      }
      
      toast({
        title: "Session Rescheduled",
        description: `Session ${sessionNumber} of "${batch.name}" has been successfully rescheduled to ${format(newDate, 'MMMM d, yyyy')}.`,
      });
      
      // Close the dialog and reset state
      setIsRescheduleDialogOpen(false);
      setSelectedSession(null);
      setNewDate(undefined);
      setRescheduleReason('');
    } catch (error: any) {
      toast({
        title: "Rescheduling Failed",
        description: error.message || "Failed to reschedule session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabledDates = (date: Date) => {
    // Disable dates outside the batch schedule
    if (!batch || !batch.startDate || !batch.endDate) {
      return false;
    }

    try {
      const startDate = new Date(batch.startDate);
      const endDate = new Date(batch.endDate);
      
      return date < startDate || date > endDate;
    } catch (e) {
      console.error("Error comparing dates:", e);
      return false;
    }
  };

  return {
    isRescheduleDialogOpen,
    setIsRescheduleDialogOpen,
    selectedSession,
    newDate,
    setNewDate,
    newStartTime,
    setNewStartTime,
    newEndTime,
    setNewEndTime,
    rescheduleReason,
    setRescheduleReason,
    handleRescheduleClick,
    handleRescheduleSubmit,
    disabledDates,
    isSubmitting
  };
};
