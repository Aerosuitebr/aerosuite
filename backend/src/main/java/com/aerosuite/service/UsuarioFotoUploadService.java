package com.aerosuite.service;

import org.jboss.logging.Logger;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.nio.file.Files;
import java.util.Map;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@ApplicationScoped
public class UsuarioFotoUploadService {

    private static final Logger LOG = Logger.getLogger(UsuarioFotoUploadService.class);

    @Inject
    UsuarioService usuarioService;

    @Inject
    UsuarioFotoStorage usuarioFotoStorage;

    @Transactional
    public byte[] loadPhotoBytesForUser(int userId) throws java.io.IOException {
        return usuarioFotoStorage.loadImageForUser(userId);
    }

    @Transactional
    public Response upload(int userId, FileUpload file) {
        try {
            if (file == null || file.uploadedFile() == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of(
                                "error", "Imagem não enviada",
                                "message", "Por favor, selecione uma imagem para upload."))
                        .build();
            }

            String contentType = file.contentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of(
                                "error", "Tipo de arquivo inválido",
                                "message", "Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF)."))
                        .build();
            }

            long fileSize = Files.size(file.uploadedFile());
            long maxSize = 5 * 1024 * 1024;
            if (fileSize > maxSize) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of(
                                "error", "Arquivo muito grande",
                                "message", "O arquivo deve ter no máximo 5MB."))
                        .build();
            }

            String nomeArquivo = usuarioFotoStorage.saveUploadedFile(
                    userId,
                    file.uploadedFile(),
                    file.fileName());

            byte[] dados = Files.readAllBytes(
                    usuarioFotoStorage.rootDirectory().resolve(nomeArquivo));

            String fotoPerfil = usuarioService.atualizarFotoPerfil(
                    userId,
                    usuarioFotoStorage.persistValue(nomeArquivo),
                    dados);
            String fotoUrl = usuarioFotoStorage.publicUrl(nomeArquivo);

            return Response.ok(Map.of(
                            "message", "Foto atualizada com sucesso",
                            "fotoPerfil", fotoPerfil,
                            "fotoUrl", fotoUrl))
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        } catch (jakarta.ws.rs.NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Usuário não encontrado", "message", e.getMessage()))
                    .build();
        } catch (Exception e) {
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of(
                            "error", "Erro ao salvar imagem",
                            "message", e.getMessage() != null ? e.getMessage() : "Erro desconhecido ao processar a imagem."))
                    .build();
        }
    }
}
