import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PartnerAttendanceCalendar from "./PartnerAttendanceCalendar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TruncatedText } from "@/components/ui/truncated-text";


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
  tdsPercentage?: number | null;
  assignedBatches?: BatchInfo[];
  attendance?: {
    [batch: string]: {
      date: string;
      status: "Present" | "Absent" | "Late";
      startTime?: string;
      endTime?: string;
    }[];
  };
}

interface PartnerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: Partner | null;
}

// Function to truncate email if longer than 50 characters
const displayEmail = (email: string) => {

    console.log(email.length)

  if (email.length > 30) {

    return email.substring(0, 30) + "...";
  }
  return email;
};

const PartnerDetailsDialog: React.FC<PartnerDetailsDialogProps> = ({
  open,
  onOpenChange,
  partner,
}) => {
  if (!partner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Partner Details</DialogTitle>
          <DialogDescription>
            Detailed information for {partner.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{partner.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Specialization</p>
                <p className="font-medium">{partner.specialization}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{partner.mobile}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge 
                  variant={partner.status === "Active" ? "outline" : "destructive"}
                  className={partner.status === "Active" ? "bg-green-50 text-green-700" : ""}
                >
                  {partner.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="font-medium cursor-default overflow-hidden whitespace-nowrap"> 
                        {displayEmail(partner.email)}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs break-words p-2 rounded-md shadow-lg">
                      <p>{partner.email}</p> {/* Full email in tooltip */}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </Card>
          
          {/* Payment Information */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Payment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Pay Type</p>
                <p className="font-medium">{partner.payType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Amount</p>
                <p className="font-medium">
                  {partner.payType === "Fixed" 
                    ? `₹${partner.payAmount} per month` 
                    : `${partner.payPercentage}% of revenue`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Terms</p>
                <p className="font-medium">{partner.paymentTerms}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">TDS Percentage</p>
                <p className="font-medium">{partner.tdsPercentage !== null && partner.tdsPercentage !== undefined ? `${partner.tdsPercentage}%` : 'N/A'}</p>
              </div>
            </div>
          </Card>
          
          {/* Assigned Batches */}
          {partner.assignedBatches && partner.assignedBatches.length > 0 && (
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Assigned Batches</h3>
              <div className="flex flex-wrap gap-2">
                {partner.assignedBatches.map((batch, index) => (
                  <Badge key={index} variant="secondary" className="bg-purple-50 text-purple-700">
                    <TruncatedText text={batch.name} maxLength={30} />
                  </Badge>
                ))}
              </div>
            </Card>
          )}
          
          {/* Attendance Timeline */}
          {partner.attendance && Object.keys(partner.attendance).length > 0 && (
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Attendance Timeline</h3>
              <PartnerAttendanceCalendar attendance={partner.attendance} />
            </Card>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerDetailsDialog;
