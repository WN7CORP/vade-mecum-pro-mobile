
import React, { useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleProvider, useArticle } from "@/context/ArticleContext";
import { Separator } from "@/components/ui/separator";

const MainContent = () => {
  const { articles, currentArticle, isLoading } = useArticle();
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
        <h1 className="text-2xl md:text-3xl font-serif text-center text-legal-navy mb-4">
          Vade Mecum Pro 2025
        </h1>
        <p className="text-center text-legal-slate mb-6 max-w-2xl mx-auto">
          Pesquise artigos pelo número e acesse o conteúdo jurídico atualizado.
        </p>
        <SearchBar />
      </div>

      <Separator className="my-6" />

      <div ref={currentArticleRef}>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-6 w-24 bg-slate-200 rounded mb-4"></div>
              <div className="h-32 w-full max-w-xl bg-slate-200 rounded"></div>
            </div>
          </div>
        ) : (
          <>
            {currentArticle && (
              <ArticleCard article={currentArticle} />
            )}

            {!currentArticle && articles.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-serif text-legal-navy">Artigos recentes</h2>
                {articles.slice(0, 3).map((article) => (
                  <ArticleCard key={article.articleNumber} article={article} />
                ))}
              </div>
            )}

            {!currentArticle && articles.length === 0 && (
              <div className="text-center py-12">
                <h2 className="text-xl font-medium text-legal-navy mb-2">Bem-vindo ao Vade Mecum Pro</h2>
                <p className="text-legal-slate">
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
    <ArticleProvider>
      <div className="min-h-screen bg-legal-paper flex flex-col">
        <Header />
        <main className="flex-1">
          <MainContent />
        </main>
        <footer className="bg-legal-navy text-white py-3 text-center text-sm">
          <div className="container mx-auto px-4">
            <p>Vade Mecum Pro 2025 &copy; Todos os direitos reservados</p>
          </div>
        </footer>
      </div>
    </ArticleProvider>
  );
};

export default Index;
