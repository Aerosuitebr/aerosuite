import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [CommonModule, LanguageSwitcherComponent],
  templateUrl: './auth-shell.component.html',
  styleUrls: ['./auth-premium.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthShellComponent {
  /** Exibe seletor de idioma (4 bandeiras em linha única). */
  @Input() showLanguageSwitcher = true;

  /** Largura máxima do card em px. */
  @Input() cardMaxWidth = 480;

  /** Card mais largo (trial, termos legais). */
  @Input() cardWide = false;
}
