import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Eye, Calendar, Users, ExternalLink, ToggleLeft, ToggleRight, Trash, Search, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import AddPartnerDialog from "@/components/PartnerManagement/AddPartnerDialog";
import EditPartnerDialog from "@/components/PartnerManagement/EditPartnerDialog";
import PartnerDetailsDialog from "@/components/PartnerManagement/PartnerDetailsDialog";
import PartnerAttendanceCalendar from "@/components/PartnerManagement/PartnerAttendanceCalendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppSelector, useAppDispatch } from "@/hooks/reduxHooks/hooks";
import { fetchPartners, updatePartner, addPartner, deletePartner } from "@/store/partner/partnerSlice";
import { formatBackendError } from '@/utils/errorHandling';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BatchInfo {
  id: number;
  name: string;
  status?: string; // Optional, if you need it
  pivot?: any;    // Optional, if you need it, or define a more specific pivot type
}

interface Partner {
  id: number;
  name: string;
  specialization: string;
  email: string;
  mobile: string;
  status: "Active" | "Inactive";
  payType: "Fixed" | "Revenue Share";
  payAmount?: number;
  payPercentage?: number;
  paymentTerms: string;
  assignedBatches?: BatchInfo[];
  attendance?: {
    [batch: string]: {
      date: string;
      status: "Present" | "Absent" | "Late";
      startTime: string;
      endTime: string;
    }[];
  };
}

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
} from "@/components/ui/alert-dialog";

const today = new Date();
const formatDate = (date: Date) => {
  return date.toISOString().split("T")[0];
};

const getDateString = (daysToAdd: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return formatDate(date);
};

const calculateAttendancePercentage = (partner: Partner) => {
  if (!partner.attendance || !partner.assignedBatches) return 0;

  let totalSessions = 0;
  let presentSessions = 0;

  Object.values(partner.attendance).forEach((batchAttendance) => {
    batchAttendance.forEach((record) => {
      totalSessions++;
      if (record.status === "Present") {
        presentSessions++;
      } else if (record.status === "Late") {
        presentSessions += 0.5; // Count late as half attendance
      }
    });
  });

  return totalSessions > 0
    ? Math.round((presentSessions / totalSessions) * 100)
    : 0;
};

