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

function shared(lang: 'pt' | 'en' | 'es' | 'fr'): TranslationDictionary {
  return {
    'conformidade.alert.vencidas': L('Vencidas', 'Expired', 'Vencidas', 'Expirées', lang),
    'conformidade.alert.proximas': L(
      'Próximas ({{dias}} dias)',
      'Upcoming ({{dias}} days)',
      'Próximas ({{dias}} días)',
      'À venir ({{dias}} jours)',
      lang
    ),
    'conformidade.alert.ativos': L('Ativos', 'Active', 'Activos', 'Actifs', lang),
    'conformidade.sev.VENCIDA': L('Vencida', 'Expired', 'Vencida', 'Expirée', lang),
    'conformidade.sev.PROXIMA': L('Próxima', 'Upcoming', 'Próxima', 'Proche', lang),
    'conformidade.toast.salvo': L('Registro salvo.', 'Record saved.', 'Registro guardado.', 'Enregistrement enregistré.', lang),
    'conformidade.toast.excluido': L('Registro excluído.', 'Record deleted.', 'Registro eliminado.', 'Enregistrement supprimé.', lang),
    'conformidade.err.salvar': L('Falha ao salvar.', 'Failed to save.', 'Error al guardar.', 'Échec de l\'enregistrement.', lang),
    'conformidade.confirm.excluir': L(
      'Excluir este registro?',
      'Delete this record?',
      '¿Eliminar este registro?',
      'Supprimer cet enregistrement ?',
      lang
    )
  };
}

function documentos(lang: 'pt' | 'en' | 'es' | 'fr'): TranslationDictionary {
  return {
    'sgq.documento.title': L(
      'Documentos controlados',
      'Controlled documents',
      'Documentos controlados',
      'Documents maîtrisés',
      lang
    ),
    'sgq.documento.subtitle': L(
      'MOE, POP e procedimentos com revisão, vigência e status.',
      'MOE, SOPs and procedures with revision, validity and status.',
      'MOE, POP y procedimientos con revisión, vigencia y estado.',
      'MOE, POP et procédures avec révision, validité et statut.',
      lang
    ),
    'sgq.documento.btn.novo': L('Novo documento', 'New document', 'Nuevo documento', 'Nouveau document', lang),
    'sgq.documento.col.codigo': L('Código', 'Code', 'Código', 'Code', lang),
    'sgq.documento.col.titulo': L('Título', 'Title', 'Título', 'Titre', lang),
    'sgq.documento.col.tipo': L('Tipo', 'Type', 'Tipo', 'Type', lang),
    'sgq.documento.col.revisao': L('Revisão', 'Revision', 'Revisión', 'Révision', lang),
    'sgq.documento.col.vigencia': L('Vigência', 'Validity', 'Vigencia', 'Validité', lang),
    'sgq.documento.col.status': L('Status', 'Status', 'Estado', 'Statut', lang),
    'sgq.documento.field.tipo': L('Tipo', 'Type', 'Tipo', 'Type', lang),
    'sgq.documento.field.codigo': L('Código', 'Code', 'Código', 'Code', lang),
    'sgq.documento.field.titulo': L('Título', 'Title', 'Título', 'Titre', lang),
    'sgq.documento.field.revisao': L('Revisão', 'Revision', 'Revisión', 'Révision', lang),
    'sgq.documento.field.dataRevisao': L('Data revisão', 'Revision date', 'Fecha revisión', 'Date de révision', lang),
    'sgq.documento.field.dataVigencia': L('Data vigência', 'Valid until', 'Fecha vigencia', 'Date de validité', lang),
    'sgq.documento.field.status': L('Status', 'Status', 'Estado', 'Statut', lang),
    'sgq.documento.field.referencia': L('Referência arquivo', 'File reference', 'Referencia archivo', 'Référence fichier', lang),
    'sgq.documento.field.arquivo': L('PDF controlado', 'Controlled PDF', 'PDF controlado', 'PDF maîtrisé', lang),
    'sgq.documento.btn.upload': L('Enviar PDF', 'Upload PDF', 'Subir PDF', 'Téléverser PDF', lang),
    'sgq.documento.btn.download': L('Baixar PDF', 'Download PDF', 'Descargar PDF', 'Télécharger PDF', lang),
    'sgq.documento.toast.arquivo': L('PDF anexado.', 'PDF attached.', 'PDF adjunto.', 'PDF joint.', lang),
    'sgq.documento.err.arquivo': L('Falha ao enviar PDF.', 'Failed to upload PDF.', 'Error al subir PDF.', 'Échec du téléversement PDF.', lang),
    'sgq.documento.hint.arquivo': L(
      'Salve o documento antes de anexar o PDF (máx. 25 MB).',
      'Save the document before attaching the PDF (max 25 MB).',
      'Guarde el documento antes de adjuntar el PDF (máx. 25 MB).',
      'Enregistrez le document avant de joindre le PDF (max. 25 Mo).',
      lang
    ),
    'sgq.documento.field.obs': L('Observações', 'Remarks', 'Observaciones', 'Observations', lang),
    'sgq.documento.tipo.MOE': L('MOE', 'MOE', 'MOE', 'MOE', lang),
    'sgq.documento.tipo.POP': L('POP', 'SOP', 'POP', 'POP', lang),
    'sgq.documento.tipo.PROCEDIMENTO': L('Procedimento', 'Procedure', 'Procedimiento', 'Procédure', lang),
    'sgq.documento.tipo.MANUAL': L('Manual', 'Manual', 'Manual', 'Manuel', lang),
    'sgq.documento.tipo.FORMULARIO': L('Formulário', 'Form', 'Formulario', 'Formulaire', lang),
    'sgq.documento.tipo.OUTRO': L('Outro', 'Other', 'Otro', 'Autre', lang),
    'sgq.documento.status.RASCUNHO': L('Rascunho', 'Draft', 'Borrador', 'Brouillon', lang),
    'sgq.documento.status.VIGENTE': L('Vigente', 'Current', 'Vigente', 'En vigueur', lang),
    'sgq.documento.status.OBSOLETO': L('Obsoleto', 'Obsolete', 'Obsoleto', 'Obsolète', lang),
    'sgq.documento.btn.historico': L('Histórico', 'History', 'Historial', 'Historique', lang),
    'sgq.documento.btn.novaRevisao': L('Nova revisão', 'New revision', 'Nueva revisión', 'Nouvelle révision', lang),
    'sgq.documento.btn.publicarRevisao': L('Publicar revisão', 'Publish revision', 'Publicar revisión', 'Publier la révision', lang),
    'sgq.documento.historico.title': L('Histórico de revisões', 'Revision history', 'Historial de revisiones', 'Historique des révisions', lang),
    'sgq.documento.historico.loading': L('Carregando histórico…', 'Loading history…', 'Cargando historial…', 'Chargement de l\'historique…', lang),
    'sgq.documento.historico.empty': L('Nenhum evento registrado.', 'No events recorded.', 'Ningún evento registrado.', 'Aucun événement enregistré.', lang),
    'sgq.documento.historico.col.data': L('Data', 'Date', 'Fecha', 'Date', lang),
    'sgq.documento.historico.col.revisao': L('Revisão', 'Revision', 'Revisión', 'Révision', lang),
    'sgq.documento.historico.col.status': L('Status', 'Status', 'Estado', 'Statut', lang),
    'sgq.documento.historico.col.usuario': L('Usuário', 'User', 'Usuario', 'Utilisateur', lang),
    'sgq.documento.novaRevisao.title': L('Publicar nova revisão', 'Publish new revision', 'Publicar nueva revisión', 'Publier une nouvelle révision', lang),
    'sgq.documento.novaRevisao.hint': L(
      'A revisão anterior de {{codigo}} será marcada como obsoleta.',
      'The previous revision of {{codigo}} will be marked obsolete.',
      'La revisión anterior de {{codigo}} se marcará como obsoleta.',
      'La révision précédente de {{codigo}} sera marquée obsolète.',
      lang
    ),
    'sgq.documento.novaRevisao.ok': L('Nova revisão publicada.', 'New revision published.', 'Nueva revisión publicada.', 'Nouvelle révision publiée.', lang),
    'sgq.documento.empty': L(
      'Nenhum documento registrado.',
      'No documents registered.',
      'Ningún documento registrado.',
      'Aucun document enregistré.',
      lang
    ),
    'sgq.documento.tooltip.cancelClose': L(
      'Cancelar e fechar',
      'Cancel and close',
      'Cancelar y cerrar',
      'Annuler et fermer',
      lang
    ),
    'sgq.documento.tooltip.save': L(
      'Salvar novo documento',
      'Save new document',
      'Guardar nuevo documento',
      'Enregistrer le nouveau document',
      lang
    )
  };
}

