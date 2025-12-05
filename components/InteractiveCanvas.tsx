import React, { useRef } from 'react';
import { Point, PointType } from '../types';

interface InteractiveCanvasProps {
  imageSrc: string;
  points: Point[];
  mode: PointType;
  onPointAdd: (point: Point) => void;
  onPointRemove: (id: string) => void;
}

const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({ 
  imageSrc, 
  points, 
  mode, 
  onPointAdd,
  onPointRemove
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !imgRef.current) return;

    // We must use the image rect to calculate percentages correctly.
    // If the image is smaller than the container (object-contain), we need to ignore clicks in the empty space.
    const rect = imgRef.current.getBoundingClientRect();
    
    // Calculate click position relative to the image element
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Ensure click is strictly within the image bounds
    if (clickX < 0 || clickX > rect.width || clickY < 0 || clickY > rect.height) return;

    // Calculate percentage coordinates (0.0 to 1.0)
    const xPct = clickX / rect.width;
    const yPct = clickY / rect.height;

    const newPoint: Point = {
      id: Math.random().toString(36).substr(2, 9),
      x: xPct,
      y: yPct,
      type: mode,
    };

    onPointAdd(newPoint);
  };

  const handlePointClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent adding a new point when clicking an existing one
    onPointRemove(id);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gray-900/50 rounded-lg overflow-hidden min-h-[300px]">
      <div 
        ref={containerRef}
        className={`relative inline-block cursor-crosshair`}
        onClick={handleImageClick}
      >
        <img 
          ref={imgRef}
          src={imageSrc} 
          alt="Source" 
          className="max-h-[60vh] max-w-full object-contain pointer-events-none select-none"
        />
        
        {/* Render Points */}
        {points.map((p) => (
          <div
            key={p.id}
            onClick={(e) => handlePointClick(e, p.id)}
            className={`absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-150 transition-all z-10 group
              ${p.type === PointType.POSITIVE ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'}`}
            style={{
              left: `${p.x * 100}%`,
              top: `${p.y * 100}%`,
            }}
            title="Click to remove point"
          >
             <span className={`absolute w-full h-full rounded-full opacity-50 animate-ping ${p.type === PointType.POSITIVE ? 'bg-green-400' : 'bg-red-400'}`}></span>
          </div>
        ))}
      </div>
      
      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg pointer-events-none transition-colors border ${mode === PointType.POSITIVE ? 'bg-green-500/20 border-green-500/30 text-green-100' : 'bg-red-500/20 border-red-500/30 text-red-100'}`}>
        Current Mode: {mode === PointType.POSITIVE ? 'ADD (+)' : 'SUBTRACT (-)'}
      </div>
    </div>
  );
};

export default InteractiveCanvas;