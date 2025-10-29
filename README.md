# TS-404 Synthesizer

A browser-based virtual analog software synthesizer inspired by the Roland TR-404, built with React, TypeScript, and the Web Audio API.

## Features

- **VCO (Voltage Controlled Oscillator)**
  - Multiple waveforms: Sine, Triangle, Sawtooth, Square
  - Detune control for rich, detuned sounds
  - Adjustable output level

- **Filter Section**
  - 4-pole resonant lowpass filter
  - Cutoff frequency control (20Hz - 20kHz)
  - Resonance/Q control for self-oscillation
  - Multiple filter types: Lowpass, Highpass, Bandpass, Notch

- **Envelope (ADSR)**
  - Attack time control
  - Decay time control
  - Sustain level control
  - Release time control

- **LFO (Low Frequency Oscillator)**
  - Variable rate control (0.1Hz - 50Hz)
  - Modulation amount control

- **Keyboard**
  - 13-key virtual keyboard for note input
  - Touch-friendly for mobile devices
  - Visual feedback for active keys

- **Patch Management**
  - Save and load synthesizer patches
  - SQLite database using sql.js (browser-based)
  - Persistent storage via localStorage
  - Delete patches

- **Mobile & Touch Optimized**
  - Responsive design for all screen sizes
  - Touch event support for all controls
  - Optimized knob sizes for touch interaction

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The synthesizer will open at `http://localhost:3000` in your default browser.

### Production Build

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## Usage

1. **Playing Notes**: Click or touch the keyboard keys to play notes
2. **Adjusting Parameters**: 
   - Click and drag up/down on knobs to adjust values
   - Different sections control different synthesizer parameters
3. **Saving Patches**: Click "Save Patch" to save your current settings
4. **Loading Patches**: Select a patch from the list and click "Load" to restore settings
5. **Deleting Patches**: Click "Del" next to a patch to remove it

## Architecture

### Web Audio API
The synthesizer uses the native Web Audio API for:
- Oscillator generation
- Filter processing
- Gain/ADSR envelope control
- LFO modulation

### Database
- Uses `sql.js` for SQLite database in the browser
- Stores patches in localStorage for persistence
- Supports unlimited patch storage

### State Management
- Uses `Zustand` for efficient state management
- Separates UI state from synthesizer parameters

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Web Audio API** - Audio synthesis
- **sql.js** - SQLite in browser
- **Zustand** - State management

## Browser Compatibility

- Chrome/Chromium 58+
- Firefox 60+
- Safari 14.1+
- Edge 79+

## Performance

The synthesizer is optimized for:
- Responsive UI with minimal latency
- Efficient memory usage
- Touch event debouncing
- Database operations in the main thread (safe for sql.js)

## Known Limitations

- Polyphony limited by browser resources (typically 32+ simultaneous voices)
- No MIDI input support yet (planned for future update)
- Filter modulation by envelope not yet implemented

## Future Enhancements

- [ ] MIDI input support
- [ ] Arpeggiator
- [ ] Effects (Reverb, Delay)
- [ ] Preset morphing
- [ ] Recording/Playback
- [ ] Polyphonic legato mode
- [ ] Keyboard shortcut support for computer keyboard

## License

MIT

## Credits

Inspired by classic analog synthesizers, particularly the TR-404 and other drum machines.
