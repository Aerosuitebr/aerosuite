import type { TranslationDictionary } from '../translation.service';

function L(pt: string, en: string, es: string, fr: string, lang: 'pt' | 'en' | 'es' | 'fr'): string {
  switch (lang) {
    case 'pt':
      return pt;
    case 'en':
      return en;
    case 'es':
      return es;
    case 'fr':
      return fr;
  }
}

function dict(lang: 'pt' | 'en' | 'es' | 'fr'): TranslationDictionary {
  return {
    'ui.empty.title': L('Nenhum registro encontrado', 'No records found', 'Ningún registro encontrado', 'Aucun enregistrement', lang),
    'ui.empty.description': L(
      'Ajuste os filtros ou crie um novo registro para começar.',
      'Adjust filters or create a new record to get started.',
      'Ajuste los filtros o cree un registro nuevo.',
      'Ajustez les filtres ou créez un enregistrement.',
      lang
    ),
    'ui.skipToContent': L('Ir para o conteúdo principal', 'Skip to main content', 'Ir al contenido principal', 'Aller au contenu principal', lang),
    'ui.loading': L('Carregando…', 'Loading…', 'Cargando…', 'Chargement…', lang),
    'ui.list.refreshing': L(
      'Atualizando lista…',
      'Refreshing list…',
      'Actualizando lista…',
      'Actualisation de la liste…',
      lang
    ),
    'ui.skeleton.table': L('Carregando tabela', 'Loading table', 'Cargando tabla', 'Chargement du tableau', lang),
    'ui.error.generic': L('Ocorreu um erro. Tente novamente.', 'An error occurred. Please try again.', 'Ocurrió un error. Intente de nuevo.', 'Une erreur est survenue.', lang),
    'ui.error.network': L('Falha de conexão com o servidor.', 'Could not connect to the server.', 'Error de conexión con el servidor.', 'Échec de connexion au serveur.', lang),
    'ui.error.unauthorized': L('Sessão expirada ou sem permissão.', 'Session expired or insufficient permission.', 'Sesión expirada o sin permiso.', 'Session expirée ou permission insuffisante.', lang),
    'ui.error.notFound': L('Registro não encontrado.', 'Record not found.', 'Registro no encontrado.', 'Enregistrement introuvable.', lang),
    'ui.error.validation': L('Verifique os campos destacados.', 'Please check the highlighted fields.', 'Revise los campos resaltados.', 'Vérifiez les champs en surbrillance.', lang),
    'ui.pageHelp.open': L(
      'Ajuda sobre esta página',
      'Help for this page',
      'Ayuda sobre esta página',
      'Aide sur cette page',
      lang
    ),
    'ui.pageHelp.title': L('Ajuda', 'Help', 'Ayuda', 'Aide', lang),
    'ui.pageHelp.emptyTitle': L(
      'Nenhuma ajuda disponível',
      'No help available',
      'Ninguna ayuda disponible',
      'Aucune aide disponible',
      lang
    ),
    'ui.pageHelp.emptyDescription': L(
      'Esta página ainda não possui conteúdo de ajuda disponível.',
      'This page does not have help content yet.',
      'Esta página aún no tiene contenido de ayuda.',
      'Cette page n\'a pas encore de contenu d\'aide.',
      lang
    ),
    'ui.pageHelp.close': L('Fechar', 'Close', 'Cerrar', 'Fermer', lang),
  };
}

export const UI_PREMIUM_PT_BR = dict('pt');
export const UI_PREMIUM_EN_US = dict('en');
export const UI_PREMIUM_ES_ES = dict('es');
export const UI_PREMIUM_FR_FR = dict('fr');
