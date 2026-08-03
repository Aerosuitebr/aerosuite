package com.aerosuite.go_live;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class GoLiveCsvParserTest {

    @Test
    void parseRows_semicolonHeaders() {
        String csv = """
                nome;email
                ACME;acme@test.com
                """;
        List<Map<String, String>> rows = GoLiveCsvParser.parseRows(csv);
        assertEquals(1, rows.size());
        assertEquals("ACME", rows.get(0).get("nome"));
        assertEquals("acme@test.com", rows.get(0).get("email"));
    }

    @Test
    void cell_aliases() {
        Map<String, String> row = Map.of("part_number", "PN-1");
        assertEquals("PN-1", GoLiveCsvParser.cell(row, "pn", "part_number"));
    }
}
