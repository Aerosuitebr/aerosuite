package com.aerosuite.util;

/**
 * Textos dos e-mails operacionais de etapas NRC (4 locales).
 */
public final class NrcEmailMessages {

    private final String localeTag;
    private final Bundle b;
    private final NrcRelatorioMessages relatorio;

    private NrcEmailMessages(String localeTag, Bundle bundle) {
        this.localeTag = localeTag;
        this.b = bundle;
        this.relatorio = NrcRelatorioMessages.forLocale(localeTag);
    }

    public static NrcEmailMessages forLocale(String localeTag) {
        String normalized = NrcRelatorioMessages.resolveLocaleTag(localeTag, null);
        Bundle bundle = switch (normalized) {
            case "en-US" -> EN;
            case "es-ES" -> ES;
            case "fr-FR" -> FR;
            default -> PT;
        };
        return new NrcEmailMessages(normalized, bundle);
    }

    public String localeTag() {
        return localeTag;
    }

    public String dash() {
        return relatorio.dash();
    }

    public String prazoIndefinido() {
        return b.prazoIndefinido;
    }

    public String qualityTeamDefault() {
        return b.qualityTeamDefault;
    }

    public String emailSubject(String etapaCodigo, String numeroNrc) {
        return String.format("%s %s — %s", b.subjectPrefix, etapaAssunto(etapaCodigo), numeroNrc);
    }

    public String etapaAssunto(String etapa) {
        return switch (etapa) {
            case "CONTENCAO" -> b.assuntoContencao;
            case "CAUSA" -> b.assuntoCausa;
            case "ACOES" -> b.assuntoAcoes;
            case "ACAO_CORRETIVA" -> b.assuntoAcaoCorretiva;
            case "EFICACIA" -> b.assuntoEficacia;
            case "TRATAMENTO" -> b.assuntoTratamento;
            case "TRATAMENTO_PROPOSTA" -> b.assuntoTratamentoProposta;
            case "CONTENCAO_APROVACAO" -> b.assuntoTratamentoProposta;
            case "CONTENCAO_REJEITADA" -> b.assuntoContencao;
            case "CAUSA_APROVACAO" -> b.assuntoCausa;
            case "CAUSA_REJEITADA" -> b.assuntoCausa;
            case "ACOES_PLANO" -> b.assuntoAcoes;
            case "ACOES_APROVACAO" -> b.assuntoAcoes;
            case "ACOES_REJEITADA" -> b.assuntoAcoes;
            default -> b.assuntoTratamento;
        };
    }

    public String etapaTitulo(String etapa) {
        return switch (etapa) {
            case "CONTENCAO" -> b.tituloContencao;
            case "CAUSA" -> b.tituloCausa;
            case "ACOES" -> b.tituloAcoes;
            case "ACAO_CORRETIVA" -> b.tituloAcaoCorretiva;
            case "EFICACIA" -> b.tituloEficacia;
            case "TRATAMENTO" -> b.tituloTratamento;
            case "TRATAMENTO_PROPOSTA" -> b.tituloTratamentoProposta;
            case "CONTENCAO_APROVACAO" -> b.tituloTratamentoProposta;
            case "CONTENCAO_REJEITADA" -> b.tituloContencao;
            case "CAUSA_APROVACAO" -> b.tituloCausa;
            case "CAUSA_REJEITADA" -> b.tituloCausa;
            case "ACOES_PLANO" -> b.tituloAcoes;
            case "ACOES_APROVACAO" -> b.tituloAcoes;
            case "ACOES_REJEITADA" -> b.tituloAcoes;
            default -> b.tituloTratamento;
        };
    }

