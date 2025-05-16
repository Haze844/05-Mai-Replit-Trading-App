import { useState, useRef, useEffect, WheelEvent, MouseEvent } from "react";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageViewerPopupProps {
  image: string | null;
  onClose: () => void;
}

export default function ImageViewerPopup({ image, onClose }: ImageViewerPopupProps) {
  // State für Anzeige und Interaktion
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastClickTime, setLastClickTime] = useState(0);
  const [imageError, setImageError] = useState(false);
  
  // Refs für DOM-Elemente
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  
  // Prüfe, ob es ein TradingView-Link ist
  const isTradingViewLink = image && /tradingview\.com\/x\//i.test(image);

  // Setze Fokus und füge Keyboard-Handler hinzu
  useEffect(() => {
    if (!image) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    // Event-Listener hinzufügen
    window.addEventListener("keydown", handleEscape);
    
    // Verhindere Scrolling des Body während Popup offen ist
    document.body.style.overflow = 'hidden';
    
    // Event-Listener entfernen beim Cleanup
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = '';
    };
  }, [image, onClose]);
  
  // Verhindere, dass das Popup beim Beenden der Bearbeitung geschlossen wird
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Wenn ein Klickereignis außerhalb des Popups stattfindet
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        // Stoppe das Event, um zu verhindern, dass es übergeordnete Elemente erreicht
        e.stopPropagation();
      }
    };
    
    // Capture-Phase verwenden, um sicherzustellen, dass wir das Event zuerst bekommen
    document.addEventListener("click", handleClick as any, true);
    
    return () => {
      document.removeEventListener("click", handleClick as any, true);
    };
  }, []);

  // Wenn kein Bild gesetzt ist, zeige nichts an
  if (!image) return null;

  // URL für das anzuzeigende Bild
  const getDisplayUrl = () => {
    if (!image) return '';
    
    if (isTradingViewLink) {
      // Für TradingView Links
      return image;
    }
    
    // Für alle anderen Links
    return image;
  };

  // Funktion für Mausrad-Zoom
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Extrem sanfter Zoom-Faktor
    const delta = e.deltaY * -0.0025;
    
    // Bei kleinem Zoom noch sanfter zoomen
    const zoomFactor = scale < 1.5 ? 0.5 : 0.8;
    const adjustedDelta = delta * zoomFactor;
    
    // Berechnetes neues Zoom-Level mit Begrenzung
    const newScale = Math.min(Math.max(0.5, scale + adjustedDelta), 5);
    
    // Nur fortfahren, wenn sich das Zoom-Level merklich ändert
    if (Math.abs(newScale - scale) < 0.001) return;
    
    // Zentriere den Zoom auf die Mausposition
    if (imageRef.current && containerRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Berechne Offset für Zentrierung
      const offsetX = (e.clientX - containerRect.left) - containerRect.width / 2;
      const offsetY = (e.clientY - containerRect.top) - containerRect.height / 2;
      
      // Setze neue Position mit extrem sanfter Anpassung
      const positionAdjustment = 0.025;
      setPosition({
        x: position.x - offsetX * positionAdjustment,
        y: position.y - offsetY * positionAdjustment
      });
    }
    
    setScale(newScale);
  };
  
  // Double-Click-Handler für schnelles Zoomen
  const handleDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Sanfteres Zoomen beim Doppelklick
    const zoomIncrement = scale < 1.5 ? 0.3 : 0.4;
    const newScale = Math.min(scale + zoomIncrement, 5);
    
    // Zentriere den Zoom auf die Mausposition
    if (imageRef.current && containerRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Berechne Offset für Zentrierung
      const offsetX = (e.clientX - containerRect.left) - containerRect.width / 2;
      const offsetY = (e.clientY - containerRect.top) - containerRect.height / 2;
      
      // Setze Position mit sanfter Anpassung
      setPosition({
        x: position.x - offsetX * 0.2,
        y: position.y - offsetY * 0.2
      });
    }
    
    setScale(newScale);
  };
  
  // Maus-Down-Event für Drag-Start und Doppelklick-Erkennung
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // Nur mit linker Maustaste
    if (e.button !== 0) return;
    
    const now = Date.now();
    
    // Prüfe auf Doppelklick (Klicks innerhalb von 300ms)
    if (now - lastClickTime < 300) {
      handleDoubleClick(e);
      setLastClickTime(0); // Zurücksetzen, um Triple-Klicks zu verhindern
      return;
    }
    
    setLastClickTime(now);
    
    // Wenn nicht gezoomt, nicht ziehen
    if (scale <= 1) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  
  // Maus-Move-Event für Drag
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Limitiere die Bewegung basierend auf dem Zoom-Level
    const maxOffset = (scale - 1) * 200;
    const limitedX = Math.min(Math.max(newX, -maxOffset), maxOffset);
    const limitedY = Math.min(Math.max(newY, -maxOffset), maxOffset);
    
    setPosition({ x: limitedX, y: limitedY });
  };
  
  // Maus-Up-Event für Drag-Ende
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Funktion zum Zurücksetzen des Zooms
  const resetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };
  
  // Funktion zum gezielten Zoom-In
  const zoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newScale = Math.min(scale + 0.25, 5);
    setScale(newScale);
  };
  
  // Funktion zum gezielten Zoom-Out
  const zoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newScale = Math.max(scale - 0.25, 0.5);
    setScale(newScale);
    // Wenn wir unter 1.0 Zoom gehen, setze Position zurück
    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };
  
  // Funktion zum Rotieren
  const rotateImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(rotation + 90);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/95 transition-opacity duration-300"
      onClick={(e) => {
        // Schließe das Popup nur, wenn direkt auf den Hintergrund geklickt wird
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      ref={popupRef}
    >
      {/* Schließen-Button oben rechts */}
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute top-4 right-4 bg-black/50 border-white/20 text-white hover:bg-white/20 z-[1001]"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Zoom-Buttons unten */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-[1001] bg-black/50 rounded-full p-1.5">
        <Button 
          variant="outline" 
          size="icon" 
          className="bg-black/50 border-white/20 text-white hover:bg-white/20 h-8 w-8"
          onClick={zoomOut}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="bg-black/50 border-white/20 text-white hover:bg-white/20 h-8 w-8"
          onClick={zoomIn}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="bg-black/50 border-white/20 text-white hover:bg-white/20 h-8 w-8"
          onClick={rotateImage}
        >
          <RotateCw className="h-3.5 w-3.5" />
        </Button>
        <Button 
          variant="outline" 
          className="bg-black/50 border-white/20 text-white text-xs hover:bg-white/20 h-8 px-2"
          onClick={resetZoom}
        >
          Zurücksetzen
        </Button>
      </div>

      {/* Hinweis zum Ziehen des Bildes */}
      {scale > 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full z-[1001] whitespace-nowrap">
          Bild ziehen zum Verschieben des Ausschnitts
        </div>
      )}

      {/* Inhalt des Popups */}
      <div 
        className={`w-full h-full flex items-center justify-center p-4 overflow-hidden ${isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'}`}
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          // Verhindere, dass Klicks auf den Container das Popup schließen
          e.stopPropagation();
        }}
      >
        {isTradingViewLink && !imageError ? (
          // Für TradingView Link
          <div 
            className="relative max-w-full max-h-full" 
            style={{ 
              transformOrigin: 'center',
              cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'zoom-in'
            }}
            onClick={(e) => {
              // Verhindere Ereignis-Bubbling
              e.stopPropagation();
              
              // Bei nicht gezoomtem Bild, zoomen
              if (scale <= 1) {
                zoomIn(e);
              }
            }}
          >
            <img 
              ref={imageRef}
              src={getDisplayUrl()} 
              alt="TradingView Chart" 
              className="max-w-full max-h-full object-contain" 
              style={{ 
                transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
              }}
              onError={handleImageError}
              draggable={false}
            />
          </div>
        ) : (
          // Normales Bild
          <div 
            className="relative max-w-full max-h-full" 
            style={{ 
              transformOrigin: 'center',
              cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'zoom-in'
            }}
            onClick={(e) => {
              // Verhindere Ereignis-Bubbling
              e.stopPropagation();
              
              // Bei nicht gezoomtem Bild, zoomen
              if (scale <= 1) {
                zoomIn(e);
              }
            }}
          >
            <img 
              ref={imageRef}
              src={getDisplayUrl()} 
              alt="Bildvorschau" 
              className="max-w-full max-h-full object-contain" 
              style={{ 
                transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
              }}
              onError={handleImageError}
              draggable={false}
            />
          </div>
        )}

        {/* Fallback für Bildfehler */}
        {imageError && (
          <div className="text-white text-center p-6 bg-black/70 rounded-lg">
            <p>Das Bild konnte nicht geladen werden.</p>
            {image && <p className="text-sm text-gray-400 mt-2">{image}</p>}
            {isTradingViewLink && (
              <Button 
                variant="outline" 
                className="mt-4 border-white/20 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(image, '_blank');
                }}
              >
                Chart auf TradingView öffnen
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}