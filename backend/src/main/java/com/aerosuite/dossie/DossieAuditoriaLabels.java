package com.aerosuite.dossie;

import java.util.Locale;
import java.util.Map;

/**
 * Rótulos do PDF do dossiê (P4.4) por locale.
 */
public final class DossieAuditoriaLabels {

    private final String title;
    private final String generatedAt;
    private final String sectionOs;
    private final String sectionFiles;
    private final String sectionStock;
    private final String sectionOsAudit;
    private final String sectionExternal;
    private final String sectionAccess;
    private final String noRecords;
    private final String colDate;
    private final String colUser;
    private final String colAction;
    private final String colDetail;
    private final String colFile;
    private final String colQty;
    private final String colType;
    private final String colPn;
    private final String colIp;
    private final String colRastreio;
    private final String colSn;
    private final String colCert;
    private final String sectionChecklist;

    private DossieAuditoriaLabels(
            String title,
            String generatedAt,
            String sectionOs,
            String sectionFiles,
            String sectionStock,
            String sectionOsAudit,
            String sectionExternal,
            String sectionAccess,
            String noRecords,
            String colDate,
            String colUser,
            String colAction,
            String colDetail,
            String colFile,
            String colQty,
            String colType,
            String colPn,
            String colIp,
            String colRastreio,
            String colSn,
            String colCert,
            String sectionChecklist) {
        this.title = title;
        this.generatedAt = generatedAt;
        this.sectionOs = sectionOs;
        this.sectionFiles = sectionFiles;
        this.sectionStock = sectionStock;
        this.sectionOsAudit = sectionOsAudit;
        this.sectionExternal = sectionExternal;
        this.sectionAccess = sectionAccess;
        this.noRecords = noRecords;
        this.colDate = colDate;
        this.colUser = colUser;
        this.colAction = colAction;
        this.colDetail = colDetail;
        this.colFile = colFile;
        this.colQty = colQty;
        this.colType = colType;
        this.colPn = colPn;
        this.colIp = colIp;
        this.colRastreio = colRastreio;
        this.colSn = colSn;
        this.colCert = colCert;
        this.sectionChecklist = sectionChecklist;
    }

    public static DossieAuditoriaLabels forLocale(String locale) {
        String key = locale != null ? locale.toLowerCase(Locale.ROOT) : "pt-br";
        if (key.startsWith("en")) {
            return en();
        }
        if (key.startsWith("es")) {
            return es();
        }
        if (key.startsWith("fr")) {
            return fr();
        }
        return pt();
    }

    private static DossieAuditoriaLabels pt() {
        return new DossieAuditoriaLabels(
                "Dossiê de auditoria — OS",
                "Gerado em",
                "1. Dados da ordem de serviço",
                "2. Anexos e documentos",
                "3. Movimentações de estoque",
                "4. Trilha de auditoria da OS",
                "5. Acesso portal externo (OS)",
                "6. Log de acesso interno (últimos eventos do tenant)",
                "Nenhum registro.",
                "Data",
                "Utilizador",
                "Ação",
                "Detalhe",
                "Ficheiro",
                "Qtd",
                "Tipo",
                "P/N",
                "IP",
                "Rastreio",
                "S/N",
                "Certificado",
                "0. Checklist de evidências (pré-auditoria)");
    }

    private static DossieAuditoriaLabels en() {
        return new DossieAuditoriaLabels(
                "Audit dossier — WO",
                "Generated at",
                "1. Work order data",
                "2. Attachments and documents",
                "3. Inventory movements",
                "4. WO audit trail",
                "5. External portal access (WO)",
                "6. Internal access log (recent tenant events)",
                "No records.",
                "Date",
                "User",
                "Action",
                "Detail",
                "File",
                "Qty",
                "Type",
                "P/N",
                "IP",
                "Trace code",
                "S/N",
                "Certificate",
                "0. Evidence checklist (pre-audit)");
    }

    private static DossieAuditoriaLabels es() {
        return new DossieAuditoriaLabels(
                "Dosier de auditoría — OS",
                "Generado el",
                "1. Datos de la orden de servicio",
                "2. Anexos y documentos",
                "3. Movimientos de inventario",
                "4. Pista de auditoría de la OS",
                "5. Acceso portal externo (OS)",
                "6. Registro de acceso interno (eventos recientes del tenant)",
                "Sin registros.",
                "Fecha",
                "Usuario",
                "Acción",
                "Detalle",
                "Archivo",
                "Cant",
                "Tipo",
                "P/N",
                "IP",
                "Rastreo",
                "S/N",
                "Certificado",
                "0. Lista de evidencias (pre-auditoría)");
    }

    private static DossieAuditoriaLabels fr() {
        return new DossieAuditoriaLabels(
                "Dossier d'audit — OS",
                "Généré le",
                "1. Données de l'ordre de service",
                "2. Pièces jointes et documents",
                "3. Mouvements de stock",
                "4. Piste d'audit OS",
                "5. Accès portail externe (OS)",
                "6. Journal d'accès interne (événements récents du tenant)",
                "Aucun enregistrement.",
                "Date",
                "Utilisateur",
                "Action",
                "Détail",
                "Fichier",
                "Qté",
                "Type",
                "P/N",
                "IP",
                "Traçage",
                "S/N",
                "Certificat",
                "0. Liste de contrôle des preuves (pré-audit)");
    }

