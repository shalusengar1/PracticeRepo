import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { validatePartnerForm } from '@/utils/partnerValidation';

interface BatchInfo {
  id: number;
  name: string;
  status?: string;
  pivot?: any;
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
  tdsPercentage?: number | null;
  paymentTerms: string;
  assignedBatches?: BatchInfo[];
  attendance?: {
    [batch: string]: {
      date: string;
      status: "Present" | "Absent" | "Late";
    }[];
  };
}

interface EditPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: Partner | null;
  onEditPartner: (id: number, updatedPartner: Partial<Partner>) => void;
}

const EditPartnerDialog: React.FC<EditPartnerDialogProps> = ({
  open,
  onOpenChange,
  partner,
  onEditPartner,
}) => {
  const [formData, setFormData] = useState<Partial<Partner>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name,
        specialization: partner.specialization,
        email: partner.email,
        mobile: partner.mobile,
        status: partner.status,
        payType: partner.payType,
        payAmount: partner.payAmount ?? 0,
        payPercentage: partner.payPercentage ?? 0,
        paymentTerms: partner.paymentTerms,
        tdsPercentage: partner.tdsPercentage ?? 0, // Initialize with 0 or existing value
      });
    }
  }, [partner]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Prevent typing if 'name' field exceeds 50 characters
    if (name === 'name') {
      const MAX_NAME_LENGTH = 50;
      if (value.length > MAX_NAME_LENGTH) {
        return; // Do not update state if length exceeds limit
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Only allow digits or an empty string.
    if (!/^\d*$/.test(value)) {
      return;
    }

    if (name === 'payAmount') {
      const MAX_DIGITS = 8;
      if (value.length > MAX_DIGITS) {
        return; // Prevent typing more than 8 digits
      }
      setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : parseInt(value, 10) }));
    } else if (name === 'payPercentage' || name === 'tdsPercentage') {
      const numValue = parseInt(value, 10);
      const MAX_PERCENTAGE = 100;

      if (value === '') {
        setFormData(prev => ({ ...prev, [name]: 0 }));
        return;
      }

      if (!isNaN(numValue) && numValue <= MAX_PERCENTAGE) {
        setFormData(prev => ({ ...prev, [name]: numValue }));
      }
    } else {
      const numValue = parseInt(value, 10);
      setFormData(prev => ({ ...prev, [name]: !isNaN(numValue) ? numValue : 0 }));
    }
  };

  const handleSubmit = async () => {
    if (!partner) return;

    const errors = validatePartnerForm({
      name: formData.name || '',
      specialization: formData.specialization || '',
      email: formData.email || '',
      mobile: formData.mobile || '',
      status: formData.status,
      payType: formData.payType as "Fixed" | "Revenue Share",
      payAmount: formData.payType === 'Fixed' ? Number(formData.payAmount) : undefined,
      payPercentage: formData.payType === 'Revenue Share' ? Number(formData.payPercentage) : undefined,
      tdsPercentage: formData.tdsPercentage,
      paymentTerms: formData.paymentTerms || '',
    });
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors[0],
        variant: "destructive"
      });
      return;
    }
    await onEditPartner(partner.id, formData);
    onOpenChange(false); 
  };

  if (!partner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Partner</DialogTitle>
          <DialogDescription>
            Update the details for {partner.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className="col-span-2"
              placeholder="Enter partner name"
            />
          </div>
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="specialization" className="text-right">Specialization</Label>
            <Input
              id="specialization"
              name="specialization"
              value={formData.specialization || ''}
              onChange={handleChange}
              className="col-span-2"
              placeholder="Enter specialization"
            />
          </div>
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="col-span-2"
              placeholder="Enter email address"
            />
          </div>
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="mobile" className="text-right">Phone</Label>
            <Input
              id="mobile"
              name="mobile"
              value={formData.mobile || ''}
              onChange={handleChange}
              className="col-span-2"
              placeholder="Enter phone number"
            />
          </div>
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange('status', value as "Active" | "Inactive")}
            >
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="payType" className="text-right">Pay Type</Label>
            <Select
              value={formData.payType}
              onValueChange={(value) => handleSelectChange('payType', value as "Fixed" | "Revenue Share")}
            >
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="Select pay type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fixed">Fixed</SelectItem>
                <SelectItem value="Revenue Share">Revenue Share</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="tdsPercentage" className="text-right">TDS Percentage</Label>
            <Input
              id="tdsPercentage"
              name="tdsPercentage"
              type="number"
              min="0"
              max="100"
              value={formData.tdsPercentage ?? 0} // Use ?? 0 to default to 0
              onChange={handleNumberChange}
              className="col-span-2"
              placeholder="Enter TDS percentage (0-100)"
            />
          </div>
          
          {formData.payType === "Fixed" ? (
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="payAmount" className="text-right">Pay Amount</Label>
              <Input
                id="payAmount"
                name="payAmount"
                type="number"
                min="0" 
                value={formData.payAmount || 0}
                onChange={handleNumberChange}
                className="col-span-2"
                placeholder="Enter pay amount"
              />
            </div>
          ) : (
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="payPercentage" className="text-right">Pay Percentage (%)</Label>
              <Input
                id="payPercentage"
                name="payPercentage"
                type="number"
                min="0" 
                max="100"
                value={formData.payPercentage || 0}
                onChange={handleNumberChange}
                className="col-span-2"
                placeholder="Enter pay percentage (0-100)"
              />
            </div>
          )}
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="paymentTerms" className="text-right">Payment Terms</Label>
            <Select
              value={formData.paymentTerms}
              onValueChange={(value) => handleSelectChange('paymentTerms', value)}
            >
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monthly">Monthly</SelectItem>
                {/* <SelectItem value="After each batch">After each batch</SelectItem>
                <SelectItem value="Before batch commencement">Before batch commencement</SelectItem>
                <SelectItem value="15 days after batch completion">15 days after batch completion</SelectItem>
                <SelectItem value="30 days after batch completion">30 days after batch completion</SelectItem> */}
              </SelectContent>
            </Select>
          </div>

        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPartnerDialog;
