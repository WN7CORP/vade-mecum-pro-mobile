
import React, { useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleProvider, useArticle } from "@/context/ArticleContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Separator } from "@/components/ui/separator";

const MainContent = () => {
  const { articles, currentArticle, isLoading, error } = useArticle();
  const currentArticleRef = useRef<HTMLDivElement>(null);

  // Scroll to the current article when it changes
  useEffect(() => {
    if (currentArticle && currentArticleRef.current) {
      const articleElement = document.getElementById(`article-${currentArticle.articleNumber}`);
      if (articleElement) {
        articleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentArticle]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif text-center text-legal-navy dark:text-white mb-4">
          Vade Mecum Pro <span className="text-legal-gold">2025</span>
        </h1>
        <p className="text-center text-legal-slate dark:text-gray-300 mb-6 max-w-2xl mx-auto">
          Pesquise artigos pelo número e acesse o conteúdo jurídico atualizado.
        </p>
        <SearchBar />
        
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
              <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
              <div className="h-32 w-full max-w-xl bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        ) : (
          <>
            {currentArticle && (
              <ArticleCard article={currentArticle} />
            )}

            {!currentArticle && articles.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-serif text-legal-navy dark:text-white">Artigos recentes</h2>
                {articles.slice(0, 3).map((article) => (
                  <ArticleCard key={article.articleNumber} article={article} />
                ))}
              </div>
            )}

            {!currentArticle && articles.length === 0 && (
              <div className="text-center py-12">
                <h2 className="text-xl font-medium text-legal-navy dark:text-white mb-2">Bem-vindo ao Vade Mecum Pro</h2>
                <p className="text-legal-slate dark:text-gray-300">
                  Pesquise artigos pelo número para começar.
                </p>
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
    <ThemeProvider>
      <ArticleProvider>
        <div className="min-h-screen bg-legal-paper dark:bg-legal-darkPaper flex flex-col">
          <Header />
          <main className="flex-1">
            <MainContent />
          </main>
          <footer className="bg-legal-navy dark:bg-legal-darkNav text-white py-3 text-center text-sm">
            <div className="container mx-auto px-4">
              <p>Vade Mecum Pro 2025 &copy; Todos os direitos reservados</p>
            </div>
          </footer>
        </div>
      </ArticleProvider>
    </ThemeProvider>
  );
};

export default Index;
