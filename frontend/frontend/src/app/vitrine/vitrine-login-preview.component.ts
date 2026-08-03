import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe } from '../core/translate.pipe';
import {
  VITRINE_VIDEOS,
  VitrineVideo,
  formatVideoDuration,
  formatVideoSize,
  vitrinePublicMediaUrl,
} from './vitrine-video.catalog';
import { toggleVideoFullscreen } from './vitrine-fullscreen.util';

@Component({
  selector: 'app-vitrine-login-preview',
  standalone: true,
  imports: [CommonModule, ButtonModule, TranslatePipe],
  templateUrl: './vitrine-login-preview.component.html',
  styleUrl: './vitrine-login-preview.component.scss',
})
export class VitrineLoginPreviewComponent implements OnDestroy {
  @ViewChild('videoEl') videoEl?: ElementRef<HTMLVideoElement>;

  readonly videos = VITRINE_VIDEOS;
  readonly formatDuration = formatVideoDuration;
  readonly formatSize = formatVideoSize;
  readonly mediaUrl = vitrinePublicMediaUrl;

  selectedVideo: VitrineVideo | null = null;
  playbackRate = 1;

  openPlayer(video: VitrineVideo): void {
    this.selectedVideo = video;
    this.playbackRate = 1;
    document.body.style.overflow = 'hidden';
  }

  closePlayer(): void {
    const video = this.videoEl?.nativeElement;
    if (video && !video.paused) {
      video.pause();
    }
    this.selectedVideo = null;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selectedVideo) {
      this.closePlayer();
    }
  }

  async toggleFullscreen(): Promise<void> {
    const video = this.videoEl?.nativeElement;
    if (!video) {
      return;
    }
    try {
      await toggleVideoFullscreen(video);
    } catch {
      /* blocked / unsupported */
    }
  }

  async togglePictureInPicture(): Promise<void> {
    const video = this.videoEl?.nativeElement;
    if (!video || !document.pictureInPictureEnabled) {
      return;
    }
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      /* unsupported */
    }
  }

  setSpeed(rate: number): void {
    this.playbackRate = rate;
    const video = this.videoEl?.nativeElement;
    if (video) {
      video.playbackRate = rate;
    }
  }

  trackByVideoId(_index: number, video: VitrineVideo): string {
    return video.id;
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    const video = this.videoEl?.nativeElement;
    if (video && !video.paused) {
      video.pause();
    }
  }
}
