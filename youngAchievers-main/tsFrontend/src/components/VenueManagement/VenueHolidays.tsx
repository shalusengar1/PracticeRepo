import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, X } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { useIsMobile, BREAKPOINTS } from "@/hooks/use-mobile";
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import {
  addVenueHoliday,
  addMultipleVenueHolidays,
  clearError,
  deleteVenueHoliday,
  fetchVenueNamesAndHolidays,
  Holiday,
  VenueNameAndHolidays,
  AddVenueHolidayPayload,
  AddMultipleVenueHolidaysPayload,
} from '@/store/venue/holidaySlice';
import { fetchVenues } from '@/store/venue/venueSlice';
import { weekDays } from '@/constants/index';

interface HolidayValidationErrors {
  holidayName?: string;
  specificDate?: string;
  dateRange?: string;
  venue?: string;
}

interface TempHolidayEntry {
  id: string;
  name: string;
  holiday_type: "specific" | "recurring";
  date: string | null;
  start_date: string | null;
  end_date: string | null;
  recurring_day: number | null;
  displayDate: string;
}

const VenueHolidays: React.FC = () => {
  const [selectedVenue, setSelectedVenue] = useState<number | null>(null);
  const [holidayName, setHolidayName] = useState<string>("");
  const [holidayType, setHolidayType] = useState<"specific" | "recurring">("specific");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined
  });
  const [isRangeSelection, setIsRangeSelection] = useState<boolean>(false);
  const [recurringDay, setRecurringDay] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<HolidayValidationErrors>({});
  const [isMultipleMode, setIsMultipleMode] = useState<boolean>(false);
  const [tempHolidays, setTempHolidays] = useState<TempHolidayEntry[]>([]);
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { toast } = useToast();
  const isMobile = useIsMobile(BREAKPOINTS.TABLET);
  const dispatch = useAppDispatch();
  const { venues } = useAppSelector((state) => state.venues);
  const { venueNamesAndHolidays, loading, error } = useAppSelector((state) => state.holidays);

  useEffect(() => {
    // Fetch only required fields for venues, non-paginated
    dispatch(fetchVenues({ paginate: false, fields: ['venue_id', 'venue_name', 'status'] }));
    dispatch(fetchVenueNamesAndHolidays());
  }, [dispatch]);

  useEffect(() => {
    if (venues.length > 0 && selectedVenue === null) {
      setSelectedVenue(venues[0].venue_id);
    }
  }, [venues, selectedVenue]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      dispatch(clearError());
    }
  }, [error, toast, dispatch]);

  const validateForm = (): boolean => {
    const errors: HolidayValidationErrors = {};
    let isValid = true;

    if (!selectedVenue) {
      errors.venue = "Please select a venue.";
      isValid = false;
    }

    if (!holidayName.trim()) {
      errors.holidayName = "Holiday name is required.";
      isValid = false;
    }

    if (holidayType === "specific") {
      if (isRangeSelection) {
        if (!dateRange?.from) {
          errors.dateRange = "Start date is required for range selection.";
          isValid = false;
        }
        if (!dateRange?.to) {
          errors.dateRange = errors.dateRange ? errors.dateRange + " End date is required." : "End date is required for range selection.";
          isValid = false;
        }
        if (dateRange?.from && dateRange?.to) {
          if (isBefore(startOfDay(dateRange.to), startOfDay(dateRange.from))) {
            errors.dateRange = "End date cannot be before start date.";
            isValid = false;
          } else if (format(dateRange.from, 'yyyy-MM-dd') === format(dateRange.to, 'yyyy-MM-dd')) {
            errors.dateRange = "Start date and end date cannot be the same for a range.";
            isValid = false;
          }
        }
      } else {
        if (!selectedDate) {
          errors.specificDate = "Please select a date for the holiday.";
          isValid = false;
        }
      }
    }
    setValidationErrors(errors);
    return isValid;
  };

  const handleAddHoliday = async () => {
    if (!validateForm()) {
      return;
    }

    const selectedVenueName = venues.find(v => v.venue_id === selectedVenue)?.venue_name;
    if (!selectedVenueName) {
      toast({
        title: "Error",
        description: "Could not find venue name. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const newHoliday: AddVenueHolidayPayload = {
      venue_id: selectedVenue!,
      venue_name: selectedVenueName,
      name: holidayName,
      holiday_type: holidayType,
      date: holidayType === "specific" && !isRangeSelection && selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
      start_date: holidayType === "specific" && isRangeSelection && dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
      end_date: holidayType === "specific" && isRangeSelection && dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
      recurring_day: holidayType === "recurring" ? recurringDay : null,
    };

    try {
      await dispatch(addVenueHoliday(newHoliday)).unwrap();
      toast({
        title: "Holiday Added",
        description: `${holidayName} has been added to the calendar.`,
      });
      resetForm();
    } catch (err: any) {
      // Error is handled by the useEffect hook for 'error' state
    }
  };

  const addToTempHolidays = () => {
    if (!validateForm()) {
      return;
    }

    let displayDate = "";
    if (holidayType === "recurring") {
      displayDate = `Every ${weekDays.find(d => d.id === recurringDay)?.name}`;
    } else if (isRangeSelection && dateRange?.from && dateRange?.to) {
      displayDate = `${format(dateRange.from, "PPP")} – ${format(dateRange.to, "PPP")}`;
    } else if (selectedDate) {
      displayDate = format(selectedDate, "PPP");
    }

    const tempHoliday: TempHolidayEntry = {
      id: Date.now().toString(),
      name: holidayName,
      holiday_type: holidayType,
      date: holidayType === "specific" && !isRangeSelection && selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
      start_date: holidayType === "specific" && isRangeSelection && dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
      end_date: holidayType === "specific" && isRangeSelection && dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
      recurring_day: holidayType === "recurring" ? recurringDay : null,
      displayDate,
    };

    setTempHolidays([...tempHolidays, tempHoliday]);
    resetForm();
    
    toast({
      title: "Holiday Added to List",
      description: `${holidayName} has been added to the list. You can add more or submit all at once.`,
    });
  };

  const removeFromTempHolidays = (id: string) => {
    setTempHolidays(tempHolidays.filter(holiday => holiday.id !== id));
  };

  const handleSubmitMultipleHolidays = async () => {
    if (tempHolidays.length === 0) {
      toast({
        title: "No Holidays",
        description: "Please add at least one holiday before submitting.",
        variant: "destructive",
      });
      return;
    }

    const selectedVenueName = venues.find(v => v.venue_id === selectedVenue)?.venue_name;
    if (!selectedVenueName) {
      toast({
        title: "Error",
        description: "Could not find venue name. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const holidays = tempHolidays.map(holiday => ({
      name: holiday.name,
      holiday_type: holiday.holiday_type,
      date: holiday.date,
      start_date: holiday.start_date,
      end_date: holiday.end_date,
      recurring_day: holiday.recurring_day,
    }));

    const payload: AddMultipleVenueHolidaysPayload = {
      venue_id: selectedVenue!,
      venue_name: selectedVenueName,
      holidays,
    };

    try {
      const result = await dispatch(addMultipleVenueHolidays(payload)).unwrap();
      toast({
        title: "Holidays Added",
        description: `${result.length} holiday(s) have been added to the calendar.`,
      });
      resetMultipleForm();
    } catch (err: any) {
      // Error is handled by the useEffect hook for 'error' state
    }
  };

  const openDeleteConfirmationDialog = (holiday: Holiday) => {
    if (!selectedVenue) {
      setValidationErrors(prev => ({ ...prev, venue: "Please select a venue to delete its holiday." }));
      toast({
        title: "No Venue Selected",
        description: "Please select a venue before deleting a holiday.",
        variant: "destructive",
      });
      return;
    }
    setHolidayToDelete(holiday);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteHoliday = async () => {
    if (!holidayToDelete || !selectedVenue) {
      // This case should ideally not happen if the dialog is opened correctly
      toast({ title: "Error", description: "Holiday or venue not specified for deletion.", variant: "destructive" });
      setIsDeleteDialogOpen(false);
      return;
    }
    try {
      await dispatch(deleteVenueHoliday({ id: holidayToDelete.id, venueId: selectedVenue })).unwrap();
      toast({
        title: "Holiday Removed",
        description: `The holiday "${holidayToDelete.name}" has been removed.`,
      });
    } catch (err: any) {
      // Error is handled by the useEffect hook for 'error' state
    } finally {
      setIsDeleteDialogOpen(false);
      setHolidayToDelete(null);
    }
  };

  const formatHolidayDate = (holiday: Holiday): string => {
    if (holiday.holiday_type === 'recurring' && holiday.recurring_day !== null) {
      return `Every ${weekDays.find(d => d.id === holiday.recurring_day)?.name}`;
    }
    if (holiday.holiday_type === 'specific' && holiday.start_date && holiday.end_date) {
      return `${format(parseISO(holiday.start_date), "PPP")} - ${format(parseISO(holiday.end_date), "PPP")}`;
    }
    if (holiday.holiday_type === 'specific' && holiday.date) {
      return format(parseISO(holiday.date), "PPP");
    }
    return "No date specified";
  };

  const resetForm = () => {
    setHolidayName("");
    setHolidayType("specific");
    setSelectedDate(new Date());
    setDateRange({ from: undefined, to: undefined });
    setIsRangeSelection(false);
    setRecurringDay(0);
    setValidationErrors({});
  };

  const resetMultipleForm = () => {
    setTempHolidays([]);
    setIsMultipleMode(false);
  };

  const getHolidaysForSelectedVenue = (): Holiday[] => {
    if (!selectedVenue) return [];
    const venue = venueNamesAndHolidays.find(v => v.venue_id === selectedVenue);
    return venue ? venue.holidays : [];
  };

  const handleHolidayTypeChange = (value: "specific" | "recurring") => {
    setHolidayType(value);
    setValidationErrors(prev => ({ ...prev, specificDate: undefined, dateRange: undefined }));
    if (value === "recurring") {
      setRecurringDay(0);
    } else {
      if (isRangeSelection) {
        setDateRange({ from: undefined, to: undefined });
        setSelectedDate(undefined);
      } else {
        setSelectedDate(new Date());
        setDateRange({ from: undefined, to: undefined });
      }
    }
  };

  const handleHolidayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHolidayName(e.target.value);
    if (validationErrors.holidayName) {
      setValidationErrors(prev => ({ ...prev, holidayName: undefined }));
    }
  };

  const handleSelectedVenueChange = (value: string) => {
    setSelectedVenue(parseInt(value));
    if (validationErrors.venue) {
      setValidationErrors(prev => ({ ...prev, venue: undefined }));
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (validationErrors.specificDate) {
      setValidationErrors(prev => ({ ...prev, specificDate: undefined }));
    }
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (validationErrors.dateRange) {
      setValidationErrors(prev => ({ ...prev, dateRange: undefined }));
    }
  };
  
  const handleIsRangeSelectionChange = (checked: boolean | "indeterminate") => {
    const isNowRange = !!checked;
    setIsRangeSelection(isNowRange);
    if (isNowRange) {
      setSelectedDate(undefined);
      setDateRange({ from: undefined, to: undefined });
    } else {
      setSelectedDate(new Date());
      setDateRange({ from: undefined, to: undefined });
    }
    setValidationErrors(prev => ({ ...prev, specificDate: undefined, dateRange: undefined }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Mark Holidays / Days Off</h3>
        <p className="text-sm text-gray-500">
          Configure holidays and days off for venues to manage availability
        </p>
      </div>

      {venues.length === 0 ? (
        <p>No venues available. Please add a venue first.</p>
      ) : (
        <>
          <div className="flex space-x-4 mb-4 overflow-x-auto">
            <div className="space-y-1">
              <Select
                value={selectedVenue !== null ? selectedVenue.toString() : ""}
                onValueChange={handleSelectedVenueChange}
                disabled={venues.length === 0}
              >
                <SelectTrigger className={`w-[200px] ${validationErrors.venue ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select Venue">
                    {selectedVenue
                      ? venues.find(v => v.venue_id === selectedVenue)?.venue_name
                      : "Select Venue"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {venues
                    .filter(venue => venue.status === 'active')
                    .map((venue) => (
                      <SelectItem key={venue.venue_id} value={venue.venue_id.toString()}>
                        {venue.venue_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {validationErrors.venue && <p className="text-xs text-red-500">{validationErrors.venue}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${isMobile ? '' : 'md:col-span-2'}`}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{isMultipleMode ? 'Add Multiple Holidays' : 'Add Holiday'}</CardTitle>
                      <CardDescription>
                        {isMultipleMode 
                          ? 'Add holidays one by one to a list, then submit all at once'
                          : 'Mark specific dates or recurring days as holidays or days off'
                        }
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsMultipleMode(!isMultipleMode);
                        if (!isMultipleMode) {
                          resetForm();
                        } else {
                          resetMultipleForm();
                        }
                      }}
                    >
                      {isMultipleMode ? 'Single Mode' : 'Multiple Mode'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isMultipleMode ? (
                    <div className="space-y-6">
                      {/* Holiday Form */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="holidayName">Holiday Name</Label>
                          <Input
                            id="holidayName"
                            placeholder="e.g., Christmas Day"
                            value={holidayName}
                            onChange={handleHolidayNameChange}
                            className={validationErrors.holidayName ? 'border-red-500' : ''}
                          />
                          {validationErrors.holidayName && <p className="text-xs text-red-500 mt-1">{validationErrors.holidayName}</p>}
                        </div>

                        <Tabs defaultValue="specific" value={holidayType} onValueChange={(value) => handleHolidayTypeChange(value as "specific" | "recurring")}>
                          <TabsList className="grid grid-cols-2">
                            <TabsTrigger value="specific">Specific Date(s)</TabsTrigger>
                            <TabsTrigger value="recurring">Recurring Weekly</TabsTrigger>
                          </TabsList>

                          <TabsContent value="specific" className="space-y-4">
                            <div className="flex items-center space-x-2 mt-4">
                              <Checkbox
                                id="dateRange"
                                checked={isRangeSelection}
                                onCheckedChange={handleIsRangeSelectionChange}
                              />
                              <Label htmlFor="dateRange">Date Range</Label>
                            </div>

                            {isRangeSelection ? (
                              <div className={`border rounded-md p-4 overflow-auto ${validationErrors.dateRange ? 'border-red-500' : ''}`}>
                                <p className="text-sm text-gray-500 mb-2">Select start and end dates</p>
                                <div className="flex justify-center">
                                  <Calendar
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={handleDateRangeSelect}
                                    className="rounded-md border max-w-full"
                                    disabled={{ before: new Date() }}
                                  />
                                </div>
                                {dateRange?.from && dateRange?.to && (
                                  <p className="text-sm mt-2 text-center">
                                    <span className="font-medium">Selected range:</span>{' '}
                                    {format(dateRange.from, "PPP")} – {format(dateRange.to, "PPP")}
                                  </p>
                                )}
                                 {validationErrors.dateRange && <p className="text-xs text-red-500 mt-1 text-center">{validationErrors.dateRange}</p>}
                              </div>
                            ) : (
                              <div className={`border rounded-md p-4 overflow-auto ${validationErrors.specificDate ? 'border-red-500' : ''}`}>
                                <p className="text-sm text-gray-500 mb-2">Select date</p>
                                <div className="flex justify-center">
                                  <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={handleDateSelect}
                                    className="rounded-md border max-w-full"
                                    disabled={{ before: new Date() }}
                                  />
                                </div>
                                {validationErrors.specificDate && <p className="text-xs text-red-500 mt-1 text-center">{validationErrors.specificDate}</p>}
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="recurring" className="space-y-4">
                            <div className="mt-4">
                              <Label htmlFor="recurringDay">Day of Week</Label>
                              <Select
                                value={recurringDay.toString()}
                                onValueChange={(value) => setRecurringDay(parseInt(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Day" />
                                </SelectTrigger>
                                <SelectContent>
                                  {weekDays.map((day) => (
                                    <SelectItem key={day.id} value={day.id.toString()}>
                                      {day.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-sm text-gray-500 mt-2">
                                This will mark every {weekDays.find(d => d.id === recurringDay)?.name} as a holiday.
                              </p>
                            </div>
                          </TabsContent>
                        </Tabs>
                        
                        <Button onClick={addToTempHolidays} className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add to List
                        </Button>
                      </div>

                      {/* Temporary Holidays List */}
                      {tempHolidays.length > 0 && (
                        <div className="border-t pt-6">
                          <div className="flex justify-between items-center mb-4">
                            <Label className="text-base font-medium">Holidays to Add ({tempHolidays.length})</Label>
                            <Button onClick={handleSubmitMultipleHolidays} className="flex items-center gap-2">
                              Submit All Holidays
                            </Button>
                          </div>
                          
                          <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {tempHolidays.map((holiday) => (
                              <div key={holiday.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                                <div className="flex-1">
                                  <p className="font-medium">{holiday.name}</p>
                                  <p className="text-sm text-gray-500">{holiday.displayDate}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFromTempHolidays(holiday.id)}
                                  className="h-6 w-6"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="holidayName">Holiday Name</Label>
                        <Input
                          id="holidayName"
                          placeholder="e.g., Christmas Day"
                          value={holidayName}
                          onChange={handleHolidayNameChange}
                          className={validationErrors.holidayName ? 'border-red-500' : ''}
                        />
                        {validationErrors.holidayName && <p className="text-xs text-red-500 mt-1">{validationErrors.holidayName}</p>}
                      </div>

                      <Tabs defaultValue="specific" value={holidayType} onValueChange={(value) => handleHolidayTypeChange(value as "specific" | "recurring")}>
                        <TabsList className="grid grid-cols-2">
                          <TabsTrigger value="specific">Specific Date(s)</TabsTrigger>
                          <TabsTrigger value="recurring">Recurring Weekly</TabsTrigger>
                        </TabsList>

                        <TabsContent value="specific" className="space-y-4">
                          <div className="flex items-center space-x-2 mt-4">
                            <Checkbox
                              id="dateRange"
                              checked={isRangeSelection}
                              onCheckedChange={handleIsRangeSelectionChange}
                            />
                            <Label htmlFor="dateRange">Date Range</Label>
                          </div>

                          {isRangeSelection ? (
                            <div className={`border rounded-md p-4 overflow-auto ${validationErrors.dateRange ? 'border-red-500' : ''}`}>
                              <p className="text-sm text-gray-500 mb-2">Select start and end dates</p>
                              <div className="flex justify-center">
                                <Calendar
                                  mode="range"
                                  selected={dateRange}
                                  onSelect={handleDateRangeSelect}
                                  className="rounded-md border max-w-full"
                                  disabled={{ before: new Date() }}
                                />
                              </div>
                              {dateRange?.from && dateRange?.to && (
                                <p className="text-sm mt-2 text-center">
                                  <span className="font-medium">Selected range:</span>{' '}
                                  {format(dateRange.from, "PPP")} – {format(dateRange.to, "PPP")}
                                </p>
                              )}
                               {validationErrors.dateRange && <p className="text-xs text-red-500 mt-1 text-center">{validationErrors.dateRange}</p>}
                            </div>
                          ) : (
                            <div className={`border rounded-md p-4 overflow-auto ${validationErrors.specificDate ? 'border-red-500' : ''}`}>
                              <p className="text-sm text-gray-500 mb-2">Select date</p>
                              <div className="flex justify-center">
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={handleDateSelect}
                                  className="rounded-md border max-w-full"
                                  disabled={{ before: new Date() }}
                                />
                              </div>
                              {validationErrors.specificDate && <p className="text-xs text-red-500 mt-1 text-center">{validationErrors.specificDate}</p>}
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="recurring" className="space-y-4">
                          <div className="mt-4">
                            <Label htmlFor="recurringDay">Day of Week</Label>
                            <Select
                              value={recurringDay.toString()}
                              onValueChange={(value) => setRecurringDay(parseInt(value))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Day" />
                              </SelectTrigger>
                              <SelectContent>
                                {weekDays.map((day) => (
                                  <SelectItem key={day.id} value={day.id.toString()}>
                                    {day.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-sm text-gray-500 mt-2">
                              This will mark every {weekDays.find(d => d.id === recurringDay)?.name} as a holiday.
                            </p>
                          </div>
                        </TabsContent>
                      </Tabs>
                      <Button onClick={handleAddHoliday} className="flex items-center gap-2">
                        Add Holiday
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Holiday Calendar</CardTitle>
                  <CardDescription>
                    Upcoming holidays and days off for {selectedVenue ? venues.find(v => v.venue_id === selectedVenue)?.venue_name : "selected venue"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <div className="space-y-4 overflow-auto max-h-[400px]">
                      {loading && venueNamesAndHolidays.length > 0 ? (
                        <p>Loading holidays for selected venue...</p>
                      ) : getHolidaysForSelectedVenue().length === 0 ? (
                        <p className="text-sm text-gray-500">No holidays configured yet for this venue.</p>
                      ) : (
                        getHolidaysForSelectedVenue().map((holiday) => (
                          <div key={holiday.id} className="flex justify-between items-start border-b pb-2">
                            <div className="pr-2 flex-1">
                              <p className="font-medium truncate">{holiday.name}</p>
                              <p className="text-sm text-gray-500 break-words">{formatHolidayDate(holiday)}</p>
                            </div>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteConfirmationDialog(holiday)}
                                className="flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                          </div>
                        ))
                      )}
                    </div>
                    {/* Delete Confirmation Dialog Content moved inside the AlertDialog wrapper */}
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will permanently delete the holiday "<strong>{holidayToDelete?.name}</strong>".
                          This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setHolidayToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleConfirmDeleteHoliday}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VenueHolidays; 