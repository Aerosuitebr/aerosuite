package com.aerosuite.util;
import com.aerosuite.domain.Ferramenta;
import com.aerosuite.domain.FerramentaMovimento;
import java.time.*;
import jakarta.ws.rs.BadRequestException;

/** Pure rules shared by checkout, transfer and calibration approval. */
public final class FerramentaRegras {
    public static boolean criterioProvisorio(String valor) {
        String texto=java.text.Normalizer.normalize(valor==null?"":valor,java.text.Normalizer.Form.NFD)
            .replaceAll("\\p{M}","").toLowerCase(java.util.Locale.ROOT).replaceAll("[^a-z0-9]","");
        return java.util.Set.of("asadasdasd","teste","test","placeholder","exemplo","asdf","qwerty","abc","xxx","123","1234","123456").contains(texto)
            || texto.matches("^(asd|asdf|qwer|qwerty|abc|123){2,}$") || texto.matches("^(.)\\1{3,}$");
    }
    public static void exigirCriterioDefinitivo(String criterio) {
        if(criterio==null || criterio.isBlank() || criterio.length()>2000 || criterioProvisorio(criterio))
            throw new BadRequestException("Informe um critério técnico de aceitação definido pela empresa. Textos de teste ou provisórios não são aceitos.");
    }
    private FerramentaRegras() {}
    public static final ZoneId ZONA = ZoneId.of("America/Sao_Paulo");
    public static LocalDateTime agora() { return LocalDateTime.now(ZONA); }
    public static LocalDate proxima(LocalDate base, int intervalo, String unidade) {
        if (base == null || intervalo < 1 || intervalo > 3650) throw new BadRequestException("Periodicidade inválida.");
        return switch (unidade) {
            case "DIAS" -> base.plusDays(intervalo);
            case "MESES" -> base.plusMonths(intervalo);
            default -> throw new BadRequestException("Unidade deve ser DIAS ou MESES.");
        };
    }
    public static String restricao(Ferramenta f, LocalDateTime retorno, LocalDateTime agora) {
        if (f.bloqueioOperacional != null) return "Restrição operacional: " + f.bloqueioOperacional;
        if (!"REGULAR".equals(f.condicao)) return "Ferramenta indisponível: " + f.condicao;
        if (f.exigeCalibracao && f.statusCalibracao != null && !"APROVADA".equals(f.statusCalibracao)) return "Calibração não aprovada: " + f.statusCalibracao;
        if (f.exigeCalibracao && f.proximaCalibracao == null) return "Sem calibração aprovada.";
        if (f.exigeCalibracao && f.proximaCalibracao.isBefore(agora.toLocalDate())) return "Calibração vencida. Recolhimento imediato.";
        if (retorno != null && !retorno.isAfter(agora)) return "A previsão de retorno deve estar no futuro.";
        if (f.exigeCalibracao && retorno != null && retorno.toLocalDate().isAfter(f.proximaCalibracao)) return "Antecipe a devolução: previsão ultrapassa a calibração.";
        return null;
    }
    /** The sector operator records the physical handover; the recipient remains the mechanic. */
    public static void registrarConferenciaSetor(FerramentaMovimento m, Integer operadorId, LocalDateTime quando) {
        if(m.entregaPor==null){m.entregaPor=operadorId;m.entregaEm=quando;}
        if(m.recebidoPor==null){m.recebidoPor=operadorId;m.recebidoEm=quando;}
        if("TRANSFERENCIA".equals(m.tipo) && m.cienciaPor==null){m.cienciaPor=operadorId;m.cienciaEm=quando;}
    }
    public static boolean confirmacoesCompletas(FerramentaMovimento m) {
        return m.entregaPor != null && m.recebidoPor != null && (!"TRANSFERENCIA".equals(m.tipo) || m.cienciaPor != null);
    }
}
