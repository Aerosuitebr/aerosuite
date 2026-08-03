package com.aerosuite.i18n;

import java.util.ArrayList;
import java.util.List;

/** Textos de e-mail, impressão e PDF da proposta comercial (4 locales). */
public final class PropostaComercialMessages {

    public enum Lang {
        PT,
        EN,
        ES,
        FR
    }

    private PropostaComercialMessages() {}

    public static Lang toLang(String locale) {
        return switch (UserLocaleResolver.normalize(locale)) {
            case "en-US" -> Lang.EN;
            case "es-ES" -> Lang.ES;
            case "fr-FR" -> Lang.FR;
            default -> Lang.PT;
        };
    }

    public static String htmlLang(Lang lang) {
        return switch (lang) {
            case EN -> "en-US";
            case ES -> "es-ES";
            case FR -> "fr-FR";
            default -> "pt-BR";
        };
    }

    public record Labels(
            String docTitulo,
            String dataPrefix,
            String secDadosCliente,
            String lblNome,
            String lblCnpjCpf,
            String lblContato,
            String lblTelefone,
            String lblEmail,
            String lblEndereco,
            String lblCep,
            String lblObservacoes,
            String secProdutos,
            String colDesc,
            String colPn,
            String colSn,
            String colQtd,
            String colValor,
            String colValorUnitUsd,
            String colTotalUsd,
            String subtotalProdutosUsd,
            String freteUsd,
            String maoDeObraUsd,
            String totalGeralUsd,
            String aOrcar,
            String totais,
            String servicoExecutado,
            String secCondCom,
            String lblDataProposta,
            String lblValidade,
            String lblPrazoEntrega,
            String lblFormaPagamento,
            String lblGarantia,
            String secCondGerais,
            String obsTitulo,
            String observacao,
            String vendedorTecnico,
            String refNova,
            String nomeRazaoSocial,
            String lblMensagem,
            String lblProduto,
            String lblValorUnit,
            String lblTotalItem,
            String lblQtdTotal,
            String lblValorTotal,
            String confidentialityTitle,
            String confidentialityBody,
            String semProdutos,
            String responsavelProposta,
            String responsavelAssinatura) {}

