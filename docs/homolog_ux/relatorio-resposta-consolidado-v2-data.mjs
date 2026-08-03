/** Resposta técnica — Relatório Consolidado v2.0 (15/jun/2026) */
export const META = {
  "title": "Resposta Técnica — Homologação UX Relatório Consolidado v2.0",
  "subtitle": "Retorno formal aos 61 achados (A1–A61) do Relatório Consolidado (15/jun/2026)",
  "reference": "Relatório AeroSuite Consolidado v2.0 — Rafaella Nottes Consultoria (15/jun/2026)",
  "version": "1.0",
  "date": "10 de junho de 2026",
  "site": "https://app.aerosuite.com.br",
  "analyst": "Wellem Lyra",
  "role": "Diretor de TI",
  "org": "Aero Suite",
  "consultant": "Rafaella Nottes — Rafaella Nottes Consultoria",
  "verificationAt": "2026-06-10",
  "score": {
    "total": 61,
    "corrected": 49,
    "positive": 12,
    "pending": 0
  }
};

export const SECTIONS = [
  {
    "id": "1",
    "title": "Críticos — Login, Wizard e Produtos",
    "intro": "Achados A1–A5 de severidade crítica."
  },
  {
    "id": "2",
    "title": "Altos — Produtos, Conformidade e Relatórios",
    "intro": "Achados A6–A22 prioridade P1/P2."
  },
  {
    "id": "3",
    "title": "Médios — UX, i18n e Go-live",
    "intro": "Achados A23–A49 qualidade e consistência."
  },
  {
    "id": "4",
    "title": "Positivos — Mantidos",
    "intro": "Achados A50–A61 referência de qualidade."
  }
];