function treinamentos(lang: 'pt' | 'en' | 'es' | 'fr'): TranslationDictionary {
  return {
    'conformidade.treinamento.title': L(
      'Treinamentos',
      'Training records',
      'Capacitaciones',
      'Formations',
      lang
    ),
    'conformidade.treinamento.subtitle': L(
      'Registros de treinamento e reciclagem formal (distinto de habilitação técnica).',
      'Formal training and recurrent training records (separate from technical authorization).',
      'Registros de capacitación y reciclaje formal (distinto de habilitación técnica).',
      'Registres de formation et recyclage formel (distinct de l\'habilitation technique).',
      lang
    ),
    'conformidade.treinamento.btn.novo': L('Novo treinamento', 'New training', 'Nueva capacitación', 'Nouvelle formation', lang),
    'conformidade.treinamento.col.usuario': L('Usuário', 'User', 'Usuario', 'Utilisateur', lang),
    'conformidade.treinamento.col.curso': L('Curso', 'Course', 'Curso', 'Cours', lang),
    'conformidade.treinamento.col.carga': L('Carga horária', 'Hours', 'Carga horaria', 'Heures', lang),
    'conformidade.treinamento.col.validade': L('Validade', 'Expiry', 'Validez', 'Validité', lang),
    'conformidade.treinamento.field.usuario': L('Usuário', 'User', 'Usuario', 'Utilisateur', lang),
    'conformidade.treinamento.field.curso': L('Curso', 'Course', 'Curso', 'Cours', lang),
    'conformidade.treinamento.field.cursoPh': L(
      'Selecione ou digite o curso',
      'Select or type the course',
      'Seleccione o escriba el curso',
      'Sélectionnez ou saisissez le cours',
      lang
    ),
    'conformidade.treinamento.field.carga': L('Carga horária (h)', 'Hours', 'Carga horaria (h)', 'Heures (h)', lang),
    'conformidade.treinamento.field.conclusao': L('Data conclusão', 'Completion date', 'Fecha conclusión', 'Date de fin', lang),
    'conformidade.treinamento.field.validade': L('Data validade', 'Expiry date', 'Fecha validez', 'Date de validité', lang),
    'conformidade.treinamento.field.certificador': L('Certificador', 'Certifier', 'Certificador', 'Certificateur', lang),
    'conformidade.treinamento.field.obs': L('Observações', 'Remarks', 'Observaciones', 'Observations', lang),
    'conformidade.treinamento.empty': L(
      'Nenhum treinamento registrado.',
      'No training records.',
      'Ninguna capacitación registrada.',
      'Aucune formation enregistrée.',
      lang
    ),
    'conformidade.treinamento.col.turma': L('Turma', 'Class', 'Turma', 'Promotion', lang),
    'conformidade.treinamento.field.turma': L('Referência da turma', 'Class reference', 'Referencia de turma', 'Référence promotion', lang),
    'conformidade.treinamento.field.presente': L('Presente na lista', 'Present on attendance list', 'Presente en lista', 'Présent sur la liste', lang),
    'conformidade.treinamento.lista.turma': L('Turma (lista de presença)', 'Class (attendance list)', 'Turma (lista de asistencia)', 'Promotion (liste de présence)', lang),
    'conformidade.treinamento.lista.turmaPh': L('Ex.: TURMA-2026-01', 'E.g. CLASS-2026-01', 'Ej.: TURMA-2026-01', 'Ex. : PROMO-2026-01', lang),
    'conformidade.treinamento.lista.export': L('Exportar PDF', 'Export PDF', 'Exportar PDF', 'Exporter PDF', lang),
    'conformidade.treinamento.lista.err': L('Falha ao gerar lista de presença.', 'Failed to generate attendance list.', 'Error al generar lista de asistencia.', 'Échec de génération de la liste de présence.', lang),
    'conformidade.treinamento.tooltip.cancelClose': L(
      'Cancelar e fechar',
      'Cancel and close',
      'Cancelar y cerrar',
      'Annuler et fermer',
      lang
    ),
    'conformidade.treinamento.tooltip.save': L(
      'Salvar treinamento',
      'Save training',
      'Guardar capacitación',
      'Enregistrer la formation',
      lang
    ),
    'conformidade.treinamento.err.camposObrigatorios': L(
      'Preencha usuário e curso.',
      'Fill in user and course.',
      'Complete usuario y curso.',
      'Renseignez l\'utilisateur et le cours.',
      lang
    ),
    'conformidade.treinamento.err.cargaInvalida': L(
      'Informe carga horária maior ou igual a 1.',
      'Enter workload hours greater than or equal to 1.',
      'Indique carga horaria mayor o igual a 1.',
      'Indiquez un nombre d\'heures supérieur ou égal à 1.',
      lang
    )
  };
}

