
import axios from 'axios';

const GEMINI_API_KEY = "AIzaSyDvJ23IolKwjdxAnTv7l8DwLuwGRZ_tIR8";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent";

interface GeminiResponse {
  text: string;
  error?: string;
}

export async function getArticleExplanation(articleText: string): Promise<GeminiResponse> {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Explique de forma clara e didática o seguinte artigo da legislação brasileira, incluindo um exemplo prático de aplicação:
                
                ${articleText}
                
                Estruture sua resposta em:
                1. Explicação simples (máximo 3 parágrafos)
                2. Palavras-chave importantes (máximo 5)
                3. Exemplo prático (1 parágrafo)
                4. Jurisprudência relevante (apenas 1 exemplo recente)`
              }
            ]
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
      error: 'Não foi possível gerar a explicação. Por favor, tente novamente mais tarde.' 
    };
  }
}
