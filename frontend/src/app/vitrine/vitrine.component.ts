import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import {
  VITRINE_VIDEOS,
  VitrineVideo,
  formatVideoDuration,
  vitrineMediaUrl,
} from './vitrine-video.catalog';

@Component({
  selector: 'app-vitrine',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './vitrine.component.html',
  styleUrl: './vitrine.component.scss',
})
export class VitrineComponent {
  private readonly i18n = inject(TranslationService);

  readonly videos = VITRINE_VIDEOS;
  readonly formatDuration = formatVideoDuration;
  readonly mediaUrl = vitrineMediaUrl;
  searchQuery = '';

  get filteredVideos(): readonly VitrineVideo[] {
    const query = this.normalize(this.searchQuery);
    if (!query) {
      return this.videos;
    }

    return this.videos.filter(video => {
      const searchable = [
        this.i18n.translate(video.titleKey),
        this.i18n.translate(video.descriptionKey),
        this.i18n.translate(video.categoryKey),
      ]
        .map(value => this.normalize(value))
        .join(' ');
      return searchable.includes(query);
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  trackByVideoId(_index: number, video: VitrineVideo): string {
    return video.id;
  }

  private normalize(value: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .trim();
  }
}
