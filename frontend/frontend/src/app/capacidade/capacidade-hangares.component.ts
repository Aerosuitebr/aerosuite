import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { HangarCapacidadeService, HangarWrite } from '../core/hangar-capacidade.service';
import { HangarOption } from '../core/capacidade-fila.service';
import { extractApiErrorKey } from '../core/api-error';
import { HttpErrorResponse } from '@angular/common/http';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';

@Component({
  selector: 'app-capacidade-hangares',
  standalone: true,
  imports: [
    ListTableScrollDirective,
    CommonModule,
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    ToastModule,
    TranslatePipe,
    PageHeroComponent,
    ListDataStatesComponent
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="hangar-admin">
      <app-page-hero
        variant="navy"
        titleKey="capacidade.hangar.title"
        subtitleKey="capacidade.hangar.subtitle"
        titleIcon="pi-home"
        [hasActions]="true">
        <div actions class="hero-actions">
          <a routerLink="/capacidade" class="back"><i class="pi pi-arrow-left"></i> {{ 'capacidade.hangar.back' | translate }}</a>
          <button pButton type="button" icon="pi pi-plus" [label]="'capacidade.hangar.new' | translate" (click)="abrirNovo()"></button>
        </div>
      </app-page-hero>
      <app-list-data-states
        [loading]="loading"
        [itemCount]="hangares.length"
        [skeletonRows]="6"
        [skeletonCols]="5"
        emptyTitleKey="capacidade.hangar.empty.title"
        emptyDescriptionKey="ui.empty.description">
        <button emptyAction pButton type="button" icon="pi pi-plus" [label]="'capacidade.hangar.new' | translate" (click)="abrirNovo()"></button>
      <p-table appListScroll [value]="hangares" [loading]="loading" styleClass="p-datatable-sm">
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'capacidade.hangar.col.codigo' | translate }}</th>
            <th>{{ 'capacidade.hangar.col.nome' | translate }}</th>
            <th>{{ 'capacidade.hangar.col.ordem' | translate }}</th>
            <th>{{ 'capacidade.hangar.col.ativo' | translate }}</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-h>
          <tr>
            <td>{{ h.codigo }}</td>
            <td>{{ h.nome }}</td>
            <td>{{ h.ordem }}</td>
            <td>{{ h.ativo ? ('capacidade.hangar.yes' | translate) : ('capacidade.hangar.no' | translate) }}</td>
            <td>
              <button pButton type="button" class="p-button-text" icon="pi pi-pencil" (click)="abrirEditar(h)"></button>
            </td>
          </tr>
        </ng-template>
      </p-table>
      </app-list-data-states>
    </div>

    <p-dialog
      styleClass="as-hero-dialog" [(visible)]="dialogVisible"
      [header]="editId ? ('capacidade.hangar.edit' | translate) : ('capacidade.hangar.new' | translate)"
      [modal]="true"
      [style]="{ width: '420px' }">
      <div class="field">
        <label>{{ 'capacidade.hangar.col.codigo' | translate }}</label>
        <input pInputText [(ngModel)]="form.codigo" class="w-full" />
      </div>
      <div class="field">
        <label>{{ 'capacidade.hangar.col.nome' | translate }}</label>
        <input pInputText [(ngModel)]="form.nome" class="w-full" />
      </div>
      <div class="field">
        <label>{{ 'capacidade.hangar.col.ordem' | translate }}</label>
        <p-inputNumber [(ngModel)]="form.ordem" [min]="0" styleClass="w-full"></p-inputNumber>
      </div>
      <div class="field chk">
        <p-checkbox [(ngModel)]="form.ativo" [binary]="true" inputId="hangar-ativo"></p-checkbox>
        <label for="hangar-ativo">{{ 'capacidade.hangar.col.ativo' | translate }}</label>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" class="p-button-text" [label]="'capacidade.btn.cancel' | translate" (click)="dialogVisible = false"></button>
        <button pButton type="button" [label]="'capacidade.btn.save' | translate" [loading]="saving" (click)="salvar()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
      .hangar-admin {
        padding: 1.5rem;
        max-width: 900px;
      }
      .hero-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .back {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        color: #0ea5e9;
        text-decoration: none;
      }
      .field {
        margin-bottom: 1rem;
      }
      .field label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.35rem;
      }
      .chk {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .w-full {
        width: 100%;
      }
    `
  ]
})
export class CapacidadeHangaresComponent implements OnInit {
  private svc = inject(HangarCapacidadeService);
  private i18n = inject(TranslationService);
  private toast = inject(MessageService);

  hangares: HangarOption[] = [];
  loading = true;
  dialogVisible = false;
  saving = false;
  editId: number | null = null;
  form: HangarWrite & { ativo: boolean } = { codigo: '', nome: '', ordem: 0, ativo: true };

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.svc.listar(true).subscribe({
      next: list => {
        this.hangares = list;
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.errToast(err);
      }
    });
  }

  abrirNovo(): void {
    this.editId = null;
    this.form = { codigo: '', nome: '', ordem: this.hangares.length + 1, ativo: true };
    this.dialogVisible = true;
  }

  abrirEditar(h: HangarOption): void {
    this.editId = h.id;
    this.form = {
      codigo: h.codigo,
      nome: h.nome,
      ordem: h.ordem ?? 0,
      ativo: h.ativo !== false
    };
    this.dialogVisible = true;
  }

  salvar(): void {
    this.saving = true;
    const body: HangarWrite = {
      codigo: this.form.codigo.trim(),
      nome: this.form.nome.trim(),
      ordem: this.form.ordem,
      ativo: this.form.ativo
    };
    const req =
      this.editId != null ? this.svc.atualizar(this.editId, body) : this.svc.criar(body);
    req.subscribe({
      next: () => {
        this.saving = false;
        this.dialogVisible = false;
        this.toast.add({ severity: 'success', summary: this.i18n.translate('capacidade.hangar.saved') });
        this.carregar();
      },
      error: err => {
        this.saving = false;
        this.errToast(err);
      }
    });
  }

  private errToast(err: unknown): void {
    let key = 'capacidade.err.load';
    if (err instanceof HttpErrorResponse) {
      key = extractApiErrorKey(err.error) ?? key;
    }
    this.toast.add({ severity: 'error', summary: this.i18n.translate(key) });
  }
}
