import { SITE, LINKS } from './aerosuite-site-config.mjs';
import { schemaBlock, proseSection } from './aerosuite-shared-blocks.mjs';
import { breadcrumbSchema, organizationSchema, webPageSchema, webSiteSchema } from './aerosuite-schema.mjs';
import { htmlBlock } from './aerosuite-html.mjs';

function legalSchema(url, name, description) {
  return [
    organizationSchema(),
    webSiteSchema(),
    breadcrumbSchema([
      { name: 'Início', url: LINKS.home },
      { name, url },
    ]),
    webPageSchema({ url, name, description }),
  ];
}

export const PRIVACIDADE_SEO = {
  slug: 'politica-de-privacidade',
  title: 'Política de privacidade | Aero Suite',
  excerpt: 'Como a Aero Suite trata dados pessoais em conformidade com a LGPD (Lei 13.709/2018).',
};

export function buildPrivacidadeContent() {
  const url = LINKS.privacidade;
  return [
    schemaBlock(legalSchema(url, 'Política de privacidade', PRIVACIDADE_SEO.excerpt)),
    htmlBlock(`
<section class="as-prose-section as-reveal">
  <h1>Política de privacidade</h1>
  <p class="as-muted">Última atualização: junho de 2026 · ${SITE.legalName}</p>
</section>`),
    proseSection('1. Controlador e contato', [
      `O controlador dos dados é ${SITE.legalName}, operador do site ${SITE.origin} e da plataforma ${SITE.appUrl}.`,
      `Dúvidas ou solicitações LGPD: <a href="mailto:${SITE.email}">${SITE.email}</a>.`,
    ]),
    proseSection('2. Dados que coletamos', [
      'Formulário de contato e agendamento: nome, e-mail, telefone, empresa e mensagem.',
      'Navegação no site: cookies e tecnologias de analytics/medição, somente com seu consentimento no banner de cookies.',
      'Uso da plataforma SaaS: dados operacionais da sua organização, tratados conforme contrato de prestação de serviços.',
    ]),
    proseSection('3. Finalidades', [
      'Responder solicitações comerciais e agendar demonstrações.',
      'Medir desempenho do site e campanhas (com consentimento).',
      'Prestar e melhorar o software de gestão aeronáutica contratado.',
    ]),
    proseSection('4. Base legal (LGPD)', [
      'Execução de contrato ou procedimentos preliminares (art. 7º, V).',
      'Legítimo interesse para segurança e melhoria do serviço, quando aplicável.',
      'Consentimento para cookies de analytics e marketing (art. 7º, I).',
    ]),
    proseSection('5. Compartilhamento', [
      'Prestadores de infraestrutura (hospedagem, e-mail, analytics, agendamento online) sob obrigações de confidencialidade.',
      'Não vendemos dados pessoais.',
    ]),
    proseSection('6. Seus direitos', [
      'Confirmação, acesso, correção, anonimização, portabilidade, eliminação e revogação do consentimento, mediante solicitação ao e-mail acima.',
    ]),
    proseSection('7. Retenção e segurança', [
      'Mantemos dados pelo tempo necessário à finalidade ou exigência legal. Aplicamos controles de acesso, criptografia em trânsito e boas práticas de segurança na nuvem.',
    ]),
    htmlBlock(`<p class="as-blog-back"><a href="${LINKS.home}">← Voltar ao início</a></p>`),
  ].join('\n');
}

export const TERMOS_SEO = {
  slug: 'termos-de-uso',
  title: 'Termos de uso do site | Aero Suite',
  excerpt: 'Condições de uso do site institucional e materiais da Aero Suite.',
};

export function buildTermosContent() {
  const url = LINKS.termos;
  return [
    schemaBlock(legalSchema(url, 'Termos de uso', TERMOS_SEO.excerpt)),
    htmlBlock(`
<section class="as-prose-section as-reveal">
  <h1>Termos de uso</h1>
  <p class="as-muted">Última atualização: junho de 2026</p>
</section>`),
    proseSection('1. Aceite', [
      `Ao acessar ${SITE.origin}, você concorda com estes termos. Se não concordar, não utilize o site.`,
    ]),
    proseSection('2. Conteúdo e propriedade', [
      'Textos, marcas, imagens e materiais do site são de propriedade da Aero Suite ou licenciados. É vedada cópia não autorizada para fins comerciais.',
    ]),
    proseSection('3. Demonstração e proposta', [
      'Informações no site são informativas. Condições comerciais, escopo e SLA constam em proposta ou contrato específico.',
    ]),
    proseSection('4. Limitação de responsabilidade', [
      'O site é fornecido “como está”. Não garantimos disponibilidade ininterrupta do site institucional; a plataforma SaaS segue acordo de nível de serviço contratual.',
    ]),
    proseSection('5. Links externos', [
      'Links para Calendly, WhatsApp ou terceiros seguem políticas desses serviços.',
    ]),
    htmlBlock(
      `<p class="as-blog-back"><a href="${LINKS.privacidade}">Política de privacidade</a> · <a href="${LINKS.home}">Início</a></p>`
    ),
  ].join('\n');
}
