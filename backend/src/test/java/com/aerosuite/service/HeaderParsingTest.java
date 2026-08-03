package com.aerosuite.service;

import org.junit.jupiter.api.Test;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import static org.junit.jupiter.api.Assertions.*;

public class HeaderParsingTest {

    // Padrões regex do DocxAssemblyParser
    private static final Pattern ATA_RE = Pattern.compile("(?i)\\bATA\\s*[:#]?\\s*([\\d\\-]+)");
    private static final Pattern REV_RE = Pattern.compile("(?i)\\bRev(?:ision)?\\.?\\s*[:#]?\\s*([\\w.\\-]+)");
    private static final Pattern MANUAL = Pattern.compile("(?i)\\bManual\\*?\\s*[:#]?\\s*([\\w\\-/ ]+)");
    private static final Pattern MODEL = Pattern.compile("(?i)\\bModel(?:o)?\\s*[:#]?\\s*([\\w\\-/ ]+)");
    private static final Pattern DATE_RE = Pattern.compile("(?i)\\b(?:Date|Data)\\s*[:#]?\\s*([\\w, ./\\-]+)");

    @Test
    void testSpecificFormatsFromUser() {
        // Dados específicos fornecidos pelo usuário
        String[] testTexts = {
            "Model: DP-F2",
            "Manual*: 3244872",
            "| Rev. 2 |",
            "Date: Nov. 18, 2020 |",
            "ATA: 73-20-64"
        };

        // Teste Model
        Matcher modelMatcher = MODEL.matcher(testTexts[0]);
        assertTrue(modelMatcher.find(), "Model pattern should match 'Model: DP-F2'");
        assertEquals("DP-F2", modelMatcher.group(1).trim(), "Model should extract 'DP-F2'");

        // Teste Manual
        Matcher manualMatcher = MANUAL.matcher(testTexts[1]);
        assertTrue(manualMatcher.find(), "Manual pattern should match 'Manual*: 3244872'");
        assertEquals("3244872", manualMatcher.group(1).trim(), "Manual should extract '3244872'");

        // Teste Rev
        Matcher revMatcher = REV_RE.matcher(testTexts[2]);
        assertTrue(revMatcher.find(), "Rev pattern should match '| Rev. 2 |'");
        assertEquals("2", revMatcher.group(1).trim(), "Rev should extract '2'");

        // Teste Date
        Matcher dateMatcher = DATE_RE.matcher(testTexts[3]);
        assertTrue(dateMatcher.find(), "Date pattern should match 'Date: Nov. 18, 2020 |'");
        assertEquals("Nov. 18, 2020", dateMatcher.group(1).trim(), "Date should extract 'Nov. 18, 2020'");

        // Teste ATA
        Matcher ataMatcher = ATA_RE.matcher(testTexts[4]);
        assertTrue(ataMatcher.find(), "ATA pattern should match 'ATA: 73-20-64'");
        assertEquals("73-20-64", ataMatcher.group(1).trim(), "ATA should extract '73-20-64'");
    }

    @Test
    void testProblematicFormats() {
        // Testar formatos que podem estar causando problemas
        
        // Manual com asterisco
        String manualWithAsterisk = "Manual*: 3244872";
        Matcher manualMatcher = MANUAL.matcher(manualWithAsterisk);
        System.out.println("Testing: " + manualWithAsterisk);
        System.out.println("Pattern: " + MANUAL.pattern());
        if (manualMatcher.find()) {
            System.out.println("Found: " + manualMatcher.group(1));
        } else {
            System.out.println("NOT FOUND");
        }

        // Rev com pipes
        String revWithPipes = "| Rev. 2 |";
        Matcher revMatcher = REV_RE.matcher(revWithPipes);
        System.out.println("Testing: " + revWithPipes);
        System.out.println("Pattern: " + REV_RE.pattern());
        if (revMatcher.find()) {
            System.out.println("Found: " + revMatcher.group(1));
        } else {
            System.out.println("NOT FOUND");
        }

        // Date com pipe no final
        String dateWithPipe = "Date: Nov. 18, 2020 |";
        Matcher dateMatcher = DATE_RE.matcher(dateWithPipe);
        System.out.println("Testing: " + dateWithPipe);
        System.out.println("Pattern: " + DATE_RE.pattern());
        if (dateMatcher.find()) {
            System.out.println("Found: " + dateMatcher.group(1));
        } else {
            System.out.println("NOT FOUND");
        }
    }
}

