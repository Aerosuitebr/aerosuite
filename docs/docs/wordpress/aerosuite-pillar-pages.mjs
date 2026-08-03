import { MEDIA, PILLAR_PAGES } from './aerosuite-site-config.mjs';
import { pillarPageSchema } from './aerosuite-schema.mjs';
import {
  schemaBlock,
  pageHeroBlock,
  demoCtaBlock,
  proseSection,
  bulletSection,
  relatedPillarsBlock,
} from './aerosuite-shared-blocks.mjs';
import { portfolioTeaserBlock } from './aerosuite-portfolio.mjs';

function buildPillar(pillar, sections, heroImage) {
  const description = sections.metaDescription;
  return {
    slug: pillar.slug,
    title: pillar.title,
    excerpt: description,
    seo: {
      title: `${pillar.title} | Aero Suite`,
      description,
    },
    content: [
      schemaBlock(pillarPageSchema(pillar, description)),
      pageHeroBlock({
        eyebrow: 'Guia Aero Suite · Brasil',
        title: pillar.title,
        lead: sections.lead,
        image: heroImage,
      }),
      ...sections.blocks,
      portfolioTeaserBlock(),
      demoCtaBlock({
        title: 'Quer ver isso na prática no seu hangar?',
        text: 'Agende uma demonstração da Aero Suite com foco em OS, peças, estoque FIFO e portal do cliente.',
        location: `pillar_${pillar.slug}`,
      }),
      relatedPillarsBlock(pillar.slug),
    ].join('\n'),
  };
}

function pillarMeta(slug) {
  return PILLAR_PAGES.find((p) => p.slug === slug);
}

