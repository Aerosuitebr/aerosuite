import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { DeploymentInfo, DeploymentInfoService } from '../../core/deployment-info.service';

@Component({
  selector: 'app-deployment-banner',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div
      *ngIf="info as d"
      class="deployment-banner"
      [class.deployment-banner--production]="d.kind === 'production' || d.kind === 'prod'"
      [class.deployment-banner--homolog]="d.kind === 'homolog' || d.kind === 'staging'"
      role="status"
      [attr.aria-label]="'deployment.banner.aria' | translate">
      <span class="deployment-banner__dot" aria-hidden="true"></span>
      <strong *ngIf="d.environmentName" class="deployment-banner__name">{{ d.environmentName }}</strong>
      <span class="deployment-banner__sep" *ngIf="d.environmentName" aria-hidden="true">·</span>
      <span>{{ bannerText(d) }}</span>
    </div>
  `,
  styles: [
    `
      .deployment-banner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.45rem;
        padding: 0.35rem 0.75rem;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        background: #334155;
        color: #f8fafc;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .deployment-banner--production {
        background: linear-gradient(90deg, #7f1d1d, #991b1b 45%, #b45309);
        color: #fff7ed;
      }
      .deployment-banner--homolog {
        background: linear-gradient(90deg, #713f12, #a16207);
        color: #fffbeb;
      }
      .deployment-banner__dot {
        width: 0.45rem;
        height: 0.45rem;
        border-radius: 999px;
        background: currentColor;
        opacity: 0.85;
        animation: deployment-pulse 1.8s ease-in-out infinite;
      }
      .deployment-banner__name {
        font-weight: 800;
      }
      .deployment-banner__sep {
        opacity: 0.65;
      }
      @keyframes deployment-pulse {
        0%,
        100% {
          opacity: 0.45;
        }
        50% {
          opacity: 1;
        }
      }
    `
  ]
})
export class DeploymentBannerComponent implements OnInit {
  private readonly deploymentInfo = inject(DeploymentInfoService);
  private readonly i18n = inject(TranslationService);

  info: DeploymentInfo | null = null;

  ngOnInit(): void {
    this.deploymentInfo.getInfo().subscribe(info => {
      this.info = info;
    });
  }

  bannerText(d: DeploymentInfo): string {
    const kind = (d.kind ?? '').toLowerCase();
    if (kind === 'production' || kind === 'prod') {
      return this.i18n.translate('deployment.banner.production');
    }
    if (kind === 'homolog' || kind === 'staging') {
      return this.i18n.translate('deployment.banner.homolog');
    }
    if (d.environmentName) {
      return this.i18n.translate('deployment.banner.generic', { name: d.environmentName });
    }
    return this.i18n.translate('deployment.banner.homolog');
  }
}
