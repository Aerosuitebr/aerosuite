package com.aerosuite.exception;

import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionMapperI18nTest {

  private final GlobalExceptionMapper mapper = new GlobalExceptionMapper();

  @Test
  void badRequestWithI18nKeyExposesKeyInErrorField() {
    Response r = mapper.toResponse(new BadRequestException("crs.error.habilitacao.invalida"));
    @SuppressWarnings("unchecked")
    Map<String, Object> body = (Map<String, Object>) r.getEntity();
    assertEquals("crs.error.habilitacao.invalida", body.get("error"));
    assertEquals("crs.error.habilitacao.invalida", body.get("message"));
    assertEquals("crs.error.habilitacao.invalida", body.get("code"));
  }
}
