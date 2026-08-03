package com.aerosuite.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Exige feature flags do tenant ativas (catálogo {@link com.aerosuite.p1.TenantFeatureCatalog}).
 * Avaliado por {@link TenantFeatureAuthorizationFilter} após autenticação JWT.
 * <p>
 * Com anotação na classe e no método, <strong>ambas</strong> devem ser satisfeitas (intersecção).
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface RequiresTenantFeature {

    /** Todas as flags listadas devem estar habilitadas no tenant da sessão. */
    String[] allOf() default {};

    /** Pelo menos uma das flags listadas deve estar habilitada. */
    String[] anyOf() default {};
}
