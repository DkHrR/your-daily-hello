/**
 * Tobii Pro SDK Adapter
 * Normalizes Tobii eye tracking data to match the application's gaze data format
 * Provides WebSocket communication with local Tobii Pro SDK server
 */

import { logger } from '@/lib/logger';

export interface TobiiConfig {
  websocketUrl: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  samplingRate?: number;
}

export interface TobiiGazeData {
  x: number;
  y: number;
  timestamp: number;
  leftPupilDiameter: number;
  rightPupilDiameter: number;
  leftEyePosition: { x: number; y: number; z: number };
  rightEyePosition: { x: number; y: number; z: number };
  validity: {
    leftEye: boolean;
    rightEye: boolean;
  };
  // Sub-degree precision gaze angles (clinical-grade)
  gazeAngle: {
    horizontal: number; // degrees
    vertical: number;   // degrees
  };
}

export interface TobiiDeviceInfo {
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  samplingRate: number;
  capabilities: string[];
}

export interface TobiiCalibrationResult {
  success: boolean;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  points: Array<{
    x: number;
    y: number;
    leftAccuracy: number;
    rightAccuracy: number;
  }>;
  averageAccuracy: number; // degrees
}

type GazeDataCallback = (data: TobiiGazeData) => void;
type ConnectionChangeCallback = (connected: boolean) => void;
type ErrorCallback = (error: Error) => void;

export interface TobiiAdapter {
  connect(): Promise<boolean>;
  disconnect(): void;
  startTracking(): Promise<void>;
  stopTracking(): void;
  calibrate(): Promise<TobiiCalibrationResult>;
  getDeviceInfo(): Promise<TobiiDeviceInfo>;
  onGazeData(callback: GazeDataCallback): void;
  onConnectionChange(callback: ConnectionChangeCallback): void;
  onError(callback: ErrorCallback): void;
  isConnected(): boolean;
}

