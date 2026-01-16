import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Eye, Activity, Camera, Sparkles, Loader2 } from 'lucide-react';
import { useEyeTrackingSettings, EyeTrackingProvider } from '@/hooks/useEyeTrackingSettings';

export function EyeTrackingSettingsCard() {
  const { 
    settings, 
    isLoading, 
    isSaving,
    setPreferredProvider,
    setCalibrationPoints 
  } = useEyeTrackingSettings();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          Eye Tracking Settings
        </CardTitle>
        <CardDescription>
          Configure your preferred eye tracking provider and calibration options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Default Eye Tracking Provider</Label>
          <RadioGroup
            value={settings.preferred_provider}
            onValueChange={(value) => setPreferredProvider(value as EyeTrackingProvider)}
            className="space-y-3"
            disabled={isSaving}
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
              <RadioGroupItem value="auto" id="auto" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <Label htmlFor="auto" className="font-medium cursor-pointer">
                    Auto-detect
                  </Label>
                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically selects the best available tracker (Tobii → MediaPipe → WebGazer)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
              <RadioGroupItem value="webcam" id="webcam" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="webcam" className="font-medium cursor-pointer">
                    Webcam Only
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use MediaPipe FaceMesh or WebGazer (no external hardware required)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
              <RadioGroupItem value="tobii" id="tobii" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="tobii" className="font-medium cursor-pointer">
                    Tobii Pro SDK
                  </Label>
                  <Badge variant="outline" className="text-xs">Clinical</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Professional-grade eye tracking with sub-degree precision (requires Tobii hardware)
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Calibration Points */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-sm font-medium">Calibration Points</Label>
          <p className="text-xs text-muted-foreground">
            More points improve accuracy but require more time to calibrate
          </p>
          <div className="flex gap-2">
            {[5, 9, 13].map((points) => (
              <Button
                key={points}
                variant={settings.calibration_points === points ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setCalibrationPoints(points)}
                disabled={isSaving}
              >
                {points} Points
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {settings.calibration_points === 5 && "Quick calibration - suitable for assessments with time constraints"}
            {settings.calibration_points === 9 && "Standard calibration - balanced accuracy and speed"}
            {settings.calibration_points === 13 && "Detailed calibration - maximum accuracy for clinical use"}
          </p>
        </div>

        {/* Tobii Info */}
        {settings.preferred_provider === 'tobii' && (
          <div className="p-3 rounded-lg bg-primary/10 text-sm">
            <p className="font-medium text-primary mb-1">Tobii Pro SDK Integration</p>
            <p className="text-xs text-muted-foreground">
              Ensure the Tobii Pro SDK server is running on your machine. The system will automatically 
              connect via WebSocket to receive high-precision gaze data at 60-300Hz depending on your device.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
