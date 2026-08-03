import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { map } from 'rxjs';
import { TranslatePipe } from '../core/translate.pipe';
import {
  VitrineVideo,
  formatVideoDuration,
  formatVideoSize,
  getVitrineVideo,
  vitrineMediaUrl,
} from './vitrine-video.catalog';
import { toggleVideoFullscreen } from './vitrine-fullscreen.util';

@Component({
  selector: 'app-vitrine-player',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, TranslatePipe],
  templateUrl: './vitrine-player.component.html',
  styleUrl: './vitrine-player.component.scss',
})
export class VitrinePlayerComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);

  @ViewChild('videoEl') videoEl?: ElementRef<HTMLVideoElement>;

  readonly formatDuration = formatVideoDuration;
  readonly formatSize = formatVideoSize;
  readonly mediaUrl = vitrineMediaUrl;
  playbackRate = 1;

  readonly video$ = this.route.paramMap.pipe(
    map(params => getVitrineVideo(params.get('id')))
  );

  downloadUrl(video: VitrineVideo): string {
    return vitrineMediaUrl(video.fileName, true);
  }

  async toggleFullscreen(): Promise<void> {
    const video = this.videoEl?.nativeElement;
    if (!video) {
      return;
    }
    try {
      await toggleVideoFullscreen(video);
    } catch {
      /* browser may block fullscreen without gesture */
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
      /* unsupported / blocked */
    }
  }

  setSpeed(rate: number): void {
    this.playbackRate = rate;
    const video = this.videoEl?.nativeElement;
    if (video) {
      video.playbackRate = rate;
    }
  }

  ngOnDestroy(): void {
    const video = this.videoEl?.nativeElement;
    if (video && !video.paused) {
      video.pause();
    }
  }
}
