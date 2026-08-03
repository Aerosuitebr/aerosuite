/** Dados estruturados — Guia de Produção do Vídeo Promocional Aero Suite */

export const META = {
  title: 'Guia de Produção do Vídeo Promocional',
  subtitle: 'Gravação, edição e uso do Abacus · Departamento de Marketing',
  version: '1.0',
  date: '09 de junho de 2026',
  author: 'Wellem Lyra',
  role: 'Analista responsável — UX & Conversão Digital',
  org: 'Aero Suite',
  recipient: 'Thiago Lyra — Marketing',
  targetDuration: '60–90 segundos (versão final)',
  rawDuration: '8–12 minutos (gravação bruta)',
  deliverables: [
    'aerosuite-demo-bruto.mp4 (1080p, gravação contínua)',
    'aerosuite-promo-90s.mp4 (corte final com legendas)',
    'aerosuite-promo-90s-voz.mp4 (opcional, com narração TTS)',
  ],
};

export const WORKFLOW = [
  {
    step: 1,
    title: 'Preparar ambiente demo',
    body: 'Tenant limpo, tema claro, pt-BR, sidebar expandida, dados fictícios. Fechar popups e notificações. Navegador em zoom 100%, barra de favoritos oculta.',
  },
  {
    step: 2,
    title: 'Gravar tour contínuo (~8 min)',
    body: 'OBS ou Win+G · 1920×1080 · 60 fps (30 ok). Mouse devagar, pausas de 1–2 s em cada tela. Um único fluxo sem erros de login. Salvar como aerosuite-demo-bruto.mp4.',
  },
  {
    step: 3,
    title: 'Mapear timestamps (Wellem ou Thiago)',
    body: 'Identificar os 6–8 melhores momentos para o corte de 90 s. Preencher tabela de cenas (Anexo C) ou enviar o MP4 para mapeamento assistido.',
  },
  {
    step: 4,
    title: 'Editar no CapCut',
    body: 'Cortar para 60–90 s, aplicar legendas PT-BR por cena, transições suaves (fade 0,3 s). Manter UI legível — não aplicar filtros pesados na gravação.',
  },
  {
    step: 5,
    title: 'Abacus — tarefas pontuais',
    body: 'Upscale (se 720p), B-roll hangar (intro/outro 6 s cada), TTS narração PT-BR. Nunca video-to-video sobre a gravação da UI.',
  },
  {
    step: 6,
    title: 'Revisão e publicação',
    body: 'Checklist final (Anexo D), export 16:9 LinkedIn + 9:16 Reels (reframe manual), CTA com link aerosuite.com.br/demo.',
  },
];

export const PRE_FLIGHT = [
  'Tenant demo com dados fictícios (sem nomes reais de clientes ou P/N sensíveis)',
  'Tema claro ativo (Settings → Aparência)',
  'Idioma pt-BR selecionado na tela de login',
  'Sidebar expandida (não colapsada)',
  'Fechar toasts, modais e notificações pendentes',
  'Desativar extensões do navegador que sobreponham a UI (tradutores, adblockers visíveis)',
  'Zoom do navegador em 100% (Ctrl+0)',
  'Ocultar barra de favoritos (Ctrl+Shift+B no Chrome)',
  'Resolução do monitor ≥ 1920×1080; gravar área 1920×1080',
  'Cursor do mouse visível; movimentos lentos e intencionais',
  'Ter credenciais demo anotadas (evitar errar senha na gravação)',
  'Testar o roteiro uma vez antes de gravar de verdade',
];

export const RECORDING_SPECS = {
  tool: 'OBS Studio (recomendado) ou Gravação Xbox (Win+G)',
  resolution: '1920 × 1080 (1080p)',
  fps: '60 fps preferível; 30 fps aceitável',
  codec: 'H.264 · MP4',
  audio: 'Desligar microfone ambiente (narração será TTS depois) ou gravar silencioso',
  webcam: 'Não usar webcam (ou cantinho pequeno, se Thiago aparecer)',
  filename: 'aerosuite-demo-bruto.mp4',
};

