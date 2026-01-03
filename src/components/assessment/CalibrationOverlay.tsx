import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Target, Check, Sparkles } from 'lucide-react';
import type { CalibrationPoint } from '@/types/diagnostic';

interface CalibrationOverlayProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const calibrationPoints: CalibrationPoint[] = [
  { x: 10, y: 10, completed: false },
  { x: 50, y: 10, completed: false },
  { x: 90, y: 10, completed: false },
  { x: 10, y: 50, completed: false },
  { x: 50, y: 50, completed: false },
  { x: 90, y: 50, completed: false },
  { x: 10, y: 90, completed: false },
  { x: 50, y: 90, completed: false },
  { x: 90, y: 90, completed: false },
];

export function CalibrationOverlay({ onComplete, onSkip }: CalibrationOverlayProps) {
  const [points, setPoints] = useState(calibrationPoints);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const handlePointClick = useCallback(() => {
    setPoints(prev => 
      prev.map((p, i) => i === currentIndex ? { ...p, completed: true } : p)
    );
    
    if (currentIndex < points.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      setTimeout(onComplete, 1500);
    }
  }, [currentIndex, points.length, onComplete]);

  const currentPoint = points[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">Eye Tracking Calibration</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {isComplete ? 'Calibration Complete!' : 'Pop the Balloons!'}
          </h2>
          <p className="text-muted-foreground">
            {isComplete 
              ? 'Your eye tracking is now calibrated for accurate results.'
              : 'Look at each balloon and click to pop it. This helps calibrate the eye tracker.'
            }
          </p>
        </motion.div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {points.map((point, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                point.completed 
                  ? 'bg-success' 
                  : i === currentIndex 
                    ? 'bg-primary animate-pulse' 
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Skip button */}
        {!isComplete && onSkip && (
          <Button variant="ghost" size="sm" onClick={onSkip} className="mb-4">
            Skip Calibration
          </Button>
        )}
      </div>

      {/* Calibration points */}
      {!isComplete && (
        <AnimatePresence mode="wait">
          <motion.button
            key={currentIndex}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={handlePointClick}
            className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{
              left: `${currentPoint.x}%`,
              top: `${currentPoint.y}%`,
            }}
          >
            {/* Balloon */}
            <div className="relative w-full h-full">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  y: [0, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg group-hover:scale-110 transition-transform"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              {/* Balloon string */}
              <div className="absolute top-full left-1/2 w-0.5 h-8 bg-muted-foreground/30 -translate-x-1/2" />
            </div>
          </motion.button>
        </AnimatePresence>
      )}

      {/* Completion animation */}
      {isComplete && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center">
            <Check className="w-12 h-12 text-success" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
