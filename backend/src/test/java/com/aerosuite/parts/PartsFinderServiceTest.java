package com.aerosuite.parts;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class PartsFinderServiceTest {
    @Test
    void normalizesPartNumberForMatchingWithoutChangingTheOriginalResult() {
        assertEquals("23064518", PartsFinderService.normalizePartNumber(" 2306-451/8 "));
        assertEquals("AB001X", PartsFinderService.normalizePartNumber("ab 001-x"));
    }

    @Test
    void normalizesNullToEmptyValue() {
        assertEquals("", PartsFinderService.normalizePartNumber(null));
    }
}
