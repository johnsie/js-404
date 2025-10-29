import React, { useRef, useEffect } from 'react';
import { useSynthesizerStore } from '../synthesizer/store';
import { RotaryKnob } from './RotaryKnob';

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export const Knob: React.FC<KnobProps> = ({
  label,
  value,
  min,
  max,
  onChange,
}) => {
  const controlMode = useSynthesizerStore((state) => state.controlMode);
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (controlMode === 'sliders' && sliderRef.current) {
      const percentage = ((value - min) / (max - min)) * 100;
      sliderRef.current.style.background = `linear-gradient(to right, #00d9ff 0%, #00d9ff ${percentage}%, #333 ${percentage}%, #333 100%)`;
    }
  }, [value, min, max, controlMode]);

  // Render rotary knob if in knob mode
  if (controlMode === 'knobs') {
    return <RotaryKnob label={label} value={value} min={min} max={max} onChange={onChange} />;
  }

  // Render slider for slider mode (default)
  return (
    <div className="slider-container">
      <label className="slider-label">{label}</label>
      <input
        ref={sliderRef}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider"
      />
      <div className="slider-value">
        {typeof value === 'number' ? value.toFixed(1) : value}
      </div>
    </div>
  );
};
