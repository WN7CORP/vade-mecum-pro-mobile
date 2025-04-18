
// TTS Service for managing text-to-speech functionality

let audioContext: AudioContext | null = null;
let currentAudio: HTMLAudioElement | null = null;
let isPlaying = false;

// Initialize the audio context (must be called on user interaction)
export function initAudioContext(): void {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
}

// Play audio from a base64 string
export async function playAudio(audioBase64: string): Promise<void> {
  // Stop any currently playing audio
  stopAudio();
  
  try {
    // Convert base64 to audio element source
    const audioSrc = `data:audio/mp3;base64,${audioBase64}`;
    
    // Create and configure audio element
    const audio = new Audio(audioSrc);
    currentAudio = audio;
    
    // Set up event listeners
    audio.addEventListener('ended', () => {
      isPlaying = false;
      currentAudio = null;
    });
    
    audio.addEventListener('error', (err) => {
      console.error('Audio playback error:', err);
      isPlaying = false;
      currentAudio = null;
    });
    
    // Play the audio
    await audio.play();
    isPlaying = true;
    
    return new Promise((resolve) => {
      audio.addEventListener('ended', () => resolve());
    });
  } catch (error) {
    console.error('Failed to play audio:', error);
    isPlaying = false;
    throw error;
  }
}

// Pause the current audio
export function pauseAudio(): void {
  if (currentAudio && isPlaying) {
    currentAudio.pause();
    isPlaying = false;
  }
}

// Resume the current audio
export function resumeAudio(): Promise<void> | undefined {
  if (currentAudio && !isPlaying) {
    isPlaying = true;
    return currentAudio.play();
  }
}

// Stop the current audio
export function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    isPlaying = false;
  }
}

// Check if audio is currently playing
export function isAudioPlaying(): boolean {
  return isPlaying;
}

// Preload audio for better user experience
export function preloadAudio(audioBase64: string): HTMLAudioElement {
  const audioSrc = `data:audio/mp3;base64,${audioBase64}`;
  const audio = new Audio();
  audio.src = audioSrc;
  audio.preload = 'auto';
  return audio;
}

// Create a speech synthesizer fallback for browsers that don't support the Google TTS
export function speakWithBrowserTTS(text: string, voiceName = '', lang = 'pt-BR'): void {
  if (!('speechSynthesis' in window)) {
    console.error('Browser does not support speech synthesis');
    return;
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  // Create a new utterance
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  
  // Set voice if specified and available
  if (voiceName) {
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.name === voiceName);
    if (voice) {
      utterance.voice = voice;
    }
  }
  
  // Speak the text
  window.speechSynthesis.speak(utterance);
}
