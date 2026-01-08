/**
 * GazeVisualizer: Debug visualization for gaze tracking
 * CRITICAL: Supports Ghost Mode - hidden by default during tests
 * Only visible when clinician toggles debug view
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { GazePoint, Fixation } from '@/types/diagnostic';
import { GazeHeatmapOverlay } from './GazeHeatmapOverlay';

interface GazeVisualizerProps {
  gazeData: GazePoint[];
  fixations: Fixation[];
  currentGaze: { x: number; y: number } | null;
  showHeatmap?: boolean;
  showScanpath?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
  /** When true, hides ALL visualization - student sees only text (Ghost Mode) */
  ghostMode?: boolean;
}

export function GazeVisualizer({
  gazeData,
  fixations,
  currentGaze,
  showHeatmap = true,
  showScanpath = true,
  containerRef,
  ghostMode = false,
}: GazeVisualizerProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Skip dimension updates in ghost mode
    if (ghostMode) return;

    const updateDimensions = () => {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      } else {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [containerRef, ghostMode]);

  // GHOST MODE: Return nothing - student sees only the text
  if (ghostMode) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {/* Enhanced Heatmap Canvas Overlay */}
      {showHeatmap && gazeData.length > 0 && (
        <GazeHeatmapOverlay
          gazeData={gazeData}
          fixations={fixations}
          width={dimensions.width || window.innerWidth}
          height={dimensions.height || window.innerHeight}
          opacity={0.6}
          gridSize={25}
        />
      )}

      {/* Scanpath lines */}
      {showScanpath && gazeData.length > 1 && (
        <svg className="absolute inset-0 w-full h-full">
          <path
            d={gazeData
              .slice(-100)
              .map((point, i) => 
                i === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
              )
              .join(' ')}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
        </svg>
      )}

      {/* Fixation circles */}
      {fixations.slice(-20).map((fixation, i) => (
        <motion.div
          key={`${fixation.timestamp}-${i}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          className="absolute rounded-full border-2 border-warning"
          style={{
            left: fixation.x - (fixation.duration / 20),
            top: fixation.y - (fixation.duration / 20),
            width: fixation.duration / 10,
            height: fixation.duration / 10,
            backgroundColor: fixation.duration > 400 
              ? 'hsl(var(--destructive) / 0.2)' 
              : 'hsl(var(--warning) / 0.2)',
          }}
        />
      ))}

      {/* Current gaze point */}
      {currentGaze && (
        <motion.div
          className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2"
          style={{ left: currentGaze.x, top: currentGaze.y }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
          }}
        >
          <div className="w-full h-full rounded-full bg-primary/30 border-2 border-primary" />
          <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
        </motion.div>
      )}
    </div>
  );
}
