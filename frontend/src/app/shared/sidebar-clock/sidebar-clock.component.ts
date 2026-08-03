import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { TranslationService } from '../../core/translation.service';

/** Relógio isolado (OnPush) — não força change detection no layout inteiro. */
@Component({
  selector: 'app-sidebar-clock',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sidebar-clock" *ngIf="!compact">
      <time class="sidebar-clock__time" [attr.datetime]="timeIso">{{ time }}</time>
      <time class="sidebar-clock__date" [attr.datetime]="dateIso">{{ date }}</time>
    </div>
    <div
      class="sidebar-clock sidebar-clock--compact"
      *ngIf="compact"
      [pTooltip]="time + ' — ' + date"
      tooltipPosition="right">
      <i class="pi pi-clock" aria-hidden="true"></i>
    </div>
  `,
  styleUrls: ['./sidebar-clock.component.scss']
})
export class SidebarClockComponent implements OnInit, OnDestroy {
  @Input() compact = false;

  time = '';
  date = '';
  timeIso = '';
  dateIso = '';

  private readonly i18n = inject(TranslationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
    this.i18n
      .getCurrentLanguage$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.tick());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private tick(): void {
    const now = new Date();
    const locale = this.i18n.getCurrentLanguage() || 'pt-BR';

    this.time = now.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    this.timeIso = now.toISOString();

    this.date = now.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    this.dateIso = `${y}-${m}-${d}`;

    this.cdr.markForCheck();
  }
}
