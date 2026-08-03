-- Demo: 2.º tenant para testes de isolamento (após Flyway V15).
-- Preferir POST /api/tenants (autenticado no tenant default com GERENCIAR_PERMISSOES).

INSERT INTO tenant (codigo, nome, ativo, created_at)
SELECT 'demo', 'Organização Demo', 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM tenant WHERE codigo = 'demo');

SET @tid = (SELECT id FROM tenant WHERE codigo = 'demo' LIMIT 1);

INSERT INTO sistema_empresa_config (
    tenant_id, display_name, support_email, copyright_entity, created_at, updated_at
)
SELECT @tid, 'Organização Demo', 'suporte@demo.local', 'Organização Demo', NOW(), NOW()
WHERE @tid IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sistema_empresa_config WHERE tenant_id = @tid);
