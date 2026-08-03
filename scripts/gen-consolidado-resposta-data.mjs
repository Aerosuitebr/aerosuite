#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'docs/homolog_ux/relatorio-resposta-consolidado-v2-data.mjs');

const items = [
  ['A1', '1', 'CRITICO', 'Conformidade', 'Campos sem limite de caracteres', 'Texto extrapola e falha silenciosa', 'FieldLengthValidator + maxlength UI + mensagens i18n', 'Salvar AD/SB com texto > limite → erro 400 legível'],
  ['A2', '1', 'CRITICO', 'Login', 'Organização duplicada no dropdown', 'Mesma org repetida', 'TenantLoginService label + dedup; wizard Voltar ao login', 'Login multi-tenant sem duplicatas'],
  ['A3', '1', 'CRITICO', 'Wizard', 'Sem redirect após conclusão', 'Usuário fica perdido', 'Tela completed + redirect 2,5s + invalidateStatusCache', 'Concluir wizard → dashboard'],
  ['A4', '1', 'CRITICO', 'Produtos', 'P/N duplicado e barcode desvinculado', 'Barcode por ID', 'Unicidade P/N + CodigoBarrasUtil.gerarCodigoBarrasPorPn', 'Dois produtos mesmo P/N bloqueados; barcode estável por P/N'],
  ['A5', '1', 'CRITICO', 'Produtos', 'Imagem removida ao editar', 'photoUrl sobrescrito', 'ProductMapper ignora photoUrl/codigoBarras no update', 'Editar nome mantém foto'],
  ['A6', '2', 'ALTO', 'Go-live', 'CSV sem BOM UTF-8', 'Acentos corrompidos', 'GoLiveMigracaoResource BOM no download', 'Baixar template → UTF-8 correto'],
  ['A7', '2', 'ALTO', 'Wizard', 'Telefone aceita letras', 'Validação fraca', 'formatPhoneBr + isValidPhoneBr', 'Campo telefone só dígitos formatados'],
  ['A8', '2', 'ALTO', 'Conformidade', 'Textareas sem limite', 'Mesmo A1', 'maxlength + backend FieldLengthValidator', 'Campos conformidade respeitam limite'],
  ['A9', '2', 'ALTO', 'Produtos', 'Fabricante inexistente', 'Sem cadastro rápido', 'Dialog quick-create fabricante em product-new', 'Criar fabricante inline'],
  ['A10', '2', 'ALTO', 'Relatórios', 'Dados fictícios', 'Hardcoded demo', 'RelatorioAnalyticsService + API real + empty state', 'Gráficos com dados do tenant'],
  ['A11', '2', 'ALTO', 'Produtos', 'Textarea extrapola layout', 'CSS overflow', 'product-textarea max-width/overflow-wrap', 'Descrição longa não quebra layout'],
  ['A12', '2', 'ALTO', 'Relatórios/Go-live', 'Layout não responsivo', 'Mobile quebrado', 'SCSS responsivo relatorios.component', 'Redimensionar janela'],
  ['A13', '2', 'ALTO', 'AD/SB', 'FCU com spinner numérico', 'UX ruim', 'p-autoComplete FCU com busca', 'Selecionar FCU por código'],
  ['A14', '2', 'ALTO', 'Produtos', 'USD/BRL confuso', 'Sem contexto', 'localeMoney + footnote BCB na listagem', 'Rodapé cotação visível'],
  ['A15', '2', 'ALTO', 'Produtos', 'Ícone lixeira para inativar', 'Semântica errada', 'pi-ban + confirmação inativar', 'Botão inativar com ícone correto'],
  ['A16', '2', 'ALTO', 'Produtos', 'Upload sem preview/remoção', 'UX incompleta', 'Preview upload + remover imagem existente', 'Selecionar foto → preview; remover'],
  ['A17', '2', 'ALTO', 'Produtos', 'Busca por barcode', 'Não encontrava', 'ProductService busca codigoBarras', 'Buscar EAN-13'],
  ['A18', '2', 'ALTO', 'Wizard', 'CPF na revisão', 'Dado sensível exposto', 'maskCpfInRazaoSocial na revisão', 'Revisão sem CPF trailing'],
  ['A19', '2', 'ALTO', 'Produtos', 'Busca por data ambígua', 'Formatos diversos', 'normalizeDateSearchTerm + parseSearchDate backend', 'Buscar 10062026 ou 10.06.2026'],
  ['A20', '2', 'ALTO', 'SGQ', 'Item 00 no dropdown tipo', 'Dado inválido', 'Whitelist SGQ_TIPOS_VALIDOS + appendTo body', 'Dropdown só tipos válidos'],
  ['A21', '2', 'ALTO', 'Relatórios', 'Gráfico híbrido incorreto', 'Donut+bar misturado', 'Donut e bar separados com dados reais', 'Dois gráficos distintos'],
  ['A22', '2', 'ALTO', 'Global', 'Data rodapé maiúscula', 'Preposições erradas', 'formatFooterDate locale-currency', 'Rodapé pt: de junho de'],
  ['A23', '3', 'MEDIO', 'Wizard', 'Hint CNPJ informal', 'Tom coloquial', 'Texto i18n formal A23', 'Hint CNPJ revisado'],
  ['A24', '3', 'MEDIO', 'Wizard', 'Textos endereço', 'Travessão informal', 'section.address.lead atualizado', 'Instruções endereço revisadas'],
  ['A25', '3', 'MEDIO', 'Wizard', 'Endereço caixa alta', 'Inconsistente', 'formatBrTitleCase em CEP/CNPJ lookup', 'Bairro/cidade Title Case'],
  ['A26', '3', 'MEDIO', 'Wizard', 'Toast CNPJ duplicado', 'Double fire', 'Debounce 850ms + guard inFlight + lastNotFound', 'CNPJ inválido → 1 toast'],
  ['A27', '3', 'MEDIO', 'Wizard', 'Checkbox linguagem', 'autorizo gravar', 'confirm.label formal', 'Texto declaração oficial'],
  ['A28', '3', 'MEDIO', 'Wizard', 'Termo backend na revisão', 'Jargão dev', 'review.intro sem backend', 'Texto usuário final'],
  ['A29', '3', 'MEDIO', 'Wizard', 'Pontuação revisão', 'Separadores', 'displayAddressLine getter', 'Endereço formatado consistente'],
  ['A30', '3', 'MEDIO', 'Produtos', 'No results fabricante', 'Empty confuso', 'Dropdown fabricantes + quick add', 'Lista fabricantes populada'],
  ['A31', '3', 'MEDIO', 'Produtos', 'Cursor preço', 'Grouping', 'useGrouping false no preço', 'Digitar preço sem salto cursor'],
  ['A32', '3', 'MEDIO', 'Produtos', 'Foto na listagem', 'Thumbnails', 'Photo cache + modal upload listagem', 'Coluna foto funcional'],
  ['A33', '3', 'MEDIO', 'Produtos', 'Specs aeronáuticas', 'Campos genéricos', 'Seção specs peso/dimensões/material', 'Formulário specs visível'],
  ['A34', '3', 'MEDIO', 'Produtos', 'Cotação BCB desatualizada', 'Footnote', 'localeCurrency footnote dinâmico', 'Footnote data cotação'],
  ['A35', '3', 'MEDIO', 'Produtos', 'Filtro ativo/inativo', 'Só ativos', 'Dropdown status + isActive tri-state API', 'Filtrar inativos/todos'],
  ['A36', '3', 'MEDIO', 'Produtos', 'Barcode Code128', 'Formato', 'JsBarcode CODE128/EAN13 na impressão', 'Imprimir código legível'],
  ['A37', '3', 'MEDIO', 'Produtos', 'Print manual', 'Sem auto-print', 'window.print onload no printBarcode', 'Impressão abre diálogo auto'],
  ['A38', '3', 'MEDIO', 'Produtos', 'Empty state', 'Lista vazia', 'ListDataStatesComponent + CTA novo', 'Lista vazia com botão'],
  ['A39', '3', 'MEDIO', 'Conformidade', 'Textarea borda', 'Estilo global', '_premium-a11y.scss textarea focus', 'Borda visível em textareas'],
  ['A40', '3', 'MEDIO', 'Conformidade', 'AD/SB sem tradução', 'Siglas fixas', 'aero.diretriz.tipo i18n AD/SB/OUTRO', 'Trocar idioma → labels traduzidos'],
  ['A41', '3', 'MEDIO', 'Conformidade', 'Painel uso longo', 'Scroll excessivo', 'usage-panel recolhível CSS', 'Painel conformidade compacto'],
  ['A42', '3', 'MEDIO', 'Conformidade', 'Alertas pouco visíveis', 'Cards métricas', 'metric-grid alertas clicáveis', 'Cards vencidas/próximas'],
  ['A43', '3', 'MEDIO', 'Conformidade', 'Cards sem cor', 'Hierarquia', 'severity colors danger/warn/info', 'Cards coloridos por severidade'],
  ['A44', '3', 'MEDIO', 'Conformidade', 'Habilitações layout', 'Espaçamento', 'Field limits + list scroll', 'Lista habilitações alinhada'],
  ['A45', '3', 'MEDIO', 'Go-live', 'Banner trial', 'Contexto trial', 'Banner i18n go-live trial', 'Banner visível no kit'],
  ['A46', '3', 'MEDIO', 'Go-live', 'Linguagem técnica', 'Jargão', 'go-live-migracao-i18n revisado', 'Textos go-live claros'],
  ['A47', '3', 'MEDIO', 'Go-live', 'Breadcrumb módulo', 'Perde contexto', 'Links checklist com query returnUrl', 'Abrir módulo mantém checklist'],
  ['A48', '3', 'MEDIO', 'Go-live', 'Download sem feedback', 'Spinner ausente', 'Indicador loading download template', 'Download mostra progresso'],
  ['A49', '3', 'MEDIO', 'Menu', 'Estrutura i18n', 'Itens variam', 'menu-i18n chaves estáveis 4 idiomas', 'Menu PT/EN/ES/FR consistente'],
  ['A50', '4', 'POSITIVO', 'Global', 'Login claro', 'Tela de entrada premium', 'Comportamento mantido', 'Tela login premium'],
  ['A51', '4', 'POSITIVO', 'Wizard', 'Progresso etapas', 'Stepper claro', 'Stepper mantido', '4 etapas visíveis'],
  ['A52', '4', 'POSITIVO', 'Wizard', 'Validação inline', 'Erros por campo', 'fieldErrors mantidos', 'Erros por campo'],
  ['A53', '4', 'POSITIVO', 'Global', 'Menu modular', 'Sidebar intuitiva', 'Sidebar mantida', 'Navegação intuitiva'],
  ['A54', '4', 'POSITIVO', 'Conformidade', 'Painel métricas', 'Cards alertas', 'Cards alertas mantidos', 'Métricas conformidade'],
  ['A55', '4', 'POSITIVO', 'Habilitações', 'Subtítulo claro', 'Hero informativo', 'Page hero mantido', 'Subtítulo informativo'],
  ['A56', '4', 'POSITIVO', 'Produtos', 'Modal barcode', 'Zoom código', 'Barcode modal mantido', 'Zoom código barras'],
  ['A57', '4', 'POSITIVO', 'Global', 'Confirmação inativar', 'Modal antes ação', 'p-confirmDialog mantido', 'Modal antes inativar'],
  ['A58', '4', 'POSITIVO', 'SGQ', 'Tipos aeronáuticos', 'MOE/POP adequados', 'Tipos mantidos', 'Tipos adequados'],
  ['A59', '4', 'POSITIVO', 'Relatórios', 'Export CSV', 'Export funcional', 'Export CSV BOM mantido', 'Baixar CSV relatório'],
  ['A60', '4', 'POSITIVO', 'Global', 'i18n 4 idiomas', 'PT/EN/ES/FR', 'TranslationService mantido', 'Trocar idioma'],
  ['A61', '4', 'POSITIVO', 'Global', 'Sistema online', 'Indicador rodapé', 'Footer indicator mantido', 'Rodapé online'],
];

