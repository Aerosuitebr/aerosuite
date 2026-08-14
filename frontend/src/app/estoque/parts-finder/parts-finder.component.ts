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
