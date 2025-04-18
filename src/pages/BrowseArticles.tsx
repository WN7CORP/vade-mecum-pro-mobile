
import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleData, getAllArticles, getAllSheets, SheetInfo } from "@/lib/googleApi";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronUp, Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "@/components/ui/use-toast";

const BrowseArticles = () => {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { fontSize, increaseFontSize, decreaseFontSize } = useTheme();
  
  // Load available sheets
  useEffect(() => {
    const loadSheets = async () => {
      try {
        const sheetList = await getAllSheets();
        setSheets(sheetList);
        
        if (sheetList.length > 0) {
          setSelectedSheet(sheetList[0].title);
        }
      } catch (error) {
        console.error("Error loading sheets:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar abas",
          description: "Não foi possível carregar as abas da planilha."
        });
      }
    };
    
    loadSheets();
  }, []);
  
  // Load articles when sheet is selected
  useEffect(() => {
    const loadArticles = async () => {
      if (!selectedSheet) return;
      
      setIsLoading(true);
      try {
        const articlesList = await getAllArticles(selectedSheet, 50);
        setArticles(articlesList);
      } catch (error) {
        console.error("Error loading articles:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar artigos",
          description: "Não foi possível carregar os artigos da planilha."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadArticles();
  }, [selectedSheet]);
  
  // Handle scroll events for progress bar and scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / scrollHeight) * 100;
      
      setScrollProgress(progress);
      setShowScrollTop(scrollTop > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div 
        className="reading-progress-bar" 
        style={{ width: `${scrollProgress}%` }}
      />
      
      {showScrollTop && (
        <button 
          onClick={handleScrollToTop}
          className="scroll-to-top"
          aria-label="Voltar ao topo"
        >
          <ChevronUp size={24} />
        </button>
      )}
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif text-center mb-4">
            WADMECON<span className="text-accent">2025</span> PRO
          </h1>
          <p className="text-center text-muted-foreground mb-6 max-w-2xl mx-auto">
            Navegue por todos os artigos da legislação
          </p>
          
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Selecione uma lei ou código" />
                  </SelectTrigger>
                  <SelectContent>
                    {sheets.map((sheet) => (
                      <SelectItem key={sheet.id} value={sheet.title}>
                        {sheet.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={decreaseFontSize}
                    className="h-8 w-8 p-0"
                  >
                    A-
                  </Button>
                  <span className="text-sm">
                    {fontSize === 'small' ? 'Pequena' : 
                     fontSize === 'medium' ? 'Média' : 
                     fontSize === 'large' ? 'Grande' : 'Extra Grande'}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={increaseFontSize}
                    className="h-8 w-8 p-0"
                  >
                    A+
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
              <p className="mt-4 text-muted-foreground">
                Carregando artigos...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {selectedSheet && (
              <h2 className="text-xl font-serif">
                {selectedSheet} ({articles.length} artigos)
              </h2>
            )}
            
            {articles.length > 0 ? (
              articles.map((article) => (
                <ArticleCard key={`${selectedSheet}-${article.articleNumber}`} article={article} />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhum artigo encontrado nesta aba.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
      
      <footer className="bg-primary/10 dark:bg-primary/5 py-3 text-center text-sm">
        <div className="container mx-auto px-4">
          <p>WADMECON2025 PRO &copy; Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
};

export default BrowseArticles;
