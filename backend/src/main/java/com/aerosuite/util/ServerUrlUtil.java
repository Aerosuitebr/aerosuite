package com.aerosuite.util;

import org.jboss.logging.Logger;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.net.URI;
import java.util.Enumeration;
import java.util.Locale;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.Config;

/**
 * Utilitário para obter a URL do frontend/servidor
 * Detecta automaticamente o IP do servidor ou usa configuração manual
 */
@ApplicationScoped
public class ServerUrlUtil {

    private static final Logger LOG = Logger.getLogger(ServerUrlUtil.class);

    /** Fallback quando não há URL pública configurada (QR portal externo, e-mails). */
    private static final String PUBLIC_FRONTEND_FALLBACK = "https://app.aerosuite.app";
    
    @Inject
    Config config;
    
    private String cachedFrontendUrl = null;
    
    /**
     * Obtém a URL do frontend para gerar links
     * Prioridade:
     * 1. Propriedade frontend.url (application.properties ou variável de ambiente)
     * 2. Variável de ambiente FRONTEND_URL
     * 3. Detecção automática do IP do servidor
     * 4. Fallback para localhost (desenvolvimento)
     */
    public String getFrontendUrl() {
        // SEMPRE recalcular - nunca usar cache para garantir URL correta
        String frontendUrl = null;
        
        
        // 1. Tentar propriedade frontend.url (application.properties: frontend.url=${FRONTEND_URL:})
        // Em produção defina FRONTEND_URL com a URL acessível pelo usuário externo (ex: https://sistema.seudominio.com.br)
        try {
            frontendUrl = config.getOptionalValue("frontend.url", String.class)
                .orElse(null);
            if (frontendUrl != null) {
                frontendUrl = frontendUrl.trim();
                if (frontendUrl.isEmpty()) frontendUrl = null;
            }
            
            // Se contém ${, significa que não foi resolvida pelo Quarkus
            if (frontendUrl != null && frontendUrl.startsWith("${")) {
                
                // Tentar extrair o valor padrão de ${VAR:default}
                if (frontendUrl.contains(":")) {
                    int colonIndex = frontendUrl.indexOf(":");
                    int closingBrace = frontendUrl.indexOf("}");
                    if (colonIndex > 0 && closingBrace > colonIndex) {
                        String defaultValue = frontendUrl.substring(colonIndex + 1, closingBrace);
                        if (!defaultValue.isEmpty()) {
                            frontendUrl = defaultValue;
                        }
                    }
                }
            }
            
            if (isUsablePublicFrontendUrl(frontendUrl)) {
                cachedFrontendUrl = normalizeBaseUrl(frontendUrl);
                return cachedFrontendUrl;
            }
            if (frontendUrl != null && !frontendUrl.isEmpty()) {
                frontendUrl = null;
            }
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao ler propriedade frontend.url: %s", e.getMessage());
        }
        
        // 2. Tentar variável de ambiente FRONTEND_URL (apenas se não encontrou na propriedade)
        // IMPORTANTE: Ignorar se contém localhost - isso causa problemas em rede
        String envFrontendUrl = System.getenv("FRONTEND_URL");
        
        // Só usar variável de ambiente se:
        // - Não encontrou na propriedade E
        // - Não contém localhost/127.0.0.1
        if (frontendUrl == null && envFrontendUrl != null && !envFrontendUrl.isEmpty()) {
            if (isUsablePublicFrontendUrl(envFrontendUrl)) {
                frontendUrl = normalizeBaseUrl(envFrontendUrl);
                cachedFrontendUrl = frontendUrl;
                return frontendUrl;
            }
        }
        
        // 3. Tentar detectar automaticamente o IP do servidor
        String serverIp = detectServerIp();
        
        if (serverIp != null && !isPrivateIpv4(serverIp)) {
            String frontendPort = config.getOptionalValue("frontend.port", String.class)
                .orElse("8081");
            String detected = "http://" + serverIp + ":" + frontendPort;
            if (isUsablePublicFrontendUrl(detected)) {
                frontendUrl = detected;
                cachedFrontendUrl = frontendUrl;
                return frontendUrl;
            }
        } else if (serverIp != null) {
        }

        // 4. URL pública padrão (QR portal externo, e-mails) — nunca IP Docker/LAN
        frontendUrl = PUBLIC_FRONTEND_FALLBACK;
        cachedFrontendUrl = normalizeBaseUrl(frontendUrl);
        return cachedFrontendUrl;
    }

