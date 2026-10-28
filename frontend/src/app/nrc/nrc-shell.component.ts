import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { TranslatePipe } from '../core/translate.pipe';
import { canReadNrc, hasNrc } from './nrc-access';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';

@Component({
  selector: 'app-nrc-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, PageHeroComponent],
  templateUrl: './nrc-shell.component.html',
  styleUrl: './nrc.scss'
})
export class NrcShellComponent {
  readonly route = inject(ActivatedRoute);
  private auth = inject(AuthService);

  get user() {
    return this.auth.getCurrentUser();
  }

  get showList(): boolean {
    return canReadNrc(this.user);
  }

  get showOpen(): boolean {
    return hasNrc(this.user, 'NRC_ABRIR');
  }

  get showDashboard(): boolean {
    return hasNrc(this.user, 'NRC_DASHBOARD') || hasNrc(this.user, 'NRC_ENCERRAR');
  }
}
