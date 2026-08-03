package com.aerosuite.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Exige sessão elevada do plano de controle ({@code typ=pop} no JWT).
 * Endpoints de infraestrutura não devem depender apenas de {@link RequiresFuncionalidades}.
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresPlatformOps {
}
