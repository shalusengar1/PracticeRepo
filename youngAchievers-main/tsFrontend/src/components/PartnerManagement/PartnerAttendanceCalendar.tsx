import React, { useState } from 'react';
import { format, parseISO, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAttendanceError } from '@/hooks/useAttendanceError';

interface PartnerAttendanceCalendarProps {
  attendance?: {
    [batch: string]: {
      date: string;
      status: "Present" | "Absent" | "Late";
      startTime?: string; // Optional start time for the class
      endTime?: string;   // Optional end time for the class
    }[];
  };
  className?: string;
}

const PartnerAttendanceCalendar: React.FC<PartnerAttendanceCalendarProps> = ({
  attendance,
  className
}) => {
  useAttendanceError(); // Use the centralized error handling
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Get the current week's start and end dates
  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start week on Monday
  const endOfCurrentWeek = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  // Generate array of days for the current week
  const weekDays = eachDayOfInterval({
    start: startOfCurrentWeek,
    end: endOfCurrentWeek
  });
  
  // Process attendance data into a more usable format
  const processAttendanceData = () => {
    const attendanceByDay: Record<string, Array<{
      batch: string;
      status: "Present" | "Absent" | "Late";
      startTime: string;
      endTime: string;
    }>> = {};
    
    // Initialize with empty arrays for each day of the week
    weekDays.forEach(day => {
      attendanceByDay[format(day, 'yyyy-MM-dd')] = [];
    });
    
    if (attendance) {
      Object.entries(attendance).forEach(([batchName, records]) => {
        records.forEach(record => {
          const dateKey = record.date;
          
          // Only add records that fall within the current week view
          if (attendanceByDay[dateKey]) {
            attendanceByDay[dateKey].push({
              batch: batchName,
              status: record.status,
              startTime: record.startTime || "09:00", // Default times if not provided
              endTime: record.endTime || "10:30"
            });
          }
        });
      });
    }
    
    return attendanceByDay;
  };
  
  const attendanceByDay = processAttendanceData();
  
  // Navigate to previous/next week
  const goToPreviousWeek = () => {
    setCurrentDate(prevDate => addDays(prevDate, -7));
  };
  
  const goToNextWeek = () => {
    setCurrentDate(prevDate => addDays(prevDate, 7));
  };
  
  // Check if a given date is today
  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };
  
  // Get status color
  const getStatusColor = (status: "Present" | "Absent" | "Late") => {
    switch (status) {
      case "Present":
        return "bg-green-500";
      case "Late":
        return "bg-yellow-400";
      case "Absent":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  // Get status icon
  const getStatusIcon = (status: "Present" | "Absent" | "Late") => {
    switch (status) {
      case "Present":
        return <CheckCircle className="h-3 w-3 text-white" />;
      case "Late":
        return <AlertCircle className="h-3 w-3 text-white" />;
      case "Absent":
        return <XCircle className="h-3 w-3 text-white" />;
      default:
        return null;
    }
  };
  
  // Format time for display
  const formatTime = (time: string) => {
    if (!time) return "";
    
    // Convert 24-hour format to 12-hour format with AM/PM
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Format date to display
  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      return dateStr;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5" />
            Attendance Timeline
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <DatePicker 
              selected={currentDate}
              onSelect={(newDate) => newDate && setCurrentDate(newDate)}
              className="w-[130px]"
            />
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <div className="text-sm text-muted-foreground mt-1">
          {format(startOfCurrentWeek, 'dd MMM yyyy')} - {format(endOfCurrentWeek, 'dd MMM yyyy')}
        </div>
      </CardHeader>
      <CardContent>
        <div className="min-h-[450px]">
          {/* Timeline header */}
          <div className="flex border-b pb-2">
            <div className="w-20 flex-shrink-0"></div>
            <div className="flex-1 flex">
              {/* Time indicators from 8AM to 6PM */}
              {Array.from({ length: 11 }).map((_, i) => {
                const hour = i + 8; // Starting from 8 AM
                return (
                  <div 
                    key={hour} 
                    className="flex-1 text-xs text-center text-gray-500"
                  >
                    {hour > 12 ? `${hour-12}PM` : `${hour}AM`}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Day rows */}
          {weekDays.map((day, dayIndex) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayEvents = attendanceByDay[dayKey] || [];
            const isCurrentDay = isToday(day);
            
            return (
              <div 
                key={dayKey} 
                className={`flex border-b hover:bg-gray-50 ${isCurrentDay ? 'bg-blue-50' : ''}`}
              >
                {/* Day label */}
                <div className="w-20 py-3 pr-2 flex-shrink-0">
                  <div className={`text-right ${isCurrentDay ? 'font-bold text-blue-600' : ''}`}>
                    <div className="text-sm">{format(day, 'EEE')}</div>
                    <div className={`text-xl ${isCurrentDay ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-auto' : ''}`}>
                      {format(day, 'dd')}
                    </div>
                  </div>
                </div>
                
                {/* Timeline for the day */}
                <div className="flex-1 py-2 relative">
                  {/* Background grid */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <div key={i} className="flex-1 border-l border-gray-100"></div>
                    ))}
                  </div>
                  
                  {/* Events for the day */}
                  {dayEvents.length > 0 ? (
                    dayEvents.map((event, eventIndex) => {
                      const startHour = parseInt(event.startTime.split(':')[0]);
                      const startMinute = parseInt(event.startTime.split(':')[1]);
                      const endHour = parseInt(event.endTime.split(':')[0]);
                      const endMinute = parseInt(event.endTime.split(':')[1]);
                      
                      // Calculate position and width based on time
                      const startPosition = ((startHour - 8) + (startMinute / 60)) / 10 * 100;
                      const duration = (endHour - startHour) + ((endMinute - startMinute) / 60);
                      const width = duration / 10 * 100;
                      
                      return (
                        <TooltipProvider key={eventIndex}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className={`absolute h-6 rounded-md ${getStatusColor(event.status)} flex items-center justify-between px-2 text-xs text-white`}
                                style={{ 
                                  left: `${startPosition}%`, 
                                  width: `${width}%`,
                                  top: `${eventIndex * 8 + 4}px` 
                                }}
                              >
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(event.status)}
                                  <span className="truncate">{event.batch}</span>
                                </div>
                                <span className="text-xs font-bold">{event.status}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="w-64">
                              <div className="space-y-1">
                                <div className="font-medium">{event.batch}</div>
                                <div className="text-sm font-medium">
                                  Date: {formatDate(dayKey)}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                  </span>
                                </div>
                                <Badge 
                                  className={`${
                                    event.status === "Present" ? "bg-green-100 text-green-800" : 
                                    event.status === "Late" ? "bg-yellow-100 text-yellow-800" : 
                                    "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {event.status}
                                </Badge>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-6 text-xs text-gray-400">
                      No attendance records for this day
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex justify-center gap-6">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-6 rounded-sm bg-green-500 flex items-center justify-center">
              <CheckCircle className="h-2 w-2 text-white" />
            </div>
            <span className="text-sm">Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-6 rounded-sm bg-yellow-400 flex items-center justify-center">
              <AlertCircle className="h-2 w-2 text-white" />
            </div>
            <span className="text-sm">Late</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-6 rounded-sm bg-red-500 flex items-center justify-center">
              <XCircle className="h-2 w-2 text-white" />
            </div>
            <span className="text-sm">Absent</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnerAttendanceCalendar;
