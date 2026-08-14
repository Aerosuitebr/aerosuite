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
  loading = false;
  searched = false;
  error = '';
  results: PartsFinderResult[] = [];

  search(): void {
    const pn = this.partNumber.trim();
    if (!pn || this.loading) return;
    this.loading = true;
    this.error = '';
    this.service.search(pn, this.quantity ?? undefined)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: response => { this.results = response.results; this.searched = true; },
        error: () => { this.results = []; this.searched = true; this.error = 'Não foi possível consultar as fontes agora.'; }
      });
  }
}
