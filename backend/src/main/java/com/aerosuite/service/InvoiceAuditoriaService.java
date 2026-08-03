package com.aerosuite.service;

import com.aerosuite.domain.InvoiceAuditoria;
import com.aerosuite.domain.InvoiceAuditoria.AcaoAuditoria;
import com.aerosuite.dto.InvoiceAuditoriaDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class InvoiceAuditoriaService {

    @Transactional
    public void registrar(
            Long invoiceId,
            String numeroInvoice,
            AcaoAuditoria acao,
            String motivo,
            String statusAnterior,
            String statusNovo,
            Boolean isActiveAnterior,
            Boolean isActiveNovo,
            int qtdItensEstoque,
            int qtdLotes,
            String detalheBloqueio,
            Long usuarioId,
            String usuarioNome,
            String usuarioEmail,
            String ipOrigem,
            String userAgent) {

        InvoiceAuditoria a = new InvoiceAuditoria();
        a.invoiceId = invoiceId;
        a.numeroInvoice = numeroInvoice != null ? numeroInvoice : "";
        a.acao = acao;
        a.motivo = motivo != null && !motivo.isBlank() ? motivo.trim() : "(sem motivo informado)";
        a.statusAnterior = statusAnterior;
        a.statusNovo = statusNovo;
        a.isActiveAnterior = isActiveAnterior;
        a.isActiveNovo = isActiveNovo;
        a.qtdItensEstoque = qtdItensEstoque;
        a.qtdLotes = qtdLotes;
        a.detalheBloqueio = detalheBloqueio;
        a.usuarioId = usuarioId;
        a.usuarioNome = usuarioNome;
        a.usuarioEmail = usuarioEmail;
        a.ipOrigem = ipOrigem;
        a.userAgent = userAgent != null && userAgent.length() > 500 ? userAgent.substring(0, 500) : userAgent;
        a.dataHora = LocalDateTime.now();
        a.persist();
    }

    public List<InvoiceAuditoriaDto> listarPorInvoice(Long invoiceId) {
        return InvoiceAuditoria
                .find("invoiceId = ?1 order by dataHora desc", invoiceId)
                .<InvoiceAuditoria>list()
                .stream()
                .map(this::toDto)
                .toList();
    }

    private InvoiceAuditoriaDto toDto(InvoiceAuditoria a) {
        InvoiceAuditoriaDto dto = new InvoiceAuditoriaDto();
        dto.id = a.id;
        dto.invoiceId = a.invoiceId;
        dto.numeroInvoice = a.numeroInvoice;
        dto.acao = a.acao != null ? a.acao.name() : null;
        dto.motivo = a.motivo;
        dto.statusAnterior = a.statusAnterior;
        dto.statusNovo = a.statusNovo;
        dto.isActiveAnterior = a.isActiveAnterior;
        dto.isActiveNovo = a.isActiveNovo;
        dto.qtdItensEstoque = a.qtdItensEstoque;
        dto.qtdLotes = a.qtdLotes;
        dto.detalheBloqueio = a.detalheBloqueio;
        dto.usuarioId = a.usuarioId;
        dto.usuarioNome = a.usuarioNome;
        dto.usuarioEmail = a.usuarioEmail;
        dto.ipOrigem = a.ipOrigem;
        dto.dataHora = a.dataHora;
        return dto;
    }
}
