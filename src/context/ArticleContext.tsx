
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ArticleData, getArticleByNumber, getAllArticles } from '../lib/googleApi';
import { textToSpeech } from '../lib/googleApi';
import * as ttsService from '../lib/ttsService';
import { getArticleExplanation } from '@/lib/geminiApi';
import { toast } from '@/components/ui/use-toast';

// Define the context type
interface ArticleContextType {
  articles: ArticleData[];
  currentArticle: ArticleData | null;
  isLoading: boolean;
  searchArticle: (articleNumber: string) => Promise<void>;
  favorites: string[];
  toggleFavorite: (articleNumber: string) => void;
  isFavorite: (articleNumber: string) => boolean;
  annotations: Record<string, string>;
  saveAnnotation: (articleNumber: string, annotation: string) => void;
  playArticleAudio: (articleText: string) => Promise<void>;
  stopAudio: () => void;
  isPlaying: boolean;
  error: string | null;
  highlights: Record<string, string[]>;
  addHighlight: (articleNumber: string, text: string) => void;
  removeHighlight: (articleNumber: string, text: string) => void;
  articleImages: Record<string, string[]>;
  addImage: (articleNumber: string, imageDataUrl: string) => void;
  removeImage: (articleNumber: string, index: number) => void;
  articleAudios: Record<string, string[]>;
  addAudio: (articleNumber: string, audioDataUrl: string) => void;
  removeAudio: (articleNumber: string, index: number) => void;
  getExplanation: (articleNumber: string, articleText: string) => Promise<string>;
  explanations: Record<string, string>;
  isLoadingExplanation: boolean;
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
  const [annotations, setAnnotations] = useState<Record<string, string>>({});
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [highlights, setHighlights] = useState<Record<string, string[]>>({});
  const [articleImages, setArticleImages] = useState<Record<string, string[]>>({});
  const [articleAudios, setArticleAudios] = useState<Record<string, string[]>>({});
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [isLoadingExplanation, setIsLoadingExplanation] = useState<boolean>(false);
  
