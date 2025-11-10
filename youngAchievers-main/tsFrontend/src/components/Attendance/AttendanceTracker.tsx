import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Check, Calendar as CalendarIcon, AlertCircle, GraduationCap, UserCog } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { useAttendanceError } from '@/hooks/useAttendanceError';
import {
  fetchBatches,
  markAttendance,
  fetchAllAttendanceForBatch,
  clearAllBatchAttendanceData,
  clearError,
  selectIsSessionEditable
} from '@/store/attendance/attendanceSlice';

interface Person {
  id: number;
  name: string;
  email: string;
  excused_until?: string;
  status: string;
}

interface AttendanceRecord {
  id: number;
  status: 'present' | 'absent' | 'excused' | 'not marked';
  display_status: 'present' | 'absent' | 'excused' | 'not marked';
  member?: Person;
  partner?: Person;
  marked_at: string;
  notes?: string;
  batch_session?: {
    id: number;
    date: string;
    batch?: { id: number; name: string };
  };
}

interface Batch {
  id: number;
  name: string;
  members: Person[];
  partners: Person[];
}

const AttendanceTracker: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  useAttendanceError();
  
  const { 
    batches: rawBatches, 
    allBatchAttendanceData: rawAttendanceData,
    sessionsFromBatch,
    loading,
    currentDate
  } = useSelector((state: RootState) => state.attendance);
  
  // Type cast the Redux state to our interfaces
  const batches = rawBatches as unknown as Batch[];
  const allBatchAttendanceData = rawAttendanceData as unknown as Record<string, AttendanceRecord[]>;
  
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [attendanceType, setAttendanceType] = useState<'member' | 'partner'>('member');
  const [derivedBatchSessions, setDerivedBatchSessions] = useState<Date[]>([]);
  const [markingAttendance, setMarkingAttendance] = useState<{[key: string]: boolean}>({});

  // Memoize the session editability map
  const sessionEditabilityMap = useMemo(() => {
    if (!derivedBatchSessions || !currentDate) return new Map<string, boolean>();
    
    return new Map(
      derivedBatchSessions.map(date => [
        format(date, 'yyyy-MM-dd'),
        new Date(format(date, 'yyyy-MM-dd')).setHours(0, 0, 0, 0) <= new Date(currentDate).setHours(0, 0, 0, 0)
      ])
    );
  }, [derivedBatchSessions, currentDate]);

  useEffect(() => {
    dispatch(fetchBatches());
  }, [dispatch]);

  useEffect(() => {
    if (selectedBatch && attendanceType) {
      dispatch(fetchAllAttendanceForBatch({
        batch_id: parseInt(selectedBatch),
        type: attendanceType,
      }));
    } else {
      dispatch(clearAllBatchAttendanceData()); 
      setSelectedDate(undefined); 
      setDerivedBatchSessions([]);
    }
  }, [selectedBatch, attendanceType, dispatch]);

  useEffect(() => {
    if (sessionsFromBatch && sessionsFromBatch.length > 0) {
      const sessionDatesObjects = sessionsFromBatch.map(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day); // Ensures local date
      }).sort((a, b) => a.getTime() - b.getTime());

      setDerivedBatchSessions(sessionDatesObjects);

      const isSelectedDateValidSession = selectedDate && 
        sessionDatesObjects.some(session => session.toDateString() === selectedDate.toDateString());

      if ((!selectedDate || !isSelectedDateValidSession) && sessionDatesObjects.length > 0) {
        setSelectedDate(sessionDatesObjects[0]); 
      }
    } else {
      setDerivedBatchSessions([]);
      if (!sessionsFromBatch || sessionsFromBatch.length === 0) {
          setSelectedDate(undefined);
      }
    }
  }, [sessionsFromBatch]); // Only depends on sessionsFromBatch

  const currentBatch = useMemo(() => 
    batches.find(batch => batch.id === parseInt(selectedBatch || '0')), 
    [batches, selectedBatch]
  );
  
  const currentPeople = useMemo(() => {
    if (!currentBatch) return [];
    // Only return active people
    return (attendanceType === 'member' ? currentBatch.members : currentBatch.partners)
      ?.filter(person => person.status.toLowerCase() === 'active') || [];
  }, [currentBatch, attendanceType]);

  const isPersonExcused = (person: any) => {
    if (!person.excused_until || !selectedDate) return false;
    const excusedUntil = new Date(person.excused_until);
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    return selectedDateOnly <= excusedUntil;
  };

  const hasSessionOnSelectedDate = useMemo(() => {
    if (!selectedDate || !derivedBatchSessions || derivedBatchSessions.length === 0) return false;
    return derivedBatchSessions.some(session => 
      session.toDateString() === selectedDate.toDateString()
    );
  }, [selectedDate, derivedBatchSessions]);

  const attendanceForSelectedDate = useMemo((): AttendanceRecord[] => {
    if (!selectedDate || !allBatchAttendanceData) return [];
    const formattedDateKey = format(selectedDate, 'yyyy-MM-dd');
    return allBatchAttendanceData[formattedDateKey] || [];
  }, [selectedDate, allBatchAttendanceData]);

  const getAttendanceStatus = (personId: number) => {
    const record = attendanceForSelectedDate.find(r => {
      const personMatchId = attendanceType === 'member' ? r.member?.id : r.partner?.id;
      return personMatchId === personId;
    });
    return record ? record.status : 'not marked';
  };

  const isSessionEditable = useCallback((date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return sessionEditabilityMap.get(formattedDate) ?? false;
  }, [sessionEditabilityMap]);

  const handleMarkAttendance = async (personId: number, status: 'present' | 'absent' | 'excused') => {
    if (!selectedBatch || !selectedDate) {
      toast({ title: "Error", description: "Please select a batch and date first", variant: "destructive" });
      return;
    }

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const isEditable = sessionEditabilityMap.get(formattedDate) ?? false;

    if (!isEditable) {
      toast({
        title: "Cannot Mark Attendance",
        description: "Attendance can only be marked for past or current dates",
        variant: "destructive",
      });
      return;
    }

    if (!hasSessionOnSelectedDate) {
      toast({ title: "No Session", description: "No session scheduled for this date.", variant: "destructive" });
      return;
    }

    const person = currentPeople.find(p => p.id === personId);
    if (person && isPersonExcused(person) && status !== 'excused') {
      toast({
        title: "Cannot Mark Attendance",
        description: `This ${attendanceType} is excused until ${format(new Date(person.excused_until), 'yyyy-MM-dd')}. Please resume attendance first.`,
        variant: "destructive",
      });
      return;
    }

    const attendanceKey = `${personId}-${formattedDate}`;
    const currentStatus = getAttendanceStatus(personId);
    setMarkingAttendance(prev => ({ 
      ...prev, 
      [`${attendanceKey}-${status}`]: true,
      [`${attendanceKey}-${currentStatus}`]: true 
    }));

    try {
      await dispatch(markAttendance({
        type: attendanceType,
        person_id: personId,
        batch_id: parseInt(selectedBatch),
        date: formattedDate,
        status,
      })).unwrap();
      toast({ title: "Attendance Marked", description: `Marked as ${status}` });
    } catch (err) {
      console.error("Failed to mark attendance:", err);
    } finally {
      setMarkingAttendance(prev => {
        const newState = { ...prev };
        delete newState[`${attendanceKey}-${status}`];
        delete newState[`${attendanceKey}-${currentStatus}`];
        return newState;
      });
    }
  };

  const getPersonTypeLabel = (type: 'member' | 'partner') => {
    return type === 'member' ? 'Student' : 'Teacher';
  };

  const getSessionModifierClass = (date: Date) => {
    const isSession = derivedBatchSessions.some(d => d.toDateString() === date.toDateString());
    if (!isSession) return '';

    const isEditable = sessionEditabilityMap.get(format(date, 'yyyy-MM-dd')) ?? false;
    return isEditable ? 'past-session' : 'future-session';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Batch</CardTitle>
            <CardDescription>Choose batch for attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedBatch} onValueChange={setSelectedBatch} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading batches..." : "Select batch"} />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id.toString()}>{batch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Session Date</CardTitle>
            <CardDescription>Attendance for selected session</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (!selectedBatch) {
                  toast({
                    title: "No Batch Selected",
                    description: "Please select a batch first before choosing a date.",
                    variant: "destructive"
                  });
                  return;
                }
                
                if (date && derivedBatchSessions.some(d => d.toDateString() === date.toDateString())) {
                  setSelectedDate(date);
                } else if (!date) {
                  setSelectedDate(undefined);
                } else {
                  toast({
                    title: "Not a Session Date",
                    description: "Please select a highlighted session date.",
                    variant: "destructive"
                  });
                }
              }}
              className="rounded-md border"
              modifiers={{
                'past-session': (date: Date) => {
                  const isSession = derivedBatchSessions.some(d => d.toDateString() === date.toDateString());
                  return isSession && isSessionEditable(date);
                },
                'future-session': (date: Date) => {
                  const isSession = derivedBatchSessions.some(d => d.toDateString() === date.toDateString());
                  return isSession && !isSessionEditable(date);
                }
              }}
              modifiersStyles={{
                'past-session': { backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                'future-session': { backgroundColor: '#93c5fd', color: 'white', fontWeight: 'bold' }
              }}
              classNames={{
                day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground ring-2 ring-offset-1 ring-purple-600 dark:ring-purple-500',
              }}
              disabled={(date) => {
                if (!selectedBatch || derivedBatchSessions.length === 0) return false;
                return !derivedBatchSessions.some(sessionDate => sessionDate.toDateString() === date.toDateString());
              }}
            />
            {derivedBatchSessions.length > 0 && (
              <div className="mt-2 flex flex-col gap-1 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Past/Current Sessions</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-300 rounded"></div>
                  <span>Future Sessions</span>
                </div>
                <div className="mt-1 border-t pt-1">
                  <div>First Session: {format(derivedBatchSessions[0], 'MMM d, yyyy')}</div>
                  <div>Last Session: {format(derivedBatchSessions[derivedBatchSessions.length - 1], 'MMM d, yyyy')}</div>
                </div>
              </div>
            )}
            {!selectedBatch && <p className="mt-2 text-sm text-gray-500">Select a batch to see session dates.</p>}
            {selectedBatch && derivedBatchSessions.length === 0 && !loading && <p className="mt-2 text-sm text-gray-500">No sessions found for this batch.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Type</CardTitle>
            <CardDescription>Choose who to mark attendance for</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button 
              variant={attendanceType === 'member' ? 'default' : 'outline'} 
              onClick={() => setAttendanceType('member')} 
              className="w-full justify-start"
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              Students
            </Button>
            <Button 
              variant={attendanceType === 'partner' ? 'default' : 'outline'} 
              onClick={() => setAttendanceType('partner')} 
              className="w-full justify-start"
            >
              <UserCog className="mr-2 h-4 w-4" />
              Teachers
            </Button>
          </CardContent>
        </Card>
      </div>

      {selectedBatch && selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              {getPersonTypeLabel(attendanceType)} Attendance for {currentBatch?.name}
            </CardTitle>
            <CardDescription>Session Date: {format(selectedDate, 'PPPP')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-6">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4" />
                <p className="text-gray-500">Loading attendance data...</p>
              </div>
            ) : currentPeople.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active {getPersonTypeLabel(attendanceType)}s</h3>
                <p className="text-gray-500">No active {getPersonTypeLabel(attendanceType).toLowerCase()}s found in this batch.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Name</th>
                      <th className="text-left py-2 px-2">Email</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-right py-2 px-2">Mark Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPeople.map((person) => {
                      const attendanceKey = `${person.id}-${format(selectedDate, 'yyyy-MM-dd')}`;
                      const isMarking = markingAttendance[`${attendanceKey}-${getAttendanceStatus(person.id)}`];
                      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
                      const isEditable = sessionEditabilityMap.get(formattedDate) ?? false;
                      
                      return (
                        <tr key={person.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">
                            {person.name}
                            {isPersonExcused(person) && (
                              <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800">
                                Excused Until {format(new Date(person.excused_until), 'MMM dd')}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-2 text-gray-600">{person.email}</td>
                          <td className="py-3 px-2">
                            {isMarking ? (
                              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                            ) : (
                              <AttendanceStatusBadge status={getAttendanceStatus(person.id)} />
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex justify-end gap-2">
                              {!isEditable ? (
                                <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                  Future Date - Cannot Mark Attendance
                                </Badge>
                              ) : (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className={`bg-green-50 hover:bg-green-100 text-green-700 ${getAttendanceStatus(person.id) === 'present' ? 'ring-2 ring-green-500' : ''}`} 
                                    onClick={() => handleMarkAttendance(person.id, 'present')} 
                                    disabled={markingAttendance[`${person.id}-${format(selectedDate, 'yyyy-MM-dd')}-present`] || 
                                            markingAttendance[`${person.id}-${format(selectedDate, 'yyyy-MM-dd')}-${getAttendanceStatus(person.id)}`]}
                                  >
                                    {markingAttendance[`${person.id}-${format(selectedDate, 'yyyy-MM-dd')}-present`] ? (
                                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mr-1" />
                                    ) : (
                                      <Check size={14} className="mr-1" />
                                    )}
                                    Present
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className={`bg-red-50 hover:bg-red-100 text-red-700 ${getAttendanceStatus(person.id) === 'absent' ? 'ring-2 ring-red-500' : ''}`} 
                                    onClick={() => handleMarkAttendance(person.id, 'absent')} 
                                    disabled={markingAttendance[`${person.id}-${format(selectedDate, 'yyyy-MM-dd')}-absent`] || 
                                            markingAttendance[`${person.id}-${format(selectedDate, 'yyyy-MM-dd')}-${getAttendanceStatus(person.id)}`]}
                                  >
                                    {markingAttendance[`${person.id}-${format(selectedDate, 'yyyy-MM-dd')}-absent`] ? (
                                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mr-1" />
                                    ) : 'Absent'}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className={`bg-blue-50 hover:bg-blue-100 text-blue-700 ${getAttendanceStatus(person.id) === 'excused' ? 'ring-2 ring-blue-500' : ''}`} 
                                    onClick={() => handleMarkAttendance(person.id, 'excused')} 
                                    disabled={markingAttendance[`${person.id}-${format(selectedDate, 'yyyy-MM-dd')}-excused`] || 
                                            markingAttendance[`${person.id}-${format(selectedDate, 'yyyy-MM-dd')}-${getAttendanceStatus(person.id)}`]}
                                  >
                                    {markingAttendance[`${person.id}-${format(selectedDate, 'yyyy-MM-dd')}-excused`] ? (
                                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mr-1" />
                                    ) : 'Excused'}
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {loading && (allBatchAttendanceData && Object.keys(allBatchAttendanceData).length > 0) && (
                  <div className="text-center py-3">
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mr-2" />
                    <p className="text-sm text-gray-500 inline-block">Updating attendance...</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {!selectedBatch && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select Batch</h3>
              <p className="text-gray-500">Please select a batch to view and mark attendance.</p>
            </div>
          </CardContent>
        </Card>
      )}
      {selectedBatch && !selectedDate && derivedBatchSessions.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Session Date</h3>
              <p className="text-gray-500">Please select a session date from the calendar.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const AttendanceStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status.toLowerCase()) {
    case 'present': return <Badge variant="outline" className="bg-green-100 text-green-800">Present</Badge>;
    case 'absent': return <Badge variant="outline" className="bg-red-100 text-red-800">Absent</Badge>;
    case 'excused': return <Badge variant="outline" className="bg-blue-100 text-blue-800">Excused</Badge>;
    case 'not marked': return <Badge variant="outline" className="bg-gray-100 text-gray-800">Not Marked</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export default AttendanceTracker;
