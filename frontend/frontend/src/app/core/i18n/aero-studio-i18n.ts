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
    'studio.title': L('Aero Studio', 'Aero Studio', 'Aero Studio', 'Aero Studio', lang),
    'studio.subtitle': L(
      'Materiais de marca para impressão com a identidade da sua oficina.',
      'Print-ready brand materials using your shop identity.',
      'Materiales de marca para impresión con la identidad de su taller.',
      'Supports de marque prêts à imprimer avec l’identité de votre atelier.',
      lang
    ),
    'studio.step.template': L('Modelo', 'Template', 'Plantilla', 'Modèle', lang),
    'studio.step.identity': L('Identidade', 'Identity', 'Identidad', 'Identité', lang),
    'studio.step.preview': L('Exportar', 'Export', 'Exportar', 'Exporter', lang),
    'studio.step.editor': L('Editor visual', 'Visual editor', 'Editor visual', 'Éditeur visuel', lang),
    'studio.category.editor': L('Editor', 'Editor', 'Editor', 'Éditeur', lang),
    'studio.template.editor': L('Editor livre (Canva)', 'Free editor (Canva)', 'Editor libre (Canva)', 'Éditeur libre (Canva)', lang),
    'studio.pickTemplate': L('Escolha um modelo', 'Choose a template', 'Elija una plantilla', 'Choisissez un modèle', lang),
    'studio.pickTemplateSub': L(
      'Toque numa “tinta” — cada formato é um ponto de partida para a sua marca.',
      'Tap a “paint” swatch — each format is a starting point for your brand.',
      'Toque una “pintura” — cada formato es un punto de partida para su marca.',
      'Touchez une “couleur” — chaque format est un point de départ pour votre marque.',
      lang
    ),
    'studio.palette.selected': L('Selecionado', 'Selected', 'Seleccionado', 'Sélectionné', lang),
    'studio.category.print': L('Impressão', 'Print', 'Impresión', 'Impression', lang),
    'studio.category.large': L('Grande formato', 'Large format', 'Gran formato', 'Grand format', lang),
    'studio.template.cartao': L('Cartão de visita', 'Business card', 'Tarjeta de visita', 'Carte de visite', lang),
    'studio.template.timbrado': L('Papel timbrado A4', 'A4 letterhead', 'Papel membretado A4', 'Papier à en-tête A4', lang),
    'studio.template.folder': L('Folder 1 dobra', 'Single-fold brochure', 'Folder 1 pliegue', 'Dépliant 1 pli', lang),
    'studio.template.banner': L('Faixa hangar', 'Hangar banner', 'Faixa hangar', 'Bannière hangar', lang),
    'studio.size': L('{{w}} × {{h}} mm · sangria {{b}} mm', '{{w}} × {{h}} mm · bleed {{b}} mm', '{{w}} × {{h}} mm · sangrado {{b}} mm', '{{w}} × {{h}} mm · fond perdu {{b}} mm', lang),
    'studio.identity.title': L('Rever identidade', 'Review identity', 'Revisar identidad', 'Vérifier l’identité', lang),
    'studio.identity.warn': L(
      'Conclua o assistente da empresa em Configurações para melhor resultado.',
      'Complete the company wizard in Settings for best results.',
      'Complete el asistente de empresa en Configuración para mejores resultados.',
      'Terminez l’assistant société dans Paramètres pour un meilleur résultat.',
      lang
    ),
    'studio.field.displayName': L('Nome comercial', 'Trade name', 'Nombre comercial', 'Nom commercial', lang),
    'studio.field.tagline': L('Tagline', 'Tagline', 'Eslogan', 'Accroche', lang),
    'studio.field.email': L(
      'E-mail de contato',
      'Contact email',
      'Correo de contacto',
      'E-mail de contact',
      lang
    ),
    'studio.field.phone': L('Telefone', 'Phone', 'Teléfono', 'Téléphone', lang),
    'studio.field.site': L('Site', 'Website', 'Sitio web', 'Site web', lang),
    'studio.field.address': L('Endereço', 'Address', 'Dirección', 'Adresse', lang),
    'studio.field.services': L('Serviços (texto)', 'Services (text)', 'Servicios (texto)', 'Services (texte)', lang),
    'studio.field.primary': L('Cor primária', 'Primary color', 'Color primario', 'Couleur primaire', lang),
    'studio.field.secondary': L('Cor secundária', 'Secondary color', 'Color secundario', 'Couleur secondaire', lang),
    'studio.opt.cropMarks': L('Incluir marcas de corte', 'Include crop marks', 'Incluir marcas de corte', 'Inclure traits de coupe', lang),
    'studio.opt.qr': L('QR portal externo', 'External portal QR', 'QR portal externo', 'QR portail externe', lang),
    'studio.opt.qrHelp': L(
      'O QR no cartão abre o login do portal do cliente (usuários externos). Só funciona no PDF final ou na pré-visualização — não no ícone do editor. Use a câmera do celular ou leitor de QR (não o login interno do app).',
      'The card QR opens the external customer portal login. It works in the final PDF or preview — not as a live link in the editor icon. Use the phone camera or a QR reader (not the internal app login).',
      'El QR de la tarjeta abre el login del portal externo de clientes. Funciona en el PDF final o vista previa — no como enlace en el icono del editor. Use la cámara del móvil o un lector QR.',
      'Le QR de la carte ouvre la connexion au portail client externe. Il fonctionne dans le PDF final ou l’aperçu — pas comme lien dans l’icône de l’éditeur. Utilisez l’appareil photo ou un lecteur QR.',
      lang
    ),
    'studio.opt.zip': L('Pacote ZIP (PDF + README gráfica)', 'ZIP pack (PDF + print README)', 'Paquete ZIP (PDF + README)', 'Pack ZIP (PDF + README)', lang),
    'studio.rgbDisclaimer': L(
      'Saída em RGB. A gráfica deve converter para CMYK se necessário.',
      'Output is RGB. The print shop should convert to CMYK if needed.',
      'Salida en RGB. La imprenta debe convertir a CMYK si es necesario.',
      'Sortie en RVB. L’imprimeur doit convertir en CMJN si besoin.',
      lang
    ),
    'studio.btn.back': L('Voltar', 'Back', 'Atrás', 'Retour', lang),
    'studio.btn.next': L('Seguinte', 'Next', 'Siguiente', 'Suivant', lang),
    'studio.btn.openEditor': L('Editor visual', 'Visual editor', 'Editor visual', 'Éditeur visuel', lang),
    'studio.btn.preview': L('Gerar pré-visualização', 'Generate preview', 'Generar vista previa', 'Générer l’aperçu', lang),
    'studio.btn.pdf': L('Descarregar PDF', 'Download PDF', 'Descargar PDF', 'Télécharger PDF', lang),
    'studio.btn.zip': L('Descarregar ZIP', 'Download ZIP', 'Descargar ZIP', 'Télécharger ZIP', lang),
    'studio.preview.title': L('Pré-visualização', 'Preview', 'Vista previa', 'Aperçu', lang),
    'studio.preview.hint': L('Aproximação RGB — o PDF final pode diferir ligeiramente.', 'RGB approximation — final PDF may differ slightly.', 'Aproximación RGB — el PDF final puede variar.', 'Approximation RVB — le PDF final peut différer.', lang),
    'studio.async.hint': L('Faixa hangar: geração em segundo plano (pode demorar).', 'Hangar banner: background generation (may take a while).', 'Faixa hangar: generación en segundo plano.', 'Bannière hangar : génération en arrière-plan.', lang),
    'studio.async.progress': L('A gerar… {{status}}', 'Generating… {{status}}', 'Generando… {{status}}', 'Génération… {{status}}', lang),
    'studio.opt.pngInZip': L('Incluir preview.png no ZIP', 'Include preview.png in ZIP', 'Incluir preview.png en ZIP', 'Inclure preview.png dans le ZIP', lang),
    'studio.history.title': L('Últimas gerações', 'Recent exports', 'Últimas generaciones', 'Dernières générations', lang),
    'studio.history.empty': L('Ainda sem exportações.', 'No exports yet.', 'Sin exportaciones aún.', 'Pas encore d’export.', lang),
    'studio.history.download': L('Descarregar', 'Download', 'Descargar', 'Télécharger', lang),
    'studio.history.status': L('Estado', 'Status', 'Estado', 'Statut', lang),
    'studio.status.PENDING': L('Na fila', 'Queued', 'En cola', 'En file', lang),
    'studio.status.PROCESSING': L('A processar', 'Processing', 'Procesando', 'En cours', lang),
    'studio.status.COMPLETED': L('Concluído', 'Completed', 'Completado', 'Terminé', lang),
    'studio.status.FAILED': L('Falhou', 'Failed', 'Falló', 'Échoué', lang),
    'studio.err.template': L('Selecione um modelo.', 'Select a template.', 'Seleccione una plantilla.', 'Sélectionnez un modèle.', lang),
    'studio.err.render': L('Falha ao gerar o material.', 'Failed to generate material.', 'Error al generar el material.', 'Échec de génération.', lang),
    'studio.err.preview': L('Falha na pré-visualização.', 'Preview failed.', 'Error en la vista previa.', 'Échec de l’aperçu.', lang),
    'studio.ok.render': L('Arquivo gerado.', 'File generated.', 'Archivo generado.', 'Fichier généré.', lang),
    'studio.ok.preview': L('Pré-visualização atualizada.', 'Preview updated.', 'Vista previa actualizada.', 'Aperçu mis à jour.', lang),
    'studio.editor.badge': L('Editor drag-and-drop', 'Drag-and-drop editor', 'Editor arrastrar y soltar', 'Éditeur glisser-déposer', lang),
    'studio.editor.intro': L(
      'Arraste elementos, redimensione e exporte em PDF com sangria.',
      'Drag elements, resize and export to print-ready PDF with bleed.',
      'Arrastre elementos, redimensione y exporte a PDF con sangrado.',
      'Glissez les éléments, redimensionnez et exportez en PDF avec fond perdu.',
      lang
    ),
    'studio.editor.toolbar': L('Ferramentas do editor', 'Editor tools', 'Herramientas del editor', 'Outils de l’éditeur', lang),
    'studio.editor.tools': L('Adicionar', 'Add', 'Añadir', 'Ajouter', lang),
    'studio.editor.addText': L('Texto', 'Text', 'Texto', 'Texte', lang),
    'studio.editor.addShape': L('Forma', 'Shape', 'Forma', 'Forme', lang),
    'studio.editor.addLogo': L('Logo', 'Logo', 'Logo', 'Logo', lang),
    'studio.editor.addQr': L('QR portal', 'Portal QR', 'QR portal', 'QR portail', lang),
    'studio.editor.layerUp': L('Subir camada', 'Bring forward', 'Subir capa', 'Monter le calque', lang),
    'studio.editor.layerDown': L('Descer camada', 'Send backward', 'Bajar capa', 'Descendre le calque', lang),
    'studio.editor.delete': L('Eliminar', 'Delete', 'Eliminar', 'Supprimer', lang),
    'studio.editor.canvasSize': L('Tamanho do canvas', 'Canvas size', 'Tamaño del lienzo', 'Taille du canevas', lang),
    'studio.editor.background': L('Fundo', 'Background', 'Fondo', 'Arrière-plan', lang),
    'studio.hero.tagline': L(
      'Crie materiais de marca com a identidade da sua oficina — pincel, cor e precisão.',
      'Create brand materials with your shop identity — brush, color and precision.',
      'Cree materiales de marca con la identidad de su taller — pincel, color y precisión.',
      'Créez des supports de marque avec l’identité de votre atelier — pinceau, couleur et précision.',
      lang
    ),
    'studio.editor.hint': L(
      'Clique para selecionar · arraste para mover · alças da caixa para largura/altura · marque proporção nas propriedades',
      'Click to select · drag to move · box handles for width/height · lock aspect ratio in properties',
      'Clic para seleccionar · arrastre para mover · asas del recuadro para ancho/alto · bloquee proporción en propiedades',
      'Cliquer pour sélectionner · glisser pour déplacer · poignées du cadre pour largeur/hauteur · verrouiller les proportions dans propriétés',
      lang
    ),
    'studio.editor.hintLine': L(
      'Linha: alça direita = comprimento · alça inferior = espessura · canto = ambos',
      'Line: right handle = length · bottom handle = thickness · corner = both',
      'Línea: asa derecha = longitud · asa inferior = grosor · esquina = ambos',
      'Ligne : poignée droite = longueur · poignée basse = épaisseur · coin = les deux',
      lang
    ),
    'studio.editor.lineSizeHint': L(
      'Largura = comprimento (mm) · Altura = espessura do traço (mm)',
      'Width = length (mm) · Height = stroke thickness (mm)',
      'Ancho = longitud (mm) · Alto = grosor del trazo (mm)',
      'Largeur = longueur (mm) · Hauteur = épaisseur du trait (mm)',
      lang
    ),
    'studio.editor.lineColor': L('Cor da linha', 'Line color', 'Color de línea', 'Couleur de la ligne', lang),
    'studio.editor.properties': L('Propriedades', 'Properties', 'Propiedades', 'Propriétés', lang),
    'studio.editor.posSize': L('Posição / tamanho (mm)', 'Position / size (mm)', 'Posición / tamaño (mm)', 'Position / taille (mm)', lang),
    'studio.editor.text': L('Texto', 'Text', 'Texto', 'Texte', lang),
    'studio.editor.fontSize': L('Tamanho (pt)', 'Size (pt)', 'Tamaño (pt)', 'Taille (pt)', lang),
    'studio.editor.fill': L('Preenchimento', 'Fill', 'Relleno', 'Remplissage', lang),
    'studio.editor.logoMissing': L('Sem logo na empresa', 'No company logo', 'Sin logo de empresa', 'Pas de logo société', lang),
    'studio.editor.defaultText': L('Novo texto', 'New text', 'Nuevo texto', 'Nouveau texte', lang),
    'studio.editor.sizeCard': L('Cartão 90×50 mm', 'Card 90×50 mm', 'Tarjeta 90×50 mm', 'Carte 90×50 mm', lang),
    'studio.editor.sizeA4': L('A4 210×297 mm', 'A4 210×297 mm', 'A4 210×297 mm', 'A4 210×297 mm', lang),
    'studio.editor.sizeBanner': L('Faixa 2000×800 mm', 'Banner 2000×800 mm', 'Faixa 2000×800 mm', 'Bannière 2000×800 mm', lang),
    'studio.editor.sizeInstagramPost': L('Instagram post 1080×1080', 'Instagram post 1080×1080', 'Instagram post 1080×1080', 'Publication Instagram 1080×1080', lang),
    'studio.editor.sizeInstagramStory': L('Instagram story 1080×1920', 'Instagram story 1080×1920', 'Historia Instagram 1080×1920', 'Story Instagram 1080×1920', lang),
    'studio.editor.sizeLinkedInPost': L('LinkedIn post 1200×1200', 'LinkedIn post 1200×1200', 'Publicación LinkedIn 1200×1200', 'Publication LinkedIn 1200×1200', lang),
    'studio.editor.sizeLinkedInCover': L('LinkedIn capa 1584×396', 'LinkedIn cover 1584×396', 'Portada LinkedIn 1584×396', 'Couverture LinkedIn 1584×396', lang),
    'studio.editor.empty': L('Adicione pelo menos um elemento ao layout.', 'Add at least one element to the layout.', 'Añada al menos un elemento al diseño.', 'Ajoutez au moins un élément au layout.', lang),
    'studio.editor.addCircle': L('Círculo', 'Circle', 'Círculo', 'Cercle', lang),
    'studio.editor.addLine': L('Linha', 'Line', 'Línea', 'Ligne', lang),
    'studio.editor.addIcon': L('Ícone', 'Icon', 'Icono', 'Icône', lang),
    'studio.editor.uploadImage': L('Carregar imagem', 'Upload image', 'Subir imagen', 'Téléverser image', lang),
    'studio.editor.uploadOk': L('Imagem carregada', 'Image uploaded', 'Imagen subida', 'Image téléversée', lang),
    'studio.editor.uploadFail': L('Falha ao carregar imagem', 'Image upload failed', 'Error al subir imagen', 'Échec du téléversement', lang),
    'studio.editor.lockAspect': L('Manter proporção', 'Lock aspect ratio', 'Mantener proporción', 'Conserver les proportions', lang),
    'studio.editor.qrHelp': L(
      'QR do portal externo: clientes escaneiam para abrir o login externo da sua oficina (não é login de funcionários).',
      'External portal QR: customers scan to open your shop external login (not staff login).',
      'QR del portal externo: los clientes escanean para abrir el login externo del taller (no es login de empleados).',
      'QR portail externe : les clients scannent pour ouvrir la connexion externe de l’atelier (pas la connexion personnel).',
      lang
    ),
    'studio.editor.qrOff': L('QR desativado na exportação', 'QR disabled in export', 'QR desactivado en exportación', 'QR désactivé à l’export', lang),
    'studio.editor.stock': L('Stock (biblioteca)', 'Stock library', 'Stock (biblioteca)', 'Banque d’images', lang),
    'studio.editor.stockSearch': L('Pesquisar', 'Search', 'Buscar', 'Rechercher', lang),
    'studio.editor.filter': L('Filtro', 'Filter', 'Filtro', 'Filtre', lang),
    'studio.editor.filterNone': L('Nenhum', 'None', 'Ninguno', 'Aucun', lang),
    'studio.editor.filterGrayscale': L('Preto e branco', 'Grayscale', 'Escala de grises', 'Niveaux de gris', lang),
    'studio.editor.filterSepia': L('Sépia', 'Sepia', 'Sepia', 'Sépia', lang),
    'studio.editor.filterBrightness': L('Brilho', 'Brightness', 'Brillo', 'Luminosité', lang),
    'studio.editor.filterContrast': L('Contraste', 'Contrast', 'Contraste', 'Contraste', lang),
    'studio.editor.filterBlur': L('Desfoque', 'Blur', 'Desenfoque', 'Flou', lang),
    'studio.editor.filterVivid': L('Vívido', 'Vivid', 'Vívido', 'Vif', lang),
    'studio.editor.animation': L('Animação', 'Animation', 'Animación', 'Animation', lang),
    'studio.editor.animNone': L('Nenhuma', 'None', 'Ninguna', 'Aucune', lang),
    'studio.editor.animFade': L('Aparecer', 'Fade in', 'Aparecer', 'Fondu', lang),
    'studio.editor.animSlide': L('Deslizar', 'Slide in', 'Deslizar', 'Glisser', lang),
    'studio.editor.animPulse': L('Pulsar', 'Pulse', 'Pulsar', 'Pulsation', lang),
    'studio.editor.animBounce': L('Saltar', 'Bounce', 'Rebotar', 'Rebond', lang),
    'studio.editor.animDuration': L('Duração (s)', 'Duration (s)', 'Duración (s)', 'Durée (s)', lang),
    'studio.editor.icon': L('Ícone', 'Icon', 'Icono', 'Icône', lang),
    'studio.opt.animatedExport': L('ZIP com HTML animado + GIF', 'ZIP with animated HTML + GIF', 'ZIP con HTML animado + GIF', 'ZIP avec HTML animé + GIF', lang),
    'studio.collab.active': L('Colaboração em tempo real ativa nesta sessão.', 'Real-time collaboration active in this session.', 'Colaboración en tiempo real activa en esta sesión.', 'Collaboration en temps réel active dans cette session.', lang),
    'studio.step.letterhead': L('Papel timbrado', 'Letterhead', 'Papel membretado', 'Papier à en-tête', lang),
    'studio.letterhead.configAria': L('Configuração do papel timbrado', 'Letterhead settings', 'Configuración del papel membretado', 'Paramètres du papier à en-tête', lang),
    'studio.letterhead.lead': L(
      'Escolha um modelo fixo e preencha os dados da empresa. O layout do A4 não pode ser alterado.',
      'Pick a fixed template and fill in your company details. The A4 layout cannot be changed.',
      'Elija una plantilla fija y complete los datos de la empresa. El diseño del A4 no se puede modificar.',
      'Choisissez un modèle fixe et renseignez les données de l’entreprise. La mise en page A4 n’est pas modifiable.',
      lang
    ),
    'studio.letterhead.section.presets': L('Modelo', 'Template', 'Modelo', 'Modèle', lang),
    'studio.letterhead.presets.hint': L(
      'Cinco layouts profissionais. Apenas textos, cores e logo são aplicados dinamicamente.',
      'Five professional layouts. Only text, colors and logo are applied dynamically.',
      'Cinco diseños profesionales. Solo textos, colores y logo se aplican dinámicamente.',
      'Cinq mises en page professionnelles. Seuls textes, couleurs et logo sont appliqués dynamiquement.',
      lang
    ),
    'studio.letterhead.preset.corporateAngles': L('Corporate ângulos', 'Corporate angles', 'Corporate ángulos', 'Corporate angles', lang),
    'studio.letterhead.preset.modernCorners': L('Cantos modernos', 'Modern corners', 'Esquinas modernas', 'Coins modernes', lang),
    'studio.letterhead.preset.waves': L('Ondas', 'Waves', 'Ondas', 'Vagues', lang),
    'studio.letterhead.preset.institutional': L('Institucional', 'Institutional', 'Institucional', 'Institutionnel', lang),
    'studio.letterhead.preset.minimalCenter': L('Minimal central', 'Minimal centered', 'Minimal centrado', 'Minimal centré', lang),
    'studio.letterhead.section.company': L('Dados da empresa', 'Company details', 'Datos de la empresa', 'Données de l’entreprise', lang),
    'studio.letterhead.section.brand': L('Marca e opções', 'Brand & options', 'Marca y opciones', 'Marque et options', lang),
    'studio.letterhead.section.logo': L('Logotipo', 'Logo', 'Logotipo', 'Logo', lang),
    'studio.letterhead.color.primary': L('Cor primária', 'Primary color', 'Color primario', 'Couleur primaire', lang),
    'studio.letterhead.color.primaryHint': L('Traço superior do cabeçalho', 'Top header rule', 'Línea superior del encabezado', 'Trait supérieur de l’en-tête', lang),
    'studio.letterhead.color.secondary': L('Cor secundária', 'Secondary color', 'Color secundario', 'Couleur secondaire', lang),
    'studio.letterhead.color.secondaryHint': L('Traço inferior do rodapé', 'Bottom footer rule', 'Línea inferior del pie', 'Trait inférieur du pied de page', lang),
    'studio.letterhead.logo.hint': L(
      'O logo aparece no cabeçalho do A4. Envie um arquivo novo para substituir o cadastro da empresa.',
      'The logo appears in the A4 header. Upload a new file to replace the company record.',
      'El logo aparece en el encabezado del A4. Suba un archivo nuevo para reemplazar el registro de la empresa.',
      'Le logo apparaît dans l’en-tête A4. Téléversez un nouveau fichier pour remplacer l’enregistrement de l’entreprise.',
      lang
    ),
    'studio.letterhead.logo.upload': L('Enviar novo logo', 'Upload new logo', 'Subir nuevo logo', 'Téléverser un nouveau logo', lang),
    'studio.letterhead.logo.spec': L(
      'Sugerido: PNG ou JPG, até 2 MB, ~800×400 px (fundo transparente no PNG).',
      'Suggested: PNG or JPG, up to 2 MB, ~800×400 px (transparent PNG background).',
      'Sugerido: PNG o JPG, hasta 2 MB, ~800×400 px (fondo transparente en PNG).',
      'Suggéré : PNG ou JPG, jusqu’à 2 Mo, ~800×400 px (fond transparent en PNG).',
      lang
    ),
    'studio.letterhead.logo.alt': L('Logo da empresa', 'Company logo', 'Logo de la empresa', 'Logo de l’entreprise', lang),
    'studio.letterhead.logo.empty': L('Nenhum logo cadastrado', 'No logo on file', 'Sin logo registrado', 'Aucun logo enregistré', lang),
    'studio.letterhead.logo.invalidType': L('Use PNG, JPG ou WebP.', 'Use PNG, JPG or WebP.', 'Use PNG, JPG o WebP.', 'Utilisez PNG, JPG ou WebP.', lang),
    'studio.letterhead.logo.tooLarge': L('Arquivo acima de 2 MB.', 'File exceeds 2 MB.', 'Archivo superior a 2 MB.', 'Fichier supérieur à 2 Mo.', lang),
    'studio.letterhead.logo.uploaded': L('Logo atualizado.', 'Logo updated.', 'Logo actualizado.', 'Logo mis à jour.', lang),
    'studio.letterhead.logo.uploadFailed': L('Falha ao enviar o logo.', 'Logo upload failed.', 'Error al subir el logo.', 'Échec du téléversement du logo.', lang),
    'studio.letterhead.preview.title': L('Pré-visualização A4', 'A4 preview', 'Vista previa A4', 'Aperçu A4', lang),
    'studio.letterhead.preview.sub': L(
      'Pré-visualização gerada no servidor com o modelo selecionado.',
      'Server-rendered preview using the selected template.',
      'Vista previa generada en el servidor con el modelo seleccionado.',
      'Aperçu généré côté serveur avec le modèle sélectionné.',
      lang
    ),
    'studio.letterhead.section.layout': L('Layout A4', 'A4 layout', 'Diseño A4', 'Mise en page A4', lang),
    'studio.letterhead.layout.hint': L(
      'Clique numa caixa no A4 para mover ou redimensionar. Use o botão abaixo para nova caixa de texto.',
      'Click a box on the A4 to move or resize. Use the button below to add a new text box.',
      'Haga clic en un recuadro del A4 para mover o redimensionar. Use el botón para añadir texto.',
      'Cliquez sur une zone de l’A4 pour déplacer ou redimensionner. Ajoutez du texte avec le bouton ci-dessous.',
      lang
    ),
    'studio.letterhead.addText': L('Nova caixa de texto', 'New text box', 'Nuevo cuadro de texto', 'Nouvelle zone de texte', lang),
    'studio.letterhead.canvas.hint': L(
      'Arraste · alças para redimensionar · Delete remove a caixa selecionada',
      'Drag · handles to resize · Delete removes the selected box',
      'Arrastre · asas para redimensionar · Supr elimina el cuadro seleccionado',
      'Glisser · poignées pour redimensionner · Suppr supprime la zone sélectionnée',
      lang
    ),
    'studio.letterhead.deleteSelection': L('Excluir seleção', 'Delete selection', 'Eliminar selección', 'Supprimer la sélection', lang),
    'studio.letterhead.deleteProtected': L(
      'Este elemento faz parte do modelo base e não pode ser excluído. Exclua apenas caixas de texto que você adicionou.',
      'This element is part of the base template and cannot be deleted. Only remove text boxes you added.',
      'Este elemento forma parte de la plantilla base y no se puede eliminar. Solo elimine cuadros de texto que añadió.',
      'Cet élément fait partie du modèle de base et ne peut pas être supprimé. Supprimez uniquement les zones de texte ajoutées.',
      lang
    ),
    'studio.letterhead.preview.loading': L('Gerando pré-visualização…', 'Generating preview…', 'Generando vista previa…', 'Génération de l’aperçu…', lang),
    'studio.letterhead.preview.wait': L('A pré-visualização aparecerá em instantes.', 'Preview will appear in a moment.', 'La vista previa aparecerá en un momento.', 'L’aperçu apparaîtra dans un instant.', lang),
    'studio.letterhead.zoom.aria': L('Zoom da pré-visualização', 'Preview zoom', 'Zoom de la vista previa', 'Zoom de l’aperçu', lang),
    'studio.letterhead.zoom.in': L('Aumentar zoom', 'Zoom in', 'Acercar', 'Zoom avant', lang),
    'studio.letterhead.zoom.out': L('Diminuir zoom', 'Zoom out', 'Alejar', 'Zoom arrière', lang)
  };
}

export const AERO_STUDIO_PT_BR = dict('pt');
export const AERO_STUDIO_EN_US = dict('en');
export const AERO_STUDIO_ES_ES = dict('es');
export const AERO_STUDIO_FR_FR = dict('fr');
