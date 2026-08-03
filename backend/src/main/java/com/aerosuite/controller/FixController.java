package com.aerosuite.controller;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.RequiresFuncionalidades;
import io.quarkus.arc.profile.UnlessBuildProfile;
import jakarta.inject.Inject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@ApplicationScoped
@UnlessBuildProfile("prod")
@Path("/api/fix")
@Produces(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(allOf = {"GERENCIAR_PERMISSOES"})
public class FixController {
    
    @Inject
    EntityManager entityManager;
    
    @GET
    @Path("/database")
    @Transactional
    public Response fixDatabase() {
        try {
            // Atualizar tipos de funcionalidade
            entityManager.createNativeQuery(
                "UPDATE funcionalidade SET tipo = 'FUNCIONALIDADE' WHERE tipo = 'funcionalidade'"
            ).executeUpdate();
            
            entityManager.createNativeQuery(
                "UPDATE funcionalidade SET tipo = 'SECAO' WHERE tipo = 'secao'"
            ).executeUpdate();
            
            entityManager.createNativeQuery(
                "UPDATE funcionalidade SET tipo = 'SUBMENU' WHERE tipo = 'submenu'"
            ).executeUpdate();
            
            // Criar tabela perfil se não existir
            try {
                entityManager.createNativeQuery(
                    "CREATE TABLE IF NOT EXISTS perfil (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "nome VARCHAR(100) NOT NULL UNIQUE, " +
                    "descricao VARCHAR(255), " +
                    "codigo VARCHAR(50) NOT NULL UNIQUE, " +
                    "ativo BOOLEAN NOT NULL DEFAULT TRUE, " +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                    "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" +
                    ")"
                ).executeUpdate();
            } catch (Exception e) {
                // Tabela já existe ou erro
            }
            
            // Criar tabela perfil_funcionalidade se não existir
            try {
                entityManager.createNativeQuery(
                    "CREATE TABLE IF NOT EXISTS perfil_funcionalidade (" +
                    "perfil_id BIGINT NOT NULL, " +
                    "funcionalidade_id BIGINT NOT NULL, " +
                    "PRIMARY KEY (perfil_id, funcionalidade_id), " +
                    "FOREIGN KEY (perfil_id) REFERENCES perfil(id) ON DELETE CASCADE, " +
                    "FOREIGN KEY (funcionalidade_id) REFERENCES funcionalidade(id) ON DELETE CASCADE" +
                    ")"
                ).executeUpdate();
            } catch (Exception e) {
                // Tabela já existe ou erro
            }
            
            // Adicionar colunas se não existirem
            try {
                entityManager.createNativeQuery(
                    "ALTER TABLE funcionalidade ADD COLUMN secao VARCHAR(50) DEFAULT 'Sistema'"
                ).executeUpdate();
            } catch (Exception e) {
                // Coluna já existe
            }
            
            try {
                entityManager.createNativeQuery(
                    "ALTER TABLE funcionalidade ADD COLUMN parent_id BIGINT NULL"
                ).executeUpdate();
            } catch (Exception e) {
                // Coluna já existe
            }
            
            try {
                entityManager.createNativeQuery(
                    "ALTER TABLE funcionalidade ADD COLUMN visivel BOOLEAN DEFAULT TRUE"
                ).executeUpdate();
            } catch (Exception e) {
                // Coluna já existe
            }
            
            try {
                entityManager.createNativeQuery(
                    "ALTER TABLE funcionalidade ADD COLUMN cor_icone VARCHAR(7) NULL"
                ).executeUpdate();
            } catch (Exception e) {
                // Coluna já existe
            }
            
            try {
                entityManager.createNativeQuery(
                    "ALTER TABLE funcionalidade ADD COLUMN posicao INT DEFAULT 0"
                ).executeUpdate();
            } catch (Exception e) {
                // Coluna já existe
            }
            
            // Atualizar dados existentes
            entityManager.createNativeQuery(
                "UPDATE funcionalidade SET secao = 'Sistema', visivel = TRUE, posicao = COALESCE(ordem, 0) WHERE secao IS NULL OR secao = ''"
            ).executeUpdate();
            
            // Inserir dados de teste se a tabela estiver vazia
            entityManager.createNativeQuery(
                "INSERT IGNORE INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, ativo, secao, tipo, visivel, cor_icone, posicao, created_at, updated_at) VALUES " +
                "('Dashboard', 'Página inicial do sistema', 'DASHBOARD', 'pi pi-home', '/', 1, TRUE, 'Principal', 'FUNCIONALIDADE', TRUE, '#0ea5e9', 1, NOW(), NOW()), " +
                "('Produtos', 'Gerenciar produtos do sistema', 'PRODUTOS', 'pi pi-box', '/products', 2, TRUE, 'Cadastro', 'FUNCIONALIDADE', TRUE, '#10b981', 1, NOW(), NOW()), " +
                "('Usuários', 'Gerenciar usuários do sistema', 'USUARIOS', 'pi pi-users', '/usuarios', 3, TRUE, 'Cadastro', 'FUNCIONALIDADE', TRUE, '#ef4444', 2, NOW(), NOW()), " +
                "('Funcionalidades', 'Gerenciar funcionalidades do sistema', 'FUNCIONALIDADES', 'pi pi-list', '/funcionalidades', 4, TRUE, 'Controle de Acesso', 'FUNCIONALIDADE', TRUE, '#059669', 1, NOW(), NOW()), " +
                "('Perfis', 'Gerenciar perfis de usuário', 'PERFIS', 'pi pi-id-card', '/perfis', 5, TRUE, 'Controle de Acesso', 'FUNCIONALIDADE', TRUE, '#7c3aed', 2, NOW(), NOW())"
            ).executeUpdate();
            
            // Inserir perfis padrão
            entityManager.createNativeQuery(
                "INSERT IGNORE INTO perfil (nome, descricao, codigo, ativo, created_at, updated_at) VALUES " +
                "('Administrador', 'Acesso total ao sistema com todas as permissões', 'ADMIN', TRUE, NOW(), NOW()), " +
                "('Atendente', 'Acesso para atendimento ao cliente e consultas básicas', 'ATENDENTE', TRUE, NOW(), NOW()), " +
                "('Estoquista', 'Acesso para gerenciamento de estoque e produtos', 'ESTOQUISTA', TRUE, NOW(), NOW()), " +
                "('Visitante', 'Acesso limitado apenas para visualização', 'VISITANTE', TRUE, NOW(), NOW()), " +
                "('Montador', 'Acesso para operações de montagem e produção', 'MONTADOR', TRUE, NOW(), NOW()), " +
                "('Mecânico', 'Acesso para manutenção e reparos técnicos', 'MECANICO', TRUE, NOW(), NOW())"
            ).executeUpdate();
            
            return Response.ok(Map.of(
                    "message", ApiI18nMessages.encode(ApiI18nMessages.DEV_FIX_DATABASE_SUCCESS))).build();
            
        } catch (Exception e) {
            return Response.status(500).entity(Map.of(
                    "message", ApiI18nMessages.withDetail(
                            ApiI18nMessages.DEV_FIX_DATABASE_ERROR, e.getMessage()))).build();
        }
    }
    
    @GET
    @Path("/check")
    public Response checkDatabase() {
        try {
            var result = entityManager.createNativeQuery(
                "SELECT id, nome, codigo, tipo, secao FROM funcionalidade LIMIT 5"
            ).getResultList();
            
            return Response.ok(result).build();
            
        } catch (Exception e) {
            return Response.status(500).entity(Map.of(
                    "message", ApiI18nMessages.withDetail(
                            ApiI18nMessages.DEV_FIX_CHECK_ERROR, e.getMessage()))).build();
        }
    }
    
    @GET
    @Path("/perfis")
    @Transactional
    public Response insertPerfis() {
        try {
            // Verificar se já existem perfis
            var existingPerfis = entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM perfil"
            ).getSingleResult();
            
            if (((Number) existingPerfis).intValue() > 0) {
                return Response.ok(Map.of(
                        "message", ApiI18nMessages.encode(ApiI18nMessages.DEV_FIX_PROFILES_EXIST))).build();
            }
            
            // Inserir perfis padrão
            entityManager.createNativeQuery(
                "INSERT INTO perfil (nome, descricao, codigo, ativo, created_at, updated_at) VALUES " +
                "('Administrador', 'Acesso total ao sistema com todas as permissões', 'ADMIN', TRUE, NOW(), NOW()), " +
                "('Atendente', 'Acesso para atendimento ao cliente e consultas básicas', 'ATENDENTE', TRUE, NOW(), NOW()), " +
                "('Estoquista', 'Acesso para gerenciamento de estoque e produtos', 'ESTOQUISTA', TRUE, NOW(), NOW()), " +
                "('Visitante', 'Acesso limitado apenas para visualização', 'VISITANTE', TRUE, NOW(), NOW()), " +
                "('Montador', 'Acesso para operações de montagem e produção', 'MONTADOR', TRUE, NOW(), NOW()), " +
                "('Mecânico', 'Acesso para manutenção e reparos técnicos', 'MECANICO', TRUE, NOW(), NOW())"
            ).executeUpdate();
            
            return Response.ok(Map.of(
                    "message", ApiI18nMessages.encode(ApiI18nMessages.DEV_FIX_PROFILES_INSERTED))).build();
            
        } catch (Exception e) {
            return Response.status(500).entity(Map.of(
                    "message", ApiI18nMessages.withDetail(
                            ApiI18nMessages.DEV_FIX_INSERT_PROFILES_ERROR, e.getMessage()))).build();
        }
    }
    
    @GET
    @Path("/propostas-colunas")
    @Transactional
    public Response adicionarColunasPropostas() {
        try {
            StringBuilder resultado = new StringBuilder();
            resultado.append("Adicionando colunas faltantes na tabela proposta_comercial...\n\n");
            
            // Lista de colunas a adicionar
            String[][] colunas = {
                {"cliente_bairro", "VARCHAR(150) NULL", "cliente_endereco"},
                {"cliente_observacao", "VARCHAR(5000) NULL", "cliente_contato"},
                {"desconto_tipo", "VARCHAR(20) NULL", "status"},
                {"desconto_percentual", "DECIMAL(5,2) NULL", "desconto_tipo"},
                {"desconto_valor_fixo", "DECIMAL(15,2) NULL", "desconto_percentual"},
                {"desconto_valor_calculado", "DECIMAL(15,2) NULL", "desconto_valor_fixo"},
                {"valor_total_final", "DECIMAL(15,2) NULL", "desconto_valor_calculado"},
                {"frete_brl", "DECIMAL(15,2) NULL", "valor_total_final"},
                {"mao_de_obra_brl", "DECIMAL(15,2) NULL", "frete_brl"},
                {"cotacao_dolar", "DECIMAL(10,4) NULL", "mao_de_obra_brl"},
                {"data_cotacao", "DATETIME NULL", "cotacao_dolar"},
                {"frete_usd", "DECIMAL(15,2) NULL", "data_cotacao"},
                {"mao_de_obra_usd", "DECIMAL(15,2) NULL", "frete_usd"},
                {"subtotal_produtos_usd", "DECIMAL(15,2) NULL", "mao_de_obra_usd"},
                {"total_geral_usd", "DECIMAL(15,2) NULL", "subtotal_produtos_usd"}
            };
            
            int adicionadas = 0;
            int jaExistentes = 0;
            
            for (String[] coluna : colunas) {
                String nomeColuna = coluna[0];
                String definicao = coluna[1];
                String depoisDe = coluna[2];
                
                try {
                    // Verificar se a coluna já existe
                    var existe = entityManager.createNativeQuery(
                        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS " +
                        "WHERE TABLE_SCHEMA = DATABASE() " +
                        "AND TABLE_NAME = 'proposta_comercial' " +
                        "AND COLUMN_NAME = ?1"
                    ).setParameter(1, nomeColuna).getSingleResult();
                    
                    if (((Number) existe).intValue() > 0) {
                        resultado.append("✓ Coluna '").append(nomeColuna).append("' já existe\n");
                        jaExistentes++;
                    } else {
                        // Adicionar coluna
                        String sql = "ALTER TABLE proposta_comercial ADD COLUMN " + nomeColuna + " " + definicao;
                        if (depoisDe != null && !depoisDe.isEmpty()) {
                            sql += " AFTER " + depoisDe;
                        }
                        entityManager.createNativeQuery(sql).executeUpdate();
                        resultado.append("✓ Coluna '").append(nomeColuna).append("' adicionada com sucesso\n");
                        adicionadas++;
                    }
                } catch (Exception e) {
                    resultado.append("✗ Erro ao adicionar coluna '").append(nomeColuna).append("': ").append(e.getMessage()).append("\n");
                }
            }
            
            resultado.append("\n=== RESUMO ===\n");
            resultado.append("Colunas adicionadas: ").append(adicionadas).append("\n");
            resultado.append("Colunas já existentes: ").append(jaExistentes).append("\n");
            resultado.append("Total processadas: ").append(colunas.length).append("\n");
            
            return Response.ok(resultado.toString()).build();
            
        } catch (Exception e) {
            return Response.status(500).entity(Map.of(
                    "message", ApiI18nMessages.withDetail(
                            ApiI18nMessages.DEV_FIX_ADD_COLUMNS_ERROR, e.getMessage()))).build();
        }
    }
}
