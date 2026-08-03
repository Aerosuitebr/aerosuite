package com.aerosuite.conformidade;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.aerosuite.domain.Fornecedor;
import com.aerosuite.service.ConformidadeEnforcementService;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class ConformidadeEnforcementTest {

    private final ConformidadeEnforcementService enforcement = new ConformidadeEnforcementService();

    @Test
    void aslPendente_bloqueiaEntradaMaterial() {
        Fornecedor f = new Fornecedor();
        f.razaoSocial = "Fornecedor Smoke";
        f.aslStatus = "PENDENTE";
        IllegalStateException ex =
                assertThrows(IllegalStateException.class, () -> enforcement.assertFornecedorAslAprovado(f));
        assertEquals(true, ex.getMessage().contains("conformidade.enforcement.asl_nao_aprovado"));
    }

    @Test
    void aslVencido_bloqueiaEntradaMaterial() {
        Fornecedor f = new Fornecedor();
        f.razaoSocial = "Fornecedor Vencido";
        f.aslStatus = "APROVADO";
        f.aslValidade = LocalDate.now().minusDays(1);
        IllegalStateException ex =
                assertThrows(IllegalStateException.class, () -> enforcement.assertFornecedorAslAprovado(f));
        assertEquals(true, ex.getMessage().contains("conformidade.enforcement.asl_vencido"));
    }

    @Test
    void aslAprovadoVigente_permitido() {
        Fornecedor f = new Fornecedor();
        f.razaoSocial = "Fornecedor OK";
        f.aslStatus = "APROVADO";
        f.aslValidade = LocalDate.now().plusMonths(6);
        assertDoesNotThrow(() -> enforcement.assertFornecedorAslAprovado(f));
    }
}
