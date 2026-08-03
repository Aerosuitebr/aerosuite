package com.aerosuite.repository;

import com.aerosuite.domain.Fcu;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;

@ApplicationScoped
public class FcuRepository {
    
    @PersistenceContext
    EntityManager em;
    
    public Fcu findById(Long id) {
        return Fcu.findById(id);
    }

    public Fcu findByIdAndTenant(Long id, long tenantId) {
        return Fcu.findById(id);
    }
    
    public PanacheQuery<Fcu> findWithFilters(String query, Sort sort, Map<String, Object> params) {
        return Fcu.find(query, sort, params);
    }
    
    public void persist(Fcu fcu) {
        fcu.persist();
    }
    
    public void deleteById(Long id) {
        Fcu.deleteById(id);
    }
    
    public boolean existsById(Long id) {
        return Fcu.count("id = ?1", id) > 0;
    }

    public boolean existsByIdAndTenant(Long id, long tenantId) {
        return Fcu.count("id = ?1", id) > 0;
    }
    
    /**
     * Remove todas as associações FCU relacionadas a um FCU específico
     */
    public int deleteAssociacoesByFcuId(Long fcuId) {
        return em.createQuery(
            "DELETE FROM AssociacaoFcu a WHERE a.idFcu = :id"
        ).setParameter("id", fcuId).executeUpdate();
    }
    
    /**
     * Remove referências de OS relacionadas a um FCU (define id_fcu como NULL)
     */
    public int updateOsRemoveFcuReference(Long fcuId) {
        return em.createQuery(
            "UPDATE OS o SET o.idFcu = NULL WHERE o.idFcu = :id"
        ).setParameter("id", fcuId.intValue()).executeUpdate();
    }
    
    public void flush() {
        em.flush();
    }
}

