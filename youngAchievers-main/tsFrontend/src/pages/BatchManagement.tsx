import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import BatchList from '@/components/Batch/BatchList';
import SessionRoutine from '@/components/Batch/SessionRoutine';
import BatchReporting from '@/components/Batch/BatchReporting';
import AddBatchForm from '@/components/Batch/AddBatchForm';
import EditBatchForm from '@/components/Batch/EditBatchForm';
import FixedAssetsInventory from '@/components/Batch/FixedAssetsInventory';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useLocation and useNavigate

import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import { fetchBatches, addBatch, updateBatch } from '@/store/batch/batchSlice';
import { Batch as BatchType } from '@/store/batch/batchSlice';

const BatchManagement: React.FC = () => {
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [isEditBatchOpen, setIsEditBatchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedBatch, setSelectedBatch] = useState<BatchType | null>(null);
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const location = useLocation(); // Get location object
  const navigate = useNavigate(); // Get navigate function
  const { batches, loading, error } = useAppSelector((state) => state.batch);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchBatches({ page: 1, search: '' })).unwrap();
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch batches. Please try again.",
          variant: "destructive",
        });
      }
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    if (location.state?.openAddBatchSheet) {
      setIsAddBatchOpen(true);
      // Clear the state from location to prevent re-opening on refresh or back navigation
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);



  const handleCloseAddBatch = () => {
    setIsAddBatchOpen(false);
  };

  const handleBatchAdded = () => {
    setIsAddBatchOpen(false);
  };

  const handleEditBatch = (batch: BatchType) => {
    setSelectedBatch(batch);
    setIsEditBatchOpen(true);
  };

  const handleUpdateBatchSubmit = async (batchData: BatchType) => {
    if (selectedBatch) {
      try {
        await dispatch(updateBatch(batchData)).unwrap();
        toast({
          title: "Batch Updated",
          description: "The batch has been successfully updated.",
        });
        dispatch(fetchBatches({ page: 1, search: '' }));
        setIsEditBatchOpen(false);
        setSelectedBatch(null);
      } catch (err: any) {
        toast({
          title: "Error Updating Batch",
          description: err.message || "Failed to update batch.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight animate-fade-in">
          Batch Management
        </h1>
        <Button 
          onClick={() => setIsAddBatchOpen(true)} 
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add Batch
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
        <Tabs 
          defaultValue="overview" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Batch Overview</TabsTrigger>
            <TabsTrigger value="sessions">Session Routine</TabsTrigger>
            <TabsTrigger value="reporting">Reporting</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-2">
            <BatchList 
              onEditBatch={handleEditBatch} 
              batches={batches} 
              loading={loading} 
              error={error} 
              selectedBatch={selectedBatch}
              isEditBatchOpen={isEditBatchOpen}
              onCloseEditBatch={() => {
                setIsEditBatchOpen(false);
                setSelectedBatch(null);
              }}
              onSubmitEditBatch={handleUpdateBatchSubmit}
            />
          </TabsContent>
          
          <TabsContent value="sessions" className="mt-2">
            <SessionRoutine />
          </TabsContent>
          
          <TabsContent value="reporting" className="mt-2">
            <BatchReporting />
          </TabsContent>
          
          <TabsContent value="inventory" className="mt-2">
            <FixedAssetsInventory />
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={isAddBatchOpen} onOpenChange={setIsAddBatchOpen}>
        <SheetContent side="right"  
            className="sm:max-w-3xl p-0 overflow-y-auto [&>button]:!right-6 [&>button]:!top-6 [&>button]:!h-9 [&>button]:!w-9 [&>button]:!rounded-full [&>button]:!border [&>button]:!bg-white [&>button]:hover:!bg-gray-50 [&>button]:!flex [&>button]:!items-center [&>button]:!justify-center [&>button.close-button]:!transition-all [&>button]:hover:!border-gray-400">
          <AddBatchForm 
            onClose={handleCloseAddBatch} 
            onBatchAdded={handleBatchAdded}
            showSpotSelection={true}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default BatchManagement;
