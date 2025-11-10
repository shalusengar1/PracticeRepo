import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash, Edit, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks/hooks";
import {
  fetchPrograms,
  addProgram,
  updateProgram,
  deleteProgram,
  Program as ProgramType, // Renamed to avoid conflict
} from "@/store/program/programSlice";
import AmenitiesComponent from "@/components/AmenitiesComponent";
import ProgramManagementTable from '@/components/ProgramManagementTable';

interface Program {
  id: string;
  name: string;
  description: string;
}

// Amenity interfaces
interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: "basic" | "comfort" | "additional" | "venue-specific";
  enabled: boolean;
}

interface VenueAmenity extends Amenity {
  venueId: string;
}

// Initial data for amenities
const initialAmenities: Amenity[] = [
  {
    id: "1",
    name: "Changing Rooms",
    icon: "🚪",
    category: "basic",
    enabled: true,
  },
  {
    id: "2",
    name: "Locker Facility",
    icon: "🗄️",
    category: "basic",
    enabled: true,
  },
  {
    id: "3",
    name: "Water Dispensers",
    icon: "🚰",
    category: "basic",
    enabled: true,
  },
  {
    id: "4",
    name: "Washrooms",
    icon: "🚽",
    category: "comfort",
    enabled: true,
  },
  {
    id: "5",
    name: "Shower Facility",
    icon: "🚿",
    category: "comfort",
    enabled: false,
  },
  {
    id: "6",
    name: "Cafeteria",
    icon: "🍴",
    category: "comfort",
    enabled: false,
  },
  {
    id: "7",
    name: "Parking",
    icon: "🅿️",
    category: "additional",
    enabled: false,
  },
  {
    id: "8",
    name: "Wi-Fi",
    icon: "📶",
    category: "additional",
    enabled: false,
  },
  {
    id: "9",
    name: "First Aid",
    icon: "🩹",
    category: "additional",
    enabled: false,
  },
  {
    id: "10",
    name: "Projector",
    icon: "📽️",
    category: "venue-specific",
    enabled: false,
  },
  {
    id: "11",
    name: "Air Conditioning",
    icon: "❄️",
    category: "venue-specific",
    enabled: false,
  },
  {
    id: "12",
    name: "Sound System",
    icon: "🔊",
    category: "venue-specific",
    enabled: false,
  },
];

const venues = [
  { id: "venue1", name: "Main Sports Hall" },
  { id: "venue2", name: "Tennis Courts" },
  { id: "venue3", name: "Swimming Pool" },
];

const categoryOptions = [
  { value: "basic", label: "Basic Amenities" },
  { value: "comfort", label: "Comfort Amenities" },
  { value: "additional", label: "Additional Amenities" },
  { value: "venue-specific", label: "Venue-Specific Amenities" },
];

const iconOptions = [
  "🚪",
  "🗄️",
  "🚰",
  "🚽",
  "🚿",
  "🍴",
  "🅿️",
  "📶",
  "🩹",
  "📽️",
  "❄️",
  "🔊",
  "🏋️",
  "🏊",
  "🎾",
  "🏀",
  "⚽",
  "🎯",
  "♿",
  "🧹",
  "🔌",
  "📡",
  "💡",
  "🚭",
];

// Load programs from localStorage
const getStoredPrograms = (): Program[] => {
  const storedPrograms = localStorage.getItem("sportsProgramsList");
  if (storedPrograms) {
    return JSON.parse(storedPrograms);
  }
  return [
    {
      id: "prog1",
      name: "Swimming Lessons",
      description: "Learn swimming techniques for all levels",
    },
    {
      id: "prog2",
      name: "Tennis Training",
      description: "Professional tennis coaching for beginners to advanced",
    },
    {
      id: "prog3",
      name: "Basketball Camp",
      description: "Intensive basketball training program",
    },
    {
      id: "prog4",
      name: "Yoga Classes",
      description: "Relaxing yoga sessions for all ages",
    },
    {
      id: "prog5",
      name: "Soccer Academy",
      description: "Soccer training for young athletes",
    },
  ];
};

