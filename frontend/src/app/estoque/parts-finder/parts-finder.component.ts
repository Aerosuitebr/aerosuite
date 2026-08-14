import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ISO_COUNTRIES } from '../../shared/countries/iso-countries';
import { PartsFinderResult, PartsFinderService, PartsRfqItem, PartsRfqResult } from './parts-finder.service';

@Component({
  selector: 'app-parts-finder',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, InputNumberModule, TableModule, TagModule, DialogModule, DropdownModule],
  templateUrl: './parts-finder.component.html',
  styleUrls: ['./parts-finder.component.scss']
})
export class PartsFinderComponent {
  private service = inject(PartsFinderService);
  partNumber = '';
  quantity: number | null = 1;
  condition = '';
  country = '';
  readonly countryOptions = ISO_COUNTRIES;
  certification = '';
  aog = false;
  loading = false;
  searched = false;
  error = '';
  results: PartsFinderResult[] = [];
  selected: PartsFinderResult[] = [];
  comparisonVisible = false;
  rfqVisible = false;
  rfqSaving = false;
  rfqTitle = '';
  rfqNotes = '';
  rfqItems: PartsRfqItem[] = [];
  createdRfq: PartsRfqResult | null = null;

  get hasDemoResults(): boolean {
    return this.results.some(item => item.source === 'STAGING_DEMO');
  }

  get recommendedOffer(): PartsFinderResult | undefined {
    return [...this.selected].sort((a, b) => this.offerScore(b) - this.offerScore(a))[0];
  }

  get fastestLeadTime(): number | undefined {
    const values = this.selected.map(item => item.estimatedLeadTimeHours).filter((value): value is number => value != null);
    return values.length ? Math.min(...values) : undefined;
  }

  isRecommended(item: PartsFinderResult): boolean { return item === this.recommendedOffer; }

  isLowestPrice(item: PartsFinderResult): boolean {
    if (item.unitPrice == null) return false;
    const prices = this.selected.filter(candidate => candidate.currency === item.currency && candidate.unitPrice != null).map(candidate => candidate.unitPrice as number);
    return prices.length > 1 && item.unitPrice === Math.min(...prices);
  }

  isFastest(item: PartsFinderResult): boolean {
    return item.estimatedLeadTimeHours != null && item.estimatedLeadTimeHours === this.fastestLeadTime;
  }

  offerScore(item: PartsFinderResult): number {
    let score = 0;
    if (item.supplierAslStatus === 'APROVADO') score += 30;
    if (item.certification) score += 15;
    if (item.quantity != null && item.quantity >= (this.quantity ?? 1)) score += 20;
    if (this.isLowestPrice(item)) score += 15;
    if (this.isFastest(item)) score += 10;
    if (this.aog && item.aogAvailable) score += 25;
    return score;
  }

  offerReasons(item: PartsFinderResult): string[] {
    const reasons: string[] = [];
    if (item.supplierAslStatus === 'APROVADO') reasons.push('Fornecedor aprovado na ASL');
    if (item.quantity != null && item.quantity >= (this.quantity ?? 1)) reasons.push('Atende a quantidade solicitada');
    if (this.isLowestPrice(item)) reasons.push('Menor preço comparável');
    if (this.isFastest(item)) reasons.push('Menor prazo estimado');
    if (this.aog && item.aogAvailable) reasons.push('Disponível para atendimento AOG');
    if (item.certification) reasons.push('Certificação informada');
    return reasons;
  }

  decreaseQuantity(): void {
    this.quantity = Math.max(1, (this.quantity ?? 1) - 1);
  }

  increaseQuantity(): void {
    this.quantity = (this.quantity ?? 0) + 1;
  }

  isSelected(result: PartsFinderResult): boolean {
    return this.selected.includes(result);
  }

  toggleSelection(result: PartsFinderResult, checked: boolean): void {
    this.selected = checked
      ? [...this.selected, result].slice(-4)
      : this.selected.filter(item => item !== result);
    if (!this.selected.length) this.comparisonVisible = false;
  }

  createRfq(): void {
    if (!this.selected.length) return;
    this.rfqTitle = `RFQ${this.aog ? ' AOG' : ''} - ${this.partNumber.trim()}`;
    this.rfqNotes = this.aog ? 'Atendimento AOG prioritário. Confirmar disponibilidade e prazo de expedição.' : '';
    this.rfqItems = this.selected.map(item => ({ ...item, requestedQuantity: this.quantity ?? 1, lineTotal: this.calculateLineTotal(item.unitPrice, this.quantity ?? 1) }));
    this.createdRfq = null;
    this.rfqVisible = true;
  }

  updateRfqLine(item: PartsRfqItem): void {
    item.requestedQuantity = Math.max(0.001, Number(item.requestedQuantity) || 0.001);
    item.unitPrice = item.unitPrice == null ? undefined : Math.max(0, Number(item.unitPrice) || 0);
    item.lineTotal = this.calculateLineTotal(item.unitPrice, item.requestedQuantity);
  }

  removeRfqLine(item: PartsRfqItem): void { this.rfqItems = this.rfqItems.filter(line => line !== item); }

  rfqTotals(): Array<{ currency: string; total: number }> {
    const totals = new Map<string, number>();
    this.rfqItems.forEach(item => {
      if (item.unitPrice == null) return;
      const currency = item.currency || 'USD';
      totals.set(currency, (totals.get(currency) || 0) + this.calculateLineTotal(item.unitPrice, item.requestedQuantity));
    });
    return [...totals.entries()].map(([currency, total]) => ({ currency, total }));
  }

  saveRfq(): void {
    if (!this.rfqItems.length || this.rfqSaving) return;
    this.rfqSaving = true;
    this.service.createRfq({
      title: this.rfqTitle,
      aog: this.aog,
      notes: this.rfqNotes,
      items: this.rfqItems.map(({ requestedQuantity, lineTotal, ...item }) => ({ ...item, quantity: requestedQuantity }))
    }).pipe(finalize(() => this.rfqSaving = false)).subscribe({
      next: rfq => this.createdRfq = rfq,
      error: () => this.error = 'Não foi possível salvar a RFQ. Revise os itens e tente novamente.'
    });
  }

  private calculateLineTotal(unitPrice: number | undefined, quantity: number): number { return unitPrice == null ? 0 : Math.round(unitPrice * quantity * 100) / 100; }

  search(): void {
    const pn = this.partNumber.trim();
    if (!pn || this.loading) return;
    this.loading = true;
    this.error = '';
    this.service.search({
      partNumber: pn,
      quantity: this.quantity ?? undefined,
      condition: this.condition || undefined,
      country: this.country.trim() || undefined,
      certification: this.certification.trim() || undefined,
      aog: this.aog
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: response => { this.results = response.results; this.selected = []; this.comparisonVisible = false; this.searched = true; },
        error: () => { this.results = []; this.searched = true; this.error = 'Não foi possível consultar as fontes agora.'; }
      });
  }
}
