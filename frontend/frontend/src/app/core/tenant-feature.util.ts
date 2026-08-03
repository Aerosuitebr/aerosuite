import { User } from '../auth/auth.service';

export interface TenantFeatureRota {
  tenantFeaturesAny?: string[];
  tenantFeaturesAll?: string[];
}

export function passesTenantFeatureRota(user: User | null | undefined, req: TenantFeatureRota): boolean {
  if (!req.tenantFeaturesAny?.length && !req.tenantFeaturesAll?.length) {
    return true;
  }
  const codes = new Set((user?.tenantFeatures ?? []).map(c => c.trim().toLowerCase()));
  if (req.tenantFeaturesAll?.length) {
    const allOk = req.tenantFeaturesAll.every(c => codes.has(c.trim().toLowerCase()));
    if (!allOk) {
      return false;
    }
  }
  if (req.tenantFeaturesAny?.length) {
    return req.tenantFeaturesAny.some(c => codes.has(c.trim().toLowerCase()));
  }
  return true;
}
