/** Conteúdo — Guia de Operação Git Remoto Aero Suite (PDF premium). */
export const META = {
  title: 'Guia de Operação Git — Ambiente Remoto',
  subtitle: 'Procedimentos para manutenção do código, CI/CD e releases',
  reference: 'aerosuite-br/aerosuite · Organização GitHub',
  version: '1.0',
  date: '18 de junho de 2026',
  site: 'https://github.com/aerosuite-br/aerosuite',
  classification: 'Interno · Equipe de desenvolvimento',
};

export const SUMMARY = {
  repoUrl: 'https://github.com/aerosuite-br/aerosuite',
  org: 'aerosuite-br',
  repo: 'aerosuite',
  defaultBranch: 'master',
  devBranch: 'desenv',
  visibility: 'Privado',
  ciStatus: 'Verde (Backend, Frontend, Menu i18n)',
};

export const SECTIONS = [
  {
    id: '01',
    title: 'Visão geral e acessos',
    intro:
      'O código oficial do Aero Suite está centralizado na organização GitHub aerosuite-br. Este capítulo define quem acessa o quê e quais ferramentas instalar no posto de trabalho.',
    blocks: [
      {
        type: 'table',
        title: 'Recursos principais',
        rows: [
          ['Organização', '@aerosuite-br'],
          ['Repositório', 'aerosuite (privado)'],
          ['URL', 'https://github.com/aerosuite-br/aerosuite'],
          ['Branch produção', 'master'],
          ['Branch desenvolvimento', 'desenv'],
          ['CI', 'GitHub Actions — workflow CI'],
          ['Ambientes', 'staging (desenv) · production (master)'],
        ],
      },
      {
        type: 'list',
        title: 'Pré-requisitos no computador',
        items: [
          'Git for Windows (ou Git no Linux/macOS) — https://git-scm.com',
          'GitHub CLI (gh) — https://cli.github.com — recomendado para autenticação e PRs',
          'Node.js 20+ e Java 21 — alinhados ao CI',
          'Conta GitHub convidada na organização aerosuite-br (aceitar convite por e-mail)',
        ],
      },
      {
        type: 'callout',
        variant: 'warn',
        text:
          'Nunca envie senhas, tokens PAT ou códigos de dispositivo por chat ou e-mail. A autenticação é feita apenas no seu terminal com gh auth login.',
      },
    ],
  },
  {
    id: '02',
    title: 'Autenticação GitHub CLI',
    intro:
      'Antes de push, pull ou criação de PR, o gh deve estar autenticado com escopos repo e workflow (obrigatório para enviar arquivos .github/workflows/).',
    blocks: [
      {
        type: 'steps',
        title: 'Primeiro login',
        steps: [
          'Abra PowerShell e execute: gh auth login',
          'Escolha: GitHub.com → HTTPS → Login with a web browser',
          'Copie o código exibido e autorize em https://github.com/login/device',
          'Na tela “Authorize GitHub CLI”, confirme acesso à organização aerosuite-br',
          'Se o push falhar por workflow, execute: gh auth refresh -h github.com -s workflow,repo,read:org,gist',
          'Valide: gh auth status (deve listar workflow entre os escopos)',
          'Configure Git para usar credenciais do gh: gh auth setup-git',
        ],
      },
      {
        type: 'code',
        title: 'Verificação rápida',
        lines: [
          'gh auth status',
          'git remote -v',
          'git branch -a',
        ],
      },
    ],
  },
  {
    id: '03',
    title: 'Clonar e configurar o repositório local',
    intro:
      'Desenvolvedores que ainda não possuem cópia local devem clonar a branch desenv e configurar identidade Git.',
    blocks: [
      {
        type: 'code',
        title: 'Clone inicial (HTTPS)',
        lines: [
          'cd D:\\Desenvolvimento',
          'git clone https://github.com/aerosuite-br/aerosuite.git',
          'cd aerosuite',
          'git checkout desenv',
          'git pull origin desenv',
        ],
      },
      {
        type: 'code',
        title: 'Remote já existente (atualizar URL)',
        lines: [
          'git remote set-url origin https://github.com/aerosuite-br/aerosuite.git',
          'git fetch origin',
          'git branch -u origin/desenv desenv',
        ],
      },
      {
        type: 'list',
        title: 'Configuração de identidade (uma vez por máquina)',
        items: [
          'git config user.name "Seu Nome"',
          'git config user.email "seu.email@aerosuite.com.br"',
          'Use o e-mail corporativo associado à conta GitHub',
        ],
      },
    ],
  },
  {
    id: '04',
    title: 'Estratégia de branches e fluxo diário',
    intro:
      'O trabalho cotidiano ocorre em desenv. Releases e deploy em produção partem de master, sempre via Pull Request após CI verde.',
    blocks: [
      {
        type: 'diagram',
        text: 'desenv ──(PR + CI verde)──► master ──(tag v*)──► deploy produção',
      },
      {
        type: 'table',
        title: 'Papéis das branches',
        rows: [
          ['desenv', 'Integração contínua, homologação UX, correções do dia a dia'],
          ['master', 'Linha de produção — somente merge revisado'],
          ['saas/**', 'Features SaaS isoladas (CI monitora)'],
          ['tags v*', 'Marcos de release (ex.: v1.0.0)'],
        ],
      },
      {
        type: 'steps',
        title: 'Rotina diária (desenv)',
        steps: [
          'git checkout desenv',
          'git pull origin desenv',
          'Implementar alterações e testar localmente',
          'git status — revisar arquivos (não commitar target/, node_modules/, .env)',
          'git add <arquivos relevantes>',
          'git commit -m "tipo(escopo): descrição clara"',
          'git push origin desenv',
          'Aguardar CI verde em GitHub → Actions',
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        text:
          'No plano GitHub Free com repositório privado, branch protection automática exige upgrade. Até lá: disciplina de PR + CODEOWNERS + revisão humana em master.',
      },
    ],
  },
  {
    id: '05',
    title: 'Pull Requests e revisão',
    intro:
      'Toda entrada em master deve passar por Pull Request. O repositório inclui template de PR e CODEOWNERS para orientar revisão.',
    blocks: [
      {
        type: 'steps',
        title: 'Abrir PR desenv → master',
        steps: [
          'Com desenv atualizado e push feito, acesse o repositório no GitHub',
          'Clique em “Compare & pull request” ou: gh pr create --base master --head desenv',
          'Preencha o template: resumo, checklist CI, tipo de mudança',
          'Aguarde jobs: Backend (Maven), Frontend (npm), Menu i18n audit',
          'Após aprovação, use “Squash and merge” ou “Merge commit” conforme política da equipe',
          'Delete branch temporária se aplicável',
        ],
      },
      {
        type: 'list',
        title: 'Boas práticas de commit',
        items: [
          'Prefixos: fix, feat, chore, docs, test, refactor',
          'Mensagem no imperativo: “corrigir validação PN” não “corrigido…”',
          'Um commit = uma intenção lógica; evite commits gigantes',
          'Não incluir artefatos de build (backend/target, .tmp-*)',
          'UI nova: chaves i18n em pt-BR, en-US, es-ES, fr-FR',
        ],
      },
    ],
  },
  {
    id: '06',
    title: 'CI/CD e qualidade',
    intro:
      'O pipeline CI dispara em push e PR para master, desenv, develop e saas/**. E2E Playwright roda em PR manual/dispatch.',
    blocks: [
      {
        type: 'table',
        title: 'Workflows',
        rows: [
          ['ci.yml', 'Push/PR — Maven verify, npm build, testes unitários, a11y smoke'],
          ['integration-smoke.yml', 'Manual — smoke HTTP contra API'],
          ['covered-suite.yml', 'Manual — stack Docker + suite coberta'],
        ],
      },
      {
        type: 'table',
        title: 'Jobs obrigatórios (CI padrão)',
        rows: [
          ['Backend (Maven)', 'mvn verify — testes + JaCoCo mínimo 18%'],
          ['Frontend (npm)', 'npm ci, build, Vitest, a11y axe e fluxos F1–F12'],
          ['Menu i18n audit', 'Cobertura menu.func.* / menu.section.*'],
        ],
      },
      {
        type: 'code',
        title: 'Validar localmente antes do push',
        lines: [
          'cd backend && mvn -B verify',
          'cd frontend && npm ci && npm run build && npm run test:unit',
          'powershell -File scripts/test/audit-menu-i18n.ps1 -SkipApi',
        ],
      },
    ],
  },
  {
    id: '07',
    title: 'Secrets, variáveis e ambientes',
    intro:
      'Secrets de teste e URLs de homologação estão em Settings → Secrets and variables → Actions. Ambientes staging e production restringem deploy por branch.',
    blocks: [
      {
        type: 'table',
        title: 'Secrets configurados (repo)',
        rows: [
          ['AEROSUITE_TEST_EMAIL', 'Login plataforma (tenant default)'],
          ['AEROSUITE_TEST_PASSWORD', 'Senha de teste — não expor'],
          ['AEROSUITE_TEST_TENANT', 'default'],
          ['AEROSUITE_DEMO_* / MULTI_TENANT_*', 'Cenários demo e isolamento'],
        ],
      },
      {
        type: 'table',
        title: 'Variables',
        rows: [
          ['AEROSUITE_WEB_URL', 'https://app.aerosuite.com.br'],
          ['AEROSUITE_API_URL', 'https://app.aerosuite.com.br/api'],
        ],
      },
      {
        type: 'table',
        title: 'Environments',
        rows: [
          ['staging', 'Deploy permitido a partir da branch desenv'],
          ['production', 'Deploy permitido a partir da branch master'],
        ],
      },
      {
        type: 'callout',
        variant: 'warn',
        text: 'Nunca commitar .env, credenciais SMTP, chaves Stripe ou JWT. Use .env.example como referência.',
      },
    ],
  },
  {
    id: '08',
    title: 'Release e deploy produção',
    intro:
      'Após merge em master, marque a release com tag semântica e siga o checklist de deploy no servidor Hetzner.',
    blocks: [
      {
        type: 'steps',
        title: 'Release versionada',
        steps: [
          'git checkout master && git pull origin master',
          'git tag -a v1.0.0 -m "Release 1.0.0 — descrição"',
          'git push origin v1.0.0',
          'Opcional: criar GitHub Release com notas a partir da tag',
        ],
      },
      {
        type: 'steps',
        title: 'Deploy servidor (/opt/aerosuite)',
        steps: [
          'SSH no VPS Ubuntu 24.04 (Hetzner)',
          'git clone ou git pull em /opt/aerosuite (branch master ou tag)',
          'Configurar .env.production (ver docs/DEPLOY-PRODUCAO.md)',
          'docker compose -f docker-compose.yml -f docker-compose.production.yml up -d --build',
          'Executar smoke pós-deploy (scripts/deploy/pre-deploy-check.ps1)',
        ],
      },
    ],
  },
  {
    id: '09',
    title: 'Solução de problemas',
    intro: 'Erros frequentes e resolução objetiva.',
    blocks: [
      {
        type: 'faq',
        items: [
          {
            q: 'Push rejeitado: OAuth App cannot update workflow without workflow scope',
            a: 'Execute gh auth refresh -h github.com -s workflow,repo,read:org,gist e autorize no navegador.',
          },
          {
            q: 'setup-node: unable to cache dependencies',
            a: 'Garanta que frontend/package-lock.json está commitado. Use npm ci no frontend.',
          },
          {
            q: 'CI falha em Menu i18n audit',
            a: 'Adicione chaves menu.func.* faltantes em menu-i18n.ts nas 4 línguas. Rode audit-menu-i18n.ps1 -SkipApi.',
          },
          {
            q: 'Conflito ao fazer pull',
            a: 'git stash → git pull → git stash pop. Resolva conflitos, teste, commit e push.',
          },
          {
            q: 'Remote incorreto (404)',
            a: 'git remote set-url origin https://github.com/aerosuite-br/aerosuite.git',
          },
        ],
      },
    ],
  },
  {
    id: '10',
    title: 'Referências e contatos',
    intro: 'Documentação complementar no repositório.',
    blocks: [
      {
        type: 'list',
        title: 'Documentos no repo',
        items: [
          'docs/GITHUB-PRODUCAO-SETUP.md — bootstrap e checklist',
          'docs/CI-SECRETS.md — secrets Actions',
          'docs/DEPLOY-PRODUCAO.md — deploy Hetzner',
          'docs/COMANDOS_RAPIDOS_GITHUB.md — cola de comandos',
          '.github/pull_request_template.md — template de PR',
        ],
      },
      {
        type: 'table',
        title: 'Suporte',
        rows: [
          ['Diretor de TI', 'Wellem Lyra — wellemlyra@aerosuite.com.br'],
          ['Organização GitHub', 'https://github.com/aerosuite-br'],
          ['Actions / CI', 'https://github.com/aerosuite-br/aerosuite/actions'],
        ],
      },
    ],
  },
];

export const CHECKLIST = [
  'Conta GitHub na organização aerosuite-br',
  'gh auth login com escopo workflow',
  'Repositório clonado; branch desenv ativa',
  'git pull antes de cada sessão de trabalho',
  'Commits sem secrets nem artefatos de build',
  'Push para desenv; PR para master',
  'CI verde antes de merge',
  'Tag semântica após release em master',
];
