import { HttpContextToken } from '@angular/common/http';

/** Quando true, o AuthInterceptor não mostra toast em respostas 403 (ex.: métricas opcionais na Home). */
export const SUPPRESS_FORBIDDEN_TOAST = new HttpContextToken<boolean>(() => false);
