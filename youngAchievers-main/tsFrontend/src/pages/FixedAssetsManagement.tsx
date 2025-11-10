
import React from 'react';
import FixedAssetsInventory from '@/components/Batch/FixedAssetsInventory';

const FixedAssetsManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight animate-fade-in">
        Fixed Assets Management
      </h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
        <FixedAssetsInventory />
      </div>
    </div>
  );
};

export default FixedAssetsManagement;
