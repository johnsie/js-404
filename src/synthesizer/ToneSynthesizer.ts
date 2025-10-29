// Tone.js Synthesizer Implementation
import * as Tone from 'tone';

export interface SynthesizerParams {
  oscillatorType: 'sine' | 'triangle' | 'sawtooth' | 'square';
  frequency: number;
  volume: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  cutoff: number;
  resonance: number;
  filterType: 'lowpass' | 'highpass' | 'bandpass' | 'notch';
  lfoRate: number;
  lfoAmount: number;
  detuneAmount: number;
  ringModAmount: number;
  wetness: number; // 0-1, reverb/effect wet amount
  coarseness: number; // 0-1, waveform harshness
}

interface VoiceNode {
  synth: Tone.Synth;
  filter: Tone.Filter;
  lfo: Tone.LFO;
}

export class WebAudioSynthesizer {
  private voices: Map<number, VoiceNode> = new Map();
  private masterGain: Tone.Gain;
  private params: SynthesizerParams;
  private activeNotes: Set<number> = new Set();

  constructor() {
    console.log('ToneSynthesizer constructor called');
    this.masterGain = new Tone.Gain(0.35);  // Balanced level - not too hot to avoid noise
    this.masterGain.toDestination();
    console.log('Master gain connected to destination, Tone context state:', Tone.context.state);

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
    
    // Update all active voices with new parameters
    this.voices.forEach((voice) => {
      this._updateVoiceParams(voice);
    });
  }

  private _updateVoiceParams(voice: VoiceNode) {
    // Update filter
    voice.filter.frequency.rampTo(this.params.cutoff, 0.1);
    voice.filter.Q.rampTo(this.params.resonance, 0.1);
    voice.filter.type = this.params.filterType;

    // Update LFO frequency
    voice.lfo.frequency.rampTo(this.params.lfoRate, 0.1);
  }

  noteOn(noteNumber: number, _velocity: number = 1, _slideTime: number = 0) {
    if (this.activeNotes.has(noteNumber)) {
      this.noteOff(noteNumber);
    }

    const frequency = this.midiNoteToFrequency(noteNumber);
    console.log('noteOn:', { noteNumber, frequency, oscType: this.params.oscillatorType });

    try {
      // Create a new synth for this voice with proper envelope
      const synth = new Tone.Synth({
        oscillator: { type: this.params.oscillatorType },
        envelope: {
          attack: this.params.attack,
          decay: this.params.decay,
          sustain: this.params.sustain,
          release: this.params.release,
        },
      });

      // Create filter and connect synth to it
      const filter = new Tone.Filter({
        frequency: this.params.cutoff,
        type: this.params.filterType,
        Q: this.params.resonance,
      });

      // Connect synth -> filter -> masterGain
      synth.connect(filter);
      filter.connect(this.masterGain);

      // Create LFO and connect to synth frequency only if LFO amount > 0
      let lfo: Tone.LFO | null = null;
      if (this.params.lfoAmount > 0) {
        lfo = new Tone.LFO({
          frequency: this.params.lfoRate,
          min: frequency * 0.95,
          max: frequency * 1.05,
        });
        lfo.connect(synth.frequency);
        lfo.start();
      }

      // Set frequency
      synth.frequency.value = frequency;
      
      // Trigger attack - note will sustain until noteOff is called
      synth.triggerAttack(Tone.now());
      console.log('Note triggered with attack');

      this.voices.set(noteNumber, { synth, filter, lfo: lfo || new Tone.LFO() });
      this.activeNotes.add(noteNumber);
    } catch (e) {
      console.error('Error in noteOn:', e);
    }
  }

  noteOff(noteNumber: number) {
    const voice = this.voices.get(noteNumber);
    if (voice) {
      try {
        voice.synth.triggerRelease(Tone.now());
        if (voice.lfo) {
          try {
            voice.lfo.stop();
          } catch (e) {
            // LFO might not be running
          }
        }
        // Schedule disposal after release time
        setTimeout(() => {
          try {
            voice.synth.dispose();
            voice.filter.dispose();
            if (voice.lfo) {
              voice.lfo.dispose();
            }
          } catch (e) {
            // Already disposed
          }
        }, (this.params.release * 1000) + 100);
      } catch (e) {
        // Voice might already be disposed
      }
      this.voices.delete(noteNumber);
      this.activeNotes.delete(noteNumber);
    }
  }

  stopAllNotes() {
    // Stop all voices immediately
    const now = Tone.now();
    this.voices.forEach((voice) => {
      try {
        voice.synth.triggerRelease(now);
        voice.lfo.stop();
      } catch (e) {
        // Voice might already be stopped
      }
    });

    // Dispose after release
    setTimeout(() => {
      this.voices.forEach((voice) => {
        try {
          voice.synth.dispose();
          voice.filter.dispose();
          voice.lfo.dispose();
        } catch (e) {
          // Already disposed
        }
      });
      this.voices.clear();
      this.activeNotes.clear();
    }, (this.params.release * 1000) + 100);
  }

  updateFilterCutoff(_noteNumber: number, _frequency: number) {
    // This would be handled by updateParams
  }

  updateOscillatorType(_noteNumber: number, _type: 'sine' | 'triangle' | 'sawtooth' | 'square') {
    // Oscillator type would be set on new notes
  }

  midiNoteToFrequency(noteNumber: number): number {
    return 440 * Math.pow(2, (noteNumber - 69) / 12);
  }

  frequencyToMidiNote(frequency: number): number {
    return Math.round(69 + 12 * Math.log2(frequency / 440));
  }

  setMasterVolume(volume: number) {
    this.masterGain.gain.rampTo(Math.max(0, Math.min(1, volume)), 0.1);
  }

  suspend() {
    Tone.Transport.pause();
  }

  resume() {
    console.log('Resume called, context state before:', Tone.context.state);
    // Tone.js context auto-starts on user interaction, but we can explicitly start if needed
    Tone.start().then(() => {
      console.log('Tone.js started successfully, context state:', Tone.context.state);
    }).catch(err => {
      console.warn('Tone.js start failed:', err);
    });
  }

  getAudioContext(): AudioContext {
    return Tone.getContext().rawContext as AudioContext;
  }
}
