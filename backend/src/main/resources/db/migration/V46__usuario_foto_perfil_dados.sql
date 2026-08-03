-- Cópia binária da foto de perfil (sobrevive a rebuild sem volume de uploads).
ALTER TABLE usuario
    ADD COLUMN foto_perfil_dados LONGBLOB NULL AFTER foto_perfil;
