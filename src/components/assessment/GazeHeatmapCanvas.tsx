import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { Fixation, Saccade } from '@/types/diagnostic';

interface GazeHeatmapCanvasProps {
  fixations: Fixation[];
  saccades: Saccade[];
  width?: number;
  height?: number;
  showSaccades?: boolean;
  className?: string;
}

export const GazeHeatmapCanvas = forwardRef<HTMLCanvasElement, GazeHeatmapCanvasProps>(
  function GazeHeatmapCanvas(
    { fixations, saccades, width = 800, height = 400, showSaccades = true, className },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background
      ctx.fillStyle = 'hsl(var(--muted))';
      ctx.fillRect(0, 0, width, height);

      // Scale factors (assuming fixations are in screen coordinates)
      const scaleX = width / window.innerWidth;
      const scaleY = height / window.innerHeight;

      // Draw saccade vectors (blue lines)
      if (showSaccades) {
        ctx.strokeStyle = 'hsla(220, 70%, 50%, 0.3)';
        ctx.lineWidth = 1;

        saccades.forEach(saccade => {
          ctx.beginPath();
          ctx.moveTo(saccade.startX * scaleX, saccade.startY * scaleY);
          ctx.lineTo(saccade.endX * scaleX, saccade.endY * scaleY);
          ctx.stroke();

          // Draw arrow head for regressions
          if (saccade.isRegression) {
            ctx.strokeStyle = 'hsla(0, 70%, 50%, 0.5)';
            const angle = Math.atan2(
              saccade.endY - saccade.startY,
              saccade.endX - saccade.startX
            );
            const arrowLength = 6;
            ctx.beginPath();
            ctx.moveTo(saccade.endX * scaleX, saccade.endY * scaleY);
            ctx.lineTo(
              saccade.endX * scaleX - arrowLength * Math.cos(angle - Math.PI / 6),
              saccade.endY * scaleY - arrowLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(saccade.endX * scaleX, saccade.endY * scaleY);
            ctx.lineTo(
              saccade.endX * scaleX - arrowLength * Math.cos(angle + Math.PI / 6),
              saccade.endY * scaleY - arrowLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
            ctx.strokeStyle = 'hsla(220, 70%, 50%, 0.3)';
          }
        });
      }

      // Draw fixation heatmap
      fixations.forEach(fixation => {
        const x = fixation.x * scaleX;
        const y = fixation.y * scaleY;
        
        // Size based on duration (longer fixation = larger dot)
        const baseRadius = 5;
        const maxRadius = 30;
        const durationFactor = Math.min(fixation.duration / 1000, 1);
        const radius = baseRadius + (maxRadius - baseRadius) * durationFactor;

        // Color based on duration (red = prolonged fixation > 400ms)
        const isProlonged = fixation.duration > 400;
        
        // Create radial gradient for heat effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        
        if (isProlonged) {
          gradient.addColorStop(0, 'hsla(0, 90%, 50%, 0.8)');
          gradient.addColorStop(0.5, 'hsla(30, 90%, 50%, 0.4)');
          gradient.addColorStop(1, 'hsla(60, 90%, 50%, 0)');
        } else {
          gradient.addColorStop(0, 'hsla(200, 80%, 50%, 0.6)');
          gradient.addColorStop(0.5, 'hsla(200, 80%, 50%, 0.3)');
          gradient.addColorStop(1, 'hsla(200, 80%, 50%, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw legend
      const legendX = width - 150;
      const legendY = 20;
      
      ctx.font = '12px system-ui';
      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.fillText('Legend:', legendX, legendY);
      
      // Normal fixation
      ctx.fillStyle = 'hsla(200, 80%, 50%, 0.6)';
      ctx.beginPath();
      ctx.arc(legendX + 10, legendY + 20, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.fillText('Normal fixation', legendX + 25, legendY + 24);
      
      // Prolonged fixation
      ctx.fillStyle = 'hsla(0, 90%, 50%, 0.8)';
      ctx.beginPath();
      ctx.arc(legendX + 10, legendY + 40, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.fillText('Prolonged (>400ms)', legendX + 25, legendY + 44);
      
      // Regression
      if (showSaccades) {
        ctx.strokeStyle = 'hsla(0, 70%, 50%, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(legendX, legendY + 60);
        ctx.lineTo(legendX + 20, legendY + 60);
        ctx.stroke();
        ctx.fillStyle = 'hsl(var(--foreground))';
        ctx.fillText('Regression', legendX + 25, legendY + 64);
      }

    }, [fixations, saccades, width, height, showSaccades]);

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`rounded-lg border border-border ${className}`}
      />
    );
  }
);
