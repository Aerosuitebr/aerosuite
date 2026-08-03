import type { TranslationDictionary } from '../translation.service';

const CATALOG_PT: TranslationDictionary = {
  'tenantFeatures.catalog.estoque.saida.validacaoExtra': 'Saída de estoque — validação extra',
  'tenantFeatures.catalog.estoque.saida.validacaoExtra.description':
    'Exige OS e motivo detalhado (mín. 10 caracteres) em cada baixa de estoque.',
  'tenantFeatures.catalog.estoque.saida.exigeCertificadoPeca': 'Saída de estoque — certificado obrigatório',
  'tenantFeatures.catalog.estoque.saida.exigeCertificadoPeca.description':
    'Bloqueia saída e reserva quando o item exige certificado de peça incompleto.',
  'tenantFeatures.catalog.estoque.consultaQr.historicoExtendido': 'Consulta QR — histórico estendido',
  'tenantFeatures.catalog.estoque.consultaQr.historicoExtendido.description':
    'Amplia o histórico exibido na consulta por QR Code.',
  'tenantFeatures.catalog.comercial.proposta.camposExtras': 'Proposta comercial — campos extras',
  'tenantFeatures.catalog.comercial.proposta.camposExtras.description':
    'Campos adicionais no fluxo de propostas comerciais.',
  'tenantFeatures.catalog.mro.os.dashboardExtendido': 'OS — painel estendido',
  'tenantFeatures.catalog.mro.os.dashboardExtendido.description':
    'Métricas e widgets extras no painel de ordens de serviço.',
  'tenantFeatures.catalog.platform.ui.variantePremium': 'Interface — variante premium',
  'tenantFeatures.catalog.platform.ui.variantePremium.description':
    'Tema visual premium na interface (quando disponível).',
};

const CATALOG_EN: TranslationDictionary = {
  'tenantFeatures.catalog.estoque.saida.validacaoExtra': 'Stock issue — extra validation',
  'tenantFeatures.catalog.estoque.saida.validacaoExtra.description':
    'Requires work order and detailed reason (min. 10 characters) on each stock issue.',
  'tenantFeatures.catalog.estoque.saida.exigeCertificadoPeca': 'Stock issue — part certificate required',
  'tenantFeatures.catalog.estoque.saida.exigeCertificadoPeca.description':
    'Blocks issue and reservation when required part certificate data is incomplete.',
  'tenantFeatures.catalog.estoque.consultaQr.historicoExtendido': 'QR lookup — extended history',
  'tenantFeatures.catalog.estoque.consultaQr.historicoExtendido.description':
    'Expands history shown in QR code lookup.',
  'tenantFeatures.catalog.comercial.proposta.camposExtras': 'Commercial proposal — extra fields',
  'tenantFeatures.catalog.comercial.proposta.camposExtras.description':
    'Additional fields in the commercial proposal flow.',
  'tenantFeatures.catalog.mro.os.dashboardExtendido': 'Work order — extended dashboard',
  'tenantFeatures.catalog.mro.os.dashboardExtendido.description':
    'Extra metrics and widgets on the work order dashboard.',
  'tenantFeatures.catalog.platform.ui.variantePremium': 'UI — premium variant',
  'tenantFeatures.catalog.platform.ui.variantePremium.description':
    'Premium visual theme in the interface (when available).',
};

const CATALOG_ES: TranslationDictionary = {
  'tenantFeatures.catalog.estoque.saida.validacaoExtra': 'Salida de stock — validación extra',
  'tenantFeatures.catalog.estoque.saida.validacaoExtra.description':
    'Exige OT y motivo detallado (mín. 10 caracteres) en cada baja de stock.',
  'tenantFeatures.catalog.estoque.saida.exigeCertificadoPeca': 'Salida de stock — certificado obligatorio',
  'tenantFeatures.catalog.estoque.saida.exigeCertificadoPeca.description':
    'Bloquea salida y reserva si el certificado de pieza requerido está incompleto.',
  'tenantFeatures.catalog.estoque.consultaQr.historicoExtendido': 'Consulta QR — historial ampliado',
  'tenantFeatures.catalog.estoque.consultaQr.historicoExtendido.description':
    'Amplía el historial mostrado en la consulta por código QR.',
  'tenantFeatures.catalog.comercial.proposta.camposExtras': 'Propuesta comercial — campos extra',
  'tenantFeatures.catalog.comercial.proposta.camposExtras.description':
    'Campos adicionales en el flujo de propuestas comerciales.',
  'tenantFeatures.catalog.mro.os.dashboardExtendido': 'OT — panel ampliado',
  'tenantFeatures.catalog.mro.os.dashboardExtendido.description':
    'Métricas y widgets extra en el panel de órdenes de trabajo.',
  'tenantFeatures.catalog.platform.ui.variantePremium': 'Interfaz — variante premium',
  'tenantFeatures.catalog.platform.ui.variantePremium.description':
    'Tema visual premium en la interfaz (cuando esté disponible).',
};

