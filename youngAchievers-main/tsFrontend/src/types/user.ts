// src/types/user.ts
import { PermissionValue } from '@/types/permission';

export interface UserFromBackend {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  role: string;
  permission: PermissionValue;
  status: string;
  date_of_birth: string | null;
  employee_code: string | null;
  joining_date: string | null;
  alternate_contact: string | null;
  documents: any | null;
  profile_image?: string | null;
}

export interface UserData {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Pending';
  password?: string; // Make password optional
  confirmPassword?: string; // Make confirmPassword optional
  profileImage?: File | null;
  // Permissions
  permissions: PermissionValue;
  // Additional details
  dateOfBirth?: string;
  employeeCode?: string;
  joiningDate?: string;
  address: string;
  alternateContact?: string;
  documents?: File[];
}

export interface TruncatedUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Pending';
  profileImage: File | null;
  permissions: PermissionValue;
  // Additional details
  dateOfBirth: string;
  employeeCode: string;
  joiningDate: string;
  address: string;
  alternateContact: string;
  documents: File[];
  password?: string;
  confirmPassword?: string;
}

export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Pending';
  permissions: PermissionValue;
  dateOfBirth?: string;
  employeeCode?: string;
  joiningDate?: string;
  address: string;
  alternateContact?: string;
  profilePicture?: string;
  documents: File[];
}
