package com.aerosuite.integration;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.is;

/**
 * Smoke de autorização HTTP nos recursos da Onda B (sem token válido).
 * Valida que rotas protegidas não respondem 200 anônimo.
 */
@QuarkusTest
class ConformidadeApiAuthIT {

    @Test
    void habilitacoes_semAutenticacao_naoRetorna200() {
        given().accept(ContentType.JSON)
                .when()
                .get("/api/conformidade/habilitacoes")
                .then()
                .statusCode(anyOf(is(400), is(401), is(403)));
    }

    @Test
    void diretrizes_semAutenticacao_naoRetorna200() {
        given().accept(ContentType.JSON)
                .when()
                .get("/api/aero/diretrizes")
                .then()
                .statusCode(anyOf(is(400), is(401), is(403)));
    }

    @Test
    void jobCardAbertas_semAutenticacao_naoRetorna200() {
        given().accept(ContentType.JSON)
                .when()
                .get("/api/os/job-card/abertas")
                .then()
                .statusCode(anyOf(is(400), is(401), is(403)));
    }

    @Test
    void retencao_semAutenticacao_naoRetorna200() {
        given().accept(ContentType.JSON)
                .when()
                .get("/api/conformidade/retencao")
                .then()
                .statusCode(anyOf(is(400), is(401), is(403)));
    }

    @Test
    void crsChecklist_semAutenticacao_naoRetorna200() {
        given().accept(ContentType.JSON)
                .when()
                .get("/api/os/1/crs/checklist")
                .then()
                .statusCode(anyOf(is(400), is(401), is(403), is(404)));
    }

    @Test
    void painelQualidade_semAutenticacao_naoRetorna200() {
        given().accept(ContentType.JSON)
                .when()
                .get("/api/conformidade/painel")
                .then()
                .statusCode(anyOf(is(400), is(401), is(403)));
    }

    @Test
    void documentosControlados_semAutenticacao_naoRetorna200() {
        given().accept(ContentType.JSON)
                .when()
                .get("/api/conformidade/documentos")
                .then()
                .statusCode(anyOf(is(400), is(401), is(403)));
    }

    @Test
    void treinamentosObrigatorios_semAutenticacao_naoRetorna200() {
        given().accept(ContentType.JSON)
                .when()
                .get("/api/conformidade/treinamentos-obrigatorios")
                .then()
                .statusCode(anyOf(is(400), is(401), is(403)));
    }

    @Test
    void naoConformidades_semAutenticacao_naoRetorna200() {
        given().accept(ContentType.JSON)
                .when()
                .get("/api/conformidade/nao-conformidades")
                .then()
                .statusCode(anyOf(is(400), is(401), is(403)));
    }

    @Test
    void smsIndicadores_semAutenticacao_naoRetorna200() {
        given().accept(ContentType.JSON)
                .when()
                .get("/api/conformidade/sms/indicadores")
                .then()
                .statusCode(anyOf(is(400), is(401), is(403)));
    }

    @Test
    void relatorioSgqZip_semAutenticacao_naoRetorna200() {
        given().accept("application/zip")
                .when()
                .get("/api/conformidade/relatorios/sgq.zip")
                .then()
                .statusCode(anyOf(is(400), is(401), is(403)));
    }
}