function contingencia(lang: 'pt' | 'en' | 'es' | 'fr'): TranslationDictionary {
  return {
    'conformidade.contingencia.title': L('Reconciliação pós-contingência', 'Post-contingency reconciliation', 'Reconciliación post-contingencia', 'Réconciliation post-contingence', lang),
    'conformidade.contingencia.subtitle': L(
      'Checklist de reconciliação após indisponibilidade do sistema (plano contingência §8.4).',
      'Reconciliation checklist after system unavailability (contingency plan §8.4).',
      'Checklist de reconciliación tras indisponibilidad del sistema (plan contingencia §8.4).',
      'Checklist de réconciliation après indisponibilité du système (plan contingence §8.4).',
      lang
    ),
    'conformidade.contingencia.btn.novo': L('Nova reconciliação', 'New reconciliation', 'Nueva reconciliación', 'Nouvelle réconciliation', lang),
    'conformidade.contingencia.btn.editar': L('Editar reconciliação', 'Edit reconciliation', 'Editar reconciliación', 'Modifier réconciliation', lang),
    'conformidade.contingencia.col.titulo': L('Título', 'Title', 'Título', 'Titre', lang),
    'conformidade.contingencia.col.periodo': L('Período', 'Period', 'Período', 'Période', lang),
    'conformidade.contingencia.col.progresso': L('Progresso', 'Progress', 'Progreso', 'Progression', lang),
    'conformidade.contingencia.col.status': L('Status', 'Status', 'Estado', 'Statut', lang),
    'conformidade.contingencia.field.titulo': L('Título', 'Title', 'Título', 'Titre', lang),
    'conformidade.contingencia.field.osId': L('OS (opcional)', 'WO (optional)', 'OS (opcional)', 'OS (facultatif)', lang),
    'conformidade.contingencia.field.status': L('Status', 'Status', 'Estado', 'Statut', lang),
    'conformidade.contingencia.field.periodoInicio': L('Período início', 'Period start', 'Inicio período', 'Début période', lang),
    'conformidade.contingencia.field.periodoFim': L('Período fim', 'Period end', 'Fin período', 'Fin période', lang),
    'conformidade.contingencia.field.obs': L('Observações', 'Remarks', 'Observaciones', 'Observations', lang),
    'conformidade.contingencia.checklist.title': L('Checklist de reconciliação', 'Reconciliation checklist', 'Checklist de reconciliación', 'Checklist de réconciliation', lang),
    'conformidade.contingencia.progresso': L('{{done}}/{{total}} concluídos', '{{done}}/{{total}} completed', '{{done}}/{{total}} completados', '{{done}}/{{total}} terminés', lang),
    'conformidade.contingencia.empty': L('Nenhuma reconciliação registrada.', 'No reconciliation records.', 'Ninguna reconciliación registrada.', 'Aucune réconciliation enregistrée.', lang),
    'conformidade.contingencia.status.EM_ANDAMENTO': L('Em andamento', 'In progress', 'En curso', 'En cours', lang),
    'conformidade.contingencia.status.CONCLUIDA': L('Concluída', 'Completed', 'Concluida', 'Terminée', lang),
    'conformidade.contingencia.step.1': L('Confirmar disponibilidade do sistema (TI)', 'Confirm system availability (IT)', 'Confirmar disponibilidad del sistema (TI)', 'Confirmer disponibilité du système (TI)', lang),
    'conformidade.contingencia.step.2': L('Inserir ou importar OS do período offline (Produção)', 'Enter or import WOs from offline period (Production)', 'Insertar o importar OS del período offline (Producción)', 'Saisir ou importer OS de la période hors ligne (Production)', lang),
    'conformidade.contingencia.step.3': L('Anexar scans dos formulários papel (Qualidade)', 'Attach paper form scans (Quality)', 'Adjuntar escaneos de formularios en papel (Calidad)', 'Joindre scans des formulaires papier (Qualité)', lang),
    'conformidade.contingencia.step.4': L('Revisar duplicidade e consistência (RT)', 'Review duplicates and consistency (AM)', 'Revisar duplicidad y consistencia (RT)', 'Vérifier doublons et cohérence (RT)', lang),
    'conformidade.contingencia.step.5': L('Registrar evento de contingência (Qualidade)', 'Record contingency event (Quality)', 'Registrar evento de contingencia (Calidad)', 'Enregistrer événement de contingence (Qualité)', lang)
  };
}

function release(lang: 'pt' | 'en' | 'es' | 'fr'): TranslationDictionary {
  return {
    'conformidade.release.title': L('Aceite de release', 'Release acceptance', 'Aceptación de release', 'Acceptation de version', lang),
    'conformidade.release.subtitle': L(
      'Registro de aceite de versão com checklist de impacto regulatório (controle de mudanças §11.4).',
      'Version acceptance log with regulatory impact checklist (change control §11.4).',
      'Registro de aceptación de versión con checklist de impacto regulatorio (control de cambios §11.4).',
      'Journal d\'acceptation de version avec checklist d\'impact réglementaire (contrôle des changements §11.4).',
      lang
    ),
    'conformidade.release.btn.aceitar': L('Registrar aceite', 'Record acceptance', 'Registrar aceptación', 'Enregistrer acceptation', lang),
    'conformidade.release.btn.confirmar': L('Confirmar aceite', 'Confirm acceptance', 'Confirmar aceptación', 'Confirmer acceptation', lang),
    'conformidade.release.meta.versao': L('Versão atual', 'Current version', 'Versión actual', 'Version actuelle', lang),
    'conformidade.release.meta.flyway': L('Flyway até', 'Flyway up to', 'Flyway hasta', 'Flyway jusqu\'à', lang),
    'conformidade.release.col.versao': L('Versão', 'Version', 'Versión', 'Version', lang),
    'conformidade.release.col.tipo': L('Tipo', 'Type', 'Tipo', 'Type', lang),
    'conformidade.release.col.impacto': L('Impacto regulatório', 'Regulatory impact', 'Impacto regulatorio', 'Impact réglementaire', lang),
    'conformidade.release.col.aceite': L('Aceite por', 'Accepted by', 'Aceptado por', 'Accepté par', lang),
    'conformidade.release.col.data': L('Data', 'Date', 'Fecha', 'Date', lang),
    'conformidade.release.field.versao': L('Versão do app', 'App version', 'Versión de la app', 'Version de l\'app', lang),
    'conformidade.release.field.flyway': L('Migração Flyway', 'Flyway migration', 'Migración Flyway', 'Migration Flyway', lang),
    'conformidade.release.field.tipo': L('Tipo de mudança', 'Change type', 'Tipo de cambio', 'Type de changement', lang),
    'conformidade.release.field.impacto': L('Impacto regulatório', 'Regulatory impact', 'Impacto regulatorio', 'Impact réglementaire', lang),
    'conformidade.release.field.obs': L('Observações', 'Remarks', 'Observaciones', 'Observations', lang),
    'conformidade.release.checklist.title': L('Checklist de impacto', 'Impact checklist', 'Checklist de impacto', 'Checklist d\'impact', lang),
    'conformidade.release.dialog.title': L('Aceite de release', 'Release acceptance', 'Aceptación de release', 'Acceptation de version', lang),
    'conformidade.release.empty': L('Nenhum aceite registrado.', 'No acceptance records.', 'Ninguna aceptación registrada.', 'Aucune acceptation enregistrée.', lang),
    'conformidade.release.impacto.sim': L('Sim', 'Yes', 'Sí', 'Oui', lang),
    'conformidade.release.impacto.nao': L('Não', 'No', 'No', 'Non', lang),
    'conformidade.release.toast.ok': L('Aceite registrado.', 'Acceptance recorded.', 'Aceptación registrada.', 'Acceptation enregistrée.', lang),
    'conformidade.release.tipo.CORRETIVA': L('Corretiva', 'Corrective', 'Correctiva', 'Corrective', lang),
    'conformidade.release.tipo.EVOLUTIVA': L('Evolutiva', 'Evolutionary', 'Evolutiva', 'Évolutive', lang),
    'conformidade.release.tipo.REGULATORIA': L('Regulatória', 'Regulatory', 'Regulatoria', 'Réglementaire', lang),
    'conformidade.release.tipo.INFRA': L('Infraestrutura', 'Infrastructure', 'Infraestructura', 'Infrastructure', lang),
    'conformidade.release.tipo.SCHEMA': L('Schema BD', 'DB schema', 'Esquema BD', 'Schéma BD', lang),
    'conformidade.release.check.auditoria': L('Afeta trilha os_auditoria?', 'Affects os_auditoria trail?', '¿Afecta traza os_auditoria?', 'Affecte la piste os_auditoria ?', lang),
    'conformidade.release.check.crs': L('Afeta emissão ou conteúdo do CRS?', 'Affects CRS issuance or content?', '¿Afecta emisión o contenido del CRS?', 'Affecte émission ou contenu du CRS ?', lang),
    'conformidade.release.check.rbac': L('Afeta segregação de perfis?', 'Affects role segregation?', '¿Afecta segregación de perfiles?', 'Affecte ségrégation des profils ?', lang),
    'conformidade.release.check.retencao': L('Afeta retenção/export dossiê?', 'Affects retention/dossier export?', '¿Afecta retención/export dossier?', 'Affecte rétention/export dossier ?', lang),
    'conformidade.release.check.migracao': L('Exige migração de dados existentes?', 'Requires existing data migration?', '¿Exige migración de datos existentes?', 'Exige migration de données existantes ?', lang),
    'conformidade.release.check.treinamento': L('Exige atualização MOM/MCQ ou treinamento?', 'Requires MOM/MCQ or training update?', '¿Exige actualización MOM/MCQ o capacitación?', 'Exige mise à jour MOM/MCQ ou formation ?', lang),
    'conformidade.release.check.matriz': L('Matriz REQ-xxx atualizada?', 'REQ-xxx matrix updated?', '¿Matriz REQ-xxx actualizada?', 'Matrice REQ-xxx mise à jour ?', lang)
  };
}

