
import { useState, useEffect } from 'react';
import { format, parse, differenceInCalendarDays } from 'date-fns';

interface ValidationOptions {
  startDate: Date | undefined;
  endDate: Date | undefined;
  numSessions: number;
  sessionSchedule: string;
  sessionStartTime: string;
  sessionEndTime: string;
}

export const useBatchValidation = () => {
  const validateDates = (options: ValidationOptions) => {
    const {
      startDate,
      endDate,
      numSessions,
      sessionSchedule,
      sessionStartTime,
      sessionEndTime
    } = options;
    
    const errors = [];
    
    // Basic validation
    if (!startDate) errors.push('Start date is required');
    if (!endDate) errors.push('End date is required');
    if (numSessions <= 0) errors.push('Number of sessions must be greater than zero');
    
    // Check that end date is after start date
    if (startDate && endDate && endDate < startDate) {
      errors.push('End date must be after start date');
    }
    
    // Validate start and end times
    if (sessionStartTime && sessionEndTime) {
      const startTime = parse(sessionStartTime, 'HH:mm', new Date());
      const endTime = parse(sessionEndTime, 'HH:mm', new Date());
      
      if (endTime <= startTime) {
        errors.push('Session end time must be after start time');
      }
    }
    
    // Validate session schedule against date range
    if (startDate && endDate && sessionSchedule && numSessions > 0) {
      const daysBetween = differenceInCalendarDays(endDate, startDate);
      
      let estimatedSessions = 0;
      
      // Estimate number of sessions based on schedule
      switch (sessionSchedule) {
        case 'mwf':
          // Monday, Wednesday, Friday = 3 days per week
          estimatedSessions = Math.floor((daysBetween / 7) * 3);
          break;
        case 'tts':
          // Tuesday, Thursday, Saturday = 3 days per week
          estimatedSessions = Math.floor((daysBetween / 7) * 3);
          break;
        case 'weekend':
          // Saturday, Sunday = 2 days per week
          estimatedSessions = Math.floor((daysBetween / 7) * 2);
          break;
        case 'manual':
          // Manual selection - no validation needed
          return errors;
      }
      
      // If the estimated sessions are less than requested
      if (estimatedSessions < numSessions) {
        errors.push(`The date range may not accommodate ${numSessions} sessions with the selected schedule. Consider extending the end date.`);
      }
    }
    
    return errors;
  };
  
  const validateFeeConfiguration = (feeType: string, feeAmount: number, feePaymentModel: string) => {
    const errors = [];
    
    if (!feeType) errors.push('Fee type is required');
    if (feeAmount <= 0) errors.push('Fee amount must be greater than zero');
    if (!feePaymentModel) errors.push('Payment model is required');
    
    return errors;
  };
  
  return {
    validateDates,
    validateFeeConfiguration,
  };
};
