import React from 'react';

interface KeyboardProps {
  onKeyDown: (note: number) => void;
  onKeyUp: (note: number) => void;
  activeKeys: Set<number>;
}

export const Keyboard: React.FC<KeyboardProps> = ({
  onKeyDown,
  onKeyUp,
  activeKeys,
}) => {
  const baseNote = 36; // C2
  const keys = 13; // One octave

  const getNoteNames = (midiNote: number): string => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12);
    const note = midiNote % 12;
    return `${noteNames[note]}${octave}`;
  };

  return (
    <div className="keyboard">
      {Array.from({ length: keys }).map((_, i) => {
        const midiNote = baseNote + i;
        const isActive = activeKeys.has(midiNote);

        return (
          <div
            key={i}
            className={`key ${isActive ? 'playing' : ''}`}
            onMouseDown={() => onKeyDown(midiNote)}
            onMouseUp={() => onKeyUp(midiNote)}
            onTouchStart={() => onKeyDown(midiNote)}
            onTouchEnd={() => onKeyUp(midiNote)}
          >
            {getNoteNames(midiNote)}
          </div>
        );
      })}
    </div>
  );
};
