import type { TranslationDictionary } from '../translation.service';

/** Textos de diálogos de confirmação (message/header/labels) — usar com translate() + chaves em confirm(). */
export const CONFIRM_DIALOG_PT_BR: TranslationDictionary = {
  'confirm.header.generic': 'Confirmação',
  'confirm.header.inactivate': 'Confirmar Inativação',
  'confirm.header.removeFile': 'Confirmar Remoção',
  'confirm.header.delete': 'Confirmar exclusão',
  'confirm.header.revokeAll': 'Revogar Todas as Permissões',
  'confirm.header.revokeAllShort': 'Revogar Tudo',
  'confirm.header.stockShort': 'Disponibilidade insuficiente',
  'confirm.header.kitDeficit': 'OS com déficit no kit FCU',
  'confirm.header.cancelUpdate': 'Confirmar Cancelamento',
  'confirm.header.duplicateProposal': 'Confirmar Duplicação',
  'confirm.header.cloneProposal': 'Clonar Proposta',
  'confirm.header.closeTicket': 'Confirmar Fechamento',
  'confirm.header.confirm': 'Confirmar',
  'confirm.header.resetPassword': 'Confirmar Redefinição',

  'confirm.action.activateVerb': 'ativar',
  'confirm.action.deactivateVerb': 'inativar',

  'confirm.fabricante.message': 'Tem certeza que deseja inativar o fabricante "{{name}}"?',
  'confirm.fcu.message':
    'Tem certeza que deseja inativar o Produto Aeronáutico "{{name}}"?',
  'confirm.funcionalidade.message': 'Tem certeza que deseja inativar a funcionalidade "{{name}}"?',
  'confirm.perfil.message': 'Tem certeza que deseja inativar o perfil "{{name}}"?',
  'confirm.tipoServico.message': 'Tem certeza que deseja inativar o tipo de serviço "{{name}}"?',
  'confirm.tpfile.message': 'Tem certeza que deseja inativar o tipo de arquivo "{{name}}"?',
  'confirm.fornecedor.message': 'Deseja realmente excluir o fornecedor {{name}}?',
  'confirm.publicacao.message': 'Tem certeza que deseja excluir a publicação "{{name}}"?',
  'confirm.associarPn.message':
    'Deseja remover a associação do produto "{{name}}"?',
  'confirm.associacaoFcu.message':
    'Tem certeza que deseja inativar a associação do produto "{{name}}"?',
  'confirm.os.removeFile.message': 'Tem certeza que deseja remover o arquivo "{{name}}"?',
  'confirm.os.inactivate.message': 'Tem certeza que deseja inativar a OS {{id}}?',

  'confirm.os.stock.intro': 'Um ou mais itens não têm quantidade disponível em estoque:',
  'confirm.os.stock.line':
    '• {{name}} (P/N {{pn}}): disponível {{available}}, solicitado {{requested}}',
  'confirm.os.stock.prompt':
    'Deseja adicioná-los à Solicitação de Troca Eventual mesmo assim?',
  'confirm.yesAddAnyway': 'Sim, adicionar',
  'confirm.yesOpenAnyway': 'Sim, abrir mesmo assim',

  'confirm.os.kit.prefix':
    'Alguns itens do kit deste FCU não têm estoque suficiente para baixa automática:',
  'confirm.os.kit.line':
    '• {{pn}}{{namePart}}: necessário {{required}}, disponível {{available}}, déficit {{deficit}}',
  'confirm.os.kit.suffix':
    'Se você prosseguir, a OS será aberta normalmente e o que for possível será baixado do estoque (modo parcial). Os itens em déficit ficarão registrados na OS para acompanhamento.\n\nDeseja abrir a OS mesmo assim?',

  'confirm.usuario.resetPassword.message': 'Tem certeza que deseja redefinir a senha do usuário "{{name}}"?',
  'confirm.usuario.inactivate.message': 'Tem certeza que deseja inativar o usuário "{{name}}"?',
  'confirm.usuario.revokeDelegation.message': 'Revogar a delegação do código «{{codigo}}»?',

  'confirm.usuarioExterno.toggle': 'Deseja realmente {{action}} o usuário {{nome}}?',
  'confirm.usuarioExterno.actionActivate': 'ativar',
  'confirm.usuarioExterno.actionDeactivate': 'inativar',

  'confirm.config.cancelUpdate.message':
    'Tem certeza que deseja cancelar a atualização? O processo será interrompido.',

  'confirm.proposta.duplicate': 'Deseja duplicar a proposta {{numero}}?',
  'confirm.proposta.delete': 'Deseja realmente excluir a proposta {{numero}}?',
  'confirm.proposta.clone':
    'Deseja clonar a proposta {{numero}}? Uma cópia será criada com todos os dados.',

  'confirm.template.toggle': 'Deseja {{action}} o template "{{name}}"?',

  'confirm.ticket.assume': 'Deseja assumir este chamado?',
  'confirm.ticket.closePermanent': 'Deseja fechar definitivamente este chamado?',

  'confirm.externo.revokeOsPartial':
    'Remover acesso à OS {{id}}? Os documentos permanecerão liberados.',
  'confirm.externo.revokeOsFull':
    'Revogar TODO o acesso à OS {{id}} e TODOS os documentos associados a ela?',
  'confirm.externo.revokeOsWithDocs':
    'Revogar acesso à OS {{id}} e seus {{count}} documento(s)?',
  'confirm.externo.revokeOsOnly': 'Revogar acesso à OS {{id}}?',
  'confirm.externo.revokeDoc': 'Remover acesso ao documento "{{nome}}"?',
  'confirm.yesRevokeAll': 'Sim, Revogar Tudo'
};

