import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { AuthShellComponent } from '../shared/auth-shell/auth-shell.component';
import { AuthBrandHeaderComponent } from '../shared/auth-brand-header/auth-brand-header.component';
import { PublicOnboardingForm, PublicOnboardingService } from './public-onboarding.service';

@Component({
  selector: 'app-public-onboarding-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    MessageModule,
    TranslatePipe,
    AuthShellComponent,
    AuthBrandHeaderComponent
  ],
  templateUrl: './public-onboarding-form.component.html',
  styleUrls: ['./public-onboarding-form.component.scss']
})
export class PublicOnboardingFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(PublicOnboardingService);
  private fb = inject(FormBuilder);
  private i18n = inject(TranslationService);

  loading = true;
  submitting = false;
  error = false;
  success = false;
  formData: PublicOnboardingForm | null = null;

  form = this.fb.group({
    contactName: ['', Validators.required],
    contactEmail: ['', [Validators.required, Validators.email]],
    contactPhone: [''],
    legalName: [''],
    legalDocument: [''],
    adminEmail: ['', Validators.email],
    supportEmail: ['', Validators.email],
    billingContactName: [''],
    billingContactEmail: ['', Validators.email]
  });

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.api.getForm(token).subscribe({
      next: data => {
        this.formData = data;
        this.form.patchValue({
          contactName: data.contactName ?? '',
          contactEmail: data.contactEmail ?? '',
          contactPhone: data.contactPhone ?? '',
          legalName: data.legalName ?? '',
          legalDocument: data.legalDocument ?? '',
          adminEmail: data.adminEmail ?? '',
          supportEmail: data.supportEmail ?? '',
          billingContactName: data.billingContactName ?? '',
          billingContactEmail: data.billingContactEmail ?? ''
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    const v = this.form.getRawValue();
    this.submitting = true;
    this.api
      .submit(token, {
        contactName: v.contactName!.trim(),
        contactEmail: v.contactEmail!.trim(),
        contactPhone: v.contactPhone?.trim() || undefined,
        legalName: v.legalName?.trim() || undefined,
        legalDocument: v.legalDocument?.trim() || undefined,
        adminEmail: v.adminEmail?.trim() || undefined,
        supportEmail: v.supportEmail?.trim() || undefined,
        billingContactName: v.billingContactName?.trim() || undefined,
        billingContactEmail: v.billingContactEmail?.trim() || undefined
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.success = true;
        },
        error: () => {
          this.submitting = false;
          this.error = true;
        }
      });
  }

  submittedHint(): string {
    if (!this.formData?.submittedAt) {
      return '';
    }
    const date = new Date(this.formData.submittedAt).toLocaleDateString();
    return this.i18n.translate('onboardingPublic.alreadySubmitted', { date });
  }
}