const ProgramSettings: React.FC = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { programs, loading, error } = useAppSelector(
    (state) => state.programs
  );
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  // Get active tab from URL path
  const getActiveTab = () => {
    if (location.pathname.includes("/settings/programs")) {
      return "programs";
    } else if (location.pathname.includes("/settings/amenities")) {
      return "amenities";
    }
    return "general";
  };

  // Programs state
  const [newProgram, setNewProgram] = useState<Omit<ProgramType, "id">>({
    name: "",
    description: "",
  });
  const [editingProgramId, setEditingProgramId] = useState<number | null>(null);
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<ProgramType | null>(null);

  // Amenities state
  const [amenities, setAmenities] = useState<Amenity[]>(initialAmenities);
  const [venueAmenities, setVenueAmenities] = useState<VenueAmenity[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAmenity, setNewAmenity] = useState<Omit<Amenity, "id" | "enabled">>(
    {
      name: "",
      icon: "🆕",
      category: "additional",
    }
  );

  // Save programs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("sportsProgramsList", JSON.stringify(programs));
    const storageEvent = new Event("storage");
    window.dispatchEvent(storageEvent);
  }, [programs]);

  // Initialize venue amenities when venue is selected
  useEffect(() => {
    if (selectedVenue) {
      const existingVenueAmenities = venueAmenities.filter(
        (a) => a.venueId === selectedVenue
      );

      if (existingVenueAmenities.length === 0) {
        const defaultVenueAmenities = amenities
          .filter((a) => a.category === "venue-specific")
          .map((a) => ({
            ...a,
            venueId: selectedVenue,
            enabled: false,
          }));

        setVenueAmenities((prev) => [...prev, ...defaultVenueAmenities]);
      }
    }
  }, [selectedVenue]);

  const handleSaveGeneralSettings = () => {
    toast({
      title: "Settings Saved",
      description: "General settings have been successfully saved.",
    });
  };

  // Program management functions
  const handleAddProgram = async () => {
    if (!newProgram.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Program name is required.",
        variant: "destructive"
      });
      return;
    }
    
    if (editingProgramId) {
      try {
        await dispatch(updateProgram({ ...newProgram, id: editingProgramId })).unwrap();
        toast({
          title: "Program Updated",
          description: `${newProgram.name} has been updated.`
        });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to update program.",
          variant: "destructive",
        });
      }
    } else {
      try {
        await dispatch(addProgram(newProgram)).unwrap();
        toast({
          title: "Program Added",
          description: `${newProgram.name} has been added to programs.`
        });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to add program.",
          variant: "destructive",
        });
      }
    }
    
    setNewProgram({ name: '', description: '' });
    setEditingProgramId(null);
    setIsProgramDialogOpen(false);
  };

  const handleEditProgram = (program: ProgramType) => {
    setNewProgram({ 
      name: program.name, 
      description: program.description
    });
    setEditingProgramId(program.id);
    setIsProgramDialogOpen(true);
  };
  
  const handleDeleteProgram = async (id: number) => {
    try {
      await dispatch(deleteProgram(id)).unwrap();
      toast({
        title: "Program Deleted",
        description: "The program has been removed."
      });
      setIsDeleteDialogOpen(false);
      setProgramToDelete(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete program.",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = () => {
    if (programToDelete) {
      handleDeleteProgram(programToDelete.id);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setProgramToDelete(null);
  };

  // Amenity functions
  const toggleAmenity = (id: string) => {
    if (selectedVenue && id.includes("venue-specific")) {
      setVenueAmenities(
        venueAmenities.map((amenity) =>
          amenity.id === id && amenity.venueId === selectedVenue
            ? { ...amenity, enabled: !amenity.enabled }
            : amenity
        )
      );
    } else {
      setAmenities(
        amenities.map((amenity) =>
          amenity.id === id
            ? { ...amenity, enabled: !amenity.enabled }
            : amenity
        )
      );
    }
  };

  const saveAmenitySettings = () => {
    toast({
      title: "Settings Saved",
      description: "Amenities settings have been successfully saved.",
    });
  };

  const addAmenity = () => {
    if (!newAmenity.name.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please provide a name for the amenity.",
        variant: "destructive",
      });
      return;
    }

    const newId = `${Date.now()}`;
    const amenityToAdd: Amenity = {
      id: newId,
      name: newAmenity.name,
      icon: newAmenity.icon,
      category: newAmenity.category,
      enabled: false,
    };

    setAmenities([...amenities, amenityToAdd]);

    setNewAmenity({
      name: "",
      icon: "🆕",
      category: "additional",
    });
    setIsAddDialogOpen(false);

    toast({
      title: "Amenity Added",
      description: `${amenityToAdd.name} has been added to the list.`,
    });
  };

  const AmenityCheckbox = ({
    amenity,
    venueSpecific = false,
  }: {
    amenity: Amenity | VenueAmenity;
    venueSpecific?: boolean;
  }) => {
    const isEnabled = venueSpecific
      ? (amenity as VenueAmenity).enabled
      : amenity.enabled;

    return (
      <div className="flex items-center gap-3 py-2">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center cursor-pointer ${
            isEnabled
              ? "bg-blue-500 text-white"
              : "border border-gray-300 bg-white"
          }`}
          onClick={() => toggleAmenity(amenity.id)}
        >
          {isEnabled && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <span className="mr-2">{amenity.icon}</span>
        <span>{amenity.name}</span>
      </div>
    );
  };

  const handleTabChange = (value: string) => {
    switch (value) {
      case "programs":
        navigate("/settings/programs");
        break;
      case "amenities":
        navigate("/settings/amenities");
        break;
      default:
        navigate("/settings/general");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>
      <p className="text-muted-foreground">
        Manage your application settings and preferences
      </p>

      <Tabs defaultValue={getActiveTab()} value={getActiveTab()} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="programs">Program Management</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger id="timezone" className="w-full">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">
                          India (GMT+5:30)
                        </SelectItem>
                        <SelectItem value="America/New_York">
                          Eastern Time (GMT-5)
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          Pacific Time (GMT-8)
                        </SelectItem>
                        <SelectItem value="Europe/London">
                          UK (GMT+0)
                        </SelectItem>
                        <SelectItem value="Asia/Tokyo">
                          Japan (GMT+9)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      Current time:{" "}
                      {new Date().toLocaleTimeString("en-US", {
                        timeZone: timezone,
                      })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select defaultValue="MM/DD/YYYY">
                      <SelectTrigger id="dateFormat" className="w-full">
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">System Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger id="language" className="w-full">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select defaultValue="inr">
                      <SelectTrigger id="currency" className="w-full">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inr">Indian Rupee (₹)</SelectItem>
                        <SelectItem value="usd">US Dollar ($)</SelectItem>
                        <SelectItem value="eur">Euro (€)</SelectItem>
                        <SelectItem value="gbp">British Pound (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSaveGeneralSettings} className="mt-4">
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Programs Tab */}
        <TabsContent value="programs">
          <Card>
            <CardHeader>
              <CardTitle>Program Management</CardTitle>
              <CardDescription>Add, edit or remove programs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProgramManagementTable />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Amenities Tab */}
        <TabsContent value="amenities">
          <AmenitiesComponent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgramSettings;
