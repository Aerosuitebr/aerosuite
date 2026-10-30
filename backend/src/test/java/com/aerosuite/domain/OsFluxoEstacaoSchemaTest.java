package com.aerosuite.domain;
import jakarta.persistence.Column;
import org.junit.jupiter.api.Test;
import java.nio.file.*;
import java.lang.reflect.Modifier;
import java.util.regex.Pattern;
import static org.junit.jupiter.api.Assertions.*;
class OsFluxoEstacaoSchemaTest {
 @Test void monitoramentoCompativelComMigracao() throws Exception { validar(OsFluxoEstacaoMonitor.class,"os_fluxo_estacao_monitor"); }
 @Test void eventosCompativeisComMigracao() throws Exception { validar(OsFluxoVinculoEvento.class,"os_fluxo_vinculo_evento"); }
 private void validar(Class<?> entidade,String tabela) throws Exception {
  String sql=Files.readString(Path.of("src/main/resources/db/migration/V103__estacoes_monitoramento_vinculos.sql"));
  var bloco=Pattern.compile("CREATE TABLE "+tabela+" \\((.*?)\\n\\);",Pattern.DOTALL).matcher(sql);assertTrue(bloco.find());
  for(var campo:entidade.getDeclaredFields()) {
   if(Modifier.isStatic(campo.getModifiers())||campo.isSynthetic())continue;
   Column col=campo.getAnnotation(Column.class);String nome=col!=null&&!col.name().isEmpty()?col.name():campo.getName();
   assertTrue(Pattern.compile("\\b"+Pattern.quote(nome)+"\\s+(BIGINT|VARCHAR|DATETIME)",Pattern.CASE_INSENSITIVE).matcher(bloco.group(1)).find(),"Coluna ausente na migração: "+entidade.getSimpleName()+"."+nome);
  }
 }
}
