-- Central de boas-vindas / comunicação com organizações (plano de controle)

CREATE TABLE platform_onboarding_template (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(64) NOT NULL,
    channel VARCHAR(16) NOT NULL DEFAULT 'EMAIL',
    name_label VARCHAR(120) NOT NULL,
    subject_template VARCHAR(500) NOT NULL,
    body_template MEDIUMTEXT NOT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_platform_onboarding_template_code UNIQUE (code)
);

CREATE TABLE platform_tenant_onboarding (
    tenant_id BIGINT NOT NULL PRIMARY KEY,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING_INFO',
    primary_contact_name VARCHAR(255) NULL,
    primary_contact_email VARCHAR(255) NULL,
    notes TEXT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_platform_tenant_onboarding_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id) ON DELETE CASCADE
);

CREATE TABLE platform_onboarding_requirement (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    requirement_key VARCHAR(64) NOT NULL,
    fulfilled TINYINT(1) NOT NULL DEFAULT 0,
    fulfilled_at DATETIME NULL,
    operator_notes VARCHAR(500) NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_platform_onboarding_req_tenant_key UNIQUE (tenant_id, requirement_key),
    CONSTRAINT fk_platform_onboarding_req_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id) ON DELETE CASCADE
);

CREATE TABLE platform_onboarding_message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    template_code VARCHAR(64) NULL,
    channel VARCHAR(16) NOT NULL DEFAULT 'EMAIL',
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255) NULL,
    subject VARCHAR(500) NOT NULL,
    body_html MEDIUMTEXT NOT NULL,
    delivery_status VARCHAR(16) NOT NULL DEFAULT 'SENT',
    operator_email VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_platform_onboarding_msg_tenant (tenant_id, created_at DESC),
    CONSTRAINT fk_platform_onboarding_msg_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id) ON DELETE CASCADE
);

INSERT INTO platform_onboarding_template (code, channel, name_label, subject_template, body_template, sort_order) VALUES
('WELCOME', 'EMAIL', 'Boas-vindas',
 'Bem-vindo ao Aero Suite — {{organizacaoNome}}',
 '<p>Olá {{contatoNome}},</p><p>É um prazer dar as boas-vindas à organização <strong>{{organizacaoNome}}</strong> (código <code>{{organizacaoCodigo}}</code>) na plataforma Aero Suite.</p><p>Nossa equipe de implantação entrará em contato para coletar as informações necessárias e liberar o acesso completo.</p><p>Portal: <a href="{{portalUrl}}">{{portalUrl}}</a></p><p>Atenciosamente,<br/>{{operadorNome}} — Aero Suite</p>',
 10),
('DATA_REQUEST', 'EMAIL', 'Solicitação de dados',
 'Aero Suite — informações para ativação de {{organizacaoNome}}',
 '<p>Olá {{contatoNome}},</p><p>Para viabilizar o acesso da organização <strong>{{organizacaoNome}}</strong>, precisamos que confirme ou envie:</p><ul><li>Razão social e CNPJ</li><li>E-mail do administrador principal</li><li>E-mail de suporte operacional</li><li>Contato financeiro (faturamento)</li><li>Logo da empresa (opcional)</li></ul><p>Responda a este e-mail ou utilize o portal: <a href="{{portalUrl}}">{{portalUrl}}</a></p><p>Atenciosamente,<br/>{{operadorNome}} — Aero Suite</p>',
 20),
('FOLLOW_UP', 'EMAIL', 'Follow-up',
 'Aero Suite — retorno sobre implantação de {{organizacaoNome}}',
 '<p>Olá {{contatoNome}},</p><p>Passando para acompanhar o andamento da implantação da <strong>{{organizacaoNome}}</strong>.</p><p>Caso ainda falte alguma informação ou documento, por favor nos avise para agilizarmos a liberação do ambiente.</p><p>Atenciosamente,<br/>{{operadorNome}} — Aero Suite</p>',
 30),
('ACCESS_READY', 'EMAIL', 'Acesso liberado',
 'Aero Suite — ambiente pronto para {{organizacaoNome}}',
 '<p>Olá {{contatoNome}},</p><p>O ambiente da organização <strong>{{organizacaoNome}}</strong> (código <code>{{organizacaoCodigo}}</code>) está pronto para uso.</p><p>Acesse: <a href="{{portalUrl}}">{{portalUrl}}</a></p><p>Em caso de dúvidas, nossa equipe permanece à disposição.</p><p>Atenciosamente,<br/>{{operadorNome}} — Aero Suite</p>',
 40);
