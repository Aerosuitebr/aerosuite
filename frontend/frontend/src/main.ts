import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import {
  provideRouter,
  withRouterConfig
} from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideZoneChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { AuthInterceptor } from './app/auth/auth.interceptor';
import { AppInitService } from './app/core/app-init.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TranslationService } from './app/core/translation.service';
import { createI18nMessageService } from './app/core/i18n-message.factory';
import { createI18nConfirmationService } from './app/core/i18n-confirmation.factory';

bootstrapApplication(AppComponent, {
  providers: [
    // Removido withFetch() para garantir que o proxy funcione corretamente
    // O HttpClient padrão (XMLHttpRequest) funciona melhor com o proxy do Angular
    // withInterceptorsFromDi() é necessário para interceptores clássicos funcionarem
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(routes, withRouterConfig({
      onSameUrlNavigation: 'reload'
    })),
    provideAnimations(), // ✅ Necessário para ngx-toastr
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: MessageService,
      useFactory: createI18nMessageService,
      deps: [TranslationService]
    },
    {
      provide: ConfirmationService,
      useFactory: createI18nConfirmationService,
      deps: [TranslationService]
    }
  ]
}).then(appRef => {
  // Inicializar serviço de segurança após o bootstrap
  const appInitService = appRef.injector.get(AppInitService);
  appInitService.init();
}).catch(err => console.error(err));