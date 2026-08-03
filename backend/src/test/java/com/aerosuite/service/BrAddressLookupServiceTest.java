package com.aerosuite.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BrAddressLookupServiceTest {

    @Test
    void digitsOnlyStripsNonDigits() {
        assertEquals("01310100", BrAddressLookupService.digitsOnly("01310-100"));
    }

    @Test
    void formatCepAddsHyphen() {
        assertEquals("01310-100", BrAddressLookupService.formatCep("01310100"));
    }
}
