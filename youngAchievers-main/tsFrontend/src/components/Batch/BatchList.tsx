import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks/hooks";
import { fetchBatches, updateBatch, deleteBatch, Batch as BatchType } from "@/store/batch/batchSlice"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import ViewBatchDetails from './ViewBatchDetails';
import EditBatchForm from './EditBatchForm';
import { Edit, Trash, ToggleLeft, ToggleRight, ExternalLink, Search, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { TruncatedText } from "@/components/ui/truncated-text";

interface BatchListProps {
  batches: BatchType[];
  loading: boolean;
  error: string | null;
  onEditBatch: (batch: BatchType) => void; 
  selectedBatch: BatchType | null; 
  isEditBatchOpen: boolean; 
  onCloseEditBatch: () => void; 
  onSubmitEditBatch: (data: BatchType) => void; 
}

const BatchList: React.FC<BatchListProps> = ({
  batches,
  loading,
  error,
  onEditBatch, 
  selectedBatch, 
  isEditBatchOpen,
  onCloseEditBatch,
  onSubmitEditBatch,
}) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast(); 
  const { currentPage, totalPages, searchQuery } = useAppSelector((state) => state.batch);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [selectedBatchForView, setSelectedBatchForView] = useState<BatchType | null>(null);
  const [batchToDeleteId, setBatchToDeleteId] = useState<string | null>(null);

  console.log('BatchList render:', { batches, loading, error }); // Debug log

  // useEffect(() => {
  //   const fetchData = () => {
  //     console.log('Fetching batches...'); // Debug log
  //     dispatch(fetchBatches({
  //       page: currentPage,
  //       search: searchQuery
  //     }));
  //   };

  //   fetchData();
  // }, [dispatch, currentPage, searchQuery]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setLocalSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      dispatch(fetchBatches({
        page: 1,
        search: query
      }));
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    dispatch(fetchBatches({ page: 1, search: '' }));
  };

  const handlePageChange = (page: number) => {
    dispatch(fetchBatches({
      page,
      search: searchQuery
    }));
  };

  const handleViewDetailsClick = (batch: BatchType) => {
    setSelectedBatchForView(batch);
    setIsViewDetailsOpen(true);
  };

  const handleEditBatchClick = (batch: BatchType) => {
    onEditBatch(batch);
  };

  const handleEditFromViewDetails = () => {
    if (selectedBatchForView) {
      onEditBatch(selectedBatchForView); 
      setIsViewDetailsOpen(false);
    }
  };

  const handleToggleBatchStatus = async (batch: BatchType) => {
    const newStatus = batch.status === 'active' ? 'inactive' : 'active';
    try {
      await dispatch(updateBatch({ ...batch, status: newStatus })).unwrap();
      toast({
        title: "Status Updated",
        description: `Batch "${batch.name}" status changed to ${newStatus}.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update batch status.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDeleteBatch = async () => {
    if (batchToDeleteId) {
      try {
        await dispatch(deleteBatch(batchToDeleteId)).unwrap();
        toast({
          title: "Batch Deleted",
          description: "The batch has been successfully deleted.",
        });
        setBatchToDeleteId(null);
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to delete batch.",
          variant: "destructive",
        });
      }
    }
  };

  const formatPartnerNames = (partners: BatchType['partners'] | undefined): string => {
    if (!partners || partners.length === 0) {
      return "Not assigned";
    }
    return partners.map(partner => partner.name).join(", ");
  };

  if (loading && !isEditBatchOpen) {
    return <div className="text-center py-10"><p>Loading batches...</p></div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500"><p>Error loading batches: {error}</p></div>;
  }

  if (!batches) {
    return <div className="text-center py-10"><p>No batches available</p></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          {/* <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /> */}
          {/* <Input
            placeholder="Search batches..."
            value={localSearchQuery}
            onChange={handleSearch}
            className="pl-8"
          /> */}
          {localSearchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-5 w-5 p-0"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {batches.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">
            {localSearchQuery
              ? "No batches found matching your search criteria."
              : "No batches found. Create a new batch to get started."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Spot-Venue</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">
                    <TruncatedText text={batch.name} maxLength={40} />
                  </TableCell>
                  <TableCell>{batch.type.charAt(0).toUpperCase() + batch.type.slice(1)}</TableCell>
                  <TableCell>{formatPartnerNames(batch.partners)}</TableCell>
                  <TableCell>
                    {batch.spot?.spot_name || batch.venue?.venue_name 
                      ? `${batch.spot?.spot_name || ''}${batch.spot?.spot_name && batch.venue?.venue_name ? ' - ' : ''}${batch.venue?.venue_name || ''}` 
                      : 'Not assigned'}
                  </TableCell>
                  <TableCell>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${batch.progress || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">{batch.progress || 0}%</span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      batch.status === 'active' ? 'bg-green-100 text-green-800' : 
                      batch.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                      batch.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {batch.memberCount !== undefined ? `${batch.memberCount} / ${batch.capacity}` : `0 / ${batch.capacity}`}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetailsClick(batch)}
                        title="View Details"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditBatchClick(batch)}
                        title="Edit Batch"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleBatchStatus(batch)}
                        title={batch.status === "active" ? "Deactivate Batch" : "Activate Batch"}
                      >
                        {batch.status === "active" ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setBatchToDeleteId(batch.id.toString())}
                            title="Delete Batch"
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the batch. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setBatchToDeleteId(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleConfirmDeleteBatch}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink 
                          isActive={pageNumber === currentPage}
                          onClick={() => handlePageChange(pageNumber)}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    (pageNumber === 2 && currentPage > 3) ||
                    (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    return <PaginationEllipsis key={pageNumber} />;
                  }
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {selectedBatchForView && (
        <ViewBatchDetails
          batch={selectedBatchForView}
          isOpen={isViewDetailsOpen}
          onClose={() => {
            setIsViewDetailsOpen(false);
            setSelectedBatchForView(null);
          }}
          onEdit={handleEditFromViewDetails}
        />
      )}

      {selectedBatch && (
        <EditBatchForm
          batch={selectedBatch}
          isOpen={isEditBatchOpen}
          onClose={onCloseEditBatch}
          onSubmit={onSubmitEditBatch}
        />
      )}
    </div>
  );
};

export default BatchList;
