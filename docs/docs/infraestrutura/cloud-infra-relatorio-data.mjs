/** Relatório Estratégico — Infraestrutura Cloud Aero Suite (área comercial). */
export const META = {
  title: 'Relatório Estratégico de Infraestrutura Cloud',
  subtitle:
    'Levantamento de opções de hospedagem, custo-benefício e roteiro de implantação para operação SaaS de qualidade',
  reference: 'Aero Suite — Gestão Aeronáutica Integrada · MRO Part 145',
  version: '1.0',
  date: '18 de junho de 2026',
  classification: 'Confidencial · Diretoria e Área Comercial',
  audience: 'Área Comercial, Diretoria e Operações',
  site: 'https://app.aerosuite.com.br',
  signer: {
    name: 'Wellem Lyra',
    role: 'Diretor de TI',
    org: 'Aero Suite',
    email: 'wellemlyra@aerosuite.com.br',
  },
};

export const CURRENT_STATE = {
  repoLocal: 'D:\\Desenvolvimento\\aerosuite (desenvolvimento Windows + Docker Compose)',
  repoRemote: 'https://github.com/aerosuite-br/aerosuite (organização privada aerosuite-br)',
  branches: { prod: 'master', dev: 'desenv' },
  ci: 'GitHub Actions — backend Maven, frontend Angular, smoke i18n',
  prodUrl: 'https://app.aerosuite.com.br',
  stack: 'Java 21 (Quarkus) · Angular/nginx · MySQL 8 · Docker Compose',
  storage: 'OS, documentos SGQ, biblioteca técnica, assets de marca, backups',
  edge: 'Cloudflare (DNS, SSL, WAF, Tunnel)',
  email: 'SendGrid / SMTP transacional',
  decisionDoc: 'DECISAO-VPS.md — Hetzner CPX31 aprovado para piloto',
};

export const URGENCY = {
  headline: 'Momento crítico de maturidade do produto',
  points: [
    'Homologação UX concluída em múltiplas rodadas (Relatórios 2–5) com achados erradicados em produção.',
    'Clientes piloto e segmento MRO Part 145 exigem disponibilidade, isolamento multi-tenant e rastreabilidade.',
    'Operação atual mistura ambiente de desenvolvimento local com produção compartilhada — risco operacional e de imagem.',
    'Comercialização ativa requer SLA, backups testados, monitoramento e capacidade de escalar sem refatorar arquitetura.',
    'Atraso na infraestrutura dedicada compromete credibilidade perante oficinas e consultores de conformidade.',
  ],
};

/** Serviços necessários e por que cada um importa. */
export const SERVICES = [
  {
    id: 'compute',
    name: 'Computação (API + Web)',
    importance: 'Crítica',
    why: 'Executa o backend Quarkus e o frontend Angular. Sem capacidade estável, login, OS, estoque e Conformidade Técnica ficam indisponíveis.',
    spec: 'Mín. 4 vCPU, 8 GB RAM (piloto); Ubuntu 24.04 LTS; Docker CE.',
  },
  {
    id: 'database',
    name: 'Banco de dados MySQL',
    importance: 'Crítica',
    why: 'Armazena todos os tenants, RBAC, OS, estoque, SGQ e auditoria. Perda ou corrupção = parada total do negócio.',
    spec: 'MySQL 8, UTF-8, backups diários + retenção 30 dias; evoluir para instância gerida com réplica.',
  },
  {
    id: 'storage',
    name: 'Armazenamento de arquivos',
    importance: 'Alta',
    why: 'Anexos de OS, PDFs SGQ, logos por tenant, biblioteca técnica e dumps de backup exigem volumes persistentes e expansíveis.',
    spec: 'NVMe ≥ 160 GB no piloto; pastas /var/aerosuite/{os,empresa-assets,biblioteca,backups}.',
  },
  {
    id: 'cdn',
    name: 'CDN / WAF / DNS (Cloudflare)',
    importance: 'Alta',
    why: 'Protege contra ataques, termina SSL, reduz latência percebida e permite Tunnel sem expor portas no servidor.',
    spec: 'Plano Free ou Pro; Tunnel para 127.0.0.1:8081; DNS app.aerosuite.com.br.',
  },
  {
    id: 'email',
    name: 'E-mail transacional (SendGrid)',
    importance: 'Alta',
    why: 'Trial, reset de senha, propostas comerciais e alertas de conformidade dependem de entregabilidade profissional.',
    spec: 'Domínio autenticado (SPF/DKIM); API SendGrid já integrada no backend.',
  },
  {
    id: 'cicd',
    name: 'CI/CD (GitHub Actions)',
    importance: 'Média',
    why: 'Garante que cada release passou por build e testes antes de chegar ao cliente. Já operacional no repositório remoto.',
    spec: 'Workflows ci.yml, integration-smoke; secrets em GitHub Environments.',
  },
  {
    id: 'backup',
    name: 'Backup e recuperação',
    importance: 'Crítica',
    why: 'Conformidade Part 145 e LGPD exigem prova de restore. Snapshots do provedor + dumps MySQL automatizados.',
    spec: 'Snapshot semanal VPS + backup diário BD; teste de restore trimestral documentado.',
  },
  {
    id: 'monitor',
    name: 'Monitoramento e alertas',
    importance: 'Média',
    why: 'Detecta queda de API, disco cheio ou falha de migração Flyway antes do cliente perceber.',
    spec: 'Prometheus/Grafana (já no repo deploy/observability) ou UptimeRobot + alertas e-mail.',
  },
];

