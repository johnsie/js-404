# TS-404 Synthesizer

A browser-based virtual analog software synthesizer built with React, TypeScript, and Web Audio API. The application features a responsive design optimized for both desktop and mobile devices, complete with preset management and an interactive sequencer.

![TS-404 Synthesizer](https://img.shields.io/badge/React-18-blue?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Tone.js](https://img.shields.io/badge/Tone.js-15-green) ![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite)

## 🎹 Features

### Audio Engine
- **VCO (Voltage Controlled Oscillator)**: Multiple waveforms (Sine, Triangle, Sawtooth, Square)
- **Filter**: 4-pole resonant lowpass filter with adjustable cutoff and resonance
- **Envelope**: Full ADSR (Attack, Decay, Sustain, Release) controls
- **LFO (Low Frequency Oscillator)**: Variable rate modulation with adjustable amount
- **Ring Modulation**: Adds metallic, bell-like tones
- **Wetness Control**: Adjustable reverb/effect depth
- **Coarseness Control**: Waveform harshness and detune adjustment

### Interface
- **Virtual Keyboard**: 3-octave 13-key interactive piano keyboard with touch support
- **Control Modes**: Toggle between Slider and Knob control views
- **Preset System**: 6 factory presets with unique sonic characteristics
- **Sequencer**: 16-step drum pattern editor with adjustable tempo
- **Patch Manager**: Save and load custom patches via SQLite

### Presets Included
1. **Acid Techno** - Punchy sawtooth lead with aggressive envelope
2. **Pad/Ambient** - Rich sine wave pad with lush reverb and slow attack
3. **Lead/Bright** - Bright square wave lead with fast attack
4. **Bass/Deep** - Deep, resonant bass with fast attack (DEFAULT)
5. **Pluck/Staccato** - Quick triangle wave pluck with minimal release
6. **Experimental** - Ring-modulated square wave with bandpass filter

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm 7+
- Modern web browser with Web Audio API support

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd js-404

# Install dependencies
npm install
```

### Development

```bash
# Start the development server (runs on http://localhost:5173)
npm run dev
```

Open your browser to `http://localhost:5173` and start playing!

### Production Build

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── Keyboard.tsx          # Virtual keyboard UI component
│   ├── Knob.tsx              # Rotary control component
│   ├── RotaryKnob.tsx        # Alternative knob style
│   ├── PatchManager.tsx       # Patch save/load interface
│   └── Sequencer.tsx          # 16-step sequencer component
├── synthesizer/
│   ├── ToneSynthesizer.ts     # Tone.js-based audio engine (primary)
│   ├── WebAudioSynthesizer.ts # Web Audio API implementation
│   ├── PatchDatabase.ts       # SQLite patch storage
│   └── store.ts               # Zustand state management & presets
├── App.tsx                    # Main application component
├── App.css                    # Synthesizer styling
├── index.css                  # Global styles
└── main.tsx                   # React entry point

dist/                          # Production build output
```

## 🎛️ Controls Guide

### Master Controls
- **Master Volume**: 0-100% output level
- **Preset Selector**: Choose from 6 factory presets
- **Control Mode**: Switch between Slider and Knob views

### Oscillator Section
- **Waveform**: Select sine, triangle, sawtooth, or square
- **Detune**: Add waveform thickness and detuning

### Filter Section
- **Cutoff**: Filter frequency (20 Hz - 20 kHz)
- **Resonance**: Filter peak emphasis (1 - 20)
- **Filter Type**: Lowpass, highpass, bandpass, or notch
- **Coarseness**: Waveform harshness adjustment (0-100%)

### Envelope Section
- **Attack (A)**: Time to reach peak (0 - 2 seconds)
- **Decay (D)**: Time from peak to sustain level (0 - 2 seconds)
- **Sustain (S)**: Held level while note plays (0 - 100%)
- **Release (R)**: Time to fade after note ends (0 - 2 seconds)

### Effects Section
- **LFO Rate**: Modulation speed (0.1 - 100 Hz)
- **LFO Amount**: Modulation intensity (0 - 1)
- **Ring Mod Amount**: Ring modulation intensity (0 - 1)
- **Wetness**: Reverb/effect depth (0 - 100%)

### Sequencer
- **Tempo**: Speed in BPM (40 - 300)
- **16 Steps**: Toggle notes on/off for each step
- **Play/Stop**: Start and stop sequencer playback

## 🎹 Keyboard Layout

The virtual keyboard spans 3 octaves:

```
Octave 1: C D E F G A B
Octave 2: C D E F G A B
Octave 3: C D E F G A B
```

### Desktop
- Click keys with the mouse
- Each key shows the note name

### Mobile/Touch
- Tap keys directly
- Optimized touch targets for easy playing on tablets and phones

## 🎨 Customization

### Adding New Presets

Edit `src/synthesizer/store.ts` and add to the `presets` array:

```typescript
{
  id: 'mypreset',
  name: 'My Preset',
  params: {
    oscillatorType: 'sine',
    volume: 0.25,
    attack: 0.1,
    decay: 0.2,
    sustain: 0.7,
    release: 0.3,
    cutoff: 4000,
    resonance: 5,
    filterType: 'lowpass',
    lfoRate: 5,
    lfoAmount: 0,
    detuneAmount: 0.1,
    ringModAmount: 0,
    wetness: 0.3,
    coarseness: 0.5,
  },
  sequencerPattern: [] // 16 steps of notes
}
```

### Styling

- Main styling: `src/App.css`
- Global styles: `src/index.css`
- Component styles: Individual component files
- Mobile-first responsive design with flexbox

## 🔧 Technology Stack

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework and component management |
| **TypeScript 5** | Type-safe JavaScript for robust code |
| **Tone.js 15** | High-level Web Audio API wrapper |
| **Zustand** | Lightweight state management |
| **Vite 5** | Ultra-fast build tool and dev server |
| **sql.js** | SQLite database in the browser |

## 🎵 Audio Engine Details

### Tone.js Implementation

The synthesizer uses **Tone.js** as the primary audio engine for professional-grade sound synthesis:

- **Per-voice synthesis**: Each note spawns independent Tone.Synth instances
- **Automatic voice management**: Handles complex envelope and LFO modulation
- **Web Audio optimization**: Automatic garbage collection and resource cleanup
- **Latency reduction**: Optimized scheduling for low-latency note triggering

### Master Gain Tuning

The master gain is set to **0.35** to provide:
- Clean audio output without background noise
- Sufficient headroom for the master volume slider (0-100%)
- Balanced loudness across all presets

## 🌐 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 58+ | ✅ Full support |
| Firefox | 60+ | ✅ Full support |
| Safari | 14.1+ | ✅ Full support |
| Edge | 79+ | ✅ Full support |

**Note**: Web Audio API support is required. Modern browsers (2020+) recommended for best performance.

## ⚡ Performance

- **Development**: Hot Module Replacement (HMR) for instant updates
- **Production**: Minified bundle (~465 KB gzipped)
- **Audio Processing**: Main thread synthesis with Web Audio API
- **Database**: Synchronous sql.js in-browser SQLite
- **Build Time**: ~5 seconds from source to production bundle

## 🐛 Troubleshooting

### Audio Not Working
1. **Check browser permissions**: Some browsers require user interaction to start audio
2. **Click the synthesizer**: Browsers block autoplay; click any control to enable audio
3. **Check console**: Open DevTools (F12) and look for error messages
4. **Verify Web Audio Context**: Should show "running" in console logs

### No Sound After Changing Presets
- Wait 100ms for voice cleanup after preset switch
- Try playing a different note
- Check Master Volume slider is above 0%

### Patches Not Saving
1. Verify localStorage is enabled in your browser
2. Check storage quota: DevTools → Application → LocalStorage
3. Try clearing browser cache and refreshing

### Performance Issues
- Close other browser tabs
- Reduce LFO modulation amounts
- Lower system CPU usage
- Try different waveforms (sine is lightest)

## 📝 Development Guidelines

### Adding Features

**New Parameters**:
1. Add to `SynthesizerParams` interface in `src/synthesizer/ToneSynthesizer.ts`
2. Add to Zustand store in `src/synthesizer/store.ts`
3. Create UI controls in `src/App.tsx`
4. Update `PatchDatabase.ts` schema if storing in patches

**UI Controls**:
- Use existing `Knob` component for rotary controls
- Use HTML `<input type="range">` for sliders
- Follow CSS styling patterns in `App.css`
- Test on mobile devices for touch responsiveness

### Building & Testing

```bash
# Development with hot reload
npm run dev

# Check for TypeScript errors
npm run type-check

# Build production
npm run build

# Preview production build
npm run preview
```

## 📄 License

This project is open source. See LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🎯 Roadmap

- [ ] MIDI input support
- [ ] Arpeggiator with adjustable modes
- [ ] Effects processing (Reverb, Delay, Chorus)
- [ ] Keyboard shortcuts for computer keys
- [ ] Preset morphing/interpolation
- [ ] Audio recording and playback
- [ ] Waveform visualization/spectrum analyzer
- [ ] Touch gesture controls (swipe for parameter adjustment)

## 📞 Support

For issues, questions, or feature requests, please open an issue on GitHub.

## 🎓 Learning Resources

- [Tone.js Documentation](https://tonejs.org/)
- [Web Audio API MDN Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Synthesizer Basics](https://www.soundonsound.com/techniques/synth-basics-synthesis-explained)
- [React Documentation](https://react.dev/)

---

**Happy Synthesizing! 🎹🎵**