export const RECORDING_SCRIPT = [
  {
    id: 1,
    route: '/login',
    action: 'Abrir tela de login. Pausar 2 s no logo Aero Suite colorido.',
    duration: '5 s',
    caption: 'Acesso seguro e multilíngue',
    narration: 'O Aero Suite começa com uma experiência clara desde o primeiro acesso.',
    detail: 'Não digitar ainda. Deixar o logo respirar.',
  },
  {
    id: 2,
    route: '/login',
    action: 'Clicar seletor de idiomas: PT → EN → ES → voltar PT (devagar, 1 s em cada).',
    duration: '8 s',
    caption: 'Português, inglês, espanhol e francês',
    narration: 'Quatro idiomas nativos para equipes e clientes internacionais.',
    detail: 'Mostrar que os labels mudam na tela de login.',
  },
  {
    id: 3,
    route: '/login → home',
    action: 'Login demo (sem errar). Entrada suave até o dashboard.',
    duration: '12 s',
    caption: 'Painel operacional em segundos',
    narration: 'Em poucos cliques, a equipe está no centro das operações.',
    detail: 'Usar usuário demo preparado. Sem “tentativa e erro”.',
  },
  {
    id: 4,
    route: 'Sidebar',
    action: 'Scroll lento na sidebar. Usar busca rápida: digitar “estoque” ou “os”.',
    duration: '15 s',
    caption: 'Navegação por módulos',
    narration: 'Todos os módulos acessíveis: ordens de serviço, estoque, comercial e conformidade.',
    detail: 'Destacar ícones e hierarquia. Não scrollar freneticamente.',
  },
  {
    id: 5,
    route: '/home',
    action: 'Mostrar dashboard / home com cards e indicadores visíveis.',
    duration: '6 s',
    caption: 'Visão do dia',
    narration: 'Indicadores e pendências em um único painel.',
    detail: 'Pausa 1,5 s nos cards principais.',
  },
  {
    id: 6,
    route: '/os',
    action: 'Lista de OS → abrir 1 OS (lista → detalhe). Mostrar cabeçalho, cliente, FCU.',
    duration: '22 s',
    caption: 'Ordens de serviço integradas',
    narration: 'Da abertura da OS ao acompanhamento técnico — tudo conectado.',
    detail: 'Escolher OS com dados fictícios limpos. Scroll lento no detalhe.',
  },
  {
    id: 7,
    route: '/estoque/itens ou /estoque/consulta-qr',
    action: 'Lista de itens OU consulta QR: buscar item, mostrar rastreabilidade.',
    duration: '18 s',
    caption: 'Estoque rastreável',
    narration: 'Peças, certificados e rastreio por QR — prontos para auditoria.',
    detail: 'Se QR: aproximar código fictício; se lista: abrir 1 item com certificado.',
  },
  {
    id: 8,
    route: '/propostas-comerciais',
    action: 'Abrir 1 proposta comercial. Mostrar itens, valores, status.',
    duration: '18 s',
    caption: 'Propostas comerciais',
    narration: 'Do orçamento ao fechamento, com histórico e rastreabilidade.',
    detail: 'Valores fictícios. Scroll até seção de totais.',
  },
  {
    id: 9,
    route: '/externo (opcional)',
    action: 'Portal do cliente: visão simplificada para o cliente final.',
    duration: '15 s',
    caption: 'Portal do cliente',
    narration: 'Seu cliente acompanha propostas e documentos em tempo real.',
    detail: 'Opcional se tempo apertar; forte diferencial se couber.',
  },
  {
    id: 10,
    route: '/home',
    action: 'Voltar à home. Pausa final 2 s no logo ou dashboard.',
    duration: '6 s',
    caption: 'Aero Suite — Gestão aeronáutica integrada',
    narration: 'Aero Suite. Menos planilha, mais hangar.',
    detail: 'Este trecho vira outro/CTA no CapCut.',
  },
];

export const NARRATION_FULL = `O Aero Suite reúne, em uma única plataforma, tudo o que uma oficina aeronáutica precisa para operar com rastreabilidade e confiança.

Do login multilíngue ao painel operacional, a equipe acessa ordens de serviço, estoque com certificados de peça, propostas comerciais e evidências para auditoria — sem saltar entre planilhas e sistemas isolados.

Cada ordem de serviço conecta técnica, suprimentos e comercial. O estoque registra part number, lote, certificado e consulta por QR Code.

Propostas comerciais e portal do cliente mantêm o relacionamento transparente, do orçamento à entrega.

Aero Suite — gestão aeronáutica integrada. Conheça em aerosuite.com.br.`;

