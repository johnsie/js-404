// State management for synthesizer
import { create } from 'zustand';
import { SynthesizerParams } from './WebAudioSynthesizer';
import { Patch } from './PatchDatabase';

export interface SequencerNote {
  note: number; // MIDI note number, 0 = rest
  velocity: number; // 0-1
  duration: number; // 0-1 (relative to step duration)
  slide: boolean; // Whether to slide to this note from the previous one
  enabled: boolean; // Whether this step plays
}

interface SynthesizerState {
  params: SynthesizerParams;
  activeKeys: Set<number>;
  patches: Patch[];
  currentPatchId: number | null;
  isPlaying: boolean;
  displayText: string;
  controlMode: 'knobs' | 'sliders'; // Toggle between knobs and sliders
  currentPreset: string; // Track current preset
  
  // Sequencer state
  sequencerSteps: SequencerNote[];
  currentStep: number;
  tempo: number; // BPM
  isSequencerRunning: boolean;

  setParams: (params: Partial<SynthesizerParams>) => void;
  setActiveKey: (key: number, active: boolean) => void;
  setPatches: (patches: Patch[]) => void;
  setCurrentPatchId: (id: number | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setDisplayText: (text: string) => void;
  setControlMode: (mode: 'knobs' | 'sliders') => void;
  
  // Sequencer methods
  setSequencerStep: (index: number, note: SequencerNote) => void;
  setCurrentStep: (step: number) => void;
  setTempo: (bpm: number) => void;
  setIsSequencerRunning: (running: boolean) => void;
  clearSequencer: () => void;
  loadPreset: (presetName: string) => void;
  generateRandomSequence: () => void;
}

// Preset definitions with complete synth parameters and sequences
interface PresetDefinition {
  name: string;
  params: SynthesizerParams;
  tempo: number;
  sequencerSteps: SequencerNote[];
}

const PRESETS: { [key: string]: PresetDefinition } = {
  acidTechno: {
    name: 'Acid Techno',
    params: {
      oscillatorType: 'sawtooth',
      frequency: 440,
      volume: 0.32,
      attack: 0.005,
      decay: 0.15,
      sustain: 0.25,
      release: 0.12,
      cutoff: 1300,
      resonance: 10,
      filterType: 'lowpass',
      lfoRate: 3.8,
      lfoAmount: 0.25,
      detuneAmount: 0.08,
      ringModAmount: 0,
      wetness: 0.25,
      coarseness: 0.6,
    },
    tempo: 125,
    sequencerSteps: [
      { note: 36, velocity: 0.92, duration: 0.8, slide: false, enabled: true },
      { note: 36, velocity: 0.85, duration: 0.5, slide: false, enabled: true },
      { note: 40, velocity: 0.92, duration: 0.8, slide: true, enabled: true },
      { note: 43, velocity: 0.92, duration: 0.8, slide: false, enabled: true },
      { note: 41, velocity: 0.92, duration: 0.8, slide: true, enabled: true },
      { note: 38, velocity: 0.92, duration: 0.6, slide: false, enabled: true },
      { note: 0, velocity: 0.92, duration: 0.5, slide: false, enabled: false },
      { note: 38, velocity: 0.92, duration: 0.8, slide: true, enabled: true },
      { note: 43, velocity: 0.92, duration: 0.8, slide: false, enabled: true },
      { note: 41, velocity: 0.92, duration: 0.8, slide: true, enabled: true },
      { note: 39, velocity: 0.88, duration: 0.6, slide: false, enabled: true },
      { note: 36, velocity: 0.92, duration: 1.2, slide: false, enabled: true },
      { note: 40, velocity: 0.92, duration: 0.8, slide: false, enabled: true },
      { note: 43, velocity: 0.92, duration: 0.8, slide: true, enabled: true },
      { note: 38, velocity: 0.92, duration: 0.6, slide: false, enabled: true },
      { note: 36, velocity: 0.92, duration: 0.8, slide: false, enabled: true },
    ],
  },
  padAmbient: {
    name: 'Pad/Ambient',
    params: {
      oscillatorType: 'sine',
      frequency: 440,
      volume: 0.15,
      attack: 0.5,
      decay: 0.8,
      sustain: 0.6,
      release: 1.0,
      cutoff: 4000,
      resonance: 1,
      filterType: 'lowpass',
      lfoRate: 1.2,
      lfoAmount: 0.35,
      detuneAmount: 0.2,
      ringModAmount: 0,
      wetness: 0.6,
      coarseness: 0.3,
    },
    tempo: 60,
    sequencerSteps: [
      { note: 48, velocity: 0.6, duration: 1.0, slide: false, enabled: true },
      { note: 0, velocity: 0.6, duration: 1.0, slide: false, enabled: false },
      { note: 52, velocity: 0.6, duration: 1.0, slide: false, enabled: true },
      { note: 0, velocity: 0.6, duration: 1.0, slide: false, enabled: false },
      { note: 55, velocity: 0.6, duration: 1.0, slide: false, enabled: true },
      { note: 0, velocity: 0.6, duration: 1.0, slide: false, enabled: false },
      { note: 60, velocity: 0.6, duration: 1.0, slide: true, enabled: true },
      { note: 0, velocity: 0.6, duration: 1.0, slide: false, enabled: false },
      { note: 48, velocity: 0.6, duration: 1.0, slide: false, enabled: true },
      { note: 0, velocity: 0.6, duration: 1.0, slide: false, enabled: false },
      { note: 52, velocity: 0.6, duration: 1.0, slide: false, enabled: true },
      { note: 0, velocity: 0.6, duration: 1.0, slide: false, enabled: false },
      { note: 55, velocity: 0.6, duration: 1.0, slide: false, enabled: true },
      { note: 0, velocity: 0.6, duration: 1.0, slide: false, enabled: false },
      { note: 57, velocity: 0.6, duration: 1.0, slide: true, enabled: true },
      { note: 0, velocity: 0.6, duration: 1.0, slide: false, enabled: false },
    ],
  },
  leadBright: {
    name: 'Lead/Bright',
    params: {
      oscillatorType: 'square',
      frequency: 440,
      volume: 0.22,
      attack: 0.005,
      decay: 0.12,
      sustain: 0.4,
      release: 0.1,
      cutoff: 5000,
      resonance: 3,
      filterType: 'lowpass',
      lfoRate: 7,
      lfoAmount: 0.12,
      detuneAmount: 0.15,
      ringModAmount: 0,
      wetness: 0.2,
      coarseness: 0.7,
    },
    tempo: 140,
    sequencerSteps: [
      { note: 60, velocity: 0.9, duration: 0.6, slide: false, enabled: true },
      { note: 62, velocity: 0.8, duration: 0.5, slide: false, enabled: true },
      { note: 64, velocity: 0.85, duration: 0.7, slide: false, enabled: true },
      { note: 65, velocity: 0.9, duration: 0.6, slide: false, enabled: true },
      { note: 67, velocity: 0.8, duration: 0.5, slide: false, enabled: true },
      { note: 69, velocity: 0.85, duration: 0.7, slide: false, enabled: true },
      { note: 70, velocity: 0.9, duration: 0.6, slide: true, enabled: true },
      { note: 72, velocity: 0.8, duration: 0.5, slide: true, enabled: true },
      { note: 64, velocity: 0.85, duration: 0.7, slide: false, enabled: true },
      { note: 60, velocity: 0.9, duration: 0.6, slide: false, enabled: true },
      { note: 0, velocity: 0.8, duration: 0.5, slide: false, enabled: false },
      { note: 62, velocity: 0.85, duration: 0.7, slide: false, enabled: true },
      { note: 67, velocity: 0.9, duration: 0.6, slide: false, enabled: true },
      { note: 0, velocity: 0.8, duration: 0.5, slide: false, enabled: false },
      { note: 64, velocity: 0.85, duration: 0.7, slide: false, enabled: true },
      { note: 60, velocity: 0.9, duration: 0.8, slide: false, enabled: true },
    ],
  },
  bassDeep: {
    name: 'Bass/Deep',
    params: {
      oscillatorType: 'sawtooth',
      frequency: 440,
      volume: 0.35,
      attack: 0.005,
      decay: 0.2,
      sustain: 0.2,
      release: 0.25,
      cutoff: 900,
      resonance: 12,
      filterType: 'lowpass',
      lfoRate: 2.5,
      lfoAmount: 0.2,
      detuneAmount: 0.1,
      ringModAmount: 0,
      wetness: 0.15,
      coarseness: 0.8,
    },
    tempo: 95,
    sequencerSteps: [
      { note: 24, velocity: 0.95, duration: 0.8, slide: false, enabled: true },
      { note: 0, velocity: 0.95, duration: 0.4, slide: false, enabled: false },
      { note: 29, velocity: 0.92, duration: 0.8, slide: true, enabled: true },
      { note: 0, velocity: 0.95, duration: 0.4, slide: false, enabled: false },
      { note: 26, velocity: 0.93, duration: 0.8, slide: true, enabled: true },
      { note: 0, velocity: 0.95, duration: 0.4, slide: false, enabled: false },
      { note: 22, velocity: 0.92, duration: 0.8, slide: false, enabled: true },
      { note: 0, velocity: 0.95, duration: 0.4, slide: false, enabled: false },
      { note: 24, velocity: 0.95, duration: 0.8, slide: false, enabled: true },
      { note: 0, velocity: 0.95, duration: 0.4, slide: false, enabled: false },
      { note: 31, velocity: 0.93, duration: 0.8, slide: true, enabled: true },
      { note: 0, velocity: 0.95, duration: 0.4, slide: false, enabled: false },
      { note: 26, velocity: 0.92, duration: 0.8, slide: true, enabled: true },
      { note: 0, velocity: 0.95, duration: 0.4, slide: false, enabled: false },
      { note: 24, velocity: 0.93, duration: 1.0, slide: false, enabled: true },
      { note: 0, velocity: 0.95, duration: 0.4, slide: false, enabled: false },
    ],
  },
  pluckStaccato: {
    name: 'Pluck/Staccato',
    params: {
      oscillatorType: 'triangle',
      frequency: 440,
      volume: 0.24,
      attack: 0.002,
      decay: 0.08,
      sustain: 0.05,
      release: 0.05,
      cutoff: 3500,
      resonance: 4,
      filterType: 'highpass',
      lfoRate: 5,
      lfoAmount: 0.1,
      detuneAmount: 0.1,
      ringModAmount: 0,
      wetness: 0.1,
      coarseness: 0.4,
    },
    tempo: 160,
    sequencerSteps: [
      { note: 54, velocity: 0.9, duration: 0.3, slide: false, enabled: true },
      { note: 57, velocity: 0.8, duration: 0.3, slide: false, enabled: true },
      { note: 59, velocity: 0.85, duration: 0.3, slide: false, enabled: true },
      { note: 54, velocity: 0.9, duration: 0.3, slide: false, enabled: true },
      { note: 62, velocity: 0.8, duration: 0.3, slide: false, enabled: true },
      { note: 57, velocity: 0.85, duration: 0.3, slide: false, enabled: true },
      { note: 54, velocity: 0.9, duration: 0.3, slide: false, enabled: true },
      { note: 0, velocity: 0.8, duration: 0.3, slide: false, enabled: false },
      { note: 59, velocity: 0.85, duration: 0.3, slide: false, enabled: true },
      { note: 54, velocity: 0.9, duration: 0.3, slide: false, enabled: true },
      { note: 57, velocity: 0.8, duration: 0.3, slide: false, enabled: true },
      { note: 62, velocity: 0.85, duration: 0.3, slide: false, enabled: true },
      { note: 54, velocity: 0.9, duration: 0.3, slide: false, enabled: true },
      { note: 59, velocity: 0.8, duration: 0.3, slide: false, enabled: true },
      { note: 57, velocity: 0.85, duration: 0.3, slide: false, enabled: true },
      { note: 54, velocity: 0.9, duration: 0.3, slide: false, enabled: true },
    ],
  },
  experimental: {
    name: 'Experimental',
    params: {
      oscillatorType: 'square',
      frequency: 440,
      volume: 0.18,
      attack: 0.08,
      decay: 0.2,
      sustain: 0.25,
      release: 0.15,
      cutoff: 2000,
      resonance: 5,
      filterType: 'bandpass',
      lfoRate: 6,
      lfoAmount: 0.4,
      detuneAmount: 0.3,
      ringModAmount: 0.6,
      wetness: 0.4,
      coarseness: 0.9,
    },
    tempo: 110,
    sequencerSteps: [
      { note: 45, velocity: 0.8, duration: 0.7, slide: false, enabled: true },
      { note: 0, velocity: 0.8, duration: 0.3, slide: false, enabled: false },
      { note: 50, velocity: 0.7, duration: 0.7, slide: true, enabled: true },
      { note: 0, velocity: 0.8, duration: 0.3, slide: false, enabled: false },
      { note: 47, velocity: 0.75, duration: 0.7, slide: true, enabled: true },
      { note: 0, velocity: 0.8, duration: 0.3, slide: false, enabled: false },
      { note: 52, velocity: 0.8, duration: 0.7, slide: false, enabled: true },
      { note: 0, velocity: 0.8, duration: 0.3, slide: false, enabled: false },
      { note: 43, velocity: 0.75, duration: 0.7, slide: true, enabled: true },
      { note: 0, velocity: 0.8, duration: 0.3, slide: false, enabled: false },
      { note: 48, velocity: 0.8, duration: 0.7, slide: false, enabled: true },
      { note: 0, velocity: 0.8, duration: 0.3, slide: false, enabled: false },
      { note: 50, velocity: 0.7, duration: 0.7, slide: true, enabled: true },
      { note: 0, velocity: 0.8, duration: 0.3, slide: false, enabled: false },
      { note: 45, velocity: 0.75, duration: 0.7, slide: true, enabled: true },
      { note: 0, velocity: 0.8, duration: 0.3, slide: false, enabled: false },
    ],
  },
};

// Helper function to generate a random sequence
const generateRandomSequence = (): SequencerNote[] => {
  return Array.from({ length: 16 }, () => ({
    note: Math.random() < 0.3 ? 0 : Math.floor(Math.random() * (40 - 20 + 1)) + 20, // Notes 20-40 or rest (30% rest)
    velocity: 0.6 + Math.random() * 0.4, // 0.6-1.0
    duration: 0.5 + Math.random() * 0.5, // 0.5-1.0
    slide: Math.random() < 0.3, // 30% chance of slide
    enabled: Math.random() < 0.7, // 70% enabled by default
  }));
};

export const useSynthesizerStore = create<SynthesizerState>((set) => {
  // Load default preset (bass deep)
  const defaultPreset = PRESETS.bassDeep;

  return {
    params: defaultPreset.params,
    activeKeys: new Set(),
    patches: [],
    currentPatchId: null,
    isPlaying: false,
    displayText: '',
    controlMode: 'sliders', // Default to sliders
    currentPreset: 'bassDeep',
    
    // Sequencer defaults
    sequencerSteps: defaultPreset.sequencerSteps,
    currentStep: 0,
    tempo: defaultPreset.tempo,
    isSequencerRunning: false,

    setParams: (newParams) =>
      set((state) => ({
        params: { ...state.params, ...newParams },
      })),

    setActiveKey: (key, active) =>
      set((state) => {
        const newActiveKeys = new Set(state.activeKeys);
        if (active) {
          newActiveKeys.add(key);
        } else {
          newActiveKeys.delete(key);
        }
        return { activeKeys: newActiveKeys };
      }),

    setPatches: (patches) => set({ patches }),

    setCurrentPatchId: (id) => set({ currentPatchId: id }),

    setIsPlaying: (playing) => set({ isPlaying: playing }),

    setDisplayText: (text) => set({ displayText: text }),

    setControlMode: (mode) => set({ controlMode: mode }),
    
    setSequencerStep: (index, note) =>
      set((state) => {
        const newSteps = [...state.sequencerSteps];
        newSteps[index] = note;
        return { sequencerSteps: newSteps };
      }),

    setCurrentStep: (step) => set({ currentStep: step }),

    setTempo: (bpm) => set({ tempo: Math.max(20, Math.min(300, bpm)) }),

    setIsSequencerRunning: (running) => set({ isSequencerRunning: running }),

    clearSequencer: () =>
      set({
        sequencerSteps: Array.from({ length: 16 }, () => ({ note: 0, velocity: 0.8, duration: 0.5, slide: false, enabled: true })),
        currentStep: 0,
      }),

    loadPreset: (presetName: string) =>
      set(() => {
        const preset = PRESETS[presetName];
        if (!preset) return {};
        return {
          params: preset.params,
          tempo: preset.tempo,
          sequencerSteps: preset.sequencerSteps,
          currentStep: 0,
          currentPreset: presetName,
        };
      }),

    generateRandomSequence: () =>
      set(() => ({
        sequencerSteps: generateRandomSequence(),
      })),
  };
});
