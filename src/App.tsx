import { useEffect, useRef, useState } from 'react';
import './App.css';
import { WebAudioSynthesizer } from './synthesizer/ToneSynthesizer';
import { PatchDatabase, Patch } from './synthesizer/PatchDatabase';
import { useSynthesizerStore, SequencerNote } from './synthesizer/store';
import { Knob } from './components/Knob';
import { Keyboard } from './components/Keyboard';
import { PatchManager } from './components/PatchManager';
import { Sequencer } from './components/Sequencer';

function App() {
  const synthRef = useRef<WebAudioSynthesizer | null>(null);
  const dbRef = useRef<PatchDatabase | null>(null);
  const sequencerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingNoteOffsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    params,
    activeKeys,
    patches,
    currentPatchId,
    displayText,
    sequencerSteps,
    currentStep,
    tempo,
    isSequencerRunning,
    controlMode,
    currentPreset,
    setParams,
    setActiveKey,
    setPatches,
    setCurrentPatchId,
    setDisplayText,
    setSequencerStep,
    setCurrentStep,
    setTempo,
    setIsSequencerRunning,
    setControlMode,
    clearSequencer,
    loadPreset,
    generateRandomSequence,
  } = useSynthesizerStore();

  // Initialize synthesizer and database
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize Web Audio synthesizer
        synthRef.current = new WebAudioSynthesizer();
        synthRef.current.resume();

        // Load bass deep preset at startup
        loadPreset('bassDeep');

        // Generate random sequence on startup
        generateRandomSequence();

        // Try to initialize database
        try {
          dbRef.current = new PatchDatabase();
          await dbRef.current.initialize();

          // Load patches
          const allPatches = await dbRef.current.loadAllPatches();
          setPatches(allPatches);
        } catch (dbError) {
          console.warn('Database initialization failed:', dbError);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Initialization error:', error);
        setDisplayText('Error: Check console');
      }
    };

    init();
  }, [setPatches, setDisplayText, loadPreset, generateRandomSequence]);

  // Update synthesizer parameters when they change
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.updateParams(params as any);
    }
  }, [params]);

  const sequencerStepsRef = useRef<SequencerNote[]>(sequencerSteps);

  // Keep the ref updated with the latest steps
  useEffect(() => {
    sequencerStepsRef.current = sequencerSteps;
  }, [sequencerSteps]);

  // Sequencer playback
  useEffect(() => {
    if (!isSequencerRunning) {
      if (sequencerIntervalRef.current) {
        clearInterval(sequencerIntervalRef.current);
        sequencerIntervalRef.current = null;
      }
      
      // Stop all audio immediately when stopping sequencer
      stopAllAudio();
      
      return;
    }

    const stepDurationMs = (60000 / tempo) / 4; // 16th notes
    let nextStep = currentStep;

    sequencerIntervalRef.current = setInterval(() => {
      nextStep = (nextStep + 1) % 16; // 16 steps
      setCurrentStep(nextStep);
      
      // Trigger notes - use ref to get current steps without causing re-renders
      const note = sequencerStepsRef.current[nextStep];
      // Only play note if enabled and note > 0
      if (note.enabled && note.note > 0 && synthRef.current) {
        // Calculate slide time (0.3s for slide enabled, 0s for immediate)
        const slideTime = note.slide ? 0.3 : 0;
        synthRef.current.noteOn(note.note, note.velocity, slideTime);
        
        // Schedule note off
        const timeoutId = setTimeout(() => {
          if (synthRef.current) {
            synthRef.current.noteOff(note.note);
          }
          pendingNoteOffsRef.current.delete(timeoutId);
        }, stepDurationMs * note.duration * 0.9);
        
        pendingNoteOffsRef.current.add(timeoutId);
      }
    }, stepDurationMs);

    return () => {
      if (sequencerIntervalRef.current) {
        clearInterval(sequencerIntervalRef.current);
        sequencerIntervalRef.current = null;
      }
      // Cancel all pending note-off timeouts when effect cleanup
      pendingNoteOffsRef.current.forEach(timeout => {
        clearTimeout(timeout);
      });
      pendingNoteOffsRef.current.clear();
    };
  }, [isSequencerRunning, tempo, currentStep, setCurrentStep]);

  const handleKeyDown = (midiNote: number) => {
    if (synthRef.current && !activeKeys.has(midiNote)) {
      synthRef.current.noteOn(midiNote);
      setActiveKey(midiNote, true);
    }
  };

  const handleKeyUp = (midiNote: number) => {
    if (synthRef.current && activeKeys.has(midiNote)) {
      synthRef.current.noteOff(midiNote);
      setActiveKey(midiNote, false);
    }
  };

  const stopAllAudio = () => {
    // Cancel all pending note-off timeouts
    pendingNoteOffsRef.current.forEach(timeout => {
      clearTimeout(timeout);
    });
    pendingNoteOffsRef.current.clear();
    
    // Stop all synthesizer voices
    if (synthRef.current) {
      synthRef.current.stopAllNotes();
    }
    
    // Release all active keyboard keys
    activeKeys.forEach(key => {
      if (synthRef.current) {
        synthRef.current.noteOff(key);
      }
      setActiveKey(key, false);
    });
  };

  const handleClearSequencer = () => {
    // Stop all audio from previous sequence
    if (synthRef.current && isSequencerRunning) {
      stopAllAudio();
    }
    
    // Clear the sequencer
    clearSequencer();
  };

  const handlePresetChange = (presetName: string) => {
    // Kill all audio immediately (but keep sequencer running)
    stopAllAudio();
    
    // Load the new preset
    loadPreset(presetName);
    
    // Give the synthesizer a moment to be ready for the next note
    // The sequencer will trigger the next note on its interval
  };

  const handleRandomizeSequencer = () => {
    // Stop all audio from previous sequence
    if (synthRef.current && isSequencerRunning) {
      stopAllAudio();
    }
    
    // Generate random sequence
    generateRandomSequence();
  };

  const handleSavePatch = async () => {
    if (!dbRef.current) return;

    const patchName = `Patch ${new Date().toLocaleTimeString()}`;
    const newPatch: Patch = {
      name: patchName,
      params,
      sequencerSteps: JSON.stringify(sequencerSteps),
    };

    try {
      const id = await dbRef.current.savePatch(newPatch);
      const allPatches = await dbRef.current.loadAllPatches();
      setPatches(allPatches);
      setCurrentPatchId(id);
      setDisplayText(`Saved: ${patchName}`);
    } catch (error) {
      console.error('Failed to save patch:', error);
      setDisplayText('Save failed');
    }
  };

  const handleLoadPatch = async (id: number) => {
    if (!dbRef.current) return;

    try {
      const patch = await dbRef.current.loadPatch(id);
      if (patch) {
        setParams(patch.params);
        if (patch.sequencerSteps) {
          const steps = JSON.parse(patch.sequencerSteps);
          steps.forEach((step: SequencerNote, idx: number) => {
            setSequencerStep(idx, step);
          });
        }
        setCurrentPatchId(id);
        setDisplayText(`Loaded: ${patch.name}`);
      }
    } catch (error) {
      console.error('Failed to load patch:', error);
      setDisplayText('Load failed');
    }
  };

  const handleDeletePatch = async (id: number) => {
    if (!dbRef.current) return;

    try {
      await dbRef.current.deletePatch(id);
      const allPatches = await dbRef.current.loadAllPatches();
      setPatches(allPatches);
      if (currentPatchId === id) {
        setCurrentPatchId(null);
      }
      setDisplayText('Patch deleted');
    } catch (error) {
      console.error('Failed to delete patch:', error);
      setDisplayText('Delete failed');
    }
  };

  if (!isInitialized) {
    return <div className="synth-container"><div className="synth-body">Initializing...</div></div>;
  }

  return (
    <div className="synth-container">
      <div className="synth-body">
        <div className="control-mode-toggle" style={{ marginBottom: '30px' }}>
          <button
            className={`toggle-btn ${controlMode === 'sliders' ? 'active' : ''}`}
            onClick={() => setControlMode('sliders')}
          >
            Sliders
          </button>
          <button
            className={`toggle-btn ${controlMode === 'knobs' ? 'active' : ''}`}
            onClick={() => setControlMode('knobs')}
          >
            Knobs
          </button>
        </div>

        {/* Display */}
        <div className="display">{displayText}</div>

        {/* Preset Selector */}
        <div className="synth-section" style={{ marginBottom: '20px' }}>
          <div className="section-title">Preset</div>
          <select
            value={currentPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              backgroundColor: '#1a2332',
              color: '#00d9ff',
              border: '2px solid #00d9ff',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            <option value="acidTechno">Acid Techno</option>
            <option value="padAmbient">Pad/Ambient</option>
            <option value="leadBright">Lead/Bright</option>
            <option value="bassDeep">Bass/Deep</option>
            <option value="pluckStaccato">Pluck/Staccato</option>
            <option value="experimental">Experimental</option>
          </select>
        </div>

        {/* SLIDERS VIEW */}
        {controlMode === 'sliders' && (
          <div>
            {/* VCO Sliders */}
            <div className="synth-section">
              <div className="section-title">VCO</div>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '11px', color: '#00d9ff', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Wave Shape</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {(['sine', 'triangle', 'sawtooth', 'square'] as const).map((type) => (
                    <button
                      key={type}
                      className={`synth-button ${params.oscillatorType === type ? 'active' : ''}`}
                      onClick={() => setParams({ oscillatorType: type })}
                      style={{ textTransform: 'capitalize', fontSize: '11px' }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00d9ff', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>Detune</span>
                  <span>{params.detuneAmount.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={params.detuneAmount}
                  onChange={(e) => setParams({ detuneAmount: Number(e.target.value) })}
                  className="master-volume-slider"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00d9ff', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>Level</span>
                  <span>{(params.volume * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={params.volume}
                  onChange={(e) => setParams({ volume: Number(e.target.value) })}
                  className="master-volume-slider"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Filter Sliders */}
            <div className="synth-section">
              <div className="section-title">Filter</div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00d9ff', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>Cutoff</span>
                  <span>{params.cutoff.toFixed(0)} Hz</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="20000"
                  step="10"
                  value={params.cutoff}
                  onChange={(e) => setParams({ cutoff: Number(e.target.value) })}
                  className="master-volume-slider"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00d9ff', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>Resonance</span>
                  <span>{params.resonance.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="30"
                  step="0.1"
                  value={params.resonance}
                  onChange={(e) => setParams({ resonance: Number(e.target.value) })}
                  className="master-volume-slider"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#00d9ff', fontWeight: 'bold', marginBottom: '4px' }}>Filter Type</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {(['lowpass', 'highpass', 'bandpass', 'notch'] as const).map((type) => (
                    <button
                      key={type}
                      className={`synth-button ${params.filterType === type ? 'active' : ''}`}
                      onClick={() => setParams({ filterType: type })}
                      style={{ textTransform: 'capitalize', fontSize: '10px' }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Envelope Sliders */}
            <div className="synth-section">
              <div className="section-title">Envelope</div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00d9ff', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>Attack</span>
                  <span>{(params.attack * 1000).toFixed(1)}ms</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="1"
                  step="0.001"
                  value={params.attack}
                  onChange={(e) => setParams({ attack: Number(e.target.value) })}
                  className="master-volume-slider"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00d9ff', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>Decay</span>
                  <span>{(params.decay * 1000).toFixed(1)}ms</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="1"
                  step="0.01"
                  value={params.decay}
                  onChange={(e) => setParams({ decay: Number(e.target.value) })}
                  className="master-volume-slider"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00d9ff', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>Sustain</span>
                  <span>{(params.sustain * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={params.sustain}
                  onChange={(e) => setParams({ sustain: Number(e.target.value) })}
                  className="master-volume-slider"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00d9ff', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>Release</span>
                  <span>{(params.release * 1000).toFixed(1)}ms</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="2"
                  step="0.01"
                  value={params.release}
                  onChange={(e) => setParams({ release: Number(e.target.value) })}
                  className="master-volume-slider"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* LFO Sliders */}
            <div className="synth-section">
              <div className="section-title">LFO</div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00d9ff', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>Rate</span>
                  <span>{params.lfoRate.toFixed(2)} Hz</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="50"
                  step="0.1"
                  value={params.lfoRate}
                  onChange={(e) => setParams({ lfoRate: Number(e.target.value) })}
                  className="master-volume-slider"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00d9ff', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>Amount (Modulation)</span>
                  <span>{(params.lfoAmount * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={params.lfoAmount}
                  onChange={(e) => setParams({ lfoAmount: Number(e.target.value) })}
                  className="master-volume-slider"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Ring Modulation Sliders */}
            <div className="synth-section">
              <div className="section-title">Ring Mod</div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00d9ff', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>Amount</span>
                  <span>{(params.ringModAmount * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={params.ringModAmount}
                  onChange={(e) => setParams({ ringModAmount: Number(e.target.value) })}
                  className="master-volume-slider"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Wetness (Reverb/Effect) Slider */}
            <div className="synth-section">
              <div className="section-title">Wetness</div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00d9ff', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>Effect Depth</span>
                  <span>{(params.wetness * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={params.wetness}
                  onChange={(e) => setParams({ wetness: Number(e.target.value) })}
                  className="master-volume-slider"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Coarseness (Waveform Harshness) Slider */}
            <div className="synth-section">
              <div className="section-title">Coarseness</div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00d9ff', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>Waveform Harshness</span>
                  <span>{(params.coarseness * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={params.coarseness}
                  onChange={(e) => setParams({ coarseness: Number(e.target.value) })}
                  className="master-volume-slider"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* KNOBS VIEW */}
        {controlMode === 'knobs' && (
          <div>
        <div className="synth-section">
          <div className="section-title">VCO</div>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '11px', color: '#00d9ff', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Wave Shape</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {(['sine', 'triangle', 'sawtooth', 'square'] as const).map((type) => (
                <button
                  key={type}
                  className={`synth-button ${params.oscillatorType === type ? 'active' : ''}`}
                  onClick={() => setParams({ oscillatorType: type })}
                  style={{ textTransform: 'capitalize', fontSize: '11px' }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="knobs-grid">
            <Knob
              label="Detune"
              value={params.detuneAmount}
              min={-100}
              max={100}
              onChange={(v) => setParams({ detuneAmount: v })}
            />
            <Knob
              label="Level"
              value={params.volume * 100}
              min={0}
              max={100}
              onChange={(v) => setParams({ volume: v / 100 })}
            />
          </div>
        </div>

        {/* Filter Section */}
        <div className="synth-section">
          <div className="section-title">Filter</div>
          <div className="knobs-grid">
            <Knob
              label="Cutoff"
              value={params.cutoff}
              min={20}
              max={20000}
              onChange={(v) => setParams({ cutoff: v })}
            />
            <Knob
              label="Resonance"
              value={params.resonance}
              min={0.1}
              max={30}
              onChange={(v) => setParams({ resonance: v })}
            />
            <Knob
              label="Type"
              value={params.filterType === 'lowpass' ? 0 : params.filterType === 'highpass' ? 1 : params.filterType === 'bandpass' ? 2 : 3}
              min={0}
              max={3}
              onChange={(v) => {
                const types: BiquadFilterType[] = ['lowpass', 'highpass', 'bandpass', 'notch'];
                setParams({ filterType: types[Math.round(v)] });
              }}
            />
          </div>
        </div>

        {/* Envelope Section */}
        <div className="synth-section">
          <div className="section-title">Envelope</div>
          <div className="knobs-grid">
            <Knob
              label="Attack"
              value={params.attack * 1000}
              min={1}
              max={1000}
              onChange={(v) => setParams({ attack: v / 1000 })}
            />
            <Knob
              label="Decay"
              value={params.decay * 1000}
              min={1}
              max={1000}
              onChange={(v) => setParams({ decay: v / 1000 })}
            />
            <Knob
              label="Sustain"
              value={params.sustain * 100}
              min={0}
              max={100}
              onChange={(v) => setParams({ sustain: v / 100 })}
            />
            <Knob
              label="Release"
              value={params.release * 1000}
              min={1}
              max={2000}
              onChange={(v) => setParams({ release: v / 1000 })}
            />
          </div>
        </div>

        {/* LFO Section */}
        <div className="synth-section">
          <div className="section-title">LFO</div>
          <div className="knobs-grid">
            <Knob
              label="Rate"
              value={params.lfoRate}
              min={0.1}
              max={50}
              onChange={(v) => setParams({ lfoRate: v })}
            />
            <Knob
              label="Amount"
              value={params.lfoAmount * 100}
              min={0}
              max={100}
              onChange={(v) => setParams({ lfoAmount: v / 100 })}
            />
          </div>
        </div>

        {/* Ring Modulation Section */}
        <div className="synth-section">
          <div className="section-title">Ring Mod</div>
          <div className="knobs-grid">
            <Knob
              label="Amount"
              value={params.ringModAmount * 100}
              min={0}
              max={100}
              onChange={(v) => setParams({ ringModAmount: v / 100 })}
            />
          </div>
        </div>
          </div>
        )}

        {/* Keyboard (always visible) */}
        <Keyboard onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} activeKeys={activeKeys} />

        {/* Master Volume Section (always visible) */}
        <div className="master-volume-section">
          <label className="master-volume-label">Master Volume</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="range"
              min="0"
              max="100"
              value={params.volume * 100}
              onChange={(e) => {
                const newVolume = Number(e.target.value) / 100;
                setParams({ volume: newVolume });
                if (synthRef.current) {
                  synthRef.current.setMasterVolume(newVolume);
                }
              }}
              className="master-volume-slider"
            />
            <span className="master-volume-value">{Math.round(params.volume * 100)}%</span>
          </div>
        </div>

        {/* Sequencer */}
        <Sequencer
          steps={sequencerSteps}
          currentStep={currentStep}
          tempo={tempo}
          isRunning={isSequencerRunning}
          onStepChange={setSequencerStep}
          onTempoChange={setTempo}
          onTogglePlay={() => setIsSequencerRunning(!isSequencerRunning)}
          onClear={handleClearSequencer}
          onRandom={handleRandomizeSequencer}
        />

        {/* Patch Manager */}
        <PatchManager
          patches={patches}
          currentPatchId={currentPatchId}
          onLoadPatch={handleLoadPatch}
          onDeletePatch={handleDeletePatch}
          onSavePatch={handleSavePatch}
        />
      </div>
    </div>
  );
}

export default App;
