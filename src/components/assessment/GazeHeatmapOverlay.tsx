import { useRef, useEffect, useMemo, useState } from 'react';
import type { GazePoint, Fixation } from '@/types/diagnostic';

interface GazeHeatmapOverlayProps {
  gazeData: GazePoint[];
  fixations: Fixation[];
  width?: number;
  height?: number;
  opacity?: number;
  gridSize?: number;
}

export function GazeHeatmapOverlay({
  gazeData,
  fixations,
  width: propWidth,
  height: propHeight,
  opacity = 0.7,
  gridSize = 25,
}: GazeHeatmapOverlayProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    setDimensions({
      width: propWidth ?? window.innerWidth,
      height: propHeight ?? window.innerHeight
    });
  }, [propWidth, propHeight]);
  
  const width = propWidth ?? dimensions.width;
  const height = propHeight ?? dimensions.height;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Create heatmap data structure
  const heatmapGrid = useMemo(() => {
    const grid: Map<string, number> = new Map();
    
    // Add gaze points with weight 1
    gazeData.forEach(point => {
      const cellX = Math.floor(point.x / gridSize);
      const cellY = Math.floor(point.y / gridSize);
      const key = `${cellX},${cellY}`;
      grid.set(key, (grid.get(key) || 0) + 1);
    });

    // Add fixations with weight based on duration
    fixations.forEach(fix => {
      const cellX = Math.floor(fix.x / gridSize);
      const cellY = Math.floor(fix.y / gridSize);
      const key = `${cellX},${cellY}`;
      const weight = Math.min(fix.duration / 100, 10); // Cap at 10x weight
      grid.set(key, (grid.get(key) || 0) + weight);
    });

    return grid;
  }, [gazeData, fixations, gridSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (heatmapGrid.size === 0) return;

    // Find max heat value for normalization
    const maxHeat = Math.max(...heatmapGrid.values(), 1);

    // Draw heatmap cells
    heatmapGrid.forEach((heat, key) => {
      const [cellX, cellY] = key.split(',').map(Number);
      const normalizedHeat = heat / maxHeat;
      
      const centerX = cellX * gridSize + gridSize / 2;
      const centerY = cellY * gridSize + gridSize / 2;
      const radius = gridSize * 1.5;

      // Create radial gradient for smooth heat effect
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
      );

      // Color gradient from center (hot) to edge (cool)
      if (normalizedHeat > 0.7) {
        // High heat - red/orange
        gradient.addColorStop(0, `hsla(0, 85%, 55%, ${normalizedHeat * 0.8})`);
        gradient.addColorStop(0.5, `hsla(30, 90%, 50%, ${normalizedHeat * 0.5})`);
        gradient.addColorStop(1, 'transparent');
      } else if (normalizedHeat > 0.4) {
        // Medium heat - yellow/green
        gradient.addColorStop(0, `hsla(45, 90%, 55%, ${normalizedHeat * 0.7})`);
        gradient.addColorStop(0.5, `hsla(80, 70%, 50%, ${normalizedHeat * 0.4})`);
        gradient.addColorStop(1, 'transparent');
      } else {
        // Low heat - blue/cyan
        gradient.addColorStop(0, `hsla(200, 80%, 55%, ${normalizedHeat * 0.6})`);
        gradient.addColorStop(0.5, `hsla(180, 60%, 50%, ${normalizedHeat * 0.3})`);
        gradient.addColorStop(1, 'transparent');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [heatmapGrid, width, height, gridSize]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pointer-events-none fixed inset-0 z-30"
      style={{ opacity }}
    />
  );
}
