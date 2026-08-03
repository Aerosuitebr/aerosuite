package com.aerosuite.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.aerosuite.audit.AuditoriaUsuarioContext;
import com.aerosuite.domain.OS;
import com.aerosuite.domain.OsJobCardAssinatura;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.dto.OsJobCardAssinaturaDto;
import com.aerosuite.dto.OsJobCardAssinaturaRequest;
import com.aerosuite.dto.OsJobCardDto;
import com.aerosuite.security.JobCardAssinaturaIntegrity;
import com.aerosuite.service.OsJobCardService;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.Base64;
import org.junit.jupiter.api.Test;

/** P-006 / REQ-008 — integridade SHA-256 + carimbo server na assinatura job card. */
@QuarkusTest
class JobCardAssinaturaIntegrityIT {

  private static final byte[] PNG_SAMPLE = new byte[] {
    (byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d
  };

  @Inject
  OsJobCardService jobCardService;

  @Test
  @Transactional
  void salvarAssinatura_persisteHashEIntegridadeOk() {
    OS os = new OS();
    os.tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
    os.idOs = 910_006;
    os.clienteNome = "Cliente IT assinatura";
    os.dtAbertura = LocalDate.now();
    os.isActive = true;
    os.persist();

    OsJobCardAssinaturaRequest body = new OsJobCardAssinaturaRequest();
    body.papel = "EXECUCAO";
    body.assinaturaPngBase64 = Base64.getEncoder().encodeToString(PNG_SAMPLE);

    AuditoriaUsuarioContext ctx =
        new AuditoriaUsuarioContext("Mecânico IT", "mec@it.local", 1L, "127.0.0.1", "JobCardAssinaturaIntegrityIT");

    OsJobCardAssinaturaDto saved = jobCardService.salvarAssinatura(os.id, body, ctx);
    assertTrue(saved.presente);
    assertNotNull(saved.assinaturaSha256);
    assertEquals(64, saved.assinaturaSha256.length());
    assertNotNull(saved.assinaturaTimestampServer);
    assertEquals(Boolean.TRUE, saved.integridadeOk);
    assertEquals(
        JobCardAssinaturaIntegrity.sha256Hex(PNG_SAMPLE), saved.assinaturaSha256);

    OsJobCardDto card = jobCardService.obter(os.id);
    OsJobCardAssinaturaDto loaded =
        card.assinaturas.stream()
            .filter(a -> "EXECUCAO".equals(a.papel))
            .findFirst()
            .orElseThrow();
    assertEquals(Boolean.TRUE, loaded.integridadeOk);
  }

  @Test
  @Transactional
  void verify_detectaHashAlterado() {
    OsJobCardAssinatura row = new OsJobCardAssinatura();
    row.tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
    row.osId = 1L;
    row.papel = OsJobCardAssinatura.PapelAssinatura.INSPECAO;
    row.assinaturaPng = PNG_SAMPLE;
    row.assinaturaSha256 = "0".repeat(64);
    row.assinadoEm = JobCardAssinaturaIntegrity.serverTimestamp();
    row.assinaturaTimestampServer = row.assinadoEm;
    row.persist();

    assertEquals(Boolean.FALSE, JobCardAssinaturaIntegrity.verify(row.assinaturaPng, row.assinaturaSha256));
  }
}
