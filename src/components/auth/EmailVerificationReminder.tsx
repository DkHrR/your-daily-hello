import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, X, Loader2 } from 'lucide-react';
import { useSmtpVerification } from '@/hooks/useSmtpVerification';

interface EmailVerificationReminderProps {
  email: string;
  onDismiss?: () => void;
}

export function EmailVerificationReminder({ email, onDismiss }: EmailVerificationReminderProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const { isSending, resendVerificationEmail } = useSmtpVerification();

  const handleResend = async () => {
    await resendVerificationEmail(email);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) return null;

  return (
    <Alert className="bg-amber-500/10 border-amber-500/50 relative">
      <Mail className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-600 dark:text-amber-400">
        Email Not Verified
      </AlertTitle>
      <AlertDescription className="text-amber-600/80 dark:text-amber-400/80">
        <p className="mb-3">
          Please verify your email address to unlock all features. Check your inbox for a confirmation link.
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleResend}
            disabled={isSending}
            className="border-amber-500/50 hover:bg-amber-500/10"
          >
            {isSending ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Resending...
              </>
            ) : (
              <>
                <Mail className="w-3 h-3 mr-1" />
                Resend Confirmation Email
              </>
            )}
          </Button>
        </div>
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={handleDismiss}
      >
        <X className="h-3 w-3" />
      </Button>
    </Alert>
  );
}
