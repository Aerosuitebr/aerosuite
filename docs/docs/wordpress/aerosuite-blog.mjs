import { SITE, LINKS } from './aerosuite-site-config.mjs';
import {
  articleSchema,
  breadcrumbSchema,
  organizationSchema,
  webSiteSchema,
  webPageSchema,
} from './aerosuite-schema.mjs';
import { schemaBlock, pageHeroBlock, blogDemoCtaBlock, proseSection } from './aerosuite-shared-blocks.mjs';
import { htmlBlock } from './aerosuite-html.mjs';

const PUBLISHED = '2026-06-02';

/**
 * Modelo reutilizável para novos posts do blog WordPress.
 * Use buildBlogPost() e publique via deploy ou wp-admin.
 */
export function buildBlogPost({
  title,
  slug,
  excerpt,
  eyebrow = 'Blog Aero Suite',
  lead,
  sections = [],
  datePublished = PUBLISHED,
}) {
  const url = `${SITE.origin}/${slug}/`;
  const schema = [
    organizationSchema(),
    webSiteSchema(),
    breadcrumbSchema([
      { name: 'Início', url: LINKS.home },
      { name: 'Blog', url: LINKS.blog },
      { name: title, url },
    ]),
    webPageSchema({ url, name: title, description: excerpt }),
    articleSchema({ url, title, description: excerpt, datePublished }),
  ];

  const body = sections.flatMap((s) => {
    if (s.type === 'prose') return [proseSection(s.title, s.paragraphs)];
    if (s.type === 'html') return [htmlBlock(s.html)];
    return [];
  });

  return {
    slug,
    title,
    excerpt,
    eyebrow,
    datePublished,
    content: [
      schemaBlock(schema),
      pageHeroBlock({ eyebrow, title, lead }),
      blogDemoCtaBlock(),
      htmlBlock(`
<p class="as-blog-back"><a href="${LINKS.blog}">← Voltar ao blog</a> · <a href="${LINKS.contatoAgendar}" class="as-track-demo" data-as-event="cta_demo" data-as-location="blog_footer">Agendar demonstração</a></p>`),
    ].join('\n'),
  };
}

export const BLOG_POST_FIFO = buildBlogPost({
  title: 'FIFO e rastreio de peças no contexto RBAC 145',
  slug: 'fifo-rastreio-pecas-rbac-145',
  excerpt:
    'Entrada, saída e reserva de peças aeronáuticas precisam de trilha clara. Veja como o FIFO digital apoia conformidade e compras na oficina MRO.',
  datePublished: '2026-05-15',
  lead: 'Peça sem histórico é risco em auditoria e em margem. Centralizar movimentações na OS muda a conversa com qualidade e compras.',
  sections: [
    {
      type: 'prose',
      title: 'Por que FIFO importa na aviação',
      paragraphs: [
        'Consumir estoque sem ordem definida mascara custo real e dificulta explicar qual lote atendeu qual aeronave.',
        'Um sistema MRO deve amarrar movimentação, responsável e OS, não apenas saldo em coluna.',
      ],
    },
    {
      type: 'prose',
      title: 'RBAC 145 e rastreabilidade operacional',
      paragraphs: [
        'Regulamentação e auditorias pedem evidência. Planilhas raramente sustentam consulta rápida sob pressão.',
        'Digitalizar FIFO com trilha auditável reduz tempo de resposta e retrabalho entre hangar e almoxarifado.',
      ],
    },
  ],
});

export const BLOG_POST_PORTAL = buildBlogPost({
  title: 'Portal do cliente: menos ligação, mais transparência',
  slug: 'portal-cliente-oficina-menos-ligacao',
  excerpt:
    'Proprietário de aeronave quer status e documentos sem sobrecarregar a equipe. Como o portal externo organiza a comunicação MRO.',
  datePublished: '2026-05-28',
  lead: 'Cada ligação “como está minha aeronave?” interrompe produção. Transparência estruturada protege o hangar e melhora a experiência do cliente.',
  sections: [
    {
      type: 'prose',
      title: 'O que o cliente espera ver',
      paragraphs: [
        'Status da OS, marcos de manutenção e documentos liberados, sem expor detalhes internos sensíveis.',
        'O portal filtra o que é público e mantém a equipe focada na execução.',
      ],
    },
    {
      type: 'prose',
      title: 'Benefício para a oficina',
      paragraphs: [
        'Menos interrupção no chão de hangar, mais previsibilidade comercial e imagem profissional.',
      ],
    },
  ],
});

