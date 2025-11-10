import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  type?: 'text' | 'email' | 'batch';
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({ 
  text, 
  maxLength = 30,
  className = "",
  type = 'text'
}) => {
  if (!text) return null;

  const formatEmail = (email: string) => {
    if (!email.includes('@')) {
      return email;
    }
    const [username, domain] = email.split('@');
    if (!domain) return email;

    // If total email length is less than 25 characters, show it fully
    if (email.length <= (maxLength || 25) ) {
      return email;
    }

    // For longer emails, handle username and domain separately
    let formattedUsername = username;
    let formattedDomain = domain;

    // If username is long (>12 chars), truncate it
    if (username.length > 12) {
      formattedUsername = `${username.slice(0, 8)}...`;
    }

    // If domain is long (>15 chars), truncate it
    if (domain.length > 15) {
      formattedDomain = `${domain.slice(0, 12)}...`;
    }

    return `${formattedUsername}@${formattedDomain}`;
  };

  const formatBatches = (batchText: string) => {
    if (!batchText.trim()) return "No batches";
    const batches = batchText.split(', ').filter(batch => batch.trim());
    if (batches.length === 0) return "No batches";
    if (batches.length <= 2) return batchText;
    return `${batches[0]}, ${batches[1]} +${batches.length - 2}`;
  };

  let displayText = text;
  try {
    if (type === 'email') {
      displayText = formatEmail(text);
    } else if (type === 'batch') {
      displayText = formatBatches(text);
    } else if (text.length > maxLength && maxLength > 0) {
      displayText = `${text.substring(0, maxLength)}...`;
    }
  } catch (error) {
    console.error('Error formatting text:', error);
    displayText = text; // Fallback to original text on error
  }

  if (displayText === text) {
    return <span className={className}>{text}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`cursor-default ${className}`}>{displayText}</span>
        </TooltipTrigger>
        <TooltipContent className="break-words">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 