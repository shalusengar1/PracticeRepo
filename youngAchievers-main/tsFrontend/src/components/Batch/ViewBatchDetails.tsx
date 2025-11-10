import React from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, User, Images, Home, GraduationCap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
// import { Badge } from '@/components/ui/badge'; // Badge is not used in the provided snippet, uncomment if needed
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Batch } from '@/store/batch/batchSlice'; // Import your Batch interface

interface ViewBatchDetailsProps {
  batch: Batch; // Use your Batch interface here
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const ViewBatchDetails: React.FC<ViewBatchDetailsProps> = ({
  batch,
  isOpen,
  onClose,
  onEdit
}) => {
  if (!batch) return null;

  interface PartnerDetail {
    id?: string | number;
    name: string;
  }

  const renderPartners = () => {
    if (batch.partners && Array.isArray(batch.partners) && batch.partners.length > 0) {
      return (batch.partners as PartnerDetail[]).map(partner => partner.name).join(', ');
    }
    return 'Not assigned';
  };

  const getVenueName = () => {
    // Safely access venue_name
    return batch.venue?.venue_name || 'Not specified';
  };

  const getSpotName = () => {
    // Safely access spot_name
    return batch.spot?.spot_name || 'Not specified';
  };

  const defaultVenueImage = "https://images.unsplash.com/photo-1487958449943-2429e8be8625"; // A generic building
  const defaultSpotImage = "https://images.unsplash.com/photo-1487958449943-2429e8be8625"; // A generic sports/activity area

  const getVenueImage = () => {
    return batch.venue?.venue_image || defaultVenueImage;
  };

  const getSpotImages = () => {
    // Assuming spot_image is a single URL string. If it can be an array, adjust accordingly.
    if (batch.spot?.spot_image) {
      return [batch.spot.spot_image];
    }
    return [defaultSpotImage];
  };


  const venueImage = getVenueImage();
  const spotImages = getSpotImages();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Batch Details</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">{batch.name}</h2>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                {batch.type.charAt(0).toUpperCase() + batch.type.slice(1)}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                batch.status.charAt(0).toUpperCase() + batch.status.slice(1) === 'Active' ? 'bg-green-100 text-green-800' :
                batch.status.charAt(0).toUpperCase() + batch.status.slice(1) === 'Completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
              </span>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <h3 className="font-medium">Venue</h3>
              </div>
              <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                <img
                  src={venueImage}
                  alt={getVenueName()}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = defaultVenueImage; // Fallback if the provided image URL fails
                  }}
                />
              </div>
              <p className="text-sm text-gray-600">{getVenueName()}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Images className="h-4 w-4 text-gray-500" />
                <h3 className="font-medium">Spot</h3>
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
                              target.src = defaultSpotImage; // Fallback for spot images
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
                      target.src = defaultSpotImage; // Fallback for single spot image
                    }}
                  />
                </div>
              )}
              <p className="text-sm text-gray-600">{getSpotName()}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4 text-gray-500" />
                <span>Partner: {renderPartners()}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>Venue: {getVenueName()}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Start Date: {batch.startDate ? format(parseISO(batch.startDate), 'MMM d, yyyy') : 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>Session Time: {batch.sessionStartTime || 'N/A'} - {batch.sessionEndTime || 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <GraduationCap className="h-4 w-4 text-gray-500" />
                <span>Program: {batch.program?.name || 'Not specified'}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>End Date: {batch.endDate ? format(parseISO(batch.endDate), 'MMM d, yyyy') : 'N/A'}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={onEdit}>Edit Batch</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewBatchDetails;
