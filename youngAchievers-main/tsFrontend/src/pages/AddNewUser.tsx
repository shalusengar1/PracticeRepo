import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import UserPermissions from '../components/UserManagement/UserPermissions';
import { PermissionValue } from '@/types/permission';
import { useToast } from "@/hooks/use-toast";
import { validateFormData } from '@/utils/userValidation'; 
import { format } from 'date-fns';
import * as userActions from '@/store/user/userSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';

type UserRole = string;
type UserStatus = 'Active' | 'Inactive' | 'Pending';

interface UserFormData {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  profileImage: File | null;
  // Permissions
  permissions: PermissionValue;
  // Additional details
  dateOfBirth: string;
  employeeCode: string;
  joiningDate: string;
  address: string;
  alternateContact: string;
  documents: File[];
}

const AddNewUser: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { error, loading: isUserLoading } = useAppSelector((state) => state.users); // Use loading from userSlice
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Account Manager',
    status: 'Pending',
    profileImage: null,
    permissions: {
      users: { view: false, create: false, edit: false, delete: false },
      batches: { view: false, create: false, edit: false, delete: false },
      venues: { view: false, create: false, edit: false, delete: false },
      reports: { view: false, export: false },
    },
    dateOfBirth: '',
    employeeCode: '',
    joiningDate: '',
    address: '',
    alternateContact: '',
    documents: [],
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Clear error on mount and unmount
  useEffect(() => {
    dispatch(userActions.clearError());
    return () => {
      dispatch(userActions.clearError());
    };
  }, [dispatch]);

  // Handle API errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
        duration: 7000,
      });
      // Clear error after showing toast
      // Consider if this should be cleared here or if the thunk itself should handle it on success/failure
      dispatch(userActions.clearError());
    }
  }, [error, toast, dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Specific input restrictions
    let processedValue = value;
    if (name === "phone" || name === "alternateContact") {
      processedValue = value.slice(0, 10); // Limit to 10 digits
    }

    setFormData({
      ...formData,
      [name]: processedValue,
    });
  };

  const handlePermissionsChange = (permissions: PermissionValue) => {
    setFormData({
      ...formData,
      permissions
    });
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid image file (JPEG, PNG, JPG, or GIF)",
          variant: "destructive",
        });
        return;
      }
      
      const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: "Profile image must be less than 2MB.",
          variant: "destructive",
        });
        // Clear the file input if the file is too large
        if (fileInputRef.current) fileInputRef.current.value = "";
        setPreviewUrl(null); // Clear preview if file is invalid
        return;
      }

      // For new user, just store the file in form data
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
    } else {
      setFormData(prev => ({ ...prev, profileImage: null }));
      setPreviewUrl(null);
    }
  };

  const handleRemoveProfilePicture = () => {
    setFormData(prev => ({ ...prev, profileImage: null }));
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const MAX_DOC_SIZE = 15 * 1024 * 1024; // 15MB
    const validDocMimeTypes: Record<string, string> = {
      'application/pdf': 'PDF',
      'application/msword': 'Word Document (.doc)',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document (.docx)',
      'application/vnd.ms-excel': 'Excel Spreadsheet (.xls)',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet (.xlsx)',
      'image/jpeg': 'Image (.jpeg, .jpg)',
      'image/png': 'Image (.png)',
      'image/jpg': 'Image (.jpg)',
    };
    const allowedFileTypesDescription = "Allowed file types: PDF, Word (doc, docx), Excel (xls, xlsx), Images (jpeg, png, jpg).";

    const newFilesValidated: File[] = [];
    for (const file of files) {
      if (!Object.keys(validDocMimeTypes).includes(file.type)) {
        toast({ title: "Invalid File Type", description: `File "${file.name}" has an unsupported type. ${allowedFileTypesDescription}`, variant: "destructive", duration: 7000 });
        continue;
      }
      if (file.size > MAX_DOC_SIZE) {
        toast({ title: "File Too Large", description: `File "${file.name}" exceeds 15MB.`, variant: "destructive" });
        continue;
      }
      newFilesValidated.push(file);
    }

    if (newFilesValidated.length > 0) {
      setFormData({
        ...formData,
        documents: [...formData.documents, ...newFilesValidated],
      });
    }
    // Clear the file input so the same file can be selected again if removed and re-added
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateFormData(formData);
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join("\n"),
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    // Transform the data before sending it
    const transformedData = {
      first_name: formData.firstName,
      last_name: formData.lastName || null,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      status: formData.status.toLowerCase(),
      date_of_birth: formData.dateOfBirth || null,
      employee_code: formData.employeeCode || null,
      joining_date: formData.joiningDate || null,
      alternate_contact: formData.alternateContact,
      address: formData.address,
      permissions: formData.permissions,
    };

    const formDataToSend = new FormData();
    formDataToSend.append('data', JSON.stringify(transformedData));

    if (formData.profileImage) {
      formDataToSend.append('profileImage', formData.profileImage);
    }

    formData.documents.forEach((file, index) => {
      formDataToSend.append(`documents[${index}]`, file);
    });

    try {
      // Dispatch createUser with the complete FormData
      // The backend's `store` method will handle user creation, profile image, and documents.
      await dispatch(userActions.createUser(formDataToSend)).unwrap();

      toast({
        title: "Success",
        description: "User created successfully!",
      });
      navigate('/users');
    } catch (error: any) {
      // Error is already handled by the Redux thunk and displayed via the useEffect above
      console.error('Error creating user from component:', error);
    }
  };


  const triggerProfileImageUpload = () => {
    fileInputRef.current?.click();
  };

  const triggerDocumentsUpload = () => {
    documentInputRef.current?.click();
  };

  const removeDocument = (index: number) => {
    const updatedDocs = [...formData.documents];
    updatedDocs.splice(index, 1);

    setFormData({
      ...formData,
      documents: updatedDocs,
    });
  };

  // Get yesterday's date in YYYY-MM-DD format for the max attribute
  const getMaxDateForDOB = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return format(yesterday, 'yyyy-MM-dd');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/users')}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={24} className="text-gray-500" />
        </button>
        <h1 className="text-3xl font-bold tracking-tight animate-fade-in">
          Add New User
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3 mb-6">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="additional">Additional Details</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6">
            <TabsContent value="basic" className="space-y-6">
              <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
                {/* Wrapper for Profile Image and Recommendation Text */}
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 relative rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Profile preview"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={48} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    {previewUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveProfilePicture}
                        className="p-2 bg-red-500/80 text-white rounded-full hover:bg-red-600/90 transition-colors"
                        title="Remove profile picture"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-brand-purple/80 text-white rounded-full hover:bg-purple-700/90 transition-colors"
                      title="Upload profile picture"
                    >
                      <Upload size={16} />
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProfileImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="text-sm text-gray-500 text-center mt-2">
                    <p>Recommended: Square image, at least 300x300px</p>
                    <p>Images below 2MB should be uploaded.</p>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name*
                    </label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name*
                    </label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email*
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number*
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={10} // Restrict input to 10 characters
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Role*
                    </label>
                    <select
                      id="role"
                      name="role"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple transition duration-200"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Account Manager">Account Manager</option>
                      <option value="Facility Manager">Facility Manager</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status*
                    </label>
                    <select
                      id="status"
                      name="status"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple transition duration-200"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="permissions">
              <UserPermissions
                values={formData.permissions}
                onChange={handlePermissionsChange}
              />
            </TabsContent>

            <TabsContent value="additional" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    max={getMaxDateForDOB()} // Add max attribute here
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="employeeCode" className="block text-sm font-medium text-gray-700">
                    Employee Code
                  </label>
                  <Input
                    id="employeeCode"
                    name="employeeCode"
                    type="text"
                    value={formData.employeeCode}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="joiningDate" className="block text-sm font-medium text-gray-700">
                    Joining Date
                  </label>
                  <Input
                    id="joiningDate"
                    name="joiningDate"
                    type="date"
                    value={formData.joiningDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="alternateContact" className="block text-sm font-medium text-gray-700">
                    Alternate Contact
                  </label>
                  <Input
                    id="alternateContact"
                    name="alternateContact"
                    type="tel"
                    value={formData.alternateContact}
                    onChange={handleChange}
                    maxLength={10} // Restrict input to 10 characters
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <Textarea
                    id="address"
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Documents & Certificates
                  </label>

                  <div className="border border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
                    <button
                      type="button"
                      onClick={triggerDocumentsUpload}
                      className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      <Upload className="inline-block mr-2" size={16} />
                      Upload Documents
                    </button>
                    <p className="text-sm text-gray-500 mt-2">Upload certificates, ID proof, or other documents</p>
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Supported types: PDF, DOC, DOCX, XLS, XLSX, JPEG, PNG, JPG. Max size: 15MB per document.
                    </p>
                    <input
                      type="file"
                      ref={documentInputRef}
                      onChange={handleDocumentsChange}
                      multiple
                      className="hidden"
                    />
                  </div>

                  {formData.documents.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Uploaded Documents:</p>
                      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
                        {formData.documents.map((file, index) => (
                          <li key={`new-${index}-${file.name}`} className="flex items-center justify-between p-3 hover:bg-gray-50">
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-800 truncate block" title={file.name}>
                                {file.name}
                              </span>
                              <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => removeDocument(index)}
                                className="ml-3 text-red-500 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-brand-purple text-white font-medium shadow-sm hover:bg-purple-700 transition-colors"
                disabled={isUserLoading} // Use loading state from Redux
              >
                {isUserLoading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </Tabs>
      </div>
    </div>
  );
};

export default AddNewUser;
