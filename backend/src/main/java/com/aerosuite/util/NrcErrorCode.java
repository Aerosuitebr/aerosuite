package com.aerosuite.util;

/**
 * Stable API error codes for NRC operations (message remains PT for backward compatibility).
 */
public enum NrcErrorCode {
    RESPONSAVEL_REQUIRED("Informe o responsável pelo tratamento"),
    PRAZO_TRATAMENTO_REQUIRED("Informe o prazo de tratamento antes de avançar"),
    NRC_ENCERRADA("NRC já encerrada"),
    USUARIO_NAO_IDENTIFICADO("Usuário não identificado"),
    RESPONSAVEL_JA_ATRIBUIDO("NRC já possui responsável pelo tratamento — use delegar tratamento"),
    SEM_RESPONSAVEL("NRC sem responsável atribuído — use assumir tratamento"),
    DELEGAR_NAO_PERMITIDO("Somente o responsável atual ou qualidade pode delegar o tratamento"),
    NOVO_RESPONSAVEL_REQUIRED("Informe o novo responsável pelo tratamento"),
    NOVO_RESPONSAVEL_IGUAL("Informe um responsável diferente do atual"),
    EDICAO_STATUS_INVALIDO("NRC não pode ser editada neste status"),
    CAUSA_ANTES_ACOES("Registre a análise de causa antes das ações corretivas"),
    DISPOSICAO_ANTES_ACOES("Registre a disposição antes das ações corretivas"),
    ACOES_REQUIRED("Informe ao menos uma ação corretiva"),
    ACAO_CONCLUIDA_NAO_REMOVER("Não é possível remover ação corretiva já concluída"),
    ACAO_CONCLUIR_ENDPOINT("Para concluir uma ação corretiva, use o endpoint de conclusão com evidência"),
    ACAO_CONCLUIR_NAO_PERMITIDO("Somente o responsável pela ação ou pelo tratamento pode concluir esta ação"),
    ACAO_RESPONSAVEL_REQUIRED("Informe o responsável por cada ação corretiva"),
    EVIDENCIA_CONCLUSAO_REQUIRED("Informe a evidência de conclusão da ação corretiva"),
    EFICACIA_DECISAO_REQUIRED("Informe a decisão de eficácia"),
    VERIFICACAO_EFICACIA_REQUIRED("Informe a verificação de eficácia"),
    INEFICACIA_SOMENTE_RESPONSAVEL("Somente o responsável atual pelo tratamento pode registrar ineficácia"),
    INATIVAR_SOMENTE_QUALIDADE("Somente perfil Qualidade ou administrador pode inativar NRC"),
    REGISTRO_IMUTAVEL("NRC encerrada — registro imutável"),
    RESPONSAVEL_INATIVO("Responsável informado não encontrado ou inativo"),
    DISPOSICAO_CRITICA_JUSTIFICATIVA("Disposições de concessão ou sucateamento em NRC crítica exigem justificativa documentada"),
    DISPOSICAO_CRITICA_QUALIDADE("Disposições de concessão ou sucateamento em NRC crítica exigem aprovação por perfil Qualidade"),
    ENCERRAR_SOMENTE_QUALIDADE("O encerramento com eficácia confirmada exige perfil Qualidade ou administrador"),
    TRATAMENTO_PROPOSTA_PENDENTE("Aguarde aprovação da Qualidade para o prazo proposto"),
    TRATAMENTO_PROPOSTA_VAZIA("Informe o prazo proposto para solicitar aprovação"),
    TRATAMENTO_PROPOSTA_IGUAL("O prazo proposto é igual ao já aprovado"),
    TRATAMENTO_RESPONSAVEL_USE_DELEGAR("Para alterar o responsável pelo tratamento, use delegar tratamento"),
    TRATAMENTO_APROVACAO_SOMENTE_QUALIDADE("Somente Qualidade pode aprovar o prazo de tratamento"),
    TRATAMENTO_SEM_PROPOSTA_PENDENTE("Não há proposta de prazo pendente de aprovação"),
    ENCERRAR_CONFLITO_RESPONSAVEL("Quem tratou a NRC não pode verificar eficácia e encerrar — delegue a outro responsável de qualidade"),
    SEM_ACESSO("Sem permissão para acessar a esta NRC"),
    EXPORT_IDS_REQUIRED("Informe ao menos uma NRC para exportar"),
    EXPORT_LIMITE("Exportação limitada a 25 registros por lote"),
    EXPORT_ZIP_ERRO("Erro ao gerar arquivo ZIP"),
    ETAPA_SOMENTE_RESPONSAVEL("Somente o responsável pelo tratamento pode executar esta etapa"),
    ANEXO_SOMENTE_RESPONSAVEL(
        "Somente o responsável pelo tratamento, responsável designado por ação corretiva pendente "
            + "ou qualidade (eficácia) pode gerir anexos"),
    CONTENCAO_INCOMPLETA("Conclua ou marque a correção imediata como não aplicável antes de avançar"),
    CONTENCAO_3W_OQUE("Informe o que foi feito na correção imediata (3W — o quê)"),
    CONTENCAO_3W_QUEM("Informe quem executou a correção imediata (3W — quem)"),
    CONTENCAO_3W_QUANDO("Informe quando a correção imediata foi executada (3W — quando)"),
    CONTENCAO_OBRIGATORIA("Todas as NRC exigem registro da correção imediata — a opção não aplicável é restrita à Qualidade"),
    CONTENCAO_APROVACAO_PENDENTE("Aguarde a aprovação da Qualidade da correção imediata para avançar"),
    CONTENCAO_APROVACAO_REJEITADA("A correção imediata foi reprovada — ajuste conforme as orientações da Qualidade e solicite nova aprovação"),
    CONTENCAO_SEM_SOLICITACAO_PENDENTE("Não há solicitação de aprovação da correção imediata pendente"),
    CONTENCAO_USE_SOLICITAR_APROVACAO("Utilize solicitar aprovação da Qualidade para concluir a correção imediata"),
    CONTENCAO_REJEICAO_OBSERVACOES_REQUIRED("Informe as observações para reprovar a correção imediata"),
    CONTENCAO_APROVACAO_SOMENTE_QUALIDADE("Somente a Qualidade pode aprovar ou reprovar a correção imediata"),
    CAUSA_APROVACAO_PENDENTE("Aguarde a aprovação da Qualidade da análise de causa para avançar"),
    CAUSA_APROVACAO_REJEITADA("A análise de causa foi reprovada — ajuste conforme as orientações da Qualidade e solicite nova aprovação"),
    CAUSA_SEM_SOLICITACAO_PENDENTE("Não há solicitação de aprovação da análise de causa pendente"),
    CAUSA_USE_SOLICITAR_APROVACAO("Utilize solicitar aprovação da Qualidade para concluir a análise de causa"),
    CAUSA_REJEICAO_OBSERVACOES_REQUIRED("Informe as observações para reprovar a análise de causa"),
    CAUSA_APROVACAO_SOMENTE_QUALIDADE("Somente a Qualidade pode aprovar ou reprovar a análise de causa"),
    CAUSA_NAO_APROVADA("A análise de causa deve ser aprovada pela Qualidade antes das ações corretivas"),
    CAUSA_JA_APROVADA("A análise de causa já foi aprovada pela Qualidade"),
    CAUSA_APROVADA_READONLY("Análise de causa aprovada — edição restrita"),
    CAUSA_PORQUE1_REQUIRED("Informe o 1º porquê antes de solicitar aprovação"),
    ACOES_APROVACAO_PENDENTE("Aguarde a aprovação da Qualidade do plano de ações corretivas para avançar"),
    ACOES_APROVACAO_REJEITADA("O plano de ações corretivas foi reprovado — ajuste conforme as orientações da Qualidade e solicite nova aprovação"),
    ACOES_SEM_SOLICITACAO_PENDENTE("Não há solicitação de aprovação do plano de ações pendente"),
    ACOES_USE_SOLICITAR_APROVACAO("Utilize solicitar aprovação da Qualidade para concluir o plano de ações"),
    ACOES_REJEICAO_OBSERVACOES_REQUIRED("Informe as observações para reprovar o plano de ações corretivas"),
    ACOES_APROVACAO_SOMENTE_QUALIDADE("Somente a Qualidade pode aprovar ou reprovar o plano de ações corretivas"),
    ACOES_NAO_APROVADO("O plano de ações corretivas deve ser aprovado pela Qualidade antes da verificação de eficácia"),
    ACOES_JA_APROVADO("O plano de ações corretivas já foi aprovado pela Qualidade"),
    ACOES_APROVADO_READONLY("Plano de ações aprovado — edição restrita"),
    ACOES_INCOMPLETAS_APROVACAO("Conclua todas as ações corretivas e defina o prazo de tratamento antes de solicitar aprovação"),
    ACOES_PENDENTES("Conclua todas as ações corretivas antes do encerramento"),
    EDICAO_SOMENTE_RESPONSAVEL("Somente o responsável pelo tratamento pode editar a abertura"),
    AUTH_REQUIRED("Autenticação necessária"),
    IDENTITY_MISMATCH("Identidade do utilizador não corresponde ao token de autenticação"),
    OS_IDS_LIMIT("Limite de 200 OS por consulta"),
    FILE_REQUIRED("Informe o arquivo"),
    FILE_TOO_LARGE("Arquivo excede o tamanho máximo permitido (25 MB)"),
    FILE_TYPE_NOT_ALLOWED("Tipo de arquivo não permitido para evidências NRC"),
    FILE_EXTENSION_NOT_ALLOWED("Extensão de arquivo não permitida para evidências NRC"),
    FILE_NOT_FOUND("Arquivo não encontrado"),
    FILE_NOT_FOUND_DISK("Arquivo não encontrado no disco"),
    UPLOAD_FAILED("Erro ao salvar arquivo: %s"),
    EXPORT_IDS_PARAM_REQUIRED("Informe o parâmetro ids"),
    VALOR_INVALIDO("Valor inválido para %s"),
    VALOR_INVALIDO_VALOR("Valor inválido para %s: %s"),
    NRC_NOT_FOUND("NRC não encontrada: %s"),
    ACAO_NOT_FOUND("Ação não encontrada: %s"),
    ANEXO_NOT_FOUND("Anexo não encontrado: %s"),
    FUNCIONALIDADE_NEGADA("Sem permissão de funcionalidade: %s"),
    FUNCIONALIDADE_NRC_NEGADA("Sem permissão de funcionalidade NRC");

    private final String defaultMessage;

    NrcErrorCode(String defaultMessage) {
        this.defaultMessage = defaultMessage;
    }

    public String defaultMessage() {
        return defaultMessage;
    }

    public String defaultMessage(Object... args) {
        if (args == null || args.length == 0) {
            return defaultMessage;
        }
        return String.format(defaultMessage, args);
    }
}