    public static Labels labels(Lang lang) {
        return switch (lang) {
            case EN ->
                    new Labels(
                            "COMMERCIAL PROPOSAL",
                            "Date:",
                            "CUSTOMER DETAILS",
                            "Name",
                            "CNPJ/CPF",
                            "Contact",
                            "Phone",
                            "Email",
                            "Address",
                            "ZIP",
                            "Notes",
                            "PRODUCTS / SERVICES",
                            "Description",
                            "P/N",
                            "S/N",
                            "Qty",
                            "Amount",
                            "Unit price (USD)",
                            "Total (USD)",
                            "Products subtotal (USD):",
                            "Freight (BRL %s → USD):",
                            "Labor (BRL %s → USD):",
                            "TOTAL (USD):",
                            "To be quoted",
                            "TOTALS",
                            "Service to be performed:",
                            "COMMERCIAL TERMS",
                            "Proposal date",
                            "Validity",
                            "Lead time",
                            "Payment terms",
                            "Warranty",
                            "GENERAL TERMS",
                            "NOTE",
                            "Note",
                            "Technical Sales Representative",
                            "NEW",
                            "Legal name",
                            "MESSAGE:",
                            "Product:",
                            "Unit price:",
                            "Total:",
                            "Total qty:",
                            "Total amount:",
                            "CONFIDENTIALITY NOTICE:",
                            "This message contains confidential information intended solely for the recipient. "
                                    + "If you received it in error, please notify the sender and delete the message.",
                            "No products or services added.",
                            "Proposal owner",
                            "Authorized signatory");
            case ES ->
                    new Labels(
                            "PROPUESTA COMERCIAL",
                            "Fecha:",
                            "DATOS DEL CLIENTE",
                            "Nombre",
                            "CNPJ/CPF",
                            "Contacto",
                            "Teléfono",
                            "Correo electrónico",
                            "Dirección",
                            "CP",
                            "Observaciones",
                            "PRODUCTOS / SERVICIOS",
                            "Descripción",
                            "P/N",
                            "S/N",
                            "Cant",
                            "Importe",
                            "Precio unit. (USD)",
                            "Total (USD)",
                            "Subtotal productos (USD):",
                            "Flete (R$ %s → USD):",
                            "Mano de obra (R$ %s → USD):",
                            "TOTAL GENERAL (USD):",
                            "A convenir",
                            "TOTALES",
                            "Servicio a realizar:",
                            "CONDICIONES COMERCIALES",
                            "Fecha de la propuesta",
                            "Validez",
                            "Plazo de entrega",
                            "Forma de pago",
                            "Garantía",
                            "CONDICIONES GENERALES",
                            "NOTA",
                            "Observación",
                            "Vendedor técnico",
                            "NUEVA",
                            "Nombre / Razón social",
                            "MENSAJE:",
                            "Producto:",
                            "Precio unit.:",
                            "Total:",
                            "Cant. total:",
                            "Importe total:",
                            "AVISO DE CONFIDENCIALIDAD:",
                            "Este mensaje contiene información confidencial destinada exclusivamente al destinatario. "
                                    + "Si lo recibió por error, notifique al remitente y elimine el mensaje.",
                            "Ningún producto o servicio añadido.",
                            "Responsable de la propuesta",
                            "Responsable");
            case FR ->
                    new Labels(
                            "PROPOSITION COMMERCIALE",
                            "Date :",
                            "DONNÉES CLIENT",
                            "Nom",
                            "CNPJ/CPF",
                            "Contact",
                            "Téléphone",
                            "E-mail",
                            "Adresse",
                            "CP",
                            "Remarques",
                            "PRODUITS / SERVICES",
                            "Description",
                            "P/N",
                            "S/N",
                            "Qté",
                            "Montant",
                            "Prix unit. (USD)",
                            "Total (USD)",
                            "Sous-total produits (USD) :",
                            "Fret (R$ %s → USD) :",
                            "Main-d'œuvre (R$ %s → USD) :",
                            "TOTAL GÉNÉRAL (USD) :",
                            "À convenir",
                            "TOTAUX",
                            "Service à réaliser :",
                            "CONDITIONS COMMERCIALES",
                            "Date de la proposition",
                            "Validité",
                            "Délai de livraison",
                            "Modalités de paiement",
                            "Garantie",
                            "CONDITIONS GÉNÉRALES",
                            "NOTE",
                            "Remarque",
                            "Vendeur technique",
                            "NOUVELLE",
                            "Nom / Raison sociale",
                            "MESSAGE :",
                            "Produit :",
                            "Prix unit. :",
                            "Total :",
                            "Qté totale :",
                            "Montant total :",
                            "AVIS DE CONFIDENTIALITÉ :",
                            "Ce message contient des informations confidentielles destinées exclusivement au destinataire. "
                                    + "Si vous l’avez reçu par erreur, veuillez en informer l’expéditeur et supprimer le message.",
                            "Aucun produit ou service ajouté.",
                            "Responsable de la proposition",
                            "Responsable");
            default ->
                    new Labels(
                            "PROPOSTA COMERCIAL",
                            "Data:",
                            "DADOS DO CLIENTE",
                            "Nome",
                            "CNPJ/CPF",
                            "Contato",
                            "Telefone",
                            "E-mail",
                            "Endereço",
                            "CEP",
                            "Observações",
                            "PRODUTOS / SERVIÇOS",
                            "Descrição",
                            "P/N",
                            "S/N",
                            "Qtd",
                            "Valor",
                            "Valor Unit. (USD)",
                            "Total (USD)",
                            "Subtotal Produtos (USD):",
                            "Frete (R$ %s → USD):",
                            "Mão de Obra (R$ %s → USD):",
                            "💵 TOTAL GERAL (USD):",
                            "A orçar",
                            "TOTAIS",
                            "Serviço a ser executado:",
                            "CONDIÇÕES COMERCIAIS",
                            "Data da Proposta",
                            "Validade",
                            "Prazo de Entrega",
                            "Forma de Pagamento",
                            "Garantia",
                            "CONDIÇÕES GERAIS",
                            "OBSERVAÇÃO",
                            "Observação",
                            "Vendedor Técnico",
                            "NOVA",
                            "Nome/Razão Social",
                            "MENSAGEM:",
                            "Produto:",
                            "Valor Unit.:",
                            "Total:",
                            "Qtd Total:",
                            "Valor Total:",
                            "AVISO DE CONFIDENCIALIDADE:",
                            "Esta mensagem contém informações confidenciais destinadas exclusivamente ao destinatário. "
                                    + "Se você recebeu por engano, notifique o remetente e apague a mensagem.",
                            "Nenhum produto/serviço adicionado.",
                            "Responsável pela Proposta",
                            "Responsável");
        };
    }