export const ABACUS_PROMPTS = [
  {
    id: 'A1',
    title: 'Analisar gravação e sugerir cortes',
    when: 'Após gravar aerosuite-demo-bruto.mp4',
    prompt: `Analyze this SaaS product screen recording (aviation MRO software Aero Suite).
List the best 6-8 moments for a 90-second promo with timestamps (MM:SS).
For each moment suggest:
- KEEP or TRIM note
- On-screen caption in Brazilian Portuguese (max 8 words)
- Suggested narration line (1 sentence, neutral professional tone)
Rules:
- Do not invent product features not visible in the video
- Avoid claims like "ANAC certified" — use "supports audit evidence" instead
- Preserve UI text legibility — no artistic distortion
Output as a markdown table.`,
  },
  {
    id: 'A2',
    title: 'Upscale para 1080p (se necessário)',
    when: 'Somente se a gravação saiu em 720p',
    prompt: `Upscale this screen recording to 1080p preserving UI text sharpness.
Minimal artistic changes — product demo fidelity is critical.
Do not add motion blur, film grain or color grading that reduces text readability.`,
  },
  {
    id: 'A3',
    title: 'B-roll intro — hangar (6 s)',
    when: 'Antes da cena 01 no CapCut',
    prompt: `Cinematic B-roll, 6 seconds, 16:9:
Modern aviation maintenance hangar at golden hour, shallow depth of field,
aircraft tail section softly visible, technicians in background (no readable faces),
professional corporate tone, cool blue and warm amber lighting,
no text overlays, no logos, photorealistic, smooth slow dolly.`,
  },
  {
    id: 'A4',
    title: 'B-roll outro — hangar (6 s)',
    when: 'Depois da cena final / CTA',
    prompt: `Cinematic B-roll, 6 seconds, 16:9:
Wide shot of clean MRO hangar floor, aircraft on jacks, organized tool carts,
morning light through hangar doors, sense of precision and trust,
corporate aviation aesthetic, no text, no watermarks, slow push-in camera.`,
  },
  {
    id: 'A5',
    title: 'Narração TTS (português Brasil)',
    when: 'Após roteiro aprovado — colar texto, não o vídeo',
    prompt: `Generate Brazilian Portuguese voiceover, neutral professional tone,
35-45 years, calm confident pace, aviation MRO SaaS promo.
Pace: ~130 words per minute. Clear articulation for technical audience.
Insert [PAUSE 0.5s] between paragraphs.

[PASTE NARRATION TEXT FROM SECTION 5 OF THE GUIDE]`,
  },
];

export const ABACUS_DONT = [
  {
    bad: '“Transforme este vídeo em comercial cinematográfico”',
    why: 'Distorce texto da UI, botões ficam ilegíveis',
  },
  {
    bad: 'Video-to-video / estilo filme em cima da gravação',
    why: 'Labels e números perdem nitidez — inaceitável para demo de software',
  },
  {
    bad: 'Motion Control usando gravação como referência',
    why: 'Serve para personagem/cena nova, não para polish de screen recording',
  },
  {
    bad: 'Pedir “certificação ANAC” ou claims regulatórios',
    why: 'Aero Suite apoia evidências de auditoria; não substitui certificação',
  },
  {
    bad: 'Inventar funcionalidades não visíveis no vídeo',
    why: 'Risco legal e perda de credibilidade com público técnico',
  },
];

export const CAPTIONS_BY_SCENE = [
  { scene: 'Login + logo', caption: 'Acesso multilíngue', alt: 'PT · EN · ES · FR' },
  { scene: 'Dashboard', caption: 'Painel operacional', alt: 'Visão do dia' },
  { scene: 'Sidebar', caption: 'Todos os módulos', alt: 'OS · Estoque · Comercial' },
  { scene: 'OS detalhe', caption: 'Ordem de serviço', alt: 'Técnica + suprimentos' },
  { scene: 'Estoque / QR', caption: 'Rastreabilidade total', alt: 'Certificado + lote' },
  { scene: 'Proposta', caption: 'Proposta comercial', alt: 'Do orçamento ao fechamento' },
  { scene: 'Portal cliente', caption: 'Portal do cliente', alt: 'Transparência' },
  { scene: 'CTA final', caption: 'aerosuite.com.br', alt: 'Agende uma demo' },
];

