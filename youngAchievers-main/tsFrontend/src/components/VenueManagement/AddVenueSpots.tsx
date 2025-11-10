import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Venue, VenueSpot } from '../../pages/VenueManagement';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import { addSpot, updateSpot, deleteSpot } from '@/store/venue/venueSlice';
import { fetchAmenities } from '@/store/amenity/amenitySlice'; // Import fetchAmenities
import { Amenity as AmenityType } from '@/types/amenity'; // Import Amenity type
import { validatePositiveNumber } from '@/utils/formValidation';
import {
  validateSpotName,
  validateOperativeDays,
  validateTimes,
  SpotValidationErrors
} from '@/utils/spotValidation';
import { TruncatedText } from '@/components/ui/truncated-text'; // Added import

interface OperativeDay {
  id: number;
  name: string;
  shortName: string;
}

interface AddVenueSpotsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueId: number;
}

const AddVenueSpots: React.FC<AddVenueSpotsProps> = ({
  open,
  onOpenChange,
  venueId,
}) => {
  const { venues } = useAppSelector((state) => state.venues);
  const { amenities: availableAmenities, loading: amenitiesLoading } = useAppSelector((state) => state.amenities); // Get amenities from Redux
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const venue = venues.find(v => v.venue_id === venueId);
  const [isAddingSpot, setIsAddingSpot] = useState(false);
  const [currentSpot, setCurrentSpot] = useState<number | null>(null);
  const [currentSpotData, setCurrentSpotData] = useState<Omit<VenueSpot, 'venue_spot_id' | 'created_by' | 'updated_by'>>({
    spot_name: "",
    area: 0,
    capacity: 0,
    amenities: [],
    operative_days: [1, 2, 3, 4, 5],
    start_time: "09:00",
    end_time: "17:00"
  });
  const [spotToDelete, setSpotToDelete] = useState<VenueSpot | null>(null); // Store the whole spot object for the dialog
  const [validation, setValidation] = useState<SpotValidationErrors>({});
  const [selectedAmenityCategory, setSelectedAmenityCategory] = useState<string>('basic');

  const categoryOptions = [
    { value: 'basic', label: 'Basic Amenities' },
    { value: 'comfort', label: 'Comfort Amenities' },
    { value: 'additional', label: 'Additional Amenities' },
  ];

  useEffect(() => {
    if (open) {
      dispatch(fetchAmenities(true)); // Fetch amenities when the component opens
    }
  }, [open, dispatch]);

  const addedSpot = () => {
    setCurrentSpot(null);
    setCurrentSpotData({
      spot_name: "",
      area: 0,
      amenities: [],
      capacity: 0,
      operative_days: [1, 2, 3, 4, 5].sort((a, b) => a - b), // Ensure initial days are sorted
      start_time: "09:00",
      end_time: "17:00"
    });
    setIsAddingSpot(true);
  };

  const editSpot = (spotId: number) => {
    setCurrentSpot(spotId);
    const spotToEdit = venue?.venue_spots?.find(s => s.venue_spot_id === spotId);
    if (spotToEdit) {
      setCurrentSpotData({
        spot_name: spotToEdit.spot_name,
        area: spotToEdit.area,
        capacity: spotToEdit.capacity,
        operative_days: [...spotToEdit.operative_days].sort((a, b) => a - b), // Sort days when editing
        start_time: spotToEdit.start_time,
        end_time: spotToEdit.end_time,
        amenities: spotToEdit.amenities,
      });
    }
    setIsAddingSpot(true);
  };


  const handleConfirmDeleteSpot = async () => {
    if (!spotToDelete || !venueId) {
      toast({
        title: "Error",
        description: "Spot or Venue ID is missing.",
        variant: "destructive"
      });
      setSpotToDelete(null); // Reset spot to delete
      return;
    }

    try {
      await dispatch(deleteSpot({ venueId: venueId, spotId: spotToDelete.venue_spot_id })).unwrap();
      toast({
        title: "Spot Removed",
        description: `The spot "${spotToDelete.spot_name}" has been removed from this venue.`
      });
    } catch (error: any) {
      
    } finally {
      setSpotToDelete(null); // Reset spot to delete
    }
  };

  const cancelAddSpot = () => {
    setIsAddingSpot(false);
    setCurrentSpot(null);
    onOpenChange(false);
  };

  const validateForm = (): SpotValidationErrors | null => {
    const errors: SpotValidationErrors = {};

    // Validate spot name
    errors.spot_name = validateSpotName(currentSpotData.spot_name);
    if (errors.spot_name) {
    }

    // Validate area
    const areaError = validatePositiveNumber(currentSpotData.area, "Area", 1);
    if (areaError) {
      errors.area = areaError;
    }

    // Validate capacity
    const capacityError = validatePositiveNumber(currentSpotData.capacity, "Maximum capacity", 1);
    if (capacityError) {
      errors.capacity = capacityError;
    }

    // Validate operative days
    errors.operative_days = validateOperativeDays(currentSpotData.operative_days);
    if (errors.operative_days) {
    }

    // Validate times
    const timeError = validateTimes(currentSpotData.start_time, currentSpotData.end_time);
    if (timeError) {
      // Assign to end_time for simplicity, or could be a general time error
      errors.end_time = timeError;
    }

    setValidation(errors);

        // Check if any error messages exist
    if (Object.values(errors).some(error => error !== undefined)) {
      return errors; // Return the errors object
    }
    return null; // Return null if no errors
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Call validateForm and get the current validation state
    const isFormValid = validateForm();
    const currentValidationErrors = validateForm(); // Capture the state after validateForm

    if (currentValidationErrors) {
      const errorMessages = Object.values(currentValidationErrors)
        .filter(message => typeof message === 'string' && message.trim() !== '')
        .map((message, index) => <li key={index}>{message}</li>);

      toast({
        title: "Validation Error",
        description: (
          <div className="text-left">
            <p className="mb-2">Please correct the following errors:</p>
            <ul className="list-disc list-inside">
              {errorMessages}
            </ul>
          </div>
        ),
        variant: "destructive",
        duration: 7000, // Give more time to read multiple errors
      });
      return;
    }
    if (!venueId) {
      toast({
        title: "Error",
        description: "Venue ID is missing.",
        variant: "destructive"
      });
      return;
    }

    try {
      let action;
      // Ensure operative_days are sorted before submitting
      const spotDataToSubmit = {
        ...currentSpotData,
        operative_days: [...currentSpotData.operative_days].sort((a, b) => a - b),
      };

      if (currentSpot !== null) {
        action = updateSpot({ ...spotDataToSubmit, venue_spot_id: currentSpot, venue_id: venueId });
        await dispatch(action).unwrap();
        toast({
          title: "Spot Updated",
          description: `${spotDataToSubmit.spot_name} has been updated.`,
        });
      } else {
        action = addSpot({ ...spotDataToSubmit, venue_id: venueId });
        await dispatch(action).unwrap();

        toast({
          title: "Spot Added",
          description: `${spotDataToSubmit.spot_name} has been added to ${venue?.venue_name || "the venue"}.`,
        });
      }

      setIsAddingSpot(false);
      setCurrentSpot(null);
      
    } catch (error: any) {
      console.error("Error adding/updating spot:", error);

    }

    
  };

  const handleInputChange = (field: keyof typeof currentSpotData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
        
    let inputValue = e.target.value;

    // Enforce maxLength for 'area' and 'capacity' fields
    if ((field === 'area' || field === 'capacity') && e.target.type === 'number') {
      const MAX_DIGITS = 6; // Define your maximum number of digits
      if (inputValue.length > MAX_DIGITS) {
        inputValue = inputValue.slice(0, MAX_DIGITS);
      }
    }

    const finalValue = e.target.type === 'number' ? parseInt(inputValue) || 0 : inputValue;
    setCurrentSpotData(prev => ({ ...prev, [field]: finalValue }));

    // Clear validation error for the field when user starts typing
    if (validation[field]) {
      setValidation(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getAmenityNames = (amenityIds: number[]): React.ReactNode => {
    if (!amenityIds || amenityIds.length === 0 || !availableAmenities || availableAmenities.length === 0) {
      return <span className="text-gray-400">None</span>;
    }

    const namesString = amenityIds
      .map(id => availableAmenities.find(a => a.id === id)?.name)
      .filter(name => !!name) // Filter out undefined or empty names
      .join(", ");

    if (!namesString.trim()) {
        return <span className="text-gray-400">None</span>;
    }
    // Using a maxLength that seems reasonable for a table cell.
    // The TruncatedText component will show the full text in a tooltip if truncated.
    return <TruncatedText text={namesString} maxLength={15} />;
  };

  const operativeDays: OperativeDay[] = [
    { id: 1, name: "Monday", shortName: "Mon" },
    { id: 2, name: "Tuesday", shortName: "Tue" },
    { id: 3, name: "Wednesday", shortName: "Wed" },
    { id: 4, name: "Thursday", shortName: "Thu" },
    { id: 5, name: "Friday", shortName: "Fri" },
    { id: 6, name: "Saturday", shortName: "Sat" },
    { id: 7, name: "Sunday", shortName: "Sun" },
  ];

  const getOperativeDayNames = (dayIds: number[]): string => {
    if (!dayIds || dayIds.length === 0) return "None";
    if (dayIds.length === 7) return "All days";
    
    // Sort the dayIds before mapping to names to ensure consistent display order
    const sortedDayIds = [...dayIds].sort((a, b) => a - b);

    return sortedDayIds.map(id =>
      operativeDays.find(d => d.id === id)?.shortName || ""
    ).join(", ");
  };

  const handleOperativeDayChange = (dayId: number) => {
    setCurrentSpotData(prevData => {
      const newDays = [...prevData.operative_days];
      if (newDays.includes(dayId)) {
        // Remove day
        return {
          ...prevData,
          operative_days: newDays.filter(id => id !== dayId).sort((a, b) => a - b)
        };
      } else {
        // Add day and sort
        return {
          ...prevData,
          operative_days: [...newDays, dayId].sort((a, b) => a - b)
        };
      }
    });
  };


  const renderSpotListContent = () => (
    <div className="space-y-4">
      {venue?.venue_spots && venue.venue_spots.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">No Data To Display</p>
          <p className="text-sm text-gray-400 mt-2">Click on Add Spot to add spot for this venue</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-6 gap-4 px-4 pb-2 border-b text-sm font-medium text-gray-500">
            <div className="col-span-2">Spot Name</div>
            <div>Capacity</div>
            <div>Amenities</div>
            <div>Operating Days</div>
            <div className="text-right">Actions</div>
          </div>

          {venue?.venue_spots?.map((spot) => (
            <div key={spot.venue_spot_id} className="grid grid-cols-6 gap-4 px-4 py-3 border rounded-md items-center">
              <div className="col-span-2 font-medium">{spot.spot_name}</div>
              <div>{spot.capacity || "-"}</div>
              <div className="text-sm break-words">
                {getAmenityNames(spot.amenities)}
              </div>
              <div className="text-sm">
                {getOperativeDayNames(spot.operative_days)}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editSpot(spot.venue_spot_id)}
                >
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSpotToDelete(spot)} // Set the spot to be deleted
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will permanently delete the spot "<strong>{spot.spot_name}</strong>". This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setSpotToDelete(null)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleConfirmDeleteSpot}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={addedSpot}
        className="w-full"
      >
        <Plus size={16} className="mr-2" />
        Add Spot
      </Button>
    </div>
  );

  return (
    <>
      <Dialog open={open && !isAddingSpot} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Spots for {venue?.venue_name || "Venue"}</DialogTitle>
            <DialogDescription>
              Add and manage spots or areas within this venue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {venue && (
              <div className="flex items-start gap-3 p-3 border rounded-md bg-gray-50">
                <MapPin className="text-gray-500 mt-0.5" size={18} />
                <div>
                  <h4 className="font-medium text-sm">Venue Address</h4>
                  <p className="text-gray-600 text-sm mt-1">{venue.address}</p>
                </div>
              </div>
            )}

            {renderSpotListContent()}
          </div>

          <DialogFooter>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={open && isAddingSpot} onOpenChange={(value) => {
        if (!value) {
          cancelAddSpot();
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-full p-0">
          <div className="h-full flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelAddSpot}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft size={20} />
                </Button>
                <div>
                  <h2 className="text-xl font-semibold">
                    {currentSpot !== null ? "Edit Spot" : "Add New Spot"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    for {venue?.venue_name || "the venue"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="spot-name">
                    Spot Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="spot-name"
                    value={currentSpotData.spot_name}
                    onChange={handleInputChange('spot_name')}
                    placeholder="E.g., Court 1, Main Hall"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="spot-area">
                      Area (sq ft) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="spot-area"
                      type="number"
                      min="1"
                      value={currentSpotData.area}
                      onChange={handleInputChange('area')}
                      placeholder="Area in square feet"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spot-capacity">
                      Maximum Capacity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="spot-capacity"
                      type="number"
                      min="1"
                      value={currentSpotData.capacity}
                      onChange={handleInputChange('capacity')}
                      placeholder="Maximum occupancy"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Working Hours</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-time" className="text-xs text-gray-500">
                        Start Time
                      </Label>
                      <div className="flex mt-1">
                        <Input
                          id="start-time"
                          type="time"
                          value={currentSpotData.start_time}
                          onChange={(e) => setCurrentSpotData({
                            ...currentSpotData,
                            start_time: e.target.value
                          })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="end-time" className="text-xs text-gray-500">
                        End Time
                      </Label>
                      <div className="flex mt-1">
                        <Input
                          id="end-time"
                          type="time"
                          value={currentSpotData.end_time}
                          onChange={(e) => setCurrentSpotData({
                            ...currentSpotData,
                            end_time: e.target.value
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Operative Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {operativeDays.map((day) => (
                      <div
                        key={day.id}
                        className={`
                          border rounded-md px-3 py-2 cursor-pointer text-sm
                          ${currentSpotData.operative_days.includes(day.id)
                            ? 'bg-primary text-primary-foreground' // Use primary-foreground for better contrast
                            : 'bg-gray-50 hover:bg-gray-100'
                          }
                        `}
                        onClick={() => handleOperativeDayChange(day.id)}
                      >
                        {day.shortName}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Amenities</Label>
                  {amenitiesLoading ? (
                    <p className="text-sm text-gray-500">Loading amenities...</p>
                  ) : !availableAmenities || availableAmenities.length === 0 ? (
                    <p className="text-sm text-red-500">No amenities available. Please add amenities in Venue Configurations.</p>
                  ) : (
                    <>
                      {/* Category Tabs */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {categoryOptions.map(category => (
                          <button
                            key={category.value}
                            type="button"
                            className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors duration-150 ${
                              selectedAmenityCategory === category.value
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                            }`}
                            onClick={() => setSelectedAmenityCategory(category.value)}
                          >
                            {category.label}
                          </button>
                        ))}
                      </div>
                      {/* Amenities for selected category */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {availableAmenities.filter(a => a.category === selectedAmenityCategory).length === 0 ? (
                          <div className="col-span-full text-gray-500 text-sm">No amenities in this category.</div>
                        ) : (
                          availableAmenities.filter(a => a.category === selectedAmenityCategory).map(amenity => (
                            <div key={amenity.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`amenity-${amenity.id}`}
                                checked={currentSpotData.amenities?.includes(amenity.id)}
                                onCheckedChange={(checked) => {
                                  const newAmenities = [...(currentSpotData.amenities || [])];
                                  if (checked) {
                                    if (!newAmenities.includes(amenity.id)) {
                                      setCurrentSpotData({
                                        ...currentSpotData,
                                        amenities: [...newAmenities, amenity.id]
                                      });
                                    }
                                  } else {
                                    setCurrentSpotData({
                                      ...currentSpotData,
                                      amenities: newAmenities.filter(id => id !== amenity.id)
                                    });
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`amenity-${amenity.id}`}
                                className="cursor-pointer"
                              >
                                <TruncatedText text={amenity.name} maxLength={25} />
                              </Label>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t p-6 bg-gray-50">
              <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={cancelAddSpot}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSubmit} >
                  {currentSpot !== null ? "Update Spot" : "Add Spot"}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AddVenueSpots;
