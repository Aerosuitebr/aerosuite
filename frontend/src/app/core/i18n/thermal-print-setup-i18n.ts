import { TranslationDictionary } from '../translation.service';

const PT: TranslationDictionary = {
  'thermalPrint.setup.title': 'Impressão térmica de etiquetas',
  'thermalPrint.setup.subtitle':
    'Configure uma vez no Windows para imprimir etiquetas PPLB (Elgin L42 e similares) direto do Aero Suite.',
  'thermalPrint.setup.triggeredByPrint':
    'A impressão térmica não pôde ser concluída. Siga os passos abaixo para habilitar o envio automático.',
  'thermalPrint.setup.why.title': 'Por que não é automático como uma impressora comum?',
  'thermalPrint.setup.why.lead':
    'O Aero Suite roda no navegador e o servidor (Java) fica na nuvem ou na rede. Impressoras térmicas USB não aceitam PDF nem “Imprimir” do Chrome — elas exigem comandos PPLB em modo RAW no seu computador.',
  'thermalPrint.setup.why.javaTitle': 'Servidor Java (backend)',
  'thermalPrint.setup.why.javaBody':
    'Processa estoque, QR Code e regras de negócio. Não tem acesso ao USB da sua mesa por segurança e porque cada posto de trabalho tem uma impressora diferente.',
  'thermalPrint.setup.why.browserTitle': 'Navegador (Aero Suite)',
  'thermalPrint.setup.why.browserBody':
    'Por segurança, sites não podem enviar dados brutos à impressora. Por isso não dá para “falar” direto com a Elgin só abrindo o sistema.',
  'thermalPrint.setup.why.bridgeTitle': 'Print Bridge (no seu PC)',
  'thermalPrint.setup.why.bridgeBody':
    'Pequeno assistente local que recebe a etiqueta do Aero Suite (localhost) e envia PPLB em RAW para a impressora configurada. Instalação única por computador.',
  'thermalPrint.setup.diagram.browser': 'Navegador',
  'thermalPrint.setup.diagram.server': 'Servidor Java',
  'thermalPrint.setup.diagram.bridge': 'Print Bridge',
  'thermalPrint.setup.diagram.printer': 'Impressora térmica',
  'thermalPrint.setup.diagram.https': 'HTTPS / API',
  'thermalPrint.setup.diagram.local': 'localhost (só neste PC)',
  'thermalPrint.setup.diagram.raw': 'USB · PPLB RAW',
  'thermalPrint.setup.diagram.blocked': 'Sem acesso USB',
  'thermalPrint.setup.steps.title': 'Como instalar (cerca de 2 minutos)',
  'thermalPrint.setup.step1.title': 'Baixar o pacote',
  'thermalPrint.setup.step1.detail':
    'Clique em “Baixar instalador”. Será salvo um arquivo ZIP com o Print Bridge (Windows).',
  'thermalPrint.setup.step2.title': 'Extrair e instalar',
  'thermalPrint.setup.step2.detail':
    'Extraia o ZIP, abra a pasta e dê duplo clique em Instalar Print Bridge.bat. Aceite se o Windows pedir permissão.',
  'thermalPrint.setup.step3.title': 'Deixar ativo',
  'thermalPrint.setup.step3.detail':
    'O instalador coloca o bridge na inicialização do Windows. Mantenha a impressora ligada e conectada por USB.',
  'thermalPrint.setup.step4.title': 'Verificar e imprimir',
  'thermalPrint.setup.step4.detail':
    'Clique em “Testar conexão”. Com status verde, volte ao estoque e use Imprimir etiqueta normalmente.',
  'thermalPrint.setup.download': 'Baixar instalador (Windows)',
  'thermalPrint.setup.downloadHint': 'Arquivo: AeroSuite-PrintBridge.zip · Requer Windows 10 ou superior',
  'thermalPrint.setup.verify': 'Testar conexão',
  'thermalPrint.setup.verifyChecking': 'Verificando…',
  'thermalPrint.setup.verifyOk': 'Print Bridge ativo — pronto para imprimir etiquetas.',
  'thermalPrint.setup.verifyFail':
    'Print Bridge não respondeu. Confira se executou o .bat e se a impressora está ligada.',
  'thermalPrint.setup.close': 'Fechar',
  'thermalPrint.setup.noteWindows': 'Disponível apenas para Windows. Em outros sistemas use a impressão pelo navegador.',
  'thermalPrint.setup.learnMore': 'Impressora térmica',
  'estoque.layout.thermalPrint': 'Impressora térmica',
  'estoque.layout.thermalPrintTooltip': 'Instalar ou testar o Print Bridge para etiquetas PPLB',
  'thermalPrint.setup.httpsHint':
    'O sistema está em HTTPS: o navegador pode bloquear a ligação ao Print Bridge (HTTP local). Use o instalador abaixo; se a conexão falhar, aceda ao Aero Suite por HTTP na rede interna ou permita conteúdo misto para localhost.',
  'thermalPrint.setup.prefs.title': 'Modo padrão ao imprimir etiqueta',
  'thermalPrint.setup.prefs.browser': 'Navegador (impressora comum)',
  'thermalPrint.setup.prefs.auto': 'Automático (térmica se o bridge estiver ativo)',
  'thermalPrint.setup.prefs.thermal': 'Sempre térmica',
  'thermalPrint.setup.prefs.hint':
    'Quem não usa impressora térmica deve manter «Navegador». A opção térmica continua no menu ao lado do botão Imprimir.'
};