    /** URL adequada para QR do portal externo e links em e-mail (nunca localhost nem IP privado). */
    public String getPublicFrontendUrl() {
        return getFrontendUrl();
    }

    /**
     * Base URL para QR de etiquetas de estoque — legível no celular na mesma rede (LAN) ou na internet.
     * <ul>
     *   <li>Produção ({@code https://app...}): usa {@code frontend.url} configurada.</li>
     *   <li>Dev ({@code localhost} / {@code 127.0.0.1}): substitui pelo IPv4 da LAN (ex. {@code 192.168.x.x:8081}).</li>
     *   <li>Já configurado com IP/host acessível na LAN: mantém.</li>
     * </ul>
     */
    public String getFrontendUrlForQrLabels() {
        String configured = readConfiguredFrontendUrlRaw();
        if (configured != null && !configured.isBlank()) {
            configured = normalizeBaseUrl(configured);
            if (isUsablePublicFrontendUrl(configured)) {
                return configured;
            }
            if (isLoopbackFrontendUrl(configured)) {
                String lan = detectLanIpv4();
                if (lan != null) {
                    int port = extractPortFromUrl(configured, defaultFrontendPort());
                    return "http://" + lan + ":" + port;
                }
            }
            if (configured.startsWith("http://") || configured.startsWith("https://")) {
                return configured;
            }
        }
        return getPublicFrontendUrl();
    }

    private String readConfiguredFrontendUrlRaw() {
        try {
            String url = config.getOptionalValue("frontend.url", String.class).orElse(null);
            if (url != null) {
                url = url.trim();
                if (url.startsWith("${") && url.contains(":")) {
                    int colon = url.indexOf(':');
                    int end = url.indexOf('}');
                    if (colon > 0 && end > colon) {
                        String def = url.substring(colon + 1, end).trim();
                        if (!def.isEmpty()) {
                            url = def;
                        }
                    }
                }
                if (!url.isEmpty()) {
                    return url;
                }
            }
        } catch (Exception ignored) {
            // ignore
        }
        String env = System.getenv("FRONTEND_URL");
        return env != null && !env.isBlank() ? env.trim() : null;
    }

    private int defaultFrontendPort() {
        return config.getOptionalValue("frontend.port", Integer.class).orElse(8081);
    }