    /** Localized default detail for email body and in-app fallback. */
    public String etapaDetalhePadrao(String etapa) {
        return switch (etapa != null ? etapa.toUpperCase(java.util.Locale.ROOT) : "") {
            case "CONTENCAO" -> b.detalheContencao;
            case "CAUSA" -> b.detalheCausa;
            case "ACOES" -> b.detalheAcoes;
            case "ACAO_CORRETIVA" -> b.detalheAcaoCorretiva;
            case "EFICACIA" -> b.detalheEficacia;
            case "TRATAMENTO" -> b.detalheTratamento;
            case "TRATAMENTO_PROPOSTA" -> b.detalheTratamentoProposta;
            case "CONTENCAO_APROVACAO" -> b.detalheTratamentoProposta;
            case "CONTENCAO_REJEITADA" -> b.detalheContencao;
            case "CAUSA_APROVACAO" -> b.detalheCausa;
            case "CAUSA_REJEITADA" -> b.detalheCausa;
            case "ACOES_PLANO" -> b.detalheAcoes;
            case "ACOES_APROVACAO" -> b.detalheAcoes;
            case "ACOES_REJEITADA" -> b.detalheAcoes;
            case "EFICACIA_INEFICAZ" -> b.detalheEficaciaIneficaz;
            default -> b.detalheDefault;
        };
    }

    public String etapaIntroHtml(String etapa, String delegadoPor, String destinatario, String numeroNrc) {
        return switch (etapa) {
            case "CONTENCAO" -> String.format(b.introContencao, destinatario, delegadoPor);
            case "CAUSA" -> String.format(b.introCausa, destinatario, delegadoPor);
            case "ACOES" -> String.format(b.introAcoes, destinatario, delegadoPor);
            case "ACAO_CORRETIVA" -> String.format(b.introAcaoCorretiva, destinatario, delegadoPor);
            case "EFICACIA" -> String.format(b.introEficacia, destinatario, numeroNrc != null ? numeroNrc : dash());
            case "TRATAMENTO" -> String.format(b.introTratamento, destinatario, delegadoPor);
            case "TRATAMENTO_PROPOSTA" -> String.format(b.introTratamentoProposta, destinatario, delegadoPor);
            case "CONTENCAO_APROVACAO" -> String.format(b.introTratamentoProposta, destinatario, delegadoPor);
            case "CONTENCAO_REJEITADA" -> String.format(b.introContencao, destinatario, delegadoPor);
            case "CAUSA_APROVACAO" -> String.format(b.introCausa, destinatario, delegadoPor);
            case "CAUSA_REJEITADA" -> String.format(b.introCausa, destinatario, delegadoPor);
            case "ACOES_PLANO" -> String.format(b.introAcoes, destinatario, delegadoPor);
            case "ACOES_APROVACAO" -> String.format(b.introAcoes, destinatario, delegadoPor);
            case "ACOES_REJEITADA" -> String.format(b.introAcoes, destinatario, delegadoPor);
            default -> String.format(b.introDefault, destinatario, delegadoPor);
        };
    }

    public String headerBadge() {
        return b.headerBadge;
    }

    public String headerSubtitle() {
        return b.headerSubtitle;
    }

    public String labelSeveridade() {
        return b.labelSeveridade;
    }

    public String labelOrigem() {
        return b.labelOrigem;
    }

    public String labelTipo() {
        return b.labelTipo;
    }

    public String labelOs() {
        return b.labelOs;
    }

    public String labelCliente() {
        return b.labelCliente;
    }

    public String labelPnLote() {
        return b.labelPnLote;
    }

    public String labelPrazo() {
        return b.labelPrazo;
    }

    public String labelOcorreu() {
        return b.labelOcorreu;
    }

    public String labelRequisito() {
        return b.labelRequisito;
    }

    public String labelDetalheEtapa() {
        return b.labelDetalheEtapa;
    }

    public String ctaOpen() {
        return b.ctaOpen;
    }

    public String footerLine1() {
        return b.footerLine1;
    }

    public String footerLine2() {
        return b.footerLine2;
    }

    public String labelSeveridadeValue(String code) {
        return relatorio.labelSeveridade(code);
    }

    public String labelOrigemValue(String code) {
        return relatorio.labelOrigem(code);
    }

    public String labelTipoValue(String code) {
        return relatorio.labelTipoNc(code);
    }