const PILLARS = {
  'software-gestao-oficina-aeronautica-mro': buildPillar(
    pillarMeta('software-gestao-oficina-aeronautica-mro'),
    {
      metaDescription:
        'Software SaaS para oficinas aeronáuticas e MRO no Brasil: OS, estoque de peças, propostas, documentos e portal do cliente com rastreabilidade.',
      lead: 'Substitua planilhas e arquivos soltos por uma plataforma pensada para a rotina de manutenção de aeronaves, com histórico auditável e controle por perfil.',
      blocks: [
        proseSection('Por que um software específico para MRO?', [
          'ERP genérico e planilhas não foram desenhados para job cards, rastreio de peças aeronáuticas, certificados e portal do cliente. A Aero Suite concentra a operação do hangar em um ambiente único.',
          'Gestores ganham visibilidade de status das OS, gargalos e movimentações de estoque; equipes técnicas trabalham com menos retrabalho e menos “qual versão é a certa?”.',
        ]),
        bulletSection('O que o gestor passa a controlar', [
          'Ordens de serviço com status, responsáveis e documentos centralizados',
          'Estoque de peças com FIFO e vínculo à OS',
          'Propostas comerciais alinhadas à execução técnica',
          'Portal para o cliente acompanhar sem sobrecarregar a equipe',
          'Perfis de acesso (RBAC) por função no hangar',
        ]),
        proseSection('Para quem é indicado', [
          'Oficinas aeronáuticas, MROs, organizações de manutenção (OM) e operações que precisam demonstrar controle e rastreabilidade em auditorias internas ou de clientes.',
        ]),
      ],
    },
    MEDIA.dashboard
  ),

  'estoque-pecas-aeronauticas-rastreabilidade': buildPillar(
    pillarMeta('estoque-pecas-aeronauticas-rastreabilidade'),
    {
      metaDescription:
        'Controle de estoque de peças aeronáuticas com FIFO, código de rastreio, certificados e vínculo à ordem de serviço. Software Aero Suite para oficinas MRO.',
      lead: 'Cada peça com histórico: entrada, reserva, aplicação na OS e saída, sem depender da memória da equipe ou de planilhas paralelas.',
      blocks: [
        proseSection('Rastreabilidade operacional de ponta a ponta', [
          'No setor aeronáutico, não basta “ter quantidade no armazém”. É preciso saber de qual invoice veio, qual lote, onde está, se está reservada e para qual OS foi aplicada.',
          'A Aero Suite registra movimentações e mantém o vínculo explícito entre peça e serviço em execução.',
        ]),
        bulletSection('Recursos de estoque na Aero Suite', [
          'Entrada com invoice, lote, localização e etiqueta/QR',
          'Saída e reserva amarradas à OS',
          'FIFO para priorização de consumo',
          'Certificados de peça e quarentena quando necessário',
          'Consulta por part number e histórico de movimentações',
        ]),
        proseSection('Benefício para conformidade', [
          'Facilita demonstrar controle em auditorias: trilha de quem movimentou, quando e em qual contexto, apoiando a cultura de conformidade da oficina.',
        ]),
      ],
    },
    MEDIA.estoque
  ),

  'ordem-servico-manutencao-aeronaves': buildPillar(
    pillarMeta('ordem-servico-manutencao-aeronaves'),
    {
      metaDescription:
        'Sistema de ordem de serviço (OS) para manutenção de aeronaves: job cards, status, documentos, peças e histórico auditável. Aero Suite para MRO.',
      lead: 'Da abertura ao fechamento: uma OS única com tudo que a equipe e o cliente precisam consultar.',
      blocks: [
        proseSection('OS como centro da operação', [
          'A ordem de serviço conecta técnicos, compras, qualidade e o cliente. Quando a OS vive em e-mail e WhatsApp, o histórico se perde.',
          'Na Aero Suite, status, job cards, responsáveis e anexos ficam no mesmo registro, com peças reservadas e aplicadas no mesmo fluxo.',
        ]),
        bulletSection('Na prática, sua equipe consegue', [
          'Abrir e acompanhar OS por aeronave, cliente ou tipo de serviço',
          'Registrar job cards e etapas do serviço',
          'Vincular peças do estoque à OS em execução',
          'Manter documentos técnicos associados',
          'Consultar histórico para serviços recorrentes',
        ]),
        proseSection('Menos ligação, mais transparência', [
          'Combine a OS com o portal do cliente: o operador acompanha andamento e documentos sem interromper o hangar a cada pergunta.',
        ]),
      ],
    },
    MEDIA.os
  ),

  'portal-cliente-oficina-aviacao': buildPillar(
    pillarMeta('portal-cliente-oficina-aviacao'),
    {
      metaDescription:
        'Portal do cliente para oficinas de aviação: status da OS, documentos e comunicação em ambiente seguro. Reduza ligações e eleve a experiência | Aero Suite.',
      lead: 'Seu cliente acompanha a manutenção da aeronave com transparência, sem expor o sistema interno da oficina.',
      blocks: [
        proseSection('Experiência profissional para o operador', [
          'Donos de aeronave e gestores de frota esperam visibilidade. Um portal dedicado transmite seriedade e reduz o tempo da sua equipe respondendo “como está minha OS?”.',
        ]),
        bulletSection('O que o cliente vê no portal', [
          'Status e andamento das ordens de serviço',
          'Documentos liberados pela oficina',
          'Propostas e aprovações quando aplicável',
          'Acesso controlado por perfil externo',
        ]),
        proseSection('Integrado à operação interna', [
          'O portal consome os mesmos dados da OS e do comercial, sem duplicar cadastro. O que a oficina atualiza internamente reflete na experiência do cliente.',
        ]),
      ],
    },
    MEDIA.os
  ),

  'propostas-comerciais-servicos-aeronauticos': buildPillar(
    pillarMeta('propostas-comerciais-servicos-aeronauticos'),
    {
      metaDescription:
        'Propostas comerciais integradas à oficina MRO: versionamento, aprovação e vínculo com a ordem de serviço. Software Aero Suite para serviços aeronáuticos.',
      lead: 'Comercial e hangar alinhados: proposta aprovada vira escopo técnico sem retrabalho de digitação.',
      blocks: [
        proseSection('Comercial desconectado gera erro de escopo', [
          'Quando a proposta está em PDF solto e a OS em outro lugar, divergências de preço e escopo aparecem na reta final.',
          'A Aero Suite mantém histórico comercial e liga a execução técnica ao que foi vendido.',
        ]),
        bulletSection('Fluxo comercial na suíte', [
          'Propostas versionadas com itens e condições',
          'Aprovação e registro de aditivos',
          'Impressão e envio profissional ao cliente',
          'Conexão com a OS após ganho',
        ]),
        proseSection('Mais previsibilidade de receita', [
          'Gestores acompanham pipeline e conversão com o mesmo sistema que a operação usa no dia a dia, menos surpresas entre vendas e produção.',
        ]),
      ],
    },
    MEDIA.propostas
  ),
};

export function getAllPillarPages() {
  return Object.values(PILLARS);
}

export function getPillarBySlug(slug) {
  return PILLARS[slug];
}
