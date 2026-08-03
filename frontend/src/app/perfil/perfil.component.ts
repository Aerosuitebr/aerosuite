import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';
import { AuthService, User } from '../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Subject, takeUntil } from 'rxjs';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { formatUiDateTime } from '../core/locale/locale-intl.util';
import { extractApiErrorMessage } from '../core/backend-i18n-message.util';
import { toastKey } from '../core/toast-i18n.util';
import { DEFAULT_USUARIO_AVATAR } from '../core/usuario-foto.util';
import { UsuarioFotoService } from '../core/usuario-foto.service';
import { UsuarioFotoHoverComponent } from '../shared/usuario-foto-hover/usuario-foto-hover.component';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import {
  TicketEmailModo,
  UserNotificationPreferencesService
} from '../core/user-notification-preferences.service';

@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputTextareaModule,
    ToastModule,
    AvatarModule,
    TagModule,
    DividerModule,
    SelectButtonModule,
    TranslatePipe,
    UsuarioFotoHoverComponent,
    PageHeroComponent
  ],
  template: `
    <p-toast></p-toast>

    <div class="as-page perfil-container">
      <app-page-hero
        variant="navy"
        titleKey="profile.page.title"
        subtitleKey="profile.page.subtitle"
        titleIcon="pi-user">
      </app-page-hero>

      <!-- Profile Content -->
      <div class="profile-content">
        <!-- Profile Photo Section -->
        <div class="profile-photo-section">
          <p-card [header]="'profile.section.photo' | translate" styleClass="photo-card">
            <div class="photo-container">
              <app-usuario-foto-hover
                [imageUrl]="getPhotoUrl()"
                size="xlarge"
                styleClass="profile-avatar"
                variant="profile">
                <div class="usuario-foto-hover__overlay" (click)="fileInput.click()">
                  <i class="pi pi-camera"></i>
                  <span>{{ 'layout.photo.header' | translate }}</span>
                </div>
              </app-usuario-foto-hover>
              <div class="photo-actions">
                <input
                  type="file"
                  #fileInput
                  hidden
                  (change)="onFileSelected($event)"
                  accept="image/*">
                
                <div class="drop-zone"
                     (dragover)="onDragOver($event)"
                     (drop)="onDrop($event)"
                     (click)="fileInput.click()"
                     [class.dragover]="isDragOver">
                  <i class="pi pi-cloud-upload"></i>
                  <p>{{ 'profile.photo.dropHint' | translate }}</p>
                  <small>{{ 'profile.photo.formatsHint' | translate }}</small>
                </div>

                <div class="upload-preview" *ngIf="fotoPreview">
                  <img [src]="fotoPreview" [attr.alt]="'profile.photo.previewAlt' | translate">
                  <div class="preview-actions">
                    <button 
                      pButton 
                      type="button" 
                      [label]="'profile.photo.confirmBtn' | translate"
                      icon="pi pi-check"
                      class="p-button-success"
                      (click)="uploadFoto()"
                      [disabled]="isUploading">
                    </button>
                    <button 
                      pButton 
                      type="button" 
                      [label]="'profile.photo.cancelBtn' | translate"
                      icon="pi pi-times"
                      class="p-button-text"
                      (click)="cancelarUpload()">
                    </button>
                  </div>
                </div>

                <div class="upload-progress" *ngIf="isUploading">
                  <i class="pi pi-spin pi-spinner"></i>
                  <span>{{ 'profile.photo.uploading' | translate }}</span>
                </div>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Profile Information Section -->
        <div class="profile-info-section">
          <p-card [header]="'profile.section.personal' | translate" styleClass="info-card">
            <div class="info-grid">
              <div class="info-item">
                <label>{{ 'profile.field.fullName' | translate }}</label>
                <p class="info-value">{{ currentUser?.nome || ('profile.notInformed' | translate) }}</p>
              </div>
              
              <div class="info-item">
                <label>{{ 'profile.field.email' | translate }}</label>
                <p class="info-value">{{ currentUser?.email || ('profile.notInformed' | translate) }}</p>
              </div>
              
              <div class="info-item">
                <label>{{ 'profile.field.accessProfile' | translate }}</label>
                <p-tag 
                  [value]="perfilLabel"
                  severity="info"
                  [rounded]="true">
                </p-tag>
              </div>
              
              <div class="info-item">
                <label>{{ 'profile.field.accountStatus' | translate }}</label>
                <p-tag 
                  [value]="'profile.status.active' | translate"
                  severity="success"
                  [rounded]="true">
                </p-tag>
              </div>
              
              <div class="info-item">
                <label>{{ 'profile.field.lastAccess' | translate }}</label>
                <p class="info-value">{{ formatDate(currentUser?.ultimoAcesso) }}</p>
              </div>
              
              <div class="info-item">
                <label>{{ 'profile.field.registeredAt' | translate }}</label>
                <p class="info-value">{{ formatDate(currentUser?.dataCadastro) }}</p>
              </div>
            </div>
          </p-card>

          <p-card [header]="'profile.section.notifications' | translate" styleClass="info-card notifications-card">
            <p class="notifications-hint">{{ 'profile.notifications.hint' | translate }}</p>
            <div class="notifications-field">
              <label>{{ 'profile.notifications.ticketEmail' | translate }}</label>
              <p-selectButton
                [options]="ticketEmailModoOptions"
                [(ngModel)]="ticketEmailModo"
                optionLabel="label"
                optionValue="value"
                [allowEmpty]="false">
              </p-selectButton>
              <small class="notifications-mode-hint">{{ ticketEmailModoHintKey | translate }}</small>
            </div>
            <div class="notifications-actions">
              <button
                pButton
                type="button"
                [label]="'profile.notifications.saveBtn' | translate"
                icon="pi pi-save"
                (click)="salvarNotificacoes()"
                [disabled]="notificacoesSaving || notificacoesLoading">
              </button>
            </div>
          </p-card>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./perfil.component.scss']
})
export class PerfilUsuarioComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);
  private usuarioFotoService = inject(UsuarioFotoService);
  private notificationPrefs = inject(UserNotificationPreferencesService);
  private destroy$ = new Subject<void>();

  ticketEmailModo: TicketEmailModo = 'INSTANT';
  notificacoesLoading = false;
  notificacoesSaving = false;

  get ticketEmailModoOptions() {
    return [
      { label: this.i18n.translate('profile.notifications.mode.instant'), value: 'INSTANT' as TicketEmailModo },
      { label: this.i18n.translate('profile.notifications.mode.digest'), value: 'DIGEST_DAILY' as TicketEmailModo },
      { label: this.i18n.translate('profile.notifications.mode.off'), value: 'OFF' as TicketEmailModo }
    ];
  }

  get ticketEmailModoHintKey(): string {
    switch (this.ticketEmailModo) {
      case 'DIGEST_DAILY':
        return 'profile.notifications.mode.digestHint';
      case 'OFF':
        return 'profile.notifications.mode.offHint';
      default:
        return 'profile.notifications.mode.instantHint';
    }
  }

  currentUser: User | null = null;
  avatarImageUrl = DEFAULT_USUARIO_AVATAR;

  get perfilLabel(): string {
    const u = this.currentUser;
    if (!u) {
      return this.i18n.translate('profile.userFallback');
    }
    return this.i18n.translatePerfil(u.perfil?.codigo, u.perfil?.nome, u.role);
  }
  selectedFile: File | null = null;
  fotoPreview: string | null = null;
  isUploading = false;
  isDragOver = false;
  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.carregarPreferenciasNotificacao();
    // Inscrever-se em mudanças do usuário para atualizar a foto
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.refreshAvatarImage();
      });
  }

  private refreshAvatarImage(): void {
    if (this.fotoPreview) {
      return;
    }
    this.usuarioFotoService
      .loadAvatarUrl(this.currentUser?.fotoPerfil, { bustCache: false })
      .subscribe((url) => {
        this.avatarImageUrl = url;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getPhotoUrl(): string {
    return this.fotoPreview || this.avatarImageUrl;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.handleFile(target.files[0]);
    }
  }

  private handleFile(file: File) {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'profile.toast.onlyImageFiles');
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'profile.toast.maxFileSize');
      return;
    }

    this.selectedFile = file;
    
    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.fotoPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  uploadFoto() {
    if (!this.selectedFile || !this.currentUser?.id) {
      return;
    }

    this.isUploading = true;

    const preview = this.fotoPreview;
    this.usuarioFotoService.uploadProfilePhoto(this.selectedFile).subscribe({
        next: (response) => {
          toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'profile.toast.photoUpdated');

          if (this.currentUser) {
            this.usuarioFotoService
              .completeProfilePhotoUpload(this.currentUser, response, preview)
              .subscribe({
                next: (url) => {
                  this.avatarImageUrl = url;
                },
                complete: () => {
                  this.cancelarUpload();
                },
                error: () => {
                  this.cancelarUpload();
                },
              });
          } else {
            this.reloadUserData();
            this.cancelarUpload();
          }
        },
        error: (error) => {
          console.error('Failed to upload:', error);
          
          let errorMessage = this.i18n.translate('profile.toast.uploadFailedGeneric');

          if (error.status === 400) {
            errorMessage = extractApiErrorMessage(error, this.i18n, 'profile.toast.uploadInvalidData');
          } else if (error.status === 401) {
            errorMessage = this.i18n.translate('profile.toast.uploadUnauthorized');
          } else if (error.status === 404) {
            errorMessage = this.i18n.translate('profile.toast.uploadEndpointNotFound');
          } else if (error.status === 413) {
            errorMessage = this.i18n.translate('profile.toast.maxFileSize');
          } else if (error.status === 0) {
            errorMessage = this.i18n.translate('profile.toast.uploadConnectionFailed');
          } else {
            errorMessage = extractApiErrorMessage(error, this.i18n, 'profile.toast.uploadFailedGeneric');
          }
          
          toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'profile.toast.uploadError', {
            error: String(errorMessage)
          });
          this.isUploading = false;
        }
      });
  }

  private reloadUserData() {
    this.authService.refreshCurrentUserFromServer().subscribe({
      error: (error) => {
        console.error('Failed to reload user data:', error);
      },
    });
  }

  cancelarUpload() {
    this.selectedFile = null;
    this.fotoPreview = null;
    this.isUploading = false;
    this.isDragOver = false;
  }

  formatDate(date: any): string {
    if (!date) return this.i18n.translate('profile.notInformed');
    
    try {
      // Se for string, tentar parsear
      let d: Date;
      if (typeof date === 'string') {
        // Tentar parsear diferentes formatos
        d = new Date(date);
        if (isNaN(d.getTime())) {
          // Se falhar, tentar formato ISO sem timezone
          const dateOnly = date.split('T')[0];
          d = new Date(dateOnly + 'T00:00:00');
        }
      } else {
        d = new Date(date);
      }
      
      if (isNaN(d.getTime())) {
        return this.i18n.translate('profile.notInformed');
      }
      
      // Verificar se tem hora (ultimoAcesso) ou é apenas data (dataCadastro)
      const hasTime = date.toString().includes('T') || date.toString().includes(' ');
      
      if (hasTime) {
        return formatUiDateTime(this.i18n.getCurrentLanguage(), d, 'dateTime');
      }
      return formatUiDateTime(this.i18n.getCurrentLanguage(), d, 'date');
    } catch (error) {
      console.error('Failed to format date:', error);
      return this.i18n.translate('profile.notInformed');
    }
  }

  carregarPreferenciasNotificacao() {
    this.notificacoesLoading = true;
    this.notificationPrefs.get().subscribe({
      next: (prefs) => {
        this.ticketEmailModo = prefs.ticketEmailModo || 'INSTANT';
        this.notificacoesLoading = false;
      },
      error: () => {
        this.notificacoesLoading = false;
      }
    });
  }

  salvarNotificacoes() {
    this.notificacoesSaving = true;
    this.notificationPrefs.save(this.ticketEmailModo).subscribe({
      next: () => {
        this.notificacoesSaving = false;
        toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'profile.notifications.toastSaved');
      },
      error: (error) => {
        this.notificacoesSaving = false;
        toastKey(
          this.messageService,
          this.i18n,
          'error',
          'common.toast.error',
          'profile.notifications.toastSaveError',
          { error: extractApiErrorMessage(error, this.i18n, 'profile.notifications.toastSaveError') }
        );
      }
    });
  }

}