    private record Bundle(
        String subjectPrefix,
        String assuntoContencao,
        String assuntoCausa,
        String assuntoAcoes,
        String assuntoAcaoCorretiva,
        String assuntoEficacia,
        String assuntoTratamento,
        String assuntoTratamentoProposta,
        String tituloContencao,
        String tituloCausa,
        String tituloAcoes,
        String tituloAcaoCorretiva,
        String tituloEficacia,
        String tituloTratamento,
        String tituloTratamentoProposta,
        String introContencao,
        String introCausa,
        String introAcoes,
        String introAcaoCorretiva,
        String introEficacia,
        String introTratamento,
        String introTratamentoProposta,
        String introDefault,
        String headerBadge,
        String headerSubtitle,
        String labelSeveridade,
        String labelOrigem,
        String labelTipo,
        String labelOs,
        String labelCliente,
        String labelPnLote,
        String labelPrazo,
        String labelOcorreu,
        String labelRequisito,
        String labelDetalheEtapa,
        String detalheContencao,
        String detalheCausa,
        String detalheAcoes,
        String detalheAcaoCorretiva,
        String detalheEficacia,
        String detalheTratamento,
        String detalheTratamentoProposta,
        String detalheEficaciaIneficaz,
        String detalheDefault,
        String prazoIndefinido,
        String qualityTeamDefault,
        String ctaOpen,
        String footerLine1,
        String footerLine2
    ) {}

    private static final Bundle PT = new Bundle(
        "[NRC]",
        "Correção imediata delegada",
        "Análise de causa",
        "Plano de ações corretivas",
        "Ação corretiva delegada",
        "Verificação de eficácia",
        "Delegação de tratamento",
        "Aprovação de prazo e responsável",
        "Correção imediata",
        "Análise de causa",
        "Ações corretivas",
        "Ação corretiva",
        "Verificação de eficácia",
        "Delegação de tratamento",
        "Aprovação de tratamento",
        "<p>Olá, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> designou você para registrar e concluir a <strong>correção imediata</strong> desta NRC (método 3W).</p>",
        "<p>Olá, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> solicitou que você conduza a <strong>análise de causa</strong> e defina a disposição do material ou processo.</p>",
        "<p>Olá, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> solicitou que você elabore o <strong>plano de ações corretivas</strong> (5W2H) desta NRC.</p>",
        "<p>Olá, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> designou a você a execução de uma <strong>ação corretiva</strong> vinculada a esta NRC.</p>",
        "<p>Olá, <strong>%s</strong>.</p><p style=\"margin-top:12px;\">A NRC <strong>%s</strong> concluiu todas as ações corretivas e aguarda a sua <strong>verificação de eficácia</strong> (perfil Qualidade).</p>",
        "<p>Olá, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> delegou a você a condução do tratamento desta NRC conforme o fluxo ISO 9001.</p>",
        "<p>Olá, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> solicitou aprovação da Qualidade para alteração de <strong>prazo</strong> e/ou <strong>responsável</strong> pelo tratamento desta NRC.</p>",
        "<p>Olá, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> delegou a você uma etapa desta NRC conforme o fluxo ISO 9001.</p>",
        "Qualidade · ISO 9001",
        "Você foi designado para uma etapa do tratamento desta Não Conformidade",
        "Severidade",
        "Origem",
        "Tipo",
        "OS vinculada",
        "Cliente",
        "P/N · Lote",
        "Prazo para tratamento",
        "O que ocorreu",
        "Requisito não atendido",
        "Detalhe da etapa",
        "Registar e concluir a correção imediata (3W).",
        "Análise de causa e disposição do material ou processo.",
        "Elaborar o plano de ações corretivas (5W2H).",
        "Executar ação corretiva atribuída.",
        "Verificar eficácia e encerrar a NRC (perfil Qualidade).",
        "Condução completa do tratamento ISO 9001.",
        "Aprovar ou rejeitar prazo e responsável propostos pelo tratador.",
        "Eficácia ineficaz — revisar plano de ações corretivas.",
        "Etapa do tratamento ISO 9001.",
        "A definir",
        "Equipe de Qualidade",
        "Acessar NRC no sistema",
        "Comunicação automática do módulo de Qualidade — Aero Suite.",
        "Mantenha o registro atualizado no sistema para rastreabilidade e evidência de conformidade."
    );