/** Cenário piloto: 1–15 organizações, tráfego moderado, Brasil + EU. */
export const PROVIDERS = [
  {
    rank: 1,
    name: 'Hetzner Cloud',
    model: 'VPS CPX31 + Docker Compose + Cloudflare Tunnel',
    region: 'EU (fsn1/nbg1) — latência ~180–220 ms BR',
    monthlyUsd: '22–28',
    monthlyBrl: '120–155',
    scoreCost: 9.5,
    scoreOps: 8.5,
    scoreScale: 7.5,
    scoreCompliance: 8.0,
    totalScore: 8.9,
    pros: [
      'Melhor custo-benefício comprovado no mercado VPS (4 vCPU, 8 GB, 160 GB NVMe).',
      'Alinhado à decisão interna D1 (DECISAO-VPS.md) e stack Docker já documentada.',
      'GDPR nativo (datacenter Alemanha); adequado a clientes com requisitos de soberania EU.',
      'Evolução linear: CCX23 ou MySQL gerido sem mudar aplicação.',
    ],
    cons: [
      'Latência maior para usuários 100% no Brasil (mitigável com Cloudflare caching).',
      'Suporte em inglês/alemão; equipe interna assume operação.',
    ],
    verdict: 'RECOMENDAÇÃO PRIMÁRIA — implantar imediatamente como produção dedicada.',
  },
  {
    rank: 2,
    name: 'DigitalOcean',
    model: 'Premium Droplet 8 GB + Docker Compose + Cloudflare',
    region: 'NYC ou SFO — latência similar à EU',
    monthlyUsd: '48–56',
    monthlyBrl: '265–310',
    scoreCost: 7.5,
    scoreOps: 9.0,
    scoreScale: 8.5,
    scoreCompliance: 7.5,
    totalScore: 8.1,
    pros: [
      'Documentação excelente; Managed MySQL e Spaces (S3) integrados no mesmo ecossistema.',
      'Painel intuitivo para equipe comercial acompanhar status de droplets.',
      'App Platform disponível para evolução futura sem reescrever deploy.',
    ],
    cons: [
      'Custo ~2× superior ao Hetzner para recursos equivalentes.',
      'Sem datacenter no Brasil na linha Droplet padrão.',
    ],
    verdict: 'ALTERNATIVA SÓLIDA — se priorizar ecossistema gerenciado e suporte em inglês acessível.',
  },
  {
    rank: 3,
    name: 'AWS (Lightsail + RDS)',
    model: 'Lightsail 8 GB + RDS MySQL db.t4g.micro + CloudFront/Route53',
    region: 'sa-east-1 (São Paulo) disponível para RDS; Lightsail US com CDN BR',
    monthlyUsd: '55–85',
    monthlyBrl: '300–470',
    scoreCost: 6.5,
    scoreOps: 8.0,
    scoreScale: 9.5,
    scoreCompliance: 9.0,
    totalScore: 8.0,
    pros: [
      'Credibilidade enterprise; região São Paulo para banco de dados.',
      'Caminho natural para escala (ECS, EKS, Aurora) sem troca de provedor.',
      'Certificações ISO/SOC valorizadas em licitações e grupos aeronáuticos.',
    ],
    cons: [
      'Custo mais alto e faturamento complexo (múltiplos serviços).',
      'Curva de aprendizado IAM/VPC para equipe enxuta.',
    ],
    verdict: 'CAMINHO ENTERPRISE — adotar quando contratos exigirem AWS ou volume > 30 tenants.',
  },
  {
    rank: 4,
    name: 'Google Cloud (GCE + Cloud SQL)',
    model: 'e2-standard-2 + Cloud SQL MySQL',
    region: 'southamerica-east1 (São Paulo)',
    monthlyUsd: '70–95',
    monthlyBrl: '385–520',
    scoreCost: 6.0,
    scoreOps: 7.5,
    scoreScale: 9.0,
    scoreCompliance: 8.5,
    totalScore: 7.5,
    pros: ['Região SP; Cloud SQL gerido com backups automáticos.', 'Bom para analytics futuro (BigQuery).'],
    cons: ['Custo elevado no piloto.', 'Deploy atual é Compose — exige adaptação ou GCE VM simples.'],
    verdict: 'Reserva estratégica — não ideal para fase piloto custo-eficiente.',
  },
  {
    rank: 5,
    name: 'Microsoft Azure',
    model: 'App Service B2 + Azure Database for MySQL',
    region: 'Brazil South',
    monthlyUsd: '80–110',
    monthlyBrl: '440–605',
    scoreCost: 5.5,
    scoreOps: 8.0,
    scoreScale: 9.0,
    scoreCompliance: 9.0,
    totalScore: 7.4,
    pros: ['Datacenter no Brasil; integração Microsoft 365 em clientes corporativos.'],
    cons: ['Custo mais alto; container Docker exige App Service Linux ou AKS (complexidade).'],
    verdict: 'Considerar sob demanda de clientes já padronizados em Azure.',
  },
  {
    rank: 6,
    name: 'Locaweb / provedores BR',
    model: 'VPS Linux 8 GB',
    region: 'Brasil',
    monthlyUsd: '35–50',
    monthlyBrl: '190–275',
    scoreCost: 7.0,
    scoreOps: 6.0,
    scoreScale: 5.5,
    scoreCompliance: 6.5,
    totalScore: 6.3,
    pros: ['Latência mínima no Brasil; suporte em português; faturamento em BRL.'],
    cons: [
      'Menor reputação internacional; I/O e SLA variáveis.',
      'Stack Docker multi-volume exige VPS dedicado — nem sempre disponível no tier econômico.',
    ],
    verdict: 'Opção regional — avaliar apenas se latência < 50 ms for requisito contratual.',
  },
];

