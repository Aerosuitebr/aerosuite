-- Vincula token de reset à organização (multi-tenant: mesmo e-mail em vários tenants).
ALTER TABLE password_reset_token
    ADD COLUMN org_tenant_id BIGINT NULL AFTER email;

CREATE INDEX idx_password_reset_token_email_tenant
    ON password_reset_token (email, org_tenant_id);
