package com.aerosuite.util;

import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Textos do relatório HTML de NRC (4 locales alinhados ao frontend Aero Suite).
 */
public final class NrcRelatorioMessages {

    private static final String DEFAULT_LOCALE = "pt-BR";

    private final Bundle bundle;
    private final String localeTag;
    private final Map<String, String> statusLabels;
    private final Map<String, String> severidadeLabels;
    private final Map<String, String> origemLabels;
    private final Map<String, String> tipoLabels;
    private final Map<String, String> disposicaoLabels;
    private final Map<String, String> acaoStatusLabels;
    private final Map<String, String> eficaciaLabels;
    private final Map<String, String> auditAcaoLabels;
    private final Map<String, String> auditCampoLabels;
    private final Map<String, String> etapaLabels;

    private NrcRelatorioMessages(String localeTag, Bundle bundle) {
        this.localeTag = localeTag;
        this.bundle = bundle;
        this.statusLabels = enumMap(localeTag, STATUS);
        this.severidadeLabels = enumMap(localeTag, SEVERIDADE);
        this.origemLabels = enumMap(localeTag, ORIGEM);
        this.tipoLabels = enumMap(localeTag, TIPO);
        this.disposicaoLabels = enumMap(localeTag, DISPOSICAO);
        this.acaoStatusLabels = enumMap(localeTag, ACAO_STATUS);
        this.eficaciaLabels = enumMap(localeTag, EFICACIA);
        this.auditAcaoLabels = enumMap(localeTag, AUDIT_ACAO);
        this.auditCampoLabels = enumMap(localeTag, AUDIT_CAMPO);
        this.etapaLabels = enumMap(localeTag, ETAPA);
    }

    public static NrcRelatorioMessages forLocale(String localeTag) {
        String normalized = normalizeLocaleTag(localeTag);
        Bundle bundle = switch (normalized) {
            case "en-US" -> EN;
            case "es-ES" -> ES;
            case "fr-FR" -> FR;
            default -> PT;
        };
        return new NrcRelatorioMessages(normalized, bundle);
    }

    /** Prefer query param {@code locale}; fallback to first {@code Accept-Language} tag. */
    public static String resolveLocaleTag(String queryLocale, String acceptLanguage) {
        if (queryLocale != null && !queryLocale.isBlank()) {
            return normalizeLocaleTag(queryLocale);
        }
        if (acceptLanguage != null && !acceptLanguage.isBlank()) {
            String first = acceptLanguage.split(",")[0].trim();
            int semi = first.indexOf(';');
            if (semi > 0) {
                first = first.substring(0, semi).trim();
            }
            return normalizeLocaleTag(first);
        }
        return DEFAULT_LOCALE;
    }

    public String localeTag() {
        return localeTag;
    }

    public String dash() {
        return "—";
    }

    public String yes() {
        return bundle.yes;
    }

    public String no() {
        return bundle.no;
    }

    public String titlePrefix() {
        return bundle.titlePrefix;
    }

    public String severidadeLabel() {
        return bundle.severidadeLabel;
    }

    public String origemLabel() {
        return bundle.origemLabel;
    }

    public String sectionIdentificacao() {
        return bundle.sectionIdentificacao;
    }

    public String sectionContencao() {
        return bundle.sectionContencao;
    }

    public String sectionAnaliseCausa() {
        return bundle.sectionAnaliseCausa;
    }

    public String sectionAcoes() {
        return bundle.sectionAcoes;
    }

    public String sectionRespHistorico() {
        return bundle.sectionRespHistorico;
    }

    public String sectionAuditoria() {
        return bundle.sectionAuditoria;
    }

    public String sectionAnexos() {
        return bundle.sectionAnexos;
    }

    public String sectionEficacia() {
        return bundle.sectionEficacia;
    }

