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
    'os.crs.dialogTitle': L('Liberação para serviço (CRS)', 'Release to service (CRS)', 'Liberación para servicio (CRS)', 'Remise en service (CRS)', lang),
    'os.crs.dialogSubtitle': L('OS #{{numero}}', 'WO #{{numero}}', 'OS #{{numero}}', 'OS #{{numero}}', lang),
    'os.crs.btnOpen': L('Emitir CRS', 'Issue CRS', 'Emitir CRS', 'Émettre CRS', lang),
    'os.crs.btnEmit': L('Confirmar liberação', 'Confirm release', 'Confirmar liberación', 'Confirmer la libération', lang),
    'os.crs.btnPdf': L('Baixar PDF do CRS', 'Download CRS PDF', 'Descargar PDF CRS', 'Télécharger PDF CRS', lang),
    'os.crs.field.nome': L('Nome do responsável', 'Responsible name', 'Nombre del responsable', 'Nom du responsable', lang),
    'os.crs.field.cargo': L('Função / habilitação', 'Role / authorization', 'Función / habilitación', 'Fonction / habilitation', lang),
    'os.crs.field.cert': L('Nº do certificado (opcional)', 'Certificate no. (optional)', 'Nº certificado (opcional)', 'Nº certificat (facultatif)', lang),
    'os.crs.field.obs': L('Observações / ressalvas', 'Remarks / limitations', 'Observaciones / reservas', 'Observations / réserves', lang),
    'os.crs.checklistTitle': L('Checklist obrigatório', 'Required checklist', 'Lista obligatoria', 'Liste obligatoire', lang),
    'os.crs.alreadyIssued': L('CRS já emitido em {{data}}', 'CRS already issued on {{data}}', 'CRS ya emitido el {{data}}', 'CRS déjà émis le {{data}}', lang),
    'os.crs.toast.emitOk': L('CRS emitido com sucesso.', 'CRS issued successfully.', 'CRS emitido correctamente.', 'CRS émis avec succès.', lang),
    'os.crs.toast.emitFail': L('Não foi possível emitir o CRS.', 'Could not issue CRS.', 'No se pudo emitir el CRS.', 'Impossible d’émettre le CRS.', lang),
    'os.crs.toast.pdfFail': L('Falha ao baixar o PDF do CRS.', 'Failed to download CRS PDF.', 'Error al descargar el PDF CRS.', 'Échec du téléchargement du PDF CRS.', lang),
    'os.crs.toast.checklist': L('Marque todos os itens do checklist.', 'Check all checklist items.', 'Marque todos los ítems.', 'Cochez tous les éléments.', lang),
    'os.crs.toast.noPermission': L(
      'Seu perfil não permite emitir CRS. Solicite o perfil Inspetor ou Responsável técnico.',
      'Your profile cannot issue CRS. Request Inspector or Accountable Manager profile.',
      'Su perfil no permite emitir CRS. Solicite perfil Inspector o Responsable técnico.',
      'Votre profil ne permet pas d’émettre le CRS. Demandez le profil Inspecteur ou Responsable technique.',
      lang
    ),
    'crs.error.segregation.executor': L(
      'Quem executou ou alterou esta OS não pode emitir o CRS. Outro profil autorizado deve liberar.',
      'Anyone who executed or changed this work order cannot issue the CRS. Another authorized profile must release.',
      'Quien ejecutó o modificó esta OS no puede emitir el CRS. Otro perfil autorizado debe liberar.',
      'La personne ayant exécuté ou modifié cette OS ne peut pas émettre le CRS. Un autre profil autorisé doit libérer.',
      lang
    ),
    'crs.error.habilitacao.invalida': L(
      'É necessária habilitação técnica válida (RT ou inspetor) para emitir o CRS.',
      'A valid technical authorization (AM or inspector) is required to issue the CRS.',
      'Se requiere habilitación técnica válida (RT o inspector) para emitir el CRS.',
      'Une habilitation technique valide (RT ou inspecteur) est requise pour émettre le CRS.',
      lang
    ),
    'crs.error.ja_emitido': L(
      'CRS já foi emitido para esta OS.',
      'CRS has already been issued for this work order.',
      'El CRS ya fue emitido para esta OS.',
      'Le CRS a déjà été émis pour cette OS.',
      lang
    ),
    'crs.error.checklist_incompleto': L(
      'Confirme todos os itens do checklist.',
      'Confirm all checklist items.',
      'Confirme todos los ítems del checklist.',
      'Confirmez tous les éléments de la liste.',
      lang
    ),
    'crs.error.nome_obrigatorio': L(
      'Informe o nome do responsável pela liberação.',
      'Enter the name of the person releasing to service.',
      'Indique el nombre del responsable de la liberación.',
      'Indiquez le nom du responsable de la remise en service.',
      lang
    ),
    'crs.error.cargo_obrigatorio': L(
      'Informe a função ou habilitação do responsável.',
      'Enter the role or authorization of the responsible person.',
      'Indique la función o habilitación del responsable.',
      'Indiquez la fonction ou l\'habilitation du responsable.',
      lang
    ),
    'crs.error.checklist_invalido': L(
      'Checklist inválido. Recarregue a tela e tente novamente.',
      'Invalid checklist. Reload the page and try again.',
      'Checklist inválido. Recargue la pantalla e intente de nuevo.',
      'Liste invalide. Rechargez la page et réessayez.',
      lang
    ),
    'crs.error.payload_vazio': L(
      'Dados da emissão não enviados.',
      'Release data was not sent.',
      'No se enviaron los datos de emisión.',
      'Données d\'émission non envoyées.',
      lang
    )
  };
}

export const OS_CRS_PT_BR = dict('pt');
export const OS_CRS_EN_US = dict('en');
export const OS_CRS_ES_ES = dict('es');
export const OS_CRS_FR_FR = dict('fr');
