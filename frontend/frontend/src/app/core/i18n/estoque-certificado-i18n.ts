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

function withCertificadoAliases(base: TranslationDictionary): TranslationDictionary {
  const out: TranslationDictionary = { ...base };
  for (const key of Object.keys(base)) {
    if (key.startsWith('estoque.cert.error.')) {
      out[key.replace('estoque.cert.', 'estoque.certificado.')] = base[key];
    }
  }
  return out;
}

function dict(lang: 'pt' | 'en' | 'es' | 'fr'): TranslationDictionary {
  return withCertificadoAliases({
    'estoque.cert.tipo': L('Tipo de certificado', 'Certificate type', 'Tipo de certificado', 'Type de certificat', lang),
    'estoque.cert.tipo.FAA_8130_3': L('FAA 8130-3', 'FAA 8130-3', 'FAA 8130-3', 'FAA 8130-3', lang),
    'estoque.cert.tipo.EASA_FORM1': L('EASA Form 1', 'EASA Form 1', 'EASA Form 1', 'EASA Form 1', lang),
    'estoque.cert.tipo.ANAC': L('ANAC / RBAC', 'ANAC / RBAC', 'ANAC / RBAC', 'ANAC / RBAC', lang),
    'estoque.cert.tipo.DUAL_RELEASE': L('Dual release', 'Dual release', 'Dual release', 'Double libération', lang),
    'estoque.cert.tipo.OUTRO': L('Outro', 'Other', 'Otro', 'Autre', lang),
    'estoque.cert.numero': L('Número do certificado', 'Certificate number', 'Número del certificado', 'Numéro du certificat', lang),
    'estoque.cert.emissor': L('Emissor / signatário', 'Issuer / signatory', 'Emisor / firmante', 'Émetteur / signataire', lang),
    'estoque.cert.dataEmissao': L('Data de emissão', 'Issue date', 'Fecha de emisión', 'Date d’émission', lang),
    'estoque.cert.dataValidade': L('Data de validade', 'Expiry date', 'Fecha de validez', 'Date de validité', lang),
    'estoque.cert.orgao': L('Órgão de aprovação', 'Approving authority', 'Organismo de aprobación', 'Autorité d’approbation', lang),
    'estoque.cert.anexo': L('Anexo (PDF ou imagem)', 'Attachment (PDF or image)', 'Anexo (PDF o imagen)', 'Pièce jointe (PDF ou image)', lang),
    'estoque.cert.anexoHint': L(
      'Obrigatório para saída em OS quando a organização exige certificado completo.',
      'Required for WO issue when your organization requires a complete certificate.',
      'Obligatorio para salida en OS cuando la organización exige certificado completo.',
      'Obligatoire pour la sortie OS lorsque l’organisation exige un certificat complet.',
      lang
    ),
    'estoque.cert.completo': L('Certificado completo', 'Certificate complete', 'Certificado completo', 'Certificat complet', lang),
    'estoque.cert.incompleto': L('Certificado incompleto', 'Certificate incomplete', 'Certificado incompleto', 'Certificat incomplet', lang),
    'estoque.cert.btn.editar': L('Certificado de peça', 'Part certificate', 'Certificado de pieza', 'Certificat pièce', lang),
    'estoque.cert.btn.salvar': L('Salvar certificado', 'Save certificate', 'Guardar certificado', 'Enregistrer le certificat', lang),
    'estoque.cert.btn.baixarAnexo': L('Baixar anexo', 'Download attachment', 'Descargar anexo', 'Télécharger la pièce jointe', lang),
    'estoque.cert.toast.salvo': L('Certificado atualizado.', 'Certificate updated.', 'Certificado actualizado.', 'Certificat mis à jour.', lang),
    'estoque.cert.toast.anexoOk': L('Anexo enviado.', 'Attachment uploaded.', 'Anexo enviado.', 'Pièce jointe envoyée.', lang),
    'estoque.cert.error.incompleto_saida': L(
      'Saída bloqueada: complete o certificado (tipo, número e anexo) antes de consumir na OS.',
      'Issue blocked: complete the certificate (type, number and attachment) before WO consumption.',
      'Salida bloqueada: complete el certificado (tipo, número y anexo) antes del consumo en la OS.',
      'Sortie bloquée : complétez le certificat (type, numéro et pièce jointe) avant la consommation OS.',
      lang
    ),
    'estoque.cert.error.corpo_obrigatorio': L(
      'Dados do certificado obrigatórios.',
      'Certificate data required.',
      'Datos del certificado obligatorios.',
      'Données du certificat obligatoires.',
      lang
    ),
    'estoque.cert.error.anexo_obrigatorio': L(
      'Envie o anexo do certificado.',
      'Upload the certificate attachment.',
      'Envíe el anexo del certificado.',
      'Envoyez la pièce jointe du certificat.',
      lang
    ),
    'estoque.cert.error.tipo_arquivo': L('Use PDF, JPEG ou PNG.', 'Use PDF, JPEG or PNG.', 'Use PDF, JPEG o PNG.', 'Utilisez PDF, JPEG ou PNG.', lang),
    'estoque.cert.error.arquivo_grande': L(
      'Arquivo muito grande (máx. 15 MB).',
      'File too large (max 15 MB).',
      'Archivo demasiado grande (máx. 15 MB).',
      'Fichier trop volumineux (max. 15 Mo).',
      lang
    ),
    'estoque.cert.error.upload_falhou': L(
      'Falha ao enviar anexo.',
      'Failed to upload attachment.',
      'Error al enviar anexo.',
      'Échec de l’envoi de la pièce jointe.',
      lang
    ),
    'estoque.cert.error.sem_anexo': L(
      'Nenhum anexo cadastrado.',
      'No attachment on file.',
      'Sin anexo registrado.',
      'Aucune pièce jointe enregistrée.',
      lang
    )
  });
}

export const ESTOQUE_CERTIFICADO_PT_BR = dict('pt');
export const ESTOQUE_CERTIFICADO_EN_US = dict('en');
export const ESTOQUE_CERTIFICADO_ES_ES = dict('es');
export const ESTOQUE_CERTIFICADO_FR_FR = dict('fr');