const EN: TranslationDictionary = {
  'thermalPrint.setup.title': 'Thermal label printing',
  'thermalPrint.setup.subtitle':
    'One-time Windows setup to print PPLB labels (Elgin L42 and similar) directly from Aero Suite.',
  'thermalPrint.setup.triggeredByPrint':
    'Thermal printing could not complete. Follow the steps below to enable automatic sending.',
  'thermalPrint.setup.why.title': 'Why isn’t this automatic like a normal printer?',
  'thermalPrint.setup.why.lead':
    'Aero Suite runs in the browser and the server (Java) is on the network or cloud. USB thermal printers do not accept PDF or Chrome “Print” — they need PPLB commands sent in RAW mode on your PC.',
  'thermalPrint.setup.why.javaTitle': 'Java server (backend)',
  'thermalPrint.setup.why.javaBody':
    'Handles inventory, QR codes, and business rules. It cannot access your desk USB for security and because each workstation has its own printer.',
  'thermalPrint.setup.why.browserTitle': 'Browser (Aero Suite)',
  'thermalPrint.setup.why.browserBody':
    'For security, websites cannot send raw data to printers. So the app cannot talk directly to the Elgin by itself.',
  'thermalPrint.setup.why.bridgeTitle': 'Print Bridge (on your PC)',
  'thermalPrint.setup.why.bridgeBody':
    'A small local helper that receives the label from Aero Suite (localhost) and sends PPLB RAW to the configured printer. One install per computer.',
  'thermalPrint.setup.diagram.browser': 'Browser',
  'thermalPrint.setup.diagram.server': 'Java server',
  'thermalPrint.setup.diagram.bridge': 'Print Bridge',
  'thermalPrint.setup.diagram.printer': 'Thermal printer',
  'thermalPrint.setup.diagram.https': 'HTTPS / API',
  'thermalPrint.setup.diagram.local': 'localhost (this PC only)',
  'thermalPrint.setup.diagram.raw': 'USB · PPLB RAW',
  'thermalPrint.setup.diagram.blocked': 'No USB access',
  'thermalPrint.setup.steps.title': 'How to install (about 2 minutes)',
  'thermalPrint.setup.step1.title': 'Download the package',
  'thermalPrint.setup.step1.detail':
    'Click “Download installer”. A ZIP file with Print Bridge (Windows) will be saved.',
  'thermalPrint.setup.step2.title': 'Extract and install',
  'thermalPrint.setup.step2.detail':
    'Extract the ZIP, open the folder, and double-click Install Print Bridge.bat. Allow if Windows prompts.',
  'thermalPrint.setup.step3.title': 'Keep it running',
  'thermalPrint.setup.step3.detail':
    'The installer adds the bridge to Windows startup. Keep the printer on and connected via USB.',
  'thermalPrint.setup.step4.title': 'Test and print',
  'thermalPrint.setup.step4.detail':
    'Click “Test connection”. With a green status, return to inventory and use Print label as usual.',
  'thermalPrint.setup.download': 'Download installer (Windows)',
  'thermalPrint.setup.downloadHint': 'File: AeroSuite-PrintBridge.zip · Requires Windows 10 or later',
  'thermalPrint.setup.verify': 'Test connection',
  'thermalPrint.setup.verifyChecking': 'Checking…',
  'thermalPrint.setup.verifyOk': 'Print Bridge is active — ready to print labels.',
  'thermalPrint.setup.verifyFail':
    'Print Bridge did not respond. Make sure you ran the .bat and the printer is on.',
  'thermalPrint.setup.close': 'Close',
  'thermalPrint.setup.noteWindows': 'Windows only. On other systems use browser printing.',
  'thermalPrint.setup.learnMore': 'Thermal printer',
  'estoque.layout.thermalPrint': 'Thermal printer',
  'estoque.layout.thermalPrintTooltip': 'Install or test Print Bridge for PPLB labels',
  'thermalPrint.setup.httpsHint':
    'The app uses HTTPS: the browser may block Print Bridge (local HTTP). Use the installer below; if the test fails, use Aero Suite over HTTP on your LAN or allow mixed content for localhost.',
  'thermalPrint.setup.prefs.title': 'Default mode when printing a label',
  'thermalPrint.setup.prefs.browser': 'Browser (standard printer)',
  'thermalPrint.setup.prefs.auto': 'Automatic (thermal if bridge is running)',
  'thermalPrint.setup.prefs.thermal': 'Always thermal',
  'thermalPrint.setup.prefs.hint':
    'Users without a thermal printer should keep «Browser». Thermal printing remains in the menu next to Print.'
};

