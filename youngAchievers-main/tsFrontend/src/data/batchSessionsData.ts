
// Mock data for batch sessions
export const batches = [
  {
    id: 'web-dev',
    name: 'Web Development Fundamentals',
    type: 'Fixed',
    faculty: 'Dr. Sarah Johnson',
    partners: [{ id: 1, name: 'Dr. Sarah Johnson' }],
    venue: 'Main Campus',
    startDate: '2024-07-15',
    endDate: '2024-10-10',
    time: '09:00 - 11:00',
    sessionCount: 8,
    sessions: [
      { id: 1, date: '2024-07-15', day: 'Monday', time: '09:00 - 11:00' },
      { id: 2, date: '2024-07-16', day: 'Tuesday', time: '09:00 - 11:00' },
      { id: 3, date: '2024-07-17', day: 'Wednesday', time: '09:00 - 11:00' },
      { id: 4, date: '2024-07-18', day: 'Thursday', time: '09:00 - 11:00' },
      { id: 5, date: '2024-07-19', day: 'Friday', time: '09:00 - 11:00' },
      { id: 6, date: '2024-07-22', day: 'Monday', time: '09:00 - 11:00' },
      { id: 7, date: '2024-07-23', day: 'Tuesday', time: '09:00 - 11:00' },
      { id: 8, date: '2024-07-24', day: 'Wednesday', time: '09:00 - 11:00' },
      // Adding upcoming sessions
      { id: 9, date: '2024-08-15', day: 'Thursday', time: '09:00 - 11:00' },
      { id: 10, date: '2024-08-22', day: 'Thursday', time: '09:00 - 11:00' },
      { id: 11, date: '2024-09-05', day: 'Thursday', time: '09:00 - 11:00' },
      { id: 12, date: '2024-09-19', day: 'Thursday', time: '09:00 - 11:00' },
    ]
  },
  {
    id: 'chess-adv',
    name: 'Chess Advanced Batch',
    type: 'Subscription',
    faculty: 'Mr. Robert Fischer',
    partners: [{ id: 2, name: 'Mr. Robert Fischer' }],
    venue: 'Chess Hall, Talkatora Stadium',
    startDate: '2024-06-01',
    endDate: '2024-12-30',
    time: '16:00 - 17:30',
    sessionCount: 12,
    sessions: [
      { id: 1, date: '2024-06-01', day: 'Saturday', time: '16:00 - 17:30' },
      { id: 2, date: '2024-06-08', day: 'Saturday', time: '16:00 - 17:30' },
      { id: 3, date: '2024-06-15', day: 'Saturday', time: '16:00 - 17:30' },
      // Adding upcoming sessions
      { id: 4, date: '2024-07-06', day: 'Saturday', time: '16:00 - 17:30' },
      { id: 5, date: '2024-07-13', day: 'Saturday', time: '16:00 - 17:30' },
      { id: 6, date: '2024-07-20', day: 'Saturday', time: '16:00 - 17:30' },
      { id: 7, date: '2024-07-27', day: 'Saturday', time: '16:00 - 17:30' },
      { id: 8, date: '2024-08-03', day: 'Saturday', time: '16:00 - 17:30' },
      { id: 9, date: '2024-08-10', day: 'Saturday', time: '16:00 - 17:30' },
    ]
  },
  {
    id: 'tennis-beg',
    name: 'Tennis Beginners',
    type: 'Fixed',
    faculty: 'Ms. Maria Sharapova',
    partners: [
      { id: 3, name: 'Ms. Maria Sharapova' },
      { id: 4, name: 'Mr. Roger Federer' }
    ],
    venue: 'Tennis Lawn, Noida Stadium',
    startDate: '2024-06-10',
    endDate: '2024-12-15',
    time: '07:00 - 09:00',
    sessionCount: 10,
    sessions: [
      { id: 1, date: '2024-06-10', day: 'Monday', time: '07:00 - 09:00' },
      { id: 2, date: '2024-06-12', day: 'Wednesday', time: '07:00 - 09:00' },
      { id: 3, date: '2024-06-14', day: 'Friday', time: '07:00 - 09:00' },
      // Adding upcoming sessions
      { id: 4, date: '2024-07-08', day: 'Monday', time: '07:00 - 09:00' },
      { id: 5, date: '2024-07-10', day: 'Wednesday', time: '07:00 - 09:00' },
      { id: 6, date: '2024-07-12', day: 'Friday', time: '07:00 - 09:00' },
      { id: 7, date: '2024-07-15', day: 'Monday', time: '07:00 - 09:00' },
      { id: 8, date: '2024-07-17', day: 'Wednesday', time: '07:00 - 09:00' },
      { id: 9, date: '2024-07-19', day: 'Friday', time: '07:00 - 09:00' },
      { id: 10, date: '2024-07-22', day: 'Monday', time: '07:00 - 09:00' },
    ]
  }
];

export type Batch = typeof batches[0];
export type Session = typeof batches[0]['sessions'][0];
