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
    'assembly.title': L('Montagem FCU', 'FCU assembly', 'Montaje FCU', 'Assemblage FCU', lang),
    'assembly.subtitle': L(
      'Editor de estrutura e componentes da FCU',
      'FCU structure and components editor',
      'Editor de estructura y componentes FCU',
      'Éditeur de structure et composants FCU',
      lang
    ),
    'assembly.btn.save': L('Salvar', 'Save', 'Guardar', 'Enregistrer', lang),
    'assembly.btn.export': L('Exportar', 'Export', 'Exportar', 'Exporter', lang),
    'assembly.btn.import': L('Importar', 'Import', 'Importar', 'Importer', lang),
    'assembly.btn.back': L('Voltar', 'Back', 'Volver', 'Retour', lang),
    'assembly.btn.cancel': L('Cancelar', 'Cancel', 'Cancelar', 'Annuler', lang),
    'assembly.btn.ok': L('OK', 'OK', 'OK', 'OK', lang),
    'assembly.btn.understood': L('Entendi', 'Got it', 'Entendido', 'Compris', lang),
    'assembly.btn.addSection': L('Adicionar Nova Seção', 'Add new section', 'Agregar nueva sección', 'Ajouter une section', lang),
    'assembly.btn.addStep': L('Adicionar passo', 'Add step', 'Agregar paso', 'Ajouter une étape', lang),
    'assembly.btn.translateDoc': L('Traduzir Documento', 'Translate document', 'Traducir documento', 'Traduire le document', lang),
    'assembly.panel.tree': L('Árvore de componentes', 'Component tree', 'Árbol de componentes', 'Arborescence', lang),
    'assembly.panel.properties': L('Propriedades', 'Properties', 'Propiedades', 'Propriétés', lang),
    'assembly.panel.preview': L('Pré-visualização', 'Preview', 'Vista previa', 'Aperçu', lang),
    'assembly.panel.actions': L('Ações do Editor', 'Editor actions', 'Acciones del editor', 'Actions de l’éditeur', lang),
    'assembly.panel.actionsSubtitle': L(
      'Ferramentas e opções avançadas',
      'Tools and advanced options',
      'Herramientas y opciones avanzadas',
      'Outils et options avancées',
      lang
    ),
    'assembly.placeholder.search': L('Buscar componente…', 'Search component…', 'Buscar componente…', 'Rechercher un composant…', lang),
    'assembly.placeholder.noManuals': L('Sem manuais', 'No manuals', 'Sin manuales', 'Aucun manuel', lang),
    'assembly.placeholder.chooseLanguage': L('Escolha um idioma…', 'Choose a language…', 'Elija un idioma…', 'Choisissez une langue…', lang),
    'assembly.loading': L('Carregando montagem…', 'Loading assembly…', 'Cargando montaje…', 'Chargement…', lang),
    'assembly.editor.title': L('Editor de documentos', 'Document editor', 'Editor de documentos', 'Éditeur de documents', lang),
    'assembly.sections.title': L('Seções do documento', 'Document sections', 'Secciones del documento', 'Sections du document', lang),
    'assembly.sections.subtitle': L(
      '{{count}} seção(ões) cadastrada(s)',
      '{{count}} section(s) registered',
      '{{count}} sección(es) registrada(s)',
      '{{count}} section(s) enregistrée(s)',
      lang
    ),
    'assembly.section.fallback': L('Seção {{n}}', 'Section {{n}}', 'Sección {{n}}', 'Section {{n}}', lang),
    'assembly.section.steps': L('{{count}} passo(s)', '{{count}} step(s)', '{{count}} paso(s)', '{{count}} étape(s)', lang),
    'assembly.field.company': L('Empresa', 'Company', 'Empresa', 'Entreprise', lang),
    'assembly.field.certificate': L('Certificado', 'Certificate', 'Certificado', 'Certificat', lang),
    'assembly.field.title': L('Título', 'Title', 'Título', 'Titre', lang),
    'assembly.field.pn': L('P/N', 'P/N', 'P/N', 'P/N', lang),
    'assembly.field.sn': L('S/N', 'S/N', 'S/N', 'S/N', lang),
    'assembly.field.model': L('Modelo', 'Model', 'Modelo', 'Modèle', lang),
    'assembly.field.date': L('Data', 'Date', 'Fecha', 'Date', lang),
    'assembly.field.os': L('O/S', 'W/O', 'O/S', 'O/S', lang),
    'assembly.field.client': L('Cliente', 'Customer', 'Cliente', 'Client', lang),
    'assembly.field.manual': L('Manual', 'Manual', 'Manual', 'Manuel', lang),
    'assembly.field.revision': L('Revisão', 'Revision', 'Revisión', 'Révision', lang),
    'assembly.field.revisionDate': L('Data Revisão', 'Revision date', 'Fecha de revisión', 'Date de révision', lang),
    'assembly.field.ata': L('ATA', 'ATA', 'ATA', 'ATA', lang),
    'assembly.field.pages': L('Páginas', 'Pages', 'Páginas', 'Pages', lang),
    'assembly.field.kind': L('Tipo', 'Type', 'Tipo', 'Type', lang),
    'assembly.field.code': L('Código', 'Code', 'Código', 'Code', lang),
    'assembly.field.text': L('Texto', 'Text', 'Texto', 'Texte', lang),
    'assembly.field.figure': L('Figura', 'Figure', 'Figura', 'Figure', lang),
    'assembly.field.refs': L('Referências', 'References', 'Referencias', 'Références', lang),
    'assembly.field.observations': L('Observações', 'Notes', 'Observaciones', 'Observations', lang),
    'assembly.preview.company': L('Empresa:', 'Company:', 'Empresa:', 'Entreprise :', lang),
    'assembly.preview.certificate': L('Certificado:', 'Certificate:', 'Certificado:', 'Certificat :', lang),
    'assembly.preview.client': L('Cliente:', 'Customer:', 'Cliente:', 'Client :', lang),
    'assembly.preview.manual': L('Manual:', 'Manual:', 'Manual:', 'Manuel :', lang),
    'assembly.preview.revision': L('Rev.:', 'Rev.:', 'Rev.:', 'Rév. :', lang),
    'assembly.preview.revisionDate': L('Data Rev.:', 'Rev. date:', 'Fecha rev.:', 'Date rév. :', lang),
    'assembly.noImage': L('Nenhuma imagem carregada', 'No image loaded', 'Ninguna imagen cargada', 'Aucune image chargée', lang),
    'assembly.tooltip.importWord': L(
      'Importar documento Word (.docx)',
      'Import Word document (.docx)',
      'Importar documento Word (.docx)',
      'Importer un document Word (.docx)',
      lang
    ),
    'assembly.tooltip.togglePreview': L(
      'Alternar entre modo edição e pré-visualização',
      'Toggle edit and preview mode',
      'Alternar entre edición y vista previa',
      'Basculer édition / aperçu',
      lang
    ),
    'assembly.tooltip.translate': L(
      'Traduzir documento para outro idioma',
      'Translate document to another language',
      'Traducir documento a otro idioma',
      'Traduire le document vers une autre langue',
      lang
    ),
    'assembly.tooltip.exportPdf': L(
      'Gerar e baixar documento em PDF',
      'Generate and download PDF',
      'Generar y descargar PDF',
      'Générer et télécharger le PDF',
      lang
    ),
    'assembly.tooltip.saveServer': L(
      'Salvar documento no servidor',
      'Save document to server',
      'Guardar documento en el servidor',
      'Enregistrer le document sur le serveur',
      lang
    ),
    'assembly.tooltip.openTextEditor': L(
      'Clique para abrir o editor de texto e editar o conteúdo',
      'Click to open the text editor',
      'Clic para abrir el editor de texto',
      'Cliquez pour ouvrir l’éditeur de texte',
      lang
    ),
    'assembly.tooltip.bold': L('Negrito', 'Bold', 'Negrita', 'Gras', lang),
    'assembly.tooltip.italic': L('Itálico', 'Italic', 'Cursiva', 'Italique', lang),
    'assembly.tooltip.underline': L('Sublinhado', 'Underline', 'Subrayado', 'Souligné', lang),
    'assembly.tooltip.bulletList': L('Lista com marcadores', 'Bullet list', 'Lista con viñetas', 'Liste à puces', lang),
    'assembly.tooltip.numberedList': L('Lista numerada', 'Numbered list', 'Lista numerada', 'Liste numérotée', lang),
    'assembly.tooltip.alignLeft': L('Alinhar à esquerda', 'Align left', 'Alinear a la izquierda', 'Aligner à gauche', lang),
    'assembly.tooltip.alignCenter': L('Centralizar', 'Center', 'Centrar', 'Centrer', lang),
    'assembly.tooltip.alignRight': L('Alinhar à direita', 'Align right', 'Alinear a la derecha', 'Aligner à droite', lang),
    'assembly.tooltip.undo': L('Desfazer', 'Undo', 'Deshacer', 'Annuler', lang),
    'assembly.tooltip.redo': L('Refazer', 'Redo', 'Rehacer', 'Rétablir', lang),
    'assembly.tooltip.moveStepUp': L(
      'Mover passo para cima',
      'Move step up',
      'Mover paso hacia arriba',
      'Monter l’étape',
      lang
    ),
    'assembly.tooltip.moveStepDown': L(
      'Mover passo para baixo',
      'Move step down',
      'Mover paso hacia abajo',
      'Descendre l’étape',
      lang
    ),
    'assembly.tooltip.removeStep': L(
      'Remover passo',
      'Remove step',
      'Eliminar paso',
      'Supprimer l’étape',
      lang
    ),
    'assembly.translate.title': L('Traduzir Documento', 'Translate document', 'Traducir documento', 'Traduire le document', lang),
    'assembly.translate.subtitle': L(
      'Escolha o idioma de destino para traduzir todo o conteúdo',
      'Choose target language to translate all content',
      'Elija el idioma de destino para traducir todo el contenido',
      'Choisissez la langue cible pour traduire tout le contenu',
      lang
    ),
    'assembly.translate.targetLanguage': L('Idioma de Destino', 'Target language', 'Idioma de destino', 'Langue cible', lang),
    'assembly.translate.selectLanguage': L('Selecione o idioma', 'Select language', 'Seleccione el idioma', 'Sélectionnez la langue', lang),
    'assembly.translate.info': L('Informações', 'Information', 'Información', 'Informations', lang),
    'assembly.translate.infoAuto': L(
      'Todo o conteúdo será traduzido automaticamente',
      'All content will be translated automatically',
      'Todo el contenido se traducirá automáticamente',
      'Tout le contenu sera traduit automatiquement',
      lang
    ),
    'assembly.translate.infoTime': L(
      'O processo pode levar alguns segundos',
      'The process may take a few seconds',
      'El proceso puede tardar unos segundos',
      'Le processus peut prendre quelques secondes',
      lang
    ),
    'assembly.translate.infoSecure': L(
      'A tradução é feita de forma segura',
      'Translation is performed securely',
      'La traducción se realiza de forma segura',
      'La traduction est effectuée de manière sécurisée',
      lang
    ),
    'assembly.translate.preview': L('Prévia:', 'Preview:', 'Vista previa:', 'Aperçu :', lang),
    'assembly.translate.previewText': L(
      'O documento será traduzido para',
      'The document will be translated to',
      'El documento se traducirá a',
      'Le document sera traduit en',
      lang
    ),
    'assembly.translate.tip': L(
      'Dica: Você pode traduzir novamente para outro idioma a qualquer momento',
      'Tip: You can translate again to another language at any time',
      'Consejo: puede traducir de nuevo a otro idioma en cualquier momento',
      'Astuce : vous pouvez retraduire vers une autre langue à tout moment',
      lang
    ),
    'assembly.translate.progress': L('Traduzindo Documento', 'Translating document', 'Traduciendo documento', 'Traduction du document', lang),
    'assembly.translate.cancelAria': L('Cancelar tradução', 'Cancel translation', 'Cancelar traducción', 'Annuler la traduction', lang),
    'assembly.empty.title': L('Nenhum Conteúdo Encontrado', 'No content found', 'No se encontró contenido', 'Aucun contenu trouvé', lang),
    'assembly.empty.subtitle': L(
      'Não é possível traduzir um documento vazio',
      'Cannot translate an empty document',
      'No es posible traducir un documento vacío',
      'Impossible de traduire un document vide',
      lang
    ),
    'assembly.empty.hintTitle': L('Título', 'Title', 'Título', 'Titre', lang),
    'assembly.empty.hintObs': L('Observações', 'Notes', 'Observaciones', 'Observations', lang),
    'assembly.empty.hintSections': L('Seções', 'Sections', 'Secciones', 'Sections', lang),
    'assembly.empty.hintSteps': L('Passos', 'Steps', 'Pasos', 'Étapes', lang),
    'assembly.empty.hintAfter': L(
      'Após adicionar conteúdo ao documento, você poderá traduzi-lo para o idioma desejado.',
      'After adding content, you can translate the document to the desired language.',
      'Después de agregar contenido, podrá traducir el documento al idioma deseado.',
      'Après avoir ajouté du contenu, vous pourrez traduire le document dans la langue souhaitée.',
      lang
    ),
    'assembly.editor.stepText': L('Editar Texto do Passo', 'Edit step text', 'Editar texto del paso', 'Modifier le texte de l’étape', lang),
    'assembly.editor.obsText': L('Editar Observações', 'Edit notes', 'Editar observaciones', 'Modifier les observations', lang),
    'assembly.lang.pt': L('Português', 'Portuguese', 'Portugués', 'Portugais', lang),
    'assembly.lang.en': L('Inglês', 'English', 'Inglés', 'Anglais', lang),
    'assembly.lang.es': L('Espanhol', 'Spanish', 'Español', 'Espagnol', lang),
    'assembly.lang.fr': L('Francês', 'French', 'Francés', 'Français', lang),
    'assembly.lang.de': L('Alemão', 'German', 'Alemán', 'Allemand', lang),
    'assembly.kind.step': L('Passo', 'Step', 'Paso', 'Étape', lang),
    'assembly.kind.note': L('Nota', 'Note', 'Nota', 'Note', lang),
    'assembly.kind.caution': L('Cuidado', 'Caution', 'Precaución', 'Attention', lang),
    'assembly.kind.warning': L('Advertência', 'Warning', 'Advertencia', 'Avertissement', lang),
    'assembly.kind.table': L('Tabela', 'Table', 'Tabla', 'Tableau', lang),
    'assembly.kind.figure': L('Figura', 'Figure', 'Figura', 'Figure', lang),
    'assembly.footer.lastUpdate': L('Última atualização', 'Last updated', 'Última actualización', 'Dernière mise à jour', lang),
    'assembly.translate.convertingTo': L(
      'Convertendo para {{language}}',
      'Converting to {{language}}',
      'Convirtiendo a {{language}}',
      'Conversion en {{language}}',
      lang
    ),
    'assembly.editor.charCount': L('{{count}} caracteres', '{{count}} characters', '{{count}} caracteres', '{{count}} caractères', lang),
    'assembly.toast.previewModeTitle': L('Modo Pré-visualização', 'Preview mode', 'Modo de vista previa', 'Mode aperçu', lang),
    'assembly.toast.previewModeDetail': L('Visualizando documento como será impresso', 'Viewing document as it will be printed', 'Visualizando el documento como se imprimirá', 'Affichage du document tel qu’il sera imprimé', lang),
    'assembly.toast.editModeTitle': L('Modo Edição', 'Edit mode', 'Modo edición', 'Mode édition', lang),
    'assembly.toast.editModeDetail': L('Retornando ao modo de edição', 'Returning to edit mode', 'Volviendo al modo edición', 'Retour au mode édition', lang),
    'assembly.toast.translationCancelledTitle': L('Tradução cancelada', 'Translation cancelled', 'Traducción cancelada', 'Traduction annulée', lang),
    'assembly.toast.translationCancelledDetail': L('O processo de tradução foi interrompido pelo usuário.', 'The translation process was interrupted by the user.', 'El proceso de traducción fue interrumpido por el usuario.', 'Le processus de traduction a été interrompu par l’utilisateur.', lang),
    'assembly.toast.languageNotSelectedTitle': L('Idioma não selecionado', 'Language not selected', 'Idioma no seleccionado', 'Langue non sélectionnée', lang),
    'assembly.toast.languageNotSelectedDetail': L('Escolha um idioma antes de traduzir o conteúdo.', 'Choose a language before translating the content.', 'Elija un idioma antes de traducir el contenido.', 'Choisissez une langue avant de traduire le contenu.', lang),
    'assembly.toast.translatingTitle': L('Traduzindo documento...', 'Translating document...', 'Traduciendo documento...', 'Traduction du document...', lang),
    'assembly.toast.translatingDetail': L('Isso pode levar alguns segundos, dependendo do tamanho do documento.', 'This may take a few seconds depending on document size.', 'Esto puede tardar algunos segundos según el tamaño del documento.', 'Cela peut prendre quelques secondes selon la taille du document.', lang),
    'assembly.toast.translationDoneTitle': L('Tradução concluída!', 'Translation completed!', '¡Traducción completada!', 'Traduction terminée !', lang),
    'assembly.toast.translationDoneDetail': L('Conteúdo convertido para {{language}}.', 'Content converted to {{language}}.', 'Contenido convertido a {{language}}.', 'Contenu converti en {{language}}.', lang),
    'assembly.toast.partialTranslationTitle': L('Tradução parcial', 'Partial translation', 'Traducción parcial', 'Traduction partielle', lang),
    'assembly.toast.partialTranslationDetail': L('Algumas traduções podem não ter sido aplicadas devido a limitações dos serviços externos. Termos técnicos básicos foram traduzidos localmente.', 'Some translations may not have been applied due to external service limitations. Basic technical terms were translated locally.', 'Algunas traducciones pueden no haberse aplicado por limitaciones de servicios externos. Los términos técnicos básicos se tradujeron localmente.', 'Certaines traductions peuvent ne pas avoir été appliquées en raison des limites des services externes. Les termes techniques de base ont été traduits localement.', lang),
    'assembly.toast.invalidFormTitle': L('Formulário inválido', 'Invalid form', 'Formulario inválido', 'Formulaire invalide', lang),
    'assembly.toast.invalidFormDetail': L('Por favor, preencha todos os campos obrigatórios antes de salvar.', 'Please fill all required fields before saving.', 'Complete todos los campos obligatorios antes de guardar.', 'Veuillez remplir tous les champs obligatoires avant d’enregistrer.', lang),
    'assembly.toast.emptyDocumentTitle': L('Documento vazio', 'Empty document', 'Documento vacío', 'Document vide', lang),
    'assembly.toast.emptyDocumentDetail': L('Adicione pelo menos um título e uma seção antes de salvar.', 'Add at least a title and one section before saving.', 'Agregue al menos un título y una sección antes de guardar.', 'Ajoutez au moins un titre et une section avant d’enregistrer.', lang),
    'assembly.toast.savingTitle': L('Salvando documento...', 'Saving document...', 'Guardando documento...', 'Enregistrement du document...', lang),
    'assembly.toast.savingDetail': L('Processando dados e salvando no servidor', 'Processing data and saving to server', 'Procesando datos y guardando en el servidor', 'Traitement des données et enregistrement sur le serveur', lang),
    'assembly.toast.updatedTitle': L('Documento atualizado!', 'Document updated!', '¡Documento actualizado!', 'Document mis à jour !', lang),
    'assembly.toast.updatedDetail': L('As alterações foram salvas com sucesso.', 'Changes were saved successfully.', 'Los cambios se guardaron con éxito.', 'Les modifications ont été enregistrées avec succès.', lang),
    'assembly.toast.createdTitle': L('Documento criado!', 'Document created!', '¡Documento creado!', 'Document créé !', lang),
    'assembly.toast.createdDetail': L('Novo documento salvo com sucesso.', 'New document saved successfully.', 'Nuevo documento guardado con éxito.', 'Nouveau document enregistré avec succès.', lang),
    'assembly.toast.saveErrorTitle': L('Erro ao salvar', 'Save error', 'Error al guardar', 'Erreur d’enregistrement', lang),
    'assembly.toast.saveErrorDetail': L('{{error}}', '{{error}}', '{{error}}', '{{error}}', lang),
    'assembly.error.saveGeneric': L(
      'Não foi possível salvar o documento. Verifique sua conexão e tente novamente.',
      'Could not save the document. Check your connection and try again.',
      'No se pudo guardar el documento. Verifique su conexión e intente de nuevo.',
      'Impossible d’enregistrer le document. Vérifiez votre connexion et réessayez.',
      lang
    ),
    'assembly.error.saveInvalidData': L(
      'Dados inválidos. Verifique se todos os campos obrigatórios estão preenchidos.',
      'Invalid data. Check that all required fields are filled in.',
      'Datos no válidos. Verifique que todos los campos obligatorios estén completos.',
      'Données invalides. Vérifiez que tous les champs obligatoires sont renseignés.',
      lang
    ),
    'assembly.error.saveServerError': L(
      'Erro interno do servidor. Tente novamente em alguns instantes.',
      'Internal server error. Try again in a few moments.',
      'Error interno del servidor. Intente de nuevo en unos instantes.',
      'Erreur interne du serveur. Réessayez dans quelques instants.',
      lang
    ),
    'assembly.error.saveConnection': L(
      'Erro de conexão. Verifique se o servidor está rodando.',
      'Connection error. Check that the server is running.',
      'Error de conexión. Verifique que el servidor esté en ejecución.',
      'Erreur de connexion. Vérifiez que le serveur est en cours d’exécution.',
      lang
    ),
    'assembly.section.importedFromWord': L(
      'Seção importada do Word',
      'Section imported from Word',
      'Sección importada de Word',
      'Section importée depuis Word',
      lang
    ),
    'assembly.toast.unsupportedFormatTitle': L('Formato não suportado', 'Unsupported format', 'Formato no soportado', 'Format non pris en charge', lang),
    'assembly.toast.unsupportedFormatDetail': L('Use arquivos .docx (formatos .doc não são suportados).', 'Use .docx files (.doc is not supported).', 'Use archivos .docx (el formato .doc no es compatible).', 'Utilisez des fichiers .docx (le format .doc n’est pas pris en charge).', lang),
    'assembly.toast.processingFileTitle': L('Processando arquivo...', 'Processing file...', 'Procesando archivo...', 'Traitement du fichier...', lang),
    'assembly.toast.processingFileDetail': L('Importando {{file}}', 'Importing {{file}}', 'Importando {{file}}', 'Importation de {{file}}', lang),
    'assembly.toast.importWarningsTitle': L('Importado com avisos', 'Imported with warnings', 'Importado con avisos', 'Importé avec avertissements', lang),
    'assembly.toast.importWarningsDetail': L('{{count}} aviso(s) durante a conversão do Word.', '{{count}} warning(s) during Word conversion.', '{{count}} aviso(s) durante la conversión de Word.', '{{count}} avertissement(s) pendant la conversion Word.', lang),
    'assembly.toast.importDoneTitle': L('Importação concluída!', 'Import completed!', '¡Importación completada!', 'Importation terminée !', lang),
    'assembly.toast.importDoneDetail': L('Documento {{file}} importado com sucesso.', 'Document {{file}} imported successfully.', 'Documento {{file}} importado con éxito.', 'Document {{file}} importé avec succès.', lang),
    'assembly.toast.importErrorTitle': L('Erro na importação', 'Import error', 'Error en la importación', 'Erreur d’importation', lang),
    'assembly.toast.importErrorDetail': L('{{error}}', '{{error}}', '{{error}}', '{{error}}', lang),
    'assembly.toast.importErrorDefault': L('Não foi possível processar o arquivo Word.', 'Could not process the Word file.', 'No se pudo procesar el archivo Word.', 'Impossible de traiter le fichier Word.', lang),
    'assembly.toast.generatingPdfTitle': L('Gerando PDF...', 'Generating PDF...', 'Generando PDF...', 'Génération du PDF...', lang),
    'assembly.toast.generatingPdfDetail': L('Preparando documento para exportação', 'Preparing document for export', 'Preparando documento para exportación', 'Préparation du document pour l’export', lang),
    'assembly.toast.exportErrorTitle': L('Erro na exportação', 'Export error', 'Error en la exportación', 'Erreur d’exportation', lang),
    'assembly.toast.exportErrorDetail': L('Não foi possível gerar o PDF. Tente novamente.', 'Could not generate the PDF. Try again.', 'No se pudo generar el PDF. Intente de nuevo.', 'Impossible de générer le PDF. Réessayez.', lang),
    'assembly.toast.pdfExportedTitle': L('PDF exportado!', 'PDF exported!', '¡PDF exportado!', 'PDF exporté !', lang),
    'assembly.toast.pdfExportedDetail': L('{{message}}', '{{message}}', '{{message}}', '{{message}}', lang),
    'assembly.toast.loadingDocumentTitle': L('Carregando documento...', 'Loading document...', 'Cargando documento...', 'Chargement du document...', lang),
    'assembly.toast.loadingDocumentDetail': L('Buscando dados do documento selecionado', 'Fetching selected document data', 'Buscando datos del documento seleccionado', 'Récupération des données du document sélectionné', lang),
    'assembly.toast.documentLoadedTitle': L('Documento carregado!', 'Document loaded!', '¡Documento cargado!', 'Document chargé !', lang),
    'assembly.toast.documentLoadedDetail': L('Documento "{{title}}" carregado com sucesso.', 'Document "{{title}}" loaded successfully.', 'Documento "{{title}}" cargado con éxito.', 'Document « {{title}} » chargé avec succès.', lang),
    'assembly.toast.loadErrorTitle': L('Erro ao carregar', 'Load error', 'Error al cargar', 'Erreur de chargement', lang),
    'assembly.toast.loadErrorDetail': L('Não foi possível carregar o documento selecionado.', 'Could not load the selected document.', 'No se pudo cargar el documento seleccionado.', 'Impossible de charger le document sélectionné.', lang),
    'assembly.empty.mainMessage': L(
      'Para traduzir o documento, você precisa adicionar pelo menos um dos seguintes conteúdos:',
      'To translate the document, add at least one of the following:',
      'Para traducir el documento, agregue al menos uno de los siguientes contenidos:',
      'Pour traduire le document, ajoutez au moins l’un des contenus suivants :',
      lang
    ),
    'assembly.empty.checklist.titleDoc': L('Título do documento', 'Document title', 'Título del documento', 'Titre du document', lang),
    'assembly.empty.checklist.obsDesc': L('Observações ou descrição', 'Notes or description', 'Observaciones o descripción', 'Observations ou description', lang),
    'assembly.empty.checklist.sectionsTitles': L('Seções com títulos', 'Sections with titles', 'Secciones con títulos', 'Sections avec titres', lang),
    'assembly.empty.checklist.stepsDetail': L(
      'Passos dentro das seções com títulos ou textos',
      'Steps within sections with titles or text',
      'Pasos dentro de las secciones con títulos o textos',
      'Étapes dans les sections avec titres ou textes',
      lang
    ),
    'assembly.section.newTitle': L('Nova seção', 'New section', 'Nueva sección', 'Nouvelle section', lang),
    'assembly.stepKind.step': L('Passo', 'Step', 'Paso', 'Étape', lang),
    'assembly.stepKind.note': L('Nota', 'Note', 'Nota', 'Note', lang),
    'assembly.stepKind.caution': L('Cuidado', 'Caution', 'Precaución', 'Attention', lang),
    'assembly.stepKind.warning': L('Advertência', 'Warning', 'Advertencia', 'Avertissement', lang),
    'assembly.stepKind.table': L('Tabela', 'Table', 'Tabla', 'Tableau', lang),
    'assembly.stepKind.figure': L('Figura', 'Figure', 'Figura', 'Figure', lang),
    'assembly.translation.step1.name': L('Analisando documento', 'Analyzing document', 'Analizando documento', 'Analyse du document', lang),
    'assembly.translation.step1.desc': L('Processando estrutura e conteúdo', 'Processing structure and content', 'Procesando estructura y contenido', 'Traitement de la structure et du contenu', lang),
    'assembly.translation.step2.name': L('Detectando idioma', 'Detecting language', 'Detectando idioma', 'Détection de la langue', lang),
    'assembly.translation.step2.desc': L('Identificando idioma de origem', 'Identifying source language', 'Identificando idioma de origen', 'Identification de la langue source', lang),
    'assembly.translation.step3.name': L('Traduzindo metadados', 'Translating metadata', 'Traduciendo metadatos', 'Traduction des métadonnées', lang),
    'assembly.translation.step3.desc': L('Convertendo informações básicas', 'Converting basic information', 'Convirtiendo información básica', 'Conversion des informations de base', lang),
    'assembly.translation.step4.name': L('Processando seções', 'Processing sections', 'Procesando secciones', 'Traitement des sections', lang),
    'assembly.translation.step4.desc': L('Traduzindo conteúdo das seções', 'Translating section content', 'Traduciendo contenido de las secciones', 'Traduction du contenu des sections', lang),
    'assembly.translation.step5.name': L('Convertendo passos', 'Converting steps', 'Convirtiendo pasos', 'Conversion des étapes', lang),
    'assembly.translation.step5.desc': L('Traduzindo instruções detalhadas', 'Translating detailed instructions', 'Traduciendo instrucciones detalladas', 'Traduction des instructions détaillées', lang),
    'assembly.translation.step6.name': L('Finalizando tradução', 'Finalizing translation', 'Finalizando traducción', 'Finalisation de la traduction', lang),
    'assembly.translation.step6.desc': L('Aplicando formatação final', 'Applying final formatting', 'Aplicando formato final', 'Application de la mise en forme finale', lang),
    'assembly.translation.progress.analyzingDoc': L('Analisando estrutura do documento...', 'Analyzing document structure...', 'Analizando estructura del documento...', 'Analyse de la structure du document...', lang),
    'assembly.translation.progress.detectingLang': L('Detectando idioma de origem...', 'Detecting source language...', 'Detectando idioma de origen...', 'Détection de la langue source...', lang),
    'assembly.translation.progress.translatingMeta': L('Traduzindo informações básicas...', 'Translating basic information...', 'Traduciendo información básica...', 'Traduction des informations de base...', lang),
    'assembly.translation.progress.translatingSections': L('Traduzindo seções do documento...', 'Translating document sections...', 'Traduciendo secciones del documento...', 'Traduction des sections du document...', lang),
    'assembly.translation.progress.translatingSteps': L('Traduzindo instruções detalhadas...', 'Translating detailed instructions...', 'Traduciendo instrucciones detalladas...', 'Traduction des instructions détaillées...', lang),
    'assembly.translation.progress.finalizing': L('Aplicando formatação final...', 'Applying final formatting...', 'Aplicando formato final...', 'Application de la mise en forme finale...', lang),
    'assembly.import.defaultSectionTitle': L('Seção', 'Section', 'Sección', 'Section', lang),
    'assembly.export.defaultDocumentTitle': L(
      'Documento de montagem',
      'Assembly document',
      'Documento de montaje',
      'Document de montage',
      lang
    ),
    'assembly.toast.pdfExportSuccess': L(
      'PDF gerado com sucesso!',
      'PDF generated successfully!',
      '¡PDF generado con éxito!',
      'PDF généré avec succès !',
      lang
    ),
  };
}

export const FCU_ASSEMBLY_SHELL_PT_BR = dict('pt');
export const FCU_ASSEMBLY_SHELL_EN_US = dict('en');
export const FCU_ASSEMBLY_SHELL_ES_ES = dict('es');
export const FCU_ASSEMBLY_SHELL_FR_FR = dict('fr');
