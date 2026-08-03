import type { TranslationDictionary } from '../translation.service';

export type PropostaI18nLang = 'pt' | 'en' | 'es' | 'fr';

function L(lang: PropostaI18nLang, pt: string, en: string, es: string, fr: string): string {
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

/** Termos longos para prévia/impressão; índices 1..n alimentam `condGerais.${i}`. */
const PROPOSTA_COND_GERAIS_PT = [
  'Após o recebimento do item no setor RECEX, o acessório e/ou componente aeronáutico será submetido à inspeção de recebimento, teste de entrada para detectar falhas ocultas não relatadas pelo cliente, desmontagem, limpeza, inspeções visuais, dimensionais, END (Ensaio Não Destrutivo) quando aplicado, montagem, teste e calibração/ajuste e envio ao cliente.',
  'O serviço será executado conforme solicitação da etiqueta informativa, em conformidade com o manual do fabricante.',
  'A garantia do serviço será de 3 (três) meses ou 150 (cento e cinquenta) horas, segundo especificações da OM (Organização de Manutenção) Aero Suite.',
  'O transporte do material é de responsabilidade do cliente, salvo acordo em contrário.',
  'A AEROSUITE se reserva o direito de alterar os valores caso haja mudança significativa no escopo do serviço.',
  'A Aero Suite cobrará a título de handling (manuseio) uma taxa de 8% (oito por cento) do valor do price list sobre materiais fornecidos pelo cliente.',
  'Caso venha a ocorrer correção das discrepâncias encontradas durante a realização dos serviços, será emitida uma proposta complementar àquela já existente para sua apreciação e aprovação prévia.',
  'Os valores expressos em dólares norte-americanos deverão ser convertidos para a moeda nacional pelo câmbio oficial na data do faturamento e/ou condição de pagamento.',
  'O prazo de entrega começa a contar após o recebimento do material.',
  'Será elaborado um orçamento preliminar para aprovação do cliente. Após desmontagem e inspeção, o valor poderá mudar conforme resultado e performance desejada pelo fabricante.',
  'Em motores com programa de extensão ou abaixo da performance desejada, critérios adicionais podem aplicar. Pesquisas de pane podem gerar custos extra (viagem, hospedagem, alimentação e mão de obra), refletidos no valor final quando acordados.',
  'Os valores incluem tributos aplicáveis, calculados conforme legislação vigente.'
] as const;

const PROPOSTA_COND_GERAIS_EN = [
  'After receipt at RECEX, the accessory/aircraft component will undergo receiving inspection, incoming testing to uncover latent defects not reported by the customer, teardown, cleaning, visual and dimensional inspections, NDT where applicable, assembly, testing, calibration/adjustment, and shipment to the customer.',
  'Work will be carried out per the routing tag/information label and manufacturer manuals.',
  'Service warranty is 3 (three) months or 150 (one hundred and fifty) hours, per Aero Suite Aero Suite maintenance organisation specification.',
  'Transport is customer responsibility unless otherwise agreed.',
  'AEROSUITE may adjust pricing if scope changes materially.',
  'Aero Suite will charge an 8% (eight percent) handling fee on price-list value for customer-supplied material.',
  'If discrepancies are corrected during execution, a supplemental quotation will be submitted for approval before proceeding.',
  'Amounts quoted in US dollars convert to national currency using the official rate on invoicing/payment.',
  'Delivery time starts counting after material receipt.',
  'An initial quotation will be submitted. After teardown/inspection, pricing may vary to restore manufacturer intended performance.',
  'Engines under extension programmes or below target performance follow additional criteria. Field troubleshooting may incur extra agreed costs (travel, lodging, meals, labour).',
  'Quoted amounts include applicable taxes computed under current regulation.'
] as const;

const PROPOSTA_COND_GERAIS_ES = [
  'Tras la recepción en RECEX, el accesorio o componente aeronáutico será sometido a inspección de recepción, pruebas de entrada para detectar defectos latentes no reportados por el cliente, desmontaje, limpieza, inspecciones visuales y dimensionales, END cuando corresponda, montaje, pruebas, calibración/ajuste y envío al cliente.',
  'El trabajo se ejecutará según la etiqueta de ruta/información y los manuales del fabricante.',
  'La garantía del servicio es de 3 (tres) meses o 150 (ciento cincuenta) horas, según la especificación de la organización de mantenimiento Aero Suite.',
  'El transporte es responsabilidad del cliente salvo acuerdo distinto.',
  'AEROSUITE podrá ajustar los precios si el alcance cambia de forma sustancial.',
  'Aero Suite aplicará un 8% (ocho por ciento) de handling sobre el valor de lista de precios de material suministrado por el cliente.',
  'Si durante la ejecución se corrigen discrepancias, se presentará una cotización complementaria para aprobación previa.',
  'Los importes en dólares estadounidenses se convertirán a moneda nacional según el tipo oficial en facturación/pago.',
  'El plazo de entrega comienza tras la recepción del material.',
  'Se presentará una cotización inicial. Tras desmontaje/inspección, el precio puede variar para restablecer el rendimiento previsto por el fabricante.',
  'Los motores bajo programas de extensión o por debajo del rendimiento objetivo siguen criterios adicionales. La resolución de averías en campo puede generar costes adicionales acordados (viaje, alojamiento, manutención, mano de obra).',
  'Los importes incluyen tributos aplicables calculados según la normativa vigente.'
] as const;

const PROPOSTA_COND_GERAIS_FR = [
  'Après réception au secteur RECEX, l’accessoire ou le composant aéronautique subira une inspection à réception, des essais d’entrée pour déceler des défauts latents non signalés par le client, un démontage, un nettoyage, des inspections visuelles et dimensionnelles, du CND le cas échéant, un remontage, des essais, un calibrage/ajustement puis une expédition au client.',
  'Les travaux seront exécutés conformément à l’étiquette d’acheminement/d’information et aux manuels du constructeur.',
  'La garantie du service est de 3 (trois) mois ou 150 (cent cinquante) heures, selon la spécification de l’organisme de maintenance Aero Suite.',
  'Le transport est à la charge du client sauf accord contraire.',
  'AEROSUITE peut ajuster les prix en cas de changement substantiel du périmètre.',
  'Aero Suite appliquera des frais de manutention de 8% (huit pour cent) sur la valeur au barème de prix du matériel fourni par le client.',
  'Si des écarts sont corrigés pendant l’exécution, un devis complémentaire sera soumis pour approbation préalable.',
  'Les montants libellés en dollars américains sont convertis en monnaie nationale au cours officiel à la facturation / au paiement.',
  'Le délai de livraison court à partir de la réception du matériel.',
  'Un devis préliminaire sera soumis. Après démontage/inspection, le prix peut varier pour retrouver les performances prévues par le constructeur.',
  'Les moteurs sous programmes d’extension ou en dessous de la performance cible suivent des critères supplémentaires. Les dépannages sur site peuvent entraîner des coûts supplémentaires convenus (déplacement, hébergement, repas, main-d’œuvre).',
  'Les montants incluent les taxes applicables conformément à la réglementation en vigueur.'
] as const;

function condGeraisDict(lang: PropostaI18nLang): TranslationDictionary {
  const texts =
    lang === 'pt'
      ? PROPOSTA_COND_GERAIS_PT
      : lang === 'en'
        ? PROPOSTA_COND_GERAIS_EN
        : lang === 'es'
          ? PROPOSTA_COND_GERAIS_ES
          : PROPOSTA_COND_GERAIS_FR;
  const d: TranslationDictionary = {};
  texts.forEach((t, idx) => {
    d[`comercial.proposta.condGerais.${idx + 1}`] = t;
  });
  return d;
}

/** UI + condições gerais da proposta comercial (quatro línguas). */
export function buildComercialPropostaKeys(lang: PropostaI18nLang): TranslationDictionary {
  return {
    'comercial.proposta.header.new': L(
      lang,
      'Nova Proposta Comercial',
      'New commercial proposal',
      'Nueva propuesta comercial',
      'Nouvelle proposition commerciale'
    ),
    'comercial.proposta.header.edit': L(lang, 'Editar Proposta Comercial', 'Edit commercial proposal', 'Editar propuesta comercial', 'Modifier la proposition commerciale'),
    'comercial.proposta.headerSub.editPrefix': L(lang, 'Editando proposta', 'Editing proposal', 'Editando propuesta', 'Modification de la proposition'),
    'comercial.proposta.loading': L(lang, 'Carregando proposta…', 'Loading proposal…', 'Cargando propuesta…', 'Chargement de la proposition…'),
    'comercial.proposta.headerSub.new': L(
      lang,
      'Selecione um template ou preencha os dados manualmente',
      'Choose a template or fill data manually',
      'Elija una plantilla o complete los datos manualmente',
      'Choisissez un modèle ou saisissez les données manuellement'
    ),
    'comercial.proposta.defaults.prazoEntrega': L(
      lang,
      '30 dias úteis após recebimento do material',
      '30 business days after material receipt',
      '30 días hábiles tras recepción del material',
      '30 jours ouvrés après réception du matériel'
    ),
    'comercial.proposta.defaults.formaPagamento': L(
      lang,
      '50% na aprovação + 50% na entrega',
      '50% on approval + 50% on delivery',
      '50% en aprobación + 50% en entrega',
      '50% à l’approbation + 50% à la livraison'
    ),
    'comercial.proposta.btn.clone': L(lang, 'Clonar', 'Clone', 'Clonar', 'Dupliquer'),
    'comercial.proposta.tip.clone': L(lang, 'Criar uma cópia desta proposta', 'Create a copy of this proposal', 'Crear una copia de esta propuesta', 'Créer une copie de cette proposition'),
    'comercial.proposta.btn.voltar': L(lang, 'Voltar', 'Back', 'Volver', 'Retour'),
    'comercial.proposta.tpl.title': L(lang, 'Escolha como iniciar sua proposta', 'How do you want to start?', '¿Cómo desea empezar?', 'Comment souhaitez-vous commencer ?'),
    'comercial.proposta.tpl.sub': L(
      lang,
      'Selecione um template existente para agilizar o preenchimento ou comece do zero',
      'Use an existing template or start from scratch',
      'Use una plantilla existente o empiece desde cero',
      'Utilisez un modèle existant ou partez de zéro'
    ),
    'comercial.proposta.tpl.zeroTit': L(lang, 'Começar do Zero', 'Start from scratch', 'Empezar desde cero', 'Partir de zéro'),
    'comercial.proposta.tpl.zeroSub': L(lang, 'Preencha todos os dados manualmente', 'Enter all fields manually', 'Complete todos los campos manualmente', 'Renseignez tous les champs manuellement'),
    'comercial.proposta.tpl.popular': 'Popular',
    'comercial.proposta.tpl.usado': L(lang, '{{n}}× usado', 'Used {{n}}×', 'Usado {{n}}×', 'Utilisé {{n}}×'),
    'comercial.proposta.tpl.verMais': L(lang, 'Ver Mais Templates', 'More templates', 'Más plantillas', 'Plus de modèles'),
    'comercial.proposta.tpl.verMaisSub': L(
      lang,
      'Explore todos os {{total}} templates disponíveis',
      'Browse all {{total}} available templates',
      'Explore las {{total}} plantillas disponibles',
      'Parcourez les {{total}} modèles disponibles'
    ),
    'comercial.proposta.banner.trocar': L(lang, 'Trocar Template', 'Change template', 'Cambiar plantilla', 'Changer de modèle'),
    'comercial.proposta.banner.salvarTpl': L(lang, 'Salvar como Novo Template', 'Save as new template', 'Guardar como nueva plantilla', 'Enregistrer comme nouveau modèle'),
    'comercial.proposta.banner.salvarTplTip': L(
      lang,
      'Salvar as alterações como um novo template',
      'Save your edits as a new reusable template',
      'Guarde los cambios como una nueva plantilla reutilizable',
      'Enregistrez vos modifications comme un nouveau modèle réutilisable'
    ),
    'comercial.proposta.banner.lbl': 'Template:',
    'comercial.proposta.tab.produtos': L(lang, 'Produtos', 'Products', 'Productos', 'Produits'),
    'comercial.proposta.currency.lbl': L(lang, 'Moeda:', 'Currency:', 'Moneda:', 'Devise :'),
    'comercial.proposta.sec.itensTit': L(lang, 'Produtos da Proposta', 'Proposal line items', 'Líneas de la propuesta', 'Lignes de la proposition'),
    'comercial.proposta.btn.addProd': L(lang, 'Adicionar Produtos', 'Add products', 'Añadir productos', 'Ajouter des produits'),
    'comercial.proposta.ph.prodPn': L(lang, 'P/N do produto', 'Product P/N', 'P/N del producto', 'P/N du produit'),
    'comercial.proposta.ph.prodSn': L(lang, 'S/N do produto', 'Product S/N', 'S/N del producto', 'S/N du produit'),
    'comercial.proposta.tip.removeProd': L(lang, 'Remover produto', 'Remove product', 'Quitar producto', 'Retirer le produit'),
    'comercial.proposta.discount.percent': L(lang, 'Percentual', 'Percentage', 'Porcentaje', 'Pourcentage'),
    'comercial.proposta.discount.fixed': L(lang, 'Valor Fixo', 'Fixed amount', 'Importe fijo', 'Montant fixe'),
    'comercial.proposta.discount.ph': '0',
    'comercial.proposta.tip.cotacao': L(lang, 'Atualizar cotação', 'Refresh quote', 'Actualizar cotización', 'Actualiser le taux'),
    'comercial.proposta.ph.moedaPlaceholder': L(lang, 'R$ 0,00', '$0.00', '$0.00', '0,00 €'),
    'comercial.proposta.manual.phPn': L(lang, 'Ex: Lycoming IO-360-L2A', 'E.g. Lycoming IO-360-L2A', 'Ej.: Lycoming IO-360-L2A', 'Ex. : Lycoming IO-360-L2A'),
    'comercial.proposta.manual.phPrefixo': L(lang, 'Ex: PR-ABC', 'E.g. PR-ABC', 'Ej.: EC-XYZ', 'Ex. : F-GABC'),
    'comercial.proposta.manual.phTipoServico': L(lang, 'Selecione o tipo de serviço', 'Select service type', 'Seleccione el tipo de servicio', 'Sélectionnez le type de service'),
    'comercial.proposta.manual.phDescServico': L(
      lang,
      'Descreva detalhadamente o serviço a ser executado...',
      'Describe the service in detail…',
      'Describa el servicio con detalle…',
      'Décrivez le service en détail…'
    ),
    'comercial.proposta.btn.salvarTemplate': L(lang, 'Salvar como Template', 'Save as template', 'Guardar como plantilla', 'Enregistrer comme modèle'),
    'comercial.proposta.tip.salvarTemplateManual': L(
      lang,
      'Salvar esta configuração como template para uso futuro',
      'Save this setup as a reusable template',
      'Guardar esta configuración como plantilla reutilizable',
      'Enregistrer cette configuration comme modèle réutilisable'
    ),
    'comercial.proposta.btn.proxCliente': L(lang, 'Próximo: Cliente', 'Next: Customer', 'Siguiente: Cliente', 'Suivant : Client'),
    'comercial.proposta.cliente.buscaPh': L(lang, 'Digite o nome do cliente para buscar...', 'Type customer name to search…', 'Escriba el nombre del cliente…', 'Saisissez le nom du client…'),
    'comercial.proposta.cliente.btnSalvar': L(lang, 'Salvar Cliente', 'Save customer', 'Guardar cliente', 'Enregistrer le client'),
    'comercial.proposta.cliente.tipSalvar': L(lang, 'Salvar dados do cliente para uso futuro', 'Save customer for future proposals', 'Guardar datos del cliente para el futuro', 'Enregistrer le client pour les propositions futures'),
    'comercial.proposta.cliente.phNome': L(lang, 'Nome completo ou razão social', 'Full name or legal name', 'Nombre completo o razón social', 'Nom complet ou raison sociale'),
    'comercial.proposta.cliente.phCnpj': '00.000.000/0000-00',
    'comercial.proposta.cliente.phContatoNome': L(lang, 'Nome do contato', 'Contact person', 'Persona de contacto', 'Personne de contact'),
    'comercial.proposta.cliente.phEmail': 'email@company.com',
    'comercial.proposta.cliente.phTel': L(lang, '(00) 00000-0000', '+1…', '+34…', '+33…'),
    'comercial.proposta.cliente.phEndereco': L(lang, 'Rua, número, complemento', 'Street, number, complement', 'Calle, número, complemento', 'Rue, numéro, complément'),
    'comercial.proposta.cliente.phCidade': L(lang, 'Cidade', 'City', 'Ciudad', 'Ville'),
    'comercial.proposta.cliente.phUfPh': L(lang, 'Selecione', 'Select', 'Seleccione', 'Sélectionnez'),
    'comercial.proposta.cliente.phCep': '00000-000',
    'comercial.proposta.cliente.obsPh': L(lang, 'Informações adicionais, preferências, histórico de negociações...', 'Additional information…', 'Información adicional…', 'Informations complémentaires…'),
    'comercial.proposta.btn.voltarTab': L(lang, 'Voltar', 'Back', 'Volver', 'Retour'),
    'comercial.proposta.btn.proxProposta': L(lang, 'Próximo: Proposta', 'Next: Proposal', 'Siguiente: Propuesta', 'Suivant : Proposition'),
    'comercial.proposta.cond.phPrazo': L(lang, 'Ex: 30 dias úteis', 'E.g.: 30 business days', 'Ej.: 30 días hábiles', 'Ex. : 30 jours ouvrés'),
    'comercial.proposta.cond.phPgto': L(lang, 'Ex: 50% entrada + 50% entrega', 'E.g.: 50% upfront + 50% on delivery', 'Ej.: 50% anticipo + 50% a la entrega', 'Ex. : 50 % à la commande + 50 % à la livraison'),
    'comercial.proposta.cond.notePh': L(lang, 'Opcional. Só aparece na proposta se houver texto.', 'Optional note…', 'Opcional. Solo se muestra si hay texto.', 'Facultatif. N’apparaît que si du texte est saisi.'),
    'comercial.proposta.btn.assinar': L(lang, 'Assinar', 'Sign', 'Firmar', 'Signer'),
    'comercial.proposta.tip.assinar': L(lang, 'Adicionar assinatura digital', 'Add digital signature', 'Añadir firma digital', 'Ajouter une signature numérique'),
    'comercial.proposta.btn.rascunho': L(lang, 'Salvar Rascunho', 'Save draft', 'Guardar borrador', 'Enregistrer le brouillon'),
    'comercial.proposta.btn.print': L(lang, 'Imprimir / PDF', 'Print / PDF', 'Imprimir / PDF', 'Imprimer / PDF'),
    'comercial.proposta.btn.enviar': L(lang, 'Enviar Proposta', 'Send proposal', 'Enviar propuesta', 'Envoyer la proposition'),
    'comercial.proposta.btn.whatsapp': L(lang, 'WhatsApp', 'WhatsApp', 'WhatsApp', 'WhatsApp'),
    'comercial.proposta.toast.whatsappSentSummary': L(lang, 'Proposta enviada', 'Proposal sent', 'Propuesta enviada', 'Proposition envoyée'),
    'comercial.proposta.toast.whatsappSentDetail': L(lang, 'Mensagem enviada via WhatsApp.', 'Message sent via WhatsApp.', 'Mensaje enviado por WhatsApp.', 'Message envoyé via WhatsApp.'),
    'comercial.proposta.toast.whatsappLinkSummary': L(lang, 'Abrir WhatsApp', 'Open WhatsApp', 'Abrir WhatsApp', 'Ouvrir WhatsApp'),
    'comercial.proposta.toast.whatsappLinkDetail': L(lang, 'API indisponível — abra o link para enviar manualmente.', 'API unavailable — open the link to send manually.', 'API no disponible — abra el enlace para enviar manualmente.', 'API indisponible — ouvrez le lien pour envoyer manuellement.'),
    'comercial.proposta.toast.whatsappLinkDetailPdf': L(
      lang,
      'O PDF foi transferido para o seu computador. No WhatsApp Web, anexe o arquivo (ícone de clipe) e depois envie a mensagem.',
      'The PDF was downloaded to your computer. In WhatsApp Web, attach the file (paperclip icon) and then send the message.',
      'El PDF se descargó en su equipo. En WhatsApp Web, adjunte el archivo (icono de clip) y luego envíe el mensaje.',
      'Le PDF a été téléchargé sur votre ordinateur. Dans WhatsApp Web, joignez le fichier (icône trombone) puis envoyez le message.'
    ),
    'comercial.proposta.whatsapp.notConfiguredHeader': L(
      lang,
      'Anexo automático indisponível',
      'Automatic attachment unavailable',
      'Adjunto automático no disponible',
      'Pièce jointe automatique indisponible'
    ),
    'comercial.proposta.whatsapp.notConfiguredMsg': L(
      lang,
      'O WhatsApp Web não permite anexar arquivos pelo navegador. Para enviar o PDF automaticamente no WhatsApp, configure a API (Evolution API) no servidor (variáveis WHATSAPP_API_ENABLED, WHATSAPP_API_URL e WHATSAPP_API_TOKEN). Deseja continuar no modo manual (transferir PDF + abrir WhatsApp para anexar à mão)?',
      'WhatsApp Web cannot attach files from the browser. To send the PDF automatically, configure the API (Evolution API) on the server (WHATSAPP_API_ENABLED, WHATSAPP_API_URL, WHATSAPP_API_TOKEN). Continue in manual mode (download PDF + open WhatsApp to attach manually)?',
      'WhatsApp Web no permite adjuntar archivos desde el navegador. Para enviar el PDF automáticamente, configure la API (Evolution API) en el servidor (WHATSAPP_API_ENABLED, WHATSAPP_API_URL, WHATSAPP_API_TOKEN). ¿Continuar en modo manual (descargar PDF + abrir WhatsApp para adjuntar a mano)?',
      'WhatsApp Web ne permet pas de joindre des fichiers depuis le navigateur. Pour envoyer le PDF automatiquement, configurez l’API (Evolution API) sur le serveur (WHATSAPP_API_ENABLED, WHATSAPP_API_URL, WHATSAPP_API_TOKEN). Continuer en mode manuel (télécharger le PDF + ouvrir WhatsApp pour joindre à la main) ?'
    ),
    'comercial.proposta.whatsapp.notConfiguredContinue': L(lang, 'Continuar manual', 'Continue manually', 'Continuar manual', 'Continuer manuellement'),
    'comercial.proposta.whatsapp.manualConfirmHeader': L(lang, 'Envio manual pelo WhatsApp', 'Manual WhatsApp send', 'Envío manual por WhatsApp', 'Envoi manuel WhatsApp'),
    'comercial.proposta.whatsapp.manualConfirmMsg': L(
      lang,
      'Não foi possível enviar o PDF pelo servidor ({{motivo}}). O sistema pode transferir o PDF para o seu computador e abrir o WhatsApp Web — você precisa anexar o arquivo manualmente (ícone de clipe). Continuar?',
      'The server could not send the PDF ({{motivo}}). The app can download the PDF and open WhatsApp Web — you must attach the file manually (paperclip icon). Continue?',
      'No se pudo enviar el PDF desde el servidor ({{motivo}}). El sistema puede descargar el PDF y abrir WhatsApp Web — debe adjuntar el archivo manualmente (icono de clip). ¿Continuar?',
      'Impossible d’envoyer le PDF depuis le serveur ({{motivo}}). L’application peut télécharger le PDF et ouvrir WhatsApp Web — vous devez joindre le fichier manuellement (icône trombone). Continuer ?'
    ),
    'comercial.proposta.whatsapp.manualConfirmAccept': L(lang, 'Transferir PDF e abrir WhatsApp', 'Download PDF and open WhatsApp', 'Descargar PDF y abrir WhatsApp', 'Télécharger le PDF et ouvrir WhatsApp'),
    'comercial.proposta.toast.whatsappNoPhone': L(lang, 'Informe o telefone do cliente.', 'Enter the customer phone number.', 'Indique el teléfono del cliente.', 'Indiquez le téléphone du client.'),
    'comercial.proposta.toast.whatsappErrorSummary': L(lang, 'Falha no WhatsApp', 'WhatsApp failed', 'Error en WhatsApp', 'Échec WhatsApp'),
    'comercial.proposta.contato.dialogTitle': L(lang, 'Informações de Contato', 'Contact information', 'Datos de contacto', 'Coordonnées'),
    'comercial.proposta.contato.phNome': L(lang, 'Ex: João Silva', 'John Doe', 'Ej.: Juan Pérez', 'Ex. : Jean Dupont'),
    'comercial.proposta.contato.phTel': L(lang, 'Ex: (11) 99999-9999', '+1 …', 'Ej.: +34 600 000 000', 'Ex. : +33 6 00 00 00 00'),
    'comercial.proposta.contato.phEmail': L(lang, 'Ex: contato@aerosuite.app', 'contact@company.com', 'contacto@empresa.com', 'contact@entreprise.com'),
    'comercial.proposta.dialog.btnCancel': L(lang, 'Cancelar', 'Cancel', 'Cancelar', 'Annuler'),
    'comercial.proposta.dialog.btnContinuar': L(lang, 'Continuar', 'Continue', 'Continuar', 'Continuer'),
    'comercial.proposta.email.dialogTitle': L(lang, 'Enviar Proposta por E-mail', 'Send proposal by email', 'Enviar propuesta por correo', 'Envoyer la proposition par e-mail'),
    'comercial.proposta.email.cancel': L(lang, 'Cancelar', 'Cancel', 'Cancelar', 'Annuler'),
    'comercial.proposta.email.send': L(lang, 'Enviar E-mail', 'Send email', 'Enviar correo', 'Envoyer l’e-mail'),
    'comercial.proposta.success.voltarLista': L(lang, 'Voltar para Lista', 'Back to list', 'Volver al listado', 'Retour à la liste'),
    'comercial.proposta.success.contEdit': L(lang, 'Continuar Editando', 'Keep editing', 'Seguir editando', 'Continuer la modification'),
    'comercial.proposta.gallery.title': L(lang, 'Galeria de Templates', 'Template gallery', 'Galería de plantillas', 'Galerie de modèles'),
    'comercial.proposta.gallery.searchPh': L(lang, 'Buscar templates...', 'Search templates…', 'Buscar plantillas…', 'Rechercher des modèles…'),
    'comercial.proposta.gallery.catPh': L(lang, 'Todas as categorias', 'All categories', 'Todas las categorías', 'Toutes les catégories'),
    'comercial.proposta.tplDialog.title': L(lang, 'Salvar como Template', 'Save as template', 'Guardar como plantilla', 'Enregistrer comme modèle'),
    'comercial.proposta.tplDialog.nomePh': L(lang, 'Ex: Overhaul FCU Lycoming', 'E.g. Overhaul FCU Lycoming', 'Ej.: Overhaul FCU Lycoming', 'Ex. : Overhaul FCU Lycoming'),
    'comercial.proposta.tplDialog.descPh': L(lang, 'Descrição breve do template...', 'Short template description…', 'Breve descripción de la plantilla…', 'Brève description du modèle…'),
    'comercial.proposta.tplDialog.catPh': L(lang, 'Selecione ou digite uma nova categoria', 'Pick or enter category', 'Elija o escriba una categoría', 'Choisissez ou saisissez une catégorie'),
    'comercial.proposta.tplDialog.cancel': L(lang, 'Cancelar', 'Cancel', 'Cancelar', 'Annuler'),
    'comercial.proposta.tplDialog.save': L(lang, 'Salvar Template', 'Save template', 'Guardar plantilla', 'Enregistrer le modèle'),

    'comercial.proposta.tab.cliente': L(lang, 'Cliente', 'Customer', 'Cliente', 'Client'),
    'comercial.proposta.tab.portal': L(lang, 'Portal', 'Portal', 'Portal', 'Portail'),
    'comercial.proposta.tab.proposta': L(lang, 'Proposta', 'Proposal', 'Propuesta', 'Proposition'),
    'comercial.proposta.portal.intro': L(
      lang,
      'Aditivos e anexos visíveis no portal do cliente. A oficina pode propor aditivos em propostas aprovadas; o cliente aprova ou rejeita no portal.',
      'Addenda and attachments visible on the customer portal. The shop can propose addenda on approved proposals; the customer approves or rejects in the portal.',
      'Adendas y anexos visibles en el portal del cliente. El taller puede proponer adendas en propuestas aprobadas; el cliente aprueba o rechaza en el portal.',
      'Avenants et pièces jointes visibles sur le portail client. L’atelier peut proposer des avenants sur les propositions approuvées ; le client approuve ou rejette sur le portail.'
    ),
    'comercial.proposta.portal.secAditivos': L(lang, 'Aditivos', 'Addenda', 'Adendas', 'Avenants'),
    'comercial.proposta.portal.secPublicacao': L(lang, 'Publicação no portal', 'Portal publication', 'Publicación en el portal', 'Publication sur le portail'),
    'comercial.proposta.portal.notVisible': L(lang, 'Ainda não visível no portal', 'Not yet visible on portal', 'Aún no visible en el portal', 'Pas encore visible sur le portail'),
    'comercial.proposta.portal.secAnexos': L(lang, 'Anexos', 'Attachments', 'Anexos', 'Pièces jointes'),
    'comercial.proposta.portal.emptyAditivos': L(lang, 'Nenhum aditivo registrado.', 'No addenda yet.', 'Ninguna adenda registrada.', 'Aucun avenant enregistré.'),
    'comercial.proposta.portal.emptyAnexos': L(lang, 'Nenhum anexo enviado pelo cliente.', 'No attachments from the customer.', 'Ningún anexo enviado por el cliente.', 'Aucune pièce jointe envoyée par le client.'),
    'comercial.proposta.portal.lblOrigem': L(lang, 'Origem', 'Source', 'Origen', 'Origine'),
    'comercial.proposta.portal.origemCliente': L(lang, 'Cliente (portal)', 'Customer (portal)', 'Cliente (portal)', 'Client (portail)'),
    'comercial.proposta.portal.origemOficina': L(lang, 'Oficina', 'Shop', 'Taller', 'Atelier'),
    'comercial.proposta.portal.formTitulo': L(lang, 'Novo aditivo (oficina)', 'New addendum (shop)', 'Nueva adenda (taller)', 'Nouvel avenant (atelier)'),
    'comercial.proposta.portal.lblDescricao': L(lang, 'Descrição', 'Description', 'Descripción', 'Description'),
    'comercial.proposta.portal.lblValor': L(lang, 'Valor (opcional)', 'Amount (optional)', 'Valor (opcional)', 'Montant (facultatif)'),
    'comercial.proposta.portal.phDescricao': L(lang, 'Descreva o aditivo...', 'Describe the addendum…', 'Describa la adenda…', 'Décrivez l’avenant…'),
    'comercial.proposta.portal.btnEnviarAditivo': L(lang, 'Registrar aditivo', 'Submit addendum', 'Registrar adenda', 'Enregistrer l’avenant'),
    'comercial.proposta.portal.btnDownload': L(lang, 'Baixar', 'Download', 'Descargar', 'Télécharger'),
    'comercial.proposta.portal.hintAprovada': L(
      lang,
      'Aditivos da oficina só podem ser criados com a proposta aprovada.',
      'Shop addenda can only be created when the proposal is approved.',
      'Las adendas del taller solo se crean con la propuesta aprobada.',
      'Les avenants atelier ne peuvent être créés que si la proposition est approuvée.'
    ),
    'comercial.proposta.portal.toast.aditivoOk': L(lang, 'Aditivo registrado.', 'Addendum saved.', 'Adenda registrada.', 'Avenant enregistré.'),
    'comercial.proposta.portal.toast.aditivoErr': L(lang, 'Não foi possível registrar o aditivo.', 'Could not save the addendum.', 'No se pudo registrar la adenda.', 'Impossible d’enregistrer l’avenant.'),
    'comercial.proposta.portal.toast.needDescricao': L(lang, 'Informe a descrição do aditivo.', 'Enter the addendum description.', 'Indique la descripción de la adenda.', 'Saisissez la description de l’avenant.'),
    'comercial.proposta.portal.toast.needSalvar': L(lang, 'Salve a proposta antes de usar o portal.', 'Save the proposal before using the portal.', 'Guarde la propuesta antes de usar el portal.', 'Enregistrez la proposition avant d’utiliser le portail.'),
    'comercial.proposta.currency.usdLbl': 'USD ($)',
    'comercial.proposta.currency.brlLbl': 'BRL (R$)',
    'comercial.proposta.currency.eurLbl': 'EUR (€)',
    'comercial.proposta.lbl.pn': 'P/N:',
    'comercial.proposta.lbl.sn': 'S/N:',
    'comercial.proposta.lbl.qtd': L(lang, 'Qtd:', 'Qty:', 'Cant.:', 'Qté :'),
    'comercial.proposta.lbl.valorUnitCur': L(
      lang,
      'Valor unitário ({{ui}}, negociado em {{prop}}):',
      'Unit price ({{ui}}, proposal currency {{prop}}):',
      'Precio unitario ({{ui}}, negociado en {{prop}}):',
      'Prix unitaire ({{ui}}, négocié en {{prop}}) :'
    ),
    'comercial.proposta.lbl.totalCur': L(lang, 'Total da linha ({{ui}}):', 'Line total ({{ui}}):', 'Total de la línea ({{ui}}):', 'Total ligne ({{ui}}) :'),
    'comercial.proposta.money.sourcesTit': L(
      lang,
      'Moeda conforme idioma — fontes de câmbio:',
      'Rates by UI language — sources:',
      'Tipo de cambio según idioma — fuentes:',
      'Taux selon la langue de l’interface — sources :'
    ),
    'comercial.proposta.money.taxaPropostaVsFontes': L(
      lang,
      'A taxa exibida acima refere-se ao câmbio da proposta; as fontes abaixo são usadas apenas para converter frete, mão de obra e totais na moeda da interface (BCB / Frankfurter).',
      'The rate shown above is the proposal FX; the sources below are only used to convert freight, labour and totals into the UI currency (BCB / Frankfurter).',
      'El tipo mostrado arriba es el de la propuesta; las fuentes de abajo solo sirven para convertir flete, mano de obra y totales a la moneda de la interfaz (BCB / Frankfurter).',
      'Le taux affiché ci-dessus est celui de la proposition ; les sources ci-dessous servent uniquement à convertir le fret, la main-d’œuvre et les totaux dans la devise de l’interface (BCB / Frankfurter).'
    ),
    'comercial.proposta.lbl.totalGeralStrong': L(lang, 'TOTAL GERAL ({{cur}}):', 'GRAND TOTAL ({{cur}}):', 'TOTAL GENERAL ({{cur}}):', 'TOTAL GÉNÉRAL ({{cur}}) :'),
    'comercial.proposta.a11y.totalAnnounce': L(
      lang,
      'Total geral da proposta em {{cur}}: {{total}}',
      'Proposal grand total in {{cur}}: {{total}}',
      'Total general de la propuesta en {{cur}}: {{total}}',
      'Total général de la proposition en {{cur}} : {{total}}'
    ),

    'comercial.proposta.totals.subtotalProd': L(lang, 'Subtotal Produtos ({{cur}}):', 'Products subtotal ({{cur}}):', 'Subtotal productos ({{cur}}):', 'Sous-total produits ({{cur}}) :'),
    'comercial.proposta.totals.desconto': L(lang, 'Desconto:', 'Discount:', 'Descuento:', 'Remise :'),
    'comercial.proposta.totals.descontoPct': L(lang, 'Desconto ({{pct}}%):', 'Discount ({{pct}}%):', 'Descuento ({{pct}}%):', 'Remise ({{pct}} %) :'),
    'comercial.proposta.totals.subtotalAposDesc': L(lang, 'Subtotal c/ Desconto ({{cur}}):', 'Subtotal after discount ({{cur}}):', 'Subtotal c/ descuento ({{cur}}):', 'Sous-total après remise ({{cur}}) :'),
    'comercial.proposta.totals.freteCur': L(lang, 'Frete ({{cur}}):', 'Freight ({{cur}}):', 'Flete ({{cur}}):', 'Fret ({{cur}}) :'),
    'comercial.proposta.totals.moCur': L(lang, 'Mão de Obra ({{cur}}):', 'Labour ({{cur}}):', 'Mano de obra ({{cur}}):', 'Main-d’œuvre ({{cur}}) :'),

    'comercial.proposta.costs.secTitulo': L(lang, 'Custos Adicionais (R$)', 'Additional costs (BRL)', 'Costes adicionales (BRL)', 'Coûts supplémentaires (BRL)'),
    'comercial.proposta.costs.freteLbl': 'Frete (R$):',
    'comercial.proposta.costs.moLbl': L(lang, 'Mão de Obra (R$):', 'Labour (BRL):', 'Mano de obra (R$):', 'Main-d’œuvre (BRL) :'),
    'comercial.proposta.costs.taxaTxt': L(lang, 'Taxa utilizada:', 'Rate used:', 'Tipo utilizado:', 'Taux utilisé :'),
    'comercial.proposta.costs.taxaFmt': '{{rate}} BRL/USD',
    'comercial.proposta.costs.taxaLinha': L(lang, 'Taxa utilizada: {{rate}} BRL/USD', 'Rate used: {{rate}} BRL/USD', 'Tipo utilizado: {{rate}} BRL/USD', 'Taux utilisé : {{rate}} BRL/USD'),
    'comercial.proposta.costs.taxaProposta': L(
      lang,
      'Taxa da proposta (USD→BRL): {{rate}} — {{source}}',
      'Proposal rate (USD→BRL): {{rate}} — {{source}}',
      'Tipo de la propuesta (USD→BRL): {{rate}} — {{source}}',
      'Taux de la proposition (USD→BRL) : {{rate}} — {{source}}'
    ),

    'comercial.proposta.discount.remover': L(lang, 'Remover Desconto', 'Remove discount', 'Quitar descuento', 'Supprimer la remise'),
    'comercial.proposta.discount.aplicar': L(lang, 'Aplicar Desconto', 'Apply discount', 'Aplicar descuento', 'Appliquer la remise'),
    'comercial.proposta.discount.lblPercentTit': L(lang, 'Percentual de Desconto', 'Discount percentage', 'Porcentaje de descuento', 'Pourcentage de remise'),
    'comercial.proposta.discount.lblValorTit': L(lang, 'Valor do Desconto', 'Discount amount', 'Importe del descuento', 'Montant de la remise'),
    'comercial.proposta.discount.savings': L(
      lang,
      'Economia de {{amount}} para o cliente',
      'Saving of {{amount}} for the customer',
      'Ahorro de {{amount}} para el cliente',
      'Économie de {{amount}} pour le client'
    ),

    'comercial.proposta.emptyProd.titulo': L(lang, 'Nenhum produto adicionado', 'No products added', 'Ningún producto añadido', 'Aucun produit ajouté'),
    'comercial.proposta.emptyProd.lead': L(
      lang,
      'Clique em «Adicionar Produtos» para selecionar os produtos desta proposta.',
      'Click «Add products» to choose items for this proposal.',
      'Haga clic en «Añadir productos» para elegir los ítems de esta propuesta.',
      'Cliquez sur « Ajouter des produits » pour choisir les articles de cette proposition.'
    ),

    'comercial.proposta.sec.aplicacao': L(lang, 'Aplicação e Serviço', 'Application & service', 'Aplicación y servicio', 'Application et service'),
    'comercial.proposta.lbl.aplicacaoMotor': L(lang, 'Aplicação Motor', 'Engine application', 'Aplicación motor', 'Application moteur'),
    'comercial.proposta.lbl.aeronavePrefixo': L(lang, 'Aeronave Prefixo', 'Aircraft registration', 'Matrícula aeronave', 'Immatriculation aéronef'),
    'comercial.proposta.lbl.tipoServico': L(lang, 'Tipo de Serviço', 'Service type', 'Tipo de servicio', 'Type de service'),
    'comercial.proposta.lbl.servicoExecutadoTit': L(lang, 'Serviço a Ser Executado', 'Service to perform', 'Servicio a realizar', 'Service à réaliser'),

    'comercial.proposta.cliente.secBusca': L(lang, 'Buscar Cliente Cadastrado', 'Find saved customer', 'Buscar cliente registrado', 'Rechercher un client enregistré'),
    'comercial.proposta.cliente.buscaHint': L(
      lang,
      'Digite o nome do cliente para buscar dados salvos ou preencha manualmente abaixo.',
      'Type the customer name to load saved details, or fill in manually below.',
      'Escriba el nombre para cargar datos guardados o rellene manualmente abajo.',
      'Saisissez le nom du client pour charger les données ou complétez manuellement ci-dessous.'
    ),
    'comercial.proposta.cliente.emptyAc': L(lang, 'Nenhum cliente encontrado', 'No customer found', 'Ningún cliente encontrado', 'Aucun client trouvé'),
    'comercial.proposta.cliente.badgeSalvo': L(lang, 'Cliente cadastrado', 'Saved customer', 'Cliente registrado', 'Client enregistré'),
    'comercial.proposta.cliente.secDados': L(lang, 'Dados do Cliente', 'Customer details', 'Datos del cliente', 'Données client'),
    'comercial.proposta.cliente.lblNomeRazao': L(lang, 'Nome / Razão Social *', 'Name / Legal name *', 'Nombre / Razón social *', 'Nom / Raison sociale *'),
    'comercial.proposta.cliente.lblCnpjCpf': 'CNPJ / CPF',
    'comercial.proposta.cliente.lblPessoaContato': L(lang, 'Pessoa de Contato', 'Contact person', 'Persona de contacto', 'Personne de contact'),
    'comercial.proposta.cliente.lblEmailFld': 'E-mail',
    'comercial.proposta.cliente.lblTelFld': L(lang, 'Telefone', 'Phone', 'Teléfono', 'Téléphone'),
    'comercial.proposta.cliente.secEndereco': L(lang, 'Endereço', 'Address', 'Dirección', 'Adresse'),
    'comercial.proposta.cliente.lblEnderecoFld': L(lang, 'Endereço', 'Street address', 'Dirección', 'Adresse'),
    'comercial.proposta.cliente.lblCidadeFld': L(lang, 'Cidade', 'City', 'Ciudad', 'Ville'),
    'comercial.proposta.cliente.lblEstadoFld': L(lang, 'Estado', 'State', 'Provincia/Estado', 'Région'),
    'comercial.proposta.cliente.lblCepFld': 'CEP',
    'comercial.proposta.cliente.secObsTit': L(lang, 'Observações', 'Notes', 'Observaciones', 'Remarques'),
    'comercial.proposta.cliente.lblObsFld': L(lang, 'Observações sobre o cliente', 'Customer notes', 'Observaciones sobre el cliente', 'Notes sur le client'),
    'comercial.proposta.cliente.counter': L(lang, '{{n}} / 5000 caracteres', '{{n}} / 5000 characters', '{{n}} / 5000 caracteres', '{{n}} / 5000 caractères'),

    'comercial.proposta.preview.docTitulo': L(lang, 'PROPOSTA COMERCIAL', 'COMMERCIAL PROPOSAL', 'PROPUESTA COMERCIAL', 'PROPOSITION COMMERCIALE'),
    'comercial.proposta.preview.empresaTitulo': L(lang, 'AERO SUITE', 'AERO SUITE', 'AERO SUITE', 'AERO SUITE'),
    'comercial.proposta.preview.numPlaceholder': 'PROP-XXXX-XXXX',
    'comercial.proposta.preview.prefixoData': L(lang, 'Data:', 'Date:', 'Fecha:', 'Date :'),
    'comercial.proposta.preview.altLogo': 'Aero Suite',

    'comercial.proposta.preview.secCliente': L(lang, 'CLIENTE', 'CUSTOMER', 'CLIENTE', 'CLIENT'),
    'comercial.proposta.preview.nomeFallback': L(lang, 'Nome do Cliente', 'Customer name', 'Nombre del cliente', 'Nom du client'),
    'comercial.proposta.preview.lblDocumento': 'CNPJ/CPF:',
    'comercial.proposta.preview.lblContato': L(lang, 'Contato:', 'Contact:', 'Contacto:', 'Contact :'),
    'comercial.proposta.preview.lblMail': 'E-mail:',
    'comercial.proposta.preview.lblFone': L(lang, 'Telefone:', 'Phone:', 'Teléfono:', 'Téléphone :'),
    'comercial.proposta.preview.obsTit': L(lang, 'Observações:', 'Notes:', 'Observaciones:', 'Remarques :'),

    'comercial.proposta.preview.secProdutos': L(lang, 'PRODUTOS / SERVIÇOS', 'PRODUCTS / SERVICES', 'PRODUCTOS / SERVICIOS', 'PRODUITS / SERVICES'),
    'comercial.proposta.preview.colHash': '#',
    'comercial.proposta.preview.colDesc': L(lang, 'Descrição', 'Description', 'Descripción', 'Description'),
    'comercial.proposta.preview.colPn': 'P/N',
    'comercial.proposta.preview.colSn': 'S/N',
    'comercial.proposta.preview.colQtd': L(lang, 'Qtd', 'Qty', 'Cant', 'Qté'),
    'comercial.proposta.preview.colValorUnit': L(lang, 'Valor Unit.', 'Unit price', 'Precio unit.', 'Prix unit.'),
    'comercial.proposta.preview.colTotal': L(lang, 'Total', 'Total', 'Total', 'Total'),
    'comercial.proposta.preview.colValor': L(lang, 'Valor', 'Amount', 'Importe', 'Montant'),
    'comercial.proposta.preview.nomeProdFallback': L(lang, 'Nome do Produto', 'Product name', 'Nombre del producto', 'Nom du produit'),

    'comercial.proposta.preview.detalheAprMotor': L(lang, 'Aplicação Motor:', 'Engine application:', 'Aplicación motor:', 'Application moteur :'),
    'comercial.proposta.preview.detalheAprAero': L(lang, 'Aeronave:', 'Aircraft:', 'Aeronave:', 'Aéronef :'),
    'comercial.proposta.preview.detalheManual': L(lang, 'Manual:', 'Manual:', 'Manual:', 'Manuel :'),
    'comercial.proposta.preview.servicoTitulo': L(lang, 'Serviço a ser executado:', 'Service to be performed:', 'Servicio a realizar:', 'Service à réaliser :'),
    'comercial.proposta.preview.secCondCom': L(lang, 'CONDIÇÕES COMERCIAIS', 'COMMERCIAL TERMS', 'CONDICIONES COMERCIALES', 'CONDITIONS COMMERCIALES'),
    'comercial.proposta.preview.condPrazo': L(lang, 'Prazo de Entrega:', 'Lead time:', 'Plazo de entrega:', 'Délai de livraison :'),
    'comercial.proposta.preview.condPagto': L(lang, 'Forma de Pagamento:', 'Payment terms:', 'Forma de pago:', 'Modalités de paiement :'),
    'comercial.proposta.preview.condValidade': L(lang, 'Validade da Proposta:', 'Proposal validity:', 'Validez de la propuesta:', 'Validité de la proposition :'),
    'comercial.proposta.aCombinar': L(lang, 'A combinar', 'To be agreed', 'A convenir', 'À convenir'),

    'comercial.proposta.preview.secCondGerais': L(lang, 'CONDIÇÕES GERAIS', 'GENERAL TERMS', 'CONDICIONES GENERALES', 'CONDITIONS GÉNÉRALES'),
    'comercial.proposta.preview.secObs': L(lang, 'OBSERVAÇÃO', 'NOTE', 'NOTA', 'NOTE'),

    'comercial.proposta.assinatura.hint': L(lang, 'Clique para adicionar assinatura', 'Click to add signature', 'Clic para añadir firma', 'Cliquez pour ajouter une signature'),
    'comercial.proposta.assinatura.rodape': 'Aero Suite',
    'comercial.proposta.assinatura.por': L(lang, 'Assinado por {{nome}}', 'Signed by {{nome}}', 'Firmado por {{nome}}', 'Signé par {{nome}}'),

    'comercial.proposta.sidebar.secDatas': L(lang, 'Datas', 'Dates', 'Fechas', 'Dates'),
    'comercial.proposta.sidebar.dataProposta': L(lang, 'Data da Proposta', 'Proposal date', 'Fecha de la propuesta', 'Date de la proposition'),
    'comercial.proposta.sidebar.validade': L(lang, 'Validade', 'Valid until', 'Validez', 'Validité'),

    'comercial.proposta.sidebar.secCond': L(lang, 'Condições', 'Terms', 'Condiciones', 'Conditions'),
    'comercial.proposta.sidebar.lblPrazo': L(lang, 'Prazo de Entrega', 'Lead time', 'Plazo de entrega', 'Délai de livraison'),
    'comercial.proposta.sidebar.lblPgto': L(lang, 'Forma de Pagamento', 'Payment method', 'Forma de pago', 'Modalité de paiement'),
    'comercial.proposta.sidebar.lblObs': L(lang, 'Observação', 'Note', 'Nota', 'Remarque'),
    'comercial.proposta.sidebar.hintObs': L(
      lang,
      'Deixe em branco para não exibir a seção na proposta.',
      'Leave blank to hide this section from the proposal.',
      'Deje en blanco para ocultar esta sección.',
      'Laissez vide pour masquer cette section.'
    ),

    'comercial.proposta.cotacao.carregando': L(lang, 'Buscando cotação…', 'Fetching rate…', 'Obteniendo cotización…', 'Chargement du taux…'),
    'comercial.proposta.cotacao.fonte.bcb': L(
      lang,
      'Banco Central do Brasil (BCB)',
      'Central Bank of Brazil (BCB)',
      'Banco Central de Brasil (BCB)',
      'Banque centrale du Brésil (BCB)'
    ),
    'comercial.proposta.cotacao.fonte.fallback': L(
      lang,
      'Valor estimado (API indisponível)',
      'Estimated value (API unavailable)',
      'Valor estimado (API no disponible)',
      'Valeur estimée (API indisponible)'
    ),
    'comercial.proposta.cotacao.unavailable': L(
      lang,
      'Cotação não disponível',
      'Exchange rate unavailable',
      'Cotización no disponible',
      'Taux de change indisponible'
    ),

    'comercial.proposta.lbl.freteBrlTit': 'Frete (R$)',
    'comercial.proposta.lbl.moBrlTit': L(lang, 'Mão de Obra (R$)', 'Labour (BRL)', 'Mano de obra (R$)', 'Main-d’œuvre (BRL)'),
    'comercial.proposta.lbl.freteConv': L(lang, 'Frete (R$ {{brl}} → USD)', 'Freight (BRL {{brl}} → USD)', 'Flete (R$ {{brl}} → USD)', 'Fret (R$ {{brl}} → USD)'),
    'comercial.proposta.lbl.moConv': L(lang, 'Mão de Obra (R$ {{brl}} → USD)', 'Labour (BRL {{brl}} → USD)', 'Mano de obra (R$ {{brl}} → USD)', 'Main-d’œuvre (R$ {{brl}} → USD)'),

    'comercial.proposta.valor.aOrcar': L(lang, 'A orçar', 'TBD', 'Por definir', 'À chiffrer'),

    'comercial.proposta.contato.intro': L(
      lang,
      'Estas informações serão exibidas no rodapé da proposta e na assinatura do email.',
      'These details appear in the proposal footer and email signature.',
      'Estos datos aparecerán en el pie de la propuesta y en la firma del correo.',
      'Ces informations figurent dans le pied de page de la proposition et dans la signature e-mail.'
    ),
    'comercial.proposta.contato.introWhatsapp': L(
      lang,
      'Informe o telefone do cliente (com DDD). Se a API do WhatsApp não estiver no servidor, o PDF será transferido para o seu computador, o WhatsApp Web abrirá com a mensagem e você anexa o PDF manualmente (ícone de clipe).',
      'Enter the customer phone (with area code). If the WhatsApp API is not configured on the server, the PDF will download to your computer, WhatsApp Web opens with the message, and you attach the PDF manually (paperclip icon).',
      'Indique el teléfono del cliente (con prefijo). Si la API de WhatsApp no está en el servidor, el PDF se descargará, se abrirá WhatsApp Web con el mensaje y usted adjuntará el PDF manualmente (icono de clip).',
      'Indiquez le téléphone du client (avec indicatif). Si l’API WhatsApp n’est pas sur le serveur, le PDF sera téléchargé, WhatsApp Web s’ouvrira avec le message et vous joindrez le PDF manuellement (icône trombone).'
    ),
    'comercial.proposta.contato.lblResp': L(lang, 'Nome do Responsável', 'Responsible person', 'Persona responsable', 'Personne responsable'),

    'comercial.proposta.email.statusAssinado': L(lang, 'Proposta assinada por {{nome}}', 'Proposal signed by {{nome}}', 'Propuesta firmada por {{nome}}', 'Proposition signée par {{nome}}'),
    'comercial.proposta.email.statusNaoAssinado': L(lang, 'Proposta não assinada', 'Proposal not signed', 'Propuesta sin firmar', 'Proposition non signée'),
    'comercial.proposta.email.recomendaAssinatura': L(
      lang,
      'Recomendamos adicionar uma assinatura antes de enviar',
      'We recommend adding a signature before sending',
      'Recomendamos añadir una firma antes de enviar',
      'Nous recommandons d’ajouter une signature avant l’envoi'
    ),
    'comercial.proposta.email.btnAlterarAss': L(lang, 'Alterar Assinatura', 'Change signature', 'Cambiar firma', 'Modifier la signature'),
    'comercial.proposta.email.btnAddAss': L(lang, 'Adicionar Assinatura', 'Add signature', 'Añadir firma', 'Ajouter une signature'),
    'comercial.proposta.email.destLbl': L(lang, 'E-mail do destinatário *', 'Recipient email *', 'Correo del destinatario *', 'E-mail du destinataire *'),
    'comercial.proposta.email.hintCliente': L(lang, 'Email do cliente:', 'Customer email:', 'Correo del cliente:', 'E-mail du client :'),
    'comercial.proposta.email.assuntoLbl': L(lang, 'Assunto', 'Subject', 'Asunto', 'Objet'),
    'comercial.proposta.email.phAssuntoPrefix': L(lang, 'Proposta Comercial ', 'Commercial proposal ', 'Propuesta comercial ', 'Proposition commerciale '),
    'comercial.proposta.email.formaEnvio': L(lang, 'Forma de Envio', 'Delivery mode', 'Modo de envío', 'Mode d’envoi'),
    'comercial.proposta.email.corpoTit': L(lang, 'No corpo do email', 'In email body', 'En el cuerpo del correo', 'Dans le corps de l’e-mail'),
    'comercial.proposta.email.corpoSub': L(lang, 'Proposta completa no corpo do email', 'Full proposal in the email body', 'Propuesta completa en el cuerpo del correo', 'Proposition complète dans le corps de l’e-mail'),
    'comercial.proposta.email.anexoTit': L(lang, 'Em anexo (PDF)', 'PDF attachment', 'Adjunto (PDF)', 'Pièce jointe (PDF)'),
    'comercial.proposta.email.anexoSub': L(
      lang,
      'Proposta será enviada como arquivo PDF anexo',
      'Proposal will be sent as a PDF attachment',
      'La propuesta se enviará como PDF adjunto',
      'La proposition sera envoyée en pièce jointe PDF'
    ),
    'comercial.proposta.email.msgTit': L(lang, 'Mensagem personalizada', 'Personal message', 'Mensaje personalizado', 'Message personnalisé'),
    'comercial.proposta.email.msgTitAuto': L(lang, '(gerada automaticamente)', '(generated automatically)', '(generada automáticamente)', '(généré automatiquement)'),
    'comercial.proposta.email.phMsgGerada': L(lang, 'Mensagem será gerada automaticamente…', 'Message will be generated automatically…', 'El mensaje se generará automáticamente…', 'Le message sera généré automatiquement…'),
    'comercial.proposta.email.phMsgManual': L(
      lang,
      'Prezado cliente, segue nossa proposta comercial…',
      'Dear customer, please find our commercial proposal…',
      'Estimado cliente, le enviamos nuestra propuesta comercial…',
      'Madame, Monsieur, veuillez trouver notre proposition commerciale…'
    ),
    'comercial.proposta.email.hintGeradaAuto': L(
      lang,
      'A mensagem será gerada automaticamente com saudação apropriada ao horário',
      'The message will be generated with an appropriate greeting for the time',
      'El mensaje se generará con un saludo acorde a la hora',
      'Le message sera généré avec une formule de politesse adaptée à l’heure'
    ),

    'comercial.proposta.email.resumo': L(lang, 'Resumo da Proposta', 'Proposal summary', 'Resumen de la propuesta', 'Résumé de la proposition'),
    'comercial.proposta.email.lblClientePrev': 'Cliente:',
    'comercial.proposta.email.lblProdutoPrev': L(lang, 'Produto:', 'Product:', 'Producto:', 'Produit :'),
    'comercial.proposta.email.lblValorPrev': 'Valor:',

    'comercial.proposta.email.assuntoDefault': L(
      lang,
      'Proposta Comercial {{num}} - Aero Suite',
      'Commercial proposal {{num}} — Aero Suite',
      'Propuesta comercial {{num}} — Aero Suite',
      'Proposition commerciale {{num}} — Aero Suite'
    ),
    'comercial.proposta.email.saudManha': L(lang, 'Bom dia', 'Good morning', 'Buenos días', 'Bonjour'),
    'comercial.proposta.email.saudTarde': L(lang, 'Boa tarde', 'Good afternoon', 'Buenas tardes', 'Bon après-midi'),
    'comercial.proposta.email.saudNoite': L(lang, 'Boa noite', 'Good evening', 'Buenas noches', 'Bonsoir'),
    'comercial.proposta.email.anexoClienteFallback': L(lang, 'Cliente', 'Customer', 'Cliente', 'Client'),
    'comercial.proposta.email.anexoEquipeFallback': L(lang, 'Equipe Aero Suite', 'Aero Suite team', 'Equipo Aero Suite', 'Équipe Aero Suite'),
    'comercial.proposta.email.corpoAnexo': L(
      lang,
      '{{saudacao}},\n\nEsperamos que esta mensagem o encontre bem.\n\nSegue em anexo a proposta comercial {{num}} com todos os detalhes dos produtos e serviços oferecidos.\n\nFicamos à disposição para esclarecer qualquer dúvida ou fornecer informações adicionais.\n\nAtenciosamente,\n{{remetente}}\n{{empresa}}\nTel: {{tel}}\nE-mail: {{email}}',
      '{{saudacao}},\n\nWe hope this message finds you well.\n\nPlease find attached commercial proposal {{num}} with full details of the products and services offered.\n\nWe remain at your disposal for any questions or further information.\n\nKind regards,\n{{remetente}}\n{{empresa}}\nTel: {{tel}}\nEmail: {{email}}',
      '{{saudacao}},\n\nEsperamos que este mensaje le encuentre bien.\n\nAdjuntamos la propuesta comercial {{num}} con todos los detalles de los productos y servicios ofrecidos.\n\nQuedamos a su disposición para cualquier consulta o información adicional.\n\nAtentamente,\n{{remetente}}\n{{empresa}}\nTel.: {{tel}}\nCorreo: {{email}}',
      '{{saudacao}},\n\nNous espérons que ce message vous trouve en bonne santé.\n\nVeuillez trouver en pièce jointe la proposition commerciale {{num}} avec tous les détails des produits et services proposés.\n\nNous restons à votre disposition pour toute question ou information complémentaire.\n\nCordialement,\n{{remetente}}\n{{empresa}}\nTél. : {{tel}}\nE-mail : {{email}}'
    ),

    'comercial.proposta.print.winTitle': L(lang, 'Proposta Comercial - {{num}}', 'Commercial proposal — {{num}}', 'Propuesta comercial — {{num}}', 'Proposition commerciale — {{num}}'),
    'comercial.proposta.print.refNova': L(lang, 'NOVA', 'NEW', 'NUEVA', 'NOUVELLE'),
    'comercial.proposta.print.semProdutos': L(lang, 'Nenhum produto/serviço adicionado.', 'No products or services added.', 'Ningún producto o servicio añadido.', 'Aucun produit ou service ajouté.'),
    'comercial.proposta.print.footerTel': L(lang, 'Tel: {{tel}} | E-mail: {{email}}', 'Tel: {{tel}} | Email: {{email}}', 'Tel.: {{tel}} | Correo: {{email}}', 'Tél. : {{tel}} | E-mail : {{email}}'),

    'comercial.proposta.emailSuccess.title': L(lang, 'Proposta Enviada!', 'Proposal sent!', '¡Propuesta enviada!', 'Proposition envoyée !'),
    'comercial.proposta.emailSuccess.lead': L(lang, 'A proposta foi enviada com sucesso para:', 'The proposal was successfully sent to:', 'La propuesta se envió correctamente a:', 'La proposition a bien été envoyée à :'),

    'comercial.proposta.gallery.empty': L(lang, 'Nenhum template encontrado', 'No templates found', 'Ninguna plantilla encontrada', 'Aucun modèle trouvé'),

    'comercial.proposta.tplDialog.intro': L(
      lang,
      'Salve esta configuração de produto/serviço como um template para reutilizar em futuras propostas.',
      'Save this product/service setup as a template for future proposals.',
      'Guarde esta configuración de producto/servicio como plantilla para futuras propuestas.',
      'Enregistrez cette configuration produit/service comme modèle pour les propositions futures.'
    ),
    'comercial.proposta.tplDialog.lblNome': L(lang, 'Nome do Template *', 'Template name *', 'Nombre de la plantilla *', 'Nom du modèle *'),
    'comercial.proposta.tplDialog.lblDescricao': L(lang, 'Descrição', 'Description', 'Descripción', 'Description'),
    'comercial.proposta.tplDialog.lblCategoria': L(lang, 'Categoria', 'Category', 'Categoría', 'Catégorie'),

    'comercial.proposta.tplPreview.sec': L(lang, 'Dados que serão salvos:', 'Data to be saved:', 'Datos que se guardarán :', 'Données à enregistrer :'),
    'comercial.proposta.tplPreview.lblProduto': L(lang, 'Produto:', 'Product:', 'Producto:', 'Produit :'),
    'comercial.proposta.tplPreview.lblPnPrev': 'P/N:',
    'comercial.proposta.tplPreview.lblServicoPrev': L(lang, 'Serviço:', 'Service:', 'Servicio:', 'Service :'),
    'comercial.proposta.tplPreview.lblValorPrev': L(lang, 'Valor Base:', 'Base amount:', 'Importe base:', 'Montant de base :'),
    'comercial.proposta.tplPreview.lblPrazoPrev': L(lang, 'Prazo:', 'Lead time:', 'Plazo:', 'Délai :'),
    'comercial.proposta.tplPreview.lblPgtoPrev': L(lang, 'Pagamento:', 'Payment:', 'Pago:', 'Paiement :'),

    'comercial.proposta.validadePadrao': L(lang, '30 dias', '30 days', '30 días', '30 jours'),

    'comercial.proposta.bling.importBtn': L(lang, 'Importar da Bling', 'Import from Bling', 'Importar de Bling', 'Importer depuis Bling'),
    'comercial.proposta.bling.dialogTitle': L(lang, 'Importar cliente da Bling', 'Import customer from Bling', 'Importar cliente de Bling', 'Importer un client depuis Bling'),
    'comercial.proposta.bling.dialogHint': L(
      lang,
      'Pesquise contatos na Bling (mínimo 2 caracteres) e preencha os dados do cliente na proposta.',
      'Search Bling contacts (at least 2 characters) and fill the proposal customer fields.',
      'Busque contactos en Bling (mínimo 2 caracteres) y rellene los datos del cliente en la propuesta.',
      'Recherchez des contacts Bling (au moins 2 caractères) et remplissez les champs client de la proposition.'
    ),
    'comercial.proposta.bling.searchPh': L(lang, 'Nome, e-mail ou documento…', 'Name, email or tax ID…', 'Nombre, correo o documento…', 'Nom, e-mail ou identifiant…'),
    'comercial.proposta.bling.searchBtn': L(lang, 'Buscar', 'Search', 'Buscar', 'Rechercher'),
    'comercial.proposta.bling.applyBtn': L(lang, 'Usar', 'Use', 'Usar', 'Utiliser'),
    'comercial.proposta.bling.linkBtn': L(lang, 'Vincular ao cliente atual', 'Link to current customer', 'Vincular al cliente actual', 'Lier au client actuel'),
    'comercial.proposta.bling.importBtnShort': L(lang, 'Importar como cliente', 'Import as customer', 'Importar como cliente', 'Importer comme client'),
    'comercial.proposta.bling.linkOk': L(lang, 'Cliente vinculado ao contato Bling.', 'Customer linked to Bling contact.', 'Cliente vinculado al contacto Bling.', 'Client lié au contact Bling.'),
    'comercial.proposta.bling.linkErr': L(lang, 'Falha ao vincular contato Bling.', 'Failed to link Bling contact.', 'Error al vincular contacto Bling.', 'Échec de la liaison du contact Bling.'),
    'comercial.proposta.bling.empty': L(lang, 'Nenhum contato encontrado.', 'No contacts found.', 'Ningún contacto encontrado.', 'Aucun contact trouvé.'),
    'comercial.proposta.bling.semNome': L(lang, '(sem nome)', '(unnamed)', '(sin nombre)', '(sans nom)'),
    'comercial.proposta.bling.notConfigured': L(
      lang,
      'Integração Bling não configurada ou indisponível.',
      'Bling integration is not configured or unavailable.',
      'La integración con Bling no está configurada o no está disponible.',
      'L’intégration Bling n’est pas configurée ou est indisponible.'
    ),
    'comercial.proposta.bling.searchMin': L(lang, 'Digite pelo menos 2 caracteres para buscar.', 'Type at least 2 characters to search.', 'Escriba al menos 2 caracteres para buscar.', 'Saisissez au moins 2 caractères pour rechercher.'),
    'comercial.proposta.bling.searchError': L(lang, 'Falha ao buscar contatos na Bling.', 'Failed to search Bling contacts.', 'Error al buscar contactos en Bling.', 'Échec de la recherche de contacts Bling.'),
    'comercial.proposta.bling.applied': L(lang, 'Dados do contato Bling aplicados ao cliente.', 'Bling contact data applied to customer.', 'Datos del contacto Bling aplicados al cliente.', 'Données du contact Bling appliquées au client.'),
    'comercial.proposta.bling.appliedCreated': L(lang, 'Cliente criado e vinculado ao contato Bling.', 'Customer created and linked to Bling contact.', 'Cliente creado y vinculado al contacto Bling.', 'Client créé et lié au contact Bling.'),
    'comercial.proposta.bling.appliedLinked': L(lang, 'Cliente atualizado e vinculado ao contato Bling.', 'Customer updated and linked to Bling contact.', 'Cliente actualizado y vinculado al contacto Bling.', 'Client mis à jour et lié au contact Bling.'),
    'comercial.proposta.bling.appliedLocalOnly': L(
      lang,
      'Dados aplicados na proposta, mas o vínculo com a Bling falhou. Salve o cliente manualmente.',
      'Data applied to the proposal, but Bling link failed. Save the customer manually.',
      'Datos aplicados en la propuesta, pero falló el vínculo con Bling. Guarde el cliente manualmente.',
      'Données appliquées à la proposition, mais la liaison Bling a échoué. Enregistrez le client manuellement.'
    ),

    'comercial.proposta.bling.pedidoBtn': L(lang, 'Enviar pedido à Bling', 'Send order to Bling', 'Enviar pedido a Bling', 'Envoyer la commande à Bling'),
    'comercial.proposta.bling.pedidoBadge': L(lang, 'Pedido Bling', 'Bling order', 'Pedido Bling', 'Commande Bling'),
    'comercial.proposta.bling.pedidoBadgeTip': L(
      lang,
      'Pedido #{{numero}} — {{situacao}}',
      'Order #{{numero}} — {{situacao}}',
      'Pedido #{{numero}} — {{situacao}}',
      'Commande n° {{numero}} — {{situacao}}'
    ),
    'comercial.proposta.bling.pedidoConfirmHeader': L(lang, 'Enviar pedido à Bling', 'Send order to Bling', 'Enviar pedido a Bling', 'Envoyer la commande à Bling'),
    'comercial.proposta.bling.pedidoConfirmMsg': L(
      lang,
      'Será criado um pedido de venda na Bling com os itens desta proposta. O cliente deve estar vinculado à Bling. Continuar?',
      'A sales order will be created in Bling with this proposal\'s line items. The customer must be linked to Bling. Continue?',
      'Se creará un pedido de venta en Bling con los ítems de esta propuesta. El cliente debe estar vinculado a Bling. ¿Continuar?',
      'Une commande de vente sera créée dans Bling avec les lignes de cette proposition. Le client doit être lié à Bling. Continuer ?'
    ),
    'comercial.proposta.bling.pedidoOk': L(lang, 'Pedido criado na Bling.', 'Order created in Bling.', 'Pedido creado en Bling.', 'Commande créée dans Bling.'),
    'comercial.proposta.bling.pedidoErr': L(lang, 'Falha ao criar pedido na Bling.', 'Failed to create Bling order.', 'Error al crear pedido en Bling.', 'Échec de la création de la commande Bling.'),
    'comercial.proposta.bling.nfeTitle': L(lang, 'Notas fiscais (Bling)', 'Tax invoices (Bling)', 'Facturas (Bling)', 'Factures (Bling)'),
    'comercial.proposta.bling.nfeEmpty': L(lang, 'Nenhuma NF-e registrada para esta proposta.', 'No invoices recorded for this proposal.', 'Ninguna NF-e registrada para esta propuesta.', 'Aucune facture enregistrée pour cette proposition.'),
    'comercial.proposta.bling.nfeOpenDanfe': L(lang, 'Abrir DANFE', 'Open DANFE', 'Abrir DANFE', 'Ouvrir le DANFE'),
    'comercial.proposta.bling.nfeEmitBtn': L(lang, 'Emitir NF-e', 'Issue invoice', 'Emitir NF-e', 'Émettre NF-e'),
    'comercial.proposta.bling.nfeEmitConfirmHeader': L(lang, 'Emitir NF-e na Bling', 'Issue invoice in Bling', 'Emitir NF-e en Bling', 'Émettre NF-e dans Bling'),
    'comercial.proposta.bling.nfeEmitConfirmMsg': L(
      lang,
      'Será criada e enviada à SEFAZ uma NF-e a partir do pedido Bling vinculado. Certifique-se de que o certificado está configurado. Continuar?',
      'An invoice will be created from the linked Bling order and sent to SEFAZ. Ensure the certificate is configured. Continue?',
      'Se creará y enviará a SEFAZ una NF-e desde el pedido Bling vinculado. Asegúrese de que el certificado esté configurado. ¿Continuar?',
      'Une NF-e sera créée à partir de la commande Bling liée et envoyée à la SEFAZ. Vérifiez que le certificat est configuré. Continuer ?'
    ),
    'comercial.proposta.bling.nfeEmitOk': L(lang, 'NF-e emitida via Bling.', 'Invoice issued via Bling.', 'NF-e emitida vía Bling.', 'NF-e émise via Bling.'),
    'comercial.proposta.bling.nfeEmitErr': L(lang, 'Falha ao emitir NF-e na Bling.', 'Failed to issue invoice in Bling.', 'Error al emitir NF-e en Bling.', 'Échec de l\'émission NF-e dans Bling.'),
    'comercial.proposta.bling.fluxoTitle': L(lang, 'Fluxo Bling (pedido → OS → NF-e)', 'Bling workflow (order → WO → invoice)', 'Flujo Bling (pedido → OS → NF-e)', 'Flux Bling (commande → OS → NF-e)'),
    'comercial.proposta.bling.fluxoHint': L(
      lang,
      'Acompanhe cada etapa do processo fiscal integrado. Com as automações ativas, a OS é criada ao vincular o pedido e a NF-e é emitida ao concluir o serviço na OS.',
      'Track each step of the integrated fiscal workflow. With automations enabled, the work order is created when the order is linked and the invoice is issued when the WO is completed.',
      'Siga cada etapa del proceso fiscal integrado. Con automatizaciones activas, la OS se crea al vincular el pedido y la NF-e se emite al concluir el servicio en la OS.',
      'Suivez chaque étape du flux fiscal intégré. Avec les automatisations actives, l’OS est créée à la liaison du pedido et la NF-e est émise à la clôture du service sur l’OS.'
    ),
    'comercial.proposta.bling.fluxoRetryBtn': L(lang, 'Reprocessar automações', 'Retry automations', 'Reprocesar automatizaciones', 'Relancer les automatisations'),
    'comercial.proposta.bling.fluxoRetryOk': L(lang, 'Automações reprocessadas.', 'Automations retried.', 'Automatizaciones reprocesadas.', 'Automatisations relancées.'),
    'comercial.proposta.bling.fluxoRetryErr': L(lang, 'Falha ao reprocessar automações.', 'Failed to retry automations.', 'Error al reprocesar automatizaciones.', 'Échec du relancement des automatisations.'),
    'comercial.proposta.bling.fluxoPendente': L(lang, 'Automação pendente ou com falha', 'Automation pending or failed', 'Automatización pendiente o con fallo', 'Automatisation en attente ou en échec'),
    'comercial.proposta.bling.fluxoMotivo.AGUARDANDO_OS_CONCLUSAO': L(
      lang,
      'Aguardando conclusão do serviço na OS',
      'Waiting for work order service completion',
      'Esperando conclusión del servicio en la OS',
      'En attente de clôture du service sur l’OS'
    ),
    'comercial.proposta.bling.fluxoMotivo.AGUARDANDO_OS': L(lang, 'Aguardando geração da OS', 'Waiting for work order creation', 'Esperando generación de la OS', 'En attente de création de l’OS'),
    'comercial.proposta.bling.fluxoMotivo.AGUARDANDO_NFE': L(lang, 'Aguardando emissão da NF-e', 'Waiting for invoice issuance', 'Esperando emisión de la NF-e', 'En attente d’émission de la NF-e'),
    'comercial.proposta.bling.fluxoMotivo.ERRO_OS': L(lang, 'Falha ao gerar OS — reprocessar', 'Work order generation failed — retry', 'Error al generar OS — reintentar', 'Échec création OS — relancer'),
    'comercial.proposta.bling.fluxoMotivo.ERRO_NFE': L(lang, 'Falha na NF-e — reprocessar', 'Invoice failed — retry', 'Error en NF-e — reintentar', 'Échec NF-e — relancer'),
    'comercial.proposta.bling.fluxoStep.pedido': L(lang, 'Pedido Bling', 'Bling order', 'Pedido Bling', 'Commande Bling'),
    'comercial.proposta.bling.fluxoStep.os': L(lang, 'Ordem de serviço', 'Work order', 'Orden de servicio', 'Ordre de service'),
    'comercial.proposta.bling.fluxoStep.os_concluida': L(lang, 'Serviço concluído', 'Service completed', 'Servicio concluido', 'Service terminé'),
    'comercial.proposta.bling.fluxoStep.nfe': L(lang, 'NF-e', 'Invoice', 'NF-e', 'NF-e'),
    'comercial.proposta.bling.fluxoStatus.OK': L(lang, 'Concluído', 'Done', 'Completado', 'Terminé'),
    'comercial.proposta.bling.fluxoStatus.PENDING': L(lang, 'Aguardando', 'Pending', 'Pendiente', 'En attente'),
    'comercial.proposta.bling.fluxoStatus.FAILED': L(lang, 'Falhou', 'Failed', 'Falló', 'Échec'),
    'comercial.proposta.bling.fluxoStatus.SKIPPED': L(lang, 'Ignorado', 'Skipped', 'Omitido', 'Ignoré'),
    'comercial.proposta.bling.fluxoHistorico': L(lang, 'Histórico do processo', 'Process history', 'Historial del proceso', 'Historique du processus'),

    'comercial.proposta.btn.gerarOs': L(lang, 'Gerar ordem de serviço', 'Create work order', 'Generar orden de servicio', 'Créer un ordre de service'),
    'comercial.proposta.btn.abrirOs': L(lang, 'Abrir OS', 'Open WO', 'Abrir OS', 'Ouvrir l’OS'),
    'comercial.proposta.btn.aprovar': L(lang, 'Marcar aprovada', 'Mark approved', 'Marcar aprobada', 'Marquer approuvée'),
    'comercial.proposta.tip.gerarOs': L(
      lang,
      'Cria uma OS com dados do cliente e da proposta (proposta deve estar aprovada).',
      'Creates a work order from proposal data (proposal must be approved).',
      'Crea una OS con los datos del cliente y de la propuesta (debe estar aprobada).',
      'Crée un OS à partir de la proposition (proposition approuvée requise).'
    ),
    'comercial.proposta.gerarOs.confirmHeader': L(lang, 'Gerar ordem de serviço', 'Create work order', 'Generar orden de servicio', 'Créer un ordre de service'),
    'comercial.proposta.gerarOs.confirmMsg': L(
      lang,
      'Serão copiados cliente, produto/serviço e itens da proposta para uma nova OS. Continuar?',
      'Customer, product/service and line items will be copied to a new work order. Continue?',
      'Se copiarán cliente, producto/servicio e ítems de la propuesta a una nueva OS. ¿Continuar?',
      'Le client, le produit/service et les lignes seront copiés vers un nouvel OS. Continuer ?'
    ),
    'comercial.proposta.gerarOs.confirmAprovarMsg': L(
      lang,
      'A proposta não está aprovada. Deseja aprovar e gerar a ordem de serviço agora?',
      'The proposal is not approved. Approve it and create the work order now?',
      'La propuesta no está aprobada. ¿Aprobar y generar la orden de servicio ahora?',
      'La proposition n’est pas approuvée. L’approuver et créer l’ordre de service maintenant ?'
    ),
    'comercial.proposta.gerarOs.badge': L(lang, 'OS vinculada', 'Linked WO', 'OS vinculada', 'OS lié'),
    'comercial.proposta.gerarOs.badgeTip': L(lang, 'Ordem de serviço gerada a partir desta proposta', 'Work order created from this proposal', 'Orden generada desde esta propuesta', 'Ordre de service créé à partir de cette proposition'),
    'comercial.proposta.toast.gerarOsOk': L(lang, 'Ordem de serviço criada com sucesso.', 'Work order created successfully.', 'Orden de servicio creada correctamente.', 'Ordre de service créé avec succès.'),
    'comercial.proposta.toast.gerarOsErr': L(lang, 'Não foi possível gerar a ordem de serviço.', 'Could not create the work order.', 'No se pudo generar la orden de servicio.', 'Impossible de créer l’ordre de service.'),
    'comercial.proposta.toast.aprovarOk': L(lang, 'Proposta marcada como aprovada.', 'Proposal marked as approved.', 'Propuesta marcada como aprobada.', 'Proposition marquée comme approuvée.'),

    'comercial.proposta.btn.portal': L(lang, 'Disponibilizar no portal', 'Publish to portal', 'Publicar en el portal', 'Publier sur le portail'),
    'comercial.proposta.tip.portal': L(
      lang,
      'Publica a proposta no portal do cliente. Você pode notificar por e-mail ou apenas disponibilizar.',
      'Publishes the proposal on the customer portal. You can notify by email or publish only.',
      'Publica la propuesta en el portal del cliente. Puede notificar por correo o solo publicar.',
      'Publie la proposition sur le portail client. Vous pouvez notifier par e-mail ou publier seulement.'
    ),
    'comercial.proposta.portal.dialogTitle': L(lang, 'Portal do cliente', 'Customer portal', 'Portal del cliente', 'Portail client'),
    'comercial.proposta.portal.dialogIntro': L(
      lang,
      'A proposta ficará disponível para o cliente aprovar ou rejeitar em /externo/propostas.',
      'The proposal will be available for the customer to approve or reject at /externo/propostas.',
      'La propuesta estará disponible para que el cliente apruebe o rechace en /externo/propostas.',
      'La proposition sera disponible pour que le client approuve ou rejette sur /externo/propostas.'
    ),
    'comercial.proposta.portal.checkEmail': L(lang, 'E-mail do cliente informado', 'Customer email provided', 'Correo del cliente informado', 'E-mail client renseigné'),
    'comercial.proposta.portal.checkVisible': L(lang, 'Proposta visível no portal', 'Proposal visible on portal', 'Propuesta visible en el portal', 'Proposition visible sur le portail'),
    'comercial.proposta.portal.checkUser': L(lang, 'Usuário externo existente', 'External user exists', 'Usuario externo existente', 'Utilisateur externe existant'),
    'comercial.proposta.portal.checkAccess': L(lang, 'Acesso ao menu Propostas', 'Access to Proposals menu', 'Acceso al menú Propuestas', 'Accès au menu Propositions'),
    'comercial.proposta.portal.createAccess': L(
      lang,
      'Criar acesso externo para o cliente',
      'Create external access for the customer',
      'Crear acceso externo para el cliente',
      'Créer un accès externe pour le client'
    ),
    'comercial.proposta.portal.notifyTitle': L(lang, 'Notificação ao cliente', 'Customer notification', 'Notificación al cliente', 'Notification client'),
    'comercial.proposta.portal.notifyYes': L(
      lang,
      'Disponibilizar e notificar por e-mail',
      'Publish and notify by email',
      'Publicar y notificar por correo',
      'Publier et notifier par e-mail'
    ),
    'comercial.proposta.portal.notifyYesHint': L(
      lang,
      'Envia e-mail informando que a proposta está no portal. Se for criado acesso novo, o cliente também recebe instruções de primeiro acesso.',
      'Sends an email that the proposal is on the portal. If new access is created, the customer also receives first-access instructions.',
      'Envía un correo informando que la propuesta está en el portal. Si se crea acceso nuevo, el cliente también recibe instrucciones de primer acceso.',
      'Envoie un e-mail indiquant que la proposition est sur le portail. Si un nouvel accès est créé, le client reçoit aussi les instructions de premier accès.'
    ),
    'comercial.proposta.portal.notifyNo': L(
      lang,
      'Disponibilizar sem enviar e-mail',
      'Publish without sending email',
      'Publicar sin enviar correo',
      'Publier sans envoyer d’e-mail'
    ),
    'comercial.proposta.portal.notifyNoHint': L(
      lang,
      'A proposta ficará no portal, mas o cliente não será avisado automaticamente.',
      'The proposal will be on the portal, but the customer will not be notified automatically.',
      'La propuesta estará en el portal, pero el cliente no será avisado automáticamente.',
      'La proposition sera sur le portail, mais le client ne sera pas averti automatiquement.'
    ),
    'comercial.proposta.portal.warnNoNotifyNewUser': L(
      lang,
      'Sem e-mail: se um novo usuário for criado, compartilhe o acesso manualmente com o cliente.',
      'No email: if a new user is created, share access manually with the customer.',
      'Sin correo: si se crea un nuevo usuario, comparta el acceso manualmente con el cliente.',
      'Sans e-mail : si un nouvel utilisateur est créé, partagez l’accès manuellement avec le client.'
    ),
    'comercial.proposta.portal.confirmNotify': L(
      lang,
      'Disponibilizar e notificar',
      'Publish and notify',
      'Publicar y notificar',
      'Publier et notifier'
    ),
    'comercial.proposta.portal.nomeContato': L(lang, 'Nome do contato (novo usuário)', 'Contact name (new user)', 'Nombre del contacto (nuevo usuario)', 'Nom du contact (nouvel utilisateur)'),
    'comercial.proposta.portal.confirm': L(lang, 'Disponibilizar', 'Publish', 'Publicar', 'Publier'),
    'comercial.proposta.portal.noEmail': L(lang, 'Informe o e-mail do cliente na aba Cliente.', 'Enter the customer email on the Customer tab.', 'Indique el correo del cliente en la pestaña Cliente.', 'Indiquez l’e-mail du client dans l’onglet Client.'),
    'comercial.proposta.portal.noName': L(lang, 'Informe o nome do cliente na aba Cliente.', 'Enter the customer name on the Customer tab.', 'Indique el nombre del cliente en la pestaña Cliente.', 'Indiquez le nom du client dans l’onglet Client.'),
    'comercial.proposta.portal.saveFirst': L(lang, 'Salve a proposta antes de disponibilizar no portal.', 'Save the proposal before publishing to the portal.', 'Guarde la propuesta antes de publicar en el portal.', 'Enregistrez la proposition avant de la publier sur le portail.'),
    'comercial.proposta.portal.toastOk': L(
      lang,
      'Proposta disponível no portal do cliente.',
      'Proposal is now available on the customer portal.',
      'Propuesta disponible en el portal del cliente.',
      'Proposition disponible sur le portail client.'
    ),
    'comercial.proposta.portal.toastUserCreated': L(
      lang,
      'Acesso externo criado.',
      'External access created.',
      'Acceso externo creado.',
      'Accès externe créé.'
    ),
    'comercial.proposta.portal.toastNotified': L(
      lang,
      'Cliente notificado por e-mail sobre a proposta no portal.',
      'Customer notified by email about the proposal on the portal.',
      'Cliente notificado por correo sobre la propuesta en el portal.',
      'Client notifié par e-mail concernant la proposition sur le portail.'
    ),
    'comercial.proposta.portal.toastSilent': L(
      lang,
      'Proposta disponibilizada sem envio de e-mail.',
      'Proposal published without sending email.',
      'Propuesta publicada sin envío de correo.',
      'Proposition publiée sans envoi d’e-mail.'
    ),
    'comercial.proposta.portal.toastErr': L(lang, 'Não foi possível disponibilizar no portal.', 'Could not publish to the portal.', 'No se pudo publicar en el portal.', 'Impossible de publier sur le portail.'),
    'comercial.proposta.portal.warnNoUser': L(
      lang,
      'O cliente ainda não possui usuário externo. Marque a opção abaixo para criar acesso imediato.',
      'The customer does not have an external user yet. Check the option below to grant immediate access.',
      'El cliente aún no tiene usuario externo. Marque la opción abajo para crear acceso inmediato.',
      'Le client n’a pas encore d’utilisateur externe. Cochez l’option ci-dessous pour créer un accès immédiat.'
    ),
    'comercial.proposta.portal.userExisting': L(
      lang,
      'Usuário externo: {{nome}} ({{email}})',
      'External user: {{nome}} ({{email}})',
      'Usuario externo: {{nome}} ({{email}})',
      'Utilisateur externe : {{nome}} ({{email}})'
    ),
    'comercial.proposta.portal.alreadyVisible': L(
      lang,
      'A proposta já está visível no portal. Você pode conceder ou atualizar o acesso do cliente.',
      'The proposal is already visible on the portal. You can grant or update customer access.',
      'La propuesta ya está visible en el portal. Puede conceder o actualizar el acceso del cliente.',
      'La proposition est déjà visible sur le portail. Vous pouvez accorder ou mettre à jour l’accès client.'
    ),
    'comercial.proposta.portal.cancel': L(lang, 'Cancelar', 'Cancel', 'Cancelar', 'Annuler'),

    'comercial.proposta.extras.secTitle': L(lang, 'Campos extras', 'Extra fields', 'Campos extra', 'Champs supplémentaires'),
    'comercial.proposta.extras.referenciaCliente': L(
      lang,
      'Referência do cliente (PO / OC)',
      'Customer reference (PO)',
      'Referencia del cliente (OC)',
      'Référence client (BC)'
    ),
    'comercial.proposta.extras.contatoTecnico': L(
      lang,
      'Contato técnico do cliente',
      'Customer technical contact',
      'Contacto técnico del cliente',
      'Contact technique client'
    ),
    'comercial.proposta.extras.centroCusto': L(
      lang,
      'Centro de custo / projeto',
      'Cost center / project',
      'Centro de costo / proyecto',
      'Centre de coût / projet'
    ),

    ...condGeraisDict(lang)
  };
}
