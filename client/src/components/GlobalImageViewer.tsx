import { createContext, useContext, useState, ReactNode } from 'react';
import ImageViewerPopup from './ImageViewerPopup';

// Definiere den Kontext-Typ
type ImageViewerContextType = {
  openImage: (imageUrl: string) => void;
  closeImage: () => void;
};

// Erstelle einen Context mit Default-Werten
const ImageViewerContext = createContext<ImageViewerContextType>({
  openImage: () => {},
  closeImage: () => {},
});

// Hook für einfachen Zugriff auf den Kontext
export const useImageViewer = () => useContext(ImageViewerContext);

// Provider-Komponente für den globalen Bildbetrachter
export function ImageViewerProvider({ children }: { children: ReactNode }) {
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  // Funktion zum Öffnen eines Bildes
  const openImage = (imageUrl: string) => {
    setCurrentImage(imageUrl);
  };

  // Funktion zum Schließen des Betrachters
  const closeImage = () => {
    setCurrentImage(null);
  };

  return (
    <ImageViewerContext.Provider value={{ openImage, closeImage }}>
      {children}
      {/* Der Bildbetrachter wird nur angezeigt, wenn ein Bild geöffnet ist */}
      <ImageViewerPopup image={currentImage} onClose={closeImage} />
    </ImageViewerContext.Provider>
  );
}