export const BLOG_POST_PROPOSTA = buildBlogPost({
  title: 'Proposta comercial alinhada à ordem de serviço',
  slug: 'proposta-comercial-alinhada-ordem-servico',
  excerpt:
    'Evite divergência entre o que foi vendido e o que está no hangar. Integre proposta, escopo técnico e OS na mesma plataforma MRO.',
  datePublished: '2026-06-10',
  lead: 'Proposta desconectada da OS gera retrabalho, margem estourada e cliente insatisfeito. Alinhar comercial e hangar é vantagem competitiva.',
  sections: [
    {
      type: 'prose',
      title: 'O problema das versões soltas',
      paragraphs: [
        'PDF por e-mail, planilha de custos e OS em outro arquivo, cada um com uma “verdade”.',
        'Versionar proposta e vincular ao escopo da OS reduz disputa na entrega.',
      ],
    },
    {
      type: 'prose',
      title: 'Fluxo integrado',
      paragraphs: [
        'Da aprovação comercial à execução no hangar, o gestor enxerga o mesmo escopo, inclusive peças reservadas.',
      ],
    },
  ],
});

export const BLOG_POST_CHECKLIST = buildBlogPost({
  title: 'Checklist digital para auditoria interna na oficina MRO',
  slug: 'checklist-digital-auditoria-interna-mro',
  excerpt:
    'Prepare a oficina para auditoria com checklist digital ligado a OS, documentos e estoque, sem pastas dispersas.',
  datePublished: '2026-06-18',
  lead: 'Auditoria interna bem preparada evita surpresa em inspeção externa. Digitalizar evidências economiza dias de montagem de dossiê.',
  sections: [
    {
      type: 'prose',
      title: 'O que documentar antes da auditoria',
      paragraphs: [
        'Histórico de OS, movimentações de peças, treinamentos e registros de não conformidade, tudo com responsável e data.',
      ],
    },
    {
      type: 'prose',
      title: 'Do checklist à ação',
      paragraphs: [
        'Checklist que não conversa com a operação vira formalidade. Ligar itens à OS e ao estoque torna a melhoria contínua mensurável.',
      ],
    },
  ],
});

/** Post modelo, substitua planilhas na gestão MRO. */
export const SAMPLE_BLOG_POST = buildBlogPost({
  title: 'Como substituir planilhas na gestão da oficina MRO',
  slug: 'substituir-planilhas-gestao-oficina-mro',
  excerpt:
    'Planilhas e WhatsApp não sustentam rastreabilidade em manutenção de aeronaves. Veja o que centralizar em um software MRO antes da próxima auditoria.',
  lead: 'Se a “verdade oficial” da sua oficina está dividida entre Excel, grupos e pastas, o risco operacional cresce a cada OS, mesmo com equipe experiente.',
  sections: [
    {
      type: 'prose',
      title: 'Onde as planilhas mais falham',
      paragraphs: [
        'Ordem de serviço sem histórico único, peça sem vínculo claro à OS e proposta comercial desconectada do hangar são os três pontos que mais geram retrabalho.',
        'Em manutenção aeronáutica, não basta saber “quantas peças temos”. É preciso demonstrar rastreio, responsável e contexto, algo que planilha paralela raramente entrega sob pressão de auditoria.',
      ],
    },
    {
      type: 'prose',
      title: 'O que centralizar primeiro',
      paragraphs: [
        'Comece pela OS e pelo estoque: quando esses dois módulos conversam, compras, qualidade e o cliente passam a consultar a mesma fonte.',
        'Na Aero Suite, FIFO, job cards, documentos e portal do cliente orbitam a mesma ordem de serviço, reduzindo ligações e versões conflitantes.',
      ],
    },
    {
      type: 'prose',
      title: 'Próximo passo',
      paragraphs: [
        'Antes de trocar tudo de uma vez, agende uma demonstração com cenário real do seu hangar. Em cerca de 30 minutos dá para validar se o fluxo cobre sua operação.',
      ],
    },
  ],
});

