// /var/www/youngachivers-bk/tsFrontend/src/components/Student/StudentList.tsx
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Pause, Play } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Member } from '@/types/member';
import { useToast } from '@/hooks/use-toast';
import { useAppDispatch } from '@/hooks/reduxHooks/hooks';
import { toggleMemberPauseStatus } from '@/store/member/memberSlice';
import { format, parseISO, isFuture, isEqual, startOfDay, endOfDay } from 'date-fns';
import { TruncatedText } from '@/components/ui/truncated-text';
import { handleApiError } from '@/utils/errorHandling';

interface StudentListProps {
  students: Member[];
}

const StudentList: React.FC<StudentListProps> = ({ students = [] }) => {
  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Member | null>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [pauseEndDate, setPauseEndDate] = useState('');
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const isStudentEffectivelyPaused = (student: Member): boolean => {
    if (!student.excused_until) {
      return false;
    }
    try {
      const excusedUntilDate = endOfDay(parseISO(student.excused_until)); 
      const today = startOfDay(new Date()); 
      return isEqual(excusedUntilDate, today) || isFuture(excusedUntilDate);
    } catch (error) {
      console.error("Error parsing excused_until date:", student.excused_until, error);
      return false; 
    }
  };

  const handleOpenPauseDialog = (student: Member) => {
    setSelectedStudent(student);
    setPauseReason(student.excuse_reason || '');
    try {
      setPauseEndDate(student.excused_until ? format(parseISO(student.excused_until), 'yyyy-MM-dd') : '');
    } catch (error) {
      console.error("Error formatting pauseEndDate for dialog:", student.excused_until, error);
      setPauseEndDate(''); 
    }
    setIsPauseDialogOpen(true);
  };

  const handleOpenResumeDialog = (student: Member) => {
    setSelectedStudent(student);
    setIsResumeDialogOpen(true);
  };

  const handlePauseSubmit = async () => {
    if (!selectedStudent) {
      toast({
        title: "Error",
        description: "No student selected for pausing attendance.",
        variant: "destructive",
      });
      return;
    }

    if (!pauseReason) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for pausing the attendance.",
        variant: "destructive",
      });
      return;
    }

    if (!pauseEndDate) {
      toast({
        title: "Missing Information",
        description: "Please specify an end date for the pause period.",
        variant: "destructive",
      });
      return;
    }

    try {
      const memberId = typeof selectedStudent.id === 'string' ? parseInt(selectedStudent.id, 10) : selectedStudent.id;
      if (isNaN(memberId)) {
        throw new Error("Invalid member ID.");
      }

      await dispatch(toggleMemberPauseStatus({
        memberId: memberId,
        action: 'pause', 
        pause_reason: pauseReason,
        pause_end_date: pauseEndDate,
      })).unwrap();

      toast({
        title: "Student Attendance Paused",
        description: `${selectedStudent.name}'s attendance has been paused until ${format(parseISO(pauseEndDate), 'MMM dd, yyyy')}`,
      });
      setIsPauseDialogOpen(false);
      setSelectedStudent(null);
      setPauseReason('');
      setPauseEndDate('');
    } catch (error) {
      toast({
        title: "Error Pausing Attendance",
        description: handleApiError(error, "Failed to pause attendance"),
        variant: "destructive",
      });
    }
  };

  const handleResumeSubmit = async () => {
    if (!selectedStudent) {
      toast({
        title: "Error",
        description: "No student selected for resuming attendance.",
        variant: "destructive",
      });
      return;
    }

    try {
      const memberId = typeof selectedStudent.id === 'string' ? parseInt(selectedStudent.id, 10) : selectedStudent.id;
      if (isNaN(memberId)) {
        throw new Error("Invalid member ID.");
      }
      await dispatch(toggleMemberPauseStatus({
        memberId: memberId,
        action: 'resume', 
      })).unwrap();

      toast({
        title: "Student Attendance Resumed",
        description: `${selectedStudent.name}'s attendance has been resumed.`,
      });
      setIsResumeDialogOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      toast({
        title: "Error Resuming Attendance",
        description: handleApiError(error, "Failed to resume attendance"),
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (student: Member) => {
    if (isStudentEffectivelyPaused(student)) {
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Paused</Badge>;
    }
    switch (student.status.toLowerCase()) {
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactive</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'blacklisted':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Blacklisted</Badge>;
      default:
        return <Badge variant="outline">Unknown ({student.status})</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {students.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No members found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Enrolled Batches</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const isPaused = isStudentEffectivelyPaused(student);
                const batchesToDisplay = student.batches || [];
                const batchNames = batchesToDisplay.map(batch => batch.name).join(', ');
                
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      <TruncatedText text={student.name} maxLength={25} />
                    </TableCell>
                    <TableCell>
                      <TruncatedText text={student.email} type="email" />
                    </TableCell>
                    <TableCell>{student.mobile}</TableCell>
                    <TableCell>
                      {batchesToDisplay.length > 0 ? (
                        <TruncatedText text={batchNames} type="batch" />
                      ) : (
                        "None"
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(student)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {isPaused ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenResumeDialog(student)}
                            className="flex items-center gap-1"
                          >
                            <Play size={14} />
                            Resume
                          </Button>
                        ) : student.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPauseDialog(student)}
                            className="flex items-center gap-1"
                          >
                            <Pause size={14} />
                            Pause
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pause Dialog */}
      <Dialog open={isPauseDialogOpen} onOpenChange={setIsPauseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause Member Attendance</DialogTitle>
            <DialogDescription>
              Use this form to temporarily pause a member's attendance. This will mark them as excused until the specified date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="student-name">Member</Label>
              <Input
                id="student-name"
                value={selectedStudent?.name || ''}
                readOnly
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pause-reason">Reason for Pause <span className="text-red-500">*</span></Label>
              <Textarea
                id="pause-reason"
                placeholder="Medical leave, family emergency, etc."
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pause-end-date">Pause Until Date <span className="text-red-500">*</span></Label>
              <Input
                id="pause-end-date"
                type="date"
                value={pauseEndDate}
                onChange={(e) => setPauseEndDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPauseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePauseSubmit}
              disabled={!pauseReason || !pauseEndDate}
            >
              Pause Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Dialog */}
      <Dialog open={isResumeDialogOpen} onOpenChange={setIsResumeDialogOpen}>
         <DialogContent>
          <DialogHeader>
            <DialogTitle>Resume Member Attendance</DialogTitle>
            <DialogDescription>
              You are about to resume regular attendance tracking for this member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resume-student-name">Member</Label>
              <Input
                id="resume-student-name"
                value={selectedStudent?.name || ''}
                readOnly
                disabled
              />
            </div>
            {selectedStudent?.excuse_reason && ( 
              <div className="space-y-2">
                <Label>Current Pause Reason</Label>
                <div className="p-3 bg-gray-50 rounded-md text-sm">
                  {selectedStudent.excuse_reason}
                </div>
              </div>
            )}
             {selectedStudent?.excused_until && (
              <div className="space-y-2">
                <Label>Currently Paused Until</Label>
                <div className="p-3 bg-gray-50 rounded-md text-sm">
                  {(() => {
                    try {
                      return selectedStudent.excused_until ? format(parseISO(selectedStudent.excused_until), 'MMM dd, yyyy') : "N/A";
                    } catch (e) {
                      console.error("Error formatting excused_until in resume dialog:", selectedStudent.excused_until, e);
                      return "Invalid Date";
                    }
                  })()}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResumeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResumeSubmit}>
              Resume Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentList;