    public String fieldDataDeteccao() { return bundle.fieldDataDeteccao; }
    public String fieldDetectadoPor() { return bundle.fieldDetectadoPor; }
    public String fieldLocalOcorrencia() { return bundle.fieldLocalOcorrencia; }
    public String fieldResponsavelTratamento() { return bundle.fieldResponsavelTratamento; }
    public String fieldPrazoTratamento() { return bundle.fieldPrazoTratamento; }
    public String fieldTipo() { return bundle.fieldTipo; }
    public String fieldOsVinculada() { return bundle.fieldOsVinculada; }
    public String fieldPartNumber() { return bundle.fieldPartNumber; }
    public String fieldSerialNumber() { return bundle.fieldSerialNumber; }
    public String fieldLote() { return bundle.fieldLote; }
    public String fieldInvoice() { return bundle.fieldInvoice; }
    public String fieldFcu() { return bundle.fieldFcu; }
    public String fieldCliente() { return bundle.fieldCliente; }
    public String fieldDescricaoOcorrido() { return bundle.fieldDescricaoOcorrido; }
    public String fieldRequisitoNaoAtendido() { return bundle.fieldRequisitoNaoAtendido; }
    public String fieldEvidenciasTexto() { return bundle.fieldEvidenciasTexto; }
    public String fieldNaoAplicavel() { return bundle.fieldNaoAplicavel; }
    public String fieldOque() { return bundle.fieldOque; }
    public String fieldQuem() { return bundle.fieldQuem; }
    public String fieldQuando() { return bundle.fieldQuando; }
    public String fieldRespContencao() { return bundle.fieldRespContencao; }
    public String fieldDataContencao() { return bundle.fieldDataContencao; }
    public String fieldContencaoConcluida() { return bundle.fieldContencaoConcluida; }
    public String fieldDataConclusaoContencao() { return bundle.fieldDataConclusaoContencao; }
    public String fieldResumo() { return bundle.fieldResumo; }
    public String fieldMetodo() { return bundle.fieldMetodo; }
    public String fieldPorque1() { return bundle.fieldPorque1; }
    public String fieldPorque2() { return bundle.fieldPorque2; }
    public String fieldPorque3() { return bundle.fieldPorque3; }
    public String fieldPorque4() { return bundle.fieldPorque4; }
    public String fieldPorque5() { return bundle.fieldPorque5; }
    public String fieldCausaRaiz() { return bundle.fieldCausaRaiz; }
    public String fieldDisposicao() { return bundle.fieldDisposicao; }
    public String fieldDisposicaoObs() { return bundle.fieldDisposicaoObs; }
    public String fieldAprovadaPor() { return bundle.fieldAprovadaPor; }
    public String colAcaoOque() { return bundle.colAcaoOque; }
    public String colAcaoPorQue() { return bundle.colAcaoPorQue; }
    public String colAcaoOnde() { return bundle.colAcaoOnde; }
    public String colAcaoQuando() { return bundle.colAcaoQuando; }
    public String colAcaoComo() { return bundle.colAcaoComo; }
    public String colAcaoQuanto() { return bundle.colAcaoQuanto; }
    public String colAcaoResponsavel() { return bundle.colAcaoResponsavel; }
    public String colAcaoPrazo() { return bundle.colAcaoPrazo; }
    public String colAcaoStatus() { return bundle.colAcaoStatus; }
    public String colAcaoEvidencia() { return bundle.colAcaoEvidencia; }
    public String colData() { return bundle.colData; }
    public String colResponsavel() { return bundle.colResponsavel; }
    public String colUsuario() { return bundle.colUsuario; }
    public String colAcao() { return bundle.colAcao; }
    public String colDetalhe() { return bundle.colDetalhe; }
    public String colArquivo() { return bundle.colArquivo; }
    public String colEnviadoPor() { return bundle.colEnviadoPor; }
    public String colDescricao() { return bundle.colDescricao; }
    public String fieldDecisaoEficacia() { return bundle.fieldDecisaoEficacia; }
    public String fieldVerificacaoEficacia() { return bundle.fieldVerificacaoEficacia; }
    public String fieldAtualizarRiscos() { return bundle.fieldAtualizarRiscos; }
    public String fieldMudancasSgq() { return bundle.fieldMudancasSgq; }
    public String fieldEncerradoPor() { return bundle.fieldEncerradoPor; }
    public String fieldDataEncerramento() { return bundle.fieldDataEncerramento; }
    public String printButton() { return bundle.printButton; }
    public String footerIso() { return bundle.footerIso; }
    public String metodoCincoPorques() { return bundle.metodoCincoPorques; }
    public String metodoTextoLivre() { return bundle.metodoTextoLivre; }

    public String labelStatus(String value) {
        return enumLabel(statusLabels, value);
    }

    public String labelSeveridade(String value) {
        return enumLabel(severidadeLabels, value);
    }

    public String labelOrigem(String value) {
        return enumLabel(origemLabels, value);
    }

    public String labelTipoNc(String value) {
        return enumLabel(tipoLabels, value);
    }

    public String labelMetodoCausa(String value) {
        if (value == null) {
            return dash();
        }
        return "CINCO_PORQUES".equals(value) ? metodoCincoPorques() : metodoTextoLivre();
    }

    public String labelDisposicao(String value) {
        return enumLabel(disposicaoLabels, value);
    }

    public String labelAcaoStatus(String value) {
        return enumLabel(acaoStatusLabels, value);
    }

    public String labelEficaciaDecisao(String value) {
        return enumLabel(eficaciaLabels, value);
    }

    public String labelAuditoriaAcao(String acao) {
        return enumLabel(auditAcaoLabels, acao);
    }

