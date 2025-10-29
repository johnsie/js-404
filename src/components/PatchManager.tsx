import React from 'react';
import { Patch } from '../synthesizer/PatchDatabase';

interface PatchManagerProps {
  patches: Patch[];
  currentPatchId: number | null;
  onLoadPatch: (id: number) => void;
  onDeletePatch: (id: number) => void;
  onSavePatch: () => void;
}

export const PatchManager: React.FC<PatchManagerProps> = ({
  patches,
  currentPatchId,
  onLoadPatch,
  onDeletePatch,
  onSavePatch,
}) => {
  return (
    <div className="save-load-section">
      <div className="section-title">Patches</div>
      <button className="synth-button" onClick={onSavePatch}>
        Save Patch
      </button>
      {patches.length > 0 && (
        <div className="patch-list">
          {patches.map((patch) => (
            <div
              key={patch.id}
              className={`patch-item ${currentPatchId === patch.id ? 'active' : ''}`}
              style={{
                background: currentPatchId === patch.id ? '#ff6b35' : '#2a2a2a',
                color: currentPatchId === patch.id ? '#000' : '#fff',
              }}
            >
              <span>{patch.name}</span>
              <div>
                <button
                  onClick={() => onLoadPatch(patch.id!)}
                  style={{ marginRight: '5px' }}
                >
                  Load
                </button>
                <button onClick={() => onDeletePatch(patch.id!)}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
