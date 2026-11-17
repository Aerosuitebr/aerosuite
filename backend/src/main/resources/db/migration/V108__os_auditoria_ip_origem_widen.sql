-- Coluna ip_origem ampliada para VARCHAR(255) (hotfix operacional).
-- O controlador blue-green rejeita ALTER ... MODIFY na troca automática;
-- a alteração estrutural já foi aplicada no banco antes deste registro.
SELECT 1;
