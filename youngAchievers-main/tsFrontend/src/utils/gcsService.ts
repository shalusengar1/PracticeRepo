import api from '@/api/axios';

/**
 * Uploads a file to GCS via backend API and returns its public URL.
 */
export const uploadToGCS = async (file: File, folder: string = 'uploads'): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  try {
    const response = await api.post('/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.url;
  } catch (error) {
    console.error('Upload failed:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Uploads profile image to GCS
 */
export const uploadProfileImage = async (file: File): Promise<string> => {
  return uploadToGCS(file, 'profiles');
};

/**
 * Processes CSV file and returns parsed data with per-row errors
 */
export const processCsvFile = (file: File): Promise<{ row: number, data: any, errors: string[] }[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['firstname', 'lastname', 'email', 'phone', 'role', 'status'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          reject(new Error(`Missing required columns: ${missingHeaders.join(', ')}`));
          return;
        }

        const nameRegex = /^[a-zA-Z\s-]*$/;
        const validRoles = ['Admin', 'Account Manager', 'Facility Manager'];
        const validStatuses = ['Active', 'Inactive', 'Pending'];
        const results: { row: number, data: any, errors: string[] }[] = [];

        const dataLines = lines.slice(1);

        dataLines.forEach((line, index) => {
          const rowNum = index + 1; // 1-based data row number
          const values = line.split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, headerIndex) => {
            row[header] = values[headerIndex] || '';
          });

          const errors: string[] = [];
          // First Name
          if (!row.firstname || row.firstname.trim().length === 0) {
            errors.push('First Name is required.');
          } else if (!nameRegex.test(row.firstname)) {
            errors.push('First Name can only contain letters, spaces, and hyphens.');
          } else if (row.firstname.length > 40) {
            errors.push('First Name must be less than or equal to 40 characters.');
          }
          // Last Name
          if (!row.lastname || row.lastname.trim().length === 0) {
            errors.push('Last Name is required.');
          } else if (!nameRegex.test(row.lastname)) {
            errors.push('Last Name can only contain letters, spaces, and hyphens.');
          } else if (row.lastname.length > 40) {
            errors.push('Last Name must be less than or equal to 40 characters.');
          }
          // Email
          if (!row.email) {
            errors.push('Email is required.');
          } else if (!isValidEmail(row.email)) {
            errors.push('Invalid email format.');
          } else if (row.email.length > 100) {
            errors.push('Email must be less than or equal to 100 characters.');
          }
          // Phone
          if (!row.phone) {
            errors.push('Phone Number is required.');
          } else if (!/^[0-9]{10}$/.test(row.phone)) {
            errors.push('Phone Number must be 10 digits.');
          }
          // Alternate Contact
          if (row.alternate_contact && !/^[0-9]{10}$/.test(row.alternate_contact)) {
            errors.push('Alternate Contact must be 10 digits.');
          }
          // Role
          if (!row.role) {
            errors.push('Role is required.');
          } else if (!validRoles.map(r => r.toLowerCase()).includes(row.role.toLowerCase())) {
            errors.push(`Invalid role. Must be one of: ${validRoles.join(', ')}.`);
          }
          // Status
          if (!row.status) {
            errors.push('Status is required.');
          } else if (!validStatuses.map(s => s.toLowerCase()).includes(row.status.toLowerCase())) {
            errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}.`);
          }
          // Date of Birth
          if (row.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(row.date_of_birth)) {
            errors.push('Invalid Date of Birth format. Use YYYY-MM-DD.');
          }
          // Joining Date
          if (row.joining_date && !/^\d{4}-\d{2}-\d{2}$/.test(row.joining_date)) {
            errors.push('Invalid Joining Date format. Use YYYY-MM-DD.');
          }
          // Joining date not before DOB
          if (row.date_of_birth && row.joining_date &&
            /^\d{4}-\d{2}-\d{2}$/.test(row.date_of_birth) &&
            /^\d{4}-\d{2}-\d{2}$/.test(row.joining_date)) {
            if (new Date(row.joining_date) < new Date(row.date_of_birth)) {
              errors.push('Joining date cannot be earlier than the date of birth.');
            }
          }
          // Password (optional, but if present, must be at least 8 chars)
          if (row.password && row.password.length < 8) {
            errors.push('Password must be at least 8 characters.');
          }
          // Address (optional, but if present, max 255 chars)
          if (row.address && row.address.trim().length > 255) {
            errors.push('Address must be less than 255 characters.');
          }
          results.push({ row: rowNum, data: row, errors });
        });
        
        resolve(results);
      } catch (error) {
        reject(new Error('Failed to parse CSV file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read CSV file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{9,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};