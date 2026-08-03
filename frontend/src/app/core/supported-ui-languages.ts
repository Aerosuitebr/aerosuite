import { bustStaticAssetUrl } from '../../environments/asset-cache-bust';

export type SupportedUiLocale = 'pt-BR' | 'en-US' | 'es-ES' | 'fr-FR';

export interface UiLanguageOption {
  locale: SupportedUiLocale;
  /** Caminho do SVG em `src/assets` (copiado para build em `/assets/...`) */
  flagSrc: string;
  /** Iniciais exibidas ao lado da bandeira (BR, US, FR, ES) */
  code: string;
  /** Chave em TranslationService, ex.: language.name.pt-BR */
  nameKey: string;
}

/** Ordem: Brasil, Estados Unidos, França, Espanha */
export const SUPPORTED_UI_LANGUAGES: readonly UiLanguageOption[] = [
  { locale: 'pt-BR', flagSrc: bustStaticAssetUrl('assets/flags/br.svg'), code: 'BR', nameKey: 'language.name.pt-BR' },
  { locale: 'en-US', flagSrc: bustStaticAssetUrl('assets/flags/us.svg'), code: 'US', nameKey: 'language.name.en-US' },
  { locale: 'fr-FR', flagSrc: bustStaticAssetUrl('assets/flags/fr.svg'), code: 'FR', nameKey: 'language.name.fr-FR' },
  { locale: 'es-ES', flagSrc: bustStaticAssetUrl('assets/flags/es.svg'), code: 'ES', nameKey: 'language.name.es-ES' }
] as const;
