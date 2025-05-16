import { useState } from "react";
import { Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import SimpleImageViewer from "./SimpleImageViewer";

interface ImagePreviewProps {
  image: string;
  alt: string;
}

export default function ImagePreview({ image, alt }: ImagePreviewProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Funktion zum Öffnen des Bildes im eigenständigen Viewer
  const handleOpenImage = () => {
    console.log("ImagePreview: Bild wird geöffnet", image);
    setIsViewerOpen(true);
  };

  return (
    <>
      <div className="rounded-lg overflow-hidden border border-border relative group">
        <div className="relative pb-[60%] w-full">
          <img 
            src={image} 
            alt={alt} 
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Semi-transparente Overlay mit Vollbild-Button */}
          <div className="absolute inset-0 w-full h-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={handleOpenImage}
            >
              <Maximize className="h-6 w-6" />
            </Button>
          </div>
        </div>
        
        <div className="p-2 bg-muted/30 text-xs text-center text-muted-foreground flex justify-between items-center">
          <span>TradingView Chart</span>
          <Button 
            variant="link" 
            size="sm" 
            className="text-xs text-muted-foreground/80 italic p-0 h-auto hover:text-primary"
            onClick={handleOpenImage}
          >
            Klicken zum Vergrößern
          </Button>
        </div>
      </div>

      {/* Einfacher eigenständiger Bildbetrachter */}
      {isViewerOpen && (
        <SimpleImageViewer 
          imageUrl={image} 
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </>
  );
}