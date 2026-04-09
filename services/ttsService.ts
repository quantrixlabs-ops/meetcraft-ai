import { BookChapter } from "../types";

export interface TTSState {
  isPlaying: boolean;
  currentChapterIndex: number;
  progress: number; // 0 to 1
  currentSentence: string;
}

type TTSListener = (state: TTSState) => void;

class TTSService {
  private synth: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;
  private chapters: BookChapter[] = [];
  private listeners: TTSListener[] = [];
  
  private state: TTSState = {
    isPlaying: false,
    currentChapterIndex: 0,
    progress: 0,
    currentSentence: ""
  };

  constructor() {
    this.synth = window.speechSynthesis;
  }

  public loadContent(chapters: BookChapter[]) {
    this.chapters = chapters;
    this.stop();
    this.updateState({ currentChapterIndex: 0, progress: 0 });
  }

  public togglePlay() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public play(index?: number) {
    if (this.synth.paused) {
      this.synth.resume();
      this.updateState({ isPlaying: true });
      return;
    }

    if (this.synth.speaking && index === undefined) {
      return; // Already playing
    }

    this.cancel(); // Stop current

    const chapterIdx = index !== undefined ? index : this.state.currentChapterIndex;
    const chapter = this.chapters[chapterIdx];

    if (!chapter) return;

    // Clean markdown for speech
    const cleanText = chapter.content
      .replace(/\*\*/g, "") // Remove bold
      .replace(/#/g, "") // Remove headers
      .replace(/\[.*?\]/g, ""); // Remove links/citations

    // Prepend title
    const textToRead = `Chapter ${chapterIdx + 1}. ${chapter.title}. . ${cleanText}`;

    this.utterance = new SpeechSynthesisUtterance(textToRead);
    
    // Select a good voice (prefer Google or Microsoft Premium)
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes("Google US English") || 
      v.name.includes("Samantha") ||
      v.name.includes("Microsoft Zira")
    );
    if (preferredVoice) this.utterance.voice = preferredVoice;

    this.utterance.rate = 1.0;
    this.utterance.pitch = 1.0;

    this.utterance.onstart = () => {
      this.updateState({ isPlaying: true, currentChapterIndex: chapterIdx });
    };

    this.utterance.onend = () => {
      // Auto-play next chapter
      if (chapterIdx < this.chapters.length - 1) {
        this.play(chapterIdx + 1);
      } else {
        this.updateState({ isPlaying: false, progress: 1 });
      }
    };

    this.utterance.onboundary = (event) => {
      // Approximate progress based on char index
      const len = textToRead.length;
      const progress = Math.min(event.charIndex / len, 1);
      this.updateState({ progress });
    };

    this.synth.speak(this.utterance);
  }

  public pause() {
    this.synth.pause();
    this.updateState({ isPlaying: false });
  }

  public stop() {
    this.cancel();
    this.updateState({ isPlaying: false, progress: 0 });
  }

  public next() {
    if (this.state.currentChapterIndex < this.chapters.length - 1) {
      this.play(this.state.currentChapterIndex + 1);
    }
  }

  public prev() {
    if (this.state.currentChapterIndex > 0) {
      this.play(this.state.currentChapterIndex - 1);
    }
  }

  private cancel() {
    this.synth.cancel();
  }

  public subscribe(listener: TTSListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private updateState(newState: Partial<TTSState>) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(l => l(this.state));
  }
}

export const ttsService = new TTSService();