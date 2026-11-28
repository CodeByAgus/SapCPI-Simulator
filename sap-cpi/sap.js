(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const clone = o => JSON.parse(JSON.stringify(o));
const short = (s, n = 80) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n) + '…' : s; };

/* ---------------- Íconos ---------------- */
const IC = {
  router: '<path d="M4 12h5M9 12l6-7h5M9 12h11M9 12l6 7h5"/>',
  http: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17"/>',
  sheets: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 10h16M4 15h16M10 4v16"/>',
  arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  code: '<path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/>',
  doc: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  check: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
};
const svg = (k, cls = '') => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${IC[k] || IC.arrow}</svg>`;

/* ---------------- Datos del usuario (en Supabase si está configurado; si no, en este navegador) ---------------- */
const KEY = 'flowdev-v1';
const blank = () => ({ progress: {}, flows: {}, quiz: {}, free: {} });
let db = { users: {}, session: null, guest: blank() };
try { const raw = localStorage.getItem(KEY); if (raw) db = { ...db, ...JSON.parse(raw) }; } catch (_) {}
/* Cuentas en Supabase: si config.js tiene url y anonKey, el avance de cada usuario se guarda en la tabla progress */
const SBC = window.FLOWDEV_SUPABASE || {}, sb = SBC.url && SBC.anonKey && window.supabase ? window.supabase.createClient(SBC.url, SBC.anonKey) : null;
let cloud = null, syncT = null;
const pick = o => ({ progress: o.progress || {}, flows: o.flows || {}, quiz: o.quiz || {}, free: o.free || {} });
const merge = (a, b) => ({ progress: { ...a.progress, ...b.progress }, flows: { ...a.flows, ...b.flows }, quiz: { ...a.quiz, ...b.quiz }, free: { ...a.free, ...b.free } });
async function pushCloud() {
  if (!sb || !cloud) return;
  const { error } = await sb.from('progress').upsert({ user_id: cloud.id, data: pick(cloud), updated_at: new Date().toISOString() });
  if (error) toast('No se pudo guardar el avance en la nube: ' + error.message);
}
const persist = () => {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (_) {}
  if (cloud) { clearTimeout(syncT); syncT = setTimeout(pushCloud, 800); }
};
async function loadCloud(user) {
  const { data: row, error } = await sb.from('progress').select('data').eq('user_id', user.id).maybeSingle();
  if (error) { toast('No se pudo leer tu avance: ' + error.message); return; }
  const remote = pick(row?.data || {}), local = pick(db.guest);
  cloud = { id: user.id, email: user.email, name: user.user_metadata?.name || user.user_metadata?.full_name || user.email.split('@')[0], ...merge(remote, local) };
  db.guest = blank(); db.session = null;
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (_) {}
  if (Object.keys(local.progress).length || !row) await pushCloud();
}
const me = () => cloud || (!sb && db.session && db.users[db.session]) || null;
const data = () => me() || db.guest;
const mark = k => { if (!data().progress[k]) { data().progress[k] = true; persist(); } };

/* ---------------- Vista: introducción a SAP CPI (el editor de iFlows vive en taller.html) ---------------- */
const SAP = { href: 'taller.html' };
const state = { tab: 'lecciones' };
const view = $('#view');
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2800); }

// Inicio, Power Automate, Mi avance y la cuenta viven en otras páginas de flowDev
const HOME = '../index.html';
function renderNav() {
  const links = [[HOME, 'Inicio'], ['../conexiones/index.html', 'Conexiones'], [null, 'SAP CPI'], ['../power-automate/index.html', 'Power Automate'], ['../claude-code/index.html', 'Claude Code'], [HOME + '#avance', 'Mi avance']];
  $('#navLinks').innerHTML = links.map(([href, l]) => href ? `<a href="${href}">${l}</a>` : `<button type="button" data-tab="lecciones" aria-current="page">${l}</button>`).join('');
  const u = me();
  $('#navUser').innerHTML = u
    ? `<span class="chip"><i>${esc(u.name.trim()[0]?.toUpperCase() || '?')}</i>${esc(u.name.split(' ')[0])}</span><button type="button" class="btn line sm" data-act="logout">Salir</button>`
    : `<a class="btn line sm" href="${HOME}#ingreso">Ingresar</a><a class="btn sky sm" href="${HOME}#registro">Crear cuenta</a>`;
}

/* Sin cuenta: solo las primeras 3 clases de teoría y los primeros 2 cuestionarios de cada plataforma */
const FREE_LES = 3, FREE_QZ = 2;
const guest = () => !me();
const lockRow = (pill, title, what) => `<button type="button" class="list-item locked" data-auth="registro" aria-label="${esc(title)}: creá una cuenta para ver ${what === 'clase' ? 'esta clase' : 'este cuestionario'}"><span class="pill">${esc(pill)}</span><span class="grow"><span class="h3">${esc(title)}</span><br><span class="dim">Creá una cuenta gratis para ver ${what === 'clase' ? 'esta clase' : 'este cuestionario'}.</span></span><span class="pill fill">Con cuenta</span></button>`;
const guestNote = what => (guest() ? `<p class="note guest-note">Sin cuenta podés ver ${what === 'clase' ? `${FREE_LES} clases` : `${FREE_QZ} cuestionarios`}. <button type="button" class="linkbtn" data-auth="registro">Creá una cuenta gratis</button> para ver todo y guardar tu avance.</p>` : '');

const SAP_INTRO = 'SAP Cloud Integration (CPI) es la herramienta de SAP Integration Suite para conectar sistemas SAP y no SAP. Las integraciones se modelan como iFlows en notación BPMN: un mensaje entra por un adaptador, se transforma, se enruta y sale hacia uno o más sistemas.';
const SAP_SCEN = [
  ['b-001', 'Clase 4', 'Ejercicio_001: creación de iFlow y controles básicos', 'HTTPS, Content Modifier y Send a un SFTP.'],
  ['b-001b', 'Clase 4', 'Ejercicio_001, segundo escenario: encriptado PGP', 'El mismo iFlow, con PGP Encryptor.'],
  ['b-002', 'Clase 4', 'Ejercicio_002: SFTP con desencriptación PGP y persistencia', 'SFTP Sender, PGP Decryptor y Data Store.'],
  ['b-003', 'Clase 5', 'Ejercicio_003: enrutamiento, transformación y paralelo', 'Router, Message Mapping, XML a JSON y Multicast.'],
  ['b-004', 'Clase 8', 'Ejercicio_004: consumo de una cola por AMQP', 'Event Mesh, Data Store y Request Reply.'],
  ['b-odata', 'Clase 10', 'Ejercicio_004: consumo dinámico de OData', 'Adaptador OData con parámetros de la URL.'],
  ['b-006', 'Clase 11', 'Ejercicio_006: envío de un IDoc al backend', 'Mapping a DEBMAS06 y HTTP On-Premise.'],
  ['b-007', 'Clase 12', 'Ejercicio_007: consumo de una función RFC', 'JSON a XML, Mapping y adaptador RFC.'],
  ['b-008', 'Clase 13', 'Ejercicio_008: consumo de un Web Service SOAP', 'Local Integration Process y Exception Subprocess.'],
  ['b-009', 'Clase 14', 'Ejercicio_009: procesamiento de archivos SFTP', 'Iterating Splitter, Process Call y Data Store.'],
  ['b-010', 'Clase 15', 'Ejercicio_010: Open Connectors', 'Consumo de una app de terceros con un conector.'],
];
const SAP_EXTRA = [['hola', 'Hola mundo por HTTPS'], ['json-xml', 'Pedido JSON a XML por SFTP'], ['router', 'Enrutar pedidos por país'], ['filter', 'Filtrar productos con stock'], ['groovy', 'Normalizar un cliente con Groovy'], ['enrich', 'Enriquecer un pedido con OData'], ['split', 'Procesar ítems uno por uno'], ['errores', 'Responder con un error controlado'], ['mapping', 'Mapear un pedido al formato del ERP']];
const SAP_QUIZ = ['Servicios, suscripciones e Integración', 'Entornos y Automatización', 'Seguridad y gestión', 'Cloud Integration (Fundamentos y Modelado)', 'Lógica Avanzada y Troubleshooting', 'API Management (Ciclo de Vida y Seguridad)', 'SAP Graph y Developer Portal', 'Event Mesh y arquitecturas desacopladas', 'Assessment y Estrategias de Migración', 'OData y Consumo de Servicios', 'ALE e IDocs', 'RFC, BAPIs y Módulos Remotos', 'SOAP y SOAMANAGER', 'Gestión de Archivos y SFTPs Externos', 'Open Connectors', 'APIs y herramientas (Parte I)', 'APIs y herramientas (Parte II)', 'Formatos y parsing', 'Extensión (Groovy)', 'Seguridad, conectividad y panorama'];
// 20 clases de teoría de SAP CPI: una por cuestionario, con todo lo necesario para responderlo
const SAP_LESSONS = [
  ['Servicios, suscripciones e Integración', [
    '<p>Antes de construir el primer iFlow hay que entender cómo se organiza <b>SAP BTP</b> (Business Technology Platform).</p>',
    '<ul><li>El <b>global account</b> es la raíz del contrato con SAP. Los <b>directories</b> solo agrupan.</li><li>El <b>subaccount</b> es la <b>unidad operativa clave</b>: ahí se habilitan y usan la mayoría de los servicios, como Integration Suite.</li><li>Para usar un servicio dentro de un subaccount tienen que estar asignados sus <b>entitlements</b> (derechos de uso). Después se administra desde el <b>cockpit</b>.</li></ul>',
    '<p>La <b>región</b> que se elige al crear el subaccount no es un detalle: impacta la <b>latencia</b>, la <b>residencia de los datos</b> y qué <b>servicios están disponibles</b>.</p>',
    '<p>El modelo comercial también condiciona el diseño y la operación. La clase compara dos modelos de consumo: <b>CPEA</b> (créditos prepagos) y <b>Pay-As-You-Go</b> (pago por uso).</p>'
  ]],
  ['Entornos y Automatización', [
    '<p>SAP BTP ofrece tres <b>entornos de ejecución</b>, y el correcto depende del tipo de solución:</p>',
    '<ul><li><b>Cloud Foundry</b>: la puerta de entrada habitual.</li><li><b>Kyma</b>: microservicios y contenedores sobre Kubernetes.</li><li><b>ABAP</b>: extensiones en ABAP en la nube.</li></ul>',
    '<p>Para trabajar con Integration Suite hacen falta varias piezas:</p>',
    '<ul><li>La <b>suscripción</b> habilita el acceso inicial a la aplicación.</li><li>Las <b>role collections</b> dan permisos. Si un usuario ve errores de autorización al entrar a Integration Suite, lo primero es revisar que tenga asignada la <b>role collection correspondiente</b>: suscripción y roles van juntos.</li><li>Una <b>service instance</b> materializa una capacidad concreta del servicio, por ejemplo el acceso técnico a Integration Suite.</li><li>Una <b>service key</b> genera las credenciales técnicas (ClientId y ClientSecret). <b>Habilitan acceso técnico y requieren manejo seguro</b>: nunca se exponen ni se dejan en el código.</li></ul>'
  ]],
  ['Seguridad y gestión', [
    '<p>La seguridad de un endpoint empieza por tres cosas: <b>identidad</b>, <b>autorización</b> y la <b>política</b> aplicable.</p>',
    '<ul><li>Para escenarios <b>system-to-system con autenticación mutua</b> conviene el <b>client certificate</b> (certificado de cliente): autentica a ambas partes. La autenticación Basic queda para casos simples o transitorios.</li><li>En el adaptador HTTPS, el <b>User Role</b> (por ejemplo <code>ESB_taller.send</code>) controla <b>qué usuarios pueden llamar al endpoint</b>: es la autorización a nivel endpoint.</li></ul>',
    '<p>El material sensible se centraliza en <b>Security Material / Keystore</b>: credenciales, claves y known hosts. Centralizarlo evita la dispersión, y las credenciales reutilizables evitan duplicarlas entre iFlows.</p>',
    '<p>Con SFTP, improvisar con los <b>Known Hosts (SSH)</b> tiene un riesgo claro: <b>aceptar hosts sin verificar su identidad</b>. Por eso la host key se obtiene con un Connectivity Test y se registra como Known Host.</p>',
    '<p>Los <b>logs</b> y el <b>deploy status</b> son la evidencia mínima para diagnosticar y auditar.</p>'
  ]],
  ['Cloud Integration (Fundamentos y Modelado)', [
    '<p>En BTP, la integración se centraliza en <b>iFlows</b>, que se dibujan con la notación <b>BPMN</b>: pools, eventos, actividades y flujos de mensaje. Un mensaje entra por un Sender, pasa por pasos que lo transforman y sale hacia uno o más Receivers.</p>',
    '<ul><li>Para exponer un <b>servicio síncrono</b> que se pueda llamar desde Postman se usa el <b>adaptador HTTPS en el Sender</b>. Por eso los primeros ejercicios arrancan así.</li><li>El ruteo y la lógica se apoyan en metadatos: <b>Headers</b> y <b>Exchange Properties</b>.</li></ul>',
    '<p>La diferencia entre ambos es clave: <b>el header viaja a los receptores; la property vive solo durante la ejecución del iFlow</b>. Es una variable de memoria interna.</p>',
    '<p>El <b>MPL (Message Processing Log)</b> registra el historial técnico de cada ejecución y permite validar el flujo paso a paso.</p>'
  ]],
  ['Lógica Avanzada y Troubleshooting', [
    '<ul><li>El <b>Message Mapping</b> resuelve transformaciones complejas entre estructuras. Cuando las funciones estándar no alcanzan, se agrega una <b>UDF</b> (User Defined Function): una función propia en Java o Groovy dentro del mapping.</li><li>El <b>Router</b> decide la ruta según el contenido: evalúa sus condiciones <b>con XPath sobre el contenido o con expresiones sobre headers y properties</b>. Por ejemplo, <code>//Credential</code>.</li><li><b>Multicast</b> envía el mismo mensaje a varios sistemas. El <b>paralelo</b> manda todo a la vez; el <b>secuencial</b> conviene <b>cuando hay dependencias entre las ramas y el orden importa</b>.</li></ul>',
    '<p>El <b>Exception Subprocess</b> es el bloque de control de errores: se activa ante una falla para <b>capturar errores técnicos y responder de forma controlada</b>.</p>'
  ]],
  ['API Management (Ciclo de Vida y Seguridad)', [
    '<p><b>API Management</b> es la capa frontera: actúa como firewall de aplicación y como capa de gobierno de las APIs.</p>',
    '<ul><li>Un <b>API Proxy</b> es <b>una capa virtual sobre un servicio real que agrega seguridad, control de tráfico y visibilidad</b>. Desacopla a los consumidores del backend.</li><li>Un <b>API Provider</b> define de dónde salen los servicios. Para exponer iFlows se crea un provider de tipo <b>Cloud Integration</b>, con puerto 443 y el ClientId/ClientSecret de la service key.</li><li>Las <b>políticas</b> (Spike Arrest, OAuth, Quota) protegen los activos.</li><li>Un <b>KVM (Key Value Map)</b> guarda <b>configuraciones dinámicas, como credenciales, sin volver a desplegar</b>.</li></ul>',
    '<p>Al probar un proxy, los errores orientan el diagnóstico: con <b>401</b> hay que revisar las credenciales; con <b>403</b>, la guía indica revisar <b>que el iFlow tenga deshabilitada la protección CSRF</b>.</p>'
  ]],
  ['SAP Graph y Developer Portal', [
    '<p>API Management y SAP Graph ocultan la complejidad técnica detrás de una capa segura y monitoreada. Hay que asegurar quién consume (OAuth, API Key), medir el uso y poder monetizarlo.</p>',
    '<ul><li><b>Spike Arrest</b> suaviza picos: <code>&lt;Rate&gt;5pm&lt;/Rate&gt;</code> limita a <b>5 requests por minuto</b> ("pm" = per minute).</li><li><b>Quota</b> limita el consumo en una ventana de tiempo: <code>Allow count="10"</code> con <code>TimeUnit</code> hour permite <b>10 requests por hora</b>.</li><li><b>VerifyAPIKey</b> con <code>&lt;APIKey ref="request.header.apikey"/&gt;</code> espera la key <b>en el header <code>apikey</code> del request</b>.</li></ul>',
    '<p>En el <b>Developer Hub</b>, un <b>Product agrupa APIs para que las aplicaciones se suscriban y obtengan una key</b>.</p>',
    '<p><b>SAP Graph</b> es <b>una capa de consumo unificada para acceder a datos de varios sistemas SAP en un solo endpoint</b> (S/4HANA, SuccessFactors y otros) con un único modelo.</p>'
  ]],
  ['Event Mesh y arquitecturas desacopladas', [
    '<p><b>Event Mesh</b> permite arquitecturas reactivas: los sistemas se desacoplan y se comunican con eventos en lugar de llamarse directamente.</p>',
    '<ul><li>En el modelo <b>Pub/Sub</b>, <b>el emisor publica en un tópico y el Mesh lo distribuye a todas las colas suscriptas</b>.</li><li>Una <b>cola</b> garantiza <b>que el mensaje no se pierda si el sistema destino está caído</b>: el mensaje persiste hasta el acuse de recibo.</li><li>Una <b>Dead Letter Queue</b> guarda <b>los mensajes que no pudieron procesarse</b>, para analizarlos y reprocesarlos.</li><li>Los Business Events reducen la carga de red frente al polling.</li></ul>',
    '<p>Protocolos: <b>AMQP</b> es el protocolo avanzado de encolado; <b>MQTT</b> es el liviano, ideal para <b>IoT y baja latencia</b>.</p>'
  ]],
  ['Assessment y Estrategias de Migración', [
    '<p>Migrar de SAP PI/PO a Integration Suite requiere método:</p>',
    '<ul><li><b>ISA-M</b> (Integration Solution Advisory Methodology) <b>guía la selección de herramientas de integración según el caso de uso</b>.</li><li>El <b>Migration Assessment analiza automáticamente las interfaces existentes de SAP PI/PO</b> para estimar complejidad y priorizar.</li><li>Un <b>Gap Analysis</b> consiste en <b>identificar diferencias entre el sistema origen y el destino antes de migrar</b>: hay funciones de PI/PO sin equivalente nativo en la nube.</li><li>El <b>roadmap</b> conviene hacerlo <b>de forma gradual, empezando por interfaces de baja criticidad</b>: reduce el riesgo mientras el equipo gana experiencia.</li></ul>'
  ]],
  ['OData y Consumo de Servicios', [
    '<p><b>OData</b> es <b>un estándar basado en REST que agrega semántica a los datos y permite operaciones CRUD estandarizadas</b>. Por eso se lo llama "el SQL de la web", y es la base de SAP Fiori.</p>',
    '<ul><li><code>$top=5</code> devuelve <b>como máximo 5 registros</b>.</li><li><code>$filter</code> y <code>$select</code> <b>reducen el volumen de datos y mejoran el rendimiento</b>: filtrar en origen evita traer datos para descartarlos en el iFlow.</li><li>En el adaptador OData, poner <code>${header.CamelHttpQuery}</code> en Query Options sirve <b>para trasladar los parámetros de la URL de entrada a la consulta OData</b>. CamelHttpQuery contiene todo lo que viene después del "?".</li></ul>'
  ]],
  ['ALE e IDocs', [
    '<p><b>ALE</b> permite intercambiar datos entre sistemas SAP mediante <b>IDocs</b>, que garantizan persistencia y registran su status. Es el puente tradicional con sistemas legacy y on-premise.</p>',
    '<ul><li><b>BD64</b>: se arma el <b>modelo de distribución</b> ("centro de control").</li><li><b>WE20</b>: se configuran los <b>perfiles de interlocutor</b> ("contrato técnico").</li><li><b>WE21</b>: se configuran los <b>puertos</b>, que usan destinos RFC creados en SM59.</li><li><b>WE02</b> y <b>BD87</b>: <b>monitorear y reprocesar IDocs</b> ("semáforo del negocio").</li></ul>',
    '<p>En la guía, el IDoc XML se envía al servicio <b>/sap/bc/idoc_xml por HTTP POST</b>, con el adaptador HTTP y Proxy On-Premise.</p>'
  ]],
  ['RFC, BAPIs y Módulos Remotos', [
    '<ul><li><b>RFC</b> (Remote Function Call) es <b>el protocolo estándar de SAP para llamar funciones en otro sistema</b>.</li><li>Una <b>BAPI</b> es <b>una función estándar de SAP con interfaz estable sobre un objeto de negocio</b>: el "estándar inmutable".</li><li>Los destinos RFC se administran en <b>SM59</b>, también clave para la auditoría de seguridad.</li></ul>',
    '<p>Para llamar una RFC on-premise, CPI necesita <b>el adaptador RFC y un Destination que llega por Cloud Connector</b> (en la guía, <code>ERP_RFC_DEST</code>).</p>',
    '<p>El paradigma <b>Clean Core</b> recomienda <b>preferir APIs estándar y minimizar los desarrollos Z</b> (como las Z-BAPIs): menos código propio facilita las actualizaciones.</p>'
  ]],
  ['SOAP y SOAMANAGER', [
    '<p><b>SOAMANAGER</b> es la consola del backend ABAP para <b>configurar y publicar web services SOAP</b>.</p>',
    '<ul><li>Las credenciales de los adaptadores van <b>en el Keystore / Security Material, nunca hardcodeadas</b>.</li><li>Los <b>timeouts estrictos</b> en el HTTP Receiver sirven <b>para evitar bloqueos cuando un servicio responde lento</b>.</li><li>Los <b>rate limits</b> de un proveedor se manejan <b>con paginación y reintentos controlados</b>, para no saturarlo.</li><li>Los errores se manejan siempre de forma sistemática.</li></ul>',
    '<p>Las respuestas SOAP traen prefijos de namespace. En XPath, <code>//*:sName</code> significa <b>buscar sName en cualquier namespace</b>: el <code>*:</code> ignora el prefijo.</p>',
    '<p>OData aporta uniformidad semántica en el ecosistema SAP, y HTTP con OAuth 2.0 permite conectarse a casi cualquier servicio en la nube.</p>'
  ]],
  ['Gestión de Archivos y SFTPs Externos', [
    '<p><b>SFTP</b> funciona sobre <b>SSH</b>. Por eso se registran <b>Known Hosts</b>, que sirven <b>para confirmar la identidad del servidor SFTP (su host key)</b>: el tenant solo se conecta a hosts conocidos. Junto con PGP, este control criptográfico es lo que permite superar auditorías.</p>',
    '<ul><li>El <b>polling</b> define cada cuánto se buscan archivos nuevos.</li><li>El <b>Post-Processing</b> del SFTP Sender permite <b>archivar, mover o borrar el archivo para no reprocesarlo</b>.</li><li>Los archivos muy grandes se procesan <b>troceándolos con splitter y streaming</b>, sin agotar memoria.</li></ul>'
  ]],
  ['Open Connectors', [
    '<p><b>Open Connectors</b> ofrece <b>más de 160 conectores pre-construidos</b> para apps que no son de SAP, bajo una interfaz REST normalizada. (Las más de 3.000 APIs son las del Business Accelerator Hub, no conectores.)</p>',
    '<ul><li>Una <b>Instance</b> es <b>la conexión autenticada y persistente con una app de terceros</b>; por ejemplo, BambooHR con CompanyName y API Key.</li><li>En el tenant, la credencial de tipo Open Connectors se forma con <b>User, Organization y Element</b> (el token de la instancia), que se obtienen desde API Docs.</li><li>La estrategia <b>"Validate First"</b> plantea <b>probar el endpoint en API Docs antes de consumirlo desde CPI</b>, para no depurar dos cosas a la vez.</li></ul>'
  ]],
  ['APIs y herramientas (Parte I)', [
    '<p><b>REST</b> es stateless, se basa en HTTP y se orienta a recursos. Cada verbo tiene un significado preciso: <b>GET lee, POST crea, PUT/PATCH actualiza y DELETE elimina</b>.</p>',
    '<ul><li><b>Postman</b> es la herramienta estándar para REST: organiza requests en Colecciones y Entornos.</li><li><b>SoapUI</b> se usa <b>para servicios SOAP/WSDL con Assertions sobre la respuesta</b>.</li><li><b>Newman</b> sirve <b>para ejecutar colecciones de Postman por línea de comandos</b> (pruebas de regresión e integración continua).</li></ul>',
    '<p>Códigos de error: <b>401</b> = falta una autenticación válida; <b>403</b> = la autenticación es válida pero no hay permiso.</p>'
  ]],
  ['APIs y herramientas (Parte II)', [
    '<p>El <b>SAP Business Accelerator Hub</b> (<code>api.sap.com</code>) es <b>el repositorio oficial de APIs, Integration Packages y artefactos de SAP</b>, con más de 3.000 APIs.</p>',
    '<ul><li>Su <b>sandbox</b> sirve <b>para probar endpoints sin credenciales propias</b>, ideal para explorar el contrato antes de pedir accesos.</li><li>El estado de cada API (<b>Beta, GA o Deprecated</b>) importa <b>porque afecta decisiones de arquitectura en proyectos productivos</b>: una API deprecada no debería entrar en un diseño nuevo.</li><li>La diferencia con una API: <b>un Integration Package trae contenido de integración listo para desplegar en CPI</b>. Adaptarlo suele ser más rápido que construir desde cero.</li></ul>'
  ]],
  ['Formatos y parsing', [
    '<p><b>XML</b> domina en SAP legacy (IDoc, SOAP, BAPI) y <b>JSON</b> en las APIs REST modernas. <b>XPath</b> es esencial en Routers, Content Modifiers y Mappings.</p>',
    '<ul><li>Si un XPath no considera el <b>namespace</b> del XML, <b>devuelve vacío sin dar error</b>: es el error silencioso más frecuente.</li><li><code>local-name()</code> sirve <b>para seleccionar por nombre sin importar el namespace</b> (equivale a <code>*:</code>).</li><li><code>count(/Pedido/Item)</code> cuenta nodos: para <code>&lt;Pedido&gt;&lt;Item/&gt;&lt;Item/&gt;&lt;/Pedido&gt;</code> devuelve <b>2</b>.</li><li>Conviene evitar <code>//</code> en documentos grandes <b>porque hace una búsqueda recursiva que impacta el rendimiento</b>; mejor rutas explícitas.</li></ul>'
  ]],
  ['Extensión (Groovy)', [
    '<p>Groovy es un bisturí: se usa solo cuando los componentes visuales no alcanzan.</p>',
    '<pre>import com.sap.gateway.ip.core.customdev.util.Message\n\ndef Message processData(Message message) {\n    // body, headers, properties y attachments\n    return message\n}</pre>',
    '<ul><li>La firma es <b><code>def Message processData(Message message) { … return message }</code></b>.</li><li>Para registrar información de debugging se usa <b><code>messageLogFactory</code></b>: <code>println</code> no queda en el MPL.</li><li>Los datos que no deben viajar al receptor se guardan <b>en properties (<code>setProperty</code>), no en headers</b>.</li><li>Para que el Exception Subprocess capture un error, hay que <b>manejarlo con try-catch, registrarlo y lanzar una Exception</b>. Si el script se traga el error, nadie lo ve.</li><li>Nunca hardcodear URLs ni credenciales: usar parámetros externalizados.</li></ul>'
  ]],
  ['Seguridad, conectividad y panorama', [
    '<ul><li>El esquema estándar para integraciones sistema-a-sistema en BTP es <b>OAuth 2.0 Client Credentials</b>: no requiere intervención humana.</li><li><b>mTLS</b> agrega <b>autenticación bidireccional con certificados digitales</b>: es el nivel más alto de seguridad en CPI.</li><li><b>SAP Cloud Connector</b> sirve <b>para crear un túnel seguro entre BTP y sistemas on-premise sin exponerlos a internet</b>. Es lo que hay detrás de Proxy Type On-Premise.</li></ul>',
    '<p>Monitoreo: <b>CALM</b> es el monitoreo centralizado en la nube, y <b>SAP AIF</b> monitorea interfaces en sistemas SAP on-premise (ECC, S/4HANA on-premise).</p>'
  ]],
];
const sapDone = () => { try { return JSON.parse(localStorage.getItem('taller-iflows-v1') || '{}').done || {}; } catch (_) { return {}; } };
function sap() {
  const tab = state.tab, pr = data().progress, done = sapSolved(), href = id => `${SAP.href}#${id}`;
  const total = SAP_SCEN.length + SAP_EXTRA.length + SAP_QUIZ.length, n = [...SAP_SCEN.map(s => s[0]), ...SAP_EXTRA.map(s => s[0]), ...SAP_QUIZ.map((_, i) => `q-c${i + 1}`)].filter(id => done[id]).length;
  const link = (id, pill, title, sub) => `<a class="list-item" href="${href(id)}"><span class="pill${done[id] ? ' ok' : ''}">${done[id] ? 'Resuelto' : esc(pill)}</span><span class="grow"><span class="h3">${esc(title)}</span>${sub ? `<br><span class="dim">${esc(sub)}</span>` : ''}</span><span class="arrow">${svg('arrow')}</span></a>`;
  let body = '';
  if (tab === 'lecciones') body = guestNote('clase') + SAP_LESSONS.map(([t, parts], i) => guest() && i >= FREE_LES ? lockRow(String(i + 1), t, 'clase') : `<details class="lesson${pr[`sap:L${i}`] ? ' done' : ''}"${i === 0 && !pr['sap:L0'] ? ' open' : ''}>
      <summary><span class="n">${i + 1}</span><span class="h3" style="flex:1">${esc(t)}</span>${pr[`sap:L${i}`] ? '<span class="pill ok">Leída</span>' : ''}</summary>
      <div class="body">${parts.join('')}<button type="button" class="btn sm" data-act="read" data-i="${i}">${pr[`sap:L${i}`] ? 'Leída' : 'Marcar como leída'}</button></div></details>`).join('');
  else if (tab === 'proyectos') body = `<p class="gtitle" style="margin-top:6px">Escenarios guiados · ${SAP_SCEN.length}</p><div>${SAP_SCEN.map(([id, c, t, s]) => link(id, c, t, s)).join('')}</div><p class="gtitle" style="margin-top:20px">Práctica extra · ${SAP_EXTRA.length}</p><div>${SAP_EXTRA.map(([id, t]) => link(id, 'Extra', t)).join('')}</div>`;
  else if (tab === 'quiz') body = guestNote('quiz') + SAP_QUIZ.map((t, i) => guest() && i >= FREE_QZ ? lockRow(`Clase ${i + 1}`, t, 'quiz') : link(`q-c${i + 1}`, `Clase ${i + 1}`, t)).join('');
  else body = `<div class="grid2" style="align-items:center"><div class="stack"><p class="lead">Abrí el taller de iFlows sin requisitos ni verificación y armá cualquier integración con todos los pasos y adaptadores.</p><p class="dim">Los Receivers responden con la respuesta simulada que les configures, y podés hacer que fallen para probar el manejo de errores.</p><div><a class="btn" href="${href('libre')}">Abrir el editor libre</a></div></div><div class="tiles"><div class="tile">${svg('router')}<p>Router, Multicast, Splitter y Gather</p></div><div class="tile grey">${svg('code')}<p>Groovy Script y Message Mapping</p></div><div class="tile grey">${svg('http')}<p>Adaptadores con respuesta simulada</p></div><div class="tile">${svg('sheets')}<p>Trace con headers, properties y body</p></div></div></div>`;
  const tabs = [
    ['lecciones', 'Teoría', `${SAP_LESSONS.length} clases cortas sobre Integration Suite, adaptadores, mapeos, Groovy y seguridad.`],
    ['proyectos', 'Escenarios', 'Casos guiados que se resuelven en el taller y se verifican paso a paso.'],
    ['quiz', 'Cuestionarios', 'Un cuestionario por clase para repasar lo que leíste.'],
    ['libre', 'Modo libre', 'El taller sin requisitos: armá cualquier iFlow y probalo.'],
  ], cur = tabs.find(t => t[0] === tab) || tabs[0];
  const stats = [
    [svg('check'), `${Math.round(n / total * 100)}%`, 'Taller completado', `${n} de ${total} ejercicios resueltos`],
    [svg('router'), SAP_SCEN.length + SAP_EXTRA.length, 'Escenarios', 'Guiados y de práctica extra'],
    [svg('doc'), SAP_LESSONS.length, 'Clases', 'Teoría corta, sin relleno'],
    [svg('sheets'), SAP_QUIZ.length, 'Cuestionarios', 'Uno por cada clase'],
  ];
  return `<section class="card hero">
    <div class="mark-row"><span class="mark lg" data-mark="sap"></span><p class="eyebrow dim">Plataforma</p></div>
    <h1 class="display">SAP CPI</h1>
    <span class="pill">iFlows · integración empresarial</span>
    <p class="lead">${esc(SAP_INTRO)}</p>
    <div class="row hero-cta"><a class="btn" href="${href((SAP_SCEN.find(s => !done[s[0]]) || SAP_SCEN[0])[0])}">Abrir el taller de iFlows</a><button type="button" class="btn line" data-tab="lecciones">Empezar por la teoría</button></div>
  </section>
  <section class="card dark proc">
    <div class="proc-head"><h2 class="display">Tu avance</h2><p class="lead dim">Lo que resolvés en el taller y lo que leés en la teoría se guarda solo.</p></div>
    <ol class="proc-steps">${stats.map(([ic, big, t, s], i) => `<li><span class="proc-n">0${i + 1}</span>${ic}<span class="big">${big}</span><b>${t}</b><p>${s}</p></li>`).join('')}</ol>
  </section>
  <section class="card" id="contenido">
    <div class="proc-head"><h2 class="display">${cur[1]}</h2><p class="lead">${cur[2]}</p></div>
    <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${tab === k}">${l}</button>`).join('')}</div>
    <div class="tab-body">${body}</div>
  </section>`;
}

/* ---------------- Render y eventos ---------------- */
// El taller de iFlows guarda lo resuelto en su propio localStorage: se copia al avance de la cuenta
// (sap:P:<id> para escenarios, sap:Q:c<n> para cuestionarios) para que cuente en otros dispositivos y en el panel.
// Lo resuelto en el taller: lo de este navegador más lo guardado en la cuenta
const sapSolved = () => {
  const sd = { ...sapDone() };
  for (const k of Object.keys(data().progress)) {
    if (k.startsWith('sap:P:')) sd[k.slice(6)] = true; else if (k.startsWith('sap:Q:')) sd['q-' + k.slice(6)] = true;
  }
  return sd;
};
const syncSap = () => {
  const d = sapDone(), pr = data().progress; let changed = false;
  for (const id of Object.keys(d)) {
    if (!d[id] || id === 'libre') continue;
    const k = id.startsWith('q-') ? `sap:Q:${id.slice(2)}` : `sap:P:${id}`;
    if (!pr[k]) { pr[k] = true; changed = true; }
  }
  if (changed) persist();
};
function render() { syncSap(); renderNav(); view.innerHTML = sap(); }
document.addEventListener('click', e => {
  const el = e.target.closest('[data-auth],[data-tab],[data-act]'); if (!el) return;
  const d = el.dataset;
  if (d.auth) { location.href = `${HOME}#${d.auth}`; return; }
  if (d.tab) { state.tab = d.tab; render(); document.getElementById('contenido').scrollIntoView({ block: 'start' }); return; }
  switch (d.act) {
    case 'logout': if (cloud) { clearTimeout(syncT); pushCloud().finally(() => sb.auth.signOut()); cloud = null; } db.session = null; persist(); toast('Sesión cerrada.'); return render();
    case 'read': mark(`sap:L${d.i}`); toast('Lección marcada como leída.'); return render();
  }
});
// Los enlaces viejos a un ejercicio (sap-cpi/index.html#b-001) siguen funcionando: van al taller
const tallerIds = [...SAP_SCEN.map(s => s[0]), ...SAP_EXTRA.map(s => s[0]), ...SAP_QUIZ.map((_, i) => `q-c${i + 1}`), 'libre'];
if (tallerIds.includes(location.hash.slice(1))) location.replace(SAP.href + location.hash);
else render();
if (sb) {
  sb.auth.getSession().then(async ({ data: { session } }) => { if (session) { await loadCloud(session.user); render(); } });
  sb.auth.onAuthStateChange((ev, session) => { if (ev === 'SIGNED_IN' && session && !cloud) loadCloud(session.user).then(render); });
}
})();
