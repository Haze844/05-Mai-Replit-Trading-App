import { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, RotateCcw, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimpleImageViewerProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function SimpleImageViewer({ imageUrl, onClose }: SimpleImageViewerProps) {
  // Zoom und Navigation Status
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Escape-Taste abfangen, ohne den Bearbeitungsmodus zu beeinflussen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Nur den Bildbetrachter schließen, aber das Event nicht propagieren
        e.stopPropagation();
        onClose();
      }
    };
    
    const currentContainer = containerRef.current;
    if (currentContainer) {
      currentContainer.tabIndex = -1; // Macht das Element fokussierbar
      currentContainer.focus(); // Element fokussieren
      currentContainer.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      if (currentContainer) {
        currentContainer.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [onClose, containerRef.current]);

  // Zoom-Funktionen
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  // Rotation-Funktionen
  const handleRotateClockwise = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleRotateCounterClockwise = () => {
    setRotation(prev => (prev - 90 + 360) % 360);
  };

  // Zurücksetzen aller Werte
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Handling des Drag-and-Drop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // nur linke Maustaste
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handling des Doppelklicks
  const handleDoubleClick = () => {
    if (scale !== 1) {
      handleReset();
    } else {
      setScale(2);
    }
  };

  // Handling des Scrollrads für Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale(prev => Math.min(prev + 0.1, 3));
    } else {
      setScale(prev => Math.max(prev - 0.1, 0.5));
    }
  };

  // Wenn kein Bild vorhanden, nichts anzeigen
  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={onClose}
      ref={containerRef}
    >
      <div 
        className="relative max-w-[90vw] max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Schließen-Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
        
        {/* Steuerungselemente */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-2 bg-black/50 rounded-full p-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white h-8 w-8"
            onClick={handleZoomIn}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white h-8 w-8"
            onClick={handleZoomOut}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon" 
            className="text-white h-8 w-8"
            onClick={handleRotateClockwise}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white h-8 w-8"
            onClick={handleRotateCounterClockwise}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white h-8 w-8"
            onClick={handleReset}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Zoom-Hint */}
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {Math.round(scale * 100)}% | Scrollen zum Zoomen
        </div>
        
        {/* Das Bild */}
        <div 
          className="select-none cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          style={{ 
            touchAction: 'none' // Verhindert Standard-Touch-Events
          }}
        >
          <img 
            ref={imgRef}
            src={imageUrl} 
            alt="Vergrößerte Ansicht" 
            className="max-w-none pointer-events-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
            onDragStart={(e) => e.preventDefault()} // Verhindert Standard-Drag
          />
        </div>
      </div>
    </div>
  );
}