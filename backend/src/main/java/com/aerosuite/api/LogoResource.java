package com.aerosuite.api;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.RequiresFuncionalidades;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.io.InputStream;

/**
 * Resource para servir a logo da empresa
 * Resolve problemas de caminho relativo na impressão
 */
@Path("/api/logo")
@RequiresFuncionalidades(onlyAuthenticated = true)
public class LogoResource {

    /**
     * Retorna a logo da empresa (versão otimizada para email, ~12KB)
     * Se não houver logo, retorna uma imagem placeholder ou SVG inline
     */
    @GET
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "image/png", "image/jpeg", "image/svg+xml"})
    public Response getLogo() {
        try {
            InputStream logoStream = getClass().getClassLoader()
                .getResourceAsStream("META-INF/resources/logo_redondo.png");
            String mediaType = "image/png";
            String filename = "logo_redondo.png";
            if (logoStream == null) {
                logoStream = getClass().getClassLoader()
                    .getResourceAsStream("META-INF/resources/logo_redondo.jpg");
                if (logoStream != null) {
                    mediaType = "image/jpeg";
                    filename = "logo_redondo.jpg";
                }
            }
            if (logoStream == null) {
                logoStream = getClass().getClassLoader()
                    .getResourceAsStream("META-INF/resources/logo-email.png");
                filename = "logo-email.png";
            }
            if (logoStream == null) {
                logoStream = getClass().getClassLoader()
                    .getResourceAsStream("META-INF/resources/logo.png");
                filename = "logo.png";
            }
            
            if (logoStream != null) {
                return Response.ok(logoStream)
                    .type(mediaType)
                    .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                    .build();
            }
            
            // Se não encontrar, retornar SVG inline da logo
            String svgLogo = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                "<svg width=\"100\" height=\"100\" xmlns=\"http://www.w3.org/2000/svg\">" +
                "<rect width=\"100\" height=\"100\" rx=\"12\" fill=\"#0ea5e9\"/>" +
                "<text x=\"50\" y=\"65\" font-family=\"Arial, sans-serif\" font-size=\"48\" " +
                "font-weight=\"bold\" fill=\"white\" text-anchor=\"middle\">B</text>" +
                "</svg>";
            
            return Response.ok(svgLogo)
                .type("image/svg+xml")
                .header("Content-Disposition", "inline; filename=\"logo.svg\"")
                .build();
                
        } catch (Exception e) {
            // Retornar SVG simples em caso de erro
            String svgLogo = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                "<svg width=\"100\" height=\"100\" xmlns=\"http://www.w3.org/2000/svg\">" +
                "<rect width=\"100\" height=\"100\" rx=\"12\" fill=\"#0ea5e9\"/>" +
                "<text x=\"50\" y=\"65\" font-family=\"Arial, sans-serif\" font-size=\"48\" " +
                "font-weight=\"bold\" fill=\"white\" text-anchor=\"middle\">B</text>" +
                "</svg>";
            
            return Response.ok(svgLogo)
                .type("image/svg+xml")
                .build();
        }
    }
    
    /**
     * Retorna a logo como base64 para uso inline em HTML (versão otimizada ~12KB)
     */
    @GET
    @Path("/base64")
    @Produces(MediaType.TEXT_PLAIN)
    public Response getLogoBase64() {
        try {
            InputStream logoStream = getClass().getClassLoader()
                .getResourceAsStream("META-INF/resources/logo_redondo.png");
            String mime = "image/png";
            if (logoStream == null) {
                logoStream = getClass().getClassLoader()
                    .getResourceAsStream("META-INF/resources/logo_redondo.jpg");
                if (logoStream != null) mime = "image/jpeg";
            }
            if (logoStream == null) {
                logoStream = getClass().getClassLoader()
                    .getResourceAsStream("META-INF/resources/logo-email.png");
            }
            if (logoStream == null) {
                logoStream = getClass().getClassLoader()
                    .getResourceAsStream("META-INF/resources/logo.png");
            }
            
            if (logoStream != null) {
                byte[] logoBytes = logoStream.readAllBytes();
                logoStream.close();
                String base64 = java.util.Base64.getEncoder().encodeToString(logoBytes);
                return Response.ok("data:" + mime + ";base64," + base64).build();
            }
            
            // Se não encontrar, retornar SVG base64
            String svgLogo = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                "<svg width=\"100\" height=\"100\" xmlns=\"http://www.w3.org/2000/svg\">" +
                "<rect width=\"100\" height=\"100\" rx=\"12\" fill=\"#0ea5e9\"/>" +
                "<text x=\"50\" y=\"65\" font-family=\"Arial, sans-serif\" font-size=\"48\" " +
                "font-weight=\"bold\" fill=\"white\" text-anchor=\"middle\">B</text>" +
                "</svg>";
            
            String base64 = java.util.Base64.getEncoder().encodeToString(svgLogo.getBytes("UTF-8"));
            return Response.ok("data:image/svg+xml;base64," + base64).build();
            
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(ApiI18nMessages.withDetail(ApiI18nMessages.LOGO_LOAD_FAILED, e.getMessage()))
                .build();
        }
    }
}
