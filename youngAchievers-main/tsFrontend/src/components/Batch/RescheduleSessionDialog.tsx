import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react'; // Added Clock icon
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input'; // Added Input for time
import { cn } from '@/lib/utils';
import { Session } from '@/types/session';
import { useToast } from '@/hooks/use-toast';

interface RescheduleSessionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSession: Session | null;
  newDate: Date | undefined;
  setNewDate: (date: Date | undefined) => void;
  newStartTime: string; // Added newStartTime
  setNewStartTime: (time: string) => void; // Added setNewStartTime
  newEndTime: string; // Added newEndTime
  setNewEndTime: (time: string) => void; // Added setNewEndTime
  rescheduleReason: string;
  setRescheduleReason: (reason: string) => void;
  handleRescheduleSubmit: () => void;
  disabledDates: (date: Date) => boolean;
  isSubmitting: boolean;
  sessionNumber?: number;
  sessions: Session[]; // Added sessions array for conflict checking
}

const RescheduleSessionDialog: React.FC<RescheduleSessionDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedSession,
  newDate,
  setNewDate,
  newStartTime,
  setNewStartTime,
  newEndTime,
  setNewEndTime,
  rescheduleReason,
  setRescheduleReason,
  handleRescheduleSubmit,
  disabledDates,
  isSubmitting,
  sessionNumber,
  sessions
}) => {
  const originalDate = selectedSession?.date ? new Date(selectedSession.date) : undefined;
  const originalStartTime = selectedSession?.start_time || '';
  const originalEndTime = selectedSession?.end_time || '';
  const { toast } = useToast();

  // Initialize time fields with original session times when dialog opens for a selected session
  React.useEffect(() => {
    if (isOpen && selectedSession) {
      setNewStartTime(selectedSession.start_time || '');
      setNewEndTime(selectedSession.end_time || '');
    }
  }, [isOpen, selectedSession, setNewStartTime, setNewEndTime]);

  // Function to check for time conflicts
  const checkTimeConflict = (date: Date, startTime: string, endTime: string): Session | null => {
    if (!date || !startTime || !endTime) return null;

    const targetDate = format(date, 'yyyy-MM-dd');
    
    // Find sessions on the same date (excluding the current session being rescheduled)
    const sessionsOnSameDate = sessions.filter(session => {
      if (session.id === selectedSession?.id) return false; // Exclude current session
      return session.date === targetDate;
    });

    // Check for time conflicts
    for (const session of sessionsOnSameDate) {
      const sessionStart = session.start_time;
      const sessionEnd = session.end_time;
      
      // Normalize time formats to ensure consistent comparison
      const normalizeTime = (time: string) => {
        // Remove seconds if present (HH:mm:ss -> HH:mm)
        return time.split(':').slice(0, 2).join(':');
      };
      
      const newStart = normalizeTime(startTime);
      const newEnd = normalizeTime(endTime);
      const existingStart = normalizeTime(sessionStart);
      const existingEnd = normalizeTime(sessionEnd);
      
      // Check if the new time range overlaps with existing session
      // Overlap occurs when:
      // 1. New start time is before existing end time AND new end time is after existing start time
      if (newStart < existingEnd && newEnd > existingStart) {
        return session;
      }
    }
    
    return null;
  };

  const handleSubmit = () => {
    if (!rescheduleReason.trim()) {
      toast({
        title: "Required Field Missing",
        description: "Please provide a reason for rescheduling",
        variant: "destructive",
      });
      return;
    }

    // Validate that end time is after start time
    if (newStartTime && newEndTime && (newEndTime <= newStartTime)) {
      toast({
        title: "Invalid Time",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    // Check for time conflicts
    if (newDate && newStartTime && newEndTime) {
      const conflictingSession = checkTimeConflict(newDate, newStartTime, newEndTime);
      if (conflictingSession) {
        const conflictSessionNumber = sessions.findIndex(s => s.id === conflictingSession.id) + 1;
        toast({
          title: "Time Conflict",
          description: `This time conflicts with Session ${conflictSessionNumber} (${conflictingSession.start_time} - ${conflictingSession.end_time}) on the same day.`,
          variant: "destructive",
        });
        return;
      }
    }

    handleRescheduleSubmit();
  };

  // Check for conflicts in real-time and show warning
  const conflictingSession = newDate && newStartTime && newEndTime 
    ? checkTimeConflict(newDate, newStartTime, newEndTime) 
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Session {sessionNumber}</DialogTitle>
          <DialogDescription>
            Update the date and time for Session {sessionNumber}.
            {originalDate && (
              <span className="block mt-1 text-xs text-gray-500">
                Original: {format(originalDate, 'MMM d, yyyy')} from {originalStartTime} to {originalEndTime}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="date" className="text-sm font-medium">New Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newDate ? format(newDate, "PPP") : <span>Select a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newDate}
                  onSelect={setNewDate}
                  disabled={disabledDates}
                  initialFocus
                  fromDate={new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="startTime" className="text-sm font-medium">New Start Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  id="startTime"
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="pl-10" // Add padding for the icon
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="endTime" className="text-sm font-medium">New End Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  id="endTime"
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="pl-10" // Add padding for the icon
                />
              </div>
            </div>
          </div>

          {/* Show time conflict warning */}
          {conflictingSession && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-red-800">
                  <p className="font-medium">Time Conflict Detected</p>
                  <p className="mt-1">
                    This time conflicts with Session {sessions.findIndex(s => s.id === conflictingSession.id) + 1} 
                    ({conflictingSession.start_time} - {conflictingSession.end_time}) on the same day.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid gap-2">
            <label htmlFor="reason" className="text-sm font-medium">Reason for Rescheduling</label>
            <Textarea
              id="reason"
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              placeholder="Please provide a reason for rescheduling this session..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={!newDate || !newStartTime || !newEndTime || isSubmitting || !!conflictingSession}
          >
            {isSubmitting ? "Submitting..." : "Reschedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleSessionDialog;
