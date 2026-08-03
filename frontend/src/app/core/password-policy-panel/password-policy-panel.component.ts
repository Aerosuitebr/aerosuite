import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../translate.pipe';
import {
  buildPasswordPolicyRules,
  evaluatePasswordPolicy,
  type PasswordPolicyRule,
} from '../password-policy.util';

@Component({
  selector: 'app-password-policy-panel',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './password-policy-panel.component.html',
  styleUrl: './password-policy-panel.component.scss',
})
export class PasswordPolicyPanelComponent {
  @Input() password = '';
  @Input() confirmPassword = '';
  @Input() showMatch = false;

  get evaluation() {
    return evaluatePasswordPolicy(this.password);
  }

  get strength() {
    return this.evaluation.strength;
  }

  get rules(): PasswordPolicyRule[] {
    return buildPasswordPolicyRules(this.evaluation);
  }

  get passwordsMatch(): boolean {
    return this.password.length > 0 && this.password === this.confirmPassword;
  }
}