    public static List<String> condicoesGeraisFixas(Lang lang, String brandNormal, String brandUpper) {
        String n = blank(brandNormal) ? "Aero Suite" : brandNormal.trim();
        String u = blank(brandUpper) ? n.toUpperCase() : brandUpper.trim();
        List<String> raw =
                switch (lang) {
                    case EN ->
                            List.of(
                                    "After receipt at RECEX, the accessory/aircraft component will undergo receiving inspection, incoming testing, teardown, cleaning, visual and dimensional inspections, NDT where applicable, assembly, testing, calibration/adjustment, and shipment to the customer.",
                                    "Work will be carried out per the routing tag/information label and manufacturer manuals.",
                                    "Service warranty is 3 (three) months or 150 (one hundred and fifty) hours, per %s maintenance organisation specification.",
                                    "Transport is customer responsibility unless otherwise agreed.",
                                    "%s may adjust pricing if scope changes materially.",
                                    "%s will charge an 8%% (eight percent) handling fee on price-list value for customer-supplied material.",
                                    "If discrepancies are corrected during execution, a supplemental quotation will be submitted for approval before proceeding.",
                                    "Amounts quoted in US dollars convert to national currency using the official rate on invoicing/payment.",
                                    "Delivery time starts counting after material receipt.",
                                    "An initial quotation will be submitted. After teardown/inspection, pricing may vary to restore manufacturer intended performance.",
                                    "Engines under extension programmes or below target performance follow additional criteria. Field troubleshooting may incur extra agreed costs (travel, lodging, meals, labour).",
                                    "Quoted amounts include applicable taxes computed under current regulation.");
                    case ES ->
                            List.of(
                                    "Tras la recepción en RECEX, el accesorio o componente aeronáutico será sometido a inspección de recepción, pruebas de entrada, desmontaje, limpieza, inspecciones visuales y dimensionales, END cuando corresponda, montaje, pruebas, calibración/ajuste y envío al cliente.",
                                    "El trabajo se ejecutará según la etiqueta de ruta/información y los manuales del fabricante.",
                                    "La garantía del servicio es de 3 (tres) meses o 150 (ciento cincuenta) horas, según la especificación de la organización de mantenimiento %s.",
                                    "El transporte es responsabilidad del cliente salvo acuerdo distinto.",
                                    "%s podrá ajustar los precios si el alcance cambia de forma sustancial.",
                                    "%s aplicará un 8%% (ocho por ciento) de handling sobre el valor de lista de precios de material suministrado por el cliente.",
                                    "Si durante la ejecución se corrigen discrepancias, se presentará una cotización complementaria para aprobación previa.",
                                    "Los importes en dólares estadounidenses se convertirán a moneda nacional según el tipo oficial en facturación/pago.",
                                    "El plazo de entrega comienza tras la recepción del material.",
                                    "Se presentará una cotización inicial. Tras desmontaje/inspección, el precio puede variar para restablecer el rendimiento previsto por el fabricante.",
                                    "Los motores bajo programas de extensión o por debajo del rendimiento objetivo siguen criterios adicionales. La resolución de averías en campo puede generar costes adicionales acordados (viaje, alojamiento, manutención, mano de obra).",
                                    "Los importes incluyen tributos aplicables calculados según la normativa vigente.");
                    case FR ->
                            List.of(
                                    "Après réception au secteur RECEX, l’accessoire ou le composant aéronautique subira une inspection à réception, des essais d’entrée, un démontage, un nettoyage, des inspections visuelles et dimensionnelles, du CND le cas échéant, un remontage, des essais, un calibrage/ajustement puis une expédition au client.",
                                    "Les travaux seront exécutés conformément à l’étiquette d’acheminement/d’information et aux manuels du constructeur.",
                                    "La garantie du service est de 3 (trois) mois ou 150 (cent cinquante) heures, selon la spécification de l’organisme de maintenance %s.",
                                    "Le transport est à la charge du client sauf accord contraire.",
                                    "%s peut ajuster les prix en cas de changement substantiel du périmètre.",
                                    "%s appliquera des frais de manutention de 8 %% (huit pour cent) sur la valeur au barème de prix du matériel fourni par le client.",
                                    "Si des écarts sont corrigés pendant l’exécution, un devis complémentaire sera soumis pour approbation préalable.",
                                    "Les montants libellés en dollars américains sont convertis en monnaie nationale au cours officiel à la facturation / au paiement.",
                                    "Le délai de livraison court à partir de la réception du matériel.",
                                    "Un devis préliminaire sera soumis. Après démontage/inspection, le prix peut varier pour retrouver les performances prévues par le constructeur.",
                                    "Les moteurs sous programmes d’extension ou en dessous de la performance cible suivent des critères supplémentaires. Les dépannages sur site peuvent entraîner des coûts supplémentaires convenus (déplacement, hébergement, repas, main-d’œuvre).",
                                    "Les montants incluent les taxes applicables conformément à la réglementation en vigueur.");
                    default ->
                            List.of(
                                    "Após o recebimento do item no setor RECEX, o acessório e/ou componente aeronáutico será submetido à inspeção de recebimento, teste de entrada para detectar falhas ocultas não relatadas pelo cliente, desmontagem, limpeza, inspeções visuais, dimensionais, END (Ensaio Não Destrutivo) quando aplicado, montagem, teste e calibração/ajuste e envio ao cliente.",
                                    "O serviço será executado conforme solicitação da etiqueta informativa, em conformidade com o manual do fabricante.",
                                    "A garantia do serviço será de 3 (três) meses ou 150 (cento e cinquenta) horas, segundo especificações da OM (Organização de Manutenção) %s.",
                                    "O transporte do material é de responsabilidade do cliente, salvo acordo em contrário.",
                                    "A %s se reserva o direito de alterar os valores caso haja mudança significativa no escopo do serviço.",
                                    "A %s cobrará a título de handling (manuseio) uma taxa de 8%% (oito por cento) do valor do price list sobre materiais fornecidos pelo cliente.",
                                    "Caso venha a ocorrer correção das discrepâncias encontradas durante a realização dos serviços, será emitida uma proposta complementar àquela já existente para sua apreciação e aprovação prévia.",
                                    "Os valores expressos em dólares norte-americanos deverão ser convertidos para a moeda nacional pelo câmbio oficial na data do faturamento e/ou condição de pagamento.",
                                    "O prazo de entrega começa a contar após o recebimento do material.",
                                    "Será elaborado um orçamento preliminar para a aprovação do cliente. Após a desmontagem e inspeção, o valor da proposta antecedente poderá sofrer alterações, com o intuito de se obter a performance desejada segundo o fabricante.",
                                    "Em motores com programa de extensão ou estando abaixo da performance desejada, serão avaliados por outro critério. Podendo em caso de pesquisa de pane na pista ser acrescido um custo, cujo estará relacionado às despesas tais como: viagem, hospedagem, alimentação e mão de obra, sob o valor final da proposta.",
                                    "Os valores acima incluem impostos, que serão calculados conforme a legislação vigente.");
                };
        List<String> out = new ArrayList<>(raw.size());
        for (int i = 0; i < raw.size(); i++) {
            String line = raw.get(i);
            if (i == 2) {
                out.add(String.format(line, n));
            } else if (i == 4 || i == 5) {
                out.add(String.format(line, i == 4 ? u : n));
            } else {
                out.add(line);
            }
        }
        return out;
    }

