import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useLoadScript, GoogleMap } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Search, X } from 'lucide-react';

const libraries: ("places")[] = ["places"];

// Responsive map container style
const getMapContainerStyle = () => ({
  width: "100%",
  height: window.innerWidth < 768 ? "300px" : "400px",
});

const defaultCenter = {
  lat: 25.276987, // Dubai center (fallback)
  lng: 55.296249,
};

interface MapLocationSelectorProps {
  apiKey: string;
  initialCoordinates?: { lat: number; lng: number };
  initialAddress?: string;
  onLocationSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
  onClose: () => void;
}

interface Prediction {
  description: string;
  place_id: string;
}

const MapLocationSelector: React.FC<MapLocationSelectorProps> = ({
  apiKey,
  initialCoordinates,
  initialAddress,
  onLocationSelect,
  onClose,
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  // Helper function to validate coordinates
  const isValidCoordinates = (coordinates: any): coordinates is { lat: number; lng: number } => {
    return coordinates && 
           typeof coordinates.lat === 'number' && 
           typeof coordinates.lng === 'number' && 
           !isNaN(coordinates.lat) && 
           !isNaN(coordinates.lng) &&
           isFinite(coordinates.lat) &&
           isFinite(coordinates.lng) &&
           coordinates.lat >= -90 && coordinates.lat <= 90 &&
           coordinates.lng >= -180 && coordinates.lng <= 180;
  };

  // Initialize state with proper validation
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(() => {
    if (initialCoordinates && isValidCoordinates(initialCoordinates)) {
      return initialCoordinates;
    }
    return null;
  });

  const [currentAddress, setCurrentAddress] = useState(initialAddress || "");
  const [searchValue, setSearchValue] = useState(initialAddress || "");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [mapContainerStyle, setMapContainerStyle] = useState(getMapContainerStyle());
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Handle responsive map height
  useEffect(() => {
    const handleResize = () => {
      setMapContainerStyle(getMapContainerStyle());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const geocodeCoordinates = useCallback((latLng: google.maps.LatLngLiteral) => {
    if (!window.google || !window.google.maps) return;
    
    setIsLoading(true);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results, status) => {
      setIsLoading(false);
      if (status === "OK" && results?.[0]) {
        const address = results[0].formatted_address;
        setCurrentAddress(address);
        setSearchValue(address);
      } else {
        setCurrentAddress("Address not found");
        console.error("Geocoder failed due to: " + status);
      }
    });
  }, []);

  // Helper function to safely pan map to coordinates
  const safePanTo = useCallback((coordinates: { lat: number; lng: number }) => {
    if (mapRef.current && isValidCoordinates(coordinates)) {
      try {
        mapRef.current.panTo(coordinates);
        mapRef.current.setZoom(16);
      } catch (error) {
        console.error("Error panning to coordinates:", error);
      }
    }
  }, []);

  // Helper function to update marker
  const updateMarker = useCallback((coordinates: { lat: number; lng: number } | null) => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }

    if (coordinates && isValidCoordinates(coordinates) && mapRef.current) {
      try {
        const marker = new window.google.maps.Marker({
          map: mapRef.current,
          position: coordinates,
          draggable: true,
        });
        markerRef.current = marker;
        
        // Add drag end listener
        marker.addListener('dragend', () => {
          const position = marker.getPosition();
          if (position) {
            const lat = position.lat();
            const lng = position.lng();
            const newCoordinates = { lat, lng };
            if (isValidCoordinates(newCoordinates)) {
              setSelectedCoordinates(newCoordinates);
              geocodeCoordinates(newCoordinates);
            }
          }
        });
      } catch (error) {
        console.error("Error creating marker:", error);
      }
    }
  }, [geocodeCoordinates]);

  // Whenever initialCoordinates changes and map is loaded, update marker and map center
  useEffect(() => {
    if (mapLoaded && initialCoordinates && isValidCoordinates(initialCoordinates)) {
      setSelectedCoordinates(initialCoordinates);
      geocodeCoordinates(initialCoordinates);
      if (mapRef.current) {
        mapRef.current.panTo(initialCoordinates);
        mapRef.current.setZoom(16);
      }
      updateMarker(initialCoordinates);
    } else if (mapLoaded && (!initialCoordinates || !isValidCoordinates(initialCoordinates))) {
      setSelectedCoordinates(null);
      setCurrentAddress("");
      updateMarker(null);
    }
  }, [mapLoaded, initialCoordinates, geocodeCoordinates, updateMarker]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapLoaded(true);
    placesServiceRef.current = new window.google.maps.places.PlacesService(map);
    sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
  }, []);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      const coordinates = { lat, lng };
      if (isValidCoordinates(coordinates)) {
        setSelectedCoordinates(coordinates);
        geocodeCoordinates(coordinates);
        updateMarker(coordinates);
      }
    }
  }, [geocodeCoordinates, updateMarker]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    if (!value.trim() || !window.google) {
      setPredictions([]);
      return;
    }

    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions({
      input: value,
      sessionToken: sessionTokenRef.current,
    }, (predictions = [], status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        setPredictions(predictions);
      } else {
        setPredictions([]);
      }
    });
  }, []);

  const handlePredictionSelect = useCallback((prediction: Prediction) => {
    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails({
      placeId: prediction.place_id,
      fields: ['geometry', 'formatted_address'],
      sessionToken: sessionTokenRef.current,
    }, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const coordinates = { lat, lng };
        
        if (isValidCoordinates(coordinates)) {
          setSelectedCoordinates(coordinates);
          const address = place.formatted_address || prediction.description;
          setCurrentAddress(address);
          setSearchValue(address);
          safePanTo(coordinates);
          updateMarker(coordinates);
        }
      }
    });

    // Reset predictions and create new session token
    setPredictions([]);
    sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
  }, [safePanTo, updateMarker]);

  const handleConfirmSelection = () => {
    if (currentAddress && selectedCoordinates && isValidCoordinates(selectedCoordinates)) {
      onLocationSelect(currentAddress, selectedCoordinates);
    }
  };

  const handleClearSearch = () => {
    setSearchValue("");
    setCurrentAddress("");
    setSelectedCoordinates(null);
    updateMarker(null);
    setPredictions([]);
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    // Delay to allow clicking on predictions
    setTimeout(() => {
      setIsSearchFocused(false);
    }, 200);
  };

  // Helper function to safely format coordinates
  const formatCoordinates = (coordinates: { lat: number; lng: number } | null): string => {
    if (!isValidCoordinates(coordinates)) {
      return '';
    }
    return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
  };

  // Determine map center and zoom based on initial state
  const getMapCenter = () => {
    if (selectedCoordinates && isValidCoordinates(selectedCoordinates)) {
      return selectedCoordinates;
    }
    if (initialCoordinates && isValidCoordinates(initialCoordinates)) {
      return initialCoordinates;
    }
    return defaultCenter;
  };

  const getMapZoom = () => {
    if (selectedCoordinates && isValidCoordinates(selectedCoordinates)) {
      return 16;
    }
    if (initialCoordinates && isValidCoordinates(initialCoordinates)) {
      return 16;
    }
    return 12;
  };

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 min-h-[400px]">
        <div className="text-red-600 text-center">
          <MapPin className="h-12 w-12 mx-auto mb-2 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Maps</h3>
          <p className="text-sm text-gray-600">Please check your API key and network connection.</p>
        </div>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-gray-600">Loading Maps...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search Section with proper z-index */}
      <div className={`relative bg-white border-b border-gray-200 p-4 ${isSearchFocused ? 'z-[9999]' : 'z-50'}`}>
        <Label htmlFor="map-search-address" className="text-sm font-medium text-gray-700 mb-2 block">
          Search for a location or address
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <div className="relative">
            <Input
              ref={searchInputRef}
              id="map-search-address"
              type="text"
              placeholder="Type address or place name..."
              value={searchValue}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className="pl-10 pr-10 h-11 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            {searchValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {/* Custom Predictions Dropdown */}
            {predictions.length > 0 && isSearchFocused && (
              <div
                className="absolute left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto z-[9999]"
                style={{ pointerEvents: 'auto' }}
              >
                {predictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent blur
                      handlePredictionSelect(prediction);
                    }}
                  >
                    <span className="block text-sm text-gray-900">{prediction.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="flex-1 relative map-location-selector__map-block">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={getMapCenter()}
          zoom={getMapZoom()}
          onLoad={onMapLoad}
          onClick={onMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            zoomControl: true,
            gestureHandling: 'greedy',
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          }}
        />
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <span className="text-sm text-gray-600">Getting address...</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Display */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 mb-1">Selected Location</p>
              <p className="text-sm text-blue-800 break-words">
                {currentAddress || "Click on map or search to select a location"}
              </p>
              {selectedCoordinates && isValidCoordinates(selectedCoordinates) && (
                <p className="text-xs text-blue-600 mt-1">
                  Coordinates: {formatCoordinates(selectedCoordinates)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSelection}
            disabled={!currentAddress || currentAddress === "Address not found" || !selectedCoordinates || !isValidCoordinates(selectedCoordinates)}
            className="flex-1 sm:flex-none"
          >
            Confirm Location
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapLocationSelector;