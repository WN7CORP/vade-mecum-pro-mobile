
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { ArticleProvider } from "./context/ArticleContext";
import Index from "./pages/Index";
import BrowseArticles from "./pages/BrowseArticles";
import NotFound from "./pages/NotFound";

const App = () => (
  <ThemeProvider>
    <ArticleProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/browse" element={<BrowseArticles />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ArticleProvider>
  </ThemeProvider>
);

export default App;
