package com.aerosuite.service;

import com.aerosuite.i18n.AuthI18nCodes;

/** Erro de MFA com token opcional para cadastro (setup). */
public class AuthMfaException extends AuthLoginException {

    public final String mfaSetupToken;

    public AuthMfaException(String code, String mfaSetupToken) {
        super(code, AuthI18nCodes.encodedMessage(code));
        this.mfaSetupToken = mfaSetupToken;
    }

    public static AuthMfaException enrollmentRequired(String mfaSetupToken) {
        return new AuthMfaException("MFA_ENROLLMENT_REQUIRED", mfaSetupToken);
    }
}
