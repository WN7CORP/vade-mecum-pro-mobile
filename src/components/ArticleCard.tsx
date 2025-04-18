
import React, { useState, useRef, useCallback } from "react";
import { useArticle } from "@/context/ArticleContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Volume2, 
  VolumeX, 
  Star, 
  FileText, 
  Share2, 
  PencilLine,
  Highlighter, 
  Image as ImageIcon,
  Mic,
  Sparkles,
  Clipboard,
  SendHorizonal,
  Copy,
  MessageCircle,
  MoreHorizontal,
  AlignJustify,
  Check,
  HelpCircle
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ArticleCardProps {
  article: {
    articleNumber: string;
    articleText: string;
    sheetName?: string;
  };
}

export function ArticleCard({ article }: ArticleCardProps) {
  const { 
    isFavorite, 
    toggleFavorite, 
    annotations, 
    saveAnnotation, 
    playArticleAudio, 
    stopAudio, 
    isPlaying,
    highlights,
    addHighlight,
    removeHighlight,
    articleImages: allArticleImages,
    addImage,
    removeImage,
    articleAudios: allArticleAudios,
    addAudio,
    removeAudio,
    getExplanation,
    askQuestion,
    isLoadingExplanation,
    currentPlayingArticle,
    copyArticleText,
    exportArticleToPdf,
    generateAutoAnnotation
  } = useArticle();

  const [isEditingAnnotation, setIsEditingAnnotation] = useState(false);
  const [annotationText, setAnnotationText] = useState(annotations[article.articleNumber] || '');
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [activeTab, setActiveTab] = useState("artigo");
  const [showHighlightControls, setShowHighlightControls] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [highlightColor, setHighlightColor] = useState("highlighted");
  const [explanation, setExplanation] = useState("");
  const [userQuestion, setUserQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [isGeneratingAutoAnnotation, setIsGeneratingAutoAnnotation] = useState(false);
  const [showAutoAnnotationDialog, setShowAutoAnnotationDialog] = useState(false);
  const [autoAnnotationText, setAutoAnnotationText] = useState("");
  const [audioVisualization, setAudioVisualization] = useState<number[]>(Array(20).fill(0));
  
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Get current article's images and audios
  const articleImages = allArticleImages[article.articleNumber] || [];
  const articleAudios = allArticleAudios[article.articleNumber] || [];
  
  // Handle text selection for highlighting
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      setSelectedText(selection.toString());
    }
  };
  
  // Add current selection as highlight
  const handleAddHighlight = () => {
    if (selectedText) {
      addHighlight(article.articleNumber, selectedText, highlightColor);
      toast({
        title: "Texto destacado",
        description: "O texto selecionado foi destacado com sucesso."
      });
      setSelectedText("");
    }
  };
  
  // Apply highlights to the article text
  const highlightText = (text: string): React.ReactNode => {
    const articleHighlights = highlights[article.articleNumber] || [];
    
    if (!articleHighlights || articleHighlights.length === 0) {
      return <p className="article-content">{text}</p>;
    }
    
    // Sort highlights by length (longest first) to avoid nested highlights
    const sortedHighlights = [...articleHighlights].sort((a, b) => b.text.length - a.text.length);
    
    // Create a map of text ranges to highlight classes
    const parts: { text: string; isHighlighted: boolean; color: string }[] = [];
    let lastIndex = 0;
    
    // For each text segment, check if it should be highlighted
    for (let i = 0; i < text.length; i++) {
      for (const highlight of sortedHighlights) {
        if (text.substring(i, i + highlight.text.length).toLowerCase() === highlight.text.toLowerCase()) {
          // Add non-highlighted text before this highlight
          if (i > lastIndex) {
            parts.push({
              text: text.substring(lastIndex, i),
              isHighlighted: false,
              color: ''
            });
          }
          
          // Add the highlighted text
          parts.push({
            text: text.substring(i, i + highlight.text.length),
            isHighlighted: true,
            color: highlight.color || 'highlighted'
          });
          
          // Update lastIndex and i to skip the highlighted text
          lastIndex = i + highlight.text.length;
          i = lastIndex - 1; // -1 because the loop will increment i
          break;
        }
      }
    }
    
    // Add any remaining text after the last highlight
    if (lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        isHighlighted: false,
        color: ''
      });
    }
    
    return (
      <p className="article-content">
        {parts.map((part, i) => (
          part.isHighlighted ? (
            <span key={i} className={part.color}>{part.text}</span>
          ) : (
            <React.Fragment key={i}>{part.text}</React.Fragment>
          )
        ))}
      </p>
    );
  };
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        addImage(article.articleNumber, event.target.result);
      }
    };
    
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      mediaRecorder.addEventListener('dataavailable', (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      });
      
      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onload = (event) => {
          if (event.target && typeof event.target.result === 'string') {
            addAudio(article.articleNumber, event.target.result);
          }
        };
        
        reader.readAsDataURL(audioBlob);
        setAudioChunks([]);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      });
      
      mediaRecorder.start();
      setAudioStream(mediaRecorder);
      setIsRecording(true);
      
      toast({
        title: "Gravação iniciada",
        description: "Clique novamente para parar a gravação."
      });
      
    } catch (err) {
      console.error('Error recording audio:', err);
      toast({
        variant: "destructive",
        title: "Erro na gravação",
        description: "Não foi possível iniciar a gravação de áudio."
      });
    }
  };
  
  // Stop audio recording
  const stopRecording = () => {
    if (audioStream) {
      audioStream.stop();
      setIsRecording(false);
      setAudioStream(null);
      
      toast({
        title: "Gravação finalizada",
        description: "Seu áudio foi salvo com sucesso."
      });
    }
  };
  
  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  // Handle toggling favorite status
  const handleToggleFavorite = () => {
    toggleFavorite(article.articleNumber);
  };
  
  // Handle saving annotation
  const handleSaveAnnotation = () => {
    saveAnnotation(article.articleNumber, annotationText);
    setIsEditingAnnotation(false);
  };
  
  // Handle playing article audio
  const handlePlayAudio = async () => {
    await playArticleAudio(article.articleText);
  };
  
  // Handle stopping article audio
  const handleStopAudio = () => {
    stopAudio();
  };
  
  // Handle exporting to PDF
  const handleExportPDF = async () => {
    try {
      await exportArticleToPdf(article);
    } catch (error) {
      console.error('Error exporting article to PDF:', error);
    }
  };
  
  // Copy article text to clipboard
  const handleCopyArticleText = (formatted: boolean = false) => {
    copyArticleText(article.articleText, formatted);
  };
  
  // Load explanation when explanation tab is clicked
  const handleLoadExplanation = useCallback(async () => {
    if (!explanation && activeTab === "explicacao") {
      const text = await getExplanation(article.articleNumber, article.articleText, article.sheetName);
      setExplanation(text);
    }
  }, [activeTab, article, explanation, getExplanation]);
  
  // Handle asking a question about the article
  const handleAskQuestion = async () => {
    if (!userQuestion.trim()) return;
    
    setIsAskingQuestion(true);
    try {
      const response = await askQuestion(
        userQuestion, 
        article.articleNumber, 
        article.articleText,
        article.sheetName
      );
      
      setAiResponse(response);
      
      // Scroll chat to bottom
      if (chatContainerRef.current) {
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error asking question:', error);
    } finally {
      setIsAskingQuestion(false);
      setUserQuestion('');
    }
  };
  
  // Handle generating auto annotations
  const handleGenerateAutoAnnotation = async () => {
    setIsGeneratingAutoAnnotation(true);
    try {
      const autoAnnotation = await generateAutoAnnotation(article.articleNumber, article.articleText);
      setAutoAnnotationText(autoAnnotation);
      setShowAutoAnnotationDialog(true);
    } catch (error) {
      console.error('Error generating auto annotation:', error);
    } finally {
      setIsGeneratingAutoAnnotation(false);
    }
  };
  
  // Handle applying auto-generated annotation
  const handleApplyAutoAnnotation = () => {
    setAnnotationText(autoAnnotationText);
    saveAnnotation(article.articleNumber, autoAnnotationText);
    setShowAutoAnnotationDialog(false);
    setIsEditingAnnotation(false);
  };
  
  // Effect to load explanation when tab changes
  React.useEffect(() => {
    handleLoadExplanation();
  }, [activeTab, handleLoadExplanation]);
  
  // Effect to simulate audio visualization when the article is playing
  React.useEffect(() => {
    if (isPlaying && currentPlayingArticle === article.articleNumber) {
      const interval = setInterval(() => {
        // Generate random visualization data for demo purposes
        // In a real app, this would be based on actual audio analysis
        setAudioVisualization(Array(20).fill(0).map(() => Math.random() * 0.8 + 0.2));
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentPlayingArticle, article.articleNumber]);
  
  return (
    <Card 
      ref={cardRef}
      id={`article-${article.articleNumber}`}
      className="mb-6 shadow-lg border-2 hover:border-accent/30 transition-all duration-300 bg-card dark:glass-card"
    >
      <CardHeader className="bg-gradient-to-r from-primary/90 to-primary/70 text-white">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl md:text-2xl font-serif flex items-center gap-2">
              Artigo {article.articleNumber}
              {article.sheetName && (
                <Badge variant="outline" className="text-xs font-normal ml-2 bg-white/10">
                  {article.sheetName}
                </Badge>
              )}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={`text-white hover:text-accent transition-colors ${
                isFavorite(article.articleNumber) ? 'text-accent' : ''
              }`}
              onClick={handleToggleFavorite}
            >
              <Star className={`h-5 w-5 ${isFavorite(article.articleNumber) ? 'fill-accent' : ''}`} />
              <span className="sr-only">
                {isFavorite(article.articleNumber) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              </span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleCopyArticleText(false)}>
                  <Copy className="mr-2 h-4 w-4" /> Copiar texto plano
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCopyArticleText(true)}>
                  <AlignJustify className="mr-2 h-4 w-4" /> Copiar texto formatado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="mr-2 h-4 w-4" /> Exportar para PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      {isPlaying && currentPlayingArticle === article.articleNumber && (
        <div className="flex h-6 items-center justify-center gap-0.5 px-4 bg-accent/10">
          {audioVisualization.map((height, i) => (
            <div 
              key={i}
              className="w-0.5 bg-accent"
              style={{ height: `${height * 24}px` }}
            />
          ))}
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mx-6 my-2">
          <TabsTrigger value="artigo" className="font-medium">Artigo</TabsTrigger>
          <TabsTrigger value="anotacoes" className="font-medium">Anotações</TabsTrigger>
          <TabsTrigger value="explicacao" className="font-medium">Explicação</TabsTrigger>
          <TabsTrigger value="duvidas" className="font-medium">Dúvidas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="artigo" className="px-0">
          <CardContent className="pt-4 pb-2 px-5">
            <div className="text-foreground prose prose-slate max-w-none relative" onMouseUp={handleTextSelection}>
              {showHighlightControls && selectedText && (
                <div className="absolute top-0 right-0 flex flex-col gap-2 p-2 bg-background dark:bg-muted rounded-md shadow-md z-10">
                  <div className="flex gap-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0"
                        >
                          <div className={`w-4 h-4 rounded ${highlightColor}`}></div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-6 h-6 p-0"
                            onClick={() => setHighlightColor('highlighted')}
                          >
                            <div className="w-4 h-4 rounded highlighted"></div>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-6 h-6 p-0"
                            onClick={() => setHighlightColor('highlighted-yellow')}
                          >
                            <div className="w-4 h-4 rounded highlighted-yellow"></div>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-6 h-6 p-0"
                            onClick={() => setHighlightColor('highlighted-green')}
                          >
                            <div className="w-4 h-4 rounded highlighted-green"></div>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-6 h-6 p-0"
                            onClick={() => setHighlightColor('highlighted-blue')}
                          >
                            <div className="w-4 h-4 rounded highlighted-blue"></div>
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    
                    <Button 
                      size="sm" 
                      className="h-8 gap-1"
                      onClick={handleAddHighlight}
                      disabled={!selectedText}
                    >
                      <Highlighter className="h-3.5 w-3.5" />
                      <span className="text-xs">Destacar</span>
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="highlight-mode"
                    checked={showHighlightControls}
                    onCheckedChange={setShowHighlightControls}
                  />
                  <Label htmlFor="highlight-mode" className="text-sm">
                    Modo de destaque
                  </Label>
                </div>
              </div>
              
              {highlightText(article.articleText)}
            </div>
            
            {/* Image Gallery */}
            {articleImages && articleImages.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Imagens</h4>
                <div className="grid grid-cols-2 gap-2">
                  {articleImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={image} 
                        alt={`Imagem ${index + 1}`} 
                        className="rounded-md w-full h-32 object-cover cursor-pointer"
                        onClick={() => {
                          const img = new Image();
                          img.src = image;
                          const w = window.open("");
                          if (w) w.document.write(img.outerHTML);
                        }}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(article.articleNumber, index)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Audio List */}
            {articleAudios && articleAudios.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Áudios</h4>
                <div className="space-y-2">
                  {articleAudios.map((audio, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <audio src={audio} controls className="w-full h-8" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-2"
                        onClick={() => removeAudio(article.articleNumber, index)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="anotacoes">
          <CardContent className="pt-4 pb-2 px-5">
            {!isEditingAnnotation && annotations[article.articleNumber] ? (
              <div className="p-4 bg-accent/10 dark:bg-accent/20 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Suas anotações</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingAnnotation(true)}
                  >
                    Editar
                  </Button>
                </div>
                <p className="whitespace-pre-wrap text-sm">{annotations[article.articleNumber]}</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Adicionar anotação</h4>
                  {isEditingAnnotation && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingAnnotation(false)}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
                <Textarea
                  value={annotationText}
                  onChange={(e) => setAnnotationText(e.target.value)}
                  placeholder="Adicione suas anotações sobre este artigo..."
                  className="min-h-[150px] focus-visible:ring-accent"
                />
                <div className="flex justify-between mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleGenerateAutoAnnotation}
                    disabled={isGeneratingAutoAnnotation}
                    className="gap-1"
                  >
                    {isGeneratingAutoAnnotation ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Gerar com IA
                      </>
                    )}
                  </Button>
                  
                  <Button onClick={handleSaveAnnotation}>
                    Salvar anotação
                  </Button>
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Adicionar mídia</h4>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4" />
                  Adicionar imagem
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`gap-2 ${isRecording ? 'bg-red-100 text-red-600 border-red-300 dark:bg-red-900/30 dark:border-red-700' : ''}`}
                  onClick={toggleRecording}
                >
                  <Mic className="h-4 w-4" />
                  {isRecording ? 'Parar gravação' : 'Gravar áudio'}
                </Button>
              </div>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="explicacao">
          <CardContent className="pt-4 pb-2 px-5">
            {isLoadingExplanation ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 rounded-full border-4 border-accent border-t-transparent mb-2"></div>
                <p className="text-sm text-muted-foreground">Gerando explicação com IA...</p>
              </div>
            ) : explanation ? (
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <div className="flex items-center gap-2 mb-4 text-accent">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="text-lg font-serif m-0">Explicação do Artigo</h3>
                </div>
                <div className="whitespace-pre-wrap text-sm">
                  {explanation.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <CardDescription className="text-xs">
                    Gerado por IA usando Gemini
                  </CardDescription>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">
                  Clique no botão abaixo para gerar uma explicação com IA para este artigo.
                </p>
                <Button
                  className="mt-4 gap-2"
                  onClick={handleLoadExplanation}
                >
                  <Sparkles className="h-4 w-4" />
                  Gerar explicação
                </Button>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="duvidas">
          <CardContent className="pt-4 pb-2 px-5">
            <div className="prose prose-slate dark:prose-invert max-w-none mb-4">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <HelpCircle className="h-5 w-5" />
                <h3 className="text-lg font-serif m-0">Tire suas dúvidas</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Pergunte ao assistente IA sobre este artigo e obtenha respostas personalizadas.
              </p>
            </div>
            
            <div 
              ref={chatContainerRef}
              className="h-[300px] mb-4 overflow-y-auto p-4 bg-muted/20 rounded-md"
            >
              {(aiResponse || isAskingQuestion) ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                      ?
                    </div>
                    <div className="bg-background dark:bg-muted p-3 rounded-lg max-w-[80%]">
                      <p className="text-sm">{userQuestion || "Carregando..."}</p>
                    </div>
                  </div>
                  
                  {isAskingQuestion ? (
                    <div className="flex gap-2 justify-end">
                      <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg text-sm max-w-[80%] flex items-center">
                        <div className="animate-pulse flex space-x-2">
                          <div className="rounded-full bg-primary/40 h-2 w-2"></div>
                          <div className="rounded-full bg-primary/40 h-2 w-2"></div>
                          <div className="rounded-full bg-primary/40 h-2 w-2"></div>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white font-semibold">
                        AI
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 justify-end">
                      <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg max-w-[80%]">
                        <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white font-semibold">
                        AI
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground text-center">
                    Faça uma pergunta relacionada ao artigo {article.articleNumber} para começar.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua dúvida sobre este artigo..."
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAskQuestion();
                  }
                }}
                disabled={isAskingQuestion}
                className="focus-visible:ring-accent"
              />
              <Button
                disabled={!userQuestion.trim() || isAskingQuestion}
                onClick={handleAskQuestion}
                size="icon"
              >
                {isAskingQuestion ? (
                  <div className="animate-spin h-5 w-5 rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <SendHorizonal className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <Separator />
      
      <CardFooter className="flex justify-between items-center py-3 bg-muted/30 dark:bg-muted/10">
        <div className="flex gap-1">
          {isPlaying && currentPlayingArticle === article.articleNumber ? (
            <Button variant="ghost" size="icon" onClick={handleStopAudio} title="Parar áudio">
              <VolumeX className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={handlePlayAudio} title="Ouvir artigo">
              <Volume2 className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditingAnnotation(!isEditingAnnotation)}
            title={isEditingAnnotation ? "Cancelar anotação" : "Adicionar anotação"}
          >
            <PencilLine className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={handleExportPDF} title="Exportar para PDF">
            <FileText className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="icon" title="Compartilhar">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
      
      {/* Auto-annotation dialog */}
      <AlertDialog 
        open={showAutoAnnotationDialog} 
        onOpenChange={setShowAutoAnnotationDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anotação gerada pela IA</AlertDialogTitle>
            <AlertDialogDescription>
              A IA gerou esta anotação para o artigo {article.articleNumber}. 
              Deseja utilizá-la ou editar antes de salvar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[300px] overflow-y-auto p-4 bg-muted/20 rounded border mb-4">
            <p className="whitespace-pre-wrap">{autoAnnotationText}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplyAutoAnnotation}>
              <Check className="mr-2 h-4 w-4" />
              Usar esta anotação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
