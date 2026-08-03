-- Repara histórico Flyway quando V34 falhou no 2º INSERT (duplicate key em perfil_funcionalidade).
-- Executar no MySQL do tenant (ex.: aerosuite) e reiniciar a API com o JAR que contém V34 corrigido.
--
--   docker exec -i aerosuite-mysql-local mysql -uroot -proot aerosuite < db/scripts/repair_flyway_v34_failed.sql
-- ou cliente MySQL no host.

DELETE FROM flyway_schema_history
WHERE version = '34'
  AND success = 0;
