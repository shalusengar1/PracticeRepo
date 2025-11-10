
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Upload } from 'lucide-react';
import ImportUsersDialog from './ImportUsersDialog';

interface UserHeaderProps {
  title: string;
}

const UserHeader: React.FC<UserHeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight animate-fade-in mb-4 md:mb-0">
          {title}
        </h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setImportDialogOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Upload size={18} />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => navigate('/users/new')}
            className="flex items-center gap-2 bg-brand-purple text-white px-4 py-2 rounded-md shadow-sm hover:bg-purple-700 transition-colors"
          >
            <PlusCircle size={18} />
            <span>Add New User</span>
          </button>
        </div>
      </div>
      
      <ImportUsersDialog 
        open={importDialogOpen} 
        onOpenChange={setImportDialogOpen} 
      />
    </>
  );
};

export default UserHeader;
