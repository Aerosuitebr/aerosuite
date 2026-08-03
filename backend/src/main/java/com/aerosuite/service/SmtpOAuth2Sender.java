package com.aerosuite.service;

import java.io.*;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import com.aerosuite.i18n.ApiI18nMessages;
import org.jboss.logging.Logger;

/**
 * Envio SMTP com autenticação XOAUTH2 e upgrade TLS via {@link SSLSocket}.
 */
public class SmtpOAuth2Sender {

    private static final Logger LOG = Logger.getLogger(SmtpOAuth2Sender.class);

    private SmtpOAuth2Sender() {}

    public static void sendEmail(
            String host,
            int port,
            String username,
            String accessToken,
            String from,
            String to,
            String subject,
            String htmlBody)
            throws IOException {
        Socket plainSocket = null;
        SSLSocket sslSocket = null;
        BufferedReader reader = null;
        PrintWriter writer = null;
        try {
            plainSocket = new Socket(host, port);
            reader = new BufferedReader(new InputStreamReader(plainSocket.getInputStream(), StandardCharsets.UTF_8));
            writer = new PrintWriter(new OutputStreamWriter(plainSocket.getOutputStream(), StandardCharsets.UTF_8), true);

            expect(reader, "220");
            sendLine(writer, reader, "EHLO " + host);

            sendLine(writer, reader, "STARTTLS");
            expect(reader, "220");

            SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
            sslSocket = (SSLSocket) factory.createSocket(plainSocket, host, port, true);
            sslSocket.startHandshake();
            plainSocket = null;

            reader = new BufferedReader(new InputStreamReader(sslSocket.getInputStream(), StandardCharsets.UTF_8));
            writer = new PrintWriter(new OutputStreamWriter(sslSocket.getOutputStream(), StandardCharsets.UTF_8), true);

            sendLine(writer, reader, "EHLO " + host);
            sendLine(writer, reader, "AUTH XOAUTH2 " + buildXoauth2String(username, accessToken));
            expect(reader, "235");

            sendLine(writer, reader, "MAIL FROM:<" + from + ">");
            expect(reader, "250");
            sendLine(writer, reader, "RCPT TO:<" + to + ">");
            expect(reader, "250");
            sendLine(writer, reader, "DATA");
            expect(reader, "354");

            writer.println("From: " + from);
            writer.println("To: " + to);
            writer.println("Subject: " + subject);
            writer.println("MIME-Version: 1.0");
            writer.println("Content-Type: text/html; charset=UTF-8");
            writer.println();
            writer.println(htmlBody);
            writer.println(".");
            expect(reader, "250");

            sendLine(writer, reader, "QUIT");
        } finally {
            if (writer != null) {
                writer.close();
            }
            if (reader != null) {
                reader.close();
            }
            if (sslSocket != null) {
                sslSocket.close();
            }
            if (plainSocket != null) {
                plainSocket.close();
            }
        }
    }

    private static void sendLine(PrintWriter writer, BufferedReader reader, String line) throws IOException {
        writer.println(line);
        LOG.debugf("SMTP > %s", line.startsWith("AUTH") ? "AUTH XOAUTH2 ***" : line);
        String response = readMultilineResponse(reader);
        LOG.debugf("SMTP < %s", response.trim());
    }

    private static void expect(BufferedReader reader, String prefix) throws IOException {
        String line = reader.readLine();
        if (line == null || !line.startsWith(prefix)) {
            throw new IOException(ApiI18nMessages.withDetail(ApiI18nMessages.OAUTH_SMTP_UNEXPECTED, line));
        }
    }

    private static String buildXoauth2String(String username, String accessToken) {
        String xoauth2String = "user=" + username + "\001auth=Bearer " + accessToken + "\001\001";
        return Base64.getEncoder().encodeToString(xoauth2String.getBytes(StandardCharsets.UTF_8));
    }

    private static String readMultilineResponse(BufferedReader reader) throws IOException {
        StringBuilder response = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            response.append(line).append('\n');
            if (line.length() > 3 && line.charAt(3) == ' ') {
                break;
            }
        }
        return response.toString();
    }
}
