
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ArticleData, getArticleByNumber, getAllArticles } from '../lib/googleApi';
import { textToSpeech } from '../lib/googleApi';
import * as ttsService from '../lib/ttsService';

// Define the context type
interface ArticleContextType {
  articles: ArticleData[];
  currentArticle: ArticleData | null;
  isLoading: boolean;
  searchArticle: (articleNumber: string) => Promise<void>;
  favorites: string[];
  toggleFavorite: (articleNumber: string) => void;
  isFavorite: (articleNumber: string) => boolean;
  comments: Record<string, string>;
  saveComment: (articleNumber: string, comment: string) => void;
  playArticleAudio: (articleText: string) => Promise<void>;
  stopAudio: () => void;
  isPlaying: boolean;
  error: string | null;
}

// Create the context
const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

// Provider props
interface ArticleProviderProps {
  children: ReactNode;
}

// Create the provider component
export const ArticleProvider: React.FC<ArticleProviderProps> = ({ children }) => {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [currentArticle, setCurrentArticle] = useState<ArticleData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  // Load favorites and comments from local storage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('vademecum_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    
    const savedComments = localStorage.getItem('vademecum_comments');
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    }
  }, []);
  
  // Load initial articles
  useEffect(() => {
    const loadInitialArticles = async () => {
      setIsLoading(true);
      try {
        const initialArticles = await getAllArticles(50); // Limit to 50 for better performance
        setArticles(initialArticles);
      } catch (err) {
        console.error('Failed to load initial articles:', err);
        setError('Falha ao carregar artigos iniciais.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialArticles();
  }, []);
  
  // Search for an article by number
  const searchArticle = async (articleNumber: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const article = await getArticleByNumber(articleNumber);
      
      if (article) {
        setCurrentArticle(article);
        
        // Add to articles array if not already there
        if (!articles.some(a => a.articleNumber === article.articleNumber)) {
          setArticles(prev => [...prev, article]);
        }
      } else {
        setError(`Artigo ${articleNumber} não encontrado.`);
      }
    } catch (err) {
      console.error('Error searching article:', err);
      setError('Ocorreu um erro ao buscar o artigo.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle favorite status for an article
  const toggleFavorite = (articleNumber: string) => {
    const newFavorites = favorites.includes(articleNumber)
      ? favorites.filter(num => num !== articleNumber)
      : [...favorites, articleNumber];
    
    setFavorites(newFavorites);
    localStorage.setItem('vademecum_favorites', JSON.stringify(newFavorites));
  };
  
  // Check if an article is favorited
  const isFavorite = (articleNumber: string) => {
    return favorites.includes(articleNumber);
  };
  
  // Save a comment for an article
  const saveComment = (articleNumber: string, comment: string) => {
    const newComments = { ...comments, [articleNumber]: comment };
    setComments(newComments);
    localStorage.setItem('vademecum_comments', JSON.stringify(newComments));
  };
  
  // Play article audio using TTS
  const playArticleAudio = async (articleText: string) => {
    setIsLoading(true);
    
    try {
      // Initialize audio context on user interaction
      ttsService.initAudioContext();
      
      // If already playing something, stop it
      if (isPlaying) {
        ttsService.stopAudio();
        setIsPlaying(false);
      }
      
      // Get audio from TTS API
      const audioBase64 = await textToSpeech(articleText);
      
      // Play the audio
      await ttsService.playAudio(audioBase64);
      setIsPlaying(true);
      
      // Handle when audio finishes
      ttsService.isAudioPlaying();
    } catch (err) {
      console.error('Error playing audio:', err);
      setError('Falha ao reproduzir áudio.');
      
      // Fallback to browser's TTS
      ttsService.speakWithBrowserTTS(articleText);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Stop currently playing audio
  const stopAudio = () => {
    ttsService.stopAudio();
    setIsPlaying(false);
  };
  
  // Context value
  const contextValue: ArticleContextType = {
    articles,
    currentArticle,
    isLoading,
    searchArticle,
    favorites,
    toggleFavorite,
    isFavorite,
    comments,
    saveComment,
    playArticleAudio,
    stopAudio,
    isPlaying,
    error,
  };
  
  return (
    <ArticleContext.Provider value={contextValue}>
      {children}
    </ArticleContext.Provider>
  );
};

// Custom hook to use the context
export const useArticle = () => {
  const context = useContext(ArticleContext);
  
  if (context === undefined) {
    throw new Error('useArticle must be used within an ArticleProvider');
  }
  
  return context;
};
