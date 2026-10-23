package com.aerosuite.service;

import org.h2.tools.RunScript;
import org.junit.jupiter.api.Test;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import static org.junit.jupiter.api.Assertions.*;

class OsPropostasMigrationsTest {
    @Test void migraSchemaExistenteSemSobrescreverDados() throws Exception {
        try(Connection c=DriverManager.getConnection("jdbc:h2:mem:os-propostas-migrations;MODE=MySQL;DATABASE_TO_LOWER=TRUE")) {
            RunScript.execute(c,new StringReader("""
                create table os (id bigint primary key, cliente_nome varchar(255));
                insert into os values (99,'Cliente preservado');
                create table funcionalidade (id bigint auto_increment primary key, nome varchar(100),descricao varchar(255),codigo varchar(50),icone varchar(50),rota varchar(100),ordem int,secao varchar(50),tipo varchar(30),visivel boolean,posicao int,ativo boolean,created_at timestamp,updated_at timestamp);
                create table perfil (id bigint primary key,codigo varchar(50));
                insert into perfil values (1,'ADMIN'),(2,'MECANICO');
                create table perfil_funcionalidade (perfil_id bigint,funcionalidade_id bigint);
                """));
            for(String resource:new String[]{"V91__proposta_cco_emails.sql","V92__os_execucao_mecanicos.sql","V93__os_fluxo.sql","V94__os_fluxo_permissoes.sql","V95__os_edicao_controlada.sql"}) {
                try(var in=getClass().getResourceAsStream("/db/migration/"+resource)) {
                    assertNotNull(in,resource);RunScript.execute(c,new InputStreamReader(in,StandardCharsets.UTF_8));
                }
            }
            try(var rs=c.createStatement().executeQuery("select cliente_nome,jaEditada from os where id=99")) {
                assertTrue(rs.next());assertEquals("Cliente preservado",rs.getString(1));assertFalse(rs.getBoolean(2));
            }
            try(var rs=c.createStatement().executeQuery("select count(*) from perfil_funcionalidade where perfil_id=2")) {
                assertTrue(rs.next());assertEquals(2,rs.getInt(1));
            }
        }
    }
}