export const TOP3 = PROVIDERS.filter((p) => p.rank <= 3);

export const COST_CHART = PROVIDERS.map((p) => ({
  label: p.name.split(' ')[0],
  value: parseInt(p.monthlyBrl.split('–')[0], 10),
  max: 620,
}));

export const SCORE_CHART = TOP3.map((p) => ({
  label: `#${p.rank} ${p.name.split(' ')[0]}`,
  value: p.totalScore,
  max: 10,
}));

export const ROADMAP = [
  {
    phase: 'Imediato (0–15 dias)',
    urgency: 'CRÍTICA',
    actions: [
      'Provisionar VPS Hetzner CPX31 dedicado à produção (separado de ambiente de desenvolvimento).',
      'Executar bootstrap-linux.sh, docker-compose.production.yml e Cloudflare Tunnel.',
      'Migrar app.aerosuite.com.br para instância dedicada com backups automáticos.',
      'Documentar credenciais em cofre (1Password/Bitwarden) e runbook OPERACAO-PRODUCAO.md.',
    ],
  },
  {
    phase: 'Curto prazo (15–45 dias)',
    urgency: 'ALTA',
    actions: [
      'Ambiente staging espelhado (CPX21) com dump anonimizado para homologação da consultora.',
      'Monitoramento uptime + alertas (API /health, disco, certificado).',
      'Teste de restore de backup documentado (evidência ANAC/LGPD).',
      'Pipeline deploy: tag em master → GitHub Actions → pull no servidor produção.',
    ],
  },
  {
    phase: 'Médio prazo (2–6 meses)',
    urgency: 'MÉDIA',
    actions: [
      'Separar MySQL para instância gerida quando > 10 tenants ou I/O saturar.',
      'Upgrade CCX23 (CPU dedicada) ou segundo nó se CPU > 70% sustentado.',
      'Avaliar CDN cache agressivo e região US (Ashburn) se base de clientes BR crescer.',
    ],
  },
  {
    phase: 'Longo prazo (6–18 meses)',
    urgency: 'PLANEJADA',
    actions: [
      'Kubernetes (Helm chart já no repo deploy/helm/aerosuite) para multi-região.',
      'Object storage S3-compatible para arquivos frios (biblioteca, backups longos).',
      'AWS/Azure se contrato enterprise exigir — migração facilitada por containers.',
    ],
  },
];

