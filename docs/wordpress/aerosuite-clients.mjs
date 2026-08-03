import { getBellowsLogoUrl, getKingDoRioLogoUrl } from './aerosuite-portfolio-media.mjs';

/**
 * Clientes autorizados para portfólio / cases no site institucional.
 * Atualize apenas com aprovação explícita da operação.
 */
export const PORTFOLIO_CLIENTS = [
  {
    slug: 'bellows-servicos-aeronauticos',
    name: 'Bellows | Serviços Aeronáuticos',
    tradeName: 'Bellows Controls',
    logoUrl: getBellowsLogoUrl(),
    logoAlt: 'Logo Bellows Serviços Aeronáuticos',
    website: 'https://bellowscontrols.com.br/',
    location: 'Rio de Janeiro, RJ | Brasil',
    segment: 'Manutenção de acessórios e componentes aeronáuticos (MRO)',
    badgeRegion: 'MRO · Brasil',
    focus:
      'Serviços de manutenção para turbinas e componentes, com operação voltada a rastreabilidade e controle no hangar.',
    metricShort: ['OS & documentos', 'Estoque & peças', 'Controle & auditoria'],
    outcomeMetrics: [
      { value: 'Hangar', label: 'OS e job cards centralizados' },
      { value: 'Almox.', label: 'Peças rastreáveis na operação' },
      { value: 'SGQ', label: 'Evidências para auditoria' },
    ],
    modules: [
      'Ordens de serviço com histórico e documentos',
      'Estoque e rastreio de peças na operação',
      'Controle por perfil (RBAC) e trilha auditável',
    ],
    summary:
      'A Bellows utiliza a Aero Suite para centralizar a gestão operacional da oficina | OS, peças e conformidade no mesmo ambiente em nuvem.',
    highlight:
      'Operação MRO no Rio de Janeiro com rastreabilidade de ponta a ponta, do hangar ao almoxarifado.',
  },
  {
    slug: 'king-do-rio-pecas-aeronauticas',
    name: 'King do Rio | Peças Aeronáuticas',
    tradeName: 'King do Rio',
    logoUrl: getKingDoRioLogoUrl(),
    logoAlt: 'Logo King do Rio Peças Aeronáuticas',
    website: 'https://kingdorio.com/',
    location: 'Rio de Janeiro, RJ | Brasil',
    segment: 'Distribuição de peças e componentes aeronáuticos',
    badgeRegion: 'Peças · Brasil',
    focus:
      'Comercialização de peças aeronáuticas com propostas alinhadas ao estoque real e rastreabilidade na operação.',
    metricShort: ['Propostas', 'Estoque', 'Comercial'],
    outcomeMetrics: [
      { value: 'Comercial', label: 'Propostas ligadas ao estoque real' },
      { value: 'FIFO', label: 'Reserva e saída rastreáveis' },
      { value: 'Visão', label: 'Cotações sem planilha paralela' },
    ],
    modules: [
      'Propostas comerciais integradas ao estoque',
      'Controle de estoque com rastreabilidade de peças',
      'Visão unificada de cotações e disponibilidade',
    ],
    summary:
      'A King do Rio utiliza a Aero Suite nos fluxos de propostas e controle de estoque, do orçamento à peça reservada, sem planilhas paralelas.',
    highlight:
      'Distribuidora carioca com propostas e almoxarifado no mesmo sistema, pronta para demanda e auditoria.',
  },
];

export function getClientBySlug(slug) {
  return PORTFOLIO_CLIENTS.find((c) => c.slug === slug) || null;
}