  // Load data from local storage on mount
  useEffect(() => {
    const loadStoredData = () => {
      const savedFavorites = localStorage.getItem('vademecum_favorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
      
      const savedAnnotations = localStorage.getItem('vademecum_annotations');
      if (savedAnnotations) {
        setAnnotations(JSON.parse(savedAnnotations));
      }
      
      const savedHighlights = localStorage.getItem('vademecum_highlights');
      if (savedHighlights) {
        setHighlights(JSON.parse(savedHighlights));
      }
      
      const savedImages = localStorage.getItem('vademecum_images');
      if (savedImages) {
        setArticleImages(JSON.parse(savedImages));
      }
      
      const savedAudios = localStorage.getItem('vademecum_audios');
      if (savedAudios) {
        setArticleAudios(JSON.parse(savedAudios));
      }
      
      const savedExplanations = localStorage.getItem('vademecum_explanations');
      if (savedExplanations) {
        setExplanations(JSON.parse(savedExplanations));
      }
    };
    
    loadStoredData();
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
        toast({
          variant: "destructive",
          title: "Artigo não encontrado",
          description: `Não foi possível encontrar o artigo ${articleNumber}.`
        });
      }
    } catch (err) {
      console.error('Error searching article:', err);
      setError('Ocorreu um erro ao buscar o artigo.');
      toast({
        variant: "destructive",
        title: "Erro na busca",
        description: "Ocorreu um erro ao buscar o artigo."
      });
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
  
  // Save an annotation for an article
  const saveAnnotation = (articleNumber: string, annotation: string) => {
    const newAnnotations = { ...annotations, [articleNumber]: annotation };
    setAnnotations(newAnnotations);
    localStorage.setItem('vademecum_annotations', JSON.stringify(newAnnotations));
    
    toast({
      title: "Anotação salva",
      description: "Sua anotação foi salva com sucesso."
    });
  };
  
  // Add a highlighted text segment
  const addHighlight = (articleNumber: string, text: string) => {
    const articleHighlights = highlights[articleNumber] || [];
    
    if (!articleHighlights.includes(text)) {
      const newHighlights = { 
        ...highlights, 
        [articleNumber]: [...articleHighlights, text] 
      };
      setHighlights(newHighlights);
      localStorage.setItem('vademecum_highlights', JSON.stringify(newHighlights));
    }
  };
  
  // Remove a highlighted text segment
  const removeHighlight = (articleNumber: string, text: string) => {
    const articleHighlights = highlights[articleNumber] || [];
    
    if (articleHighlights.includes(text)) {
      const newArticleHighlights = articleHighlights.filter(t => t !== text);
      const newHighlights = { 
        ...highlights, 
        [articleNumber]: newArticleHighlights 
      };
      
      setHighlights(newHighlights);
      localStorage.setItem('vademecum_highlights', JSON.stringify(newHighlights));
    }
  };
  
  // Add image to an article
  const addImage = (articleNumber: string, imageDataUrl: string) => {
    const images = articleImages[articleNumber] || [];
    const newImages = { 
      ...articleImages, 
      [articleNumber]: [...images, imageDataUrl] 
    };
    
    setArticleImages(newImages);
    localStorage.setItem('vademecum_images', JSON.stringify(newImages));
    
    toast({
      title: "Imagem adicionada",
      description: "Sua imagem foi adicionada com sucesso."
    });
  };
  
  // Remove image from an article
  const removeImage = (articleNumber: string, index: number) => {
    const images = articleImages[articleNumber] || [];
    
    if (index >= 0 && index < images.length) {
      const newArticleImages = [...images];
      newArticleImages.splice(index, 1);
      
      const newImages = { 
        ...articleImages, 
        [articleNumber]: newArticleImages 
      };
      
      setArticleImages(newImages);
      localStorage.setItem('vademecum_images', JSON.stringify(newImages));
      
      toast({
        title: "Imagem removida",
        description: "A imagem foi removida com sucesso."
      });
    }
  };
  
  // Add audio to an article
  const addAudio = (articleNumber: string, audioDataUrl: string) => {
    const audios = articleAudios[articleNumber] || [];
    const newAudios = { 
      ...articleAudios, 
      [articleNumber]: [...audios, audioDataUrl] 
    };
    
    setArticleAudios(newAudios);
    localStorage.setItem('vademecum_audios', JSON.stringify(newAudios));
    
    toast({
      title: "Áudio adicionado",
      description: "Seu áudio foi adicionado com sucesso."
    });
  };
  
  // Remove audio from an article
  const removeAudio = (articleNumber: string, index: number) => {
    const audios = articleAudios[articleNumber] || [];
    
    if (index >= 0 && index < audios.length) {
      const newArticleAudios = [...audios];
      newArticleAudios.splice(index, 1);
      
      const newAudios = { 
        ...articleAudios, 
        [articleNumber]: newArticleAudios 
      };
      
      setArticleAudios(newAudios);
      localStorage.setItem('vademecum_audios', JSON.stringify(newAudios));
      
      toast({
        title: "Áudio removido",
        description: "O áudio foi removido com sucesso."
      });
    }
  };
  
  // Get explanation from Gemini API
  const getExplanation = async (articleNumber: string, articleText: string): Promise<string> => {
    // Return cached explanation if available
    if (explanations[articleNumber]) {
      return explanations[articleNumber];
    }
    
    setIsLoadingExplanation(true);
    try {
      const response = await getArticleExplanation(articleText);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Save explanation
      const newExplanations = {
        ...explanations,
        [articleNumber]: response.text
      };
      
      setExplanations(newExplanations);
      localStorage.setItem('vademecum_explanations', JSON.stringify(newExplanations));
      
      return response.text;
    } catch (err) {
      console.error('Error getting article explanation:', err);
      toast({
        variant: "destructive",
        title: "Erro na explicação",
        description: "Não foi possível gerar a explicação do artigo."
      });
      return "Não foi possível gerar a explicação. Por favor, tente novamente mais tarde.";
    } finally {
      setIsLoadingExplanation(false);
    }
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
    annotations,
    saveAnnotation,
    playArticleAudio,
    stopAudio,
    isPlaying,
    error,
    highlights,
    addHighlight,
    removeHighlight,
    articleImages,
    addImage,
    removeImage,
    articleAudios,
    addAudio,
    removeAudio,
    getExplanation,
    explanations,
    isLoadingExplanation
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
