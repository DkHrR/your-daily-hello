import { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, AlertTriangle, TrendingDown, ArrowRight } from 'lucide-react';

interface FixationPoint {
  x: number;
  y: number;
  duration: number;
  timestamp: number;
}

interface GazeHeatmapReportProps {
  fixations: FixationPoint[];
  saccades?: Array<{ startX: number; startY: number; endX: number; endY: number }>;
  textBounds?: { left: number; top: number; width: number; height: number };
  className?: string;
}

export function GazeHeatmapReport({ 
  fixations, 
  saccades = [], 
  textBounds,
  className = '' 
}: GazeHeatmapReportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate metrics
  const totalFixations = fixations.length;
  const avgDuration = fixations.length > 0 
    ? fixations.reduce((sum, f) => sum + f.duration, 0) / fixations.length 
    : 0;
  const prolongedFixations = fixations.filter(f => f.duration > 400).length;
  
  // Count regressions (backward saccades)
  const regressions = saccades.filter(s => s.endX < s.startX).length;
  const regressionRate = saccades.length > 0 ? (regressions / saccades.length) * 100 : 0;

  // Find struggle areas (high fixation clusters)
  const findHotspots = () => {
    if (fixations.length === 0) return [];
    
    const gridSize = 50;
    const grid: Record<string, { count: number; totalDuration: number; x: number; y: number }> = {};
    
    fixations.forEach(f => {
      const key = `${Math.floor(f.x / gridSize)}-${Math.floor(f.y / gridSize)}`;
      if (!grid[key]) {
        grid[key] = { count: 0, totalDuration: 0, x: f.x, y: f.y };
      }
      grid[key].count++;
      grid[key].totalDuration += f.duration;
    });
    
    return Object.values(grid)
      .filter(cell => cell.count > 3 || cell.totalDuration > 1000)
      .sort((a, b) => b.totalDuration - a.totalDuration)
      .slice(0, 5);
  };

  const hotspots = findHotspots();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || fixations.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = 'hsl(var(--muted) / 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text area indicator
    if (textBounds) {
      const scaleX = canvas.width / (textBounds.width * 2);
      const scaleY = canvas.height / (textBounds.height * 2);
      ctx.strokeStyle = 'hsl(var(--border))';
      ctx.strokeRect(
        textBounds.left * scaleX,
        textBounds.top * scaleY,
        textBounds.width * scaleX,
        textBounds.height * scaleY
      );
    }

    // Normalize fixations to canvas size
    const minX = Math.min(...fixations.map(f => f.x));
    const maxX = Math.max(...fixations.map(f => f.x));
    const minY = Math.min(...fixations.map(f => f.y));
    const maxY = Math.max(...fixations.map(f => f.y));
    
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const padding = 20;

    const normalize = (f: FixationPoint) => ({
      x: padding + ((f.x - minX) / rangeX) * (canvas.width - padding * 2),
      y: padding + ((f.y - minY) / rangeY) * (canvas.height - padding * 2)
    });

    // Draw saccade paths first (behind fixations)
    if (saccades.length > 0) {
      ctx.strokeStyle = 'hsl(var(--primary) / 0.2)';
      ctx.lineWidth = 1;
      
      saccades.forEach(s => {
        const start = normalize({ x: s.startX, y: s.startY, duration: 0, timestamp: 0 });
        const end = normalize({ x: s.endX, y: s.endY, duration: 0, timestamp: 0 });
        
        // Color regressions differently
        ctx.strokeStyle = s.endX < s.startX 
          ? 'hsl(var(--destructive) / 0.4)' 
          : 'hsl(var(--primary) / 0.2)';
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        
        // Draw arrow head for direction
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const arrowSize = 5;
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - arrowSize * Math.cos(angle - Math.PI / 6),
          end.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          end.x - arrowSize * Math.cos(angle + Math.PI / 6),
          end.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      });
    }

    // Draw heatmap using radial gradients
    fixations.forEach(f => {
      const { x, y } = normalize(f);
      const radius = Math.min(30, Math.max(8, f.duration / 20));
      
      // Intensity based on duration
      const intensity = Math.min(1, f.duration / 500);
      
      // Create radial gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      
      if (f.duration > 400) {
        // High duration - struggle area (red)
        gradient.addColorStop(0, `hsla(0, 70%, 50%, ${intensity * 0.7})`);
        gradient.addColorStop(0.5, `hsla(0, 70%, 50%, ${intensity * 0.3})`);
        gradient.addColorStop(1, 'transparent');
      } else if (f.duration > 200) {
        // Medium duration (yellow)
        gradient.addColorStop(0, `hsla(45, 90%, 50%, ${intensity * 0.6})`);
        gradient.addColorStop(0.5, `hsla(45, 90%, 50%, ${intensity * 0.2})`);
        gradient.addColorStop(1, 'transparent');
      } else {
        // Normal (green)
        gradient.addColorStop(0, `hsla(120, 70%, 50%, ${intensity * 0.5})`);
        gradient.addColorStop(0.5, `hsla(120, 70%, 50%, ${intensity * 0.15})`);
        gradient.addColorStop(1, 'transparent');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    });

    // Draw reading direction indicator
    if (fixations.length > 1) {
      const first = normalize(fixations[0]);
      const last = normalize(fixations[fixations.length - 1]);
      
      ctx.strokeStyle = 'hsl(var(--primary))';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

  }, [fixations, saccades, textBounds]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          Gaze Heatmap Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Heatmap Canvas */}
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <canvas
              ref={canvasRef}
              width={600}
              height={337}
              className="w-full h-full"
            />
          </div>
          
          {/* Metrics */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{totalFixations}</div>
                <div className="text-sm text-muted-foreground">Total Fixations</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{avgDuration.toFixed(0)}ms</div>
                <div className="text-sm text-muted-foreground">Avg Duration</div>
              </div>
            </div>
            
            {/* Warning indicators */}
            {prolongedFixations > 5 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Struggle Detected</p>
                  <p className="text-sm text-muted-foreground">
                    {prolongedFixations} prolonged fixations (&gt;400ms) indicate reading difficulty
                  </p>
                </div>
              </div>
            )}
            
            {regressionRate > 20 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <TrendingDown className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">High Regression Rate</p>
                  <p className="text-sm text-muted-foreground">
                    {regressionRate.toFixed(1)}% backward eye movements suggest decoding challenges
                  </p>
                </div>
              </div>
            )}
            
            {/* Legend */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Heatmap Legend</p>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span>Normal (&lt;200ms)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <span>Extended (200-400ms)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <span>Struggle (&gt;400ms)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-destructive" />
                  <span>Regression</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
