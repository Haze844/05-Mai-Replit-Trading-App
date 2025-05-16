import { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, RotateCcw, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Globaler Singleton-Viewer für Bilder
 * Dieser wird direkt über ein globales Event-System angesprochen,
 * um Rendering-Probleme zu vermeiden.
 */

type ImageConfig = {
  url: string;
  alt?: string;
};

// Singleton instanz
let activeViewer: { 
  show: (config: ImageConfig) => void;
  hide: () => void;
} | null = null;

// Globale Event-Namen
const VIEWER_EVENTS = {
  REGISTER: 'standalone-image-viewer:register',
  SHOW: 'standalone-image-viewer:show',
  HIDE: 'standalone-image-viewer:hide'
};

// Hilfsfunktion, um Bilder anzuzeigen (kann überall im Code verwendet werden)
export function showImage(imageUrl: string, alt?: string) {
  // Einfache Direktanzeige des Bildes anstelle von Event-basierter Kommunikation
  if (typeof window !== 'undefined' && activeViewer) {
    activeViewer.show({ url: imageUrl, alt });
  } else {
    console.error("StandaloneImageViewer ist nicht initialisiert oder window ist nicht verfügbar");
    
    // Fallback: neues Fenster öffnen 
    if (typeof window !== 'undefined') {
      window.open(imageUrl, '_blank');
    }
  }
}

// Hauptkomponente
export default function StandaloneImageViewer() {
  const [isVisible, setIsVisible] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageAlt, setImageAlt] = useState<string>('Bild-Vorschau');
  
  // Zoom und Navigation
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Bilder anzeigen
  const showViewer = (config: ImageConfig) => {
    setImageUrl(config.url);
    setImageAlt(config.alt || 'Bild-Vorschau');
    setIsVisible(true);
    
    // Werte zurücksetzen
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };
  
  // Viewer ausblenden
  const hideViewer = () => {
    setIsVisible(false);
    // Leicht verzögert das Bild entfernen, für Animationen
    setTimeout(() => {
      setImageUrl(null);
    }, 300);
  };
  
  // Bei der ersten Montage als aktiver Viewer registrieren
  useEffect(() => {
    // Singleton registrieren
    activeViewer = {
      show: showViewer,
      hide: hideViewer
    };
    
    // Auf Event-Nachrichten lauschen
    const handleShowEvent = (e: CustomEvent<ImageConfig>) => {
      if (e.detail?.url) {
        showViewer(e.detail);
      }
    };
    
    const handleHideEvent = () => {
      hideViewer();
    };
    
    // Event-Listener hinzufügen
    window.addEventListener(
      VIEWER_EVENTS.SHOW, 
      handleShowEvent as EventListener
    );
    window.addEventListener(
      VIEWER_EVENTS.HIDE, 
      handleHideEvent as EventListener
    );
    
    // Als aktiv markieren
    window.dispatchEvent(new CustomEvent(VIEWER_EVENTS.REGISTER));
    
    // Cleanup bei Unmount
    return () => {
      activeViewer = null;
      window.removeEventListener(
        VIEWER_EVENTS.SHOW, 
        handleShowEvent as EventListener
      );
      window.removeEventListener(
        VIEWER_EVENTS.HIDE, 
        handleHideEvent as EventListener
      );
    };
  }, []);
  
  // Escape-Taste zum Schließen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        hideViewer();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

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
  
  // Wenn nicht sichtbar oder kein Bild, nichts rendern
  if (!isVisible || !imageUrl) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center"
      onClick={hideViewer}
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
          onClick={hideViewer}
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
            src={imageUrl} 
            alt={imageAlt} 
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