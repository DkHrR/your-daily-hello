/**
 * Tobii SDK Integration Hook
 * Provides clinical-grade eye tracking with sub-degree precision
 * using professional Tobii Pro eye tracking hardware
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import { 
  TobiiAdapter, 
  TobiiConfig, 
  TobiiGazeData, 
  TobiiCalibrationResult,
  createTobiiAdapter
} from '@/lib/tobiiAdapter';
import type { GazePoint, Fixation, Saccade, EyeTrackingMetrics } from '@/types/diagnostic';

interface TobiiEyeTrackingState {
  isConnected: boolean;
  isTracking: boolean;
  isCalibrated: boolean;
  deviceInfo: {
    model: string;
    serialNumber: string;
    firmwareVersion: string;
    samplingRate: number;
  } | null;
  calibrationQuality: 'poor' | 'fair' | 'good' | 'excellent' | null;
  error: string | null;
}

interface UseTobiiEyeTrackingReturn extends TobiiEyeTrackingState {
  initialize: () => Promise<boolean>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  calibrate: () => Promise<TobiiCalibrationResult>;
  disconnect: () => void;
  gazeData: GazePoint[];
  fixations: Fixation[];
  saccades: Saccade[];
  currentGaze: { x: number; y: number; leftPupil: number; rightPupil: number } | null;
  getMetrics: () => EyeTrackingMetrics;
  reset: () => void;
}

export function useTobiiEyeTracking(): UseTobiiEyeTrackingReturn {
  const [state, setState] = useState<TobiiEyeTrackingState>({
    isConnected: false,
    isTracking: false,
    isCalibrated: false,
    deviceInfo: null,
    calibrationQuality: null,
    error: null,
  });

  const [gazeData, setGazeData] = useState<GazePoint[]>([]);
  const [fixations, setFixations] = useState<Fixation[]>([]);
  const [saccades, setSaccades] = useState<Saccade[]>([]);
  const [currentGaze, setCurrentGaze] = useState<{
    x: number;
    y: number;
    leftPupil: number;
    rightPupil: number;
  } | null>(null);

  const adapterRef = useRef<TobiiAdapter | null>(null);
  const lastGazeRef = useRef<GazePoint | null>(null);
  const fixationStartRef = useRef<{ x: number; y: number; timestamp: number } | null>(null);

  // Fixation detection thresholds (tighter for clinical-grade hardware)
  const FIXATION_THRESHOLD = 15; // pixels - more precise with Tobii
  const FIXATION_MIN_DURATION = 80; // ms - lower threshold due to higher accuracy

  // Process incoming gaze data from Tobii
  const processGazeData = useCallback((data: TobiiGazeData) => {
    const { x, y, timestamp, leftPupilDiameter, rightPupilDiameter, validity } = data;

    // Skip invalid samples
    if (!validity.leftEye && !validity.rightEye) return;

    const point: GazePoint = { x, y, timestamp };
    
    setCurrentGaze({
      x,
      y,
      leftPupil: leftPupilDiameter,
      rightPupil: rightPupilDiameter,
    });

    setGazeData(prev => [...prev.slice(-1000), point]); // Keep more data for clinical analysis

    // Fixation and saccade detection
    const lastGaze = lastGazeRef.current;
    if (lastGaze) {
      const distance = Math.sqrt(
        Math.pow(x - lastGaze.x, 2) + Math.pow(y - lastGaze.y, 2)
      );

      if (distance < FIXATION_THRESHOLD) {
        if (!fixationStartRef.current) {
          fixationStartRef.current = { x, y, timestamp };
        }
      } else {
        const fixationStart = fixationStartRef.current;
        if (fixationStart) {
          const duration = timestamp - fixationStart.timestamp;
          if (duration >= FIXATION_MIN_DURATION) {
            setFixations(prev => [...prev, {
              x: fixationStart.x,
              y: fixationStart.y,
              duration,
              timestamp: fixationStart.timestamp,
            }]);
          }

          const isRegression = x < lastGaze.x;
          setSaccades(prev => [...prev, {
            startX: lastGaze.x,
            startY: lastGaze.y,
            endX: x,
            endY: y,
            duration: timestamp - lastGaze.timestamp,
            isRegression,
          }]);
        }
        fixationStartRef.current = null;
      }
    }

    lastGazeRef.current = point;
  }, []);

  // Initialize Tobii connection
  const initialize = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, error: null }));

    try {
      logger.info('Initializing Tobii SDK connection...');

      const config: TobiiConfig = {
        websocketUrl: 'ws://localhost:8080/tobii', // Local Tobii Pro SDK server
        autoReconnect: true,
        samplingRate: 120, // Hz - typical for Tobii Pro devices
      };

      const adapter = createTobiiAdapter(config);
      adapterRef.current = adapter;

      // Set up event handlers
      adapter.onGazeData(processGazeData);
      
      adapter.onConnectionChange((connected) => {
        setState(prev => ({ ...prev, isConnected: connected }));
        if (!connected) {
          setState(prev => ({ ...prev, isTracking: false }));
        }
      });

      adapter.onError((error) => {
        setState(prev => ({ ...prev, error: error.message }));
        logger.error('Tobii error:', error);
      });

      // Attempt connection
      const connected = await adapter.connect();
      
      if (connected) {
        const deviceInfo = await adapter.getDeviceInfo();
        setState(prev => ({
          ...prev,
          isConnected: true,
          deviceInfo,
        }));
        logger.info('Tobii SDK connected', { deviceInfo });
        return true;
      } else {
        throw new Error('Failed to establish connection to Tobii device');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Tobii initialization error';
      setState(prev => ({ ...prev, error: message }));
      logger.error('Tobii initialization failed:', error);
      return false;
    }
  }, [processGazeData]);

  // Start eye tracking
  const startTracking = useCallback(async () => {
    if (!adapterRef.current || !state.isConnected) {
      throw new Error('Tobii not connected');
    }

    await adapterRef.current.startTracking();
    setState(prev => ({ ...prev, isTracking: true }));
    logger.info('Tobii tracking started');
  }, [state.isConnected]);

  // Stop eye tracking
  const stopTracking = useCallback(() => {
    if (adapterRef.current) {
      adapterRef.current.stopTracking();
    }
    setState(prev => ({ ...prev, isTracking: false }));
    logger.info('Tobii tracking stopped');
  }, []);

  // Perform calibration
  const calibrate = useCallback(async (): Promise<TobiiCalibrationResult> => {
    if (!adapterRef.current || !state.isConnected) {
      throw new Error('Tobii not connected');
    }

    logger.info('Starting Tobii calibration...');
    const result = await adapterRef.current.calibrate();
    
    setState(prev => ({
      ...prev,
      isCalibrated: result.success,
      calibrationQuality: result.quality,
    }));

    logger.info('Tobii calibration complete', { result });
    return result;
  }, [state.isConnected]);

  // Disconnect from Tobii
  const disconnect = useCallback(() => {
    if (adapterRef.current) {
      adapterRef.current.disconnect();
      adapterRef.current = null;
    }
    setState({
      isConnected: false,
      isTracking: false,
      isCalibrated: false,
      deviceInfo: null,
      calibrationQuality: null,
      error: null,
    });
    logger.info('Tobii disconnected');
  }, []);

  // Reset collected data
  const reset = useCallback(() => {
    setGazeData([]);
    setFixations([]);
    setSaccades([]);
    setCurrentGaze(null);
    lastGazeRef.current = null;
    fixationStartRef.current = null;
  }, []);

  // Calculate metrics
  const getMetrics = useCallback((): EyeTrackingMetrics => {
    const prolongedFixations = fixations.filter(f => f.duration > 400).length;
    const regressionCount = saccades.filter(s => s.isRegression).length;
    const avgFixationDuration = fixations.length > 0
      ? fixations.reduce((sum, f) => sum + f.duration, 0) / fixations.length
      : 0;

    // Calculate fixation intersection coefficient (FIC)
    let intersections = 0;
    for (let i = 0; i < saccades.length - 1; i++) {
      for (let j = i + 1; j < saccades.length; j++) {
        const s1 = saccades[i];
        const s2 = saccades[j];
        const dx1 = s1.endX - s1.startX;
        const dy1 = s1.endY - s1.startY;
        const dx2 = s2.endX - s2.startX;
        const dy2 = s2.endY - s2.startY;
        const cross = dx1 * dy2 - dy1 * dx2;
        if (Math.abs(cross) > 0.001) intersections++;
      }
    }
    const fic = saccades.length > 1 ? intersections / (saccades.length * (saccades.length - 1) / 2) : 0;

    // Calculate chaos index
    let chaosIndex = 0;
    if (gazeData.length > 2) {
      let totalVariance = 0;
      for (let i = 2; i < gazeData.length; i++) {
        const angle1 = Math.atan2(
          gazeData[i - 1].y - gazeData[i - 2].y,
          gazeData[i - 1].x - gazeData[i - 2].x
        );
        const angle2 = Math.atan2(
          gazeData[i].y - gazeData[i - 1].y,
          gazeData[i].x - gazeData[i - 1].x
        );
        totalVariance += Math.abs(angle2 - angle1);
      }
      chaosIndex = totalVariance / (gazeData.length - 2);
    }

    return {
      totalFixations: fixations.length,
      averageFixationDuration: avgFixationDuration,
      regressionCount,
      prolongedFixations,
      chaosIndex,
      fixationIntersectionCoefficient: fic,
    };
  }, [fixations, saccades, gazeData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (adapterRef.current) {
        adapterRef.current.disconnect();
      }
    };
  }, []);

  return {
    ...state,
    initialize,
    startTracking,
    stopTracking,
    calibrate,
    disconnect,
    gazeData,
    fixations,
    saccades,
    currentGaze,
    getMetrics,
    reset,
  };
}

// Feature detection for Tobii availability
export function isTobiiAvailable(): boolean {
  // Check if running in a context where Tobii Pro SDK server might be available
  // This would typically check for a local WebSocket server or SDK presence
  if (typeof window === 'undefined') return false;
  
  // Check for Tobii Pro SDK indicator (set by local SDK installation)
  return Boolean((window as any).__TOBII_PRO_SDK_AVAILABLE__);
}