function calibracao(lang: 'pt' | 'en' | 'es' | 'fr'): TranslationDictionary {
  return {
    'conformidade.calibracao.title': L(
      'Calibração',
      'Calibration',
      'Calibración',
      'Étalonnage',
      lang
    ),
    'conformidade.calibracao.subtitle': L(
      'Ferramentas e instrumentos com controle de calibração e alertas de vencimento.',
      'Tools and instruments with calibration control and expiry alerts.',
      'Herramientas e instrumentos con control de calibración y alertas de vencimiento.',
      'Outils et instruments avec contrôle d\'étalonnage et alertes d\'expiration.',
      lang
    ),
    'conformidade.calibracao.btn.novo': L('Novo item', 'New item', 'Nuevo ítem', 'Nouvel élément', lang),
    'conformidade.calibracao.col.identificador': L('Identificador', 'Identifier', 'Identificador', 'Identifiant', lang),
    'conformidade.calibracao.col.descricao': L('Descrição', 'Description', 'Descripción', 'Description', lang),
    'conformidade.calibracao.col.tipo': L('Tipo', 'Type', 'Tipo', 'Type', lang),
    'conformidade.calibracao.col.proxima': L('Próxima calibração', 'Next calibration', 'Próxima calibración', 'Prochain étalonnage', lang),
    'conformidade.calibracao.field.identificador': L('Identificador / tag', 'Identifier / tag', 'Identificador / tag', 'Identifiant / tag', lang),
    'conformidade.calibracao.field.descricao': L('Descrição', 'Description', 'Descripción', 'Description', lang),
    'conformidade.calibracao.field.tipo': L('Tipo', 'Type', 'Tipo', 'Type', lang),
    'conformidade.calibracao.field.local': L('Localização', 'Location', 'Ubicación', 'Emplacement', lang),
    'conformidade.calibracao.field.ultima': L('Última calibração', 'Last calibration', 'Última calibración', 'Dernier étalonnage', lang),
    'conformidade.calibracao.field.proxima': L('Próxima calibração', 'Next calibration', 'Próxima calibración', 'Prochain étalonnage', lang),
    'conformidade.calibracao.field.certificado': L('Certificado ref.', 'Certificate ref.', 'Certificado ref.', 'Réf. certificat', lang),
    'conformidade.calibracao.field.obs': L('Observações', 'Remarks', 'Observaciones', 'Observations', lang),
    'conformidade.calibracao.tipo.FERRAMENTA': L('Ferramenta', 'Tool', 'Herramienta', 'Outil', lang),
    'conformidade.calibracao.tipo.INSTRUMENTO': L('Instrumento', 'Instrument', 'Instrumento', 'Instrument', lang),
    'conformidade.calibracao.empty': L(
      'Nenhum item de calibração registrado.',
      'No calibration items registered.',
      'Ningún ítem de calibración registrado.',
      'Aucun élément d\'étalonnage enregistré.',
      lang
    ),
    'conformidade.calibracao.tooltip.cancelClose': L(
      'Cancelar e fechar',
      'Cancel and close',
      'Cancelar y cerrar',
      'Annuler et fermer',
      lang
    ),
    'conformidade.calibracao.tooltip.save': L(
      'Salvar novo item',
      'Save new item',
      'Guardar nuevo ítem',
      'Enregistrer le nouvel élément',
      lang
    )
  };
}

