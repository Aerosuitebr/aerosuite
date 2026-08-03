package com.aerosuite.integration.bling;

import java.util.List;

/**
 * Escopos/permissões que o app Bling deve ter no painel
 * <a href="https://developer.bling.com.br/aplicativos">developer.bling.com.br</a>.
 * A Bling ignora {@code scope} na URL OAuth — as permissões vêm do cadastro do aplicativo.
 */
public final class BlingRequiredPermissions {

    private BlingRequiredPermissions() {}

    /** Checklist legível para homologação Aero Suite (contato → pedido → NF-e). */
    public static List<String> panelChecklist() {
        return List.of(
                "Cadastros → Contatos → Gerenciar contatos (listar/criar/editar)",
                "Cadastros → Contatos → Visualizar contatos",
                "Cadastros → Produtos → Gerenciar produtos (opcional; pedido aceita item avulso)",
                "Vendas → Pedidos de venda → Gerenciar pedidos de venda",
                "Vendas → Pedidos de venda → Visualizar pedidos de venda",
                "Notas fiscais → NF-e → Visualizar NF-e",
                "Notas fiscais → NF-e → Emitir NF-e",
                "Empresa → Dados básicos (companyId após OAuth)",
                "Webhooks → Contatos, Pedidos de venda, NF-e (criação/atualização)");
    }
}
