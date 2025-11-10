
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data for the chart
const data = [
  { name: 'Jan', occupancy: 65 },
  { name: 'Feb', occupancy: 59 },
  { name: 'Mar', occupancy: 80 },
  { name: 'Apr', occupancy: 81 },
  { name: 'May', occupancy: 56 },
  { name: 'Jun', occupancy: 55 },
  { name: 'Jul', occupancy: 40 },
  { name: 'Aug', occupancy: 70 },
  { name: 'Sep', occupancy: 90 },
  { name: 'Oct', occupancy: 67 },
  { name: 'Nov', occupancy: 60 },
  { name: 'Dec', occupancy: 75 },
];

const VenueReporting: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Venue Occupancy Reporting</h3>
          <p className="text-sm text-gray-500">
            Historical data of occupancy and usage
          </p>
        </div>
        <div className="flex gap-4">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Venue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Venues</SelectItem>
              <SelectItem value="central">Central Hall</SelectItem>
              <SelectItem value="west">West Wing Conference Center</SelectItem>
              <SelectItem value="downtown">Downtown Office</SelectItem>
              <SelectItem value="harbor">Harbor View</SelectItem>
              <SelectItem value="mountain">Mountain Retreat</SelectItem>
            </SelectContent>
          </Select>
          
          <Select defaultValue="2023">
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
              <SelectItem value="2020">2020</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="h-[400px] border rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Occupancy %', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="occupancy" name="Occupancy %" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-sm text-gray-500">Average Occupancy</div>
          <div className="text-2xl font-bold">67%</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-500">Peak Occupancy</div>
          <div className="text-2xl font-bold">90%</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-gray-500">Total Events</div>
          <div className="text-2xl font-bold">245</div>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="text-sm text-gray-500">Revenue Generated</div>
          <div className="text-2xl font-bold">$145,670</div>
        </div>
      </div>
    </div>
  );
};

export default VenueReporting;