export const BLOG_POST_ERP = buildBlogPost({
  title: 'Software MRO ou ERP genérico: o que escolher para a oficina',
  slug: 'software-mro-ou-erp-oficina-aeronautica',
  excerpt:
    'ERP adaptado nem sempre cobre FIFO de peças, job card e portal do cliente. Compare quando um software MRO dedicado faz mais sentido.',
  datePublished: '2026-06-20',
  lead: 'A dúvida aparece quando a oficina cresce: comprar mais um módulo do ERP ou adotar uma plataforma pensada para manutenção de aeronaves.',
  sections: [
    {
      type: 'prose',
      title: 'Onde o ERP genérico costuma falhar no hangar',
      paragraphs: [
        'ERP resolve finanças e compras, mas raramente nasce com OS aeronáutica, vínculo peça-aeronave e portal do proprietário como eixo.',
        'Adaptações viram projeto paralelo, e a “verdade” da manutenção continua em planilhas.',
      ],
    },
    {
      type: 'prose',
      title: 'O que um software MRO deve entregar',
      paragraphs: [
        'OS com histórico auditável, estoque FIFO com rastreio, proposta alinhada ao escopo técnico e portal externo, no mesmo fluxo.',
        `É o desenho da Aero Suite, usada em operações como a <a href="${LINKS.casoBellows}">Bellows | Serviços Aeronáuticos</a>.`,
      ],
    },
    {
      type: 'prose',
      title: 'Como decidir na prática',
      paragraphs: [
        'Liste processos que a auditoria pergunta todo ano: rastreio de peça, versão de OS, documentos anexos. Se o ERP não responde em minutos, um MRO dedicado compensa avaliar.',
        'Agende uma demonstração com cenário real do seu hangar antes de trocar de sistema.',
      ],
    },
  ],
});

export const BLOG_POST_RADAR_ANAC = buildBlogPost({
  title: 'ANAC reduz fiscalização: o que muda para oficinas MRO em 2026',
  slug: 'radar-mro-anac-fiscalizacao-oficinas-2026',
  eyebrow: 'Radar MRO',
  excerpt:
    'Bloqueio orçamentário leva a ANAC a cortar 40% das ações de fiscalização. Entenda o impacto em oficinas certificadas RBAC 145 e o que reforçar na auditoria interna.',
  datePublished: '2026-06-03',
  lead: 'Em 1º de junho de 2026, a ANAC comunicou corte imediato de 40% nas ações de fiscalização do setor aéreo, incluindo supervisão sobre oficinas de manutenção, fabricantes de peças e processos de certificação. Para quem opera hangar no Brasil, a leitura correta não é pânico: é reforço de conformidade interna.',
  sections: [
    {
      type: 'prose',
      title: 'O que foi anunciado',
      paragraphs: [
        'A medida responde a um bloqueio de R$ 24 milhões no orçamento da agência, publicado em decreto de 29 de maio. Segundo comunicados oficiais e cobertura da imprensa especializada, a ANAC passará a suspender provas de certificação de pilotos e comissários, interromper processos de certificação de aeronaves e reduzir investimentos em tecnologia da informação voltada ao setor regulado.',
        'A supervisão sobre companhias aéreas, aeroclubes, <strong>oficinas de manutenção aeronáutica</strong> e fabricantes de componentes entra no escopo do corte. Fontes: <a href="https://valor.globo.com/brasil/noticia/2026/06/01/anac-corta-40percent-da-fiscalizacao-do-setor-aereo-apos-bloqueio-no-orcamento.ghtml" rel="noopener noreferrer" target="_blank">Valor Econômico</a>, <a href="https://aeromagazine.uol.com.br/artigo/anac-corta-fiscalizacao-suspende-certificacoes-bloqueio-orcamentario-2026.html" rel="noopener noreferrer" target="_blank">AeroMagazine</a>.',
        'A própria ANAC alerta que bloqueios que limitam a atuação finalística da agência podem afetar a segurança operacional e a entrada de novas aeronaves no mercado, contexto que reforça, e não substitui, a responsabilidade de cada operador certificado.',
      ],
    },
    {
      type: 'prose',
      title: 'Por que oficinas MRO devem prestar atenção',
      paragraphs: [
        'Menos visitas de fiscalização <em>não significa</em> menos exigência técnica. A RBAC 145 continua valendo: rastreabilidade de peça, registro de manutenção, controle de documentos e capacidade de demonstrar conformidade sob demanda, seja para auditoria interna, cliente ou autoridade.',
        'Oficinas que dependem de “estar sempre sob o olho da ANAC” para manter disciplina documental correm risco se processos críticos ainda vivem em planilha, WhatsApp ou pastas soltas. Quando a supervisão externa rareia, quem não tem trilha auditável própria fica exposto.',
        'A suspensão de certificações de aeronaves e profissionais pode, no médio prazo, alterar fluxo de frota e prazos comerciais, pressionando oficinas já homologadas a absorver demanda com a mesma ou maior rigor documental.',
      ],
    },
    {
      type: 'prose',
      title: 'Checklist: o que fazer agora na sua oficina',
      paragraphs: [
        '<strong>1. Revisar dossiê de auditoria interna</strong> | OS encerradas nos últimos 12 meses com histórico completo (peças, horas, anexos, não conformidades). Se a montagem leva dias, há gap operacional.',
        '<strong>2. Validar rastreio estoque ↔ OS</strong>, cada peça consumida ou instalada deve apontar lote, certificado e ordem de serviço sem consulta paralela.',
        '<strong>3. Atualizar matriz de treinamentos</strong>, habilitações vencidas ou sem evidência são achados clássicos, com ou sem fiscalização intensa.',
        '<strong>4. Simular consulta sob pressão</strong>, escolha uma aeronave ao acaso e responda em menos de 30 minutos: “qual peça entrou, quem aprovou, em qual OS?”. O tempo de resposta revela maturidade do sistema.',
        '<strong>5. Alinhar comercial e hangar</strong>, propostas e escopo técnico devem conversar com a OS antes da execução; divergência vira retrabalho quando a margem já está apertada.',
      ],
    },
    {
      type: 'prose',
      title: 'Radar MRO: leitura Aero Suite',
      paragraphs: [
        'Cenários de menor supervisão externa costumam acelerar a separação entre oficinas “audit-ready” e oficinas que improvisam na véspera da inspeção. Software MRO dedicado não substitui cultura de segurança, mas centraliza OS, estoque FIFO, documentos e portal do cliente na mesma base, reduzindo o custo de provar conformidade.',
        'Operações como a <a href="https://aerosuite.com.br/casos/bellows-servicos-aeronauticos/">Bellows | Serviços Aeronáuticos</a> já adotam esse modelo no dia a dia do hangar. Se a sua oficina ainda fragmenta a verdade entre Excel e grupos, este é um bom momento para avaliar digitalização, antes que um cliente, seguradora ou auditoria faça a pergunta que a planilha não responde.',
        'Acompanhe este espaço: publicaremos periodicamente o <strong>Radar MRO</strong> com notícias do setor traduzidas em impacto prático para gestores de oficina no Brasil.',
      ],
    },
  ],
});

