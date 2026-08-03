-- ========================================
-- AEROSUITE - DADOS DE TESTE ADICIONAIS
-- ========================================
-- Script para popular dados de teste específicos para validação das funcionalidades

-- Configurações
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- ========================================
-- DADOS ADICIONAIS PARA FCU (para testar auto-preenchimento)
-- ========================================

-- FCUs com dados mais completos para teste
INSERT INTO `fcu` VALUES 
(200,'4138008-3','FCU - Flight Control Unit',1,1,'DP-F2','4138008-3','SN4138008001','73-20-64','2020-11-18','2',NOW(),NOW(),'system',1),
(201,'3244897-4','FCU - Fuel Control Unit',2,1,'DP-F2','3244897-4','SN3244897001','73-20-78','2020-10-01','1',NOW(),NOW(),'system',1),
(202,'2524440-5','FCU - Engine Control Unit',3,2,'DP-F2','2524440-5','SN2524440001','73-20-31','2020-11-16','4',NOW(),NOW(),'system',1),
(203,'3244809-1','FCU - Power Control Unit',4,1,'DP-F2','3244809-1','SN3244809001','73-20-36','2020-12-17','3',NOW(),NOW(),'system',1),
(204,'3244745-1','FCU - Hydraulic Control Unit',5,1,'DP-F2','3244745-1','SN3244745001','73-20-15','2008-01-25','9',NOW(),NOW(),'system',1);

-- ========================================
-- DADOS ADICIONAIS PARA OS (para testar CRUD)
-- ========================================

INSERT INTO `os` VALUES 
(100,1001,'ADS/DAS - Abertura de OS',0,'HOT VALLEY AVIATION','2024-01-15','2024-01-20','2024-01-10','2024-01-01',1,200,'1500','750','73-20-64','OS-1001','1','Serviço de revisão geral concluído com sucesso','OS finalizada e aprovada','SN4138008001','Início da revisão geral do FCU','REVISÃO GERAL','Título ADS - Revisão Geral FCU','Título Afins - Componentes relacionados','Boletins de serviço afins aplicados',NULL,NOW(),NOW(),'system',1),
(101,1002,'ADS/DAS - Reparo Específico',0,'AIRLINE TEST COMPANY','2024-02-15','2024-02-20','2024-02-10','2024-02-01',2,201,'2000','1000','73-20-78','OS-1002','2','Reparo do componente concluído','OS finalizada','SN3244897001','Início do reparo específico','REPARO','Título ADS - Reparo FCU','Título Afins - Peças de reposição','Boletins de reparo aplicados',NULL,NOW(),NOW(),'system',1),
(102,1003,'ADS/DAS - Inspeção Visual',0,'AVIATION SERVICES LTDA','2024-03-15','2024-03-20','2024-03-10','2024-03-01',1,202,'3000','1500','73-20-31','OS-1003','3','Inspeção visual aprovada','OS finalizada','SN2524440001','Início da inspeção visual','INSPEÇÃO VISUAL','Título ADS - Inspeção Visual','Título Afins - Checklist aplicado','Boletins de inspeção aplicados',NULL,NOW(),NOW(),'system',1),
(103,1004,'ADS/DAS - Teste de Funcionamento',0,'AERONAUTICAL SOLUTIONS','2024-04-15','2024-04-20','2024-04-10','2024-04-01',1,203,'2500','1250','73-20-36','OS-1004','4','Teste de funcionamento aprovado','OS finalizada','SN3244809001','Início dos testes de funcionamento','TESTE','Título ADS - Teste de Funcionamento','Título Afins - Procedimentos de teste','Boletins de teste aplicados',NULL,NOW(),NOW(),'system',1),
(104,1005,'ADS/DAS - Manutenção Preventiva',0,'FLIGHT MAINTENANCE INC','2024-05-15','2024-05-20','2024-05-10','2024-05-01',1,204,'1800','900','73-20-15','OS-1005','5','Manutenção preventiva concluída','OS finalizada','SN3244745001','Início da manutenção preventiva','MANUTENÇÃO PREVENTIVA','Título ADS - Manutenção Preventiva','Título Afins - Cronograma aplicado','Boletins de manutenção aplicados',NULL,NOW(),NOW(),'system',1);

-- ========================================
-- DADOS ADICIONAIS PARA PRODUCT (para testar estoque)
-- ========================================

