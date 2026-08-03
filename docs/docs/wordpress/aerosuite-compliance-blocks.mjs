/**
 * Blocos de conformidade regulatória, home, soluções, página dedicada.
 * Linguagem: apoia evidências operacionais; não substitui SGQ certificado.
 */
import { htmlBlock } from './aerosuite-html.mjs';
import { LINKS } from './aerosuite-site-config.mjs';

const SGQ_TOOLS = [
  {
    tag: 'SMS',
    title: 'Indicadores SMS',
    text: 'KPIs de NC/CAPA no painel qualidade: severidade, fases CAPA e tendência de 6 meses, prontos para reuniões de segurança operacional.',
    accent: '#0b3d91',
  },
  {
    tag: 'Exportação',
    title: 'Exportação SGQ (ZIP)',
    text: 'Pacote consolidado com CSVs, snapshot e pasta de evidências para inspeções, sem remontar planilhas na véspera da fiscalização.',
    accent: '#c9a227',
  },
  {
    tag: 'Painel',
    title: 'Painel de conformidade',
    text: 'Alertas na home e na OS: calibração, treino obrigatório, subcontratação e NC aberta, com enforcement configurável no hangar.',
    accent: '#0a2f6b',
  },
  {
    tag: 'Dossiê',
    title: 'Dossiê multi-OS (ZIP)',
    text: 'Pacote de auditoria da organização: OS, anexos, CRS e evidências SGQ reunidos em minutos, não em semanas.',
    accent: '#051a3d',
  },
  {
    tag: 'CRS',
    title: 'CRS e segregação',
    text: 'Checklist de liberação para serviço, PDF de CRS e regra de independência entre execução e emissão, alinhado a Part 145.',
    accent: '#0b3d91',
  },
  {
    tag: 'Certificado',
    title: 'Certificado de peça',
    text: 'Metadados FAA 8130-3, EASA Form 1, ANAC e anexo digital, com bloqueio na saída quando certificação exigida.',
    accent: '#9a7b1a',
  },
  {
    tag: 'Quarentena',
    title: 'Quarentena de material',
    text: 'Fluxo completo de segregação e liberação, rastreável para auditoria de almoxarifado e qualidade.',
    accent: '#0a2f6b',
  },
  {
    tag: 'Rastreio',
    title: 'Linha do tempo da peça',
    text: 'Entrada, reserva, aplicação e certificado na mesma trilha, do QR code ao PDF para o fiscal.',
    accent: '#c9a227',
  },
];

/** Faixa de destaque imediatamente abaixo do hero, maturidade regulatória. */
export function complianceHeroStrip() {
  const { conformidade, contatoAgendar } = LINKS;
  return htmlBlock(`
<section class="as-compliance-strip as-reveal" aria-label="Conformidade regulatória Aero Suite">
  <div class="as-compliance-strip__inner">
    <div class="as-compliance-strip__badge"><span class="as-pulse-dot" aria-hidden="true"></span> Maturidade regulatória</div>
    <p class="as-compliance-strip__lead">
      <strong>Aderência operacional</strong> para ANAC, RBAC 145 e auditorias internas, com ferramentas SGQ integradas ao hangar, estoque e qualidade.
    </p>
    <div class="as-compliance-strip__tags" aria-hidden="true">
      <span>ANAC</span><span>RBAC 145</span><span>Part 145</span><span>SMS · NC/CAPA</span><span>Evidências auditáveis</span>
    </div>
    <div class="as-compliance-strip__actions">
      <a class="as-btn as-btn--gold as-btn--sm as-track-demo" href="${conformidade}">Ver módulo de conformidade</a>
      <a class="as-btn as-btn--ghost as-btn--sm" href="${contatoAgendar}" data-as-event="cta_demo" data-as-location="compliance_strip">Demo focada em auditoria</a>
    </div>
  </div>
</section>`);
}

