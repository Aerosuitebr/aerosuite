import { SITE, LINKS } from './aerosuite-site-config.mjs';
import { schemaBlock, pageHeroBlock, bulletSection, demoCtaBlock } from './aerosuite-shared-blocks.mjs';
import { breadcrumbSchema, organizationSchema, webPageSchema, webSiteSchema } from './aerosuite-schema.mjs';

export const SEGURANCA_SEO = {
  slug: 'seguranca-e-dados',
  title: 'Segurança e dados | Aero Suite',
  excerpt:
    'Como a Aero Suite protege dados da sua oficina: nuvem, RBAC, isolamento por organização e boas práticas de segurança.',
};

export function buildSegurancaContent() {
  const url = `${SITE.origin}/${SEGURANCA_SEO.slug}/`;
  return [
    schemaBlock([
      organizationSchema(),
      webSiteSchema(),
      breadcrumbSchema([
        { name: 'Início', url: LINKS.home },
        { name: 'Segurança e dados', url },
      ]),
      webPageSchema({ url, name: SEGURANCA_SEO.title, description: SEGURANCA_SEO.excerpt }),
    ]),
    pageHeroBlock({
      eyebrow: 'Confiança operacional',
      title: 'Segurança e proteção de dados',
      lead:
        'Ambiente em nuvem com controle de acesso por perfil, isolamento por organização e trilha de operações para auditoria interna.',
    }),
    bulletSection('Práticas da plataforma', [
      'Autenticação e autorização por perfil (RBAC)',
      'Isolamento lógico por organização / oficina',
      'Comunicação criptografada (HTTPS/TLS)',
      'Histórico de movimentações e alterações relevantes na OS e estoque',
      'Backups e infraestrutura gerenciada em provedor de nuvem',
    ]),
    bulletSection('LGPD e transparência', [
      `Tratamento de dados conforme nossa <a href="${LINKS.privacidade}">política de privacidade</a>`,
      'Dados de demonstração e comerciais tratados apenas para contato e proposta',
      `Solicitações de titulares via <a href="mailto:${SITE.email}">${SITE.email}</a>`,
    ]),
    demoCtaBlock({
      title: 'Tire dúvidas na demonstração',
      text: 'Avaliamos requisitos de segurança da sua operação no contexto do seu fluxo MRO.',
      location: 'seguranca_footer',
    }),
  ].join('\n');
}
