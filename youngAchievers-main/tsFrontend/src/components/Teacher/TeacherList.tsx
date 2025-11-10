// /var/www/youngachivers-bk/tsFrontend/src/components/Teacher/TeacherList.tsx
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { getPartnerRecentAttendance } from '@/store/attendance/attendanceSlice';
import { AttendanceStatus, AttendanceRecord } from '@/types/attendance';
import { Partner } from '@/types/partner';
import { TruncatedText } from '@/components/ui/truncated-text';
import { toast } from '@/components/ui/use-toast';
import { handleApiError } from '@/utils/errorHandling';

interface BatchInfo {
  id: number;
  name: string;
  status?: string;
  pivot?: any;
}

interface TeacherListProps {
  teachers: Partner[];
}

const TeacherList: React.FC<TeacherListProps> = ({ teachers = [] }) => {
  const [selectedTeacher, setSelectedTeacher] = useState<Partner | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Only show active teachers
  const activeTeachers = teachers.filter(teacher => teacher.status === 'Active');

  const viewSchedule = async (teacher: Partner) => {
    if (!teacher) {
      toast({
        title: "Error",
        description: "No teacher selected to view schedule.",
        variant: "destructive",
      });
      return;
    }

    setSelectedTeacher(teacher);
    setLoadingAttendance(true);
    setAttendanceError(null);
    try {
      const response = await dispatch(getPartnerRecentAttendance(teacher.id)).unwrap();
      if (response && Array.isArray(response.data)) {
        if (response.data.length === 0) {
          toast({
            title: "No Records Found",
            description: "No attendance records found for this teacher.",
            variant: "default",
          });
        }
        setRecentAttendance(response.data);
      } else {
        throw new Error('Invalid attendance data format received from server');
      }
    } catch (error) {
      console.error('Failed to fetch recent attendance:', error);
      const errorMessage = handleApiError(error, "Failed to load attendance records");
      setAttendanceError(errorMessage);
      toast({
        title: "Error Loading Schedule",
        description: errorMessage,
        variant: "destructive",
      });
      setRecentAttendance([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'Inactive':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactive</Badge>;
      case 'Pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'Blacklisted':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Blacklisted</Badge>;
      default:
        return <Badge variant="outline">Unknown ({status})</Badge>;
    }
  };

  const getAttendanceStatusBadge = (status: AttendanceStatus) => {
    switch (status.toLowerCase()) {
      case 'present':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Present</Badge>;
      case 'absent':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Absent</Badge>;
      case 'excused':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Excused</Badge>;
      case 'not marked':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Not Marked</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {activeTeachers.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No active teachers found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Assigned Batches</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-left">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeTeachers.map((teacher) => {
                const batchNames = teacher.assignedBatches?.map(batch => batch.name).join(', ') || '';
                
                return (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">
                      <TruncatedText text={teacher.name} maxLength={25} />
                    </TableCell>
                    <TableCell>
                      <TruncatedText text={teacher.email} type="email" />
                    </TableCell>
                    <TableCell>{teacher.mobile}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-100 text-purple-800">
                        <TruncatedText text={teacher.specialization} maxLength={20} />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {teacher.assignedBatches?.length > 0 ? (
                        <TruncatedText text={batchNames} type="batch" />
                      ) : (
                        "None"
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(teacher.status)}</TableCell>
                    <TableCell className="text-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => viewSchedule(teacher)}
                          >
                            <Clock size={14} />
                            View Schedule
                          </Button>
                        </DialogTrigger>
                        {selectedTeacher && selectedTeacher.id === teacher.id && (
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-semibold">
                                Schedule for {selectedTeacher.name}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Teacher Information</CardTitle>
                                  <CardDescription>Contact details and specialization</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm font-medium text-gray-500">Email</p>
                                      {/* <TruncatedText text={selectedTeacher.email} type="email" /> */}
                                      <p className="break-all">{selectedTeacher.email}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-500">Phone</p>
                                      <p>{selectedTeacher.mobile}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-500">Specialization</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                          {selectedTeacher.specialization}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-500">Status</p>
                                      <div className="mt-1">{getStatusBadge(selectedTeacher.status)}</div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Recent Attendance</CardTitle>
                                  <CardDescription>Last 10 attendance records</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  {loadingAttendance ? (
                                    <div className="text-center py-4">
                                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                                      <p className="mt-2 text-sm text-gray-500">Loading attendance records...</p>
                                    </div>
                                  ) : attendanceError ? (
                                    <div className="text-center py-4">
                                      <p className="text-red-500">{attendanceError}</p>
                                    </div>
                                  ) : recentAttendance.length > 0 ? (
                                    <div className="overflow-x-auto">
                                      <table className="w-full border-collapse">
                                        <thead>
                                          <tr className="text-left border-b">
                                            <th className="py-2 px-3">Date</th>
                                            <th className="py-2 px-3">Batch</th>
                                            <th className="py-2 px-3">Status</th>
                                            <th className="py-2 px-3">Marked At</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {recentAttendance.map((record) => (
                                            <tr key={record.id} className="border-b">
                                              <td className="py-2 px-3">
                                                {format(new Date(record.batch_session.date), 'MMM dd, yyyy')}
                                              </td>
                                              <td className="py-2 px-3">{record.batch_session.batch.name}</td>
                                              <td className="py-2 px-3">
                                                {getAttendanceStatusBadge(record.status)}
                                              </td>
                                              <td className="py-2 px-3 text-sm text-gray-500">
                                                {record.marked_at ? format(new Date(record.marked_at), 'MMM dd, yyyy HH:mm') : 'Not marked'}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="text-center py-4">
                                      <p className="text-gray-500">No attendance records found</p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>

                              <div className="flex justify-end mt-4">
                                <Button variant="outline" onClick={() => navigate('/batches')}>
                                  View All Batches
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        )}
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TeacherList;
