
import axios from 'axios';

const SPREADSHEET_ID = '1rctu_xg4P0KkMWKbzu7-mgJp-HjCu-cT8DZqNAzln-s';
const API_KEY = 'AIzaSyDvJ23IolKwjdxAnTv7l8DwLuwGRZ_tIR8';

// Type definition for article data
export interface ArticleData {
  articleNumber: string;
  articleText: string;
  sheetName?: string;
  sheetId?: string;
}

// Type definition for sheet data
export interface SheetInfo {
  id: string;
  title: string;
  index: number;
}

// Function to get all sheets in the spreadsheet
export async function getAllSheets(): Promise<SheetInfo[]> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}`;
    
    const response = await axios.get(url);
    const sheets = response.data.sheets;
    
    return sheets.map((sheet: any) => ({
      id: sheet.properties.sheetId,
      title: sheet.properties.title,
      index: sheet.properties.index
    }));
  } catch (error) {
    console.error('Error fetching sheets:', error);
    return [];
  }
}

// Function to fetch a specific article by number from a specific sheet
export async function getArticleByNumber(articleNumber: string, sheetName: string = 'Sheet1'): Promise<ArticleData | null> {
  try {
    // The Google Sheets API URL to search for the article number in column A
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}!A:B?key=${API_KEY}`;
    
    const response = await axios.get(url);
    const values = response.data.values;
    
    if (!values || values.length === 0) {
      console.error('No data found in spreadsheet');
      return null;
    }
    
    // Find the row where column A matches the article number
    const matchingRow = values.find((row: any[]) => row[0] === articleNumber);
    
    if (!matchingRow) {
      console.log(`Article ${articleNumber} not found in sheet ${sheetName}`);
      return null;
    }
    
    return {
      articleNumber: matchingRow[0],
      articleText: matchingRow[1] || '',
      sheetName: sheetName
    };
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

// Function to search for article across all sheets
export async function searchArticleAcrossSheets(articleNumber: string): Promise<ArticleData | null> {
  try {
    const sheets = await getAllSheets();
    
    for (const sheet of sheets) {
      const article = await getArticleByNumber(articleNumber, sheet.title);
      if (article) {
        return {
          ...article,
          sheetName: sheet.title,
          sheetId: sheet.id.toString()
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error searching across sheets:', error);
    return null;
  }
}

// Function to get all articles from a specific sheet
export async function getAllArticles(sheetName: string = 'Sheet1', limit = 100): Promise<ArticleData[]> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}!A:B?key=${API_KEY}`;
    
    const response = await axios.get(url);
    const values = response.data.values;
    
    if (!values || values.length === 0) {
      console.error('No data found in spreadsheet');
      return [];
    }
    
    // Skip header row if present, and limit results
    const dataRows = values.slice(1, limit + 1);
    
    return dataRows.map((row: any[]) => ({
      articleNumber: row[0] || '',
      articleText: row[1] || '',
      sheetName: sheetName
    }));
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

// Text-to-Speech function using Google TTS API
export async function textToSpeech(text: string): Promise<string> {
  try {
    const url = 'https://texttospeech.googleapis.com/v1/text:synthesize';
    const params = {
      key: API_KEY
    };
    
    const data = {
      input: { text },
      voice: {
        languageCode: 'pt-BR',
        name: 'pt-BR-Wavenet-A',
        ssmlGender: 'FEMALE'
      },
      audioConfig: { 
        audioEncoding: 'MP3',
        speakingRate: 0.95,
        pitch: 0,
        volumeGainDb: 0,
        effectsProfileId: ['small-bluetooth-speaker-class-device'] 
      }
    };
    
    const response = await axios.post(url, data, { params });
    return response.data.audioContent; // Base64 encoded audio
  } catch (error) {
    console.error('Error with TTS:', error);
    throw new Error('Failed to convert text to speech');
  }
}

// Function to preprocess text for better TTS (handle roman numerals, abbreviations, etc.)
export function preprocessTextForTTS(text: string): string {
  // Replace roman numerals with spelled out numbers for better pronunciation
  const romanNumeralsMap: Record<string, string> = {
    'I': 'primeiro',
    'II': 'segundo',
    'III': 'terceiro',
    'IV': 'quarto',
    'V': 'quinto',
    'VI': 'sexto',
    'VII': 'sétimo',
    'VIII': 'oitavo',
    'IX': 'nono',
    'X': 'décimo'
  };
  
  // Replace common legal abbreviations
  const abbreviationsMap: Record<string, string> = {
    'art.': 'artigo',
    'inc.': 'inciso',
    'pág.': 'página',
    'n.': 'número',
    'min.': 'ministro',
    'rel.': 'relator',
    'proc.': 'processo',
    'cf.': 'conforme',
    'STF': 'Supremo Tribunal Federal',
    'STJ': 'Superior Tribunal de Justiça',
    'TST': 'Tribunal Superior do Trabalho'
  };
  
  // Process text
  let processedText = text;
  
  // Replace roman numerals
  Object.entries(romanNumeralsMap).forEach(([roman, spelled]) => {
    // Use word boundaries to avoid replacing parts of words
    const regex = new RegExp(`\\b${roman}\\b`, 'g');
    processedText = processedText.replace(regex, spelled);
  });
  
  // Replace abbreviations
  Object.entries(abbreviationsMap).forEach(([abbrev, full]) => {
    const regex = new RegExp(`\\b${abbrev.replace('.', '\\.')}\\b`, 'g');
    processedText = processedText.replace(regex, full);
  });
  
  // Remove emojis
  processedText = processedText.replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}|\u{1F900}-\u{1F9FF}|\u{1F1E0}-\u{1F1FF}|\u{1F700}-\u{1F77F}|\u{1F780}-\u{1F7FF}|\u{1F800}-\u{1F8FF}|\u{1F900}-\u{1F9FF}|\u{1FA00}-\u{1FA6F}|\u{1FA70}-\u{1FAFF}]/gu, '');
  
  return processedText;
}