export const CONFIRM_DIALOG_EN_US: TranslationDictionary = {
  'confirm.header.generic': 'Confirmation',
  'confirm.header.inactivate': 'Confirm deactivation',
  'confirm.header.removeFile': 'Confirm removal',
  'confirm.header.delete': 'Confirm deletion',
  'confirm.header.revokeAll': 'Revoke all permissions',
  'confirm.header.revokeAllShort': 'Revoke all',
  'confirm.header.stockShort': 'Insufficient availability',
  'confirm.header.kitDeficit': 'Work order with FCU kit shortfall',
  'confirm.header.cancelUpdate': 'Confirm cancellation',
  'confirm.header.duplicateProposal': 'Confirm duplication',
  'confirm.header.cloneProposal': 'Clone proposal',
  'confirm.header.closeTicket': 'Confirm closure',
  'confirm.header.confirm': 'Confirm',
  'confirm.header.resetPassword': 'Confirm password reset',

  'confirm.action.activateVerb': 'activate',
  'confirm.action.deactivateVerb': 'deactivate',

  'confirm.fabricante.message': 'Deactivate manufacturer "{{name}}"?',
  'confirm.fcu.message': 'Deactivate aeronautical product "{{name}}"?',
  'confirm.funcionalidade.message': 'Deactivate feature "{{name}}"?',
  'confirm.perfil.message': 'Deactivate profile "{{name}}"?',
  'confirm.tipoServico.message': 'Deactivate service type "{{name}}"?',
  'confirm.tpfile.message': 'Deactivate file type "{{name}}"?',
  'confirm.fornecedor.message': 'Really delete supplier {{name}}?',
  'confirm.publicacao.message': 'Delete publication "{{name}}"?',
  'confirm.associarPn.message': 'Remove product association "{{name}}"?',
  'confirm.associacaoFcu.message': 'Deactivate product association "{{name}}"?',
  'confirm.os.removeFile.message': 'Remove file "{{name}}"?',
  'confirm.os.inactivate.message': 'Deactivate work order {{id}}?',

  'confirm.os.stock.intro': 'One or more items do not have enough stock:',
  'confirm.os.stock.line':
    '• {{name}} (P/N {{pn}}): available {{available}}, requested {{requested}}',
  'confirm.os.stock.prompt': 'Add them to the occasional exchange request anyway?',
  'confirm.yesAddAnyway': 'Yes, add anyway',
  'confirm.yesOpenAnyway': 'Yes, open anyway',

  'confirm.os.kit.prefix': 'Some items in this FCU kit do not have enough stock for automatic issue:',
  'confirm.os.kit.line':
    '• {{pn}}{{namePart}}: required {{required}}, available {{available}}, deficit {{deficit}}',
  'confirm.os.kit.suffix':
    'If you continue, the work order will be opened normally and whatever is possible will be deducted (partial mode). Short items will remain on the work order for follow-up.\n\nOpen the work order anyway?',

  'confirm.usuario.resetPassword.message': 'Reset password for user "{{name}}"?',
  'confirm.usuario.inactivate.message': 'Deactivate user "{{name}}"?',
  'confirm.usuario.revokeDelegation.message': 'Revoke delegation for code «{{codigo}}»?',

  'confirm.usuarioExterno.toggle': 'Really {{action}} user {{nome}}?',
  'confirm.usuarioExterno.actionActivate': 'activate',
  'confirm.usuarioExterno.actionDeactivate': 'deactivate',

  'confirm.config.cancelUpdate.message':
    'Cancel the update? The process will be stopped.',

  'confirm.proposta.duplicate': 'Duplicate proposal {{numero}}?',
  'confirm.proposta.delete': 'Really delete proposal {{numero}}?',
  'confirm.proposta.clone':
    'Clone proposal {{numero}}? A copy will be created with all data.',

  'confirm.template.toggle': 'Do you want to {{action}} template "{{name}}"?',

  'confirm.ticket.assume': 'Take this ticket?',
  'confirm.ticket.closePermanent': 'Close this ticket permanently?',

  'confirm.externo.revokeOsPartial':
    'Remove access to WO {{id}}? Documents will stay available.',
  'confirm.externo.revokeOsFull':
    'Revoke ALL access to WO {{id}} and ALL related documents?',
  'confirm.externo.revokeOsWithDocs': 'Revoke access to WO {{id}} and its {{count}} document(s)?',
  'confirm.externo.revokeOsOnly': 'Revoke access to WO {{id}}?',
  'confirm.externo.revokeDoc': 'Remove access to document "{{nome}}"?',
  'confirm.yesRevokeAll': 'Yes, revoke all'
};

