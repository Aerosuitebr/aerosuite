#!/usr/bin/env node
/**
 * Gera blocos ES/FR nativos completos a partir de PT (→ ES) e EN (→ FR),
 * preservando overrides já existentes nos blocos parciais.
 *
 * Run: node scripts/i18n-export-native-gaps.mjs && node scripts/i18n-fill-native-es-fr.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const TARGET_FILES = [
  'frontend/src/app/core/i18n/listings-extended-i18n.ts',
  'frontend/src/app/core/i18n/locale-i18n.ts',
  'frontend/src/app/core/i18n/os-form-i18n.ts',
  'frontend/src/app/core/i18n/screens-misc-i18n.ts'
];

function unquote(literal) {
  if (literal.startsWith("'")) {
    return literal.slice(1, -1).replace(/\\'/g, "'").replace(/\\n/g, '\n');
  }
  if (literal.startsWith('`')) {
    return literal.slice(1, -1).replace(/\\`/g, '`');
  }
  if (literal.startsWith('"')) {
    return literal.slice(1, -1).replace(/\\"/g, '"');
  }
  return literal;
}

function quote(s) {
  if (s.includes('\n')) {
    return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
  }
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function extractEntries(block) {
  const entries = new Map();
  const re = /'([a-zA-Z][a-zA-Z0-9_.-]*)'\s*:\s*('(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*")/g;
  for (const m of block.matchAll(re)) entries.set(m[1], m[2]);
  return entries;
}

function parseBlock(src, suffix) {
  const re = new RegExp(`export const [A-Z0-9_]+${suffix}\\s*:\\s*TranslationDictionary\\s*=\\s*\\{`, 'm');
  const match = re.exec(src);
  if (!match) return null;
  let depth = 1;
  let i = match.index + match[0].length;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  return { start: match.index, end: i, entries: extractEntries(src.slice(match.index, i)) };
}

/** Ordem: frases longas primeiro. */
const PHRASE_FR = [
  ['Showing {first} to {last} of {totalRecords} profiles', 'Affichage de {first} à {last} sur {totalRecords} profils'],
  ['Showing {first} to {last} of {totalRecords} features', 'Affichage de {first} à {last} sur {totalRecords} fonctionnalités'],
  ['Showing {first} to {last} of {totalRecords} manufacturers', 'Affichage de {first} à {last} sur {totalRecords} fabricants'],
  ['Showing {first} to {last} of {totalRecords} users', 'Affichage de {first} à {last} sur {totalRecords} utilisateurs'],
  ['Showing {first} to {last} of {totalRecords} records', 'Affichage de {first} à {last} sur {totalRecords} enregistrements'],
  ['Generated on save', 'Généré à l’enregistrement'],
  ['Work order number', 'Numéro d’ordre de travail'],
  ['Work order files', 'Fichiers de l’ordre de travail'],
  ['View work order', 'Voir l’ordre de travail'],
  ['Edit work order', 'Modifier l’ordre de travail'],
  ['New work order', 'Nouvel ordre de travail'],
  ['Saved work orders', 'Ordres de travail enregistrés'],
  ['No work order found', 'Aucun ordre de travail trouvé'],
  ['Search by number, customer or date...', 'Rechercher par numéro, client ou date…'],
  ['Select this WO', 'Sélectionner cet OT'],
  ['Aeronautical product is required', 'Le produit aéronautique est obligatoire'],
  ['Select aeronautical product', 'Sélectionner un produit aéronautique'],
  ['Aeronautical product', 'Produit aéronautique'],
  ['Article description', 'Description de l’article'],
  ['Service reference', 'Référence du service'],
  ['Eventual exchange request', 'Demande d’échange éventuelle'],
  ['Serial number', 'Numéro de série'],
  ['Registration marks', 'Marques d’immatriculation'],
  ['Engine serial number', 'Numéro de série moteur'],
  ['Service type', 'Type de service'],
  ['Open date', 'Date d’ouverture'],
  ['Completion date', 'Date de fin'],
  ['Service start', 'Début du service'],
  ['Service end', 'Fin du service'],
  ['Close date', 'Date de clôture'],
  ['Revision number', 'Numéro de révision'],
  ['Revision date', 'Date de révision'],
  ['Related service bulletins', 'Bulletins de service connexes'],
  ['Related title', 'Titre connexe'],
  ['Customer name', 'Nom du client'],
  ['Select manufacturer', 'Sélectionner un fabricant'],
  ['Search manufacturer', 'Rechercher un fabricant'],
  ['Select service type', 'Sélectionner le type de service'],
  ['Drag files here or click to select', 'Glissez des fichiers ici ou cliquez pour sélectionner'],
  ['Any file type is accepted', 'Tout type de fichier est accepté'],
  ['Uploading files...', 'Téléversement des fichiers…'],
  ['No files attached to this work order', 'Aucun fichier joint à cet ordre de travail'],
  ['View file', 'Voir le fichier'],
  ['Download file', 'Télécharger le fichier'],
  ['Remove file', 'Retirer le fichier'],
  ['Upload files', 'Téléverser des fichiers'],
  ['Attached files', 'Fichiers joints'],
  ['Add products', 'Ajouter des produits'],
  ['Remove product', 'Retirer le produit'],
  ['Loading products...', 'Chargement des produits…'],
  ['No products linked to this FCU.', 'Aucun produit lié à ce FCU.'],
  ['Products linked to FCU', 'Produits liés au FCU'],
  ['Linked products', 'Produits liés'],
  ['Unnamed product', 'Produit sans nom'],
  ['Quantity in stock:', 'Quantité en stock :'],
  ['Quantity required:', 'Quantité requise :'],
  ['Loading shortage items…', 'Chargement des articles en déficit…'],
  ['No shortage items recorded for this WO.', 'Aucun article en déficit enregistré pour cet OT.'],
  ['Mechanic comment (optional)', 'Commentaire du mécanicien (facultatif)'],
  ['Part number', 'Numéro de pièce'],
  ['Original WO number', 'Numéro d’OT d’origine'],
  ['New profile', 'Nouveau profil'],
  ['Edit profile', 'Modifier le profil'],
  ['New feature', 'Nouvelle fonctionnalité'],
  ['Edit feature', 'Modifier la fonctionnalité'],
  ['Visible in menu', 'Visible dans le menu'],
  ['Icon color', 'Couleur de l’icône'],
  ['Generate Report', 'Générer le rapport'],
  ['Apply Filters', 'Appliquer les filtres'],
  ['Start Date', 'Date de début'],
  ['End Date', 'Date de fin'],
  ['Select the type', 'Sélectionner le type'],
  ['Select the date', 'Sélectionner la date']
];

