package com.aerosuite.domain;

import java.io.Serializable;
import java.util.Objects;

public class TenantFeatureId implements Serializable {

    public Long tenantId;
    public String featureCode;

    public TenantFeatureId() {}

    public TenantFeatureId(Long tenantId, String featureCode) {
        this.tenantId = tenantId;
        this.featureCode = featureCode;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof TenantFeatureId that)) {
            return false;
        }
        return Objects.equals(tenantId, that.tenantId)
                && Objects.equals(featureCode, that.featureCode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(tenantId, featureCode);
    }
}
