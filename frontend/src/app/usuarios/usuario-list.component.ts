import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { PaginatorModule } from 'primeng/paginator';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UsuarioService } from '../core/usuarios.service';
import { DelegacaoFuncionalidadeService, DelegacaoFuncionalidade } from '../core/delegacao-funcionalidade.service';
import { PageHelpComponent } from '../shared/page-help/page-help.component';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';
import { TranslationService } from '../core/translation.service';
import { formatUiDateTime } from '../core/locale/locale-intl.util';
import { extractApiErrorMessage } from '../core/backend-i18n-message.util';
import { TranslatePipe } from '../core/translate.pipe';
import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';
import { UiLabelPipe } from '../core/ui-label.pipe';
import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { createStaleRequestGuard, resolveLazyPageRequest, type LazyLoadEvent } from '../core/lazy-list-pagination.helper';

@Component({
  standalone: true,
  selector: 'app-usuarios-list',
  imports: [
    ListTableScrollDirective,
    CommonModule, 
    FormsModule,
    TableModule, 
    InputTextModule,
    ButtonModule,
    CardModule,
    TagModule,
    BadgeModule,
    TooltipModule,
    AvatarModule,
    ConfirmDialogModule,
    ToastModule,
    PaginatorModule,
    DialogModule,
    CalendarModule,
    InputTextareaModule,
    PageHelpComponent,
    PageHeroComponent,
    ListDataStatesComponent,
    TranslatePipe,
    UiLabelPipe
  ],

  template: `
    <div class="as-page list-container">
      <app-page-hero
        variant="navy"
        titleKey="usuarios.list.title"
        subtitleKey="usuarios.list.subtitle"
        titleIcon="pi-users"
        [hasActions]="true">
        <div actions class="header-actions">
          <app-page-help></app-page-help>
          <button
            pButton
            type="button"
            [label]="'usuarios.list.btnNew' | translate"
            icon="pi pi-plus"
            class="p-button-primary add-btn"
            (click)="addNew()">
          </button>
        </div>
      </app-page-hero>

      <!-- Filters Section -->
      <div class="filters-section">
        <div class="filters-card">
          <div class="search-container">
            <div class="search-input-wrapper">
              <i class="pi pi-search search-icon"></i>
              <input 
                type="text" 
                pInputText 
                [(ngModel)]="q" 
                [placeholder]="'usuarios.list.searchPlaceholder' | translate" 
                (keyup.enter)="buscar()"
                class="search-input">
            </div>
            <button 
              pButton 
              type="button" 
              icon="pi pi-search" 
              class="p-button-outlined search-btn"
              (click)="buscar()"
              [pTooltip]="'common.list.tooltip.search' | translate"
              [attr.aria-label]="'common.list.tooltip.search' | translate"
              tooltipPosition="top">
            </button>
            <button 
              pButton 
              type="button" 
              icon="pi pi-times" 
              class="p-button-text clear-btn"
              (click)="clear()"
              [pTooltip]="'common.list.tooltip.clearFilters' | translate"
              [attr.aria-label]="'common.list.tooltip.clearFilters' | translate"
              tooltipPosition="top">
            </button>
          </div>
          
          <div class="stats-container">
            <div class="stat-item">
              <div class="stat-number">{{ total }}</div>
              <div class="stat-label">{{ 'usuarios.list.statTotal' | translate }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ getDisplayedCount() }}</div>
              <div class="stat-label">{{ 'common.list.stat.displaying' | translate }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="table-section">
        <div class="table-card">
          <div class="table-container">
            <app-list-data-states
              [loading]="loading"
              [itemCount]="total"
              [skeletonRows]="8"
              [skeletonCols]="7"
              [mountContentWhileLoading]="true"
              emptyTitleKey="usuarios.list.empty.title"
              emptyDescriptionKey="ui.empty.description">
              <button
                emptyAction
                pButton
                type="button"
                [label]="'usuarios.list.empty.btn' | translate"
                icon="pi pi-plus"
                class="p-button"
                (click)="addNew()"></button>
              <p-table appListScroll
            [first]="tableFirst"
            [value]="rows" 
            [lazy]="true" 
            [paginator]="true"
            [rows]="size" 
            [totalRecords]="total" 
            [loading]="loading"
            (onLazyLoad)="loadLazy($event)"
            [sortField]="sortField" 
            [sortOrder]="sortOrder"
            [rowsPerPageOptions]="listRowsPerPageOptions" 
            dataKey="id" 
            responsiveLayout="scroll"
            styleClass="modern-table">
            
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="id" style="width: 80px;">
                  <div class="header-cell">
                    <span>{{ 'common.list.col.id' | translate }}</span>
                    <p-sortIcon field="id"></p-sortIcon>
                  </div>
                </th>
                <th pSortableColumn="nome" style="width: 200px;">
                  <div class="header-cell">
                    <span>{{ 'usuarios.list.col.user' | translate }}</span>
                    <p-sortIcon field="nome"></p-sortIcon>
                  </div>
                </th>
                <th pSortableColumn="email">
                  <div class="header-cell">
                    <span>{{ 'common.list.col.email' | translate }}</span>
                    <p-sortIcon field="email"></p-sortIcon>
                  </div>
                </th>
                <th style="width: 150px;">
                  <div class="header-cell">
                    <span>{{ 'common.list.col.profile' | translate }}</span>
                  </div>
                </th>
                <th pSortableColumn="ativo" style="width: 120px;">
                  <div class="header-cell">
                    <span>{{ 'common.list.col.status' | translate }}</span>
                    <p-sortIcon field="ativo"></p-sortIcon>
                  </div>
                </th>
                <th pSortableColumn="dataCadastro" style="width: 150px;">
                  <div class="header-cell">
                    <span>{{ 'usuarios.list.col.registeredAt' | translate }}</span>
                    <p-sortIcon field="dataCadastro"></p-sortIcon>
                  </div>
                </th>
                <th style="width: 200px;">
                  <div class="header-cell">
                    <span>{{ 'common.list.col.actions' | translate }}</span>
                  </div>
                </th>
              </tr>
            </ng-template>
            
            <ng-template pTemplate="body" let-row let-rowIndex="rowIndex">
              <tr class="table-row">
                <td>
                  <div class="id-cell">
                    <p-badge 
                      [value]="row.id" 
                      severity="info" 
                      badgeSize="small">
                    </p-badge>
                  </div>
                </td>
                
                <td>
                  <div class="user-info">
                    <div class="user-avatar">
                      <p-avatar 
                        [label]="getInitials(row.nome)"
                        badgeSize="normal"
                        shape="circle"
                        styleClass="user-avatar-img">
                      </p-avatar>
                    </div>
                    <div class="user-details">
                      <span class="user-name">{{ row.nome || '-' }}</span>
                    </div>
                  </div>
                </td>
                
                <td>
                  <div class="email-cell">
                    <span class="email-text">{{ row.email || '-' }}</span>
                  </div>
                </td>
                
                <td>
                  <div class="perfil-cell">
                    <p-tag 
                      *ngIf="row.perfil?.nome"
                      [value]="row.perfil.nome | uiLabel:'perfil.label':row.perfil.codigo" 
                      severity="info" 
                      [rounded]="true"
                      badgeSize="small">
                    </p-tag>
                    <span *ngIf="!row.perfil?.nome" class="no-perfil">-</span>
                  </div>
                </td>
                
                <td>
                  <div class="status-cell">
                    <p-tag 
                      [value]="(row.ativo !== false ? 'common.status.active' : 'common.status.inactive') | translate" 
                      [severity]="row.ativo !== false ? 'success' : 'danger'" 
                      [rounded]="true"
                      badgeSize="small">
                    </p-tag>
                  </div>
                </td>
                
                <td>
                  <div class="date-cell">
                    <span class="date-text">{{ formatDate(row.dataCadastro) }}</span>
                  </div>
                </td>
                
                <td>
                  <div class="actions-cell">
                    <div class="action-buttons">
                      <button 
                        pButton 
                        type="button" 
                        icon="pi pi-pencil" 
                        class="p-button-text edit-btn"
                        (click)="initRowEdit(row, $event)"
                        [pTooltip]="'common.list.tooltip.edit' | translate"
                        tooltipPosition="top">
                      </button>
                      <button 
                        pButton 
                        type="button" 
                        icon="pi pi-share-alt" 
                        class="p-button-text delegacao-btn"
                        (click)="abrirDelegacao(row, $event)"
                        [pTooltip]="'usuarios.list.tooltip.delegation' | translate"
                        tooltipPosition="top">
                      </button>
                      <button 
                        pButton 
                        type="button" 
                        icon="pi pi-key" 
                        class="p-button-text password-btn"
                        (click)="resetPassword(row)"
                        [pTooltip]="'usuarios.list.tooltip.resetPassword' | translate"
                        tooltipPosition="top">
                      </button>
                      <button 
                        pButton 
                        type="button" 
                        icon="pi pi-trash" 
                        class="p-button-text delete-btn"
                        (click)="confirmDelete(row)"
                        [pTooltip]="'common.list.tooltip.delete' | translate"
                        tooltipPosition="top">
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </ng-template>
            
          </p-table>
            </app-list-data-states>
          </div>
        </div>
      </div>
    </div>

    <p-dialog
      styleClass="as-hero-dialog" [(visible)]="delegacaoDialogVisible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: 'min(720px, 96vw)' }"
      [header]="delegacaoDialogHeader"
      (onHide)="fecharDelegacaoDialog()">
      <div *ngIf="delegacaoUsuario" class="delegacao-dialog">
        <p class="delegacao-hint">{{ 'usuarios.delegation.hint' | translate }}</p>
        <div *ngIf="delegacaoLoading" class="delegacao-loading">
          <i class="pi pi-spin pi-spinner"></i> {{ 'usuarios.delegation.loading' | translate }}
        </div>
        <p-table
          *ngIf="!delegacaoLoading"
          [value]="delegacaoRows"
          styleClass="p-datatable-sm"
          [scrollable]="true"
          scrollHeight="220px">
          <ng-template pTemplate="header">
            <tr>
              <th>{{ 'usuarios.delegation.col.code' | translate }}</th>
              <th>{{ 'usuarios.delegation.col.start' | translate }}</th>
              <th>{{ 'usuarios.delegation.col.end' | translate }}</th>
              <th>{{ 'usuarios.delegation.col.state' | translate }}</th>
              <th style="width: 100px;"></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-d>
            <tr>
              <td><code>{{ d.funcionalidadeCodigo }}</code></td>
              <td>{{ formatDelegacaoDate(d.dataInicio) }}</td>
              <td>{{ formatDelegacaoDate(d.dataFim) || '—' }}</td>
              <td>
                <p-tag [value]="d.ativo ? ('usuarios.delegation.state.active' | translate) : ('usuarios.delegation.state.revoked' | translate)" [severity]="d.ativo ? 'success' : 'secondary'" [rounded]="true"></p-tag>
              </td>
              <td>
                <button
                  *ngIf="d.ativo"
                  pButton
                  type="button"
                  icon="pi pi-times"
                  class="p-button-text p-button-danger p-button-sm"
                  [pTooltip]="'usuarios.delegation.tooltip.revoke' | translate"
                  (click)="confirmarRevogarDelegacao(d)">
                </button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5">{{ 'usuarios.delegation.empty' | translate }}</td>
            </tr>
          </ng-template>
        </p-table>

        <div class="delegacao-nova">
          <h4>{{ 'usuarios.delegation.new' | translate }}</h4>
          <div class="field">
            <label for="delCod">{{ 'usuarios.delegation.field.code' | translate }}</label>
            <input id="delCod" type="text" pInputText [(ngModel)]="novoDelegacaoCodigo" [placeholder]="'usuarios.delegation.ph.code' | translate" class="w-full" />
          </div>
          <div class="field">
            <label>{{ 'usuarios.delegation.field.expires' | translate }}</label>
            <p-calendar
              [(ngModel)]="novoDelegacaoDataFim"
              [showIcon]="true"
              [showTime]="true"
              hourFormat="24"
              dateFormat="dd/mm/yy"
              [appendTo]="'body'"
              inputId="delFim"
              styleClass="w-full">
            </p-calendar>
          </div>
          <div class="field">
            <label for="delObs">{{ 'usuarios.delegation.field.note' | translate }}</label>
            <textarea id="delObs" pInputTextarea [(ngModel)]="novoDelegacaoObs" rows="2" class="w-full"></textarea>
          </div>
          <button pButton type="button" [label]="'usuarios.delegation.btn.add' | translate" icon="pi pi-check" class="p-button-sm" (click)="adicionarDelegacao()" [disabled]="delegacaoSaving || !novoDelegacaoCodigo.trim()"></button>
        </div>
      </div>
    </p-dialog>

    <!-- Confirmation Dialog -->
    <p-confirmDialog icon="pi pi-exclamation-triangle"></p-confirmDialog>

    <!-- Toast Messages -->
    <p-toast></p-toast>
  `,
  styleUrls: ['./usuario-list.component.scss', '../shared/styles/list-styles.scss']
})
export class UsuarioListComponent implements OnInit {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  private api = inject(UsuarioService);
  private delegacaoApi = inject(DelegacaoFuncionalidadeService);
  private confirmationService = inject(ConfirmationService);
  private i18n = inject(TranslationService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  delegacaoDialogVisible = false;
  delegacaoUsuario: any = null;
  delegacaoRows: DelegacaoFuncionalidade[] = [];
  delegacaoLoading = false;
  delegacaoSaving = false;
  novoDelegacaoCodigo = '';
  novoDelegacaoDataFim: Date | null = null;
  novoDelegacaoObs = '';
  
  // Expor Math para o template
  Math = Math;

  get delegacaoDialogHeader(): string {
    if (!this.delegacaoUsuario) {
      return this.i18n.translate('usuarios.delegation.title');
    }
    const name = this.delegacaoUsuario.nome || '';
    const id = String(this.delegacaoUsuario.id ?? '');
    return this.i18n.translate('usuarios.delegation.titleUser', { name, id });
  }

  rows: any[] = [];
  total = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  pageIndex = 0;
  sortField = 'id';
  sortOrder: 1 | -1 = 1;
  q = '';
  loading = true;
  private readonly requestGuard = createStaleRequestGuard();

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  ngOnInit() {
    // Carga inicial via onLazyLoad (mountContentWhileLoading)
    
    // Recarregar dados quando voltar da navegação (ex: após editar)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Verificar se estamos na rota de lista de usuários
      if (event.url === '/usuarios' || event.urlAfterRedirects === '/usuarios' || event.url.startsWith('/usuarios')) {
        // Aguardar um pouco para garantir que a navegação terminou
        setTimeout(() => {
          this.reload();
        }, 300);
      }
    });
    
