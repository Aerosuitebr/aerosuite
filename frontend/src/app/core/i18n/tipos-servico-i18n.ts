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
    'tiposServico.new.titleNew': L(
      'Novo tipo de serviço',
      'New service type',
      'Nuevo tipo de servicio',
      'Nouveau type de service',
      lang
    ),
    'tiposServico.new.titleEdit': L(
      'Editar tipo de serviço',
      'Edit service type',
      'Editar tipo de servicio',
      'Modifier le type de service',
      lang
    ),
    'tiposServico.new.subtitleNew': L(
      'Cadastre um tipo de serviço para uso nas ordens de serviço.',
      'Register a service type for use on work orders.',
      'Registre un tipo de servicio para usar en las órdenes de servicio.',
      'Enregistrez un type de service pour les ordres de service.',
      lang
    ),
    'tiposServico.new.subtitleEdit': L(
      'Renomeie o tipo de serviço selecionado.',
      'Rename the selected service type.',
      'Renombre el tipo de servicio seleccionado.',
      'Renommez le type de service sélectionné.',
      lang
    ),
    'tiposServico.new.btnSave': L('Salvar', 'Save', 'Guardar', 'Enregistrer', lang),
    'tiposServico.new.btnUpdate': L('Atualizar', 'Update', 'Actualizar', 'Mettre à jour', lang),
    'tiposServico.new.sectionTitle': L(
      'Informações do tipo de serviço',
      'Service type information',
      'Información del tipo de servicio',
      'Informations sur le type de service',
      lang
    ),
    'tiposServico.new.labelNome': L(
      'Nome do tipo de serviço',
      'Service type name',
      'Nombre del tipo de servicio',
      'Nom du type de service',
      lang
    ),
    'tiposServico.new.placeholderNome': L(
      'Digite o nome do tipo de serviço',
      'Enter the service type name',
      'Escriba el nombre del tipo de servicio',
      'Saisissez le nom du type de service',
      lang
    ),
    'tiposServico.new.errorNomeRequired': L(
      'O nome do tipo de serviço é obrigatório',
      'Service type name is required',
      'El nombre del tipo de servicio es obligatorio',
      'Le nom du type de service est obligatoire',
      lang
    ),
    'tiposServico.new.labelNomeAtual': L(
      'Tipo de serviço atual',
      'Current service type',
      'Tipo de servicio actual',
      'Type de service actuel',
      lang
    ),
    'tiposServico.new.labelNovoNome': L(
      'Novo tipo de serviço',
      'New service type',
      'Nuevo tipo de servicio',
      'Nouveau type de service',
      lang
    ),
    'tiposServico.new.placeholderNovoNome': L(
      'Digite o nome do novo tipo de serviço',
      'Enter the new service type name',
      'Escriba el nombre del nuevo tipo de servicio',
      'Saisissez le nom du nouveau type de service',
      lang
    ),
    'tiposServico.new.errorNovoNomeRequired': L(
      'Por favor, digite o nome do novo tipo de serviço',
      'Please enter the new service type name',
      'Por favor, escriba el nombre del nuevo tipo de servicio',
      'Veuillez saisir le nom du nouveau type de service',
      lang
    ),
    'tiposServico.new.infoSubstituicao': L(
      'O tipo de serviço atual será substituído pelo novo nome digitado',
      'The current service type will be replaced by the new name entered',
      'El tipo de servicio actual será reemplazado por el nuevo nombre ingresado',
      'Le type de service actuel sera remplacé par le nouveau nom saisi',
      lang
    ),
    'tiposServico.list.searchNome': L(
      'Buscar nome',
      'Search name',
      'Buscar nombre',
      'Rechercher un nom',
      lang
    )
  };
}

export const TIPOS_SERVICO_PT_BR = dict('pt');
export const TIPOS_SERVICO_EN_US = dict('en');
export const TIPOS_SERVICO_ES_ES = dict('es');
export const TIPOS_SERVICO_FR_FR = dict('fr');
