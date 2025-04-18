
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { 
  ArticleData, 
  getArticleByNumber, 
  getAllArticles, 
  textToSpeech, 
  preprocessTextForTTS,
  searchArticleAcrossSheets
} from '../lib/googleApi';
import * as ttsService from '../lib/ttsService';
import { 
  getArticleExplanation, 
  getAutoAnnotation,
  askGeminiAboutArticle
} from '@/lib/geminiApi';
import { toast } from '@/components/ui/use-toast';
import { exportToPdf } from '@/lib/exportUtils';

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
  generateAutoAnnotation: (articleNumber: string, articleText: string) => Promise<string>;
  playArticleAudio: (articleText: string) => Promise<void>;
  stopAudio: () => void;
  isPlaying: boolean;
  error: string | null;
  highlights: Record<string, { text: string, color: string }[]>;
  addHighlight: (articleNumber: string, text: string, color?: string) => void;
  removeHighlight: (articleNumber: string, text: string) => void;
  articleImages: Record<string, string[]>;
  addImage: (articleNumber: string, imageDataUrl: string) => void;
  removeImage: (articleNumber: string, index: number) => void;
  articleAudios: Record<string, string[]>;
  addAudio: (articleNumber: string, audioDataUrl: string) => void;
  removeAudio: (articleNumber: string, index: number) => void;
  getExplanation: (articleNumber: string, articleText: string, sheetName?: string) => Promise<string>;
  askQuestion: (question: string, articleNumber: string, articleText: string, sheetName?: string) => Promise<string>;
  explanations: Record<string, string>;
  isLoadingExplanation: boolean;
  currentPlayingArticle: string | null;
  copyArticleText: (articleText: string, formatted?: boolean) => void;
  exportArticleToPdf: (article: ArticleData) => Promise<void>;
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
  const [highlights, setHighlights] = useState<Record<string, { text: string, color: string }[]>>({});
  const [articleImages, setArticleImages] = useState<Record<string, string[]>>({});
  const [articleAudios, setArticleAudios] = useState<Record<string, string[]>>({});
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [isLoadingExplanation, setIsLoadingExplanation] = useState<boolean>(false);
  const [currentPlayingArticle, setCurrentPlayingArticle] = useState<string | null>(null);
  
  // Load data from local storage on mount
  useEffect(() => {
    const loadStoredData = () => {
      const savedFavorites = localStorage.getItem('wadmecon_favorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
      
      const savedAnnotations = localStorage.getItem('wadmecon_annotations');
      if (savedAnnotations) {
        setAnnotations(JSON.parse(savedAnnotations));
      }
      
      const savedHighlights = localStorage.getItem('wadmecon_highlights');
      if (savedHighlights) {
        setHighlights(JSON.parse(savedHighlights));
      }
      
      const savedImages = localStorage.getItem('wadmecon_images');
      if (savedImages) {
        setArticleImages(JSON.parse(savedImages));
      }
      
      const savedAudios = localStorage.getItem('wadmecon_audios');
      if (savedAudios) {
        setArticleAudios(JSON.parse(savedAudios));
      }
      
      const savedExplanations = localStorage.getItem('wadmecon_explanations');
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
        const initialArticles = await getAllArticles('Sheet1', 10); // Limit to 10 for better performance
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
  
  // Search for an article by number across all sheets
  const searchArticle = async (articleNumber: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const article = await searchArticleAcrossSheets(articleNumber);
      
      if (article) {
        setCurrentArticle(article);
        
        // Add to articles array if not already there
        if (!articles.some(a => a.articleNumber === article.articleNumber && a.sheetName === article.sheetName)) {
          setArticles(prev => [article, ...prev]);
        }
        
        toast({
          title: `Artigo ${articleNumber} encontrado`,
          description: article.sheetName ? `Na lei/código: ${article.sheetName}` : undefined
        });
      } else {
        setError(`Artigo ${articleNumber} não encontrado em nenhuma lei.`);
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
    localStorage.setItem('wadmecon_favorites', JSON.stringify(newFavorites));
    
    toast({
      title: favorites.includes(articleNumber) ? "Artigo removido dos favoritos" : "Artigo adicionado aos favoritos",
      description: `Artigo ${articleNumber} ${favorites.includes(articleNumber) ? "removido dos" : "adicionado aos"} favoritos.`
    });
  };
  
  // Check if an article is favorited
  const isFavorite = (articleNumber: string) => {
    return favorites.includes(articleNumber);
  };
  
  // Save an annotation for an article
  const saveAnnotation = (articleNumber: string, annotation: string) => {
    const newAnnotations = { ...annotations, [articleNumber]: annotation };
    setAnnotations(newAnnotations);
    localStorage.setItem('wadmecon_annotations', JSON.stringify(newAnnotations));
    
    toast({
      title: "Anotação salva",
      description: "Sua anotação foi salva com sucesso."
    });
  };
  
  // Generate auto annotation using AI
  const generateAutoAnnotation = async (articleNumber: string, articleText: string): Promise<string> => {
    setIsLoading(true);
    try {
      const response = await getAutoAnnotation(articleText);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.text;
    } catch (err) {
      console.error('Error generating auto annotation:', err);
      toast({
        variant: "destructive",
        title: "Erro na geração de anotação",
        description: "Não foi possível gerar anotações automáticas."
      });
      return "Não foi possível gerar anotações automáticas. Tente novamente mais tarde.";
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a highlighted text segment
  const addHighlight = (articleNumber: string, text: string, color: string = "highlighted") => {
    const articleHighlights = highlights[articleNumber] || [];
    
    if (!articleHighlights.some(h => h.text === text)) {
      const newHighlights = { 
        ...highlights, 
        [articleNumber]: [...articleHighlights, { text, color }] 
      };
      setHighlights(newHighlights);
      localStorage.setItem('wadmecon_highlights', JSON.stringify(newHighlights));
    }
  };
  
  // Remove a highlighted text segment
  const removeHighlight = (articleNumber: string, text: string) => {
    const articleHighlights = highlights[articleNumber] || [];
    
    if (articleHighlights.some(h => h.text === text)) {
      const newArticleHighlights = articleHighlights.filter(h => h.text !== text);
      const newHighlights = { 
        ...highlights, 
        [articleNumber]: newArticleHighlights 
      };
      
      setHighlights(newHighlights);
      localStorage.setItem('wadmecon_highlights', JSON.stringify(newHighlights));
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
    localStorage.setItem('wadmecon_images', JSON.stringify(newImages));
    
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
      localStorage.setItem('wadmecon_images', JSON.stringify(newImages));
      
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
    localStorage.setItem('wadmecon_audios', JSON.stringify(newAudios));
    
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
      localStorage.setItem('wadmecon_audios', JSON.stringify(newAudios));
      
      toast({
        title: "Áudio removido",
        description: "O áudio foi removido com sucesso."
      });
    }
  };
  
  // Get explanation from Gemini API
  const getExplanation = async (articleNumber: string, articleText: string, sheetName?: string): Promise<string> => {
    // Return cached explanation if available
    const cacheKey = `${articleNumber}-${sheetName || ''}`;
    if (explanations[cacheKey]) {
      return explanations[cacheKey];
    }
    
    setIsLoadingExplanation(true);
    try {
      const response = await getArticleExplanation(articleText, articleNumber, sheetName);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Save explanation
      const newExplanations = {
        ...explanations,
        [cacheKey]: response.text
      };
      
      setExplanations(newExplanations);
      localStorage.setItem('wadmecon_explanations', JSON.stringify(newExplanations));
      
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
  
  // Ask a question about an article using Gemini
  const askQuestion = async (question: string, articleNumber: string, articleText: string, sheetName?: string): Promise<string> => {
    setIsLoading(true);
    try {
      const response = await askGeminiAboutArticle(question, articleText, articleNumber, sheetName);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.text;
    } catch (err) {
      console.error('Error asking question about article:', err);
      toast({
        variant: "destructive",
        title: "Erro na consulta",
        description: "Não foi possível obter uma resposta para sua pergunta."
      });
      return "Não foi possível obter uma resposta. Por favor, tente novamente mais tarde.";
    } finally {
      setIsLoading(false);
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
        setCurrentPlayingArticle(null);
      }
      
      // Preprocess text for better TTS
      const processedText = preprocessTextForTTS(articleText);
      
      // Get audio from TTS API
      const audioBase64 = await textToSpeech(processedText);
      
      // Play the audio
      setCurrentPlayingArticle(currentArticle?.articleNumber || null);
      await ttsService.playAudio(audioBase64);
      setIsPlaying(true);
      
      // Handle when audio finishes
      ttsService.onAudioEnd(() => {
        setIsPlaying(false);
        setCurrentPlayingArticle(null);
      });
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
    setCurrentPlayingArticle(null);
  };
  
  // Copy article text to clipboard
  const copyArticleText = (articleText: string, formatted: boolean = false) => {
    if (formatted) {
      // For formatted text, we need to use the clipboard API with HTML content
      const formattedContent = `<div style="font-family: 'Georgia', serif; line-height: 1.6;">${articleText.replace(/\n/g, '<br>')}</div>`;
      
      // Use the Clipboard API to copy HTML content
      const blob = new Blob([formattedContent], { type: 'text/html' });
      const data = new ClipboardItem({ 'text/html': blob });
      
      navigator.clipboard.write([data]).then(
        () => {
          toast({
            title: "Texto formatado copiado",
            description: "O texto do artigo foi copiado para a área de transferência."
          });
        },
        (err) => {
          console.error('Error copying formatted text:', err);
          // Fall back to plain text
          copyArticleText(articleText, false);
        }
      );
    } else {
      // For plain text
      navigator.clipboard.writeText(articleText).then(
        () => {
          toast({
            title: "Texto copiado",
            description: "O texto do artigo foi copiado para a área de transferência."
          });
        },
        (err) => {
          console.error('Error copying text:', err);
          toast({
            variant: "destructive",
            title: "Erro ao copiar",
            description: "Não foi possível copiar o texto do artigo."
          });
        }
      );
    }
  };
  
  // Export article to PDF with explanation
  const exportArticleToPdf = async (article: ArticleData) => {
    try {
      setIsLoading(true);
      
      // Get explanation if not already cached
      let explanation = "";
      const cacheKey = `${article.articleNumber}-${article.sheetName || ''}`;
      
      if (explanations[cacheKey]) {
        explanation = explanations[cacheKey];
      } else {
        const explainResponse = await getArticleExplanation(
          article.articleText, 
          article.articleNumber,
          article.sheetName
        );
        explanation = explainResponse.text;
        
        // Cache the explanation
        const newExplanations = {
          ...explanations,
          [cacheKey]: explanation
        };
        setExplanations(newExplanations);
        localStorage.setItem('wadmecon_explanations', JSON.stringify(newExplanations));
      }
      
      // Create PDF with explanation
      const explanationsMap = { [article.articleNumber]: explanation };
      const pdfOutput = await exportToPdf([article], `artigo-${article.articleNumber}.pdf`, explanationsMap);
      
      // Create a download link
      const link = document.createElement('a');
      link.href = pdfOutput;
      link.download = `artigo-${article.articleNumber}.pdf`;
      link.click();
      
      toast({
        title: "PDF gerado com sucesso",
        description: "O arquivo foi baixado para o seu dispositivo."
      });
    } catch (error) {
      console.error('Error exporting article to PDF:', error);
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: "Não foi possível exportar o artigo para PDF."
      });
    } finally {
      setIsLoading(false);
    }
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
    generateAutoAnnotation,
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
    askQuestion,
    explanations,
    isLoadingExplanation,
    currentPlayingArticle,
    copyArticleText,
    exportArticleToPdf
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