function nc(lang: 'pt' | 'en' | 'es' | 'fr'): TranslationDictionary {
  return {
    'conformidade.nc.title': L(
      'Não conformidades',
      'Non-conformities',
      'No conformidades',
      'Non-conformités',
      lang
    ),
    'conformidade.nc.subtitle': L(
      'Registro de ocorrências, NC e ações corretivas (SMS básico).',
      'Occurrence, NC and corrective action records (basic SMS).',
      'Registro de ocurrencias, NC y acciones correctivas (SMS básico).',
      'Enregistrement des occurrences, NC et actions correctives (SMS de base).',
      lang
    ),
    'conformidade.nc.btn.novo': L('Nova ocorrência', 'New occurrence', 'Nueva ocurrencia', 'Nouvelle occurrence', lang),
    'conformidade.nc.col.numero': L('Número', 'Number', 'Número', 'Numéro', lang),
    'conformidade.nc.col.titulo': L('Título', 'Title', 'Título', 'Titre', lang),
    'conformidade.nc.col.severidade': L('Severidade', 'Severity', 'Severidad', 'Sévérité', lang),
    'conformidade.nc.col.status': L('Status', 'Status', 'Estado', 'Statut', lang),
    'conformidade.nc.col.os': L('OS', 'WO', 'OS', 'OT', lang),
    'conformidade.nc.field.titulo': L('Título', 'Title', 'Título', 'Titre', lang),
    'conformidade.nc.field.descricao': L('Descrição', 'Description', 'Descripción', 'Description', lang),
    'conformidade.nc.field.severidade': L('Severidade', 'Severity', 'Severidad', 'Sévérité', lang),
    'conformidade.nc.field.status': L('Status', 'Status', 'Estado', 'Statut', lang),
    'conformidade.nc.field.osId': L('OS vinculada', 'Linked work order', 'OS vinculada', 'OT liée', lang),
    'conformidade.nc.field.osSearchPh': L(
      'Buscar OS por número ou cliente…',
      'Search WO by number or customer…',
      'Buscar OS por número o cliente…',
      'Rechercher l\'OT par numéro ou client…',
      lang
    ),
    'conformidade.nc.field.abertura': L('Data abertura', 'Open date', 'Fecha apertura', 'Date d\'ouverture', lang),
    'conformidade.nc.field.fechamento': L('Data fechamento', 'Close date', 'Fecha cierre', 'Date de clôture', lang),
    'conformidade.nc.field.acao': L('Ação corretiva', 'Corrective action', 'Acción correctiva', 'Action corrective', lang),
    'conformidade.nc.field.causa': L('Causa raiz', 'Root cause', 'Causa raíz', 'Cause racine', lang),
    'conformidade.nc.field.contencao': L('Ação de contenção', 'Containment action', 'Acción de contención', 'Action de confinement', lang),
    'conformidade.nc.field.eficacia': L('Verificação de eficácia', 'Effectiveness verification', 'Verificación de eficacia', 'Vérification d\'efficacité', lang),
    'conformidade.nc.field.eficaciaOk': L('Eficácia confirmada', 'Effectiveness confirmed', 'Eficacia confirmada', 'Efficacité confirmée', lang),
    'conformidade.nc.field.capaFase': L('Fase CAPA', 'CAPA phase', 'Fase CAPA', 'Phase CAPA', lang),
    'conformidade.nc.field.dataVerificacao': L('Data verificação', 'Verification date', 'Fecha verificación', 'Date de vérification', lang),
    'conformidade.nc.col.capa': L('CAPA', 'CAPA', 'CAPA', 'CAPA', lang),
    'conformidade.nc.capa.REGISTRO': L('Registro', 'Record', 'Registro', 'Enregistrement', lang),
    'conformidade.nc.capa.CONTENCAO': L('Contenção', 'Containment', 'Contención', 'Confinement', lang),
    'conformidade.nc.capa.CAUSA': L('Causa raiz', 'Root cause', 'Causa raíz', 'Cause racine', lang),
    'conformidade.nc.capa.ACAO': L('Ação corretiva', 'Corrective action', 'Acción correctiva', 'Action corrective', lang),
    'conformidade.nc.capa.VERIFICACAO': L('Verificação', 'Verification', 'Verificación', 'Vérification', lang),
    'conformidade.nc.capa.FECHADA': L('Fechada', 'Closed', 'Cerrada', 'Fermée', lang),
    'conformidade.nc.dialog.edit': L('Editar ocorrência / CAPA', 'Edit occurrence / CAPA', 'Editar ocurrencia / CAPA', 'Modifier occurrence / CAPA', lang),
    'conformidade.nc.btn.prev': L('Anterior', 'Previous', 'Anterior', 'Précédent', lang),
    'conformidade.nc.btn.next': L('Próximo', 'Next', 'Siguiente', 'Suivant', lang),
    'conformidade.nc.stepper.hint.CONTENCAO': L(
      'Descreva ações imediatas para isolar o problema e evitar recorrência enquanto a causa é investigada.',
      'Describe immediate actions to isolate the issue and prevent recurrence while the cause is investigated.',
      'Describa acciones inmediatas para aislar el problema y evitar recurrencia mientras se investiga la causa.',
      'Décrivez les actions immédiates pour isoler le problème et éviter la récurrence pendant l\'investigation.',
      lang
    ),
    'conformidade.nc.stepper.hint.CAUSA': L(
      'Identifique a causa raiz (5 porquês, Ishikawa ou método equivalente).',
      'Identify the root cause (5 whys, Ishikawa or equivalent method).',
      'Identifique la causa raíz (5 porqués, Ishikawa o método equivalente).',
      'Identifiez la cause racine (5 pourquoi, Ishikawa ou méthode équivalente).',
      lang
    ),
    'conformidade.nc.stepper.hint.ACAO': L(
      'Plano de ação corretiva para eliminar a causa raiz.',
      'Corrective action plan to eliminate the root cause.',
      'Plan de acción correctiva para eliminar la causa raíz.',
      'Plan d\'action corrective pour éliminer la cause racine.',
      lang
    ),
    'conformidade.nc.stepper.hint.VERIFICACAO': L(
      'Verifique se a ação foi eficaz e documente evidências.',
      'Verify whether the action was effective and document evidence.',
      'Verifique si la acción fue eficaz y documente evidencias.',
      'Vérifiez l\'efficacité de l\'action et documentez les preuves.',
      lang
    ),
    'conformidade.nc.stepper.hint.FECHADA': L(
      'Confirme o fechamento da NC e a data de encerramento.',
      'Confirm NC closure and closing date.',
      'Confirme el cierre de la NC y la fecha de cierre.',
      'Confirmez la clôture de la NC et la date de fermeture.',
      lang
    ),
    'conformidade.nc.field.obs': L('Observações', 'Remarks', 'Observaciones', 'Observations', lang),
    'conformidade.nc.sev.BAIXA': L('Baixa', 'Low', 'Baja', 'Faible', lang),
    'conformidade.nc.sev.MEDIA': L('Média', 'Medium', 'Media', 'Moyenne', lang),
    'conformidade.nc.sev.ALTA': L('Alta', 'High', 'Alta', 'Élevée', lang),
    'conformidade.nc.sev.CRITICA': L('Crítica', 'Critical', 'Crítica', 'Critique', lang),
    'conformidade.nc.status.ABERTA': L('Aberta', 'Open', 'Abierta', 'Ouverte', lang),
    'conformidade.nc.status.EM_ACAO': L('Em ação', 'In progress', 'En acción', 'En cours', lang),
    'conformidade.nc.status.FECHADA': L('Fechada', 'Closed', 'Cerrada', 'Fermée', lang),
    'conformidade.nc.empty': L(
      'Nenhuma ocorrência registrada.',
      'No occurrences registered.',
      'Ninguna ocurrencia registrada.',
      'Aucune occurrence enregistrée.',
      lang
    ),
    'conformidade.nc.field.responsavel': L('Responsável', 'Responsible', 'Responsable', 'Responsable', lang),
    'conformidade.nc.field.prazo': L('Prazo', 'Due date', 'Plazo', 'Échéance', lang),
    'conformidade.nc.field.aprovacaoObs': L('Observação da aprovação', 'Approval remark', 'Observación de aprobación', 'Observation d\'approbation', lang),
    'conformidade.nc.field.aprovadoPor': L('Aprovado por', 'Approved by', 'Aprobado por', 'Approuvé par', lang),
    'conformidade.nc.field.aprovadoEm': L('Aprovado em', 'Approved on', 'Aprobado el', 'Approuvé le', lang),
    'conformidade.nc.btn.aprovar': L('Aprovar fase', 'Approve phase', 'Aprobar fase', 'Approuver la phase', lang),
    'conformidade.nc.btn.solicitarAprovacao': L(
      'Solicitar aprovação',
      'Request approval',
      'Solicitar aprobación',
      'Demander l\'approbation',
      lang
    ),
    'conformidade.nc.btn.rejeitar': L('Rejeitar aprovação', 'Reject approval', 'Rechazar aprobación', 'Rejeter l\'approbation', lang),
    'conformidade.nc.aprovacao.pendente': L('Aprovação pendente', 'Approval pending', 'Aprobación pendiente', 'Approbation en attente', lang),
    'conformidade.nc.aprovacao.aprovada': L('Fase aprovada', 'Phase approved', 'Fase aprobada', 'Phase approuvée', lang),
    'conformidade.nc.error.tituloObrigatorio': L(
      'Informe o título da ocorrência.',
      'Enter the occurrence title.',
      'Indique el título de la ocurrencia.',
      'Indiquez le titre de l\'occurrence.',
      lang
    ),
    'conformidade.nc.error.contencaoObrigatoria': L(
      'Descreva a ação de contenção.',
      'Describe the containment action.',
      'Describa la acción de contención.',
      'Décrivez l\'action de confinement.',
      lang
    ),
    'conformidade.nc.error.causaObrigatoria': L(
      'Informe a causa raiz.',
      'Enter the root cause.',
      'Indique la causa raíz.',
      'Indiquez la cause racine.',
      lang
    ),
    'conformidade.nc.error.acaoObrigatoria': L(
      'Descreva a ação corretiva.',
      'Describe the corrective action.',
      'Describa la acción correctiva.',
      'Décrivez l\'action corrective.',
      lang
    ),
    'conformidade.nc.error.eficaciaTextoObrigatoria': L(
      'Descreva a verificação de eficácia.',
      'Describe the effectiveness verification.',
      'Describa la verificación de eficacia.',
      'Décrivez la vérification d\'efficacité.',
      lang
    ),
    'conformidade.nc.error.eficaciaConfirmacaoObrigatoria': L(
      'Confirme a eficácia da ação corretiva.',
      'Confirm corrective action effectiveness.',
      'Confirme la eficacia de la acción correctiva.',
      'Confirmez l\'efficacité de l\'action corrective.',
      lang
    ),
    'conformidade.nc.error.fechamentoObrigatorio': L(
      'Informe a data de fechamento.',
      'Enter the closing date.',
      'Indique la fecha de cierre.',
      'Indiquez la date de clôture.',
      lang
    ),
    'conformidade.nc.error.responsavelObrigatorio': L(
      'Selecione o responsável pela fase.',
      'Select the phase owner.',
      'Seleccione el responsable de la fase.',
      'Sélectionnez le responsable de la phase.',
      lang
    ),
    'conformidade.nc.error.anexoObrigatorio': L(
      'Anexe ao menos uma evidência nesta fase.',
      'Attach at least one piece of evidence in this phase.',
      'Adjunte al menos una evidencia en esta fase.',
      'Joignez au moins une preuve pour cette phase.',
      lang
    ),
    'conformidade.nc.error.anexoGrande': L(
      'O arquivo excede o limite de 25 MB.',
      'The file exceeds the 25 MB limit.',
      'El archivo supera el límite de 25 MB.',
      'Le fichier dépasse la limite de 25 Mo.',
      lang
    ),
    'conformidade.nc.error.faseNaoAprovada': L(
      'Aguarde a aprovação da fase atual para avançar.',
      'Wait for the current phase approval before proceeding.',
      'Espere la aprobación de la fase actual para avanzar.',
      'Attendez l\'approbation de la phase en cours avant de continuer.',
      lang
    ),
    'conformidade.nc.hint.salvarPrimeiro': L(
      'Salve a ocorrência para anexar evidências e registrar aprovações.',
      'Save the occurrence before attaching evidence and recording approvals.',
      'Guarde la ocurrencia para adjuntar evidencias y registrar aprobaciones.',
      'Enregistrez l\'occurrence avant de joindre des preuves et d\'enregistrer les approbations.',
      lang
    ),
    'conformidade.nc.anexo.title': L('Anexos / evidências', 'Attachments / evidence', 'Anexos / evidencias', 'Pièces jointes / preuves', lang),
    'conformidade.nc.anexo.hint': L(
      'PDF, imagens ou documentos Office (máx. 25 MB). Na verificação, ao menos um anexo é obrigatório.',
      'PDF, images or Office documents (max 25 MB). At least one attachment is required for verification.',
      'PDF, imágenes u Office (máx. 25 MB). En verificación se exige al menos un anexo.',
      'PDF, images ou Office (max. 25 Mo). Au moins une pièce jointe est requise pour la vérification.',
      lang
    ),
    'conformidade.nc.anexo.btn.upload': L('Enviar anexo', 'Upload attachment', 'Enviar anexo', 'Envoyer la pièce jointe', lang),
    'conformidade.nc.anexo.dropzone': L(
      'Clique ou arraste as evidências aqui (Máx 25 MB)',
      'Click or drag evidence here (Max 25 MB)',
      'Haga clic o arrastre las evidencias aquí (Máx 25 MB)',
      'Cliquez ou faites glisser les preuves ici (Max 25 Mo)',
      lang
    ),
    'conformidade.nc.anexo.empty': L('Nenhum anexo nesta fase.', 'No attachments in this phase.', 'Ningún anexo en esta fase.', 'Aucune pièce jointe pour cette phase.', lang),
    'conformidade.nc.toast.aprovado': L('Fase aprovada.', 'Phase approved.', 'Fase aprobada.', 'Phase approuvée.', lang),
    'conformidade.nc.toast.solicitacaoEnviada': L(
      'Solicitação de aprovação enviada.',
      'Approval request submitted.',
      'Solicitud de aprobación enviada.',
      'Demande d\'approbation envoyée.',
      lang
    ),
    'conformidade.nc.toast.rejeitado': L('Aprovação rejeitada.', 'Approval rejected.', 'Aprobación rechazada.', 'Approbation rejetée.', lang),
    'conformidade.nc.toast.anexoEnviado': L('Anexo enviado.', 'Attachment uploaded.', 'Anexo enviado.', 'Pièce jointe envoyée.', lang),
    'conformidade.nc.confirm.rejeitar': L(
      'Rejeitar a aprovação desta fase CAPA?',
      'Reject approval for this CAPA phase?',
      '¿Rechazar la aprobación de esta fase CAPA?',
      'Rejeter l\'approbation de cette phase CAPA ?',
      lang
    )
  };
}