/** Grid das novas ferramentas SGQ / conformidade, destaque visual. */
export function complianceNewToolsBlock({ id = 'ferramentas-conformidade' } = {}) {
  const cards = SGQ_TOOLS.map(
    (t) => `
    <article class="as-compliance-tool as-premium-card">
      <div class="as-compliance-tool__top">
        <span class="as-compliance-tool__tag">${t.tag}</span>
      </div>
      <h3>${t.title}</h3>
      <p>${t.text}</p>
    </article>`
  ).join('');

  return htmlBlock(`
<section id="${id}" class="as-compliance-tools as-reveal" aria-labelledby="as-tools-title">
  <div class="as-compliance-tools__inner">
    <header class="as-section-head as-section-head--compact">
      <p class="as-section-head__eyebrow">Aero Compliance · Novidades</p>
      <h2 id="as-tools-title">Ferramentas que transformam auditorias e fiscalizações</h2>
      <p class="as-section-head__sub">O que antes exigia dias de caça a planilhas, e-mails e pastas agora vive na mesma plataforma, do mecânico no hangar ao pacote entregue ao auditor.</p>
    </header>
    <div class="as-compliance-tools__grid">${cards}</div>
    <p class="as-compliance-tools__note">O software <strong>apoia evidências operacionais</strong> e acelera a preparação para inspeções. <strong>Não substitui</strong> o SGQ certificado da organização (MOE/POP físicos).</p>
  </div>
</section>`);
}

/** Benefícios para toda a oficina, tempo, organização, auditoria. */
export function complianceTeamBenefitsBlock() {
  return htmlBlock(`
<section class="as-compliance-benefits as-reveal" aria-labelledby="as-benefits-title">
  <div class="as-compliance-benefits__inner">
    <header class="as-section-head as-section-head--light as-section-head--compact">
      <p class="as-section-head__eyebrow">Para cada membro da oficina</p>
      <h2 id="as-benefits-title">Organiza a rotina hoje. Facilita a auditoria amanhã.</h2>
      <p class="as-section-head__sub as-section-head__sub--light">A Aero Suite não é só controle, é alívio operacional. Menos retrabalho, menos correria antes da fiscalização, mais confiança para gestão, qualidade, hangar e almoxarifado.</p>
    </header>
    <div class="as-compliance-benefits__grid">
      <article class="as-compliance-benefit">
        <span class="as-compliance-benefit__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" width="24" height="24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>
        <h3>Horas viram minutos</h3>
        <p>Dossiê, export SGQ e pacote multi-OS montados a partir da operação real, sem reconstruir evidências manualmente.</p>
      </article>
      <article class="as-compliance-benefit">
        <span class="as-compliance-benefit__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" width="24" height="24"><path d="M12 3 4 7v6c0 5 3.5 8 8 8s8-3 8-8V7l-8-4Z"/><path d="m9 12 2 2 4-4"/></svg></span>
        <h3>Prontidão contínua</h3>
        <p>Conformidade deixa de ser projeto de fim de semana: alertas, checklists e trilhas RBAC acompanham o dia a dia.</p>
      </article>
      <article class="as-compliance-benefit">
        <span class="as-compliance-benefit__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" width="24" height="24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
        <h3>Toda a equipe alinhada</h3>
        <p>Mecânico, inspetor, RT, almoxarifado e comercial na mesma base, sem versões divergentes em WhatsApp ou planilha.</p>
      </article>
      <article class="as-compliance-benefit">
        <span class="as-compliance-benefit__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" width="24" height="24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg></span>
        <h3>Fiscalização sem pânico</h3>
        <p>Quando o regulador pede evidência, você consulta, exporta e demonstra rastreabilidade, peça, OS, CRS e documentos.</p>
      </article>
    </div>
  </div>
</section>`);
}

/** Órgãos e contextos regulatórios. */
export function complianceRegulatorsBlock() {
  return htmlBlock(`
<section class="as-compliance-regulators as-reveal" aria-labelledby="as-regulators-title">
  <div class="as-compliance-regulators__inner">
    <header class="as-section-head as-section-head--compact">
      <p class="as-section-head__eyebrow">Contexto brasileiro</p>
      <h2 id="as-regulators-title">Aderência às exigências dos órgãos controladores</h2>
      <p class="as-section-head__sub">Projetada para oficinas e MROs que operam sob pressão de rastreabilidade, documentação e controle de acesso, com linguagem e fluxos alinhados à aviação civil brasileira.</p>
    </header>
    <div class="as-compliance-regulators__grid">
      <article class="as-compliance-regulator">
        <h3>ANAC · Fiscalização</h3>
        <p>Evidências de manutenção, peças e documentos reunidas para demonstrar controle operacional durante inspeções.</p>
      </article>
      <article class="as-compliance-regulator">
        <h3>RBAC 145 · Part 145</h3>
        <p>Perfis regulados, CRS com segregação, certificados de peça, quarentena e dossiê, apoiando organizações aprovadas.</p>
      </article>
      <article class="as-compliance-regulator">
        <h3>Auditorias internas</h3>
        <p>Checklists digitais, indicadores SMS e export SGQ para reuniões de qualidade e preparação contínua.</p>
      </article>
      <article class="as-compliance-regulator">
        <h3>Clientes e seguradoras</h3>
        <p>Portal do cliente, histórico de OS e rastreio FIFO aumentam transparência e confiança comercial.</p>
      </article>
    </div>
  </div>
</section>`);
}

