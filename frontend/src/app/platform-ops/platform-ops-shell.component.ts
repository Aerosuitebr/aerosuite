import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe } from '../core/translate.pipe';
import { PlatformOpsAuthService } from './platform-ops-auth.service';
import {
  PLATFORM_OPS_NAV,
  PLATFORM_OPS_NAV_GROUPS,
  PlatformOpsNavItem
} from './platform-ops-nav.config';
import { BrandStackComponent } from '../shared/brand-stack/brand-stack.component';
import { PlatformOpsRevalidateComponent } from './platform-ops-revalidate.component';

@Component({
  selector: 'app-platform-ops-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ButtonModule, TranslatePipe, BrandStackComponent, PlatformOpsRevalidateComponent],
  templateUrl: './platform-ops-shell.component.html',
  styleUrls: ['./platform-ops-shell.component.scss']
})
export class PlatformOpsShellComponent {
  private auth = inject(PlatformOpsAuthService);
  private router = inject(Router);

  readonly navGroups = PLATFORM_OPS_NAV_GROUPS;
  readonly navItems = PLATFORM_OPS_NAV;

  get sessionEmail(): string | null {
    return this.auth.getEmail();
  }

  get userInitials(): string {
    const email = this.sessionEmail;
    if (!email) {
      return 'OP';
    }
    const local = email.split('@')[0] ?? '';
    const parts = local.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
    }
    return local.slice(0, 2).toUpperCase() || 'OP';
  }

  readonly footerYear = new Date().getFullYear();

  itemsForGroup(groupKey: PlatformOpsNavItem['groupKey']): PlatformOpsNavItem[] {
    return this.navItems.filter(item => item.groupKey === groupKey);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/plataforma/acesso']);
  }
}