function painel(lang: 'pt' | 'en' | 'es' | 'fr'): TranslationDictionary {
  return {
    'conformidade.painel.title': L('Painel qualidade', 'Quality dashboard', 'Panel de calidad', 'Tableau qualité', lang),
    'conformidade.painel.subtitle': L(
      'Alertas consolidados: documentos, treinamentos, calibração, NC e ASL.',
      'Consolidated alerts: documents, training, calibration, NC and ASL.',
      'Alertas consolidados: documentos, formación, calibración, NC y ASL.',
      'Alertes consolidés : documents, formations, étalonnage, NC et ASL.',
      lang
    ),
    'conformidade.painel.doc.vencidos': L('Docs vencidos', 'Expired docs', 'Docs vencidos', 'Docs expirés', lang),
    'conformidade.painel.doc.proximos': L('Docs próximos', 'Upcoming docs', 'Docs próximos', 'Docs à venir', lang),
    'conformidade.painel.treino.vencidos': L('Treinos vencidos', 'Expired training', 'Formación vencida', 'Formations expirées', lang),
    'conformidade.painel.treino.proximos': L('Treinos próximos', 'Upcoming training', 'Formación próxima', 'Formations à venir', lang),
    'conformidade.painel.calib.vencida': L('Calibração vencida', 'Expired calibration', 'Calibración vencida', 'Étalonnage expiré', lang),
    'conformidade.painel.calib.proxima': L('Calibração próxima', 'Upcoming calibration', 'Calibración próxima', 'Étalonnage à venir', lang),
    'conformidade.painel.nc.abertas': L('NC abertas', 'Open NCs', 'NC abiertas', 'NC ouvertes', lang),
    'conformidade.painel.asl.alertas': L('Alertas ASL', 'ASL alerts', 'Alertas ASL', 'Alertes ASL', lang),
    'conformidade.painel.ver': L('Ver módulo', 'View module', 'Ver módulo', 'Voir le module', lang),
    'conformidade.painel.empty': L('Nenhum alerta no período.', 'No alerts in period.', 'Ninguna alerta en el período.', 'Aucune alerte sur la période.', lang),
    'conformidade.painel.cat.DOCUMENTO': L('Documento', 'Document', 'Documento', 'Document', lang),
    'conformidade.painel.cat.TREINAMENTO': L('Treinamento', 'Training', 'Formación', 'Formation', lang),
    'conformidade.painel.cat.CALIBRACAO': L('Calibração', 'Calibration', 'Calibración', 'Étalonnage', lang),
    'conformidade.painel.cat.ASL': L('ASL', 'ASL', 'ASL', 'ASL', lang),
    'conformidade.painel.cat.SUBCONTRATACAO': L('Subcontratação', 'Subcontracting', 'Subcontratación', 'Sous-traitance', lang),
    'conformidade.painel.diasJanela': L('Janela (dias)', 'Window (days)', 'Ventana (días)', 'Fenêtre (jours)', lang),
    'conformidade.painel.enforcement.title': L(
      'Bloqueios operacionais (P1)',
      'Operational blocks (P1)',
      'Bloqueos operacionales (P1)',
      'Blocages opérationnels (P1)',
      lang
    ),
    'conformidade.painel.enforcement.hint': L(
      'Quando ativados, impedem saída de estoque, hangar e CRS com evidência SGQ inválida.',
      'When enabled, block stock issues, hangar work and CRS with invalid QMS evidence.',
      'Cuando están activos, bloquean salidas, hangar y CRS con evidencia SGQ inválida.',
      'Une fois activés, bloquent sorties stock, hangar et CRS avec preuve SGQ invalide.',
      lang
    ),
    'conformidade.painel.enforcement.calibracao': L(
      'Bloquear calibração vencida',
      'Block expired calibration',
      'Bloquear calibración vencida',
      'Bloquer étalonnage expiré',
      lang
    ),
    'conformidade.painel.enforcement.treino': L(
      'Bloquear treino obrigatório pendente',
      'Block pending mandatory training',
      'Bloquear formación obligatoria pendiente',
      'Bloquer formation obligatoire en attente',
      lang
    ),
    'conformidade.painel.enforcement.subcontratacao': L(
      'Bloquear subcontratação com certificado vencido',
      'Block subcontractor with expired certificate',
      'Bloquear subcontratación con certificado vencido',
      'Bloquer sous-traitance au certificat expiré',
      lang
    ),
    'conformidade.painel.enforcement.btnSalvar': L('Salvar política', 'Save policy', 'Guardar política', 'Enregistrer la politique', lang),
    'conformidade.painel.enforcement.toastOk': L('Política de bloqueio salva.', 'Block policy saved.', 'Política de bloqueo guardada.', 'Politique de blocage enregistrée.', lang),
    'conformidade.painel.enforcement.toastErr': L('Falha ao salvar política.', 'Failed to save policy.', 'Error al guardar política.', 'Échec d’enregistrement de la politique.', lang),
    'conformidade.painel.sms.title': L('Indicadores SMS', 'SMS indicators', 'Indicadores SMS', 'Indicateurs SMS', lang),
    'conformidade.painel.sms.subtitle': L(
      'KPIs derivados de NC/CAPA no período selecionado.',
      'KPIs derived from NC/CAPA in the selected window.',
      'KPI derivados de NC/CAPA en el período seleccionado.',
      'KPI dérivés des NC/CAPA sur la période sélectionnée.',
      lang
    ),
    'conformidade.painel.sms.scoreRisco': L('Score de risco', 'Risk score', 'Puntuación de riesgo', 'Score de risque', lang),
    'conformidade.painel.sms.taxaFechamento': L('Taxa fechamento', 'Closure rate', 'Tasa de cierre', 'Taux de clôture', lang),
    'conformidade.painel.sms.mediaDias': L('Média dias abertas', 'Avg. days open', 'Media días abiertas', 'Moy. jours ouverts', lang),
    'conformidade.painel.sms.criticasSemAcao': L('Críticas sem ação', 'Critical without action', 'Críticas sin acción', 'Critiques sans action', lang),
    'conformidade.painel.sms.fechadasPeriodo': L('Fechadas no período', 'Closed in period', 'Cerradas en el período', 'Clôturées sur la période', lang),
    'conformidade.painel.sms.abertasPeriodo': L('Abertas no período', 'Opened in period', 'Abiertas en el período', 'Ouvertes sur la période', lang),
    'conformidade.painel.sms.porSeveridade': L('Por severidade (abertas)', 'By severity (open)', 'Por severidad (abiertas)', 'Par sévérité (ouvertes)', lang),
    'conformidade.painel.sms.porCapa': L('Por fase CAPA (abertas)', 'By CAPA phase (open)', 'Por fase CAPA (abiertas)', 'Par phase CAPA (ouvertes)', lang),
    'conformidade.painel.sms.tendencia': L('Tendência mensal (6 meses)', 'Monthly trend (6 months)', 'Tendencia mensual (6 meses)', 'Tendance mensuelle (6 mois)', lang),
    'conformidade.painel.sms.colMes': L('Mês', 'Month', 'Mes', 'Mois', lang),
    'conformidade.painel.sms.colAbertas': L('Abertas', 'Opened', 'Abiertas', 'Ouvertes', lang),
    'conformidade.painel.sms.colFechadas': L('Fechadas', 'Closed', 'Cerradas', 'Clôturées', lang),
    'conformidade.painel.sms.chartAbertas': L('Abertas', 'Opened', 'Abiertas', 'Ouvertes', lang),
    'conformidade.painel.sms.chartFechadas': L('Fechadas', 'Closed', 'Cerradas', 'Clôturées', lang),
    'conformidade.painel.alerts.title': L('Pendências', 'Pending items', 'Pendientes', 'Éléments en attente', lang),
    'conformidade.painel.filter.categoria': L('Categoria', 'Category', 'Categoría', 'Catégorie', lang),
    'conformidade.painel.filter.severidade': L('Severidade', 'Severity', 'Severidad', 'Sévérité', lang),
    'conformidade.painel.filter.all': L('Todas', 'All', 'Todas', 'Toutes', lang),
    'conformidade.painel.filter.empty': L(
      'Nenhum item corresponde aos filtros.',
      'No items match the filters.',
      'Ningún elemento coincide con los filtros.',
      'Aucun élément ne correspond aux filtres.',
      lang
    ),
    'conformidade.painel.filter.count': L('{{shown}} de {{total}}', '{{shown}} of {{total}}', '{{shown}} de {{total}}', '{{shown}} sur {{total}}', lang),
    'conformidade.painel.filter.clear': L('Limpar filtros', 'Clear filters', 'Limpiar filtros', 'Effacer les filtres', lang),
    'conformidade.painel.card.openModule': L('Abrir módulo', 'Open module', 'Abrir módulo', 'Ouvrir le module', lang),
    'conformidade.painel.card.filterBy': L(
      'Filtrar pendências: {{label}}',
      'Filter pending items: {{label}}',
      'Filtrar pendientes: {{label}}',
      'Filtrer les éléments en attente : {{label}}',
      lang
    ),
    'conformidade.painel.relatorio.btn': L('Exportar relatório SGQ (ZIP)', 'Export QMS report (ZIP)', 'Exportar informe SGQ (ZIP)', 'Exporter rapport SGQ (ZIP)', lang),
    'conformidade.painel.relatorio.toastOk': L('Relatório SGQ exportado.', 'QMS report exported.', 'Informe SGQ exportado.', 'Rapport SGQ exporté.', lang),
    'conformidade.painel.relatorio.toastErr': L('Falha ao exportar relatório SGQ.', 'Failed to export QMS report.', 'Error al exportar informe SGQ.', 'Échec d’export du rapport SGQ.', lang)
  };
}