const PartnerPerformanceTab: React.FC<{ partners: Partner[], loading: boolean, error: string }> = ({
  partners,
  loading,
  error,
}) => {
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Partners</CardTitle>
            <CardDescription>
              Select a partner to view performance
            </CardDescription>
          </CardHeader>
          <CardContent>
          {loading ? (
              <div className="flex justify-center items-center h-40">
                Loading partners...
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-40 text-red-500">
                Error: {error}
              </div>
            ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  onClick={() => setSelectedPartner(partner)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedPartner?.id === partner.id
                      ? "bg-purple-100 border-l-4 border-purple-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium">{partner.name}</div>
                  <div className="text-sm text-gray-500">
                    {partner.specialization}
                  </div>
                  <div className="mt-1">
                    <Badge
                      variant={
                        partner.status === "Active" ? "default" : "destructive"
                      }
                      className="text-xs"
                    >
                      {partner.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          {selectedPartner ? (
            <>
              <CardHeader>
                <CardTitle>{selectedPartner.name} - Performance</CardTitle>
                <CardDescription>
                  Attendance and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 overflow-x-auto">
                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Overall Attendance
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="w-full max-w-md">
                      <Progress
                        value={calculateAttendancePercentage(selectedPartner)}
                        className="h-2"
                      />
                    </div>
                    <div className="text-sm font-medium">
                      {calculateAttendancePercentage(selectedPartner)}%
                    </div>
                  </div>
                </div>

                <div className="w-full overflow-x-auto">
                  <PartnerAttendanceCalendar
                    attendance={selectedPartner.attendance}
                    className="mb-6 min-w-[500px]"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Attendance by Program
                  </h3>
                  <div className="space-y-4">
                    {selectedPartner.assignedBatches?.map((batch) => {
                      const batchAttendance =
                        selectedPartner.attendance?.[batch.name] || [];
                      const totalSessions = batchAttendance.length;
                      const presentSessions = batchAttendance.filter(
                        (record) => record.status === "Present"
                      ).length;
                      const lateCount = batchAttendance.filter(
                        (record) => record.status === "Late"
                      ).length;
                      const percentage =
                        totalSessions > 0
                          ? Math.round(
                              ((presentSessions + lateCount * 0.5) /
                                totalSessions) *
                                100
                            )
                          : 0;

                      return (
                        <div key={batch.id}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{batch.name}</span>
                            <span className="text-sm">{percentage}%</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="w-full">
                              <Progress value={percentage} className="h-2" />
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Present: {presentSessions} | Late: {lateCount} |
                            Absent: {totalSessions - presentSessions - lateCount}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Users size={48} className="mb-4 opacity-50" />
              <p>Select a partner to view performance details</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

// Search component
interface SearchProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchProps> = ({ onSearch }) => {
  const [searchValue, setSearchValue] = useState('');

  const handleClear = () => {
    setSearchValue('');
    onSearch('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={18} className="text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Search partners..."
        className="pl-10 pr-10 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        value={searchValue}
        onChange={handleChange}
      />
      {searchValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

const PartnerManagement: React.FC = () => {
  const { partners, loading, error, totalPages } = useAppSelector((state) => state.partner);
  const dispatch = useAppDispatch();
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [isEditPartnerOpen, setIsEditPartnerOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [partnerToDeleteId, setPartnerToDeleteId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [payTypeFilter, setPayTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchPartners({
      page: currentPage,
      perPage: 10,
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      payType: payTypeFilter !== 'all' ? payTypeFilter : undefined,
      paginate: true
    }));
  }, [dispatch, currentPage, searchQuery, statusFilter, payTypeFilter]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    dispatch(fetchPartners({
      page: 1,
      perPage: 10,
      search: query,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      payType: payTypeFilter !== 'all' ? payTypeFilter : undefined,
      paginate: true
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    dispatch(fetchPartners({
      page,
      perPage: 10,
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      payType: payTypeFilter !== 'all' ? payTypeFilter : undefined,
      paginate: true
    }));
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    dispatch(fetchPartners({
      page: 1,
      perPage: 10,
      search: searchQuery,
      status: value !== 'all' ? value : undefined,
      payType: payTypeFilter !== 'all' ? payTypeFilter : undefined,
      paginate: true
    }));
  };

  const handlePayTypeFilterChange = (value: string) => {
    setPayTypeFilter(value);
    setCurrentPage(1);
    dispatch(fetchPartners({
      page: 1,
      perPage: 10,
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      payType: value !== 'all' ? value : undefined,
      paginate: true
    }));
  };

  const handleAddPartner = async (partnerData: Omit<Partner, "id">) => {
    try {
      console.log("Adding partner with data:", partnerData);

      const result = await dispatch(addPartner(partnerData)).unwrap();

      toast({
        title: "Partner Added",
        description: "Partner has been successfully added.",
      });

      return result;
    } catch (error: any) {
      console.error("Error adding partner:", error);
      toast({
        title: "Error Adding Partner",
        description: formatBackendError(error),
        variant: "destructive",
      });
      throw error; 
    }
  };

  const handleEditPartner = (partnerId: number) => {
    const partner = partners.find((p) => p.id === partnerId);
    if (partner) {
      setSelectedPartner(partner);
      setIsEditPartnerOpen(true);
    }
  };

  const handleUpdatePartner = async (
    id: number,
    updatedPartner: Partial<Partner>
  ) => {
    try {
      console.log("Adding partner with data:", updatedPartner);

      const result = await dispatch(updatePartner({ id, updatedPartner })).unwrap();

      toast({
        title: "Partner Updated",
        description: "Partner has been successfully updated.",
      });

      setIsEditPartnerOpen(false); // Close dialog on success
      setSelectedPartner(null);
      return result;
    } catch (error: any) {
      console.error("Error updating partner:", error);
      toast({
        title: "Error Updating Partner",
        description: formatBackendError(error),
        variant: "destructive",
      });
      throw error; 
    }
  };

  const handleViewDetails = (partnerId: number) => {
    const partner = partners.find((p) => p.id === partnerId);
    if (partner) {
      setSelectedPartner(partner);
      setIsViewDetailsOpen(true);
    }
  };

  const handleTogglePartnerStatus = async (partner: Partner) => {
    const newStatus = partner.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await dispatch(updatePartner({ id: partner.id, updatedPartner: { status: newStatus } })).unwrap();
      toast({
        title: "Status Updated",
        description: `Partner "${partner.name}" status changed to ${newStatus}.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: formatBackendError(err) || "Failed to update partner status.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDeletePartner = async () => {
    if (partnerToDeleteId) {
      try {
        await dispatch(deletePartner(partnerToDeleteId)).unwrap();
        toast({
          title: "Partner Deleted",
          description: "The partner has been successfully deleted.",
        });
        setPartnerToDeleteId(null);
      } catch (err: any) {
        toast({
          title: "Error",
          description: formatBackendError(err) || "Failed to delete partner.",
          variant: "destructive",
        });
        throw err; 
      }
    }
  };

  const renderAssignedBatches = (batches: BatchInfo[] | undefined) => {
    if (!batches || batches.length === 0) {
      return "None";
    }

    const fullBatchNames = batches.map(batch => batch.name).join(", ");

    const MAX_BATCH_NAME_LENGTH = 50; // Define your desired max length

    if (fullBatchNames.length > MAX_BATCH_NAME_LENGTH) {
      const truncatedNames = fullBatchNames.substring(0, MAX_BATCH_NAME_LENGTH) + "...";
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-default">{truncatedNames}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs break-words">
              <p>{fullBatchNames}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return fullBatchNames;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Partner Management
        </h1>
        <Button
          className="flex items-center gap-2"
          onClick={() => setIsAddPartnerOpen(true)}
        >
          <Plus size={16} />
          Add Partner
        </Button>
      </div>
      {/* Filters and search bar together */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-2">
        <div className="w-full md:w-1/3 relative">
          <SearchBar onSearch={handleSearch} />
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="min-w-[160px]">
                <div className="flex items-center">
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={payTypeFilter} onValueChange={handlePayTypeFilterChange}>
              <SelectTrigger className="min-w-[160px]">
                <div className="flex items-center">
                  <SelectValue placeholder="Filter by pay type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pay Types</SelectItem>
                <SelectItem value="Fixed">Fixed</SelectItem>
                <SelectItem value="Revenue Share">Revenue Share</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="w-full md:w-fit grid grid-cols-3 mb-6 min-w-[340px] sm:min-w-0">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              Partner Overview
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              Payment Terms
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="flex items-center gap-2"
            >
              Partner Performance
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Partner Overview</CardTitle>
              <CardDescription>
                Manage instructors and coaches details.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0 sm:p-6">
              <div className="min-w-[700px] sm:min-w-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner Name</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pay Type</TableHead>
                      <TableHead>Pay Amount</TableHead>
                      <TableHead>Assigned Batches</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Loading partners...
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-red-500"
                        >
                          Error: {error}
                        </TableCell>
                      </TableRow>
                    ) : partners.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-10"
                        >
                          <p className="text-gray-500 text-lg">No partners found.</p>
                          {searchQuery && <p className="text-gray-400 text-sm">Try adjusting your search criteria.</p>}
                        </TableCell>
                      </TableRow>
                    ) : (
                      partners.map((partner) => (
                        <TableRow key={partner.id} className="break-words">
                          <TableCell className="font-medium max-w-[160px] truncate md:whitespace-normal md:max-w-xs">
                            {partner.name}
                          </TableCell>
                          <TableCell className="max-w-[140px] truncate md:whitespace-normal md:max-w-xs">
                            {partner.specialization}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                partner.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {partner.status}
                            </span>
                          </TableCell>
                          <TableCell>{partner.payType}</TableCell>
                          <TableCell>
                            {partner.payType === "Fixed"
                              ? `₹${partner.payAmount} per month`
                              : `${partner.payPercentage}% of revenue`}
                          </TableCell>
                          <TableCell className="max-w-[180px] md:max-w-[350px]">
                            {renderAssignedBatches(partner.assignedBatches)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetails(partner.id)}
                                title="View Details"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditPartner(partner.id)}
                                title="Edit Partner"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleTogglePartnerStatus(partner)}
                                title={partner.status === "Active" ? "Deactivate Partner" : "Activate Partner"}
                              >
                                {partner.status === "Active" ? (
                                  <ToggleRight className="h-4 w-4 text-green-600" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 text-gray-500" />
                                )}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setPartnerToDeleteId(partner.id)}
                                    title="Delete Partner"
                                  >
                                    <Trash className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the partner "{partner.name}". This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setPartnerToDeleteId(null)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleConfirmDeletePartner}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Terms</CardTitle>
              <CardDescription>
                Manage partner payment information and terms.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0 sm:p-6">
              <div className="min-w-[480px] sm:min-w-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PARTNER NAME</TableHead>
                      <TableHead>PAY TYPE</TableHead>
                      <TableHead>AMOUNT</TableHead>
                      <TableHead>PAYMENT TERMS</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Loading partners...
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-red-500"
                        >
                          Error: {error}
                        </TableCell>
                      </TableRow>
                    ) : Array.isArray(partners) ? (
                      partners.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell className="font-medium max-w-[160px] truncate md:whitespace-normal md:max-w-xs">
                            {partner.name}
                          </TableCell>
                          <TableCell>{partner.payType}</TableCell>
                          <TableCell>
                            {partner.payType === "Fixed"
                              ? `₹${partner.payAmount} per month`
                              : `${partner.payPercentage}% of revenue`}
                          </TableCell>
                          <TableCell>{partner.paymentTerms}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(partner.id)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="ml-2">View Details</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-red-500"
                        >
                          Error: Partners data is not an array
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="overflow-x-auto">
            <div className="min-w-[400px] sm:min-w-0">
            <PartnerPerformanceTab partners={partners} loading={loading} error={error} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AddPartnerDialog
        open={isAddPartnerOpen}
        onOpenChange={setIsAddPartnerOpen}
        onAddPartner={handleAddPartner}
      />

      <EditPartnerDialog
        open={isEditPartnerOpen}
        onOpenChange={setIsEditPartnerOpen}
        partner={selectedPartner}
        onEditPartner={handleUpdatePartner}
      />

      <PartnerDetailsDialog
        open={isViewDetailsOpen}
        onOpenChange={setIsViewDetailsOpen}
        partner={selectedPartner}
      />
    </div>
  );
};

export default PartnerManagement;
