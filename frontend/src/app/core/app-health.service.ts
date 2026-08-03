import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

export type AppHealthState = 'checking' | 'online' | 'degraded';
export type HealthComponentStatus = 'UP' | 'DOWN' | 'UNKNOWN';
export type HealthFailureReason = 'none' | 'network' | 'database' | 'server';

export interface HealthComponents {
  api: HealthComponentStatus;
  database: HealthComponentStatus;
}

export interface AppHealthSnapshot {
  state: AppHealthState;
  checkedAt: Date | null;
  components: HealthComponents;
  failureReason: HealthFailureReason;
  httpStatus?: number;
}

export interface HealthServiceRow {
  id: string;
  labelKey: string;
  categoryKey: string;
  impactKey: string;
  status: HealthComponentStatus;
}

export interface HealthSummary {
  total: number;
  operational: number;
  problematic: number;
  unverified: number;
  rows: HealthServiceRow[];
  problematicRows: HealthServiceRow[];
}

interface PublicHealthPayload {
  ok?: boolean;
  database?: string;
  checkedAt?: string;
  components?: { api?: string; database?: string };
}

const HEALTH_SERVICE_CATALOG: ReadonlyArray<{
  id: string;
  labelKey: string;
  categoryKey: string;
  impactKey: string;
}> = [
  {
    id: 'api',
    labelKey: 'footer.health.service.api',
    categoryKey: 'footer.health.category.infrastructure',
    impactKey: 'footer.health.impact.row.api',
  },
  {
    id: 'database',
    labelKey: 'footer.health.service.database',
    categoryKey: 'footer.health.category.infrastructure',
    impactKey: 'footer.health.impact.row.database',
  },
  {
    id: 'auth',
    labelKey: 'footer.health.service.auth',
    categoryKey: 'footer.health.category.platform',
    impactKey: 'footer.health.impact.row.auth',
  },
  {
    id: 'mro',
    labelKey: 'footer.health.service.mro',
    categoryKey: 'footer.health.category.operations',
    impactKey: 'footer.health.impact.row.mro',
  },
  {
    id: 'estoque',
    labelKey: 'footer.health.service.estoque',
    categoryKey: 'footer.health.category.operations',
    impactKey: 'footer.health.impact.row.estoque',
  },
  {
    id: 'comercial',
    labelKey: 'footer.health.service.comercial',
    categoryKey: 'footer.health.category.operations',
    impactKey: 'footer.health.impact.row.comercial',
  },
  {
    id: 'integrations',
    labelKey: 'footer.health.service.integrations',
    categoryKey: 'footer.health.category.platform',
    impactKey: 'footer.health.impact.row.integrations',
  },
];

@Injectable({ providedIn: 'root' })
export class AppHealthService {
  private readonly healthTimeoutMs = 12_000;

  readonly state = signal<AppHealthState>('checking');
  readonly snapshot = signal<AppHealthSnapshot>({
    state: 'checking',
    checkedAt: null,
    components: { api: 'UNKNOWN', database: 'UNKNOWN' },
    failureReason: 'none',
  });

  buildSummary(snapshot: AppHealthSnapshot): HealthSummary {
    const rows = this.buildServiceRows(snapshot);
    const operational = rows.filter((r) => r.status === 'UP').length;
    const problematic = rows.filter((r) => r.status === 'DOWN').length;
    const unverified = rows.filter((r) => r.status === 'UNKNOWN').length;
    return {
      total: rows.length,
      operational,
      problematic,
      unverified,
      rows,
      problematicRows: rows.filter((r) => r.status === 'DOWN'),
    };
  }

  buildServiceRows(snapshot: AppHealthSnapshot): HealthServiceRow[] {
    const c = snapshot?.components;
    if (!c) {
      return [];
    }
    const derived = this.deriveStatus(c.api, c.database);
    const dataStatus = c.database === 'DOWN' ? 'DOWN' : derived;

    const statusById: Record<string, HealthComponentStatus> = {
      api: c.api,
      database: c.database,
      auth: derived,
      mro: dataStatus,
      estoque: dataStatus,
      comercial: dataStatus,
      integrations: c.api === 'DOWN' ? 'DOWN' : derived,
    };

    return HEALTH_SERVICE_CATALOG.map((def) => ({
      id: def.id,
      labelKey: def.labelKey,
      categoryKey: def.categoryKey,
      impactKey: def.impactKey,
      status: statusById[def.id] ?? 'UNKNOWN',
    }));
  }

