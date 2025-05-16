import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { ImageViewerProvider } from "./components/GlobalImageViewer";

createRoot(document.getElementById("root")!).render(
  <>
    <ImageViewerProvider>
      <App />
    </ImageViewerProvider>
    <Toaster />
  </>
);