export const SCENE_TEMPLATE = [
  { col: 'CENA', example: '01' },
  { col: 'TIMESTAMP', example: '0:00–0:08' },
  { col: 'TELA', example: 'Login + idiomas' },
  { col: 'AÇÃO', example: 'KEEP' },
  { col: 'LEGENDA PT', example: 'Acesso multilíngue' },
  { col: 'NARRAÇÃO', example: 'Quatro idiomas nativos…' },
  { col: 'ABACUS', example: '—' },
];

export const PUBLISH_CHECKLIST = [
  'Duração final entre 60 e 90 segundos',
  'Legendas PT-BR revisadas (sem typos, sem chaves i18n visíveis)',
  'Nenhum dado real de cliente ou P/N sensível',
  'UI legível em mobile (testar preview 360p)',
  'CTA final: aerosuite.com.br ou link de demo Calendly',
  'Versão 16:9 para LinkedIn e site',
  'Versão 9:16 reframed para Reels/Stories (opcional)',
  'Áudio: narração TTS ou música royalty-free baixa (-18 LUFS aprox.)',
  'Claims: “apoia evidências de auditoria”, nunca “certificado pela ANAC”',
  'Aprovação Wellem + Thiago antes de publicar',
];

export const COMPLIANCE = {
  use: [
    '“Gestão aeronáutica integrada”',
    '“Rastreabilidade de peças e certificados”',
    '“Apoia evidências para auditoria e conformidade”',
    '“Ordens de serviço, estoque e comercial conectados”',
    '“Portal do cliente”',
    '“Multilíngue: PT, EN, ES, FR”',
  ],
  avoid: [
    '“Certificado pela ANAC / FAA / EASA” (software não certifica organização)',
    '“Substitui seu SGQ”',
    '“100% conformidade garantida”',
    'Nomes de clientes reais sem autorização escrita',
    'Métricas inventadas (“reduz 80% do tempo”) sem case documentado',
  ],
};

export const VIDEO_MAPPING = {
  intro: `Quando Thiago (ou marketing) enviar o MP4 bruto para Wellem, o mapeamento entrega uma tabela pronta para CapCut + Abacus.`,
  howToSend: [
    'Salvar em docs/marketing/aerosuite-demo-bruto.mp4 no repositório, ou',
    'Anexar o MP4 no chat/projeto com duração alvo (60 s Reels ou 90 s LinkedIn)',
  ],
  outputFormat: `CENA 01 | 0:00–0:08 | Login + idiomas | KEEP | Legenda: "Acesso multilíngue" | ABACUS: —
CENA 02 | 0:08–0:22 | Sidebar + busca | TRIM 2s início | Legenda: "Painel de voo" | ...
...
ABACUS: upscale CENA 01–08 | B-roll antes CENA 01 | outro depois CENA final | TTS parágrafo 1–4`,
  limits: [
    'Análise por frames — se UI estiver borrada, confirmar timestamps manualmente',
    'Áudio ambiente da gravação não vira narração final; usar roteiro TTS',
    'Nomes exatos de telas podem precisar confirmação se texto estiver pequeno',
  ],
};

export const BRAND = {
  primary: '#0369a1 (azul Aero Suite)',
  accent: '#c9a227 (dourado)',
  font: 'Segoe UI / system sans — consistente com produto',
  lowerThird: 'Fundo semi-transparente #0f172a 85%, texto branco, canto inferior esquerdo',
  cta: 'Botão ou texto: “Conheça o Aero Suite” → aerosuite.com.br',
};

export const MUSIC = {
  style: 'Corporate ambient, calmo, sem bateria agressiva',
  sources: 'Artlist, Epidemic Sound, YouTube Audio Library (filtrar “corporate technology”)',
  level: 'Música ~20 dB abaixo da narração; ducking automático no CapCut',
};