INSERT INTO `product` VALUES 
(300,'PARAFUSO AERONÁUTICO',1001,'SCREW AERONAUTICAL',15.50,'AN503-6-4-AERO',50,'ATIVO','Prateleira A1'),
(301,'ARRUELA DE PRESSÃO',1002,'PRESSURE WASHER',8.75,'AN960-416L-PRESS',25,'ATIVO','Prateleira A2'),
(302,'PINO DE SEGURANÇA',1003,'SAFETY PIN',12.30,'MS171436-SAFE',30,'ATIVO','Prateleira A3'),
(303,'PORCA AUTOBLOQUEANTE',1004,'SELF-LOCKING NUT',18.90,'MS21083N06-LOCK',40,'ATIVO','Prateleira A4'),
(304,'BEARING DE ROLAMENTO',1005,'BEARING ASSEMBLY',125.00,'2523240-BEAR',15,'ATIVO','Prateleira B1'),
(305,'GASKET DE VEDAÇÃO',1006,'SEALING GASKET',22.50,'343489-GASK',60,'ATIVO','Prateleira B2'),
(306,'DIAPHRAGM DE CONTROLE',1007,'CONTROL DIAPHRAGM',45.75,'343451-DIAPH',20,'ATIVO','Prateleira B3'),
(307,'SPRING DE RETORNO',1008,'RETURN SPRING',35.25,'343300-SPRING',35,'ATIVO','Prateleira B4'),
(308,'FILTER ELEMENT',1009,'FILTER ELEMENT',85.00,'02-15784-FILT',10,'ATIVO','Prateleira C1'),
(309,'WASHER PLANO',1010,'FLAT WASHER',5.50,'AN960-8-FLAT',100,'ATIVO','Prateleira C2');

-- ========================================
-- DADOS ADICIONAIS PARA TP_FILES (para testar upload)
-- ========================================

INSERT INTO `tp_files` VALUES 
(100,'manual_revisao_geral_v2.pdf','Manual Revisão Geral v2.0.pdf','/uploads/manuals/manual_revisao_geral_v2.pdf',2048000,'application/pdf','pdf','Manual atualizado para revisão geral de equipamentos - versão 2.0',1,NOW(),NOW(),'system',1),
(101,'procedimento_reparo_emergencia.docx','Procedimento Reparo Emergência.docx','/uploads/procedures/procedimento_reparo_emergencia.docx',768000,'application/vnd.openxmlformats-officedocument.wordprocessingml.document','docx','Procedimento para reparos de emergência em campo',2,NOW(),NOW(),'system',1),
(102,'checklist_inspecao_detalhado.pdf','Checklist Inspeção Detalhado.pdf','/uploads/checklists/checklist_inspecao_detalhado.pdf',512000,'application/pdf','pdf','Checklist detalhado para inspeção visual completa',3,NOW(),NOW(),'system',1),
(103,'protocolo_teste_funcionamento.pdf','Protocolo Teste Funcionamento.pdf','/uploads/protocols/protocolo_teste_funcionamento.pdf',1024000,'application/pdf','pdf','Protocolo completo para testes de funcionamento',4,NOW(),NOW(),'system',1),
(104,'cronograma_manutencao_preventiva.xlsx','Cronograma Manutenção Preventiva.xlsx','/uploads/schedules/cronograma_manutencao_preventiva.xlsx',256000,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','xlsx','Cronograma de manutenção preventiva programada',7,NOW(),NOW(),'system',1);

-- ========================================
-- DADOS ADICIONAIS PARA ASSOCIACAO_FCU (para testar relacionamentos)
-- ========================================

INSERT INTO `associacao_fcu` VALUES 
(100,200,300,2),
(101,200,301,1),
(102,201,302,1),
(103,201,303,2),
(104,202,304,1),
(105,202,305,1),
(106,203,306,1),
(107,203,307,2),
(108,204,308,1),
(109,204,309,3);

-- ========================================
-- FINALIZAÇÃO
-- ========================================
COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- VERIFICAÇÃO DOS DADOS ADICIONAIS
-- ========================================
SELECT 'DADOS ADICIONAIS INSERIDOS:' as status;
SELECT 'FCU' as tabela, COUNT(*) as total_registros FROM fcu WHERE id >= 200
UNION ALL
SELECT 'OS' as tabela, COUNT(*) as total_registros FROM os WHERE id >= 100
UNION ALL
SELECT 'PRODUCT' as tabela, COUNT(*) as total_registros FROM product WHERE id >= 300
UNION ALL
SELECT 'TP_FILES' as tabela, COUNT(*) as total_registros FROM tp_files WHERE id >= 100
UNION ALL
SELECT 'ASSOCIACAO_FCU' as tabela, COUNT(*) as total_registros FROM associacao_fcu WHERE id >= 100;

-- ========================================
-- USUÁRIOS DE TESTE PARA AUTENTICAÇÃO
-- ========================================

-- Usuário administrador
INSERT INTO `usuario` VALUES 
(1, 'admin@aerosuite.com', 'Administrador', 'admin123', 1);

-- Usuário operador
INSERT INTO `usuario` VALUES 
(2, 'operador@aerosuite.com', 'Operador', 'operador123', 1);

-- Usuário técnico
INSERT INTO `usuario` VALUES 
(3, 'tecnico@aerosuite.com', 'Técnico', 'tecnico123', 1);