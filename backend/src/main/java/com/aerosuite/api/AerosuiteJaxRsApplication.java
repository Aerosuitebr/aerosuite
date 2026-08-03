package com.aerosuite.api;

import io.smallrye.common.annotation.Blocking;
import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;

/**
 * Por omissão o Quarkus REST executa em event loop; com Hibernate ORM os endpoints
 * devem correr em worker thread ({@link Blocking}).
 */
@ApplicationPath("/")
@Blocking
public class AerosuiteJaxRsApplication extends Application {
}
