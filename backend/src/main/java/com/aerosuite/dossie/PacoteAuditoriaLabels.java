package com.aerosuite.dossie;

import java.util.Locale;

public final class PacoteAuditoriaLabels {

    private final String title;
    private final String empresa;
    private final String geradoEm;
    private final String totalOs;
    private final String periodo;
    private final String periodoFechamento;
    private final String estrutura;
    private final String estruturaLinha1;
    private final String estruturaLinha2;
    private final String estruturaLinha3;
    private final String aviso;
    private final String retencaoTitulo;
    private final String retencaoAnos;
    private final String retencaoLimite;
    private final String retencaoFiltro;
    private final String retencaoFiltroFechamento;
    private final String retencaoFiltroAbertura;
    private final String retencaoAviso;

    private PacoteAuditoriaLabels(
            String title,
            String empresa,
            String geradoEm,
            String totalOs,
            String periodo,
            String periodoFechamento,
            String estrutura,
            String estruturaLinha1,
            String estruturaLinha2,
            String estruturaLinha3,
            String aviso,
            String retencaoTitulo,
            String retencaoAnos,
            String retencaoLimite,
            String retencaoFiltro,
            String retencaoFiltroFechamento,
            String retencaoFiltroAbertura,
            String retencaoAviso) {
        this.title = title;
        this.empresa = empresa;
        this.geradoEm = geradoEm;
        this.totalOs = totalOs;
        this.periodo = periodo;
        this.periodoFechamento = periodoFechamento;
        this.estrutura = estrutura;
        this.estruturaLinha1 = estruturaLinha1;
        this.estruturaLinha2 = estruturaLinha2;
        this.estruturaLinha3 = estruturaLinha3;
        this.aviso = aviso;
        this.retencaoTitulo = retencaoTitulo;
        this.retencaoAnos = retencaoAnos;
        this.retencaoLimite = retencaoLimite;
        this.retencaoFiltro = retencaoFiltro;
        this.retencaoFiltroFechamento = retencaoFiltroFechamento;
        this.retencaoFiltroAbertura = retencaoFiltroAbertura;
        this.retencaoAviso = retencaoAviso;
    }

    public static PacoteAuditoriaLabels forLocale(String locale) {
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

    public String empresa() {
        return empresa;
    }

    public String geradoEm() {
        return geradoEm;
    }

    public String totalOs() {
        return totalOs;
    }

    public String periodo() {
        return periodo;
    }

    public String periodoFechamento() {
        return periodoFechamento;
    }

    public String estrutura() {
        return estrutura;
    }

    public String estruturaLinha1() {
        return estruturaLinha1;
    }

    public String estruturaLinha2() {
        return estruturaLinha2;
    }

    public String estruturaLinha3() {
        return estruturaLinha3;
    }

    public String aviso() {
        return aviso;
    }

    public String retencaoTitulo() {
        return retencaoTitulo;
    }

    public String retencaoAnos() {
        return retencaoAnos;
    }

    public String retencaoLimite() {
        return retencaoLimite;
    }

    public String retencaoFiltro() {
        return retencaoFiltro;
    }

    public String retencaoFiltroFechamento() {
        return retencaoFiltroFechamento;
    }

    public String retencaoFiltroAbertura() {
        return retencaoFiltroAbertura;
    }

    public String retencaoAviso() {
        return retencaoAviso;
    }

    private static PacoteAuditoriaLabels pt() {
        return new PacoteAuditoriaLabels(
                "Pacote de auditoria — Aero Suite",
                "Organização",
                "Gerado em",
                "Total de OS no pacote",
                "Período de abertura",
                "Filtro: data de fechamento da OS",
                "Estrutura do arquivo ZIP:",
                "  - README.txt (este arquivo)",
                "  - indice.json + os/OS_<número>/dossie.pdf por ordem de serviço",
                "  - os/OS_<número>/crs.pdf (se emitido) + os/OS_<número>/anexos/* (ficheiros da OS)",
                "Este pacote apoia a preparação para fiscalização. A conformidade regulatória "
                        + "é responsabilidade da organização aprovada e do seu manual de manutenção.",
                "Política de retenção — arquivo morto",
                "Retenção configurada (anos)",
                "Data-limite de retenção (OS fechadas antes)",
                "Critério de seleção",
                "data de fechamento",
                "data de abertura",
                "Exportação para arquivo morto offline. Validar prazo legal e manual de manutenção "
                        + "antes de eliminar registros no sistema.");
    }

    private static PacoteAuditoriaLabels en() {
        return new PacoteAuditoriaLabels(
                "Audit package — Aero Suite",
                "Organization",
                "Generated at",
                "Total work orders in package",
                "Opening date range",
                "Filter: work order closed date",
                "ZIP structure:",
                "  - README.txt (this file)",
                "  - indice.json + os/WO_<number>/dossie.pdf per work order",
                "  - os/WO_<number>/crs.pdf (if issued) + os/WO_<number>/anexos/* (WO file attachments)",
                "This package supports audit preparation. Regulatory compliance remains "
                        + "the approved organization's responsibility under its maintenance manual.",
                "Retention policy — cold archive",
                "Configured retention (years)",
                "Retention cutoff (WOs closed before)",
                "Selection criterion",
                "closed date",
                "opening date",
                "Offline cold-archive export. Verify legal retention and the maintenance manual "
                        + "before deleting records in the system.");
    }

    private static PacoteAuditoriaLabels es() {
        return new PacoteAuditoriaLabels(
                "Paquete de auditoría — Aero Suite",
                "Organización",
                "Generado el",
                "Total de OS en el paquete",
                "Período de apertura",
                "Filtro: fecha de cierre de la OS",
                "Estructura del ZIP:",
                "  - README.txt (este archivo)",
                "  - indice.json + os/OS_<número>/dossie.pdf por orden de servicio",
                "  - os/OS_<número>/crs.pdf (si emitido) + os/OS_<número>/anexos/* (archivos de la OS)",
                "Este paquete apoya la preparación para inspección. La conformidad reguladora "
                        + "es responsabilidad de la organización aprobada y su manual de mantenimiento.",
                "Política de retención — archivo muerto",
                "Retención configurada (años)",
                "Fecha límite de retención (OS cerradas antes)",
                "Criterio de selección",
                "fecha de cierre",
                "fecha de apertura",
                "Exportación para archivo muerto offline. Verifique plazo legal y manual de mantenimiento "
                        + "antes de eliminar registros en el sistema.");
    }

    private static PacoteAuditoriaLabels fr() {
        return new PacoteAuditoriaLabels(
                "Paquet d'audit — Aero Suite",
                "Organisation",
                "Généré le",
                "Total des OS dans le paquet",
                "Période d'ouverture",
                "Filtre : date de clôture de l'OS",
                "Structure du ZIP :",
                "  - README.txt (ce fichier)",
                "  - indice.json + os/OS_<numéro>/dossie.pdf par ordre de service",
                "  - os/OS_<numéro>/crs.pdf (si émis) + os/OS_<numéro>/anexos/* (pièces jointes OS)",
                "Ce paquet aide à préparer l'audit. La conformité réglementaire relève "
                        + "de l'organisation agréée et de son manuel de maintenance.",
                "Politique de rétention — archives froides",
                "Rétention configurée (années)",
                "Date limite de rétention (OS clôturées avant)",
                "Critère de sélection",
                "date de clôture",
                "date d'ouverture",
                "Export pour archives froides hors ligne. Vérifier le délai légal et le manuel de maintenance "
                        + "avant de supprimer des enregistrements dans le système.");
    }
}
