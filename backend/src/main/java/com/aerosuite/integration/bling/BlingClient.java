package com.aerosuite.integration.bling;

/** Cliente HTTP mínimo da API Bling v3. */
public interface BlingClient {

    BlingConnectionStatus checkConnection();

    BlingContactPageDto searchContacts(String pesquisa, int limit);

    /** Detalhe de um contato (GET /contatos/{id}). */
    BlingContactDto getContactById(long blingContatoId);

    /** Dados básicos da empresa conectada (GET /empresas/dados-basicos). */
    BlingCompanyInfoDto fetchCompanyInfo();
}
