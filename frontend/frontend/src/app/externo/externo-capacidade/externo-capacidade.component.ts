import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { CapacidadeExternoItem, CapacidadeFilaService } from '../../core/capacidade-fila.service';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';

@Component({
  selector: 'app-externo-capacidade',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TagModule,
    TranslatePipe,
    PageHeroComponent,
    ListDataStatesComponent
  ],
  template: `
    <div class="as-page externo-capacidade">
      <app-page-hero
        variant="slate"
        titleKey="externo.capacidade.title"
        subtitleKey="externo.capacidade.subtitle"
        titleIcon="pi-chart-bar" />

      <app-list-data-states
        [loading]="loading"
        [itemCount]="itens.length"
        [skeletonRows]="4"
        [skeletonCols]="3"
        emptyTitleKey="externo.capacidade.empty"
        emptyDescriptionKey="ui.empty.description">
        <div class="item-list">
          <article class="item-card" *ngFor="let item of itens">
            <div class="item-head">
              <strong>OS {{ item.numeroOs }}</strong>
              <p-tag
                *ngIf="item.prioridadeFila === 'AOG'"
                [value]="'capacidade.priority.AOG' | translate"
                severity="danger"></p-tag>
            </div>
            <p class="meta">{{ item.clienteNome }}</p>
            <p class="meta" *ngIf="item.partNumber">PN {{ item.partNumber }}</p>
            <p class="meta">{{ 'capacidade.card.position' | translate: { n: item.posicaoFila } }}</p>
            <p class="meta">{{ colLabel(item.filaEstagio) }}</p>
            <p-tag
              *ngIf="item.temDeficitKitFcu"
              [value]="'capacidade.badge.deficitKit' | translate"
              severity="warn"
              class="mt-1"></p-tag>
            <p-tag [value]="slaLabel(item.slaStatus)" [severity]="slaSeverity(item.slaStatus)"></p-tag>
            <p class="meta" *ngIf="item.dataPrevistaConclusao">{{ item.dataPrevistaConclusao }}</p>
            <button
              pButton
              type="button"
              class="p-button-outlined p-button-sm mt-2"
              [label]="'externo.capacidade.linkOs' | translate"
              [routerLink]="['/externo/os', item.osId]"></button>
          </article>
        </div>
      </app-list-data-states>
    </div>
  `,
  styles: [
    `
      .externo-capacidade {
        padding: 1.25rem;
        width: 100%;
        box-sizing: border-box;
      }
      .item-list {
        display: grid;
        gap: 1rem;
      }
      .item-card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1rem;
      }
      .item-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .meta {
        margin: 0.15rem 0;
        color: #64748b;
        font-size: 0.9rem;
      }
      .mt-2 {
        margin-top: 0.75rem;
      }
    `
  ]
})
export class ExternoCapacidadeComponent implements OnInit {
  private svc = inject(CapacidadeFilaService);
  private i18n = inject(TranslationService);

  itens: CapacidadeExternoItem[] = [];
  loading = true;

  ngOnInit(): void {
    this.svc.listarExterno().subscribe({
      next: list => {
        this.itens = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  colLabel(estagio: string): string {
    return this.i18n.translate(`capacidade.col.${estagio}`);
  }

  slaLabel(s: string): string {
    const key = s === 'ATENCAO' || s === 'ATRASADO' || s === 'OK' ? s : 'OK';
    return this.i18n.translate(`capacidade.sla.${key}`);
  }

  slaSeverity(s: string): 'success' | 'warn' | 'danger' | undefined {
    if (s === 'ATRASADO') return 'danger';
    if (s === 'ATENCAO') return 'warn';
    return 'success';
  }
}
