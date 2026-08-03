package com.aerosuite.rastreio;

import java.util.List;
import java.util.Locale;

public final class ItemRastreioLabels {

    private final String title;
    private final String generatedAt;
    private final String sectionItem;
    private final String sectionTimeline;
    private final String sectionChecklist;
    private final String noRecords;
    private final String codigoRastreio;
    private final String partNumber;
    private final String serialNumber;
    private final String status;
    private final String certificado;
    private final String validade;
    private final String lote;
    private final String invoice;
    private final String fornecedor;
    private final String localizacao;
    private final String osConsumo;
    private final String colDate;
    private final String colType;
    private final String colQty;
    private final String colOs;
    private final String colUser;
    private final String colDetail;
    private final List<String> checklistLines;

    private ItemRastreioLabels(
            String title,
            String generatedAt,
            String sectionItem,
            String sectionTimeline,
            String sectionChecklist,
            String noRecords,
            String codigoRastreio,
            String partNumber,
            String serialNumber,
            String status,
            String certificado,
            String validade,
            String lote,
            String invoice,
            String fornecedor,
            String localizacao,
            String osConsumo,
            String colDate,
            String colType,
            String colQty,
            String colOs,
            String colUser,
            String colDetail,
            List<String> checklistLines) {
        this.title = title;
        this.generatedAt = generatedAt;
        this.sectionItem = sectionItem;
        this.sectionTimeline = sectionTimeline;
        this.sectionChecklist = sectionChecklist;
        this.noRecords = noRecords;
        this.codigoRastreio = codigoRastreio;
        this.partNumber = partNumber;
        this.serialNumber = serialNumber;
        this.status = status;
        this.certificado = certificado;
        this.validade = validade;
        this.lote = lote;
        this.invoice = invoice;
        this.fornecedor = fornecedor;
        this.localizacao = localizacao;
        this.osConsumo = osConsumo;
        this.colDate = colDate;
        this.colType = colType;
        this.colQty = colQty;
        this.colOs = colOs;
        this.colUser = colUser;
        this.colDetail = colDetail;
        this.checklistLines = checklistLines;
    }

    public static ItemRastreioLabels forLocale(String locale) {
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

    public String title() {
        return title;
    }

    public String generatedAt() {
        return generatedAt;
    }

    public String sectionItem() {
        return sectionItem;
    }

    public String sectionTimeline() {
        return sectionTimeline;
    }

    public String sectionChecklist() {
        return sectionChecklist;
    }

    public String noRecords() {
        return noRecords;
    }

    public String codigoRastreio() {
        return codigoRastreio;
    }

    public String partNumber() {
        return partNumber;
    }

    public String serialNumber() {
        return serialNumber;
    }

    public String status() {
        return status;
    }

    public String certificado() {
        return certificado;
    }

    public String validade() {
        return validade;
    }

    public String lote() {
        return lote;
    }

    public String invoice() {
        return invoice;
    }

    public String fornecedor() {
        return fornecedor;
    }

    public String localizacao() {
        return localizacao;
    }

    public String osConsumo() {
        return osConsumo;
    }

    public String colDate() {
        return colDate;
    }

    public String colType() {
        return colType;
    }

    public String colQty() {
        return colQty;
    }

    public String colOs() {
        return colOs;
    }

    public String colUser() {
        return colUser;
    }

    public String colDetail() {
        return colDetail;
    }

    public List<String> checklistLines() {
        return checklistLines;
    }

    private static ItemRastreioLabels pt() {
        return new ItemRastreioLabels(
                "Linha do tempo de rastreabilidade",
                "Gerado em",
                "Identificação da peça",
                "Histórico de movimentações",
                "Checklist de evidências (auditoria)",
                "Nenhum registro",
                "Código de rastreio",
                "Part Number (P/N)",
                "Serial Number (S/N)",
                "Status",
                "Certificado de conformidade",
                "Data de validade",
                "Lote",
                "Invoice",
                "Fornecedor",
                "Localização",
                "OS de consumo",
                "Data",
                "Tipo",
                "Qtd.",
                "OS",
                "Usuário",
                "Detalhe",
                List.of(
                        "P/N e S/N conferidos com etiqueta física",
                        "Certificado de conformidade arquivado (quando aplicável)",
                        "Saídas vinculadas a OS identificável",
                        "Motivo de saída registrado para consumo em manutenção",
                        "Status e validade coerentes com condição da peça"));
    }

    private static ItemRastreioLabels en() {
        return new ItemRastreioLabels(
                "Traceability timeline",
                "Generated at",
                "Part identification",
                "Movement history",
                "Evidence checklist (audit)",
                "No records",
                "Trace code",
                "Part Number (P/N)",
                "Serial Number (S/N)",
                "Status",
                "Certificate of conformity",
                "Expiry date",
                "Lot",
                "Invoice",
                "Supplier",
                "Location",
                "Consuming work order",
                "Date",
                "Type",
                "Qty",
                "WO",
                "User",
                "Detail",
                List.of(
                        "P/N and S/N match physical label",
                        "Certificate of conformity on file (when applicable)",
                        "Issues linked to identifiable work order",
                        "Issue reason recorded for maintenance consumption",
                        "Status and expiry consistent with part condition"));
    }

    private static ItemRastreioLabels es() {
        return new ItemRastreioLabels(
                "Línea de tiempo de trazabilidad",
                "Generado el",
                "Identificación de la pieza",
                "Historial de movimientos",
                "Lista de evidencias (auditoría)",
                "Sin registros",
                "Código de rastreo",
                "Part Number (P/N)",
                "Serial Number (S/N)",
                "Estado",
                "Certificado de conformidad",
                "Fecha de validez",
                "Lote",
                "Invoice",
                "Proveedor",
                "Ubicación",
                "OT de consumo",
                "Fecha",
                "Tipo",
                "Cant.",
                "OT",
                "Usuario",
                "Detalle",
                List.of(
                        "P/N y S/N coinciden con etiqueta física",
                        "Certificado de conformidad archivado (cuando aplique)",
                        "Salidas vinculadas a OT identificable",
                        "Motivo de salida registrado para consumo en mantenimiento",
                        "Estado y validez coherentes con la pieza"));
    }

    private static ItemRastreioLabels fr() {
        return new ItemRastreioLabels(
                "Chronologie de traçabilité",
                "Généré le",
                "Identification de la pièce",
                "Historique des mouvements",
                "Liste de contrôle des preuves (audit)",
                "Aucun enregistrement",
                "Code de traçage",
                "Part Number (P/N)",
                "Serial Number (S/N)",
                "Statut",
                "Certificat de conformité",
                "Date de validité",
                "Lot",
                "Facture",
                "Fournisseur",
                "Emplacement",
                "OT de consommation",
                "Date",
                "Type",
                "Qté",
                "OT",
                "Utilisateur",
                "Détail",
                List.of(
                        "P/N et S/N conformes à l’étiquette physique",
                        "Certificat de conformité archivé (le cas échéant)",
                        "Sorties liées à une OT identifiable",
                        "Motif de sortie enregistré pour la maintenance",
                        "Statut et validité cohérents avec la pièce"));
    }
}
