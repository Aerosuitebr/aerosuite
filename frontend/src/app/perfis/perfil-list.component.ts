import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PerfilService, Perfil } from '../core/perfil.service';
import { TranslationService } from '../core/translation.service';
import { toastKey } from '../core/toast-i18n.util';
import { TranslatePipe } from '../core/translate.pipe';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';

@Component({
  selector: 'app-perfil-list',
  standalone: true,
  imports: [
    ListTableScrollDirective,
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputTextareaModule,
    TagModule,
    TooltipModule,
    CheckboxModule,
    ToastModule,
    ConfirmDialogModule,
    TranslatePipe,
    PageHeroComponent,
    ListDataStatesComponent
  ],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="perfil-container">
      <app-page-hero
        variant="navy"
        titleKey="perfis.list.title"
        subtitleKey="perfis.list.subtitle"
        titleIcon="pi-users"
        [hasActions]="true">
        <div actions class="header-actions">
          <button
            pButton
            type="button"
            [label]="'perfis.list.btnNew' | translate"
            icon="pi pi-plus"
            class="p-button-primary"
            (click)="abrirDialog()">
          </button>
        </div>
      </app-page-hero>

      <!-- Tabela -->
      <div class="table-container">
        <app-list-data-states
          [loading]="loading"
          [itemCount]="perfis.length"
          [skeletonRows]="8"
          [skeletonCols]="5"
          emptyTitleKey="ui.empty.title"
          emptyDescriptionKey="ui.empty.description">
        <p-table appListScroll
          [value]="perfis"
          [loading]="loading"
          [paginator]="true" 
          [rows]="listPageSize"
          [showCurrentPageReport]="true"
          [currentPageReportTemplate]="'perfis.list.pageReport' | translate"
          [rowsPerPageOptions]="listRowsPerPageOptions"
          styleClass="p-datatable-gridlines">
          
          <ng-template pTemplate="header">
            <tr>
              <th>{{ 'common.list.col.name' | translate }}</th>
              <th>{{ 'perfis.list.col.code' | translate }}</th>
              <th>{{ 'common.list.col.description' | translate }}</th>
              <th>{{ 'common.list.col.status' | translate }}</th>
              <th>{{ 'common.list.col.actions' | translate }}</th>
            </tr>
          </ng-template>
          
          <ng-template pTemplate="body" let-perfil>
            <tr>
              <td>
                <div class="perfil-info">
                  <strong>{{ perfil.nome }}</strong>
                </div>
              </td>
              <td>
                <span class="codigo">{{ perfil.codigo }}</span>
              </td>
              <td>
                <span class="descricao">{{ perfil.descricao || '-' }}</span>
              </td>
              <td>
                <p-tag 
                  [value]="(perfil.ativo ? 'common.status.active' : 'common.status.inactive') | translate"
                  [severity]="perfil.ativo ? 'success' : 'danger'">
                </p-tag>
              </td>
              <td>
                <div class="actions">
                  <button 
                    pButton 
                    type="button" 
                    icon="pi pi-pencil" 
                    class="p-button-text p-button-sm"
                    [pTooltip]="'common.list.tooltip.edit' | translate"
                    (click)="editar(perfil)">
                  </button>
                  <button 
                    pButton 
                    type="button" 
                    icon="pi pi-trash" 
                    class="p-button-text p-button-sm p-button-danger"
                    [pTooltip]="'common.list.tooltip.delete' | translate"
                    (click)="confirmarExclusao(perfil)">
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
        </app-list-data-states>
      </div>

      <!-- Dialog de Edição -->
      <p-dialog 
        styleClass="as-hero-dialog" [header]="(editando ? 'perfis.list.dialog.edit' : 'perfis.list.dialog.new') | translate" 
        [(visible)]="dialogVisible" 
        [modal]="true" 
        [style]="{width: '500px'}"
        [closable]="true">
        
        <form (ngSubmit)="salvar()" #perfilForm="ngForm">
          <div class="form-grid">
            <div class="field">
              <label for="nome">{{ 'common.list.col.name' | translate }} *</label>
              <input 
                pInputText 
                id="nome" 
                name="nome" 
                [(ngModel)]="perfilEdit.nome" 
                required 
                #nome="ngModel">
              <small *ngIf="nome.invalid && nome.touched" class="p-error">{{ 'perfis.list.validation.nameRequired' | translate }}</small>
            </div>

            <div class="field">
              <label for="codigo">{{ 'perfis.list.col.code' | translate }} *</label>
              <input 
                pInputText 
                id="codigo" 
                name="codigo" 
                [(ngModel)]="perfilEdit.codigo" 
                required 
                #codigo="ngModel">
              <small *ngIf="codigo.invalid && codigo.touched" class="p-error">{{ 'perfis.list.validation.codeRequired' | translate }}</small>
            </div>

            <div class="field">
              <label for="descricao">{{ 'common.list.col.description' | translate }}</label>
              <textarea 
                pInputTextarea 
                id="descricao" 
                name="descricao" 
                [(ngModel)]="perfilEdit.descricao"
                rows="3">
              </textarea>
            </div>

            <div class="field">
              <p-checkbox 
                [(ngModel)]="perfilEdit.ativo" 
                inputId="ativo">
              </p-checkbox>
              <label for="ativo">{{ 'common.status.active' | translate }}</label>
            </div>
          </div>
        </form>

        <ng-template pTemplate="footer">
          <button 
            pButton 
            type="button" 
            [label]="'common.actions.cancel' | translate" 
            icon="pi pi-times" 
            class="p-button-text"
            (click)="fecharDialog()">
          </button>
          <button 
            pButton 
            type="button" 
            [label]="(editando ? 'perfis.list.dialog.btnUpdate' : 'perfis.list.dialog.btnCreate') | translate" 
            icon="pi pi-check" 
            class="p-button-primary"
            (click)="salvar()"
            [disabled]="!perfilForm.valid">
          </button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styleUrls: ['./perfil-list.component.scss']
})
export class PerfilListComponent implements OnInit {
  readonly listPageSize = DEFAULT_LIST_PAGE_SIZE;
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  perfis: Perfil[] = [];
  loading = true;
  dialogVisible = false;
  editando = false;