    private static final Bundle EN = new Bundle(
        "[NCR]",
        "Immediate correction delegated",
        "Root cause analysis",
        "Corrective action plan",
        "Corrective action delegated",
        "Effectiveness verification",
        "Treatment delegation",
        "Deadline and owner approval",
        "Immediate immediate correction",
        "Root cause analysis",
        "Corrective actions",
        "Corrective action",
        "Effectiveness verification",
        "Treatment delegation",
        "Treatment approval",
        "<p>Hello, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> assigned you to record and complete <strong>immediate correction</strong> for this NCR (3W method).</p>",
        "<p>Hello, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> asked you to perform <strong>root cause analysis</strong> and define material or process disposition.</p>",
        "<p>Hello, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> asked you to prepare the <strong>corrective action plan</strong> (5W2H) for this NCR.</p>",
        "<p>Hello, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> assigned you to execute a <strong>corrective action</strong> linked to this NCR.</p>",
        "<p>Hello, <strong>%s</strong>.</p><p style=\"margin-top:12px;\">NCR <strong>%s</strong> has completed all corrective actions and awaits your <strong>effectiveness verification</strong> (Quality profile).</p>",
        "<p>Hello, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> delegated treatment of this NCR to you per the ISO 9001 flow.</p>",
        "<p>Hello, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> requested Quality approval to change the treatment <strong>deadline</strong> and/or <strong>owner</strong> for this NCR.</p>",
        "<p>Hello, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> delegated a stage of this NCR to you per the ISO 9001 flow.</p>",
        "Quality · ISO 9001",
        "You were assigned to a stage in the treatment of this non-conformity",
        "Severity",
        "Source",
        "Type",
        "Linked WO",
        "Customer",
        "P/N · Lot",
        "Treatment due date",
        "What occurred",
        "Requirement not met",
        "Stage detail",
        "Record and complete immediate correction (3W).",
        "Perform root cause analysis and disposition.",
        "Prepare the corrective action plan (5W2H).",
        "Execute the assigned corrective action.",
        "Verify effectiveness and close the NCR (Quality role).",
        "Lead the full ISO 9001 treatment.",
        "Approve or reject the proposed deadline and treatment owner.",
        "Ineffective verification — review the corrective action plan.",
        "ISO 9001 treatment stage.",
        "To be defined",
        "Quality team",
        "Open NCR in the system",
        "Automated message from the Quality module — Aero Suite.",
        "Keep the record updated in the system for traceability and conformity evidence."
    );

    private static final Bundle ES = new Bundle(
        "[NRC]",
        "Corrección inmediata delegada",
        "Análisis de causa",
        "Plan de acciones correctivas",
        "Acción correctiva delegada",
        "Verificación de eficacia",
        "Delegación de tratamiento",
        "Aprobación de plazo y responsable",
        "Corrección inmediata",
        "Análisis de causa",
        "Acciones correctivas",
        "Acción correctiva",
        "Verificación de eficacia",
        "Delegación de tratamiento",
        "Aprobación de tratamiento",
        "<p>Hola, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> le designó para registrar y concluir la <strong>corrección inmediata</strong> de esta NRC (método 3W).</p>",
        "<p>Hola, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> solicitó que usted realice el <strong>análisis de causa</strong> y defina la disposición del material o proceso.</p>",
        "<p>Hola, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> solicitó que elabore el <strong>plan de acciones correctivas</strong> (5W2H) de esta NRC.</p>",
        "<p>Hola, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> le designó la ejecución de una <strong>acción correctiva</strong> vinculada a esta NRC.</p>",
        "<p>Hola, <strong>%s</strong>.</p><p style=\"margin-top:12px;\">La NRC <strong>%s</strong> concluyó todas las acciones correctivas y aguarda su <strong>verificación de eficacia</strong> (perfil Calidad).</p>",
        "<p>Hola, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> le delegó la conducción del tratamiento de esta NRC conforme al flujo ISO 9001.</p>",
        "<p>Hola, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> solicitó aprobación de Calidad para cambiar el <strong>plazo</strong> y/o el <strong>responsable</strong> del tratamiento de esta NRC.</p>",
        "<p>Hola, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> le delegó una etapa de esta NRC conforme al flujo ISO 9001.</p>",
        "Calidad · ISO 9001",
        "Fue designado para una etapa del tratamiento de esta no conformidad",
        "Severidad",
        "Origen",
        "Tipo",
        "OT vinculada",
        "Cliente",
        "P/N · Lote",
        "Plazo de tratamiento",
        "Qué ocurrió",
        "Requisito no cumplido",
        "Detalle de la etapa",
        "Registrar y concluir la corrección inmediata (3W).",
        "Análisis de causa y disposición del material o proceso.",
        "Elaborar el plan de acciones correctivas (5W2H).",
        "Ejecutar la acción correctiva asignada.",
        "Verificar eficacia y cerrar la NRC (perfil Calidad).",
        "Conducir el tratamiento ISO 9001 completo.",
        "Aprobar o rechazar el plazo y responsable propuestos.",
        "Eficacia ineficaz — revisar el plan de acciones correctivas.",
        "Etapa del tratamiento ISO 9001.",
        "Por definir",
        "Equipo de Calidad",
        "Acceder a la NRC en el sistema",
        "Comunicación automática del módulo de Calidad — Aero Suite.",
        "Mantenga el registro actualizado en el sistema para trazabilidad y evidencia de conformidad."
    );

