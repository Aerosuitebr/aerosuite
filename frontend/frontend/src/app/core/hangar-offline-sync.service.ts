import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HangarOfflineCacheService, HangarOfflineOp } from './hangar-offline-cache.service';
import { JobCardService } from './job-card.service';
import { OSFileService } from './os-file.service';

export interface HangarOfflineFlushResult {
  ok: number;
  fail: number;
}

@Injectable({ providedIn: 'root' })
export class HangarOfflineSyncService {
  private cache = inject(HangarOfflineCacheService);
  private jobCard = inject(JobCardService);
  private osFiles = inject(OSFileService);
  private flushing = false;

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }
    window.addEventListener('online', () => {
      void this.flush();
    });
    queueMicrotask(() => {
      if (this.cache.isOnline() && this.cache.pendingCount() > 0) {
        void this.flush();
      }
    });
  }

  async flush(): Promise<HangarOfflineFlushResult> {
    if (this.flushing || !this.cache.isOnline()) {
      return { ok: 0, fail: 0 };
    }
    const queue = this.cache.loadQueue();
    if (!queue.length) {
      return { ok: 0, fail: 0 };
    }
    this.flushing = true;
    let ok = 0;
    let fail = 0;
    const failed: HangarOfflineOp[] = [];
    try {
      for (const op of queue) {
        try {
          await this.processOp(op);
          ok++;
        } catch {
          fail++;
          failed.push(op);
        }
      }
      this.cache.replaceQueue(failed);
      return { ok, fail };
    } finally {
      this.flushing = false;
    }
  }

  private async processOp(op: HangarOfflineOp): Promise<void> {
    switch (op.kind) {
      case 'execucao':
        await firstValueFrom(this.jobCard.atualizarExecucao(op.osId, op.body));
        break;
      case 'apontamento':
        await firstValueFrom(this.jobCard.registrarApontamento(op.osId, op.body));
        break;
      case 'foto': {
        const blob = this.dataUrlToBlob(op.body.dataUrl);
        const file = new File([blob], op.body.fileName, { type: op.body.mimeType });
        await firstValueFrom(this.osFiles.uploadFiles(op.osId, [file]));
        break;
      }
      case 'assinatura':
        await firstValueFrom(this.jobCard.salvarAssinatura(op.osId, op.body));
        break;
    }
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const [meta, data] = dataUrl.split(',');
    const mime = /:(.*?);/.exec(meta)?.[1] ?? 'image/png';
    const binary = atob(data);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      arr[i] = binary.charCodeAt(i);
    }
    return new Blob([arr], { type: mime });
  }
}
