package com.aerosuite.util;

public class NrcBusinessException extends IllegalStateException {

    private final NrcErrorCode code;

    public NrcBusinessException(NrcErrorCode code) {
        super(code.defaultMessage());
        this.code = code;
    }

    public NrcBusinessException(NrcErrorCode code, String message) {
        super(message);
        this.code = code;
    }

    public NrcBusinessException(NrcErrorCode code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public NrcErrorCode code() {
        return code;
    }
}
