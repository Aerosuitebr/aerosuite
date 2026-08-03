package com.aerosuite.repository;

import com.aerosuite.domain.Usuario;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.Map;

@ApplicationScoped
public class UsuarioRepository {
    
    @PersistenceContext
    EntityManager em;
    
    public Usuario findById(Integer id) {
        return Usuario.findById(id);
    }
    
    public Usuario findByEmail(String email) {
        return Usuario.find("email", email).firstResult();
    }

    public Usuario findByEmailAndOrgTenantId(String email, long orgTenantId) {
        return Usuario.find("email = ?1 and orgTenantId = ?2", email, orgTenantId).firstResult();
    }
    
    public PanacheQuery<Usuario> findWithFilters(String query, Sort sort, Map<String, Object> params) {
        return Usuario.find(query, sort, params);
    }
    
    public PanacheQuery<Usuario> findAll(Sort sort) {
        return Usuario.findAll(sort);
    }
    
    public void persist(Usuario usuario) {
        usuario.persist();
    }
    
    public void delete(Usuario usuario) {
        usuario.delete();
    }
    
    public void removePerfilAssociation(Integer usuarioId) {
        Usuario usuario = findById(usuarioId);
        if (usuario != null && usuario.perfil != null) {
            usuario.perfil = null;
            em.merge(usuario);
            em.flush();
        }
    }
    
    public void flush() {
        em.flush();
    }
    
    public EntityManager getEntityManager() {
        return em;
    }
}

