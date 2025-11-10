import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { fetchPartners } from '@/store/partner/partnerSlice';
import { useAppDispatch } from '@/hooks/reduxHooks/hooks';
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
}

interface AddPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPartner: (partner: Omit<Partner, "id">) => void;
}

// Basic email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Basic mobile validation regex (allows digits, optional +, and common lengths)
const mobileRegex = /^\+?[0-9]{10,15}$/;

const AddPartnerDialog: React.FC<AddPartnerDialogProps> = ({ open, onOpenChange, onAddPartner }) => {
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [payType, setPayType] = useState<"Fixed" | "Revenue Share">("Fixed");
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payPercentage, setPayPercentage] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState('Monthly');
  const [tdsPercentage, setTdsPercentage] = useState<number>(0);
  const [assignedBatches, setAssignedBatches] = useState<BatchInfo[]>([]);
  const { toast } = useToast();

  const dispatch = useAppDispatch();

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (!/^\d*$/.test(value)) {
      return;
    }

    if (name === 'tdsPercentage') {
      if (value === '') {
        setTdsPercentage(0);
        return;
      }
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue <= 100) {
        setTdsPercentage(numValue);
      }
    }
  };

  const validateForm = () => {
    const errors = validatePartnerForm({
      name,
      specialization,
      email,
      mobile,
      status: "Active",
      payType,
      payAmount: payType === 'Fixed' ? payAmount : undefined,
      payPercentage: payType === 'Revenue Share' ? payPercentage : undefined,
      tdsPercentage,
      paymentTerms,
    });
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors[0],
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
   
    if (!validateForm()) {
      return;
    }
    const newPartner: Omit<Partner, "id"> = {
      name,
      specialization,
      email,
      mobile,
      status: "Active",
      payType,
      paymentTerms,
      tdsPercentage: Number(tdsPercentage),
      assignedBatches,
    };

    if (payType === "Fixed") {
      newPartner.payAmount = Number(payAmount);
    } else {
      newPartner.payPercentage = Number(payPercentage);
    }

    await onAddPartner(newPartner); 
    // await dispatch(fetchPartners()); 
    resetForm();
    onOpenChange(false); 
  };

  const resetForm = () => {
    setName('');
    setSpecialization('');
    setEmail('');
    setMobile('');
    setPayType("Fixed");
    setPayAmount(0);
    setPayPercentage(0);
    setPaymentTerms('Monthly');
    setTdsPercentage(0);
    setAssignedBatches([]);
  };

  const handleDialogStateChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm(); // Reset the form when the dialog is closing
    }
    onOpenChange(isOpen); // Call the original onOpenChange passed from the parent
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogStateChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Partner</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">
            Add a new instructor or coach to partner with.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="name">Partner Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => {
                const MAX_NAME_LENGTH = 50;
                if (e.target.value.length > MAX_NAME_LENGTH) {
                  return; // Prevent typing if length exceeds limit
                }
                setName(e.target.value);
              }} 
              placeholder="Enter partner's full name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input 
              id="specialization" 
              value={specialization} 
              onChange={(e) => setSpecialization(e.target.value)} 
              placeholder="e.g. Chess Instructor, Tennis Coach"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="partner@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Phone</Label>
              <Input 
                id="mobile" 
                value={mobile} 
                onChange={(e) => setMobile(e.target.value)} 
                placeholder="e.g. 1234567XXX"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Payment Type</Label>
            <RadioGroup value={payType} onValueChange={(value: "Fixed" | "Revenue Share") => setPayType(value)} className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Fixed" id="fixed-payment" />
                <Label htmlFor="fixed-payment">Fixed Payment</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Revenue Share" id="revenue-sharing" />
                <Label htmlFor="revenue-sharing">Revenue Sharing</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tdsPercentage">TDS Percentage </Label>
            <Input
              id="tdsPercentage"
              name="tdsPercentage"
              type="number" 
              inputMode="numeric"
              value={tdsPercentage}
              onChange={handleNumberChange}
              placeholder="Enter TDS percentage (e.g. 10)"
            />
          </div>
          
          {payType === "Fixed" ? (
            <div className="space-y-2">
              <Label htmlFor="payAmount">Fixed Amount</Label>
              <Input 
                id="payAmount" 
                type="number" 
                min="0" 
                value={payAmount || 0} 
                onChange={(e) => {
                  const { value } = e.target;

                  // Only allow digits
                  if (!/^\d*$/.test(value)) {
                    return;
                  }

                  // Limit to 8 digits
                  const MAX_DIGITS = 8;
                  if (value.length > MAX_DIGITS) {
                    return;
                  }
                  setPayAmount(value === '' ? 0 : parseInt(value, 10));
                }}
                placeholder="Enter amount" 
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="payPercentage">Pay Percentage (%)</Label>
              <Input 
                id="payPercentage" 
                type="number" 
                min="0" 
                max="100"
                value={payPercentage || 0} 
                onChange={(e) => {
                  const value = e.target.value;
                  setPayPercentage(value === '' ? 0 : parseFloat(value)); 
                }}
                placeholder="Enter percentage" 
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Payment Schedule</Label>
            <Select value={paymentTerms} onValueChange={setPaymentTerms}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment schedule" />
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
          

          <div className="pt-4 flex justify-end">
            <DialogClose asChild>
              <Button variant="outline" className="mr-2">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit}>Create Partner</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPartnerDialog;