    // Também verificar query params para refresh
    this.route.queryParams.subscribe(params => {
      if (params['refresh']) {
        this.reload();
      }
    });
  }

  toSort() {
    return `${this.sortField},${this.sortOrder === 1 ? 'asc' : 'desc'}`;
  }

  reload() {
    const seq = this.requestGuard.bump();
    this.loading = true;
    this.api.list({ 
      page: this.pageIndex, 
      size: this.size, 
      sort: this.toSort(), 
      q: this.q.trim() || undefined 
    }).subscribe({
      next: (r) => {
        if (this.requestGuard.isStale(seq)) {
          return;
        }
        this.rows = r.items || [];
        this.total = r.totalElements || 0;
        this.size = r.size || this.size;
        this.pageIndex = r.page !== undefined ? r.page : this.pageIndex;
        this.loading = false;
      },
      error: (error) => {
        if (this.requestGuard.isStale(seq)) {
          return;
        }
        console.error('Failed to load users:', error);
        this.loading = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'usuario.list.toast.loadUsersError');
      }
    });
  }

  loadLazy(e?: LazyLoadEvent) {
    const req = resolveLazyPageRequest(e, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    if (e?.sortField) this.sortField = e.sortField;
    if (e?.sortOrder) this.sortOrder = e.sortOrder;
    this.reload();
  }

  buscar() {
    this.pageIndex = 0;
    this.loadLazy({ first: 0, rows: this.size });
  }

  clear() {
    this.q = '';
    this.buscar();
  }

  getDisplayedCount(): string {
    const total = this.total ?? 0;
    const startIndex = total === 0 ? 0 : (this.pageIndex || 0) * (this.size || 0) + (this.rows?.length ? 1 : 0);
    const endIndex = (this.pageIndex || 0) * (this.size || 0) + (this.rows?.length || 0);
    return total === 0 ? '0–0' : `${startIndex}–${endIndex}`;
  }

  initRowEdit(row: any, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    if (!row || !row.id) {
      console.error('Invalid user for edit:', row);
      this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'usuario.list.toast.editInvalid');
      return;
    }
    
    // Navegar para a tela de edição do usuário
    this.router.navigate(['usuarios', 'edit', row.id], { relativeTo: null }).then(
      (success) => {
        if (!success) {
          console.error('Navigation failed');
          this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'usuario.list.toast.editNavigateFail');
        }
      }
    ).catch(error => {
      console.error('Failed to navigate to edit:', error);
      this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'usuario.list.toast.editNavigateErrorDetail', {
        msg: String(error?.message || this.i18n.translate('usuario.list.toast.unknownError'))
      });
    });
  }

  addNew() {
    // Navegar para a tela de novo usuário
    this.router.navigate(['/usuarios/new']);
  }

  resetPassword(row: any) {
    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.usuario.resetPassword.message', { name: String(row?.nome ?? '') }),
      header: 'confirm.header.resetPassword',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'common.confirm.yesResetPassword',
      rejectLabel: 'common.confirm.cancel',
      accept: () => {
        if (!row?.id) {
          this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'usuario.list.toast.deleteMissingId');
          return;
        }
        this.api.solicitarResetSenha(row.id).subscribe({
          next: (res) => {
            this.i18n.addToast(
              this.messageService,
              'success',
              'common.toast.success',
              'usuario.list.toast.resetPasswordSent',
              { email: String(row?.email ?? '') }
            );
          },
          error: () => {
            this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'usuario.list.toast.resetPasswordError');
          }
        });
      }
    });
  }

  confirmDelete(row: any) {
    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.usuario.inactivate.message', { name: String(row?.nome ?? '') }),
      header: 'confirm.header.inactivate',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'common.confirm.yesInactivate',
      rejectLabel: 'common.confirm.cancel',
      accept: () => {
        this.deleteUsuario(row);
      }
    });
  }

  deleteUsuario(usuario: any) {
    
    if (!usuario || !usuario.id) {
      console.error('ERROR: User ID not found');
      this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'usuario.list.toast.deleteMissingId');
      return;
    }
    
    
    this.api.delete(usuario.id).subscribe({
      next: (response: any) => {
        const message = response?.message || (response?.success ? this.i18n.translate('usuario.list.toast.deleteSuccessInactivated') : this.i18n.translate('usuario.list.toast.deleteSuccessDone'));
        this.i18n.addToastLiteralDetail(this.messageService, 'success', 'common.toast.success', message);
        // Aguardar um pouco antes de recarregar para garantir que o backend processou a exclusão
        setTimeout(() => {
          this.reload();
        }, 500);
      },
      error: (error: any) => {
        console.error('Failed to delete user:', error);
        
        const errorMessage = extractApiErrorMessage(error, this.i18n, 'usuario.list.toast.deleteErrorFallback');
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', errorMessage);
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return formatUiDateTime(this.i18n.getCurrentLanguage(), date, 'date');
  }

  abrirDelegacao(row: any, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (!row?.id) {
      this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'usuario.list.toast.delegacaoInvalidUser');
      return;
    }
    this.delegacaoUsuario = row;
    this.delegacaoDialogVisible = true;
    this.novoDelegacaoCodigo = '';
    this.novoDelegacaoDataFim = null;
    this.novoDelegacaoObs = '';
    this.carregarDelegacoes();
  }

  fecharDelegacaoDialog() {
    this.delegacaoDialogVisible = false;
    this.delegacaoUsuario = null;
    this.delegacaoRows = [];
  }

  carregarDelegacoes() {
    if (!this.delegacaoUsuario?.id) {
      return;
    }
    this.delegacaoLoading = true;
    this.delegacaoApi.listarPorUsuario(this.delegacaoUsuario.id).subscribe({
      next: (rows) => {
        this.delegacaoRows = rows || [];
        this.delegacaoLoading = false;
      },
      error: () => {
        this.delegacaoLoading = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'usuario.list.toast.delegacaoLoadError');
      }
    });
  }

  adicionarDelegacao() {
    const codigo = (this.novoDelegacaoCodigo || '').trim();
    if (!codigo || !this.delegacaoUsuario?.id) {
      return;
    }
    this.delegacaoSaving = true;
    const payload: { usuarioGranteeId: number; funcionalidadeCodigo: string; dataFim?: string; observacao?: string } = {
      usuarioGranteeId: this.delegacaoUsuario.id,
      funcionalidadeCodigo: codigo
    };
    if (this.novoDelegacaoDataFim) {
      const d = this.novoDelegacaoDataFim;
      const p = (n: number) => String(n).padStart(2, '0');
      payload.dataFim = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
    }
    const obs = (this.novoDelegacaoObs || '').trim();
    if (obs) {
      payload.observacao = obs;
    }
    this.delegacaoApi.criar(payload).subscribe({
      next: () => {
        this.delegacaoSaving = false;
        this.novoDelegacaoCodigo = '';
        this.novoDelegacaoDataFim = null;
        this.novoDelegacaoObs = '';
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'usuario.list.toast.delegacaoCreated');
        this.carregarDelegacoes();
      },
      error: (err) => {
        this.delegacaoSaving = false;
        const msg = extractApiErrorMessage(err, this.i18n, 'usuario.list.toast.delegacaoCreateFallback');
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', msg);
      }
    });
  }

  confirmarRevogarDelegacao(d: DelegacaoFuncionalidade) {
    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.usuario.revokeDelegation.message', {
        codigo: String(d.funcionalidadeCodigo ?? '')
      }),
      header: 'confirm.header.confirm',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'common.confirm.revoke',
      rejectLabel: 'common.confirm.cancel',
      accept: () => {
        this.delegacaoApi.revogar(d.id).subscribe({
          next: () => {
            this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'usuario.list.toast.delegacaoRevoked');
            this.carregarDelegacoes();
          },
          error: () => {
            this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'usuario.list.toast.delegacaoRevokeError');
          }
        });
      }
    });
  }

  formatDelegacaoDate(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const t = Date.parse(value);
    if (Number.isNaN(t)) {
      return String(value);
    }
    return formatUiDateTime(this.i18n.getCurrentLanguage(), t, 'dateTime');
  }
}
