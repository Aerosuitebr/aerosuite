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
    'habilitacao.title': L(
      'Habilitações técnicas',
      'Technical authorizations',
      'Habilitaciones técnicas',
      'Habilitations techniques',
      lang
    ),
    'habilitacao.subtitle': L(
      'Licenças e qualificações de mecânicos, inspetores e responsável técnico (RT).',
      'Licenses and qualifications for mechanics, inspectors and accountable manager (AM).',
      'Licencias y cualificaciones de mecánicos, inspectores y responsable técnico (RT).',
      'Licences et qualifications des mécaniciens, inspecteurs et responsable technique (RT).',
      lang
    ),
    'habilitacao.alert.vencidas': L('Vencidas', 'Expired', 'Vencidas', 'Expirées', lang),
    'habilitacao.alert.proximas': L(
      'Próximas ({{dias}} dias)',
      'Upcoming ({{dias}} days)',
      'Próximas ({{dias}} días)',
      'À venir ({{dias}} jours)',
      lang
    ),
    'habilitacao.alert.ativas': L('Ativas', 'Active', 'Activas', 'Actives', lang),
    'habilitacao.col.usuario': L('Usuário', 'User', 'Usuario', 'Utilisateur', lang),
    'habilitacao.col.tipo': L('Tipo', 'Type', 'Tipo', 'Type', lang),
    'habilitacao.col.escopo': L('Escopo', 'Scope', 'Ámbito', 'Périmètre', lang),
    'habilitacao.col.identificador': L('Identificador', 'Identifier', 'Identificador', 'Identifiant', lang),
    'habilitacao.col.validade': L('Validade', 'Expiry', 'Validez', 'Validité', lang),
    'habilitacao.btn.novo': L('Nova habilitação', 'New authorization', 'Nueva habilitación', 'Nouvelle habilitation', lang),
    'habilitacao.dialog.novo': L('Nova habilitação', 'New authorization', 'Nueva habilitación', 'Nouvelle habilitation', lang),
    'habilitacao.dialog.editar': L('Editar habilitação', 'Edit authorization', 'Editar habilitación', 'Modifier l\'habilitation', lang),
    'habilitacao.field.usuario': L('Usuário', 'User', 'Usuario', 'Utilisateur', lang),
    'habilitacao.field.tipo': L('Tipo', 'Type', 'Tipo', 'Type', lang),
    'habilitacao.field.escopo': L('Escopo / categoria', 'Scope / category', 'Ámbito / categoría', 'Périmètre / catégorie', lang),
    'habilitacao.field.identificador': L('Nº licença / ANAC', 'License no. / authority', 'Nº licencia / autoridad', 'Nº licence / autorité', lang),
    'habilitacao.field.emissor': L('Emissor', 'Issuer', 'Emisor', 'Émetteur', lang),
    'habilitacao.field.dataEmissao': L('Data emissão', 'Issue date', 'Fecha emisión', 'Date d\'émission', lang),
    'habilitacao.field.dataValidade': L('Data validade', 'Expiry date', 'Fecha validez', 'Date de validité', lang),
    'habilitacao.field.obs': L('Observações', 'Remarks', 'Observaciones', 'Observations', lang),
    'habilitacao.field.ativo': L('Ativo', 'Active', 'Activo', 'Actif', lang),
    'habilitacao.tipo.MECANICO': L('Mecânico', 'Mechanic', 'Mecánico', 'Mécanicien', lang),
    'habilitacao.tipo.INSPETOR': L('Inspetor', 'Inspector', 'Inspector', 'Inspecteur', lang),
    'habilitacao.tipo.RT': L('Responsável técnico', 'Accountable manager', 'Responsable técnico', 'Responsable technique', lang),
    'habilitacao.tipo.OUTRO': L('Outro', 'Other', 'Otro', 'Autre', lang),
    'habilitacao.sev.VENCIDA': L('Vencida', 'Expired', 'Vencida', 'Expirée', lang),
    'habilitacao.sev.PROXIMA': L('Próxima', 'Upcoming', 'Próxima', 'Proche', lang),
    'habilitacao.sev.OK': L('OK', 'OK', 'OK', 'OK', lang),
    'habilitacao.empty': L(
      'Nenhuma habilitação registrada.',
      'No authorizations registered.',
      'Ninguna habilitación registrada.',
      'Aucune habilitation enregistrée.',
      lang
    ),
    'habilitacao.toast.salvo': L('Habilitação salva.', 'Authorization saved.', 'Habilitación guardada.', 'Habilitation enregistrée.', lang),
    'habilitacao.toast.excluido': L('Habilitação excluída.', 'Authorization deleted.', 'Habilitación eliminada.', 'Habilitation supprimée.', lang),
    'habilitacao.err.salvar': L('Falha ao salvar.', 'Failed to save.', 'Error al guardar.', 'Échec de l\'enregistrement.', lang),
    'habilitacao.confirm.excluir': L(
      'Excluir esta habilitação?',
      'Delete this authorization?',
      '¿Eliminar esta habilitación?',
      'Supprimer cette habilitation ?',
      lang
    ),
    'habilitacao.tooltip.cancelClose': L(
      'Cancelar e fechar',
      'Cancel and close',
      'Cancelar y cerrar',
      'Annuler et fermer',
      lang
    ),
    'habilitacao.tooltip.save': L(
      'Salvar nova habilitação',
      'Save new authorization',
      'Guardar nueva habilitación',
      'Enregistrer la nouvelle habilitation',
      lang
    ),
    'habilitacao.error.id_invalido': L('Identificador inválido.', 'Invalid identifier.', 'Identificador inválido.', 'Identifiant invalide.', lang),
    'habilitacao.error.nao_encontrada': L('Habilitação não encontrada.', 'Authorization not found.', 'Habilitación no encontrada.', 'Habilitation introuvable.', lang),
    'habilitacao.error.usuario_obrigatorio': L('Selecione o usuário.', 'Select a user.', 'Seleccione el usuario.', 'Sélectionnez l\'utilisateur.', lang),
    'habilitacao.error.usuario_nao_encontrado': L('Usuário não encontrado.', 'User not found.', 'Usuario no encontrado.', 'Utilisateur introuvable.', lang),
    'habilitacao.error.payload_vazio': L('Dados não enviados.', 'No data sent.', 'Datos no enviados.', 'Données non envoyées.', lang),
    'habilitacao.error.tipo_invalido': L('Tipo de habilitação inválido.', 'Invalid authorization type.', 'Tipo de habilitación inválido.', 'Type d\'habilitation invalide.', lang)
  };
}

export const CONFORMIDADE_HABILITACAO_PT_BR = dict('pt');
export const CONFORMIDADE_HABILITACAO_EN_US = dict('en');
export const CONFORMIDADE_HABILITACAO_ES_ES = dict('es');
export const CONFORMIDADE_HABILITACAO_FR_FR = dict('fr');
