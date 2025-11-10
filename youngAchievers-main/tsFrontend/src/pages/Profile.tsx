import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from "@/hooks/reduxHooks/hooks";
import { fetchProfile, updateProfile, clearError } from '@/store/profile/profileSlice';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Camera, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";



const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const profileState = useAppSelector((state) => state.profile);
  const { toast } = useToast();

  const [formData, setFormDataState] = useState({ // Renamed to avoid conflict with FormData global type
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
  });
  const [newProfilePictureFile, setNewProfilePictureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeProfilePicture, setRemoveProfilePicture] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    setFormDataState({
      firstName: profileState.firstName || '',
      lastName: profileState.lastName || '',
      email: profileState.email || '',
      mobile: profileState.mobile || '',
    });
    setPreviewUrl(profileState.profilePicture || null); // Initialize preview with current profile picture
  }, [profileState.firstName, profileState.lastName, profileState.email, profileState.mobile, profileState.profilePicture, dispatch]);

  // Centralized error handling
  useEffect(() => {
    if (profileState.error) {
      toast({
        title: "Error",
        description: profileState.error,
        variant: "destructive",
      });
      dispatch(clearError()); // Clear the error after displaying it
    }
  }, [profileState.error, toast, dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "firstName" || name === "lastName") { 
      // Allow only letters, spaces, and hyphens (optional, adjust regex as needed)
      // and also limit to 50 characters
      processedValue = value.replace(/[^a-zA-Z\s-]/g, '').slice(0, 40);
      
    } else if (name === "email") {
      processedValue = value.slice(0, 99);
    }

    setFormDataState(prev => ({ ...prev, [name]: processedValue }));
  };

  // Updated: Only sets the file locally and updates preview
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid image file (JPEG, PNG, JPG, or GIF).",
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = ""; // Clear the file input
        setNewProfilePictureFile(null); // Clear the stored file
        setPreviewUrl(profileState.profilePicture || null); // Revert to original or default preview
        return;
      }
      
      const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: "Profile image must be less than 2MB.",
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = ""; // Clear the file input
        setNewProfilePictureFile(null); // Clear the stored file
        setPreviewUrl(profileState.profilePicture || null); // Revert to original or default preview
        return;
      }
      setNewProfilePictureFile(file);
      setRemoveProfilePicture(false); // Reset remove flag when new image is selected
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setNewProfilePictureFile(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Also clear input if no file is selected (e.g., user cancels)
      setPreviewUrl(profileState.profilePicture || null); // Revert to original if selection is cleared
    }
  };

  // Updated: Sends FormData
  const handleSave = () => {
    // Client-side validation
    const validationErrors: string[] = [];
    const nameRegex = /^[a-zA-Z\s-]*$/; // Allows letters, spaces, hyphens

    if (!formData.firstName?.trim()) {
      validationErrors.push("First Name is required.");
    } else if (!nameRegex.test(formData.firstName)) {
      validationErrors.push("First Name can only contain letters, spaces, and hyphens.");
    } else if (formData.firstName.length > 40) {
      validationErrors.push("First Name must be less than 40 characters.");
    }
    if (!formData.lastName?.trim()) {
      validationErrors.push("Last Name is required.");
    } else if (!nameRegex.test(formData.lastName)) {
      validationErrors.push("Last Name can only contain letters, spaces, and hyphens.");
    } else if (formData.lastName.length > 40) {
      validationErrors.push("Last Name must be less than 40 characters.");
    }
    if (!formData.email) {
      validationErrors.push("Email is required.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      validationErrors.push("Invalid email format.");
    } else if (formData.email.length > 99) {
      validationErrors.push("Email must be less than 100 characters.");
    } // Mobile number validation
    if (!formData.mobile) {
      validationErrors.push("Mobile Number is required.");
    } else if (!/^[0-9]+$/.test(formData.mobile)) { // Check if it contains only digits
      validationErrors.push("Mobile Number must contain only digits.");
    } else if (!/^[0-9]{10}$/.test(formData.mobile)) {
      // Basic 10-digit phone validation, adjust as needed for your specific format
      validationErrors.push("Mobile Number must be 10 digits.");
    }

    if (validationErrors.length > 0) {
      toast({ title: "Validation Error", description: validationErrors.join("\n"), variant: "destructive" });
      return;
    }
    const dataToSend = new FormData();
    dataToSend.append('_method', 'PUT'); // Add this for method spoofing
    dataToSend.append('first_name', formData.firstName);
    dataToSend.append('last_name', formData.lastName);
    dataToSend.append('email', formData.email);
    dataToSend.append('phone', formData.mobile);

    if (newProfilePictureFile) {
      dataToSend.append('profileImage', newProfilePictureFile); // Backend expects 'profileImage'
    }

    if (removeProfilePicture) {
      dataToSend.append('remove_profile_image', 'true'); // Flag to remove existing profile picture
    }

    dispatch(updateProfile(dataToSend))
      .unwrap()
      .then(() => {
        toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
        setNewProfilePictureFile(null); // Clear the selected file state
        setRemoveProfilePicture(false); // Reset remove flag
        // The profilePicture in Redux state will be updated by the thunk's fulfilled action
      });
      // Errors will be caught by the central useEffect hook
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveProfilePicture = () => {
    if (newProfilePictureFile) {
      // If there's a new file selected, just remove it
      setNewProfilePictureFile(null);
      setPreviewUrl(profileState.profilePicture || null); // Revert to original profile picture
    } else if (profileState.profilePicture) {
      // If there's an existing profile picture, mark it for removal
      setRemoveProfilePicture(true);
      setPreviewUrl(null); // Clear the preview
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight animate-fade-in">
        Profile
      </h1>

      {profileState.loading && <p>Loading profile...</p>}
      {/* Error display is now handled by toast notifications via the useEffect hook */}
      {/* {profileState.error && <p className="text-red-500">Error: {profileState.error}</p>} */}

      {!profileState.loading && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and profile picture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b">
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage 
                    src={removeProfilePicture ? '' : (previewUrl || profileState.profilePicture || '')} // Hide image if marked for removal
                    alt={`${formData.firstName} ${formData.lastName}`} 
                  />
                  <AvatarFallback className="text-2xl">
                    {(formData.firstName?.charAt(0) || '')}{(formData.lastName?.charAt(0) || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  {(previewUrl || (profileState.profilePicture && !removeProfilePicture)) && (
                    <button
                      type="button"
                      onClick={handleRemoveProfilePicture}
                      className="p-1.5 bg-red-500/70 text-white rounded-full hover:bg-red-600/80 transition-colors"
                      title="Remove profile picture"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="p-1.5 bg-purple-500/70 text-white rounded-full hover:bg-purple-600/80 transition-colors"
                    title="Upload profile picture"
                  >
                    <Upload size={14} />
                  </button>
                </div>
                <input
                  id="profile-picture-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureChange}
                />
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-lg font-medium">
                  {formData.firstName} {formData.lastName}
                </h3>
                <p className="text-sm text-muted-foreground break-all">
                  {formData.email}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <Input 
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <Input 
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <Input 
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <Input 
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={profileState.loading}>
                {profileState.loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Profile;