const SECTIONS = [
  { id: '1', title: 'Críticos — Login, Wizard e Produtos', intro: 'Achados A1–A5 de severidade crítica.' },
  { id: '2', title: 'Altos — Produtos, Conformidade e Relatórios', intro: 'Achados A6–A22 prioridade P1/P2.' },
  { id: '3', title: 'Médios — UX, i18n e Go-live', intro: 'Achados A23–A49 qualidade e consistência.' },
  { id: '4', title: 'Positivos — Mantidos', intro: 'Achados A50–A61 referência de qualidade.' },
];

const META = {
  title: 'Resposta Técnica — Homologação UX Relatório Consolidado v2.0',
  subtitle: 'Retorno formal aos 61 achados (A1–A61) do Relatório Consolidado (15/jun/2026)',
  reference: 'Relatório AeroSuite Consolidado v2.0 — Rafaella Nottes Consultoria (15/jun/2026)',
  version: '1.0',
  date: '10 de junho de 2026',
  site: 'https://app.aerosuite.com.br',
  analyst: 'Wellem Lyra',
  role: 'Diretor de TI',
  org: 'Aero Suite',
  consultant: 'Rafaella Nottes — Rafaella Nottes Consultoria',
  verificationAt: '2026-06-10',
  score: { total: 61, corrected: 49, positive: 12, pending: 0 },
};

const ITEMS = items.map(([id, section, sev, module, title, observation, resolution, verify]) => ({
  id,
  section,
  sev,
  module,
  title,
  observation,
  resolution,
  verify,
}));

const content = `/** Resposta técnica — Relatório Consolidado v2.0 (15/jun/2026) */
export const META = ${JSON.stringify(META, null, 2)};

export const SECTIONS = ${JSON.stringify(SECTIONS, null, 2)};

export const ITEMS = ${JSON.stringify(ITEMS, null, 2)};

export default { META, SECTIONS, ITEMS };
`;

fs.writeFileSync(out, content, 'utf8');
console.log('Generated', out, '—', ITEMS.length, 'items');
