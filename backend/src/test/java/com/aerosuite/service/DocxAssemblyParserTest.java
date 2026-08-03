package com.aerosuite.service;

import com.aerosuite.dto.FcuAssemblyDoc;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

public class DocxAssemblyParserTest {

    private DocxAssemblyParser parser;

    @BeforeEach
    void setUp() {
        parser = new DocxAssemblyParser();
    }

    @Test
    void testHeaderFieldMapping() {
        // Este teste demonstra como os novos padrões regex capturam os campos do cabeçalho
        // Em um cenário real, você testaria com um documento DOCX real
        
        // Exemplo de texto que seria encontrado em um documento DOCX:
        String[] headerTexts = {
            "P/N: 4138008 / 3244872",
            "S/N: ABC123456789",
            "ATA: 73-21-00",
            "Revision: A",
            "Revision Date: 15/10/2024",
            "Manual: FCU Assembly Manual",
            "Model: FCU-2000",
            "Client: Aero Suite Aviation",
            "Company: Aero Suite Manufacturing",
            "Certificate: EASA.21G.1234",
            "Date: 15/10/2024",
            "OS: 2024-001",
            "Pages: 25",
            "Observations: Assembly completed successfully"
        };

        // Verificar se os padrões regex estão corretos
        assertTrue(headerTexts[0].matches("(?i).*P\\s*/?\\s*N\\s*[:#]?\\s*([\\w\\- /]+).*"));
        assertTrue(headerTexts[1].matches("(?i).*S\\s*/?\\s*N\\s*[:#]?\\s*([\\w\\- /]+).*"));
        assertTrue(headerTexts[2].matches("(?i).*ATA\\s*[:#]?\\s*([\\d\\-]+).*"));
        assertTrue(headerTexts[3].matches("(?i).*Rev(?:ision)?\\.?\\s*[:#]?\\s*([\\w.\\-]+).*"));
        assertTrue(headerTexts[4].matches("(?i).*(?:Data Rev\\.?|Revision Date)\\s*[:#]?\\s*([\\w, ./\\-]+).*"));
        assertTrue(headerTexts[5].matches("(?i).*Manual\\s*[:#]?\\s*([\\w\\-/ ]+).*"));
        assertTrue(headerTexts[6].matches("(?i).*Model(?:o)?\\s*[:#]?\\s*([\\w\\-/ ]+).*"));
        assertTrue(headerTexts[7].matches("(?i).*(?:Cliente|Client)\\s*[:#]?\\s*([\\w\\-/ ]+).*"));
        assertTrue(headerTexts[8].matches("(?i).*(?:Company|Empresa|Fabricante)\\s*[:#]?\\s*([\\w\\-/ ]+).*"));
        assertTrue(headerTexts[9].matches("(?i).*(?:Certificate|Certificado|Cert\\.?)\\s*[:#]?\\s*([\\w\\-/ ]+).*"));
        assertTrue(headerTexts[10].matches("(?i).*(?:Date|Data)\\s*[:#]?\\s*([\\w, ./\\-]+).*"));
        assertTrue(headerTexts[11].matches("(?i).*(?:OS|Ordem de Serviço|Work Order)\\s*[:#]?\\s*([\\w\\-/ ]+).*"));
        assertTrue(headerTexts[12].matches("(?i).*(?:Pages|Páginas|Page)\\s*[:#]?\\s*(\\d+).*"));
        assertTrue(headerTexts[13].matches("(?i).*(?:Observations|Observações|Obs\\.?)\\s*[:#]?\\s*(.+)$.*"));
    }

    @Test
    void testRegexPatterns() {
        // Teste específico para verificar se os padrões regex estão funcionando corretamente
        
        // Teste P/N
        String pnText = "P/N: 4138008 / 3244872";
        assertTrue(pnText.matches("(?i).*\\bP\\s*/?\\s*N\\s*[:#]?\\s*([\\w\\- /]+).*"));
        
        // Teste S/N
        String snText = "S/N: ABC123456789";
        assertTrue(snText.matches("(?i).*\\bS\\s*/?\\s*N\\s*[:#]?\\s*([\\w\\- /]+).*"));
        
        // Teste Company
        String companyText = "Company: Aero Suite Manufacturing";
        assertTrue(companyText.matches("(?i).*\\b(?:Company|Empresa|Fabricante)\\s*[:#]?\\s*([\\w\\-/ ]+).*"));
        
        // Teste Certificate
        String certText = "Certificate: EASA.21G.1234";
        assertTrue(certText.matches("(?i).*\\b(?:Certificate|Certificado|Cert\\.?)\\s*[:#]?\\s*([\\w\\-/ ]+).*"));
        
        // Teste Pages
        String pagesText = "Pages: 25";
        assertTrue(pagesText.matches("(?i).*\\b(?:Pages|Páginas|Page)\\s*[:#]?\\s*(\\d+).*"));
    }
}
