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
    'capacidade.title': L(
      'Quadro de capacidade',
      'Capacity board',
      'Cuadro de capacidad',
      'Tableau de capacité',
      lang
    ),
    'capacidade.subtitle': L(
      'Fila de OS abertas por estágio — prioridade AOG e SLA.',
      'Open work orders by stage — AOG priority and SLA.',
      'Cola de OS abiertas por etapa — prioridad AOG y SLA.',
      'File des OS ouvertes par étape — priorité AOG et SLA.',
      lang
    ),
    'capacidade.total': L('{{n}} OS abertas', '{{n}} open WOs', '{{n}} OS abiertas', '{{n}} OS ouvertes', lang),
    'capacidade.col.AGUARDANDO': L('Aguardando', 'Waiting', 'En espera', 'En attente', lang),
    'capacidade.col.EM_EXECUCAO': L('Em execução', 'In progress', 'En ejecución', 'En cours', lang),
    'capacidade.col.AGUARDANDO_PECAS': L('Aguardando peças', 'Awaiting parts', 'Esperando piezas', 'En attente pièces', lang),
    'capacidade.col.INSPECAO': L('Inspeção / liberação', 'Inspection / release', 'Inspección / liberación', 'Inspection / libération', lang),
    'capacidade.card.position': L('Fila #{{n}}', 'Queue #{{n}}', 'Fila #{{n}}', 'File #{{n}}', lang),
    'capacidade.priority.AOG': L('AOG', 'AOG', 'AOG', 'AOG', lang),
    'capacidade.priority.NORMAL': L('Normal', 'Normal', 'Normal', 'Normal', lang),
    'capacidade.sla.OK': L('No prazo', 'On track', 'En plazo', 'Dans les délais', lang),
    'capacidade.sla.ATENCAO': L('Atenção SLA', 'SLA warning', 'Atención SLA', 'Alerte SLA', lang),
    'capacidade.sla.ATRASADO': L('Atrasado', 'Overdue', 'Atrasado', 'En retard', lang),
    'capacidade.edit.title': L('Atualizar fila', 'Update queue', 'Actualizar fila', 'Mettre à jour la file', lang),
    'capacidade.edit.stage': L('Estágio', 'Stage', 'Etapa', 'Étape', lang),
    'capacidade.edit.priority': L('Prioridade', 'Priority', 'Prioridad', 'Priorité', lang),
    'capacidade.edit.dueDate': L('Previsão de conclusão', 'Expected completion', 'Previsión de cierre', 'Fin prévue', lang),
    'capacidade.btn.save': L('Salvar', 'Save', 'Guardar', 'Enregistrer', lang),
    'capacidade.btn.cancel': L('Cancelar', 'Cancel', 'Cancelar', 'Annuler', lang),
    'capacidade.empty': L('Nenhuma OS nesta coluna.', 'No work orders in this column.', 'Ninguna OS en esta columna.', 'Aucune OS dans cette colonne.', lang),
    'capacidade.col.loadMore': L(
      'Mostrar mais ({{n}} restantes)',
      'Show more ({{n}} remaining)',
      'Mostrar más ({{n}} restantes)',
      'Afficher plus ({{n}} restantes)',
      lang
    ),
    'capacidade.err.load': L('Falha ao carregar o quadro.', 'Failed to load the board.', 'Error al cargar el cuadro.', 'Échec du chargement du tableau.', lang),
    'capacidade.toast.saved': L('Fila atualizada.', 'Queue updated.', 'Fila actualizada.', 'File mise à jour.', lang),
    'capacidade.badge.deficitKit': L(
      'Déficit kit FCU',
      'FCU kit shortage',
      'Déficit kit FCU',
      'Déficit kit FCU',
      lang
    ),
    'capacidade.filter.hangar': L('Hangar', 'Hangar', 'Hangar', 'Hangar', lang),
    'capacidade.filter.allHangares': L(
      'Todos os hangares',
      'All hangars',
      'Todos los hangares',
      'Tous les hangars',
      lang
    ),
    'capacidade.edit.hangar': L('Hangar', 'Hangar', 'Hangar', 'Hangar', lang),
    'capacidade.card.hangar': L('Hangar: {{nome}}', 'Hangar: {{nome}}', 'Hangar: {{nome}}', 'Hangar : {{nome}}', lang),
    'capacidade.drag.hint': L(
      'Arraste o cartão para outra coluna ou clique para editar.',
      'Drag the card to another column or click to edit.',
      'Arrastre la tarjeta a otra columna o haga clic para editar.',
      'Glissez la carte vers une autre colonne ou cliquez pour modifier.',
      lang
    ),
    'capacidade.toast.moved': L('Estágio atualizado.', 'Stage updated.', 'Etapa actualizada.', 'Étape mise à jour.', lang),
    'externo.capacidade.title': L(
      'Fila e prazos das suas OS',
      'Your work order queue and deadlines',
      'Fila y plazos de sus OS',
      'File et délais de vos OS',
      lang
    ),
    'externo.capacidade.subtitle': L(
      'Posição na fila da oficina e status do SLA (somente leitura).',
      'Shop queue position and SLA status (read-only).',
      'Posición en la fila del taller y estado del SLA (solo lectura).',
      'Position dans la file de l’atelier et statut SLA (lecture seule).',
      lang
    ),
    'externo.capacidade.empty': L(
      'Nenhuma OS aberta vinculada à sua conta.',
      'No open work orders linked to your account.',
      'Ninguna OS abierta vinculada a su cuenta.',
      'Aucune OS ouverte liée à votre compte.',
      lang
    ),
    'externo.capacidade.linkOs': L('Ver OS', 'View WO', 'Ver OS', 'Voir OS', lang),
    'capacidade.error.body_obrigatorio': L(
      'Dados obrigatórios ausentes.',
      'Required data is missing.',
      'Faltan datos obligatorios.',
      'Données obligatoires manquantes.',
      lang
    ),
    'capacidade.error.prioridade_invalida': L(
      'Prioridade inválida.',
      'Invalid priority.',
      'Prioridad no válida.',
      'Priorité non valide.',
      lang
    ),
    'capacidade.error.estagio_invalido': L(
      'Estágio inválido.',
      'Invalid stage.',
      'Etapa no válida.',
      'Étape non valide.',
      lang
    ),
    'capacidade.error.data_prevista_invalida': L(
      'Data prevista inválida.',
      'Invalid expected date.',
      'Fecha prevista no válida.',
      'Date prévue non valide.',
      lang
    ),
    'capacidade.error.hangar_invalido': L(
      'Hangar inválido.',
      'Invalid hangar.',
      'Hangar no válido.',
      'Hangar non valide.',
      lang
    ),
    'capacidade.error.os_nao_encontrada': L(
      'OS não encontrada.',
      'Work order not found.',
      'OS no encontrada.',
      'OS introuvable.',
      lang
    ),
    'capacidade.error.os_fechada': L(
      'OS já está fechada.',
      'Work order is already closed.',
      'La OS ya está cerrada.',
      'L’OS est déjà fermée.',
      lang
    ),
    'capacidade.error.batch_vazio': L(
      'Nenhuma atualização no lote.',
      'No updates in batch.',
      'Ninguna actualización en el lote.',
      'Aucune mise à jour dans le lot.',
      lang
    ),
    'hangar.error.body_obrigatorio': L(
      'Dados do hangar ausentes.',
      'Hangar data is missing.',
      'Faltan datos del hangar.',
      'Données du hangar manquantes.',
      lang
    ),
    'hangar.error.codigo_obrigatorio': L(
      'Código do hangar é obrigatório.',
      'Hangar code is required.',
      'El código del hangar es obligatorio.',
      'Le code du hangar est obligatoire.',
      lang
    ),
    'hangar.error.nome_obrigatorio': L(
      'Nome do hangar é obrigatório.',
      'Hangar name is required.',
      'El nombre del hangar es obligatorio.',
      'Le nom du hangar est obligatoire.',
      lang
    ),
    'hangar.error.codigo_duplicado': L(
      'Já existe um hangar com este código.',
      'A hangar with this code already exists.',
      'Ya existe un hangar con este código.',
      'Un hangar avec ce code existe déjà.',
      lang
    ),
    'hangar.error.nao_encontrado': L(
      'Hangar não encontrado.',
      'Hangar not found.',
      'Hangar no encontrado.',
      'Hangar introuvable.',
      lang
    ),
    'capacidade.hangar.manage': L('Gerenciar hangares', 'Manage hangars', 'Gestionar hangares', 'Gérer les hangars', lang),
    'capacidade.hangar.back': L('Voltar ao quadro', 'Back to board', 'Volver al cuadro', 'Retour au tableau', lang),
    'capacidade.hangar.title': L('Hangares', 'Hangars', 'Hangares', 'Hangars', lang),
    'capacidade.hangar.subtitle': L(
      'Bays / hangares físicos usados no quadro de capacidade.',
      'Physical bays / hangars used on the capacity board.',
      'Bays / hangares físicos usados en el cuadro de capacidad.',
      'Bays / hangars physiques utilisés sur le tableau de capacité.',
      lang
    ),
    'capacidade.hangar.new': L('Novo hangar', 'New hangar', 'Nuevo hangar', 'Nouveau hangar', lang),
    'capacidade.hangar.edit': L('Editar hangar', 'Edit hangar', 'Editar hangar', 'Modifier le hangar', lang),
    'capacidade.hangar.col.codigo': L('Código', 'Code', 'Código', 'Code', lang),
    'capacidade.hangar.col.nome': L('Nome', 'Name', 'Nombre', 'Nom', lang),
    'capacidade.hangar.col.ordem': L('Ordem', 'Order', 'Orden', 'Ordre', lang),
    'capacidade.hangar.col.ativo': L('Ativo', 'Active', 'Activo', 'Actif', lang),
    'capacidade.hangar.yes': L('Sim', 'Yes', 'Sí', 'Oui', lang),
    'capacidade.hangar.no': L('Não', 'No', 'No', 'Non', lang),
    'capacidade.hangar.saved': L('Hangar salvo.', 'Hangar saved.', 'Hangar guardado.', 'Hangar enregistré.', lang),
    'capacidade.hangar.empty.title': L('Nenhum hangar cadastrado', 'No hangars registered', 'Ningún hangar registrado', 'Aucun hangar enregistré', lang),
    'capacidade.bulk.mode': L('Seleção em lote', 'Bulk selection', 'Selección en lote', 'Sélection groupée', lang),
    'capacidade.bulk.selected': L('{{n}} selecionada(s)', '{{n}} selected', '{{n}} seleccionada(s)', '{{n}} sélectionnée(s)', lang),
    'capacidade.bulk.moveTo': L('Mover para', 'Move to', 'Mover a', 'Déplacer vers', lang),
    'capacidade.bulk.apply': L('Aplicar', 'Apply', 'Aplicar', 'Appliquer', lang),
    'capacidade.bulk.clear': L('Limpar seleção', 'Clear selection', 'Limpiar selección', 'Effacer la sélection', lang),
    'capacidade.toast.bulkMoved': L(
      '{{n}} OS atualizadas.',
      '{{n}} WOs updated.',
      '{{n}} OS actualizadas.',
      '{{n}} OS mises à jour.',
      lang
    )
  };
}

export const CAPACIDADE_QUADRO_PT_BR = dict('pt');
export const CAPACIDADE_QUADRO_EN_US = dict('en');
export const CAPACIDADE_QUADRO_ES_ES = dict('es');
export const CAPACIDADE_QUADRO_FR_FR = dict('fr');
