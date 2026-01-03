import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock } from 'lucide-react';

interface StallIndicatorProps {
  isStalling: boolean;
  duration: number; // in milliseconds
  lastWord: string;
}

export function StallIndicator({ isStalling, duration, lastWord }: StallIndicatorProps) {
  const seconds = Math.floor(duration / 1000);
  const isLongStall = duration >= 3000;

  return (
    <AnimatePresence>
      {isStalling && duration >= 1500 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${
            isLongStall 
              ? 'bg-warning/10 border-warning text-warning' 
              : 'bg-muted border-border text-muted-foreground'
          }`}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {isLongStall ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </motion.div>
          
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {isLongStall ? 'Reading hesitation detected' : 'Pause detected'}
            </span>
            <span className="text-xs opacity-70">
              {seconds}s after "{lastWord}"
            </span>
          </div>

          {/* Duration bar */}
          <div className="w-16 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${isLongStall ? 'bg-warning' : 'bg-muted-foreground'}`}
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min((duration / 5000) * 100, 100)}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}