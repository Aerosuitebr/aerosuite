import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FuncionalidadeService, Funcionalidade } from '../core/funcionalidade.service';
import { TranslationService } from '../core/translation.service';
import { toastKey } from '../core/toast-i18n.util';
import { TranslatePipe } from '../core/translate.pipe';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';
import { FUNC_MENU_SECTION_VALUES } from '../core/domain/func-menu-sections.data';

@Component({
  selector: 'app-funcionalidade-list',
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
    DropdownModule,
    CheckboxModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    TooltipModule,
    TranslatePipe,
    PageHeroComponent,
    ListDataStatesComponent
  ],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="funcionalidade-container">
      <app-page-hero
        variant="navy"
        titleKey="funcionalidades.list.title"
        subtitleKey="funcionalidades.list.subtitle"
        titleIcon="pi-sparkles"
        [hasActions]="true">
        <div actions class="header-actions">
          <button
            pButton
            type="button"
            [label]="'funcionalidades.list.btnNew' | translate"
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
          [itemCount]="funcionalidades.length"
          [skeletonRows]="8"
          [skeletonCols]="9"
          emptyTitleKey="ui.empty.title"
          emptyDescriptionKey="ui.empty.description">
        <p-table appListScroll 
          [value]="funcionalidades" 
          [loading]="loading"
          [paginator]="true" 
          [rows]="listPageSize"
          [showCurrentPageReport]="true"
          [currentPageReportTemplate]="'funcionalidades.list.pageReport' | translate"
          [rowsPerPageOptions]="listRowsPerPageOptions"
          styleClass="p-datatable-gridlines">
          
          <ng-template pTemplate="header">
            <tr>
              <th>{{ 'common.list.col.name' | translate }}</th>
              <th>{{ 'common.list.col.code' | translate }}</th>
              <th>{{ 'funcionalidades.list.col.section' | translate }}</th>
              <th>{{ 'funcionalidades.list.col.type' | translate }}</th>
              <th>{{ 'funcionalidades.list.col.icon' | translate }}</th>
              <th>{{ 'funcionalidades.list.col.route' | translate }}</th>
              <th>{{ 'funcionalidades.list.col.position' | translate }}</th>
              <th>{{ 'common.list.col.status' | translate }}</th>
              <th>{{ 'common.list.col.actions' | translate }}</th>
            </tr>
          </ng-template>
          
          <ng-template pTemplate="body" let-funcionalidade>
            <tr>
              <td>
                <div class="funcionalidade-info">
                  <strong>{{ funcionalidade.nome }}</strong>
                  <small *ngIf="funcionalidade.descricao" class="descricao">{{ funcionalidade.descricao }}</small>
                </div>
              </td>
              <td>
                <span class="codigo">{{ funcionalidade.codigo }}</span>
              </td>
              <td>
                <span class="secao">{{ funcionalidade.secao || '-' }}</span>
              </td>
              <td>
                <span class="tipo">{{ funcionalidade.tipo || '-' }}</span>
              </td>
              <td>
                <i *ngIf="funcionalidade.icone" [class]="funcionalidade.icone" [style.color]="funcionalidade.corIcone"></i>
                <span *ngIf="!funcionalidade.icone" class="text-muted">-</span>
              </td>
              <td>
                <span class="rota">{{ funcionalidade.rota || '-' }}</span>
              </td>
              <td>
                <span class="posicao">{{ funcionalidade.posicao || '-' }}</span>
              </td>
              <td>
                <p-tag 
                  [value]="(funcionalidade.ativo ? 'common.status.active' : 'common.status.inactive') | translate"
                  [severity]="funcionalidade.ativo ? 'success' : 'danger'">
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
                    (click)="editar(funcionalidade)">
                  </button>
                  <button 
                    pButton 
                    type="button" 
                    icon="pi pi-trash" 
                    class="p-button-text p-button-sm p-button-danger"
                    [pTooltip]="'common.list.tooltip.delete' | translate"
                    (click)="confirmarExclusao(funcionalidade)">
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
        styleClass="as-hero-dialog" [header]="(editando ? 'funcionalidades.list.dialog.edit' : 'funcionalidades.list.dialog.new') | translate" 
        [(visible)]="dialogVisible" 
        [modal]="true" 
        [style]="{width: '500px'}"
        [closable]="true">
        
        <form (ngSubmit)="salvar()" #funcionalidadeForm="ngForm">
          <div class="form-grid">
            <div class="field">
              <label for="nome">{{ 'common.list.col.name' | translate }} *</label>
              <input 
                pInputText 
                id="nome" 
                name="nome" 
                [(ngModel)]="funcionalidadeEdit.nome" 
                required 
                #nome="ngModel">
              <small *ngIf="nome.invalid && nome.touched" class="p-error">{{ 'funcionalidades.list.validation.nameRequired' | translate }}</small>
            </div>

            <div class="field">
              <label for="codigo">{{ 'common.list.col.code' | translate }} *</label>
              <input 
                pInputText 
                id="codigo" 
                name="codigo" 
                [(ngModel)]="funcionalidadeEdit.codigo" 
                required 
                #codigo="ngModel">
              <small *ngIf="codigo.invalid && codigo.touched" class="p-error">{{ 'funcionalidades.list.validation.codeRequired' | translate }}</small>
            </div>

            <div class="field">
              <label for="icone">{{ 'funcionalidades.list.col.icon' | translate }}</label>
              <input 
                pInputText 
                id="icone" 
                name="icone" 
                [(ngModel)]="funcionalidadeEdit.icone"
                [placeholder]="'funcionalidades.list.form.iconPlaceholder' | translate">
            </div>

            <div class="field">
              <label for="rota">{{ 'funcionalidades.list.col.route' | translate }}</label>
              <input 
                pInputText 
                id="rota" 
                name="rota" 
                [(ngModel)]="funcionalidadeEdit.rota"
                [placeholder]="'funcionalidades.list.form.routePlaceholder' | translate">
            </div>

            <div class="field">
              <label for="ordem">{{ 'funcionalidades.list.form.order' | translate }}</label>
              <input 
                pInputText 
                id="ordem" 
                name="ordem" 
                type="number"
                [(ngModel)]="funcionalidadeEdit.ordem">
            </div>

            <div class="field">
              <label for="descricao">{{ 'common.list.col.description' | translate }}</label>
              <textarea 
                pInputTextarea 
                id="descricao" 
                name="descricao" 
                [(ngModel)]="funcionalidadeEdit.descricao"
                rows="3">
              </textarea>
            </div>

            <div class="field">
              <label for="secao">{{ 'funcionalidades.list.col.section' | translate }} *</label>
              <p-dropdown 
                id="secao" 
                name="secao" 
                [(ngModel)]="funcionalidadeEdit.secao" 
                [options]="secoes" 
                [placeholder]="'funcionalidades.list.form.selectSection' | translate"
                required>
              </p-dropdown>
            </div>

            <div class="field">
              <label for="tipo">{{ 'funcionalidades.list.col.type' | translate }} *</label>
              <p-dropdown 
                id="tipo" 
                name="tipo" 
                [(ngModel)]="funcionalidadeEdit.tipo" 
                [options]="tipos" 
                [placeholder]="'funcionalidades.list.form.selectType' | translate"
                required>
              </p-dropdown>
            </div>

            <div class="field">
              <label for="corIcone">{{ 'funcionalidades.list.form.iconColor' | translate }}</label>
              <input 
                pInputText 
                id="corIcone" 
                name="corIcone" 
                [(ngModel)]="funcionalidadeEdit.corIcone"
                [placeholder]="'funcionalidades.list.form.iconColorPlaceholder' | translate">
            </div>

            <div class="field">
              <label for="posicao">{{ 'funcionalidades.list.col.position' | translate }}</label>
              <input 
                pInputText 
                id="posicao" 
                name="posicao" 
                type="number"
                [(ngModel)]="funcionalidadeEdit.posicao">
            </div>

            <div class="field">
              <p-checkbox 
                [(ngModel)]="funcionalidadeEdit.visivel" 
                inputId="visivel">
              </p-checkbox>
              <label for="visivel">{{ 'funcionalidades.list.form.visibleMenu' | translate }}</label>
            </div>

            <div class="field">
              <p-checkbox 
                [(ngModel)]="funcionalidadeEdit.ativo" 
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
            [label]="(editando ? 'funcionalidades.list.dialog.btnUpdate' : 'funcionalidades.list.dialog.btnCreate') | translate" 
            icon="pi pi-check" 
            class="p-button-primary"
            (click)="salvar()"
            [disabled]="!funcionalidadeForm.valid">
          </button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styleUrls: ['./funcionalidade-list.component.scss']
})
export class FuncionalidadeListComponent implements OnInit {
  readonly listPageSize = DEFAULT_LIST_PAGE_SIZE;
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  funcionalidades: Funcionalidade[] = [];
  loading = true;
  dialogVisible = false;
  editando = false;
  funcionalidadeEdit: Partial<Funcionalidade> = {
    nome: '',
    codigo: '',
    icone: '',
    rota: '',
    ordem: 0,
    descricao: '',
    secao: 'Sistema',
    parentId: undefined,
    tipo: 'funcionalidade',
    visivel: true,
    corIcone: '',
    posicao: 0,
    ativo: true
  };

