import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UsuarioExternoService, UsuarioExterno } from '../core/usuario-externo.service';
import { TranslationService } from '../core/translation.service';
import { formatUiDateTime } from '../core/locale/locale-intl.util';
import { PageHelpComponent } from '../shared/page-help/page-help.component';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';
import { TranslatePipe } from '../core/translate.pipe';
import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';
import { toastKey } from '../core/toast-i18n.util';
import { createListSearch } from '../core/list-search.helper';

@Component({
  standalone: true,
  selector: 'app-usuarios-externos-list',
  imports: [
    ListTableScrollDirective,
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    PageHelpComponent,
    PageHeroComponent,
    ListDataStatesComponent,
    TranslatePipe
  ],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    
    <div class="as-page usuarios-externos-container">
      <app-page-hero
        variant="navy"
        titleKey="usuariosExternos.list.title"
        subtitleKey="usuariosExternos.list.subtitle"
        titleIcon="pi-users"
        [hasActions]="true">
        <div actions class="header-actions">
          <app-page-help></app-page-help>
          <button
            pButton
            [label]="'usuariosExternos.list.btnNew' | translate"
            icon="pi pi-plus"
            routerLink="/usuarios-externos/new">
          </button>
        </div>
      </app-page-hero>

      <!-- Search Bar -->
      <div class="search-bar">
        <span class="p-input-icon-left search-input">
          <i class="pi pi-search"></i>
          <input type="text" pInputText [(ngModel)]="searchTerm" 
                 [placeholder]="'usuariosExternos.list.searchPlaceholder' | translate"
                 (input)="listSearch.fromInput($event)">
        </span>
        <div class="filter-buttons">
          <button pButton [label]="'common.status.active' | translate"
                  [class]="statusFilter === true ? 'p-button-success' : 'p-button-outlined'"
                  (click)="setStatusFilter(true)"></button>
          <button pButton [label]="'common.status.inactive' | translate"
                  [class]="statusFilter === false ? 'p-button-danger' : 'p-button-outlined'"
                  (click)="setStatusFilter(false)"></button>
          <button pButton [label]="'usuariosExternos.list.filterAll' | translate"
                  [class]="statusFilter === null ? 'p-button-secondary' : 'p-button-outlined'"
                  (click)="setStatusFilter(null)"></button>
        </div>
      </div>

      <!-- Table -->
      <div class="table-container">
        <app-list-data-states
          [loading]="loading"
          [itemCount]="usuarios.length"
          [skeletonRows]="8"
          [skeletonCols]="7"
          emptyTitleKey="usuariosExternos.list.empty.title"
          emptyDescriptionKey="ui.empty.description">
          <button
            emptyAction
            pButton
            [label]="'usuariosExternos.list.btnNew' | translate"
            icon="pi pi-plus"
            class="p-button-outlined"
            routerLink="/usuarios-externos/new"></button>
          <p-table appListScroll
            [value]="usuarios"
                 [loading]="loading"
                 [paginator]="true"
                 [rows]="listPageSize"
                 [rowsPerPageOptions]="listRowsPerPageOptions"
                 [showCurrentPageReport]="true"
                 [currentPageReportTemplate]="'usuariosExternos.list.pageReport' | translate"
                 styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 60px">{{ 'common.list.col.id' | translate }}</th>
              <th>{{ 'common.list.col.name' | translate }}</th>
              <th>{{ 'common.list.col.email' | translate }}</th>
              <th>{{ 'usuariosExternos.list.col.company' | translate }}</th>
              <th style="width: 100px">{{ 'common.list.col.status' | translate }}</th>
              <th style="width: 120px">{{ 'usuariosExternos.list.col.lastAccess' | translate }}</th>
              <th style="width: 180px">{{ 'common.list.col.actions' | translate }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-usuario>
            <tr>
              <td>{{ usuario.id }}</td>
              <td>
                <div class="user-cell">
                  <div class="user-avatar">{{ getInitials(usuario.nome) }}</div>
                  <span>{{ usuario.nome }}</span>
                </div>
              </td>
              <td>{{ usuario.email }}</td>
              <td>{{ usuario.empresa || '-' }}</td>
              <td>
                <p-tag [value]="(usuario.ativo ? 'common.status.active' : 'common.status.inactive') | translate" 
                       [severity]="usuario.ativo ? 'success' : 'danger'">
                </p-tag>
              </td>
              <td>{{ formatLastAccess(usuario) }}</td>
              <td>
                <div class="action-buttons">
                  <button pButton icon="pi pi-eye" 
                          class="p-button-text p-button-rounded p-button-sm"
                          [pTooltip]="'usuariosExternos.list.tooltip.details' | translate"
                          [routerLink]="['/usuarios-externos', usuario.id]">
                  </button>
                  <button pButton icon="pi pi-key" 
                          class="p-button-text p-button-rounded p-button-sm p-button-warning"
                          [pTooltip]="'usuariosExternos.list.tooltip.permissions' | translate"
                          [routerLink]="['/usuarios-externos', usuario.id, 'permissoes']">
                  </button>
                  <button pButton icon="pi pi-pencil" 
                          class="p-button-text p-button-rounded p-button-sm p-button-info"
                          [pTooltip]="'common.list.tooltip.edit' | translate"
                          [routerLink]="['/usuarios-externos', usuario.id]">
                  </button>
                  <button pButton 
                          [icon]="usuario.ativo ? 'pi pi-ban' : 'pi pi-check-circle'" 
                          class="p-button-text p-button-rounded p-button-sm"
                          [class.p-button-danger]="usuario.ativo"
                          [class.p-button-success]="!usuario.ativo"
                          [pTooltip]="(usuario.ativo ? 'usuariosExternos.list.tooltip.deactivate' : 'usuariosExternos.list.tooltip.activate') | translate"
                          (click)="toggleStatus(usuario)">
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
        </app-list-data-states>
      </div>
    </div>
  `,
  styles: [`
    .usuarios-externos-container {
      padding: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      background: white;
      border-radius: 12px;
      padding: 20px 24px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .header-left {
      h1 {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 24px;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 8px;

        i {
          color: #0ea5e9;
        }
      }

      p {
        font-size: 14px;
        color: #64748b;
        margin: 0;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .search-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .search-input {
      flex: 1;
      min-width: 300px;

      input {
        width: 100%;
        height: 44px;
        border-radius: 10px;
      }
    }

    .filter-buttons {
      display: flex;
      gap: 8px;
    }

    .table-container {
      background: #fff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    .empty-message {
      text-align: center;
      padding: 48px 24px !important;
      color: #64748b;

      i {
        font-size: 48px;
        margin-bottom: 16px;
        display: block;
      }

      p {
        margin: 0;
        font-size: 16px;
      }
    }

    :host ::ng-deep {
      .p-datatable {
        .p-datatable-thead > tr > th {
          background: #f8fafc;
          color: #334155;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 16px;
          border-bottom: 2px solid #e2e8f0;
        }

        .p-datatable-tbody > tr > td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .p-datatable-tbody > tr:hover {
          background: #f8fafc;
        }
      }
    }
  `]
})
export class UsuariosExternosListComponent implements OnInit {
  readonly listPageSize = DEFAULT_LIST_PAGE_SIZE;
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  private usuarioExternoService = inject(UsuarioExternoService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private i18n = inject(TranslationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly listSearch = createListSearch(this.destroyRef, term => {
    this.searchTerm = term;
    this.loadUsuarios();
  });

  usuarios: UsuarioExterno[] = [];
  loading = true;
  searchTerm = '';
  statusFilter: boolean | null = true;

  ngOnInit() {
    this.loadUsuarios();
  }

  loadUsuarios() {
    this.loading = true;
    this.usuarioExternoService.list({
      q: this.searchTerm || undefined,
      ativo: this.statusFilter === null ? undefined : this.statusFilter
    }).subscribe({
      next: (result) => {
        this.usuarios = result.content;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'usuariosExternos.list.toast.loadError');
        this.loading = false;
      }
    });
  }

  search() {
    this.loadUsuarios();
  }

  setStatusFilter(status: boolean | null) {
    this.statusFilter = status;
    this.loadUsuarios();
  }

  toggleStatus(usuario: UsuarioExterno) {
    const action = usuario.ativo
      ? this.i18n.translate('confirm.usuarioExterno.actionDeactivate')
      : this.i18n.translate('confirm.usuarioExterno.actionActivate');

    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.usuarioExterno.toggle', {
        action,
        nome: String(usuario.nome ?? '')
      }),
      header: 'confirm.header.generic',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: usuario.ativo ? 'common.confirm.yesInactivate' : 'common.confirm.yesActivate',
      rejectLabel: 'common.confirm.cancel',
      accept: () => {
        if (usuario.ativo) {
          this.usuarioExternoService.delete(usuario.id).subscribe({
            next: () => {
              toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'usuariosExternos.list.toast.deactivateSuccess');
              this.loadUsuarios();
            },
            error: () => {
              toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'usuariosExternos.list.toast.deactivateError');
            }
          });
        } else {
          this.usuarioExternoService.activate(usuario.id).subscribe({
            next: () => {
              toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'usuariosExternos.list.toast.activateSuccess');
              this.loadUsuarios();
            },
            error: () => {
              toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'usuariosExternos.list.toast.activateError');
            }
          });
        }
      }
    });
  }

  getInitials(nome: string): string {
    if (!nome) return '?';
    const names = nome.split(' ');
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

  formatLastAccess(usuario: UsuarioExterno): string {
    if (usuario.ultimoAcesso) {
      return this.formatDate(usuario.ultimoAcesso);
    }
    if (usuario.conviteEnviadoEm) {
      return this.i18n.translate('usuariosExternos.list.lastAccess.inviteSent', {
        date: this.formatDate(usuario.conviteEnviadoEm),
      });
    }
    return this.i18n.translate('usuariosExternos.list.lastAccess.invitePending');
  }
}
