package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Serviço simples para verificar atualizações via HTTP
 * Lê um arquivo version.txt de qualquer URL HTTP/HTTPS
 * Ideal para arquivos grandes que não cabem no GitHub (limite 100MB)
 */
@ApplicationScoped
public class HttpUpdateService {
    
    private static final Logger LOGGER = Logger.getLogger(HttpUpdateService.class);

    @Inject
    CommercialBrandingService commercialBrandingService;
    
    @Inject
    @ConfigProperty(name = "http.update.enabled", defaultValue = "false")
    boolean httpUpdateEnabled;
    
    @Inject
    @ConfigProperty(name = "http.update.version.url", defaultValue = "")
    Optional<String> versionUrl;
    
    @Inject
    @ConfigProperty(name = "http.update.download.base.url", defaultValue = "")
    Optional<String> downloadBaseUrl;
    
    /**
     * Verifica a versão disponível lendo um arquivo version.txt de uma URL HTTP
     * @return Versão mais recente encontrada ou null se não houver atualizações
     */
    public String verificarAtualizacaoDisponivel() {
        
        if (!httpUpdateEnabled) {
            LOGGER.info("HTTP Update está desabilitado nas configurações");
            return null;
        }
        
        String urlString = versionUrl.orElse("");
        if (urlString == null || urlString.isEmpty()) {
            LOGGER.warn("URL de verificação de versão não configurada");
            return null;
        }
        
        
        try {
            LOGGER.info("Verificando atualização em: " + urlString);
            
            URL url = URI.create(urlString).toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10000); // 10 segundos
            conn.setReadTimeout(10000);
            
            // Adicionar User-Agent para evitar bloqueios
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            conn.setRequestProperty("Accept", "text/plain, text/*, */*");
            
            int responseCode = conn.getResponseCode();
            
            // Verificar Content-Type para detectar se é HTML (página de login)
            String contentType = conn.getContentType();
            
            if (responseCode != 200) {
                // Tentar ler mensagem de erro
                try (BufferedReader errorReader = new BufferedReader(
                        new InputStreamReader(conn.getErrorStream(), "UTF-8"))) {
                    String errorLine;
                    StringBuilder errorContent = new StringBuilder();
                    while ((errorLine = errorReader.readLine()) != null && errorContent.length() < 500) {
                        errorContent.append(errorLine).append("\n");
                    }
                    if (errorContent.length() > 0) {
                    }
                } catch (Exception e) {
                }
                LOGGER.error("Erro ao acessar URL de versão. Código HTTP: " + responseCode);
                return null;
            }
            
            // Verificar se a resposta é HTML (página de login do Google)
            if (contentType != null && contentType.contains("text/html")) {
                LOGGER.error("Resposta HTML recebida em vez de texto plano. Arquivo pode não estar público.");
                return null;
            }
            
            
            // Ler conteúdo do arquivo
            StringBuilder content = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), "UTF-8"))) {
                String line;
                int lineCount = 0;
                while ((line = reader.readLine()) != null && lineCount < 10) {
                    content.append(line).append("\n");
                    lineCount++;
                }
            }
            
            String version = content.toString().trim();
            
            // Verificar se o conteúdo parece ser HTML (página de login)
            if (version.contains("<html") || version.contains("<!DOCTYPE") || version.contains("Sign in")) {
                LOGGER.error("Conteúdo HTML recebido em vez de versão. Arquivo não está público.");
                return null;
            }
            
            // Validar formato da versão (ex: 1.0.0, 2.1.3, etc.)
            if (version.matches("^\\d+\\.\\d+(\\.\\d+)?(-.*)?$")) {
                LOGGER.info("Versão encontrada: " + version);
                return version;
            } else {
                LOGGER.warn("Formato de versão inválido: " + version);
                return null;
            }
            
        } catch (Exception e) {
            LOGGER.error("Erro ao verificar atualização via HTTP: " + e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Baixa um arquivo de atualização de uma URL HTTP
     * @param fileName Nome do arquivo ou versão (ex: "aerosuite-1.0.1.jar" ou "1.0.1")
     * @param destinationPath Caminho local onde salvar o arquivo
     * @return true se o download foi bem-sucedido
     */
    public boolean baixarArquivo(String fileName, String destinationPath) {
        if (!httpUpdateEnabled) {
            LOGGER.error("HTTP Update está desabilitado");
            return false;
        }
        
        try {
            String downloadUrl;
            
            // Se downloadBaseUrl estiver configurado
            String baseUrl = downloadBaseUrl.orElse("");
            if (baseUrl != null && !baseUrl.isEmpty()) {
                // Se a URL já contém um ID completo (Google Drive), usar diretamente
                // Isso significa que está apontando para um arquivo específico, não uma pasta
                if (baseUrl.contains("id=") && !baseUrl.contains("id=&")) {
                    // URL já tem ID de arquivo específico, usar diretamente
                    // Extrair o ID para validação
                    String fileId = baseUrl.substring(baseUrl.indexOf("id=") + 3);
                    if (fileId.contains("&")) {
                        fileId = fileId.substring(0, fileId.indexOf("&"));
                    }
                    LOGGER.info("Usando URL direta do Google Drive (File ID: " + fileId + "): " + baseUrl);
                    downloadUrl = baseUrl;
                } else {
                    // Caso contrário, construir URL concatenando o nome do arquivo
                    // Garantir que não há barra dupla
                    String base = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
                    downloadUrl = base + fileName;
                    LOGGER.info("Construindo URL: " + baseUrl + " + " + fileName + " = " + downloadUrl);
                }
            } else {
                // Tentar construir URL baseada na versionUrl
                String versionUrlStr = versionUrl.orElse("");
                if (versionUrlStr != null && !versionUrlStr.isEmpty() && versionUrlStr.contains("/")) {
                    String base = versionUrlStr.substring(0, versionUrlStr.lastIndexOf("/") + 1);
                    downloadUrl = base + fileName;
                    LOGGER.info("Construindo URL baseada em versionUrl: " + downloadUrl);
                } else {
                    LOGGER.error("URL de download não configurada. downloadBaseUrl e versionUrl estão vazios.");
                    throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.UPDATE_DOWNLOAD_URL_NOT_CONFIGURED));
                }
            }
            
            LOGGER.info("=== INICIANDO DOWNLOAD ===");
            LOGGER.info("URL de download: " + downloadUrl);
            LOGGER.info("Destino: " + destinationPath);
            
            URL url = URI.create(downloadUrl).toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(30000); // 30 segundos para conectar
            conn.setReadTimeout(300000); // 5 minutos para ler (arquivos grandes)
            
            // Adicionar User-Agent
            conn.setRequestProperty("User-Agent", commercialBrandingService.productTokenForHttp() + "-Update-Downloader/1.0");
            
            int responseCode = conn.getResponseCode();
            LOGGER.info("Código HTTP recebido: " + responseCode);
            
            // Verificar Content-Type para detectar HTML (página de aviso do Google Drive)
            String contentType = conn.getContentType();
            LOGGER.info("Content-Type recebido: " + contentType);
            
            if (responseCode != 200) {
                String errorMessage = "Erro ao baixar arquivo. Código HTTP: " + responseCode;
                // Tentar ler mensagem de erro
                try (BufferedReader errorReader = new BufferedReader(
                        new InputStreamReader(conn.getErrorStream() != null ? conn.getErrorStream() : conn.getInputStream(), "UTF-8"))) {
                    String errorLine;
                    StringBuilder errorContent = new StringBuilder();
                    while ((errorLine = errorReader.readLine()) != null && errorContent.length() < 500) {
                        errorContent.append(errorLine).append("\n");
                    }
                    if (errorContent.length() > 0) {
                        errorMessage += "\nResposta do servidor: " + errorContent.toString();
                    }
                } catch (Exception e) {
                    // Ignorar erro ao ler resposta
                }
                LOGGER.error(errorMessage);
                return false;
            }
            
            // Coletar cookies da primeira requisição (importante para Google Drive)
            String cookies = conn.getHeaderField("Set-Cookie");
            if (cookies == null) {
                // Tentar pegar cookies de outros headers
                Map<String, List<String>> headerFields = conn.getHeaderFields();
                for (Map.Entry<String, List<String>> entry : headerFields.entrySet()) {
                    if ("Set-Cookie".equalsIgnoreCase(entry.getKey())) {
                        cookies = String.join("; ", entry.getValue());
                        break;
                    }
                }
            }
            
            // Verificar se a resposta é HTML (página de aviso do Google Drive para arquivos grandes)
            boolean isHtmlResponse = contentType != null && contentType.contains("text/html");
            if (isHtmlResponse) {
                LOGGER.warn("Resposta HTML detectada. Tentando extrair link de download real.");
                
                // Ler o HTML para extrair o link de download real
                StringBuilder htmlContent = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), "UTF-8"))) {
                    String line;
                    while ((line = reader.readLine()) != null && htmlContent.length() < 100000) {
                        htmlContent.append(line).append("\n");
                    }
                }
                
                String html = htmlContent.toString();
                
                // Log das primeiras linhas do HTML para debug
                String htmlPreview = html.length() > 1000 ? html.substring(0, 1000) + "..." : html;
                LOGGER.debug("HTML recebido (primeiras 1000 chars): " + htmlPreview);
                
                // Tentar extrair o link de download real da página HTML
                // O Google Drive geralmente usa um formulário com action ou um link com confirm
                String realDownloadUrl = null;
                
                // Extrair o ID do arquivo da URL original
                String fileId = null;
                if (downloadUrl.contains("id=")) {
                    int idStart = downloadUrl.indexOf("id=") + 3;
                    int idEnd = downloadUrl.indexOf("&", idStart);
                    if (idEnd == -1) idEnd = downloadUrl.length();
                    fileId = downloadUrl.substring(idStart, idEnd);
                }
                
                // Método 1: Procurar por href com "uc?export=download" ou "uc?id="
                int hrefIndex = html.indexOf("href=\"");
                while (hrefIndex != -1 && realDownloadUrl == null) {
                    int start = hrefIndex + 6;
                    int end = html.indexOf("\"", start);
                    if (end != -1) {
                        String hrefUrl = html.substring(start, end);
                        if (hrefUrl.contains("uc?export=download") || hrefUrl.contains("uc?id=") || hrefUrl.contains("/download?id=")) {
                            // Construir URL completa se for relativa
                            if (hrefUrl.startsWith("/")) {
                                realDownloadUrl = "https://drive.usercontent.google.com" + hrefUrl;
                            } else if (hrefUrl.startsWith("http")) {
                                realDownloadUrl = hrefUrl;
                            } else if (hrefUrl.startsWith("uc?")) {
                                realDownloadUrl = "https://drive.usercontent.google.com/" + hrefUrl;
                            }
                            if (realDownloadUrl != null) {
                                break;
                            }
                        }
                    }
                    hrefIndex = html.indexOf("href=\"", hrefIndex + 1);
                }
                
                // Método 2: Procurar por action="..." que contém o link de download
                // Se encontrar um formulário, tentar fazer POST
                if (realDownloadUrl == null) {
                    int actionIndex = html.indexOf("action=\"");
                    if (actionIndex != -1) {
                        int start = actionIndex + 8;
                        int end = html.indexOf("\"", start);
                        if (end != -1) {
                            String actionUrl = html.substring(start, end);
                            if (actionUrl.contains("uc?export=download") || actionUrl.contains("uc?id=") || actionUrl.contains("/download?id=")) {
                                // Construir URL completa se for relativa
                                if (actionUrl.startsWith("/")) {
                                    realDownloadUrl = "https://drive.usercontent.google.com" + actionUrl;
                                } else if (actionUrl.startsWith("http")) {
                                    realDownloadUrl = actionUrl;
                                } else if (actionUrl.startsWith("uc?")) {
                                    realDownloadUrl = "https://drive.usercontent.google.com/" + actionUrl;
                                }
                                if (realDownloadUrl != null) {
                                    
                                    // Tentar extrair token confirm do formulário
                                    String confirmToken = null;
                                    int formStart = html.lastIndexOf("<form", actionIndex);
                                    if (formStart != -1) {
                                        int formEnd = html.indexOf("</form>", formStart);
                                        if (formEnd != -1) {
                                            String formContent = html.substring(formStart, formEnd);
                                            // Procurar por input hidden com name="confirm" ou name='confirm'
                                            int confirmInputIndex = formContent.indexOf("name=\"confirm\"");
                                            if (confirmInputIndex == -1) {
                                                confirmInputIndex = formContent.indexOf("name='confirm'");
                                            }
                                            if (confirmInputIndex != -1) {
                                                // Procurar value="..." após name
                                                int valueIndex = formContent.indexOf("value=\"", confirmInputIndex);
                                                if (valueIndex == -1) {
                                                    valueIndex = formContent.indexOf("value='", confirmInputIndex);
                                                }
                                                if (valueIndex != -1) {
                                                    int valueStart = valueIndex + 7;
                                                    int valueEnd = formContent.indexOf("\"", valueStart);
                                                    if (valueEnd == -1) {
                                                        valueEnd = formContent.indexOf("'", valueStart);
                                                    }
                                                    if (valueEnd != -1 && valueEnd > valueStart) {
                                                        confirmToken = formContent.substring(valueStart, valueEnd);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    
                                    // Adicionar confirm à URL
                                    if (!realDownloadUrl.contains("confirm=")) {
                                        String confirmValue = confirmToken != null ? confirmToken : "t";
                                        if (realDownloadUrl.contains("&")) {
                                            realDownloadUrl += "&confirm=" + confirmValue;
                                        } else {
                                            realDownloadUrl += "?confirm=" + confirmValue;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Método 3: Procurar por confirm= no HTML e construir URL manualmente
                if (realDownloadUrl == null && fileId != null) {
                    // Procurar por confirm= no HTML
                    int confirmIndex = html.indexOf("confirm=");
                    if (confirmIndex != -1) {
                        int start = confirmIndex + 8;
                        int end = start;
                        // Encontrar fim do token (pode terminar em &, ", espaço, ou nova linha)
                        while (end < html.length() && end < start + 50) {
                            char c = html.charAt(end);
                            if (c == '&' || c == '"' || c == ' ' || c == '\n' || c == '\r' || c == '<') {
                                break;
                            }
                            end++;
                        }
                        if (end > start) {
                            String confirmToken = html.substring(start, end);
                            // Construir URL com confirm token
                            realDownloadUrl = "https://drive.usercontent.google.com/uc?export=download&id=" + fileId + "&confirm=" + confirmToken;
                        }
                    }
                }
                
                // Método 4: Procurar por window.location ou redirect no JavaScript
                if (realDownloadUrl == null) {
                    // Procurar por window.location ou location.href no HTML
                    int locationIndex = html.indexOf("window.location");
                    if (locationIndex == -1) {
                        locationIndex = html.indexOf("location.href");
                    }
                    if (locationIndex != -1) {
                        // Procurar por URL após window.location ou location.href
                        int urlStart = html.indexOf("=", locationIndex) + 1;
                        if (urlStart > locationIndex) {
                            // Pular espaços e aspas
                            while (urlStart < html.length() && (html.charAt(urlStart) == ' ' || html.charAt(urlStart) == '"' || html.charAt(urlStart) == '\'')) {
                                urlStart++;
                            }
                            int urlEnd = urlStart;
                            while (urlEnd < html.length() && urlEnd < urlStart + 500) {
                                char c = html.charAt(urlEnd);
                                if (c == '"' || c == '\'' || c == ';' || c == ' ' || c == '\n' || c == '\r') {
                                    break;
                                }
                                urlEnd++;
                            }
                            if (urlEnd > urlStart) {
                                String jsUrl = html.substring(urlStart, urlEnd);
                                if (jsUrl.contains("uc?") || jsUrl.contains("download")) {
                                    if (jsUrl.startsWith("http")) {
                                        realDownloadUrl = jsUrl;
                                    } else if (jsUrl.startsWith("/")) {
                                        realDownloadUrl = "https://drive.usercontent.google.com" + jsUrl;
                                    } else {
                                        realDownloadUrl = "https://drive.usercontent.google.com/" + jsUrl;
                                    }
                                    if (realDownloadUrl != null) {
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Método 5: Tentar usar a URL original com confirm=t (truque comum do Google Drive)
                if (realDownloadUrl == null && fileId != null) {
                    // O Google Drive aceita confirm=t para arquivos grandes
                    realDownloadUrl = "https://drive.usercontent.google.com/uc?export=download&id=" + fileId + "&confirm=t";
                }
                
                // Método 6: Tentar URL direta com authuser=0
                if (realDownloadUrl == null && fileId != null) {
                    realDownloadUrl = "https://drive.usercontent.google.com/download?id=" + fileId + "&export=download&authuser=0&confirm=t";
                }
                
                if (realDownloadUrl != null) {
                    LOGGER.info("Link de download real extraído: " + realDownloadUrl);
                    
                    // Fazer nova requisição com o link real
                    conn.disconnect();
                    url = URI.create(realDownloadUrl).toURL();
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(30000);
                    conn.setReadTimeout(300000);
                    conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                    conn.setRequestProperty("Accept", "*/*");
                    conn.setRequestProperty("Accept-Language", "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7");
                    conn.setRequestProperty("Referer", "https://drive.google.com/");
                    
                    // Adicionar cookies se disponíveis
                    if (cookies != null && !cookies.isEmpty()) {
                        conn.setRequestProperty("Cookie", cookies);
                    }
                    
                    // Seguir redirects automaticamente
                    conn.setInstanceFollowRedirects(true);
                    
                    responseCode = conn.getResponseCode();
                    contentType = conn.getContentType();
                    LOGGER.info("Nova requisição - Código HTTP: " + responseCode + ", Content-Type: " + contentType);
                    
                    // Se receber redirect (301, 302, 303, 307, 308), seguir manualmente
                    if (responseCode >= 300 && responseCode < 400) {
                        String redirectUrl = conn.getHeaderField("Location");
                        if (redirectUrl != null) {
                            LOGGER.info("Redirect detectado: " + redirectUrl);
                            conn.disconnect();
                            url = URI.create(redirectUrl).toURL();
                            conn = (HttpURLConnection) url.openConnection();
                            conn.setRequestMethod("GET");
                            conn.setConnectTimeout(30000);
                            conn.setReadTimeout(300000);
                            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
                            conn.setInstanceFollowRedirects(true);
                            responseCode = conn.getResponseCode();
                            contentType = conn.getContentType();
                        }
                    }
                    
                    if (responseCode != 200) {
                        LOGGER.error("Erro ao acessar link de download real. Código HTTP: " + responseCode);
                        return false;
                    }
                    
                    // Verificar novamente se ainda é HTML
                    if (contentType != null && contentType.contains("text/html")) {
                        
                        // Tentar método alternativo: URL direta com vários parâmetros
                        if (fileId != null) {
                            String[] alternativeUrls = {
                                "https://drive.usercontent.google.com/uc?export=download&id=" + fileId + "&confirm=t&authuser=0",
                                "https://drive.usercontent.google.com/download?id=" + fileId + "&export=download&confirm=t",
                                "https://drive.google.com/uc?export=download&id=" + fileId + "&confirm=t"
                            };
                            
                            for (String altUrl : alternativeUrls) {
                                try {
                                    conn.disconnect();
                                    url = URI.create(altUrl).toURL();
                                    conn = (HttpURLConnection) url.openConnection();
                                    conn.setRequestMethod("GET");
                                    conn.setConnectTimeout(30000);
                                    conn.setReadTimeout(300000);
                                    conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
                                    conn.setRequestProperty("Accept", "*/*");
                                    conn.setRequestProperty("Referer", "https://drive.google.com/");
                                    if (cookies != null && !cookies.isEmpty()) {
                                        conn.setRequestProperty("Cookie", cookies);
                                    }
                                    conn.setInstanceFollowRedirects(true);
                                    
                                    responseCode = conn.getResponseCode();
                                    contentType = conn.getContentType();
                                    
                                    if (responseCode == 200 && contentType != null && !contentType.contains("text/html")) {
                                        break; // Sair do loop, encontramos uma URL que funciona
                                    }
                                    
                                    // Se receber redirect, seguir
                                    if (responseCode >= 300 && responseCode < 400) {
                                        String redirectUrl = conn.getHeaderField("Location");
                                        if (redirectUrl != null) {
                                            conn.disconnect();
                                            url = URI.create(redirectUrl).toURL();
                                            conn = (HttpURLConnection) url.openConnection();
                                            conn.setRequestMethod("GET");
                                            conn.setConnectTimeout(30000);
                                            conn.setReadTimeout(300000);
                                            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
                                            conn.setInstanceFollowRedirects(true);
                                            responseCode = conn.getResponseCode();
                                            contentType = conn.getContentType();
                                            if (responseCode == 200 && contentType != null && !contentType.contains("text/html")) {
                                                break;
                                            }
                                        }
                                    }
                                } catch (Exception e) {
                                    continue; // Tentar próxima URL
                                }
                            }
                            
                            // Verificar novamente após tentar URLs alternativas
                            if (contentType != null && contentType.contains("text/html")) {
                                LOGGER.error("Ainda recebendo HTML após tentar todas as URLs alternativas. Arquivo pode estar protegido.");
                                return false;
                            }
                        } else {
                            LOGGER.error("Ainda recebendo HTML após tentar link real. File ID não disponível.");
                            return false;
                        }
                    }
                } else {
                    LOGGER.error("Não foi possível extrair link de download real da página HTML. File ID: " + fileId);
                    return false;
                }
            }
            
            // Criar diretório de destino se não existir
            Path destPath = Paths.get(destinationPath);
            Path parentDir = destPath.getParent();
            if (parentDir != null) {
                LOGGER.info("Criando diretório de destino: " + parentDir.toAbsolutePath());
                Files.createDirectories(parentDir);
            }
            
            LOGGER.info("Iniciando download para: " + destPath.toAbsolutePath());
            
            // Baixar arquivo
            try (InputStream in = conn.getInputStream();
                 FileOutputStream out = new FileOutputStream(destPath.toFile())) {
                
                byte[] buffer = new byte[8192];
                long totalBytes = 0;
                int bytesRead;
                long lastLogTime = System.currentTimeMillis();
                
                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                    totalBytes += bytesRead;
                    
                    // Log de progresso a cada 5 segundos
                    long currentTime = System.currentTimeMillis();
                    if (currentTime - lastLogTime > 5000) {
                        LOGGER.info("Download em progresso: " + (totalBytes / 1024 / 1024) + " MB");
                        lastLogTime = currentTime;
                    }
                }
                
                LOGGER.info("Arquivo baixado com sucesso. Tamanho: " + totalBytes + " bytes (" + (totalBytes / 1024 / 1024) + " MB)");
                
                // Verificar se o arquivo foi realmente criado e tem tamanho > 0
                if (!Files.exists(destPath)) {
                    LOGGER.error("Arquivo não foi criado após download: " + destPath);
                    return false;
                }
                
                long fileSize = Files.size(destPath);
                if (fileSize == 0) {
                    LOGGER.error("Arquivo baixado está vazio: " + destPath);
                    Files.delete(destPath); // Remover arquivo vazio
                    return false;
                }
                
                LOGGER.info("Arquivo verificado e válido: " + fileSize + " bytes");
            }
            
            return true;
            
        } catch (Exception e) {
            LOGGER.error("Erro ao baixar arquivo via HTTP: " + e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Verifica se o serviço está habilitado e configurado
     */
    public boolean isEnabled() {
        return httpUpdateEnabled && versionUrl.isPresent() && !versionUrl.get().isEmpty();
    }
    
    /**
     * Obtém a URL de download para uma versão específica
     * @param version Versão (ex: "1.0.1")
     * @return URL completa para download
     */
    public String getDownloadUrl(String version) {
        String baseUrl = downloadBaseUrl.orElse("");
        if (baseUrl != null && !baseUrl.isEmpty()) {
            // Se a base URL já contém um ID completo (Google Drive), usar diretamente
            // Isso significa que está apontando para um arquivo específico
            // Exemplo: https://drive.google.com/uc?export=download&id=1ABC123
            if (baseUrl.contains("id=") && !baseUrl.contains("id=&")) {
                // URL já tem ID de arquivo específico, retornar como está
                return baseUrl;
            }
            
            // Caso contrário, tentar construir URL com nome do arquivo
            // Tentar diferentes padrões de nome (prioridade: fullstack > backend > simples)
            String[] patterns = {
                "aerosuite-fullstack-" + version + ".zip",
                "aerosuite-backend-" + version + ".zip",
                "aerosuite-backend-" + version + ".jar",
                "aerosuite-" + version + ".zip",
                "aerosuite-" + version + ".jar"
            };
            
            String base = baseUrl.endsWith("/") ? baseUrl : baseUrl;
            
            // Se base URL termina com "id=", significa que precisa do ID completo
            // Nesse caso, retornar null e deixar o sistema tentar baixar pelos padrões
            if (base.endsWith("id=") || base.endsWith("id=&")) {
                // Retornar null para indicar que precisa tentar múltiplos padrões
                return null;
            }
            
            // Tentar primeiro padrão (fullstack tem prioridade)
            String url = base + patterns[0];
            return url;
        }
        return null;
    }
}

