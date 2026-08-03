import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { ToastModule } from 'primeng/toast';
import { UsuarioExternoService, UsuarioExterno } from '../../core/usuario-externo.service';
import { TranslationService } from '../../core/translation.service';
import { formatUiDateTime } from '../../core/locale/locale-intl.util';
import { TranslatePipe } from '../../core/translate.pipe';
import { PhoneBrPipe } from '../../core/phone-br.pipe';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';

@Component({
  standalone: true,
  selector: 'app-externo-perfil',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    AvatarModule,
    ToastModule,
    TranslatePipe,
    PhoneBrPipe,
    PageHeroComponent
  ],
  template: `
    <p-toast></p-toast>
    <div class="as-page perfil-container">
      <app-page-hero
        variant="slate"
        titleKey="externo.perfil.pageTitle"
        subtitleKey="externo.perfil.pageSub"
        titleIcon="pi-user" />

      <div class="perfil-content">
        <!-- Avatar Section -->
        <div class="avatar-section">
          <p-avatar 
            [label]="getInitials()" 
            size="xlarge" 
            shape="circle"
            styleClass="profile-avatar">
          </p-avatar>
          <h2>{{ user?.nome || ('externo.perfil.clienteFallback' | translate) }}</h2>
          <p>{{ user?.email }}</p>
        </div>

        <!-- Info Form -->
        <div class="info-section">
          <div class="info-card">
            <h3>{{ 'externo.perfil.secPessoais' | translate }}</h3>
            
            <div class="info-grid">
              <div class="info-item">
                <label>{{ 'externo.perfil.label.nomeCompleto' | translate }}</label>
                <span>{{ user?.nome || '-' }}</span>
              </div>
              <div class="info-item">
                <label>{{ 'externo.perfil.label.email' | translate }}</label>
                <span>{{ user?.email || '-' }}</span>
              </div>
              <div class="info-item">
                <label>{{ 'externo.perfil.label.empresa' | translate }}</label>
                <span>{{ user?.empresa || '-' }}</span>
              </div>
              <div class="info-item">
                <label>{{ 'externo.perfil.label.cargo' | translate }}</label>
                <span>{{ user?.cargo || '-' }}</span>
              </div>
              <div class="info-item">
                <label>{{ 'externo.perfil.label.telefone' | translate }}</label>
                <span>{{ (user?.telefone | phoneBr) || '-' }}</span>
              </div>
              <div class="info-item">
                <label>{{ 'externo.perfil.label.membro' | translate }}</label>
                <span>{{ formatDate(user?.dataCadastro) }}</span>
              </div>
            </div>
          </div>

          <!-- Access Info -->
          <div class="info-card">
            <h3>{{ 'externo.perfil.secAcesso' | translate }}</h3>
            
            <div class="info-grid">
              <div class="info-item">
                <label>{{ 'externo.perfil.label.lastAccess' | translate }}</label>
                <span>{{ formatDateTime(user?.ultimoAcesso) }}</span>
              </div>
              <div class="info-item">
                <label>{{ 'externo.perfil.label.status' | translate }}</label>
                <span class="status-badge" [class.active]="user?.ativo">
                  {{ user?.ativo ? ('externo.perfil.statusAtivo' | translate) : ('externo.perfil.statusInativo' | translate) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Note about editing -->
          <div class="note-card">
            <i class="pi pi-info-circle"></i>
            <p>
              {{ 'externo.perfil.notice' | translate }}
              <strong>contato&#64;aerosuite.app</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .perfil-container {
      padding: 20px;
    }

    .page-header {
      margin-bottom: 30px;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      font-size: 36px;
      color: #0ea5e9;
      background: rgba(14, 165, 233, 0.1);
      padding: 16px;
      border-radius: 12px;
    }

    .header-title h1 {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .header-title p {
      font-size: 14px;
      color: #64748b;
      margin: 4px 0 0;
    }

    .perfil-content {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 24px;
    }

    .avatar-section {
      background: #fff;
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      border: 1px solid #e2e8f0;
      height: fit-content;

      h2 {
        font-size: 20px;
        font-weight: 600;
        color: #0f172a;
        margin: 20px 0 4px;
      }

      p {
        font-size: 14px;
        color: #64748b;
        margin: 0;
      }
    }

    ::ng-deep .profile-avatar {
      width: 100px !important;
      height: 100px !important;
      font-size: 36px !important;
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important;
    }

    .info-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .info-card {
      background: #fff;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid #e2e8f0;

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: #0f172a;
        margin: 0 0 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f1f5f9;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      label {
        font-size: 12px;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      span {
        font-size: 15px;
        color: #334155;
        font-weight: 500;
      }
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      background: #fee2e2;
      color: #dc2626;
      width: fit-content;

      &.active {
        background: #dcfce7;
        color: #16a34a;
      }
    }

    .note-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #f8fafc;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid #e2e8f0;

      i {
        color: #0ea5e9;
        font-size: 20px;
        margin-top: 2px;
      }

      p {
        font-size: 14px;
        color: #64748b;
        margin: 0;
        line-height: 1.6;

        strong {
          color: #0ea5e9;
        }
      }
    }

    @media (max-width: 768px) {
      .perfil-content {
        grid-template-columns: 1fr;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ExternoPerfilComponent implements OnInit {
  private usuarioExternoService = inject(UsuarioExternoService);
  private i18n = inject(TranslationService);

  user: UsuarioExterno | null = null;

  ngOnInit() {
    this.user = this.usuarioExternoService.getCurrentUser();
  }

  getInitials(): string {
    if (!this.user?.nome) return 'C';
    const names = this.user.nome.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return names[0][0];
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    try {
      return formatUiDateTime(this.i18n.getCurrentLanguage(), date, 'date');
    } catch {
      return date;
    }
  }

  formatDateTime(date: string | undefined): string {
    if (!date) return '-';
    try {
      return formatUiDateTime(this.i18n.getCurrentLanguage(), date, 'dateTime');
    } catch {
      return date;
    }
  }
}
