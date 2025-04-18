
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ArticleData } from './googleApi';

// Function to export articles to PDF
export async function exportToPdf(articles: ArticleData[], filename = 'vade-mecum-export.pdf'): Promise<string> {
  try {
    // Create a new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set document properties
    pdf.setProperties({
      title: 'Vade Mecum Pro - Exportação',
      subject: 'Artigos jurídicos exportados',
      author: 'Vade Mecum Pro',
      creator: 'Vade Mecum Pro 2025'
    });
    
    // Add header to the PDF
    pdf.setFontSize(18);
    pdf.setTextColor(26, 54, 93); // Deep navy color
    pdf.text('Vade Mecum Pro', 105, 20, { align: 'center' });
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
      
      // Add article number in bold
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(26, 54, 93);
      pdf.text(`Artigo ${article.articleNumber}`, 20, yPosition);
      yPosition += 8;
      
      // Add article text with line breaks
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      
      // Split text into lines with wordwrap
      const textLines = pdf.splitTextToSize(article.articleText, 170);
      
      // Add each line
      for (const line of textLines) {
        pdf.text(line, 20, yPosition);
        yPosition += 6;
        
        // Check if we need a new page
        if (yPosition > 280) {
          pdf.addPage();
          yPosition = 20;
        }
      }
      
      // Add spacing between articles
      yPosition += 10;
    }
    
    // Footer
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Documento gerado por Vade Mecum Pro 2025', 105, 290, { align: 'center' });
    
    // Save and return the PDF as base64 string
    const pdfOutput = pdf.output('datauristring');
    
    // For download option (when saving to device)
    // pdf.save(filename);
    
    return pdfOutput;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export articles to PDF');
  }
}

// Function to export element to PDF (for single article)
export async function exportElementToPdf(element: HTMLElement, filename = 'vade-mecum-article.pdf'): Promise<string> {
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
    
    // Calculate dimensions to fit the image properly
    const imgWidth = 210;  // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add the image
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Save and return the PDF as base64 string
    const pdfOutput = pdf.output('datauristring');
    
    return pdfOutput;
  } catch (error) {
    console.error('Error exporting element to PDF:', error);
    throw new Error('Failed to export element to PDF');
  }
}

// Prepare data for Google Sheets export
export function prepareDataForSheets(articles: ArticleData[], comments: Record<string, string> = {}): any[][] {
  // Create header row
  const headers = ['Número do Artigo', 'Texto do Artigo', 'Comentário Pessoal', 'Data'];
  
  // Create data rows
  const rows = articles.map(article => {
    return [
      article.articleNumber,
      article.articleText,
      comments[article.articleNumber] || '',
      new Date().toLocaleDateString('pt-BR')
    ];
  });
  
  // Return combined data (header + rows)
  return [headers, ...rows];
}

// Function to handle Google Sheets export
// This is a placeholder as the actual implementation would require OAuth authentication
export function exportToGoogleSheets(data: any[][]): void {
  console.log('Google Sheets export functionality requires OAuth implementation');
  console.log('Data prepared for export:', data);
  
  // In a complete implementation, this would:
  // 1. Authenticate user with OAuth
  // 2. Create a new spreadsheet or open an existing one
  // 3. Write the data to the spreadsheet
  // 4. Share the spreadsheet if needed
}
