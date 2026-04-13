import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Frame, TextConfig, PhotoConfig } from '../types';
import { renderCanvas } from '../utils/canvasUtils';
import { DEFAULT_CANVAS_SIZE } from '../constants';

interface PreviewCanvasProps {
  templateImg: HTMLImageElement | null;
  photoImg: HTMLImageElement | null;
  frame: Frame;
  textConfig: TextConfig;
  photoConfig: PhotoConfig;
  setPhotoConfig: (config: PhotoConfig) => void;
  setTextConfig: (config: TextConfig) => void;
  setCanvasRef: (ref: HTMLCanvasElement | null) => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  templateImg,
  photoImg,
  frame,
  textConfig,
  photoConfig,
  setPhotoConfig,
  setTextConfig,
  setCanvasRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragTarget, setDragTarget] = useState<'photo' | 'text' | null>(null);

  useEffect(() => {
    setCanvasRef(canvasRef.current);
  }, [setCanvasRef]);

  // Render Loop
  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const doRender = async () => {
      setIsRendering(true);
      if (active) {
        await renderCanvas(canvas, templateImg, photoImg, frame, textConfig, photoConfig);
      }
      if (active) setIsRendering(false);
    };

    doRender();

    return () => { active = false; };
  }, [templateImg, photoImg, frame, textConfig, photoConfig]);

  // Mouse Interaction for Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const scaleFactor = canvas.width / rect.width;
    const clickX = (e.clientX - rect.left) * scaleFactor;
    const clickY = (e.clientY - rect.top) * scaleFactor;

    // Hit Testing Logic:
    // If inside frame box -> Drag Photo (if photo exists)
    // Else -> Drag Text
    
    if (clickX >= frame.x && clickX <= frame.x + frame.w && 
        clickY >= frame.y && clickY <= frame.y + frame.h) {
       if (photoImg) {
         setDragTarget('photo');
       } else {
         setDragTarget('text'); 
       }
    } else {
       setDragTarget('text');
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleFactor = canvas.width / rect.width;

    const deltaX = (e.clientX - dragStart.x) * scaleFactor;
    const deltaY = (e.clientY - dragStart.y) * scaleFactor;

    if (dragTarget === 'photo') {
        setPhotoConfig({
          ...photoConfig,
          x: photoConfig.x + deltaX,
          y: photoConfig.y + deltaY
        });
    } else if (dragTarget === 'text') {
        setTextConfig({
            ...textConfig,
            x: textConfig.x + deltaX,
            y: textConfig.y + deltaY
        });
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
  };

  return (
    <div className="flex-1 bg-gray-200 flex items-center justify-center p-2 lg:p-10 overflow-hidden relative select-none">
       {/* Pattern Background */}
       <div className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{
                backgroundImage: `linear-gradient(45deg, #000 25%, transparent 25%), 
                                  linear-gradient(-45deg, #000 25%, transparent 25%), 
                                  linear-gradient(45deg, transparent 75%, #000 75%), 
                                  linear-gradient(-45deg, transparent 75%, #000 75%)`,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}>
       </div>

      <div 
        ref={containerRef}
        className="relative shadow-2xl rounded-sm overflow-hidden bg-white max-w-full max-h-full aspect-square"
      >
        <canvas
          ref={canvasRef}
          width={DEFAULT_CANVAS_SIZE}
          height={DEFAULT_CANVAS_SIZE}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`w-full h-full object-contain max-h-[85vh] cursor-move`}
          style={{ maxWidth: '100%', maxHeight: '85vh' }}
        />
        {isRendering && (
          <div className="absolute top-2 right-2">
             <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
};