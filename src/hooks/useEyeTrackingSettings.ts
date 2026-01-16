import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type EyeTrackingProvider = 'auto' | 'webcam' | 'tobii';

export interface EyeTrackingSettings {
  preferred_provider: EyeTrackingProvider;
  tobii_enabled: boolean;
  calibration_points: number;
}

const DEFAULT_SETTINGS: EyeTrackingSettings = {
  preferred_provider: 'auto',
  tobii_enabled: false,
  calibration_points: 9
};

export function useEyeTrackingSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<EyeTrackingSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('eye_tracking_settings')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data?.eye_tracking_settings && typeof data.eye_tracking_settings === 'object') {
          const rawSettings = data.eye_tracking_settings as Record<string, unknown>;
          setSettings({
            preferred_provider: (rawSettings.preferred_provider as EyeTrackingProvider) || DEFAULT_SETTINGS.preferred_provider,
            tobii_enabled: typeof rawSettings.tobii_enabled === 'boolean' ? rawSettings.tobii_enabled : DEFAULT_SETTINGS.tobii_enabled,
            calibration_points: typeof rawSettings.calibration_points === 'number' ? rawSettings.calibration_points : DEFAULT_SETTINGS.calibration_points
          });
        }
      } catch (error) {
        console.error('Failed to fetch eye tracking settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<EyeTrackingSettings>) => {
    if (!user) return;

    setIsSaving(true);
    const updatedSettings = { ...settings, ...newSettings };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          eye_tracking_settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(updatedSettings);
      toast.success('Eye tracking settings updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  }, [user, settings]);

  // Set preferred provider
  const setPreferredProvider = useCallback((provider: EyeTrackingProvider) => {
    updateSettings({ preferred_provider: provider });
  }, [updateSettings]);

  // Toggle Tobii
  const setTobiiEnabled = useCallback((enabled: boolean) => {
    updateSettings({ tobii_enabled: enabled });
  }, [updateSettings]);

  // Set calibration points
  const setCalibrationPoints = useCallback((points: number) => {
    updateSettings({ calibration_points: points });
  }, [updateSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    updateSettings,
    setPreferredProvider,
    setTobiiEnabled,
    setCalibrationPoints
  };
}
