import { Injectable } from '@angular/core';
import { JobCard, JobCardListItem } from './job-card.service';

const DB_NAME = 'aerosuite-hangar';
const DB_VERSION = 1;
const STORE_LIST = 'lista';
const STORE_CARDS = 'cards';
const STORE_QUEUE = 'queue';

const LIST_KEY = 'aerosuite.hangar.list';
const CARD_PREFIX = 'aerosuite.hangar.card.';
const QUEUE_KEY = 'aerosuite.hangar.queue';

export interface HangarOfflineExecucaoPayload {
  inicioServico: string;
  fimServico: string;
  obsIniServ: string;
  obsFimServ: string;
}

export interface HangarOfflineApontamentoPayload {
  trabalhoEm: string;
  horas: number;
  descricao?: string;
  ferramentaIdentificador?: string;
}

export interface HangarOfflineFotoPayload {
  fileName: string;
  mimeType: string;
  dataUrl: string;
}

export interface HangarOfflineAssinaturaPayload {
  papel: string;
  assinaturaPngBase64: string;
}

export type HangarOfflineOp =
  | {
      id: string;
      kind: 'execucao';
      osId: number;
      body: HangarOfflineExecucaoPayload;
      queuedAt: string;
    }
  | {
      id: string;
      kind: 'apontamento';
      osId: number;
      body: HangarOfflineApontamentoPayload;
      queuedAt: string;
    }
  | {
      id: string;
      kind: 'foto';
      osId: number;
      body: HangarOfflineFotoPayload;
      queuedAt: string;
    }
  | {
      id: string;
      kind: 'assinatura';
      osId: number;
      body: HangarOfflineAssinaturaPayload;
      queuedAt: string;
    };

@Injectable({ providedIn: 'root' })
export class HangarOfflineCacheService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  isOnline(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  }

  saveLista(itens: JobCardListItem[]): void {
    void this.idbSet(STORE_LIST, 'default', itens ?? []);
    try {
      localStorage.setItem(LIST_KEY, JSON.stringify(itens ?? []));
    } catch {
      /* fallback quota */
    }
  }

  loadLista(): JobCardListItem[] {
    return this.loadListaSyncFallback();
  }

  async loadListaAsync(): Promise<JobCardListItem[]> {
    const fromIdb = await this.idbGet<JobCardListItem[]>(STORE_LIST, 'default');
    if (fromIdb?.length) {
      return fromIdb;
    }
    return this.loadListaSyncFallback();
  }

  saveCard(osId: number, card: JobCard): void {
    void this.idbSet(STORE_CARDS, String(osId), card);
    try {
      localStorage.setItem(CARD_PREFIX + osId, JSON.stringify(card));
    } catch {
      /* ignore */
    }
  }

  loadCard(osId: number): JobCard | null {
    return this.loadCardSyncFallback(osId);
  }

  async loadCardAsync(osId: number): Promise<JobCard | null> {
    const fromIdb = await this.idbGet<JobCard>(STORE_CARDS, String(osId));
    if (fromIdb) {
      return fromIdb;
    }
    return this.loadCardSyncFallback(osId);
  }

  pendingCount(): number {
    return this.loadQueue().length;
  }

  pendingCountForOs(osId: number): number {
    return this.loadQueue().filter(op => op.osId === osId).length;
  }

  enqueue(op: Omit<HangarOfflineOp, 'id' | 'queuedAt'>): void {
    const row: HangarOfflineOp = {
      ...op,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      queuedAt: new Date().toISOString()
    } as HangarOfflineOp;
    const queue = this.loadQueue();
    queue.push(row);
    this.saveQueue(queue);
  }

  loadQueue(): HangarOfflineOp[] {
    return this.loadQueueSyncFallback();
  }

  async loadQueueAsync(): Promise<HangarOfflineOp[]> {
    const fromIdb = await this.idbGet<HangarOfflineOp[]>(STORE_QUEUE, 'default');
    if (fromIdb?.length) {
      return fromIdb;
    }
    return this.loadQueueSyncFallback();
  }

  replaceQueue(queue: HangarOfflineOp[]): void {
    this.saveQueue(queue);
  }

  private saveQueue(queue: HangarOfflineOp[]): void {
    void this.idbSet(STORE_QUEUE, 'default', queue);
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch {
      /* ignore */
    }
  }

  private loadListaSyncFallback(): JobCardListItem[] {
    try {
      const raw = localStorage.getItem(LIST_KEY);
      return raw ? (JSON.parse(raw) as JobCardListItem[]) : [];
    } catch {
      return [];
    }
  }

  private loadCardSyncFallback(osId: number): JobCard | null {
    try {
      const raw = localStorage.getItem(CARD_PREFIX + osId);
      return raw ? (JSON.parse(raw) as JobCard) : null;
    } catch {
      return null;
    }
  }

  private loadQueueSyncFallback(): HangarOfflineOp[] {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      return raw ? (JSON.parse(raw) as HangarOfflineOp[]) : [];
    } catch {
      return [];
    }
  }

  private openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }
    if (typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('IndexedDB unavailable'));
    }
    this.dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_LIST)) {
          db.createObjectStore(STORE_LIST);
        }
        if (!db.objectStoreNames.contains(STORE_CARDS)) {
          db.createObjectStore(STORE_CARDS);
        }
        if (!db.objectStoreNames.contains(STORE_QUEUE)) {
          db.createObjectStore(STORE_QUEUE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
    });
    return this.dbPromise;
  }

  private async idbSet(store: string, key: string, value: unknown): Promise<void> {
    try {
      const db = await this.openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      /* offline / private mode — localStorage fallback already written */
    }
  }

  private async idbGet<T>(store: string, key: string): Promise<T | null> {
    try {
      const db = await this.openDb();
      return await new Promise<T | null>((resolve, reject) => {
        const tx = db.transaction(store, 'readonly');
        const req = tx.objectStore(store).get(key);
        req.onsuccess = () => resolve((req.result as T) ?? null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }
}
