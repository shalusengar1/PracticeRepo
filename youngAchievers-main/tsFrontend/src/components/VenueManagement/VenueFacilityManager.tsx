import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from "@/components/ui/hover-card";
import { Edit, Trash, Phone, Mail, Info } from 'lucide-react';
import { useAppSelector } from '@/hooks/reduxHooks/hooks';
import { Venue } from '../../pages/VenueManagement'; // Import Venue type

interface Manager {
  id: number;
  name: string;
  phone: string;
  email: string;
  venue: string;
}

const VenueFacilityManager: React.FC = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const { venues } = useAppSelector((state) => state.venues);

  useEffect(() => {
    // Extract venue admins from venues and transform them into the Manager interface
    const facilityManagers: Manager[] = venues.reduce((acc: Manager[], venue: Venue) => {
      if (venue.venue_admins && venue.venue_admins.length > 0) {
        const venueManagers = venue.venue_admins.map(admin => ({
          id: admin.id,
          name: `${admin.first_name} ${admin.last_name || ''}`, // Combine first and last name
          phone: admin.phone || "", // Use empty string if phone is not available
          email: admin.email,
          venue: venue.venue_name,
        }));
        return [...acc, ...venueManagers];
      }
      return acc;
    }, []);
    setManagers(facilityManagers);
  }, [venues]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Facility Managers</h3>
        <p className="text-sm text-gray-500">
          Single point of contact for all venue communications
        </p>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Venue</TableHead>
              {/* <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {managers.map((manager) => (
              <TableRow key={manager.id}>
                <TableCell className="font-medium">{manager.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    {manager.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-2 text-gray-500" />
                        {manager.phone}
                      </div>
                    )}
                    <div className="flex items-center text-sm mt-1">
                      <Mail className="h-3 w-3 mr-2 text-gray-500" />
                      {manager.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{manager.venue}</TableCell>
                {/* <TableCell>
                  <div className="flex items-center">
                    {manager.role}
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <button className="ml-1 focus:outline-none">
                          <Info className="h-3 w-3 text-gray-500" />
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">{manager.role} Responsibilities</h4>
                          <p className="text-sm">
                            Venue Admin: Manage venue-specific operations, including scheduling, maintenance, and communication with clients.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </TableCell> */}
                {/* <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      className="p-1 hover:bg-gray-100 rounded-md disabled"
                      disabled
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="p-1 hover:bg-red-100 rounded-md disabled"
                      disabled
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default VenueFacilityManager;