  private readonly secaoDefs = FUNC_MENU_SECTION_VALUES.map((value) => ({ label: value, value }));

  private readonly tipoDefs = [
    { label: 'funcionalidade', value: 'funcionalidade' as const },
    { label: 'secao', value: 'secao' as const },
    { label: 'submenu', value: 'submenu' as const }
  ].map((d) => ({ label: d.value, value: d.value }));

  get secoes() {
    return this.i18n.buildTranslatedOptions('func.menu.section', this.secaoDefs);
  }

  get tipos() {
    return this.i18n.buildTranslatedOptions('func.tipo', this.tipoDefs);
  }

  constructor(
    private funcionalidadeService: FuncionalidadeService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private i18n: TranslationService
  ) {}

  ngOnInit() {
    this.carregarFuncionalidades();
  }

  carregarFuncionalidades() {
    this.loading = true;
    this.funcionalidadeService.listarTodas().subscribe({
      next: (funcionalidades) => {
        this.funcionalidades = funcionalidades;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load permissions:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'funcionalidades.list.toast.loadError');
        this.loading = false;
      }
    });
  }

  abrirDialog() {
    this.editando = false;
    this.funcionalidadeEdit = {
      nome: '',
      codigo: '',
      icone: '',
      rota: '',
      ordem: 0,
      descricao: '',
      ativo: true
    };
    this.dialogVisible = true;
  }

  editar(funcionalidade: Funcionalidade) {
    this.editando = true;
    this.funcionalidadeEdit = { ...funcionalidade };
    this.dialogVisible = true;
  }

  salvar() {
    if (this.editando) {
      this.funcionalidadeService.atualizar(this.funcionalidadeEdit.id!, this.funcionalidadeEdit).subscribe({
        next: () => {
          toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'funcionalidades.list.toast.updateSuccess');
          this.fecharDialog();
          this.carregarFuncionalidades();
        },
        error: (error) => {
          console.error('Failed to update permission:', error);
          toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'funcionalidades.list.toast.updateError');
        }
      });
    } else {
      this.funcionalidadeService.criar(this.funcionalidadeEdit).subscribe({
        next: () => {
          toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'funcionalidades.list.toast.createSuccess');
          this.fecharDialog();
          this.carregarFuncionalidades();
        },
        error: (error) => {
          console.error('Failed to create permission:', error);
          toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'funcionalidades.list.toast.createError');
        }
      });
    }
  }

  fecharDialog() {
    this.dialogVisible = false;
    this.funcionalidadeEdit = {
      nome: '',
      codigo: '',
      icone: '',
      rota: '',
      ordem: 0,
      descricao: '',
      ativo: true
    };
  }

  confirmarExclusao(funcionalidade: Funcionalidade) {
    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.funcionalidade.message', { name: String(funcionalidade?.nome ?? '') }),
      header: 'confirm.header.inactivate',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'common.confirm.yesInactivate',
      rejectLabel: 'common.confirm.cancel',
      accept: () => {
        this.excluir(funcionalidade.id);
      }
    });
  }

  excluir(id: number) {
    this.funcionalidadeService.deletar(id).subscribe({
      next: () => {
        toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'funcionalidades.list.toast.inactivateSuccess');
        this.carregarFuncionalidades();
      },
      error: (error) => {
        console.error('Failed to deactivate permission:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'funcionalidades.list.toast.inactivateError');
      }
    });
  }
}