    public String colRastreio() {
        return colRastreio;
    }

    public String colSn() {
        return colSn;
    }

    public String colCert() {
        return colCert;
    }

    public String sectionChecklist() {
        return sectionChecklist;
    }

    public static java.util.List<String> checklistLines(String locale) {
        String key = locale != null ? locale.toLowerCase(Locale.ROOT) : "pt-br";
        if (key.startsWith("en")) {
            return java.util.List.of(
                    "WO data matches maintenance records",
                    "Parts consumed are traceable (P/N, S/N, trace code)",
                    "Certificates of conformity available when applicable",
                    "OS audit trail covers critical changes",
                    "External portal access logged for this WO");
        }
        if (key.startsWith("es")) {
            return java.util.List.of(
                    "Datos de la OS coherentes con registros de mantenimiento",
                    "Piezas consumidas trazables (P/N, S/N, código de rastreo)",
                    "Certificados de conformidad disponibles cuando aplique",
                    "Pista de auditoría de la OS cubre cambios críticos",
                    "Accesos al portal externo registrados para esta OS");
        }
        if (key.startsWith("fr")) {
            return java.util.List.of(
                    "Données OT cohérentes avec les dossiers de maintenance",
                    "Pièces consommées traçables (P/N, S/N, code de traçage)",
                    "Certificats de conformité disponibles le cas échéant",
                    "Piste d'audit OT couvre les changements critiques",
                    "Accès portail externe enregistrés pour cette OT");
        }
        return java.util.List.of(
                "Dados da OS coerentes com registros de manutenção",
                "Peças consumidas rastreáveis (P/N, S/N, código de rastreio)",
                "Certificados de conformidade disponíveis quando aplicável",
                "Trilha de auditoria da OS cobre alterações críticas",
                "Acessos ao portal externo registrados para esta OS");
    }

    public String title() {
        return title;
    }

    public String generatedAt() {
        return generatedAt;
    }

    public String sectionOs() {
        return sectionOs;
    }

    public String sectionFiles() {
        return sectionFiles;
    }

    public String sectionStock() {
        return sectionStock;
    }

    public String sectionOsAudit() {
        return sectionOsAudit;
    }

    public String sectionExternal() {
        return sectionExternal;
    }

    public String sectionAccess() {
        return sectionAccess;
    }

    public String noRecords() {
        return noRecords;
    }

    public String colDate() {
        return colDate;
    }

    public String colUser() {
        return colUser;
    }

    public String colAction() {
        return colAction;
    }

    public String colDetail() {
        return colDetail;
    }

    public String colFile() {
        return colFile;
    }

    public String colQty() {
        return colQty;
    }

    public String colType() {
        return colType;
    }

    public String colPn() {
        return colPn;
    }

    public String colIp() {
        return colIp;
    }

    public static String formatOsRef(int numeroOs, long internalId) {
        return numeroOs + " (id " + internalId + ")";
    }

    public static Map<String, String> osFieldLabels(String locale) {
        String key = locale != null ? locale.toLowerCase(Locale.ROOT) : "pt-br";
        if (key.startsWith("en")) {
            return Map.ofEntries(
                    Map.entry("clienteNome", "Customer"),
                    Map.entry("tipoServico", "Service type"),
                    Map.entry("partNumber", "Part number"),
                    Map.entry("serialNumber", "Serial number"),
                    Map.entry("dtAbertura", "Opened"),
                    Map.entry("dataFechamento", "Closed"),
                    Map.entry("marcasMatricula", "Registration"),
                    Map.entry("status", "Active"));
        }
        if (key.startsWith("es")) {
            return Map.ofEntries(
                    Map.entry("clienteNome", "Cliente"),
                    Map.entry("tipoServico", "Tipo de servicio"),
                    Map.entry("partNumber", "Part number"),
                    Map.entry("serialNumber", "Serial number"),
                    Map.entry("dtAbertura", "Apertura"),
                    Map.entry("dataFechamento", "Cierre"),
                    Map.entry("marcasMatricula", "Matrícula"),
                    Map.entry("status", "Activo"));
        }
        if (key.startsWith("fr")) {
            return Map.ofEntries(
                    Map.entry("clienteNome", "Client"),
                    Map.entry("tipoServico", "Type de service"),
                    Map.entry("partNumber", "Part number"),
                    Map.entry("serialNumber", "Numéro de série"),
                    Map.entry("dtAbertura", "Ouverture"),
                    Map.entry("dataFechamento", "Clôture"),
                    Map.entry("marcasMatricula", "Immatriculation"),
                    Map.entry("status", "Actif"));
        }
        return Map.ofEntries(
                Map.entry("clienteNome", "Cliente"),
                Map.entry("tipoServico", "Tipo de serviço"),
                Map.entry("partNumber", "Part number"),
                Map.entry("serialNumber", "Serial number"),
                Map.entry("dtAbertura", "Abertura"),
                Map.entry("dataFechamento", "Fechamento"),
                Map.entry("marcasMatricula", "Marcas/Matrícula"),
                Map.entry("status", "Ativo"));
    }
}
