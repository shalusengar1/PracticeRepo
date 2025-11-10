import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import { format, parseISO, isSameDay } from "date-fns";
import { CalendarIcon, X, Info, ChevronDown, Users, Check, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks/hooks";
import {
  fetchVenueSpots,
  Batch,
  DropdownItem,
  clearVenueSpots,
} from "@/store/batch/batchSlice";
import { fetchPrograms } from "@/store/program/programSlice";
import { fetchVenues } from "@/store/venue/venueSlice";
import { fetchPartners } from "@/store/partner/partnerSlice";

type BatchType = "fixed" | "recurring";
type SchedulePattern = "MWF" | "TTS" | "weekend" | "manual";
type Currency = "INR" | "USD";
type BatchStatus = "active" | "completed" | "inactive";

interface BatchFormData extends Omit<Batch, 'id'> {
  id?: string;
  selectedSessionDates: string[];
}

interface BatchFormValues {
  name: string;
  programId: number;
  type: BatchType;
  venueId: number;
  venueSpotId?: number;
  capacity: number;
  partnerIds: number[];
  description?: string;
  startDate: string;
  endDate: string;
  sessionStartTime: string;
  sessionEndTime: string;
  noOfSessions: number;
  schedulePattern: SchedulePattern;
  amount: number;
  currency: Currency;
  discountAvailable: boolean;
  discountPercentage: number;
  status: BatchStatus;
  progress: number;
  selectedSessionDates: string[];
}

// Schema definition
const formSchema = z.object({
  name: z.string().min(1, "Batch name is required").max(40, "Batch name cannot exceed 40 characters"),
  programId: z.number({
    required_error: "Program is required",
  }),
  type: z.enum(["fixed", "recurring"]),
  venueId: z.number().optional(),
  venueSpotId: z.number().optional(),
  capacity: z.number().optional(),
  partnerIds: z.array(z.number()),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sessionStartTime: z.string().optional(),
  sessionEndTime: z.string().optional(),
  noOfSessions: z.number().optional(),
  schedulePattern: z.enum(["MWF", "TTS", "weekend", "manual"]),
  amount: z.number().min(0, "Amount must be non-negative").max(9999999, "Amount cannot exceed 7 digits"),
  currency: z.enum(["INR", "USD"]),
  discountAvailable: z.boolean(),
  discountPercentage: z.number().min(0).max(100),
  status: z.enum(["active", "completed", "inactive"]),
  progress: z.number().min(0).max(100),
  selectedSessionDates: z.array(z.string()).optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: "End date cannot be before start date.",
    path: ["endDate"],
  }
);

interface EditBatchFormProps {
  batch: BatchFormData;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BatchFormData) => void;
}

