/**
 * Production-safe logging utility
 * Prevents sensitive information from leaking to browser console in production
 */

const isDev = import.meta.env.DEV;

interface LogData {
  [key: string]: unknown;
}

// Sanitize error messages to remove sensitive details
const sanitizeError = (error: unknown): string => {
  if (!error) return 'An error occurred';
  
  // Extract message without exposing internal details
  if (error instanceof Error) {
    // Remove file paths, stack traces, and internal references
    const message = error.message
      .replace(/at\s+.*$/gm, '')
      .replace(/\s*\(.*:\d+:\d+\)/g, '')
      .replace(/\/[^\s]+\.(ts|tsx|js|jsx)/g, '')
      .trim();
    return message || 'An error occurred';
  }
  
  if (typeof error === 'string') {
    return error.replace(/\s*(at|in)\s+[^\s]+\.(ts|tsx|js|jsx)/g, '');
  }
  
  return 'An error occurred';
};

// Safe log function that only logs in development
const log = (level: 'info' | 'warn' | 'error', message: string, data?: LogData): void => {
  if (isDev) {
    const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    if (data) {
      logFn(`[${level.toUpperCase()}] ${message}`, data);
    } else {
      logFn(`[${level.toUpperCase()}] ${message}`);
    }
  }
  // In production, you would send to a secure logging service here
  // e.g., Sentry, LogRocket, or a custom backend endpoint
};

export const logger = {
  /**
   * Log informational messages (dev only)
   */
  info: (message: string, data?: LogData): void => {
    log('info', message, data);
  },
  
  /**
   * Log warning messages (dev only)
   */
  warn: (message: string, data?: LogData): void => {
    log('warn', message, data);
  },
  
  /**
   * Log error messages (dev only, sanitized in production)
   */
  error: (message: string, error?: unknown, data?: LogData): void => {
    if (isDev) {
      console.error(`[ERROR] ${message}`, error, data);
    }
    // In production, would send to secure logging service
  },
  
  /**
   * Get a user-friendly error message safe for display
   */
  getUserMessage: (error: unknown, fallback = 'An unexpected error occurred'): string => {
    if (!error) return fallback;
    
    // Known safe error messages
    if (error instanceof Error) {
      const knownSafePatterns = [
        /invalid.*credentials/i,
        /already.*registered/i,
        /email.*required/i,
        /password.*required/i,
        /permission.*denied/i,
        /not.*found/i,
        /unauthorized/i,
        /network.*error/i,
      ];
      
      for (const pattern of knownSafePatterns) {
        if (pattern.test(error.message)) {
          return sanitizeError(error);
        }
      }
    }
    
    return fallback;
  },
  
  /**
   * Debug logging (dev only, verbose)
   */
  debug: (message: string, data?: LogData): void => {
    if (isDev) {
      console.log(`[DEBUG] ${message}`, data);
    }
  }
};

export default logger;