export const ITEMS = [
  {
    "id": "A1",
    "section": "1",
    "sev": "CRITICO",
    "module": "Conformidade",
    "title": "Campos sem limite de caracteres",
    "observation": "Texto extrapola e falha silenciosa",
    "resolution": "FieldLengthValidator + maxlength UI + mensagens i18n",
    "verify": "Salvar AD/SB com texto > limite → erro 400 legível"
  },
  {
    "id": "A2",
    "section": "1",
    "sev": "CRITICO",
    "module": "Login",
    "title": "Organização duplicada no dropdown",
    "observation": "Mesma org repetida",
    "resolution": "TenantLoginService label + dedup; wizard Voltar ao login",
    "verify": "Login multi-tenant sem duplicatas"
  },
  {
    "id": "A3",
    "section": "1",
    "sev": "CRITICO",
    "module": "Wizard",
    "title": "Sem redirect após conclusão",
    "observation": "Usuário fica perdido",
    "resolution": "Tela completed + redirect 2,5s + invalidateStatusCache",
    "verify": "Concluir wizard → dashboard"
  },
  {
    "id": "A4",
    "section": "1",
    "sev": "CRITICO",
    "module": "Produtos",
    "title": "P/N duplicado e barcode desvinculado",
    "observation": "Barcode por ID",
    "resolution": "Unicidade P/N + CodigoBarrasUtil.gerarCodigoBarrasPorPn",
    "verify": "Dois produtos mesmo P/N bloqueados; barcode estável por P/N"
  },
  {
    "id": "A5",
    "section": "1",
    "sev": "CRITICO",
    "module": "Produtos",
    "title": "Imagem removida ao editar",
    "observation": "photoUrl sobrescrito",
    "resolution": "ProductMapper ignora photoUrl/codigoBarras no update",
    "verify": "Editar nome mantém foto"
  },
  {
    "id": "A6",
    "section": "2",
    "sev": "ALTO",
    "module": "Go-live",
    "title": "CSV sem BOM UTF-8",
    "observation": "Acentos corrompidos",
    "resolution": "GoLiveMigracaoResource BOM no download",
    "verify": "Baixar template → UTF-8 correto"
  },
  {
    "id": "A7",
    "section": "2",
    "sev": "ALTO",
    "module": "Wizard",
    "title": "Telefone aceita letras",
    "observation": "Validação fraca",
    "resolution": "formatPhoneBr + isValidPhoneBr",
    "verify": "Campo telefone só dígitos formatados"
  },
  {
    "id": "A8",
    "section": "2",
    "sev": "ALTO",
    "module": "Conformidade",
    "title": "Textareas sem limite",
    "observation": "Mesmo A1",
    "resolution": "maxlength + backend FieldLengthValidator",
    "verify": "Campos conformidade respeitam limite"
  },
  {
    "id": "A9",
    "section": "2",
    "sev": "ALTO",
    "module": "Produtos",
    "title": "Fabricante inexistente",
    "observation": "Sem cadastro rápido",
    "resolution": "Dialog quick-create fabricante em product-new",
    "verify": "Criar fabricante inline"
  },
  {
    "id": "A10",
    "section": "2",
    "sev": "ALTO",
    "module": "Relatórios",
    "title": "Dados fictícios",
    "observation": "Hardcoded demo",
    "resolution": "RelatorioAnalyticsService + API real + empty state",
    "verify": "Gráficos com dados do tenant"
  },
  {
    "id": "A11",
    "section": "2",
    "sev": "ALTO",
    "module": "Produtos",
    "title": "Textarea extrapola layout",
    "observation": "CSS overflow",
    "resolution": "product-textarea max-width/overflow-wrap",
    "verify": "Descrição longa não quebra layout"
  },
  {
    "id": "A12",
    "section": "2",
    "sev": "ALTO",
    "module": "Relatórios/Go-live",
    "title": "Layout não responsivo",
    "observation": "Mobile quebrado",
    "resolution": "SCSS responsivo relatorios.component",
    "verify": "Redimensionar janela"
  },
  {
    "id": "A13",
    "section": "2",
    "sev": "ALTO",
    "module": "AD/SB",
    "title": "FCU com spinner numérico",
    "observation": "UX ruim",
    "resolution": "p-autoComplete FCU com busca",
    "verify": "Selecionar FCU por código"
  },
  {
    "id": "A14",
    "section": "2",
    "sev": "ALTO",
    "module": "Produtos",
    "title": "USD/BRL confuso",
    "observation": "Sem contexto",
    "resolution": "localeMoney + footnote BCB na listagem",
    "verify": "Rodapé cotação visível"
  },
  {
    "id": "A15",
    "section": "2",
    "sev": "ALTO",
    "module": "Produtos",
    "title": "Ícone lixeira para inativar",
    "observation": "Semântica errada",
    "resolution": "pi-ban + confirmação inativar",
    "verify": "Botão inativar com ícone correto"
  },
  {
    "id": "A16",
    "section": "2",
    "sev": "ALTO",
    "module": "Produtos",
    "title": "Upload sem preview/remoção",
    "observation": "UX incompleta",
    "resolution": "Preview upload + remover imagem existente",
    "verify": "Selecionar foto → preview; remover"
  },
  {
    "id": "A17",
    "section": "2",
    "sev": "ALTO",
    "module": "Produtos",
    "title": "Busca por barcode",
    "observation": "Não encontrava",
    "resolution": "ProductService busca codigoBarras",
    "verify": "Buscar EAN-13"
  },
  {
    "id": "A18",
    "section": "2",
    "sev": "ALTO",
    "module": "Wizard",
    "title": "CPF na revisão",
    "observation": "Dado sensível exposto",
    "resolution": "maskCpfInRazaoSocial na revisão",
    "verify": "Revisão sem CPF trailing"
  },
  {
    "id": "A19",
    "section": "2",
    "sev": "ALTO",
    "module": "Produtos",
    "title": "Busca por data ambígua",
    "observation": "Formatos diversos",
    "resolution": "normalizeDateSearchTerm + parseSearchDate backend",
    "verify": "Buscar 10062026 ou 10.06.2026"
  },
  {
    "id": "A20",
    "section": "2",
    "sev": "ALTO",
    "module": "SGQ",
    "title": "Item 00 no dropdown tipo",
    "observation": "Dado inválido",
    "resolution": "Whitelist SGQ_TIPOS_VALIDOS + appendTo body",
    "verify": "Dropdown só tipos válidos"
  },
  {
    "id": "A21",
    "section": "2",
    "sev": "ALTO",
    "module": "Relatórios",
    "title": "Gráfico híbrido incorreto",
    "observation": "Donut+bar misturado",
    "resolution": "Donut e bar separados com dados reais",
    "verify": "Dois gráficos distintos"
  },
  {
    "id": "A22",
    "section": "2",
    "sev": "ALTO",
    "module": "Global",
    "title": "Data rodapé maiúscula",
    "observation": "Preposições erradas",
    "resolution": "formatFooterDate locale-currency",
    "verify": "Rodapé pt: de junho de"
  },
  {
    "id": "A23",
    "section": "3",
    "sev": "MEDIO",
    "module": "Wizard",
    "title": "Hint CNPJ informal",
    "observation": "Tom coloquial",
    "resolution": "Texto i18n formal A23",
    "verify": "Hint CNPJ revisado"
  },
  {
    "id": "A24",
    "section": "3",
    "sev": "MEDIO",
    "module": "Wizard",
    "title": "Textos endereço",
    "observation": "Travessão informal",
    "resolution": "section.address.lead atualizado",
    "verify": "Instruções endereço revisadas"
  },
  {
    "id": "A25",
    "section": "3",
    "sev": "MEDIO",
    "module": "Wizard",
    "title": "Endereço caixa alta",
    "observation": "Inconsistente",
    "resolution": "formatBrTitleCase em CEP/CNPJ lookup",
    "verify": "Bairro/cidade Title Case"
  },
  {
    "id": "A26",
    "section": "3",
    "sev": "MEDIO",
    "module": "Wizard",
    "title": "Toast CNPJ duplicado",
    "observation": "Double fire",
    "resolution": "Debounce 850ms + guard inFlight + lastNotFound",
    "verify": "CNPJ inválido → 1 toast"
  },
  {
    "id": "A27",
    "section": "3",
    "sev": "MEDIO",
    "module": "Wizard",
    "title": "Checkbox linguagem",
    "observation": "autorizo gravar",
    "resolution": "confirm.label formal",
    "verify": "Texto declaração oficial"
  },
  {
    "id": "A28",
    "section": "3",
    "sev": "MEDIO",
    "module": "Wizard",
    "title": "Termo backend na revisão",
    "observation": "Jargão dev",
    "resolution": "review.intro sem backend",
    "verify": "Texto usuário final"
  },
  {
    "id": "A29",
    "section": "3",
    "sev": "MEDIO",
    "module": "Wizard",
    "title": "Pontuação revisão",
    "observation": "Separadores",
    "resolution": "displayAddressLine getter",
    "verify": "Endereço formatado consistente"
  },
  {
    "id": "A30",
    "section": "3",
    "sev": "MEDIO",
    "module": "Produtos",
    "title": "No results fabricante",
    "observation": "Empty confuso",
    "resolution": "Dropdown fabricantes + quick add",
    "verify": "Lista fabricantes populada"
  },
  {
    "id": "A31",
    "section": "3",
    "sev": "MEDIO",
    "module": "Produtos",
    "title": "Cursor preço",
    "observation": "Grouping",
    "resolution": "useGrouping false no preço",
    "verify": "Digitar preço sem salto cursor"
  },
  {
    "id": "A32",
    "section": "3",
    "sev": "MEDIO",
    "module": "Produtos",
    "title": "Foto na listagem",
    "observation": "Thumbnails",
    "resolution": "Photo cache + modal upload listagem",
    "verify": "Coluna foto funcional"
  },
  {
    "id": "A33",
    "section": "3",
    "sev": "MEDIO",
    "module": "Produtos",
    "title": "Specs aeronáuticas",
    "observation": "Campos genéricos",
    "resolution": "Seção specs peso/dimensões/material",
    "verify": "Formulário specs visível"
  },
  {
    "id": "A34",
    "section": "3",
    "sev": "MEDIO",
    "module": "Produtos",
    "title": "Cotação BCB desatualizada",
    "observation": "Footnote",
    "resolution": "localeCurrency footnote dinâmico",
    "verify": "Footnote data cotação"
  },
  {
    "id": "A35",
    "section": "3",
    "sev": "MEDIO",
    "module": "Produtos",
    "title": "Filtro ativo/inativo",
    "observation": "Só ativos",
    "resolution": "Dropdown status + isActive tri-state API",
    "verify": "Filtrar inativos/todos"
  },
  {
    "id": "A36",
    "section": "3",
    "sev": "MEDIO",
    "module": "Produtos",
    "title": "Barcode Code128",
    "observation": "Formato",
    "resolution": "JsBarcode CODE128/EAN13 na impressão",
    "verify": "Imprimir código legível"
  },
  {
    "id": "A37",
    "section": "3",
    "sev": "MEDIO",
    "module": "Produtos",
    "title": "Print manual",
    "observation": "Sem auto-print",
    "resolution": "window.print onload no printBarcode",
    "verify": "Impressão abre diálogo auto"
  },
  {
    "id": "A38",
    "section": "3",
    "sev": "MEDIO",
    "module": "Produtos",
    "title": "Empty state",
    "observation": "Lista vazia",
    "resolution": "ListDataStatesComponent + CTA novo",
    "verify": "Lista vazia com botão"
  },
  {
    "id": "A39",
    "section": "3",
    "sev": "MEDIO",
    "module": "Conformidade",
    "title": "Textarea borda",
    "observation": "Estilo global",
    "resolution": "_premium-a11y.scss textarea focus",
    "verify": "Borda visível em textareas"
  },
  {
    "id": "A40",
    "section": "3",
    "sev": "MEDIO",
    "module": "Conformidade",
    "title": "AD/SB sem tradução",
    "observation": "Siglas fixas",
    "resolution": "aero.diretriz.tipo i18n AD/SB/OUTRO",
    "verify": "Trocar idioma → labels traduzidos"
  },
  {
    "id": "A41",
    "section": "3",
    "sev": "MEDIO",
    "module": "Conformidade",
    "title": "Painel uso longo",
    "observation": "Scroll excessivo",
    "resolution": "usage-panel recolhível CSS",
    "verify": "Painel conformidade compacto"
  },
  {
    "id": "A42",
    "section": "3",
    "sev": "MEDIO",
    "module": "Conformidade",
    "title": "Alertas pouco visíveis",
    "observation": "Cards métricas",
    "resolution": "metric-grid alertas clicáveis",
    "verify": "Cards vencidas/próximas"
  },
  {
    "id": "A43",
    "section": "3",
    "sev": "MEDIO",
    "module": "Conformidade",
    "title": "Cards sem cor",
    "observation": "Hierarquia",
    "resolution": "severity colors danger/warn/info",
    "verify": "Cards coloridos por severidade"
  },
  {
    "id": "A44",
    "section": "3",
    "sev": "MEDIO",
    "module": "Conformidade",
    "title": "Habilitações layout",
    "observation": "Espaçamento",
    "resolution": "Field limits + list scroll",
    "verify": "Lista habilitações alinhada"
  },
  {
    "id": "A45",
    "section": "3",
    "sev": "MEDIO",
    "module": "Go-live",
    "title": "Banner trial",
    "observation": "Contexto trial",
    "resolution": "Banner i18n go-live trial",
    "verify": "Banner visível no kit"
  },
  {
    "id": "A46",
    "section": "3",
    "sev": "MEDIO",
    "module": "Go-live",
    "title": "Linguagem técnica",
    "observation": "Jargão",
    "resolution": "go-live-migracao-i18n revisado",
    "verify": "Textos go-live claros"
  },
  {
    "id": "A47",
    "section": "3",
    "sev": "MEDIO",
    "module": "Go-live",
    "title": "Breadcrumb módulo",
    "observation": "Perde contexto",
    "resolution": "Links checklist com query returnUrl",
    "verify": "Abrir módulo mantém checklist"
  },
  {
    "id": "A48",
    "section": "3",
    "sev": "MEDIO",
    "module": "Go-live",
    "title": "Download sem feedback",
    "observation": "Spinner ausente",
    "resolution": "Indicador loading download template",
    "verify": "Download mostra progresso"
  },
  {
    "id": "A49",
    "section": "3",
    "sev": "MEDIO",
    "module": "Menu",
    "title": "Estrutura i18n",
    "observation": "Itens variam",
    "resolution": "menu-i18n chaves estáveis 4 idiomas",
    "verify": "Menu PT/EN/ES/FR consistente"
  },
  {
    "id": "A50",
    "section": "4",
    "sev": "POSITIVO",
    "module": "Global",
    "title": "Login claro",
    "observation": "Tela de entrada premium",
    "resolution": "Comportamento mantido",
    "verify": "Tela login premium"
  },
  {
    "id": "A51",
    "section": "4",
    "sev": "POSITIVO",
    "module": "Wizard",
    "title": "Progresso etapas",
    "observation": "Stepper claro",
    "resolution": "Stepper mantido",
    "verify": "4 etapas visíveis"
  },
  {
    "id": "A52",
    "section": "4",
    "sev": "POSITIVO",
    "module": "Wizard",
    "title": "Validação inline",
    "observation": "Erros por campo",
    "resolution": "fieldErrors mantidos",
    "verify": "Erros por campo"
  },
  {
    "id": "A53",
    "section": "4",
    "sev": "POSITIVO",
    "module": "Global",
    "title": "Menu modular",
    "observation": "Sidebar intuitiva",
    "resolution": "Sidebar mantida",
    "verify": "Navegação intuitiva"
  },
  {
    "id": "A54",
    "section": "4",
    "sev": "POSITIVO",
    "module": "Conformidade",
    "title": "Painel métricas",
    "observation": "Cards alertas",
    "resolution": "Cards alertas mantidos",
    "verify": "Métricas conformidade"
  },
  {
    "id": "A55",
    "section": "4",
    "sev": "POSITIVO",
    "module": "Habilitações",
    "title": "Subtítulo claro",
    "observation": "Hero informativo",
    "resolution": "Page hero mantido",
    "verify": "Subtítulo informativo"
  },
  {
    "id": "A56",
    "section": "4",
    "sev": "POSITIVO",
    "module": "Produtos",
    "title": "Modal barcode",
    "observation": "Zoom código",
    "resolution": "Barcode modal mantido",
    "verify": "Zoom código barras"
  },
  {
    "id": "A57",
    "section": "4",
    "sev": "POSITIVO",
    "module": "Global",
    "title": "Confirmação inativar",
    "observation": "Modal antes ação",
    "resolution": "p-confirmDialog mantido",
    "verify": "Modal antes inativar"
  },
  {
    "id": "A58",
    "section": "4",
    "sev": "POSITIVO",
    "module": "SGQ",
    "title": "Tipos aeronáuticos",
    "observation": "MOE/POP adequados",
    "resolution": "Tipos mantidos",
    "verify": "Tipos adequados"
  },
  {
    "id": "A59",
    "section": "4",
    "sev": "POSITIVO",
    "module": "Relatórios",
    "title": "Export CSV",
    "observation": "Export funcional",
    "resolution": "Export CSV BOM mantido",
    "verify": "Baixar CSV relatório"
  },
  {
    "id": "A60",
    "section": "4",
    "sev": "POSITIVO",
    "module": "Global",
    "title": "i18n 4 idiomas",
    "observation": "PT/EN/ES/FR",
    "resolution": "TranslationService mantido",
    "verify": "Trocar idioma"
  },
  {
    "id": "A61",
    "section": "4",
    "sev": "POSITIVO",
    "module": "Global",
    "title": "Sistema online",
    "observation": "Indicador rodapé",
    "resolution": "Footer indicator mantido",
    "verify": "Rodapé online"
  }
];

export default { META, SECTIONS, ITEMS };