const EditBatchForm: React.FC<EditBatchFormProps> = ({
  batch,
  isOpen,
  onClose,
  onSubmit: onFormSubmit,
}) => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { programs, loading: programsLoading } = useAppSelector((state) => state.programs);
  const { venues, loading: venuesLoading } = useAppSelector((state) => state.venues);
  const { partners, loading: partnersLoading } = useAppSelector((state) => state.partner);
  const {
    venueSpots,
    spotsLoading,
    spotsError,
  } = useAppSelector((state) => state.batch);

  const dataLoading = programsLoading || venuesLoading || partnersLoading;

  // In EditBatchForm.tsx, near the top with other useState hooks:
  const [startDate, setStartDateState] = useState<Date | undefined>();
  const [endDate, setEndDateState] = useState<Date | undefined>();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [targetNumSessions, setTargetNumSessions] = useState<number>(12);
  const [availableSpots, setAvailableSpots] = useState<DropdownItem[]>([]); // Local state for spots of the currently selected venue
  const [extendEndDate, setExtendEndDate] = useState(false);
  
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  const [programSearchTerm, setProgramSearchTerm] = useState("");
  const [isVenueDialogOpen, setIsVenueDialogOpen] = useState(false);
  const [venueSearchTerm, setVenueSearchTerm] = useState("");
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [partnerSearchTerm, setPartnerSearchTerm] = useState("");
  const [tempSelectedPartners, setTempSelectedPartners] = useState<number[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchPrograms({ paginate: false, fields: ['id', 'name', 'description'] }));
      dispatch(fetchVenues({ paginate: false, fields: ['venue_id', 'venue_name', 'address'] }));
      dispatch(fetchPartners({ paginate: false, fields: ['id', 'name', 'specialization'] }));
    }
  }, [isOpen, dispatch]);

  const watchedVenueId = form.watch("venueId");

  useEffect(() => {
    if (batch && isOpen) {
      console.log('Batch:', batch);
      
      const currentPartnerIds = Array.isArray(batch.partners) 
        ? batch.partners.map((p: { id: number }) => p.id) 
        : [];
      const initialStartDate = batch.startDate ? parseISO(batch.startDate) : undefined;
      const initialEndDate = batch.endDate ? parseISO(batch.endDate) : undefined;
      setStartDateState(initialStartDate);
      setEndDateState(initialEndDate);

      // Handle selected dates for manual schedule pattern
      if (batch.schedulePattern === 'manual' && Array.isArray(batch.selectedSessionDates) && batch.selectedSessionDates.length > 0) {
        console.log('Selected session dates:', batch.selectedSessionDates); // Debug log
        const parsedDates = batch.selectedSessionDates.map(dateStr => new Date(dateStr));
        console.log('Parsed dates:', parsedDates); // Debug log
        setSelectedDates(parsedDates);
        setTargetNumSessions(batch.noOfSessions || 0); // Set target based on batch's noOfSessions
      } else {
        setSelectedDates([]);
      }

      form.reset({
        name: batch.name || "",
        programId: batch.programId || 0,
        type: (batch.type as BatchType) || "fixed",
        venueId: batch.venueId || 0,
        venueSpotId: batch.venueSpotId,
        partnerIds: currentPartnerIds,
        capacity: batch.capacity || 0,
        description: batch.description || "",
        startDate: batch.startDate || "",
        endDate: batch.endDate || "",
        sessionStartTime: batch.sessionStartTime || "09:00",
        sessionEndTime: batch.sessionEndTime || "10:00",
        noOfSessions: batch.noOfSessions || 0,
        schedulePattern: (batch.schedulePattern as SchedulePattern) || "MWF",
        amount: batch.amount || 0,
        currency: (batch.currency as Currency) || "INR",
        discountAvailable: batch.discountAvailable || false,
        discountPercentage: batch.discountPercentage || 0,
        status: (batch.status as BatchStatus) || "active",
        progress: batch.progress || 0,
        selectedSessionDates: batch.selectedSessionDates || []
      });      

      if (batch.venueId) {
        dispatch(fetchVenueSpots(batch.venueId));
      } else {
        dispatch(clearVenueSpots());
      }
    } else {
      form.reset();
      dispatch(clearVenueSpots());
      setStartDateState(undefined);
      setEndDateState(undefined);
      setSelectedDates([]);
    }    
  }, [batch, isOpen, form, dispatch]);

  useEffect(() => {
    // Only run if watchedVenueId is a valid number and not the initial load handled by the above effect
    // This check avoids re-fetching if batch.venueId was already set.
    // However, if the user *changes* the venueId dropdown, this should fire.
    if (
      watchedVenueId &&
      typeof watchedVenueId === "number" &&
      watchedVenueId > 0
    ) {
      // Check if this venueId is different from the one potentially loaded from the 'batch' prop initially
      // to avoid redundant fetches if the component re-renders but watchedVenueId hasn't actually changed from user input.
      // A more robust way is to ensure fetchVenueSpots is only called when the *user* changes the venue.
      // For simplicity here, we fetch if watchedVenueId is valid.
      dispatch(fetchVenueSpots(watchedVenueId));
      form.setValue("venueSpotId", undefined, { shouldValidate: true }); // Reset spot selection
    } else if (
      watchedVenueId === undefined ||
      watchedVenueId === null ||
      watchedVenueId <= 0
    ) {
      // If venue is deselected or invalid
      dispatch(clearVenueSpots());
      form.setValue("venueSpotId", undefined, { shouldValidate: true });
    }
  }, [watchedVenueId, dispatch, form]);

  useEffect(() => {
    if (!spotsLoading) {
      setAvailableSpots(venueSpots || []);
    }
  }, [venueSpots, spotsLoading]);

  const onSubmit = (data: BatchFormValues) => {
    console.log(data);
    // ... your submit logic
  };

  const getFormattedSpotName = (spot: DropdownItem) => {
    return spot.name; // Directly use the name
  };

  const sessionSchedule = form.watch("schedulePattern");
  const showManualCalendar = sessionSchedule === "manual";
  const noOfSessionsFromForm = form.watch("noOfSessions"); // Watch the form field for "Number of Sessions"

  useEffect(() => {
    if (sessionSchedule === "manual") {
      // If manual, targetNumSessions is driven by the form input
      setTargetNumSessions(noOfSessionsFromForm || 0); 
    } else {
      setTargetNumSessions(batch?.noOfSessions || 0);
    }
  }, [noOfSessionsFromForm, sessionSchedule, batch?.noOfSessions]);

  const handleDateSelect = (dates: Date[] | undefined) => {
    if (!dates) {
      setSelectedDates([]);
      form.setValue("selectedSessionDates", [], { shouldValidate: true });
      return;
    }

    
    if (
      sessionSchedule === "manual" &&
      dates.length > selectedDates.length && // Check if a date was added
      dates.length > targetNumSessions      // Check if the new count exceeds the limit
    ) {
      toast({
        title: "Session limit reached",
        description: `You can only select up to ${targetNumSessions} sessions.`,
        variant: "destructive"
      });
      return;
    }

    // Sort dates chronologically
    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
    setSelectedDates(sortedDates);
    
    // Update form values
    const formattedDates = sortedDates.map(date => format(date, "yyyy-MM-dd"));
    form.setValue("selectedSessionDates", formattedDates, { shouldValidate: true });
  };

  const removeSelectedDate = (dateToRemove: Date) => {
    const newSelectedDates = selectedDates.filter(
      (date) => !isSameDay(date, dateToRemove)
    );
    setSelectedDates(newSelectedDates);
  };

  const getPartnerNameById = (id: number) => {
    const partnerFromBatch = batch.partners?.find((p) => p.id === id);
    if (partnerFromBatch) {
      return partnerFromBatch.name;
    }
    const partnerFromStore = partners.find((p) => p.id === id);
    if (partnerFromStore) {
      return partnerFromStore.name;
    }
    return `Partner #${id}`;
  };

  const filteredPartners = partners.filter(
    (partner) =>
      partner.name.toLowerCase().includes(partnerSearchTerm.toLowerCase()) ||
      (partner.specialization &&
        partner.specialization
          .toLowerCase()
          .includes(partnerSearchTerm.toLowerCase()))
  );

  const togglePartnerSelection = (partnerId: number) => {
    const newPartnerIds = tempSelectedPartners.includes(partnerId)
      ? tempSelectedPartners.filter((id) => id !== partnerId)
      : [...tempSelectedPartners, partnerId];
    setTempSelectedPartners(newPartnerIds);
  };

  const handleConfirmPartnerSelection = () => {
    form.setValue("partnerIds", tempSelectedPartners, { shouldValidate: true });
    setIsPartnerDialogOpen(false);
  };

  const handleOpenPartnerDialog = () => {
    setTempSelectedPartners(form.getValues("partnerIds") || []);
    setIsPartnerDialogOpen(true);
  };

  const handleClearAllPartners = () => {
    form.setValue("partnerIds", [], { shouldValidate: true });
  };
  
  const handleProgramSelect = (programId: number) => {
    form.setValue("programId", programId, { shouldValidate: true });
    setIsProgramDialogOpen(false);
  };

  const handleVenueSelect = (venueId: number) => {
    form.setValue("venueId", venueId, { shouldValidate: true });
    form.setValue("venueSpotId", undefined, { shouldValidate: true }); // Reset spot
    if (venueId) {
        dispatch(fetchVenueSpots(venueId));
    } else {
        dispatch(clearVenueSpots());
    }
    setIsVenueDialogOpen(false);
  };

  const processSubmit = (values: z.infer<typeof formSchema>) => {
    // Add capacity validation
    const MAX_CAPACITY = 2147483647; // Maximum value for INT in MySQL
    if (values.capacity > MAX_CAPACITY) {
      toast({
        title: "Invalid Capacity",
        description: "Capacity value is too large. Please enter a smaller number.",
        variant: "destructive"
      });
      return;
    }

    // Validate session times
    if (values.sessionStartTime && values.sessionEndTime && values.sessionStartTime >= values.sessionEndTime) {
      toast({
        title: "Invalid Session Times",
        description: "Session Start Time must be earlier than Session End Time.",
        variant: "destructive"
      });
      return;
    }

    // Validation for manual schedule
    if (values.schedulePattern === "manual") {
      if (selectedDates.length !== values.noOfSessions) {
        toast({
          title: "Session Count Mismatch",
          description: `Please select exactly ${values.noOfSessions} dates for the manual schedule as per the Number of Sessions. You have selected ${selectedDates.length}.`,
          variant: "destructive",
        });
        return;
      }
    }

    const updatedBatchData: BatchFormData = {
      ...batch,
      name: values.name,
      programId: values.programId as number,
      type: values.type,
      venueId: values.venueId as number,
      venueSpotId: values.venueSpotId,
      partnerIds: values.partnerIds,
      capacity: values.capacity || 0,
      description: values.description || "",
      startDate: values.startDate,
      endDate: values.endDate,
      sessionStartTime: values.sessionStartTime,
      sessionEndTime: values.sessionEndTime,
      noOfSessions: values.noOfSessions || 0, // Use the value from the form field
      schedulePattern: values.schedulePattern,
      amount: values.amount,
      currency: values.currency,
      discountAvailable: values.discountAvailable,
      discountPercentage: values.discountPercentage,
      status: values.status,
      progress: values.progress || 0,
      selectedSessionDates: values.schedulePattern === "manual" 
        ? selectedDates.map(date => format(date, "yyyy-MM-dd")) // Send selected dates if manual
        : []
    };
    onFormSubmit(updatedBatchData);
  };

  const watchedProgramId = form.watch("programId");
  const programFromStore = programs.find(p => p.id === watchedProgramId);
  const selectedProgramName = programFromStore?.name || (batch.program?.id === watchedProgramId ? batch.program.name : "Select a program");

  const venueFromStore = venues.find((v: any) => v.venue_id === watchedVenueId);
  const selectedVenueName = venueFromStore?.venue_name || (batch.venue?.id === watchedVenueId ? batch.venue.venue_name : "Select a venue");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Edit Batch: {batch?.name}
          </DialogTitle>
          <DialogDescription>
            Update batch details, schedule, and payment settings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(processSubmit)}
            className="space-y-6 py-4"
          >
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Batch Details</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="fee">Fee Configuration</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter batch name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="programId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program</FormLabel>
                        <Button
                          variant="outline"
                          type="button"
                          className="w-full justify-start text-left font-normal"
                          onClick={() => setIsProgramDialogOpen(true)}
                        >
                          {selectedProgramName}
                          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        <Dialog open={isProgramDialogOpen} onOpenChange={(open) => { setIsProgramDialogOpen(open); if (!open) setProgramSearchTerm(''); }}>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Select Program</DialogTitle>
                              <DialogDescription>
                                Search for and select a program for this batch.
                              </DialogDescription>
                            </DialogHeader>
                            <Command filter={() => 1}>
                              <CommandInput
                                placeholder="Search programs by name..."
                                value={programSearchTerm}
                                onValueChange={setProgramSearchTerm}
                              />
                              <CommandList className="max-h-[300px] overflow-y-auto">
                                {programsLoading && (
                                  <div className="flex justify-center items-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                  </div>
                                )}
                                {!programsLoading && programs.filter(p => p.name.toLowerCase().includes(programSearchTerm.toLowerCase())).length === 0 && (
                                  <CommandEmpty>
                                    No program found.{programSearchTerm ? <><br />Try a different search term.</> : null}
                                  </CommandEmpty>
                                )}
                                <CommandGroup>
                                  {programs.filter(p => p.name.toLowerCase().includes(programSearchTerm.toLowerCase())).map((program) => (
                                    <CommandItem
                                key={program.id}
                                value={program.id.toString()}
                                      onSelect={() => handleProgramSelect(program.id)}
                                      className="flex flex-col items-start p-2 cursor-pointer"
                                    >
                                      <div className="font-medium">{program.name}</div>
                                      <div className="text-xs text-muted-foreground">{program.description}</div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </DialogContent>
                        </Dialog>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem
                                value="fixed"
                                id={`edit-fixed-${batch?.id}`}
                              />
                            </FormControl>
                            <Label
                              htmlFor={`edit-fixed-${batch?.id}`}
                              className="cursor-pointer font-normal"
                            >
                              Fixed
                            </Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem
                                value="recurring"
                                id={`edit-recurring-${batch?.id}`}
                              />
                            </FormControl>
                            <Label
                              htmlFor={`edit-recurring-${batch?.id}`}
                              className="cursor-pointer font-normal"
                            >
                              Recurring
                            </Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="venueId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue</FormLabel>
                        <Button
                            variant="outline"
                            type="button"
                            className="w-full justify-start text-left font-normal"
                            onClick={() => setIsVenueDialogOpen(true)}
                        >
                            {selectedVenueName}
                            <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        <Dialog open={isVenueDialogOpen} onOpenChange={(open) => { setIsVenueDialogOpen(open); if (!open) setVenueSearchTerm(''); }}>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                <DialogTitle>Select Venue</DialogTitle>
                                  <DialogDescription>
                                      Search for and select a venue for this batch.
                                  </DialogDescription>
                                </DialogHeader>
                                <Command filter={() => 1}>
                                <CommandInput
                                   placeholder="Search venues by name..."
                                    value={venueSearchTerm}
                                    onValueChange={setVenueSearchTerm}
                                />
                                <CommandList className="max-h-[300px] overflow-y-auto">
                                   {venuesLoading && (
                                       <div className="flex justify-center items-center p-4">
                                           <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                       </div>
                                   )}
                                   {!venuesLoading && venues.filter((v:any) => v.venue_name.toLowerCase().includes(venueSearchTerm.toLowerCase())).length === 0 && (
                                        <CommandEmpty>
                                          No venue found.{venueSearchTerm ? <><br />Try a different search term.</> : null}
                                        </CommandEmpty>
                                   )}
                                    <CommandGroup>
                                   {venues.filter((v:any) => v.venue_name.toLowerCase().includes(venueSearchTerm.toLowerCase())).map((venue: any) => (
                                        <CommandItem
                                         key={venue.venue_id}
                                         value={venue.venue_id.toString()}
                                         onSelect={() => handleVenueSelect(venue.venue_id)}
                                         className="flex flex-col items-start p-2 cursor-pointer"
                                         >
                                          <div className="font-medium">{venue.venue_name}</div>
                                          <div className="text-xs text-muted-foreground">{venue.address}</div>
                                         </CommandItem>
                                     ))}
                                     </CommandGroup>
                                </CommandList>
                                </Command>
                            </DialogContent>
                        </Dialog>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="venueSpotId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spot</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value ? Number(value) : undefined)
                          }
                          value={field.value?.toString()}
                          disabled={
                            !watchedVenueId ||
                            spotsLoading ||
                            availableSpots.length === 0
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  spotsLoading
                                    ? "Loading spots..."
                                    : "Select a spot"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!spotsLoading &&
                              availableSpots.length === 0 &&
                              watchedVenueId && (
                                <div
                                  style={{ padding: "8px 12px", color: "grey" }}
                                >
                                  No spots available for this venue.
                                </div>
                              )}
                            {availableSpots.map((spot) => (
                              <SelectItem
                                key={spot.id}
                                value={spot.id.toString()}
                              >
                                {getFormattedSpotName(spot)}
                                {/* Or simply: {spot.name} */}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {spotsError && (
                          <FormMessage style={{ color: "red" }}>
                            {spotsError}
                          </FormMessage>
                        )}
                        <FormMessage />{" "}
                        {/* For react-hook-form validation messages */}
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter capacity"
                            min="0"
                            max="2147483647"
                            {...field}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              if (value > 2147483647) {
                                toast({
                                  title: "Invalid Capacity",
                                  description: "Capacity value is too large. Please enter a smaller number.",
                                  variant: "destructive"
                                });
                                return;
                              }
                              field.onChange(e.target.value ? value : undefined);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="partnerIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partners</FormLabel>
                          <Button
                            variant="outline"
                            role="combobox"
                          type="button"
                            className="w-full justify-between"
                          onClick={() => setIsPartnerDialogOpen(true)}
                          >
                            <div className="flex items-center">
                              <Users className="mr-2 h-4 w-4" />
                              {field.value?.length > 0
                                ? `${field.value.length} partner(s) selected`
                                : "Select partners"}
                            </div>
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                      <Dialog open={isPartnerDialogOpen} onOpenChange={(open) => { setIsPartnerDialogOpen(open); if (!open) setPartnerSearchTerm(''); }}>
                        <DialogContent className="sm:max-w-lg p-0">
                           <DialogHeader className="p-4 border-b">
                                <DialogTitle>Select Partners</DialogTitle>
                                <DialogDescription>
                                    Search for and assign partners to this batch.
                                </DialogDescription>
                            </DialogHeader>
                         <Command filter={() => 1}>
                            <CommandInput
                             placeholder="Search partners by name or specialization..."
                              value={partnerSearchTerm}
                              onValueChange={setPartnerSearchTerm}
                             className="h-9 mx-4 mt-4"
                            />
                            <CommandList className="max-h-[300px] overflow-y-auto p-2">
                                {partnersLoading && (
                                    <div className="flex justify-center items-center p-4">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                                {!partnersLoading && filteredPartners.length === 0 && (
                                     <CommandEmpty>
                                        No partners found.{partnerSearchTerm ? <><br />Try a different search term.</> : null}
                                     </CommandEmpty>
                                )}
                              <CommandGroup>
                                {filteredPartners.map((partner) => (
                                  <CommandItem
                                    key={partner.id}
                                    value={partner.id.toString()}
                                    onSelect={() => {
                                      togglePartnerSelection(partner.id);
                                    }}
                                    className="flex items-center justify-between p-2 cursor-pointer"
                                  >
                                    <div className="flex flex-col">
                                        <div className="font-medium">{partner.name}</div>
                                        <div className="text-xs text-gray-500">
                                          {partner.specialization}
                                        </div>
                                      </div>
                                      {form.watch("partnerIds")?.includes(partner.id) && (
                                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                      )}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                            </CommandList>
                          </Command>
                           <DialogFooter className="p-4 border-t">
                                <Button variant="outline" type="button" onClick={() => setIsPartnerDialogOpen(false)}>Cancel</Button>
                                <Button type="button" onClick={handleConfirmPartnerSelection}>Done</Button>
                            </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {
                      field.value?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.map((partnerId) => (
                            
                            console.log("Rendering partner badge for ID:", partnerId),
                            <Badge
                              key={partnerId}
                              variant="secondary"
                              className="flex items-center"
                            >
                              {getPartnerNameById(partnerId)}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 ml-1 rounded-full hover:bg-primary/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePartnerSelection(partnerId);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                          {field.value.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              type="button"
                              onClick={(e) => { e.preventDefault(); handleClearAllPartners(); }}
                            >
                              Clear All
                            </Button>
                          )}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter batch description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate" // This RHF field stores the date as "yyyy-MM-dd" string
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  // Use the local `Date` object state for conditional styling
                                  !startDate && "text-muted-foreground"
                                )}
                              >
                                {/* Use the local `Date` object state for display */}
                                {startDate ? (
                                  format(startDate, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <UICalendar
                              mode="single"
                              selected={startDate} // Bind to local `Date` object state
                              onSelect={(selectedDate) => {
                                setStartDateState(selectedDate); // Update local `Date` state
                                // Update RHF field with "yyyy-MM-dd" string
                                field.onChange(selectedDate ? format(selectedDate, "yyyy-MM-dd") : "");
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !endDate && "text-muted-foreground"
                                )}
                              >
                                {/* Use the local `Date` object state for display */}
                                {endDate ? (
                                  format(endDate, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <UICalendar
                              mode="single"
                              selected={endDate} 
                              onSelect={(selectedDate) => {
                                setEndDateState(selectedDate); 
                                field.onChange(selectedDate ? format(selectedDate, "yyyy-MM-dd") : "");
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sessionStartTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sessionEndTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="noOfSessions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Sessions</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter number of sessions"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Math.max(0, Number(e.target.value)) // Ensure non-negative
                                : 0 // Default to 0 if empty or invalid
                            )
                          }
                        />
                        
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="schedulePattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule Pattern</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid grid-cols-2 md:grid-cols-4 gap-2"
                        >
                          <FormItem className="flex items-center space-x-2 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem
                                value="MWF"
                                id={`edit-mwf-${batch?.id}`}
                              />
                            </FormControl>
                            <Label
                              htmlFor={`edit-mwf-${batch?.id}`}
                              className="cursor-pointer font-normal"
                            >
                              Mon-Wed-Fri
                            </Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem
                                value="TTS"
                                id={`edit-tts-${batch?.id}`}
                              />
                            </FormControl>
                            <Label
                              htmlFor={`edit-tts-${batch?.id}`}
                              className="cursor-pointer font-normal"
                            >
                              Tue-Thu-Sat
                            </Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem
                                value="weekend"
                                id={`edit-weekend-${batch?.id}`}
                              />
                            </FormControl>
                            <Label
                              htmlFor={`edit-weekend-${batch?.id}`}
                              className="cursor-pointer font-normal"
                            >
                              Weekend Only
                            </Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem
                                value="manual"
                                id={`edit-manual-${batch?.id}`}
                              />
                            </FormControl>
                            <Label
                              htmlFor={`edit-manual-${batch?.id}`}
                              className="cursor-pointer font-normal"
                            >
                              Manual Selection
                            </Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {showManualCalendar && startDate && endDate && (
                  <div className="col-span-2 border rounded-md p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">
                        Manually Select Session Dates
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        Selected: {selectedDates.length}/{targetNumSessions}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                      <Info className="w-4 h-4" />
                      <p>
                        Select exactly {targetNumSessions} dates between{" "}
                        {format(startDate, "MMM d, yyyy")} and{" "}
                        {format(endDate, "MMM d, yyyy")}
                      </p>
                    </div>
                    {selectedDates.length > 0 && (
                      <div className="mb-4">
                        <Label className="mb-2 block">
                          Selected Session Dates:
                        </Label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedDates
                            .sort((a, b) => a.getTime() - b.getTime())
                            .map((date) => (
                              <Badge
                                key={date.toISOString()}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {format(date, "MMM d, yyyy")}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 p-0 ml-1"
                                  onClick={(e) => {e.preventDefault(); removeSelectedDate(date)}}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                        </div>
                        <Separator className="my-3" />
                      </div>
                    )}
                    <div className="bg-white rounded-md p-3">
                      <UICalendar
                        mode="multiple"
                        selected={selectedDates}
                        onSelect={handleDateSelect}
                        disabled={(date) =>
                          !startDate ||
                          !endDate ||
                          date < startDate ||
                          date > endDate
                        }
                        className="p-3 pointer-events-auto"
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="fee" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="Enter amount"
                            {...field}
                            onChange={(e) => {
                              const { value } = e.target;
                              if (!/^\d*$/.test(value)) {
                                return;
                              }
                              if (value.length > 7) {
                                return;
                              }
                              field.onChange(e.target.value ? Number(e.target.value) : 0)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INR">₹ (INR)</SelectItem>
                            <SelectItem value="USD">$ (USD)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="discountAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Apply Discount</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable discount on this batch fee
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {form.watch("discountAvailable") && (
                  <FormField
                    control={form.control}
                    name="discountPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Enter %"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value ? Number(e.target.value) : 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || dataLoading}
              >
                {form.formState.isSubmitting || dataLoading
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBatchForm;
