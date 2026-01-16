import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Eye, 
  Wifi, 
  WifiOff, 
  Camera, 
  Activity, 
  Settings2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useTobiiEyeTracking } from '@/hooks/useTobiiEyeTracking';
import { useEyeTrackingSettings, EyeTrackingProvider } from '@/hooks/useEyeTrackingSettings';
import { cn } from '@/lib/utils';

interface TobiiStatusIndicatorProps {
  compact?: boolean;
  onProviderChange?: (provider: 'webcam' | 'tobii') => void;
  className?: string;
}

export function TobiiStatusIndicator({ 
  compact = false, 
  onProviderChange,
  className 
}: TobiiStatusIndicatorProps) {
  const tobii = useTobiiEyeTracking();
  const isConnected = tobii.isConnected;
  const isTracking = tobii.isTracking;
  
  // Map to expected interface
  const connect = tobii.initialize;
  const disconnect = tobii.disconnect;
  const debugInfo = {
    sampleRate: tobii.deviceInfo?.samplingRate || 0,
    fps: 60,
    trackingQuality: tobii.calibrationQuality === 'excellent' ? 1 : tobii.calibrationQuality === 'good' ? 0.8 : 0.5
  };
  const connectionStatus = tobii.error;
  
  const { 
    settings, 
    isLoading: settingsLoading, 
    setPreferredProvider,
    setTobiiEnabled 
  } = useEyeTrackingSettings();

  const [isConnecting, setIsConnecting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleProviderToggle = (useTobii: boolean) => {
    const provider: EyeTrackingProvider = useTobii ? 'tobii' : 'webcam';
    setPreferredProvider(provider);
    setTobiiEnabled(useTobii);
    onProviderChange?.(useTobii ? 'tobii' : 'webcam');
  };

  // Compact mode - just a status badge
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge 
          variant={isConnected ? "default" : "outline"}
          className={cn(
            "flex items-center gap-1.5 cursor-pointer transition-colors",
            isConnected 
              ? "bg-success/20 text-success border-success/50 hover:bg-success/30" 
              : "hover:bg-muted"
          )}
          onClick={() => setShowSettings(!showSettings)}
        >
          {isConnected ? (
            <>
              <Activity className="w-3 h-3" />
              Tobii
            </>
          ) : settings.preferred_provider === 'tobii' ? (
            <>
              <WifiOff className="w-3 h-3" />
              Tobii Offline
            </>
          ) : (
            <>
              <Camera className="w-3 h-3" />
              Webcam
            </>
          )}
        </Badge>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 z-50"
            >
              <Card className="w-72 shadow-lg">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Use Tobii Eye Tracker</Label>
                    <Switch
                      checked={settings.preferred_provider === 'tobii'}
                      onCheckedChange={handleProviderToggle}
                      disabled={settingsLoading}
                    />
                  </div>

                  {settings.preferred_provider === 'tobii' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span className={isConnected ? 'text-success' : 'text-destructive'}>
                          {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant={isConnected ? "outline" : "default"}
                        className="w-full"
                        onClick={isConnected ? handleDisconnect : handleConnect}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Connecting...
                          </>
                        ) : isConnected ? (
                          <>
                            <WifiOff className="w-3 h-3" />
                            Disconnect
                          </>
                        ) : (
                          <>
                            <Wifi className="w-3 h-3" />
                            Connect
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full card mode
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Eye Tracking Hardware
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider Selection */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Webcam Tracking</p>
              <p className="text-xs text-muted-foreground">MediaPipe / WebGazer</p>
            </div>
          </div>
          <Badge 
            variant={settings.preferred_provider !== 'tobii' ? "default" : "outline"}
            className={settings.preferred_provider !== 'tobii' ? "bg-primary" : ""}
          >
            {settings.preferred_provider !== 'tobii' ? (
              <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
            ) : 'Inactive'}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Tobii Pro SDK</p>
              <p className="text-xs text-muted-foreground">Clinical-grade precision</p>
            </div>
          </div>
          <Badge 
            variant={isConnected ? "default" : "outline"}
            className={cn(
              isConnected 
                ? "bg-success text-success-foreground" 
                : settings.preferred_provider === 'tobii' 
                  ? "border-warning text-warning"
                  : ""
            )}
          >
            {isConnected ? (
              <><CheckCircle className="w-3 h-3 mr-1" /> Connected</>
            ) : settings.preferred_provider === 'tobii' ? (
              <><XCircle className="w-3 h-3 mr-1" /> Disconnected</>
            ) : 'Inactive'}
          </Badge>
        </div>

        {/* Provider Toggle */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Label className="text-sm">Use Professional Eye Tracker</Label>
          <Switch
            checked={settings.preferred_provider === 'tobii'}
            onCheckedChange={handleProviderToggle}
            disabled={settingsLoading}
          />
        </div>

        {/* Tobii Connection Controls */}
        {settings.preferred_provider === 'tobii' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 pt-2"
          >
            <div className="flex gap-2">
              <Button
                variant={isConnected ? "outline" : "default"}
                className="flex-1"
                onClick={isConnected ? handleDisconnect : handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : isConnected ? (
                  <>
                    <WifiOff className="w-4 h-4" />
                    Disconnect
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" />
                    Connect to Tobii
                  </>
                )}
              </Button>
              {isConnected && (
                <Button variant="outline" size="icon" onClick={handleConnect}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Debug Info */}
            {isConnected && debugInfo && (
              <div className="p-3 rounded-lg bg-muted/30 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sample Rate</span>
                  <span className="font-mono">{debugInfo.sampleRate} Hz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">FPS</span>
                  <span className="font-mono">{debugInfo.fps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tracking Quality</span>
                  <span className={cn(
                    "font-mono",
                    debugInfo.trackingQuality > 0.8 ? "text-success" :
                    debugInfo.trackingQuality > 0.5 ? "text-warning" : "text-destructive"
                  )}>
                    {(debugInfo.trackingQuality * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}

            {/* Connection Status Message */}
            {connectionStatus && !isConnected && (
              <p className="text-xs text-muted-foreground text-center">
                {connectionStatus}
              </p>
            )}
          </motion.div>
        )}

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-3 border-t space-y-3"
            >
              <div className="flex items-center justify-between">
                <Label className="text-sm">Calibration Points</Label>
                <div className="flex gap-1">
                  {[5, 9, 13].map(points => (
                    <Button
                      key={points}
                      size="sm"
                      variant={settings.calibration_points === points ? "default" : "outline"}
                      className="w-10 h-8"
                      onClick={() => {
                        // This would need the updateSettings function
                      }}
                    >
                      {points}
                    </Button>
                  ))}
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                More calibration points improve accuracy but take longer to complete.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
