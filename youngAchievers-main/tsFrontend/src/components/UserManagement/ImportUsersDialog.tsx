import React, { useState } from 'react';
import { ArrowLeft, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { processCsvFile, isValidEmail, isValidPhone } from '@/utils/gcsService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppDispatch } from '@/hooks/reduxHooks/hooks';
import { bulkImportUsers } from '@/store/user/userSlice';

interface ImportUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CsvUser {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  role: string; // Made role required as per backend
  status: string; // Made status required
  date_of_birth?: string;
  employee_code?: string;
  joining_date?: string;
  alternate_contact?: string;
  address?: string;
  password?: string;
}

interface ValidationError {
  row: number;
  rowIndex: number; // 0-based index for easier data access
  field: string;
  message: string;
}

const ImportUsersDialog: React.FC<ImportUsersDialogProps> = ({ open, onOpenChange }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CsvUser[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState<'select' | 'preview' | 'success'>('select');
  const validRoles = ['Admin', 'Account Manager', 'Facility Manager'];
  const validStatuses = ['Active', 'Inactive', 'Pending'];
  const isValidDate = (dateString: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(dateString);

  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      if (!file.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV file",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      setIsProcessing(true);
      
      try {
        const results = await processCsvFile(file); // [{ row, data, errors }]
        const errors: ValidationError[] = [];
        const parsed: CsvUser[] = [];
        results.forEach((rowResult, idx) => {
          if (rowResult.errors.length > 0) {
            rowResult.errors.forEach(msg => {
              // Try to extract field from message for better UX
              let field = '';
              if (msg.toLowerCase().includes('first name')) field = 'firstname';
              else if (msg.toLowerCase().includes('last name')) field = 'lastname';
              else if (msg.toLowerCase().includes('email')) field = 'email';
              else if (msg.toLowerCase().includes('phone')) field = 'phone';
              else if (msg.toLowerCase().includes('role')) field = 'role';
              else if (msg.toLowerCase().includes('status')) field = 'status';
              else if (msg.toLowerCase().includes('date of birth')) field = 'date_of_birth';
              else if (msg.toLowerCase().includes('joining date')) field = 'joining_date';
              else if (msg.toLowerCase().includes('alternate contact')) field = 'alternate_contact';
              else if (msg.toLowerCase().includes('employee code')) field = 'employee_code';
              else if (msg.toLowerCase().includes('address')) field = 'address';
              else if (msg.toLowerCase().includes('password')) field = 'password';
              errors.push({ row: rowResult.row, rowIndex: idx, field, message: msg });
            });
          }
          parsed.push(rowResult.data);
        });
        setParsedData(parsed);
        setValidationErrors(errors);
        setStep('preview');
        if (errors.length === 0) {
          toast({
            title: "File Processed Successfully",
            description: `${parsed.length} users ready for import`,
          });
        } else {
          toast({
            title: "Validation Issues Found",
            description: `${errors.length} issues found. Only valid rows will be imported. Please review the errors above.`,
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Processing Failed",
          description: error instanceof Error ? error.message : "Failed to process CSV file",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  const handleDownloadSample = () => {
    const csvContent = 
      "firstname,lastname,email,phone,role,status,date_of_birth,employee_code,joining_date,alternate_contact,address,password\n" +
      "John,Doe,john.doe@example.com,1234567890,Admin,Active,1990-01-01,EMP001,2023-01-01,0987654321,123 Main St,password123\n" +
      "Jane,Smith,jane.smith@example.com,1122334455,Account Manager,Active,,,,,,,\n" +
      "Bob,,bob.johnson@example.com,,Facility Manager,Pending,,,,,,securepassword";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded successfully",
    });
  };
  
  const handleImport = async () => {
    const invalidRowIndexes = new Set(validationErrors.map(e => e.rowIndex));
    const validRows = parsedData.filter((_, index) => !invalidRowIndexes.has(index));

    if (validRows.length === 0) {
      toast({
        title: "Import Canceled",
        description: "No valid users found to import. Please fix the errors highlighted in the preview.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    const submittedToOriginalRowMap: number[] = [];
    parsedData.forEach((_, index) => {
      if (!invalidRowIndexes.has(index)) {
        submittedToOriginalRowMap.push(index + 1);
      }
    });

    const dataToSubmit = validRows.map(user => ({
      first_name: user.firstname,
      last_name: user.lastname || null,
      email: user.email,
      phone: user.phone || null,
      role: user.role,
      status: user.status.toLowerCase(),
      date_of_birth: user.date_of_birth || null,
      employee_code: user.employee_code || null,
      joining_date: user.joining_date || null,
      alternate_contact: user.alternate_contact || null,
      address: user.address || null,
      password: user.password || null,
    }));

    try {
      await dispatch(bulkImportUsers({ users: dataToSubmit })).unwrap();
      
      if (validationErrors.length > 0) {
        toast({
            title: "Import Partially Successful",
            description: `Successfully imported ${validRows.length} users. ${validationErrors.length} users were skipped due to validation errors.`,
        });
      } else {
      toast({
        title: "Import Successful",
            description: `Successfully imported ${validRows.length} users.`,
      });
      }
      
      setStep('success');
      
    } catch (error: any) {
      // const rawErrors = error?.response?.data?.errors;
      // const errorMessages: string[] = [];

      // if (rawErrors && typeof rawErrors === 'object') {
      //   for (const key in rawErrors) {
      //     const fieldErrors = rawErrors[key];
      //     const match = key.match(/users\.(\d+)\.(\w+)/);

      //     if (match && Array.isArray(fieldErrors) && fieldErrors.length > 0) {
      //       const backendIndex = parseInt(match[1], 10);
      //       const originalRowNum = submittedToOriginalRowMap[backendIndex];

      //       if (originalRowNum) {
      //       const rawMessage = fieldErrors[0];
      //       const cleanMessage = rawMessage.replace(/users\.\d+\./, '');
      //         errorMessages.push(`Row ${originalRowNum} – ${cleanMessage}`);
      //       } else {
      //         errorMessages.push(fieldErrors[0]);
      //       }
      //     }
      //   }
      // }

      // toast({
      //   title: "Import Failed",
      //   description: (
      //     <div>
      //       <p className="mb-2">The users could not be imported due to backend errors:</p>
      //     <ul className="list-disc pl-4">
      //       {errorMessages.map((msg, i) => (
      //         <li key={i}>{msg}</li>
      //       ))}
      //     </ul>
      //     </div>
      //   ),
      //   variant: "destructive",
      //   duration: 5000,
      // });

    } finally {
      setIsUploading(false);
    }
  };
  
  const handleClose = () => {
    setSelectedFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setStep('select');
    onOpenChange(false);
  };
  
  const renderSelectStep = () => (
    <div className="p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Download Sample Section */}
        <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 p-2 rounded-full">
                <Download size={24} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Download Sample CSV</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Get a pre-formatted CSV template to ensure your user data is imported correctly. This helps avoid common errors.
            </p>
            <div className="bg-gray-100 rounded-md p-4 text-sm text-gray-700 space-y-2">
              <p><strong>Required columns:</strong><br /> firstname, lastname, email, phone, role, status</p>
              <p><strong>Optional columns:</strong><br /> date_of_birth, employee_code, joining_date, alternate_contact, address, password</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleDownloadSample}
            className="w-full mt-6 gap-2 bg-white"
          >
            <Download size={18} />
            Download Template
          </Button>
        </div>

        {/* Upload File Section */}
        <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-200/80 hover:shadow-md transition-shadow flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-2 rounded-full">
              <Upload size={24} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Upload Your CSV</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Once your CSV is ready, upload it here. We'll validate the data before the final import.
          </p>

          <div className="flex-grow flex flex-col gap-4">
            <label 
              htmlFor="csv-upload" 
              className="relative flex flex-col items-center justify-center w-full flex-grow border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-white hover:border-purple-400 transition-all"
            >
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center text-center">
                    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-2 text-sm font-medium text-gray-600">Processing...</p>
                </div>
              ) : selectedFile ? (
                <div className="text-center p-4">
                    <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
                    <p className="font-semibold text-gray-700 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Click here to choose a different file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <Upload size={32} className="text-gray-400 mb-3" />
                    <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold text-purple-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">CSV files only, up to 5MB</p>
                </div>
              )}
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderPreviewStep = () => {
    // Map row index to error presence for quick lookup
    const errorRows = new Set(validationErrors.map(e => e.rowIndex));
    const totalRows = parsedData.length;
    const errorRowCount = Array.from(errorRows).length;
    const validRowCount = totalRows - errorRowCount;
    return (
      <div className="space-y-4">
        {/* Top bar with summary and actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-1">
            <div className="flex flex-wrap gap-2 text-sm">
                <span className="bg-gray-100 rounded-md px-3 py-1.5 font-medium">Total: <b>{totalRows}</b></span>
                <span className="bg-green-100 text-green-800 rounded-md px-3 py-1.5 font-medium">Valid: <b>{validRowCount}</b></span>
                <span className="bg-red-100 text-red-800 rounded-md px-3 py-1.5 font-medium">Errors: <b>{errorRowCount}</b></span>
            </div>
            <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setStep('select')}>Back</Button>
                <Button 
                    onClick={handleImport}
                    disabled={validRowCount === 0 || isUploading}
                    className="gap-2"
                >
                    {isUploading ? 'Importing...' : `Import ${validRowCount} Users`}
                </Button>
            </div>
        </div>

        {/* Card containing errors and data preview */}
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
            {validationErrors.length > 0 && (
                <div className="p-4 border-b">
                    <h4 className="text-lg font-semibold text-red-800 mb-2">Validation Errors</h4>
                    <div className="bg-red-50/70 border border-red-200 rounded-lg p-3 max-h-36 overflow-y-auto">
                        <ul className="space-y-1 text-sm">
                            {validationErrors.slice(0, 50).map((error, index) => (
                                <li key={index} className="text-red-700 font-medium">
                                    Row {error.row}{error.field ? ` (${error.field})` : ''}: {error.message}
                                </li>
                            ))}
                            {validationErrors.length > 50 && (
                                <li className="text-red-700 font-medium">
                                ... and {validationErrors.length - 50} more errors
                                </li>
                            )}
                        </ul>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Rows with errors will be highlighted and skipped during import.</p>
                </div>
            )}
            
            <div className="p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">User Data Preview</h4>
                <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-[50vh] overflow-auto">
                        <Table className="min-w-[900px]">
                            <TableHeader className="sticky top-0 z-10 bg-gray-50 shadow-sm">
                                <TableRow>
                                    <TableHead className="w-10 text-center">#</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>First Name</TableHead>
                                    <TableHead>Last Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>DOB</TableHead>
                                    <TableHead>Emp. Code</TableHead>
                                    <TableHead>Joining Date</TableHead>
                                    <TableHead>Alt. Contact</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Password</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parsedData.map((user, index) => {
                                    const hasError = errorRows.has(index);
                                    return (
                                        <TableRow key={index} className={hasError ? 'bg-red-50 hover:bg-red-100/50' : 'bg-green-50/30 hover:bg-green-100/50'}>
                                            <TableCell className="text-center font-mono text-xs">{index + 1}</TableCell>
                                            <TableCell className="text-center">
                                                {hasError ? (
                                                    <span title="Row has errors" className="inline-flex items-center gap-1.5 text-red-600 font-semibold text-xs">
                                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                        Error
                                                    </span>
                                                ) : (
                                                    <span title="Row is valid" className="inline-flex items-center gap-1.5 text-green-700 font-semibold text-xs">
                                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                        Valid
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>{user.firstname}</TableCell>
                                            <TableCell>{user.lastname}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.phone}</TableCell>
                                            <TableCell>{user.role}</TableCell>
                                            <TableCell>{user.status}</TableCell>
                                            <TableCell>{user.date_of_birth}</TableCell>
                                            <TableCell>{user.employee_code}</TableCell>
                                            <TableCell>{user.joining_date}</TableCell>
                                            <TableCell>{user.alternate_contact}</TableCell>
                                            <TableCell>{user.address}</TableCell>
                                            <TableCell>{user.password ? '********' : ''}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  };
  
  const renderSuccessStep = () => {
    const invalidRowIndexes = new Set(validationErrors.map(e => e.rowIndex));
    const validRows = parsedData.filter((_, index) => !invalidRowIndexes.has(index));
    const totalImported = validRows.length;
    const totalSkipped = parsedData.length - totalImported;
    return (
        <div className="text-center space-y-4 py-8">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
            <h3 className="text-2xl font-bold">Import Complete!</h3>
            <p className="text-gray-600 text-lg">
                Successfully imported <strong>{totalImported}</strong> users.
            </p>
            {totalSkipped > 0 && (
                <p className="text-gray-500">
                <strong>{totalSkipped}</strong> users were skipped due to errors.
                </p>
            )}
        </div>
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center gap-2 flex-shrink-0">
          {step !== 'select' && step !== 'success' && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setStep('select')}
            >
              <ArrowLeft size={20} />
            </Button>
          )}
          <DialogTitle className="text-xl">
            Import Users from CSV
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 flex-grow overflow-y-auto min-h-0">
          {step === 'select' && renderSelectStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'success' && renderSuccessStep()}
        </div>
        
        <div className="flex justify-end border-t pt-4 mt-6 flex-shrink-0">
          <Button variant="outline" onClick={handleClose}>
            {step === 'success' ? 'Done' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportUsersDialog;