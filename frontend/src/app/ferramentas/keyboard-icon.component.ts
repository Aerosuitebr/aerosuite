import { Component } from '@angular/core';

@Component({
  selector: 'app-keyboard-icon', standalone: true,
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2" y="5" width="20" height="14" rx="2"></rect><path d="M5 9h1m3 0h1m3 0h1m3 0h1M5 12h1m3 0h1m3 0h1m3 0h1M5 15h2m2 0h6m2 0h2"></path></svg>`,
  styles: [':host{display:inline-flex;align-items:center;justify-content:center;line-height:1;flex-shrink:0}svg{display:block;width:1.35em;height:1.35em}']
})
export class KeyboardIconComponent {}
