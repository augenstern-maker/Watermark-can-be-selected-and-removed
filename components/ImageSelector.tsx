import React, { useRef, useState, useEffect } from 'react';

interface ImageSelectorProps {
  src: string;
  onMaskChange: (maskDataUrl: string | null) => void;
}

const ImageSelector: React.FC<ImageSelectorProps> = ({ src, onMaskChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [selection, setSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Refs to hold mutable state for drawing operations to avoid closure staleness in event handlers
  const drawingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const currentSelectionRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  // Initialize canvas size to match image natural size when image loads
  const handleImageLoad = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (img && canvas) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      drawCanvas();
    }
  };

  // Helper to map screen coordinates to image coordinates
  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const img = imgRef.current;
    if (!img) return { x: 0, y: 0 };

    const rect = img.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    drawingRef.current = true;
    setIsDrawing(true);
    
    const coords = getCoords(e);
    startPosRef.current = coords;
    
    const newSelection = { x: coords.x, y: coords.y, w: 0, h: 0 };
    currentSelectionRef.current = newSelection;
    setSelection(newSelection);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current || !startPosRef.current) return;
    
    const coords = getCoords(e);
    const startX = startPosRef.current.x;
    const startY = startPosRef.current.y;
    
    const w = coords.x - startX;
    const h = coords.y - startY;

    const newSelection = {
      x: w > 0 ? startX : coords.x,
      y: h > 0 ? startY : coords.y,
      w: Math.abs(w),
      h: Math.abs(h)
    };

    currentSelectionRef.current = newSelection;
    setSelection(newSelection);
  };

  const stopDrawing = () => {
    drawingRef.current = false;
    setIsDrawing(false);
    generateMask();
  };

  // Draw the UI overlay (User feedback)
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Use the ref for immediate drawing updates if currently drawing, otherwise state
    const activeSel = drawingRef.current ? currentSelectionRef.current : selection;

    if (activeSel && activeSel.w > 0 && activeSel.h > 0) {
      // Draw semi-transparent dim layer
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clear the selection area (make it "bright")
      ctx.clearRect(activeSel.x, activeSel.y, activeSel.w, activeSel.h);

      // Draw border around selection
      ctx.strokeStyle = '#00ff88'; // Emerald/Green bright color
      ctx.lineWidth = Math.max(2, canvas.width / 400); // Scale border slightly
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(activeSel.x, activeSel.y, activeSel.w, activeSel.h);
    }
  };

  // Generate the actual black/white mask for the AI
  const generateMask = () => {
    const img = imgRef.current;
    const sel = currentSelectionRef.current;

    if (!img || !sel || sel.w === 0 || sel.h === 0) {
      onMaskChange(null);
      return;
    }

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = img.naturalWidth;
    maskCanvas.height = img.naturalHeight;
    const ctx = maskCanvas.getContext('2d');
    
    if (ctx) {
      // Fill black (Protect area)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      
      // Fill white (Edit area)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sel.x, sel.y, sel.w, sel.h);
      
      onMaskChange(maskCanvas.toDataURL('image/png'));
    }
  };

  // Redraw canvas whenever selection state changes (triggered by React render)
  useEffect(() => {
    drawCanvas();
  }, [selection]);

  return (
    <div className="relative select-none w-full max-h-[500px] flex justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-slate-700 shadow-2xl group">
      <div ref={containerRef} className="relative inline-block">
        <img
          ref={imgRef}
          src={src}
          alt="Original"
          onLoad={handleImageLoad}
          className="max-w-full max-h-[500px] block pointer-events-none select-none"
        />
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none"
        />
      </div>
      
      {/* Helper Text Overlay */}
      {(!selection?.w || selection.w === 0) && (
         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs md:text-sm pointer-events-none backdrop-blur animate-fade-in whitespace-nowrap z-10">
           Click and drag to box the watermark
         </div>
      )}
      
      {selection?.w && selection.w > 0 && (
         <button 
           onClick={() => {
             setSelection(null);
             currentSelectionRef.current = null;
             onMaskChange(null);
           }}
           className="absolute top-4 right-4 bg-slate-800/80 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-md shadow border border-slate-600 backdrop-blur z-20 transition-colors"
         >
           Clear Selection
         </button>
      )}
    </div>
  );
};

export default ImageSelector;