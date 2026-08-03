import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { TranslatePipe } from '../../core/translate.pipe';
import { DEFAULT_USUARIO_AVATAR, usuarioAvatarInitials } from '../../core/usuario-foto.util';

export type UsuarioFotoHoverVariant = 'sidebar' | 'profile';

@Component({
  selector: 'app-usuario-foto-hover',
  standalone: true,
  imports: [CommonModule, AvatarModule, TooltipModule, TranslatePipe],
  template: `
    <div
      #hoverRoot
      class="usuario-foto-hover"
      [class.usuario-foto-hover--profile]="variant === 'profile'"
      [class.usuario-foto-hover--sidebar]="variant === 'sidebar'"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave($event)">
      <div
        class="usuario-foto-hover__trigger"
        [class.zoom-active]="showZoom">
        <p-avatar
          [image]="avatarDisplaySrc || undefined"
          [label]="avatarLabel || undefined"
          size="normal"
          shape="circle"
          [styleClass]="styleClass"
          [ariaLabel]="'layout.photo.avatarAlt' | translate"
          [style.cursor]="clickable ? 'pointer' : 'default'"
          [pTooltip]="tooltip ?? ''"
          [tooltipDisabled]="!tooltip"
          [tooltipPosition]="tooltipPosition"
          (click)="onAvatarClick($event)"
          (onImageError)="onAvatarImageError()">
        </p-avatar>
        <ng-content />
      </div>

      @if (showZoom && enableZoom && imageUrl) {
        <div
          #zoomPopup
          class="usuario-foto-hover__popup"
          [ngStyle]="popupStyle"
          (mouseenter)="onMouseEnter()"
          (mouseleave)="onMouseLeave($event)">
          <div class="usuario-foto-hover__frame">
            <img
              [src]="zoomImageSrc"
              [attr.alt]="'layout.photo.zoomAlt' | translate"
              class="usuario-foto-hover__img"
              decoding="async"
              (error)="onZoomImageError()" />
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./usuario-foto-hover.component.scss'],
})
export class UsuarioFotoHoverComponent implements OnChanges {
  @Input() imageUrl = '';
  @Input() displayName = '';
  @Input() size: 'normal' | 'large' | 'xlarge' = 'normal';
  @Input() styleClass = '';
  @Input() enableZoom = true;
  @Input() clickable = false;
  @Input() variant: UsuarioFotoHoverVariant = 'sidebar';
  @Input() tooltip?: string;
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'right';

  @Output() avatarClick = new EventEmitter<MouseEvent>();

  @ViewChild('hoverRoot') hoverRoot?: ElementRef<HTMLElement>;
  @ViewChild('zoomPopup') zoomPopup?: ElementRef<HTMLElement>;

  showZoom = false;
  popupStyle: Record<string, string> = {};
  zoomImageSrc = '';
  avatarDisplaySrc = DEFAULT_USUARIO_AVATAR;
  avatarLabel = '';
  private zoomTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl'] || changes['displayName']) {
      const url = this.imageUrl?.trim();
      this.avatarDisplaySrc = url || DEFAULT_USUARIO_AVATAR;
      this.avatarLabel = url ? '' : usuarioAvatarInitials(this.displayName);
      if (this.showZoom) {
        this.zoomImageSrc = this.avatarDisplaySrc;
      }
    }
  }

  onAvatarImageError(): void {
    this.avatarDisplaySrc = DEFAULT_USUARIO_AVATAR;
    this.avatarLabel = usuarioAvatarInitials(this.displayName);
  }

  onMouseEnter(): void {
    if (this.zoomTimeout) {
      clearTimeout(this.zoomTimeout);
      this.zoomTimeout = null;
    }
    if (this.enableZoom && this.imageUrl) {
      this.zoomImageSrc = this.imageUrl;
      this.showZoom = true;
      setTimeout(() => this.updatePopupPosition(), 0);
    }
  }

  onZoomImageError(): void {
    this.zoomImageSrc = DEFAULT_USUARIO_AVATAR;
  }

  private updatePopupPosition(): void {
    if (this.variant !== 'sidebar' || !this.hoverRoot?.nativeElement) {
      this.popupStyle = {};
      return;
    }
    const trigger = this.hoverRoot.nativeElement.querySelector('.usuario-foto-hover__trigger');
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    this.popupStyle = {
      position: 'fixed',
      left: `${rect.right + 12}px`,
      top: `${rect.top + rect.height / 2}px`,
      transform: 'translateY(-50%)',
      zIndex: '10050',
    };
  }

  onMouseLeave(event: MouseEvent): void {
    this.zoomTimeout = setTimeout(() => {
      const hovered = document.elementFromPoint(event.clientX, event.clientY);
      const root = this.hoverRoot?.nativeElement;
      if (!root?.contains(hovered)) {
        this.showZoom = false;
      }
    }, 180);
  }

  onAvatarClick(event: MouseEvent): void {
    if (this.clickable) {
      this.avatarClick.emit(event);
    }
  }
}
