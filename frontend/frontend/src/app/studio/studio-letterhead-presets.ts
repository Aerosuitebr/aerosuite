/** Presets fixos de papel timbrado A4 (IDs alinhados ao backend). */
export const LETTERHEAD_PRESET_IDS = [
  'corporate-angles',
  'modern-corners',
  'waves',
  'institutional',
  'minimal-center'
] as const;

export type LetterheadPresetId = (typeof LETTERHEAD_PRESET_IDS)[number];

export interface LetterheadPresetOption {
  id: LetterheadPresetId;
  i18nKey: string;
  thumbClass: string;
}

export const LETTERHEAD_PRESETS: LetterheadPresetOption[] = [
  { id: 'corporate-angles', i18nKey: 'studio.letterhead.preset.corporateAngles', thumbClass: 'thumb-corp' },
  { id: 'modern-corners', i18nKey: 'studio.letterhead.preset.modernCorners', thumbClass: 'thumb-mod' },
  { id: 'waves', i18nKey: 'studio.letterhead.preset.waves', thumbClass: 'thumb-wv' },
  { id: 'institutional', i18nKey: 'studio.letterhead.preset.institutional', thumbClass: 'thumb-inst' },
  { id: 'minimal-center', i18nKey: 'studio.letterhead.preset.minimalCenter', thumbClass: 'thumb-min' }
];

export const DEFAULT_LETTERHEAD_PRESET: LetterheadPresetId = 'corporate-angles';

export function isLetterheadPresetId(id: string): id is LetterheadPresetId {
  return (LETTERHEAD_PRESET_IDS as readonly string[]).includes(id);
}
