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
    'proposta.anexo.error.nao_encontrado': L(
      'Anexo não encontrado.',
      'Attachment not found.',
      'Anexo no encontrado.',
      'Pièce jointe introuvable.',
      lang
    ),
    'proposta.anexo.error.proposta_status': L(
      'Status da proposta não permite envio de anexos.',
      'Proposal status does not allow attachments.',
      'El estado de la propuesta no permite adjuntos.',
      'Le statut de la proposition n’autorise pas les pièces jointes.',
      lang
    ),
    'proposta.anexo.error.arquivo_obrigatorio': L(
      'Arquivo obrigatório.',
      'File is required.',
      'Archivo obligatorio.',
      'Fichier obligatoire.',
      lang
    ),
    'proposta.anexo.error.falha_gravar': L(
      'Falha ao gravar o anexo.',
      'Failed to save attachment.',
      'Error al guardar el anexo.',
      'Échec de l’enregistrement de la pièce jointe.',
      lang
    ),
    'proposta.aditivo.error.proposta_nao_encontrada': L(
      'Proposta não encontrada.',
      'Proposal not found.',
      'Propuesta no encontrada.',
      'Proposition introuvable.',
      lang
    ),
    'proposta.aditivo.error.proposta_status': L(
      'Status da proposta não permite aditivos.',
      'Proposal status does not allow addenda.',
      'El estado de la propuesta no permite aditivos.',
      'Le statut de la proposition n’autorise pas les avenants.',
      lang
    ),
    'proposta.aditivo.error.descricao_obrigatoria': L(
      'Descrição do aditivo obrigatória.',
      'Addendum description is required.',
      'Descripción del aditivo obligatoria.',
      'Description de l’avenant obligatoire.',
      lang
    ),
    'proposta.aditivo.error.nao_encontrado': L(
      'Aditivo não encontrado.',
      'Addendum not found.',
      'Aditivo no encontrado.',
      'Avenant introuvable.',
      lang
    ),
    'proposta.aditivo.error.ja_decidido': L(
      'Este aditivo já foi decidido.',
      'This addendum has already been decided.',
      'Este aditivo ya fue decidido.',
      'Cet avenant a déjà été tranché.',
      lang
    ),
    'proposta.aditivo.error.nao_pode_decidir_proprio': L(
      'Não é possível decidir um aditivo solicitado por você.',
      'You cannot decide an addendum you requested.',
      'No puede decidir un aditivo solicitado por usted.',
      'Vous ne pouvez pas trancher un avenant que vous avez demandé.',
      lang
    ),
    'proposta.aditivo.error.motivo_rejeicao': L(
      'Informe o motivo da rejeição.',
      'Provide the rejection reason.',
      'Indique el motivo del rechazo.',
      'Indiquez le motif du rejet.',
      lang
    ),
    'proposta.error.not_found': L(
      'Proposta {{id}} não encontrada.',
      'Proposal {{id}} not found.',
      'Propuesta {{id}} no encontrada.',
      'Proposition {{id}} introuvable.',
      lang
    ),
    'proposta.error.comercial_not_found': L(
      'Proposta comercial {{id}} não encontrada.',
      'Commercial proposal {{id}} not found.',
      'Propuesta comercial {{id}} no encontrada.',
      'Proposition commerciale {{id}} introuvable.',
      lang
    ),
    'proposta.error.email_destino_required': L(
      'E-mail de destino obrigatório.',
      'Destination email is required.',
      'Correo de destino obligatorio.',
      'E-mail de destination obligatoire.',
      lang
    ),
    'proposta.error.phone_destino_required': L(
      'Telefone de destino obrigatório.',
      'Destination phone is required.',
      'Teléfono de destino obligatorio.',
      'Téléphone de destination obligatoire.',
      lang
    ),
    'proposta.error.phone_invalid': L(
      'Telefone inválido: {{phone}}.',
      'Invalid phone: {{phone}}.',
      'Teléfono no válido: {{phone}}.',
      'Téléphone non valide : {{phone}}.',
      lang
    ),
    'proposta.error.pdf_generate_failed': L(
      'Falha ao gerar PDF: {{detail}}.',
      'Failed to generate PDF: {{detail}}.',
      'Error al generar PDF: {{detail}}.',
      'Échec de la génération du PDF : {{detail}}.',
      lang
    ),
    'proposta.error.null_on_save_items': L(
      'Não é permitido salvar itens nulos.',
      'Saving null items is not allowed.',
      'No se permite guardar ítems nulos.',
      'L’enregistrement d’éléments nuls n’est pas autorisé.',
      lang
    ),
    'proposta.portal.email_required': L(
      'E-mail obrigatório para acesso ao portal.',
      'Email is required for portal access.',
      'Correo obligatorio para acceder al portal.',
      'E-mail obligatoire pour accéder au portail.',
      lang
    ),
    'proposta.portal.no_external_user': L(
      'Usuário externo não vinculado.',
      'No external user linked.',
      'Usuario externo no vinculado.',
      'Aucun utilisateur externe associé.',
      lang
    ),
    'proposta.portal.not_found': L(
      'Proposta do portal não encontrada.',
      'Portal proposal not found.',
      'Propuesta del portal no encontrada.',
      'Proposition du portail introuvable.',
      lang
    ),
    'proposta.externa.status_invalid': L(
      'Status inválido para esta operação.',
      'Invalid status for this operation.',
      'Estado no válido para esta operación.',
      'Statut non valide pour cette opération.',
      lang
    ),
    'proposta.externa.rejection_reason_required': L(
      'Motivo da rejeição obrigatório.',
      'Rejection reason is required.',
      'Motivo del rechazo obligatorio.',
      'Motif du rejet obligatoire.',
      lang
    ),
    'proposta.externa.not_found': L(
      'Proposta externa não encontrada.',
      'External proposal not found.',
      'Propuesta externa no encontrada.',
      'Proposition externe introuvable.',
      lang
    ),
    'proposta.bling.pedido_not_found': L(
      'Pedido Bling {{id}} não encontrado.',
      'Bling order {{id}} not found.',
      'Pedido Bling {{id}} no encontrado.',
      'Commande Bling {{id}} introuvable.',
      lang
    ),
    'proposta.bling.json_build_failed': L(
      'Falha ao montar JSON do pedido: {{detail}}.',
      'Failed to build order JSON: {{detail}}.',
      'Error al montar JSON del pedido: {{detail}}.',
      'Échec de la construction du JSON de commande : {{detail}}.',
      lang
    ),
    'proposta.bling.cliente_not_linked': L(
      'Cliente não vinculado ao Bling.',
      'Customer is not linked to Bling.',
      'Cliente no vinculado a Bling.',
      'Client non lié à Bling.',
      lang
    ),
    'proposta.bling.pedido_not_linked': L(
      'Nenhum pedido Bling vinculado.',
      'No linked Bling order.',
      'Ningún pedido Bling vinculado.',
      'Aucune commande Bling liée.',
      lang
    ),
    'proposta.bling.pedido_already_exists': L(
      'Pedido Bling já existente para esta proposta.',
      'Bling order already exists for this proposal.',
      'Pedido Bling ya existente para esta propuesta.',
      'Commande Bling déjà existante pour cette proposition.',
      lang
    ),
    'proposta.bling.pedido_created': L(
      'Pedido criado na Bling.',
      'Order created in Bling.',
      'Pedido creado en Bling.',
      'Commande créée dans Bling.',
      lang
    ),
    'proposta.bling.pedido_status_required': L(
      'Somente propostas APROVADA podem gerar pedido na Bling. Status: {{status}}',
      'Only APPROVED proposals can create a Bling order. Status: {{status}}',
      'Solo propuestas APROBADA pueden generar pedido en Bling. Estado: {{status}}',
      'Seules les propositions APPROUVÉES peuvent créer une commande Bling. Statut : {{status}}',
      lang
    ),
    'proposta.error.email_send_failed': L(
      'Falha ao enviar e-mail. Verifique as configurações do servidor de e-mail.',
      'Failed to send email. Check mail server settings.',
      'Error al enviar correo. Verifique la configuración del servidor de correo.',
      'Échec de l’envoi de l’e-mail. Vérifiez la configuration du serveur mail.',
      lang
    ),
  };
}

export const PROPOSTA_API_PT_BR = dict('pt');
export const PROPOSTA_API_EN_US = dict('en');
export const PROPOSTA_API_ES_ES = dict('es');
export const PROPOSTA_API_FR_FR = dict('fr');