    private static final Bundle FR = new Bundle(
        "[NRC]",
        "Correction immédiate déléguée",
        "Analyse des causes",
        "Plan d'actions correctives",
        "Action corrective déléguée",
        "Vérification de l'efficacité",
        "Délégation du traitement",
        "Approbation délai et responsable",
        "Correction immédiate",
        "Analyse des causes",
        "Actions correctives",
        "Action corrective",
        "Vérification de l'efficacité",
        "Délégation du traitement",
        "Approbation du traitement",
        "<p>Bonjour, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> vous a désigné pour enregistrer et achever la <strong>correction immédiate immédiate</strong> de cette NRC (méthode 3W).</p>",
        "<p>Bonjour, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> vous a demandé de mener l'<strong>analyse des causes</strong> et de définir la disposition du matériel ou du processus.</p>",
        "<p>Bonjour, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> vous a demandé d'élaborer le <strong>plan d'actions correctives</strong> (5W2H) de cette NRC.</p>",
        "<p>Bonjour, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> vous a confié l'exécution d'une <strong>action corrective</strong> liée à cette NRC.</p>",
        "<p>Bonjour, <strong>%s</strong>.</p><p style=\"margin-top:12px;\">La NRC <strong>%s</strong> a achevé toutes les actions correctives et attend votre <strong>vérification de l'efficacité</strong> (profil Qualité).</p>",
        "<p>Bonjour, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> vous a délégué la conduite du traitement de cette NRC selon le flux ISO 9001.</p>",
        "<p>Bonjour, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> a demandé l'approbation Qualité pour modifier l'<strong>échéance</strong> et/ou le <strong>responsable</strong> du traitement de cette NRC.</p>",
        "<p>Bonjour, <strong>%s</strong>.</p><p style=\"margin-top:12px;\"><strong>%s</strong> vous a délégué une étape de cette NRC selon le flux ISO 9001.</p>",
        "Qualité · ISO 9001",
        "Vous avez été désigné pour une étape du traitement de cette non-conformité",
        "Sévérité",
        "Origine",
        "Type",
        "OT liée",
        "Client",
        "P/N · Lot",
        "Échéance de traitement",
        "Ce qui s'est produit",
        "Exigence non satisfaite",
        "Détail de l'étape",
        "Enregistrer et conclure le correction immédiate (3W).",
        "Analyse des causes et disposition du matériel ou du processus.",
        "Élaborer le plan d'actions correctives (5W2H).",
        "Exécuter l'action corrective assignée.",
        "Vérifier l'efficacité et clôturer la NRC (profil Qualité).",
        "Conduire le traitement ISO 9001 complet.",
        "Approuver ou rejeter le délai et le responsable proposés.",
        "Efficacité insuffisante — revoir le plan d'actions correctives.",
        "Étape du traitement ISO 9001.",
        "À définir",
        "Équipe Qualité",
        "Ouvrir la NRC dans le système",
        "Communication automatique du module Qualité — Aero Suite.",
        "Maintenez l'enregistrement à jour dans le système pour la traçabilité et les preuves de conformité."
    );
}
