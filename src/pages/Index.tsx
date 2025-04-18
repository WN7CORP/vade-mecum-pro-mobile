
import React, { useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleProvider, useArticle } from "@/context/ArticleContext";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronUp, BookOpen, Search as SearchIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/context/ThemeContext";

const MainContent = () => {
  const { articles, currentArticle, isLoading, error } = useArticle();
  const { fontSize, increaseFontSize, decreaseFontSize } = useTheme();
  const currentArticleRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll to the current article when it changes
  useEffect(() => {
    if (currentArticle && currentArticleRef.current) {
      const articleElement = document.getElementById(`article-${currentArticle.articleNumber}`);
      if (articleElement) {
        articleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentArticle]);
  
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
    <div className="container mx-auto px-4 py-6">
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
      
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif text-center mb-4 animate-fade-in">
          WADMECON<span className="text-accent">2025</span> PRO
        </h1>
        <p className="text-center text-muted-foreground mb-6 max-w-2xl mx-auto">
          Pesquise artigos pelo número e acesse o conteúdo jurídico atualizado.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-4">
          <Tabs defaultValue="search" className="w-full max-w-md">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <SearchIcon size={16} /> Pesquisar
              </TabsTrigger>
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <BookOpen size={16} /> Navegar
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="search">
              <SearchBar />
            </TabsContent>
            
            <TabsContent value="browse">
              <div className="text-center">
                <p className="mb-4 text-sm text-muted-foreground">
                  Acesse todos os artigos disponíveis
                </p>
                <Button asChild>
                  <Link to="/browse" className="w-full md:w-auto">
                    Ver todos os artigos
                  </Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex items-center gap-2 mt-4 md:mt-0">
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
        
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-center text-destructive">
            {error}
          </div>
        )}
      </div>

      <Separator className="my-6" />

      <div ref={currentArticleRef}>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-6 w-24 bg-accent/20 rounded mb-4"></div>
              <div className="h-32 w-full max-w-xl bg-accent/10 rounded"></div>
            </div>
          </div>
        ) : (
          <>
            {currentArticle && (
              <ArticleCard article={currentArticle} />
            )}

            {!currentArticle && articles.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-serif">Artigos recentes</h2>
                {articles.slice(0, 3).map((article) => (
                  <ArticleCard key={article.articleNumber} article={article} />
                ))}
              </div>
            )}

            {!currentArticle && articles.length === 0 && (
              <div className="text-center py-12">
                <h2 className="text-xl font-medium mb-2">Bem-vindo ao WADMECON2025 PRO</h2>
                <p className="text-muted-foreground mb-8">
                  Pesquise artigos pelo número para começar, ou navegue por todos os artigos disponíveis.
                </p>
                <Button asChild className="mx-auto">
                  <Link to="/browse">Ver todos os artigos</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <MainContent />
      </main>
      <footer className="bg-primary/10 dark:bg-primary/5 py-3 text-center text-sm">
        <div className="container mx-auto px-4">
          <p>WADMECON2025 PRO &copy; Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
