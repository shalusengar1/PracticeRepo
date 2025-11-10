import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { X, Edit, Trash, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Dialog } from "@/components/ui/dialog";
import EditMemberDialog from './EditMemberDialog';
import { TruncatedText } from '@/components/ui/truncated-text';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Member, BatchSummary } from '@/types/member.ts';
import { handleApiError } from '@/utils/errorHandling';

interface MemberDetailsProps {
  member: Member;
  onUpdateMember: (updatedMember: Partial<Member> & { batch_ids?: number[] }) => Promise<void>;
  onDeleteMember: () => Promise<void>;
}

const MemberDetails: React.FC<MemberDetailsProps> = ({
  member,
  onUpdateMember,
  onDeleteMember,
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState<number | null>(null);
  const { toast } = useToast();

  // Group batches by program
  const programGroups = React.useMemo(() => {
    const groups: Record<number, { programName: string; batches: BatchSummary[] }> = {};
    
    if (member.batches) {
      member.batches.forEach(batch => {
        if (batch.program) {
          if (!groups[batch.program.id]) {
            groups[batch.program.id] = {
              programName: batch.program.name,
              batches: []
            };
          }
          groups[batch.program.id].batches.push(batch);
        }
      });
    }
    
    return groups;
  }, [member.batches]);

  const handleRemoveBatch = async (batchId: number, batchName: string) => {
    if (!member.batches) return;
    
    setIsRemoving(batchId);
    try {
      const updatedBatchIds = member.batches
        .filter(b => b.id !== batchId)
        .map(b => b.id);
      
      await onUpdateMember({
        id: member.id,
        batch_ids: updatedBatchIds
      });
      
      toast({
        title: "Batch Removed",
        description: `${batchName} has been removed from ${member.name || member.email}`,
      });
    } catch (error) {
      toast({
        title: "Error Removing Batch",
        description: handleApiError(error, 'Failed to remove batch from member'),
        variant: "destructive"
      });
    } finally {
      setIsRemoving(null);
    }
  };

  const handleDeleteMember = async () => {
    try {
      await onDeleteMember();
      setIsDeleteDialogOpen(false);
      toast({
        title: "Member Deleted",
        description: `${member.name || member.email} has been successfully deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error Deleting Member",
        description: handleApiError(error, 'Failed to delete member'),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {member.name || member.email}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Member ID: {member.id}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setIsEditDialogOpen(true)}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Edit size={16} />
            Edit Member
          </Button>
          <Button 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center gap-2"
            variant="destructive"
          >
            <Trash size={16} />
            Delete
          </Button>
        </div>
      </div>

      {/* Member details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
          <TruncatedText text={member.email} type="email" className="text-lg" />
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Mobile</h3>
          <p className="text-lg">{member.mobile}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
          <span className={`inline-flex px-2 py-1 rounded-full text-sm ${
            member.status === 'active' 
              ? 'bg-green-100 text-green-800'
              : member.status === 'inactive'
              ? 'bg-yellow-100 text-yellow-800'
              : member.status === 'blacklisted'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Programs section */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Enrolled Programs</h3>
        <div className="flex flex-wrap gap-2">
          {Object.keys(programGroups).length > 0 ? (
            Object.entries(programGroups).map(([programId, { programName, batches }]) => (
              <div 
                key={programId} 
                className="flex items-center px-3 py-2 rounded-full text-sm bg-purple-100 text-purple-800 border border-purple-200"
              >
                <span>{programName}</span>
                <span className="ml-2 text-xs bg-purple-200 px-2 py-1 rounded-full">
                  {batches.length} {batches.length === 1 ? 'batch' : 'batches'}
                </span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 text-gray-500 py-2">
              <AlertTriangle size={16} />
              <span>No programs enrolled</span>
            </div>
          )}
        </div>
      </div>

      {/* Batches section */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Enrolled Batches</h3>
        <div className="flex flex-wrap gap-2">
          {member.batches && member.batches.length > 0 ? (
            member.batches.map(batch => (
              <div 
                key={batch.id} 
                className="flex items-center px-3 py-2 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
              >
                <span>{batch.name}</span>
                {batch.program && (
                  <span className="ml-1 text-xs text-blue-600">
                    ({batch.program.name})
                  </span>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-2 h-5 w-5 rounded-full hover:bg-blue-700 hover:text-white"
                  onClick={() => handleRemoveBatch(batch.id, batch.name)}
                  disabled={isRemoving === batch.id}
                >
                  <X size={12} />
                </Button>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 text-gray-500 py-2">
              <AlertTriangle size={16} />
              <span>No batches enrolled</span>
            </div>
          )}
        </div>
      </div>

      {/* Statistics section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-600 mb-1">Total Programs</h4>
          <p className="text-2xl font-bold text-blue-800">
            {Object.keys(programGroups).length}
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="text-sm font-medium text-green-600 mb-1">Total Batches</h4>
          <p className="text-2xl font-bold text-green-800">
            {member.batches ? member.batches.length : 0}
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h4 className="text-sm font-medium text-purple-600 mb-1">Member Since</h4>
          <p className="text-lg font-semibold text-purple-800">
            {new Date(member.created_at || Date.now()).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <EditMemberDialog 
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          member={member}
          onUpdateMember={onUpdateMember}
        />
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Member?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{member.name || member.email}</strong>'s account 
              and remove them from all enrolled batches. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMember} 
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MemberDetails;