  perfilEdit: Partial<Perfil> = {
    nome: '',
    codigo: '',
    descricao: '',
    ativo: true
  };

  constructor(
    private perfilService: PerfilService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private i18n: TranslationService
  ) {}

  ngOnInit() {
    this.carregarPerfis();
  }

  carregarPerfis() {
    this.loading = true;
    this.perfilService.listarTodos().subscribe({
      next: (perfis) => {
        this.perfis = perfis;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load profiles:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'perfis.list.toast.loadError');
        this.loading = false;
      }
    });
  }

  abrirDialog() {
    this.editando = false;
    this.perfilEdit = {
      nome: '',
      codigo: '',
      descricao: '',
      ativo: true
    };
    this.dialogVisible = true;
  }

  editar(perfil: Perfil) {
    this.editando = true;
    this.perfilEdit = { ...perfil };
    this.dialogVisible = true;
  }

  salvar() {
    if (this.editando) {
      this.perfilService.atualizar(this.perfilEdit.id!, this.perfilEdit).subscribe({
        next: () => {
          toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'perfis.list.toast.updateSuccess');
          this.fecharDialog();
          this.carregarPerfis();
        },
        error: (error) => {
          console.error('Failed to update profile:', error);
          toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'perfis.list.toast.updateError');
        }
      });
    } else {
      this.perfilService.criar(this.perfilEdit).subscribe({
        next: () => {
          toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'perfis.list.toast.createSuccess');
          this.fecharDialog();
          this.carregarPerfis();
        },
        error: (error) => {
          console.error('Failed to create profile:', error);
          toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'perfis.list.toast.createError');
        }
      });
    }
  }

  fecharDialog() {
    this.dialogVisible = false;
    this.perfilEdit = {
      nome: '',
      codigo: '',
      descricao: '',
      ativo: true
    };
  }

  confirmarExclusao(perfil: Perfil) {
    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.perfil.message', { name: String(perfil?.nome ?? '') }),
      header: 'confirm.header.inactivate',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'common.confirm.yesInactivate',
      rejectLabel: 'common.confirm.cancel',
      accept: () => {
        this.excluir(perfil.id);
      }
    });
  }

  excluir(id: number) {
    this.perfilService.deletar(id).subscribe({
      next: () => {
        toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'perfis.list.toast.inactivateSuccess');
        this.carregarPerfis();
      },
      error: (error) => {
        console.error('Failed to deactivate profile:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'perfis.list.toast.inactivateError');
      }
    });
  }
}