function treinObrig(lang: 'pt' | 'en' | 'es' | 'fr'): TranslationDictionary {
  return {
    'conformidade.treinObrig.title': L('Treinamentos obrigatórios', 'Mandatory training', 'Formación obligatoria', 'Formations obligatoires', lang),
    'conformidade.treinObrig.subtitle': L(
      'Cursos exigidos por função/perfil — alertas na OS e hangar.',
      'Courses required by role/profile — alerts on WO and hangar.',
      'Cursos exigidos por función/perfil — alertas en OS y hangar.',
      'Cours exigés par fonction/profil — alertes sur OT et hangar.',
      lang
    ),
    'conformidade.treinObrig.btn.novo': L('Nova regra', 'New rule', 'Nueva regla', 'Nouvelle règle', lang),
    'conformidade.treinObrig.col.funcao': L('Função', 'Role', 'Función', 'Fonction', lang),
    'conformidade.treinObrig.col.curso': L('Curso', 'Course', 'Curso', 'Cours', lang),
    'conformidade.treinObrig.col.validade': L('Validade (meses)', 'Validity (months)', 'Validez (meses)', 'Validité (mois)', lang),
    'conformidade.treinObrig.field.funcao': L('Código da função/perfil', 'Role/profile code', 'Código función/perfil', 'Code fonction/profil', lang),
    'conformidade.treinObrig.field.funcaoSearchPh': L(
      'Buscar perfil cadastrado…',
      'Search registered profile…',
      'Buscar perfil registrado…',
      'Rechercher un profil enregistré…',
      lang
    ),
    'conformidade.treinObrig.field.curso': L('Nome do curso', 'Course name', 'Nombre del curso', 'Nom du cours', lang),
    'conformidade.treinObrig.field.cursoSearchPh': L(
      'Buscar curso cadastrado…',
      'Search registered course…',
      'Buscar curso registrado…',
      'Rechercher un cours enregistré…',
      lang
    ),
    'conformidade.treinObrig.field.validade': L('Validade (meses)', 'Validity (months)', 'Validez (meses)', 'Validité (mois)', lang),
    'conformidade.treinObrig.field.obs': L('Observações', 'Remarks', 'Observaciones', 'Observations', lang),
    'conformidade.treinObrig.meses': L('meses', 'months', 'meses', 'mois', lang),
    'conformidade.treinObrig.searchPh': L(
      'Buscar por função ou curso…',
      'Search by role or course…',
      'Buscar por función o curso…',
      'Rechercher par fonction ou cours…',
      lang
    ),
    'conformidade.treinObrig.empty': L('Nenhuma regra cadastrada.', 'No rules registered.', 'Ninguna regla registrada.', 'Aucune règle enregistrée.', lang),
    'conformidade.treinObrig.err.camposObrigatorios': L(
      'Selecione o perfil e o curso cadastrados.',
      'Select the registered profile and course.',
      'Seleccione el perfil y el curso registrados.',
      'Sélectionnez le profil et le cours enregistrés.',
      lang
    ),
    'conformidade.treinObrig.err.validadeInvalida': L(
      'Informe uma validade em meses maior ou igual a 1.',
      'Enter a validity in months greater than or equal to 1.',
      'Indique una validez en meses mayor o igual a 1.',
      'Indiquez une validité en mois supérieure ou égale à 1.',
      lang
    )
  };
}