class TobiiAdapterImpl implements TobiiAdapter {
  private config: TobiiConfig;
  private ws: WebSocket | null = null;
  private connected = false;
  private tracking = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  private gazeDataCallbacks: GazeDataCallback[] = [];
  private connectionCallbacks: ConnectionChangeCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];

  constructor(config: TobiiConfig) {
    this.config = {
      autoReconnect: true,
      reconnectInterval: 5000,
      samplingRate: 120,
      ...config,
    };
  }

  async connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        logger.info('Connecting to Tobii Pro SDK server...', { url: this.config.websocketUrl });

        this.ws = new WebSocket(this.config.websocketUrl);

        const connectionTimeout = setTimeout(() => {
          if (!this.connected) {
            this.ws?.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          this.connected = true;
          this.notifyConnectionChange(true);
          logger.info('Connected to Tobii Pro SDK server');
          
          // Request device enumeration
          this.sendCommand('enumerate_devices');
          resolve(true);
        };

        this.ws.onclose = () => {
          this.handleDisconnect();
        };

        this.ws.onerror = (event) => {
          clearTimeout(connectionTimeout);
          const error = new Error('WebSocket connection failed');
          this.notifyError(error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Connection failed');
        this.notifyError(err);
        reject(err);
      }
    });
  }

  disconnect(): void {
    this.stopTracking();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
    this.notifyConnectionChange(false);
  }

  async startTracking(): Promise<void> {
    if (!this.connected || !this.ws) {
      throw new Error('Not connected to Tobii device');
    }

    this.sendCommand('start_tracking', { samplingRate: this.config.samplingRate });
    this.tracking = true;
  }

  stopTracking(): void {
    if (this.connected && this.ws) {
      this.sendCommand('stop_tracking');
    }
    this.tracking = false;
  }

  async calibrate(): Promise<TobiiCalibrationResult> {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.ws) {
        reject(new Error('Not connected to Tobii device'));
        return;
      }

      // Set up calibration response handler
      const handleCalibration = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'calibration_result') {
            this.ws?.removeEventListener('message', handleCalibration);
            resolve(this.parseCalibrationResult(data));
          }
        } catch (e) {
          // Ignore parse errors for non-calibration messages
        }
      };

      this.ws.addEventListener('message', handleCalibration);

      // Start calibration
      this.sendCommand('start_calibration', {
        points: 9, // 9-point calibration for clinical accuracy
        autoAdvance: true,
      });

      // Timeout after 2 minutes
      setTimeout(() => {
        this.ws?.removeEventListener('message', handleCalibration);
        reject(new Error('Calibration timeout'));
      }, 120000);
    });
  }

  async getDeviceInfo(): Promise<TobiiDeviceInfo> {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.ws) {
        reject(new Error('Not connected'));
        return;
      }

      const handleDeviceInfo = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'device_info') {
            this.ws?.removeEventListener('message', handleDeviceInfo);
            resolve({
              model: data.model || 'Tobii Pro',
              serialNumber: data.serialNumber || 'Unknown',
              firmwareVersion: data.firmwareVersion || '1.0.0',
              samplingRate: data.samplingRate || 120,
              capabilities: data.capabilities || [],
            });
          }
        } catch (e) {
          // Ignore
        }
      };

      this.ws.addEventListener('message', handleDeviceInfo);
      this.sendCommand('get_device_info');

      setTimeout(() => {
        this.ws?.removeEventListener('message', handleDeviceInfo);
        // Return default info if no response
        resolve({
          model: 'Tobii Pro',
          serialNumber: 'Simulated',
          firmwareVersion: '1.0.0',
          samplingRate: 120,
          capabilities: ['gaze', 'pupil', 'calibration'],
        });
      }, 5000);
    });
  }

  onGazeData(callback: GazeDataCallback): void {
    this.gazeDataCallbacks.push(callback);
  }

  onConnectionChange(callback: ConnectionChangeCallback): void {
    this.connectionCallbacks.push(callback);
  }

  onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Private methods

  private handleMessage(rawData: string): void {
    try {
      const data = JSON.parse(rawData);

      switch (data.type) {
        case 'gaze_data':
          this.handleGazeData(data);
          break;
        case 'error':
          this.notifyError(new Error(data.message));
          break;
        case 'device_connected':
          logger.info('Tobii device connected', data);
          break;
        case 'device_disconnected':
          this.handleDisconnect();
          break;
      }
    } catch (error) {
      logger.warn('Failed to parse Tobii message', { rawData });
    }
  }

  private handleGazeData(data: any): void {
    // Convert Tobii native format to normalized format
    const normalizedData: TobiiGazeData = {
      x: this.normalizeCoordinate(data.gazePoint?.x, window.innerWidth),
      y: this.normalizeCoordinate(data.gazePoint?.y, window.innerHeight),
      timestamp: data.timestamp || Date.now(),
      leftPupilDiameter: data.leftEye?.pupilDiameter || 0,
      rightPupilDiameter: data.rightEye?.pupilDiameter || 0,
      leftEyePosition: data.leftEye?.gazeOrigin || { x: 0, y: 0, z: 0 },
      rightEyePosition: data.rightEye?.gazeOrigin || { x: 0, y: 0, z: 0 },
      validity: {
        leftEye: data.leftEye?.validity === 'valid',
        rightEye: data.rightEye?.validity === 'valid',
      },
      gazeAngle: {
        horizontal: data.gazeAngle?.horizontal || 0,
        vertical: data.gazeAngle?.vertical || 0,
      },
    };

    // Notify all callbacks
    for (const callback of this.gazeDataCallbacks) {
      callback(normalizedData);
    }
  }

  private normalizeCoordinate(value: number | undefined, max: number): number {
    if (value === undefined) return max / 2;
    // Tobii provides normalized coordinates (0-1), convert to screen pixels
    return Math.max(0, Math.min(max, value * max));
  }

  private handleDisconnect(): void {
    this.connected = false;
    this.tracking = false;
    this.notifyConnectionChange(false);

    if (this.config.autoReconnect) {
      logger.info('Scheduling Tobii reconnection...');
      this.reconnectTimer = setTimeout(() => {
        this.connect().catch((error) => {
          logger.warn('Reconnection failed', error);
        });
      }, this.config.reconnectInterval);
    }
  }

  private sendCommand(command: string, params?: Record<string, any>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn('Cannot send command, WebSocket not open');
      return;
    }

    this.ws.send(JSON.stringify({ command, ...params }));
  }

  private parseCalibrationResult(data: any): TobiiCalibrationResult {
    const points = data.points || [];
    const accuracies = points.map((p: any) => (p.leftAccuracy + p.rightAccuracy) / 2);
    const avgAccuracy = accuracies.length > 0
      ? accuracies.reduce((sum: number, a: number) => sum + a, 0) / accuracies.length
      : 1.0;

    let quality: TobiiCalibrationResult['quality'];
    if (avgAccuracy < 0.5) quality = 'excellent';
    else if (avgAccuracy < 0.8) quality = 'good';
    else if (avgAccuracy < 1.2) quality = 'fair';
    else quality = 'poor';

    return {
      success: data.success ?? (avgAccuracy < 1.5),
      quality,
      points,
      averageAccuracy: avgAccuracy,
    };
  }

  private notifyConnectionChange(connected: boolean): void {
    for (const callback of this.connectionCallbacks) {
      callback(connected);
    }
  }

  private notifyError(error: Error): void {
    for (const callback of this.errorCallbacks) {
      callback(error);
    }
  }
}

