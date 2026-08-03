/**
 * Fullscreen compatível com Safari iOS.
 * No iOS, `Element.requestFullscreen()` costuma falhar; o vídeo
 * precisa de `HTMLVideoElement.webkitEnterFullscreen()`.
 */
type WebkitVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
  webkitSupportsFullscreen?: boolean;
  webkitRequestFullscreen?: () => void;
};

export async function toggleVideoFullscreen(video: HTMLVideoElement): Promise<void> {
  const v = video as WebkitVideo;

  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }

  if (v.webkitDisplayingFullscreen && typeof v.webkitExitFullscreen === 'function') {
    v.webkitExitFullscreen();
    return;
  }

  if (typeof video.requestFullscreen === 'function') {
    try {
      await video.requestFullscreen();
      return;
    } catch {
      /* tenta fallback iOS abaixo */
    }
  }

  if (typeof v.webkitEnterFullscreen === 'function') {
    // iOS exige gesto do usuário; o click do botão já satisfaz isso.
    v.webkitEnterFullscreen();
    return;
  }

  if (typeof v.webkitRequestFullscreen === 'function') {
    v.webkitRequestFullscreen();
  }
}

export function isVideoFullscreenSupported(video: HTMLVideoElement | null | undefined): boolean {
  if (!video) {
    return false;
  }
  const v = video as WebkitVideo;
  return (
    typeof video.requestFullscreen === 'function' ||
    typeof v.webkitEnterFullscreen === 'function' ||
    typeof v.webkitRequestFullscreen === 'function' ||
    v.webkitSupportsFullscreen === true
  );
}
