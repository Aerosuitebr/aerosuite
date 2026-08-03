import { StudioCanvasElement, StudioCanvasFilter, StudioCanvasAnimation } from './models/studio-canvas.model';

export function studioFilterCss(filter?: StudioCanvasFilter): string | null {
  if (!filter || filter === 'none') return null;
  switch (filter) {
    case 'grayscale':
      return 'grayscale(1)';
    case 'sepia':
      return 'sepia(0.85)';
    case 'brightness':
      return 'brightness(1.15)';
    case 'contrast':
      return 'contrast(1.25)';
    case 'blur':
      return 'blur(1px)';
    case 'vivid':
      return 'saturate(1.45) contrast(1.05)';
    default:
      return null;
  }
}

export function studioAnimationCss(el: StudioCanvasElement, captureSec?: number): string | null {
  const anim = el.animation ?? 'none';
  if (anim === 'none') return null;
  const dur = el.animationDurationSec ?? 1;
  const baseDelay = el.animationDelaySec ?? 0;
  let delay = baseDelay;
  if (captureSec != null) {
    delay = -(captureSec % Math.max(dur, 0.1));
  }
  const name = anim === 'fadeIn' ? 'studio-fadeIn'
    : anim === 'slideIn' ? 'studio-slideIn'
    : anim === 'pulse' ? 'studio-pulse'
    : anim === 'bounce' ? 'studio-bounce'
    : null;
  if (!name) return null;
  const iter = captureSec != null ? '1' : (el.animationIteration ?? 'infinite');
  return `${name} ${dur}s ease ${delay}s ${iter} both`;
}

export const STUDIO_ANIMATION_KEYFRAMES = `
@keyframes studio-fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes studio-slideIn { from { transform: translateY(8mm); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes studio-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
@keyframes studio-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2mm); } }
`;