function ptToEs(text) {
  let s = text;
  const pairs = [
    [/Ordens de Serviço/g, 'Órdenes de servicio'],
    [/Ordem de Serviço/g, 'Orden de servicio'],
    [/ordens de serviço/g, 'órdenes de servicio'],
    [/Usuários Externos/g, 'Usuarios externos'],
    [/Usuário Externo/g, 'Usuario externo'],
    [/Usuários/g, 'Usuarios'],
    [/Usuário/g, 'Usuario'],
    [/usuários/g, 'usuarios'],
    [/usuário/g, 'usuario'],
    [/Número da OS/g, 'Número de la OS'],
    [/Será gerado ao salvar/g, 'Se generará al guardar'],
    [/Selecione o Produto Aeronáutico/g, 'Seleccione el producto aeronáutico'],
    [/Produto Aeronáutico é obrigatório/g, 'El producto aeronáutico es obligatorio'],
    [/Descrição do Artigo/g, 'Descripción del artículo'],
    [/Referência do Serviço/g, 'Referencia del servicio'],
    [/Solicitação de Troca Eventual/g, 'Solicitud de cambio eventual'],
    [/Número de Série/g, 'Número de serie'],
    [/Marcas de Matrícula/g, 'Marcas de matrícula'],
    [/Número de Série do Motor/g, 'Número de serie del motor'],
    [/Tipo de Serviço/g, 'Tipo de servicio'],
    [/Data de Abertura/g, 'Fecha de apertura'],
    [/Data de Conclusão/g, 'Fecha de conclusión'],
    [/Início do Serviço/g, 'Inicio del servicio'],
    [/Fim do Serviço/g, 'Fin del servicio'],
    [/Data de Fechamento/g, 'Fecha de cierre'],
    [/Número da Revisão/g, 'Número de revisión'],
    [/Data da revisão/g, 'Fecha de revisión'],
    [/Boletins de serviço afins/g, 'Boletines de servicio afines'],
    [/Título Afim/g, 'Título afín'],
    [/Nome do cliente/g, 'Nombre del cliente'],
    [/Selecione o fabricante/g, 'Seleccione el fabricante'],
    [/Buscar fabricante/g, 'Buscar fabricante'],
    [/Selecione o tipo de serviço/g, 'Seleccione el tipo de servicio'],
    [/Arquivos da OS/g, 'Archivos de la OS'],
    [/Arraste arquivos aqui ou clique para selecionar/g, 'Arrastre archivos aquí o haga clic para seleccionar'],
    [/Qualquer tipo de arquivo é aceito/g, 'Se acepta cualquier tipo de archivo'],
    [/Enviando arquivos\.\.\./g, 'Enviando archivos…'],
    [/Nenhum arquivo associado a esta OS/g, 'Ningún archivo asociado a esta OS'],
    [/Visualizar arquivo/g, 'Ver archivo'],
    [/Baixar arquivo/g, 'Descargar archivo'],
    [/Remover arquivo/g, 'Eliminar archivo'],
    [/Adicionar produtos/g, 'Añadir productos'],
    [/Remover produto/g, 'Eliminar producto'],
    [/Carregando produtos\.\.\./g, 'Cargando productos…'],
    [/Nenhum produto associado a este FCU\./g, 'Ningún producto asociado a este FCU.'],
    [/Produtos Associados ao FCU/g, 'Productos asociados al FCU'],
    [/Produto sem nome/g, 'Producto sin nombre'],
    [/Quantidade em Estoque:/g, 'Cantidad en stock:'],
    [/Procurar por número, cliente ou data\.\.\./g, 'Buscar por número, cliente o fecha…'],
    [/Selecionar esta OS/g, 'Seleccionar esta OS'],
    [/Ordens salvas no sistema/g, 'Órdenes guardadas en el sistema'],
    [/Carregando itens em déficit…/g, 'Cargando ítems en déficit…'],
    [/Nenhum item em déficit registrado para esta OS\./g, 'Ningún ítem en déficit registrado para esta OS.'],
    [/Mostrando \{first\} a \{last\} de \{totalRecords\} perfis/g, 'Mostrando {first} a {last} de {totalRecords} perfiles'],
    [/Mostrando \{first\} a \{last\} de \{totalRecords\} funcionalidades/g, 'Mostrando {first} a {last} de {totalRecords} funcionalidades'],
    [/Relatórios/g, 'Informes'],
    [/Relatório/g, 'Informe'],
    [/Gerar Relatório/g, 'Generar informe'],
    [/Selecione um relatório/g, 'Seleccione un informe'],
    [/Período/g, 'Período'],
    [/Exportar/g, 'Exportar'],
    [/Filtros/g, 'Filtros'],
    [/Data Início/g, 'Fecha inicio'],
    [/Data Fim/g, 'Fecha fin'],
    [/Aplicar Filtros/g, 'Aplicar filtros'],
    [/Selecione o tipo/g, 'Seleccione el tipo'],
    [/Selecione a data/g, 'Seleccione la fecha'],
    [/Funcionalidade/g, 'Funcionalidad'],
    [/funcionalidade/g, 'funcionalidad'],
    [/Fabricante/g, 'Fabricante'],
    [/Seção/g, 'Sección'],
    [/Posição/g, 'Posición'],
    [/Visível no Menu/g, 'Visible en el menú'],
    [/Cor do Ícone/g, 'Color del icono'],
    [/Código/g, 'Código'],
    [/Novo Perfil/g, 'Nuevo perfil'],
    [/Editar Perfil/g, 'Editar perfil'],
    [/Nova Funcionalidade/g, 'Nueva funcionalidad'],
    [/Editar Funcionalidade/g, 'Editar funcionalidad'],
    [/Erro ao/g, 'Error al'],
    [/ com sucesso/g, ' con éxito'],
    [/ção\b/g, 'ción'],
    [/ções\b/g, 'ciones'],
    [/ã/g, 'á'],
    [/õ/g, 'ó'],
    [/ê/g, 'é']
  ];
  for (const [re, rep] of pairs) s = s.replace(re, rep);
  return s;
}

