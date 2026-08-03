import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../core/translate.pipe';
import { P1ApiService, LgpdDocument } from './p1-api.service';
import { AuthShellComponent } from '../shared/auth-shell/auth-shell.component';
import { AuthBrandHeaderComponent } from '../shared/auth-brand-header/auth-brand-header.component';

@Component({
  selector: 'app-public-legal',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, AuthShellComponent, AuthBrandHeaderComponent],
  template: `
    <app-auth-shell [cardWide]="true" [cardMaxWidth]="800">
      <header authHeader class="auth-header">
        <app-auth-brand-header />
      </header>

      <p *ngIf="loading" class="auth-description">{{ 'p1.legal.loading' | translate }}</p>
      <p *ngIf="!loading && error" class="error-text">{{ 'p1.legal.error' | translate }}</p>

      <ng-container *ngIf="!loading && doc">
        <h2 class="auth-page-title">{{ doc.titulo }}</h2>
        <pre class="auth-legal-body">{{ doc.conteudo }}</pre>
      </ng-container>

      <div authFooter class="auth-footer auth-legal-links">
        <a routerLink="/cadastro-trial" class="auth-link">{{ 'p1.signup.linkBackTrial' | translate }}</a>
        <span class="auth-footer-divider" aria-hidden="true">·</span>
        <a routerLink="/login" class="auth-link">{{ 'p1.signup.linkLogin' | translate }}</a>
      </div>
    </app-auth-shell>
  `
})
export class PublicLegalComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private p1 = inject(P1ApiService);
  doc: LgpdDocument | null = null;
  loading = true;
  error = false;

  ngOnInit(): void {
    const tipo = this.route.snapshot.data['legalTipo'] as string;
    const obs = tipo === 'privacidade' ? this.p1.getPrivacidade() : this.p1.getTermos();
    obs.subscribe({
      next: (d) => {
        this.doc = d;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });
  }
}
