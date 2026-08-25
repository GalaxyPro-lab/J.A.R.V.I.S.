import { AssistantState } from '../types';

export class VoiceManager {
  private recognition: any = null;
  private isListening: boolean = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animationFrameId: number | null = null;

  public onVolumeChange: ((volume: number) => void) | null = null;
  public onTranscript: ((text: string, isFinal: boolean) => void) | null = null;
  public onStateChange: ((state: AssistantState) => void) | null = null;
  public onError: ((err: string) => void) | null = null;

  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported in this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'it-IT';

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        this.onTranscript?.(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        this.onTranscript?.(interimTranscript.trim(), false);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        this.onError?.(`Speech recognition error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch (e) {
          // Ignore if already active
        }
      }
    };
  }

  public async startListening() {
    if (this.isListening) return;
    this.isListening = true;
    this.onStateChange?.('LISTENING');

    // Start Web Speech STT
    try {
      this.recognition?.start();
    } catch (e) {
      console.warn('Recognition start exception:', e);
    }

    // Start Audio Analyser for VAD & Orb Waveform
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.isListening || !this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avgVolume = sum / bufferLength / 128.0; // 0.0 to 1.0 approx
        this.onVolumeChange?.(Math.min(1.0, avgVolume));

        this.animationFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err: any) {
      console.warn('Microphone stream error:', err);
      this.onError?.('Permesso microfono non concesso o dispositivo assente.');
    }
  }

  public stopListening() {
    this.isListening = false;
    this.onStateChange?.('IDLE');

    try {
      this.recognition?.stop();
    } catch (e) {}

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.onVolumeChange?.(0);
  }

  public speak(text: string, onEnd?: () => void) {
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown before speaking
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Codice sorgente omesso.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_~#]/g, '')
      .trim();

    if (!cleanText) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'it-IT';
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    // Pick best Italian voice if available
    const voices = window.speechSynthesis.getVoices();
    const itVoice = voices.find((v) => v.lang.startsWith('it') || v.name.toLowerCase().includes('italian'));
    if (itVoice) {
      utterance.voice = itVoice;
    }

    this.onStateChange?.('SPEAKING');

    utterance.onend = () => {
      this.onStateChange?.(this.isListening ? 'LISTENING' : 'IDLE');
      onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      this.onStateChange?.(this.isListening ? 'LISTENING' : 'IDLE');
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceManager = new VoiceManager();
