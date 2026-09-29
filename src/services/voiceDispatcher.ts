/**
 * URBANTRACK AI - Voice Dispatcher & Audio Synthesis Engine
 * Provides control room radio chime synthesizers, Web Speech TTS dispatches,
 * and speech recognition for hands-free voice command interpretation.
 */

class VoiceDispatcherService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isSpeaking: boolean = false;

  constructor() {
    // Lazy AudioContext on first user gesture
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Synthesizes tactical control room radio chirp / walkie-talkie burst
   */
  public playRadioChirp(tone: 'START' | 'END' = 'START'): Promise<void> {
    return new Promise((resolve) => {
      if (this.isMuted) return resolve();
      const ctx = this.getAudioContext();
      if (!ctx) return resolve();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (tone === 'START') {
        // High dual-tone dispatch alert
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(1174.66, now + 0.08); // D6
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
        setTimeout(resolve, 220);
      } else {
        // Mic release squeak
        osc.frequency.setValueAtTime(587.33, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        setTimeout(resolve, 150);
      }
    });
  }

  /**
   * Dispatches text-to-speech announcement with tactical radio walkie chirp
   */
  public async speakDispatch(text: string, onEnd?: () => void): Promise<void> {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      // Play opening radio chirp
      await this.playRadioChirp('START');

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Select natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferred) {
        utterance.voice = preferred;
      }

      this.isSpeaking = true;

      utterance.onend = async () => {
        this.isSpeaking = false;
        await this.playRadioChirp('END');
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    }
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSpeaking();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getSpeaking(): boolean {
    return this.isSpeaking;
  }

  public hasSpeechRecognition(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }
}

export const voiceDispatcher = new VoiceDispatcherService();
