import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge"; 
import { Search, ArrowUpDown, Filter, Calendar, X } from 'lucide-react'; 
import { Button } from "@/components/ui/button";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import { fetchActivityLogs, setFilters, setCurrentPage } from '@/store/activityLogs/activityLogsSlice';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink, PaginationEllipsis } from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TruncatedText } from "@/components/ui/truncated-text";

// Function to format timestamps in a more readable format
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

// Activity status badges
const getActivityStatusBadge = (category: string) => {
  switch (category) {
    case "user_management":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">User Management</Badge>;
    case "venue_management":
      return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">Venue Management</Badge>;
    case "batch_management":
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Batch Management</Badge>;
    case "finance":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Finance</Badge>;
    case "member_management":
      return <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200">Member Management</Badge>;
    case "partner_management":
      return <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200">Partner Management</Badge>;
    case "program_management":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Program Management</Badge>;
    case "amenity_management":
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Amenity Management</Badge>
    case "fixed_asset_management":
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Fixed Asset Management</Badge>
    case "profile_management":
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Profile Management</Badge>
    case "attendance_management":
      return <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-200">Attendance Management</Badge>;
    case "batch_session_management":
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Batch Session Management</Badge>
    case "system":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">System</Badge>;
    case "reports":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Reports</Badge>;
    case "booking":
      return <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200">Booking</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Other</Badge>;
  }
};

// Main component
const ActivityLogs: React.FC = () => {
  const dispatch = useAppDispatch();
  const { logs, loading, error, totalPages, currentPage, filters } = useAppSelector(
    (state) => state.activityLogs
  );

  useEffect(() => {
    dispatch(fetchActivityLogs({
      page: currentPage,
      category: filters.category,
      dateRange: filters.dateRange,
      search: filters.search,
      sortOrder: filters.sortOrder
    }));
  }, [dispatch, currentPage, filters]);

  const handleSearch = (search: string) => {
    dispatch(setFilters({ search }));
  };

  const handleCategoryFilter = (category: string) => {
    dispatch(setFilters({ category }));
  };

  const handleDateRangeFilter = (dateRange: string) => {
    dispatch(setFilters({ dateRange }));
  };

  const handleSortByTime = () => {
    // Toggle sort order between asc and desc
    const newSortOrder = filters.sortOrder === 'desc' ? 'asc' : 'desc';
    dispatch(setFilters({ sortOrder: newSortOrder }));
  };

  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
  };

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and track all activities across the system
          </p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading activity logs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and track all activities across the system
          </p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and track all activities across the system
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="w-full md:w-1/3 relative"> 
          <InputWithIcon 
            placeholder="Search activities..." 
            value={filters.search} 
            onChange={(e) => handleSearch(e.target.value)} 
            className="w-full pr-10" 
            icon={Search}
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => handleSearch("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div>
            <Select value={filters.category} onValueChange={handleCategoryFilter}>
              <SelectTrigger className="min-w-[180px]">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="user_management">User Management</SelectItem>
                <SelectItem value="venue_management">Venue Management</SelectItem>
                <SelectItem value="batch_management">Batch Management</SelectItem>
                <SelectItem value="member_management">Member Management</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="reports">Reports</SelectItem>
                <SelectItem value="booking">Booking</SelectItem>
                <SelectItem value="program_management">Program Management</SelectItem>
                <SelectItem value="partner_management">Partner Management</SelectItem>
                <SelectItem value="attendance_management">Attendance Management</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select value={filters.dateRange} onValueChange={handleDateRangeFilter}>
              <SelectTrigger className="min-w-[160px]">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date range" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSortByTime}
            className="min-w-[120px]"
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {filters.sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Showing {logs.length} activities {filters.category !== 'all' && `in ${filters.category.replace('_', ' ')}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-0">
            <div className="h-full overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background border-b">
                  <TableRow>
                    <TableHead className="w-[15%]">ACTION</TableHead>
                    <TableHead className="w-[15%]">USER</TableHead>
                    <TableHead className="w-[15%]">TARGET</TableHead>
                    <TableHead className="w-[15%]">TIMESTAMP</TableHead>
                    <TableHead className="w-[15%]">CATEGORY</TableHead>
                    <TableHead className="w-[25%]">DETAILS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium whitespace-nowrap">{log.action}</TableCell>
                      <TableCell className="whitespace-nowrap">{log.user}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <TruncatedText text={log.target} maxLength={30} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatTimestamp(log.timestamp)}</TableCell>
                      <TableCell className="whitespace-nowrap">{getActivityStatusBadge(log.category)}</TableCell>
                      <TableCell className="max-w-[300px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default block truncate">{log.details}{"."}</span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-lg break-words p-2 max-h-60 overflow-y-auto">
                            <p className="whitespace-pre-wrap ">
                              {" "}{log.details.replace(/,/g, ',\n')}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No activities found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink 
                      isActive={pageNumber === currentPage}
                      onClick={() => handlePageChange(pageNumber)}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (
                (pageNumber === 2 && currentPage > 3) ||
                (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return <PaginationEllipsis key={pageNumber} />;
              }
              return null;
            })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default ActivityLogs;