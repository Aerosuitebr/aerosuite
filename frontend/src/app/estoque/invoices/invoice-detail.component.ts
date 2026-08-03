import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, forkJoin, of, Subject, switchMap, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import {
  EstoqueService,
  Invoice,
  InvoiceItem,
  ItemEstoque,
  Lote,
  InvoiceAuditoria,
  InvoiceInativacaoValidacao
} from '../../core/estoque.service';
import { TranslationService } from '../../core/translation.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { LocaleMoneyPipe } from '../../core/locale/locale-money.pipe';
import { IsoLocalDatePipe } from '../../core/locale/iso-local-date.pipe';
import { DialogNoteFieldComponent } from '../../shared/dialog-note-field/dialog-note-field.component';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { DEFAULT_LIST_PAGE_SIZE } from '../../core/list-pagination.constants';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    DialogModule,
    InputTextareaModule,
    TagModule,
    TabViewModule,
    TableModule,
    ProgressBarModule,
    SkeletonModule,
    TooltipModule,
    ToastModule,
    TranslatePipe,
    LocaleMoneyPipe,
    IsoLocalDatePipe,
    PageHeroComponent,
    DialogNoteFieldComponent
  ],
  providers: [MessageService],
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.scss']
})
export class InvoiceDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private estoque = inject(EstoqueService);
  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);
  private destroy$ = new Subject<void>();

  readonly detailMoneyOpts = { showFootnote: false };
  readonly listPageSize = DEFAULT_LIST_PAGE_SIZE;

  invoice: Invoice | null = null;
  itensEstoque: ItemEstoque[] = [];
  lotes: Lote[] = [];
  auditorias: InvoiceAuditoria[] = [];
  loadingAuditoria = false;
  loading = true;
  loadError: string | null = null;
  activeTab = 0;

  showMotivoDialog = false;
  showBloqueioDialog = false;
  showCancelarDialog = false;
  showRestaurarDialog = false;
  motivoAcao = '';
  validacaoInativacao: InvoiceInativacaoValidacao | null = null;
  acaoProcessando = false;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          const id = Number(params.get('id'));
          if (!id || Number.isNaN(id)) {
            this.loadError = this.i18n.translate('estoque.invoices.detail.errorInvalidId');
            this.loading = false;
            this.cdr.markForCheck();
            return of(null);
          }
          this.loading = true;
          this.loadError = null;
          this.cdr.markForCheck();
          return forkJoin({
            invoice: this.estoque.buscarInvoice(id),
            itens: this.estoque.listarItensEstoque({ invoiceId: id, size: 200, page: 0 }),
            lotes: this.estoque.listarLotes({ invoiceId: id, size: 100, page: 0 }),
            auditorias: this.estoque.listarAuditoriaInvoice(id).pipe(catchError(() => of([] as InvoiceAuditoria[])))
          });
        })
      )
      .subscribe({
        next: result => {
          if (!result) return;
          this.invoice = result.invoice;
          this.itensEstoque = result.itens.content ?? [];
          this.lotes = result.lotes.content ?? [];
          this.auditorias = result.auditorias ?? [];
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.loading = false;
          this.loadError = this.i18n.translateApiError(
            err?.error,
            'estoque.invoices.detail.errorLoad'
          );
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get moeda(): string {
    return this.invoice?.moeda || 'USD';
  }

  get recebimentoPercent(): number {
    const itens = this.invoice?.itens;
    if (!itens?.length) return 0;
    let total = 0;
    let rec = 0;
    for (const it of itens) {
      total += Number(it.quantidade) || 0;
      rec += Number(it.quantidadeRecebida) || 0;
    }
    return total > 0 ? Math.min(100, Math.round((rec / total) * 100)) : 0;
  }

  get qtdItensInvoice(): number {
    return this.invoice?.itens?.length ?? 0;
  }

  get qtdEstoqueTotal(): number {
    return this.itensEstoque.reduce((s, i) => s + (Number(i.quantidade) || 0), 0);
  }

  get valorItensInvoice(): number {
    return (this.invoice?.itens ?? []).reduce((s, i) => s + (Number(i.valorTotal) || 0), 0);
  }

  get tabHeaderItems(): string {
    return this.i18n.translate('estoque.invoices.detail.tab.items', { n: String(this.qtdItensInvoice) });
  }

  get tabHeaderStock(): string {
    return this.i18n.translate('estoque.invoices.detail.tab.stock', { n: String(this.itensEstoque.length) });
  }

  get tabHeaderLots(): string {
    return this.i18n.translate('estoque.invoices.detail.tab.lots', { n: String(this.lotes.length) });
  }

  get tabHeaderAuditoria(): string {
    return this.i18n.translate('estoque.invoices.detail.tab.auditoria', { n: String(this.auditorias.length) });
  }

  voltarLista(): void {
    this.router.navigate(['/estoque/invoices']);
  }

  editarInvoice(): void {
    if (this.invoice?.id) {
      this.router.navigate(['/estoque/invoices'], { queryParams: { editar: this.invoice.id } });
    }
  }

  novaEntrada(): void {
    if (!this.invoice) return;
    if (!this.podeNovaEntrada) {
      const key =
        this.invoice.status === 'CANCELADA'
          ? 'estoque.invoices.detail.warn.canceladaLead'
          : 'estoque.invoices.detail.warn.inativaLead';
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', key);
      return;
    }
    this.router.navigate(['/estoque/entrada'], {
      queryParams: {
        invoiceId: this.invoice.id,
        fornecedorId: this.invoice.fornecedorId
      }
    });
  }

  verItensEstoque(): void {
    if (!this.invoice?.id) return;
    this.router.navigate(['/estoque/itens'], { queryParams: { invoiceId: this.invoice.id } });
  }

  copiarNumero(): void {
    if (!this.invoice?.numeroInvoice) return;
    navigator.clipboard?.writeText(this.invoice.numeroInvoice).then(() => {
      this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.invoices.detail.copied');
    });
  }

  getHeroSubtitle(inv: Invoice): string {
    const supplier = inv.fornecedorNome || this.i18n.translate('estoque.invoices.detail.supplierDefault');
    const parts = [supplier];
    if (inv.fornecedorCodigo) {
      parts.push(inv.fornecedorCodigo);
    }
    if (inv.paisOrigem) {
      parts.push(inv.paisOrigem);
    }
    return parts.join(' · ');
  }

  getStatusLabel(status?: string): string {
    if (!status) return '—';
    return this.i18n.translateCatalog('invoice.status', status, status);
  }

  getStatusSeverity(status?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      PENDENTE: 'warning',
      EM_TRANSITO: 'info',
      RECEBIDA: 'info',
      CONFERIDA: 'success',
      ESTOCADA: 'success',
      CANCELADA: 'danger'
    };
    return map[status || ''] || 'secondary';
  }

  getItemStatusLabel(status?: string): string {
    if (!status) return '—';
    return this.i18n.translateCatalog('invoice.item.status', status, status);
  }

  getItemStatusSeverity(status?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      PENDENTE: 'warning',
      PARCIAL: 'info',
      COMPLETO: 'success'
    };
    return map[status || ''] || 'secondary';
  }

  getModalLabel(modal?: string): string {
    if (!modal) return '—';
    return this.i18n.translateCatalog('invoice.transport', modal, modal);
  }

  getModalIcon(modal?: string): string {
    const icons: Record<string, string> = {
      AEREO: 'pi pi-send',
      MARITIMO: 'pi pi-globe',
      RODOVIARIO: 'pi pi-truck',
      COURIER: 'pi pi-bolt'
    };
    return icons[modal || ''] || 'pi pi-map';
  }

  getLoteStatusLabel(status?: string): string {
    if (!status) return '—';
    return this.i18n.translateCatalog('lote.status', status, status);
  }

  getLoteStatusSeverity(status?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    if (status === 'ESGOTADO') return 'danger';
    if (status === 'ATIVO') return 'success';
    return 'info';
  }

  getItemEstoqueStatusSeverity(status?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    return status === 'DISPONIVEL' ? 'success' : 'secondary';
  }

  getItemEstoqueStatusLabel(status?: string): string {
    if (!status) return '—';
    return this.i18n.translateCatalog('estoque.itens.status', status, status);
  }

  get podeRestaurar(): boolean {
    return !!this.invoice && this.invoice.isActive === false && this.invoice.status !== 'CANCELADA';
  }

  get podeInativar(): boolean {
    return !!this.invoice && this.invoice.isActive !== false;
  }

  get podeNovaEntrada(): boolean {
    return !!this.invoice && this.invoice.isActive !== false && this.invoice.status !== 'CANCELADA';
  }

  itemRecebimentoPercent(item: InvoiceItem): number {
    const total = Number(item.quantidade) || 0;
    const rec = Number(item.quantidadeRecebida) || 0;
    return total > 0 ? Math.min(100, Math.round((rec / total) * 100)) : 0;
  }

  carregarAuditoria(): void {
    if (!this.invoice?.id) return;
    this.loadingAuditoria = true;
    this.estoque.listarAuditoriaInvoice(this.invoice.id).subscribe({
      next: rows => {
        this.auditorias = rows;
        this.loadingAuditoria = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingAuditoria = false;
        this.cdr.markForCheck();
      }
    });
  }

  iniciarInativacao(): void {
    if (!this.invoice?.id) return;
    this.motivoAcao = '';
    this.estoque.validarInativacaoInvoice(this.invoice.id).subscribe({
      next: v => {
        this.validacaoInativacao = v;
        if (v.podeInativar) {
          this.showMotivoDialog = true;
          this.showBloqueioDialog = false;
        } else {
          this.showBloqueioDialog = true;
          this.showMotivoDialog = false;
        }
        this.cdr.markForCheck();
      },
      error: err => {
        this.i18n.addToastLiteralDetail(
          this.messageService,
          'error',
          'common.toast.error',
          this.i18n.translateApiError(err?.error, 'estoque.invoiceList.toast.validacaoErr')
        );
      }
    });
  }

  abrirCancelamentoDesdeBloqueio(): void {
    this.showBloqueioDialog = false;
    this.showCancelarDialog = true;
    this.motivoAcao = '';
    this.cdr.markForCheck();
  }

  iniciarRestauracao(): void {
    this.motivoAcao = '';
    this.showRestaurarDialog = true;
    this.cdr.markForCheck();
  }

  confirmarRestauracao(): void {
    if (!this.invoice?.id || !this.motivoAcao?.trim()) return;
    this.acaoProcessando = true;
    this.estoque.restaurarInvoice(this.invoice.id, this.motivoAcao.trim()).subscribe({
      next: res => {
        this.acaoProcessando = false;
        this.fecharDialogsAcao();
        if (res.invoice) {
          this.invoice = res.invoice;
        } else if (this.invoice) {
          this.invoice = { ...this.invoice, isActive: true };
        }
        this.carregarAuditoria();
        this.i18n.addToast(
          this.messageService,
          'success',
          'common.toast.success',
          res.mensagem?.startsWith('estoque.') ? res.mensagem : 'estoque.invoiceList.toast.restaurada'
        );
        this.cdr.markForCheck();
      },
      error: err => this.tratarErroAcaoInvoice(err)
    });
  }

  fecharDialogsAcao(): void {
    this.showMotivoDialog = false;
    this.showBloqueioDialog = false;
    this.showCancelarDialog = false;
    this.showRestaurarDialog = false;
    this.motivoAcao = '';
    this.acaoProcessando = false;
    this.cdr.markForCheck();
  }

  confirmarInativacao(): void {
    if (!this.invoice?.id || !this.motivoAcao?.trim()) return;
    this.acaoProcessando = true;
    this.estoque.inativarInvoice(this.invoice.id, this.motivoAcao.trim()).subscribe({
      next: res => {
        this.acaoProcessando = false;
        this.fecharDialogsAcao();
        this.i18n.addToast(
          this.messageService,
          'success',
          'common.toast.success',
          res.mensagem?.startsWith('estoque.') ? res.mensagem : 'estoque.invoiceList.toast.inativada'
        );
        this.voltarLista();
      },
      error: err => this.tratarErroAcaoInvoice(err)
    });
  }

  confirmarCancelamento(): void {
    if (!this.invoice?.id || !this.motivoAcao?.trim()) return;
    this.acaoProcessando = true;
    this.estoque.cancelarInvoice(this.invoice.id, this.motivoAcao.trim()).subscribe({
      next: res => {
        this.acaoProcessando = false;
        this.fecharDialogsAcao();
        if (res.invoice) {
          this.invoice = res.invoice;
        } else if (this.invoice) {
          this.invoice = { ...this.invoice, status: 'CANCELADA' };
        }
        this.carregarAuditoria();
        this.i18n.addToast(
          this.messageService,
          'success',
          'common.toast.success',
          res.mensagem?.startsWith('estoque.') ? res.mensagem : 'estoque.invoice.toast.cancelada'
        );
        this.cdr.markForCheck();
      },
      error: err => this.tratarErroAcaoInvoice(err)
    });
  }

  getAcaoAuditoriaLabel(acao?: string): string {
    if (!acao) return '—';
    return this.i18n.translateCatalog('invoice.auditoria.acao', acao, acao);
  }

  getAcaoAuditoriaSeverity(acao?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      INATIVACAO: 'danger',
      CANCELAMENTO: 'warning',
      TENTATIVA_INATIVACAO_BLOQUEADA: 'secondary',
      RESTAURACAO: 'success'
    };
    return map[acao || ''] || 'info';
  }

  auditActiveLabel(active?: boolean): string {
    return active
      ? this.i18n.translate('estoque.invoices.auditoria.activeYes')
      : this.i18n.translate('estoque.invoices.auditoria.activeNo');
  }

  private tratarErroAcaoInvoice(err: { error?: { error?: string; message?: string } }): void {
    this.acaoProcessando = false;
    this.i18n.addToastLiteralDetail(
      this.messageService,
      'error',
      'common.toast.error',
      this.i18n.translateApiError(err?.error, 'estoque.invoiceList.toast.inativarErr')
    );
    this.cdr.markForCheck();
  }
}