function subcontratacao(lang: 'pt' | 'en' | 'es' | 'fr'): TranslationDictionary {
  return {
    'conformidade.subcontratacao.title': L(
      'Subcontratação',
      'Subcontracting',
      'Subcontratación',
      'Sous-traitance',
      lang
    ),
    'conformidade.subcontratacao.subtitle': L(
      'Oficinas subcontratadas Part 145 com certificado e escopo controlados.',
      'Part 145 subcontracted shops with controlled certificate and scope.',
      'Talleres subcontratados Part 145 con certificado y alcance controlados.',
      'Ateliers sous-traités Part 145 avec certificat et périmètre contrôlés.',
      lang
    ),
    'conformidade.subcontratacao.btn.novo': L('Novo registro', 'New record', 'Nuevo registro', 'Nouvel enregistrement', lang),
    'conformidade.subcontratacao.col.razao': L('Razão social', 'Legal name', 'Razón social', 'Raison sociale', lang),
    'conformidade.subcontratacao.col.certificado': L('Certificado Part 145', 'Part 145 certificate', 'Certificado Part 145', 'Certificat Part 145', lang),
    'conformidade.subcontratacao.col.validade': L('Validade', 'Expiry', 'Validez', 'Validité', lang),
    'conformidade.subcontratacao.col.status': L('Status', 'Status', 'Estado', 'Statut', lang),
    'conformidade.subcontratacao.field.razao': L('Razão social', 'Legal name', 'Razón social', 'Raison sociale', lang),
    'conformidade.subcontratacao.field.certificado': L('Certificado Part 145', 'Part 145 certificate', 'Certificado Part 145', 'Certificat Part 145', lang),
    'conformidade.subcontratacao.field.escopo': L('Escopo', 'Scope', 'Alcance', 'Périmètre', lang),
    'conformidade.subcontratacao.field.validade': L('Validade certificado', 'Certificate expiry', 'Validez certificado', 'Validité certificat', lang),
    'conformidade.subcontratacao.field.osId': L('OS vinculada (ID)', 'Linked WO (ID)', 'OS vinculada (ID)', 'OT liée (ID)', lang),
    'conformidade.subcontratacao.field.status': L('Status', 'Status', 'Estado', 'Statut', lang),
    'conformidade.subcontratacao.field.obs': L('Observações', 'Remarks', 'Observaciones', 'Observations', lang),
    'conformidade.subcontratacao.status.ATIVO': L('Ativo', 'Active', 'Activo', 'Actif', lang),
    'conformidade.subcontratacao.status.SUSPENSO': L('Suspenso', 'Suspended', 'Suspendido', 'Suspendu', lang),
    'conformidade.subcontratacao.status.ENCERRADO': L('Encerrado', 'Closed', 'Cerrado', 'Clôturé', lang),
    'conformidade.subcontratacao.empty': L(
      'Nenhum registro de subcontratação.',
      'No subcontracting records.',
      'Ningún registro de subcontratación.',
      'Aucun enregistrement de sous-traitance.',
      lang
    )
  };
}

function asl(lang: 'pt' | 'en' | 'es' | 'fr'): TranslationDictionary {
  return {
    'estoque.fornecedores.col.aslStatus': L('ASL', 'ASL', 'ASL', 'ASL', lang),
    'estoque.fornecedores.col.aslValidade': L('Validade ASL', 'ASL expiry', 'Validez ASL', 'Validité ASL', lang),
    'estoque.fornecedores.field.aslStatus': L('Status ASL', 'ASL status', 'Estado ASL', 'Statut ASL', lang),
    'estoque.fornecedores.field.aslEscopo': L('Escopo aprovado', 'Approved scope', 'Alcance aprobado', 'Périmètre approuvé', lang),
    'estoque.fornecedores.field.aslValidade': L('Validade ASL', 'ASL expiry', 'Validez ASL', 'Validité ASL', lang),
    'estoque.fornecedores.field.aslAprovadoEm': L('Aprovado em', 'Approved on', 'Aprobado en', 'Approuvé le', lang),
    'estoque.fornecedores.field.aslObs': L('Observações ASL', 'ASL remarks', 'Observaciones ASL', 'Observations ASL', lang),
    'estoque.fornecedores.asl.APROVADO': L('Aprovado', 'Approved', 'Aprobado', 'Approuvé', lang),
    'estoque.fornecedores.asl.PENDENTE': L('Pendente', 'Pending', 'Pendiente', 'En attente', lang),
    'estoque.fornecedores.asl.SUSPENSO': L('Suspenso', 'Suspended', 'Suspendido', 'Suspendu', lang),
    'estoque.fornecedores.asl.NAO_APLICAVEL': L('N/A', 'N/A', 'N/A', 'N/A', lang)
  };
}

function dict(lang: 'pt' | 'en' | 'es' | 'fr'): TranslationDictionary {
  return {
    ...shared(lang),
    ...documentos(lang),
    ...treinamentos(lang),
    ...calibracao(lang),
    ...nc(lang),
    ...painel(lang),
    ...treinObrig(lang),
    ...subcontratacao(lang),
    ...asl(lang),
    ...contingencia(lang),
    ...release(lang)
  };
}

export const CONFORMIDADE_SGQ_PT_BR = dict('pt');
export const CONFORMIDADE_SGQ_EN_US = dict('en');
export const CONFORMIDADE_SGQ_ES_ES = dict('es');
export const CONFORMIDADE_SGQ_FR_FR = dict('fr');
