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
    'onboarding.aria.region': L(
      'Dica contextual',
      'Contextual tip',
      'Sugerencia contextual',
      'Conseil contextuel',
      lang
    ),
    'onboarding.btn.dismiss': L('Dispensar dica', 'Dismiss tip', 'Descartar sugerencia', 'Ignorer le conseil', lang),
    'onboarding.home.title': L(
      'Painel de comando',
      'Command center',
      'Panel de control',
      'Centre de pilotage',
      lang
    ),
    'onboarding.home.body': L(
      'Use os atalhos do flight-deck para OS, estoque, AD/SB e suporte. O menu lateral agrupa todos os módulos.',
      'Use flight-deck shortcuts for work orders, inventory, AD/SB and support. The sidebar groups every module.',
      'Use los accesos del flight-deck para OS, inventario, AD/SB y soporte. El menú lateral agrupa todos los módulos.',
      'Utilisez le flight-deck pour les OS, le stock, les AD/SB et le support. La barre latérale regroupe tous les modules.',
      lang
    ),
    'onboarding.estoqueItens.title': L(
      'Rastreio de peças',
      'Parts tracking',
      'Trazabilidad de piezas',
      'Traçabilité des pièces',
      lang
    ),
    'onboarding.estoqueItens.body': L(
      'Filtre por PN, status ou localização. Imprima etiquetas térmicas ou em PDF direto da linha da tabela.',
      'Filter by part number, status or location. Print thermal or PDF labels from the row actions.',
      'Filtre por PN, estado o ubicación. Imprima etiquetas térmicas o PDF desde la fila.',
      'Filtrez par PN, statut ou emplacement. Imprimez des étiquettes thermiques ou PDF depuis la ligne.',
      lang
    ),
    'onboarding.osList.title': L(
      'Ordens de serviço',
      'Work orders',
      'Órdenes de servicio',
      'Ordres de service',
      lang
    ),
    'onboarding.osList.body': L(
      'Crie uma OS, anexe documentos e acompanhe AD/SB aplicáveis. Use a lupa para recuperar consultas salvas.',
      'Create a work order, attach files and track applicable AD/SB. Use search to restore saved queries.',
      'Cree una OS, adjunte archivos y siga AD/SB aplicables. Use la búsqueda para consultas guardadas.',
      'Créez une OS, joignez des fichiers et suivez les AD/SB. Utilisez la recherche pour les requêtes enregistrées.',
      lang
    ),
    'onboarding.backup.title': L(
      'Backups do banco',
      'Database backups',
      'Copias de la base',
      'Sauvegardes base de données',
      lang
    ),
    'onboarding.backup.body': L(
      'Configure conexão, pasta de destino e agendamento. Teste a conexão antes de salvar e execute um backup manual quando precisar.',
      'Set connection, destination folder and schedule. Test the connection before saving and run a manual backup when needed.',
      'Configure conexión, carpeta y programación. Pruebe la conexión antes de guardar y ejecute una copia manual si hace falta.',
      'Configurez la connexion, le dossier et la planification. Testez avant d’enregistrer et lancez une sauvegarde manuelle si besoin.',
      lang
    ),
    'onboarding.suporte.title': L(
      'Central de suporte',
      'Support hub',
      'Centro de soporte',
      'Centre de support',
      lang
    ),
    'onboarding.suporte.body': L(
      'Abra tickets, filtre por status nos cartões superiores e acompanhe SLAs na fila de atendimento.',
      'Open tickets, filter by status using the top cards and monitor SLAs in the queue.',
      'Abra tickets, filtre por estado en las tarjetas superiores y siga los SLA en la cola.',
      'Ouvrez des tickets, filtrez par statut via les cartes et suivez les SLA dans la file.',
      lang
    )
  };
}

export const ONBOARDING_I18N_PT_BR = dict('pt');
export const ONBOARDING_I18N_EN_US = dict('en');
export const ONBOARDING_I18N_ES_ES = dict('es');
export const ONBOARDING_I18N_FR_FR = dict('fr');
