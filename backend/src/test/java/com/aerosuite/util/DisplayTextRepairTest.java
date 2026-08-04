package com.aerosuite.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DisplayTextRepairTest {

    @Test
    void repairsCommonQuestionMarkCorruption() {
        assertEquals("ÉLCIO DA CRUZ PEÇANHA FILHO", DisplayTextRepair.repair("??LCIO DA CRUZ PE??ANHA FILHO"));
        assertEquals("Mecânico", DisplayTextRepair.repair("Mec??nico"));
        assertEquals("Guimarães", DisplayTextRepair.repair("Guimar??es"));
    }

    @Test
    void repairsMojibake() {
        assertEquals("Manutenção", DisplayTextRepair.repair("ManutenÃ§Ã£o"));
    }

    @Test
    void repairsOem850MojibakeFromLegacyImports() {
        assertEquals("G3 RIO AVIAÇÃO LTDA", DisplayTextRepair.repair("G3 RIO AVIA├ç├âO LTDA"));
    }
}
