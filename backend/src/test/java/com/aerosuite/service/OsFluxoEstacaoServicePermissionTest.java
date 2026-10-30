package com.aerosuite.service;
import com.aerosuite.security.InternalUserContext;
import jakarta.ws.rs.ForbiddenException;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class OsFluxoEstacaoServicePermissionTest {
 private OsFluxoEstacaoService semGestao() {
  var s=new OsFluxoEstacaoService();s.user=mock(InternalUserContext.class);when(s.user.getPerfilCodigo()).thenReturn("MECANICO");return s;
 }
 @Test void aprovacaoSemCodigoExigeGestaoAntesDeConsultarDados(){assertThrows(ForbiddenException.class,()->semGestao().aprovar("terminal-123","OFICINA-1","Bancada"));}
 @Test void historicoExigeGestao(){assertThrows(ForbiddenException.class,()->semGestao().historico("OFICINA-1"));}
 @Test void vinculoDiretoExigeGestao(){assertThrows(ForbiddenException.class,()->semGestao().vincularEstacao("terminal-123","OFICINA-1"));}
 @Test void remocaoExigeGestao(){assertThrows(ForbiddenException.class,()->semGestao().remover("terminal-123"));}
 @Test void cancelamentoExigeGestao(){assertThrows(ForbiddenException.class,()->semGestao().cancelarSolicitacao("terminal-123"));}
}
