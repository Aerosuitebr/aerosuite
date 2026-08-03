import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-test',
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <h1>Teste de Componente</h1>
      <p>Se você está vendo isso, o Angular está funcionando!</p>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 2rem;
      text-align: center;
      background: #f0f0f0;
      border-radius: 8px;
      margin: 2rem;
    }
  `]
})
export class TestComponent { }
