import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { NrcDashboard, NrcService } from '../core/nrc.service';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { nrcErrorText } from './nrc-access';

@Component({
  selector: 'app-nrc-dashboard',
  standalone: true,
  imports: [TranslatePipe, DecimalPipe, FormsModule],
  templateUrl: './nrc-dashboard.component.html',
  styleUrl: './nrc.scss'
})
export class NrcDashboardComponent implements OnInit {
  private nrc = inject(NrcService);
  private router = inject(Router);
  private i18n = inject(TranslationService);
  private destroyRef = inject(DestroyRef);
  private request?: Subscription;

  data?: NrcDashboard;
  error = '';
  loading = true;
  period = '6';
  dataInicio = '';
  dataFim = '';
  readonly steps = [
    { key: 'CONTENCAO', field: 'etapaContencao', icon: 'pi-shield' },
    { key: 'CAUSA', field: 'etapaCausa', icon: 'pi-search' },
    { key: 'ACOES', field: 'etapaAcoes', icon: 'pi-check-square' },
    { key: 'EFICACIA', field: 'etapaEficacia', icon: 'pi-verified' }
  ] as const;

  ngOnInit(): void {
    this.changePeriod();
  }

  private dateString(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  changePeriod(): void {
    if (this.period === 'custom') return;
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - Number(this.period) + 1, 1);
    this.dataInicio = this.dateString(start);
    this.dataFim = this.dateString(end);
    this.load();
  }

  get validRange(): boolean {
    return !!this.dataInicio && !!this.dataFim && this.dataInicio <= this.dataFim;
  }

  datesChanged(): void {
    this.period = 'custom';
    this.load();
  }

  load(): void {
    if (!this.validRange) return;
    this.request?.unsubscribe();
    this.loading = true;
    this.error = '';
    this.request = this.nrc.dashboard({ dataInicio: this.dataInicio, dataFim: this.dataFim }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = nrcErrorText(err, (key) => this.i18n.translate(key));
      }
    });
  }

  open(query: Record<string, string>): void {
    this.router.navigate(['/nrc'], { queryParams: { dataInicio: this.dataInicio, dataFim: this.dataFim, ...query } });
  }

  get empty(): boolean {
    return !!this.data && !this.data.total && !this.data.encerradasMes && !this.hasTrend;
  }

  get hasTrend(): boolean {
    return !!this.data?.tendenciaMensal?.some(point => point.abertas > 0 || point.encerradas > 0);
  }

  get trendMax(): number {
    return Math.max(1, ...(this.data?.tendenciaMensal || []).flatMap(point => [point.abertas, point.encerradas]));
  }

  maxCount(items?: { total: number }[]): number {
    return Math.max(1, ...(items || []).map((item) => item.total));
  }

  label(group: string, value?: string): string {
    if (!value) return '—';
    const key = `nrc.${group}.${value}`;
    const text = this.i18n.translate(key);
    return text === key ? value : text;
  }
}
