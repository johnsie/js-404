// Web Audio API Synthesizer Core
export interface SynthesizerParams {
  oscillatorType: OscillatorType;
  frequency: number;
  volume: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  cutoff: number;
  resonance: number;
  filterType: BiquadFilterType;
  lfoRate: number;
  lfoAmount: number;
  detuneAmount: number;
  ringModAmount: number; // 0-1, amount of ring modulation
  wetness: number; // 0-1, reverb/effect wet amount
  coarseness: number; // 0-1, waveform harshness
}

export class WebAudioSynthesizer {
  private audioContext: AudioContext;
  private oscillators: Map<number, OscillatorNode> = new Map();
  private gains: Map<number, GainNode> = new Map();
  private filters: Map<number, BiquadFilterNode> = new Map();
  private lfos: Map<number, OscillatorNode> = new Map();
  private ringModOscillators: Map<number, OscillatorNode> = new Map();
  private ringModGains: Map<number, GainNode[]> = new Map(); // Array to track all ring mod gains
  private masterGain: GainNode;
  private params: SynthesizerParams;
  private activeNotes: Set<number> = new Set();

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    
    this.params = {
      oscillatorType: 'square',
      frequency: 440,
      volume: 0.3,
      attack: 0.1,
      decay: 0.2,
      sustain: 0.5,
      release: 0.3,
      cutoff: 4000,
      resonance: 1,
      filterType: 'lowpass',
      lfoRate: 5,
      lfoAmount: 0,
      detuneAmount: 0,
      ringModAmount: 0,
      wetness: 0.3,
      coarseness: 0.5,
    };
  }

  updateParams(params: Partial<SynthesizerParams>) {
    this.params = { ...this.params, ...params };
  }

  noteOn(noteNumber: number, velocity: number = 1, slideTime: number = 0) {
    if (this.activeNotes.has(noteNumber)) {
      this.noteOff(noteNumber);
    }

    const frequency = this.midiNoteToFrequency(noteNumber);
    
    // Create oscillator
    const osc = this.audioContext.createOscillator();
    osc.type = this.params.oscillatorType;
    
    // If slide is requested, start from a lower frequency
    const now = this.audioContext.currentTime;
    if (slideTime > 0) {
      // Find the last active note frequency to slide from
      let lastFrequency = frequency * 0.5; // Default: slide from half the target frequency
      if (this.activeNotes.size > 0) {
        const lastNote = Math.max(...Array.from(this.activeNotes));
        lastFrequency = this.midiNoteToFrequency(lastNote);
      }
      
      osc.frequency.setValueAtTime(lastFrequency, now);
      osc.frequency.linearRampToValueAtTime(frequency, now + slideTime);
    } else {
      osc.frequency.setValueAtTime(frequency, now);
    }
    
    // Apply detune if specified
    if (this.params.detuneAmount !== 0) {
      osc.detune.value = this.params.detuneAmount;
    }

    // Create filter
    const filter = this.audioContext.createBiquadFilter();
    filter.type = this.params.filterType;
    filter.frequency.value = this.params.cutoff;
    filter.Q.value = this.params.resonance;

    // Create gain (envelope)
    const gainNode = this.audioContext.createGain();
    
    // ADSR Envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(
      velocity * this.params.volume,
      now + this.params.attack
    );
    gainNode.gain.linearRampToValueAtTime(
      this.params.sustain * velocity * this.params.volume,
      now + this.params.attack + this.params.decay
    );

    // Create ring modulator if needed
    let ringModOsc: OscillatorNode | null = null;
    const ringModGainsList: GainNode[] = [];
    if (this.params.ringModAmount > 0 && this.params.ringModAmount < 1) {
      ringModOsc = this.audioContext.createOscillator();
      ringModOsc.frequency.value = frequency * 1.5; // Ring mod carrier frequency
      ringModOsc.type = 'sine';
      
      // Create a separate gain node for ring mod that modulates the audio signal, not the envelope
      const ringModCarrier = this.audioContext.createGain();
      const ringModGain = this.audioContext.createGain();
      
      // Set ring mod gain to a reasonable range (0.1 to 0.5 for subtle effect)
      const ringModAmount = Math.max(0, Math.min(0.5, this.params.ringModAmount * 0.5));
      ringModGain.gain.value = ringModAmount;
      
      ringModOsc.connect(ringModGain);
      ringModGain.connect(ringModCarrier.gain); // Modulate the carrier amplitude, not the envelope
      
      // Connect both oscillator and ring mod to the filter
      osc.connect(filter);
      ringModCarrier.connect(filter);
      ringModOsc.start();
      
      // Track for cleanup
      ringModGainsList.push(ringModGain);
      ringModGainsList.push(ringModCarrier);
    } else {
      // Normal path when no ring mod
      osc.connect(filter);
    }

    // Create LFO if needed
    if (this.params.lfoAmount > 0) {
      const lfo = this.audioContext.createOscillator();
      lfo.frequency.value = this.params.lfoRate;
      
      const lfoGain = this.audioContext.createGain();
      lfoGain.gain.value = this.params.lfoAmount * 100;
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();
      
      this.lfos.set(noteNumber, lfo);
    }

    // Connect nodes
    if (!ringModOsc) {
      // Only connect osc to filter if we didn't already in ring mod section
      osc.connect(filter);
    }
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start();

    this.oscillators.set(noteNumber, osc);
    this.gains.set(noteNumber, gainNode);
    this.filters.set(noteNumber, filter);
    if (ringModOsc) {
      this.ringModOscillators.set(noteNumber, ringModOsc);
      this.ringModGains.set(noteNumber, ringModGainsList);
    }
    this.activeNotes.add(noteNumber);
  }

  noteOff(noteNumber: number) {
    const gain = this.gains.get(noteNumber);
    const osc = this.oscillators.get(noteNumber);
    const lfo = this.lfos.get(noteNumber);

    if (gain && osc) {
      const now = this.audioContext.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + this.params.release);

      osc.stop(now + this.params.release);
    }

    if (lfo) {
      lfo.stop();
      this.lfos.delete(noteNumber);
    }

    setTimeout(() => {
      this.oscillators.delete(noteNumber);
      this.gains.delete(noteNumber);
      this.filters.delete(noteNumber);
      this.activeNotes.delete(noteNumber);
    }, this.params.release * 1000 + 100);
  }

  updateFilterCutoff(noteNumber: number, frequency: number) {
    const filter = this.filters.get(noteNumber);
    if (filter) {
      filter.frequency.setTargetAtTime(
        frequency,
        this.audioContext.currentTime,
        0.01
      );
    }
  }

  updateOscillatorType(_noteNumber: number, _type: OscillatorType) {
    // Note: OscillatorType cannot be changed after starting
    // This would require stopping and starting a new one
  }

  midiNoteToFrequency(noteNumber: number): number {
    return 440 * Math.pow(2, (noteNumber - 69) / 12);
  }

  frequencyToMidiNote(frequency: number): number {
    return Math.round(69 + 12 * Math.log2(frequency / 440));
  }

  setMasterVolume(volume: number) {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  getActiveNotes(): number[] {
    return Array.from(this.activeNotes);
  }

  stopAllNotes() {
    const now = this.audioContext.currentTime;
    
    // Stop all oscillators immediately
    this.oscillators.forEach((osc) => {
      try {
        osc.stop(now);
      } catch (e) {
        // Already stopped
      }
    });

    // Stop all ring mod oscillators
    this.ringModOscillators.forEach((osc) => {
      try {
        osc.stop(now);
      } catch (e) {
        // Already stopped
      }
    });

    // Stop all LFOs
    this.lfos.forEach((lfo) => {
      try {
        lfo.stop();
      } catch (e) {
        // Already stopped
      }
    });

    // Mute all gains immediately (set to 0, don't disconnect)
    this.gains.forEach((gain) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0, now);
      } catch (e) {
        // Already muted
      }
    });

    // Mute all ring mod gains
    this.ringModGains.forEach((gainsList) => {
      gainsList.forEach((gain) => {
        try {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(0, now);
        } catch (e) {
          // Already muted
        }
      });
    });

    // Clear all tracking maps
    this.oscillators.clear();
    this.gains.clear();
    this.filters.clear();
    this.lfos.clear();
    this.ringModOscillators.clear();
    this.ringModGains.clear();
    this.activeNotes.clear();
  }

  suspend() {
    if (this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }

  resume() {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  getAudioContext(): AudioContext {
    return this.audioContext;
  }
}
