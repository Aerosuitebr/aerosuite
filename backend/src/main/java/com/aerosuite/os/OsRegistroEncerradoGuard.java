package com.aerosuite.os;

import com.aerosuite.domain.OS;
import com.aerosuite.i18n.ApiI18nMessages;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.BadRequestException;

import java.util.Locale;
import java.util.Set;

/**
 * Impede alteração indevida de OS fechada ou com CRS emitido (REQ-009 / RBAC registros eletrônicos).
 */
@ApplicationScoped
public class OsRegistroEncerradoGuard {

    public static final String ERROR_REGISTRO_ENCERRADO = ApiI18nMessages.OS_REGISTRO_ENCERRADO;
    public static final String ERROR_REABERTURA_PERFIL = ApiI18nMessages.OS_REABERTURA_PERFIL_NEGADO;
    public static final String ERROR_JUSTIFICATIVA = ApiI18nMessages.OS_REABERTURA_JUSTIFICATIVA_OBRIGATORIA;
    public static final String ERROR_REABERTURA_NAO_NECESSARIA = ApiI18nMessages.OS_REABERTURA_NAO_NECESSARIA;

    private static final int MIN_JUSTIFICATIVA_CHARS = 15;

    private static final Set<String> PERFIS_REABERTURA =
            Set.of(
                    "P145_RT",
                    "P145_INSPETOR",
                    "ADMIN",
                    "ADMINISTRADOR",
                    "QUALIDADE",
                    "GERENTE",
                    "DIRETOR");

    public boolean isRegistroEncerrado(OS os) {
        if (os == null) {
            return false;
        }
        return os.dataFechamento != null || os.crsEmitidoEm != null;
    }

    public void assertMutacaoPermitida(OS os) {
        if (isRegistroEncerrado(os)) {
            throw new BadRequestException(ERROR_REGISTRO_ENCERRADO);
        }
    }

    public void assertPodeReabrir(String perfilCodigo) {
        if (perfilCodigo == null || perfilCodigo.isBlank()) {
            throw new BadRequestException(ERROR_REABERTURA_PERFIL);
        }
        if (!PERFIS_REABERTURA.contains(perfilCodigo.trim().toUpperCase(Locale.ROOT))) {
            throw new BadRequestException(ERROR_REABERTURA_PERFIL);
        }
    }

    public void assertJustificativaValida(String justificativa) {
        if (justificativa == null || justificativa.trim().length() < MIN_JUSTIFICATIVA_CHARS) {
            throw new BadRequestException(ERROR_JUSTIFICATIVA);
        }
    }

    public static boolean perfilPodeReabrir(String perfilCodigo) {
        if (perfilCodigo == null || perfilCodigo.isBlank()) {
            return false;
        }
        return PERFIS_REABERTURA.contains(perfilCodigo.trim().toUpperCase(Locale.ROOT));
    }
}
