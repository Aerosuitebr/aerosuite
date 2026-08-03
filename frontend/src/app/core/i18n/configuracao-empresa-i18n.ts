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
    'empresaWizard.title': L(
      'Configuração da empresa',
      'Company setup',
      'Configuración de la empresa',
      'Configuration de l’entreprise',
      lang
    ),
    'empresaWizard.subtitle': L(
      'Preencha uma vez os dados da organização que opera o sistema. Eles alimentam marca, e-mails, propostas comerciais e telas públicas. Usuários sem perfil administrativo continuam trabalhando normalmente enquanto o assistente não for concluído.',
      'Enter your organization details once. They power branding, emails, commercial proposals and public screens. Non-admin users can keep working until the wizard is completed.',
      'Complete los datos de la organización una vez. Alimentan marca, correos, propuestas comerciales y pantallas públicas. Los usuarios no administradores pueden seguir trabajando hasta terminar el asistente.',
      'Saisissez une fois les données de l’organisation. Elles alimentent la marque, les e-mails, les propositions commerciales et les écrans publics. Les utilisateurs non admin peuvent continuer à travailler jusqu’à la fin de l’assistant.',
      lang
    ),
    'empresaWizard.step.brand': L('1 · Marca', '1 · Brand', '1 · Marca', '1 · Marque', lang),
    'empresaWizard.step.contacts': L('2 · Contatos', '2 · Contacts', '2 · Contactos', '2 · Contacts', lang),
    'empresaWizard.step.company': L('3 · Empresa', '3 · Company', '3 · Empresa', '3 · Entreprise', lang),
    'empresaWizard.step.review': L('4 · Revisão', '4 · Review', '4 · Revisión', '4 · Révision', lang),
    'empresaWizard.field.displayName': L(
      'Nome comercial (como aparece no sistema)',
      'Trade name (as shown in the app)',
      'Nombre comercial (como aparece en el sistema)',
      'Nom commercial (affiché dans l’application)',
      lang
    ),
    'empresaWizard.field.displayName.ph': L('Ex.: Aero Suite', 'E.g. Aero Suite', 'Ej.: Aero Suite', 'Ex. : Aero Suite', lang),
    'empresaWizard.field.tagline': L('Tagline / slogan', 'Tagline / slogan', 'Eslogan / slogan', 'Slogan / accroche', lang),
    'empresaWizard.field.tagline.ph': L(
      'Ex.: Plataforma de gestão para oficinas MRO',
      'E.g. Management platform for MRO workshops',
      'Ej.: Plataforma de gestión para talleres MRO',
      'Ex. : Plateforme de gestion pour ateliers MRO',
      lang
    ),
    'empresaWizard.field.emailSubjectSuffix': L(
      'Sufixo de assunto de e-mail (opcional)',
      'Email subject suffix (optional)',
      'Sufijo del asunto del correo (opcional)',
      'Suffixe d’objet d’e-mail (optionnel)',
      lang
    ),
    'empresaWizard.field.emailSubjectSuffix.ph': L(
      'Deixe vazio para usar o nome comercial',
      'Leave empty to use the trade name',
      'Deje vacío para usar el nombre comercial',
      'Laisser vide pour utiliser le nom commercial',
      lang
    ),
    'empresaWizard.field.browserTitleSuffix': L(
      'Sufixo do título do navegador',
      'Browser title suffix',
      'Sufijo del título del navegador',
      'Suffixe du titre du navigateur',
      lang
    ),
    'empresaWizard.field.browserTitleSuffix.ph': L(
      'Ex.: Gestão MRO',
      'E.g. MRO management',
      'Ej.: Gestión MRO',
      'Ex. : Gestion MRO',
      lang
    ),
    'empresaWizard.field.logo': L('Logo (URL ou envio)', 'Logo (URL or upload)', 'Logo (URL o carga)', 'Logo (URL ou téléversement)', lang),
    'empresaWizard.field.logo.ph': L(
      'assets/LOGO_AERO.png ou /api/public/empresa-asset/logo',
      'assets/LOGO_AERO.png or /api/public/empresa-asset/logo',
      'assets/LOGO_AERO.png o /api/public/empresa-asset/logo',
      'assets/LOGO_AERO.png ou /api/public/empresa-asset/logo',
      lang
    ),
    'empresaWizard.btn.uploadLogo': L('Enviar imagem do logo', 'Upload logo image', 'Subir imagen del logo', 'Téléverser le logo', lang),
    'empresaWizard.preview.logo': L('Pré-visualização logo', 'Logo preview', 'Vista previa del logo', 'Aperçu du logo', lang),
    'empresaWizard.field.wordmark': L('Wordmark (URL ou envio)', 'Wordmark (URL or upload)', 'Wordmark (URL o carga)', 'Wordmark (URL ou téléversement)', lang),
    'empresaWizard.field.wordmark.ph': L(
      'assets/LOGO_LETRA.png ou /api/public/empresa-asset/wordmark',
      'assets/LOGO_LETRA.png or /api/public/empresa-asset/wordmark',
      'assets/LOGO_LETRA.png o /api/public/empresa-asset/wordmark',
      'assets/LOGO_LETRA.png ou /api/public/empresa-asset/wordmark',
      lang
    ),
    'empresaWizard.field.primaryColor': L(
      'Cor primária da marca',
      'Brand primary color',
      'Color primario de la marca',
      'Couleur primaire de la marque',
      lang
    ),
    'empresaWizard.field.primaryColor.hint': L(
      'Acentua botões e destaques do login, propostas comerciais, impressão de OS, e-mails transacionais e variáveis CSS da marca (--brand-primary).',
      'Accents login buttons and highlights, commercial proposals, work order printouts, transactional emails and brand CSS variables (--brand-primary).',
      'Acentúa botones y destacados del login, propuestas comerciales, impresión de OS, correos transaccionales y variables CSS de marca (--brand-primary).',
      'Accentue les boutons et surlignages de connexion, propositions commerciales, impression OS, e-mails transactionnels et variables CSS de marque (--brand-primary).',
      lang
    ),
    'empresaWizard.field.primaryColor.ph': L('#0ea5e9', '#0ea5e9', '#0ea5e9', '#0ea5e9', lang),
    'empresaWizard.btn.uploadWordmark': L('Enviar wordmark', 'Upload wordmark', 'Subir wordmark', 'Téléverser le wordmark', lang),
    'empresaWizard.preview.wordmark': L('Pré-visualização wordmark', 'Wordmark preview', 'Vista previa del wordmark', 'Aperçu du wordmark', lang),
    'empresaWizard.field.copyrightEntity': L(
      'Entidade para © / rodapé (opcional)',
      'Entity for © / footer (optional)',
      'Entidad para © / pie de página (opcional)',
      'Entité pour © / pied de page (optionnel)',
      lang
    ),
    'empresaWizard.field.copyrightEntity.ph': L(
      'Ex.: razão social resumida',
      'E.g. short legal name',
      'Ej.: razón social resumida',
      'Ex. : raison sociale abrégée',
      lang
    ),
    'empresaWizard.field.phone': L('Telefone comercial', 'Business phone', 'Teléfono comercial', 'Téléphone professionnel', lang),
    'empresaWizard.field.phone.ph': L('(11) 98765-4321', '(11) 98765-4321', '(11) 98765-4321', '+33 6 12 34 56 78', lang),
    'empresaWizard.field.phone.hint': L(
      'Digite DDD + número; a formatação é aplicada automaticamente.',
      'Enter area code + number; formatting is applied automatically.',
      'Ingrese DDD + número; el formato se aplica automáticamente.',
      'Saisissez l’indicatif + numéro ; le formatage est automatique.',
      lang
    ),
    'empresaWizard.field.website': L('Site (opcional)', 'Website (optional)', 'Sitio web (opcional)', 'Site web (optionnel)', lang),
    'empresaWizard.field.website.ph': L('https://…', 'https://…', 'https://…', 'https://…', lang),
    'empresaWizard.field.legalName': L('Razão social', 'Legal name', 'Razón social', 'Raison sociale', lang),
    'empresaWizard.field.cnpj': L('CNPJ (14 dígitos)', 'CNPJ (14 digits)', 'CNPJ (14 dígitos)', 'CNPJ (14 chiffres)', lang),
    'empresaWizard.field.cnpj.ph': L('00.000.000/0001-00', '00.000.000/0001-00', '00.000.000/0001-00', '00.000.000/0001-00', lang),
    'empresaWizard.field.cnpj.hint': L(
      'Ao informar o CNPJ, razão social e endereço serão preenchidos automaticamente com dados da Receita Federal.',
      'When you enter the CNPJ, legal name and address are filled automatically from the Federal Revenue registry.',
      'Al informar el CNPJ, la razón social y la dirección se completarán automáticamente con datos de la Receita Federal.',
      'Lors de la saisie du CNPJ, la raison sociale et l’adresse sont remplies automatiquement à partir du registre fédéral.',
      lang
    ),
    'empresaWizard.field.stateRegistration': L('Inscrição estadual (opcional)', 'State registration (optional)', 'Inscripción estatal (opcional)', 'Inscription d’État (optionnel)', lang),
    'empresaWizard.field.cityRegistration': L(
      'Inscrição municipal (opcional)',
      'Municipal registration (optional)',
      'Inscripción municipal (opcional)',
      'Inscription municipale (optionnel)',
      lang
    ),
    'empresaWizard.field.nfeEmail': L('E-mail NF-e (opcional)', 'NF-e email (optional)', 'Correo NF-e (opcional)', 'E-mail NF-e (optionnel)', lang),
    'empresaWizard.field.nfeEmail.ph': L('nfe@suaempresa.com.br', 'nfe@company.com', 'nfe@empresa.com', 'nfe@entreprise.com', lang),
    'empresaWizard.field.nfeEmail.hint': L(
      'Se vazio, usamos o e-mail de contato ao avançar para a etapa seguinte.',
      'If empty, we use the contact email when you proceed to the next step.',
      'Si está vacío, usamos el correo de contacto al avanzar al siguiente paso.',
      'Si vide, nous utilisons l’e-mail de contact à l’étape suivante.',
      lang
    ),
    'empresaWizard.field.number.ph': L('Ex.: 1200', 'E.g. 1200', 'Ej.: 1200', 'Ex. : 1200', lang),
    'empresaWizard.field.street': L('Logradouro', 'Street address', 'Dirección', 'Adresse', lang),
    'empresaWizard.field.number': L('Número', 'Number', 'Número', 'Numéro', lang),
    'empresaWizard.field.complement': L('Complemento', 'Complement', 'Complemento', 'Complément', lang),
    'empresaWizard.field.district': L('Bairro', 'District', 'Barrio', 'Quartier', lang),
    'empresaWizard.field.city': L('Cidade', 'City', 'Ciudad', 'Ville', lang),
    'empresaWizard.field.state': L('UF', 'State', 'Provincia', 'Région', lang),
    'empresaWizard.field.state.ph': L('SP', 'SP', 'SP', 'SP', lang),
    'empresaWizard.field.zip': L('CEP', 'ZIP code', 'Código postal', 'Code postal', lang),
    'empresaWizard.field.zip.ph': L('00000-000', '00000-000', '00000-000', '00000-000', lang),
    'empresaWizard.field.zip.hint': L(
      'Se o endereço não foi preenchido automaticamente, informe o CEP para completá-lo.',
      'If the address was not filled automatically, enter the ZIP code to complete it.',
      'Si la dirección no se completó automáticamente, ingrese el CEP para completarla.',
      'Si l’adresse n’a pas été remplie automatiquement, saisissez le code postal pour la compléter.',
      lang
    ),
    'empresaWizard.section.company': L('Dados da empresa', 'Company details', 'Datos de la empresa', 'Données de l’entreprise', lang),
    'empresaWizard.section.address': L('Endereço', 'Address', 'Dirección', 'Adresse', lang),
    'empresaWizard.section.address.lead': L(
      'Os campos de endereço são preenchidos automaticamente com base no CNPJ. Verifique os dados e complete o número do imóvel, se necessário.',
      'Address fields are filled automatically from the CNPJ. Review the data and enter the street number if needed.',
      'Los campos de dirección se completan automáticamente según el CNPJ. Verifique los datos e indique el número del inmueble, si es necesario.',
      'Les champs d’adresse sont remplis automatiquement à partir du CNPJ. Vérifiez les données et saisissez le numéro de rue si nécessaire.',
      lang
    ),
    'empresaWizard.section.tax': L('Dados fiscais', 'Tax information', 'Datos fiscales', 'Informations fiscales', lang),
    'empresaWizard.lookup.loading': L('Consultando…', 'Looking up…', 'Consultando…', 'Recherche…', lang),
    'empresaWizard.lookup.cepNotFound': L(
      'CEP não encontrado. Verifique o número ou preencha o endereço manualmente.',
      'ZIP code not found. Check the number or fill in the address manually.',
      'CEP no encontrado. Verifique el número o complete la dirección manualmente.',
      'Code postal introuvable. Vérifiez le numéro ou saisissez l’adresse manuellement.',
      lang
    ),
    'empresaWizard.lookup.cnpjNotFound': L(
      'CNPJ não encontrado na base pública. Informe a razão social manualmente.',
      'CNPJ not found in the public registry. Enter the legal name manually.',
      'CNPJ no encontrado en el registro público. Indique la razón social manualmente.',
      'CNPJ introuvable dans le registre public. Saisissez la raison sociale manuellement.',
      lang
    ),
    'empresaWizard.review.intro': L(
      'Revise os dados cadastrados. Ao concluir, esta configuração passará a ser a fonte oficial da organização (e-mails transacionais, PDFs e identidade visual do portal de acesso).',
      'Review the registered data. When you finish, this configuration becomes the organization’s official source (transactional emails, PDFs, and portal branding).',
      'Revise los datos registrados. Al concluir, esta configuración será la fuente oficial de la organización (correos transaccionales, PDF y marca del portal).',
      'Vérifiez les données enregistrées. À la fin, cette configuration devient la source officielle de l’organisation (e-mails transactionnels, PDF et image du portail).',
      lang
    ),
    'empresaWizard.review.brand': L('Marca', 'Brand', 'Marca', 'Marque', lang),
    'empresaWizard.review.contact': L('Contato', 'Contact', 'Contacto', 'Contact', lang),
    'empresaWizard.review.company': L('Empresa', 'Company', 'Empresa', 'Entreprise', lang),
    'empresaWizard.review.taxExtras': L('Extras fiscais', 'Tax extras', 'Extras fiscales', 'Extras fiscaux', lang),
    'empresaWizard.review.municipalInscr': L('Inscr. municipal {{value}}', 'Municipal reg. {{value}}', 'Inscr. municipal {{value}}', 'Inscr. municipale {{value}}', lang),
    'empresaWizard.review.nfeEmail': L('E-mail NF-e {{value}}', 'NF-e email {{value}}', 'Correo NF-e {{value}}', 'E-mail NF-e {{value}}', lang),
    'empresaWizard.review.address': L('Endereço', 'Address', 'Dirección', 'Adresse', lang),
    'empresaWizard.review.primaryColor': L(
      'Cor primária: {{color}}',
      'Primary color: {{color}}',
      'Color primario: {{color}}',
      'Couleur principale : {{color}}',
      lang
    ),
    'empresaWizard.review.taglineWarn': L(
      'A tagline está idêntica ao nome comercial — revise se isso é intencional.',
      'The tagline matches the commercial name — confirm this is intentional.',
      'El eslogan es idéntico al nombre comercial — confirme si es intencional.',
      'Le slogan est identique au nom commercial — confirmez que c’est intentionnel.',
      lang
    ),
    'empresaWizard.confirm.label': L(
      'Declaro que as informações cadastradas são verdadeiras e autorizo sua utilização como dados oficiais da organização, sendo aplicadas em documentos, e-mails transacionais e no portal de acesso ao cliente.',
      'I declare that the registered information is accurate and authorize its use as the organization’s official data, applied in documents, transactional emails, and the customer access portal.',
      'Declaro que la información registrada es veraz y autorizo su uso como datos oficiales de la organización, aplicados en documentos, correos transaccionales y en el portal de acceso al cliente.',
      'Je déclare que les informations enregistrées sont exactes et autorise leur utilisation comme données officielles de l’organisation, appliées aux documents, e-mails transactionnels et au portail client.',
      lang
    ),
    'empresaWizard.btn.back': L('Voltar', 'Back', 'Volver', 'Retour', lang),
    'empresaWizard.btn.saveDraft': L('Salvar rascunho', 'Save draft', 'Guardar borrador', 'Enregistrer le brouillon', lang),
    'empresaWizard.btn.continue': L('Continuar', 'Continue', 'Continuar', 'Continuer', lang),
    'empresaWizard.btn.finish': L('Concluir configuração', 'Finish setup', 'Concluir configuración', 'Terminer la configuration', lang),
    'empresaWizard.btn.accessSystem': L('Acessar o sistema', 'Access the system', 'Acceder al sistema', 'Accéder au système', lang),
    'empresaWizard.btn.backToLogin': L('Voltar ao login', 'Back to login', 'Volver al inicio de sesión', 'Retour à la connexion', lang),
    'empresaWizard.completed.title': L('Configuração concluída', 'Setup complete', 'Configuración completada', 'Configuration terminée', lang),
    'empresaWizard.completed.body': L(
      'A identidade visual e os dados da empresa já estão ativos. Você será redirecionado ao painel em instantes.',
      'Branding and company data are now active. You will be redirected to the dashboard shortly.',
      'La identidad visual y los datos de la empresa ya están activos. Será redirigido al panel en breve.',
      'L’identité visuelle et les données entreprise sont actives. Vous serez redirigé vers le tableau de bord sous peu.',
      lang
    ),
    'empresaWizard.blocked.title': L('Acesso restrito', 'Restricted access', 'Acceso restringido', 'Accès restreint', lang),
    'empresaWizard.blocked.body': L(
      'Apenas um usuário com perfil administrativo (ex.: ADMIN) pode preencher a configuração inicial da empresa.',
      'Only a user with an admin profile (e.g. ADMIN) can complete the initial company setup.',
      'Solo un usuario con perfil administrativo (p. ej. ADMIN) puede completar la configuración inicial de la empresa.',
      'Seul un utilisateur avec un profil administrateur (ex. ADMIN) peut compléter la configuration initiale de l’entreprise.',
      lang
    ),
    'empresaWizard.btn.goHome': L('Ir para o início', 'Go to home', 'Ir al inicio', 'Aller à l’accueil', lang),
    'empresaWizard.toast.loadError': L(
      'Não foi possível carregar o estado da configuração da empresa.',
      'Could not load company setup status.',
      'No se pudo cargar el estado de la configuración de la empresa.',
      'Impossible de charger l’état de la configuration de l’entreprise.',
      lang
    ),
    'empresaWizard.toast.requiredFields': L(
      'Informe nome comercial e tagline.',
      'Enter trade name and tagline.',
      'Indique nombre comercial y eslogan.',
      'Indiquez le nom commercial et le slogan.',
      lang
    ),
    'empresaWizard.toast.invalidSupportEmail': L(
      'Informe um e-mail de suporte válido.',
      'Enter a valid support email.',
      'Indique un correo de soporte válido.',
      'Indiquez un e-mail de support valide.',
      lang
    ),
    'empresaWizard.toast.phoneRequired': L(
      'Informe o telefone comercial.',
      'Enter the business phone number.',
      'Indique el teléfono comercial.',
      'Indiquez le téléphone professionnel.',
      lang
    ),
    'empresaWizard.toast.invalidPhoneFormat': L(
      'O telefone informado não é válido. Use apenas números com DDD.',
      'The phone number is invalid. Use digits only with area code.',
      'El teléfono no es válido. Use solo dígitos con código de área.',
      'Le numéro de téléphone est invalide. Utilisez uniquement des chiffres avec indicatif.',
      lang
    ),
    'empresaWizard.toast.invalidWebsite': L(
      'Informe uma URL válida (ex.: https://suaempresa.com.br).',
      'Enter a valid URL (e.g. https://yourcompany.com).',
      'Indique una URL válida (p. ej. https://suempresa.com).',
      'Saisissez une URL valide (ex. https://votresociete.com).',
      lang
    ),
    'empresaWizard.toast.legalNameRequired': L(
      'Campo obrigatório.',
      'Required field.',
      'Campo obligatorio.',
      'Champ obligatoire.',
      lang
    ),
    'empresaWizard.toast.cnpjInvalid': L(
      'O CNPJ deve conter 14 dígitos.',
      'CNPJ must contain 14 digits.',
      'El CNPJ debe contener 14 dígitos.',
      'Le CNPJ doit contenir 14 chiffres.',
      lang
    ),
    'empresaWizard.toast.addressIncomplete': L(
      'Preencha logradouro, cidade, UF (2 letras) e CEP.',
      'Fill in street, city, state (2 letters) and ZIP code.',
      'Complete dirección, ciudad, provincia (2 letras) y código postal.',
      'Renseignez l’adresse, la ville, la région (2 lettres) et le code postal.',
      lang
    ),
    'empresaWizard.toast.draftSaved': L(
      'Alterações salvas.',
      'Changes saved.',
      'Cambios guardados.',
      'Modifications enregistrées.',
      lang
    ),
    'empresaWizard.toast.completed': L(
      'A configuração da empresa está ativa em todo o sistema.',
      'Company setup is now active across the system.',
      'La configuración de la empresa está activa en todo el sistema.',
      'La configuration de l’entreprise est active dans tout le système.',
      lang
    ),
    'empresaWizard.toast.saveError': L(
      'Não foi possível salvar. Verifique os campos.',
      'Could not save. Check the fields.',
      'No se pudo guardar. Verifique los campos.',
      'Impossible d’enregistrer. Vérifiez les champs.',
      lang
    ),
    'empresaWizard.toast.logoUploaded': L(
      'Arquivo enviado.',
      'File uploaded.',
      'Archivo enviado.',
      'Fichier téléversé.',
      lang
    ),
    'empresaWizard.toast.logoUploadError': L(
      'Falha no envio.',
      'Upload failed.',
      'Error al enviar.',
      'Échec du téléversement.',
      lang
    ),
    'empresaWizard.toast.wordmarkUploaded': L(
      'Arquivo enviado.',
      'File uploaded.',
      'Archivo enviado.',
      'Fichier téléversé.',
      lang
    ),
    'empresaWizard.toast.wordmarkUploadError': L(
      'Falha no envio.',
      'Upload failed.',
      'Error al enviar.',
      'Échec du téléversement.',
      lang
    ),
    'empresaWizard.toast.summary.error': L('Erro', 'Error', 'Error', 'Erreur', lang),
    'empresaWizard.toast.summary.warn': L('Atenção', 'Warning', 'Atención', 'Attention', lang),
    'empresaWizard.toast.summary.required': L(
      'Campos obrigatórios',
      'Required fields',
      'Campos obligatorios',
      'Champs obligatoires',
      lang
    ),
    'empresaWizard.toast.summary.email': L('E-mail', 'Email', 'Correo', 'E-mail', lang),
    'empresaWizard.toast.summary.phone': L('Telefone', 'Phone', 'Teléfono', 'Téléphone', lang),
    'empresaWizard.toast.summary.website': L('Site', 'Website', 'Sitio web', 'Site web', lang),
    'empresaWizard.toast.summary.legalName': L('Razão social', 'Legal name', 'Razón social', 'Raison sociale', lang),
    'empresaWizard.toast.summary.cnpj': L('CNPJ', 'CNPJ', 'CNPJ', 'CNPJ', lang),
    'empresaWizard.toast.summary.address': L('Endereço', 'Address', 'Dirección', 'Adresse', lang),
    'empresaWizard.toast.summary.draft': L('Rascunho', 'Draft', 'Borrador', 'Brouillon', lang),
    'empresaWizard.toast.summary.done': L('Concluído', 'Completed', 'Completado', 'Terminé', lang),
    'empresaWizard.toast.summary.logo': L('Logo', 'Logo', 'Logo', 'Logo', lang),
    'empresaWizard.toast.summary.wordmark': L('Wordmark', 'Wordmark', 'Wordmark', 'Wordmark', lang),
    'empresaWizard.required': L('obrigatório', 'required', 'obligatorio', 'obligatoire', lang),
    'empresaWizard.steps.aria': L(
      'Etapas da configuração',
      'Setup steps',
      'Etapas de configuración',
      'Étapes de configuration',
      lang
    ),
    'empresaWizard.validation.displayName': L(
      'Informe o nome comercial.',
      'Enter the trade name.',
      'Informe el nombre comercial.',
      'Indiquez le nom commercial.',
      lang
    ),
    'empresaWizard.validation.tagline': L(
      'Informe a tagline ou slogan.',
      'Enter the tagline or slogan.',
      'Informe el eslogan o slogan.',
      'Indiquez le slogan ou l’accroche.',
      lang
    ),
    'empresaWizard.validation.supportEmail': L(
      'Informe um e-mail de suporte válido.',
      'Enter a valid support email.',
      'Informe un correo de soporte válido.',
      'Indiquez un e-mail de support valide.',
      lang
    ),
    'empresaWizard.validation.telefone': L(
      'Informe o telefone de contato.',
      'Enter the contact phone number.',
      'Informe el teléfono de contacto.',
      'Indiquez le téléphone de contact.',
      lang
    ),
    'empresaWizard.validation.telefoneFormat': L(
      'Informe um telefone válido (apenas números, com DDD).',
      'Enter a valid phone number (digits only, with area code).',
      'Informe un teléfono válido (solo dígitos, con código de área).',
      'Indiquez un numéro de téléphone valide (chiffres uniquement, avec indicatif).',
      lang
    ),
    'empresaWizard.validation.razaoSocial': L(
      'Informe a razão social.',
      'Enter the legal name.',
      'Informe la razón social.',
      'Indiquez la raison sociale.',
      lang
    ),
    'empresaWizard.validation.cnpj': L(
      'Informe um CNPJ válido com 14 dígitos.',
      'Enter a valid 14-digit CNPJ.',
      'Informe un CNPJ válido de 14 dígitos.',
      'Indiquez un CNPJ valide à 14 chiffres.',
      lang
    ),
    'empresaWizard.validation.address': L(
      'Preencha logradouro, cidade, UF e CEP.',
      'Fill in street, city, state and ZIP code.',
      'Complete calle, ciudad, UF y CEP.',
      'Renseignez rue, ville, UF et code postal.',
      lang
    ),
  };
}

export const CONFIGURACAO_EMPRESA_PT_BR = dict('pt');
export const CONFIGURACAO_EMPRESA_EN_US = dict('en');
export const CONFIGURACAO_EMPRESA_ES_ES = dict('es');
export const CONFIGURACAO_EMPRESA_FR_FR = dict('fr');
