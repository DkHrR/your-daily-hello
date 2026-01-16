import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface UseSmtpVerificationReturn {
  isSending: boolean;
  isVerifying: boolean;
  sendVerificationEmail: (email: string, userName?: string) => Promise<boolean>;
  resendVerificationEmail: (email: string, userName?: string) => Promise<boolean>;
  verifyToken: (token: string, email: string) => Promise<boolean>;
}

export function useSmtpVerification(): UseSmtpVerificationReturn {
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const sendVerificationEmail = useCallback(async (
    email: string, 
    userName?: string
  ): Promise<boolean> => {
    setIsSending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-email', {
        body: {
          action: 'send',
          email,
          userName
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Verification email sent! Please check your inbox.');
        return true;
      } else {
        throw new Error(data?.error || 'Failed to send verification email');
      }
    } catch (error: any) {
      logger.error('Failed to send verification email', error);
      toast.error(logger.getUserMessage(error, 'Failed to send verification email'));
      return false;
    } finally {
      setIsSending(false);
    }
  }, []);

  const resendVerificationEmail = useCallback(async (
    email: string,
    userName?: string
  ): Promise<boolean> => {
    setIsSending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-email', {
        body: {
          action: 'resend',
          email,
          userName
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Verification email resent! Please check your inbox.');
        return true;
      } else {
        throw new Error(data?.error || 'Failed to resend verification email');
      }
    } catch (error: any) {
      logger.error('Failed to resend verification email', error);
      toast.error(logger.getUserMessage(error, 'Failed to resend verification email'));
      return false;
    } finally {
      setIsSending(false);
    }
  }, []);

  const verifyToken = useCallback(async (
    token: string,
    email: string
  ): Promise<boolean> => {
    setIsVerifying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-email', {
        body: {
          action: 'verify',
          token,
          email
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Email verified successfully!');
        return true;
      } else {
        throw new Error(data?.error || 'Invalid or expired verification link');
      }
    } catch (error: any) {
      logger.error('Email verification failed', error);
      toast.error(logger.getUserMessage(error, 'Invalid or expired verification link'));
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  return {
    isSending,
    isVerifying,
    sendVerificationEmail,
    resendVerificationEmail,
    verifyToken
  };
}
