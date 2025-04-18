
import axios from 'axios';

const SPREADSHEET_ID = '1rctu_xg4P0KkMWKbzu7-mgJp-HjCu-cT8DZqNAzln-s';
const API_KEY = 'AIzaSyDvJ23IolKwjdxAnTv7l8DwLuwGRZ_tIR8';
const SHEET_NAME = 'Sheet1'; // Assuming the first sheet is named Sheet1

// Type definition for article data
export interface ArticleData {
  articleNumber: string;
  articleText: string;
}

// Function to fetch a specific article by number
export async function getArticleByNumber(articleNumber: string): Promise<ArticleData | null> {
  try {
    // The Google Sheets API URL to search for the article number in column A
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:B?key=${API_KEY}`;
    
    const response = await axios.get(url);
    const values = response.data.values;
    
    if (!values || values.length === 0) {
      console.error('No data found in spreadsheet');
      return null;
    }
    
    // Find the row where column A matches the article number
    const matchingRow = values.find((row: any[]) => row[0] === articleNumber);
    
    if (!matchingRow) {
      console.log(`Article ${articleNumber} not found`);
      return null;
    }
    
    return {
      articleNumber: matchingRow[0],
      articleText: matchingRow[1] || ''
    };
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

// Function to get all articles (limited to avoid performance issues)
export async function getAllArticles(limit = 100): Promise<ArticleData[]> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:B?key=${API_KEY}`;
    
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
      articleText: row[1] || ''
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
    const headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    const data = {
      input: { text },
      voice: {
        languageCode: 'pt-BR',
        name: 'pt-BR-Wavenet-E',
        ssmlGender: 'FEMALE'
      },
      audioConfig: { audioEncoding: 'MP3' }
    };
    
    const response = await axios.post(url, data, { headers });
    return response.data.audioContent; // Base64 encoded audio
  } catch (error) {
    console.error('Error with TTS:', error);
    throw new Error('Failed to convert text to speech');
  }
}