    public String formatAuditoriaDetalhe(String campo, String valorNovo) {
        if (valorNovo != null && !valorNovo.isBlank()) {
            if (campo != null) {
                return switch (campo) {
                    case "status" -> labelStatus(valorNovo);
                    case "disposicao" -> labelDisposicao(valorNovo);
                    case "eficaciaDecisao" -> labelEficaciaDecisao(valorNovo);
                    case "contencaoConcluida" -> "true".equalsIgnoreCase(valorNovo) ? yes() : no();
                    case "isActive" -> "false".equalsIgnoreCase(valorNovo) ? no() : yes();
                    case "contencaoNaoAplicavel" -> "NAO_APLICAVEL".equals(valorNovo) ? yes() : valorNovo;
                    case "etapaAtual" -> labelEtapaAtual(valorNovo);
                    default -> valorNovo;
                };
            }
            return valorNovo;
        }
        if (campo != null && !campo.isBlank()) {
            return auditCampoLabels.getOrDefault(campo, campo);
        }
        return dash();
    }

    public String labelEtapaAtual(String value) {
        return enumLabel(etapaLabels, value);
    }

    public String footerGeneratedAt(Object timestamp) {
        return bundle.footerGeneratedPrefix + " " + Objects.toString(timestamp, "") + " — " + footerIso();
    }

    private static String enumLabel(Map<String, String> labels, String value) {
        if (value == null) {
            return "—";
        }
        return labels.getOrDefault(value, value);
    }

