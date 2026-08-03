import fs from 'fs';

const { keys } = JSON.parse(
  fs.readFileSync('frontend/src/app/core/i18n/.page-help-keys.json', 'utf8')
);

/** Tradução heurística PT → EN/ES/FR para textos de ajuda (revisão pontual se necessário). */
function tr(pt, lang) {
  let s = pt;
  const maps = {
    en: [
      [/Como usar a página de (.+)/g, 'How to use the $1 page'],
      [/Visão Geral/g, 'Overview'],
      [/Recursos Disponíveis/g, 'Available features'],
      [/Passos para /g, 'Steps to '],
      [/Dicas e Boas Práticas/g, 'Tips and best practices'],
      [/Gerenciando /g, 'Managing '],
      [/Ativando e Desativando /g, 'Activating and deactivating '],
      [/você/g, 'you'],
      [/Você/g, 'You'],
      [/clique em/g, 'click'],
      [/Clique em/g, 'Click'],
      [/Salvar Todas/g, 'Save all'],
      [/Restaurar Padrões/g, 'Restore defaults'],
      [/Novo /g, 'New '],
      [/Nova /g, 'New '],
      [/inativar/g, 'deactivate'],
      [/Inativar/g, 'Deactivate'],
      [/editar/g, 'edit'],
      [/visualizar/g, 'view'],
      [/busca/g, 'search'],
      [/Busca/g, 'Search'],
      [/filtros/g, 'filters'],
      [/Filtros/g, 'Filters'],
      [/configurações/g, 'settings'],
      [/Configurações/g, 'Settings'],
      [/usuários/g, 'users'],
      [/Usuários/g, 'Users'],
      [/produtos/g, 'products'],
      [/Produtos/g, 'Products'],
      [/fabricantes/g, 'manufacturers'],
      [/Fabricantes/g, 'Manufacturers'],
      [/ordens de serviço/g, 'work orders'],
      [/Ordens de Serviço/g, 'Work orders'],
      [/permissões/g, 'permissions'],
      [/Permissões/g, 'Permissions'],
      [/portal externo/g, 'external portal'],
      [/Portal Externo/g, 'External portal'],
      [/propostas comerciais/g, 'commercial proposals'],
      [/Propostas Comerciais/g, 'Commercial proposals'],
      [/backup/g, 'backup'],
      [/Backup/g, 'Backup'],
      [/painel inicial/g, 'home dashboard'],
      [/Painel Inicial/g, 'Home dashboard'],
    ],
    es: [
      [/Como usar a página de (.+)/g, 'Cómo usar la página de $1'],
      [/Visão Geral/g, 'Visión general'],
      [/Recursos Disponíveis/g, 'Recursos disponibles'],
      [/Passos para /g, 'Pasos para '],
      [/Dicas e Boas Práticas/g, 'Consejos y buenas prácticas'],
      [/você/g, 'usted'],
      [/Você/g, 'Usted'],
      [/clique em/g, 'haga clic en'],
      [/Clique em/g, 'Haga clic en'],
      [/Salvar Todas/g, 'Guardar todo'],
      [/Restaurar Padrões/g, 'Restaurar valores predeterminados'],
      [/Novo /g, 'Nuevo '],
      [/Nova /g, 'Nueva '],
      [/inativar/g, 'desactivar'],
      [/Inativar/g, 'Desactivar'],
      [/configurações/g, 'configuración'],
      [/Configurações/g, 'Configuración'],
      [/usuários/g, 'usuarios'],
      [/Usuários/g, 'Usuarios'],
      [/produtos/g, 'productos'],
      [/Produtos/g, 'Productos'],
      [/fabricantes/g, 'fabricantes'],
      [/Fabricantes/g, 'Fabricantes'],
      [/ordens de serviço/g, 'órdenes de servicio'],
      [/Ordens de Serviço/g, 'Órdenes de servicio'],
      [/portal externo/g, 'portal externo'],
      [/Portal Externo/g, 'Portal externo'],
      [/propostas comerciais/g, 'propuestas comerciales'],
      [/Propostas Comerciais/g, 'Propuestas comerciales'],
    ],
    fr: [
      [/Como usar a página de (.+)/g, 'Comment utiliser la page $1'],
      [/Visão Geral/g, 'Vue d’ensemble'],
      [/Recursos Disponíveis/g, 'Fonctionnalités disponibles'],
      [/Passos para /g, 'Étapes pour '],
      [/Dicas e Boas Práticas/g, 'Conseils et bonnes pratiques'],
      [/você/g, 'vous'],
      [/Você/g, 'Vous'],
      [/clique em/g, 'cliquez sur'],
      [/Clique em/g, 'Cliquez sur'],
      [/Salvar Todas/g, 'Tout enregistrer'],
      [/Restaurar Padrões/g, 'Restaurer les valeurs par défaut'],
      [/Novo /g, 'Nouveau '],
      [/Nova /g, 'Nouvelle '],
      [/inativar/g, 'désactiver'],
      [/Inativar/g, 'Désactiver'],
      [/configurações/g, 'paramètres'],
      [/Configurações/g, 'Paramètres'],
      [/usuários/g, 'utilisateurs'],
      [/Usuários/g, 'Utilisateurs'],
      [/produtos/g, 'produits'],
      [/Produtos/g, 'Produits'],
      [/fabricantes/g, 'fabricants'],
      [/Fabricantes/g, 'Fabricants'],
      [/ordens de serviço/g, 'ordres de service'],
      [/Ordens de Serviço/g, 'Ordres de service'],
      [/portal externo/g, 'portail externe'],
      [/Portal Externo/g, 'Portail externe'],
      [/propostas comerciais/g, 'propositions commerciales'],
      [/Propostas Comerciais/g, 'Propositions commerciales'],
    ],
  };
  for (const [re, rep] of maps[lang]) {
    s = s.replace(re, rep);
  }
  return s;
}

const out = { en: {}, es: {}, fr: {} };
for (const [k, pt] of Object.entries(keys)) {
  out.en[k] = tr(pt, 'en');
  out.es[k] = tr(pt, 'es');
  out.fr[k] = tr(pt, 'fr');
}

fs.writeFileSync(
  'frontend/src/app/core/i18n/page-help-translations.json',
  JSON.stringify(out, null, 2)
);
console.log(`page-help-translations.json: ${Object.keys(keys).length} keys x 3 langs`);
