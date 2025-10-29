import React from 'react';
import { SequencerNote } from '../synthesizer/store';

interface SequencerProps {
  steps: SequencerNote[];
  currentStep: number;
  tempo: number;
  isRunning: boolean;
  onStepChange: (index: number, note: SequencerNote) => void;
  onTempoChange: (bpm: number) => void;
  onTogglePlay: () => void;
  onClear: () => void;
  onRandom: () => void;
}

const ALL_NOTES = [
  'C-1', 'C#-1', 'D-1', 'D#-1', 'E-1', 'F-1', 'F#-1', 'G-1', 'G#-1', 'A-1', 'A#-1', 'B-1',
  'C0', 'C#0', 'D0', 'D#0', 'E0', 'F0', 'F#0', 'G0', 'G#0', 'A0', 'A#0', 'B0',
  'C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1', 'G1', 'G#1', 'A1', 'A#1', 'B1',
  'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2',
  'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
  'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
  'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5',
  'C6',
];

const NOTE_TO_MIDI: { [key: string]: number } = {};
ALL_NOTES.forEach((note, idx) => {
  NOTE_TO_MIDI[note] = idx;
});

const MIDI_TO_NOTE: { [key: number]: string } = {};
Object.entries(NOTE_TO_MIDI).forEach(([note, midi]) => {
  MIDI_TO_NOTE[midi] = note;
});

export const Sequencer: React.FC<SequencerProps> = ({
  steps,
  currentStep,
  tempo,
  isRunning,
  onStepChange,
  onTempoChange,
  onTogglePlay,
  onClear,
  onRandom,
}) => {
  const handleStepNoteChange = (stepIndex: number, midiNote: number) => {
    const newNote: SequencerNote = {
      ...steps[stepIndex],
      note: midiNote,
    };
    onStepChange(stepIndex, newNote);
  };

  const handleSlideToggle = (stepIndex: number) => {
    const newNote: SequencerNote = {
      ...steps[stepIndex],
      slide: !steps[stepIndex].slide,
    };
    onStepChange(stepIndex, newNote);
  };

  const handleEnabledToggle = (stepIndex: number) => {
    const newNote: SequencerNote = {
      ...steps[stepIndex],
      enabled: !steps[stepIndex].enabled,
    };
    onStepChange(stepIndex, newNote);
  };

  const handleRandomize = () => {
    // Call the parent's random handler
    onRandom();
  };

  return (
    <div className="sequencer-section">
      <div className="section-title">16-Step Sequencer</div>
      
      <div className="sequencer-controls">
        <div className="control-group">
          <label>Tempo:</label>
          <input
            type="range"
            min="20"
            max="300"
            value={tempo}
            onChange={(e) => onTempoChange(Number(e.target.value))}
            className="tempo-slider"
          />
          <span className="tempo-display">{tempo} BPM</span>
        </div>
        
        <div className="control-group">
          <button
            className={`synth-button ${isRunning ? 'active' : ''}`}
            onClick={onTogglePlay}
          >
            {isRunning ? '⏸ Stop' : '▶ Play'}
          </button>
          <button className="synth-button" onClick={onClear}>
            Clear
          </button>
          <button className="synth-button" onClick={handleRandomize}>
            Random
          </button>
        </div>
      </div>

      {/* Piano Roll Style Step Editor */}
      <div className="piano-roll-editor">
        <div className="steps-header">
          {steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`step-column-header ${isRunning && currentStep === idx ? 'current' : ''}`}
            >
              {idx + 1}
            </div>
          ))}
        </div>

        <div className="piano-roll-container">
          {steps.map((step, stepIndex) => (
            <div key={stepIndex} className="step-editor-column">
              {/* Vertical note slider */}
              <div className="step-note-slider-area">
                <input
                  type="range"
                  min="0"
                  max={ALL_NOTES.length - 1}
                  value={step.note}
                  onChange={(e) => handleStepNoteChange(stepIndex, Number(e.target.value))}
                  className="note-slider-vertical"
                  title={step.note === 0 ? 'Rest' : MIDI_TO_NOTE[step.note]}
                />
              </div>

              {/* Note display */}
              {step.note > 0 && (
                <div className="note-display">
                  {MIDI_TO_NOTE[step.note]}
                </div>
              )}

              {/* Slide checkbox */}
              <label className="step-slide-checkbox">
                <input
                  type="checkbox"
                  checked={step.slide}
                  onChange={() => handleSlideToggle(stepIndex)}
                />
                <span className="checkmark"></span>
              </label>

              {/* Enabled checkbox */}
              <label className="step-enabled-checkbox" title="Enable/disable this step">
                <input
                  type="checkbox"
                  checked={step.enabled}
                  onChange={() => handleEnabledToggle(stepIndex)}
                />
                <span className="checkmark"></span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
