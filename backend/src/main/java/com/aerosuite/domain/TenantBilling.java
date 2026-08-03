package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenant_billing")
public class TenantBilling extends PanacheEntityBase {

    @Id
    @Column(name = "tenant_id")
    public Long tenantId;

    @Column(name = "plano_codigo", nullable = false, length = 32)
    public String planoCodigo = "trial";

    @Column(name = "status", nullable = false, length = 32)
    public String status = "trialing";

    @Column(name = "trial_ends_at")
    public LocalDateTime trialEndsAt;

    @Column(name = "provedor", nullable = false, length = 16)
    public String provedor = "mock";

    @Column(name = "external_customer_id", length = 128)
    public String externalCustomerId;

    @Column(name = "external_subscription_id", length = 128)
    public String externalSubscriptionId;

    @Column(name = "pagarme_order_id", length = 128)
    public String pagarmeOrderId;

    @Column(name = "pagarme_plan_id", length = 128)
    public String pagarmePlanId;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    public static TenantBilling findByPagarmeOrderId(String pagarmeOrderId) {
        if (pagarmeOrderId == null || pagarmeOrderId.isBlank()) {
            return null;
        }
        return find("pagarmeOrderId", pagarmeOrderId.trim()).firstResult();
    }

    public static TenantBilling findByTenantId(long tenantId) {
        return find("tenantId", tenantId).firstResult();
    }
}
