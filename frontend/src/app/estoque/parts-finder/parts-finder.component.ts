import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PartsFinderResult, PartsFinderService } from './parts-finder.service';

@Component({
  selector: 'app-parts-finder',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, InputNumberModule, TableModule, TagModule],
  templateUrl: './parts-finder.component.html',
  styleUrls: ['./parts-finder.component.scss']
})
export class PartsFinderComponent {
  private service = inject(PartsFinderService);
  partNumber = '';
  quantity: number | null = 1;
  condition = '';
  country = '';
  certification = '';
  aog = false;
  loading = false;
  searched = false;
  error = '';
  results: PartsFinderResult[] = [];
  selected: PartsFinderResult[] = [];
  comparisonVisible = false;

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
    const recipients = [...new Set(this.selected.map(item => item.supplierEmail).filter(Boolean))].join(';');
    const lines = this.selected.map(item =>
      `- PN ${item.partNumber} | Qtd. ${this.quantity ?? 1} | Condição ${item.condition || this.condition || 'a confirmar'} | Certificação ${item.certification || this.certification || 'a confirmar'}`
    );
    const subject = `RFQ AeroSuite${this.aog ? ' - AOG' : ''} - ${this.partNumber.trim()}`;
    const body = `Prezados,\n\nSolicitamos cotação para os itens abaixo:\n\n${lines.join('\n')}\n\nFavor informar preço, disponibilidade, lead time, condição e rastreabilidade.\n\nAtenciosamente.`;
    window.location.href = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

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
