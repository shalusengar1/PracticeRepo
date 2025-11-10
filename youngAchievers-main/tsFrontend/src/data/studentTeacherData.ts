
export interface BatchSummary { // For the nested batch objects
  id: number;
  name: string;
  program_id: number; // If you need it directly on batch
}

export interface Student { // Or Student, as you've named it
  id: number; // Or string, ensure consistency
  name: string;
  email: string;
  mobile: string;
  status: 'active' | 'inactive' | 'pending'; // Match your DB enum/values
  excused_until?: string | null;
  excuse_reason?: string | null;
  batches?: BatchSummary[]; // Array of batch summaries
  // Remove enrolledBatches if 'batches' is the consistent name from backend
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  assignedBatches: string[];
  specialization: string[];
  status: 'active' | 'inactive';
  attendanceRecords: {
    batchId: string;
    date: string;
    status: 'present' | 'absent' | 'excused';
  }[];
}

// export const studentData: Student[] = [
//   {
//     id: "s1",
//     name: "Alex Johnson",
//     email: "alex@example.com",
//     phone: "+1 (555) 123-4567",
//     enrolledBatches: ["Chess Advanced Batch", "Tennis Beginners"],
//     status: "active",
//     attendanceRecords: [
//       { batchId: "1", date: "2025-05-10", status: "present" },
//       { batchId: "1", date: "2025-05-08", status: "present" },
//       { batchId: "1", date: "2025-05-06", status: "absent" },
//       { batchId: "2", date: "2025-05-09", status: "present" },
//     ]
//   },
//   {
//     id: "s2",
//     name: "Emma Williams",
//     email: "emma@example.com",
//     phone: "+1 (555) 234-5678",
//     enrolledBatches: ["Chess Advanced Batch"],
//     status: "pending",
//     pauseReason: "Medical leave - fractured wrist",
//     pauseEndDate: "2025-06-15",
//     attendanceRecords: [
//       { batchId: "1", date: "2025-05-10", status: "paused" },
//       { batchId: "1", date: "2025-05-08", status: "paused" },
//       { batchId: "1", date: "2025-05-06", status: "present" },
//       { batchId: "1", date: "2025-05-04", status: "present" },
//     ]
//   },
//   {
//     id: "s3",
//     name: "Michael Brown",
//     email: "michael@example.com",
//     phone: "+1 (555) 345-6789",
//     enrolledBatches: ["Badminton Weekend", "Tennis Beginners"],
//     status: "active",
//     attendanceRecords: [
//       { batchId: "3", date: "2025-05-11", status: "present" },
//       { batchId: "3", date: "2025-05-04", status: "absent" },
//       { batchId: "2", date: "2025-05-09", status: "present" },
//       { batchId: "2", date: "2025-05-02", status: "present" },
//     ]
//   },
//   {
//     id: "s4",
//     name: "Olivia Davis",
//     email: "olivia@example.com",
//     phone: "+1 (555) 456-7890",
//     enrolledBatches: ["Badminton Weekend"],
//     status: "active",
//     attendanceRecords: [
//       { batchId: "3", date: "2025-05-11", status: "present" },
//       { batchId: "3", date: "2025-05-04", status: "present" },
//     ]
//   },
//   {
//     id: "s5",
//     name: "William Jones",
//     email: "william@example.com",
//     phone: "+1 (555) 567-8901",
//     enrolledBatches: ["Chess Advanced Batch", "Tennis Beginners"],
//     status: "inactive",
//     attendanceRecords: []
//   }
// ];

export const teacherData: Teacher[] = [
  {
    id: "t1",
    name: "Dr. Sarah Miller",
    email: "sarah@example.com",
    phone: "+1 (555) 890-1234",
    assignedBatches: ["Chess Advanced Batch"],
    specialization: ["Chess", "Strategy Games"],
    status: "active",
    attendanceRecords: [
      { batchId: "1", date: "2025-05-10", status: "present" },
      { batchId: "1", date: "2025-05-08", status: "present" },
      { batchId: "1", date: "2025-05-06", status: "present" },
    ]
  },
  {
    id: "t2",
    name: "Coach Robert Wilson",
    email: "robert@example.com",
    phone: "+1 (555) 678-9012",
    assignedBatches: ["Tennis Beginners"],
    specialization: ["Tennis", "Badminton"],
    status: "active",
    attendanceRecords: [
      { batchId: "2", date: "2025-05-09", status: "present" },
      { batchId: "2", date: "2025-05-02", status: "present" },
    ]
  },
  {
    id: "t3",
    name: "Coach Jennifer Anderson",
    email: "jennifer@example.com",
    phone: "+1 (555) 789-0123",
    assignedBatches: ["Badminton Weekend"],
    specialization: ["Badminton", "Tennis"],
    status: "active",
    attendanceRecords: [
      { batchId: "3", date: "2025-05-11", status: "present" },
      { batchId: "3", date: "2025-05-04", status: "absent" },
    ]
  }
];