export const SECTIONS = [
  {
    id: '01',
    title: 'Situação atual — repositório e operação',
    intro:
      'Antes de comparar provedores, é essencial compreender onde estamos hoje: código, CI e produção já existem, mas a infraestrutura precisa ser formalizada para sustentar o comercial.',
  },
  {
    id: '02',
    title: 'Requisitos técnicos da aplicação',
    intro:
      'O Aero Suite é um SaaS multi-tenant com backend Java, frontend Angular, persistência relacional e grande volume de arquivos técnicos — cada camada de infraestrutura tem função específica.',
  },
  {
    id: '03',
    title: 'Panorama comparativo de provedores',
    intro:
      'Avaliamos seis cenários reais de mercado, com foco em custo mensal estimado (piloto), capacidade operacional, escala e adequação regulatória para o segmento aeronáutico.',
  },
  {
    id: '04',
    title: 'Top 3 recomendações',
    intro:
      'Com base no score composto (custo-benefício 40%, operação 25%, escala 20%, conformidade 15%), estas são as três opções que a Diretoria de TI recomenda à área comercial.',
  },
  {
    id: '05',
    title: 'Roteiro de implantação e urgência',
    intro:
      'O caminho não admite postergação: cada semana sem infraestrutura dedicada aumenta risco reputacional e limita a capacidade de onboarding de novos clientes MRO.',
  },
];

export const ARCHITECTURE_DIAGRAM = `┌─────────────┐     ┌──────────────────┐     ┌─────────────────────────────┐
│  Cliente    │────▶│  Cloudflare      │────▶│  VPS Produção (Docker)      │
│  MRO / Web  │     │  DNS · SSL · WAF │     │  nginx:8081 · API:8080      │
└─────────────┘     │  Tunnel          │     │  MySQL · volumes /var/...   │
                    └──────────────────┘     └─────────────────────────────┘
┌─────────────┐     ┌──────────────────┐              ▲
│  Dev local  │────▶│  GitHub          │── CI/CD ─────┘
│  + Docker   │     │  aerosuite-br    │     deploy tag master
└─────────────┘     └──────────────────┘`;

export const COMMERCIAL_MESSAGE =
  'Para a área comercial: a infraestrutura proposta não é um custo técnico abstrato — é o alicerce do SLA que podemos prometer a oficinas homologadas. Com Hetzner + Cloudflare, o investimento mensal inicial fica na faixa de um único contrato piloto MRO, enquanto indisponibilidade ou perda de dados custaria múltiplos contratos e credibilidade no mercado Part 145.';
