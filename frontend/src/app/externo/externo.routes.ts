import { Routes } from '@angular/router';
import { AuthExternoGuard } from '../auth/auth-externo.guard';

export const EXTERNO_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./externo-login/externo-login.component').then(m => m.ExternoLoginComponent)
  },
  {
    path: 'setup-password',
    loadComponent: () => import('./externo-setup-password/externo-setup-password.component').then(m => m.ExternoSetupPasswordComponent)
  },
  {
    path: 'change-password',
    loadComponent: () => import('./externo-change-password/externo-change-password.component').then(m => m.ExternoChangePasswordComponent)
  },
  {
    path: '',
    loadComponent: () => import('./externo-layout/externo-layout.component').then(m => m.ExternoLayoutComponent),
    canActivate: [AuthExternoGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./externo-home/externo-home.component').then(m => m.ExternoHomeComponent)
      },
      {
        path: 'os',
        loadComponent: () => import('./externo-os/externo-os-list.component').then(m => m.ExternoOSListComponent),
        data: { permission: 'os-externa' }
      },
      {
        path: 'os/:id',
        loadComponent: () => import('./externo-os/externo-os-detail.component').then(m => m.ExternoOSDetailComponent),
        data: { permission: 'os-externa' }
      },
      {
        path: 'propostas',
        loadComponent: () => import('./externo-propostas/externo-propostas-list.component').then(m => m.ExternoPropostasListComponent),
        data: { permission: 'propostas-externa' }
      },
      {
        path: 'propostas/:id',
        loadComponent: () => import('./externo-propostas/externo-proposta-detail.component').then(m => m.ExternoPropostaDetailComponent),
        data: { permission: 'propostas-externa' }
      },
      {
        path: 'documentos',
        loadComponent: () => import('./externo-documentos/externo-documentos.component').then(m => m.ExternoDocumentosComponent),
        data: { permission: 'documentos-externos' }
      },
      {
        path: 'perfil',
        loadComponent: () => import('./externo-perfil/externo-perfil.component').then(m => m.ExternoPerfilComponent),
        data: { permission: 'perfil-externo' }
      }
    ]
  }
];
