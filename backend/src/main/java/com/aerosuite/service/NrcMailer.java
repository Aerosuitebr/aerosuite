package com.aerosuite.service;

import com.aerosuite.dto.NrcNotificacaoEmailData;
import com.aerosuite.util.NrcEmailMessages;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.format.DateTimeFormatter;

/** E-mail da jornada NRC, no idioma do destinatário. */
@ApplicationScoped
public class NrcMailer {

    private static final Logger LOG = Logger.getLogger(NrcMailer.class);
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Inject
    EmailService emailService;

    public boolean notificarEtapa(NrcNotificacaoEmailData data) {
        if (data == null || data.destinatarioEmail() == null || data.destinatarioEmail().isBlank()) {
            return false;
        }
        try {
            NrcEmailMessages msg = NrcEmailMessages.forLocale(data.resolvedLocaleTag());
            String assunto = msg.emailSubject(data.etapaEfetiva(), data.numeroNrc());
            boolean sent = emailService.sendEmail(
                data.destinatarioEmail().trim(),
                assunto,
                html(data, msg),
                texto(data, msg),
                null,
                null);
            if (sent) {
                LOG.infof("E-mail NRC %s enviado para %s — %s", data.etapaEfetiva(), data.destinatarioEmail(), data.numeroNrc());
            }
            return sent;
        } catch (Exception e) {
            LOG.errorf("Falha ao enviar e-mail NRC %s para %s: %s", data.etapaEfetiva(), data.destinatarioEmail(), e.getMessage());
            return false;
        }
    }

    private static String texto(NrcNotificacaoEmailData data, NrcEmailMessages msg) {
        return msg.etapaTitulo(data.etapaEfetiva()) + "\n"
            + data.numeroNrc() + "\n"
            + msg.labelPrazo() + ": " + prazo(data, msg) + "\n"
            + data.nrcUrl();
    }

    private static String html(NrcNotificacaoEmailData data, NrcEmailMessages msg) {
        String prazo = prazo(data, msg);
        String detalhe = data.etapaDetalhe() == null || data.etapaDetalhe().isBlank()
            ? ""
            : "<p style=\"margin:16px 0 0;color:#334155;\">" + esc(data.etapaDetalhe()) + "</p>";
        return """
            <div style="font-family:Segoe UI,sans-serif;background:#f4f6fb;padding:24px;color:#17243b;">
              <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e2e7f1;border-radius:16px;overflow:hidden;">
                <div style="background:#1e2a4a;color:#fff;padding:28px 32px;">
                  <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#f5d77a;">%s</div>
                  <h1 style="margin:8px 0 0;font-size:24px;">%s</h1>
                </div>
                <div style="padding:28px 32px;">
                  <p style="margin:0 0 16px;line-height:1.6;">%s</p>
                  <p style="display:inline-block;margin:0 0 18px;padding:8px 12px;border-radius:8px;background:#eef2ff;color:#3730a3;font-weight:700;">%s</p>
                  <table style="width:100%%;border-collapse:collapse;font-size:14px;">
                    %s
                  </table>
                  <div style="margin:20px 0;padding:16px 18px;border-radius:12px;background:#fff7ed;color:#9a3412;">
                    <div style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;">%s</div>
                    <strong style="font-size:20px;">%s</strong>
                  </div>
                  %s
                  <p style="text-align:center;margin:28px 0 8px;">
                    <a href="%s" style="display:inline-block;background:#5056d8;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;">%s</a>
                  </p>
                </div>
                <div style="padding:16px 32px 24px;color:#64748b;font-size:12px;line-height:1.5;">%s<br>%s</div>
              </div>
            </div>
            """.formatted(
            esc(msg.headerBadge()),
            esc(msg.etapaTitulo(data.etapaEfetiva())),
            msg.etapaIntroHtml(data.etapaEfetiva(), esc(orDash(data.delegadoPorNome())), esc(orDash(data.destinatarioNome())), esc(data.numeroNrc())),
            esc(data.numeroNrc()),
            row(msg.labelSeveridade(), msg.labelSeveridadeValue(data.severidade()))
                + row(msg.labelOrigem(), msg.labelOrigemValue(data.origem()))
                + row(msg.labelTipo(), msg.labelTipoValue(data.tipoNc()))
                + row(msg.labelOs(), orDash(data.osNumero()))
                + row(msg.labelCliente(), orDash(data.clienteNome()))
                + row(msg.labelPnLote(), orDash(data.partNumber()) + " · " + orDash(data.loteCodigo())),
            esc(msg.labelPrazo()),
            esc(prazo),
            detalhe,
            esc(data.nrcUrl() == null ? "#" : data.nrcUrl()),
            esc(msg.ctaOpen()),
            esc(msg.footerLine1()),
            esc(msg.footerLine2()));
    }

    private static String row(String label, String value) {
        return "<tr><td style=\"padding:8px 12px 8px 0;color:#64748b;vertical-align:top;\">"
            + esc(label) + "</td><td style=\"padding:8px 0;font-weight:600;\">" + esc(value) + "</td></tr>";
    }

    private static String prazo(NrcNotificacaoEmailData data, NrcEmailMessages msg) {
        return data.prazoTratamento() != null ? data.prazoTratamento().format(DATE) : msg.prazoIndefinido();
    }

    private static String orDash(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }

    private static String esc(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
