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
    'estoque.quarentena.title': L('Quarentena', 'Quarantine', 'Cuarentena', 'Quarantaine', lang),
    'estoque.quarentena.subtitle': L(
      'Material não conforme aguardando análise e desfecho.',
      'Non-conforming material awaiting review and disposition.',
      'Material no conforme en espera de análisis y resolución.',
      'Matériel non conforme en attente d’analyse et de décision.',
      lang
    ),
    'estoque.quarentena.col.motivo': L('Motivo', 'Reason', 'Motivo', 'Motif', lang),
    'estoque.quarentena.col.inicio': L('Início', 'Started', 'Inicio', 'Début', lang),
    'estoque.quarentena.col.usuario': L('Registrado por', 'Recorded by', 'Registrado por', 'Enregistré par', lang),
    'estoque.quarentena.btn.liberar': L('Resolver quarentena', 'Resolve quarantine', 'Resolver cuarentena', 'Résoudre la quarantaine', lang),
    'estoque.quarentena.btn.enviar': L('Enviar para quarentena', 'Send to quarantine', 'Enviar a cuarentena', 'Mettre en quarantaine', lang),
    'estoque.quarentena.dialog.enviarTitle': L('Enviar para quarentena', 'Send to quarantine', 'Enviar a cuarentena', 'Mettre en quarantaine', lang),
    'estoque.quarentena.dialog.liberarTitle': L('Desfecho da quarentena', 'Quarantine disposition', 'Resolución de cuarentena', 'Issue de quarantaine', lang),
    'estoque.quarentena.field.motivo': L('Motivo da retenção', 'Hold reason', 'Motivo de retención', 'Motif de rétention', lang),
    'estoque.quarentena.field.obs': L('Observações', 'Remarks', 'Observaciones', 'Observations', lang),
    'estoque.quarentena.field.disposicao': L('Desfecho', 'Disposition', 'Resolución', 'Décision', lang),
    'estoque.quarentena.disp.LIBERAR_ESTOQUE': L(
      'Liberar para estoque (disponível)',
      'Release to stock (available)',
      'Liberar a stock (disponible)',
      'Remettre en stock (disponible)',
      lang
    ),
    'estoque.quarentena.disp.DESCARTAR': L('Descartar', 'Scrap', 'Descartar', 'Mettre au rebut', lang),
    'estoque.quarentena.disp.DEVOLVER_FORNECEDOR': L(
      'Devolver ao fornecedor',
      'Return to supplier',
      'Devolver al proveedor',
      'Retourner au fournisseur',
      lang
    ),
    'estoque.quarentena.empty': L(
      'Nenhum item em quarentena.',
      'No items in quarantine.',
      'Ningún ítem en cuarentena.',
      'Aucun article en quarantaine.',
      lang
    ),
    'estoque.quarentena.toast.enviado': L('Item enviado para quarentena.', 'Item sent to quarantine.', 'Ítem enviado a cuarentena.', 'Article mis en quarantaine.', lang),
    'estoque.quarentena.toast.liberado': L('Quarentena resolvida.', 'Quarantine resolved.', 'Cuarentena resuelta.', 'Quarantaine résolue.', lang),
    'estoque.quarentena.error.motivo_obrigatorio': L('Informe o motivo da quarentena.', 'Enter the quarantine reason.', 'Indique el motivo de la cuarentena.', 'Indiquez le motif de la quarantaine.', lang),
    'estoque.quarentena.error.status_invalido_envio': L(
      'Somente itens disponíveis ou reservados podem ir para quarentena.',
      'Only available or reserved items can be quarantined.',
      'Solo ítems disponibles o reservados pueden ir a cuarentena.',
      'Seuls les articles disponibles ou réservés peuvent être mis en quarantaine.',
      lang
    ),
    'estoque.quarentena.error.nao_em_quarentena': L('Item não está em quarentena.', 'Item is not in quarantine.', 'El ítem no está en cuarentena.', 'L’article n’est pas en quarantaine.', lang),
    'estoque.quarentena.error.disposicao_obrigatoria': L('Selecione o desfecho.', 'Select a disposition.', 'Seleccione la resolución.', 'Sélectionnez la décision.', lang),
    'estoque.quarentena.error.item_indisponivel_saida': L(
      'Item em quarentena ou bloqueado não pode ser consumido na OS.',
      'Quarantined or blocked items cannot be issued to a work order.',
      'Ítems en cuarentena o bloqueados no pueden consumirse en la OS.',
      'Les articles en quarantaine ou bloqués ne peuvent pas être consommés sur l’OS.',
      lang
    ),
    'estoque.itens.status.QUARENTENA': L('Quarentena', 'Quarantine', 'Cuarentena', 'Quarantaine', lang),
    'estoque.quarentena.error.usuario_nao_autenticado': L(
      'É necessário estar autenticado para alterar quarentena.',
      'You must be signed in to change quarantine status.',
      'Debe iniciar sesión para cambiar la cuarentena.',
      'Vous devez être connecté pour modifier la quarantaine.',
      lang
    )
  };
}

export const ESTOQUE_QUARENTENA_PT_BR = dict('pt');
export const ESTOQUE_QUARENTENA_EN_US = dict('en');
export const ESTOQUE_QUARENTENA_ES_ES = dict('es');
export const ESTOQUE_QUARENTENA_FR_FR = dict('fr');
