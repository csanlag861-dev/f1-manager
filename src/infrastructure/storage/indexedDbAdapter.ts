import { openDB, IDBPDatabase } from 'idb';
import { GameState } from '../../domain/models';

const DB_NAME = 'f1manager_db';
const DB_VERSION = 1;
const STORE_NAME = 'game_saves';
const ACTIVE_SAVE_KEY = 'active_game';

export interface StorageAdapter {
  saveGameState(state: GameState): Promise<void>;
  loadGameState(): Promise<GameState | null>;
  clearGameState(): Promise<void>;
}

class IndexedDbAdapter implements StorageAdapter {
  private dbPromise: Promise<IDBPDatabase> | null = null;

  private isAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  private async getDB(): Promise<IDBPDatabase | null> {
    if (!this.isAvailable()) return null;

    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        },
      });
    }
    return this.dbPromise;
  }

  async saveGameState(state: GameState): Promise<void> {
    const db = await this.getDB();
    if (!db) {
      // In SSR or environments without indexedDB, no-op or fallback
      return;
    }
    const stateToSave: GameState = {
      ...state,
      updatedAt: new Date().toISOString(),
    };
    await db.put(STORE_NAME, stateToSave, ACTIVE_SAVE_KEY);
  }

  async loadGameState(): Promise<GameState | null> {
    const db = await this.getDB();
    if (!db) return null;

    const data = await db.get(STORE_NAME, ACTIVE_SAVE_KEY);
    return data ?? null;
  }

  async clearGameState(): Promise<void> {
    const db = await this.getDB();
    if (!db) return;

    await db.delete(STORE_NAME, ACTIVE_SAVE_KEY);
  }
}

export const storageAdapter = new IndexedDbAdapter();
