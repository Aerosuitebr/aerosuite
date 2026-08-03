package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.OS;
import com.aerosuite.domain.SistemaEmpresaConfig;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.dto.RetencaoRegistrosConfigDto;
import com.aerosuite.dto.RetencaoRegistrosInventarioDto;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * B4 — retenção orientativa de registros de manutenção (OS fechadas) e exportação para arquivo morto.
 */
@ApplicationScoped
public class RetencaoRegistrosService {

    public static final int DEFAULT_ANOS = 5;
    public static final int MIN_ANOS = 1;
    public static final int MAX_ANOS = 50;

    private static final DateTimeFormatter D = DateTimeFormatter.ISO_LOCAL_DATE;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    PacoteAuditoriaTenantService pacoteService;

    public RetencaoRegistrosConfigDto getConfig() {
        int anos = resolveAnos();
        RetencaoRegistrosConfigDto dto = new RetencaoRegistrosConfigDto();
        dto.anosRetencao = anos;
        dto.dataLimiteRetencao = dataLimite(anos).format(D);
        dto.minAnos = MIN_ANOS;
        dto.maxAnos = MAX_ANOS;
        return dto;
    }

    @Transactional
    public RetencaoRegistrosConfigDto updateConfig(Integer anosRetencao) {
        if (anosRetencao == null) {
            throw new BadRequestException(ApiI18nMessages.domain("conformidade.retencao.error.anos_obrigatorio"));
        }
        int anos = normalizeAnos(anosRetencao);
        SistemaEmpresaConfig cfg = configEntity();
        cfg.retencaoRegistrosAnos = anos;
        cfg.persist();
        return getConfig();
    }

    public RetencaoRegistrosInventarioDto inventario() {
        int anos = resolveAnos();
        LocalDate limite = dataLimite(anos);
        String tid = TenantConstants.tenantIdOf(tenantDataAccess.currentTenantId());

        RetencaoRegistrosInventarioDto dto = new RetencaoRegistrosInventarioDto();
        dto.anosRetencao = anos;
        dto.dataLimiteRetencao = limite.format(D);
        dto.totalOsFechadas = OS.count("tenantId = ?1 and dataFechamento is not null", tid);
        dto.totalDentroRetencao = OS.count("tenantId = ?1 and dataFechamento >= ?2", tid, limite);
        dto.totalForaRetencao = OS.count("tenantId = ?1 and dataFechamento < ?2", tid, limite);
        dto.totalOsAbertas = OS.count("tenantId = ?1 and dataFechamento is null", tid);

        List<OS> amostra =
                OS.find(
                                "tenantId = ?1 and dataFechamento is not null and dataFechamento < ?2 order by dataFechamento desc, id desc",
                                tid,
                                limite)
                        .page(0, 20)
                        .list();
        for (OS os : amostra) {
            RetencaoRegistrosInventarioDto.OsRetencaoLinhaDto linha = new RetencaoRegistrosInventarioDto.OsRetencaoLinhaDto();
            linha.osId = os.id;
            linha.numeroOs = os.idOs;
            linha.clienteNome = os.clienteNome;
            linha.dataFechamento = os.dataFechamento != null ? os.dataFechamento.format(D) : null;
            linha.dtAbertura = os.dtAbertura != null ? os.dtAbertura.format(D) : null;
            linha.crsEmitido = os.crsEmitidoEm != null;
            dto.amostraForaRetencao.add(linha);
        }
        return dto;
    }

    public byte[] exportArquivoMorto(LocalDate dataInicio, LocalDate dataFim, Integer limite, String locale)
            throws Exception {
        int anos = resolveAnos();
        LocalDate dataLimiteRetencao = dataLimite(anos);
        LocalDate fim = dataFim != null ? dataFim : dataLimiteRetencao.minusDays(1);
        PacoteAuditoriaTenantService.RetencaoManifest manifest =
                new PacoteAuditoriaTenantService.RetencaoManifest(anos, dataLimiteRetencao);
        return pacoteService.exportZip(
                dataInicio,
                fim,
                limite,
                List.of(),
                locale,
                PacoteAuditoriaTenantService.PeriodoCampo.FECHAMENTO,
                manifest);
    }

    public String suggestedArquivoMortoZipName() {
        return "Arquivo_Morte_" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".zip";
    }

    private int resolveAnos() {
        SistemaEmpresaConfig cfg = configEntity();
        return normalizeAnos(cfg.retencaoRegistrosAnos != null ? cfg.retencaoRegistrosAnos : DEFAULT_ANOS);
    }

    private SistemaEmpresaConfig configEntity() {
        long tid = tenantDataAccess.currentTenantId();
        SistemaEmpresaConfig cfg = SistemaEmpresaConfig.findForTenant(tid);
        if (cfg == null) {
            cfg = new SistemaEmpresaConfig();
            cfg.tenantId = TenantConstants.tenantIdOf(tid);
            cfg.displayName = "Organização";
            cfg.supportEmail = "suporte@local";
            cfg.retencaoRegistrosAnos = DEFAULT_ANOS;
            cfg.persist();
        }
        if (cfg.retencaoRegistrosAnos == null) {
            cfg.retencaoRegistrosAnos = DEFAULT_ANOS;
        }
        return cfg;
    }

    private static int normalizeAnos(int anos) {
        if (anos < MIN_ANOS) {
            return MIN_ANOS;
        }
        return Math.min(anos, MAX_ANOS);
    }

    private static LocalDate dataLimite(int anos) {
        return LocalDate.now().minusYears(anos);
    }
}
