import React, { useState, useRef, useEffect } from 'react';
import { Search, MoreHorizontal, Edit, Key, Mail, Power, Check, X, MapPin, Filter } from 'lucide-react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationNext, 
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { useNavigate } from 'react-router-dom';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import { fetchUsers, deleteUser, toggleUserStatus, clearError } from '@/store/user/userSlice';
import { useToast } from '@/hooks/use-toast';
import { UserData } from '@/types/user';
import ResetPasswordDialog from './ResetPasswordDialog';
import { TruncatedText } from '@/components/ui/truncated-text'; // Import TruncatedText
import { formatBackendError } from '@/utils/errorHandling';

// ShadCN UI DropdownMenu components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Sample data for initial state with permissions and address
// const initialUsers: User[] = [
//   { id: '1', name: 'John Doe', email: 'john.doe@example.com', phone: '+1 (555) 123-4567', address: '123 Main St, New York, NY 10001', role: 'Admin', permissions: ['Read', 'Write', 'Delete', 'Export'], status: 'Active' },
//   { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', phone: '+1 (555) 987-6543', address: '456 Park Ave, Boston, MA 02108', role: 'Account Manager', permissions: ['Read', 'Write'], status: 'Active' },
//   { id: '3', name: 'Michael Johnson', email: 'michael.j@example.com', phone: '+1 (555) 234-5678', address: '789 Broadway, Chicago, IL 60601', role: 'Facility Manager', permissions: ['Read'], status: 'Pending' },
//   { id: '4', name: 'Sarah Williams', email: 'sarah.w@example.com', phone: '+1 (555) 345-6789', address: '321 Oak Street, San Francisco, CA 94101', role: 'Account Manager', permissions: ['Read', 'Write'], status: 'Inactive' },
//   { id: '5', name: 'David Brown', email: 'david.b@example.com', phone: '+1 (555) 456-7890', address: '555 Pine Road, Miami, FL 33101', role: 'Facility Manager', permissions: ['Read'], status: 'Active' },
//   { id: '6', name: 'Emily Davis', email: 'emily.d@example.com', phone: '+1 (555) 567-8901', address: '777 Maple Lane, Seattle, WA 98101', role: 'Admin', permissions: ['Read', 'Write', 'Delete', 'Export'], status: 'Active' },
//   { id: '7', name: 'Robert Miller', email: 'robert.m@example.com', phone: '+1 (555) 678-9012', address: '888 Cedar Blvd, Austin, TX 78701', role: 'Account Manager', permissions: ['Read', 'Write'], status: 'Pending' },
//   { id: '8', name: 'Jennifer Wilson', email: 'jennifer.w@example.com', phone: '+1 (555) 789-0123', address: '999 Elm Street, Denver, CO 80201', role: 'Facility Manager', permissions: ['Read'], status: 'Active' },
//   { id: '9', name: 'Thomas Moore', email: 'thomas.m@example.com', phone: '+1 (555) 890-1234', address: '111 Birch Avenue, Portland, OR 97201', role: 'Admin', permissions: ['Read', 'Write', 'Delete'], status: 'Inactive' },
//   { id: '10', name: 'Lisa Anderson', email: 'lisa.a@example.com', phone: '+1 (555) 901-2345', address: '222 Spruce Drive, Atlanta, GA 30301', role: 'Account Manager', permissions: ['Read'], status: 'Active' },
//   { id: '11', name: 'James Taylor', email: 'james.t@example.com', phone: '+1 (555) 012-3456', address: '333 Willow Circle, Nashville, TN 37201', role: 'Facility Manager', permissions: ['Read'], status: 'Active' },
//   { id: '12', name: 'Patricia White', email: 'patricia.w@example.com', phone: '+1 (555) 123-4567', address: '444 Aspen Court, Las Vegas, NV 89101', role: 'Admin', permissions: ['Read', 'Write', 'Delete', 'Export'], status: 'Pending' },
// ];

// Create a custom hook for handling user errors
const useUserError = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const error = useAppSelector((state) => state.users.error);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      dispatch(clearError());
    }
  }, [error, toast, dispatch]);

  return { error };
};

