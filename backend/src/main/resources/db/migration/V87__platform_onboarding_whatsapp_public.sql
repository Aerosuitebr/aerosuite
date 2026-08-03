-- WhatsApp, formulário público e campos de submissão

ALTER TABLE platform_tenant_onboarding
    ADD COLUMN public_token VARCHAR(64) NULL,
    ADD COLUMN primary_contact_phone VARCHAR(32) NULL,
    ADD COLUMN legal_name VARCHAR(255) NULL,
    ADD COLUMN legal_document VARCHAR(32) NULL,
    ADD COLUMN admin_email VARCHAR(255) NULL,
    ADD COLUMN support_email VARCHAR(255) NULL,
    ADD COLUMN billing_contact_name VARCHAR(255) NULL,
    ADD COLUMN billing_contact_email VARCHAR(255) NULL,
    ADD COLUMN public_submitted_at DATETIME NULL;

CREATE UNIQUE INDEX uk_platform_tenant_onboarding_token ON platform_tenant_onboarding (public_token);

ALTER TABLE platform_onboarding_message
    ADD COLUMN recipient_phone VARCHAR(32) NULL;

ALTER TABLE platform_onboarding_message
    MODIFY recipient_email VARCHAR(255) NULL;

INSERT INTO platform_onboarding_template (code, channel, name_label, subject_template, body_template, sort_order) VALUES
('WELCOME_WA', 'WHATSAPP', 'Boas-vindas (WhatsApp)',
 'Boas-vindas',
 'Olá {{contatoNome}}! Bem-vindo à {{organizacaoNome}} ({{organizacaoCodigo}}) na Aero Suite. Nossa equipe entrará em contato para liberar o acesso. Portal: {{portalUrl}}',
 11),
('DATA_REQUEST_WA', 'WHATSAPP', 'Solicitação de dados (WhatsApp)',
 'Dados para ativação',
 'Olá {{contatoNome}}! Para ativar {{organizacaoNome}}, precisamos confirmar: razão social/CNPJ, e-mail do administrador, suporte e contato de faturamento. Responda aqui ou use: {{onboardingFormUrl}}',
 21),
('FOLLOW_UP_WA', 'WHATSAPP', 'Follow-up (WhatsApp)',
 'Follow-up implantação',
 'Olá {{contatoNome}}! Passando para acompanhar a implantação da {{organizacaoNome}}. Falta alguma informação? Avise para agilizarmos.',
 31),
('ACCESS_READY_WA', 'WHATSAPP', 'Acesso liberado (WhatsApp)',
 'Ambiente pronto',
 'Olá {{contatoNome}}! O ambiente da {{organizacaoNome}} ({{organizacaoCodigo}}) está pronto. Acesse: {{portalUrl}}',
 41);
