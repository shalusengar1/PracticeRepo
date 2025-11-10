
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import { fetchBatches } from '@/store/batch/batchSlice';
import batchService from '@/api/batchService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const BatchReporting: React.FC = () => {
  const dispatch = useAppDispatch();
  const { batches } = useAppSelector((state) => state.batch);
  const [batchesSummary, setBatchesSummary] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | undefined>(undefined);
  const [batchReport, setBatchReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Status distribution data with colors
  const statusData = [
    { name: 'Active', value: 0, color: '#10B981' },
    { name: 'Completed', value: 0, color: '#6366F1' },
    { name: 'Pending', value: 0, color: '#F59E0B' },
    { name: 'Cancelled', value: 0, color: '#EF4444' },
  ];

  useEffect(() => {
    dispatch(fetchBatches());
    fetchBatchesSummary();
  }, [dispatch]);

  useEffect(() => {
    if (selectedBatchId) {
      fetchBatchReport(parseInt(selectedBatchId));
    } else {
      setBatchReport(null);
    }
  }, [selectedBatchId]);

  const fetchBatchesSummary = async () => {
    try {
      setLoading(true);
      const summaries = await batchService.getBatchesSummary();
      setBatchesSummary(summaries || []);
      
      // Update status distribution counts
      if (summaries && summaries.length > 0) {
        const statusCounts: Record<string, number> = {
          active: 0,
          completed: 0,
          pending: 0,
          cancelled: 0
        };
        
        summaries.forEach((batch: any) => {
          const status = batch.status?.toLowerCase() || 'pending';
          if (statusCounts[status] !== undefined) {
            statusCounts[status]++;
          } else {
            statusCounts.pending++;
          }
        });
        
        statusData[0].value = statusCounts.active;
        statusData[1].value = statusCounts.completed;
        statusData[2].value = statusCounts.pending;
        statusData[3].value = statusCounts.cancelled;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch batches summary",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchReport = async (batchId: number) => {
    try {
      setLoading(true);
      const report = await batchService.getBatchReport(batchId);
      setBatchReport(report);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch batch report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Prepare occupancy data for chart
  const occupancyData = batchesSummary
    .filter(batch => batch.occupancy_rate !== undefined)
    .slice(0, 5)  // Take only first 5 for readability
    .map(batch => ({
      name: batch.name || 'Unnamed Batch',
      occupancy: parseFloat(batch.occupancy_rate) || 0
    }));

  // Calculate average occupancy
  const avgOccupancy = batchesSummary.length > 0 
    ? Math.round(
        batchesSummary.reduce((sum, batch) => sum + (parseFloat(batch.occupancy_rate) || 0), 0) / 
        batchesSummary.length
      ) 
    : 0;

  // Calculate total enrollment
  const totalEnrollment = batchesSummary.reduce((sum, batch) => sum + (batch.student_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Batch selector */}
      {batches.length > 0 && (
        <div className="w-full max-w-md">
          <Select 
            value={selectedBatchId} 
            onValueChange={(value) => setSelectedBatchId(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a batch for detailed reporting" />
            </SelectTrigger>
            <SelectContent>
              {batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Batches</CardTitle>
                <CardDescription>Current active batches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{batchesSummary.length}</div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  {batchesSummary.filter(b => b.status?.toLowerCase() === 'active').length} active batches
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Avg. Occupancy Rate</CardTitle>
                <CardDescription>Across all batches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{avgOccupancy}%</div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  Based on {batchesSummary.length} batches
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Enrollment</CardTitle>
                <CardDescription>Participants across all batches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalEnrollment}</div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  Average of {Math.round(totalEnrollment / (batchesSummary.length || 1))} per batch
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed batch report if selected */}
          {batchReport && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Batch Details: {batchReport.batch_name}</CardTitle>
                <CardDescription>
                  {batchReport.program_name} | {batchReport.venue_name} {batchReport.venue_spot_name ? `- ${batchReport.venue_spot_name}` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium text-sm text-gray-500 mb-1">Students</h3>
                    <p className="text-xl font-bold">{batchReport.student_count} / {batchReport.capacity}</p>
                    <p className="text-xs text-gray-600">{batchReport.occupancy_rate}% occupancy</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium text-sm text-gray-500 mb-1">Sessions</h3>
                    <p className="text-xl font-bold">{batchReport.completed_sessions} / {batchReport.session_count}</p>
                    <p className="text-xs text-gray-600">{batchReport.completion_rate}% completed</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium text-sm text-gray-500 mb-1">Status</h3>
                    <p className="text-xl font-bold capitalize">{batchReport.status}</p>
                    <p className="text-xs text-gray-600">{batchReport.upcoming_sessions} upcoming sessions</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium text-sm text-gray-500 mb-1">Revenue</h3>
                    <p className="text-xl font-bold">{batchReport.currency} {batchReport.amount}</p>
                    <p className="text-xs text-gray-600">Per student amount</p>
                  </div>
                </div>
                
                {/* Next session info if available */}
                {batchReport.next_session && (
                  <div className="mt-6 bg-blue-50 p-4 rounded-md">
                    <h3 className="font-medium">Next Session</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                      <p><span className="text-gray-500">Date:</span> {new Date(batchReport.next_session.date).toLocaleDateString()}</p>
                      <p><span className="text-gray-500">Time:</span> {batchReport.next_session.start_time} - {batchReport.next_session.end_time}</p>
                      <p><span className="text-gray-500">Status:</span> {batchReport.next_session.status}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Batch Occupancy Rates</CardTitle>
                <CardDescription>Showing occupancy percentage by batch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      width={500}
                      height={300}
                      data={occupancyData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="occupancy" fill="#8884d8" name="Occupancy %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Batch Status Distribution</CardTitle>
                <CardDescription>Overview of batch statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart width={400} height={300}>
                      <Pie
                        data={statusData.filter(item => item.value > 0)} // Only show statuses with values
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default BatchReporting;