  statusLabelKey(row: HealthServiceRow, snapshot: AppHealthSnapshot): string {
    if (row.status === 'UP') return 'footer.health.status.up';
    if (row.status === 'DOWN') return 'footer.health.status.down';
    if (row.id === 'database' && snapshot?.components?.api === 'DOWN') {
      return 'footer.health.status.unverified';
    }
    return 'footer.health.status.unknown';
  }

  async refresh(): Promise<AppHealthSnapshot> {
    const apiRoot = environment.getApiUrl?.() ?? environment.apiUrl;
    const url = this.resolveHealthUrl(apiRoot);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.healthTimeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      const body = await this.parseResponseBody(response);
      if (body && this.isHealthPayload(body)) {
        const next = this.fromHealthPayload(body, response.status);
        this.applySnapshot(next);
        return next;
      }

      if (response.status === 401 || response.status === 403 || response.status === 404) {
        const next = this.assumeApiReachable(response.status);
        this.applySnapshot(next);
        return next;
      }

      if (response.status === 0) {
        const next = this.networkFailure(0);
        this.applySnapshot(next);
        return next;
      }

      if (response.status >= 500) {
        const next = this.serverFailure(response.status);
        this.applySnapshot(next);
        return next;
      }

      const next = this.networkFailure(response.status);
      this.applySnapshot(next);
      return next;
    } catch {
      const next = this.networkFailure(0);
      this.applySnapshot(next);
      return next;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private resolveHealthUrl(apiRoot: string): string {
    const base = apiRoot.replace(/\/$/, '');
    return `${base}/public/health`;
  }

  private async parseResponseBody(response: Response): Promise<PublicHealthPayload | null> {
    try {
      const text = await response.text();
      if (!text.trim()) {
        return null;
      }
      return JSON.parse(text) as PublicHealthPayload;
    } catch {
      return null;
    }
  }

  private isHealthPayload(data: PublicHealthPayload | null): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }
    return 'ok' in data || 'database' in data || data.components != null;
  }

  private fromHealthPayload(data: PublicHealthPayload, httpStatus: number): AppHealthSnapshot {
    const dbRaw = data.components?.database ?? data.database;
    const dbUp = dbRaw === 'UP' || data.ok === true;
    return {
      state: dbUp ? 'online' : 'degraded',
      checkedAt: this.parseCheckedAt(data.checkedAt),
      components: {
        api: 'UP',
        database: dbUp ? 'UP' : 'DOWN',
      },
      failureReason: dbUp ? 'none' : 'database',
      httpStatus,
    };
  }

  private assumeApiReachable(httpStatus: number): AppHealthSnapshot {
    // Servidor respondeu (ex.: 401 no probe público) — app autenticada segue operando.
    return {
      state: 'online',
      checkedAt: new Date(),
      components: { api: 'UP', database: 'UP' },
      failureReason: 'none',
      httpStatus,
    };
  }

  private networkFailure(httpStatus: number): AppHealthSnapshot {
    return {
      state: 'degraded',
      checkedAt: new Date(),
      components: { api: 'DOWN', database: 'UNKNOWN' },
      failureReason: 'network',
      httpStatus,
    };
  }

  private serverFailure(httpStatus: number): AppHealthSnapshot {
    return {
      state: 'degraded',
      checkedAt: new Date(),
      components: { api: 'DOWN', database: 'UNKNOWN' },
      failureReason: 'server',
      httpStatus,
    };
  }

  private applySnapshot(next: AppHealthSnapshot): void {
    this.state.set(next.state);
    this.snapshot.set(next);
  }

  private parseCheckedAt(value?: string): Date {
    if (!value) {
      return new Date();
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private deriveStatus(api: HealthComponentStatus, database: HealthComponentStatus): HealthComponentStatus {
    if (api === 'DOWN' || database === 'DOWN') return 'DOWN';
    if (api === 'UP') return 'UP';
    return 'UNKNOWN';
  }
}
