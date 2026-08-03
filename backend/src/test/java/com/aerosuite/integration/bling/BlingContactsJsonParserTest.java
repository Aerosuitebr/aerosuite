package com.aerosuite.integration.bling;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class BlingContactsJsonParserTest {

    @Test
    void parseCreatedId_fromPostResponse() throws Exception {
        String json = "{\"data\":{\"id\":99,\"nome\":\"Test\"}}";
        assertEquals(99L, BlingContactsJsonParser.parseCreatedId(json));
    }

    @Test
    void parseEmptyBodyReturnsEmptyList() throws Exception {
        assertTrue(BlingContactsJsonParser.parse("").isEmpty());
        assertTrue(BlingContactsJsonParser.parse("{}").isEmpty());
        assertTrue(BlingContactsJsonParser.parse("{\"data\":[]}").isEmpty());
    }

    @Test
    void parseContactWithNestedAddress() throws Exception {
        String json =
                """
                {
                  "data": [
                    {
                      "id": 42,
                      "nome": "Acme Aviation",
                      "email": "contato@acme.com",
                      "telefone": "11999990000",
                      "numeroDocumento": "12.345.678/0001-90",
                      "endereco": {
                        "endereco": "Rua A, 100",
                        "municipio": "São Paulo",
                        "uf": "SP"
                      }
                    }
                  ]
                }
                """;
        List<BlingContactDto> items = BlingContactsJsonParser.parse(json);
        assertEquals(1, items.size());
        BlingContactDto c = items.get(0);
        assertEquals(42L, c.id);
        assertEquals("Acme Aviation", c.nome);
        assertEquals("contato@acme.com", c.email);
        assertEquals("11999990000", c.telefone);
        assertEquals("12.345.678/0001-90", c.cnpjCpf);
        assertEquals("Rua A, 100", c.endereco);
        assertEquals("São Paulo", c.cidade);
        assertEquals("SP", c.uf);
    }

    @Test
    void parseSkipsEntriesWithoutId() throws Exception {
        String json =
                """
                {"data":[{"nome":"Sem ID"},{"id":0,"nome":"Zero"},{"id":7,"nome":"OK"}]}
                """;
        List<BlingContactDto> items = BlingContactsJsonParser.parse(json);
        assertEquals(1, items.size());
        assertEquals(7L, items.get(0).id);
        assertEquals("OK", items.get(0).nome);
    }
}
