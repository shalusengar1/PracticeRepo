import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, X, Users, Loader2, ChevronDown, ArrowRightCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useIsMobile, BREAKPOINTS } from "@/hooks/use-mobile";
import MemberDetails from '@/components/MemberManagement/MemberDetails';
import { useToast } from "@/hooks/use-toast";
import AddMemberDialog from '@/components/MemberManagement/AddMemberDialog';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import {
  createMember,
  updateMember,
  deleteMember,
  setSelectedMember,
  clearSelectedMember,
  fetchMembersPaginated,
  resetMembers
} from '@/store/member/memberSlice.ts';
import { Member } from '@/types/member.ts';
import { Program as ProgramType, fetchProgramsWithCount } from '@/store/program/programSlice';
import { Batch as BatchType, loadMoreBatches } from '@/store/batch/batchSlice';
import { formatBackendError } from '@/utils/errorHandling';
import { TruncatedText } from "@/components/ui/truncated-text";

// Program Card Component
const ProgramSegmentCard: React.FC<{
  programName: string;
  memberCount: number;
  onClick: () => void;
  isActive: boolean;
  colorIndex: number;
}> = ({ programName, memberCount, onClick, isActive, colorIndex }) => {
  const colorClasses = [
    'bg-blue-50 border-blue-200 hover:bg-blue-100',
    'bg-green-50 border-green-200 hover:bg-green-100',
    'bg-purple-50 border-purple-200 hover:bg-purple-100',
    'bg-orange-50 border-orange-200 hover:bg-orange-100',
    'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    'bg-pink-50 border-pink-200 hover:bg-pink-100',
    'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
    'bg-teal-50 border-teal-200 hover:bg-teal-100',
    'bg-red-50 border-red-200 hover:bg-red-100',
    'bg-gray-50 border-gray-200 hover:bg-gray-100',
  ];

  const getColorClass = () => {
    return colorClasses[colorIndex % colorClasses.length];
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${getColorClass()} ${isActive ? 'ring-2 ring-offset-2 ring-primary' : ''
        }`}
    >
      <h3 className="font-medium text-lg">{programName}</h3>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-gray-600">Members</span>
        <Badge variant="outline" className="font-medium">{memberCount}</Badge>
      </div>
    </div>
  );
};

// Batch Card Component
const BatchSegmentCard: React.FC<{
  batchName: string;
  memberCount: number;
  onClick: () => void;
  isActive: boolean;
  colorIndex: number;
}> = ({ batchName, memberCount, onClick, isActive, colorIndex }) => {
  const colorClasses = [
    'bg-blue-50 border-blue-200 hover:bg-blue-100',
    'bg-green-50 border-green-200 hover:bg-green-100',
    'bg-purple-50 border-purple-200 hover:bg-purple-100',
    'bg-orange-50 border-orange-200 hover:bg-orange-100',
    'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    'bg-pink-50 border-pink-200 hover:bg-pink-100',
    'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
    'bg-teal-50 border-teal-200 hover:bg-teal-100',
    'bg-red-50 border-red-200 hover:bg-red-100',
    'bg-gray-50 border-gray-200 hover:bg-gray-100',
  ];

  const getColorClass = () => {
    return colorClasses[colorIndex % colorClasses.length];
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${getColorClass()} ${isActive ? 'ring-2 ring-offset-2 ring-primary' : ''
        }`}
    >
      <h3 className="font-medium text-lg">{batchName}</h3>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-gray-600">Members</span>
        <Badge variant="outline" className="font-medium">{memberCount}</Badge>
      </div>
    </div>
  );
};

// New Load More Card for Programs/Batches grid
const LoadMoreCard: React.FC<{
  onClick: () => void;
  isLoading: boolean;
  type: 'Programs' | 'Batches';
}> = ({ onClick, isLoading, type }) => (
  <div
    onClick={!isLoading ? onClick : undefined}
    className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 hover:border-primary transition-all"
  >
    {isLoading ? (
      <>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm font-medium text-gray-600">Loading...</p>
      </>
    ) : (
      <>
        <ArrowRightCircle className="h-8 w-8 text-primary" />
        <p className="mt-2 text-sm font-medium text-gray-600">Load More {type}</p>
      </>
    )}
  </div>
);

