import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { PageHelpService, HelpContent } from '../../core/page-help.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';

@Component({
  selector: 'app-page-help',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    TooltipModule,
    TranslatePipe
  ],
  template: `
    <button 
      pButton 
      type="button" 
      class="p-button-rounded p-button-text p-button-help"
      (click)="showHelpDialog = true"
      [attr.aria-label]="'ui.pageHelp.open' | translate"
      [pTooltip]="'ui.pageHelp.open' | translate"
      tooltipPosition="left">
      <span class="help-icon-wrapper">
        <svg class="help-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="helpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#0284c7;stop-opacity:1" />
            </linearGradient>
          </defs>
          <!-- Círculo principal com fundo branco e contorno azul -->
          <circle cx="12" cy="12" r="10" fill="white" stroke="url(#helpGradient)" stroke-width="2"/>
          <!-- Letra "i" estilizada em azul -->
          <!-- Ponto superior -->
          <circle cx="12" cy="7.5" r="1.8" fill="url(#helpGradient)"/>
          <!-- Haste vertical -->
          <rect x="11" y="9.5" width="2" height="6" rx="1" fill="url(#helpGradient)"/>
          <!-- Serif decorativo na base -->
          <path d="M 10.5 15.5 
                   Q 11 15 11.5 15.5 
                   Q 12 16 12.5 15.5 
                   Q 13 15 13.5 15.5 
                   Q 12.5 16.2 12 16.3 
                   Q 11.5 16.2 10.5 15.5 Z" fill="url(#helpGradient)"/>
        </svg>
      </span>
    </button>

    <p-dialog 
      styleClass="as-hero-dialog" [(visible)]="showHelpDialog" 
      [modal]="true"
      [styleClass]="'help-dialog'"
      [closable]="true"
      [draggable]="false"
      [resizable]="true"
      (onHide)="onDialogHide()"
      [header]="dialogHeader">
      
      <div class="help-content" *ngIf="currentHelp">
        <div class="help-section" *ngFor="let section of currentHelp.sections; let i = index">
          <div class="section-header">
            <i [class]="section.icon || 'pi pi-circle-fill'" class="section-icon"></i>
            <h3 class="section-title">{{ section.title }}</h3>
          </div>
          <div class="section-content">
            <ul class="help-list">
              <li *ngFor="let item of section.content" class="help-item">
                {{ item }}
              </li>
            </ul>
          </div>
          <div class="section-divider" *ngIf="i < currentHelp.sections.length - 1"></div>
        </div>
      </div>

      <div class="no-help-content" *ngIf="!currentHelp">
        <div class="no-help-icon">
          <i class="pi pi-info-circle"></i>
        </div>
        <h3>{{ 'ui.pageHelp.emptyTitle' | translate }}</h3>
        <p>{{ 'ui.pageHelp.emptyDescription' | translate }}</p>
      </div>

      <ng-template pTemplate="footer">
        <div class="help-dialog-footer">
          <button 
            pButton 
            type="button" 
            [label]="'ui.pageHelp.close' | translate" 
            icon="pi pi-times" 
            class="p-button-text"
            (click)="showHelpDialog = false">
          </button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrls: ['./page-help.component.scss']
})
export class PageHelpComponent implements OnInit, OnDestroy {
  private helpService = inject(PageHelpService);
  private router = inject(Router);
  private i18n = inject(TranslationService);
  private destroy$ = new Subject<void>();

  showHelpDialog = false;
  currentHelp: HelpContent | null = null;

  get dialogHeader(): string {
    return this.currentHelp?.title ?? this.i18n.translate('ui.pageHelp.title');
  }

  ngOnInit() {
    try {
      // Carregar ajuda inicial
      this.loadHelpForCurrentRoute();

      // Observar mudanças de rota
      this.router.events
        .pipe(
          filter(event => event instanceof NavigationEnd),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          try {
            this.loadHelpForCurrentRoute();
            // Fechar dialog se estiver aberto ao mudar de página
            if (this.showHelpDialog) {
              this.showHelpDialog = false;
            }
          } catch (error) {
            console.warn('Failed to load help for route:', error);
          }
        });
    } catch (error) {
      console.error('Failed to initialize PageHelpComponent:', error);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadHelpForCurrentRoute() {
    try {
      if (this.helpService) {
        this.currentHelp = this.helpService.getCurrentRouteHelp();
      }
    } catch (error) {
      console.warn('Failed to load help for current route:', error);
      this.currentHelp = null;
    }
  }

  onDialogHide() {
    this.showHelpDialog = false;
  }
}