export const CONFIRM_DIALOG_ES_ES: TranslationDictionary = {
  'confirm.header.generic': 'Confirmación',
  'confirm.header.inactivate': 'Confirmar desactivación',
  'confirm.header.removeFile': 'Confirmar eliminación',
  'confirm.header.delete': 'Confirmar borrado',
  'confirm.header.revokeAll': 'Revocar todos los permisos',
  'confirm.header.revokeAllShort': 'Revocar todo',
  'confirm.header.stockShort': 'Disponibilidad insuficiente',
  'confirm.header.kitDeficit': 'OT con déficit en el kit FCU',
  'confirm.header.cancelUpdate': 'Confirmar cancelación',
  'confirm.header.duplicateProposal': 'Confirmar duplicación',
  'confirm.header.cloneProposal': 'Clonar propuesta',
  'confirm.header.closeTicket': 'Confirmar cierre',
  'confirm.header.confirm': 'Confirmar',
  'confirm.header.resetPassword': 'Confirmar restablecimiento',

  'confirm.action.activateVerb': 'activar',
  'confirm.action.deactivateVerb': 'desactivar',

  'confirm.fabricante.message': '¿Desactivar el fabricante "{{name}}"?',
  'confirm.fcu.message': '¿Desactivar el producto aeronáutico "{{name}}"?',
  'confirm.funcionalidade.message': '¿Desactivar la funcionalidad "{{name}}"?',
  'confirm.perfil.message': '¿Desactivar el perfil "{{name}}"?',
  'confirm.tipoServico.message': '¿Desactivar el tipo de servicio "{{name}}"?',
  'confirm.tpfile.message': '¿Desactivar el tipo de archivo "{{name}}"?',
  'confirm.fornecedor.message': '¿Eliminar realmente el proveedor {{name}}?',
  'confirm.publicacao.message': '¿Eliminar la publicación "{{name}}"?',
  'confirm.associarPn.message': '¿Quitar la asociación del producto "{{name}}"?',
  'confirm.associacaoFcu.message': '¿Desactivar la asociación del producto "{{name}}"?',
  'confirm.os.removeFile.message': '¿Eliminar el archivo "{{name}}"?',
  'confirm.os.inactivate.message': '¿Desactivar la OT {{id}}?',

  'confirm.os.stock.intro': 'Uno o más artículos no tienen stock suficiente:',
  'confirm.os.stock.line':
    '• {{name}} (P/N {{pn}}): disponible {{available}}, solicitado {{requested}}',
  'confirm.os.stock.prompt': '¿Añadirlos igualmente a la solicitud de cambio eventual?',
  'confirm.yesAddAnyway': 'Sí, añadir igualmente',
  'confirm.yesOpenAnyway': 'Sí, abrir igualmente',

  'confirm.os.kit.prefix': 'Algunos ítems del kit FCU no tienen stock suficiente para el descargo automático:',
  'confirm.os.kit.line':
    '• {{pn}}{{namePart}}: necesario {{required}}, disponible {{available}}, déficit {{deficit}}',
  'confirm.os.kit.suffix':
    'Si continúa, la OT se abrirá con normalidad y se descontará lo posible (modo parcial). Los faltantes quedarán registrados.\n\n¿Abrir la OT de todos modos?',

  'confirm.usuario.resetPassword.message': '¿Restablecer la contraseña del usuario "{{name}}"?',
  'confirm.usuario.inactivate.message': '¿Desactivar el usuario "{{name}}"?',
  'confirm.usuario.revokeDelegation.message': '¿Revocar la delegación del código «{{codigo}}»?',

  'confirm.usuarioExterno.toggle': '¿{{action}} realmente al usuario {{nome}}?',
  'confirm.usuarioExterno.actionActivate': 'activar',
  'confirm.usuarioExterno.actionDeactivate': 'desactivar',

  'confirm.config.cancelUpdate.message':
    '¿Cancelar la actualización? El proceso se interrumpirá.',

  'confirm.proposta.duplicate': '¿Duplicar la propuesta {{numero}}?',
  'confirm.proposta.delete': '¿Eliminar realmente la propuesta {{numero}}?',
  'confirm.proposta.clone':
    '¿Clonar la propuesta {{numero}}? Se creará una copia con todos los datos.',

  'confirm.template.toggle': '¿Desea {{action}} la plantilla "{{name}}"?',

  'confirm.ticket.assume': '¿Tomar este ticket?',
  'confirm.ticket.closePermanent': '¿Cerrar definitivamente este ticket?',

  'confirm.externo.revokeOsPartial':
    '¿Quitar acceso a la OT {{id}}? Los documentos seguirán disponibles.',
  'confirm.externo.revokeOsFull':
    '¿Revocar TODO el acceso a la OT {{id}} y TODOS los documentos asociados?',
  'confirm.externo.revokeOsWithDocs': '¿Revocar acceso a la OT {{id}} y sus {{count}} documento(s)?',
  'confirm.externo.revokeOsOnly': '¿Revocar acceso a la OT {{id}}?',
  'confirm.externo.revokeDoc': '¿Quitar acceso al documento "{{nome}}"?',
  'confirm.yesRevokeAll': 'Sí, revocar todo'
};

