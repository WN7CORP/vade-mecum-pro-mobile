
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ArticleData } from './googleApi';

// Function to export articles to PDF
export async function exportToPdf(
  articles: ArticleData[], 
  filename = 'wadmecon-export.pdf',
  explanations: Record<string, string> = {}
): Promise<string> {
  try {
    // Create a new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set document properties
    pdf.setProperties({
      title: 'WADMECON2025 PRO - Exportação',
      subject: 'Artigos jurídicos exportados',
      author: 'WADMECON2025 PRO',
      creator: 'WADMECON2025 PRO'
    });
    
    // Add header to the PDF
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(90, 70, 200); // Purple color
    pdf.text('WADMECON2025 PRO', 105, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Exportação de Artigos', 105, 28, { align: 'center' });
    
    // Add current date
    const currentDate = new Date().toLocaleDateString('pt-BR');
    pdf.setFontSize(10);
    pdf.text(`Data: ${currentDate}`, 20, 40);
    
    let yPosition = 50;
    
    // Add each article to the PDF
    for (const article of articles) {
      // Check if we need a new page
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Add article header section - Block A (ARTIGO)
      pdf.setFillColor(90, 70, 200, 0.1);
      pdf.roundedRect(20, yPosition, 170, 10, 2, 2, 'F');
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(90, 70, 200);
      pdf.text(`A - ARTIGO ${article.articleNumber}${article.sheetName ? ` (${article.sheetName})` : ''}`, 25, yPosition + 7);
      
      yPosition += 15;
      
      // Add article text with line breaks - Block A content
      pdf.setFont('times', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      
      // Split text into lines with wordwrap and preserve line breaks
      const textWithPreservedLineBreaks = article.articleText.replace(/\n/g, '\r\n');
      const textLines = pdf.splitTextToSize(textWithPreservedLineBreaks, 170);
      
      // Add each line
      for (const line of textLines) {
        pdf.text(line, 20, yPosition);
        yPosition += 6;
        
        // Check if we need a new page
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
      }
      
      // Add explanation if available
      const explanation = explanations[article.articleNumber] || 
                          explanations[`${article.articleNumber}-${article.sheetName || ''}`];
      
      if (explanation) {
        // Process explanation text to extract ABNT sections
        const sections = processExplanationText(explanation);
        
        // Add spacing before explanation
        yPosition += 10;
        
        // Check if we need a new page
        if (yPosition > 240) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Add base legal section - Block B (BASE LEGAL)
        if (sections.baseLegal) {
          pdf.setFillColor(50, 120, 200, 0.1);
          pdf.roundedRect(20, yPosition, 170, 10, 2, 2, 'F');
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(50, 120, 200);
          pdf.text('B - BASE LEGAL', 25, yPosition + 7);
          yPosition += 15;
          
          // Add base legal content
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(10);
          
          const baseLegalLines = pdf.splitTextToSize(sections.baseLegal, 170);
          for (const line of baseLegalLines) {
            pdf.text(line, 20, yPosition);
            yPosition += 5;
            
            // Check if we need a new page
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;
            }
          }
          
          yPosition += 5;
        }
        
        // Add notes section - Block N (NOTAS)
        if (sections.notes) {
          // Check if we need a new page
          if (yPosition > 240) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFillColor(50, 180, 100, 0.1);
          pdf.roundedRect(20, yPosition, 170, 10, 2, 2, 'F');
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(50, 180, 100);
          pdf.text('N - NOTAS', 25, yPosition + 7);
          yPosition += 15;
          
          // Add notes content
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(10);
          
          const notesLines = pdf.splitTextToSize(sections.notes, 170);
          for (const line of notesLines) {
            pdf.text(line, 20, yPosition);
            yPosition += 5;
            
            // Check if we need a new page
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;
            }
          }
          
          yPosition += 5;
        }
        
        // Add theory section - Block T (TEORIA)
        if (sections.theory) {
          // Check if we need a new page
          if (yPosition > 240) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFillColor(200, 100, 50, 0.1);
          pdf.roundedRect(20, yPosition, 170, 10, 2, 2, 'F');
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(200, 100, 50);
          pdf.text('T - TEORIA', 25, yPosition + 7);
          yPosition += 15;
          
          // Add theory content
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(10);
          
          const theoryLines = pdf.splitTextToSize(sections.theory, 170);
          for (const line of theoryLines) {
            pdf.text(line, 20, yPosition);
            yPosition += 5;
            
            // Check if we need a new page
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;
            }
          }
          
          yPosition += 5;
        }
        
        // Add example section
        if (sections.example) {
          // Check if we need a new page
          if (yPosition > 240) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFillColor(180, 70, 200, 0.1);
          pdf.roundedRect(20, yPosition, 170, 10, 2, 2, 'F');
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(180, 70, 200);
          pdf.text('EXEMPLO PRÁTICO', 25, yPosition + 7);
          yPosition += 15;
          
          // Add example content
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(10);
          
          const exampleLines = pdf.splitTextToSize(sections.example, 170);
          for (const line of exampleLines) {
            pdf.text(line, 20, yPosition);
            yPosition += 5;
            
            // Check if we need a new page
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;
            }
          }
          
          yPosition += 5;
        }
        
        // Add jurisprudence section
        if (sections.jurisprudence) {
          // Check if we need a new page
          if (yPosition > 240) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFillColor(100, 100, 100, 0.1);
          pdf.roundedRect(20, yPosition, 170, 10, 2, 2, 'F');
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(100, 100, 100);
          pdf.text('JURISPRUDÊNCIA', 25, yPosition + 7);
          yPosition += 15;
          
          // Add jurisprudence content
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(9);
          
          const jurisprudenceLines = pdf.splitTextToSize(sections.jurisprudence, 170);
          for (const line of jurisprudenceLines) {
            pdf.text(line, 20, yPosition);
            yPosition += 5;
            
            // Check if we need a new page
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;
            }
          }
          
          yPosition += 5;
        }
        
        // Add "Generated by AI" note
        yPosition += 5;
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Gerado por IA utilizando Gemini', 170, yPosition, { align: 'right' });
        
        yPosition += 10;
      } else {
        // Just add spacing if no explanation
        yPosition += 15;
      }
      
      // Add a separator line between articles if this is not the last article
      if (articles.indexOf(article) < articles.length - 1) {
        pdf.setDrawColor(90, 70, 200, 0.3);
        pdf.line(20, yPosition - 5, 190, yPosition - 5);
      }
    }
    
    // Footer
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Documento gerado por WADMECON2025 PRO', 105, 290, { align: 'center' });
    
    // Save and return the PDF as base64 string
    const pdfOutput = pdf.output('datauristring');
    
    return pdfOutput;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export articles to PDF');
  }
}

