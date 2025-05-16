import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import StandaloneImageViewer from "./components/StandaloneImageViewer";

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <StandaloneImageViewer />
    <Toaster />
  </>
);