    private static String normalizeLocaleTag(String tag) {
        if (tag == null || tag.isBlank()) {
            return DEFAULT_LOCALE;
        }
        String normalized = tag.trim().replace('_', '-');
        String lower = normalized.toLowerCase(Locale.ROOT);
        if (lower.startsWith("pt")) {
            return "pt-BR";
        }
        if (lower.startsWith("en")) {
            return "en-US";
        }
        if (lower.startsWith("es")) {
            return "es-ES";
        }
        if (lower.startsWith("fr")) {
            return "fr-FR";
        }
        return DEFAULT_LOCALE;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, String> enumMap(String localeTag, Map<String, Map<String, String>> table) {
        Map<String, String> map = table.get(localeTag);
        if (map == null) {
            map = table.get(DEFAULT_LOCALE);
        }
        return map;
    }

    private record Bundle(
        String titlePrefix,
        String severidadeLabel,
        String origemLabel,
        String sectionIdentificacao,
        String sectionContencao,
        String sectionAnaliseCausa,
        String sectionAcoes,
        String sectionRespHistorico,
        String sectionAuditoria,
        String sectionAnexos,
        String sectionEficacia,
        String fieldDataDeteccao,
        String fieldDetectadoPor,
        String fieldLocalOcorrencia,
        String fieldResponsavelTratamento,
        String fieldPrazoTratamento,
        String fieldTipo,
        String fieldOsVinculada,
        String fieldPartNumber,
        String fieldSerialNumber,
        String fieldLote,
        String fieldInvoice,
        String fieldFcu,
        String fieldCliente,
        String fieldDescricaoOcorrido,
        String fieldRequisitoNaoAtendido,
        String fieldEvidenciasTexto,
        String fieldNaoAplicavel,
        String fieldOque,
        String fieldQuem,
        String fieldQuando,
        String fieldRespContencao,
        String fieldDataContencao,
        String fieldContencaoConcluida,
        String fieldDataConclusaoContencao,
        String fieldResumo,
        String fieldMetodo,
        String fieldPorque1,
        String fieldPorque2,
        String fieldPorque3,
        String fieldPorque4,
        String fieldPorque5,
        String fieldCausaRaiz,
        String fieldDisposicao,
        String fieldDisposicaoObs,
        String fieldAprovadaPor,
        String colAcaoOque,
        String colAcaoPorQue,
        String colAcaoOnde,
        String colAcaoQuando,
        String colAcaoComo,
        String colAcaoQuanto,
        String colAcaoResponsavel,
        String colAcaoPrazo,
        String colAcaoStatus,
        String colAcaoEvidencia,
        String colData,
        String colResponsavel,
        String colUsuario,
        String colAcao,
        String colDetalhe,
        String colArquivo,
        String colEnviadoPor,
        String colDescricao,
        String fieldDecisaoEficacia,
        String fieldVerificacaoEficacia,
        String fieldAtualizarRiscos,
        String fieldMudancasSgq,
        String fieldEncerradoPor,
        String fieldDataEncerramento,
        String yes,
        String no,
        String printButton,
        String footerGeneratedPrefix,
        String footerIso,
        String metodoCincoPorques,
        String metodoTextoLivre
    ) {}

    private static final Bundle PT = new Bundle(
        "Registro de Não Conformidade — ",
        "Severidade: ",
        " | Origem: ",
        "Identificação",
        "Correção imediata",
        "Análise de causa",
        "Ações corretivas (5W2H)",
        "Histórico de responsáveis",
        "Histórico de auditoria",
        "Anexos / evidências",
        "Eficácia e encerramento",
        "Data detecção", "Detectado por", "Local ocorrência", "Responsável tratamento", "Prazo tratamento",
        "Tipo", "OS vinculada", "P/N", "Serial number", "Lote", "Invoice", "FCU", "Cliente",
        "O que ocorreu", "Requisito não atendido", "Evidências (texto)",
        "Não aplicável", "O quê", "Quem", "Quando", "Responsável correção imediata", "Data correção imediata",
        "Correção imediata concluída", "Data conclusão correção imediata", "Resumo",
        "Método", "1º Por quê", "2º Por quê", "3º Por quê", "4º Por quê", "5º Por quê",
        "Causa raiz", "Disposição", "Obs. disposição", "Aprovada por",
        "O quê", "Por quê", "Onde", "Quando", "Como", "Quanto", "Responsável", "Prazo", "Status", "Evidência conclusão",
        "Data", "Responsável", "Usuário", "Ação", "Detalhe", "Arquivo", "Enviado por", "Descrição",
        "Decisão eficácia", "Verificação eficácia", "Atualizar riscos/SGQ", "Mudanças SGQ",
        "Encerrado por", "Data encerramento",
        "Sim", "Não",
        "Imprimir / PDF",
        "Documento gerado em",
        "evidência ISO 9001:2015",
        "5 Porquês",
        "Texto livre"
    );

    private static final Bundle EN = new Bundle(
        "Non-Conformance Record — ",
        "Severity: ",
        " | Origin: ",
        "Identification",
        "Immediate correction",
        "Root cause analysis",
        "Corrective actions (5W2H)",
        "Responsible party history",
        "Audit history",
        "Attachments / evidence",
        "Effectiveness and closure",
        "Detection date", "Detected by", "Occurrence location", "Treatment owner", "Treatment deadline",
        "Type", "Linked work order", "P/N", "Serial number", "Batch", "Invoice", "FCU", "Customer",
        "What occurred", "Unmet requirement", "Evidence (text)",
        "Not applicable", "What", "Who", "When", "Immediate correction owner", "Immediate correction date",
        "Immediate correction completed", "Immediate correction completion date", "Summary",
        "Method", "1st Why", "2nd Why", "3rd Why", "4th Why", "5th Why",
        "Root cause", "Disposition", "Disposition notes", "Approved by",
        "What", "Why", "Where", "When", "How", "Cost", "Owner", "Deadline", "Status", "Completion evidence",
        "Date", "Owner", "User", "Action", "Detail", "File", "Uploaded by", "Description",
        "Effectiveness decision", "Effectiveness verification", "Update risk/QMS matrix", "QMS changes",
        "Closed by", "Closure date",
        "Yes", "No",
        "Print / PDF",
        "Document generated at",
        "ISO 9001:2015 evidence",
        "5 Whys",
        "Free text"
    );

    private static final Bundle ES = new Bundle(
        "Registro de No Conformidad — ",
        "Severidad: ",
        " | Origen: ",
        "Identificación",
        "Corrección inmediata",
        "Análisis de causa",
        "Acciones correctivas (5W2H)",
        "Historial de responsables",
        "Historial de auditoría",
        "Anexos / evidencias",
        "Eficacia y cierre",
        "Fecha de detección", "Detectado por", "Lugar de ocurrencia", "Responsable del tratamiento", "Plazo de tratamiento",
        "Tipo", "OS vinculada", "P/N", "Número de serie", "Lote", "Factura", "FCU", "Cliente",
        "Qué ocurrió", "Requisito no cumplido", "Evidencias (texto)",
        "No aplicable", "Qué", "Quién", "Cuándo", "Responsable de corrección inmediata", "Fecha de corrección inmediata",
        "Corrección inmediata concluida", "Fecha de conclusión de corrección inmediata", "Resumen",
        "Método", "1.er Por qué", "2.º Por qué", "3.er Por qué", "4.º Por qué", "5.º Por qué",
        "Causa raíz", "Disposición", "Obs. disposición", "Aprobada por",
        "Qué", "Por qué", "Dónde", "Cuándo", "Cómo", "Costo", "Responsable", "Plazo", "Estado", "Evidencia de conclusión",
        "Fecha", "Responsable", "Usuario", "Acción", "Detalle", "Archivo", "Enviado por", "Descripción",
        "Decisión de eficacia", "Verificación de eficacia", "Actualizar matriz de riesgos/SGC", "Cambios en el SGC",
        "Cerrado por", "Fecha de cierre",
        "Sí", "No",
        "Imprimir / PDF",
        "Documento generado el",
        "evidencia ISO 9001:2015",
        "5 Porqués",
        "Texto libre"
    );

    private static final Bundle FR = new Bundle(
        "Enregistrement de non-conformité — ",
        "Sévérité : ",
        " | Origine : ",
        "Identification",
        "Correction immédiate",
        "Analyse des causes",
        "Actions correctives (5W2H)",
        "Historique des responsables",
        "Historique d'audit",
        "Pièces jointes / preuves",
        "Efficacité et clôture",
        "Date de détection", "Détecté par", "Lieu de survenance", "Responsable du traitement", "Échéance de traitement",
        "Type", "OS liée", "P/N", "Numéro de série", "Lot", "Facture", "FCU", "Client",
        "Ce qui s'est produit", "Exigence non satisfaite", "Preuves (texte)",
        "Non applicable", "Quoi", "Qui", "Quand", "Responsabla correction immédiate", "Date de correction immédiate",
        "Correction immédiate clôturée", "Date de clôture de la correction immédiate", "Résumé",
        "Méthode", "1er Pourquoi", "2e Pourquoi", "3e Pourquoi", "4e Pourquoi", "5e Pourquoi",
        "Cause racine", "Disposition", "Obs. disposition", "Approuvé par",
        "Quoi", "Pourquoi", "Où", "Quand", "Comment", "Coût", "Responsable", "Échéance", "Statut", "Preuve de clôture",
        "Date", "Responsable", "Utilisateur", "Action", "Détail", "Fichier", "Envoyé par", "Description",
        "Décision d'efficacité", "Vérification d'efficacité", "Mettre à jour matrice risques/SMQ", "Changements SMQ",
        "Clôturé par", "Date de clôture",
        "Oui", "Non",
        "Imprimer / PDF",
        "Document généré le",
        "preuve ISO 9001:2015",
        "5 Pourquoi",
        "Texte libre"
    );

    private static final Map<String, Map<String, String>> STATUS = Map.of(
        "pt-BR", Map.of(
            "ABERTA", "Aberta", "CONTENCAO", "Correção imediata", "EM_ANALISE", "Em análise",
            "EM_TRATAMENTO", "Em tratamento", "ENCERRADA", "Encerrada"),
        "en-US", Map.of(
            "ABERTA", "Open", "CONTENCAO", "Immediate correction", "EM_ANALISE", "Under analysis",
            "EM_TRATAMENTO", "In treatment", "ENCERRADA", "Closed"),
        "es-ES", Map.of(
            "ABERTA", "Abierta", "CONTENCAO", "Corrección inmediata", "EM_ANALISE", "En análisis",
            "EM_TRATAMENTO", "En tratamiento", "ENCERRADA", "Cerrada"),
        "fr-FR", Map.of(
            "ABERTA", "Ouverte", "CONTENCAO", "Correction immédiate", "EM_ANALISE", "En analyse",
            "EM_TRATAMENTO", "En traitement", "ENCERRADA", "Clôturée")
    );

    private static final Map<String, Map<String, String>> SEVERIDADE = Map.of(
        "pt-BR", Map.of("MENOR", "Menor", "MAIOR", "Maior", "CRITICA", "Crítica"),
        "en-US", Map.of("MENOR", "Minor", "MAIOR", "Major", "CRITICA", "Critical"),
        "es-ES", Map.of("MENOR", "Menor", "MAIOR", "Mayor", "CRITICA", "Crítica"),
        "fr-FR", Map.of("MENOR", "Mineure", "MAIOR", "Majeure", "CRITICA", "Critique")
    );

    private static final Map<String, Map<String, String>> ORIGEM = Map.of(
        "pt-BR", Map.of(
            "OFICINA", "Oficina", "ESTOQUE", "Estoque", "INSPECAO", "Inspeção", "CLIENTE", "Cliente",
            "AUDITORIA_INTERNA", "Auditoria interna", "FORNECEDOR", "Fornecedor", "AUDITORIA", "Auditoria", "INTERNA", "Interna"),
        "en-US", Map.of(
            "OFICINA", "Workshop", "ESTOQUE", "Inventory", "INSPECAO", "Inspection", "CLIENTE", "Customer",
            "AUDITORIA_INTERNA", "Internal audit", "FORNECEDOR", "Supplier", "AUDITORIA", "Audit", "INTERNA", "Internal"),
        "es-ES", Map.of(
            "OFICINA", "Taller", "ESTOQUE", "Inventario", "INSPECAO", "Inspección", "CLIENTE", "Cliente",
            "AUDITORIA_INTERNA", "Auditoría interna", "FORNECEDOR", "Proveedor", "AUDITORIA", "Auditoría", "INTERNA", "Interna"),
        "fr-FR", Map.of(
            "OFICINA", "Atelier", "ESTOQUE", "Stock", "INSPECAO", "Inspection", "CLIENTE", "Client",
            "AUDITORIA_INTERNA", "Audit interne", "FORNECEDOR", "Fournisseur", "AUDITORIA", "Audit", "INTERNA", "Interne")
    );

    private static final Map<String, Map<String, String>> TIPO = Map.of(
        "pt-BR", Map.of(
            "PRODUTO", "Produto", "PROCESSO", "Processo", "DOCUMENTACAO", "Documentação",
            "FORNECEDOR", "Fornecedor", "AUDITORIA", "Auditoria", "SISTEMA", "Sistema"),
        "en-US", Map.of(
            "PRODUTO", "Product", "PROCESSO", "Process", "DOCUMENTACAO", "Documentation",
            "FORNECEDOR", "Supplier", "AUDITORIA", "Audit", "SISTEMA", "System"),
        "es-ES", Map.of(
            "PRODUTO", "Producto", "PROCESSO", "Proceso", "DOCUMENTACAO", "Documentación",
            "FORNECEDOR", "Proveedor", "AUDITORIA", "Auditoría", "SISTEMA", "Sistema"),
        "fr-FR", Map.of(
            "PRODUTO", "Produit", "PROCESSO", "Processus", "DOCUMENTACAO", "Documentation",
            "FORNECEDOR", "Fournisseur", "AUDITORIA", "Audit", "SISTEMA", "Système")
    );

    private static final Map<String, Map<String, String>> DISPOSICAO = Map.of(
        "pt-BR", Map.of(
            "RETRABALHO", "Retrabalho", "REPARO", "Reparo", "SUCATEAMENTO", "Sucateamento",
            "DEVOLUCAO", "Devolução", "CONCESSAO", "Concessão"),
        "en-US", Map.of(
            "RETRABALHO", "Rework", "REPARO", "Repair", "SUCATEAMENTO", "Scrap",
            "DEVOLUCAO", "Return", "CONCESSAO", "Concession"),
        "es-ES", Map.of(
            "RETRABALHO", "Retrabajo", "REPARO", "Reparación", "SUCATEAMENTO", "Desecho",
            "DEVOLUCAO", "Devolución", "CONCESSAO", "Concesión"),
        "fr-FR", Map.of(
            "RETRABALHO", "Retravail", "REPARO", "Réparation", "SUCATEAMENTO", "Mise au rebut",
            "DEVOLUCAO", "Retour", "CONCESSAO", "Concession")
    );

    private static final Map<String, Map<String, String>> ACAO_STATUS = Map.of(
        "pt-BR", Map.of("CONCLUIDA", "Concluída", "PENDENTE", "Pendente"),
        "en-US", Map.of("CONCLUIDA", "Completed", "PENDENTE", "Pending"),
        "es-ES", Map.of("CONCLUIDA", "Concluida", "PENDENTE", "Pendiente"),
        "fr-FR", Map.of("CONCLUIDA", "Clôturée", "PENDENTE", "En attente")
    );

    private static final Map<String, Map<String, String>> EFICACIA = Map.of(
        "pt-BR", Map.of("EFICAZ", "Eficaz", "INEFICAZ", "Ineficaz"),
        "en-US", Map.of("EFICAZ", "Effective", "INEFICAZ", "Ineffective"),
        "es-ES", Map.of("EFICAZ", "Eficaz", "INEFICAZ", "Ineficaz"),
        "fr-FR", Map.of("EFICAZ", "Efficace", "INEFICAZ", "Inefficace")
    );

    private static final Map<String, Map<String, String>> AUDIT_ACAO = Map.of(
        "pt-BR", Map.ofEntries(
            Map.entry("CRIACAO", "NRC aberta"),
            Map.entry("DELEGACAO_TRATAMENTO", "Responsável pelo tratamento delegado"),
            Map.entry("NOTIFICACAO_EMAIL", "Responsável notificado por e-mail"),
            Map.entry("NOTIFICACAO_EMAIL_FALHA", "Falha ao notificar responsável por e-mail"),
            Map.entry("ATUALIZACAO", "Dados atualizados"),
            Map.entry("CONTENCAO", "Correção imediata registrada"),
            Map.entry("CONTENCAO_CONCLUIDA", "Correção imediata concluída"),
            Map.entry("ANALISE_CAUSA", "Análise de causa registrada"),
            Map.entry("DISPOSICAO", "Análise e disposição"),
            Map.entry("ACOES_CORRETIVAS", "Plano de ações corretivas registrado"),
            Map.entry("ACAO_CONCLUIDA", "Ação corretiva concluída"),
            Map.entry("ENCERRAMENTO", "NRC encerrada"),
            Map.entry("VERIFICACAO_EFICACIA", "Verificação de eficácia registrada"),
            Map.entry("EFICACIA_DECISAO", "Decisão de eficácia registrada"),
            Map.entry("EFICACIA_INEFICAZ", "Eficácia ineficaz — ciclo reaberto"),
            Map.entry("CICLO_REABERTO", "Ciclo de tratamento reaberto"),
            Map.entry("ANEXO", "Evidência anexada"),
            Map.entry("ANEXO_REMOVIDO", "Evidência removida"),
            Map.entry("INATIVACAO", "Registro inativado")),
        "en-US", Map.ofEntries(
            Map.entry("CRIACAO", "NCR opened"),
            Map.entry("DELEGACAO_TRATAMENTO", "Treatment owner assigned"),
            Map.entry("NOTIFICACAO_EMAIL", "Treatment owner notified by email"),
            Map.entry("NOTIFICACAO_EMAIL_FALHA", "Failed to notify treatment owner by email"),
            Map.entry("ATUALIZACAO", "Data updated"),
            Map.entry("CONTENCAO", "Immediate correction recorded"),
            Map.entry("CONTENCAO_CONCLUIDA", "Immediate correction completed"),
            Map.entry("ANALISE_CAUSA", "Root cause analysis recorded"),
            Map.entry("DISPOSICAO", "Analysis and disposition"),
            Map.entry("ACOES_CORRETIVAS", "Corrective action plan recorded"),
            Map.entry("ACAO_CONCLUIDA", "Corrective action completed"),
            Map.entry("ENCERRAMENTO", "NCR closed"),
            Map.entry("VERIFICACAO_EFICACIA", "Effectiveness verification recorded"),
            Map.entry("EFICACIA_DECISAO", "Effectiveness decision recorded"),
            Map.entry("EFICACIA_INEFICAZ", "Ineffective — cycle reopened"),
            Map.entry("CICLO_REABERTO", "Treatment cycle reopened"),
            Map.entry("ANEXO", "Evidence attached"),
            Map.entry("ANEXO_REMOVIDO", "Evidence removed"),
            Map.entry("INATIVACAO", "Record deactivated")),
        "es-ES", Map.ofEntries(
            Map.entry("CRIACAO", "NRC abierta"),
            Map.entry("DELEGACAO_TRATAMENTO", "Responsable del tratamiento asignado"),
            Map.entry("NOTIFICACAO_EMAIL", "Responsable notificado por correo electrónico"),
            Map.entry("NOTIFICACAO_EMAIL_FALHA", "Error al notificar al responsable por correo"),
            Map.entry("ATUALIZACAO", "Datos actualizados"),
            Map.entry("CONTENCAO", "Corrección inmediata registrada"),
            Map.entry("CONTENCAO_CONCLUIDA", "Corrección inmediata concluida"),
            Map.entry("ANALISE_CAUSA", "Análisis de causa registrado"),
            Map.entry("DISPOSICAO", "Análisis y disposición"),
            Map.entry("ACOES_CORRETIVAS", "Plan de acciones correctivas registrado"),
            Map.entry("ACAO_CONCLUIDA", "Acción correctiva concluida"),
            Map.entry("ENCERRAMENTO", "NRC cerrada"),
            Map.entry("VERIFICACAO_EFICACIA", "Verificación de eficacia registrada"),
            Map.entry("EFICACIA_DECISAO", "Decisión de eficacia registrada"),
            Map.entry("EFICACIA_INEFICAZ", "Eficacia ineficaz — ciclo reabierto"),
            Map.entry("CICLO_REABERTO", "Ciclo de tratamiento reabierto"),
            Map.entry("ANEXO", "Evidencia adjunta"),
            Map.entry("ANEXO_REMOVIDO", "Evidencia eliminada"),
            Map.entry("INATIVACAO", "Registro inactivado")),
        "fr-FR", Map.ofEntries(
            Map.entry("CRIACAO", "NRC ouverte"),
            Map.entry("DELEGACAO_TRATAMENTO", "Responsable du traitement assigné"),
            Map.entry("NOTIFICACAO_EMAIL", "Responsable notifié par e-mail"),
            Map.entry("NOTIFICACAO_EMAIL_FALHA", "Échec de notification du responsable par e-mail"),
            Map.entry("ATUALIZACAO", "Données mises à jour"),
            Map.entry("CONTENCAO", "Correction immédiate enregistrée"),
            Map.entry("CONTENCAO_CONCLUIDA", "Correction immédiate clôturée"),
            Map.entry("ANALISE_CAUSA", "Analyse des causes enregistrée"),
            Map.entry("DISPOSICAO", "Analyse et disposition"),
            Map.entry("ACOES_CORRETIVAS", "Plan d'actions correctives enregistré"),
            Map.entry("ACAO_CONCLUIDA", "Action corrective clôturée"),
            Map.entry("ENCERRAMENTO", "NRC clôturée"),
            Map.entry("VERIFICACAO_EFICACIA", "Vérification d'efficacité enregistrée"),
            Map.entry("EFICACIA_DECISAO", "Décision d'efficacité enregistrée"),
            Map.entry("EFICACIA_INEFICAZ", "Efficacité insuffisante — cycle rouvert"),
            Map.entry("CICLO_REABERTO", "Cycle de traitement rouvert"),
            Map.entry("ANEXO", "Preuve jointe"),
            Map.entry("ANEXO_REMOVIDO", "Preuve supprimée"),
            Map.entry("INATIVACAO", "Enregistrement désactivé"))
    );

    private static final Map<String, Map<String, String>> AUDIT_CAMPO = Map.of(
        "pt-BR", Map.ofEntries(
            Map.entry("responsavelTratamentoNome", "Responsável pelo tratamento"),
            Map.entry("dados_abertura", "Dados de abertura"),
            Map.entry("status", "Status"),
            Map.entry("isActive", "Activo"),
            Map.entry("verificacaoEficacia", "Verificação de eficácia"),
            Map.entry("eficaciaDecisao", "Decisão de eficácia"),
            Map.entry("contencaoNaoAplicavel", "Correção imediata não aplicável"),
            Map.entry("contencaoAcao", "Ação de correção imediata"),
            Map.entry("contencaoConcluida", "Correção imediata concluída"),
            Map.entry("causaRaiz", "Causa raiz"),
            Map.entry("disposicao", "Disposição"),
            Map.entry("quantidade", "Quantidade de acções"),
            Map.entry("descricao", "Descrição"),
            Map.entry("nomeOriginal", "Anexo"),
            Map.entry("etapaAtual", "Etapa")),
        "en-US", Map.ofEntries(
            Map.entry("responsavelTratamentoNome", "Treatment owner"),
            Map.entry("dados_abertura", "Opening data"),
            Map.entry("status", "Status"),
            Map.entry("isActive", "Active"),
            Map.entry("verificacaoEficacia", "Effectiveness verification"),
            Map.entry("eficaciaDecisao", "Effectiveness decision"),
            Map.entry("contencaoNaoAplicavel", "Immediate correction not applicable"),
            Map.entry("contencaoAcao", "Immediate correction action"),
            Map.entry("contencaoConcluida", "Immediate correction completed"),
            Map.entry("causaRaiz", "Root cause"),
            Map.entry("disposicao", "Disposition"),
            Map.entry("quantidade", "Action count"),
            Map.entry("descricao", "Description"),
            Map.entry("nomeOriginal", "Attachment"),
            Map.entry("etapaAtual", "Stage")),
        "es-ES", Map.ofEntries(
            Map.entry("responsavelTratamentoNome", "Responsable del tratamiento"),
            Map.entry("dados_abertura", "Datos de apertura"),
            Map.entry("status", "Estado"),
            Map.entry("isActive", "Activo"),
            Map.entry("verificacaoEficacia", "Verificación de eficacia"),
            Map.entry("eficaciaDecisao", "Decisión de eficacia"),
            Map.entry("contencaoNaoAplicavel", "Corrección inmediata no aplicable"),
            Map.entry("contencaoAcao", "Acción de corrección inmediata"),
            Map.entry("contencaoConcluida", "Corrección inmediata concluida"),
            Map.entry("causaRaiz", "Causa raíz"),
            Map.entry("disposicao", "Disposición"),
            Map.entry("quantidade", "Cantidad de acciones"),
            Map.entry("descricao", "Descripción"),
            Map.entry("nomeOriginal", "Anexo"),
            Map.entry("etapaAtual", "Etapa")),
        "fr-FR", Map.ofEntries(
            Map.entry("responsavelTratamentoNome", "Responsable du traitement"),
            Map.entry("dados_abertura", "Données d'ouverture"),
            Map.entry("status", "Statut"),
            Map.entry("isActive", "Actif"),
            Map.entry("verificacaoEficacia", "Vérification d'efficacité"),
            Map.entry("eficaciaDecisao", "Décision d'efficacité"),
            Map.entry("contencaoNaoAplicavel", "Correction immédiate non applicable"),
            Map.entry("contencaoAcao", "Action de correction immédiate"),
            Map.entry("contencaoConcluida", "Correction immédiate terminé"),
            Map.entry("causaRaiz", "Cause racine"),
            Map.entry("disposicao", "Disposition"),
            Map.entry("quantidade", "Nombre d'actions"),
            Map.entry("descricao", "Description"),
            Map.entry("nomeOriginal", "Pièce jointe"),
            Map.entry("etapaAtual", "Étape"))
    );

    private static final Map<String, Map<String, String>> ETAPA = Map.of(
        "pt-BR", Map.of(
            "CONTENCAO", "Correção imediata", "CAUSA", "Causa", "ACOES", "Ações corretivas",
            "EFICACIA", "Eficácia", "REGISTRO", "Registro", "ABERTURA", "Abertura"),
        "en-US", Map.of(
            "CONTENCAO", "Immediate correction", "CAUSA", "Root cause", "ACOES", "Corrective actions",
            "EFICACIA", "Effectiveness", "REGISTRO", "Record", "ABERTURA", "Opening"),
        "es-ES", Map.of(
            "CONTENCAO", "Corrección inmediata", "CAUSA", "Causa", "ACOES", "Acciones correctivas",
            "EFICACIA", "Eficacia", "REGISTRO", "Registro", "ABERTURA", "Apertura"),
        "fr-FR", Map.of(
            "CONTENCAO", "Correction immédiate", "CAUSA", "Cause", "ACOES", "Actions correctives",
            "EFICACIA", "Efficacité", "REGISTRO", "Enregistrement", "ABERTURA", "Ouverture")
    );
}