/** Todos os posts para deploy (ordem: mais recente primeiro). */
export const ALL_BLOG_POSTS = [
  BLOG_POST_RADAR_ANAC,
  BLOG_POST_ERP,
  BLOG_POST_CHECKLIST,
  BLOG_POST_PROPOSTA,
  BLOG_POST_PORTAL,
  BLOG_POST_FIFO,
  SAMPLE_BLOG_POST,
];

function formatBlogDate(iso) {
  const p = iso.split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}

/** Página índice do blog (lista introdutória + link para posts). */
export function buildBlogIndexContent() {
  const url = LINKS.blog;
  const cards = ALL_BLOG_POSTS.map((post) => {
    const display = formatBlogDate(post.datePublished || PUBLISHED);
    return `
  <article class="as-blog-card">
    <p class="as-blog-card__meta">${post.eyebrow || 'Guia prático'} · ${display}</p>
    <h2><a href="${SITE.origin}/${post.slug}/">${post.title}</a></h2>
    <p>${post.excerpt}</p>
    <a class="as-text-link" href="${SITE.origin}/${post.slug}/">Ler artigo →</a>
  </article>`;
  }).join('');

  return [
    schemaBlock([
      organizationSchema(),
      webSiteSchema(),
      webPageSchema({
        url,
        name: 'Blog | Gestão aeronáutica e MRO',
        description: 'Artigos sobre software para oficinas aeronáuticas, estoque de peças, OS e conformidade operacional.',
      }),
      {
        '@type': 'ItemList',
        name: 'Artigos do blog Aero Suite',
        itemListElement: ALL_BLOG_POSTS.map((post, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE.origin}/${post.slug}/`,
          name: post.title,
        })),
      },
    ]),
    pageHeroBlock({
      eyebrow: 'Blog Aero Suite',
      title: 'Gestão aeronáutica, MRO e rastreabilidade',
      lead: 'Conteúdo para gestores e donos de oficina que avaliam software, estoque de peças e controle de ordens de serviço.',
    }),
    htmlBlock(`<section class="as-blog-index as-blog-index--grid as-reveal">${cards}</section>`),
    blogDemoCtaBlock(),
  ].join('\n');
}

export const BLOG_INDEX_SEO = {
  title: 'Blog | Software e gestão para oficinas aeronáuticas | Aero Suite',
  excerpt: 'Artigos sobre MRO, estoque de peças aeronáuticas, ordem de serviço e software para oficinas no Brasil.',
};
