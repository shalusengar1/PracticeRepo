import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  selectAllAssets, 
  selectAssetState, 
  fetchAssets, 
  addAsset as addAssetAction, 
  updateAsset as updateAssetAction, 
  deleteAsset as deleteAssetAction,
} from '@/store/assets/assetSlice';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Archive, Edit, Guitar, Package, PackageOpen, Piano, Plus, Trash, XIcon } from "lucide-react";
import { FixedAsset } from '@/types/asset'; 
import { AppDispatch } from '@/store/store';
import { format } from 'date-fns';
import { getVenues } from '@/services/assetService';
import { validateAlphanumeric, validatePositiveNumber } from '@/utils/formValidation';
import { formatBackendError } from '@/utils/errorHandling';

const transformAssetForBackend = (asset: any) => {
  return {
    ...asset,
    in_use: asset.inUse ? asset.inUse : 0,
    last_service_date: asset.lastServiceDate
      ? format(asset.lastServiceDate, 'yyyy-MM-dd')
      : null,
    venue_id: asset.venue_id,
  };
};

interface AssetValidation {
  name?: string;
  quantity?: string;
  inUse?: string;
  location?: string;
  venue_id?: string; // Added for venue validation
}

const FixedAssetsInventory: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { assets, status, error } = useSelector(selectAssetState);
  const { toast } = useToast();
  const [filteredAssets, setFilteredAssets] = useState<FixedAsset[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [newAsset, setNewAsset] = useState<Omit<FixedAsset, 'id'>>({
    type: 'instrument',
    name: '',
    quantity: 0,
    inUse: 0,
    condition: 'good',
    location: '',
    venue_id: undefined,
    lastServiceDate: undefined,
  });

  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newAssetValidation, setNewAssetValidation] = useState<AssetValidation>({});
  const [editAssetValidation, setEditAssetValidation] = useState<AssetValidation>({});

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchAssets());
    }
  }, [status, dispatch]);

  const [venues, setVenues] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const venueData = await getVenues();
        setVenues(venueData);
      } catch (error) {
        console.error("Error fetching venues:", error);
        toast({
          title: "Error",
          description: formatBackendError(error),
          variant: "destructive",
        });
      }
    };

    fetchVenues();
  }, []);

  useEffect(() => {
    setFilteredAssets(assets);
  }, [assets]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    filterAssets(value, filterType);
  };

  const handleFilterChange = (value: string) => {
    setFilterType(value);
    filterAssets(searchQuery, value);
  };

  const filterAssets = (query: string, type: string) => {
    let filtered = assets;
    
    if (type !== "all") {
      filtered = filtered.filter(asset => asset.type === type);
    }
    
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(lowercaseQuery) ||
        asset.location.toLowerCase().includes(lowercaseQuery)
      );
    }
    
    setFilteredAssets(filtered);
  };

  const validateNewAsset = (): boolean => {
    const errors: AssetValidation = {};
    
    const nameError = validateAlphanumeric(newAsset.name, "Asset name");
    if (nameError) errors.name = nameError;
    
    const quantityError = validatePositiveNumber(newAsset.quantity, "Quantity", 1);
    if (quantityError) errors.quantity = quantityError;
    
    const inUseError = validatePositiveNumber(newAsset.inUse, "In use count", 0);
    if (inUseError) errors.inUse = inUseError;
    
    if (newAsset.inUse > newAsset.quantity) {
      errors.inUse = "In use count cannot exceed total quantity";
    }
    
    if (!newAsset.venue_id) {
      errors.venue_id = "Venue is required";
    }
    
    setNewAssetValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditAsset = (): boolean => {
    if (!editingAsset) return false;
    
    const errors: AssetValidation = {};
    
    const nameError = validateAlphanumeric(editingAsset.name, "Asset name");
    if (nameError) errors.name = nameError;
    
    const quantityError = validatePositiveNumber(editingAsset.quantity, "Quantity", 1);
    if (quantityError) errors.quantity = quantityError;
    
    const inUseError = validatePositiveNumber(editingAsset.inUse, "In use count", 0);
    if (inUseError) errors.inUse = inUseError;
    
    if (editingAsset.inUse > editingAsset.quantity) {
      errors.inUse = "In use count cannot exceed total quantity";
    }

    if (!editingAsset.venue_id) {
      errors.venue_id = "Venue is required";
    }
    
    setEditAssetValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const resetNewAssetForm = () => {
    setNewAsset({
      type: 'instrument',
      name: '',
      quantity: 0,
      inUse: 0,
      condition: 'good',
      location: '',
      venue_id: undefined,
      lastServiceDate: undefined,
    });
    setNewAssetValidation({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue: string | number = value;

    if (name === 'quantity' || name === 'inUse') {
      const MAX_DIGITS = 6;

      if (value === '') {
        processedValue = 0; // Treat empty input as 0
      } else if (/^\d+$/.test(value) && value.length <= MAX_DIGITS) {
        // If the input is all digits and not exceeding max length
        const numValue = parseInt(value, 10);
        processedValue = Math.max(0, numValue); // Ensure non-negative, parseInt handles leading zeros
      } else {
        const currentAsset = isEditDialogOpen && editingAsset ? editingAsset : newAsset;
        processedValue = currentAsset[name as keyof typeof currentAsset];
        
        if (value.length > MAX_DIGITS && /^\d+$/.test(value.substring(0, MAX_DIGITS))) {
          toast({
            title: "Input Limit Reached",
            description: `Maximum ${MAX_DIGITS} digits allowed.`,
            variant: "default",
          });
        }
        }
    }
    
    if (isEditDialogOpen && editingAsset) {
      setEditingAsset({
        ...editingAsset,
        [name]: name === 'venue_id' ? parseInt(value) || 0 : processedValue
      });
      // Clear validation error for this field
      setEditAssetValidation(prev => ({ ...prev, [name]: undefined }));
    } else {
      setNewAsset({
        ...newAsset,
        [name]: name === 'venue_id' ? parseInt(value) || 0 : processedValue
      });
      // Clear validation error for this field
      setNewAssetValidation(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (isEditDialogOpen && editingAsset) {
      setEditingAsset({
        ...editingAsset,
        [name]: name === 'venue_id' ? parseInt(value) : value
      });
      if (name === 'venue_id') {
        setEditAssetValidation(prev => ({ ...prev, venue_id: undefined }));
      };
    } else {
      setNewAsset({
        ...newAsset,
        [name]: name === 'venue_id' ? parseInt(value) : value
      });
      if (name === 'venue_id') {
        setNewAssetValidation(prev => ({ ...prev, venue_id: undefined }));
      };
    }
  };

  const handleAddAsset = async () => {
    if (!validateNewAsset()) {
      return;
    }

    try {
      await dispatch(addAssetAction(transformAssetForBackend(newAsset))).unwrap();
      toast({
        title: "Asset Added",
        description: `${newAsset.name} has been added to inventory.`
      });
      setIsAddDialogOpen(false);
      resetNewAssetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: (error),
        variant: "destructive",
      });
    }
  };

  const handleEditAsset = async () => {
    if (!editingAsset || !validateEditAsset()) {
      return;
    }

    try {
      await dispatch(updateAssetAction(transformAssetForBackend(editingAsset))).unwrap();
      toast({
        title: "Asset Updated",
        description: `${editingAsset.name} has been updated.`
      });
      setIsEditDialogOpen(false);
      setEditingAsset(null);
      setEditAssetValidation({});
    } catch (error: any) {
      toast({
        title: "Error",
        description: (error),
        variant: "destructive",
      });
    }
  };

  const handleDeleteAsset = async (id: string) => {
    const assetToDelete = assets.find(asset => asset.id === id);
    if (!assetToDelete) return;

    if (assetToDelete.inUse > 0) {
      toast({
        title: "Cannot Delete Asset",
        description: "This asset is currently in use. Please update the 'In Use' count to 0 before deleting.",
        variant: "destructive"
      });
      return;
    }

    try {
      await dispatch(deleteAssetAction(id));
      toast({
        title: "Asset Deleted",
        description: `${assetToDelete.name} has been removed from inventory.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: (error),
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (asset: FixedAsset) => {
    setEditingAsset(asset);
    setEditAssetValidation({});
    setIsEditDialogOpen(true);
  };

  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
    resetNewAssetForm();
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingAsset(null);
    setEditAssetValidation({});
  };

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'instrument':
        if (editingAsset?.name.toLowerCase().includes('guitar') || newAsset.name.toLowerCase().includes('guitar')) {
          return <Guitar className="h-4 w-4" />;
        } else if (editingAsset?.name.toLowerCase().includes('piano') || newAsset.name.toLowerCase().includes('piano')) {
          return <Piano className="h-4 w-4" />;
        }
        return <Guitar className="h-4 w-4" />;
      case 'equipment':
        return <PackageOpen className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const totalAssets = assets.reduce((sum, asset) => sum + asset.quantity, 0);
  const totalInUse = assets.reduce((sum, asset) => sum + asset.inUse, 0);
  const availableAssets = assets.reduce((sum, asset) => sum + (asset.quantity - asset.inUse), 0);
  const utilizationRate = totalAssets > 0 ? Math.round((totalInUse / totalAssets) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row justify-between items-start md:items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Fixed Assets Inventory</h2>
          <p className="text-muted-foreground">
            Manage and track musical instruments and equipment
          </p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)} 
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add Asset
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div className="w-full md:w-1/2 relative"> {/* Added relative positioning */}
          <Label htmlFor="search" className="sr-only">Search</Label>
          <Input
            id="search"
            placeholder="Search assets by name or location..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pr-10" // Added padding to the right for the X button
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => handleSearch("")}
            >
              <XIcon size={16} />
            </Button>
          )}
        </div>
        <div className="w-full md:w-1/4">
          <Label htmlFor="filter-type" className="text-sm font-medium">Filter by Type</Label>
          <Select
            value={filterType}
            onValueChange={handleFilterChange}
          >
            <SelectTrigger id="filter-type" className="mt-2">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="instrument">Instruments</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {status === 'loading' ? (
        <p>Loading assets...</p>
      ) : status === 'failed' ? (
        <p>Error: {formatBackendError(error)}</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">S.No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-center">In Use</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No assets found. Try adjusting your search or filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((asset, index) => (
                    <TableRow key={asset.id}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {asset.type === 'instrument' ? (
                            asset.name.toLowerCase().includes('guitar') ? (
                              <Guitar className="h-4 w-4 text-primary" />
                            ) : asset.name.toLowerCase().includes('piano') ? (
                              <Piano className="h-4 w-4 text-primary" />
                            ) : (
                              <Guitar className="h-4 w-4 text-primary" />
                            )
                          ) : (
                            <PackageOpen className="h-4 w-4 text-primary" />
                          )}
                          <span className="capitalize">{asset.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{asset.quantity}</TableCell>
                      <TableCell className="text-center">{asset.inUse}</TableCell>
                      <TableCell className="text-center">
                        <span className={`${asset.quantity - asset.inUse <= 1 ? 'text-red-500 font-medium' : 'text-green-600'}`}>
                          {asset.quantity - asset.inUse}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          asset.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                          asset.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                          asset.condition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {asset.condition}
                        </span>
                      </TableCell>
                      <TableCell>{asset.location}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(asset)}
                            title="Edit Asset"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteAsset(asset.id)}
                            title="Delete Asset"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalAssets}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {assets.length} different items
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Currently In Use
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalInUse}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {utilizationRate}% utilization rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {availableAssets}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for assignment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Asset Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={closeAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Asset Type</Label>
              <Select 
                value={newAsset.type}
                onValueChange={(value) => handleSelectChange("type", value)}
              >
                <SelectTrigger id="type" className="w-full">
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instrument">Instrument</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Asset Name</Label>
              <div className="flex items-center space-x-2">
                {getAssetTypeIcon(newAsset.type)}
                <Input
                  id="name"
                  name="name"
                  value={newAsset.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Acoustic Guitar, Chess Set"
                  className={`flex-1 ${newAssetValidation.name ? "border-red-500" : ""}`}
                />
              </div>
              {newAssetValidation.name && (
                <p className="text-xs text-red-500">{newAssetValidation.name}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Total Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={newAsset.quantity}
                  onChange={handleInputChange}
                  min="0"
                  className={newAssetValidation.quantity ? "border-red-500" : ""}
                />
                {newAssetValidation.quantity && (
                  <p className="text-xs text-red-500">{newAssetValidation.quantity}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="inUse">Currently In Use</Label>
                <Input
                  id="inUse"
                  name="inUse"
                  type="number"
                  value={newAsset.inUse}
                  onChange={handleInputChange}
                  min="0"
                  max={newAsset.quantity}
                  className={newAssetValidation.inUse ? "border-red-500" : ""}
                />
                {newAssetValidation.inUse && (
                  <p className="text-xs text-red-500">{newAssetValidation.inUse}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select 
                value={newAsset.condition}
                onValueChange={(value) => handleSelectChange("condition", value as 'excellent' | 'good' | 'fair' | 'poor')}
              >
                <SelectTrigger id="condition" className="w-full">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Select
                value={newAsset.venue_id?.toString()}
                onValueChange={(value) => { handleSelectChange('venue_id', value); setNewAssetValidation(prev => ({ ...prev, venue_id: undefined })); }}
              >
                <SelectTrigger id="venue" className="w-full">
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map(venue => (
                    <SelectItem key={venue.id} value={venue.id.toString()}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newAssetValidation.venue_id && (
                <p className="text-xs text-red-500">{newAssetValidation.venue_id}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastServiceDate">Last Service Date (Optional)</Label>
              <Input
                id="lastServiceDate"
                name="lastServiceDate"
                type="date"
                value={newAsset.lastServiceDate}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddAsset}>Add Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={closeEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          {editingAsset && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Asset Type</Label>
                <Select 
                  value={editingAsset.type}
                  onValueChange={(value) => handleSelectChange("type", value)}
                >
                  <SelectTrigger id="edit-type" className="w-full">
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instrument">Instrument</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-name">Asset Name</Label>
                <div className="flex items-center space-x-2">
                  {getAssetTypeIcon(editingAsset.type)}
                  <Input
                    id="edit-name"
                    name="name"
                    value={editingAsset.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Acoustic Guitar, Chess Set"
                    className={`flex-1 ${editAssetValidation.name ? "border-red-500" : ""}`}
                  />
                </div>
                {editAssetValidation.name && (
                  <p className="text-xs text-red-500">{editAssetValidation.name}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Total Quantity</Label>
                  <Input
                    id="edit-quantity"
                    name="quantity"
                    type="number"
                    value={editingAsset.quantity}
                    onChange={handleInputChange}
                    min="0"
                    className={editAssetValidation.quantity ? "border-red-500" : ""}
                  />
                  {editAssetValidation.quantity && (
                    <p className="text-xs text-red-500">{editAssetValidation.quantity}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-inUse">Currently In Use</Label>
                  <Input
                    id="edit-inUse"
                    name="inUse"
                    type="number"
                    value={editingAsset.inUse}
                    onChange={handleInputChange}
                    min="0"
                    max={editingAsset.quantity}
                    className={editAssetValidation.inUse ? "border-red-500" : ""}
                  />
                  {editAssetValidation.inUse && (
                    <p className="text-xs text-red-500">{editAssetValidation.inUse}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-condition">Condition</Label>
                <Select 
                  value={editingAsset.condition}
                  onValueChange={(value) => handleSelectChange("condition", value as 'excellent' | 'good' | 'fair' | 'poor')}
                >
                  <SelectTrigger id="edit-condition" className="w-full">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-venue">Venue</Label>
                <Select
                  value={editingAsset.venue_id?.toString()}
                  onValueChange={(value) => { handleSelectChange('venue_id', value); setEditAssetValidation(prev => ({ ...prev, venue_id: undefined })); }}
                >
                  <SelectTrigger id="edit-venue" className="w-full">
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map(venue => (
                      <SelectItem key={venue.id} value={venue.id.toString()}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editAssetValidation.venue_id && (
                  <p className="text-xs text-red-500">{editAssetValidation.venue_id}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-lastServiceDate">Last Service Date (Optional)</Label>
                <Input
                  id="edit-lastServiceDate"
                  name="lastServiceDate"
                  type="date"
                  value={editingAsset.lastServiceDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleEditAsset}>Update Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FixedAssetsInventory;
