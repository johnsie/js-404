// Database management for storing and loading patches
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

export interface Patch {
  id?: number;
  name: string;
  timestamp?: number;
  params: {
    oscillatorType: OscillatorType;
    volume: number;
    attack: number;
    decay: number;
    sustain: number;
    release: number;
    cutoff: number;
    resonance: number;
    filterType: BiquadFilterType;
    lfoRate: number;
    lfoAmount: number;
    detuneAmount: number;
  };
  sequencerSteps?: string; // JSON string of sequencer pattern
}

export class PatchDatabase {
  private db: Database | null = null;
  private SQL: SqlJsStatic | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });
      
      // Try to load from localStorage first
      const saved = localStorage.getItem('ts404_db');
      if (saved) {
        const buffer = new Uint8Array(JSON.parse(saved));
        this.db = new this.SQL.Database(buffer);
      } else {
        this.db = new this.SQL.Database();
      }

      this.createTables();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      console.warn('Database initialization failed, continuing without patch storage');
      this.isInitialized = true;
    }
  }

  private createTables() {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run(`
      CREATE TABLE IF NOT EXISTS patches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        timestamp INTEGER,
        oscillator_type TEXT,
        volume REAL,
        attack REAL,
        decay REAL,
        sustain REAL,
        release REAL,
        cutoff REAL,
        resonance REAL,
        filter_type TEXT,
        lfo_rate REAL,
        lfo_amount REAL,
        detune_amount REAL,
        sequencer_steps TEXT
      )
    `);
  }

  async savePatch(patch: Patch): Promise<number> {
    if (!this.db) {
      console.warn('Database not initialized, patch not saved');
      return -1;
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO patches (
          name, timestamp, oscillator_type, volume, attack, decay, sustain, release,
          cutoff, resonance, filter_type, lfo_rate, lfo_amount, detune_amount, sequencer_steps
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.bind([
        patch.name,
        Date.now(),
        patch.params.oscillatorType,
        patch.params.volume,
        patch.params.attack,
        patch.params.decay,
        patch.params.sustain,
        patch.params.release,
        patch.params.cutoff,
        patch.params.resonance,
        patch.params.filterType,
        patch.params.lfoRate,
        patch.params.lfoAmount,
        patch.params.detuneAmount,
        patch.sequencerSteps || '[]',
      ]);

      stmt.step();
      stmt.free();
      this.save();

      // Get the last inserted ID
      const result = this.db.exec('SELECT last_insert_rowid() as id');
      return result[0].values[0][0] as number;
    } catch (error) {
      console.error('Failed to save patch:', error);
      return -1;
    }
  }

  async loadPatch(id: number): Promise<Patch | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec(`
      SELECT * FROM patches WHERE id = ?
    `, [id]);

    if (!result || result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const row = result[0].values[0];
    const columns = result[0].columns;

    const patch: Patch = {
      id: row[columns.indexOf('id')] as number,
      name: row[columns.indexOf('name')] as string,
      timestamp: row[columns.indexOf('timestamp')] as number,
      params: {
        oscillatorType: row[columns.indexOf('oscillator_type')] as OscillatorType,
        volume: row[columns.indexOf('volume')] as number,
        attack: row[columns.indexOf('attack')] as number,
        decay: row[columns.indexOf('decay')] as number,
        sustain: row[columns.indexOf('sustain')] as number,
        release: row[columns.indexOf('release')] as number,
        cutoff: row[columns.indexOf('cutoff')] as number,
        resonance: row[columns.indexOf('resonance')] as number,
        filterType: row[columns.indexOf('filter_type')] as BiquadFilterType,
        lfoRate: row[columns.indexOf('lfo_rate')] as number,
        lfoAmount: row[columns.indexOf('lfo_amount')] as number,
        detuneAmount: row[columns.indexOf('detune_amount')] as number,
      },
      sequencerSteps: row[columns.indexOf('sequencer_steps')] as string,
    };

    return patch;
  }

  async loadAllPatches(): Promise<Patch[]> {
    if (!this.db) return [];

    try {
      const result = this.db.exec(`
        SELECT * FROM patches ORDER BY timestamp DESC
      `);

      if (!result || result.length === 0) {
        return [];
      }

      const patches: Patch[] = [];
      const row = result[0];
      const columns = row.columns;

      for (const values of row.values) {
        patches.push({
          id: values[columns.indexOf('id')] as number,
          name: values[columns.indexOf('name')] as string,
          timestamp: values[columns.indexOf('timestamp')] as number,
          params: {
            oscillatorType: values[columns.indexOf('oscillator_type')] as OscillatorType,
            volume: values[columns.indexOf('volume')] as number,
            attack: values[columns.indexOf('attack')] as number,
            decay: values[columns.indexOf('decay')] as number,
            sustain: values[columns.indexOf('sustain')] as number,
            release: values[columns.indexOf('release')] as number,
            cutoff: values[columns.indexOf('cutoff')] as number,
            resonance: values[columns.indexOf('resonance')] as number,
            filterType: values[columns.indexOf('filter_type')] as BiquadFilterType,
            lfoRate: values[columns.indexOf('lfo_rate')] as number,
            lfoAmount: values[columns.indexOf('lfo_amount')] as number,
            detuneAmount: values[columns.indexOf('detune_amount')] as number,
          },
          sequencerSteps: values[columns.indexOf('sequencer_steps')] as string,
        });
      }

      return patches;
    } catch (error) {
      console.error('Failed to load patches:', error);
      return [];
    }
  }

  async deletePatch(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run(`DELETE FROM patches WHERE id = ?`, [id]);
    this.save();
  }

  async updatePatch(patch: Patch): Promise<void> {
    if (!this.db || !patch.id) throw new Error('Database not initialized or invalid patch');

    this.db.run(`
      UPDATE patches SET
        name = ?, oscillator_type = ?, volume = ?, attack = ?, decay = ?,
        sustain = ?, release = ?, cutoff = ?, resonance = ?, filter_type = ?,
        lfo_rate = ?, lfo_amount = ?, detune_amount = ?
      WHERE id = ?
    `, [
      patch.name,
      patch.params.oscillatorType,
      patch.params.volume,
      patch.params.attack,
      patch.params.decay,
      patch.params.sustain,
      patch.params.release,
      patch.params.cutoff,
      patch.params.resonance,
      patch.params.filterType,
      patch.params.lfoRate,
      patch.params.lfoAmount,
      patch.params.detuneAmount,
      patch.id,
    ]);
    this.save();
  }

  private save() {
    if (!this.db) throw new Error('Database not initialized');
    const data = this.db.export();
    const buffer = Array.from(data);
    localStorage.setItem('ts404_db', JSON.stringify(buffer));
  }
}
