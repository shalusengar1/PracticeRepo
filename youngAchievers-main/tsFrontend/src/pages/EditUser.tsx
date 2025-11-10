import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Upload, User, MapPin, Eye, EyeOff } from 'lucide-react'; // Added Eye, EyeOff
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge"; // Added Badge for "New" indicator
import UserPermissions from '../components/UserManagement/UserPermissions';
import { PermissionValue } from '@/types/permission';
import { useToast } from "@/hooks/use-toast";
import { UserFormData } from '@/types/user';
import { validateFormData } from '@/utils/userValidation';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import * as userActions from '@/store/user/userSlice';

type UserStatus = 'Active' | 'Inactive' | 'Pending';

interface DocumentFile {
  path: string; // GCS object name
  original_name: string;
  url: string; // Public URL
  size_kb?: number;
  mime_type?: string;
}
const EditUser: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { selectedUser, loading, error } = useAppSelector((state) => state.users);

  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Account Manager',
    status: 'Active',
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

  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState<string | null>(null);
  const [initialDocuments, setInitialDocuments] = useState<DocumentFile[]>([]);
  const [stagedNewFiles, setStagedNewFiles] = useState<File[]>([]);
  const [removedInitialPaths, setRemovedInitialPaths] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password visibility

  // Fetch user data based on ID and handle cleanup
  useEffect(() => {
    if (id) {
      dispatch(userActions.fetchUser(parseInt(id)));
    }
    // Clear error and selected user on mount and unmount
    dispatch(userActions.clearError());
    return () => {
      dispatch(userActions.clearSelectedUser());
      dispatch(userActions.clearError());
    };
  }, [id, dispatch]);

  // Update form data when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      setFormData({
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        email: selectedUser.email,
        phone: selectedUser.phone,
        role: selectedUser.role,
        status: selectedUser.status,
        profileImage: null,
        permissions: selectedUser.permissions,
        dateOfBirth: selectedUser.dateOfBirth,
        employeeCode: selectedUser.employeeCode,
        joiningDate: selectedUser.joiningDate,
        address: selectedUser.address,
        alternateContact: selectedUser.alternateContact,
        documents: [], // This will hold newly staged files for this form session
      });
      setProfileImagePreviewUrl(selectedUser.profilePicture || null); // Use existing profile picture for preview
      setInitialDocuments(selectedUser.documents || []);
      setStagedNewFiles([]);
      setRemovedInitialPaths([]);
    }
  }, [selectedUser]);

  // Handle API errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      // Clear error after showing toast
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateFormData(formData);
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join("\n"),
        variant: "destructive",
      });
      return;
    }

    const transformedData: any = {
      first_name: formData.firstName,
      last_name: formData.lastName,
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

    if (formData.password) {
      transformedData.password = formData.password;
    }

    // Add flag to remove profile image if it was removed
    if (formData.removeProfileImage) {
      transformedData.remove_profile_image = true;
    }

    // Prepare document data for backend
    const keptDocumentPaths = initialDocuments
      .filter(doc => !removedInitialPaths.includes(doc.path))
      .map(doc => doc.path);

    transformedData.kept_document_paths = keptDocumentPaths;

    const formDataToSend = new FormData();
    formDataToSend.append('data', JSON.stringify(transformedData));

    if (formData.profileImage) {
      formDataToSend.append('profileImage', formData.profileImage);
    }
    // Send only newly staged files as 'new_documents'
    stagedNewFiles.forEach((file, index) => {
      formDataToSend.append(`new_documents[${index}]`, file);
    });

    try {
      await dispatch(userActions.updateUser({ userId: parseInt(id!), formData: formDataToSend })).unwrap();
      toast({
        title: "Success",
        description: "User updated successfully!",
      });
      navigate('/users');
    } catch (error: any) {
      // Error is already handled by the Redux thunk and displayed via the useEffect above
      console.error('Error updating user:', error);
    }
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
        if (fileInputRef.current) fileInputRef.current.value = "";
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
        return;
      }

      // Set for form submission
      setFormData(prev => ({ ...prev, profileImage: file }));
      // Set for preview
      const previewUrl = URL.createObjectURL(file);
      setProfileImagePreviewUrl(previewUrl);
    } else {
      // If no file is selected (e.g., user cancels file dialog), revert to original or clear
      setFormData(prev => ({ ...prev, profileImage: null }));
      setProfileImagePreviewUrl(selectedUser?.profilePicture || null);
    }
  };

  const handleRemoveProfilePicture = () => {
    setFormData(prev => ({ ...prev, profileImage: null }));
    setProfileImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    // Add a flag to indicate profile picture should be removed
    setFormData(prev => ({ ...prev, removeProfileImage: true }));
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
      'image/jpg': 'Image (.jpg)', // Often used interchangeably with image/jpeg
    };
    const allowedFileTypesDescription = "Allowed file types: PDF, Word (doc, docx), Excel (xls, xlsx), Images (jpeg, png, jpg).";

    const newFilesValidated: File[] = [];
    for (const file of files) {
      if (!Object.keys(validDocMimeTypes).includes(file.type)) {
        toast({ 
          title: "Invalid File Type", 
          description: `File "${file.name}" has an unsupported type. ${allowedFileTypesDescription}`, 
          variant: "destructive",
          duration: 7000, // Give more time to read
        });
        continue;
      }
      if (file.size > MAX_DOC_SIZE) {
        toast({ title: "File Too Large", description: `File "${file.name}" exceeds 15MB.`, variant: "destructive" });
        continue;
      }
      newFilesValidated.push(file);
    }

    if (newFilesValidated.length > 0) {
      setStagedNewFiles(prev => [...prev, ...newFilesValidated]);
    }
    // Clear the file input so the same file can be selected again if removed and re-added
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
  };

  const triggerDocumentsUpload = () => {
    documentInputRef.current?.click();
  };
  
  const removeDocument = (identifier: string | number, type: 'initial' | 'staged') => {
    if (type === 'initial') {
      // Add the path of the initial document to the removal list
      setRemovedInitialPaths(prev => [...prev, identifier as string]);
    } else if (type === 'staged') {
      // Remove the staged file by its index (identifier is index here)
      setStagedNewFiles(prev => prev.filter((_, i) => i !== (identifier as number)));
    }
  };

  // Get yesterday's date in YYYY-MM-DD format for the max attribute
  const getMaxDateForDOB = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return format(yesterday, 'yyyy-MM-dd');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading user data...</div>;
  }

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
          Edit User
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
                    {profileImagePreviewUrl ? (
                      <img
                        src={profileImagePreviewUrl}
                        alt={`${selectedUser?.firstName || ''} ${selectedUser?.lastName || ''}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={48} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    {profileImagePreviewUrl && (
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
                      maxLength={10}
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

                  <div className="space-y-2 relative">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password || ''}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current password"
                      className="pr-10" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="space-y-2 relative">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword || ''}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current password"
                      className="pr-10"
                    />
                     <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
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
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="fullAddress" className="block text-sm font-medium text-gray-700">
                    Full Address Details
                  </label>
                  <Textarea
                    id="fullAddress"
                    name="address" // Ensure this matches the state key
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    className="min-h-[100px]"
                    placeholder="Enter complete address with street, city, state, and zip code"
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

                  {/* Combined Document List */}
                  { (initialDocuments.filter(doc => !removedInitialPaths.includes(doc.path)).length > 0 || stagedNewFiles.length > 0) && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Uploaded Documents:</p>
                      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
                        {initialDocuments
                          .filter(doc => !removedInitialPaths.includes(doc.path))
                          .map((doc) => (
                            <li key={`initial-${doc.path}`} className="flex items-center justify-between p-3 hover:bg-gray-50">
                              <div className="flex-1 min-w-0">
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-blue-600 hover:underline truncate block"
                                  title={doc.original_name}
                                >
                                  {doc.original_name}
                                </a>
                                {doc.size_kb && <span className="text-xs text-gray-500">{doc.size_kb.toFixed(1)} KB</span>}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeDocument(doc.path, 'initial')}
                                className="ml-3 text-red-500 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        {stagedNewFiles.map((file, index) => (
                          <li key={`staged-${index}-${file.name}`} className="flex items-center justify-between p-3 hover:bg-blue-50">
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-800 truncate block" title={file.name}>
                                {file.name} <Badge variant="outline" className="ml-1 text-xs">New</Badge>
                              </span>
                              <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDocument(index, 'staged')}
                              className="ml-3 text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
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
              >
                Update User
              </button>
            </div>
          </form>
        </Tabs>
      </div>
    </div>
  );
};

export default EditUser;
