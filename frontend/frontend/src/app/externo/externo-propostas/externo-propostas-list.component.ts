import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { UsuarioExternoService, PropostaExternaResumo } from '../../core/usuario-externo.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { LocaleDateTimePipe } from '../../core/locale/locale-datetime.pipe';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';

@Component({
  standalone: true,
  selector: 'app-externo-propostas-list',
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TagModule,
    TranslatePipe,
    LocaleDateTimePipe,
    PageHeroComponent,
    ListDataStatesComponent
  ],
  template: `
    <div class="as-page propostas-container">
      <app-page-hero
        variant="slate"
        titleKey="externo.propostas.title"
        subtitleKey="externo.propostas.subtitle"
        titleIcon="pi-file" />

      <app-list-data-states
        [loading]="loading"
        [itemCount]="propostas.length"
        [skeletonRows]="5"
        [skeletonCols]="3"
        emptyTitleKey="externo.propostas.empty.title"
        emptyDescriptionKey="externo.propostas.empty.subtitle">
        <div class="proposta-cards">
          <div class="proposta-card" *ngFor="let p of propostas" (click)="open(p)">
            <div class="card-header">
              <span class="numero">{{ p.numeroProposta }}</span>
              <p-tag [value]="statusLabel(p.status)" [severity]="statusSeverity(p.status)"></p-tag>
            </div>
            <p class="produto">{{ p.produtoNome || '—' }}</p>
            <div class="meta">
              <span>{{ 'externo.propostas.col.date' | translate }}: {{ p.dataProposta | localeDateTime:'dateNumeric' }}</span>
              <a *ngIf="p.osId" class="os-link" [routerLink]="['/externo/os', p.osId]" (click)="$event.stopPropagation()">
                {{ 'externo.propostas.osLink' | translate:{ id: p.osId + '' } }}
              </a>
            </div>
          </div>
        </div>
      </app-list-data-states>
    </div>
  `,
  styles: [`
    .propostas-container { padding: 1rem; max-width: 960px; margin: 0 auto; width: 100%; box-sizing: border-box; }
    .proposta-cards { display: flex; flex-direction: column; gap: 0.75rem; }
    .proposta-card {
      border: 1px solid var(--surface-border, #e2e8f0);
      border-radius: 12px;
      padding: 1rem;
      cursor: pointer;
      background: var(--surface-card, #fff);
      transition: box-shadow 0.2s;
    }
    .proposta-card:hover { box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .numero { font-weight: 600; }
    .produto { margin: 0 0 0.5rem; }
    .meta { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.875rem; color: var(--text-color-secondary, #64748b); }
    .os-link { color: var(--primary-color, #0ea5e9); text-decoration: none; }
  `]
})
export class ExternoPropostasListComponent implements OnInit {
  private usuarioExternoService = inject(UsuarioExternoService);
  private router = inject(Router);
  private i18n = inject(TranslationService);

  loading = true;
  propostas: PropostaExternaResumo[] = [];

  ngOnInit(): void {
    this.usuarioExternoService.getMinhasPropostas().subscribe({
      next: (list) => {
        this.propostas = list ?? [];
        this.loading = false;
      },
      error: () => {
        this.propostas = [];
        this.loading = false;
      }
    });
  }

  statusLabel(status?: string): string {
    if (!status) return '—';
    const key = `externo.propostas.status.${status}`;
    const t = this.i18n.translate(key);
    return t === key ? status : t;
  }

  statusSeverity(status?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      ENVIADA: 'warning',
      APROVADA: 'success',
      REJEITADA: 'danger',
      CANCELADA: 'secondary'
    };
    return status ? map[status] : 'secondary';
  }

  open(p: PropostaExternaResumo): void {
    this.router.navigate(['/externo/propostas', p.id]);
  }
}
