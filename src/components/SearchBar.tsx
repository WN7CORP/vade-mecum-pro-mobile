
import React, { useState, useRef, useEffect } from "react";
import { useArticle } from "@/context/ArticleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchBar() {
  const { searchArticle, isLoading, error, articles } = useArticle();
  const [searchValue, setSearchValue] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Filter articles for suggestion dropdown
  const filteredArticles = articles.filter(article => 
    article.articleNumber.includes(searchValue) && searchValue.length > 0
  ).slice(0, 5); // Limit to 5 suggestions
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      searchArticle(searchValue.trim());
      setShowSuggestions(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setShowSuggestions(value.length > 0);
  };
  
  const handleSelectSuggestion = (articleNumber: string) => {
    setSearchValue(articleNumber);
    searchArticle(articleNumber);
    setShowSuggestions(false);
  };
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div className="relative w-full max-w-xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative flex items-center">
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar artigo pelo número..."
            value={searchValue}
            onChange={handleInputChange}
            className="pr-12 shadow-md border-2 border-muted focus-visible:ring-2 focus-visible:ring-legal-gold focus-visible:border-legal-gold h-12 text-base"
            disabled={isLoading}
            onFocus={() => setShowSuggestions(searchValue.length > 0)}
          />
          <Button 
            type="submit" 
            size="icon" 
            variant="ghost"
            className="absolute right-0 h-full text-muted-foreground hover:text-primary"
            disabled={isLoading || !searchValue.trim()}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Buscar artigo</span>
          </Button>
        </div>
      </form>
      
      {/* Suggestions dropdown */}
      {showSuggestions && filteredArticles.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1 text-sm">
            {filteredArticles.map((article) => (
              <li 
                key={article.articleNumber}
                className="px-4 py-2 hover:bg-legal-highlight cursor-pointer"
                onClick={() => handleSelectSuggestion(article.articleNumber)}
              >
                <div className="font-medium">Artigo {article.articleNumber}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {article.articleText.substring(0, 60)}...
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
