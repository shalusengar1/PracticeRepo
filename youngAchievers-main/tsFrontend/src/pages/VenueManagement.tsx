import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Calendar, Users, Settings, Search, Filter } from 'lucide-react';
import VenueTable from '../components/VenueManagement/VenueTable';
import VenueReporting from '../components/VenueManagement/VenueReporting';
import VenueHolidays from '../components/VenueManagement/VenueHolidays';
import VenueFacilityManager from '../components/VenueManagement/VenueFacilityManager';
import VenueConfigurations from '../components/VenueManagement/VenueConfigurations';
import AddVenueDialog from '../components/VenueManagement/AddVenueDialog';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile, BREAKPOINTS } from "@/hooks/use-mobile";
import { fetchVenues, addVenue, addSpot, updateSpot, clearError, setVenueFilters } from '@/store/venue/venueSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useLocation and useNavigate
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink, PaginationEllipsis } from "@/components/ui/pagination";

// Define the VenueSpot interface to match the backend structure
export interface VenueSpot {
  venue_spot_id: number;
  spot_name: string;
  capacity: number;
  area: number;
  start_time: string;
  end_time: string;
  operative_days: number[]; // Corrected type
  amenities?: number[];
  spot_image?: string;
  spot_image_path?: string;
  created_by?: number;
  updated_by?: number;
}

// Define the Venue interface to match the backend structure
export interface Venue {
  venue_id: number;
  venue_name: string;
  address: string;
  description: string;
  latitude?: number;
  longitude?: number;
  status: 'active' | 'inactive' | 'deleted';
  created_at: string; // Or Date object
  updated_at: string; // Or Date object
  created_by: number;
  updated_by: number;
  venue_spots: VenueSpot[];
  venue_image?: string;
  venue_image_path?: string;
  venue_admins?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  }[];
}


// Define the User interface
export interface User {
  id: number;
  full_name: string;
  email: string;
}

// Define the TruncatedUser interface
export type TruncatedUser = Pick<User, 'id' | 'full_name' | 'email'>;

const VenueManagement: React.FC = () => {
  const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { venues, loading, error, totalPages, currentPage: reduxCurrentPage, filters } = useAppSelector((state) => state.venues);
  const { toast } = useToast();
  const isMobile = useIsMobile(BREAKPOINTS.TABLET);
  const isSmallScreen = useIsMobile(BREAKPOINTS.LAPTOP);
  const location = useLocation(); // Get location object
  const navigate = useNavigate(); // Get navigate function

  useEffect(() => {
    if (location.state?.openAddVenueDialog) {
      setIsAddVenueOpen(true);
      // Clear the state from location
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });

      dispatch(clearError());
    }
  }, [error, toast]);


  const handleAddVenue = async (newVenue: Omit<Venue, 'venue_id' | 'status' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'peak_occupancy' | 'total_events' | 'revenue_generated'>, venue_admin_ids?: number[]): Promise<Venue | null> => {
    try {
      const response = await dispatch(addVenue({ ...newVenue, venue_admin_ids })).unwrap();
      toast({
        title: "Venue Saved",
        description: `${newVenue.venue_name} has been successfully added to the venues list.`
      });
      return response;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add venue.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleAddSpot = async (venueId: number, spot: Omit<VenueSpot, 'venue_spot_id' | 'created_by' | 'updated_by'>, spotId?: number): Promise<boolean> => {
    try {
      if (spotId) {
        await dispatch(updateSpot({ ...spot, venue_spot_id: spotId, venue_id: venueId })).unwrap();
      } else {
        await dispatch(addSpot({ ...spot, venue_id: venueId })).unwrap();
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSearch = (val: string) => {
    dispatch(setVenueFilters({ search: val }));
  };
  const handleStatusChange = (val: string) => {
    dispatch(setVenueFilters({ status: val === 'all' ? '' : val }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight animate-fade-in">
          Venue Management
        </h1>
        <Button
          onClick={() => setIsAddVenueOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add New Venue
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 sm:p-4 md:p-6 animate-fade-in">
        <Tabs defaultValue="venues" className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className={`mb-6 ${isMobile ? 'grid grid-cols-2' : isSmallScreen ? 'grid grid-cols-3' : 'grid grid-cols-5'} min-w-[340px] sm:min-w-0`}>
              <TabsTrigger value="venues" className="flex items-center gap-2">
                <FileText size={16} />
                <span className="truncate">Venues</span>
              </TabsTrigger>
              <TabsTrigger value="reporting" className="flex items-center gap-2">
                <FileText size={16} />
                <span className="truncate">Reporting</span>
              </TabsTrigger>
              {!isMobile && (
                <TabsTrigger value="holidays" className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span className="truncate">Holidays</span>
                </TabsTrigger>
              )}
              {!isMobile && !isSmallScreen && (
                <>
                  <TabsTrigger value="facility" className="flex items-center gap-2">
                    <Users size={16} />
                    <span className="truncate">Facility Managers</span>
                  </TabsTrigger>
                  <TabsTrigger value="configurations" className="flex items-center gap-2">
                    <Settings size={16} />
                    <span className="truncate">Configurations</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {isMobile && (
              <TabsList className="mb-6 grid grid-cols-1 sm:grid-cols-3 min-w-[240px] sm:min-w-0">
                <TabsTrigger value="holidays" className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span className="truncate">Holidays</span>
                </TabsTrigger>
                {isSmallScreen && (
                  <>
                    <TabsTrigger value="facility" className="flex items-center gap-2">
                      <Users size={16} />
                      <span className="truncate">Facility Managers</span>
                    </TabsTrigger>
                    <TabsTrigger value="configurations" className="flex items-center gap-2">
                      <Settings size={16} />
                      <span className="truncate">Configurations</span>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            )}
          </div>

          <TabsContent value="venues" className="p-2 sm:p-4 border rounded-md overflow-x-auto">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-2">
              <div className="w-full md:w-1/3 relative">
                <InputWithIcon
                  placeholder="Search venues..."
                  value={filters.search}
                  onChange={e => handleSearch(e.target.value)}
                  className="w-full pr-10"
                  icon={Search}
                />
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
                  <SelectTrigger className="min-w-[160px]">
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <VenueTable loading={loading}/>
          </TabsContent>

          <TabsContent value="reporting" className="p-2 sm:p-4 border rounded-md overflow-x-auto">
            <div className="min-w-[340px] sm:min-w-0">
              <VenueReporting />
            </div>
          </TabsContent>

          <TabsContent value="holidays" className="p-2 sm:p-4 border rounded-md overflow-x-auto">
            <div className="min-w-[340px] sm:min-w-0">
              <VenueHolidays />
            </div>
          </TabsContent>

          <TabsContent value="facility" className="p-2 sm:p-4 border rounded-md overflow-x-auto">
            <div className="min-w-[340px] sm:min-w-0">
              <VenueFacilityManager />
            </div>
          </TabsContent>

          <TabsContent value="configurations" className="p-2 sm:p-4 border rounded-md overflow-x-auto">
            <div className="min-w-[340px] sm:min-w-0">
              <VenueConfigurations />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AddVenueDialog
        open={isAddVenueOpen}
        onOpenChange={setIsAddVenueOpen}
        onSave={handleAddVenue}
        onSaveSpot={handleAddSpot}
      />
    </div>
  );
};

export default VenueManagement;
