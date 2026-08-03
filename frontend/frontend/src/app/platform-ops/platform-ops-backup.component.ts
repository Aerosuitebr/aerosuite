import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import {
  PlatformBackupHistoryRow,
  PlatformBackupPanel,
  PlatformBackupScheduleRequest,
  PlatformControlService
} from './platform-control.service';

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
type BackupPageSlot = number | 'ellipsis';

@Component({
  selector: 'app-platform-ops-backup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    DropdownModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    ToastModule,
    TranslatePipe
  ],
  providers: [MessageService],
  templateUrl: './platform-ops-backup.component.html',
  styleUrls: ['./platform-ops-backup.component.scss']
})
export class PlatformOpsBackupComponent implements OnInit {
  private control = inject(PlatformControlService);
  private toast = inject(MessageService);
  private i18n = inject(TranslationService);

  loading = true;
  saving = false;
  panel: PlatformBackupPanel | null = null;

  cronPreset = '0 2 * * *';
  backupType = 'full';
  storageTarget = 'local_vps';
  scheduledTime = '02:00';
  retentionDays = 30;
  scheduleEnabled = true;

  pageSize = 10;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS.map(v => ({ label: String(v), value: v }));
  currentPage = 1;

  readonly cronOptions = [
    { labelKey: 'platformOps.backup.cron.daily', value: '0 2 * * *' },
    { labelKey: 'platformOps.backup.cron.weekly', value: '0 2 * * 1' },
    { labelKey: 'platformOps.backup.cron.monthly', value: '0 2 1 * *' }
  ];

  readonly backupTypeOptions = [
    { labelKey: 'platformOps.backup.type.full', value: 'full' },
    { labelKey: 'platformOps.backup.type.incremental', value: 'incremental' }
  ];

  readonly storageOptions = [
    { labelKey: 'platformOps.backup.storage.local', value: 'local_vps' },
    { labelKey: 'platformOps.backup.storage.s3', value: 'aws_s3' }
  ];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    const offset = (this.currentPage - 1) * this.pageSize;
    this.control.getBackupPanel(this.pageSize, offset).subscribe({
      next: res => {
        this.panel = res;
        this.applyPanelToForm(res);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  saveSchedule(): void {
    if (this.saving) {
      return;
    }
    this.saving = true;
    const body: PlatformBackupScheduleRequest = {
      cronPreset: this.cronPreset,
      backupType: this.backupType,
      storageTarget: this.storageTarget,
      scheduledTime: this.scheduledTime,
      retentionDays: this.retentionDays,
      compressBackup: this.backupType === 'incremental',
      enabled: this.scheduleEnabled
    };
    this.control.updateBackupSchedule(body).subscribe({
      next: res => {
        this.panel = res;
        this.applyPanelToForm(res);
        this.saving = false;
        this.toast.add({
          severity: 'success',
          summary: '',
          detail: this.i18n.translate('platformOps.backup.saved')
        });
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  private applyPanelToForm(panel: PlatformBackupPanel): void {
    this.cronPreset = panel.cronPreset ?? '0 2 * * *';
    this.backupType = panel.backupType ?? 'full';
    this.storageTarget = panel.storageTarget ?? 'local_vps';
    this.scheduledTime = panel.scheduledTime ?? '02:00';
    this.retentionDays = panel.retentionDays ?? 30;
    this.scheduleEnabled = panel.scheduleEnabled ?? true;
  }

  historyRows(): PlatformBackupHistoryRow[] {
    return this.panel?.history ?? [];
  }

  totalCount(): number {
    return this.panel?.totalHistory ?? 0;
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize));
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.reload();
  }

  goToPage(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.totalPages());
    if (clamped !== this.currentPage) {
      this.currentPage = clamped;
      this.reload();
    }
  }

  paginationSlots(): BackupPageSlot[] {
    const total = this.totalPages();
    const cur = this.currentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const slots: BackupPageSlot[] = [1];
    if (cur > 3) {
      slots.push('ellipsis');
    }
    const start = Math.max(2, cur - 1);
    const end = Math.min(total - 1, cur + 1);
    for (let p = start; p <= end; p++) {
      slots.push(p);
    }
    if (cur < total - 2) {
      slots.push('ellipsis');
    }
    slots.push(total);
    return slots;
  }

  footerRangeText(): string {
    const total = this.totalCount();
    if (total <= 0) {
      return '';
    }
    const from = (this.currentPage - 1) * this.pageSize + 1;
    const to = Math.min(this.currentPage * this.pageSize, total);
    return this.i18n.translate('audit.footer.range', {
      from: String(from),
      to: String(to),
      total: String(total)
    });
  }

  retentionLabel(row: PlatformBackupHistoryRow): string {
    return row.retentionStatus === 'purged'
      ? 'platformOps.backup.retention.purged'
      : 'platformOps.backup.retention.stored';
  }
}
