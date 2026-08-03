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
    'formsMisc.fabricante.placeholderNome': L(
      'Digite o nome do fabricante',
      'Enter the manufacturer name',
      'Escriba el nombre del fabricante',
      'Saisissez le nom du fabricant',
      lang
    ),
    'formsMisc.fabricante.placeholderNovoNome': L(
      'Digite o nome do novo fabricante',
      'Enter the new manufacturer name',
      'Escriba el nombre del nuevo fabricante',
      'Saisissez le nom du nouveau fabricant',
      lang
    ),
    'formsMisc.tpfiles.labelDescription': L(
      'Descrição',
      'Description',
      'Descripción',
      'Description',
      lang
    ),
    'formsMisc.tpfiles.placeholderFileName': L(
      'Ex: manual_servico.pdf',
      'E.g. service_manual.pdf',
      'Ej.: manual_servicio.pdf',
      'Ex. : manuel_service.pdf',
      lang
    ),
    'formsMisc.tpfiles.placeholderOriginalName': L(
      'Nome original do arquivo',
      'Original file name',
      'Nombre original del archivo',
      'Nom original du fichier',
      lang
    ),
    'formsMisc.tpfiles.placeholderFilePath': L(
      '/uploads/tipos-servico/manual_servico.pdf',
      '/uploads/tipos-servico/service_manual.pdf',
      '/uploads/tipos-servico/manual_servicio.pdf',
      '/uploads/tipos-servico/manuel_service.pdf',
      lang
    ),
    'formsMisc.tpfiles.placeholderFileSize': L('0', '0', '0', '0', lang),
    'formsMisc.tpfiles.placeholderMimeType': L(
      'Ex: application/pdf',
      'E.g. application/pdf',
      'Ej.: application/pdf',
      'Ex. : application/pdf',
      lang
    ),
    'formsMisc.tpfiles.placeholderExtension': L(
      'Ex: pdf',
      'E.g. pdf',
      'Ej.: pdf',
      'Ex. : pdf',
      lang
    ),
    'formsMisc.tpfiles.placeholderSortOrder': L('0', '0', '0', '0', lang),
    'formsMisc.tpfiles.placeholderDescription': L(
      'Descrição do arquivo',
      'File description',
      'Descripción del archivo',
      'Description du fichier',
      lang
    ),
    'formsMisc.externo.placeholderNome': L(
      'Nome do cliente',
      'Customer name',
      'Nombre del cliente',
      'Nom du client',
      lang
    ),
    'formsMisc.externo.placeholderEmail': L(
      'email@empresa.com',
      'email@company.com',
      'email@empresa.com',
      'email@entreprise.com',
      lang
    ),
    'formsMisc.externo.placeholderEmpresa': L(
      'Nome da empresa',
      'Company name',
      'Nombre de la empresa',
      'Nom de l’entreprise',
      lang
    ),
    'formsMisc.externo.placeholderCargo': L(
      'Cargo do cliente',
      'Customer job title',
      'Cargo del cliente',
      'Poste du client',
      lang
    ),
    'formsMisc.externo.placeholderTelefone': L(
      '+55 (00) 00000-0000 ou +1 555 123 4567',
      '+1 555 123 4567 or +55 (00) 00000-0000',
      '+34 612 345 678 o +55 (00) 00000-0000',
      '+33 6 12 34 56 78 ou +55 (00) 00000-0000',
      lang
    ),
    'formsMisc.externo.placeholderObservacoes': L(
      'Notas internas sobre este cliente...',
      'Internal notes about this customer...',
      'Notas internas sobre este cliente...',
      'Notes internes sur ce client...',
      lang
    ),
    'formsMisc.fabricante.sectionTitle': L('Informações do Fabricante', 'Manufacturer information', 'Información del fabricante', 'Informations sur le fabricant', lang),
    'formsMisc.fabricante.labelNome': L('Nome do Fabricante', 'Manufacturer name', 'Nombre del fabricante', 'Nom du fabricant', lang),
    'formsMisc.fabricante.errorNomeRequired': L('O nome do fabricante é obrigatório', 'Manufacturer name is required', 'El nombre del fabricante es obligatorio', 'Le nom du fabricant est obligatoire', lang),
    'formsMisc.fabricante.labelNomeAtual': L('Fabricante Atual', 'Current manufacturer', 'Fabricante actual', 'Fabricant actuel', lang),
    'formsMisc.fabricante.labelNovoNome': L('Novo Fabricante', 'New manufacturer', 'Nuevo fabricante', 'Nouveau fabricant', lang),
    'formsMisc.fabricante.errorNovoNomeRequired': L('Por favor, digite o nome do novo fabricante', 'Please enter the new manufacturer name', 'Ingrese el nombre del nuevo fabricante', 'Veuillez saisir le nom du nouveau fabricant', lang),
    'formsMisc.fabricante.infoSubstituicao': L('O fabricante atual será substituído pelo novo nome digitado', 'The current manufacturer will be replaced by the new name entered', 'El fabricante actual será reemplazado por el nuevo nombre', 'Le fabricant actuel sera remplacé par le nouveau nom', lang),
    'formsMisc.externo.btnBack': L('Voltar', 'Back', 'Volver', 'Retour', lang),
    'formsMisc.externo.btnCancel': L('Cancelar', 'Cancel', 'Cancelar', 'Annuler', lang),
    'formsMisc.externo.btnSaveEdit': L('Salvar Alterações', 'Save changes', 'Guardar cambios', 'Enregistrer les modifications', lang),
    'formsMisc.externo.btnCreate': L('Criar Usuário', 'Create user', 'Crear usuario', 'Créer l’utilisateur', lang),
    'formsMisc.externo.titleNew': L('Novo Usuário Externo', 'New external user', 'Nuevo usuario externo', 'Nouvel utilisateur externe', lang),
    'formsMisc.externo.titleEdit': L('Editar Usuário Externo', 'Edit external user', 'Editar usuario externo', 'Modifier l’utilisateur externe', lang),
    'formsMisc.externo.sectionBasic': L('Informações Básicas', 'Basic information', 'Información básica', 'Informations de base', lang),
    'formsMisc.externo.sectionCompany': L('Informações da Empresa', 'Company information', 'Información de la empresa', 'Informations sur l’entreprise', lang),
    'formsMisc.externo.sectionNotes': L('Observações', 'Notes', 'Observaciones', 'Observations', lang),
    'formsMisc.externo.labelNome': L('Nome Completo', 'Full name', 'Nombre completo', 'Nom complet', lang),
    'formsMisc.externo.labelEmail': L('E-mail', 'Email', 'Correo electrónico', 'E-mail', lang),
    'formsMisc.externo.labelEmpresa': L('Empresa', 'Company', 'Empresa', 'Entreprise', lang),
    'formsMisc.externo.labelCargo': L('Cargo', 'Job title', 'Cargo', 'Poste', lang),
    'formsMisc.externo.labelTelefone': L('Telefone', 'Phone', 'Teléfono', 'Téléphone', lang),
    'formsMisc.externo.labelObservacoes': L('Observações Internas', 'Internal notes', 'Notas internas', 'Notes internes', lang),
    'formsMisc.externo.errorNomeRequired': L('Nome é obrigatório', 'Name is required', 'El nombre es obligatorio', 'Le nom est obligatoire', lang),
    'formsMisc.externo.errorEmailRequired': L('E-mail é obrigatório', 'Email is required', 'El correo es obligatorio', 'L’e-mail est obligatoire', lang),
    'formsMisc.externo.errorEmailInvalid': L('E-mail inválido', 'Invalid email', 'Correo inválido', 'E-mail invalide', lang),
    'formsMisc.externo.infoCreate': L('Importante:', 'Important:', 'Importante:', 'Important :', lang),
    'formsMisc.externo.infoCreateDetail': L('Ao criar o usuário, um e-mail será enviado automaticamente com as instruções para o primeiro acesso.', 'When the user is created, an email will be sent automatically with first-access instructions.', 'Al crear el usuario, se enviará un correo automático con instrucciones de primer acceso.', 'À la création, un e-mail sera envoyé automatiquement avec les instructions de premier accès.', lang),
    'formsMisc.tiposServico.btnSearch': L('Buscar', 'Search', 'Buscar', 'Rechercher', lang),
    'formsMisc.tiposServico.btnNew': L('Novo', 'New', 'Nuevo', 'Nouveau', lang),
    'formsMisc.tiposServico.colNome': L('Nome', 'Name', 'Nombre', 'Nom', lang),
    'formsMisc.tiposServico.btnEdit': L('Editar', 'Edit', 'Editar', 'Modifier', lang),
    'formsMisc.tiposServico.btnSave': L('Salvar', 'Save', 'Guardar', 'Enregistrer', lang),
    'formsMisc.tiposServico.btnCancel': L('Cancelar', 'Cancel', 'Cancelar', 'Annuler', lang),
    'formsMisc.tiposServico.btnDelete': L('Excluir', 'Delete', 'Eliminar', 'Supprimer', lang),
    'formsMisc.tiposServico.empty': L('Sem registros.', 'No records.', 'Sin registros.', 'Aucun enregistrement.', lang),
    'formsMisc.tiposServico.confirmInactivate': L('Tem certeza que deseja inativar o tipo de serviço #{{id}}?', 'Are you sure you want to deactivate service type #{{id}}?', '¿Confirma inactivar el tipo de servicio #{{id}}?', 'Confirmez-vous la désactivation du type de service #{{id}} ?', lang),
    'formsMisc.tiposServico.promptNewName': L('Nome do tipo de serviço:', 'Service type name:', 'Nombre del tipo de servicio:', 'Nom du type de service :', lang),
    'formsMisc.signature.title': L('Assinatura Digital', 'Digital signature', 'Firma digital', 'Signature numérique', lang),
    'formsMisc.signature.subtitle': L('Personalize sua assinatura', 'Customize your signature', 'Personalice su firma', 'Personnalisez votre signature', lang),
    'formsMisc.signature.labelName': L('Digite seu nome completo', 'Enter your full name', 'Escriba su nombre completo', 'Saisissez votre nom complet', lang),
    'formsMisc.signature.preview': L('Preview', 'Preview', 'Vista previa', 'Aperçu', lang),
    'formsMisc.signature.previewResponsible': L('Assinatura do Responsável', 'Authorized signature', 'Firma del responsable', 'Signature du responsable', lang),
    'formsMisc.signature.chooseStyle': L('Escolha o estilo', 'Choose a style', 'Elija el estilo', 'Choisissez le style', lang),
    'formsMisc.signature.emptyTitle': L('Digite seu nome', 'Enter your name', 'Escriba su nombre', 'Saisissez votre nom', lang),
    'formsMisc.signature.emptyDesc': L('Para visualizar os estilos de assinatura', 'To preview signature styles', 'Para ver los estilos de firma', 'Pour prévisualiser les styles de signature', lang),
    'formsMisc.signature.btnCancel': L('Cancelar', 'Cancel', 'Cancelar', 'Annuler', lang),
    'formsMisc.signature.btnConfirm': L('Confirmar', 'Confirm', 'Confirmar', 'Confirmer', lang),
    'formsMisc.signature.placeholderSignerName': L(
      'Ex: João Carlos da Silva',
      'E.g. John Carlos Smith',
      'Ej.: Juan Carlos Silva',
      'Ex. : Jean Carlos Dupont',
      lang
    ),
    'formsMisc.signature.style.elegant-script': L('Elegante', 'Elegant', 'Elegante', 'Élégant', lang),
    'formsMisc.signature.style.classic-cursive': L('Clássica', 'Classic', 'Clásica', 'Classique', lang),
    'formsMisc.signature.style.modern-signature': L('Moderna', 'Modern', 'Moderna', 'Moderne', lang),
    'formsMisc.signature.style.artistic-brush': L('Artística', 'Artistic', 'Artística', 'Artistique', lang),
    'formsMisc.signature.style.professional-serif': L('Profissional', 'Professional', 'Profesional', 'Professionnelle', lang),
    'formsMisc.signature.style.handwritten-casual': L('Manuscrita', 'Handwritten', 'Manuscrita', 'Manuscrite', lang),
    'formsMisc.signature.style.dancing-script': L('Dançante', 'Dancing', 'Danzante', 'Dansante', lang),
    'formsMisc.signature.style.sacramento': L('Sofisticada', 'Sophisticated', 'Sofisticada', 'Sophistiquée', lang),
    'formsMisc.signature.style.alex-brush': L('Clássica elegante', 'Classic elegant', 'Clásica elegante', 'Classique élégante', lang),
    'formsMisc.signature.style.bold-professional': L('Formal', 'Formal', 'Formal', 'Formelle', lang),
    'formsMisc.signature.style.italic-elegant': L('Itálica', 'Italic', 'Itálica', 'Italique', lang),
  };
}

export const FORMS_MISC_PT_BR = dict('pt');
export const FORMS_MISC_EN_US = dict('en');
export const FORMS_MISC_ES_ES = dict('es');
export const FORMS_MISC_FR_FR = dict('fr');
