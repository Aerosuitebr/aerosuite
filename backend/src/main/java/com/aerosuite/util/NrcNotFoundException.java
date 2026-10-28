package com.aerosuite.util;

public class NrcNotFoundException extends RuntimeException {

    private final NrcErrorCode code;

    public NrcNotFoundException(NrcErrorCode code, Long id) {
        super(formatMessage(code, id));
        this.code = code;
    }

    public NrcNotFoundException(NrcErrorCode code, String id) {
        super(formatMessage(code, id));
        this.code = code;
    }

    public NrcErrorCode code() {
        return code;
    }

    private static String formatMessage(NrcErrorCode code, Object id) {
        if (id == null) {
            return code.defaultMessage();
        }
        return code.defaultMessage(String.valueOf(id));
    }
}