// Helper function to process explanation text into ABNT sections
function processExplanationText(text: string): {
  article?: string;
  baseLegal?: string;
  notes?: string;
  theory?: string;
  example?: string;
  jurisprudence?: string;
} {
  const sections: {
    article?: string;
    baseLegal?: string;
    notes?: string;
    theory?: string;
    example?: string;
    jurisprudence?: string;
  } = {};
  
  // Extract article summary (A - ARTIGO)
  const articleMatch = text.match(/A\s*-\s*ARTIGO[^B]*(?=B\s*-\s*BASE|$)/i);
  if (articleMatch) sections.article = articleMatch[0].replace(/A\s*-\s*ARTIGO/i, '').trim();
  
  // Extract base legal (B - BASE LEGAL)
  const baseLegalMatch = text.match(/B\s*-\s*BASE\s*LEGAL[^N]*(?=N\s*-\s*NOTAS|$)/i);
  if (baseLegalMatch) sections.baseLegal = baseLegalMatch[0].replace(/B\s*-\s*BASE\s*LEGAL/i, '').trim();
  
  // Extract notes (N - NOTAS)
  const notesMatch = text.match(/N\s*-\s*NOTAS[^T]*(?=T\s*-\s*TEORIA|$)/i);
  if (notesMatch) sections.notes = notesMatch[0].replace(/N\s*-\s*NOTAS/i, '').trim();
  
  // Extract theory (T - TEORIA)
  const theoryMatch = text.match(/T\s*-\s*TEORIA.*?(?=Exemplo prático|$)/is);
  if (theoryMatch) sections.theory = theoryMatch[0].replace(/T\s*-\s*TEORIA/i, '').trim();
  
  // Extract example
  const exampleMatch = text.match(/Exemplo prático.*?(?=Jurisprudência|$)/is);
  if (exampleMatch) sections.example = exampleMatch[0].replace(/Exemplo prático/i, '').trim();
  
  // Extract jurisprudence
  const jurisprudenceMatch = text.match(/Jurisprudência.*$/is);
  if (jurisprudenceMatch) sections.jurisprudence = jurisprudenceMatch[0].replace(/Jurisprudência/i, '').trim();
  
  return sections;
}

// Function to export element to PDF (for single article)
export async function exportElementToPdf(element: HTMLElement, filename = 'wadmecon-article.pdf'): Promise<string> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(90, 70, 200);
    pdf.text('WADMECON2025 PRO', 105, 15, { align: 'center' });
    
    // Calculate dimensions to fit the image properly
    const imgWidth = 190;  // A4 width minus margins
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add the image
    pdf.addImage(imgData, 'PNG', 10, 20, imgWidth, imgHeight);
    
    // Add footer
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Documento gerado por WADMECON2025 PRO', 105, 290, { align: 'center' });
    
    // Save and return the PDF as base64 string
    const pdfOutput = pdf.output('datauristring');
    
    return pdfOutput;
  } catch (error) {
    console.error('Error exporting element to PDF:', error);
    throw new Error('Failed to export element to PDF');
  }
}

// Prepare data for Google Sheets export
export function prepareDataForSheets(
  articles: ArticleData[], 
  annotations: Record<string, string> = {},
  highlights: Record<string, { text: string, color: string }[]> = {}
): any[][] {
  // Create header row
  const headers = ['Número do Artigo', 'Lei/Código', 'Texto do Artigo', 'Anotação Pessoal', 'Destaques', 'Data'];
  
  // Create data rows
  const rows = articles.map(article => {
    const articleHighlights = highlights[article.articleNumber] || [];
    const highlightTexts = articleHighlights.map(h => h.text).join('\n');
    
    return [
      article.articleNumber,
      article.sheetName || '',
      article.articleText,
      annotations[article.articleNumber] || '',
      highlightTexts,
      new Date().toLocaleDateString('pt-BR')
    ];
  });
  
  // Return combined data (header + rows)
  return [headers, ...rows];
}