// Factory function
export function createTobiiAdapter(config: TobiiConfig): TobiiAdapter {
  return new TobiiAdapterImpl(config);
}

// Simulation adapter for testing without hardware
export function createSimulatedTobiiAdapter(): TobiiAdapter {
  let connected = false;
  let tracking = false;
  let intervalId: NodeJS.Timeout | null = null;
  const callbacks: {
    gaze: GazeDataCallback[];
    connection: ConnectionChangeCallback[];
    error: ErrorCallback[];
  } = {
    gaze: [],
    connection: [],
    error: [],
  };

  return {
    async connect() {
      connected = true;
      callbacks.connection.forEach(cb => cb(true));
      return true;
    },
    disconnect() {
      if (intervalId) clearInterval(intervalId);
      connected = false;
      tracking = false;
      callbacks.connection.forEach(cb => cb(false));
    },
    async startTracking() {
      tracking = true;
      // Simulate gaze data at 60fps
      intervalId = setInterval(() => {
        const data: TobiiGazeData = {
          x: window.innerWidth / 2 + (Math.random() - 0.5) * 100,
          y: window.innerHeight / 2 + (Math.random() - 0.5) * 100,
          timestamp: Date.now(),
          leftPupilDiameter: 3.5 + Math.random() * 0.5,
          rightPupilDiameter: 3.5 + Math.random() * 0.5,
          leftEyePosition: { x: 0, y: 0, z: 600 },
          rightEyePosition: { x: 65, y: 0, z: 600 },
          validity: { leftEye: true, rightEye: true },
          gazeAngle: { horizontal: 0, vertical: 0 },
        };
        callbacks.gaze.forEach(cb => cb(data));
      }, 16);
    },
    stopTracking() {
      if (intervalId) clearInterval(intervalId);
      tracking = false;
    },
    async calibrate() {
      return {
        success: true,
        quality: 'excellent' as const,
        points: [],
        averageAccuracy: 0.4,
      };
    },
    async getDeviceInfo() {
      return {
        model: 'Tobii Pro (Simulated)',
        serialNumber: 'SIM-001',
        firmwareVersion: '1.0.0',
        samplingRate: 60,
        capabilities: ['gaze', 'pupil'],
      };
    },
    onGazeData(cb) { callbacks.gaze.push(cb); },
    onConnectionChange(cb) { callbacks.connection.push(cb); },
    onError(cb) { callbacks.error.push(cb); },
    isConnected() { return connected; },
  };
}