const ES: TranslationDictionary = {
  'thermalPrint.setup.title': 'Impresión térmica de etiquetas',
  'thermalPrint.setup.subtitle':
    'Configuración única en Windows para imprimir etiquetas PPLB (Elgin L42 y similares) desde Aero Suite.',
  'thermalPrint.setup.triggeredByPrint':
    'No se pudo completar la impresión térmica. Siga los pasos para habilitar el envío automático.',
  'thermalPrint.setup.why.title': '¿Por qué no es automático como una impresora normal?',
  'thermalPrint.setup.why.lead':
    'Aero Suite se ejecuta en el navegador y el servidor (Java) está en la red o la nube. Las impresoras térmicas USB no aceptan PDF ni “Imprimir” de Chrome: requieren comandos PPLB en modo RAW en su PC.',
  'thermalPrint.setup.why.javaTitle': 'Servidor Java (backend)',
  'thermalPrint.setup.why.javaBody':
    'Gestiona inventario, códigos QR y reglas de negocio. No puede acceder al USB de su puesto por seguridad y porque cada equipo tiene su impresora.',
  'thermalPrint.setup.why.browserTitle': 'Navegador (Aero Suite)',
  'thermalPrint.setup.why.browserBody':
    'Por seguridad, los sitios no pueden enviar datos en bruto a la impresora. Por eso no puede hablar directamente con la Elgin solo abriendo el sistema.',
  'thermalPrint.setup.why.bridgeTitle': 'Print Bridge (en su PC)',
  'thermalPrint.setup.why.bridgeBody':
    'Asistente local que recibe la etiqueta de Aero Suite (localhost) y envía PPLB RAW a la impresora configurada. Una instalación por equipo.',
  'thermalPrint.setup.diagram.browser': 'Navegador',
  'thermalPrint.setup.diagram.server': 'Servidor Java',
  'thermalPrint.setup.diagram.bridge': 'Print Bridge',
  'thermalPrint.setup.diagram.printer': 'Impresora térmica',
  'thermalPrint.setup.diagram.https': 'HTTPS / API',
  'thermalPrint.setup.diagram.local': 'localhost (solo este PC)',
  'thermalPrint.setup.diagram.raw': 'USB · PPLB RAW',
  'thermalPrint.setup.diagram.blocked': 'Sin acceso USB',
  'thermalPrint.setup.steps.title': 'Cómo instalar (unos 2 minutos)',
  'thermalPrint.setup.step1.title': 'Descargar el paquete',
  'thermalPrint.setup.step1.detail':
    'Pulse “Descargar instalador”. Se guardará un ZIP con Print Bridge (Windows).',
  'thermalPrint.setup.step2.title': 'Extraer e instalar',
  'thermalPrint.setup.step2.detail':
    'Extraiga el ZIP, abra la carpeta y haga doble clic en Instalar Print Bridge.bat.',
  'thermalPrint.setup.step3.title': 'Mantener activo',
  'thermalPrint.setup.step3.detail':
    'El instalador añade el bridge al inicio de Windows. Mantenga la impresora encendida y conectada por USB.',
  'thermalPrint.setup.step4.title': 'Verificar e imprimir',
  'thermalPrint.setup.step4.detail':
    'Pulse “Probar conexión”. Con estado verde, vuelva al inventario e imprima la etiqueta.',
  'thermalPrint.setup.download': 'Descargar instalador (Windows)',
  'thermalPrint.setup.downloadHint': 'Archivo: AeroSuite-PrintBridge.zip · Windows 10 o superior',
  'thermalPrint.setup.verify': 'Probar conexión',
  'thermalPrint.setup.verifyChecking': 'Comprobando…',
  'thermalPrint.setup.verifyOk': 'Print Bridge activo — listo para imprimir.',
  'thermalPrint.setup.verifyFail':
    'Print Bridge no respondió. Compruebe que ejecutó el .bat y que la impresora está encendida.',
  'thermalPrint.setup.close': 'Cerrar',
  'thermalPrint.setup.noteWindows': 'Solo Windows. En otros sistemas use la impresión del navegador.',
  'thermalPrint.setup.learnMore': 'Impresora térmica',
  'estoque.layout.thermalPrint': 'Impresora térmica',
  'estoque.layout.thermalPrintTooltip': 'Instalar o probar Print Bridge para etiquetas PPLB',
  'thermalPrint.setup.httpsHint':
    'La aplicación usa HTTPS: el navegador puede bloquear Print Bridge (HTTP local). Use el instalador; si falla la prueba, acceda por HTTP en la red interna o permita contenido mixto para localhost.',
  'thermalPrint.setup.prefs.title': 'Modo predeterminado al imprimir etiqueta',
  'thermalPrint.setup.prefs.browser': 'Navegador (impresora común)',
  'thermalPrint.setup.prefs.auto': 'Automático (térmica si el bridge está activo)',
  'thermalPrint.setup.prefs.thermal': 'Siempre térmica',
  'thermalPrint.setup.prefs.hint':
    'Quien no use impresora térmica debe dejar «Navegador». La opción térmica sigue en el menú junto a Imprimir.'
};

