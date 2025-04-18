
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportToPdf } from "@/lib/exportUtils";
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
  Loader2
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ArticleCardProps {
  article: {
    articleNumber: string;
    articleText: string;
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
    isLoadingExplanation
  } = useArticle();

  const [isEditingAnnotation, setIsEditingAnnotation] = useState(false);
  const [annotationText, setAnnotationText] = useState(annotations[article.articleNumber] || '');
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [activeTab, setActiveTab] = useState("artigo");
  const [showHighlightControls, setShowHighlightControls] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [explanation, setExplanation] = useState("");
  
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
      addHighlight(article.articleNumber, selectedText);
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
    
    if (articleHighlights.length === 0) {
      return <p className="article-content">{text}</p>;
    }
    
    // Sort highlights by length (longest first) to avoid nested highlights
    const sortedHighlights = [...articleHighlights].sort((a, b) => b.length - a.length);
    
    // Create a regex pattern that matches all highlights
    const pattern = sortedHighlights.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    
    // Split text by highlights and map to spans
    const parts = text.split(regex);
    
    return (
      <p className="article-content">
        {parts.map((part, i) => {
          const isHighlighted = sortedHighlights.some(h => 
            part.toLowerCase() === h.toLowerCase()
          );
          
          return isHighlighted ? (
            <span key={i} className="highlighted">{part}</span>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          );
        })}
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
      // Create array with just this article
      const pdfOutput = await exportToPdf([article], `artigo-${article.articleNumber}.pdf`);
      
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
    }
  };
  
  // Copy article text to clipboard
  const copyArticleText = () => {
    navigator.clipboard.writeText(article.articleText).then(
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
  };
  
  // Load explanation when explanation tab is clicked
  const handleLoadExplanation = useCallback(async () => {
    if (!explanation && activeTab === "explicacao") {
      const text = await getExplanation(article.articleNumber, article.articleText);
      setExplanation(text);
    }
  }, [activeTab, article, explanation, getExplanation]);
  
  // Effect to load explanation when tab changes
  React.useEffect(() => {
    handleLoadExplanation();
  }, [activeTab, handleLoadExplanation]);
  
  return (
    <Card 
      ref={cardRef}
      id={`article-${article.articleNumber}`}
      className="mb-6 shadow-lg border-2 hover:border-legal-gold/30 transition-all duration-300 bg-card dark:glass-card"
    >
      <CardHeader className="bg-gradient-to-r from-legal-navy to-legal-navy/90 dark:from-legal-darkNav dark:to-legal-darkNav/90 text-white">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl md:text-2xl font-serif">
            Artigo {article.articleNumber}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className={`text-white hover:text-legal-lightGold transition-colors ${
              isFavorite(article.articleNumber) ? 'text-legal-gold' : ''
            }`}
            onClick={handleToggleFavorite}
          >
            <Star className={`h-5 w-5 ${isFavorite(article.articleNumber) ? 'fill-legal-gold' : ''}`} />
            <span className="sr-only">
              {isFavorite(article.articleNumber) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            </span>
          </Button>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mx-6 my-2">
          <TabsTrigger value="artigo" className="font-medium">Artigo</TabsTrigger>
          <TabsTrigger value="anotacoes" className="font-medium">Anotações</TabsTrigger>
          <TabsTrigger value="explicacao" className="font-medium">Explicação</TabsTrigger>
        </TabsList>
        
        <TabsContent value="artigo" className="px-0">
          <CardContent className="pt-4 pb-2 px-5">
            <div className="text-foreground prose prose-slate max-w-none relative" onMouseUp={handleTextSelection}>
              {showHighlightControls && (
                <div className="absolute top-0 right-0 flex gap-2 p-2 bg-background dark:bg-legal-darkNav/90 rounded-md shadow-md z-10">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 gap-1"
                    onClick={handleAddHighlight}
                    disabled={!selectedText}
                  >
                    <Highlighter className="h-3.5 w-3.5" />
                    <span className="text-xs">Destacar</span>
                  </Button>
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
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={copyArticleText}
                >
                  <Clipboard className="h-3.5 w-3.5" />
                  Copiar texto
                </Button>
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
                        className="rounded-md w-full h-32 object-cover"
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
                  className="min-h-[150px] focus-visible:ring-legal-gold"
                />
                <div className="flex justify-end mt-2">
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
                <Loader2 className="h-8 w-8 animate-spin text-legal-gold mb-2" />
                <p className="text-sm text-muted-foreground">Gerando explicação com IA...</p>
              </div>
            ) : explanation ? (
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <div className="flex items-center gap-2 mb-4 text-legal-gold dark:text-legal-lightGold">
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
                  variant="outline"
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
      </Tabs>
      
      <Separator />
      
      <CardFooter className="flex justify-between items-center py-3 bg-muted/30 dark:bg-muted/10">
        <div className="flex gap-1">
          {isPlaying ? (
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
    </Card>
  );
}
