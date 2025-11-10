import React from 'react';
import { format, parseISO, isAfter } from 'date-fns';
import { Edit, AlertTriangle, MapPin, Images, Info } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Session } from '@/types/session';
import { batch } from 'react-redux';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SessionTableProps {
  sessions: Session[];
  onRescheduleClick: (session: Session) => void;
  loading?: boolean;
  batch?: {
    program?: {id: number; name: string};
    venue?: {
      venue_id: number;
      venue_name: string;
      venue_image?: string;
    };
    spot?: {
      venue_spot_id: number;
      spot_name: string;
      spot_image?: string;
    };
    status?: string;
  };
}

const defaultVenueImage = "https://images.unsplash.com/photo-1487958449943-2429e8be8625";

const SessionTable: React.FC<SessionTableProps> = ({ 
  sessions, 
  onRescheduleClick,
  loading = false,
  batch
}) => {
  const canReschedule = (sessionDate: string, status: string) => {
    // Don't allow rescheduling of completed or cancelled sessions
    if (status === 'completed' || status === 'cancelled' || status === 'inactive') {
      return false;
    }
    
    // Always allow reschedule for testing purposes
    return true;
  };

  const getSessionNumber = (index: number): number => {
    return index + 1;
  };

  const getDayOfWeek = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'EEEE');
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <p>Loading sessions...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {batch && (
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <h3 className="font-medium text-lg mb-2">Session Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Program</p>
                <p className="font-medium">{batch.program?.name || 'Not assigned'}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-500">Venue</p>
                </div>
                <div className="flex items-center gap-2">
                  {batch.venue?.venue_image ? (
                    <div className="h-12 w-12 rounded-md overflow-hidden">
                      <img 
                        src={batch.venue.venue_image} 
                        alt={batch.venue.venue_name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = defaultVenueImage;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <p className="font-medium">{batch.venue?.venue_name || 'Not assigned'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Images className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-500">Spot</p>
                </div>
                <div className="flex items-center gap-2">
                  {batch.spot?.spot_image ? (
                    <div className="h-12 w-12 rounded-md overflow-hidden">
                      <img 
                        src={batch.spot.spot_image} 
                        alt={batch.spot.spot_name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = defaultVenueImage;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center">
                      <Images className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <p className="font-medium">{batch.spot?.spot_name || 'Not assigned'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Spot</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                  No sessions found for this batch
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session, index) => (
                <TableRow key={session.id}>
                  <TableCell>Session {getSessionNumber(index)}</TableCell>
                  <TableCell>{format(parseISO(session.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{getDayOfWeek(session.date)}</TableCell>
                  <TableCell>{session.start_time} - {session.end_time}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {session.venue?.venue_image ? (
                        <div className="h-8 w-8 rounded-md overflow-hidden">
                          <img 
                            src={session.venue.venue_image} 
                            alt={session.venue.venue_name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = defaultVenueImage;
                            }}
                          />
                        </div>
                      ) : (
                        <MapPin className="h-4 w-4 text-gray-500" />
                      )}
                      <span>{session.venue?.venue_name || batch?.venue?.venue_name || 'Not assigned'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {session.spot?.spot_image ? (
                        <div className="h-8 w-8 rounded-md overflow-hidden">
                          <img 
                            src={session.spot.spot_image} 
                            alt={session.spot.spot_name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = defaultVenueImage;
                            }}
                          />
                        </div>
                      ) : (
                        <Images className="h-4 w-4 text-gray-500" />
                      )}
                      <span>{session.spot?.spot_name || batch?.spot?.spot_name || 'Not assigned'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        session.status === 'rescheduled' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                      {session.status === 'rescheduled' && session.notes && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-yellow-600" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Reschedule reason: {session.notes}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {canReschedule(session.date, session.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRescheduleClick(session)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Reschedule
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
};

export default SessionTable;