// Address component with tooltip for long addresses
const AddressDisplay: React.FC<{ address: string }> = ({ address }) => {
  if (!address || address.trim() === "") {
    return (
      <div className="flex items-center gap-1">
        <MapPin size={14} className="text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-400 italic">Address not available</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 max-w-[200px]"> {/* Increased max-width slightly */}
      <MapPin size={14} className="text-gray-400 flex-shrink-0" />
      <TruncatedText text={address.trim()} maxLength={30} className="text-sm" />
    </div>
  );
};

// Role Badge component
const RoleBadge: React.FC<{ role: UserData['role'] }> = ({ role }) => {
  const badgeClass = {
    'Admin': 'badge-admin',
    'Account Manager': 'badge-faculty',
    'Facility Manager': 'badge-student',
  }[role];

  return (
    <span className={`badge ${badgeClass}`}>
      {role}
    </span>
  );
};

// Permission Badge component
const PermissionBadge: React.FC<{ permissions: string[] }> = ({ permissions }) => {
  if (permissions.length === 0) return <span className="text-sm text-gray-400">No permissions</span>;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-wrap gap-1 justify-center">
            {permissions.slice(0, 2).map((permission, index) => (
              <span key={index} className="badge badge-permission text-xs">
                {permission}
              </span>
            ))}
            {permissions.length > 2 && (
              <span className="badge badge-permission-more text-xs">
                +{permissions.length - 2}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            {permissions.join(', ')}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Status Badge component
const StatusBadge: React.FC<{ status: UserData['status'] }> = ({ status }) => {
  const config = {
    'Active': { class: 'badge-active', icon: Check },
    'Inactive': { class: 'badge-inactive', icon: X },
    'Pending': { class: 'badge-pending', icon: null },
  }[status];

  const Icon = config.icon;

  return (
    <span className={`badge ${config.class} flex items-center gap-1`}>
      {Icon && <Icon size={12} />}
      {status}
    </span>
  );
};

// Action Menu component
interface ActionMenuProps {
  user: UserData;
  onEdit: (user: UserData) => void;
  onResetPassword: (user: UserData) => void;
  onSendEmail: (user: UserData) => void;
  onDeactivate: (user: UserData) => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ 
  user, onEdit, onResetPassword, onSendEmail, onDeactivate 
}) => {
  const isActive = user.status === 'Active';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none" // Added focus:outline-none
          aria-label={`Actions for ${user.firstName} ${user.lastName}`}
        >
          <MoreHorizontal size={20} className="text-gray-500 mx-auto" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" sideOffset={5} collisionPadding={10} className="p-2">
          <DropdownMenuItem onClick={() => onEdit(user)}>
            <Edit size={16} className="mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onResetPassword(user)}>
            <Key size={16} className="mr-2" />
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSendEmail(user)}>
            <Mail size={16} className="mr-2" />
            Send Email
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onDeactivate(user)}
            className={
              isActive 
                ? "text-red-600 focus:bg-red-50 focus:text-red-700" 
                : "text-green-600 focus:bg-green-50 focus:text-green-700"
            }
          >
            <Power size={16} className="mr-2" />
            {isActive ? 'Deactivate' : 'Activate'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
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
        placeholder="Search users..."
        className="search-input"
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

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Account Manager', label: 'Account Manager' },
  { value: 'Facility Manager', label: 'Facility Manager' },
];
const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Pending', label: 'Pending' },
];

// Main UserList component
const UserList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, loading, pagination } = useAppSelector((state) => state.users);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserData | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const usersPerPage = 10;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Debounce and API cancellation refs
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use the custom error handling hook
  useUserError();

  // Debounced fetch users on search/page change
  useEffect(() => {
    // Cancel previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    // Cancel previous API request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    debounceRef.current = setTimeout(() => {
      dispatch(fetchUsers({
        page: currentPage,
        perPage: usersPerPage,
        search: searchQuery,
        paginate: true,
        signal: controller.signal,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }));
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [dispatch, currentPage, usersPerPage, searchQuery, roleFilter, statusFilter]);

  const handleEdit = (user: UserData) => {
    navigate(`/users/edit/${user.id}`);
  };

  const handleResetPassword = (user: UserData) => {
    setResetPasswordUser(user);
    setIsResetPasswordOpen(true);
  };

  const handleSendEmail = (user: UserData) => {
    console.log('Send email to:', user);
  };

  const handleDeactivate = async (user: UserData) => {
    const isActivating = user.status === 'Inactive';
    const actionWord = isActivating ? 'activate' : 'deactivate';
    
    if (window.confirm(`Are you sure you want to ${actionWord} ${user.firstName} ${user.lastName}?`)) {
      try {
        await dispatch(toggleUserStatus(user.id!)).unwrap();
        toast({
          title: "Success",
          description: `User ${actionWord}d successfully.`,
        });
      } catch (error: any) {
        // Error will be handled by the useUserError hook
        console.error(`Error ${actionWord}ing user:`, error);
      }
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search
  };

  // Use backend pagination info
  const totalPages = pagination?.last_page || 1;
  const currentUsers = users; // Already paginated from backend

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="w-full md:w-1/3 relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="search-input w-full pr-10 pl-10"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="min-w-[180px]">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="min-w-[180px]">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-cell">Name</th>
                <th className="table-cell">Email</th>
                <th className="table-cell">Phone</th>
                <th className="table-cell">Address</th>
                <th className="table-cell">Role</th>
                <th className="table-cell text-center">Status</th>
                <th className="table-cell text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && currentUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-10">
                    <p className="text-gray-500">Loading users...</p>
                  </td>
                </tr>
              )}
              {!loading && currentUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-10">
                    <p className="text-gray-500 text-lg">No users found.</p>
                    {searchQuery && <p className="text-gray-400 text-sm">Try adjusting your search criteria.</p>}
                  </td>
                </tr>
              )}
              {currentUsers.map(user => (
                <tr key={user.id} className="table-row">
                  <td className="table-cell">{user.firstName} {user.lastName}</td>
                  <td className="table-cell">
                    <TruncatedText text={user.email} type="email" className="text-sm" />
                  </td>
                  <td className="table-cell">{user.phone}</td>
                  <td className="table-cell">
                    <AddressDisplay address={user.address} />
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-col items-start gap-1">
                      <RoleBadge role={user.role} />
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    <div className="flex justify-center">
                      <StatusBadge status={user.status} />
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    <ActionMenu
                      user={user}
                      onEdit={handleEdit}
                      onResetPassword={handleResetPassword}
                      onSendEmail={handleSendEmail}
                      onDeactivate={handleDeactivate}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              // Only show 5 page links with ellipsis for others
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink 
                      isActive={pageNumber === currentPage}
                      onClick={() => setCurrentPage(pageNumber)}
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
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      <ResetPasswordDialog
        isOpen={isResetPasswordOpen}
        onClose={() => {
          setIsResetPasswordOpen(false);
          setResetPasswordUser(null);
        }}
        user={resetPasswordUser}
      />
    </div>
  );
};

export default UserList;
