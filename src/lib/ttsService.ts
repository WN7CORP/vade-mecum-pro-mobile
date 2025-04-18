
// TTS Service for managing text-to-speech functionality

let audioContext: AudioContext | null = null;
let currentAudio: HTMLAudioElement | null = null;
let isPlaying = false;
let audioEndCallbacks: (() => void)[] = [];

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
      audioEndCallbacks.forEach(callback => callback());
    });
    
    audio.addEventListener('error', (err) => {
      console.error('Audio playback error:', err);
      isPlaying = false;
      currentAudio = null;
      audioEndCallbacks.forEach(callback => callback());
    });
    
    // Create visualization if audioContext exists
    if (audioContext) {
      try {
        const source = audioContext.createMediaElementSource(audio);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        // This could be used for visualization if needed
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Function to update visualization
        function updateVisualization() {
          if (!isPlaying) return;
          analyser.getByteFrequencyData(dataArray);
          
          // Example: calculate average volume
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          
          // Dispatch an event with the volume data for UI visualization
          window.dispatchEvent(new CustomEvent('audio-visualization', { 
            detail: { volume: average / 255 } 
          }));
          
          // Continue updating if still playing
          if (isPlaying) {
            requestAnimationFrame(updateVisualization);
          }
        }
        
        // Start visualization
        requestAnimationFrame(updateVisualization);
      } catch (e) {
        console.warn('Failed to set up audio visualization:', e);
        // Continue with playback even if visualization fails
      }
    }
    
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

// Register callback for when audio ends
export function onAudioEnd(callback: () => void): void {
  audioEndCallbacks.push(callback);
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
    audioEndCallbacks.forEach(callback => callback());
  }
}

// Check if audio is currently playing
export function isAudioPlaying(): boolean {
  return isPlaying;
}

// Get current playback position (0-1) for visualization
export function getPlaybackPosition(): number {
  if (currentAudio && currentAudio.duration > 0) {
    return currentAudio.currentTime / currentAudio.duration;
  }
  return 0;
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
  utterance.rate = 0.95; // Slightly slower for better comprehension
  
  // Set voice if specified and available
  if (voiceName) {
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.name === voiceName);
    if (voice) {
      utterance.voice = voice;
    }
  }
  
  // Add event listener for when speech ends
  utterance.onend = () => {
    isPlaying = false;
    audioEndCallbacks.forEach(callback => callback());
  };
  
  // Set playing state
  isPlaying = true;
  
  // Speak the text
  window.speechSynthesis.speak(utterance);
}

// Clean up and reset the service
export function cleanup(): void {
  stopAudio();
  audioEndCallbacks = [];
  isPlaying = false;
  currentAudio = null;
}
