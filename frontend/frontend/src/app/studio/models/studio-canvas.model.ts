export type StudioCanvasElementType =
  | 'text'
  | 'shape'
  | 'logo'
  | 'qr'
  | 'image'
  | 'circle'
  | 'line'
  | 'icon';

export type StudioCanvasShapeKind = 'rect' | 'circle' | 'line';

export type StudioCanvasFilter =
  | 'none'
  | 'grayscale'
  | 'sepia'
  | 'brightness'
  | 'contrast'
  | 'blur'
  | 'vivid';

export type StudioCanvasAnimation = 'none' | 'fadeIn' | 'slideIn' | 'pulse' | 'bounce';

export interface StudioCanvasElement {
  id: string;
  type: StudioCanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  rotation?: number;
  text?: string;
  fontSizePt?: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  fill?: string;
  imageUrl?: string;
  shapeKind?: StudioCanvasShapeKind;
  strokeColor?: string;
  strokeWidthMm?: number;
  iconClass?: string;
  filter?: StudioCanvasFilter;
  animation?: StudioCanvasAnimation;
  animationDurationSec?: number;
  animationDelaySec?: number;
  animationIteration?: string;
}

export interface StudioCanvasDocument {
  version: 1;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  backgroundColor: string;
  elements: StudioCanvasElement[];
  collabSessionId?: string;
}

export const STUDIO_PX_PER_MM = 4;

export function studioMmToPx(mm: number): number {
  return mm * STUDIO_PX_PER_MM;
}

export function studioPxToMm(px: number): number {
  return px / STUDIO_PX_PER_MM;
}

export function newElementId(): string {
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function newCollabSessionId(): string {
  return `collab-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
