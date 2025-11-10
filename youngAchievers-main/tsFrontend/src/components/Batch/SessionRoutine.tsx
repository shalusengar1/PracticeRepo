import React, { useState, useEffect } from 'react';
import { GraduationCap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import BatchDetails from './BatchDetails';
import SessionTable from './SessionTable';
import RescheduleSessionDialog from './RescheduleSessionDialog';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import { fetchBatches } from '@/store/batch/batchSlice';
import { fetchSessionsByBatchId } from '@/store/batch/sessionDetailsSlice';
import { toast } from '@/hooks/use-toast';
import batchReportService from '@/api/batchReportService';

const SessionRoutine: React.FC = () => {
  const dispatch = useAppDispatch();
  const { batches, loading: batchesLoading } = useAppSelector((state) => state.batch);
  const { sessions, loading: sessionsLoading, error: sessionsError } = useAppSelector((state) => state.sessionDetails);
  const [selectedBatchId, setSelectedBatchId] = useState<string | undefined>(undefined);
  const [batchReport, setBatchReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchBatches({ paginate: false }));
  }, [dispatch]);

  useEffect(() => {
    if (selectedBatchId) {
      dispatch(fetchSessionsByBatchId(parseInt(selectedBatchId)));
      fetchBatchReport(parseInt(selectedBatchId));
    } else {
      setBatchReport(null);
    }
  }, [dispatch, selectedBatchId]);

  const fetchBatchReport = async (batchId: number) => {
    try {
      setReportLoading(true);
      const report = await batchReportService.getBatchReport(batchId);
      setBatchReport(report);
    } catch (error: any) {
      console.error("Error fetching batch report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch batch report",
        variant: "destructive"
      });
    } finally {
      setReportLoading(false);
    }
  };

  const selectedBatch = batches.find(batch => batch.id === selectedBatchId);

  const {
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
  } = useSessionManagement(selectedBatch);

  // Find the session number based on its position in the sessions array
  const selectedSessionNumber = selectedSession 
    ? sessions.findIndex(s => s.id === selectedSession.id) + 1 
    : undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          Session Routine Dashboard
        </h1>
        <p className="text-gray-500">
          View and manage session schedules for each batch
        </p>
      </div>

      {batchesLoading && <p>Loading batches...</p>}
      {!batchesLoading && batches.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
          <p className="text-yellow-800">No batches found. Please create batches first.</p>
        </div>
      )}

      {batches.length > 0 && (
        <div className="w-full max-w-md">
          <Select 
            value={selectedBatchId} 
            onValueChange={(value) => setSelectedBatchId(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a batch" />
            </SelectTrigger>
            <SelectContent>
              {batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedBatch && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <BatchDetails batch={selectedBatch} />

          <div className="mt-6">
            <h2 className="text-lg font-medium mb-4">Session Schedule</h2>
            
            {sessionsError && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
                <p className="text-red-800">Error loading sessions: {sessionsError}</p>
              </div>
            )}

            <SessionTable
              sessions={sessions}
              onRescheduleClick={handleRescheduleClick}
              loading={sessionsLoading || reportLoading}
              batch={{
                program: selectedBatch.program,
                venue: {
                  venue_id: selectedBatch.venue.id,
                  venue_name: selectedBatch.venue.venue_name,
                  venue_image: selectedBatch.venue.venue_image
                },
                spot: {
                  venue_spot_id: selectedBatch.spot.id,
                  spot_name: selectedBatch.spot.spot_name,
                  spot_image: selectedBatch.spot.spot_image
                },
                status: selectedBatch.status
              }}
            />
          </div>
        </div>
      )}

      <RescheduleSessionDialog
        isOpen={isRescheduleDialogOpen}
        onOpenChange={setIsRescheduleDialogOpen}
        selectedSession={selectedSession}
        newDate={newDate}
        setNewDate={setNewDate}
        newStartTime={newStartTime}
        setNewStartTime={setNewStartTime}
        newEndTime={newEndTime}
        setNewEndTime={setNewEndTime}
        rescheduleReason={rescheduleReason}
        setRescheduleReason={setRescheduleReason}
        handleRescheduleSubmit={handleRescheduleSubmit}
        disabledDates={disabledDates}
        isSubmitting={isSubmitting}
        sessionNumber={selectedSessionNumber}
        sessions={sessions}
      />
    </div>
  );
};

export default SessionRoutine;
