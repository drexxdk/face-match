// Sound effects and haptic feedback utilities

export class SoundManager {
  private static instance: SoundManager;
  private enabled: boolean = true;
  private audioContext: AudioContext | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('soundEnabled') !== 'false';
    }
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext && typeof window !== 'undefined') {
      const WindowWithWebkit = window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      };
      this.audioContext = new (window.AudioContext || WindowWithWebkit.webkitAudioContext!)();
    }
    return this.audioContext!;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundEnabled', enabled.toString());
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Play a tone at a specific frequency
  private playTone(frequency: number, duration: number, volume: number = 0.3) {
    if (!this.enabled) return;

    // Don't play sounds if the page is not visible
    if (typeof document !== 'undefined' && document.hidden) return;

    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  playCorrect() {
    // Play an ascending arpeggio for correct answer
    this.playTone(523.25, 0.1, 0.2); // C5
    setTimeout(() => this.playTone(659.25, 0.1, 0.2), 50); // E5
    setTimeout(() => this.playTone(783.99, 0.15, 0.2), 100); // G5
  }

  playWrong() {
    // Play a descending tone for wrong answer
    this.playTone(392, 0.1, 0.2); // G4
    setTimeout(() => this.playTone(329.63, 0.2, 0.2), 80); // E4
  }

  playClick() {
    // Short click sound
    this.playTone(800, 0.05, 0.1);
  }

  playSuccess() {
    // Victory fanfare
    this.playTone(523.25, 0.1, 0.2); // C5
    setTimeout(() => this.playTone(659.25, 0.1, 0.2), 80);
    setTimeout(() => this.playTone(783.99, 0.1, 0.2), 160);
    setTimeout(() => this.playTone(1046.5, 0.3, 0.2), 240); // C6
  }

  playJoin() {
    // Upward swoosh
    this.playTone(440, 0.15, 0.15); // A4
    setTimeout(() => this.playTone(554.37, 0.15, 0.15), 70); // C#5
  }
}

// Haptic feedback utilities
export class HapticManager {
  private static instance: HapticManager;
  private enabled: boolean = true;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('hapticEnabled') !== 'false';
    }
  }

  static getInstance(): HapticManager {
    if (!HapticManager.instance) {
      HapticManager.instance = new HapticManager();
    }
    return HapticManager.instance;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('hapticEnabled', enabled.toString());
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private vibrate(pattern: number | number[]) {
    if (!this.enabled || typeof window === 'undefined' || !window.navigator.vibrate) {
      return;
    }

    try {
      window.navigator.vibrate(pattern);
    } catch (error) {
      console.error('Error triggering haptic feedback:', error);
    }
  }

  light() {
    this.vibrate(10);
  }

  medium() {
    this.vibrate(25);
  }

  heavy() {
    this.vibrate(50);
  }

  success() {
    this.vibrate([10, 50, 10]);
  }

  error() {
    this.vibrate([25, 25, 25]);
  }
}

// Convenience functions
export const sound = SoundManager.getInstance();
export const haptic = HapticManager.getInstance();