export function complianceDisclaimerBlock() {
  return htmlBlock(`
<div class="as-compliance-disclaimer as-reveal" role="note">
  <p><strong>Nota importante:</strong> a Aero Suite apoia evidências operacionais integradas (OS, estoque, SGQ, dossiês). Não substitui o sistema de gestão da qualidade certificado da organização nem constitui homologação regulatória do produto pela ANAC.</p>
</div>`);
}

/** Painel principal, prontidão regulatória (home e página dedicada). */
export function complianceBlock({ showFootCta = true, linkToPage = true } = {}) {
  const { contatoAgendar, conformidade } = LINKS;
  const pageLink = linkToPage
    ? `<p class="as-regulatory__page-link"><a class="as-text-link as-text-link--light" href="${conformidade}">Explorar página completa de conformidade →</a></p>`
    : '';

  return htmlBlock(`
<section id="prontidao-regulatoria" class="as-regulatory as-reveal" aria-labelledby="as-compliance-title">
  <div class="as-regulatory__wrap">
    <header class="as-section-head as-section-head--compact">
      <p class="as-section-head__eyebrow">Prontidão regulatória · Diferencial Aero Suite</p>
      <h2 id="as-compliance-title">A suíte MRO que coloca sua oficina em conformidade operacional, com evidências, não improviso</h2>
      <p class="as-section-head__sub">Fiscalizações da ANAC, exigências do RBAC 145 e auditorias internas pedem rastreio, documentação e governança. A Aero Suite integra hangar, estoque, qualidade e comercial em base única, com dossiês, indicadores SMS, export SGQ e ferramentas que <strong>poupam tempo de toda a equipe</strong> na preparação para inspeções.</p>
      ${pageLink}
    </header>
    <div class="as-regulatory-panel">
      <div class="as-regulatory-panel__grain" aria-hidden="true"></div>
      <div class="as-regulatory-panel__glow" aria-hidden="true"></div>
      <div class="as-regulatory-panel__inner">
        <header class="as-regulatory-panel__hero">
          <div class="as-regulatory-panel__badge"><span class="as-pulse-dot" aria-hidden="true"></span> Conformidade integrada ao hangar</div>
          <h3 class="as-regulatory-panel__headline">Oficina aderente aos órgãos reguladores <em>antes</em> da inspeção chegar</h3>
          <p class="as-regulatory-panel__lead">Não é só registrar OS e peças: é dar à gestão, qualidade e almoxarifado um conjunto de ferramentas para demonstrar controle com agilidade, do apontamento no hangar ao pacote ZIP para o auditor.</p>
        </header>
        <div class="as-regulatory-panel__cards">
        <div class="as-regulatory-panel__contrast-block">
          <p class="as-regulatory-panel__contrast-kicker">Antes e depois da maturidade Aero Suite</p>
          <div class="as-regulatory-panel__contrast" aria-label="Comparativo de preparação para fiscalização">
            <article class="as-regulatory-panel__contrast-col as-regulatory-panel__contrast-col--before">
              <header class="as-regulatory-panel__contrast-head">
                <span class="as-regulatory-panel__contrast-badge as-regulatory-panel__contrast-badge--before" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                </span>
                <span class="as-regulatory-panel__contrast-label">Sem base integrada</span>
              </header>
              <ul>
                <li>Evidências espalhadas em planilhas, e-mail e pastas</li>
                <li>Dias montando dossiê na véspera da fiscalização</li>
                <li>Equipe inteira parada para caçar documentos</li>
                <li>Retrabalho entre qualidade, hangar e almoxarifado</li>
                <li>Dificuldade para provar certificado, CRS e movimentação de peça</li>
              </ul>
            </article>
            <div class="as-regulatory-panel__contrast-divider" aria-hidden="true">
              <span class="as-regulatory-panel__contrast-divider-ring">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
              </span>
            </div>
            <article class="as-regulatory-panel__contrast-col as-regulatory-panel__contrast-col--after">
              <header class="as-regulatory-panel__contrast-head">
                <span class="as-regulatory-panel__contrast-badge as-regulatory-panel__contrast-badge--after" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                </span>
                <span class="as-regulatory-panel__contrast-label">Com a Aero Suite</span>
              </header>
              <ul>
                <li>OS, FIFO, SGQ, CRS e documentos na mesma plataforma</li>
                <li>Export SGQ e dossiê multi-OS em minutos</li>
                <li>Indicadores SMS e alertas na rotina, não só na auditoria</li>
                <li>Trilha RBAC: quem viu, alterou e aprovou cada etapa</li>
                <li>Preparação contínua para fiscalizações e auditorias</li>
              </ul>
            </article>
          </div>
        </div>
        <div class="as-regulatory-panel__domains" aria-label="Três frentes de adequação">
          <article class="as-regulatory-panel__domain">
            <span class="as-regulatory-panel__domain-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>
            </span>
            <h4>Operação rastreável</h4>
            <p>Peças, FIFO, CRS, certificados e status de OS ligados ao serviço, trilha clara para o fiscal.</p>
          </article>
          <article class="as-regulatory-panel__domain">
            <span class="as-regulatory-panel__domain-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/></svg>
            </span>
            <h4>SGQ operacional</h4>
            <p>Painel qualidade, NC/CAPA, indicadores SMS e export ZIP, evidências prontas para inspeções.</p>
          </article>
          <article class="as-regulatory-panel__domain">
            <span class="as-regulatory-panel__domain-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </span>
            <h4>Governança e perfis Part 145</h4>
            <p>RBAC por função, segregação CRS e registro auditável, essencial sob pressão regulatória.</p>
          </article>
        </div>
        <div class="as-regulatory-panel__body">
          <div class="as-regulatory-panel__advantages">
            <p class="as-regulatory-panel__advantages-title">Vantagens que aceleram a adequação da oficina</p>
            <div class="as-regulatory-panel__advantages-grid">
              <article class="as-premium-card as-regulatory-advantage as-regulatory-advantage--dossier" style="--as-card-accent:linear-gradient(90deg,#c9a227,#e8c547);--as-card-icon-bg:linear-gradient(135deg,#c9a227,#e8c547);--as-card-icon-shadow:rgba(201,162,39,0.35);--as-card-glow:rgba(201,162,39,0.15);--as-card-tag:#9a7b1a;--as-card-tag-bg:rgba(201,162,39,0.12);--as-card-tag-border:rgba(201,162,39,0.22);">
                <div class="as-premium-card__glow" aria-hidden="true"></div>
                <div class="as-premium-card__top"><span class="as-premium-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg></span><span class="as-premium-card__tag">01</span></div>
                <h4>Dossiê e pacote auditoria</h4>
                <p>PDF por OS e ZIP multi-OS com anexos, CRS e pasta SGQ, prontos quando o regulador solicitar.</p>
              </article>
              <article class="as-premium-card as-regulatory-advantage as-regulatory-advantage--fifo" style="--as-card-accent:linear-gradient(90deg,#0b3d91,#051a3d);--as-card-icon-bg:linear-gradient(135deg,#0b3d91,#051a3d);">
                <div class="as-premium-card__glow" aria-hidden="true"></div>
                <div class="as-premium-card__top"><span class="as-premium-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg></span><span class="as-premium-card__tag">02</span></div>
                <h4>Export SGQ (ZIP)</h4>
                <p>CSVs, snapshot e evidências consolidadas para auditorias, sem remontar planilhas manualmente.</p>
              </article>
              <article class="as-premium-card as-regulatory-advantage as-regulatory-advantage--check" style="--as-card-accent:linear-gradient(90deg,#0a2f6b,#0b3d91);--as-card-icon-bg:linear-gradient(135deg,#0a2f6b,#0b3d91);">
                <div class="as-premium-card__glow" aria-hidden="true"></div>
                <div class="as-premium-card__top"><span class="as-premium-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></span><span class="as-premium-card__tag">03</span></div>
                <h4>Indicadores SMS</h4>
                <p>KPIs de NC/CAPA, severidade e tendência, visibilidade para gestão de segurança operacional.</p>
              </article>
              <article class="as-premium-card as-regulatory-advantage as-regulatory-advantage--rbac" style="--as-card-accent:linear-gradient(90deg,#051a3d,#0b3d91);--as-card-icon-bg:linear-gradient(135deg,#051a3d,#0a2f6b);">
                <div class="as-premium-card__glow" aria-hidden="true"></div>
                <div class="as-premium-card__top"><span class="as-premium-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span><span class="as-premium-card__tag">04</span></div>
                <h4>CRS e segregação</h4>
                <p>Checklist, PDF de liberação e regra de independência entre execução e emissão de CRS.</p>
              </article>
              <article class="as-premium-card as-regulatory-advantage as-regulatory-advantage--os" style="--as-card-accent:linear-gradient(90deg,#0b3d91,#c9a227);--as-card-icon-bg:linear-gradient(135deg,#0b3d91,#0a2f6b);">
                <div class="as-premium-card__glow" aria-hidden="true"></div>
                <div class="as-premium-card__top"><span class="as-premium-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg></span><span class="as-premium-card__tag">05</span></div>
                <h4>Enforcement na OS</h4>
                <p>Alertas de calibração, treino e subcontratação, bloqueio configurável no apontamento.</p>
              </article>
              <article class="as-premium-card as-regulatory-advantage as-regulatory-advantage--docs" style="--as-card-accent:linear-gradient(90deg,#c9a227,#0b3d91);--as-card-icon-bg:linear-gradient(135deg,#c9a227,#9a7b1a);">
                <div class="as-premium-card__glow" aria-hidden="true"></div>
                <div class="as-premium-card__top"><span class="as-premium-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg></span><span class="as-premium-card__tag">06</span></div>
                <h4>Certificado e quarentena</h4>
                <p>FAA 8130-3, EASA Form 1, ANAC, metadados, anexo e fluxo de quarentena rastreável.</p>
              </article>
            </div>
          </div>
          <aside class="as-regulatory-panel__aside" aria-label="Prévia de dossiê regulatório">
            <div class="as-regulatory-panel__dossier">
              <div class="as-regulatory-panel__dossier-head">
                <span class="as-regulatory-panel__dossier-kicker">Ferramenta em ação</span>
                <strong>Pacote auditoria + SGQ</strong>
                <span class="as-regulatory-panel__dossier-status">Pronto para exportar</span>
              </div>
              <div class="as-regulatory-panel__progress" aria-hidden="true"><span style="width:98%"></span></div>
              <ul class="as-regulatory-panel__dossier-list">
                <li class="is-done"><span aria-hidden="true">✓</span> OS #2847: histórico, job cards, CRS</li>
                <li class="is-done"><span aria-hidden="true">✓</span> Movimentações FIFO + certificado de peça</li>
                <li class="is-done"><span aria-hidden="true">✓</span> Export SGQ: CSVs + snapshot NC/CAPA</li>
                <li class="is-done"><span aria-hidden="true">✓</span> Indicadores SMS: KPIs e tendência 6 meses</li>
                <li class="is-active"><span aria-hidden="true">◎</span> Trilha RBAC: perfis Part 145 registrados</li>
              </ul>
              <div class="as-regulatory-panel__dossier-stats">
                <div><strong>Horas → minutos</strong><span>Montagem do dossiê</span></div>
                <div><strong>1 base</strong><span>Hangar · SGQ · estoque</span></div>
              </div>
            </div>
            <blockquote class="as-regulatory-panel__quote">
              <p>&ldquo;A conformidade deixa de ser projeto de fim de semana e passa a fazer parte da rotina do hangar.&rdquo;</p>
            </blockquote>
          </aside>
        </div>
        </div>
        ${
          showFootCta
            ? `<footer class="as-regulatory-panel__foot">
          <div class="as-regulatory-panel__foot-copy">
            <strong>Menos tempo reconstruindo evidências. Mais tempo operando com segurança regulatória.</strong>
            <p>Na demonstração, mostramos dossiê, export SGQ, indicadores SMS e trilhas a partir do fluxo real da sua oficina.</p>
          </div>
          <div class="as-regulatory-panel__foot-actions">
            <a class="as-btn as-btn--gold as-track-demo" href="${contatoAgendar}" data-as-event="cta_demo" data-as-location="home_regulatory_panel">Agendar demo de conformidade</a>
          </div>
        </footer>`
            : ''
        }
      </div>
    </div>
  </div>
</section>`);
}
