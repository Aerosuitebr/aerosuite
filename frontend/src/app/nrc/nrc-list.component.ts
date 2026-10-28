import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NrcService, NrcSummary, NRC_SEVERIDADES, NRC_STATUS } from '../core/nrc.service';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { hasNrc, nrcErrorText } from './nrc-access';
import { daysUntilPrazo } from './nrc-journey.util';

@Component({
  selector: 'app-nrc-list',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './nrc-list.component.html',
  styleUrl: './nrc.scss'
})
export class NrcListComponent implements OnInit {
  private nrc = inject(NrcService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private i18n = inject(TranslationService);
  private destroyRef = inject(DestroyRef);
  private searchChanges = new Subject<void>();
  private request?: Subscription;

  items: NrcSummary[] = [];
  total = 0;
  page = 0;
  size = 12;
  loading = false;
  error = '';
  q = '';
  status = '';
  presetStatus = '';
  severidade = '';
  osId?: number;
  vencidas = false;
  etapa = '';
  dataInicio = '';
  dataFim = '';
  emTratamento = false;
  readonly statuses = NRC_STATUS;
  readonly severities = NRC_SEVERIDADES;

  ngOnInit(): void {
    this.searchChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.apply());
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.osId = params.get('osId') ? Number(params.get('osId')) : undefined;
      this.presetStatus = (this.route.snapshot.data['nrcStatus'] as string) || '';
      this.status = params.get('status') ?? this.presetStatus;
      this.severidade = params.get('severidade') || '';
      this.vencidas = params.get('vencidas') === 'true';
      this.etapa = params.get('etapaAtual') || '';
      this.q = params.get('q') || '';
      this.dataInicio = params.get('dataInicio') || '';
      this.dataFim = params.get('dataFim') || '';
      this.emTratamento = params.get('emTratamento') === 'true';
      this.page = 0;
      this.load();
    });
  }

  get canOpen(): boolean {
    return hasNrc(this.auth.getCurrentUser(), 'NRC_ABRIR');
  }

  load(): void {
    this.request?.unsubscribe();
    this.loading = true;
    this.error = '';
    this.request = this.nrc.search({
      page: this.page,
      size: this.size,
      q: this.q,
      dataInicio: this.dataInicio || undefined,
      dataFim: this.dataFim || undefined,
      emTratamento: this.emTratamento || undefined,
      status: this.status,
      severidade: this.severidade,
      osId: this.osId,
      vencidas: this.vencidas || undefined,
      etapaAtual: this.etapa || undefined,
      sort: 'dataDeteccao,desc'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => {
        this.items = page.items || [];
        this.total = page.totalElements || 0;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = nrcErrorText(err, (key) => this.i18n.translate(key));
      }
    });
  }

  apply(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.q || null,
        status: this.status === this.presetStatus ? null : this.status,
        severidade: this.severidade || null,
        osId: this.osId || null,
        vencidas: this.vencidas ? 'true' : null,
        etapaAtual: this.etapa || null,
        dataInicio: this.dataInicio || null,
        dataFim: this.dataFim || null,
        emTratamento: this.emTratamento ? 'true' : null
      }
    });
  }

  searchChanged(): void {
    this.searchChanges.next();
  }

  get hasFilters(): boolean {
    return !!(this.q || this.severidade || this.osId || this.vencidas || this.etapa || this.dataInicio || this.dataFim || this.emTratamento || this.status !== this.presetStatus);
  }

  clearFilters(): void {
    this.q = '';
    this.status = this.presetStatus;
    this.severidade = '';
    this.osId = undefined;
    this.vencidas = false;
    this.etapa = '';
    this.dataInicio = '';
    this.dataFim = '';
    this.emTratamento = false;
    this.apply();
  }

  clearOs(): void {
    this.osId = undefined;
    this.apply();
  }

  chip(value?: string): string {
    return (value || '').toLowerCase();
  }

  days(item: NrcSummary): number | null {
    return daysUntilPrazo(item.prazoTratamento);
  }

  label(group: string, value?: string): string {
    if (!value) return '—';
    const key = `nrc.${group}.${value}`;
    const text = this.i18n.translate(key);
    return text === key ? value : text;
  }

  prev(): void {
    if (this.page === 0) return;
    this.page -= 1;
    this.load();
  }

  next(): void {
    if ((this.page + 1) * this.size >= this.total) return;
    this.page += 1;
    this.load();
  }

}
