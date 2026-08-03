package com.aerosuite.dto.sistema;

/** Estado do assistente de configuração da empresa. */
public class SistemaEmpresaStatusDto {
    /** Quando true, o assistente (ou conclusão) ainda é necessário para branding completo em BD. */
    public boolean needsCompletion;
    /** Pode editar dados da empresa (admin, Configurações ou Gerir permissões). */
    public boolean canEdit;
    /** Pode concluir publicação / onboarding (apenas perfil administrativo). */
    public boolean canPublish;
}
