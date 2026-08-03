/** Metadados técnicos do produto serializados em {@code product.local} (JSON compacto). */

export type ProductCurrency = 'USD' | 'BRL' | 'EUR';

export interface ProductMetaV1 {
  m?: ProductCurrency;
  pw?: number;
  w?: number;
  h?: number;
  d?: number;
  mt?: string;
  cr?: string;
  obs?: string;
}

export const PRODUCT_CODE_MAX = 64;
export const PRODUCT_NAME_MAX = 255;
export const FABRICANTE_NAME_MAX = 100;
export const PRODUCT_DESC_MAX = 1000;
export const PRODUCT_NOTES_MAX = 2000;
export const PRODUCT_SPEC_TEXT_MAX = 100;
export const PRODUCT_WEIGHT_MAX = 999999.99;
export const PRODUCT_LOCAL_JSON_MAX = 100;

export function decodeProductLocal(local: string | null | undefined): ProductMetaV1 {
  const raw = local?.trim();
  if (!raw?.startsWith('{')) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as ProductMetaV1;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function encodeProductLocal(meta: ProductMetaV1): string | null {
  const payload: ProductMetaV1 = {};
  if (meta.m) payload.m = meta.m;
  if (meta.pw != null && meta.pw > 0) payload.pw = meta.pw;
  if (meta.w != null && meta.w > 0) payload.w = meta.w;
  if (meta.h != null && meta.h > 0) payload.h = meta.h;
  if (meta.d != null && meta.d > 0) payload.d = meta.d;
  if (meta.mt?.trim()) payload.mt = meta.mt.trim().slice(0, PRODUCT_SPEC_TEXT_MAX);
  if (meta.cr?.trim()) payload.cr = meta.cr.trim().slice(0, PRODUCT_SPEC_TEXT_MAX);
  if (meta.obs?.trim()) payload.obs = meta.obs.trim().slice(0, PRODUCT_NOTES_MAX);
  if (!Object.keys(payload).length) {
    return null;
  }
  const json = JSON.stringify(payload);
  return json.length <= PRODUCT_LOCAL_JSON_MAX ? json : json.slice(0, PRODUCT_LOCAL_JSON_MAX);
}

export function formatDimensions(meta: ProductMetaV1): string {
  const parts = [meta.w, meta.h, meta.d].filter((v) => v != null && v > 0);
  return parts.length ? parts.join(' x ') : '';
}

export function parseLegacyDimensions(value: string | null | undefined): Pick<ProductMetaV1, 'w' | 'h' | 'd'> {
  const raw = (value ?? '').trim();
  if (!raw) {
    return {};
  }
  const nums = raw.match(/\d+(?:[.,]\d+)?/g);
  if (!nums?.length) {
    return {};
  }
  const toNum = (s: string) => Number(s.replace(',', '.'));
  return {
    w: nums[0] ? toNum(nums[0]) : undefined,
    h: nums[1] ? toNum(nums[1]) : undefined,
    d: nums[2] ? toNum(nums[2]) : undefined,
  };
}