    public record WhatsAppTexts(
            String greeting,
            String propostaLabel,
            String dataLabel,
            String webAttachHint,
            String apiAttachHint,
            String regards) {}

    public static WhatsAppTexts whatsApp(Lang lang) {
        return switch (lang) {
            case EN ->
                    new WhatsAppTexts(
                            "Hello! Here is our commercial proposal:\n\n",
                            "Proposal:",
                            "Date:",
                            "📎 The proposal PDF was downloaded to your computer. "
                                    + "Attach the file in this chat (paperclip icon 📎) before sending.\n\n",
                            "📎 The full proposal is attached.\n\n",
                            "Best regards,\n");
            case ES ->
                    new WhatsAppTexts(
                            "¡Hola! Le enviamos nuestra propuesta comercial:\n\n",
                            "Propuesta:",
                            "Fecha:",
                            "📎 El PDF de la propuesta se descargó en su equipo. "
                                    + "Adjunte el archivo en esta conversación (icono de clip 📎) antes de enviar.\n\n",
                            "📎 La propuesta completa va en adjunto.\n\n",
                            "Atentamente,\n");
            case FR ->
                    new WhatsAppTexts(
                            "Bonjour ! Voici notre proposition commerciale :\n\n",
                            "Proposition :",
                            "Date :",
                            "📎 Le PDF de la proposition a été téléchargé sur votre ordinateur. "
                                    + "Joignez le fichier dans cette conversation (icône trombone 📎) avant d’envoyer.\n\n",
                            "📎 La proposition complète est en pièce jointe.\n\n",
                            "Cordialement,\n");
            default ->
                    new WhatsAppTexts(
                            "Olá! Segue nossa proposta comercial:\n\n",
                            "Proposta:",
                            "Data:",
                            "📎 O PDF da proposta foi transferido para o seu computador. "
                                    + "Anexe o arquivo nesta conversa (ícone de clipe 📎) antes de enviar.\n\n",
                            "📎 A proposta completa está em anexo.\n\n",
                            "Atenciosamente,\n");
        };
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }
}
