package com.aerosuite.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PasswordPolicyValidatorTest {

    @Test
    void acceptsStrongPassword() {
        assertTrue(PasswordPolicyValidator.isValid("Aero@2026"));
    }

    @Test
    void rejectsTooShort() {
        assertFalse(PasswordPolicyValidator.isValid("Ab1!"));
    }

    @Test
    void rejectsMissingUppercase() {
        assertFalse(PasswordPolicyValidator.isValid("aero@2026"));
    }

    @Test
    void rejectsMissingLowercase() {
        assertFalse(PasswordPolicyValidator.isValid("AERO@2026"));
    }

    @Test
    void rejectsMissingDigit() {
        assertFalse(PasswordPolicyValidator.isValid("AeroSuite!"));
    }

    @Test
    void rejectsMissingSpecial() {
        assertFalse(PasswordPolicyValidator.isValid("AeroSuite1"));
    }

    @Test
    void rejectsAscendingDigitSequenceLongerThanThree() {
        assertFalse(PasswordPolicyValidator.isValid("Aero@1234"));
    }

    @Test
    void rejectsDescendingDigitSequenceLongerThanThree() {
        assertFalse(PasswordPolicyValidator.isValid("Aero@9876"));
    }

    @Test
    void allowsShortDigitSequences() {
        assertTrue(PasswordPolicyValidator.isValid("Aero@123"));
        assertTrue(PasswordPolicyValidator.isValid("Aero@321"));
    }

    @Test
    void allowsNonAdjacentDigits() {
        assertTrue(PasswordPolicyValidator.isValid("A1e@o2r6"));
    }

    @Test
    void requireValidThrowsWhenInvalid() {
        assertThrows(IllegalArgumentException.class, () -> PasswordPolicyValidator.requireValid("weak"));
    }
}
