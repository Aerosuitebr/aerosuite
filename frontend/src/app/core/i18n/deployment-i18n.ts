import type { TranslationDictionary } from '../translation.service';

function L(pt: string, en: string, es: string, fr: string, lang: string): string {
  switch (lang) {
    case 'en-US':
      return en;
    case 'es-ES':
      return es;
    case 'fr-FR':
      return fr;
    default:
      return pt;
  }
}

export function deploymentI18n(lang: string): TranslationDictionary {
  return {
    'deployment.banner.production': L(
      'PRODUÇÃO — dados reais',
      'PRODUCTION — live data',
      'PRODUCCIÓN — datos reales',
      'PRODUCTION — données réelles',
      lang
    ),
    'deployment.banner.homolog': L(
      'HOMOLOGAÇÃO — ambiente de testes',
      'STAGING — test environment',
      'HOMOLOGACIÓN — entorno de pruebas',
      'RECETTE — environnement de test',
      lang
    ),
    'deployment.banner.generic': L(
      'Ambiente: {{name}}',
      'Environment: {{name}}',
      'Entorno: {{name}}',
      'Environnement : {{name}}',
      lang
    ),
    'deployment.banner.aria': L(
      'Indicador de ambiente de implantação',
      'Deployment environment indicator',
      'Indicador de entorno de despliegue',
      'Indicateur d’environnement de déploiement',
      lang
    ),
  };
}

export const DEPLOYMENT_PT_BR = deploymentI18n('pt-BR');
export const DEPLOYMENT_EN_US = deploymentI18n('en-US');
export const DEPLOYMENT_ES_ES = deploymentI18n('es-ES');
export const DEPLOYMENT_FR_FR = deploymentI18n('fr-FR');
