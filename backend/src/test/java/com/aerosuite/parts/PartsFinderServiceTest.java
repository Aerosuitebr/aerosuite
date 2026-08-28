package com.aerosuite.parts;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.aerosuite.dto.parts.PartsFinderResult;
import java.util.ArrayList;
import java.util.List;
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

    @Test
    void prioritizesAogAvailabilityAndThenShortestLeadTime() {
        PartsFinderResult unavailable = result("STAGING_DEMO", "Fornecedor A", false, 1);
        PartsFinderResult slower = result("STAGING_DEMO", "Fornecedor B", true, 8);
        PartsFinderResult faster = result("AEROSUITE_INTERNAL", "Fornecedor C", true, 2);
        List<PartsFinderResult> results = new ArrayList<>(List.of(unavailable, slower, faster));

        results.sort(PartsFinderService.resultOrder(true));

        assertEquals(List.of(faster, slower, unavailable), results);
    }

    @Test
    void keepsSourceAndSupplierOrderingOutsideAogMode() {
        PartsFinderResult demo = result("STAGING_DEMO", "Fornecedor A", true, 1);
        PartsFinderResult internalZ = result("AEROSUITE_INTERNAL", "Fornecedor Z", false, 72);
        PartsFinderResult internalA = result("AEROSUITE_INTERNAL", "Fornecedor A", false, null);
        List<PartsFinderResult> results = new ArrayList<>(List.of(demo, internalZ, internalA));

        results.sort(PartsFinderService.resultOrder(false));

        assertEquals(List.of(internalA, internalZ, demo), results);
    }

    private PartsFinderResult result(String source, String supplier, boolean aogAvailable, Integer leadTimeHours) {
        PartsFinderResult result = new PartsFinderResult();
        result.source = source;
        result.supplier = supplier;
        result.aogAvailable = aogAvailable;
        result.estimatedLeadTimeHours = leadTimeHours;
        return result;
    }
}