const MemberManagement: React.FC = () => {
  const dispatch = useAppDispatch();

  const { members, selectedMember, loading: membersLoading, currentPage: membersCurrentPage, totalPages: membersTotalPages, totalMembers } = useAppSelector((state) => state.members);
  const { programs, loading: programsLoading, currentPage: programsCurrentPage, totalPages: programsTotalPages, totalEnrolledMembers } = useAppSelector((state) => state.programs);
  const { batches, loading: batchesLoading, currentPage: batchesCurrentPage, totalPages: batchesTotalPages } = useAppSelector((state) => state.batch);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [activeProgram, setActiveProgram] = useState<number | null>(null);
  const [activeBatch, setActiveBatch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"programs" | "batches">("programs");
  const isDebouncing = useRef(true);

  const { toast } = useToast();
  const isMobile = useIsMobile(BREAKPOINTS.TABLET);

  useEffect(() => {
    // Initial data fetch for programs and batches.
    dispatch(fetchProgramsWithCount({ page: 1 })); 
    dispatch(loadMoreBatches({ page: 1 }));
  }, [dispatch]);

  // Debounced search effect, also handles fetching on filter changes
  useEffect(() => {
    const fetchFn = () => {
      dispatch(
        fetchMembersPaginated({
          page: 1,
          search: searchTerm,
          programId: activeProgram ?? undefined,
          batchId: activeBatch ?? undefined,
        })
      );
    };

    if (isDebouncing.current) {
      const handler = setTimeout(fetchFn, 500); // 500ms debounce delay
      return () => {
        clearTimeout(handler);
      };
    } else {
      fetchFn();
      isDebouncing.current = true; // Reset the debounce flag
    }
  }, [searchTerm, activeProgram, activeBatch, dispatch]);

  const handleProgramClick = (programId: number | null) => {
    isDebouncing.current = false; //  Disable debounce for this action
    setActiveProgram(programId);
    setActiveBatch(null); // Clear other filter
    setSearchTerm(""); // Reset search on filter change
    dispatch(resetMembers()); // Reset members list before fetching new filtered list
    dispatch(clearSelectedMember());
  };

  const handleBatchClick = (batchId: string | null) => {
    isDebouncing.current = false; //  Disable debounce for this action
    setActiveBatch(batchId);
    setActiveProgram(null); // Clear other filter
    setSearchTerm(""); // Reset search on filter change
    dispatch(resetMembers()); // Reset members list
    dispatch(clearSelectedMember());
  };

  const handleLoadMorePrograms = () => {
    if (!programsLoading && programsCurrentPage < programsTotalPages) {
      dispatch(fetchProgramsWithCount({ page: programsCurrentPage + 1 }));
    }
  };

  const handleLoadMoreBatches = () => {
    if (!batchesLoading && batchesCurrentPage < batchesTotalPages) {
      dispatch(loadMoreBatches({ page: batchesCurrentPage + 1 }));
    }
  };

  const handleLoadMoreMembers = () => {
    if (!membersLoading && membersCurrentPage < membersTotalPages) {
      dispatch(fetchMembersPaginated({
        page: membersCurrentPage + 1,
        programId: activeProgram ?? undefined,
        batchId: activeBatch ?? undefined,
        search: searchTerm,
      }));
    }
  };

  const handleTabChange = (value: "programs" | "batches") => {
    setActiveTab(value);
    // Reset filters and members when switching tabs
    handleProgramClick(null);
  };

  const handleAddMember = async (newMember: any) => {
    try {
      await dispatch(createMember(newMember)).unwrap();
      
      toast({
        title: "Member Added",
        description: `${newMember.name} has been successfully added.`,
      });
      
      setIsAddMemberOpen(false);
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({
        title: "Error Adding Member",
        description: formatBackendError(error),
        variant: "destructive"
      });
      throw error; // Re-throw to prevent form closure
    }
  };

  const handleUpdateMember = async (updatedMember: Partial<Member> & { batch_ids?: number[]; status?: 'active' | 'inactive' | 'pending' | 'blacklisted' }) => {
    try {
      await dispatch(updateMember({
        id: updatedMember.id!,
        memberData: {
          name: updatedMember.name,
          email: updatedMember.email,
          mobile: updatedMember.mobile,
          status: updatedMember.status,
          batch_ids: updatedMember.batch_ids
        }
      })).unwrap();
      
      toast({
        title: "Member Updated",
        description: `Member has been successfully updated.`,
      });
    } catch (error: any) {
      console.error('Error updating member:', error);
      toast({
        title: "Error Updating Member",
        description: formatBackendError(error),
        variant: "destructive"
      });
      throw error; // Re-throw to prevent form closure
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    
    try {
      await dispatch(deleteMember(selectedMember.id)).unwrap();
      
      toast({
        title: "Member Deleted",
        description: "Member has been successfully deleted.",
      });
    } catch (error: any) {
      console.error('Error deleting member:', error);
      toast({
        title: "Error Deleting Member",
        description: formatBackendError(error),
        variant: "destructive"
      });
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight animate-fade-in">
          Member Management
        </h1>
        <Button onClick={() => setIsAddMemberOpen(true)} className="flex items-center gap-2 whitespace-nowrap">
          <Plus size={16} />
          Add New Member
        </Button>
      </div>

      {/* Tabs section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as "programs" | "batches")}>
          <div className="overflow-x-auto">
            <TabsList className="mb-4">
              <TabsTrigger value="programs">Programs</TabsTrigger>
              <TabsTrigger value="batches">Batches</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="programs">
            <h2 className="text-lg font-semibold mb-4">Program Segments</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto p-2">
              <ProgramSegmentCard
                programName="All Programs"
                memberCount={totalEnrolledMembers}
                onClick={() => handleProgramClick(null)}
                isActive={activeProgram === null}
                colorIndex={0}
              />
              {programs.map((program, index) => (
                <ProgramSegmentCard
                  key={program.id}
                  programName={program.name}
                  memberCount={program.members_count ?? 0}
                  onClick={() => handleProgramClick(program.id)}
                  isActive={activeProgram === program.id}
                  colorIndex={index + 1}
                />
              ))}
              {programsCurrentPage < programsTotalPages && (
                <LoadMoreCard
                  onClick={handleLoadMorePrograms}
                  isLoading={programsLoading}
                  type="Programs"
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="batches">
            <h2 className="text-lg font-semibold mb-4">Batch Segments</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <BatchSegmentCard
                batchName="All Batches"
                memberCount={totalEnrolledMembers}
                onClick={() => handleBatchClick(null)}
                isActive={activeBatch === null}
                colorIndex={0}
              />
              {batches.map((batch, index) => (
                <BatchSegmentCard
                  key={batch.id}
                  batchName={batch.name}
                  memberCount={batch.memberCount ?? 0}
                  onClick={() => handleBatchClick(batch.id)}
                  isActive={activeBatch === batch.id}
                  colorIndex={index + 1}
                />
              ))}
              {batchesCurrentPage < batchesTotalPages && (
                <LoadMoreCard
                  onClick={handleLoadMoreBatches}
                  isLoading={batchesLoading}
                  type="Batches"
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Members list and details section */}
      <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-4'} gap-6`}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:col-span-1 overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium truncate pr-2">
                {activeTab === "programs"
                  ? (activeProgram ? `${programs.find(p => p.id === activeProgram)?.name} Members` : 'All Members')
                  : (activeBatch ? `${batches.find(b => b.id === activeBatch)?.name} Members` : 'All Members')}
                ({totalMembers})
              </h3>
              {(activeProgram || activeBatch) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => activeTab === "programs" ? handleProgramClick(null) : handleBatchClick(null)}
                  className="h-8 w-8 flex-shrink-0"
                >
                  <X size={16} />
                </Button>
              )}
            </div>

            <div className="relative w-full">
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pr-10 min-w-0" // Added min-w-0
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {members.map(member => (
                <div
                  key={member.id}
                  onClick={() => dispatch(setSelectedMember(member))}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedMember?.id === member.id
                      ? "bg-purple-100 border-l-4 border-purple-500"
                      : "hover:bg-gray-50"
                    }`}
                >
                  <div className="font-medium truncate">{member.name || member.email}</div>
                  <div className="text-sm text-gray-500 truncate">
                    <TruncatedText text={member.email} type="email" maxLength={50} />
                  </div>
                </div>
              ))}
              {membersLoading && members.length === 0 && <div className="text-center py-4 text-gray-500">Loading members...</div>}
              {!membersLoading && members.length === 0 && <div className="text-center py-4 text-gray-500">No members found.</div>}

              {membersCurrentPage < membersTotalPages && (
                <div className="pt-2">
                  <Button
                    onClick={handleLoadMoreMembers}
                    disabled={membersLoading}
                    variant="ghost"
                    className="w-full h-12 text-primary bg-purple-50 hover:bg-purple-100 border-2 border-dashed border-purple-200 hover:border-purple-300 transition-all duration-300"
                  >
                    {membersLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ChevronDown className="h-4 w-4" />
                        Load More Members
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Member details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 md:col-span-3 animate-fade-in overflow-auto">
          {selectedMember ? (
            <MemberDetails
              member={selectedMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Users size={48} className="mb-4 opacity-50" />
              <p>Select a member to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Add member dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <AddMemberDialog
          open={isAddMemberOpen}
          onOpenChange={setIsAddMemberOpen}
          onAddMember={handleAddMember}
        />
      </Dialog>
    </div>
  );
};

export default MemberManagement;
