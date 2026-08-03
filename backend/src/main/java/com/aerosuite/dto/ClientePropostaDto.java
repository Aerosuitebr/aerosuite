package com.aerosuite.dto;

import java.time.LocalDateTime;

public class ClientePropostaDto {
    public Integer id;
    public String nome;
    public String cnpjCpf;
    public String email;
    public String telefone;
    public String contato;
    public String endereco;
    public String cidade;
    public String estado;
    public String cep;
    public String observacao;
    public Boolean isActive;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public Integer createdBy;
}
