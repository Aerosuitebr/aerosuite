package com.aerosuite.exception;

import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionMapperTest {

    private final GlobalExceptionMapper mapper = new GlobalExceptionMapper();

    @Test
    void forbiddenExceptionMapsTo403() {
        Response response = mapper.toResponse(new ForbiddenException("Provisão restrita"));
        assertEquals(403, response.getStatus());
    }

    @Test
    void notFoundExceptionMapsTo404() {
        Response response = mapper.toResponse(new NotFoundException("Inexistente"));
        assertEquals(404, response.getStatus());
    }

    @Test
    void badRequestExceptionMapsTo400() {
        Response response = mapper.toResponse(new BadRequestException("Inválido"));
        assertEquals(400, response.getStatus());
    }

    @Test
    void unknownExceptionMapsTo500() {
        Response response = mapper.toResponse(new RuntimeException("falha"));
        assertEquals(500, response.getStatus());
    }
}
