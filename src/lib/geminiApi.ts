
import axios from 'axios';

const GEMINI_API_KEY = "AIzaSyDvJ23IolKwjdxAnTv7l8DwLuwGRZ_tIR8";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent";

interface GeminiResponse {
  text: string;
  error?: string;
}

export async function getArticleExplanation(articleText: string, articleNumber: string, sheetName?: string): Promise<GeminiResponse> {
  try {
    const prompt = `Explique de forma clara e didática o seguinte artigo da legislação brasileira "${sheetName ? `da ${sheetName}` : ''}", incluindo um exemplo prático de aplicação:
    
    Artigo ${articleNumber}: ${articleText}
    
    Estruture sua resposta em:
    
    A - ARTIGO (resumo conciso do que diz o artigo)
    B - BASE LEGAL (referências a outros artigos ou leis relacionadas)
    N - NOTAS (palavras-chave importantes, máximo 5, e observações relevantes)
    T - TEORIA (explicação detalhada do artigo, máximo 3 parágrafos)
    
    Depois, apresente um exemplo prático de aplicação em 1 parágrafo.
    
    Por fim, cite uma jurisprudência relevante e recente sobre o tema (apenas 1 exemplo).`;
    
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        }
      }
    );

    const textContent = response.data.candidates[0]?.content?.parts[0]?.text || '';
    return { text: textContent };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return { 
      text: '', 
      error: 'Não foi possível gerar a explicação. Por favor, tente novamente mais tarde.' 
    };
  }
}

export async function getAutoAnnotation(articleText: string): Promise<GeminiResponse> {
  try {
    const prompt = `Crie anotações de estudo concisas e úteis para o seguinte artigo da legislação brasileira:
    
    "${articleText}"
    
    Forneça apenas as anotações em tópicos breves, destacando os elementos mais importantes para memorização e compreensão. Máximo de 5 tópicos.`;
    
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        }
      }
    );

    const textContent = response.data.candidates[0]?.content?.parts[0]?.text || '';
    return { text: textContent };
  } catch (error) {
    console.error('Error calling Gemini API for annotations:', error);
    return { 
      text: '', 
      error: 'Não foi possível gerar anotações automáticas.' 
    };
  }
}

export async function askGeminiAboutArticle(question: string, articleText: string, articleNumber: string, sheetName?: string): Promise<GeminiResponse> {
  try {
    const prompt = `Como um assistente jurídico especializado, responda à seguinte pergunta sobre o artigo ${articleNumber}${sheetName ? ` da ${sheetName}` : ''}:
    
    Texto do artigo: "${articleText}"
    
    Pergunta: "${question}"
    
    Forneça uma resposta direta, precisa e completa, citando o texto do artigo quando relevante. Se a pergunta não puder ser respondida apenas com base no artigo fornecido, indique claramente que informações adicionais seriam necessárias. Seja conciso, mas completo.`;
    
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        }
      }
    );

    const textContent = response.data.candidates[0]?.content?.parts[0]?.text || '';
    return { text: textContent };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return { 
      text: '', 
      error: 'Não foi possível obter uma resposta. Por favor, tente novamente mais tarde.' 
    };
  }
}