function enToFr(text) {
  let s = text;
  for (const [en, fr] of PHRASE_FR) {
    if (s === en) return fr;
    s = s.split(en).join(fr);
  }
  const pairs = [
    [/Work order/g, 'Ordre de travail'],
    [/work order/g, 'ordre de travail'],
    [/Work Order/g, 'Ordre de travail'],
    [/Could not/g, 'Impossible de'],
    [/Unable to/g, 'Impossible de'],
    [/Failed to/g, 'Échec de'],
    [/Loading /g, 'Chargement '],
    [/Uploading /g, 'Téléversement '],
    [/Download /g, 'Télécharger '],
    [/Remove /g, 'Retirer '],
    [/Select /g, 'Sélectionner '],
    [/Search /g, 'Rechercher '],
    [/Customer /g, 'Client '],
    [/Manufacturer/g, 'Fabricant'],
    [/Feature/g, 'Fonctionnalité'],
    [/Profile/g, 'Profil'],
    [/Icon/g, 'Icône'],
    [/Section/g, 'Section'],
    [/Position/g, 'Position'],
    [/Route/g, 'Route'],
    [/Order/g, 'Ordre'],
    [/Type/g, 'Type'],
    [/Code/g, 'Code'],
    [/Name/g, 'Nom'],
    [/Date/g, 'Date'],
    [/File/g, 'Fichier'],
    [/Product/g, 'Produit'],
    [/Service/g, 'Service'],
    [/Report/g, 'Rapport'],
    [/Settings/g, 'Paramètres'],
    [/Warning/g, 'Avertissement'],
    [/Error/g, 'Erreur'],
    [/Success/g, 'Succès'],
    [/Required/g, 'Obligatoire'],
    [/Optional/g, 'facultatif'],
    [/Visible/g, 'Visible'],
    [/Menu/g, 'menu'],
    [/Color/g, 'Couleur'],
    [/Number/g, 'Numéro'],
    [/Serial/g, 'Série'],
    [/Engine/g, 'Moteur'],
    [/Revision/g, 'Révision'],
    [/Related/g, 'Connexe'],
    [/Bulletins/g, 'Bulletins'],
    [/Exchange/g, 'Échange'],
    [/Request/g, 'Demande'],
    [/Description/g, 'Description'],
    [/Reference/g, 'Référence'],
    [/Article/g, 'Article'],
    [/Aeronautical/g, 'Aéronautique'],
    [/Generated/g, 'Généré'],
    [/save/g, 'enregistrement'],
    [/Open /g, 'Ouvrir '],
    [/Close /g, 'Fermer '],
    [/Edit /g, 'Modifier '],
    [/New /g, 'Nouveau '],
    [/View /g, 'Voir '],
    [/Add /g, 'Ajouter '],
    [/No /g, 'Aucun '],
    [/None/g, 'Aucun'],
    [/Found/g, 'trouvé'],
    [/found/g, 'trouvé'],
    [/ attached /g, ' joint '],
    [/ linked /g, ' lié '],
    [/ linked/g, ' lié'],
    [/ to /g, ' à '],
    [/ of /g, ' sur '],
    [/ by /g, ' par '],
    [/ or /g, ' ou '],
    [/ and /g, ' et '],
    [/ with /g, ' avec '],
    [/ for /g, ' pour '],
    [/ this /g, ' cet '],
    [/ items/g, ' articles'],
    [/ item/g, ' article'],
    [/ files/g, ' fichiers'],
    [/ file/g, ' fichier'],
    [/ products/g, ' produits'],
    [/ product/g, ' produit']
  ];
  for (const [re, rep] of pairs) s = s.replace(re, rep);
  return s;
}

