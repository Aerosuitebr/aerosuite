package com.aerosuite.service.conformidade;

import com.aerosuite.dto.ConformidadeChecklistItemDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ConformidadeChecklistJsonTest {

    private final ConformidadeChecklistJson json = new ConformidadeChecklistJson();

    @Test
    void defaultContingenciaTemCincoPassos() {
        List<ConformidadeChecklistItemDto> items = ConformidadeChecklistJson.defaultContingenciaReconciliacao();
        assertEquals(5, items.size());
        assertEquals("1", items.get(0).id);
        assertFalse(items.get(0).concluido);
    }

    @Test
    void defaultReleaseTemSeteItens() {
        List<ConformidadeChecklistItemDto> items = ConformidadeChecklistJson.defaultReleaseImpacto();
        assertEquals(7, items.size());
        assertTrue(items.stream().anyMatch(i -> "matriz".equals(i.id)));
    }

    @Test
    void roundTripSerializeParse() {
        List<ConformidadeChecklistItemDto> original = ConformidadeChecklistJson.defaultReleaseImpacto();
        original.get(0).concluido = true;
        String raw = json.serialize(original);
        List<ConformidadeChecklistItemDto> parsed = json.parse(raw);
        assertEquals(7, parsed.size());
        assertTrue(parsed.get(0).concluido);
    }
}
