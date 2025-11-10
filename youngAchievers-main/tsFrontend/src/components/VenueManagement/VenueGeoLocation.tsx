
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search } from 'lucide-react';

const VenueGeoLocation: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">GeoLocation on Maps</h3>
        <p className="text-sm text-gray-500">
          Configure the venues on Maps for smooth navigation across venues
        </p>
      </div>
      
      <div className="flex space-x-4 mb-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Venue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Venues</SelectItem>
            <SelectItem value="central">Central Hall</SelectItem>
            <SelectItem value="west">West Wing Conference Center</SelectItem>
            <SelectItem value="downtown">Downtown Office</SelectItem>
            <SelectItem value="harbor">Harbor View</SelectItem>
            <SelectItem value="mountain">Mountain Retreat</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input type="text" placeholder="Search address or location" />
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 bg-gray-100 border rounded-lg h-[400px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <MapPin className="h-16 w-16 mx-auto text-gray-400" />
          <div className="text-lg font-medium">Map View</div>
          <p className="text-gray-500 max-w-md mx-auto">
            This area would display an interactive map showing the locations of venues. 
            To implement a real map, integration with a mapping service like Google Maps 
            or Mapbox would be required.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Central Hall</CardTitle>
            <CardDescription>123 Main St, City</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-red-500 mt-1" />
              <div className="text-sm">
                <p>Latitude: 40.7128° N</p>
                <p>Longitude: 74.0060° W</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full">Update Location</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">West Wing Conference Center</CardTitle>
            <CardDescription>456 Oak Ave, Town</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-red-500 mt-1" />
              <div className="text-sm">
                <p>Latitude: 34.0522° N</p>
                <p>Longitude: 118.2437° W</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full">Update Location</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Downtown Office</CardTitle>
            <CardDescription>789 Market St, Metro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-red-500 mt-1" />
              <div className="text-sm">
                <p>Latitude: 37.7749° N</p>
                <p>Longitude: 122.4194° W</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full">Update Location</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default VenueGeoLocation;
