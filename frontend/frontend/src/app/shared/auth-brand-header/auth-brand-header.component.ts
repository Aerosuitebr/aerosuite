import { Component } from '@angular/core';
import { BrandStackComponent } from '../brand-stack/brand-stack.component';

/** Marca completa (`Aero_Colorido.png`) — padrão das telas de login. */
@Component({
  selector: 'app-auth-brand-header',
  standalone: true,
  imports: [BrandStackComponent],
  template: `
    <div class="auth-brand-header">
      <app-brand-stack surface="light" size="auth" />
    </div>
  `,
})
export class AuthBrandHeaderComponent {}