const FR: TranslationDictionary = {
  'thermalPrint.setup.title': 'Impression thermique d’étiquettes',
  'thermalPrint.setup.subtitle':
    'Configuration unique sous Windows pour imprimer des étiquettes PPLB (Elgin L42, etc.) depuis Aero Suite.',
  'thermalPrint.setup.triggeredByPrint':
    'L’impression thermique n’a pas abouti. Suivez les étapes ci-dessous pour activer l’envoi automatique.',
  'thermalPrint.setup.why.title': 'Pourquoi ce n’est pas automatique comme une imprimante classique ?',
  'thermalPrint.setup.why.lead':
    'Aero Suite s’exécute dans le navigateur et le serveur (Java) est sur le réseau ou dans le cloud. Les imprimantes thermiques USB n’acceptent pas le PDF ni « Imprimer » de Chrome — elles exigent des commandes PPLB en mode RAW sur votre PC.',
  'thermalPrint.setup.why.javaTitle': 'Serveur Java (backend)',
  'thermalPrint.setup.why.javaBody':
    'Gère le stock, les QR codes et les règles métier. Il n’a pas accès à l’USB de votre poste pour des raisons de sécurité et parce que chaque poste a sa propre imprimante.',
  'thermalPrint.setup.why.browserTitle': 'Navigateur (Aero Suite)',
  'thermalPrint.setup.why.browserBody':
    'Pour la sécurité, les sites ne peuvent pas envoyer de données brutes à l’imprimante. L’application ne peut donc pas parler directement à l’Elgin.',
  'thermalPrint.setup.why.bridgeTitle': 'Print Bridge (sur votre PC)',
  'thermalPrint.setup.why.bridgeBody':
    'Petit assistant local qui reçoit l’étiquette d’Aero Suite (localhost) et envoie le PPLB RAW à l’imprimante configurée. Une installation par ordinateur.',
  'thermalPrint.setup.diagram.browser': 'Navigateur',
  'thermalPrint.setup.diagram.server': 'Serveur Java',
  'thermalPrint.setup.diagram.bridge': 'Print Bridge',
  'thermalPrint.setup.diagram.printer': 'Imprimante thermique',
  'thermalPrint.setup.diagram.https': 'HTTPS / API',
  'thermalPrint.setup.diagram.local': 'localhost (ce PC uniquement)',
  'thermalPrint.setup.diagram.raw': 'USB · PPLB RAW',
  'thermalPrint.setup.diagram.blocked': 'Pas d’accès USB',
  'thermalPrint.setup.steps.title': 'Installation (environ 2 minutes)',
  'thermalPrint.setup.step1.title': 'Télécharger le pack',
  'thermalPrint.setup.step1.detail':
    'Cliquez sur « Télécharger l’installateur ». Un fichier ZIP avec Print Bridge (Windows) sera enregistré.',
  'thermalPrint.setup.step2.title': 'Extraire et installer',
  'thermalPrint.setup.step2.detail':
    'Extrayez le ZIP, ouvrez le dossier et double-cliquez sur Instalar Print Bridge.bat.',
  'thermalPrint.setup.step3.title': 'Laisser actif',
  'thermalPrint.setup.step3.detail':
    'L’installateur ajoute le bridge au démarrage de Windows. Gardez l’imprimante allumée et branchée en USB.',
  'thermalPrint.setup.step4.title': 'Vérifier et imprimer',
  'thermalPrint.setup.step4.detail':
    'Cliquez sur « Tester la connexion ». Statut vert : retournez au stock et imprimez l’étiquette.',
  'thermalPrint.setup.download': 'Télécharger l’installateur (Windows)',
  'thermalPrint.setup.downloadHint': 'Fichier : AeroSuite-PrintBridge.zip · Windows 10 ou plus',
  'thermalPrint.setup.verify': 'Tester la connexion',
  'thermalPrint.setup.verifyChecking': 'Vérification…',
  'thermalPrint.setup.verifyOk': 'Print Bridge actif — prêt à imprimer.',
  'thermalPrint.setup.verifyFail':
    'Print Bridge ne répond pas. Vérifiez que vous avez exécuté le .bat et que l’imprimante est allumée.',
  'thermalPrint.setup.close': 'Fermer',
  'thermalPrint.setup.noteWindows': 'Windows uniquement. Sinon, utilisez l’impression navigateur.',
  'thermalPrint.setup.learnMore': 'Imprimante thermique',
  'estoque.layout.thermalPrint': 'Imprimante thermique',
  'estoque.layout.thermalPrintTooltip': 'Installer ou tester Print Bridge pour étiquettes PPLB',
  'thermalPrint.setup.httpsHint':
    'L’application est en HTTPS : le navigateur peut bloquer Print Bridge (HTTP local). Utilisez l’installateur ; en cas d’échec du test, accédez en HTTP sur le réseau interne ou autorisez le contenu mixte pour localhost.',
  'thermalPrint.setup.prefs.title': 'Mode par défaut à l’impression d’étiquette',
  'thermalPrint.setup.prefs.browser': 'Navigateur (imprimante standard)',
  'thermalPrint.setup.prefs.auto': 'Automatique (thermique si le bridge est actif)',
  'thermalPrint.setup.prefs.thermal': 'Toujours thermique',
  'thermalPrint.setup.prefs.hint':
    'Sans imprimante thermique, gardez « Navigateur ». L’option thermique reste dans le menu à côté d’Imprimer.'
};

export const THERMAL_PRINT_SETUP_PT_BR = PT;
export const THERMAL_PRINT_SETUP_EN_US = EN;
export const THERMAL_PRINT_SETUP_ES_ES = ES;
export const THERMAL_PRINT_SETUP_FR_FR = FR;
