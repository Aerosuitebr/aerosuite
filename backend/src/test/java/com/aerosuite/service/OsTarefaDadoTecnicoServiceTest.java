package com.aerosuite.service;

import com.aerosuite.dto.OsTarefaDadoTecnicoDto;
import jakarta.ws.rs.BadRequestException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class OsTarefaDadoTecnicoServiceTest {

    private final OsTarefaDadoTecnicoService service = new OsTarefaDadoTecnicoService();

    @Test
    void validateRowRejectsShortTaskDescription() {
        OsTarefaDadoTecnicoDto dto = new OsTarefaDadoTecnicoDto();
        dto.tipoDado = "AD_SB";
        dto.tarefaDescricao = "ab";
        dto.aeroDiretrizId = 1L;
        assertThrows(BadRequestException.class, () -> service.validateRow(dto));
    }

    @Test
    void validateRowRequiresDiretrizForAdSb() {
        OsTarefaDadoTecnicoDto dto = new OsTarefaDadoTecnicoDto();
        dto.tipoDado = "AD_SB";
        dto.tarefaDescricao = "Inspeção visual do trem de pouso";
        assertThrows(BadRequestException.class, () -> service.validateRow(dto));
    }

    @Test
    void validateRowAcceptsManualWithPublicacao() {
        OsTarefaDadoTecnicoDto dto = new OsTarefaDadoTecnicoDto();
        dto.tipoDado = "MANUAL";
        dto.tarefaDescricao = "Revisão conforme manual do fabricante";
        dto.publicacaoTecnicaId = 10;
        assertDoesNotThrow(() -> service.validateRow(dto));
    }

    @Test
    void validateRowAcceptsOutroWithReferencia() {
        OsTarefaDadoTecnicoDto dto = new OsTarefaDadoTecnicoDto();
        dto.tipoDado = "OUTRO";
        dto.tarefaDescricao = "Boletim interno de campo";
        dto.referenciaExterna = "BI-2024-014";
        assertDoesNotThrow(() -> service.validateRow(dto));
    }
}
