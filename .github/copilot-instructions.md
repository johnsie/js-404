# TS-404 Synthesizer - Project Setup

This document provides project-specific setup and development guidelines.

## Project Overview

A browser-based virtual analog software synthesizer built with React, TypeScript, and Web Audio API. The application is mobile-friendly and includes SQLite-based patch storage.

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Audio**: Web Audio API
- **Database**: sql.js (SQLite in browser)
- **State Management**: Zustand

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Keyboard.tsx       # Virtual keyboard UI component
│   ├── Knob.tsx          # Rotary control UI component
│   └── PatchManager.tsx   # Patch save/load UI
├── synthesizer/
│   ├── WebAudioSynthesizer.ts  # Core synth engine
│   ├── PatchDatabase.ts        # SQLite patch storage
│   └── store.ts                # Zustand state management
├── App.tsx               # Main application component
├── App.css              # Synthesizer styling
├── index.css            # Global styles
└── main.tsx             # React entry point
```

## Key Features

- **VCO**: Sine, Triangle, Sawtooth, Square waveforms with detune
- **Filter**: 4-pole resonant lowpass with cutoff/resonance control
- **Envelope**: Full ADSR controls
- **LFO**: Variable rate modulation
- **Keyboard**: 13-key virtual keyboard with touch support
- **Patches**: Save/load via SQLite database (localStorage-backed)
- **Mobile**: Fully responsive and touch-optimized

## Development Guidelines

### Adding New Parameters
1. Add parameter to `SynthesizerParams` interface in `WebAudioSynthesizer.ts`
2. Add state to Zustand store in `store.ts`
3. Create UI control using `Knob` component in `App.tsx`
4. Update `PatchDatabase.ts` schema if storing in patches

### Modifying UI
- All styling uses CSS modules in individual component files
- Main layout styling in `App.css`
- Responsive design uses mobile-first approach
- Touch events handled with `onTouchStart`/`onTouchEnd`

### Adding Audio Features
1. Extend `WebAudioSynthesizer` class
2. Create audio nodes in appropriate methods
3. Update state management in `store.ts`
4. Add UI controls in `App.tsx`

## Performance Considerations

- Synthesizer runs on main thread (acceptable for Web Audio)
- Database operations use sql.js (synchronous, safe)
- Touch event listeners debounced implicitly
- Knob interactions use requestAnimationFrame internally

## Testing

No test suite included. To add tests:
```bash
npm install --save-dev vitest @testing-library/react
```

## Browser Support

- Modern browsers with Web Audio API support
- Chrome/Chromium 58+
- Firefox 60+
- Safari 14.1+
- Edge 79+

## Troubleshooting

### Audio not working
- Check browser audio permissions
- Try clicking the synthesizer first (autoplay policy)
- Browser console should show initialization logs

### Patches not saving
- Check localStorage is enabled
- Check browser storage quota
- Open DevTools > Application > LocalStorage

### Performance issues
- Reduce number of active voices
- Lower LFO modulation amounts
- Check system CPU usage

## Future Work

- MIDI input support
- Arpeggiator
- Effects processing (Reverb, Delay)
- Keyboard shortcuts for computer keys
- Preset morphing
- Recording/playback functionality
