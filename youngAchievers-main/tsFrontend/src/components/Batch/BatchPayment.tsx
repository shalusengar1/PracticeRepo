
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';

interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  description: string;
}

interface ProrationSettings {
  enabled: boolean;
  prorationMethod: 'daily' | 'weekly' | 'none';
  billingCycleDay?: number;
}

interface PaymentConfig {
  type: 'fixed' | 'recurring' | 'subscription';
  paymentModel: 'monthly' | 'subscription';
  currency: string;
  amount: number;
  duration?: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  hasDiscount: boolean;
  discountPercent?: number;
  proration?: ProrationSettings;
}

interface BatchPaymentProps {
  batchId: string;
  batchName: string;
  batchType: 'fixed' | 'recurring';
  paymentConfig: PaymentConfig;
  paymentHistory: PaymentHistoryItem[];
  onUpdatePaymentConfig: (config: PaymentConfig) => void;
  calculateProratedPayment: (joinDate: Date, amount: number, method?: 'daily' | 'weekly' | 'none') => number;
}

const BatchPayment: React.FC<BatchPaymentProps> = ({
  batchId,
  batchName,
  batchType,
  paymentConfig,
  paymentHistory,
  onUpdatePaymentConfig,
  calculateProratedPayment
}) => {
  const [config, setConfig] = useState<PaymentConfig>(paymentConfig);
  const { toast } = useToast();

  const handleConfigChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProrationChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      proration: {
        ...prev.proration as ProrationSettings,
        [field]: value
      }
    }));
  };

  const saveChanges = () => {
    onUpdatePaymentConfig(config);
    toast({
      title: "Payment Configuration Updated",
      description: "Your changes have been saved successfully.",
    });
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch(status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'refunded': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Management for {batchName}</CardTitle>
          <CardDescription>
            Manage payment configurations and view payment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="config">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="history">Payment History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="config" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Fee Type</Label>
                  <div className="text-sm font-medium">{config.type}</div>
                  <p className="text-xs text-muted-foreground">
                    {config.type === 'fixed' 
                      ? 'One-time payment for the entire program' 
                      : 'Recurring payment on a subscription basis'}
                  </p>
                </div>
                
                {config.type === 'recurring' && (
                  <div className="space-y-2">
                    <Label htmlFor="paymentModel">Payment Model</Label>
                    <Select 
                      value={config.paymentModel} 
                      onValueChange={(value) => handleConfigChange('paymentModel', value)}
                    >
                      <SelectTrigger id="paymentModel">
                        <SelectValue placeholder="Select payment model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="subscription">Subscription</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <Input 
                      id="amount"
                      type="number"
                      value={config.amount}
                      onChange={(e) => handleConfigChange('amount', Number(e.target.value))}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                      {config.currency}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={config.currency} 
                    onValueChange={(value) => handleConfigChange('currency', value)}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">₹ (INR)</SelectItem>
                      <SelectItem value="USD">$ (USD)</SelectItem>
                      <SelectItem value="EUR">€ (EUR)</SelectItem>
                      <SelectItem value="GBP">£ (GBP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 py-2">
                <Switch
                  id="hasDiscount"
                  checked={config.hasDiscount}
                  onCheckedChange={(checked) => handleConfigChange('hasDiscount', checked)}
                />
                <Label htmlFor="hasDiscount">Apply Discount</Label>
              </div>
              
              {config.hasDiscount && (
                <div className="pl-6 pb-2">
                  <div className="space-y-2 w-full sm:w-1/2">
                    <Label htmlFor="discountPercent">Discount Percentage</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="discountPercent"
                        type="number"
                        min="0"
                        max="100"
                        value={config.discountPercent || 0}
                        onChange={(e) => handleConfigChange('discountPercent', Number(e.target.value))}
                      />
                      <span>%</span>
                    </div>
                  </div>
                </div>
              )}
              
              {config.type === 'recurring' && (
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-medium">Proration Settings</h3>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="prorationEnabled"
                      checked={(config.proration?.enabled) || false}
                      onCheckedChange={(checked) => handleProrationChange('enabled', checked)}
                    />
                    <Label htmlFor="prorationEnabled">Enable proration for mid-cycle joins</Label>
                  </div>
                  
                  {config.proration?.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Proration Method</Label>
                        <RadioGroup
                          defaultValue={(config.proration?.prorationMethod) || 'daily'}
                          onValueChange={(value) => handleProrationChange('prorationMethod', value)}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="daily" id="daily" />
                            <Label htmlFor="daily">Daily (most precise)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="weekly" id="weekly" />
                            <Label htmlFor="weekly">Weekly</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="none" id="none" />
                            <Label htmlFor="none">None (full payment)</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      {config.proration?.prorationMethod !== 'none' && (
                        <div className="space-y-2">
                          <Label htmlFor="billingCycleDay">Billing Cycle Day</Label>
                          <Input
                            id="billingCycleDay"
                            type="number"
                            min="1"
                            max="28"
                            value={config.proration?.billingCycleDay || 1}
                            onChange={(e) => handleProrationChange('billingCycleDay', Number(e.target.value))}
                            className="w-20"
                          />
                          <p className="text-xs text-muted-foreground">
                            Day of month when regular billing occurs
                          </p>
                        </div>
                      )}
                      
                      <div className="bg-muted/50 p-3 rounded-md">
                        <h4 className="text-sm font-medium mb-2">Example</h4>
                        <p className="text-xs">
                          If a student joins on April 15th with a monthly fee of {config.currency} {config.amount}:
                        </p>
                        <p className="text-sm font-medium mt-2">
                          Prorated fee: {config.currency} {calculateProratedPayment(new Date(2025, 3, 15), config.amount, (config.proration?.prorationMethod) as 'daily' | 'weekly' | 'none')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <div className="pt-4">
                <Button onClick={saveChanges}>Save Changes</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <div className="overflow-x-auto">
                <table className="w-full mt-4">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-2 text-sm font-medium">Date</th>
                      <th className="text-left px-4 py-2 text-sm font-medium">Description</th>
                      <th className="text-left px-4 py-2 text-sm font-medium">Amount</th>
                      <th className="text-left px-4 py-2 text-sm font-medium">Method</th>
                      <th className="text-left px-4 py-2 text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id} className="border-b">
                        <td className="px-4 py-3 text-sm">{payment.date}</td>
                        <td className="px-4 py-3 text-sm">{payment.description}</td>
                        <td className="px-4 py-3 text-sm">{config.currency} {payment.amount}</td>
                        <td className="px-4 py-3 text-sm">{payment.method}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchPayment;