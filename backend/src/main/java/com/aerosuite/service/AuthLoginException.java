package com.aerosuite.service;

import com.aerosuite.i18n.AuthI18nCodes;

/**
 * Erro de autenticação com código estável para o frontend (i18n).
 */
public class AuthLoginException extends RuntimeException {

    public final String code;

    public AuthLoginException(String code, String message) {
        super(message);
        this.code = code;
    }

    public static AuthLoginException of(String code) {
        return new AuthLoginException(code, AuthI18nCodes.encodedMessage(code));
    }
}
