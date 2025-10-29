import React, { useRef } from 'react';

interface RotaryKnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export const RotaryKnob: React.FC<RotaryKnobProps> = ({
  label,
  value,
  min,
  max,
  onChange,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastYRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastYRef.current = e.clientY;
    e.preventDefault();
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const delta = lastYRef.current - e.clientY;
      lastYRef.current = e.clientY;

      const range = max - min;
      const sensitivity = range / 200; // Pixels to value conversion
      const newValue = Math.max(min, Math.min(max, value + delta * sensitivity));
      onChange(Number(newValue.toFixed(2)));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    if (isDraggingRef.current) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [value, min, max, onChange]);

  // Calculate rotation (0-270 degrees, -135 to 135)
  const percentage = (value - min) / (max - min);
  const rotation = percentage * 270 - 135;

  return (
    <div className="rotary-knob-container">
      <label className="rotary-knob-label">{label}</label>
      <div
        ref={knobRef}
        className="rotary-knob"
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          isDraggingRef.current = true;
          lastYRef.current = e.touches[0].clientY;
        }}
        onTouchMove={(e) => {
          if (!isDraggingRef.current) return;
          const delta = lastYRef.current - e.touches[0].clientY;
          lastYRef.current = e.touches[0].clientY;

          const range = max - min;
          const sensitivity = range / 200;
          const newValue = Math.max(min, Math.min(max, value + delta * sensitivity));
          onChange(Number(newValue.toFixed(2)));
        }}
        onTouchEnd={() => {
          isDraggingRef.current = false;
        }}
        style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
      >
        <div
          className="rotary-knob-pointer"
          style={{
            transform: `rotate(${rotation}deg)`,
          }}
        />
      </div>
      <div className="rotary-knob-value">
        {typeof value === 'number' ? value.toFixed(1) : value}
      </div>
    </div>
  );
};
