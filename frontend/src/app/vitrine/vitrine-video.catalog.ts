export interface VitrineVideo {
  id: string;
  titleKey: string;
  descriptionKey: string;
  categoryKey: string;
  fileName: string;
  posterFileName: string;
  downloadName: string;
  durationSeconds: number;
  sizeBytes: number;
  resolution: string;
}

const VITRINE_MEDIA_BASE = '/api/vitrine/media';
const VITRINE_PUBLIC_MEDIA_BASE = '/api/public/vitrine/media';
const AUTH_TOKEN_KEY = 'aerosuite_token';

/** Mídia pública (login / visitantes) — allowlist no backend. */
export function vitrinePublicMediaUrl(fileName: string): string {
  return `${VITRINE_PUBLIC_MEDIA_BASE}/${encodeURIComponent(fileName)}`;
}

export function vitrineMediaUrl(fileName: string, download = false): string {
  const params = new URLSearchParams();
  if (download) {
    params.set('download', 'true');
  }
  // <video>/<img> não enviam Authorization — o JWT vai na query.
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      params.set('access_token', token);
    }
  } catch {
    /* privacy mode */
  }
  const query = params.toString();
  return `${VITRINE_MEDIA_BASE}/${encodeURIComponent(fileName)}${query ? `?${query}` : ''}`;
}

export const VITRINE_VIDEOS: readonly VitrineVideo[] = [
  {
    id: 'visao-geral-plataforma',
    titleKey: 'vitrine.video.platform.title',
    descriptionKey: 'vitrine.video.platform.description',
    categoryKey: 'vitrine.category.platform',
    fileName: 'aerosuite-visao-geral-plataforma.mp4',
    posterFileName: 'aerosuite-visao-geral-plataforma.jpg',
    downloadName: 'AeroSuite-Visao-Geral-da-Plataforma.mp4',
    durationSeconds: 278,
    sizeBytes: 282_921_481,
    resolution: 'Full HD · 60 FPS',
  },
  {
    id: 'gestao-estoque-passo-a-passo',
    titleKey: 'vitrine.video.inventory.title',
    descriptionKey: 'vitrine.video.inventory.description',
    categoryKey: 'vitrine.category.tutorial',
    fileName: 'aerosuite-gestao-estoque-passo-a-passo.mp4',
    posterFileName: 'aerosuite-gestao-estoque-passo-a-passo.jpg',
    downloadName: 'AeroSuite-Gestao-de-Estoque-Passo-a-Passo.mp4',
    durationSeconds: 152,
    sizeBytes: 19_152_201,
    resolution: 'Full HD · 30 FPS',
  },
];

export function getVitrineVideo(id: string | null): VitrineVideo | undefined {
  return VITRINE_VIDEOS.find(video => video.id === id);
}

export function formatVideoDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatVideoSize(bytes: number): string {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes >= 100 ? megabytes.toFixed(0) : megabytes.toFixed(1)} MB`;
}
