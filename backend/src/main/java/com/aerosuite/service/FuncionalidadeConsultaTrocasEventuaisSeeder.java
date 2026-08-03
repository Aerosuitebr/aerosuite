package com.aerosuite.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

/**
 * Insere {@code CONSULTA_TROCAS_EVENTUAIS} e vínculos em {@code perfil_funcionalidade} para perfis com {@code ORDEM_SERVICO}.
 */
@ApplicationScoped
public class FuncionalidadeConsultaTrocasEventuaisSeeder {

    private static final Logger LOG = Logger.getLogger(FuncionalidadeConsultaTrocasEventuaisSeeder.class);

    public static final String CODIGO = "CONSULTA_TROCAS_EVENTUAIS";
    public static final String CODIGO_OS = "ORDEM_SERVICO";

    @Inject
    EntityManager em;

    @Transactional
    public void seed() {
        int inserted = em.createNativeQuery(
                """
                INSERT INTO funcionalidade (
                    nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, cor_icone, posicao, ativo, created_at, updated_at
                )
                SELECT
                    'Consulta Troca Eventual',
                    'Listar OS com Solicitação de Troca Eventual; detalhe e status somente leitura',
                    :cod,
                    'pi pi-search',
                    '/os/consulta-trocas-eventuais',
                    11,
                    'Cadastro',
                    NULL,
                    'funcionalidade',
                    TRUE,
                    '#0284c7',
                    9,
                    TRUE,
                    NOW(),
                    NOW()
                FROM (SELECT 1 AS x) t
                WHERE NOT EXISTS (SELECT 1 FROM funcionalidade f2 WHERE f2.codigo = :cod)
                """
        ).setParameter("cod", CODIGO).executeUpdate();

        if (inserted > 0) {
            LOG.infof("Funcionalidade %s inserida na tabela funcionalidade.", CODIGO);
        }

        Object idObj = em.createNativeQuery("SELECT id FROM funcionalidade WHERE codigo = :cod LIMIT 1")
                .setParameter("cod", CODIGO)
                .getSingleResult();
        if (idObj == null) {
            LOG.warnf("Funcionalidade %s não encontrada após seed.", CODIGO);
            return;
        }
        long funcId = ((Number) idObj).longValue();

        int linked = em.createNativeQuery(
                """
                INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
                SELECT DISTINCT pf.perfil_id, :fid
                FROM perfil_funcionalidade pf
                INNER JOIN funcionalidade f ON f.id = pf.funcionalidade_id AND f.codigo = :codOs
                """
        ).setParameter("fid", funcId).setParameter("codOs", CODIGO_OS).executeUpdate();

        if (linked > 0) {
            LOG.infof("Associada funcionalidade %s a %d vínculos perfil_funcionalidade (perfis com %s).", CODIGO, linked, CODIGO_OS);
        }
    }
}