function renderBlock(entries) {
  const lines = ['export const PLACEHOLDER: TranslationDictionary = {'];
  for (const key of [...entries.keys()].sort()) {
    lines.push(`  '${key}': ${quote(unquote(entries.get(key)))},`);
  }
  lines.push('};');
  return lines.join('\n');
}

function rebuildFile(rel) {
  const filePath = path.join(root, rel);
  let src = fs.readFileSync(filePath, 'utf8');
  const pt = parseBlock(src, '_PT_BR');
  const en = parseBlock(src, '_EN_US');
  const esOld = parseBlock(src, '_ES_ES');
  const frOld = parseBlock(src, '_FR_FR');
  if (!pt || !en || !esOld || !frOld) {
    console.warn(`Skip ${rel} — missing blocks`);
    return { es: 0, fr: 0 };
  }

  const es = new Map();
  const fr = new Map();

  for (const key of pt.entries.keys()) {
    const ptVal = pt.entries.get(key);
    const enVal = en.entries.get(key) || ptVal;
    const esOverride = esOld.entries.get(key);
    const frOverride = frOld.entries.get(key);

    es.set(key, esOverride ?? quote(ptToEs(unquote(ptVal))));
    fr.set(key, frOverride ?? quote(enToFr(unquote(enVal))));
  }

  const esExport = src.match(/export const ([A-Z0-9_]+_ES_ES)/)[1];
  const frExport = src.match(/export const ([A-Z0-9_]+_FR_FR)/)[1];

  const esBlock = renderBlock(es).replace('PLACEHOLDER', esExport);
  const frBlock = renderBlock(fr).replace('PLACEHOLDER', frExport);

  src = src.slice(0, esOld.start) + esBlock + src.slice(esOld.end);
  const frOld2 = parseBlock(src, '_FR_FR');
  src = src.slice(0, frOld2.start) + frBlock + src.slice(frOld2.end);

  fs.writeFileSync(filePath, src);
  return { es: es.size, fr: fr.size };
}

let total = 0;
for (const rel of TARGET_FILES) {
  const r = rebuildFile(rel);
  console.log(`Rebuilt ${rel}: ${r.es} ES, ${r.fr} FR keys`);
  total += r.es + r.fr;
}
console.log(`\nTotal keys written: ${total}`);
