// /var/www/youngachivers-bk/tsFrontend/src/pages/StudentTeacherManagement.tsx
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, User, Calendar as CalendarIcon, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import StudentList from '@/components/Student/StudentList';
import TeacherList from '@/components/Teacher/TeacherList';
import AttendanceTracker from '@/components/Attendance/AttendanceTracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import { fetchMembers, fetchMembersWithFields } from '@/store/member/memberSlice';
import { fetchPartners } from '@/store/partner/partnerSlice';
import { Member } from '@/types/member';
import { Partner } from '@/types/partner';

const StudentTeacherManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("attendance");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const { members, loading: membersLoading, error: membersError } = useAppSelector((state) => state.members);
  const { partners, loading: partnersLoading, error: partnersError } = useAppSelector((state) => state.partner);

  useEffect(() => {
    if (activeTab === 'students') {
      const studentFields = [
        'id', 
        'name', 
        'email', 
        'mobile', 
        'status', 
        'excused_until', 
        'excuse_reason',
        'batches',
      ];
      dispatch(fetchMembersWithFields({ fields: studentFields }));
    } else if (activeTab === 'teachers') {
      dispatch(fetchPartners());
    }
  }, [activeTab, dispatch]);

  const filteredMembers = React.useMemo(() => {
    if (!members) return [];
    return members.filter(member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [members, searchTerm]);

  const filteredPartners = React.useMemo(() => {
    if (!partners) return [];
    return partners.filter(partner =>
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [partners, searchTerm]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight animate-fade-in">
            Attendance Management
          </h1>
          <p className="text-gray-500 mt-1">Mark and track attendance for members and partners</p>
        </div>
        {/* <Button
          onClick={() => {
            toast({
              title: "Feature Coming Soon",
              description: "Bulk attendance marking from CSV will be available soon",
            });
          }}
          className="flex items-center gap-2"
        >
          <User size={16} />
          {"Bulk Mark Attendance from CSV"}
        </Button> */}
      </div>

      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-purple-500" />
              Attendance System
            </CardTitle>
            <div className="flex items-center text-sm text-gray-500">
              <span className="inline-block h-3 w-3 rounded-full bg-green-500 mr-2"></span>
              Today's Date: {new Date().toLocaleDateString()}
            </div>
          </div>
          <CardDescription>
            Track and manage attendance for all batches and programs
          </CardDescription>
        </CardHeader>
         <CardContent className="pt-4"> 
         </CardContent>
      </Card>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="attendance" className="gap-2 items-center">
              <Calendar className="h-4 w-4" />
              Attendance Tracker
            </TabsTrigger>
            <TabsTrigger value="students">Members</TabsTrigger>
            <TabsTrigger value="teachers">Partners</TabsTrigger>
          </TabsList>

          <div className="mb-4">
            {(activeTab === "students" || activeTab === "teachers") && (
              <div className="relative max-w-md">
                <Input
                  placeholder={`Search ${activeTab === "students" ? "members" : "partners"}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-8"
                />
                {searchTerm && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-8 hover:bg-transparent"
                    onClick={() => setSearchTerm('')}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <TabsContent value="students" className="mt-2">
            {membersLoading && <p>Loading members...</p>}
            {membersError && <p className="text-red-500">Error loading members: {membersError}</p>}
            {!membersLoading && !membersError && (
              <StudentList students={filteredMembers} />
            )}
          </TabsContent>

          <TabsContent value="teachers" className="mt-2">
            {partnersLoading && <p>Loading partners...</p>}
            {partnersError && <p className="text-red-500">Error loading partners: {partnersError}</p>}
            {!partnersLoading && !partnersError && (
              <TeacherList teachers={filteredPartners as Partner[]} />
            )}
          </TabsContent>

          <TabsContent value="attendance" className="mt-2">
            <AttendanceTracker />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentTeacherManagement;
