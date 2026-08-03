import fs from 'fs';

const { keys, defs } = JSON.parse(
  fs.readFileSync('frontend/src/app/core/i18n/.page-help-keys.json', 'utf8')
);

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

// Traduções EN/ES/FR — geradas a partir do PT (ajuste manual pontual se necessário)
const trPath = 'frontend/src/app/core/i18n/page-help-translations.json';
let tr = { en: {}, es: {}, fr: {} };
if (fs.existsSync(trPath)) {
  tr = JSON.parse(fs.readFileSync(trPath, 'utf8'));
}

function linesForLang(lang, langKey) {
  return Object.entries(keys)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, pt]) => {
      const v = lang === 'pt' ? pt : tr[langKey]?.[k] ?? pt;
      return `    '${k}': '${esc(v)}',`;
    })
    .join('\n');
}

const i18nTs = `import type { TranslationDictionary } from '../translation.service';

function dict(lang: 'pt' | 'en' | 'es' | 'fr'): TranslationDictionary {
  if (lang === 'pt') {
    return {
${linesForLang('pt')}
    };
  }
  if (lang === 'en') {
    return {
${linesForLang('en', 'en')}
    };
  }
  if (lang === 'es') {
    return {
${linesForLang('es', 'es')}
    };
  }
  return {
${linesForLang('fr', 'fr')}
  };
}

export const PAGE_HELP_I18N_PT_BR = dict('pt');
export const PAGE_HELP_I18N_EN_US = dict('en');
export const PAGE_HELP_I18N_ES_ES = dict('es');
export const PAGE_HELP_I18N_FR_FR = dict('fr');
`;

const defsTs = `export interface HelpSectionDef {
  titleKey: string;
  icon?: string;
  contentKeys: string[];
}

export interface HelpContentDef {
  route: string;
  titleKey: string;
  sections: HelpSectionDef[];
}

export const PAGE_HELP_DEFINITIONS: HelpContentDef[] = ${JSON.stringify(defs, null, 2)};
`;

fs.writeFileSync('frontend/src/app/core/i18n/page-help-i18n.ts', i18nTs);
fs.writeFileSync('frontend/src/app/core/page-help-definitions.ts', defsTs);
console.log('Generated page-help-i18n.ts and page-help-definitions.ts');
