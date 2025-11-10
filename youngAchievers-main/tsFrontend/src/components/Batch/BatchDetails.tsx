import React from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, Users, MapPin, Images, Home } from 'lucide-react';
import { Batch } from '@/store/batch/batchSlice'; // Use your Batch interface
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";

interface BatchDetailsProps {
  batch: {
    name: string;
    type: string;
    partners?: { name: string }[];
    venue: {
      venue_id: number;
      venue_name: string;
      venue_image?: string;
    };
    spot: {
      venue_spot_id: number;
      spot_name: string;
      spot_image?: string;
    };
    startDate?: string;
    endDate?: string;
    sessionStartTime?: string;
    sessionEndTime?: string;
  };
}

const BatchDetails: React.FC<BatchDetailsProps> = ({ batch }) => {
  // Helper functions
  const renderPartners = () => {
    if (batch.partners && Array.isArray(batch.partners) && batch.partners.length > 0) {
      return batch.partners.map(partner => partner.name).join(', ');
    }
    return 'Not assigned';
  };

  const getVenueName = () => {
    return batch.venue?.venue_name || 'Not specified';
  };

  const getSpotName = () => {
    return batch.spot?.spot_name || 'Not specified';
  };

  // Default image for venues and spots without images
  const defaultVenueImage = "https://images.unsplash.com/photo-1487958449943-2429e8be8625";

  const getVenueImage = () => {
    return batch.venue?.venue_image || defaultVenueImage;
  };

  const getSpotImages = () => {
    return batch.spot?.spot_image ? [batch.spot.spot_image] : [defaultVenueImage];
  };

  const venueImage = getVenueImage();
  const spotImages = getSpotImages();
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{batch.name} - {batch.type}</h2>
      <div className="flex items-start gap-2 text-gray-600">
        <Users className="h-4 w-4 text-gray-500 mt-0.5" />
        <div>
          <span className="font-medium">Partners:</span> {renderPartners()}
        </div>
      </div>
      
      {/* Venue type badge - Adapt this based on your data */}
      {/* {batch.venueType === 'custom' && (
        <div className="mb-2">
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100">
            <Home className="h-3 w-3 mr-1" /> Custom Venue
          </Badge>
        </div>
      )} */}
      
      {/* Custom venue note - Adapt this based on your data */}
      {/* {batch.customVenueNote && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm mb-4">
          <p className="font-medium">Note:</p>
          <p>{batch.customVenueNote}</p>
        </div>
      )} */}
      
      {/* Venue and spot visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Venue image */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <h3 className="font-medium">Venue: {getVenueName()}</h3>
          </div>
          <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
            <img 
              src={venueImage} 
              alt={getVenueName()} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = defaultVenueImage;
              }}
            />
          </div>
        </div>
        
        {/* Spot images */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Images className="h-4 w-4 text-gray-500" />
            <h3 className="font-medium">Spot: {getSpotName()}</h3>
          </div>
          {spotImages.length > 1 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {spotImages.map((image, index) => (
                  <CarouselItem key={index} className="basis-full">
                    <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                      <img 
                        src={image} 
                        alt={`${getSpotName()} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = defaultVenueImage;
                        }}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
              <img 
                src={spotImages[0]} 
                alt={getSpotName()} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = defaultVenueImage;
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">
              {batch.startDate ? format(parseISO(batch.startDate), 'MMM d, yyyy') : 'Start date not set'}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">
              {batch.sessionStartTime && batch.sessionEndTime 
                ? `${batch.sessionStartTime} - ${batch.sessionEndTime}`
                : 'Session time not set'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchDetails;