const CATALOG_FR: TranslationDictionary = {
  'tenantFeatures.catalog.estoque.saida.validacaoExtra': 'Sortie stock — validation renforcée',
  'tenantFeatures.catalog.estoque.saida.validacaoExtra.description':
    'Exige l’OT et un motif détaillé (min. 10 caractères) à chaque sortie de stock.',
  'tenantFeatures.catalog.estoque.saida.exigeCertificadoPeca': 'Sortie stock — certificat pièce obligatoire',
  'tenantFeatures.catalog.estoque.saida.exigeCertificadoPeca.description':
    'Bloque la sortie et la réservation si le certificat de pièce requis est incomplet.',
  'tenantFeatures.catalog.estoque.consultaQr.historicoExtendido': 'Consultation QR — historique étendu',
  'tenantFeatures.catalog.estoque.consultaQr.historicoExtendido.description':
    'Élargit l’historique affiché dans la consultation par code QR.',
  'tenantFeatures.catalog.comercial.proposta.camposExtras': 'Proposition commerciale — champs supplémentaires',
  'tenantFeatures.catalog.comercial.proposta.camposExtras.description':
    'Champs supplémentaires dans le flux de propositions commerciales.',
  'tenantFeatures.catalog.mro.os.dashboardExtendido': 'OT — tableau de bord étendu',
  'tenantFeatures.catalog.mro.os.dashboardExtendido.description':
    'Indicateurs et widgets supplémentaires sur le tableau de bord des OT.',
  'tenantFeatures.catalog.platform.ui.variantePremium': 'Interface — variante premium',
  'tenantFeatures.catalog.platform.ui.variantePremium.description':
    'Thème visuel premium dans l’interface (lorsque disponible).',
};

const GUARD_PT: TranslationDictionary = {
  'auth.guard.tenantFeature.summary': 'Recurso não disponível',
  'auth.guard.tenantFeature.detail':
    'Esta funcionalidade não está habilitada para a sua organização. Contacte o suporte ou o operador da plataforma.',
};

const GUARD_EN: TranslationDictionary = {
  'auth.guard.tenantFeature.summary': 'Feature not available',
  'auth.guard.tenantFeature.detail':
    'This capability is not enabled for your organization. Contact support or your platform operator.',
};

const GUARD_ES: TranslationDictionary = {
  'auth.guard.tenantFeature.summary': 'Función no disponible',
  'auth.guard.tenantFeature.detail':
    'Esta capacidad no está habilitada para su organización. Contacte con soporte o el operador de la plataforma.',
};

const GUARD_FR: TranslationDictionary = {
  'auth.guard.tenantFeature.summary': 'Fonction non disponible',
  'auth.guard.tenantFeature.detail':
    'Cette fonction n’est pas activée pour votre organisation. Contactez le support ou l’opérateur de la plateforme.',
};

export const TENANT_FEATURES_I18N_PT_BR: TranslationDictionary = { ...CATALOG_PT, ...GUARD_PT };
export const TENANT_FEATURES_I18N_EN_US: TranslationDictionary = { ...CATALOG_EN, ...GUARD_EN };
export const TENANT_FEATURES_I18N_ES_ES: TranslationDictionary = { ...CATALOG_ES, ...GUARD_ES };
export const TENANT_FEATURES_I18N_FR_FR: TranslationDictionary = { ...CATALOG_FR, ...GUARD_FR };
