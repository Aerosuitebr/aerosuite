export interface HelpSectionDef {
  titleKey: string;
  icon?: string;
  contentKeys: string[];
}

export interface HelpContentDef {
  route: string;
  titleKey: string;
  sections: HelpSectionDef[];
}

export const PAGE_HELP_DEFINITIONS: HelpContentDef[] = [
  {
    "route": "/configuracoes",
    "titleKey": "pageHelp.configuracoes.title",
    "sections": [
      {
        "titleKey": "pageHelp.configuracoes.s0.title",
        "icon": "pi pi-info-circle",
        "contentKeys": [
          "pageHelp.configuracoes.s0.c0",
          "pageHelp.configuracoes.s0.c1"
        ]
      },
      {
        "titleKey": "pageHelp.configuracoes.s1.title",
        "icon": "pi pi-cog",
        "contentKeys": [
          "pageHelp.configuracoes.s1.c0",
          "pageHelp.configuracoes.s1.c1",
          "pageHelp.configuracoes.s1.c2",
          "pageHelp.configuracoes.s1.c3"
        ]
      },
      {
        "titleKey": "pageHelp.configuracoes.s2.title",
        "icon": "pi pi-list",
        "contentKeys": [
          "pageHelp.configuracoes.s2.c0",
          "pageHelp.configuracoes.s2.c1",
          "pageHelp.configuracoes.s2.c2",
          "pageHelp.configuracoes.s2.c3"
        ]
      }
    ]
  },
  {
    "route": "/products",
    "titleKey": "pageHelp.products.title",
    "sections": [
      {
        "titleKey": "pageHelp.products.s0.title",
        "icon": "pi pi-info-circle",
        "contentKeys": [
          "pageHelp.products.s0.c0",
          "pageHelp.products.s0.c1"
        ]
      },
      {
        "titleKey": "pageHelp.products.s1.title",
        "icon": "pi pi-box",
        "contentKeys": [
          "pageHelp.products.s1.c0",
          "pageHelp.products.s1.c1",
          "pageHelp.products.s1.c2",
          "pageHelp.products.s1.c3"
        ]
      },
      {
        "titleKey": "pageHelp.products.s2.title",
        "icon": "pi pi-list",
        "contentKeys": [
          "pageHelp.products.s2.c0",
          "pageHelp.products.s2.c1",
          "pageHelp.products.s2.c2",
          "pageHelp.products.s2.c3",
          "pageHelp.products.s2.c4",
          "pageHelp.products.s2.c5"
        ]
      }
    ]
  },
  {
    "route": "/fabricantes",
    "titleKey": "pageHelp.fabricantes.title",
    "sections": [
      {
        "titleKey": "pageHelp.fabricantes.s0.title",
        "icon": "pi pi-info-circle",
        "contentKeys": [
          "pageHelp.fabricantes.s0.c0",
          "pageHelp.fabricantes.s0.c1"
        ]
      },
      {
        "titleKey": "pageHelp.fabricantes.s1.title",
        "icon": "pi pi-building",
        "contentKeys": [
          "pageHelp.fabricantes.s1.c0",
          "pageHelp.fabricantes.s1.c1",
          "pageHelp.fabricantes.s1.c2",
          "pageHelp.fabricantes.s1.c3"
        ]
      },
      {
        "titleKey": "pageHelp.fabricantes.s2.title",
        "icon": "pi pi-list",
        "contentKeys": [
          "pageHelp.fabricantes.s2.c0",
          "pageHelp.fabricantes.s2.c1",
          "pageHelp.fabricantes.s2.c2",
          "pageHelp.fabricantes.s2.c3",
          "pageHelp.fabricantes.s2.c4",
          "pageHelp.fabricantes.s2.c5"
        ]
      }
    ]
  },
  {
    "route": "/fcu",
    "titleKey": "pageHelp.fcu.title",
    "sections": [
      {
        "titleKey": "pageHelp.fcu.s0.title",
        "icon": "pi pi-info-circle",
        "contentKeys": [
          "pageHelp.fcu.s0.c0",
          "pageHelp.fcu.s0.c1"
        ]
      },
      {
        "titleKey": "pageHelp.fcu.s1.title",
        "icon": "pi pi-microchip",
        "contentKeys": [
          "pageHelp.fcu.s1.c0",
          "pageHelp.fcu.s1.c1",
          "pageHelp.fcu.s1.c2",
          "pageHelp.fcu.s1.c3"
        ]
      },
      {
        "titleKey": "pageHelp.fcu.s2.title",
        "icon": "pi pi-list",
        "contentKeys": [
          "pageHelp.fcu.s2.c0",
          "pageHelp.fcu.s2.c1",
          "pageHelp.fcu.s2.c2",
          "pageHelp.fcu.s2.c3",
          "pageHelp.fcu.s2.c4",
          "pageHelp.fcu.s2.c5"
        ]
      }
    ]
  },
  {
    "route": "/tipos-servico",
    "titleKey": "pageHelp.tipos-servico.title",
    "sections": [
      {
        "titleKey": "pageHelp.tipos-servico.s0.title",
        "icon": "pi pi-info-circle",
        "contentKeys": [
          "pageHelp.tipos-servico.s0.c0",
          "pageHelp.tipos-servico.s0.c1"
        ]
      },
      {
        "titleKey": "pageHelp.tipos-servico.s1.title",
        "icon": "pi pi-wrench",
        "contentKeys": [
          "pageHelp.tipos-servico.s1.c0",
          "pageHelp.tipos-servico.s1.c1",
          "pageHelp.tipos-servico.s1.c2",
          "pageHelp.tipos-servico.s1.c3"
        ]
      },
      {
        "titleKey": "pageHelp.tipos-servico.s2.title",
        "icon": "pi pi-list",
        "contentKeys": [
          "pageHelp.tipos-servico.s2.c0",
          "pageHelp.tipos-servico.s2.c1",
          "pageHelp.tipos-servico.s2.c2",
          "pageHelp.tipos-servico.s2.c3",
          "pageHelp.tipos-servico.s2.c4",
          "pageHelp.tipos-servico.s2.c5"
        ]
      }
    ]
  },
  {
    "route": "/os",
    "titleKey": "pageHelp.os.title",
    "sections": [
      {
        "titleKey": "pageHelp.os.s0.title",
        "icon": "pi pi-info-circle",
        "contentKeys": [
          "pageHelp.os.s0.c0",
          "pageHelp.os.s0.c1"
        ]
      },
      {
        "titleKey": "pageHelp.os.s1.title",
        "icon": "pi pi-file-edit",
        "contentKeys": [
          "pageHelp.os.s1.c0",
          "pageHelp.os.s1.c1",
          "pageHelp.os.s1.c2",
          "pageHelp.os.s1.c3",
          "pageHelp.os.s1.c4",
          "pageHelp.os.s1.c5"
        ]
      },
      {
        "titleKey": "pageHelp.os.s2.title",
        "icon": "pi pi-list",
        "contentKeys": [
          "pageHelp.os.s2.c0",
          "pageHelp.os.s2.c1",
          "pageHelp.os.s2.c2",
          "pageHelp.os.s2.c3",
          "pageHelp.os.s2.c4",
          "pageHelp.os.s2.c5",
          "pageHelp.os.s2.c6",
          "pageHelp.os.s2.c7"
        ]
      },
      {
        "titleKey": "pageHelp.os.s3.title",
        "icon": "pi pi-lightbulb",
        "contentKeys": [
          "pageHelp.os.s3.c0",
          "pageHelp.os.s3.c1",
          "pageHelp.os.s3.c2",
          "pageHelp.os.s3.c3"
        ]
      }
    ]
  },
  {
    "route": "/usuarios",
    "titleKey": "pageHelp.usuarios.title",
    "sections": [
      {
        "titleKey": "pageHelp.usuarios.s0.title",
        "icon": "pi pi-info-circle",
        "contentKeys": [
          "pageHelp.usuarios.s0.c0",
          "pageHelp.usuarios.s0.c1"
        ]
      },
      {
        "titleKey": "pageHelp.usuarios.s1.title",
        "icon": "pi pi-users",
        "contentKeys": [
          "pageHelp.usuarios.s1.c0",
          "pageHelp.usuarios.s1.c1",
          "pageHelp.usuarios.s1.c2",
          "pageHelp.usuarios.s1.c3",
          "pageHelp.usuarios.s1.c4",
          "pageHelp.usuarios.s1.c5"
        ]
      },
      {
        "titleKey": "pageHelp.usuarios.s2.title",
        "icon": "pi pi-list",
        "contentKeys": [
          "pageHelp.usuarios.s2.c0",
          "pageHelp.usuarios.s2.c1",
          "pageHelp.usuarios.s2.c2",
          "pageHelp.usuarios.s2.c3",
          "pageHelp.usuarios.s2.c4",
          "pageHelp.usuarios.s2.c5",
          "pageHelp.usuarios.s2.c6",
          "pageHelp.usuarios.s2.c7"
        ]
      }
    ]
  },
  {
    "route": "/perfis",
    "titleKey": "pageHelp.perfis.title",
    "sections": [
      {
        "titleKey": "pageHelp.perfis.s0.title",
        "icon": "pi pi-info-circle",
        "contentKeys": [
          "pageHelp.perfis.s0.c0",
          "pageHelp.perfis.s0.c1"
        ]
      },
      {
        "titleKey": "pageHelp.perfis.s1.title",
        "icon": "pi pi-id-card",
        "contentKeys": [
          "pageHelp.perfis.s1.c0",
          "pageHelp.perfis.s1.c1",
          "pageHelp.perfis.s1.c2",
          "pageHelp.perfis.s1.c3",
          "pageHelp.perfis.s1.c4"
        ]
      },
      {
        "titleKey": "pageHelp.perfis.s2.title",
        "icon": "pi pi-list",
        "contentKeys": [
          "pageHelp.perfis.s2.c0",
          "pageHelp.perfis.s2.c1",
          "pageHelp.perfis.s2.c2",
          "pageHelp.perfis.s2.c3",
          "pageHelp.perfis.s2.c4",
          "pageHelp.perfis.s2.c5",
          "pageHelp.perfis.s2.c6"
        ]
      }
    ]
  },
  {
    "route": "/funcionalidades",
    "titleKey": "pageHelp.funcionalidades.title",
    "sections": [
      {
        "titleKey": "pageHelp.funcionalidades.s0.title",
        "icon": "pi pi-info-circle",
        "contentKeys": [
          "pageHelp.funcionalidades.s0.c0",
          "pageHelp.funcionalidades.s0.c1"
        ]
      },
      {
        "titleKey": "pageHelp.funcionalidades.s1.title",
        "icon": "pi pi-list",
        "contentKeys": [
          "pageHelp.funcionalidades.s1.c0",
          "pageHelp.funcionalidades.s1.c1",
          "pageHelp.funcionalidades.s1.c2",
          "pageHelp.funcionalidades.s1.c3",
          "pageHelp.funcionalidades.s1.c4"
        ]
      },
      {
        "titleKey": "pageHelp.funcionalidades.s2.title",
        "icon": "pi pi-list",
        "contentKeys": [
          "pageHelp.funcionalidades.s2.c0",
          "pageHelp.funcionalidades.s2.c1",
          "pageHelp.funcionalidades.s2.c2",
          "pageHelp.funcionalidades.s2.c3",
          "pageHelp.funcionalidades.s2.c4",
          "pageHelp.funcionalidades.s2.c5",
          "pageHelp.funcionalidades.s2.c6"
        ]
      }
    ]
  },
  {
    "route": "/controle-acesso",
    "titleKey": "pageHelp.controle-acesso.title",
    "sections": [
      {
        "titleKey": "pageHelp.controle-acesso.s0.title",
        "icon": "pi pi-info-circle",
        "contentKeys": [
          "pageHelp.controle-acesso.s0.c0",
          "pageHelp.controle-acesso.s0.c1"
        ]
      },
      {
        "titleKey": "pageHelp.controle-acesso.s1.title",
        "icon": "pi pi-shield",
        "contentKeys": [
          "pageHelp.controle-acesso.s1.c0",
          "pageHelp.controle-acesso.s1.c1",
          "pageHelp.controle-acesso.s1.c2",
          "pageHelp.controle-acesso.s1.c3",
          "pageHelp.controle-acesso.s1.c4"
        ]
      },
      {
        "titleKey": "pageHelp.controle-acesso.s2.title",
        "icon": "pi pi-list",
        "contentKeys": [
          "pageHelp.controle-acesso.s2.c0",
          "pageHelp.controle-acesso.s2.c1",
          "pageHelp.controle-acesso.s2.c2",
          "pageHelp.controle-acesso.s2.c3",
          "pageHelp.controle-acesso.s2.c4",
          "pageHelp.controle-acesso.s2.c5",
          "pageHelp.controle-acesso.s2.c6"
        ]
      }
    ]
  },
  {
    "route": "/settings/backup",
    "titleKey": "pageHelp.settings-backup.title",
    "sections": [
      {
        "titleKey": "pageHelp.settings-backup.s0.title",
        "icon": "pi pi-info-circle",
        "contentKeys": [
          "pageHelp.settings-backup.s0.c0",
          "pageHelp.settings-backup.s0.c1"
        ]
      },
      {
        "titleKey": "pageHelp.settings-backup.s1.title",
        "icon": "pi pi-database",
        "contentKeys": [
          "pageHelp.settings-backup.s1.c0",
          "pageHelp.settings-backup.s1.c1",
          "pageHelp.settings-backup.s1.c2",
          "pageHelp.settings-backup.s1.c3",
          "pageHelp.settings-backup.s1.c4",
          "pageHelp.settings-backup.s1.c5"
        ]
      },
      {
        "titleKey": "pageHelp.settings-backup.s2.title",
        "icon": "pi pi-list",
        "contentKeys": [
          "pageHelp.settings-backup.s2.c0",
          "pageHelp.settings-backup.s2.c1",
          "pageHelp.settings-backup.s2.c2",
          "pageHelp.settings-backup.s2.c3",
          "pageHelp.settings-backup.s2.c4",
          "pageHelp.settings-backup.s2.c5",
          "pageHelp.settings-backup.s2.c6",
          "pageHelp.settings-backup.s2.c7",
          "pageHelp.settings-backup.s2.c8"
        ]
      },
      {
        "titleKey": "pageHelp.settings-backup.s3.title",
        "icon": "pi pi-lightbulb",
        "contentKeys": [
          "pageHelp.settings-backup.s3.c0",
          "pageHelp.settings-backup.s3.c1",
          "pageHelp.settings-backup.s3.c2",
          "pageHelp.settings-backup.s3.c3",
          "pageHelp.settings-backup.s3.c4"
        ]
      }
    ]
  },
  {
    "route": "/fcu-assembly",
    "titleKey": "pageHelp.fcu-assembly.title",
    "sections": [
      {
        "titleKey": "pageHelp.fcu-assembly.s0.title",
        "icon": "pi pi-info-circle",
        "contentKeys": [
          "pageHelp.fcu-assembly.s0.c0",
          "pageHelp.fcu-assembly.s0.c1"
        ]
      },
      {
        "titleKey": "pageHelp.fcu-assembly.s1.title",
        "icon": "pi pi-file-edit",
        "contentKeys": [
          "pageHelp.fcu-assembly.s1.c0",
          "pageHelp.fcu-assembly.s1.c1",
          "pageHelp.fcu-assembly.s1.c2",
          "pageHelp.fcu-assembly.s1.c3",
          "pageHelp.fcu-assembly.s1.c4",
          "pageHelp.fcu-assembly.s1.c5"
        ]
      },
      {
        "titleKey": "pageHelp.fcu-assembly.s2.title",
        "icon": "pi pi-list",
        "contentKeys": [
          "pageHelp.fcu-assembly.s2.c0",
          "pageHelp.fcu-assembly.s2.c1",
          "pageHelp.fcu-assembly.s2.c2",
          "pageHelp.fcu-assembly.s2.c3",
          "pageHelp.fcu-assembly.s2.c4",
          "pageHelp.fcu-assembly.s2.c5",
          "pageHelp.fcu-assembly.s2.c6",
          "pageHelp.fcu-assembly.s2.c7"
        ]
      },
      {
        "titleKey": "pageHelp.fcu-assembly.s3.title",
        "icon": "pi pi-lightbulb",
        "contentKeys": [
          "pageHelp.fcu-assembly.s3.c0",
          "pageHelp.fcu-assembly.s3.c1",
          "pageHelp.fcu-assembly.s3.c2",
          "pageHelp.fcu-assembly.s3.c3",
          "pageHelp.fcu-assembly.s3.c4"
        ]
      }
    ]
  },
  {
    "route": "/",
    "titleKey": "pageHelp.home.title",
    "sections": [
      {
        "titleKey": "pageHelp.home.s0.title",
        "icon": "pi pi-info-circle",
        "contentKeys": [
          "pageHelp.home.s0.c0",
          "pageHelp.home.s0.c1"
        ]
      },
      {
        "titleKey": "pageHelp.home.s1.title",
        "icon": "pi pi-home",
        "contentKeys": [
          "pageHelp.home.s1.c0",
          "pageHelp.home.s1.c1",
          "pageHelp.home.s1.c2",
          "pageHelp.home.s1.c3"
        ]
      },
      {
        "titleKey": "pageHelp.home.s2.title",
        "icon": "pi pi-list",
        "contentKeys": [
          "pageHelp.home.s2.c0",
          "pageHelp.home.s2.c1",
          "pageHelp.home.s2.c2",
          "pageHelp.home.s2.c3"
        ]
      }
    ]
  },
  {
    "route": "/propostas-comerciais",
    "titleKey": "pageHelp.propostas-comerciais.title",
    "sections": [
      {
        "titleKey": "pageHelp.propostas-comerciais.s0.title",
        "icon": "pi pi-info-circle",
        "contentKeys": [
          "pageHelp.propostas-comerciais.s0.c0",
          "pageHelp.propostas-comerciais.s0.c1",
          "pageHelp.propostas-comerciais.s0.c2"
        ]
      },
      {
        "titleKey": "pageHelp.propostas-comerciais.s1.title",
        "icon": "pi pi-file-edit",
        "contentKeys": [
          "pageHelp.propostas-comerciais.s1.c0",
          "pageHelp.propostas-comerciais.s1.c1",
          "pageHelp.propostas-comerciais.s1.c2",
          "pageHelp.propostas-comerciais.s1.c3",
          "pageHelp.propostas-comerciais.s1.c4",
          "pageHelp.propostas-comerciais.s1.c5"
        ]
      },
      {
        "titleKey": "pageHelp.propostas-comerciais.s2.title",
        "icon": "pi pi-box",
        "contentKeys": [
          "pageHelp.propostas-comerciais.s2.c0",
          "pageHelp.propostas-comerciais.s2.c1",
          "pageHelp.propostas-comerciais.s2.c2",
          "pageHelp.propostas-comerciais.s2.c3",
          "pageHelp.propostas-comerciais.s2.c4",
          "pageHelp.propostas-comerciais.s2.c5",
          "pageHelp.propostas-comerciais.s2.c6",
          "pageHelp.propostas-comerciais.s2.c7"
        ]
      },
      {
        "titleKey": "pageHelp.propostas-comerciais.s3.title",
        "icon": "pi pi-user",
        "contentKeys": [
          "pageHelp.propostas-comerciais.s3.c0",
          "pageHelp.propostas-comerciais.s3.c1",
          "pageHelp.propostas-comerciais.s3.c2",
          "pageHelp.propostas-comerciais.s3.c3",
          "pageHelp.propostas-comerciais.s3.c4"
        ]
      },
      {
        "titleKey": "pageHelp.propostas-comerciais.s4.title",
        "icon": "pi pi-file",
        "contentKeys": [
          "pageHelp.propostas-comerciais.s4.c0",
          "pageHelp.propostas-comerciais.s4.c1",
          "pageHelp.propostas-comerciais.s4.c2",
          "pageHelp.propostas-comerciais.s4.c3",
          "pageHelp.propostas-comerciais.s4.c4"
        ]
      },
      {
        "titleKey": "pageHelp.propostas-comerciais.s5.title",
        "icon": "pi pi-sync",
        "contentKeys": [
          "pageHelp.propostas-comerciais.s5.c0",
          "pageHelp.propostas-comerciais.s5.c1",
          "pageHelp.propostas-comerciais.s5.c2",
          "pageHelp.propostas-comerciais.s5.c3",
          "pageHelp.propostas-comerciais.s5.c4"
        ]
      },
      {
        "titleKey": "pageHelp.propostas-comerciais.s6.title",
        "icon": "pi pi-lightbulb",
        "contentKeys": [
          "pageHelp.propostas-comerciais.s6.c0",
          "pageHelp.propostas-comerciais.s6.c1",
          "pageHelp.propostas-comerciais.s6.c2",
          "pageHelp.propostas-comerciais.s6.c3",
          "pageHelp.propostas-comerciais.s6.c4",
          "pageHelp.propostas-comerciais.s6.c5"
        ]
      }
    ]
  },
  {
    "route": "/usuarios-externos",
    "titleKey": "pageHelp.usuarios-externos.title",
    "sections": [
      {
        "titleKey": "pageHelp.usuarios-externos.s0.title",
        "icon": "pi pi-info-circle",
        "contentKeys": [
          "pageHelp.usuarios-externos.s0.c0",
          "pageHelp.usuarios-externos.s0.c1",
          "pageHelp.usuarios-externos.s0.c2"
        ]
      },
      {
        "titleKey": "pageHelp.usuarios-externos.s1.title",
        "icon": "pi pi-users",
        "contentKeys": [
          "pageHelp.usuarios-externos.s1.c0",
          "pageHelp.usuarios-externos.s1.c1",
          "pageHelp.usuarios-externos.s1.c2",
          "pageHelp.usuarios-externos.s1.c3",
          "pageHelp.usuarios-externos.s1.c4",
          "pageHelp.usuarios-externos.s1.c5",
          "pageHelp.usuarios-externos.s1.c6"
        ]
      },
      {
        "titleKey": "pageHelp.usuarios-externos.s2.title",
        "icon": "pi pi-cog",
        "contentKeys": [
          "pageHelp.usuarios-externos.s2.c0",
          "pageHelp.usuarios-externos.s2.c1",
          "pageHelp.usuarios-externos.s2.c2",
          "pageHelp.usuarios-externos.s2.c3"
        ]
      },
      {
        "titleKey": "pageHelp.usuarios-externos.s3.title",
        "icon": "pi pi-list",
        "contentKeys": [
          "pageHelp.usuarios-externos.s3.c0",
          "pageHelp.usuarios-externos.s3.c1",
          "pageHelp.usuarios-externos.s3.c2",
          "pageHelp.usuarios-externos.s3.c3",
          "pageHelp.usuarios-externos.s3.c4",
          "pageHelp.usuarios-externos.s3.c5",
          "pageHelp.usuarios-externos.s3.c6"
        ]
      },
      {
        "titleKey": "pageHelp.usuarios-externos.s4.title",
        "icon": "pi pi-key",
        "contentKeys": [
          "pageHelp.usuarios-externos.s4.c0",
          "pageHelp.usuarios-externos.s4.c1",
          "pageHelp.usuarios-externos.s4.c2",
          "pageHelp.usuarios-externos.s4.c3",
          "pageHelp.usuarios-externos.s4.c4"
        ]
      },
      {
        "titleKey": "pageHelp.usuarios-externos.s5.title",
        "icon": "pi pi-ban",
        "contentKeys": [
          "pageHelp.usuarios-externos.s5.c0",
          "pageHelp.usuarios-externos.s5.c1",
          "pageHelp.usuarios-externos.s5.c2",
          "pageHelp.usuarios-externos.s5.c3",
          "pageHelp.usuarios-externos.s5.c4"
        ]
      },
      {
        "titleKey": "pageHelp.usuarios-externos.s6.title",
        "icon": "pi pi-lightbulb",
        "contentKeys": [
          "pageHelp.usuarios-externos.s6.c0",
          "pageHelp.usuarios-externos.s6.c1",
          "pageHelp.usuarios-externos.s6.c2",
          "pageHelp.usuarios-externos.s6.c3",
          "pageHelp.usuarios-externos.s6.c4",
          "pageHelp.usuarios-externos.s6.c5"
        ]
      }
    ]
  }
];
