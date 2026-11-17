ALTER TABLE usuario ADD COLUMN perfis_revisao BIGINT NOT NULL DEFAULT 0;

CREATE TABLE usuario_perfil (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    perfil_id BIGINT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    vinculado_em DATETIME(6) NULL,
    UNIQUE KEY uk_usuario_perfil (usuario_id, perfil_id),
    CONSTRAINT fk_usuario_perfil_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_perfil_perfil FOREIGN KEY (perfil_id) REFERENCES perfil(id)
);

INSERT INTO usuario_perfil (usuario_id, perfil_id)
SELECT id, perfil_id FROM usuario WHERE perfil_id IS NOT NULL;
