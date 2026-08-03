import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { P1ApiService, LgpdSolicitacaoItem } from './p1-api.service';

@Component({
  selector: 'app-privacidade-portal',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TranslatePipe],
  template: `
    <div class="page-shell">
      <h1>{{ 'p1.lgpd.portalTitle' | translate }}</h1>
      <p-card>
        <button pButton type="button" class="block-btn" [label]="'p1.lgpd.export' | translate" (click)="req('EXPORT')"></button>
        <button pButton type="button" class="p-button-outlined block-btn" [label]="'p1.lgpd.delete' | translate" (click)="req('DELETE')"></button>
      </p-card>
      <p-card *ngIf="solicitacoes.length" class="mt-3">
        <h3 class="mt-0">{{ 'p1.lgpd.portalTitle' | translate }}</h3>
        <ul class="list">
          <li *ngFor="let s of solicitacoes">
            <span>{{ s.tipo }} — {{ s.status }}</span>
            <button
              *ngIf="s.downloadAvailable"
              pButton
              type="button"
              class="p-button-link p-button-sm"
              [label]="'p1.lgpd.download' | translate"
              (click)="download(s.id)"></button>
            <span *ngIf="s.status === 'FAILED'" class="err">{{ 'p1.lgpd.failed' | translate }}</span>
          </li>
        </ul>
      </p-card>
    </div>
  `,
  styles: [
    `.page-shell { padding: 1.5rem; }
     .block-btn { width: 100%; margin-bottom: 0.75rem; display: block; }
     .list { list-style: none; padding: 0; margin: 0; }
     .list li { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
     .err { color: var(--red-500); font-size: 0.875rem; }`
  ]
})
export class PrivacidadePortalComponent implements OnInit {
  private p1 = inject(P1ApiService);
  private messages = inject(MessageService);
  private i18n = inject(TranslationService);
  solicitacoes: LgpdSolicitacaoItem[] = [];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.p1.listarSolicitacoes().subscribe((list) => (this.solicitacoes = list));
  }

  req(tipo: 'EXPORT' | 'DELETE'): void {
    this.p1.solicitarLgpd(tipo).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: this.i18n.translate('p1.lgpd.portalTitle'),
          detail: this.i18n.translate('p1.lgpd.sent')
        });
        this.reload();
      }
    });
  }

  download(id: number): void {
    this.p1.downloadExport(id);
  }
}
