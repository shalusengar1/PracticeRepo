import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, XIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile, BREAKPOINTS } from "@/hooks/use-mobile";
import { Amenity } from '@/types/amenity'; // Assuming Amenity type includes 'id' as number
import { fetchAmenities, createAmenity, updateAmenitiesBulk, deleteAmenity, clearError, useAmenityToasts } from '@/store/amenity/amenitySlice';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import { TruncatedText } from '@/components/ui/truncated-text';
import { validateAmenity, AmenityValidationErrors } from '@/utils/amenityValidation';
import EmojiPicker, { EmojiStyle, EmojiClickData } from 'emoji-picker-react';

const categoryOptions = [
  { value: 'basic', label: 'Basic Amenities' },
  { value: 'comfort', label: 'Comfort Amenities' },
  { value: 'additional', label: 'Additional Amenities' },
];

interface AmenitiesComponentProps {
  title?: string;
  description?: string;
  showAddButton?: boolean;
  onAmenitiesChange?: (amenities: Amenity[]) => void;
}

const AmenitiesComponent: React.FC<AmenitiesComponentProps> = ({
  title = "Amenities",
  description = "Configure amenities for venues and spots",
  showAddButton = true,
  onAmenitiesChange
}) => {
  const dispatch = useAppDispatch();
  const { amenities, loading, error } = useAppSelector((state) => state.amenities);
  const { showSuccessToast, showErrorToast } = useAmenityToasts();
  const isMobile = useIsMobile(BREAKPOINTS.MOBILE);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAmenity, setNewAmenity] = useState<Omit<Amenity, 'id' | 'enabled'>>({
    name: '',
    icon: '🆕',
    category: 'additional'
  });
  const [validationErrors, setValidationErrors] = useState<AmenityValidationErrors>({});
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [amenityToDelete, setAmenityToDelete] = useState<Amenity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [stagedChanges, setStagedChanges] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    dispatch(fetchAmenities(false));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      showErrorToast(error);
      dispatch(clearError());
    }
  }, [error, dispatch, showErrorToast]);

  useEffect(() => {
    if (onAmenitiesChange) {
      const updatedAmenities = amenities.map(amenity => ({
        ...amenity,
        enabled: stagedChanges.hasOwnProperty(amenity.id) 
          ? stagedChanges[amenity.id] 
          : amenity.enabled
      }));
      onAmenitiesChange(updatedAmenities);
    }
  }, [stagedChanges, amenities, onAmenitiesChange]);

  const handleAmenityChange = (id: number, enabled: boolean) => {
    setStagedChanges(prevChanges => {
      const newChanges = { ...prevChanges };
      if (newChanges.hasOwnProperty(id)) {
        delete newChanges[id];
      } else {
        newChanges[id] = enabled;
      }
      return newChanges;
    });
  };

  const resetNewAmenityForm = () => {
    setNewAmenity({
      name: '',
      icon: '🆕',
      category: 'additional'
    });
    setValidationErrors({});
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      resetNewAmenityForm();
    }
  };

  const validateAndAddAmenity = () => {
    const errors = validateAmenity(newAmenity);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      showErrorToast(firstError);
      return;
    }

    dispatch(createAmenity(newAmenity))
      .unwrap()
      .then(() => {
        showSuccessToast("Amenity added successfully");
        setIsAddDialogOpen(false);
        resetNewAmenityForm()
      })
      .catch(() => {}); // Error is handled by the error useEffect
  };

  const saveSettings = () => {
    if (Object.keys(stagedChanges).length === 0) {
      showErrorToast("No changes to save.");
      return;
    }

    const updates = Object.entries(stagedChanges).map(([id, enabled]) => ({
      id: Number(id),
      enabled: enabled,
    }));

    dispatch(updateAmenitiesBulk(updates))
      .unwrap()
      .then(() => {
        showSuccessToast("Amenities settings have been successfully updated.");
        setStagedChanges({});
      })
      .catch(() => {}); // Error is handled by the error useEffect
  };

  const openDeleteConfirmationDialog = (amenity: Amenity) => {
    setAmenityToDelete(amenity);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (amenityToDelete) {
      dispatch(deleteAmenity(amenityToDelete.id))
        .unwrap()
        .then(() => {
          showSuccessToast(`Amenity "${amenityToDelete.name}" deleted successfully.`);
          setIsDeleteDialogOpen(false);
          setAmenityToDelete(null);
        })
        .catch(() => {
          // Error is handled by the global error useEffect which shows a toast
          // based on state.error from the slice.
          setIsDeleteDialogOpen(false);
          setAmenityToDelete(null);
        });
    }
  };

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    setNewAmenity(prev => ({ ...prev, icon: emojiData.emoji }));
    setIsEmojiPickerOpen(false);
    setValidationErrors(prev => ({ ...prev, icon: undefined }));
  };

  const AmenityCheckbox = ({ amenity }: { amenity: Amenity }) => {
    const isChecked = stagedChanges[amenity.id] !== undefined
      ? stagedChanges[amenity.id]
      : amenity.enabled;

    return (
      <div className="flex items-center justify-between gap-3 py-2">
        <div className="flex items-center gap-2 flex-grow min-w-0">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 ${
              isChecked ? 'bg-blue-500 text-white' : 'border border-gray-300 bg-white'
            }`}
            onClick={() => handleAmenityChange(amenity.id, !isChecked)}
            title="Toggle Visibility"
          >
            {isChecked && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <span className="mr-1 flex-shrink-0">{amenity.icon}</span>
          <TruncatedText text={amenity.name} maxLength={isMobile ? 15 : 20} className="flex-grow" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-500 hover:bg-red-100 flex-shrink-0"
          onClick={() => openDeleteConfirmationDialog(amenity)}
          title={`Delete ${amenity.name}`}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    );
  };

  if (loading) {
    return <p>Loading amenities...</p>;
  }

  const filteredAmenitiesByName = amenities.filter(amenity =>
    searchQuery ? amenity.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-medium">Available Amenities</h3>
          {showAddButton && (
            <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-1">
                  <Plus size={16} /> Add Amenity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Amenity</DialogTitle>
                  <DialogDescription>
                    Create a new amenity for your venues and spots.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amenityName" className={`${isMobile ? 'col-span-4' : 'text-right'}`}>
                      Name
                    </Label>
                    <div className={`${isMobile ? 'col-span-4' : 'col-span-3'}`}>
                      <Input
                        id="amenityName"
                        value={newAmenity.name}
                        onChange={(e) => {
                          setNewAmenity({...newAmenity, name: e.target.value});
                          setValidationErrors({...validationErrors, name: undefined});
                        }}
                        placeholder="e.g., Swimming Pool"
                        className={validationErrors.name ? 'border-red-500' : ''}
                      />
                      {validationErrors.name && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amenityCategory" className={`${isMobile ? 'col-span-4' : 'text-right'}`}>
                      Category
                    </Label>
                    <div className={`${isMobile ? 'col-span-4' : 'col-span-3'}`}>
                      <Select
                        value={newAmenity.category}
                        onValueChange={(value: 'basic' | 'comfort' | 'additional') => {
                          setNewAmenity({...newAmenity, category: value});
                          setValidationErrors({...validationErrors, category: undefined});
                        }}
                      >
                        <SelectTrigger className={validationErrors.category ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.category && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.category}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amenityIcon" className={`${isMobile ? 'col-span-4' : 'text-right'}`}>
                      Icon
                    </Label>
                    <div className={`${isMobile ? 'col-span-4' : 'col-span-3'}`}>
                      <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={`w-full justify-start font-normal ${validationErrors.icon ? 'border-red-500' : ''}`}>
                            <span className="text-2xl mr-2">{newAmenity.icon}</span>
                            <span>Choose Icon</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" side="right" align="start">
                          <EmojiPicker
                            onEmojiClick={handleEmojiSelect}
                            autoFocusSearch={false}
                            emojiStyle={EmojiStyle.NATIVE}
                            height={350}
                            width={isMobile ? 280 : 320}
                          />
                        </PopoverContent>
                      </Popover>
                      {validationErrors.icon && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.icon}</p>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter className={`${isMobile ? 'flex-col gap-2' : ''}`}>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={validateAndAddAmenity}>
                    Add Amenity
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search Input */}
        <div className="mb-6 mt-2">
          <Label htmlFor="search-amenities" className="sr-only">Search Amenities</Label>
          <div className="relative max-w-sm">
            <Input
              id="search-amenities"
              type="text"
              placeholder="Search amenities by name..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="pr-10" // Make space for the clear button
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={clearSearch}
                title="Clear search"
              >
                <XIcon size={16} />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {categoryOptions.map(category => {
            const amenitiesForCategory = amenities.filter(a => a.category === category.value);
            const searchedAmenitiesForCategory = filteredAmenitiesByName.filter(a => a.category === category.value);

            return (
              <Card key={category.value}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">{category.label}</CardTitle>
                </CardHeader>
                <CardContent className="overflow-y-auto max-h-[200px]">
                  {amenitiesForCategory.length === 0 ? (
                    <p className="text-sm text-gray-500">No {category.value} amenities available.</p>
                  ) : searchedAmenitiesForCategory.length === 0 ? (
                    <p className="text-sm text-gray-500">No {category.value} amenities match your search.</p>
                  ) : (
                    searchedAmenitiesForCategory.map(amenity => (
                      <AmenityCheckbox key={amenity.id} amenity={amenity} />
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator className="my-4" />

        <div className="mt-6">
          <Button onClick={saveSettings}>Save Amenities Settings</Button>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the amenity "{amenityToDelete?.name}"?
              This action cannot be undone and might affect existing venue configurations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AmenitiesComponent; 