    public static boolean isLoopbackFrontendUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        try {
            URI uri = URI.create(url.trim());
            String host = uri.getHost();
            if (host == null) {
                return url.contains("localhost") || url.contains("127.0.0.1");
            }
            String h = host.toLowerCase(Locale.ROOT);
            return h.equals("localhost") || h.equals("127.0.0.1") || h.equals("0.0.0.0");
        } catch (Exception e) {
            return url.contains("localhost") || url.contains("127.0.0.1");
        }
    }

    static int extractPortFromUrl(String url, int defaultPort) {
        try {
            URI uri = URI.create(url.trim());
            if (uri.getPort() > 0) {
                return uri.getPort();
            }
            String scheme = uri.getScheme();
            if ("https".equalsIgnoreCase(scheme)) {
                return 443;
            }
            if ("http".equalsIgnoreCase(scheme)) {
                return 80;
            }
        } catch (Exception ignored) {
            // ignore
        }
        return defaultPort;
    }

    /**
     * Primeiro IPv4 de rede local (Wi‑Fi/Ethernet) — para QR em dev acessível pelo celular na mesma rede.
     */
    String detectLanIpv4() {
        String best192 = null;
        String best10 = null;
        String best172 = null;
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface ni = interfaces.nextElement();
                if (!ni.isUp() || ni.isLoopback()) {
                    continue;
                }
                Enumeration<InetAddress> addresses = ni.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress address = addresses.nextElement();
                    if (address.isLoopbackAddress() || address.isLinkLocalAddress()) {
                        continue;
                    }
                    String host = address.getHostAddress();
                    if (host == null || host.contains(":")) {
                        continue;
                    }
                    if (host.startsWith("192.168.")) {
                        best192 = host;
                    } else if (host.startsWith("10.")) {
                        best10 = host;
                    } else if (isPrivate172(host)) {
                        best172 = host;
                    }
                }
            }
        } catch (SocketException e) {
            LOG.warnf(e, "Erro ao detectar IP LAN: %s", e.getMessage());
        }
        if (best192 != null) {
            return best192;
        }
        if (best10 != null) {
            return best10;
        }
        return best172;
    }

    private static boolean isPrivate172(String host) {
        String[] parts = host.split("\\.");
        if (parts.length != 4) {
            return false;
        }
        try {
            int a = Integer.parseInt(parts[0]);
            int b = Integer.parseInt(parts[1]);
            return a == 172 && b >= 16 && b <= 31;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    static boolean isUsablePublicFrontendUrl(String url) {
        if (url == null || url.isBlank() || url.startsWith("${")) {
            return false;
        }
        String u = url.trim();
        if (!u.startsWith("http://") && !u.startsWith("https://")) {
            return false;
        }
        if (u.contains("localhost") || u.contains("127.0.0.1")) {
            return false;
        }
        try {
            URI uri = URI.create(u);
            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                return false;
            }
            return !isPrivateIpv4(host);
        } catch (Exception e) {
            return false;
        }
    }

    static boolean isPrivateIpv4(String host) {
        if (host == null || host.isBlank()) {
            return true;
        }
        String h = host.trim().toLowerCase();
        if (h.equals("localhost")) {
            return true;
        }
        String[] parts = h.split("\\.");
        if (parts.length != 4) {
            return false;
        }
        try {
            int a = Integer.parseInt(parts[0]);
            int b = Integer.parseInt(parts[1]);
            if (a == 10) {
                return true;
            }
            if (a == 127) {
                return true;
            }
            if (a == 172 && b >= 16 && b <= 31) {
                return true;
            }
            if (a == 192 && b == 168) {
                return true;
            }
            if (a == 169 && b == 254) {
                return true;
            }
            return false;
        } catch (NumberFormatException e) {
            return false;
        }
    }
    
    /** Remove barra final da base URL para montar links corretos (ex: base + \"/externo/setup-password\"). */
    private static String normalizeBaseUrl(String url) {
        if (url == null) return null;
        String u = url.trim();
        while (u.endsWith("/")) {
            u = u.substring(0, u.length() - 1);
        }
        return u;
    }
    
    /**
     * Detecta o IP do servidor na rede local
     * Retorna o primeiro IP não-loopback encontrado
     */
    private String detectServerIp() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface networkInterface = interfaces.nextElement();
                
                // Ignorar interfaces desabilitadas ou loopback
                if (!networkInterface.isUp() || networkInterface.isLoopback()) {
                    continue;
                }
                
                Enumeration<InetAddress> addresses = networkInterface.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress address = addresses.nextElement();
                    
                    // Ignorar loopback e IPv6 link-local
                    if (address.isLoopbackAddress() || address.isLinkLocalAddress()) {
                        continue;
                    }

                    // Preferir IPv4 público (ignorar Docker bridge 172.18.x, LAN, etc.)
                    String hostAddress = address.getHostAddress();
                    if (hostAddress != null
                            && !hostAddress.contains(":")
                            && !isPrivateIpv4(hostAddress)) {
                        return hostAddress;
                    }
                }
            }
        } catch (SocketException e) {
            LOG.warnf(e, "Erro ao detectar IP do servidor: %s", e.getMessage());
        }
        
        return null;
    }
}

