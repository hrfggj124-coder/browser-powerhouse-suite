import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PasswordGenerator from "./pages/PasswordGenerator";
import ImageCompressor from "./pages/ImageCompressor";
import ImageConverter from "./pages/ImageConverter";
import Weather from "./pages/Weather";
import PDFTools from "./pages/PDFTools";
import ResumeBuilder from "./pages/ResumeBuilder";
import AudioExtractor from "./pages/AudioExtractor";
import AIChat from "./pages/AIChat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/password" element={<PasswordGenerator />} />
          <Route path="/compress" element={<ImageCompressor />} />
          <Route path="/convert" element={<ImageConverter />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/pdf-tools" element={<PDFTools />} />
          <Route path="/resume" element={<ResumeBuilder />} />
          <Route path="/audio" element={<AudioExtractor />} />
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
