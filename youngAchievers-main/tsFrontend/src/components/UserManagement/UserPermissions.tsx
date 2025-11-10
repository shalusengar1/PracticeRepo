
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { PermissionValue } from '@/types/permission'; // Updated import

export type Permission = {
  id: string;
  name: string;
  description: string;
  options?: {
    id: string;
    name: string;
    description: string;
  }[];
};

// export type PermissionValue = {
//   [key: string]: string | boolean | string[];
// };

interface UserPermissionsProps {
  values: PermissionValue;
  onChange: (values: PermissionValue) => void;
}
const availablePermissions: Permission[] = [
  {
    id: 'users',
    name: 'Users',
    description: 'Access to user management',
    options: [
      { id: 'view', name: 'View', description: 'Can view users' },
      { id: 'create', name: 'Create', description: 'Can create users' },
      { id: 'edit', name: 'Edit', description: 'Can edit users' },
      { id: 'delete', name: 'Delete', description: 'Can delete users' },
    ]
  },
  {
    id: 'batches',
    name: 'Batches',
    description: 'Access to batch management',
    options: [
      { id: 'view', name: 'View', description: 'Can view batches' },
      { id: 'create', name: 'Create', description: 'Can create batches' },
      { id: 'edit', name: 'Edit', description: 'Can edit batches' },
      { id: 'delete', name: 'Delete', description: 'Can delete batches' },
    ]
  },
  {
    id: 'venues',
    name: 'Venues',
    description: 'Access to venue management',
    options: [
      { id: 'view', name: 'View', description: 'Can view venues' },
      { id: 'create', name: 'Create', description: 'Can create venues' },
      { id: 'edit', name: 'Edit', description: 'Can edit venues' },
      { id: 'delete', name: 'Delete', description: 'Can delete venues' },
    ]
  },
  {
    id: 'reports',
    name: 'Reports',
    description: 'Access to reports',
    options: [
      { id: 'view', name: 'View', description: 'Can view reports' },
      { id: 'export', name: 'Export', description: 'Can export reports' },
    ]
  }
];


const UserPermissions: React.FC<UserPermissionsProps> = ({ values, onChange }) => {
  const handleToggleOption = (permissionId: string, optionId: string) => {
    const currentOptions = values[permissionId] || {};
    const newOptions = { ...currentOptions, [optionId]: !currentOptions[optionId] };
    onChange({ ...values, [permissionId]: newOptions });
  };

  const handleToggleAccess = (permissionId: string, checked: boolean) => {
    const permission = availablePermissions.find(p => p.id === permissionId);
    let updatedValues = { ...values };

    if (permission?.options) {
      const newOptions = permission.options.reduce((acc, option) => {
        acc[option.id] = checked;
        return acc;
      }, {} as Record<string, boolean>);
      updatedValues[permissionId] = newOptions;
    } 

    onChange(updatedValues);
  };




  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">User Permissions</h3>
      
      <div className="space-y-4">
        {availablePermissions.map((permission) => {
          const hasAccess = permission.options
          ? Object.values(values[permission.id] || {}).some(Boolean)
          : !!values[permission.id];

            
          return (
            <div key={permission.id} className="border rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={hasAccess}
                    onCheckedChange={(checked) => handleToggleAccess(permission.id, checked)}
                    id={`permission-${permission.id}`}
                  />
                  <Label htmlFor={`permission-${permission.id}`} className="font-medium">
                    {permission.name}
                  </Label>
                </div>
                <span className="text-sm text-muted-foreground">{permission.description}</span>
              </div>
              
              {permission.options && (
                <div className="ml-6 mt-2">
                  <Label className="mb-2 block text-sm">Access Level:</Label>
                  <div className="flex flex-wrap gap-2">
                    {permission.options.map((option) => {
                      const isSelected = values[permission.id]?.[option.id] || false;
                      return (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`permission-${permission.id}-${option.id}`}
                            checked={isSelected}
                            onCheckedChange={() => handleToggleOption(permission.id, option.id)}
                          />
                          <Label
                            htmlFor={`permission-${permission.id}-${option.id}`}
                            className="text-sm"
                          >
                            {option.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserPermissions;