export const CONFIRM_DIALOG_FR_FR: TranslationDictionary = {
  'confirm.header.generic': 'Confirmation',
  'confirm.header.inactivate': 'Confirmer la désactivation',
  'confirm.header.removeFile': 'Confirmer la suppression',
  'confirm.header.delete': 'Confirmer la suppression',
  'confirm.header.revokeAll': 'Révoquer toutes les autorisations',
  'confirm.header.revokeAllShort': 'Tout révoquer',
  'confirm.header.stockShort': 'Disponibilité insuffisante',
  'confirm.header.kitDeficit': 'OT avec manque sur le kit FCU',
  'confirm.header.cancelUpdate': 'Confirmer l’annulation',
  'confirm.header.duplicateProposal': 'Confirmer la duplication',
  'confirm.header.cloneProposal': 'Cloner la proposition',
  'confirm.header.closeTicket': 'Confirmer la fermeture',
  'confirm.header.confirm': 'Confirmer',
  'confirm.header.resetPassword': 'Confirmer la réinitialisation',

  'confirm.action.activateVerb': 'activer',
  'confirm.action.deactivateVerb': 'désactiver',

  'confirm.fabricante.message': 'Désactiver le fabricant « {{name}} » ?',
  'confirm.fcu.message': 'Désactiver le produit aéronautique « {{name}} » ?',
  'confirm.funcionalidade.message': 'Désactiver la fonctionnalité « {{name}} » ?',
  'confirm.perfil.message': 'Désactiver le profil « {{name}} » ?',
  'confirm.tipoServico.message': 'Désactiver le type de service « {{name}} » ?',
  'confirm.tpfile.message': 'Désactiver le type de fichier « {{name}} » ?',
  'confirm.fornecedor.message': 'Supprimer le fournisseur {{name}} ?',
  'confirm.publicacao.message': 'Supprimer la publication « {{name}} » ?',
  'confirm.associarPn.message': 'Retirer l’association du produit « {{name}} » ?',
  'confirm.associacaoFcu.message': 'Désactiver l’association du produit « {{name}} » ?',
  'confirm.os.removeFile.message': 'Supprimer le fichier « {{name}} » ?',
  'confirm.os.inactivate.message': 'Désactiver l’OT {{id}} ?',

  'confirm.os.stock.intro': 'Un ou plusieurs articles n’ont pas assez de stock :',
  'confirm.os.stock.line':
    '• {{name}} (P/N {{pn}}) : disponible {{available}}, demandé {{requested}}',
  'confirm.os.stock.prompt': 'Les ajouter quand même à la demande d’échange occasionnel ?',
  'confirm.yesAddAnyway': 'Oui, ajouter quand même',
  'confirm.yesOpenAnyway': 'Oui, ouvrir quand même',

  'confirm.os.kit.prefix': 'Certains articles du kit FCU n’ont pas assez de stock pour la sortie automatique :',
  'confirm.os.kit.line':
    '• {{pn}}{{namePart}} : requis {{required}}, disponible {{available}}, déficit {{deficit}}',
  'confirm.os.kit.suffix':
    'Si vous continuez, l’OT sera ouverte normalement et le maximum possible sera déduit (mode partiel). Les manques resteront sur l’OT.\n\nOuvrir l’OT quand même ?',

  'confirm.usuario.resetPassword.message': 'Réinitialiser le mot de passe de « {{name}} » ?',
  'confirm.usuario.inactivate.message': 'Désactiver l’utilisateur « {{name}} » ?',
  'confirm.usuario.revokeDelegation.message': 'Révoquer la délégation du code « {{codigo}} » ?',

  'confirm.usuarioExterno.toggle': '{{action}} vraiment l’utilisateur {{nome}} ?',
  'confirm.usuarioExterno.actionActivate': 'activer',
  'confirm.usuarioExterno.actionDeactivate': 'désactiver',

  'confirm.config.cancelUpdate.message': 'Annuler la mise à jour ? Le processus sera interrompu.',

  'confirm.proposta.duplicate': 'Dupliquer la proposition {{numero}} ?',
  'confirm.proposta.delete': 'Supprimer la proposition {{numero}} ?',
  'confirm.proposta.clone': 'Cloner la proposition {{numero}} ? Une copie sera créée avec toutes les données.',

  'confirm.template.toggle': 'Voulez-vous {{action}} le modèle « {{name}} » ?',

  'confirm.ticket.assume': 'Prendre ce ticket ?',
  'confirm.ticket.closePermanent': 'Fermer définitivement ce ticket ?',

  'confirm.externo.revokeOsPartial':
    'Retirer l’accès à l’OT {{id}} ? Les documents resteront disponibles.',
  'confirm.externo.revokeOsFull':
    'Révoquer TOUT accès à l’OT {{id}} et TOUS les documents associés ?',
  'confirm.externo.revokeOsWithDocs': 'Révoquer l’accès à l’OT {{id}} et ses {{count}} document(s) ?',
  'confirm.externo.revokeOsOnly': 'Révoquer l’accès à l’OT {{id}} ?',
  'confirm.externo.revokeDoc': 'Retirer l’accès au document « {{nome}} » ?',
  'confirm.yesRevokeAll': 'Oui, tout révoquer'
};
