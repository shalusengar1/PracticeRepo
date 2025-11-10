import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash, ToggleLeft, ToggleRight, MapPin, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
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
import { Venue, VenueSpot } from "../../pages/VenueManagement";
import AddVenueDialog from './AddVenueDialog';
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import { addSpot, deleteVenue, updateSpot, updateVenue, fetchVenues, setVenuePage } from '@/store/venue/venueSlice';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink, PaginationEllipsis } from "@/components/ui/pagination";

interface VenueTableProps {
  loading?: boolean;
}

const VenueTable: React.FC<VenueTableProps> = ({ loading = false }) => {
  const [venueToDelete, setVenueToDelete] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [venueToEdit, setVenueToEdit] = useState<Venue | undefined>(undefined);
  const [expandedVenues, setExpandedVenues] = useState<number[]>([]);
  const [viewDetailsVenue, setViewDetailsVenue] = useState<Venue | null>(null);
  const [venueToEditId, setVenueToEditId] = useState<number | undefined>(undefined);

  const { venues, loading: venuesLoading, totalPages, currentPage, perPage, filters } = useAppSelector((state) => state.venues);

  const { toast } = useToast();
  const dispatch = useAppDispatch();

  // Default image for venues and spots without images
  const defaultVenueImage = "https://images.unsplash.com/photo-1487958449943-2429e8be8625";

  useEffect(() => {
    dispatch(fetchVenues({
      page: currentPage,
      perPage: perPage,
      search: filters.search || undefined,
      status: filters.status !== 'all' ? filters.status : undefined,
      paginate: true
    }));
  }, [dispatch, currentPage, perPage, filters.search, filters.status]);

  const handlePageChange = (page: number) => {
    dispatch(setVenuePage(page));
  };

  const toggleVenueStatus = async (venue: Venue) => {
    if (venue.status === 'deleted') return;
    try {
      const updatedVenue: Venue = {
        ...venue,
        status: venue.status === "active" ? "inactive" : "active"
      };
      await dispatch(updateVenue(updatedVenue)).unwrap();
      toast({
        title: "Venue Status Updated",
        description: `The venue status has been updated to ${updatedVenue.status}.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update venue status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVenue = async () => {
    if (venueToDelete) {
      try {
        await dispatch(deleteVenue(venueToDelete)).unwrap();
        setVenueToDelete(null);
        toast({
          title: "Venue Deleted",
          description: "The venue has been successfully deleted."
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete venue.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditVenue = (venue: Venue) => {
    setVenueToEditId(venue.venue_id);
    setVenueToEdit(venue);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditedVenue = async (editedVenue: Omit<Venue, 'venue_id' | 'status' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'peak_occupancy' | 'total_events' | 'revenue_generated'>, venue_admin_ids?: number[]): Promise<Venue | undefined> => {
    if (!venueToEdit) return undefined;
    const updatedVenue: Venue = {
      ...venueToEdit,
      ...editedVenue,
      venue_admins: venueToEdit.venue_admins,
      venue_spots: venueToEdit.venue_spots, // **Include existing spots**
    };

    try {
      const response = await dispatch(updateVenue({ ...updatedVenue, venue_admin_ids })).unwrap();
      toast({
        title: "Venue Updated",
        description: `${editedVenue.venue_name} has been successfully updated.`
      });
      setVenueToEdit(response)
      return response;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update venue.",
        variant: "destructive",
      });
      return undefined;
    }
    finally{
      setVenueToEdit(undefined);
    }
  };

  const handleSaveEditedSpot = async (venueId: number, spot: Omit<VenueSpot, 'venue_spot_id' | 'created_by' | 'updated_by'>, spotId?: number): Promise<boolean> => {
    try {
      if (spotId) {
        await dispatch(updateSpot({ ...spot, venue_spot_id: spotId, venue_id: venueId })).unwrap();
      } else {
        await dispatch(addSpot({ ...spot, venue_id: venueId })).unwrap();
      }
      return true;
    } catch (error) {
      // Log the error to the console
      console.error("Error saving spot:", error);
      // Check if the error has a response and data
      if (error?.response?.data) {
        console.error("Error details:", error.response.data);
        // Check if the error has errors
        if (error.response.data.errors) {
          // Log the errors
          console.error("Validation errors:", error.response.data.errors);
        }
      }
      return false;
    }
  };

  const toggleVenueExpansion = (venueId: number) => {
    setExpandedVenues(prevState => {
      if (prevState.includes(venueId)) {
        return prevState.filter(id => id !== venueId);
      } else {
        return [...prevState, venueId];
      }
    });
  };

  const handleViewDetails = (venue: Venue) => {
    setViewDetailsVenue(venue);
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {venues.map((venue) => (
              <React.Fragment key={venue.venue_id}>
                <TableRow className="group border-b-0">
                  <TableCell className="w-10">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleVenueExpansion(venue.venue_id)}
                      className="h-8 w-8 p-0"
                    >
                      {expandedVenues.includes(venue.venue_id) ?
                        <ChevronUp size={16} /> :
                        <ChevronDown size={16} />
                      }
                    </Button>
                  </TableCell>
                  <TableCell className="w-12">
                    <div className="h-10 w-10 rounded-md overflow-hidden">
                      <img 
                        src={venue.venue_image || defaultVenueImage} 
                        alt={venue.venue_name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = defaultVenueImage;
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{venue.venue_name}</TableCell>
                  <TableCell>{venue.address}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      venue.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {venue.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(venue)}
                        title="View Venue Details"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditVenue(venue)}
                        title="Edit Venue"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleVenueStatus(venue)}
                        title={venue.status === "active" ? "Deactivate Venue" : "Activate Venue"}
                      >
                        {venue.status === "active" ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-red-600" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setVenueToDelete(venue.venue_id)}
                            title="Delete Venue"
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the venue "{venue.venue_name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteVenue}
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
                {Array.isArray(venue.venue_spots) && venue.venue_spots.length > 0 && venue.venue_spots.map((spot) => (
                  <TableRow key={`${venue.venue_id}-${spot.venue_spot_id}`} className={`bg-gray-50 ${!expandedVenues.includes(venue.venue_id) ? 'hidden' : ''}`}>
                    <TableCell className="w-10"></TableCell>
                    <TableCell className="w-12 pl-10">
                      <div className="h-8 w-8 rounded-md overflow-hidden">
                        <img 
                          src={spot.spot_image || defaultVenueImage} 
                          alt={spot.spot_name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = defaultVenueImage;
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1 text-gray-700">
                        <MapPin size={14} className="text-gray-500" />
                        {spot.spot_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">
                        Area: {spot.area} sqft • Capacity: {spot.capacity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">
                        {spot.start_time} - {spot.end_time}
                      </span>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))}
                {expandedVenues.includes(venue.venue_id) && (!venue.venue_spots || venue.venue_spots.length === 0) && (
                  <TableRow className="bg-gray-50">
                    <TableCell colSpan={6} className="text-center py-4 text-sm text-gray-500">
                      No spots available for this venue.
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
            {loading && venues.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <p className="text-gray-500">Loading venues...</p>
                </TableCell>
              </TableRow>
            )}
            {!loading && venues.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <p className="text-gray-500 text-lg">No venues found.</p>
                  <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria or add a new venue.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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

      <div className="text-sm text-gray-500">
        Manage venue operations like add/update and disable venues.
      </div>

      <AddVenueDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveEditedVenue}
        onSaveSpot={handleSaveEditedSpot}
        editVenue={venueToEditId}
      />

      {/* Venue Details Dialog */}
      <Dialog open={!!viewDetailsVenue} onOpenChange={(open) => !open && setViewDetailsVenue(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Venue Details</DialogTitle>
          </DialogHeader>

          {viewDetailsVenue && (
            <div className="flex-grow overflow-y-auto pr-2 space-y-6">
              {/* Venue image */}
              {viewDetailsVenue.venue_image && (
                <div className="w-full h-56 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={viewDetailsVenue.venue_image} 
                    alt={viewDetailsVenue.venue_name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = defaultVenueImage;
                      target.classList.add('opacity-50');
                    }}
                  />
                </div>
              )}

              {/* Main Info */}
              <div className="pb-4 border-b">
                <div className="flex justify-between items-start">
                    <h3 className="text-2xl font-bold text-gray-800 break-words">{viewDetailsVenue.venue_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${
                      viewDetailsVenue.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {viewDetailsVenue.status}
                    </span>
                </div>
                <p className="text-gray-500 mt-1 break-words">{viewDetailsVenue.address}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Description */}
                {viewDetailsVenue.description && (
                  <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                    <p className="text-sm text-gray-600 break-words">{viewDetailsVenue.description}</p>
                  </div>
                )}
                
                {/* Key Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Venue Information</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Venue ID:</span>
                      <span className="font-medium">{viewDetailsVenue.venue_id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Total Spots:</span>
                      <span className="font-medium">{viewDetailsVenue.venue_spots?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Venue Spots */}
              <div>
                <h4 className="text-xl font-semibold text-gray-800 mb-4">Venue Spots</h4>
                {viewDetailsVenue.venue_spots && viewDetailsVenue.venue_spots.length > 0 ? (
                  <div className="space-y-4">
                    {viewDetailsVenue.venue_spots.map((spot) => (
                      <div key={spot.venue_spot_id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row gap-4">
                          {spot.spot_image && (
                            <div className="h-24 w-full md:w-24 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                              <img 
                                src={spot.spot_image} 
                                alt={spot.spot_name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = defaultVenueImage;
                                  target.classList.add('opacity-50');
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-grow min-w-0">
                            <h5 className="font-semibold text-lg break-words">{spot.spot_name}</h5>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-3 text-sm">
                              <div><span className="text-gray-500">Area:</span> {spot.area} sqft</div>
                              <div><span className="text-gray-500">Capacity:</span> {spot.capacity}</div>
                              <div><span className="text-gray-500">Hours:</span> {spot.start_time} - {spot.end_time}</div>
                              <div><span className="text-gray-500">Days:</span> {spot.operative_days.length} days/week</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No spots available for this venue.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VenueTable;
