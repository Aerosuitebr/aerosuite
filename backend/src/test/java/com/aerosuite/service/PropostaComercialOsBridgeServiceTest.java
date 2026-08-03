package com.aerosuite.service;

import com.aerosuite.domain.PropostaComercial;
import com.aerosuite.domain.PropostaComercialItem;
import com.aerosuite.dto.OSDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PropostaComercialOsBridgeServiceTest {

    @Test
    void buildOsDto_mapsClienteProdutoAndObservacoes() {
        PropostaComercial p = new PropostaComercial();
        p.numeroProposta = "PROP-20260516-0001";
        p.clienteNome = "Cliente Teste";
        p.produtoPn = "PN-123";
        p.produtoSn = "SN-9";
        p.produtoManual = "ATA-72";
        p.aeronavePrefixo = "PR-ABC";
        p.aplicacaoMotor = "PT6";
        p.idTipoServico = 5;
        p.tipoServicoNome = "Overhaul";
        p.servicoExecutado = "Inspeção geral";
        p.observacoes = "Urgente";

        PropostaComercialItem item = new PropostaComercialItem();
        item.produtoNome = "Kit selo";
        item.produtoPn = "SEAL-1";
        item.quantidade = 2;

        OSDto dto = PropostaComercialOsBridgeService.buildOsDto(p, List.of(item));

        assertEquals("Cliente Teste", dto.clienteNome);
        assertEquals("PN-123", dto.partNumber);
        assertEquals("SN-9", dto.serialNumber);
        assertEquals("ATA-72", dto.ataManual);
        assertEquals("PR-ABC", dto.marcasMatricula);
        assertEquals("PT6", dto.motor);
        assertEquals(5, dto.tipoServicoId);
        assertEquals("PROP-20260516-0001", dto.numOsOriginal);
        assertNotNull(dto.obsIniServ);
        assertTrue(dto.obsIniServ.contains("PROP-20260516-0001"));
        assertTrue(dto.obsIniServ.contains("Kit selo"));
        assertTrue(dto.obsIniServ.contains("Urgente"));
    }

    @Test
    void buildObsIniServ_withoutItens_usesProdutoNome() {
        PropostaComercial p = new PropostaComercial();
        p.numeroProposta = "PROP-1";
        p.produtoNome = "Motor X";

        String obs = PropostaComercialOsBridgeService.buildObsIniServ(p, List.of());
        assertTrue(obs.contains("Motor X"));
    }
}
