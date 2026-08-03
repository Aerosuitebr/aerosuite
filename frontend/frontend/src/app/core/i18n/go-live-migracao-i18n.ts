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
    'goLive.title': L('Kit Go-live (30 dias)', 'Go-live kit (30 days)', 'Kit go-live (30 días)', 'Kit go-live (30 jours)', lang),
    'goLive.subtitle': L(
      'Checklist de migração e importação CSV para entrar em produção sem parar a oficina.',
      'Migration checklist and CSV import to go live without stopping the shop.',
      'Checklist de migración e importación CSV para producción sin parar el taller.',
      'Checklist de migration et import CSV pour la mise en production sans arrêter l’atelier.',
      lang
    ),
    'goLive.tab.checklist': L('Checklist', 'Checklist', 'Checklist', 'Checklist', lang),
    'goLive.tab.templates': L('Modelos CSV', 'CSV templates', 'Plantillas CSV', 'Modèles CSV', lang),
    'goLive.tab.import': L('Importar', 'Import', 'Importar', 'Importer', lang),
    'goLive.checklist.intro': L(
      'Siga as semanas na ordem. Marque os itens concluídos — o progresso é salvo automaticamente.',
      'Follow the weeks in order. Check completed items — progress is saved automatically.',
      'Siga las semanas en orden. Marque los ítems completados — el progreso se guarda automáticamente.',
      'Suivez les semaines dans l’ordre. Cochez les éléments terminés — la progression est enregistrée automatiquement.',
      lang
    ),
    'goLive.checklist.progress': L('{{pct}}% concluído', '{{pct}}% complete', '{{pct}}% completado', '{{pct}}% terminé', lang),
    'goLive.checklist.weekProgress': L('{{done}}/{{total}} itens', '{{done}}/{{total}} items', '{{done}}/{{total}} ítems', '{{done}}/{{total}} éléments', lang),
    'goLive.checklist.autoSaveSaving': L('Salvando…', 'Saving…', 'Guardando…', 'Enregistrement…', lang),
    'goLive.checklist.autoSaveSaved': L('Alterações salvas automaticamente', 'Changes saved automatically', 'Cambios guardados automáticamente', 'Modifications enregistrées automatiquement', lang),
    'goLive.checklist.autoSaveError': L('Falha ao salvar — marque novamente ou recarregue a página', 'Save failed — check again or reload the page', 'Error al guardar — marque de nuevo o recargue la página', 'Échec de l’enregistrement — réessayez ou rechargez la page', lang),
    'goLive.checklist.btnSave': L('Salvar progresso', 'Save progress', 'Guardar progreso', 'Enregistrer la progression', lang),
    'goLive.checklist.saved': L('Checklist salvo', 'Checklist saved', 'Checklist guardado', 'Checklist enregistré', lang),
    'goLive.checklist.saveErr': L('Falha ao salvar checklist', 'Failed to save checklist', 'Error al guardar checklist', 'Échec de l’enregistrement du checklist', lang),
    'goLive.checklist.openLink': L('Abrir módulo', 'Open module', 'Abrir módulo', 'Ouvrir le module', lang),
    'goLive.checklist.week': L('Semana {{n}}', 'Week {{n}}', 'Semana {{n}}', 'Semaine {{n}}', lang),
    'goLive.checklist.w1.t1': L('Validar tenant, logo e dados da empresa (Configurações).', 'Validate tenant, logo and company data (Settings).', 'Validar tenant, logo y datos de la empresa (Configuración).', 'Valider le tenant, le logo et les données société (Paramètres).', lang),
    'goLive.checklist.w1.t2': L('Criar usuários internos e perfis RBAC.', 'Create internal users and RBAC profiles.', 'Crear usuarios internos y perfiles RBAC.', 'Créer les utilisateurs internes et profils RBAC.', lang),
    'goLive.checklist.w1.t3': L('Configurar integrações (Bling, billing) se aplicável.', 'Configure integrations (Bling, billing) if applicable.', 'Configurar integraciones (Bling, facturación) si aplica.', 'Configurer les intégrations (Bling, facturation) si besoin.', lang),
    'goLive.checklist.w2.t1': L('Importar clientes de proposta (CSV abaixo).', 'Import proposal customers (CSV below).', 'Importar clientes de propuesta (CSV abajo).', 'Importer les clients proposition (CSV ci-dessous).', lang),
    'goLive.checklist.w2.t2': L('Importar FCU / componentes (CSV).', 'Import FCU / components (CSV).', 'Importar FCU / componentes (CSV).', 'Importer les FCU / composants (CSV).', lang),
    'goLive.checklist.w2.t3': L('Rever estoque mínimo em lote se necessário (Estoque).', 'Review batch min stock if needed (Inventory).', 'Revisar stock mínimo por lote si hace falta (Inventario).', 'Revoir le stock minimum par lot si besoin (Stock).', lang),
    'goLive.checklist.w3.t1': L('Importar usuários do portal externo.', 'Import external portal users.', 'Importar usuarios del portal externo.', 'Importer les utilisateurs du portail externe.', lang),
    'goLive.checklist.w3.t2': L('Conceder acesso a OS e documentos por cliente.', 'Grant WO and document access per customer.', 'Conceder acceso a OS y documentos por cliente.', 'Accorder l’accès OS et documents par client.', lang),
    'goLive.checklist.w3.t3': L('Enviar proposta piloto e treinar aprovação no portal.', 'Send pilot proposal and train portal approval.', 'Enviar propuesta piloto y formar en aprobación en el portal.', 'Envoyer une proposition pilote et former à l’approbation portail.', lang),
    'goLive.checklist.w4.t1': L('Proposta → OS em produção; validar fluxo hangar.', 'Proposal → WO in production; validate hangar flow.', 'Propuesta → OS en producción; validar flujo en hangar.', 'Proposition → OS en production ; valider le flux hangar.', lang),
    'goLive.checklist.w4.t2': L('Regressão: final-suite + smoke comercial.', 'Regression: final-suite + commercial smoke.', 'Regresión: final-suite + smoke comercial.', 'Régression : final-suite + smoke commercial.', lang),
    'goLive.checklist.w4.t3': L('Go-live: backup, monitoramento e suporte 1ª semana.', 'Go-live: backup, monitoring and week-1 support.', 'Go-live: backup, monitorización y soporte semana 1.', 'Go-live : sauvegarde, surveillance et support semaine 1.', lang),
    'goLive.checklist.w5.t1': L(
      'Revisar painel qualidade (documentos, treinos, calibração, NC, ASL).',
      'Review quality dashboard (documents, training, calibration, NC, ASL).',
      'Revisar panel de calidad (documentos, formación, calibración, NC, ASL).',
      'Revoir le tableau qualité (documents, formations, étalonnage, NC, ASL).',
      lang
    ),
    'goLive.checklist.w5.t2': L(
      'Cadastrar treinamentos obrigatórios por função/perfil.',
      'Register mandatory training by role/profile.',
      'Registrar formación obligatoria por función/perfil.',
      'Enregistrer les formations obligatoires par fonction/profil.',
      lang
    ),
    'goLive.checklist.w5.t3': L(
      'Publicar documentos controlados (MOE/POP) com revisão e histórico.',
      'Publish controlled documents (MOE/SOP) with revision history.',
      'Publicar documentos controlados (MOE/POP) con revisión e historial.',
      'Publier les documents maîtrisés (MOE/POP) avec révision et historique.',
      lang
    ),
    'goLive.template.clientes': L('Clientes de proposta', 'Proposal customers', 'Clientes de propuesta', 'Clients proposition', lang),
    'goLive.template.fcu': L('FCU / componentes', 'FCU / components', 'FCU / componentes', 'FCU / composants', lang),
    'goLive.template.usuariosExternos': L('Usuários portal externo', 'External portal users', 'Usuarios portal externo', 'Utilisateurs portail externe', lang),
    'goLive.template.fornecedores': L('Fornecedores + ASL', 'Suppliers + ASL', 'Proveedores + ASL', 'Fournisseurs + ASL', lang),
    'goLive.template.treinamentos': L('Treinamentos SGQ', 'QMS training records', 'Formación SGQ', 'Formations SGQ', lang),
    'goLive.template.documentosSgq': L('Documentos controlados', 'Controlled documents', 'Documentos controlados', 'Documents maîtrisés', lang),
    'goLive.template.calibracao': L('Calibração / ferramentas', 'Calibration / tools', 'Calibración / herramientas', 'Étalonnage / outils', lang),
    'goLive.template.naoConformidades': L('Não conformidades (seed)', 'Non-conformities (seed)', 'No conformidades (semilla)', 'Non-conformités (amorce)', lang),
    'goLive.template.download': L('Baixar modelo', 'Download template', 'Descargar plantilla', 'Télécharger le modèle', lang),
    'goLive.import.type': L('Tipo de importação', 'Import type', 'Tipo de importación', 'Type d’import', lang),
    'goLive.import.clientes': L('Clientes de proposta', 'Proposal customers', 'Clientes de propuesta', 'Clients proposition', lang),
    'goLive.import.fcu': L('FCU', 'FCU', 'FCU', 'FCU', lang),
    'goLive.import.externos': L('Usuários externos', 'External users', 'Usuarios externos', 'Utilisateurs externes', lang),
    'goLive.import.fornecedores': L('Fornecedores + ASL', 'Suppliers + ASL', 'Proveedores + ASL', 'Fournisseurs + ASL', lang),
    'goLive.import.treinamentos': L('Treinamentos SGQ', 'QMS training', 'Formación SGQ', 'Formations SGQ', lang),
    'goLive.import.documentosSgq': L('Documentos SGQ', 'QMS documents', 'Documentos SGQ', 'Documents SGQ', lang),
    'goLive.import.calibracao': L('Calibração', 'Calibration', 'Calibración', 'Étalonnage', lang),
    'goLive.import.naoConformidades': L('Não conformidades', 'Non-conformities', 'No conformidades', 'Non-conformités', lang),
    'goLive.import.paste': L('Colar CSV ou enviar arquivo', 'Paste CSV or upload file', 'Pegar CSV o subir archivo', 'Coller le CSV ou envoyer un fichier', lang),
    'goLive.import.dryRun': L('Apenas validar (dry-run)', 'Validate only (dry-run)', 'Solo validar (dry-run)', 'Valider seulement (dry-run)', lang),
    'goLive.import.dryRunBadge': L('simulação', 'simulation', 'simulación', 'simulation', lang),
    'goLive.import.btnPreview': L('Importar', 'Import', 'Importar', 'Importer', lang),
    'goLive.import.result': L('{{criados}} criados, {{ignorados}} ignorados, {{erros}} erros ({{total}} linhas)', '{{criados}} created, {{ignorados}} skipped, {{erros}} errors ({{total}} rows)', '{{criados}} creados, {{ignorados}} omitidos, {{erros}} errores ({{total}} filas)', '{{criados}} créés, {{ignorados}} ignorés, {{erros}} erreurs ({{total}} lignes)', lang),
    'goLive.import.linha': L('Linha {{n}}: {{status}} — {{msg}}', 'Row {{n}}: {{status}} — {{msg}}', 'Fila {{n}}: {{status}} — {{msg}}', 'Ligne {{n}} : {{status}} — {{msg}}', lang),
    'goLive.import.ok': L('Importação concluída', 'Import completed', 'Importación completada', 'Import terminé', lang),
    'goLive.import.err': L('Falha na importação', 'Import failed', 'Error en la importación', 'Échec de l’import', lang),
    'goLive.import.wouldCreate': L('Seria criado', 'Would be created', 'Se crearía', 'Serait créé', lang),
    'goLive.import.created': L('Criado', 'Created', 'Creado', 'Créé', lang),
    'goLive.import.error.nameRequired': L('Nome obrigatório', 'Name is required', 'Nombre obligatorio', 'Nom obligatoire', lang),
    'goLive.import.error.clientEmailExists': L(
      'Cliente com e-mail já cadastrado (id={{id}})',
      'Customer with this email already exists (id={{id}})',
      'Cliente con correo ya registrado (id={{id}})',
      'Client avec cet e-mail déjà enregistré (id={{id}})',
      lang
    ),
    'goLive.import.error.pnRequired': L('P/N obrigatório', 'P/N is required', 'P/N obligatorio', 'P/N obligatoire', lang),
    'goLive.import.error.fcuExists': L(
      'FCU já existe (id={{id}})',
      'FCU already exists (id={{id}})',
      'FCU ya existe (id={{id}})',
      'FCU existe déjà (id={{id}})',
      lang
    ),
    'goLive.import.error.nameEmailRequired': L(
      'Nome e e-mail obrigatórios',
      'Name and email are required',
      'Nombre y correo obligatorios',
      'Nom et e-mail obligatoires',
      lang
    ),
    'goLive.import.error.emailExists': L(
      'E-mail já cadastrado (id={{id}})',
      'Email already registered (id={{id}})',
      'Correo ya registrado (id={{id}})',
      'E-mail déjà enregistré (id={{id}})',
      lang
    ),
    'goLive.import.error.razaoSocialRequired': L(
      'Razão social obrigatória',
      'Legal name is required',
      'Razón social obligatoria',
      'Raison sociale obligatoire',
      lang
    ),
    'goLive.import.error.fornecedorCodigoExists': L(
      'Fornecedor com código já cadastrado (id={{id}})',
      'Supplier with this code already exists (id={{id}})',
      'Proveedor con código ya registrado (id={{id}})',
      'Fournisseur avec ce code déjà enregistré (id={{id}})',
      lang
    ),
    'goLive.import.error.cursoRequired': L(
      'Curso obrigatório',
      'Course is required',
      'Curso obligatorio',
      'Formation obligatoire',
      lang
    ),
    'goLive.import.error.usuarioNotFound': L(
      'Usuário não encontrado (informe usuario_email ou usuario_id)',
      'User not found (provide usuario_email or usuario_id)',
      'Usuario no encontrado (indique usuario_email o usuario_id)',
      'Utilisateur introuvable (indiquez usuario_email ou usuario_id)',
      lang
    ),
    'goLive.import.error.docCamposObrigatorios': L(
      'Código e título do documento são obrigatórios',
      'Document code and title are required',
      'Código y título del documento son obligatorios',
      'Code et titre du document obligatoires',
      lang
    ),
    'goLive.import.error.docExists': L(
      'Documento já cadastrado (id={{id}})',
      'Document already exists (id={{id}})',
      'Documento ya registrado (id={{id}})',
      'Document déjà enregistré (id={{id}})',
      lang
    ),
    'goLive.import.error.calibIdRequired': L(
      'Identificador da ferramenta obrigatório',
      'Tool identifier is required',
      'Identificador de herramienta obligatorio',
      'Identifiant d’outil obligatoire',
      lang
    ),
    'goLive.import.error.calibExists': L(
      'Ferramenta já cadastrada (id={{id}})',
      'Tool already registered (id={{id}})',
      'Herramienta ya registrada (id={{id}})',
      'Outil déjà enregistré (id={{id}})',
      lang
    ),
    'goLive.import.error.ncTituloRequired': L(
      'Título da NC obrigatório',
      'NC title is required',
      'Título de la NC obligatorio',
      'Titre de la NC obligatoire',
      lang
    ),
  };
}

export const GO_LIVE_MIGRACAO_PT_BR = dict('pt');
export const GO_LIVE_MIGRACAO_EN_US = dict('en');
export const GO_LIVE_MIGRACAO_ES_ES = dict('es');
export const GO_LIVE_MIGRACAO_FR_FR = dict('fr');
