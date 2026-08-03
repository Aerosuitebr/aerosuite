package com.aerosuite.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.aerosuite.domain.ConformidadeNaoConformidade;
import com.aerosuite.domain.ConformidadeNaoConformidade.StatusNc;
import com.aerosuite.domain.Fornecedor;
import com.aerosuite.domain.SgqDocumentoControlado;
import com.aerosuite.domain.SgqDocumentoControlado.StatusDocumento;
import com.aerosuite.domain.SgqDocumentoControlado.TipoDocumento;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.dto.ConformidadeNaoConformidadeWriteDto;
import com.aerosuite.dto.InvoiceDto;
import com.aerosuite.dto.SgqDocumentoWriteDto;
import com.aerosuite.service.ConformidadeNaoConformidadeService;
import com.aerosuite.service.ConformidadePainelService;
import com.aerosuite.service.EstoqueService;
import com.aerosuite.service.SgqDocumentoService;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

/**
 * P0 — regras funcionais Onda D (ASL, CAPA, revisão documental, painel).
 */
@QuarkusTest
class ConformidadeOndaDFunctionalIT {

    @Inject
    EstoqueService estoqueService;

    @Inject
    ConformidadeNaoConformidadeService ncService;

    @Inject
    SgqDocumentoService documentoService;

    @Inject
    ConformidadePainelService painelService;

    @Test
    @Transactional
    void salvarInvoice_fornecedorAslPendente_bloqueia() {
        Fornecedor f = new Fornecedor();
        f.tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
        f.codigo = "SMK-ASL-PEND";
        f.razaoSocial = "Fornecedor ASL Pendente IT";
        f.aslStatus = "PENDENTE";
        f.persist();

        InvoiceDto dto = new InvoiceDto();
        dto.numeroInvoice = "INV-SMK-ASL-IT";
        dto.fornecedorId = f.id;
        dto.dataEmissao = LocalDate.now();

        assertThrows(IllegalStateException.class, () -> estoqueService.salvarInvoice(dto, 1L));
    }

    @Test
    @Transactional
    void ncFechada_semEficaciaConfirmada_rejeita() {
        ConformidadeNaoConformidadeWriteDto body = new ConformidadeNaoConformidadeWriteDto();
        body.titulo = "NC smoke IT";
        body.status = StatusNc.ABERTA.name();
        var criada = ncService.criar(body);

        ConformidadeNaoConformidadeWriteDto fechar = new ConformidadeNaoConformidadeWriteDto();
        fechar.titulo = criada.titulo;
        fechar.status = StatusNc.FECHADA.name();
        fechar.eficaciaConfirmada = false;

        assertThrows(BadRequestException.class, () -> ncService.atualizar(criada.id, fechar));
    }

    @Test
    @Transactional
    void ncFechada_semEtapasAprovadas_rejeita() {
        ConformidadeNaoConformidadeWriteDto body = new ConformidadeNaoConformidadeWriteDto();
        body.titulo = "NC CAPA etapas IT";
        body.status = StatusNc.ABERTA.name();
        var criada = ncService.criar(body);

        ConformidadeNaoConformidadeWriteDto fechar = new ConformidadeNaoConformidadeWriteDto();
        fechar.titulo = criada.titulo;
        fechar.status = StatusNc.FECHADA.name();
        fechar.eficaciaConfirmada = true;

        assertThrows(BadRequestException.class, () -> ncService.atualizar(criada.id, fechar));
    }

    @Test
    @Transactional
    void novaRevisaoDocumento_obsoletaAnterior() {
        SgqDocumentoWriteDto rev00 = new SgqDocumentoWriteDto();
        rev00.tipo = TipoDocumento.POP.name();
        rev00.codigo = "POP-SMK-IT";
        rev00.titulo = "Procedimento smoke";
        rev00.revisao = "00";
        rev00.status = StatusDocumento.VIGENTE.name();
        var doc00 = documentoService.criar(rev00);

        SgqDocumentoWriteDto rev01 = new SgqDocumentoWriteDto();
        rev01.tipo = TipoDocumento.POP.name();
        rev01.codigo = "POP-SMK-IT";
        rev01.titulo = "Procedimento smoke rev 01";
        rev01.revisao = "01";
        rev01.status = StatusDocumento.VIGENTE.name();
        documentoService.publicarNovaRevisao(doc00.id, rev01);

        SgqDocumentoControlado anterior = SgqDocumentoControlado.findById(doc00.id);
        assertEquals(StatusDocumento.OBSOLETO, anterior.status);

        long vigentes =
                SgqDocumentoControlado.count(
                        "codigo = ?1 and status = ?2", "POP-SMK-IT", StatusDocumento.VIGENTE);
        assertEquals(1L, vigentes);
    }

    @Test
    @Transactional
    void painel_agregaAslPendente() {
        Fornecedor f = new Fornecedor();
        f.tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
        f.codigo = "SMK-ASL-PAINEL";
        f.razaoSocial = "Fornecedor Painel IT";
        f.aslStatus = "PENDENTE";
        f.persist();

        var painel = painelService.painel(60);
        assertTrue(painel.totalAslPendente >= 1);
        assertTrue(
                painel.itens.stream()
                        .anyMatch(
                                i ->
                                        "ASL".equals(i.categoria)
                                                && f.razaoSocial.equals(i.titulo)));
    }
}
