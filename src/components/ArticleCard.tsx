
import React, { useState, useRef } from "react";
import { useArticle } from "@/context/ArticleContext";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { exportToPdf, exportElementToPdf } from "@/lib/exportUtils";
import { Volume2, VolumeX, Star, Download, Share2, FileText, MessageSquare } from "lucide-react";

interface ArticleCardProps {
  article: {
    articleNumber: string;
    articleText: string;
  };
}

export function ArticleCard({ article }: ArticleCardProps) {
  const { isFavorite, toggleFavorite, comments, saveComment, playArticleAudio, stopAudio, isPlaying } = useArticle();
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [commentText, setCommentText] = useState(comments[article.articleNumber] || '');
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleToggleFavorite = () => {
    toggleFavorite(article.articleNumber);
  };
  
  const handleSaveComment = () => {
    saveComment(article.articleNumber, commentText);
    setIsEditingComment(false);
  };
  
  const handlePlayAudio = async () => {
    await playArticleAudio(article.articleText);
  };
  
  const handleStopAudio = () => {
    stopAudio();
  };
  
  const handleExportPDF = async () => {
    try {
      if (!cardRef.current) return;
      
      // Export current article card to PDF
      const pdfOutput = await exportElementToPdf(cardRef.current);
      
      // Create a download link
      const link = document.createElement('a');
      link.href = pdfOutput;
      link.download = `artigo-${article.articleNumber}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error exporting article to PDF:', error);
    }
  };
  
  return (
    <Card 
      ref={cardRef}
      id={`article-${article.articleNumber}`}
      className="mb-6 shadow-md border-2 hover:border-legal-gold/30 transition-all duration-300 overflow-hidden"
    >
      <CardHeader className="bg-gradient-to-r from-legal-navy to-legal-navy/90 text-white">
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
      
      <CardContent className="pt-6 pb-4 px-5">
        <div className="text-legal-ink prose prose-slate max-w-none">
          <p className="whitespace-pre-wrap font-serif">
            {article.articleText}
          </p>
        </div>
        
        {!isEditingComment && comments[article.articleNumber] && (
          <div className="mt-4 p-3 bg-legal-highlight rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-legal-slate" />
              <span className="text-sm font-medium text-legal-slate">Seu comentário</span>
            </div>
            <p className="text-sm text-legal-ink">{comments[article.articleNumber]}</p>
          </div>
        )}
        
        {isEditingComment && (
          <div className="mt-4">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Adicione seu comentário..."
              className="min-h-[100px] focus-visible:ring-legal-gold"
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditingComment(false)}
              >
                Cancelar
              </Button>
              <Button 
                size="sm"
                onClick={handleSaveComment}
              >
                Salvar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      
      <Separator />
      
      <CardFooter className="flex justify-between items-center py-3 bg-muted/30">
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
            onClick={() => setIsEditingComment(!isEditingComment)}
            title={isEditingComment ? "Cancelar comentário" : "Adicionar comentário"}
          >
            <MessageSquare className="h-4 w-4" />
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
