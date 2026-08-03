import { bustStaticAssetUrl } from '../../../environments/asset-cache-bust';

/** Logo circular predefinido em `assets` (com bust de cache para produção). */
export const APP_LOGO_SRC = bustStaticAssetUrl('assets/LOGO_AERO.png');
