package com.aerosuite.dto;

public class RelatorioProdutoRowDto {
    public Integer id;
    public String nome;
    public String fabricante;
    public String status;
    public String data;

    public RelatorioProdutoRowDto() {}

    public RelatorioProdutoRowDto(Integer id, String nome, String fabricante, String status, String data) {
        this.id = id;
        this.nome = nome;
        this.fabricante = fabricante;
        this.status = status;
        this.data = data;
    }
}
