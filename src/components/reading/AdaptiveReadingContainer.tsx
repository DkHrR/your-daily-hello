import { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDynamicUI } from '@/hooks/useDynamicUI';
import { cn } from '@/lib/utils';

interface AdaptiveReadingContainerProps {
  children: ReactNode;
  eyeTrackingChaos?: number;
  fixationDuration?: number;
  regressionRate?: number;
  voiceFluency?: number;
  className?: string;
}

export function AdaptiveReadingContainer({
  children,
  eyeTrackingChaos = 0,
  fixationDuration = 200,
  regressionRate = 0,
  voiceFluency = 100,
  className,
}: AdaptiveReadingContainerProps) {
  const { adaptations, riskLevel, isAdapting, analyzeAndAdapt, cssVars } = useDynamicUI();
  const [showAdaptationNotice, setShowAdaptationNotice] = useState(false);

  // Re-analyze when risk indicators change significantly
  useEffect(() => {
    const newAdaptations = analyzeAndAdapt({
      eyeTrackingChaos,
      fixationDuration,
      regressionRate,
      voiceFluency,
    });

    // Show notice if significant adaptation occurred
    if (newAdaptations.fontSize > 1 || newAdaptations.dyslexicFont) {
      setShowAdaptationNotice(true);
      setTimeout(() => setShowAdaptationNotice(false), 3000);
    }
  }, [eyeTrackingChaos, fixationDuration, regressionRate, voiceFluency, analyzeAndAdapt]);

  return (
    <div className="relative">
      {/* Adaptation notice */}
      <AnimatePresence>
        {showAdaptationNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-50"
          >
            <div className={cn(
              "px-4 py-2 rounded-full text-sm font-medium shadow-lg",
              riskLevel === 'high' && "bg-destructive text-destructive-foreground",
              riskLevel === 'moderate' && "bg-warning text-warning-foreground",
              riskLevel === 'low' && "bg-success text-success-foreground",
            )}>
              {riskLevel === 'high' && "🎯 UI adapted for easier reading"}
              {riskLevel === 'moderate' && "📖 Text spacing adjusted"}
              {riskLevel === 'low' && "✓ Optimal reading conditions"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adaptive container */}
      <motion.div
        className={cn(
          "transition-all duration-500 ease-out",
          adaptations.contrast === 'high' && "bg-background text-foreground",
          adaptations.dyslexicFont && "font-mono",
          className,
        )}
        style={{
          ...cssVars,
          fontSize: `calc(1rem * ${adaptations.fontSize})`,
          letterSpacing: `${adaptations.letterSpacing}em`,
          lineHeight: adaptations.lineHeight,
          wordSpacing: `${adaptations.wordSpacing}em`,
        }}
        animate={{
          scale: isAdapting ? 1.01 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>

      {/* Risk level indicator */}
      <div className="absolute bottom-2 right-2 flex items-center gap-2 text-xs text-muted-foreground">
        <div className={cn(
          "w-2 h-2 rounded-full",
          riskLevel === 'high' && "bg-destructive animate-pulse",
          riskLevel === 'moderate' && "bg-warning",
          riskLevel === 'low' && "bg-success",
        )} />
        <span>
          {riskLevel === 'high' && 'Difficulty detected'}
          {riskLevel === 'moderate' && 'Mild difficulty'}
          {riskLevel === 'low' && 'Reading smoothly'}
        </span>
      </div>
    </div>
  );
}
