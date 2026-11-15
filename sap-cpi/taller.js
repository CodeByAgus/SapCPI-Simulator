(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const clone = o => JSON.parse(JSON.stringify(o));
const short = (s, n = 90) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n) + '…' : s; };
const snap = v => Math.round(v / 10) * 10;

/* ---------------- Catálogo de elementos ---------------- */
const DEFAULT_SCRIPT = [
  'import com.sap.gateway.ip.core.customdev.util.Message',
  '',
  'def Message processData(Message message) {',
  '    def body = message.getBody(String)',
  '    // Tu lógica acá',
  '    message.setBody(body)',
  '    return message',
  '}'
].join('\n');

const T = {
  sender: { label: 'Sender', shape: 'participant', desc: 'Sistema que envía el mensaje al iFlow. Se conecta al Start Message con un adaptador de entrada (HTTPS, SOAP, SFTP, IDoc…).', def: () => ({ name: 'Sender' }) },
  receiver: { label: 'Receiver', shape: 'participant', desc: 'Sistema destino. Recibe mensajes desde un End Message, un Send o un Request Reply mediante un adaptador de salida.', def: () => ({ name: 'Receiver', mockBody: '', mockError: false }) },
  start: { label: 'Start Message', shape: 'event', desc: 'Arranca el proceso cuando llega un mensaje desde el Sender.' },
  end: { label: 'End Message', shape: 'event', desc: 'Cierra el proceso. Si está conectado a un Receiver, le entrega el mensaje; si no, el body final vuelve como respuesta al emisor en adaptadores síncronos (HTTPS, SOAP).' },
  timer: { label: 'Timer Start', shape: 'event', desc: 'Arranca el proceso según una programación, con el body vacío. No lleva Sender.', def: () => ({ schedule: 'Run Once' }) },
  errorStart: { label: 'Error Start', shape: 'event', desc: 'Primer paso del Exception Subprocess. Se dispara cuando un paso del proceso principal falla; el texto del error queda en ${exception.message}.' },
  errorEnd: { label: 'Error End', shape: 'event', desc: 'Termina el proceso con estado Failed y devuelve el error al emisor.' },
  exsub: { label: 'Exception Subprocess', shape: 'macro', desc: 'Agrega un Exception Subprocess (Error Start → End Message) para manejar los errores del proceso.' },
  contentModifier: { label: 'Content Modifier', shape: 'task', desc: 'Crea o borra headers y exchange properties, y reemplaza el body. Los headers viajan a los receptores; las properties solo existen dentro del iFlow.', def: () => ({ headers: [], properties: [], bodyType: 'Expression', body: '' }) },
  jsonToXml: { label: 'JSON to XML Converter', short: 'JSON → XML', shape: 'task', desc: 'Convierte un body JSON en XML. Si «Add XML Root Element» está apagado, el JSON debe tener un único miembro raíz, que pasa a ser el elemento raíz.', def: () => ({ useNsMapping: true, addRoot: true, rootName: 'root' }) },
  xmlToJson: { label: 'XML to JSON Converter', short: 'XML → JSON', shape: 'task', desc: 'Convierte un body XML en JSON. Los atributos se escriben como "@nombre" y los elementos repetidos como arreglos.', def: () => ({ useNsMapping: true, suppressRoot: false }) },
  script: { label: 'Groovy Script', shape: 'task', desc: 'Ejecuta lógica propia sobre el mensaje con la API Message: getBody, setBody, getHeader, setHeader, getProperty, setProperty.', def: () => ({ script: DEFAULT_SCRIPT }) },
  mapping: { label: 'Message Mapping', shape: 'task', desc: 'Transforma la estructura origen en la estructura destino. Cada regla asigna un campo destino a partir de un XPath del origen o de una constante.', def: () => ({ targetRoot: 'Target', rules: '' }) },
  encoder: { label: 'Base64 Encoder', shape: 'task', desc: 'Codifica el body en Base64 (UTF-8).' },
  decoder: { label: 'Base64 Decoder', shape: 'task', desc: 'Decodifica un body en Base64.' },
  router: { label: 'Router', shape: 'gateway', desc: 'Envía el mensaje por una sola ruta: la primera cuya condición se cumple o, si ninguna se cumple, la ruta por defecto. Las condiciones se configuran en cada flecha de salida.' },
  filter: { label: 'Filter', shape: 'task', desc: 'Conserva solo la parte del XML que devuelve una expresión XPath.', def: () => ({ xpath: '', valueType: 'Nodelist' }) },
  splitter: { label: 'Splitter', shape: 'task', desc: 'Divide el mensaje y procesa cada parte por separado hasta el Gather. Iterating: cada parte es solo el nodo. General: conserva el elemento raíz como envoltorio.', def: () => ({ splitType: 'Iterating Splitter', exprType: 'XPath', xpath: '', grouping: '1' }) },
  gather: { label: 'Gather', shape: 'task', desc: 'Junta en un solo mensaje las partes que produjo un Splitter.', def: () => ({ format: 'XML (Same Format)', strategy: 'Combine', xpath: '' }) },
  requestReply: { label: 'Request Reply', shape: 'task', desc: 'Llama de forma síncrona a un Receiver y reemplaza el body con su respuesta.' },
  send: { label: 'Send', shape: 'task', desc: 'Envía una copia del mensaje a un Receiver sin esperar respuesta. El body no cambia.' },
  multicast: { label: 'Multicast', shape: 'gateway', desc: 'Envía una copia del mensaje por cada rama de salida. Parallel procesa las ramas a la vez; Sequential, en orden. En el simulador, la respuesta al emisor es la de la primera rama.', def: () => ({ mode: 'Parallel Multicast' }) },
  dsWrite: { label: 'Data Store Write', short: 'Data Store Write', shape: 'task', desc: 'Guarda el mensaje en un Data Store del tenant (Monitor → Manage Stores → Data Stores). Si el Entry ID queda vacío, se genera uno.', def: () => ({ dsName: '', entryId: '', encrypt: true, overwrite: false }) },
  pgpEncryptor: { label: 'PGP Encryptor', shape: 'task', desc: 'Encripta el body con la clave pública PGP cargada en Monitor → Manage Security → PGP Keys.', def: () => ({ keyName: '' }) },
  pgpDecryptor: { label: 'PGP Decryptor', shape: 'task', desc: 'Desencripta un body PGP con la clave privada correspondiente del keyring del tenant.', def: () => ({ keyName: '', signatures: 'Signatures Optional' }) },
  lip: { label: 'Local Integration Process', shape: 'macro', desc: 'Agrega un Local Integration Process (inicio → fin) para reutilizar lógica. Se ejecuta desde un Process Call.' },
  lipStart: { label: 'Local Integration Process', shape: 'event', desc: 'Inicio de un Local Integration Process. Su nombre es el que se elige en el Process Call.', def: () => ({ name: 'Local Process' }) },
  processCall: { label: 'Process Call', shape: 'task', desc: 'Ejecuta un Local Integration Process con el mensaje actual y continúa con el resultado.', def: () => ({ process: '' }) },
};
const GROUPS = [
  ['Participantes', ['sender', 'receiver']],
  ['Eventos', ['start', 'end', 'timer', 'errorEnd']],
  ['Procesos', ['lip', 'processCall', 'exsub']],
  ['Transformación', ['contentModifier', 'jsonToXml', 'xmlToJson', 'script', 'mapping', 'encoder', 'decoder']],
  ['Enrutamiento', ['router', 'multicast', 'filter', 'splitter', 'gather']],
  ['Llamadas externas', ['requestReply', 'send']],
  ['Persistencia', ['dsWrite']],
  ['Seguridad', ['pgpEncryptor', 'pgpDecryptor']],
];
const ICON = {
  sender: '<rect x="3" y="3" width="14" height="14" rx="2"/><path d="M3 7.5h14M7 12h6M11 10l2 2-2 2"/>',
  receiver: '<rect x="3" y="3" width="14" height="14" rx="2"/><path d="M3 7.5h14M13 12H7M9 10l-2 2 2 2"/>',
  start: '<circle cx="10" cy="10" r="7"/>',
  end: '<circle cx="10" cy="10" r="7" stroke-width="3"/>',
  timer: '<circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 2"/>',
  errorStart: '<circle cx="10" cy="10" r="7" stroke-dasharray="2.5 2"/><path d="M7.5 13.5l1.6-4 2 1.2L12.6 6.5"/>',
  errorEnd: '<circle cx="10" cy="10" r="7" stroke-width="3"/><path d="M7.5 13.5l1.6-4 2 1.2L12.6 6.5"/>',
  exsub: '<rect x="2" y="4" width="16" height="12" rx="3" stroke-dasharray="3 2"/><path d="M8 13l1.4-3.2 2 1L12.6 7"/>',
  contentModifier: '<path d="M4 16l1-4 8-8 3 3-8 8z"/><path d="M11 6l3 3"/>',
  jsonToXml: '<path d="M7 5L3 10l4 5M13 5l4 5-4 5"/><path d="M11 4L9 16"/>',
  xmlToJson: '<path d="M7 4C5 4 5 5 5 7s-1 3-2 3c1 0 2 1 2 3s0 3 2 3M13 4c2 0 2 1 2 3s1 3 2 3c-1 0-2 1-2 3s0 3-2 3"/>',
  script: '<path d="M4 4h12v12H4z"/><path d="M7 8l2 2-2 2M10.5 12.5H13"/>',
  mapping: '<path d="M3 5h4M3 10h4M3 15h4M13 5h4M13 10h4M13 15h4M7 5l6 5M7 10l6 5M7 15l6-10"/>',
  encoder: '<rect x="4" y="9" width="12" height="8" rx="1.5"/><path d="M7 9V6.5a3 3 0 016 0V9"/>',
  decoder: '<rect x="4" y="9" width="12" height="8" rx="1.5"/><path d="M7 9V6.5a3 3 0 015.7-1.3"/>',
  router: '<path d="M10 2.5l7.5 7.5-7.5 7.5L2.5 10z"/><path d="M7.5 7.5l5 5M12.5 7.5l-5 5"/>',
  filter: '<path d="M3 4h14l-5.5 6.5V16l-3 1.5v-7z"/>',
  splitter: '<path d="M2 10h6M8 10l8-5.5M8 10h8M8 10l8 5.5"/>',
  gather: '<path d="M18 10h-6M12 10L4 4.5M12 10H4M12 10l-8 5.5"/>',
  requestReply: '<path d="M3 7h13M13 4l3 3-3 3M17 13H4M7 10l-3 3 3 3"/>',
  send: '<path d="M3 9.5l14-6-5.5 14-2.4-5.6z"/><path d="M9.1 11.9L17 3.5"/>',
  multicast: '<path d="M10 2.5l7.5 7.5-7.5 7.5L2.5 10z"/><path d="M10 6.5v7M6.5 10h7"/>',
  dsWrite: '<ellipse cx="10" cy="5" rx="6" ry="2.5"/><path d="M4 5v10c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V5M4 10c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5"/>',
  pgpEncryptor: '<rect x="4" y="9" width="12" height="8" rx="1.5"/><path d="M7 9V6.5a3 3 0 016 0V9M10 12v2"/>',
  pgpDecryptor: '<rect x="4" y="9" width="12" height="8" rx="1.5"/><path d="M7 9V6.5a3 3 0 015.7-1.3M10 12v2"/>',
  lip: '<rect x="2" y="4" width="16" height="12" rx="2"/><path d="M2 8h16M6 12h8"/>',
  lipStart: '<circle cx="10" cy="10" r="7"/><path d="M7 10h6"/>',
  processCall: '<rect x="3" y="4" width="14" height="12" rx="2"/><path d="M7 7v6M13 7v6"/>',
};
const ADAPTERS = {
  sender: {
    HTTPS: [['address', 'Address', '/ruta'], ['role', 'User Role', 'ESBMessaging.send'], ['csrf', 'CSRF Protected', 'check']],
    SOAP: [['address', 'Address', '/soap/servicio'], ['processing', 'Processing Settings', 'select:WS Standard|Robust']],
    SFTP: [['directory', 'Directory', '/salida'], ['fileName', 'File Name', '*.xml'], ['host', 'Address (host:puerto)', 'sftp.empresa.com:22'], ['proxy', 'Proxy Type', 'select:Internet|On-Premise'], ['auth', 'Authentication', 'select:User Name/Password|Public Key'], ['credential', 'Credential Name', 'SFTP_Credential'], ['postProcessing', 'Post-Processing', 'select:Delete File|Keep File and Mark as Processed|Keep File and Process Again|Move File'], ['poll', 'Scheduler: cada (min)', '1']],
    AMQP: [['host', 'Host', 'mq.empresa-demo.example'], ['port', 'Port', '5672'], ['queue', 'Queue Name', 'QUEUE_001']],
    IDoc: [['address', 'Address', '/idoc/orders']],
    ProcessDirect: [['address', 'Address', '/interno/pedidos']],
    JMS: [['queue', 'Queue Name', 'Q_PEDIDOS']],
    Mail: [['host', 'Address (IMAP)', 'imap.empresa.com:993'], ['folder', 'Folder', 'INBOX']],
  },
  receiver: {
    HTTP: [['address', 'Address', 'https://api.empresa.com/recurso'], ['proxy', 'Proxy Type', 'select:Internet|On-Premise'], ['method', 'Method', 'select:POST|GET|PUT|PATCH|DELETE'], ['auth', 'Authentication', 'select:None|Basic|OAuth2 Client Credentials|Client Certificate'], ['credential', 'Credential Name', 'NOMBRE_CREDENCIAL']],
    OData: [['address', 'Address', 'https://s4.empresa.com/sap/opu/odata/sap/API'], ['proxy', 'Proxy Type', 'select:Internet|On-Premise'], ['auth', 'Authentication', 'select:Basic|None|OAuth2 Client Credentials'], ['credential', 'Credential Name', 'NOMBRE_CREDENCIAL'], ['csrf', 'CSRF Protected', 'check'], ['operation', 'Operation', 'select:Query (GET)|Create (POST)|Update (PUT)|Delete (DELETE)'], ['resourcePath', 'Resource Path', "Entidad('${property.id}')"], ['query', 'Query Options', '$select=Campo1,Campo2']],
    SOAP: [['address', 'Address', 'https://erp.empresa.com/ws'], ['proxy', 'Proxy Type', 'select:Internet|On-Premise'], ['operation', 'Operation Name', 'CrearPedido'], ['auth', 'Authentication', 'select:None|Basic|Client Certificate'], ['credential', 'Credential Name', 'NOMBRE_CREDENCIAL']],
    OpenConnectors: [['baseUri', 'Base URI', 'https://api.openconnectors…/elements/api-v2'], ['credential', 'Credential Name', 'BambooHR'], ['resource', 'Resource', 'employees'], ['method', 'Method', 'select:GET|POST|PATCH|DELETE']],
    IDoc: [['address', 'Address', 'https://erp.empresa.com/sap/bc/srt/idoc'], ['credential', 'Credential Name', 'NOMBRE_CREDENCIAL']],
    SFTP: [['directory', 'Directory', '/entrada'], ['fileName', 'File Name', 'vacío = header CamelFileName'], ['host', 'Address (host:puerto)', 'sftp.empresa.com:22'], ['proxy', 'Proxy Type', 'select:Internet|On-Premise'], ['auth', 'Authentication', 'select:User Name/Password|Public Key'], ['credential', 'Credential Name', 'NOMBRE_CREDENCIAL']],
    Mail: [['host', 'Address (SMTP)', 'smtp.empresa.com:587'], ['from', 'From', 'integracion@empresa.com'], ['to', 'To', 'destino@empresa.com'], ['subject', 'Subject', 'Pedido ${header.id}']],
    JMS: [['queue', 'Queue Name', 'Q_SALIDA']],
    ProcessDirect: [['address', 'Address', '/interno/destino']],
    RFC: [['destination', 'RFC Destination', 'ERP_RFC']],
  }
};
// Valores que CPI propone al elegir el adaptador (por eso las guías piden desmarcar CSRF)
const ADEF = { HTTPS: { csrf: true, role: 'ESBMessaging.send' }, OData: { csrf: true } };
const isPart = n => n && T[n.type].shape === 'participant';
const label = n => (n && String(n.props.name || '').trim()) || (n ? T[n.type].label : '');
function defProps(type) { return { name: '', ...(T[type].def ? T[type].def() : {}) }; }

/* ---------------- Plantillas y ejercicios ---------------- */
function makeTemplate(t = {}) {
  if (t.flow) return t.flow();
  const nodes = [
    { id: 's', type: 'sender', x: 30, y: 260, props: { ...defProps('sender'), name: t.senderName || 'Sender' } },
    { id: 'st', type: 'start', x: 260, y: 260, props: defProps('start') },
    { id: 'e', type: 'end', x: 760, y: 260, props: defProps('end') },
  ];
  const rs = t.receivers ?? ['Receiver'];
  rs.forEach((name, i) => nodes.push({ id: 'r' + i, type: 'receiver', x: 990, y: rs.length === 1 ? 260 : 140 + i * 240, props: { ...defProps('receiver'), name } }));
  const edges = [{ id: 'q1', kind: 'seq', from: 'st', to: 'e', props: {} }];
  if (t.adapter) edges.push({ id: 'm1', kind: 'msg', from: 's', to: 'st', props: { ...t.adapter } });
  return { nodes, edges };
}
function B(nodes, edges) {
  const ns = nodes.map(([id, type, x, y, p]) => ({ id, type, x, y, props: { ...defProps(type), ...(p || {}) } }));
  const isP = id => isPart(ns.find(n => n.id === id));
  const es = edges.map(([from, to, p], i) => ({ id: 'x' + i, from, to, kind: isP(from) || isP(to) ? 'msg' : 'seq', props: p || {} }));
  return { nodes: ns, edges: es };
}
const row = (name, source, value, action = 'Create') => ({ action, name, source, value });
const X = (b, e) => { try { const d = new DOMParser().parseFromString(String(b ?? '').trim(), 'application/xml'); if (d.getElementsByTagName('parsererror').length) return null; return d.evaluate(xp1(e), d, null, XPathResult.STRING_TYPE, null).stringValue; } catch (_) { return null; } };
const J = b => { try { return JSON.parse(b); } catch (_) { return null; } };
const D = (r, name) => r.deliveries.filter(d => d.receiver === name && d.via !== 'requestReply');
const CALL = (r, name) => r.deliveries.find(d => d.receiver === name && d.via === 'requestReply');
const HTTPS = address => ({ adapter: 'HTTPS', address, role: 'ESBMessaging.send', csrf: false });

const BP = { C001: 'Distribuidora Andina', C002: 'Café del Puerto' };

const PRACTICE = [
  {
    id: 'hola', level: 'Inicial', title: 'Hola mundo por HTTPS',
    story: 'El equipo de la app móvil quiere comprobar que puede llamar a Cloud Integration. Pide un endpoint que reciba un nombre en un header y responda con un saludo.',
    reqs: [
      'Conectá el <b>Sender</b> al <b>Start Message</b> y elegí el adaptador <b>HTTPS</b> con Address <code>/hola</code>.',
      'Agregá un <b>Content Modifier</b> entre el Start y el End.',
      'En su pestaña <i>Message Body</i> escribí <code>Hola, ${header.nombre}!</code>',
      'No hace falta Receiver: el End Message devuelve el body como respuesta HTTP.'
    ],
    hints: [
      'Para conectar, seleccioná un elemento y arrastrá el círculo azul con la flecha hasta el destino.',
      'Para elegir el adaptador, hacé clic en la línea punteada naranja entre el Sender y el Start.',
      'Si hacés clic en la paleta mientras una flecha está seleccionada, el paso nuevo se inserta en esa flecha.'
    ],
    template: { senderName: 'App_Movil', receivers: [] },
    checks: [
      { label: 'Sender conectado por HTTPS', test: h => h.senderEdge()?.props.adapter === 'HTTPS' },
      { label: 'Address del endpoint: /hola', test: h => String(h.senderEdge()?.props.address || '').trim() === '/hola' },
      { label: 'Hay un Content Modifier en el proceso', test: h => h.has('contentModifier') },
    ],
    tests: [
      { name: 'Llamada con nombre=Ana', input: { headers: { nombre: 'Ana' }, body: '' }, expect: r => r.body.trim() === 'Hola, Ana!' || `Se esperaba «Hola, Ana!» y la respuesta fue «${short(r.body)}».` },
      { name: 'Llamada con nombre=Bruno', input: { headers: { nombre: 'Bruno' }, body: '' }, expect: r => r.body.trim() === 'Hola, Bruno!' || `Se esperaba «Hola, Bruno!» y la respuesta fue «${short(r.body)}».` },
    ],
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'App_Movil' }], ['st', 'start', 260, 260], ['cm', 'contentModifier', 450, 260, { name: 'Armar saludo', body: 'Hola, ${header.nombre}!' }], ['e', 'end', 640, 260]
    ], [['s', 'st', HTTPS('/hola')], ['st', 'cm'], ['cm', 'e']]),
  },
  {
    id: 'json-xml', level: 'Inicial', title: 'Pedido JSON a XML por SFTP',
    story: 'La tienda online manda pedidos en JSON. El ERP legado solo lee archivos XML que encuentra en un servidor SFTP.',
    reqs: [
      'Sender por <b>HTTPS</b> con Address <code>/pedidos</code>.',
      'Convertí el body con un <b>JSON to XML Converter</b> y desmarcá <i>Add XML Root Element</i>: así "pedido" queda como raíz.',
      'Con un <b>Content Modifier</b>, creá el header <code>pedidoId</code> de tipo <i>XPath</i> con valor <code>/pedido/id</code>.',
      'En el mismo Content Modifier, creá el header <code>CamelFileName</code> de tipo <i>Expression</i>: <code>pedido_${header.pedidoId}.xml</code>',
      'Conectá el End Message al Receiver <b>ERP_Legado</b> con adaptador <b>SFTP</b> y Directory <code>/entrada/pedidos</code>.'
    ],
    hints: [
      'Con «Add XML Root Element» apagado, el miembro "pedido" pasa a ser la raíz, así que el XPath es /pedido/id.',
      'Las filas del Content Modifier se procesan en orden: primero pedidoId, después CamelFileName.',
      'Para usar ${header.pedidoId} dentro de un valor, el tipo de origen tiene que ser Expression. Con Constant se copia el texto tal cual.',
      'El adaptador SFTP usa el header CamelFileName como nombre del archivo cuando File Name queda vacío.'
    ],
    template: { senderName: 'Tienda_Online', receivers: ['ERP_Legado'] },
    checks: [
      { label: 'Sender por HTTPS en /pedidos', test: h => h.senderEdge()?.props.adapter === 'HTTPS' && String(h.senderEdge()?.props.address || '').trim() === '/pedidos' },
      { label: 'Hay un JSON to XML Converter', test: h => h.has('jsonToXml') },
      { label: 'ERP_Legado conectado por SFTP', test: h => h.recvEdge('ERP_Legado')?.props.adapter === 'SFTP' },
    ],
    tests: [
      { name: 'Pedido 1001', input: { headers: {}, body: '{"pedido":{"id":"1001","cliente":"ACME SA","total":250.5}}' }, expect: r => sftpCheck(r, '1001') },
      { name: 'Pedido 2002', input: { headers: {}, body: '{"pedido":{"id":"2002","cliente":"Kiosco Sur","total":80}}' }, expect: r => sftpCheck(r, '2002') },
    ],
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'Tienda_Online' }], ['st', 'start', 260, 260], ['cv', 'jsonToXml', 410, 260, { addRoot: false }], ['cm', 'contentModifier', 580, 260, { name: 'Nombre de archivo', headers: [row('pedidoId', 'XPath', '/pedido/id'), row('CamelFileName', 'Expression', 'pedido_${header.pedidoId}.xml')] }], ['e', 'end', 750, 260], ['r', 'receiver', 980, 260, { name: 'ERP_Legado' }]
    ], [['s', 'st', HTTPS('/pedidos')], ['st', 'cv'], ['cv', 'cm'], ['cm', 'e'], ['e', 'r', { adapter: 'SFTP', host: 'sftp.erp-legado.local:22', directory: '/entrada/pedidos', fileName: '', credential: 'SFTP_ERP' }]]),
  },
  {
    id: 'router', level: 'Intermedio', title: 'Enrutar pedidos por país',
    story: 'Los pedidos de Argentina se registran en el ERP local, que recibe IDocs. Los del resto de los países van al ERP global, que expone un servicio SOAP.',
    reqs: [
      'Insertá un <b>Router</b> después del Start Message.',
      'Ruta <b>Argentina</b>: tipo <i>XML</i>, condición <code>/Order/Country = \'AR\'</code>, hacia un End Message conectado a <b>ERP_AR</b> por <b>IDoc</b>.',
      'Ruta por defecto: hacia otro End Message conectado a <b>ERP_Global</b> por <b>SOAP</b>.',
      'Cada pedido tiene que llegar a un solo ERP.'
    ],
    hints: [
      'Seleccioná la flecha Start → End y hacé clic en Router en la paleta: queda insertado en el medio.',
      'Agregá un segundo End Message y conectá el Router a él arrastrando la flecha azul.',
      'Hacé clic en cada flecha que sale del Router para ponerle nombre y condición.',
      'Marcá una sola flecha como ruta por defecto: esa no necesita condición.'
    ],
    template: { senderName: 'Portal_Ventas', receivers: ['ERP_AR', 'ERP_Global'], adapter: HTTPS('/pedidos/enrutar') },
    checks: [
      { label: 'Hay un Router', test: h => h.has('router') },
      { label: 'El Router tiene una sola ruta por defecto', test: h => h.nodes('router').some(n => h.outs(n.id).filter(e => e.props.isDefault).length === 1) },
      { label: 'ERP_AR conectado por IDoc', test: h => h.recvEdge('ERP_AR')?.props.adapter === 'IDoc' },
      { label: 'ERP_Global conectado por SOAP', test: h => h.recvEdge('ERP_Global')?.props.adapter === 'SOAP' },
    ],
    tests: [
      { name: 'Pedido de Argentina', input: { headers: {}, body: '<Order><Id>A-77</Id><Country>AR</Country><Amount>990</Amount></Order>' }, expect: r => routeCheck(r, 'ERP_AR', 'IDoc', 'ERP_Global') },
      { name: 'Pedido de Chile', input: { headers: {}, body: '<Order><Id>C-12</Id><Country>CL</Country><Amount>450</Amount></Order>' }, expect: r => routeCheck(r, 'ERP_Global', 'SOAP', 'ERP_AR') },
    ],
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'Portal_Ventas' }], ['st', 'start', 260, 260], ['rt', 'router', 420, 260, { name: '¿País?' }],
      ['e1', 'end', 640, 140, { name: 'Fin AR' }], ['e2', 'end', 640, 380, { name: 'Fin global' }],
      ['r1', 'receiver', 880, 140, { name: 'ERP_AR' }], ['r2', 'receiver', 880, 380, { name: 'ERP_Global' }]
    ], [['s', 'st', HTTPS('/pedidos/enrutar')], ['st', 'rt'],
      ['rt', 'e1', { name: 'Argentina', exprType: 'XML', condition: "/Order/Country = 'AR'", isDefault: false }],
      ['rt', 'e2', { name: 'Resto del mundo', exprType: 'XML', condition: '', isDefault: true }],
      ['e1', 'r1', { adapter: 'IDoc', address: 'https://erp-ar.empresa.local/sap/bc/srt/idoc', credential: 'ERP_AR_USER' }],
      ['e2', 'r2', { adapter: 'SOAP', address: 'https://erp-global.empresa.com/ws/orders', operation: 'CreateOrder', credential: 'ERP_GLOBAL_USER' }]]),
  },
  {
    id: 'filter', level: 'Intermedio', title: 'Filtrar productos con stock',
    story: 'El catálogo trae todos los productos, también los agotados. La web solo quiere mostrar los que tienen stock.',
    reqs: [
      'Agregá un <b>Filter</b> con XPath <code>//Item[Stock &gt; 0]</code> y Value Type <i>Nodelist</i>.',
      'Después, un <b>Content Modifier</b> que envuelva el resultado: <code>&lt;Disponibles&gt;${in.body}&lt;/Disponibles&gt;</code>',
      'El End Message devuelve el XML al emisor.'
    ],
    hints: [
      'Con Nodelist, el Filter devuelve los <Item> uno detrás de otro, sin elemento raíz. Por eso hace falta envolverlos.',
      'En el predicado, Stock > 0 compara números.',
      'Probá el iFlow en la pestaña Probar y abrí cada paso del trace para ver cómo cambia el body.'
    ],
    template: { senderName: 'Web_Tienda', receivers: [], adapter: HTTPS('/catalogo/disponibles') },
    checks: [
      { label: 'Filter con Value Type Nodelist', test: h => h.nodes('filter').some(n => (n.props.valueType || 'Nodelist') === 'Nodelist') },
      { label: 'Content Modifier después del Filter', test: h => h.nodes('filter').some(f => h.outs(f.id).some(e => h.node(e.to)?.type === 'contentModifier')) },
    ],
    tests: [
      { name: 'Catálogo con 2 productos en stock', input: { headers: {}, body: '<Catalogo><Item><Id>P-01</Id><Nombre>Mate de calabaza</Nombre><Stock>5</Stock></Item><Item><Id>P-02</Id><Nombre>Bombilla</Nombre><Stock>0</Stock></Item><Item><Id>P-03</Id><Nombre>Yerba 1 kg</Nombre><Stock>12</Stock></Item></Catalogo>' },
        expect: r => { const n = X(r.body, 'count(/Disponibles/Item)'); if (n !== '2') return `Se esperaban 2 <Item> dentro de <Disponibles> y hay ${n ?? 'ninguno (el body no es XML válido)'}.`; const ids = X(r.body, 'concat(/Disponibles/Item[1]/Id,",",/Disponibles/Item[2]/Id)'); return ids === 'P-01,P-03' || `Quedaron los productos ${ids}; se esperaban P-01 y P-03.`; } },
      { name: 'Catálogo sin stock', input: { headers: {}, body: '<Catalogo><Item><Id>P-08</Id><Nombre>Termo</Nombre><Stock>0</Stock></Item></Catalogo>' },
        expect: r => (X(r.body, 'count(/Disponibles)') === '1' && X(r.body, 'count(/Disponibles/Item)') === '0') || `Se esperaba <Disponibles/> vacío y se obtuvo «${short(r.body)}».` },
    ],
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'Web_Tienda' }], ['st', 'start', 260, 260], ['f', 'filter', 420, 260, { name: 'Con stock', xpath: '//Item[Stock > 0]', valueType: 'Nodelist' }], ['cm', 'contentModifier', 590, 260, { name: 'Envolver', body: '<Disponibles>${in.body}</Disponibles>' }], ['e', 'end', 760, 260]
    ], [['s', 'st', HTTPS('/catalogo/disponibles')], ['st', 'f'], ['f', 'cm'], ['cm', 'e']]),
  },
  {
    id: 'groovy', level: 'Intermedio', title: 'Normalizar un cliente con Groovy',
    story: 'El CRM recibe clientes cargados a mano, con mayúsculas y minúsculas mezcladas. Antes de guardarlos hay que normalizarlos.',
    reqs: [
      'Agregá un <b>Groovy Script</b> que lea el body JSON.',
      'Pasá <code>nombre</code> a mayúsculas y <code>email</code> a minúsculas. El resto de los campos queda igual.',
      'Agregá el header <code>X-Procesado</code> con valor <code>true</code>.'
    ],
    hints: [
      'Leé el JSON con new JsonSlurper().parseText(body) y escribilo con JsonOutput.toJson(json). No olvides los import de groovy.json.',
      'toUpperCase() y toLowerCase() funcionan igual que en Java.',
      'message.setHeader("X-Procesado", "true") agrega el header.',
      'El simulador ejecuta un subconjunto de Groovy: def, tipos simples, GStrings, closures each/collect/findAll y la API Message.'
    ],
    template: { senderName: 'CRM', receivers: [], adapter: HTTPS('/clientes/normalizar') },
    checks: [{ label: 'Hay un Groovy Script', test: h => h.has('script') }],
    tests: [
      { name: 'Cliente ana pérez', input: { headers: {}, body: '{"nombre":"ana pérez","email":"ANA@MAIL.COM"}' }, expect: r => clientCheck(r, 'ANA PÉREZ', 'ana@mail.com') },
      { name: 'Cliente con teléfono', input: { headers: {}, body: '{"nombre":"Luis Ortiz","email":"Luis.Ortiz@Correo.com","telefono":"341-555-0101"}' }, expect: r => clientCheck(r, 'LUIS ORTIZ', 'luis.ortiz@correo.com', '341-555-0101') },
    ],
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'CRM' }], ['st', 'start', 260, 260], ['sc', 'script', 450, 260, { name: 'Normalizar', script: [
        'import com.sap.gateway.ip.core.customdev.util.Message',
        'import groovy.json.JsonSlurper',
        'import groovy.json.JsonOutput',
        '',
        'def Message processData(Message message) {',
        '    def body = message.getBody(String)',
        '    def json = new JsonSlurper().parseText(body)',
        '    json.nombre = json.nombre.toUpperCase()',
        '    json.email = json.email.toLowerCase()',
        '    message.setBody(JsonOutput.toJson(json))',
        '    message.setHeader("X-Procesado", "true")',
        '    return message',
        '}'].join('\n') }], ['e', 'end', 640, 260]
    ], [['s', 'st', HTTPS('/clientes/normalizar')], ['st', 'sc'], ['sc', 'e']]),
  },
  {
    id: 'enrich', level: 'Avanzado', title: 'Enriquecer un pedido con OData',
    story: 'Los pedidos llegan solo con el código de cliente. Logística necesita también el nombre, que está en S/4HANA y se consulta por OData.',
    reqs: [
      'Con un <b>Content Modifier</b>, guardá dos exchange properties: <code>pedidoOriginal</code> (Expression <code>${in.body}</code>) y <code>clienteId</code> (XPath <code>/Pedido/ClienteId</code>).',
      'Agregá un <b>Request Reply</b> conectado al Receiver <b>S4_Clientes</b> con adaptador <b>OData</b> y Resource Path <code>A_BusinessPartner(\'${property.clienteId}\')</code>.',
      'Después, otro Content Modifier con body <code>&lt;PedidoEnriquecido&gt;${property.pedidoOriginal}${in.body}&lt;/PedidoEnriquecido&gt;</code>'
    ],
    mockInfo: 'S4_Clientes es un sistema simulado. Para A_BusinessPartner(\'C001\') responde:',
    mockSample: '<BusinessPartner><Id>C001</Id><Nombre>Distribuidora Andina</Nombre><Pais>AR</Pais></BusinessPartner>',
    hints: [
      'Después del Request Reply, el body es la respuesta de S4. Si no guardaste antes el pedido en una property, se pierde.',
      'Para conectar el Request Reply con el Receiver, seleccioná el Request Reply y arrastrá su flecha azul hasta S4_Clientes.',
      'Los campos del adaptador aceptan expresiones: ${property.clienteId} se reemplaza en cada llamada.'
    ],
    template: { senderName: 'Logistica', receivers: ['S4_Clientes'], adapter: HTTPS('/pedidos/enriquecer') },
    mocks: {
      S4_Clientes: d => { const id = (String(d.props.resourcePath || '').match(/'([^']*)'/) || [])[1] || ''; return BP[id] ? { body: `<BusinessPartner><Id>${id}</Id><Nombre>${BP[id]}</Nombre><Pais>AR</Pais></BusinessPartner>` } : { error: `HTTP 404 Not Found: no existe el Business Partner «${id}»` }; }
    },
    checks: [
      { label: 'Property pedidoOriginal creada en un Content Modifier', test: h => h.nodes('contentModifier').some(n => (n.props.properties || []).some(r => r.name === 'pedidoOriginal' && r.action !== 'Delete')) },
      { label: 'Request Reply conectado a S4_Clientes por OData', test: h => { const e = h.recvEdge('S4_Clientes'); return !!e && h.node(e.from)?.type === 'requestReply' && e.props.adapter === 'OData'; } },
    ],
    tests: [
      { name: 'Pedido del cliente C001', input: { headers: {}, body: '<Pedido><ClienteId>C001</ClienteId><Importe>1500</Importe></Pedido>' }, expect: r => enrichCheck(r, 'C001', '1500') },
      { name: 'Pedido del cliente C002', input: { headers: {}, body: '<Pedido><ClienteId>C002</ClienteId><Importe>320</Importe></Pedido>' }, expect: r => enrichCheck(r, 'C002', '320') },
    ],
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'Logistica' }], ['st', 'start', 260, 260],
      ['cm1', 'contentModifier', 410, 260, { name: 'Guardar pedido', properties: [row('pedidoOriginal', 'Expression', '${in.body}'), row('clienteId', 'XPath', '/Pedido/ClienteId')] }],
      ['rr', 'requestReply', 580, 260, { name: 'Consultar cliente' }],
      ['cm2', 'contentModifier', 750, 260, { name: 'Unir datos', body: '<PedidoEnriquecido>${property.pedidoOriginal}${in.body}</PedidoEnriquecido>' }],
      ['e', 'end', 910, 260], ['r', 'receiver', 1110, 110, { name: 'S4_Clientes' }]
    ], [['s', 'st', HTTPS('/pedidos/enriquecer')], ['st', 'cm1'], ['cm1', 'rr'], ['rr', 'cm2'], ['cm2', 'e'],
      ['rr', 'r', { adapter: 'OData', address: 'https://s4.empresa.com/sap/opu/odata/sap/API_BUSINESS_PARTNER', operation: 'Query (GET)', resourcePath: "A_BusinessPartner('${property.clienteId}')", query: '', credential: 'S4_OAUTH' }]]),
  },
  {
    id: 'split', level: 'Avanzado', title: 'Procesar ítems uno por uno',
    story: 'El depósito necesita una confirmación por cada línea del pedido, y después todas juntas en un solo mensaje.',
    reqs: [
      'Agregá un <b>Splitter</b> de tipo <i>Iterating Splitter</i> con XPath <code>//Item</code>.',
      'Para cada ítem, un <b>Content Modifier</b> que cree el header <code>sku</code> (XPath <code>/Item/SKU</code>) y ponga el body <code>&lt;Procesado sku="${header.sku}"/&gt;</code>',
      'Juntá las partes con un <b>Gather</b> de estrategia <i>Combine</i> antes del End Message.'
    ],
    hints: [
      'El Iterating Splitter entrega cada <Item> como un mensaje propio, por eso el XPath del Content Modifier empieza en /Item.',
      'Todo lo que está entre el Splitter y el Gather se ejecuta una vez por ítem. Fijate en el trace: cada paso indica la parte.',
      'La estrategia Combine envuelve los resultados en multimap:Messages.'
    ],
    template: { senderName: 'Deposito', receivers: [], adapter: HTTPS('/pedidos/items') },
    checks: [
      { label: 'Splitter de tipo Iterating', test: h => h.nodes('splitter').some(n => n.props.splitType === 'Iterating Splitter') },
      { label: 'Hay un Gather', test: h => h.has('gather') },
    ],
    tests: [
      { name: 'Pedido con 3 ítems', input: { headers: {}, body: '<Pedido><Id>500</Id><Items><Item><SKU>A1</SKU><Cant>2</Cant></Item><Item><SKU>B7</SKU><Cant>1</Cant></Item><Item><SKU>C3</SKU><Cant>5</Cant></Item></Items></Pedido>' }, expect: r => splitCheck(r, 'A1,B7,C3') },
      { name: 'Pedido con 2 ítems', input: { headers: {}, body: '<Pedido><Id>501</Id><Items><Item><SKU>X9</SKU><Cant>4</Cant></Item><Item><SKU>Z2</SKU><Cant>1</Cant></Item></Items></Pedido>' }, expect: r => splitCheck(r, 'X9,Z2') },
    ],
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'Deposito' }], ['st', 'start', 260, 260],
      ['sp', 'splitter', 410, 260, { name: 'Por ítem', splitType: 'Iterating Splitter', exprType: 'XPath', xpath: '//Item', grouping: '1' }],
      ['cm', 'contentModifier', 580, 260, { name: 'Confirmar ítem', headers: [row('sku', 'XPath', '/Item/SKU')], body: '<Procesado sku="${header.sku}"/>' }],
      ['g', 'gather', 750, 260, { name: 'Juntar', format: 'XML (Same Format)', strategy: 'Combine' }], ['e', 'end', 910, 260]
    ], [['s', 'st', HTTPS('/pedidos/items')], ['st', 'sp'], ['sp', 'cm'], ['cm', 'g'], ['g', 'e']]),
  },
  {
    id: 'errores', level: 'Avanzado', title: 'Responder con un error controlado',
    story: 'El servicio de pagos a veces se cae. Quien llama al iFlow necesita un JSON claro y un código HTTP 500, no un error genérico.',
    reqs: [
      'Agregá un <b>Request Reply</b> conectado a <b>ServicioPagos</b> con adaptador <b>HTTP</b> y método <code>POST</code>.',
      'Agregá un <b>Exception Subprocess</b> (grupo Eventos) y poné un <b>Content Modifier</b> entre su Error Start y su End Message.',
      'En ese Content Modifier: header <code>CamelHttpResponseCode</code> = <code>500</code> (Constant) y body <code>{"estado":"error","detalle":"${exception.message}"}</code>'
    ],
    mockInfo: 'ServicioPagos está caído en este ejercicio: responde HTTP 500 a cualquier llamada.',
    hints: [
      'Seleccioná la flecha Error Start → End del subproceso y hacé clic en Content Modifier para insertarlo.',
      'Dentro del subproceso, ${exception.message} tiene el texto del error.',
      'El header CamelHttpResponseCode define el código HTTP que recibe quien llamó al iFlow.',
      'Si el subproceso termina en End Message, el mensaje queda Completed y el emisor recibe tu body. Con Error End quedaría Failed.'
    ],
    template: { senderName: 'Checkout', receivers: ['ServicioPagos'], adapter: HTTPS('/pagos') },
    mocks: { ServicioPagos: () => ({ error: 'HTTP 500 Internal Server Error (servicio de pagos no disponible)' }) },
    checks: [
      { label: 'Request Reply a ServicioPagos por HTTP', test: h => { const e = h.recvEdge('ServicioPagos'); return !!e && h.node(e.from)?.type === 'requestReply' && e.props.adapter === 'HTTP'; } },
      { label: 'Hay un Exception Subprocess', test: h => h.has('errorStart') },
    ],
    tests: [
      { name: 'Pago con el servicio caído', input: { headers: {}, body: '{"pedido":7,"importe":1200}' }, expect: r => {
        const c = CALL(r, 'ServicioPagos');
        if (!c) return 'No se llamó a ServicioPagos con un Request Reply.';
        if (c.adapter !== 'HTTP') return `Se llamó por ${c.adapter}; tiene que ser HTTP.`;
        if (c.props.method !== 'POST') return `El método HTTP es ${c.props.method || '(vacío)'}; tiene que ser POST.`;
        if (!r.handled) return 'El error no pasó por un Exception Subprocess.';
        if (String(r.headers.CamelHttpResponseCode) !== '500') return `CamelHttpResponseCode vale «${r.headers.CamelHttpResponseCode ?? ''}»; se esperaba 500.`;
        const j = J(r.body); if (!j) return `El body de error no es JSON válido: «${short(r.body)}».`;
        if (j.estado !== 'error') return 'El campo "estado" debería valer "error".';
        return String(j.detalle || '').includes('500') || 'El campo "detalle" debería traer el mensaje de la excepción (incluye «500»).';
      } },
    ],
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'Checkout' }], ['st', 'start', 260, 260], ['rr', 'requestReply', 450, 260, { name: 'Cobrar' }], ['e', 'end', 640, 260],
      ['r', 'receiver', 860, 110, { name: 'ServicioPagos' }],
      ['es', 'errorStart', 290, 440], ['cm', 'contentModifier', 450, 440, { name: 'Respuesta de error', headers: [row('CamelHttpResponseCode', 'Constant', '500')], body: '{"estado":"error","detalle":"${exception.message}"}' }], ['ee', 'end', 610, 440]
    ], [['s', 'st', HTTPS('/pagos')], ['st', 'rr'], ['rr', 'e'], ['es', 'cm'], ['cm', 'ee'],
      ['rr', 'r', { adapter: 'HTTP', address: 'https://pagos.empresa.com/api/cobros', method: 'POST', auth: 'OAuth2 Client Credentials', credential: 'PAGOS_OAUTH' }]]),
  },
  {
    id: 'mapping', level: 'Avanzado', title: 'Mapear un pedido al formato del ERP',
    story: 'El e-commerce manda pedidos con su propia estructura. El ERP espera un SalesOrder con otros nombres de campo y un canal fijo.',
    reqs: [
      'Agregá un <b>Message Mapping</b> con elemento raíz destino <code>SalesOrder</code>.',
      'Number ← <code>/Order/Id</code>, Buyer ← <code>/Order/Customer/Name</code>, Total ← <code>/Order/Amount</code>.',
      'Currency ← el atributo <code>currency</code> de Amount.',
      'Channel = la constante <code>WEB</code>.'
    ],
    mockInfo: 'Estructura destino esperada:',
    mockSample: '<SalesOrder><Number>5001</Number><Buyer>Ana Gómez</Buyer><Total>12500</Total><Currency>ARS</Currency><Channel>WEB</Channel></SalesOrder>',
    hints: [
      'Una regla por línea: CampoDestino = XPath del origen.',
      'Para leer un atributo, usá @: /Order/Amount/@currency.',
      "Para un valor fijo, escribilo entre comillas simples: Channel = 'WEB'.",
      'Del lado derecho podés usar funciones de XPath 1.0, como concat() o translate().'
    ],
    template: { senderName: 'Ecommerce', receivers: [], adapter: HTTPS('/pedidos/mapear') },
    checks: [{ label: 'Hay un Message Mapping', test: h => h.has('mapping') }],
    tests: [
      { name: 'Pedido 5001 en ARS', input: { headers: {}, body: '<Order><Id>5001</Id><Customer><Name>Ana Gómez</Name><Country>AR</Country></Customer><Amount currency="ARS">12500</Amount></Order>' }, expect: r => mapCheck(r, { Number: '5001', Buyer: 'Ana Gómez', Total: '12500', Currency: 'ARS', Channel: 'WEB' }) },
      { name: 'Pedido 77 en USD', input: { headers: {}, body: '<Order><Id>77</Id><Customer><Name>João Silva</Name><Country>BR</Country></Customer><Amount currency="USD">980</Amount></Order>' }, expect: r => mapCheck(r, { Number: '77', Buyer: 'João Silva', Total: '980', Currency: 'USD', Channel: 'WEB' }) },
    ],
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'Ecommerce' }], ['st', 'start', 260, 260],
      ['mm', 'mapping', 450, 260, { name: 'Order a SalesOrder', targetRoot: 'SalesOrder', rules: ['Number = /Order/Id', 'Buyer = /Order/Customer/Name', 'Total = /Order/Amount', 'Currency = /Order/Amount/@currency', "Channel = 'WEB'"].join('\n') }],
      ['e', 'end', 640, 260]
    ], [['s', 'st', HTTPS('/pedidos/mapear')], ['st', 'mm'], ['mm', 'e']]),
  },
  {
    id: 'libre', level: 'Sandbox', title: 'Modo libre',
    story: 'Armá cualquier iFlow y probalo con tus propios mensajes en la pestaña Probar. Los Receivers responden con la respuesta simulada que les configures en Propiedades.',
    reqs: [],
    hints: ['Seleccioná un Receiver para definir su respuesta simulada o hacer que falle con HTTP 500.', 'El trace de la pestaña Probar muestra headers, properties y body después de cada paso.'],
    template: { senderName: 'Sender', receivers: ['Receiver'] },
    sample: { headers: { origen: 'taller' }, body: '{"pedido":{"id":"42","cliente":"Demo SA","items":[{"sku":"A1","cant":2},{"sku":"B2","cant":1}]}}' },
    checks: [], tests: [],
  },
];
PRACTICE.forEach(e => { e.group = e.id === 'libre' ? 'Modo libre' : 'Práctica extra'; });

/* ---------------- Escenarios guiados ---------------- */
const HA = address => ({ adapter: 'HTTPS', address, role: 'ESB_taller.send', csrf: false });
const hdr = (h, name) => Object.entries(h || {}).find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1];
const DS = (r, name) => (r.dataStores || []).filter(d => d.name === name);
const SFTP_DEMO = { proxy: 'Internet', auth: 'User Name/Password', credential: 'SFTP_Credential' };
function httpsChecks(suffix, withRole = true) {
  const re = new RegExp(`^/[^/\\s]+/${suffix}$`);
  return [
    { label: `Sender por HTTPS con Address /[tu-nombre]/${suffix}`, test: h => h.senderEdge()?.props.adapter === 'HTTPS' && re.test(String(h.senderEdge()?.props.address || '').trim()) },
    ...(withRole ? [{ label: 'User Role ESB_taller.send', test: h => h.senderEdge()?.props.role === 'ESB_taller.send' }] : []),
    { label: 'CSRF Protected desmarcado', test: h => h.senderEdge() && !h.senderEdge().props.csrf },
  ];
}
function propsCheck(d, exp, who) {
  for (const [k, v] of Object.entries(exp)) if (String(d.props[k] ?? '').trim() !== v) return `${who}: ${k} vale «${d.props[k] ?? ''}»; se esperaba «${v}».`;
  return true;
}
function autoRules(xmlText) {
  const d = new DOMParser().parseFromString(String(xmlText).trim(), 'application/xml');
  if (d.getElementsByTagName('parsererror').length) return null;
  const root = d.documentElement, rules = [];
  const walkEl = (el, path) => {
    [...el.attributes].filter(a => !a.name.startsWith('xmlns')).forEach(a => rules.push(`${path ? path + '/' : ''}@${a.name} = /${root.nodeName}${path ? '/' + path : ''}/@${a.name}`));
    const kids = [...el.children];
    if (!kids.length && path) { rules.push(`${path} = /${root.nodeName}/${path}`); return; }
    kids.forEach(k => walkEl(k, path ? `${path}/${k.nodeName}` : k.nodeName));
  };
  walkEl(root, '');
  return { root: root.nodeName, rules };
}
const IDOC_SAMPLE = (name, city, zip, land, district, doc) => `<?xml version="1.0" encoding="UTF-8"?>
<DEBMAS06><IDOC BEGIN="1"><EDI_DC40 SEGMENT="1"><MESTYP>DEBMAS</MESTYP><IDOCTYP>DEBMAS06</IDOCTYP><SNDPOR>PORT_CPI</SNDPOR><SNDPRT>LS</SNDPRT><SNDPRN>XI_EDI</SNDPRN><DOCNUM>${doc}</DOCNUM><RCVPRN>ERPCLNT100</RCVPRN><RCVPRT>LS</RCVPRT></EDI_DC40><E1KNA1M SEGMENT="1"><MSGFN>009</MSGFN><NAME1>${name}</NAME1><ORT01>${city}</ORT01><PSTLZ>${zip}</PSTLZ><LAND1>${land}</LAND1><SPRAS>S</SPRAS><ORT02>${district}</ORT02></E1KNA1M></IDOC></DEBMAS06>`;
const BP_LIST = ['Empresa Demo SA', 'Distribuidora Andina', 'Café del Puerto', 'Logística Pampa SRL', 'Mate y Bombilla SA', 'Grupo Recoleta', 'Textil Rosario', 'Vinos de Cuyo', 'Puerto Madero Tech', 'Patagonia Foods'];
const COUNTRIES = {
  AR: ['Argentina', 'Buenos Aires'], CL: ['Chile', 'Santiago'], UY: ['Uruguay', 'Montevideo'], BR: ['Brazil', 'Brasilia'], MX: ['Mexico', 'Mexico City'], ES: ['Spain', 'Madrid'],
};
const RFC_BP = { '0001000125': ['EMPRESA DEMO SA', 'BUENOS AIRES', 'AR'], '0001000200': ['DISTRIBUIDORA CUYO SRL', 'MENDOZA', 'AR'] };
const BOOT = 'Escenarios guiados';

const sol001 = () => B([
  ['s', 'sender', 30, 260, { name: 'Postman' }], ['st', 'start', 230, 260], ['cm', 'contentModifier', 390, 260, { name: 'Hola Mundo', bodyType: 'Constant', body: 'Hola Mundo' }],
  ['sn', 'send', 560, 260], ['e', 'end', 720, 260], ['r', 'receiver', 940, 100, { name: 'SFTP_Demo' }]
], [['s', 'st', HA('/alumno/ejercicio_001')], ['st', 'cm'], ['cm', 'sn'], ['sn', 'e'],
  ['sn', 'r', { adapter: 'SFTP', directory: '/upload', fileName: 'archivo.txt', host: 'sftp.empresa-demo.example:22', ...SFTP_DEMO }]]);
const sftp001 = (r, d) => propsCheck(d, { directory: '/upload', fileName: 'archivo.txt', host: 'sftp.empresa-demo.example:22', credential: 'SFTP_Credential' }, 'Adaptador SFTP');

const SCENARIOS = [
  {
    id: 'b-001', group: BOOT, level: 'Clase 4', short: 'Clase 4 · Ejercicio_001: Hola Mundo a SFTP', title: 'Ejercicio_001: creación de iFlow y controles básicos',
    source: 'Escenario guiado · Clase N° 4 (P1), pasos 9 a 18',
    story: 'Tu primer iFlow: un endpoint HTTPS que arma el mensaje "Hola Mundo", lo deja como archivo en un servidor SFTP y lo devuelve como respuesta a Postman.',
    objectives: ['Comprender la estructura mínima de un iFlow y sus componentes.', 'Configurar un adaptador HTTPS en modo Sender para exponer un endpoint.', 'Diferenciar Message Headers y Exchange Properties.', 'Implementar lógica básica con Content Modifier.'],
    reqs: [
      'Conectá el Sender al Start con <b>HTTPS</b>: Address <code>/[tu-nombre]/ejercicio_001</code>, User Role <code>ESB_taller.send</code> y <b>CSRF Protected desmarcado</b>.',
      'Agregá un <b>Content Modifier</b>: pestaña Message Body, Type <i>Constant</i>, Body <code>Hola Mundo</code>.',
      'Agregá un <b>Send</b> después del Content Modifier y conectalo al Receiver <b>SFTP_Demo</b> con adaptador <b>SFTP</b>.',
      'SFTP: Directory <code>/upload</code>, File Name <code>archivo.txt</code>, Address <code>sftp.empresa-demo.example:22</code>, Proxy <i>Internet</i>, Authentication <i>User Name/Password</i>, Credential Name <code>SFTP_Credential</code>.',
      'El flujo queda: Start → Content Modifier → Send → End.'
    ],
    hints: ['Al elegir HTTPS, CSRF Protected viene marcado por defecto, igual que en CPI. Desmarcalo o Postman recibe 403.', 'El Send es una llamada asíncrona: deja el archivo en el SFTP y el mensaje sigue hasta el End, que responde al emisor.', 'Seleccioná la flecha Content Modifier → End y hacé clic en Send en la paleta para insertarlo.'],
    realSteps: ['Deploy y verificar en Monitor → Integrations and APIs que el estado sea Started.', 'Monitor → Manage Security → Connectivity Tests → SSH: host mq.empresa-demo.example, generar la Host Key y copiarla.', 'Security Material → Create → Known Hosts (SSH): pegar la Host Key y desplegar.', 'Postman: GET a la URL del endpoint con Basic Auth (credenciales del tenant). Respuesta esperada: 200 OK y "Hola Mundo".'],
    template: { senderName: 'Postman', receivers: ['SFTP_Demo'] },
    checks: [...httpsChecks('ejercicio_001'), { label: 'Content Modifier con body Constant', test: h => h.nodes('contentModifier').some(n => n.props.bodyType === 'Constant' && String(n.props.body).trim() === 'Hola Mundo') }, { label: 'Send conectado a SFTP_Demo por SFTP', test: h => { const e = h.recvEdge('SFTP_Demo'); return !!e && h.node(e.from)?.type === 'send' && e.props.adapter === 'SFTP'; } }],
    tests: [{ name: 'GET desde Postman', input: { headers: { CamelHttpMethod: 'GET' }, body: '' }, expect: r => {
      if (r.body.trim() !== 'Hola Mundo') return `La respuesta fue «${short(r.body)}»; se esperaba «Hola Mundo».`;
      const d = D(r, 'SFTP_Demo')[0]; if (!d) return 'No se dejó ningún archivo en SFTP_Demo.';
      if (d.via !== 'send') return 'El archivo tiene que salir desde un Send, no desde el End.';
      return d.body.trim() === 'Hola Mundo' ? sftp001(r, d) : `El archivo contiene «${short(d.body)}».`;
    } }],
    solution: sol001,
  },
  {
    id: 'b-001b', group: BOOT, level: 'Clase 4', short: 'Clase 4 · Ejercicio_001 (2): encriptar con PGP', title: 'Ejercicio_001, segundo escenario: encriptado PGP',
    source: 'Escenario guiado · Clase N° 4 (P1), pasos 29 a 34',
    story: 'El mismo iFlow, pero el archivo tiene que viajar encriptado. Generaste un par de claves PGP y las cargaste en el tenant con el nombre PGP_Taller.',
    objectives: ['Usar Security Elements para proteger el contenido del mensaje.', 'Entender que se encripta con la clave pública y se desencripta con la privada.'],
    reqs: [
      'Partís del Ejercicio_001 resuelto.',
      'Insertá un <b>PGP Encryptor</b> entre el Content Modifier y el Send.',
      'En Processing, usá la clave <code>PGP_Taller</code>.',
      'Postman y el SFTP tienen que recibir el mensaje encriptado.'
    ],
    hints: ['Seleccioná la flecha Content Modifier → Send y hacé clic en PGP Encryptor (grupo Seguridad).', 'Si el Encryptor queda antes del Content Modifier, el Content Modifier pisa el body con "Hola Mundo" en texto plano.'],
    realSteps: ['Generar las claves en pgpkeygen.com: RSA 2048 bits, expiración Never, con contraseña.', 'Monitor → Manage Security → PGP Keys: agregar la clave pública y la privada.', 'Volver a desplegar y probar en Postman: la respuesta llega encriptada.'],
    template: { flow: sol001 },
    checks: [{ label: 'PGP Encryptor con la clave PGP_Taller', test: h => h.nodes('pgpEncryptor').some(n => n.props.keyName === 'PGP_Taller') }, { label: 'El Encryptor va justo antes del Send', test: h => h.nodes('pgpEncryptor').some(n => h.outs(n.id).some(e => h.node(e.to)?.type === 'send')) }],
    tests: [{ name: 'GET desde Postman', input: { headers: { CamelHttpMethod: 'GET' }, body: '' }, expect: r => {
      const o = pgpOpen(r.body); if (!o) return `La respuesta no está encriptada: «${short(r.body)}».`;
      if (o.key !== 'PGP_Taller') return `Se encriptó con «${o.key}»; tiene que ser PGP_Taller.`;
      if (o.body.trim() !== 'Hola Mundo') return 'El contenido encriptado no es "Hola Mundo".';
      const d = D(r, 'SFTP_Demo')[0]; if (!d) return 'No se dejó ningún archivo en SFTP_Demo.';
      return pgpOpen(d.body) ? sftp001(r, d) : 'El archivo del SFTP no está encriptado.';
    } }],
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'Postman' }], ['st', 'start', 230, 260], ['cm', 'contentModifier', 390, 260, { name: 'Hola Mundo', bodyType: 'Constant', body: 'Hola Mundo' }],
      ['pg', 'pgpEncryptor', 560, 260, { keyName: 'PGP_Taller' }], ['sn', 'send', 730, 260], ['e', 'end', 890, 260], ['r', 'receiver', 1100, 100, { name: 'SFTP_Demo' }]
    ], [['s', 'st', HA('/alumno/ejercicio_001')], ['st', 'cm'], ['cm', 'pg'], ['pg', 'sn'], ['sn', 'e'],
      ['sn', 'r', { adapter: 'SFTP', directory: '/upload', fileName: 'archivo.txt', host: 'sftp.empresa-demo.example:22', ...SFTP_DEMO }]]),
  },
  {
    id: 'b-002', group: BOOT, level: 'Clase 4', short: 'Clase 4 · Ejercicio_002: SFTP + PGP + Data Store', title: 'Ejercicio_002: archivos SFTP con desencriptación PGP y persistencia',
    source: 'Escenario guiado · Clase N° 4 (P2)',
    story: 'El archivo encriptado que dejó el Ejercicio_001 hay que levantarlo del SFTP cada minuto, desencriptarlo y guardarlo en un Data Store para consultarlo después.',
    objectives: ['Configurar un adaptador SFTP en modo Sender con Scheduler.', 'Desencriptar con PGP Decryptor.', 'Persistir mensajes con Data Store.'],
    reqs: [
      'Sender <b>SFTP</b>: Directory <code>/upload</code>, File Name <code>archivo.txt</code>, Address <code>sftp.empresa-demo.example:22</code>, Credential <code>SFTP_Credential</code>.',
      'Processing: Post-Processing <i>Move File</i>. Scheduler: cada <code>1</code> minuto.',
      'Agregá un <b>PGP Decryptor</b> con la clave <code>PGP_Taller</code>.',
      'Agregá un <b>Data Store Write</b>: Data Store Name <code>ArchivoDescifrado</code>, Entry ID <code>1</code> y <b>Encrypt Stored Message desmarcado</b>.'
    ],
    hints: ['El body de prueba es el archivo encriptado que generó el Ejercicio_001 (segundo escenario).', 'Data Store Write viene con Encrypt Stored Message marcado: desmarcalo para poder leer el body al descargarlo.', 'La segunda prueba manda un archivo encriptado con otra clave: el iFlow tiene que fallar y no guardar nada.'],
    realSteps: ['Deploy y verificar el estado Started.', 'Monitor → Manage Stores → Data Stores: abrir ArchivoDescifrado, descargar la entrada y abrir el archivo body del .zip.'],
    template: { senderName: 'Servidor_SFTP', receivers: [] },
    checks: [
      { label: 'Sender SFTP en /upload/archivo.txt con SFTP_Credential', test: h => { const p = h.senderEdge()?.props || {}; return p.adapter === 'SFTP' && p.directory === '/upload' && p.fileName === 'archivo.txt' && p.credential === 'SFTP_Credential' && p.host === 'sftp.empresa-demo.example:22'; } },
      { label: 'Post-Processing Move File y Scheduler cada 1 minuto', test: h => { const p = h.senderEdge()?.props || {}; return p.postProcessing === 'Move File' && String(p.poll).trim() === '1'; } },
      { label: 'PGP Decryptor con la clave PGP_Taller', test: h => h.nodes('pgpDecryptor').some(n => n.props.keyName === 'PGP_Taller') },
      { label: 'Data Store ArchivoDescifrado, Entry ID 1, sin encriptar', test: h => h.nodes('dsWrite').some(n => n.props.dsName === 'ArchivoDescifrado' && String(n.props.entryId).trim() === '1' && !n.props.encrypt) },
    ],
    tests: [
      { name: 'Archivo encriptado con PGP_Taller', get input() { return { headers: { CamelFileName: 'archivo.txt' }, body: pgpSeal('Hola Mundo', 'PGP_Taller') }; }, expect: r => {
        const e = DS(r, 'ArchivoDescifrado').find(d => d.id === '1');
        if (!e) return 'No se guardó la entrada 1 en el Data Store ArchivoDescifrado.';
        if (e.encrypted) return 'La entrada quedó encriptada: desmarcá Encrypt Stored Message.';
        return e.body.trim() === 'Hola Mundo' || `Se guardó «${short(e.body)}»; se esperaba el texto desencriptado.`;
      } },
      { name: 'Archivo encriptado con otra clave', allowFail: true, get input() { return { headers: { CamelFileName: 'archivo.txt' }, body: pgpSeal('Hola Mundo', 'CLAVE_DE_OTRO') }; }, expect: r =>
        (r.status === 'FAILED' && !DS(r, 'ArchivoDescifrado').length) || 'Con una clave que no corresponde, el Decryptor tiene que fallar y no guardar nada.' },
    ],
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'Servidor_SFTP' }], ['st', 'start', 230, 260], ['pg', 'pgpDecryptor', 400, 260, { keyName: 'PGP_Taller', signatures: 'Signatures Optional' }],
      ['ds', 'dsWrite', 580, 260, { dsName: 'ArchivoDescifrado', entryId: '1', encrypt: false }], ['e', 'end', 750, 260]
    ], [['s', 'st', { adapter: 'SFTP', directory: '/upload', fileName: 'archivo.txt', host: 'sftp.empresa-demo.example:22', ...SFTP_DEMO, postProcessing: 'Move File', poll: '1' }], ['st', 'pg'], ['pg', 'ds'], ['ds', 'e']]),
  },
  {
    id: 'b-003', group: BOOT, level: 'Clase 5', short: 'Clase 5 · Ejercicio_003: Router + Mapping + Multicast', title: 'Ejercicio_003: enrutamiento, transformación y procesamiento paralelo',
    source: 'Escenario guiado · Clase N° 5',
    story: 'El endpoint recibe credenciales en inglés (<Credential>) o en español (<Accesos>) y devuelve la estructura en el otro idioma, en JSON. Además guarda una copia en un Data Store en paralelo.',
    objectives: ['Implementar lógica de enrutamiento con Router.', 'Transformar estructuras con Message Mapping (inglés ↔ español).', 'Convertir XML a JSON y definir Content-Type.', 'Procesar en paralelo con Parallel Multicast y persistir con Data Store.'],
    reqs: [
      'Sender <b>HTTPS</b>: <code>/[tu-nombre]/ejercicio_003</code>, User Role <code>ESB_taller.send</code>, CSRF desmarcado.',
      '<b>Router</b> con ruta <b>EN</b> (XML, condición <code>//Credential</code>) hacia un Message Mapping <b>EN-&gt;ES</b>: raíz <code>Accesos</code>, <code>Usuario = /Credential/User</code>, <code>Clave = /Credential/Password</code>.',
      'Ruta <b>ES</b> (XML, condición <code>//Accesos</code>) hacia un Message Mapping <b>ES-&gt;EN</b>: raíz <code>Credential</code>, <code>User = /Accesos/Usuario</code>, <code>Password = /Accesos/Clave</code>.',
      'Ambos mappings van a un único <b>XML to JSON Converter</b> y después a un <b>Content Modifier</b> con el header <code>Content-type</code> = <code>application/json</code> (Constant).',
      '<b>Parallel Multicast</b>: una rama al End Message y otra a un <b>Data Store Write</b> <code>Multicast_Message</code> (sin encriptar) seguido de su propio End.',
      'Ruta <b>Default</b> (Default Route): Content Modifier con body Constant <code>Ocurrió un error</code> → End.'
    ],
    hints: ['En la guía, la segunda ruta aparece nombrada "EN" por error: acá usala como "ES".', 'Dos flechas pueden llegar al mismo XML to JSON Converter; lo que no se permite es que un paso común tenga dos salidas.', 'Usá el botón "Mapeo automático por nombre" solo si los nombres coinciden; acá cambian de idioma, así que escribí las reglas a mano.', 'El Multicast responde con la primera rama: conectá primero la flecha que va al End.'],
    realSteps: ['Postman: POST con body raw XML, probar la estructura en español y la en inglés.', 'Monitor → Manage Stores → Data Stores: revisar Multicast_Message y descargar el body.'],
    template: { senderName: 'Postman', receivers: [] },
    checks: [
      ...httpsChecks('ejercicio_003'),
      { label: 'Router con rutas EN, ES y una Default', test: h => h.nodes('router').some(n => { const o = h.outs(n.id); return o.length === 3 && o.filter(e => e.props.isDefault).length === 1; }) },
      { label: 'Dos Message Mapping', test: h => h.nodes('mapping').length >= 2 },
      { label: 'Parallel Multicast con 2 ramas', test: h => h.nodes('multicast').some(n => n.props.mode === 'Parallel Multicast' && h.outs(n.id).length >= 2) },
      { label: 'Data Store Multicast_Message sin encriptar', test: h => h.nodes('dsWrite').some(n => n.props.dsName === 'Multicast_Message' && !n.props.encrypt) },
    ],
    tests: [
      { name: 'Credenciales en inglés', input: { headers: {}, body: '<Credential><User>demo</User><Password>12345678</Password></Credential>' }, expect: r => {
        const j = J(r.body); if (!j?.Accesos) return `Se esperaba JSON con "Accesos" y llegó «${short(r.body)}».`;
        if (j.Accesos.Usuario !== 'demo' || j.Accesos.Clave !== '12345678') return 'Los campos Usuario/Clave no tienen los valores de User/Password.';
        if (!/^application\/json$/i.test(String(hdr(r.headers, 'content-type') || ''))) return 'Falta el header Content-type = application/json.';
        const ds = DS(r, 'Multicast_Message'); if (ds.length !== 1) return 'El Multicast no guardó una copia en Multicast_Message.';
        return !ds[0].encrypted || 'La copia del Data Store quedó encriptada.';
      } },
      { name: 'Credenciales en español', input: { headers: {}, body: '<Accesos><Usuario>usuario</Usuario><Clave>12345678</Clave></Accesos>' }, expect: r => {
        const j = J(r.body); if (!j?.Credential) return `Se esperaba JSON con "Credential" y llegó «${short(r.body)}».`;
        return (j.Credential.User === 'usuario' && j.Credential.Password === '12345678') || 'Los campos User/Password no tienen los valores de Usuario/Clave.';
      } },
      { name: 'Estructura no esperada', input: { headers: {}, body: '<Pedido><Id>1</Id></Pedido>' }, expect: r => r.body.trim() === 'Ocurrió un error' || `La ruta Default debería responder «Ocurrió un error» y respondió «${short(r.body)}».` },
    ],
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'Postman' }], ['st', 'start', 220, 260], ['rt', 'router', 350, 260],
      ['m1', 'mapping', 510, 150, { name: 'EN->ES', targetRoot: 'Accesos', rules: 'Usuario = /Credential/User\nClave = /Credential/Password' }],
      ['m2', 'mapping', 510, 330, { name: 'ES->EN', targetRoot: 'Credential', rules: 'User = /Accesos/Usuario\nPassword = /Accesos/Clave' }],
      ['cv', 'xmlToJson', 680, 240], ['cm', 'contentModifier', 840, 240, { name: 'Content-type', headers: [row('Content-type', 'Constant', 'application/json')] }],
      ['mc', 'multicast', 980, 240, { mode: 'Parallel Multicast' }], ['e1', 'end', 1110, 240], ['ds', 'dsWrite', 1070, 390, { dsName: 'Multicast_Message', encrypt: false }], ['e2', 'end', 1220, 390],
      ['ce', 'contentModifier', 510, 490, { name: 'Error', bodyType: 'Constant', body: 'Ocurrió un error' }], ['e3', 'end', 680, 490]
    ], [['s', 'st', HA('/alumno/ejercicio_003')], ['st', 'rt'],
      ['rt', 'm1', { name: 'EN', exprType: 'XML', condition: '//Credential', isDefault: false }], ['rt', 'm2', { name: 'ES', exprType: 'XML', condition: '//Accesos', isDefault: false }], ['rt', 'ce', { name: 'Default', exprType: 'XML', condition: '', isDefault: true }],
      ['m1', 'cv'], ['m2', 'cv'], ['cv', 'cm'], ['cm', 'mc'], ['mc', 'e1'], ['mc', 'ds'], ['ds', 'e2'], ['ce', 'e3']]),
  },
  {
    id: 'b-004', group: BOOT, level: 'Clase 8', short: 'Clase 8 · Ejercicio_004: Event Mesh por AMQP', title: 'Ejercicio_004: consumo de una cola por AMQP',
    source: 'Escenario guiado · Clase N° 8',
    story: 'Un mensaje publicado en el tópico de Event Mesh llega a tu cola. El iFlow lo consume por AMQP, guarda la petición, llama al Ejercicio_003 y guarda la respuesta.',
    objectives: ['Comprender la integración de colas de mensajería con Integration Suite.', 'Configurar el adaptador AMQP en un iFlow.', 'Procesar los mensajes consumidos de una cola.'],
    reqs: [
      'Sender <b>AMQP</b> (transporte TCP): Host <code>mq.empresa-demo.example</code>, Port <code>5672</code>, Queue Name <code>QUEUE_0XX</code> (tu número entre 001 y 030).',
      '<b>Data Store Write</b> <code>Request_AMQP</code> para guardar la petición.',
      '<b>Request Reply</b> al Receiver <b>Ejercicio_003</b> con adaptador <b>HTTP</b>: Address con la URL de tu <code>/ejercicio_003</code>, método POST, Credential Name <code>CPI_ServiceKey</code>.',
      'Otro <b>Data Store Write</b> <code>Response_CPI</code> para guardar la respuesta, y después el End.'
    ],
    hints: ['La guía crea la credencial como "CPI_Service_key" pero el adaptador usa "CPI_ServiceKey": el nombre tiene que coincidir exactamente.', 'El Data Store guarda el body tal como está en ese punto: antes del Request Reply es la petición, después es la respuesta.'],
    realSteps: ['Security Material → Create → User Credentials: CPI_ServiceKey con el ClientId y ClientSecret del Service Key.', 'Deploy.', 'Publicar en el tópico (POST a la URL del tópico de tu Event Mesh) un body <Accesos> con tu nombre: debe devolver 200.', 'Revisar en Data Stores las entradas de Request_AMQP y Response_CPI.'],
    template: { senderName: 'Event_Mesh', receivers: ['Ejercicio_003'] },
    mockInfo: 'Ejercicio_003 es tu iFlow de la Clase 5: recibe <Accesos> y responde la estructura en inglés como JSON.',
    mocks: { Ejercicio_003: d => { const u = X(d.body, '/Accesos/Usuario'); return u ? { body: JSON.stringify({ Credential: { User: u, Password: X(d.body, '/Accesos/Clave') } }) } : { error: 'HTTP 500: Ocurrió un error' }; } },
    checks: [
      { label: 'Sender AMQP con host, puerto y una cola QUEUE_001…QUEUE_030', test: h => { const p = h.senderEdge()?.props || {}; return p.adapter === 'AMQP' && p.host === 'mq.empresa-demo.example' && String(p.port) === '5672' && /^QUEUE_0(0[1-9]|[12]\d|30)$/.test(String(p.queue || '').trim()); } },
      { label: 'Request Reply a Ejercicio_003 por HTTP con CPI_ServiceKey', test: h => { const e = h.recvEdge('Ejercicio_003'); return !!e && h.node(e.from)?.type === 'requestReply' && e.props.adapter === 'HTTP' && e.props.credential === 'CPI_ServiceKey' && /\/ejercicio_003\b/.test(e.props.address || ''); } },
    ],
    tests: [{ name: 'Mensaje publicado en el tópico', input: { headers: {}, body: '<Accesos><Usuario>agus</Usuario><Clave>12345678</Clave></Accesos>' }, expect: r => {
      const req = DS(r, 'Request_AMQP')[0], res = DS(r, 'Response_CPI')[0];
      if (!req) return 'No se guardó la petición en Request_AMQP.';
      if (!/<Usuario>agus<\/Usuario>/.test(req.body)) return 'Request_AMQP no tiene el XML original: tiene que ir antes del Request Reply.';
      if (!res) return 'No se guardó la respuesta en Response_CPI.';
      const c = CALL(r, 'Ejercicio_003'); if (!c || c.props.method !== 'POST') return 'La llamada a Ejercicio_003 tiene que ser POST.';
      return J(res.body)?.Credential?.User === 'agus' || 'Response_CPI no tiene la respuesta del Ejercicio_003: tiene que ir después del Request Reply.';
    } }],
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'Event_Mesh' }], ['st', 'start', 220, 260], ['d1', 'dsWrite', 370, 260, { name: 'Guardar petición', dsName: 'Request_AMQP', encrypt: false }],
      ['rr', 'requestReply', 540, 260, { name: 'Llamar Ejercicio_003' }], ['d2', 'dsWrite', 710, 260, { name: 'Guardar respuesta', dsName: 'Response_CPI', encrypt: false }], ['e', 'end', 870, 260],
      ['r', 'receiver', 1080, 100, { name: 'Ejercicio_003' }]
    ], [['s', 'st', { adapter: 'AMQP', host: 'mq.empresa-demo.example', port: '5672', queue: 'QUEUE_007' }], ['st', 'd1'], ['d1', 'rr'], ['rr', 'd2'], ['d2', 'e'],
      ['rr', 'r', { adapter: 'HTTP', address: 'https://<tenant>.it-cpi.cfapps.eu10-002.hana.ondemand.com/http/alumno/ejercicio_003', proxy: 'Internet', method: 'POST', auth: 'Basic', credential: 'CPI_ServiceKey' }]]),
  },
  {
    id: 'b-odata', group: BOOT, level: 'Clase 10', short: 'Clase 10 · Ejercicio_004: consumo OData', title: 'Ejercicio_004: consumo dinámico de OData',
    source: 'Escenario guiado · Clase N° 10',
    story: 'Un endpoint HTTPS consulta los Business Partners de S/4HANA por OData V2. Los parámetros de la URL (por ejemplo $top=5) pasan directo a la consulta, y la respuesta vuelve en JSON.',
    objectives: ['Consumir servicios OData con el adaptador OData V2.', 'Gestionar parámetros dinámicos desde la URL de entrada.', 'Convertir XML a JSON y configurar headers con Content Modifier.'],
    reqs: [
      'Sender <b>HTTPS</b>: <code>/[tu-nombre]/ejercicio_004</code>, User Role <code>ESB_taller.send</code>, CSRF desmarcado.',
      '<b>Request Reply</b> al Receiver <b>S4_BP</b> con adaptador <b>OData</b>: Address <code>https://s4.empresa-demo.example/sap/opu/odata/sap/API_BUSINESS_PARTNER</code>, Proxy <i>Internet</i>, Authentication <i>Basic</i>, <b>CSRF Protected desmarcado</b>.',
      'Processing: Operation <i>Query (GET)</i>, Resource Path <code>A_BusinessPartner</code>, Query Options <code>${header.CamelHttpQuery}</code>.',
      '<b>XML to JSON Converter</b> con <b>Use Namespace Mapping desmarcado</b>.',
      '<b>Content Modifier</b> con header <code>Content-Type</code> = <code>application/json</code>.'
    ],
    hints: ['CamelHttpQuery es el header que CPI arma con todo lo que viene después del "?" en la URL de entrada.', 'En la pestaña Probar, el header CamelHttpQuery=$top=5 simula el parámetro de Postman.'],
    realSteps: ['En Resource Path usar el botón Select, completar la conexión y elegir la entidad A_BusinessPartner.', 'Postman: GET al endpoint con Basic Auth y el parámetro $top = 5. Respuesta: 200 OK con 5 resultados.'],
    template: { senderName: 'Postman', receivers: ['S4_BP'] },
    mocks: { S4_BP: d => {
      const n = Math.min(10, Math.max(1, parseInt((String(d.props.query || '').match(/\$top=(\d+)/) || [])[1] || '10', 10)));
      return { body: `<A_BusinessPartner>${BP_LIST.slice(0, n).map((nm, i) => `<A_BusinessPartnerType><BusinessPartner>${1000101 + i}</BusinessPartner><BusinessPartnerFullName>${nm}</BusinessPartnerFullName><BusinessPartnerCategory>2</BusinessPartnerCategory></A_BusinessPartnerType>`).join('')}</A_BusinessPartner>` };
    } },
    mockInfo: 'S4_BP devuelve tantos Business Partners como indique $top (10 si no se indica).',
    checks: [
      ...httpsChecks('ejercicio_004'),
      { label: 'OData a S4_BP: A_BusinessPartner con CSRF desmarcado', test: h => { const e = h.recvEdge('S4_BP'); return !!e && e.props.adapter === 'OData' && e.props.resourcePath === 'A_BusinessPartner' && !e.props.csrf && e.props.operation === 'Query (GET)'; } },
      { label: 'Query Options con ${header.CamelHttpQuery}', test: h => /\$\{header\.CamelHttpQuery\}/.test(h.recvEdge('S4_BP')?.props.query || '') },
      { label: 'XML to JSON sin Use Namespace Mapping', test: h => h.nodes('xmlToJson').some(n => !n.props.useNsMapping) },
    ],
    tests: [5, 2].map(n => ({ name: `GET con $top=${n}`, input: { headers: { CamelHttpQuery: `$top=${n}` }, body: '' }, expect: r => {
      const c = CALL(r, 'S4_BP'); if (!c) return 'No se llamó a S4_BP con un Request Reply.';
      if (String(c.props.query).trim() !== `$top=${n}`) return `La consulta OData salió con Query Options «${c.props.query}».`;
      const list = J(r.body)?.A_BusinessPartner?.A_BusinessPartnerType;
      if (!Array.isArray(list)) return `La respuesta no es el JSON esperado: «${short(r.body)}».`;
      if (list.length !== n) return `Llegaron ${list.length} Business Partners y se pidieron ${n}.`;
      return /^application\/json$/i.test(String(hdr(r.headers, 'content-type') || '')) || 'Falta el header Content-Type = application/json.';
    } })),
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'Postman' }], ['st', 'start', 230, 260], ['rr', 'requestReply', 390, 260, { name: 'Consultar BP' }],
      ['cv', 'xmlToJson', 560, 260, { useNsMapping: false }], ['cm', 'contentModifier', 730, 260, { name: 'Content-Type', headers: [row('Content-Type', 'Constant', 'application/json')] }], ['e', 'end', 890, 260],
      ['r', 'receiver', 1100, 100, { name: 'S4_BP' }]
    ], [['s', 'st', HA('/alumno/ejercicio_004')], ['st', 'rr'], ['rr', 'cv'], ['cv', 'cm'], ['cm', 'e'],
      ['rr', 'r', { adapter: 'OData', address: 'https://s4.empresa-demo.example/sap/opu/odata/sap/API_BUSINESS_PARTNER', proxy: 'Internet', auth: 'Basic', credential: 'S4_CREDENTIAL', csrf: false, operation: 'Query (GET)', resourcePath: 'A_BusinessPartner', query: '${header.CamelHttpQuery}' }]]),
  },
  {
    id: 'b-006', group: BOOT, level: 'Clase 11', short: 'Clase 11 · Ejercicio_006: IDoc XML inbound', title: 'Ejercicio_006: envío de un IDoc DEBMAS06 al backend',
    source: 'Escenario guiado · Clase N° 11',
    story: 'Un sistema externo manda clientes en formato IDoc DEBMAS06. El iFlow los mapea a la estructura del backend y los envía al servicio /sap/bc/idoc_xml por HTTP, a través del Cloud Connector.',
    objectives: ['Consumir el servicio de recepción de IDoc con el adaptador HTTP.', 'Implementar Request Reply para comunicación síncrona.', 'Comprender la estructura de un IDoc en XML.'],
    reqs: [
      'Sender <b>HTTPS</b>: <code>/[tu-nombre]/ejercicio_006</code>, User Role <code>ESB_taller.send</code>, CSRF desmarcado.',
      '<b>Message Mapping</b> <i>DEBMAS</i> antes del Request Reply, con raíz destino <code>_-ISDFPS_-DEBMAS06</code> y todos los campos mapeados por nombre.',
      '<b>Request Reply</b> al Receiver <b>ERP_IDoc</b> con <b>HTTP</b>: Address <code>http://erp-interno:443/sap/bc/idoc_xml</code>, Proxy <i>On-Premise</i>, Method <i>POST</i>, Authentication <i>Basic</i>, Credential <code>ERP_CREDENTIAL</code>.'
    ],
    hints: ['Con el body de ejemplo cargado en Probar, usá el botón "Mapeo automático por nombre" del Message Mapping y después cambiá el elemento raíz destino.', 'Proxy On-Premise significa que la llamada pasa por el Cloud Connector hacia el sistema interno.', 'Status 64 en la respuesta: el IDoc quedó listo para pasar a la aplicación.'],
    realSteps: ['Descargar CLIENTE_REQUEST.xsd y DEBMAS.xsd del GitHub del curso y cargarlos en la pestaña References del iFlow.', 'En el Message Mapping, asignar una constante vacía a los campos obligatorios que quedan en rojo.', 'Postman: body raw XML con SAMPLE_REQUEST.xml. Respuesta: 200 OK.'],
    template: { senderName: 'Postman', receivers: ['ERP_IDoc'] },
    mocks: { ERP_IDoc: d => {
      if (X(d.body, 'name(/*)') !== '_-ISDFPS_-DEBMAS06') return { error: 'HTTP 500: el IDoc no tiene la estructura _-ISDFPS_-DEBMAS06' };
      const name = X(d.body, '//E1KNA1M/NAME1'); if (!name) return { error: 'HTTP 500: falta NAME1 en el segmento E1KNA1M' };
      return { body: `<IDocResponse><DOCNUM>0000000000412345</DOCNUM><STATUS>64</STATUS><MESSAGE>IDoc DEBMAS06 recibido para ${name}</MESSAGE></IDocResponse>` };
    } },
    mockInfo: 'ERP_IDoc acepta la estructura _-ISDFPS_-DEBMAS06 y responde con el número de IDoc y el status 64.',
    checks: [
      ...httpsChecks('ejercicio_006'),
      { label: 'Message Mapping con raíz _-ISDFPS_-DEBMAS06', test: h => h.nodes('mapping').some(n => String(n.props.targetRoot).trim() === '_-ISDFPS_-DEBMAS06') },
      { label: 'HTTP a ERP_IDoc: POST, On-Premise, ERP_CREDENTIAL', test: h => { const e = h.recvEdge('ERP_IDoc'); return !!e && e.props.adapter === 'HTTP' && e.props.method === 'POST' && e.props.proxy === 'On-Premise' && e.props.credential === 'ERP_CREDENTIAL' && /\/sap\/bc\/idoc_xml$/.test(e.props.address || ''); } },
    ],
    tests: [
      ['CLIENTE DEMO 1X', 'BUENOS AIRES', 'C1043AAX', 'AR', 'RECOLETA', '100000000000001X'],
      ['CLIENTE DEMO 2X', 'SANTIAGO', '8320000', 'CL', 'PROVIDENCIA', '100000000000002X'],
    ].map(v => ({ name: `IDoc de ${v[0]}`, input: { headers: {}, body: IDOC_SAMPLE(...v) }, expect: r => {
      const c = CALL(r, 'ERP_IDoc'); if (!c) return 'No se llamó a ERP_IDoc con un Request Reply.';
      for (const [p, val] of [['//EDI_DC40/MESTYP', 'DEBMAS'], ['//EDI_DC40/DOCNUM', v[5]], ['//E1KNA1M/NAME1', v[0]], ['//E1KNA1M/LAND1', v[3]], ['//E1KNA1M/ORT01', v[1]], ['//IDOC/@BEGIN', '1']]) {
        const got = X(c.body, p); if (got !== val) return `En el IDoc enviado, ${p} vale «${got ?? ''}»; se esperaba «${val}». Revisá las reglas del mapping.`;
      }
      return X(r.body, '//STATUS') === '64' || `La respuesta del backend no tiene status 64: «${short(r.body)}».`;
    } })),
    solution: () => {
      const a = autoRules(IDOC_SAMPLE('A', 'B', 'C', 'D', 'E', 'F'));
      return B([
        ['s', 'sender', 30, 260, { name: 'Postman' }], ['st', 'start', 230, 260], ['mm', 'mapping', 390, 260, { name: 'DEBMAS', targetRoot: '_-ISDFPS_-DEBMAS06', rules: a.rules.join('\n') }],
        ['rr', 'requestReply', 560, 260, { name: 'Enviar IDoc' }], ['e', 'end', 720, 260], ['r', 'receiver', 940, 100, { name: 'ERP_IDoc' }]
      ], [['s', 'st', HA('/alumno/ejercicio_006')], ['st', 'mm'], ['mm', 'rr'], ['rr', 'e'],
        ['rr', 'r', { adapter: 'HTTP', address: 'http://erp-interno:443/sap/bc/idoc_xml', proxy: 'On-Premise', method: 'POST', auth: 'Basic', credential: 'ERP_CREDENTIAL' }]]);
    },
  },
  {
    id: 'b-007', group: BOOT, level: 'Clase 12', short: 'Clase 12 · Ejercicio_007: consumo RFC', title: 'Ejercicio_007: consumo de una función RFC',
    source: 'Escenario guiado · Clase N° 12',
    story: 'Se recibe un id de cliente en JSON y se consulta la función RFC Z_WS_GET_BP_DATA en el backend. La respuesta vuelve en JSON.',
    objectives: ['Consumir servicios RFC con el adaptador RFC.', 'Transformar con Message Mapping basado en XSD y WSDL.', 'Convertir JSON ↔ XML alrededor de la llamada.'],
    reqs: [
      'Sender <b>HTTPS</b>: <code>/[tu-nombre]/ejercicio_007</code>, User Role <code>ESB_taller.send</code>, CSRF desmarcado.',
      '<b>JSON to XML Converter</b> con <i>Add XML Root Element</i> desmarcado, para que <code>id-cliente</code> quede como raíz.',
      '<b>Message Mapping</b> <i>RFC</i>: raíz destino <code>ZGetBpDataRfc</code>, regla <code>IV_PARTNER = /id-cliente</code>.',
      '<b>Request Reply</b> al Receiver <b>ERP_RFC</b> con adaptador <b>RFC</b>, Destination <code>ERP_RFC_DEST</code>.',
      '<b>XML to JSON Converter</b> y <b>Content Modifier</b> con header <code>Content-type</code> = <code>application/json</code>.'
    ],
    hints: ['La guía conecta el End Message directo al RFC y después suma los conversores. Acá usás Request Reply para que la respuesta del BP vuelva a Postman, que es el resultado final de la guía.', 'Si dejás Add XML Root Element marcado, el XML queda <root><id-cliente> y el XPath /id-cliente no encuentra nada.'],
    realSteps: ['Descargar id_cliente_request.xsd y z_ws_get_bp_data.wsdl y cargarlos en References.', 'En el Message Mapping, elegir el elemento ZGetBpDataRfc del WSDL y relacionar id-cliente con IV_PARTNER.', 'El Destination ERP_RFC_DEST se configura en el subaccount y llega al backend por Cloud Connector.'],
    template: { senderName: 'Postman', receivers: ['ERP_RFC'] },
    mocks: { ERP_RFC: d => {
      const id = X(d.body, '/ZGetBpDataRfc/IV_PARTNER') || '';
      const bp = RFC_BP[id];
      return { body: bp ? `<ZGetBpDataRfcResponse><ES_BP_DATA><PARTNER>${id}</PARTNER><NAME_ORG1>${bp[0]}</NAME_ORG1><CITY1>${bp[1]}</CITY1><COUNTRY>${bp[2]}</COUNTRY></ES_BP_DATA></ZGetBpDataRfcResponse>` : `<ZGetBpDataRfcResponse><EV_MESSAGE>El interlocutor «${id}» no existe</EV_MESSAGE></ZGetBpDataRfcResponse>` };
    } },
    mockInfo: 'ERP_RFC conoce los interlocutores 0001000125 y 0001000200.',
    checks: [...httpsChecks('ejercicio_007'), { label: 'RFC a ERP_RFC con Destination ERP_RFC_DEST', test: h => { const e = h.recvEdge('ERP_RFC'); return !!e && e.props.adapter === 'RFC' && e.props.destination === 'ERP_RFC_DEST'; } }],
    tests: Object.entries(RFC_BP).map(([id, bp]) => ({ name: `Cliente ${id}`, input: { headers: {}, body: `{"id-cliente":"${id}"}` }, expect: r => {
      const c = CALL(r, 'ERP_RFC'); if (!c) return 'No se llamó a ERP_RFC con un Request Reply.';
      if (X(c.body, '/ZGetBpDataRfc/IV_PARTNER') !== id) return `La llamada RFC salió con «${short(c.body)}»; IV_PARTNER tiene que valer ${id}.`;
      const j = J(r.body); if (j?.ZGetBpDataRfcResponse?.ES_BP_DATA?.NAME_ORG1 !== bp[0]) return `La respuesta no tiene el JSON del interlocutor: «${short(r.body)}».`;
      return /^application\/json$/i.test(String(hdr(r.headers, 'content-type') || '')) || 'Falta el header Content-type = application/json.';
    } })),
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'Postman' }], ['st', 'start', 220, 260], ['c1', 'jsonToXml', 370, 260, { addRoot: false, useNsMapping: false }],
      ['mm', 'mapping', 530, 260, { name: 'RFC', targetRoot: 'ZGetBpDataRfc', rules: 'IV_PARTNER = /id-cliente' }], ['rr', 'requestReply', 690, 260, { name: 'Z_WS_GET_BP_DATA' }],
      ['c2', 'xmlToJson', 850, 260, { useNsMapping: false }], ['cm', 'contentModifier', 1010, 260, { name: 'Content-type', headers: [row('Content-type', 'Constant', 'application/json')] }], ['e', 'end', 1160, 260],
      ['r', 'receiver', 1000, 70, { name: 'ERP_RFC' }]
    ], [['s', 'st', HA('/alumno/ejercicio_007')], ['st', 'c1'], ['c1', 'mm'], ['mm', 'rr'], ['rr', 'c2'], ['c2', 'cm'], ['cm', 'e'], ['rr', 'r', { adapter: 'RFC', destination: 'ERP_RFC_DEST' }]]),
  },
  {
    id: 'b-008', group: BOOT, level: 'Clase 13', short: 'Clase 13 · Ejercicio_008: Web Service SOAP', title: 'Ejercicio_008: consumo de un Web Service SOAP',
    source: 'Escenario guiado · Clase N° 13',
    story: 'Se recibe un código de país en JSON, se consulta el servicio SOAP CountryInfoService y un Local Integration Process arma una respuesta JSON con el nombre, la capital y la bandera. Si algo falla, se responde un error controlado.',
    objectives: ['Transformar JSON a XML y adaptar con Message Mapping al WSDL.', 'Consumir Web Services con el adaptador SOAP.', 'Procesar la respuesta con XPath en un Local Integration Process.', 'Manejar errores con Exception Subprocess.'],
    reqs: [
      'Sender <b>HTTPS</b>: <code>/[tu-nombre]/ejercicio_008</code>, User Role <code>ESB_taller.send</code>, CSRF desmarcado.',
      '<b>JSON to XML Converter</b> con <i>Use Namespace Mapping</i> y <i>Add XML Root Element</i> desmarcados.',
      '<b>Message Mapping</b> <i>CountryInfoMapping</i>: raíz <code>FullCountryInfo</code>, regla <code>sCountryISOCode = /root/PaisISOCode</code>.',
      '<b>Request Reply</b> al Receiver <b>CountryInfoService</b> con <b>SOAP</b>: Address <code>http://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso</code>, Proxy <i>Internet</i>, Operation <code>FullCountryInfo</code>, Authentication <i>None</i>.',
      'Un <b>Local Integration Process</b> llamado <code>Procesar Respuesta</code> con un Content Modifier: header <code>Content-Type</code> = <code>Application/json</code>; properties <code>namePais</code>, <code>capital</code> y <code>urlBandera</code> por XPath (<code>//*:FullCountryInfoResult/*:sName/text()</code>, <code>…/*:sCapitalCity/text()</code>, <code>…/*:sCountryFlag/text()</code>); body <code>{"País": "${property.namePais}", "Capital": "${property.capital}", "Bandera": "${property.urlBandera}"}</code>',
      'Un <b>Process Call</b> después del Request Reply que ejecute <i>Procesar Respuesta</i>.',
      '<b>Exception Subprocess</b> con un Content Modifier de body <code>{"message": "Ocurrió un error"}</code>.'
    ],
    hints: ['*: en el XPath significa "cualquier namespace": la respuesta SOAP viene con prefijo m:.', 'El Local Integration Process se agrega desde el grupo Procesos de la paleta. El nombre de su inicio es el que elegís en el Process Call.', 'La segunda prueba manda un país que no existe: el servicio responde con un SOAP Fault y entra el Exception Subprocess.'],
    realSteps: ['Cargar el XSD source_country y el WSDL CountryInfoService_1 en References.', 'En el adaptador SOAP elegir el WSDL con Select, la operación FullCountryInfo y marcar Return HTTP Response Code as Header.', 'Postman: body raw JSON {"root":{"PaisISOCode":"AR"}}. Respuesta: 200 OK con los datos del país.'],
    template: { senderName: 'Postman', receivers: ['CountryInfoService'] },
    mocks: { CountryInfoService: d => {
      const iso = X(d.body, "//*[local-name()='sCountryISOCode']") || '';
      const c = COUNTRIES[iso]; if (!c) return { error: 'SOAP Fault: Country not found' };
      return { body: `<m:FullCountryInfoResponse xmlns:m="http://www.oorsprong.org/websamples.countryinfo"><m:FullCountryInfoResult><m:sISOCode>${iso}</m:sISOCode><m:sName>${c[0]}</m:sName><m:sCapitalCity>${c[1]}</m:sCapitalCity><m:sPhoneCode>54</m:sPhoneCode><m:sCountryFlag>http://www.oorsprong.org/WebSamples.CountryInfo/Flags/${c[0]}.jpg</m:sCountryFlag></m:FullCountryInfoResult></m:FullCountryInfoResponse>` };
    } },
    mockInfo: 'CountryInfoService conoce AR, CL, UY, BR, MX y ES. Para otros códigos responde con un SOAP Fault.',
    checks: [
      ...httpsChecks('ejercicio_008'),
      { label: 'SOAP a CountryInfoService con la operación FullCountryInfo', test: h => { const e = h.recvEdge('CountryInfoService'); return !!e && e.props.adapter === 'SOAP' && e.props.operation === 'FullCountryInfo'; } },
      { label: 'Local Integration Process «Procesar Respuesta» llamado desde un Process Call', test: h => h.nodes('lipStart').some(n => label(n) === 'Procesar Respuesta') && h.nodes('processCall').some(n => n.props.process === 'Procesar Respuesta') },
      { label: 'Hay un Exception Subprocess', test: h => h.has('errorStart') },
    ],
    tests: [
      { name: 'País AR', input: { headers: {}, body: '{"root":{"PaisISOCode":"AR"}}' }, expect: r => {
        const c = CALL(r, 'CountryInfoService'); if (!c) return 'No se llamó a CountryInfoService.';
        if (X(c.body, "//*[local-name()='sCountryISOCode']") !== 'AR') return `El request SOAP no lleva sCountryISOCode = AR: «${short(c.body)}».`;
        const j = J(r.body); if (!j) return `La respuesta no es JSON válido: «${short(r.body)}».`;
        if (j['País'] !== 'Argentina' || j.Capital !== 'Buenos Aires') return `Se esperaba País Argentina y Capital Buenos Aires: «${short(r.body)}».`;
        if (!/Flags\/Argentina\.jpg$/.test(j.Bandera || '')) return 'Falta la URL de la bandera.';
        return /^application\/json$/i.test(String(hdr(r.headers, 'content-type') || '')) || 'Falta el header Content-Type.';
      } },
      { name: 'País inexistente', input: { headers: {}, body: '{"root":{"PaisISOCode":"ZZ"}}' }, expect: r => J(r.body)?.message === 'Ocurrió un error' || `El Exception Subprocess debería responder {"message": "Ocurrió un error"} y respondió «${short(r.body)}».` },
    ],
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'Postman' }], ['st', 'start', 220, 260], ['cv', 'jsonToXml', 370, 260, { addRoot: false, useNsMapping: false }],
      ['mm', 'mapping', 530, 260, { name: 'CountryInfoMapping', targetRoot: 'FullCountryInfo', rules: 'sCountryISOCode = /root/PaisISOCode' }], ['rr', 'requestReply', 690, 260, { name: 'FullCountryInfo' }],
      ['pc', 'processCall', 850, 260, { process: 'Procesar Respuesta' }], ['e', 'end', 1000, 260], ['r', 'receiver', 1220, 80, { name: 'CountryInfoService' }],
      ['ls', 'lipStart', 300, 450, { name: 'Procesar Respuesta' }],
      ['cl', 'contentModifier', 470, 450, { name: 'Armar JSON', headers: [row('Content-Type', 'Constant', 'Application/json')], properties: [row('namePais', 'XPath', '//*:FullCountryInfoResult/*:sName/text()'), row('capital', 'XPath', '//*:FullCountryInfoResult/*:sCapitalCity/text()'), row('urlBandera', 'XPath', '//*:FullCountryInfoResult/*:sCountryFlag/text()')], body: '{\n  "País": "${property.namePais}",\n  "Capital": "${property.capital}",\n  "Bandera": "${property.urlBandera}"\n}' }],
      ['el', 'end', 640, 450],
      ['es', 'errorStart', 300, 620], ['ce', 'contentModifier', 470, 620, { name: 'Error', body: '{\n  "message": "Ocurrió un error"\n}' }], ['ee', 'end', 640, 620]
    ], [['s', 'st', HA('/alumno/ejercicio_008')], ['st', 'cv'], ['cv', 'mm'], ['mm', 'rr'], ['rr', 'pc'], ['pc', 'e'], ['ls', 'cl'], ['cl', 'el'], ['es', 'ce'], ['ce', 'ee'],
      ['rr', 'r', { adapter: 'SOAP', address: 'http://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso', proxy: 'Internet', operation: 'FullCountryInfo', auth: 'None' }]]),
  },
  {
    id: 'b-009', group: BOOT, level: 'Clase 14', short: 'Clase 14 · Ejercicio_009: SFTP + Splitter + Data Store', title: 'Ejercicio_009: procesamiento de archivos SFTP',
    source: 'Escenario guiado · Clase N° 14',
    story: 'Cada minuto se lee BP.json del SFTP, se convierte a XML, se separa por Business Partner y cada uno se guarda en el Data Store con su id como Entry ID.',
    objectives: ['Consumir archivos desde un SFTP con Scheduler.', 'Procesar múltiples registros con Iterating Splitter.', 'Aplicar lógica por registro con Local Integration Process.', 'Persistir con Data Store usando un Entry ID dinámico.'],
    reqs: [
      'Sender <b>SFTP</b>: Directory <code>/upload/BP</code>, File Name <code>BP.json</code>, Address <code>sftp.empresa-demo.example:2222</code>, Credential <code>SFTP_Credential</code>, Post-Processing <i>Keep File and Process Again</i>, Scheduler cada <code>1</code> minuto.',
      '<b>JSON to XML Converter</b>.',
      '<b>Iterating Splitter</b> con XPath <code>//A_BusinessPartner/A_BusinessPartnerType</code>.',
      'Un <b>Local Integration Process</b> <code>ProcesarBP</code> con un Content Modifier (property <code>bp_id</code> por XPath <code>//BusinessPartner</code>) y un <b>Data Store Write</b>: <code>Business_Partner</code>, Entry ID <code>${property.bp_id}</code>, sin encriptar y con <b>Overwrite Existing Message</b>.',
      'Un <b>Process Call</b> después del Splitter que ejecute <i>ProcesarBP</i>, y el End.'
    ],
    hints: ['Sin Gather, cada parte del Splitter sigue sola hasta el End.', 'Keep File and Process Again vuelve a leer el mismo archivo en cada ejecución: por eso hace falta Overwrite Existing Message.', 'La segunda prueba trae el mismo Business Partner dos veces: sin Overwrite, el Data Store rechaza la segunda escritura.'],
    realSteps: ['Deploy y verificar el estado Started.', 'Monitor → Manage Stores → Data Stores → Business_Partner: descargar una entrada y abrir el body (XML del BP).'],
    template: { senderName: 'Servidor_SFTP', receivers: [] },
    checks: [
      { label: 'Sender SFTP en /upload/BP/BP.json, Keep File and Process Again, cada 1 min', test: h => { const p = h.senderEdge()?.props || {}; return p.adapter === 'SFTP' && p.directory === '/upload/BP' && p.fileName === 'BP.json' && p.host === 'sftp.empresa-demo.example:2222' && p.postProcessing === 'Keep File and Process Again' && String(p.poll).trim() === '1'; } },
      { label: 'Iterating Splitter con //A_BusinessPartner/A_BusinessPartnerType', test: h => h.nodes('splitter').some(n => n.props.splitType === 'Iterating Splitter' && String(n.props.xpath).trim() === '//A_BusinessPartner/A_BusinessPartnerType') },
      { label: 'Process Call a ProcesarBP', test: h => h.nodes('processCall').some(n => n.props.process === 'ProcesarBP') },
      { label: 'Data Store Business_Partner con Entry ID ${property.bp_id} y Overwrite', test: h => h.nodes('dsWrite').some(n => n.props.dsName === 'Business_Partner' && String(n.props.entryId).trim() === '${property.bp_id}' && n.props.overwrite && !n.props.encrypt) },
    ],
    tests: [
      { name: 'Archivo con 3 Business Partners', input: { headers: { CamelFileName: 'BP.json' }, body: JSON.stringify({ A_BusinessPartner: { A_BusinessPartnerType: [1, 2, 3].map(i => ({ BusinessPartner: `100000${i}`, BusinessPartnerFullName: BP_LIST[i - 1], BusinessPartnerCategory: '2' })) } }) }, expect: r => {
        const ids = DS(r, 'Business_Partner').map(d => d.id).sort().join(',');
        if (ids !== '1000001,1000002,1000003') return `Las entradas guardadas son «${ids || 'ninguna'}»; se esperaban 1000001, 1000002 y 1000003.`;
        const e = DS(r, 'Business_Partner')[0];
        if (e.encrypted) return 'Las entradas quedaron encriptadas.';
        return X(e.body, 'name(/*)') === 'A_BusinessPartnerType' || 'Cada entrada tiene que guardar solo su <A_BusinessPartnerType>.';
      } },
      { name: 'El mismo BP dos veces', input: { headers: { CamelFileName: 'BP.json' }, body: JSON.stringify({ A_BusinessPartner: { A_BusinessPartnerType: [{ BusinessPartner: '1000010', BusinessPartnerFullName: 'Nombre viejo' }, { BusinessPartner: '1000010', BusinessPartnerFullName: 'Nombre nuevo' }] } }) }, expect: r => {
        const e = DS(r, 'Business_Partner'); if (e.length !== 1) return `Se esperaba una sola entrada 1000010 y hay ${e.length}.`;
        return X(e[0].body, '//BusinessPartnerFullName') === 'Nombre nuevo' || 'La entrada no se reemplazó con la última versión.';
      } },
    ],
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'Servidor_SFTP' }], ['st', 'start', 220, 260], ['cv', 'jsonToXml', 370, 260],
      ['sp', 'splitter', 530, 260, { name: 'Por BP', splitType: 'Iterating Splitter', exprType: 'XPath', xpath: '//A_BusinessPartner/A_BusinessPartnerType', grouping: '1' }],
      ['pc', 'processCall', 690, 260, { process: 'ProcesarBP' }], ['e', 'end', 840, 260],
      ['ls', 'lipStart', 300, 450, { name: 'ProcesarBP' }], ['cl', 'contentModifier', 470, 450, { name: 'bp_id', properties: [row('bp_id', 'XPath', '//BusinessPartner')] }],
      ['ds', 'dsWrite', 640, 450, { dsName: 'Business_Partner', entryId: '${property.bp_id}', encrypt: false, overwrite: true }], ['el', 'end', 800, 450]
    ], [['s', 'st', { adapter: 'SFTP', directory: '/upload/BP', fileName: 'BP.json', host: 'sftp.empresa-demo.example:2222', ...SFTP_DEMO, postProcessing: 'Keep File and Process Again', poll: '1' }],
      ['st', 'cv'], ['cv', 'sp'], ['sp', 'pc'], ['pc', 'e'], ['ls', 'cl'], ['cl', 'ds'], ['ds', 'el']]),
  },
  {
    id: 'b-010', group: BOOT, level: 'Clase 15', short: 'Clase 15 · Ejercicio_010: Open Connectors', title: 'Ejercicio_010: BambooHR con Open Connectors',
    source: 'Escenario guiado · Clase 15',
    story: 'Un endpoint HTTPS devuelve los empleados de BambooHR usando la instancia de Open Connectors, sin programar contra la API propietaria.',
    objectives: ['Configurar el adaptador Open Connectors.', 'Consumir una API externa a través de un conector pre-construido.'],
    reqs: [
      'Sender <b>HTTPS</b>: Address <code>/ejercicio_010</code> y CSRF desmarcado.',
      '<b>Request Reply</b> al Receiver <b>BambooHR</b> con adaptador <b>OpenConnectors</b>: Base URI <code>https://api.openconnectors.trial.us10.ext.hana.ondemand.com/elements/api-v2</code>, Credential Name <code>BambooHR</code>, Resource <code>employees</code>, Method <i>GET</i>.',
      '<b>Content Modifier</b> con header <code>Content-type</code> = <code>application/json</code>.'
    ],
    hints: ['La Base URI es la URL del API Docs de la instancia hasta "api-v2".', 'La credencial BambooHR es de tipo Open Connectors: guarda User, Organization y Element (el token de la instancia).'],
    realSteps: ['Home → Manage Capabilities → Add Capabilities → Extend Non-SAP Connectivity.', 'BTP Cockpit → Security → Users: asignar el Role Collection OpenConnector_User.', 'Open Connectors → Instances → Create Instance de BambooHR (CompanyName y API Key de tu cuenta).', 'API Docs: copiar el Instance Token (Element), User y Organization.', 'Monitor → Security Material → Create → User Credentials, tipo Open Connectors, nombre BambooHR. Deploy.'],
    template: { senderName: 'Postman', receivers: ['BambooHR'] },
    mocks: { BambooHR: d => String(d.props.resource || '').trim() === 'employees'
      ? { body: JSON.stringify([['4', 'Lucía', 'Fernández', 'HR Administrator'], ['5', 'Martín', 'Gómez', 'Payroll Analyst'], ['6', 'Sofía', 'Ruiz', 'Software Engineer'], ['7', 'Diego', 'Torres', 'Customer Success']].map(([id, f, l, t]) => ({ id, firstName: f, lastName: l, jobTitle: t, workEmail: `${f.toLowerCase()}@empresa-demo.example` }))) }
      : { error: `HTTP 404: el recurso «${d.props.resource || ''}» no existe en el conector BambooHR` } },
    mockInfo: 'La instancia BambooHR devuelve 4 empleados de una empresa de prueba.',
    checks: [
      { label: 'Sender HTTPS en /ejercicio_010 sin CSRF', test: h => { const p = h.senderEdge()?.props || {}; return p.adapter === 'HTTPS' && String(p.address).trim() === '/ejercicio_010' && !p.csrf; } },
      { label: 'Open Connectors a BambooHR con la credencial BambooHR', test: h => { const e = h.recvEdge('BambooHR'); return !!e && h.node(e.from)?.type === 'requestReply' && e.props.adapter === 'OpenConnectors' && e.props.credential === 'BambooHR' && /\/elements\/api-v2\/?$/.test(e.props.baseUri || ''); } },
    ],
    tests: [{ name: 'GET de empleados', input: { headers: {}, body: '' }, expect: r => {
      const c = CALL(r, 'BambooHR'); if (!c) return 'No se llamó a BambooHR.';
      const j = J(r.body); if (!Array.isArray(j) || j.length !== 4) return `Se esperaba la lista de 4 empleados: «${short(r.body)}».`;
      return /^application\/json$/i.test(String(hdr(r.headers, 'content-type') || '')) || 'Falta el header Content-type = application/json.';
    } }],
    solution: () => B([
      ['s', 'sender', 30, 260, { name: 'Postman' }], ['st', 'start', 230, 260], ['rr', 'requestReply', 400, 260, { name: 'Empleados' }],
      ['cm', 'contentModifier', 570, 260, { name: 'Content-type', headers: [row('Content-type', 'Constant', 'application/json')] }], ['e', 'end', 730, 260], ['r', 'receiver', 940, 100, { name: 'BambooHR' }]
    ], [['s', 'st', { adapter: 'HTTPS', address: '/ejercicio_010', role: 'ESBMessaging.send', csrf: false }], ['st', 'rr'], ['rr', 'cm'], ['cm', 'e'],
      ['rr', 'r', { adapter: 'OpenConnectors', baseUri: 'https://api.openconnectors.trial.us10.ext.hana.ondemand.com/elements/api-v2', credential: 'BambooHR', resource: 'employees', method: 'GET' }]]),
  },
];

/* ---------------- Cuestionarios teóricos (la opción correcta va primero) ---------------- */
const QZ = (n, title, story, keys, quiz, extra = '') => ({ id: `q-c${n}`, group: 'Cuestionarios teóricos', level: `Clase ${n}`, short: `Clase ${n} · ${title}`, title: `Clase ${n}: ${title}`, source: `Teoría · Clase ${n}${extra}`, story, keys, quiz: quiz.map(([q, o, why]) => ({ q, o, why })), reqs: [], hints: [], checks: [], tests: [] });
const QUIZZES = [
  QZ(1, 'Servicios, suscripciones e Integración', 'Cómo leer SAP BTP con criterio antes de construir el primer iFlow.', ['El subaccount es la unidad operativa clave.', 'La región condiciona decisiones técnicas reales.', 'Los servicios se consumen a partir de entitlements y se administran desde el cockpit.', 'El modelo comercial también impacta la forma de diseñar y operar.'], [
    ['¿Cuál es la unidad operativa donde se trabaja con la mayoría de los servicios de SAP BTP?', ['Subaccount', 'Global account', 'Directory', 'Region'], 'El manual lo resume como "la unidad operativa clave"; el global account es la raíz del contrato y el directory solo agrupa.'],
    ['¿Qué tiene que existir para poder usar un servicio dentro de un subaccount?', ['Los entitlements asignados al subaccount', 'Un iFlow desplegado', 'Una cola de Event Mesh', 'Un API Proxy'], 'Los servicios se consumen a partir de entitlements y se administran desde el cockpit.'],
    ['¿Por qué importa la región al crear un subaccount?', ['Impacta latencia, residencia de datos y disponibilidad de servicios', 'Solo cambia el idioma del cockpit', 'Define la contraseña del usuario', 'No tiene impacto técnico'], 'La región condiciona decisiones técnicas reales.'],
    ['¿Qué modelos comerciales de consumo compara la clase?', ['CPEA y Pay-As-You-Go', 'OData y SOAP', 'ALE y RFC', 'Trial y Sandbox'], 'El modelo de consumo impacta la forma de diseñar y operar.'],
  ]),
  QZ(2, 'Entornos y Automatización', 'Preparar el terreno: runtime, suscripción, roles, instancias y service keys.', ['El runtime correcto depende del tipo de solución.', 'La suscripción habilita el acceso inicial al servicio.', 'Las service instances materializan capacidades concretas.', 'Las service keys habilitan acceso técnico y requieren manejo seguro.'], [
    ['¿Qué entornos de ejecución de SAP BTP presenta la clase?', ['Cloud Foundry, Kyma y ABAP', 'PI, PO y CPI', 'Docker, Linux y Windows', 'Neo, HANA y Java'], 'Cloud Foundry suele ser la puerta de entrada; Kyma sirve para microservicios y contenedores; ABAP para extensiones ABAP.'],
    ['¿Qué materializa una capacidad concreta de un servicio, como el acceso técnico a Integration Suite?', ['Una service instance', 'Una suscripción', 'El launchpad', 'Un role collection'], 'La suscripción da acceso a la aplicación; la instancia materializa la capacidad técnica.'],
    ['¿Qué dice la clase sobre las service keys?', ['Habilitan acceso técnico y requieren manejo seguro', 'Se pueden compartir en el código', 'Reemplazan a los roles', 'Solo sirven en Trial'], 'En los ejercicios el ClientId y ClientSecret del Service Key se usan como credenciales: nunca se exponen.'],
    ['Si el usuario ve errores de autorización al entrar a Integration Suite, ¿qué falta revisar?', ['Que tenga asignada la role collection correspondiente', 'La región del subaccount', 'El tamaño del mensaje', 'El adaptador SFTP'], 'Suscripción y roles van juntos: sin la role collection, el punto de entrada no queda operativo.'],
  ]),
  QZ(3, 'Seguridad y gestión', 'Proteger endpoints, centralizar material sensible y dejar evidencia operativa.', ['La seguridad del endpoint empieza por identidad, autorización y política aplicable.', 'El security material centralizado reduce dispersión.', 'Los logs y el deploy status son la evidencia mínima para diagnosticar y auditar.', 'Las credenciales reutilizables evitan duplicaciones entre iFlows.'], [
    ['¿Qué mecanismo conviene para escenarios system-to-system con autenticación mutua?', ['Client certificate', 'Basic authentication', 'Sin autenticación', 'Un header personalizado'], 'El certificado de cliente autentica a ambas partes; Basic queda para escenarios simples o transitorios.'],
    ['¿Dónde se centralizan credenciales, claves y known hosts en el tenant?', ['En Security Material / Keystore', 'En las Exchange Properties', 'En el Groovy Script', 'En el body del mensaje'], 'Centralizar el material sensible evita dispersión y facilita la administración.'],
    ['¿Cuál es el riesgo de improvisar con Known Hosts (SSH)?', ['Aceptar hosts sin verificar su identidad', 'Que el Router deje de funcionar', 'Perder el MPL', 'Que el JSON no se convierta'], 'Por eso en la Clase 4 se genera la Host Key con un Connectivity Test y se registra como Known Host.'],
    ['¿Qué controla el User Role del adaptador HTTPS (por ejemplo ESB_taller.send)?', ['Qué usuarios pueden llamar al endpoint', 'El formato del body', 'La región del tenant', 'El nombre del archivo SFTP'], 'Es la autorización a nivel endpoint: identidad + rol + política.'],
  ]),
  QZ(4, 'Cloud Integration (Fundamentos y Modelado)', 'iFlows, adaptadores, headers, properties y monitoreo.', ['La integración en BTP se centraliza en iFlows basados en BPMN.', 'El adaptador HTTPS es clave para exponer servicios síncronos.', 'El ruteo se basa en metadatos como Headers y Exchange Properties.', 'El monitoreo con el MPL valida el flujo paso a paso.'], [
    ['¿En qué estándar visual se basan los iFlows?', ['BPMN', 'UML', 'Diagrama entidad-relación', 'EPC'], 'Los iFlows usan la notación BPMN: pools, eventos, actividades y flujos de mensaje.'],
    ['¿Cuál es la diferencia entre un Header y una Exchange Property?', ['El header viaja a los receptores; la property vive solo durante la ejecución del iFlow', 'Son lo mismo', 'La property viaja al receptor y el header no', 'El header solo existe en SOAP'], 'El glosario define la property como "variable de memoria interna que vive solo durante la ejecución".'],
    ['¿Qué componente expone un servicio síncrono para que Postman lo llame?', ['Adaptador HTTPS en el Sender', 'Data Store', 'Timer Start', 'Adaptador SFTP en el Receiver'], 'Por eso los ejercicios del taller arrancan con Sender HTTPS.'],
    ['¿Qué herramienta registra el historial técnico de cada ejecución?', ['El MPL (Message Processing Log)', 'Postman', 'El XSD', 'Known Hosts'], 'El MPL permite validar el flujo paso a paso.'],
  ]),
  QZ(5, 'Lógica Avanzada y Troubleshooting', 'Mapping, enrutamiento, multicast y manejo de errores.', ['El Message Mapping permite transformaciones complejas; las UDF agregan lógica propia.', 'El Exception Subflow captura errores técnicos.', 'El Router decide según el contenido (XPath).', 'Multicast distribuye el mismo dato a varios sistemas.'], [
    ['¿Cuándo conviene el Multicast Secuencial en lugar del Paralelo?', ['Cuando hay dependencias entre las ramas y el orden importa', 'Siempre, porque es más rápido', 'Cuando no hay receptores', 'Para reemplazar al Router'], 'El manual recomienda el secuencial cuando existen dependencias entre ramas.'],
    ['¿Para qué sirve el Exception Subprocess?', ['Capturar errores técnicos y responder de forma controlada', 'Ejecutar el iFlow dos veces', 'Reemplazar el Router', 'Guardar archivos SFTP'], 'Es el bloque de control de errores que se activa ante una falla.'],
    ['¿Qué es una UDF en un Message Mapping?', ['Una función propia cuando las funciones estándar no alcanzan', 'Un adaptador', 'Una política de API Management', 'Un tipo de IDoc'], 'User Defined Function: lógica Java/Groovy dentro del mapping.'],
    ['¿Con qué evalúa el Router sus condiciones?', ['Con XPath sobre el contenido o expresiones sobre headers y properties', 'Solo con la hora del día', 'Con el tamaño del archivo', 'Con la región del subaccount'], 'En el Ejercicio_003 la condición //Credential decide la ruta.'],
  ]),
  QZ(6, 'API Management (Ciclo de Vida y Seguridad)', 'API Management como capa frontera: proxies, providers y políticas.', ['API Management actúa como firewall de aplicación y capa de gobierno.', 'Los API Proxies desacoplan a los consumidores del backend.', 'Las políticas (Spike Arrest, OAuth, Quota) protegen los activos.', 'KVM guarda configuraciones dinámicas sin redeploy.'], [
    ['¿Qué es un API Proxy?', ['Una capa virtual sobre un servicio real que agrega seguridad, tráfico y visibilidad', 'Un iFlow', 'Una cola AMQP', 'Un XSD'], 'El glosario lo define como capa virtual sobre el servicio real.'],
    ['En la guía, ¿qué tipo de API Provider se crea para exponer los iFlows?', ['Cloud Integration', 'OData', 'Open Connectors', 'On-Premise'], 'El provider CPI_{nombre} usa tipo Cloud Integration, puerto 443 y el ClientId/ClientSecret del Service Key.'],
    ['Al probar el proxy aparece un 403. ¿Qué indica revisar la guía?', ['Que el iFlow tenga deshabilitada la protección CSRF', 'Que exista el Data Store', 'Que el body sea JSON', 'La región'], 'Con 401 hay que revisar las credenciales; con 403, el CSRF del iFlow.'],
    ['¿Para qué sirve un KVM (Key Value Map)?', ['Guardar configuraciones dinámicas, como credenciales, sin volver a desplegar', 'Mapear XML a JSON', 'Encolar mensajes', 'Firmar con PGP'], 'En la Clase 7 el KVM ServiceKey guarda access_key y secret_key.'],
  ], ' y escenario guiado de la Clase 6'),
  QZ(7, 'SAP Graph y Developer Portal', 'Políticas de seguridad, Developer Hub, productos y suscripciones.', ['API Management y SAP Graph enmascaran la complejidad técnica detrás de una capa segura y monitoreada.', 'Hay que securizar quién consume (OAuth, API Key), medir y poder monetizar.', 'El Developer Hub publica productos a los que se suscriben las aplicaciones.'], [
    ['La política Spike_Arrest_5pm tiene <Rate>5pm</Rate>. ¿Qué limita?', ['5 requests por minuto', '5 requests por hora', '5 usuarios', '5 MB por request'], '"pm" significa per minute.'],
    ['La política Quota_10ph usa Allow count="10" con TimeUnit hour. ¿Qué permite?', ['10 requests por hora', '10 requests por minuto', '10 aplicaciones', '10 segundos de timeout'], 'Quota limita el consumo en una ventana de tiempo; Spike Arrest suaviza picos.'],
    ['VerifyAPIKey usa <APIKey ref="request.header.apikey"/>. ¿Dónde envía la key el consumidor?', ['En el header apikey del request', 'En el body', 'En la URL del backend', 'En el Data Store'], 'En Postman se agrega el header apikey con la key de la suscripción del Developer Hub.'],
    ['¿Qué hace un Product en el Developer Hub?', ['Agrupa APIs para que las aplicaciones se suscriban y obtengan una key', 'Despliega un iFlow', 'Crea un Known Host', 'Convierte XML'], 'En la guía, APP_001 se publica con cuota 500 cada 2 minutos y se suscribe "Cliente 001".'],
    ['¿Qué es SAP Graph?', ['Una capa de consumo unificada para acceder a datos de varios sistemas SAP en un solo endpoint', 'Un adaptador de archivos', 'Un monitor de colas', 'Un tipo de IDoc'], 'Simplifica el acceso a S/4HANA, SuccessFactors y otros desde un único modelo.'],
  ], ' y escenario guiado de la Clase 7'),
  QZ(8, 'Event Mesh y arquitecturas desacopladas', 'Pub/Sub, colas, AMQP y arquitecturas reactivas.', ['Event Mesh habilita arquitecturas reactivas desacoplando sistemas.', 'Pub/Sub distribuye un evento a múltiples interesados.', 'Las colas garantizan que el mensaje no se pierda si el destino está caído.', 'Los Business Events reducen la carga de red comparado con el polling.'], [
    ['¿Cómo funciona el modelo Pub/Sub?', ['El emisor publica en un tópico y el Mesh lo distribuye a todas las colas suscriptas', 'El receptor consulta cada minuto', 'Es una llamada síncrona', 'Es un mapeo de campos'], 'En la Clase 8 se publica en un tópico y el mensaje llega a todas las colas QUEUE_001…030.'],
    ['¿Qué garantiza una cola?', ['Que el mensaje no se pierda si el sistema destino está caído', 'Que el mapping sea más rápido', 'Que no haga falta Router', 'Que el mensaje quede encriptado'], 'La persistencia crítica se gestiona con colas y acuse de recibo.'],
    ['¿Qué protocolo es el ideal para IoT y baja latencia?', ['MQTT', 'AMQP', 'SOAP', 'RFC'], 'AMQP es el protocolo avanzado de encolado; MQTT es el liviano para IoT.'],
    ['¿Para qué sirve una Dead Letter Queue?', ['Guardar los mensajes que no pudieron procesarse', 'Es la cola principal', 'Publicar eventos públicos', 'Guardar logs de deploy'], 'Permite analizar y reprocesar los mensajes fallidos.'],
  ]),
  QZ(9, 'Assessment y Estrategias de Migración', 'Migrar de SAP PI/PO a Integration Suite con método.', ['ISA-M guía la selección de herramientas según el caso de uso.', 'El Migration Assessment analiza las interfaces existentes de PI/PO.', 'Evaluar los gaps técnicos es vital antes de refactorizar.', 'El roadmap debe ser gradual, empezando por interfaces de baja criticidad.'], [
    ['¿Qué aporta la metodología ISA-M?', ['Guía la selección de herramientas de integración según el caso de uso', 'Es un adaptador', 'Es un formato de IDoc', 'Es una herramienta de testing'], 'Integration Solution Advisory Methodology.'],
    ['¿Qué hace el Migration Assessment?', ['Analiza automáticamente las interfaces existentes de SAP PI/PO', 'Despliega iFlows', 'Crea Known Hosts', 'Genera XSD'], 'Permite estimar complejidad y priorizar el esfuerzo.'],
    ['¿Cómo conviene planificar el roadmap de migración?', ['De forma gradual, empezando por interfaces de baja criticidad', 'Todo de una vez', 'Empezando por las más críticas', 'Sin inventario previo'], 'Reduce el riesgo mientras el equipo gana experiencia.'],
    ['¿Qué es un Gap Analysis?', ['Identificar diferencias entre el sistema origen y el destino antes de migrar', 'Probar en Postman', 'Comprimir archivos', 'Monitorear colas'], 'Hay funcionalidades de PI/PO que no tienen equivalente nativo en Cloud.'],
  ]),
  QZ(10, 'OData y Consumo de Servicios', 'OData como protocolo semántico para consumir datos SAP.', ['OData es un estándar basado en REST que agrega semántica a los datos.', 'Es la base de SAP Fiori y permite operaciones CRUD estandarizadas.', 'Filtrar en origen mejora el rendimiento.'], [
    ['¿Qué es OData?', ['Un estándar basado en REST que agrega semántica y permite CRUD estandarizado', 'Un protocolo de archivos', 'Un formato binario de IDoc', 'Una cola de mensajes'], 'Por eso se lo llama "el SQL de la web".'],
    ['¿Qué devuelve una consulta con $top=5?', ['Como máximo 5 registros', 'El registro número 5', 'Los datos ordenados por 5 campos', 'El registro con id 5'], 'En la guía de la Clase 10 se prueba con el parámetro $top = 5.'],
    ['En la guía, ¿para qué se pone ${header.CamelHttpQuery} en Query Options?', ['Para trasladar los parámetros de la URL de entrada a la consulta OData', 'Para elegir el método HTTP', 'Para crear un Data Store', 'Para activar CSRF'], 'CamelHttpQuery tiene todo lo que viene después del "?" en la URL de entrada.'],
    ['¿Por qué conviene usar $filter y $select?', ['Reducen el volumen de datos y mejoran el rendimiento', 'Son obligatorios en SOAP', 'Encriptan la respuesta', 'No se pueden usar desde CPI'], 'Filtrar en origen evita traer y descartar datos en el iFlow.'],
  ]),
  QZ(11, 'ALE e IDocs', 'El puente tradicional para sistemas legacy y on-premise.', ['ALE permite intercambiar datos entre sistemas mediante IDocs.', 'Dominar WE20, WE21 y BD64 es la base del nivel Senior.', 'Los IDocs garantizan persistencia y registros de status.'], [
    ['¿En qué transacción se arma el modelo de distribución?', ['BD64', 'WE20', 'SM59', 'WE02'], 'BD64 es el "centro de control" del modelo de distribución.'],
    ['¿Dónde se configuran los perfiles de interlocutor?', ['WE20', 'BD64', 'WE21', 'BD87'], 'WE20 es el "contrato técnico" entre sistemas.'],
    ['¿Dónde se configuran los puertos de IDoc?', ['WE21', 'WE20', 'BD64', 'SE80'], 'Los puertos (WE21) usan destinos RFC creados en SM59.'],
    ['¿Qué transacciones se usan para monitorear y reprocesar IDocs?', ['WE02 y BD87', 'SE38 y SE80', 'SOAMANAGER', 'SM59'], 'Son el "semáforo del negocio".'],
    ['En la guía, ¿a qué servicio del backend se envía el IDoc XML?', ['/sap/bc/idoc_xml por HTTP POST', '/sap/opu/odata', 'Un directorio SFTP', 'Una cola AMQP'], 'Se llama con el adaptador HTTP, Proxy On-Premise.'],
  ]),
  QZ(12, 'RFC, BAPIs y Módulos Remotos', 'Funciones remotas, BAPIs y su consumo desde Cloud Integration.', ['RFC es el protocolo de comunicación estándar y nativo de SAP.', 'Las BAPIs son interfaces estables sobre objetos de negocio.', 'Desde BTP se abstraen con el adaptador RFC de Cloud Integration.'], [
    ['¿Qué es RFC?', ['El protocolo estándar de SAP para llamar funciones en otro sistema', 'Un formato JSON', 'Una cola', 'Un portal de APIs'], 'Remote Function Call.'],
    ['¿Qué es una BAPI?', ['Una función estándar de SAP con interfaz estable sobre un objeto de negocio', 'Un iFlow', 'Un IDoc', 'Un script Groovy'], 'Business Application Programming Interface: el "estándar inmutable".'],
    ['¿En qué transacción se administran los destinos RFC?', ['SM59', 'WE20', 'BD87', 'SE38'], 'SM59 también es clave para la auditoría de seguridad.'],
    ['¿Qué necesita CPI para llamar una RFC on-premise?', ['El adaptador RFC y un Destination que llega por Cloud Connector', 'El adaptador SFTP', 'Open Connectors', 'Event Mesh'], 'En la guía se usa el Destination ERP_RFC_DEST.'],
    ['¿Qué recomienda el paradigma Clean Core sobre las Z-BAPIs?', ['Preferir APIs estándar y minimizar los desarrollos Z', 'Crear una Z-BAPI para todo', 'Modificar el estándar de SAP', 'Evitar cualquier RFC'], 'Menos código propio en el core facilita las actualizaciones.'],
  ]),
  QZ(13, 'SOAP y SOAMANAGER', 'Servicios síncronos, adaptadores HTTP/SOAP y buenas prácticas.', ['OData garantiza uniformidad semántica en el ecosistema SAP.', 'HTTP y OAuth 2.0 permiten conectarse a casi cualquier servicio en la nube.', 'Siempre hay que manejar errores de forma sistemática.'], [
    ['¿Para qué se usa SOAMANAGER en el backend ABAP?', ['Configurar y publicar web services SOAP', 'Monitorear IDocs', 'Crear colas', 'Programar en Groovy'], 'Es la consola de administración de web services del sistema ABAP.'],
    ['¿Cómo se manejan los rate limits de un proveedor?', ['Con paginación y reintentos controlados', 'Ignorando los errores 429', 'Con timeout infinito', 'Pasando a SFTP'], 'Los reintentos controlados evitan saturar al proveedor.'],
    ['¿Dónde deben vivir las credenciales de los adaptadores?', ['En el Keystore / Security Material, nunca hardcodeadas', 'En el script', 'En el body', 'En la URL'], 'Buena práctica explícita del manual.'],
    ['¿Para qué configurar timeouts estrictos en el HTTP Receiver?', ['Para evitar bloqueos cuando un servicio responde lento', 'Para encriptar', 'Para reducir el payload', 'Para activar CSRF'], 'Un servicio colgado no debe bloquear el iFlow.'],
    ['En la guía de la Clase 13, ¿qué significa //*:sName en el XPath?', ['Buscar sName en cualquier namespace', 'Borrar los namespaces', 'Crear un nodo nuevo', 'Que solo funciona con JSON'], 'La respuesta SOAP trae prefijo de namespace; *: lo ignora.'],
  ]),
  QZ(14, 'Gestión de Archivos y SFTPs Externos', 'SFTP, Known Hosts, polling, post-procesado y archivos grandes.', ['El control criptográfico (Known Hosts y PGP) permite superar auditorías.', 'Polling y post-procesado bien definidos dan orden y trazabilidad.', 'El streaming (trocear y rutear) permite procesar volúmenes grandes.'], [
    ['¿Sobre qué protocolo funciona SFTP?', ['SSH', 'TLS/HTTPS', 'AMQP', 'RFC'], 'Por eso se registran Known Hosts SSH.'],
    ['¿Para qué sirve Known Hosts?', ['Para confirmar la identidad del servidor SFTP (host key)', 'Para guardar archivos', 'Para definir el post-processing', 'Para encolar mensajes'], 'Integridad asegurada: el tenant solo se conecta a hosts conocidos.'],
    ['¿Qué resuelve el Post-Processing del SFTP Sender?', ['Archivar, mover o borrar el archivo para no reprocesarlo', 'Encriptar el archivo', 'Mapear campos', 'Hacer el polling'], 'Todo archivo consumido debe archivarse o eliminarse.'],
    ['¿Cómo se procesan archivos muy grandes sin agotar memoria?', ['Troceándolos con splitter y streaming', 'Cargándolos completos en memoria', 'Con Request Reply', 'Convirtiéndolos a JSON'], 'Como en el Ejercicio_009, que separa cada Business Partner.'],
  ]),
  QZ(15, 'Open Connectors', 'Conectores pre-construidos para el ecosistema No-SAP.', ['Open Connectors abstrae APIs de terceros bajo una interfaz REST normalizada.', 'Hay más de 160 conectores pre-construidos.', 'Una Instance es la conexión autenticada y persistente con la app de terceros.', 'Desde CPI se usa con el Element Token como autorización.'], [
    ['¿Qué es una Instance en Open Connectors?', ['La conexión autenticada y persistente con una app de terceros', 'Un iFlow', 'Un XSD', 'Una cola'], 'En la guía se crea la instancia BambooHR con CompanyName y API Key.'],
    ['¿Qué datos forman la credencial de tipo Open Connectors en el tenant?', ['User, Organization y Element (token de la instancia)', 'Solo usuario y contraseña de BambooHR', 'Un certificado X.509', 'Ninguno'], 'Se obtienen desde API Docs de la instancia.'],
    ['¿Qué plantea la estrategia "Validate First"?', ['Probar el endpoint en API Docs antes de consumirlo desde CPI', 'Desplegar primero y probar después', 'Ignorar los errores', 'Usar siempre SOAP'], 'Validar el contrato evita depurar dos cosas a la vez.'],
    ['¿Cuántos conectores pre-construidos menciona el manual?', ['Más de 160', 'Alrededor de 10', 'Más de 3.000', 'Uno por cliente'], 'Las 3.000 APIs son las del Business Accelerator Hub, no los conectores.'],
  ]),
  QZ(16, 'APIs y herramientas (Parte I)', 'REST, Postman, SoapUI y tests de regresión.', ['REST es stateless, basado en HTTP y orientado a recursos.', 'Postman organiza requests en Colecciones y Entornos.', 'SoapUI es la herramienta para SOAP/WSDL, con Assertions.', 'Newman ejecuta colecciones por línea de comandos.'], [
    ['¿Qué hace cada verbo HTTP?', ['GET lee, POST crea, PUT/PATCH actualiza, DELETE elimina', 'GET crea, POST lee, PUT elimina, DELETE actualiza', 'Todos hacen lo mismo', 'Solo existen GET y POST'], 'Los verbos tienen semántica precisa.'],
    ['¿Cuándo se usa SoapUI en lugar de Postman?', ['Para servicios SOAP/WSDL con Assertions sobre la respuesta', 'Para APIs REST simples', 'Para mover archivos', 'Nunca'], 'Postman es la herramienta estándar para REST.'],
    ['¿Para qué sirve Newman?', ['Para ejecutar colecciones de Postman por línea de comandos (regresión, CI)', 'Para editar XML', 'Para monitorear CPI', 'Es un adaptador'], 'Detecta regresiones cuando cambia una integración.'],
    ['¿Cuál es la diferencia entre 401 y 403?', ['401 falta autenticación válida; 403 está autenticado pero no tiene permiso', 'Son iguales', '401 es servidor caído', '403 es éxito'], 'En la Clase 6, un 403 apuntaba a la protección CSRF del iFlow.'],
  ]),
  QZ(17, 'APIs y herramientas (Parte II)', 'El SAP Business Accelerator Hub como punto de partida.', ['api.sap.com es el repositorio oficial de APIs e Integration Packages.', 'El sandbox permite probar sin credenciales propias.', 'El estado de cada API (Beta, GA, Deprecated) es crítico para decidir.'], [
    ['¿Qué es el SAP Business Accelerator Hub?', ['El repositorio oficial de APIs, Integration Packages y artefactos de SAP (api.sap.com)', 'Un adaptador', 'El monitor de CPI', 'Una cola de Event Mesh'], 'Centraliza más de 3.000 APIs.'],
    ['¿Para qué sirve el sandbox del Hub?', ['Para probar endpoints sin credenciales propias', 'Para desplegar en producción', 'Para guardar Data Stores', 'Para firmar con PGP'], 'Ideal para explorar el contrato antes de pedir accesos.'],
    ['¿Por qué revisar si una API está en Beta, GA o Deprecated?', ['Porque afecta decisiones de arquitectura en proyectos productivos', 'Porque cambia el color del Hub', 'No importa', 'Solo importa en Trial'], 'Una API deprecada no debería entrar en un diseño nuevo.'],
    ['¿Cuál es la diferencia entre una API y un Integration Package?', ['El package trae contenido de integración listo para desplegar en CPI', 'Son lo mismo', 'La API se despliega en CPI y el package no', 'El package es solo documentación'], 'Adaptar un package existente suele ser más rápido que construir desde cero.'],
  ]),
  QZ(18, 'Formatos y parsing', 'XML, JSON y XPath dentro de los iFlows.', ['XML domina en SAP legacy (IDoc, SOAP, BAPI); JSON en las APIs REST modernas.', 'XPath es esencial en Routers, Content Modifiers y Mappings.', 'Los namespaces mal declarados producen resultados vacíos silenciosos.'], [
    ['¿Qué pasa si un XPath no considera el namespace del XML?', ['Devuelve vacío sin dar error', 'El iFlow no despliega', 'Convierte el XML a JSON', 'Borra el nodo'], '"El error silencioso más frecuente."'],
    ['¿Para qué sirve local-name() en XPath?', ['Para seleccionar por nombre sin importar el namespace', 'Para contar nodos', 'Para convertir a JSON', 'Para borrar atributos'], 'Equivale al *: de la guía de la Clase 13.'],
    ['¿Qué devuelve count(/Pedido/Item) para <Pedido><Item/><Item/></Pedido>?', ['2', '1', 'true', 'Item'], 'count() es una de las funciones numéricas de XPath 1.0.'],
    ['¿Por qué evitar // en documentos XML grandes?', ['Porque hace una búsqueda recursiva que impacta el rendimiento', 'Porque es inválido en XPath 1.0', 'Porque solo funciona en JSON', 'Porque borra namespaces'], 'Mejor usar rutas explícitas cuando se conoce la estructura.'],
  ]),
  QZ(19, 'Extensión (Groovy)', 'Groovy como bisturí: solo cuando los componentes visuales no alcanzan.', ['La firma de un Script Step es processData(Message message) { … return message }.', 'El logger correcto es messageLogFactory.', 'Las excepciones se manejan con try-catch y se relanzan para el Exception Subprocess.', 'Nunca hardcodear URLs ni credenciales: usar ExternParameters.'], [
    ['¿Cuál es la firma de un Groovy Script en CPI?', ['def Message processData(Message message) { … return message }', 'public static void main(String[] args)', 'function run(body)', 'def process(String xml)'], 'El objeto Message expone body, headers, properties y attachments.'],
    ['¿Cómo se registra información de debugging desde un script?', ['Con messageLogFactory', 'Con System.out.println()', 'Con un Data Store', 'No se puede'], 'println no queda en el MPL.'],
    ['¿Dónde guardar datos que no deben viajar al receptor?', ['En properties (setProperty), no en headers', 'En headers', 'En el body', 'En la URL'], 'Los headers viajan a los receptores; las properties no.'],
    ['¿Cómo hacer que el Exception Subprocess capture un error del script?', ['Manejarlo con try-catch, registrarlo y lanzar una Exception', 'Devolver null', 'Ignorarlo', 'Escribirlo en el body'], 'Si el script se traga el error, nadie lo ve.'],
  ]),
  QZ(20, 'Seguridad, conectividad y panorama', 'OAuth, mTLS, Cloud Connector, CALM, AIF e ISA-M.', ['OAuth 2.0 Client Credentials es el estándar sistema-a-sistema en BTP.', 'mTLS agrega autenticación bidireccional con certificados.', 'Cloud Connector crea un túnel seguro hacia on-premise.', 'CALM monitorea en la nube; AIF monitorea interfaces on-premise.'], [
    ['¿Cuál es el esquema de autenticación estándar para integraciones sistema-a-sistema en BTP?', ['OAuth 2.0 Client Credentials', 'Basic Auth en internet', 'Sin autenticación', 'Usuario personal del consultor'], 'No requiere intervención humana.'],
    ['¿Qué agrega mTLS?', ['Autenticación bidireccional con certificados digitales', 'Compresión de mensajes', 'Un tópico de eventos', 'Un mapeo automático'], 'Es el nivel más alto de seguridad disponible en CPI.'],
    ['¿Para qué sirve SAP Cloud Connector?', ['Para crear un túnel seguro entre BTP y sistemas on-premise sin exponerlos a internet', 'Para convertir XML a JSON', 'Para publicar APIs en el Developer Hub', 'Para generar claves PGP'], 'Es lo que hay detrás de Proxy Type On-Premise.'],
    ['¿Qué plataforma monitorea interfaces en sistemas SAP on-premise (ECC, S/4HANA on-premise)?', ['SAP AIF', 'SAP CALM', 'Postman', 'Open Connectors'], 'CALM es el monitoreo centralizado en la nube.'],
  ]),
];

const EXERCISES = [...SCENARIOS, ...QUIZZES, ...PRACTICE];

function sftpCheck(r, id) {
  const d = D(r, 'ERP_Legado')[0];
  if (!d) return 'No llegó ningún archivo a ERP_Legado.';
  if (d.adapter !== 'SFTP') return `Se entregó por ${d.adapter}, no por SFTP.`;
  if (String(d.props.directory || '').trim() !== '/entrada/pedidos') return `El directorio es «${d.props.directory || ''}»; debería ser /entrada/pedidos.`;
  if (X(d.body, '/pedido/id') !== id) return `El archivo no tiene /pedido/id = ${id}. Contenido: «${short(d.body)}».`;
  if (d.headers.CamelFileName !== `pedido_${id}.xml`) return `CamelFileName vale «${d.headers.CamelFileName ?? ''}»; se esperaba pedido_${id}.xml.`;
  return true;
}
function routeCheck(r, to, adapter, other) {
  const a = D(r, to), b = D(r, other);
  if (a.length !== 1) return `El pedido debería llegar una vez a ${to} y llegó ${a.length} ${a.length === 1 ? 'vez' : 'veces'}.`;
  if (b.length) return `El pedido también llegó a ${other}.`;
  return a[0].adapter === adapter || `Llegó a ${to} por ${a[0].adapter}; tiene que ser ${adapter}.`;
}
function clientCheck(r, nombre, email, tel) {
  const j = J(r.body);
  if (!j) return `El body final no es JSON válido: «${short(r.body)}».`;
  if (j.nombre !== nombre) return `nombre vale «${j.nombre}»; se esperaba «${nombre}».`;
  if (j.email !== email) return `email vale «${j.email}»; se esperaba «${email}».`;
  if (tel && j.telefono !== tel) return 'Se perdió el campo telefono.';
  return r.headers['X-Procesado'] === 'true' || `El header X-Procesado vale «${r.headers['X-Procesado'] ?? ''}»; se esperaba «true».`;
}
function enrichCheck(r, id, importe) {
  const c = CALL(r, 'S4_Clientes');
  if (!c) return 'El iFlow no llamó a S4_Clientes con un Request Reply.';
  if (c.adapter !== 'OData') return `Se llamó por ${c.adapter}; tiene que ser OData.`;
  if (String(c.props.resourcePath || '').trim() !== `A_BusinessPartner('${id}')`) return `El Resource Path quedó «${c.props.resourcePath || ''}»; se esperaba A_BusinessPartner('${id}').`;
  if (X(r.body, 'name(/*)') !== 'PedidoEnriquecido') return `La raíz del body final debería ser <PedidoEnriquecido>. Body: «${short(r.body)}».`;
  if (X(r.body, '//Pedido/Importe') !== importe) return 'El body final perdió los datos del pedido original (falta Importe).';
  return X(r.body, '//BusinessPartner/Nombre') === BP[id] || `Falta el nombre del cliente (${BP[id]}) que devuelve S4.`;
}
function splitCheck(r, expected) {
  const skus = [...String(r.body).matchAll(/<Procesado sku="([^"]*)"/g)].map(m => m[1]).join(',');
  if (skus !== expected) return `Se esperaban <Procesado> para ${expected} y se encontraron: ${skus || 'ninguno'}.`;
  return String(r.body).includes('multimap:Messages') || 'El resultado no viene de un Gather con estrategia Combine (falta multimap:Messages).';
}
function mapCheck(r, exp) {
  if (X(r.body, 'name(/*)') !== 'SalesOrder') return `La raíz debería ser <SalesOrder>. Body: «${short(r.body)}».`;
  for (const [k, v] of Object.entries(exp)) { const got = X(r.body, '/SalesOrder/' + k); if (got !== v) return `/SalesOrder/${k} vale «${got ?? ''}»; se esperaba «${v}».`; }
  return true;
}

/* ---------------- Estado y persistencia ---------------- */
const KEY = 'taller-iflows-v1';
let store = { flows: {}, done: {}, quiz: {}, last: EXERCISES[0].id };
try { const raw = localStorage.getItem(KEY); if (raw) store = { ...store, ...JSON.parse(raw) }; } catch (_) {}
const state = { ex: null, flow: null, sel: null, tab: 'ej', cmTab: 'h', results: null, sim: null, simResult: null, issues: null, confirm: null, zoom: 1, drag: null, conn: null, showJs: false, formTarget: null };
const EX = () => EXERCISES.find(e => e.id === state.ex);
function save() { try { store.flows[state.ex] = state.flow; store.last = state.ex; localStorage.setItem(KEY, JSON.stringify(store)); } catch (_) {} }
const byId = id => state.flow.nodes.find(n => n.id === id);
const edgeById = id => state.flow.edges.find(e => e.id === id);
const outSeq = id => state.flow.edges.filter(e => e.kind === 'seq' && e.from === id);
const inSeq = id => state.flow.edges.filter(e => e.kind === 'seq' && e.to === id);

/* ---------------- Motor de simulación ---------------- */
class SimError extends Error {}
const fail = m => { throw new SimError(m); };
const ser = n => n.nodeType === 1 ? new XMLSerializer().serializeToString(n) : esc(n.nodeValue ?? n.textContent);

function parseXml(s, what = 'El body') {
  const txt = String(s ?? '').trim();
  if (!txt.startsWith('<')) fail(`${what} no es XML. Contenido: «${short(txt, 60) || '(vacío)'}»`);
  const d = new DOMParser().parseFromString(txt, 'application/xml');
  if (d.getElementsByTagName('parsererror').length) fail(`${what} no es XML válido (¿más de un elemento raíz o una etiqueta sin cerrar?).`);
  return d;
}
// CPI usa XPath 2.0 y acepta el comodín de namespace "*:nombre"; el navegador solo tiene XPath 1.0
const xp1 = e => String(e).replace(/(^|[\/\[(,\s|])\*:([A-Za-z_][\w.\-]*)/g, "$1*[local-name()='$2']");
function xpathEval(body, expr, type) {
  const d = parseXml(body);
  try { return d.evaluate(xp1(expr), d, null, type, null); } catch (_) { fail(`Expresión XPath inválida: ${expr}`); }
}
const PGP_HEAD = '-----BEGIN PGP MESSAGE-----', PGP_TAIL = '-----END PGP MESSAGE-----';
function pgpSeal(body, key) {
  const raw = b64e(`PGPSIM|${key}|${body}`).replace(/(.{64})/g, '$1\n');
  return `${PGP_HEAD}\nVersion: Taller de iFlows (simulado)\n\n${raw}\n${PGP_TAIL}`;
}
function pgpOpen(text) {
  const t = String(text ?? '').trim();
  if (!t.startsWith(PGP_HEAD) || !t.endsWith(PGP_TAIL)) return null;
  const b = t.slice(PGP_HEAD.length, -PGP_TAIL.length).split('\n').filter(l => l && !l.includes(':')).join('');
  let raw; try { raw = new TextDecoder().decode(Uint8Array.from(atob(b), c => c.charCodeAt(0))); } catch (_) { return null; }
  const m = raw.match(/^PGPSIM\|([^|]*)\|([\s\S]*)$/);
  return m ? { key: m[1], body: m[2] } : null;
}
const xpString = (b, e) => xpathEval(b, e, XPathResult.STRING_TYPE).stringValue;
const xpBool = (b, e) => xpathEval(b, e, XPathResult.BOOLEAN_TYPE).booleanValue;
function xpNodes(b, e) {
  const r = xpathEval(b, e, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE); const a = [];
  for (let i = 0; i < r.snapshotLength; i++) a.push(r.snapshotItem(i));
  return a;
}
function fmtDate(d, p) {
  const z = (n, l = 2) => String(n).padStart(l, '0');
  return String(p).replace(/yyyy|MM|dd|HH|mm|ss|SSS/g, t => ({ yyyy: d.getFullYear(), MM: z(d.getMonth() + 1), dd: z(d.getDate()), HH: z(d.getHours()), mm: z(d.getMinutes()), ss: z(d.getSeconds()), SSS: z(d.getMilliseconds(), 3) }[t]));
}
function simpleVal(k, m) {
  let r;
  if (k === 'in.body' || k === 'body' || k === 'bodyAs(String)') return m.body;
  if ((r = k.match(/^(?:in\.)?headers?\.(.+)$/))) return m.headers[r[1]];
  if ((r = k.match(/^(?:property|exchangeProperty)\.(.+)$/))) return m.props[r[1]];
  if ((r = k.match(/^date:now:(.+)$/))) return fmtDate(new Date(), r[1]);
  if (k === 'exception.message' || k === 'exception') return m.exception ?? '';
  if (k === 'exception.stacktrace') return m.exception ? `${m.exception}\n\tat iflow (simulado)` : '';
  if (k === 'camelId') return 'TallerIFlows';
  if (k === 'exchangeId') return m.exchangeId;
  return undefined;
}
function simple(str, m) {
  return String(str ?? '').replace(/\$\{([^}]+)\}/g, (_, raw) => {
    const v = simpleVal(raw.trim(), m);
    return v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
  });
}
function operand(t, m) {
  t = t.trim();
  if (/^'.*'$|^".*"$/.test(t)) return simple(t.slice(1, -1), m);
  if (/^\$\{[^}]+\}$/.test(t)) return simpleVal(t.slice(2, -1).trim(), m) ?? '';
  if (t === 'null') return null;
  return simple(t, m);
}
function clause(cl, m) {
  const r = cl.trim().match(/^(.+?)\s+(not contains|contains|not regex|regex|not in|in|==|=|!=|>=|<=|>|<)\s+(.+)$/i);
  if (!r) fail(`Condición no válida: «${cl.trim()}». Ejemplo: \${header.pais} = 'AR'`);
  const L = operand(r[1], m), op = r[2].toLowerCase(), R = operand(r[3], m);
  const num = v => v !== '' && v != null && !isNaN(Number(v));
  const both = num(L) && num(R);
  const cmp = both ? Number(L) - Number(R) : String(L ?? '').localeCompare(String(R ?? ''));
  switch (op) {
    case '=': case '==': return R === null ? (L == null || L === '') : both ? Number(L) === Number(R) : String(L ?? '') === String(R);
    case '!=': return R === null ? !(L == null || L === '') : both ? Number(L) !== Number(R) : String(L ?? '') !== String(R);
    case '>': return cmp > 0; case '<': return cmp < 0; case '>=': return cmp >= 0; case '<=': return cmp <= 0;
    case 'contains': return String(L ?? '').includes(String(R));
    case 'not contains': return !String(L ?? '').includes(String(R));
    case 'regex': return new RegExp(`^(?:${R})$`).test(String(L ?? ''));
    case 'not regex': return !new RegExp(`^(?:${R})$`).test(String(L ?? ''));
    case 'in': return String(R).split(',').map(s => s.trim()).includes(String(L));
    case 'not in': return !String(R).split(',').map(s => s.trim()).includes(String(L));
  }
  return false;
}
function evalCondition(cond, type, m) {
  const c = String(cond || '').trim();
  if (!c) return false;
  if (type === 'XML') return xpBool(m.body, c);
  return c.split(/\s+(?:or|\|\|)\s+/i).some(p => p.split(/\s+(?:and|&&)\s+/i).every(cl => clause(cl, m)));
}

function jsonToXml(body, p) {
  let data; try { data = JSON.parse(body); } catch (_) { fail('El body no es JSON válido.'); }
  const nm = n => { const s = String(n).replace(/[^\w.\-]/g, '_'); return /^[A-Za-z_]/.test(s) ? s : '_' + s; };
  const conv = (v, n) => {
    if (Array.isArray(v)) return v.map(x => conv(x, n)).join('');
    if (v === null) return `<${n}/>`;
    if (typeof v === 'object') {
      let attrs = '', inner = '';
      for (const [k, val] of Object.entries(v)) {
        if (k.startsWith('@')) attrs += ` ${nm(k.slice(1))}="${esc(val)}"`;
        else if (k === '$') inner += esc(val);
        else inner += conv(val, nm(k));
      }
      return `<${n}${attrs}>${inner}</${n}>`;
    }
    return `<${n}>${esc(v)}</${n}>`;
  };
  if (p.addRoot) return conv(data, nm(p.rootName || 'root'));
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const keys = Object.keys(data);
    if (keys.length === 1 && !Array.isArray(data[keys[0]])) return conv(data[keys[0]], nm(keys[0]));
  }
  fail('El JSON no tiene un único miembro raíz. Activá «Add XML Root Element» en el conversor.');
}
function xmlToJson(body, p) {
  const d = parseXml(body);
  const conv = el => {
    const kids = [...el.children]; const attrs = [...el.attributes].filter(a => !a.name.startsWith('xmlns'));
    if (!kids.length && !attrs.length) return el.textContent;
    const o = {};
    attrs.forEach(a => { o['@' + a.name] = a.value; });
    kids.forEach(k => { const v = conv(k); const n = k.nodeName; if (n in o) { if (!Array.isArray(o[n])) o[n] = [o[n]]; o[n].push(v); } else o[n] = v; });
    if (!kids.length) { const t = el.textContent.trim(); if (t) o.$ = t; }
    return o;
  };
  const root = d.documentElement; const v = conv(root);
  return JSON.stringify(p.suppressRoot ? v : { [root.nodeName]: v });
}
const b64e = s => { const bytes = new TextEncoder().encode(String(s)); let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); }); return btoa(bin); };
const b64d = s => { let bin; try { bin = atob(String(s).trim()); } catch (_) { fail('El body no es Base64 válido.'); } return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))); };

function runMapping(node, m) {
  const src = parseXml(m.body, 'El mensaje origen');
  const root = String(node.props.targetRoot || 'Target').trim();
  let out;
  try { out = document.implementation.createDocument(null, root, null); } catch (_) { fail(`«${root}» no es un nombre de elemento válido.`); }
  let count = 0;
  String(node.props.rules || '').split('\n').forEach((ln, i) => {
    const t = ln.trim(); if (!t || t.startsWith('//') || t.startsWith('#')) return;
    const eq = t.indexOf('='); if (eq < 0) fail(`La regla ${i + 1} no tiene «=»: ${t}`);
    let path = t.slice(0, eq).trim(); const expr = t.slice(eq + 1).trim();
    if (path.startsWith('/')) path = path.slice(1);
    if (path.startsWith(root + '/')) path = path.slice(root.length + 1);
    let val;
    if (/^'.*'$|^".*"$/.test(expr)) val = expr.slice(1, -1);
    else { try { val = src.evaluate(xp1(expr), src, null, XPathResult.STRING_TYPE, null).stringValue; } catch (_) { fail(`XPath inválido en la regla ${i + 1}: ${expr}`); } }
    const segs = path.split('/').filter(Boolean); let cur = out.documentElement;
    if (!segs.length) fail(`La regla ${i + 1} no tiene campo destino.`);
    segs.forEach((sg, j) => {
      if (sg.startsWith('@')) { try { cur.setAttribute(sg.slice(1), val); } catch (_) { fail(`Atributo inválido en la regla ${i + 1}: ${sg}`); } return; }
      let child = [...cur.children].find(c => c.nodeName === sg);
      if (!child) { try { child = out.createElement(sg); } catch (_) { fail(`Nombre de campo inválido en la regla ${i + 1}: ${sg}`); } cur.appendChild(child); }
      cur = child;
      if (j === segs.length - 1) cur.textContent = val;
    });
    count++;
  });
  m.body = new XMLSerializer().serializeToString(out);
  return `${count} regla(s) aplicadas`;
}
function splitParts(node, m) {
  const p = node.props;
  if (p.exprType === 'Line Break') return String(m.body).split(/\r?\n/).filter(l => l.trim() !== '');
  const nodes = xpNodes(m.body, p.xpath || '');
  const g = Math.max(1, parseInt(p.grouping, 10) || 1);
  const rootName = parseXml(m.body).documentElement.nodeName;
  const parts = [];
  for (let i = 0; i < nodes.length; i += g) {
    const chunk = nodes.slice(i, i + g).map(ser).join('');
    parts.push(p.splitType === 'General Splitter' ? `<${rootName}>${chunk}</${rootName}>` : chunk);
  }
  return parts;
}
function gatherBodies(node, bodies) {
  const p = node.props; const clean = b => String(b).replace(/<\?xml[^>]*\?>/g, '').trim();
  if (p.format === 'Plain Text' || p.strategy === 'Concatenate') return bodies.join('\n');
  if (p.strategy === 'Combine from Source (Retain Source Elements)') {
    const kept = bodies.map(b => xpNodes(b, p.xpath || '/*').map(ser).join('')).join('');
    const rootName = bodies.length ? parseXml(bodies[0]).documentElement.nodeName : 'Messages';
    return `<${rootName}>${kept}</${rootName}>`;
  }
  return `<multimap:Messages xmlns:multimap="http://sap.com/xi/XI/SplitAndMerge"><multimap:Message1>${bodies.map(clean).join('')}</multimap:Message1></multimap:Messages>`;
}

/* Groovy → JavaScript (subconjunto) */
const defp = (proto, name, fn) => { if (!(name in proto)) Object.defineProperty(proto, name, { value: fn, configurable: true, writable: true }); };
defp(String.prototype, 'size', function () { return this.length; });
defp(String.prototype, 'toInteger', function () { return parseInt(this, 10); });
defp(String.prototype, 'toBigDecimal', function () { return Number(this); });
defp(String.prototype, 'isNumber', function () { return this.trim() !== '' && !isNaN(Number(this)); });
defp(Array.prototype, 'size', function () { return this.length; });
defp(Date.prototype, 'format', function (p) { return fmtDate(this, p); });

function matchBrace(s, open) {
  let depth = 0, q = null;
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}
const CLOSURE = { each: 'forEach', eachWithIndex: 'forEach', collect: 'map', findAll: 'filter', find: 'find', any: 'some', every: 'every' };
function groovyToJs(src) {
  let s = String(src).replace(/\r/g, '');
  s = s.replace(/^\s*import\s+[^\n]*$/gm, '');
  s = s.replace(/(?:def\s+)?(?:Message\s+)?processData\s*\(\s*(?:Message\s+)?(\w+)\s*\)\s*\{/, 'function processData($1) {');
  s = s.replace(/"""([\s\S]*?)"""/g, (_, inner) => '`' + inner.replace(/`/g, '\\`') + '`');
  s = s.replace(/"((?:[^"\\\n]|\\.)*)"/g, (all, inner) => {
    if (!inner.includes('$')) return all;
    return '`' + inner.replace(/`/g, '\\`').replace(/(^|[^\\])\$([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)/g, '$1${$2}') + '`';
  });
  s = s.replace(/\bdef\s+(?=[A-Za-z_])/g, 'let ');
  s = s.replace(/\b(?:final\s+)?(?:String|int|Integer|long|Long|double|Double|float|boolean|Boolean|Map|HashMap|List|ArrayList|Object|BigDecimal|var)(?:<[^>\n]*>)?\s+([A-Za-z_]\w*)\s*=/g, 'let $1 =');
  s = s.replace(/\bfor\s*\(\s*(?:let\s+|String\s+|[A-Z]\w*\s+)?([A-Za-z_]\w*)\s*(?::|\bin\b)\s*/g, 'for (let $1 of ');
  s = s.replace(/\s+as\s+(?:String|int|Integer|Map|List|BigDecimal|Double|Long)\b/g, '');
  s = s.replace(/\[:\]/g, '{}');
  s = s.replace(/\?:/g, '||');
  s = s.replace(/^(\s*)println\s+(?!\()(.+?);?\s*$/gm, '$1println($2);');
  const re = /\.(eachWithIndex|each|collect|findAll|find|any|every)\s*\{/g;
  for (let guard = 0; guard < 200; guard++) {
    re.lastIndex = 0; const mm = re.exec(s); if (!mm) break;
    const open = mm.index + mm[0].length - 1; const close = matchBrace(s, open);
    if (close < 0) throw new Error('hay una llave { sin cerrar');
    let body = s.slice(open + 1, close); let params = mm[1] === 'eachWithIndex' ? 'it, i' : 'it';
    const pm = body.match(/^\s*([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*)\s*->/);
    if (pm) { params = pm[1]; body = body.slice(pm[0].length); }
    const fnTxt = !/[;\n]/.test(body.trim()) ? `((${params}) => (${body.trim() || 'undefined'}))` : `((${params}) => {${body}})`;
    s = s.slice(0, mm.index) + '.' + CLOSURE[mm[1]] + fnTxt + s.slice(close + 1);
  }
  return s.replace(/^\n+/, '');
}
class JsonSlurper { parseText(t) { try { return JSON.parse(t); } catch (_) { throw new Error('JsonSlurper: el texto no es JSON válido'); } } parse(t) { return this.parseText(t); } }
const JsonOutput = { toJson: o => JSON.stringify(o), prettyPrint: s => JSON.stringify(JSON.parse(s), null, 2) };
const JAVA = { lang: { String, Object, Integer: Number }, util: {} };
function asMap(obj) {
  const o = { ...obj };
  Object.defineProperties(o, { get: { value: k => o[k] ?? null }, put: { value: (k, v) => { o[k] = v; } }, containsKey: { value: k => k in o }, keySet: { value: () => Object.keys(o) }, size: { value: () => Object.keys(o).length } });
  return o;
}
function runScript(node, m, logs) {
  let js;
  try { js = groovyToJs(node.props.script || ''); } catch (e) { fail('No se pudo interpretar el script: ' + e.message); }
  const api = {
    getBody: () => m.body,
    setBody: b => { m.body = b == null ? '' : (typeof b === 'object' ? JSON.stringify(b) : String(b)); },
    getHeaders: () => asMap(m.headers), getHeader: k => m.headers[k] ?? null,
    setHeader: (k, v) => { m.headers[k] = v == null ? '' : String(v); }, setHeaders: o => { Object.entries(o || {}).forEach(([k, v]) => { m.headers[k] = String(v); }); },
    getProperties: () => asMap(m.props), getProperty: k => m.props[k] ?? null, setProperty: (k, v) => { m.props[k] = v; },
    getAttachments: () => asMap({}),
  };
  const println = (...a) => logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '));
  const messageLogFactory = { getMessageLog: () => ({ setStringProperty: (k, v) => logs.push(`MPL ${k} = ${v}`), addAttachmentAsString: (n, c) => logs.push(`Adjunto MPL «${n}»: ${short(c, 120)}`), addCustomHeaderProperty: (k, v) => logs.push(`Custom header ${k} = ${v}`) }) };
  let fn;
  try { fn = new Function('message', 'messageLogFactory', 'JsonSlurper', 'JsonOutput', 'println', 'java', js + '\nif (typeof processData !== "function") throw new Error("falta la función processData(Message message)");\nreturn processData(message);'); }
  catch (e) { fail(e instanceof EvalError ? 'El navegador bloqueó la ejecución de scripts en esta página.' : 'Error de sintaxis en el script: ' + e.message); }
  try { fn(api, messageLogFactory, JsonSlurper, JsonOutput, println, JAVA); }
  catch (e) { if (e instanceof SimError) throw e; fail('El script lanzó un error: ' + e.message); }
  return logs.length ? logs.join(' · ') : 'Script ejecutado';
}

function simulate(flow, input, mocks) {
  const N = id => flow.nodes.find(n => n.id === id);
  const outs = id => flow.edges.filter(e => e.kind === 'seq' && e.from === id);
  const trace = [], deliveries = [], dataStores = [];
  let steps = 0;
  const lipNodes = new Set();
  flow.nodes.filter(n => n.type === 'lipStart').forEach(ls => {
    const q = [ls.id];
    while (q.length) { const id = q.shift(); if (lipNodes.has(id)) continue; lipNodes.add(id); outs(id).forEach(e => q.push(e.to)); }
  });
  const snapProps = p => { const o = {}; Object.entries(p).forEach(([k, v]) => { o[k] = typeof v === 'object' ? JSON.stringify(v) : String(v); }); return o; };
  const record = (n, m, note, extra = {}) => trace.push({ id: n.id, label: label(n), type: n.type, note, body: m.body, headers: { ...m.headers }, props: snapProps(m.props), part: m.part, ...extra });

  function deliver(n, e, m, via) {
    const rcv = N(e.to);
    if (!e.props.adapter) fail(`Falta elegir el adaptador hacia «${label(rcv)}».`);
    const props = {};
    Object.entries(e.props).forEach(([k, v]) => { props[k] = typeof v === 'string' ? simple(v, m) : v; });
    if (e.props.adapter === 'SFTP' && !String(props.fileName || '').trim()) props.fileName = m.headers.CamelFileName || '(nombre generado)';
    const d = { receiver: label(rcv), adapter: e.props.adapter, props, body: m.body, headers: { ...m.headers }, via, part: m.part };
    deliveries.push(d);
    return { d, rcv };
  }
  function mockFor(rcv, d) {
    const mk = mocks && mocks[label(rcv)];
    if (mk) return typeof mk === 'function' ? mk(d) : mk;
    if (rcv.props.mockError) return { error: 'HTTP 500 Internal Server Error' };
    return { body: rcv.props.mockBody || '<Respuesta><Estado>OK</Estado></Respuesta>' };
  }
  function exec(n, m) {
    const p = n.props;
    switch (n.type) {
      case 'start': { const se = flow.edges.find(e => e.kind === 'msg' && e.to === n.id); return se ? `Recibido por ${se.props.adapter || '?'}${se.props.address ? ' en ' + se.props.address : ''}` : 'Inicio del proceso'; }
      case 'timer': m.body = ''; return 'Disparado por el temporizador';
      case 'errorStart': return `Excepción capturada: ${m.exception}`;
      case 'lipStart': return `Inicio del Local Integration Process «${label(n)}»`;
      case 'end': {
        const es = flow.edges.filter(e => e.kind === 'msg' && e.from === n.id);
        if (!es.length && lipNodes.has(n.id)) return 'Fin del Local Integration Process: vuelve al Process Call';
        if (!es.length) return 'Fin: el body vuelve como respuesta al emisor';
        return es.map(e => { const { d } = deliver(n, e, m, 'end'); return `Entregado a ${d.receiver} por ${d.adapter}`; }).join(' · ');
      }
      case 'errorEnd': return 'Fin con error: estado Failed';
      case 'contentModifier': {
        const notes = [];
        const apply = (rows, target, kind) => (rows || []).forEach(r => {
          const name = String(r.name || '').trim(); if (!name) return;
          if (r.action === 'Delete') {
            if (name.endsWith('*')) { const pre = name.slice(0, -1); Object.keys(target).forEach(k => { if (k.startsWith(pre)) delete target[k]; }); } else delete target[name];
            notes.push(`borra ${kind} ${name}`); return;
          }
          const val = String(r.value ?? '');
          let v;
          switch (r.source) {
            case 'Expression': v = simple(val, m); break;
            case 'Header': v = m.headers[val.trim()] ?? ''; break;
            case 'Property': v = m.props[val.trim()] ?? ''; break;
            case 'XPath': v = xpString(m.body, val.trim()); break;
            default: v = val;
          }
          target[name] = kind === 'header' ? String(v) : v;
          notes.push(`${kind} ${name}`);
        });
        apply(p.headers, m.headers, 'header');
        apply(p.properties, m.props, 'property');
        if (String(p.body || '') !== '') { m.body = p.bodyType === 'Constant' ? p.body : simple(p.body, m); notes.push('body'); }
        return notes.length ? 'Escribe ' + notes.join(', ') : 'Sin cambios configurados';
      }
      case 'jsonToXml': m.body = jsonToXml(m.body, p); m.headers['Content-Type'] = 'application/xml'; return 'JSON convertido a XML';
      case 'xmlToJson': m.body = xmlToJson(m.body, p); m.headers['Content-Type'] = 'application/json'; return 'XML convertido a JSON';
      case 'encoder': m.body = b64e(m.body); return 'Body codificado en Base64';
      case 'decoder': m.body = b64d(m.body); return 'Body decodificado';
      case 'script': return runScript(n, m, []);
      case 'mapping': return runMapping(n, m);
      case 'filter': {
        const expr = p.xpath || '', t = p.valueType || 'Nodelist';
        if (t === 'String') { m.body = xpString(m.body, expr); return 'Valor de texto'; }
        if (t === 'Integer') { m.body = String(Math.trunc(xpathEval(m.body, expr, XPathResult.NUMBER_TYPE).numberValue)); return 'Valor numérico'; }
        if (t === 'Boolean') { m.body = String(xpBool(m.body, expr)); return 'Valor booleano'; }
        const ns = xpNodes(m.body, expr); m.body = (t === 'Node' ? ns.slice(0, 1) : ns).map(ser).join('');
        return `${ns.length} nodo(s) coinciden`;
      }
      case 'requestReply': {
        const e = flow.edges.find(x => x.kind === 'msg' && x.from === n.id);
        if (!e) fail(`«${label(n)}» no está conectado a un Receiver.`);
        const { d, rcv } = deliver(n, e, m, 'requestReply');
        const mk = mockFor(rcv, d) || {};
        if (mk.error) fail(`Request Reply → ${d.receiver} (${d.adapter}): ${mk.error}`);
        m.body = mk.body ?? ''; m.headers.CamelHttpResponseCode = String(mk.status || 200); d.response = m.body;
        return `Respuesta de ${d.receiver} por ${d.adapter}`;
      }
      case 'send': {
        const e = flow.edges.find(x => x.kind === 'msg' && x.from === n.id);
        if (!e) fail(`«${label(n)}» no está conectado a un Receiver.`);
        const { d } = deliver(n, e, m, 'send');
        return `Copia enviada a ${d.receiver} por ${d.adapter}`;
      }
      case 'gather': return 'Gather sin Splitter previo: no hace nada';
      case 'pgpEncryptor': {
        const key = String(p.keyName || '').trim(); if (!key) fail('Falta el nombre de la clave PGP (User ID del keyring).');
        m.body = pgpSeal(m.body, key); return `Body encriptado con la clave pública «${key}»`;
      }
      case 'pgpDecryptor': {
        const key = String(p.keyName || '').trim(); if (!key) fail('Falta el nombre de la clave PGP (User ID del keyring).');
        const o = pgpOpen(m.body);
        if (!o) fail('El body no es un mensaje PGP: no se puede desencriptar.');
        if (o.key !== key) fail(`El mensaje se encriptó con la clave «${o.key}» y el Decryptor usa «${key}»: no hay clave privada que corresponda.`);
        m.body = o.body; return `Body desencriptado con la clave privada «${key}»`;
      }
      case 'dsWrite': {
        const name = String(p.dsName || '').trim(); if (!name) fail('Falta el Data Store Name.');
        const id = simple(p.entryId, m).trim() || ('ID-' + uid().toUpperCase());
        const prev = dataStores.findIndex(d => d.name === name && d.id === id);
        if (prev >= 0 && !p.overwrite) fail(`El Data Store «${name}» ya tiene la entrada «${id}». Activá «Overwrite Existing Message» para reemplazarla.`);
        const entry = { name, id, body: m.body, encrypted: !!p.encrypt, headers: { ...m.headers }, part: m.part };
        if (prev >= 0) dataStores[prev] = entry; else dataStores.push(entry);
        return `Guardado en Data Store «${name}», entrada «${id}»${p.encrypt ? ' (encriptado)' : ''}${prev >= 0 ? ' · reemplazó la entrada anterior' : ''}`;
      }
      default: return '';
    }
  }
  function nextOf(n, m) {
    const o = outs(n.id);
    if (n.type === 'router') {
      for (const e of o.filter(x => !x.props.isDefault)) {
        if (evalCondition(e.props.condition, e.props.exprType || 'Non-XML', m)) return { e, why: `toma la ruta «${e.props.name || 'sin nombre'}»` };
      }
      const def = o.find(x => x.props.isDefault);
      if (def) return { e: def, why: `ninguna condición se cumple: ruta por defecto «${def.props.name || 'Default'}»` };
      fail('Ninguna condición del Router se cumplió y no hay ruta por defecto.');
    }
    if (!o.length) fail(`«${label(n)}» no tiene conexión de salida.`);
    return { e: o[0] };
  }
  function tag(e, n, m) { if (!e.node) { e.node = n; e.msg = m; } return e; }
  function walk(id, m, inSplit) {
    let n = N(id);
    while (true) {
      if (++steps > 500) fail('Se superó el límite de pasos: revisá si hay un ciclo en el iFlow.');
      if (n.type === 'gather' && inSplit) return { kind: 'gather', n, m };
      let note;
      try { note = exec(n, m); } catch (e) { throw tag(e, n, m); }
      if (n.type === 'end' || n.type === 'errorEnd') { record(n, m, note); return { kind: n.type, m }; }
      if (n.type === 'splitter') {
        let parts;
        try { parts = splitParts(n, m); } catch (e) { throw tag(e, n, m); }
        record(n, m, `${parts.length} parte(s)`);
        const o = outs(n.id);
        if (!o.length) throw tag(new SimError(`«${label(n)}» no tiene conexión de salida.`), n, m);
        if (!parts.length) return { kind: 'end', m };
        let gather = null, last = null; const bodies = [];
        parts.forEach((part, i) => {
          const pm = { body: part, headers: { ...m.headers }, props: { ...m.props, CamelSplitIndex: i, CamelSplitSize: parts.length }, exchangeId: m.exchangeId, part: `Parte ${i + 1}/${parts.length}` };
          const r = walk(o[0].to, pm, true);
          if (r.kind === 'gather') { gather = r.n; bodies.push(r.m.body); } else last = r;
        });
        if (!gather) return last || { kind: 'end', m };
        try { m.body = gatherBodies(gather, bodies); } catch (e) { throw tag(e, gather, m); }
        let nx; try { nx = nextOf(gather, m); } catch (e) { throw tag(e, gather, m); }
        record(gather, m, `${bodies.length} mensaje(s) combinados`);
        n = N(nx.e.to); continue;
      }
      if (n.type === 'multicast') {
        const o = outs(n.id);
        if (!o.length) throw tag(new SimError(`«${label(n)}» no tiene ramas de salida.`), n, m);
        record(n, m, `${o.length} rama(s) · ${n.props.mode || 'Parallel Multicast'}`);
        const results = o.map((e, i) => {
          const bm = { body: m.body, headers: { ...m.headers }, props: { ...m.props }, exchangeId: m.exchangeId, exception: m.exception, part: `${m.part ? m.part + ' · ' : ''}Rama ${i + 1}/${o.length}` };
          return walk(e.to, bm, inSplit);
        });
        const r0 = results[0];
        if (r0.m) delete r0.m.part;
        return r0;
      }
      if (n.type === 'processCall') {
        const pname = String(n.props.process || '').trim();
        const ls = flow.nodes.find(k => k.type === 'lipStart' && label(k) === pname);
        if (!ls) throw tag(new SimError(`El Process Call no encuentra el Local Integration Process «${pname || '(sin elegir)'}».`), n, m);
        record(n, m, `Llama a «${pname}»`);
        const r = walk(ls.id, m, false);
        if (r.kind === 'errorEnd') return r;
        let nx; try { nx = nextOf(n, m); } catch (e) { throw tag(e, n, m); }
        n = N(nx.e.to); continue;
      }
      let nx; try { nx = nextOf(n, m); } catch (e) { throw tag(e, n, m); }
      record(n, m, [note, nx.why].filter(Boolean).join(' · '));
      n = N(nx.e.to);
    }
  }

  const m0 = { body: input.body ?? '', headers: { ...(input.headers || {}) }, props: {}, exchangeId: 'ID-' + uid() };
  const starts = flow.nodes.filter(n => n.type === 'start' || n.type === 'timer');
  const first = starts.find(n => flow.edges.some(e => e.kind === 'msg' && e.to === n.id)) || starts[0];
  let status = 'COMPLETED', error = null, final = m0, handled = false, failedId = null;
  const errStep = (e, fallback) => {
    const em = e.msg || fallback;
    trace.push({ id: e.node?.id || null, label: e.node ? label(e.node) : 'Proceso', type: e.node?.type, error: e.message, body: em.body, headers: { ...em.headers }, props: snapProps(em.props), part: em.part });
    return em;
  };
  try {
    if (!first) fail('El proceso no tiene Start Message ni Timer Start.');
    const r = walk(first.id, m0, false);
    final = r.m;
    if (r.kind === 'errorEnd') { status = 'FAILED'; error = 'El proceso terminó en un Error End.'; }
  } catch (e0) {
    let e = e0;
    if (!(e instanceof SimError)) e = Object.assign(new SimError(e.message), { node: e.node, msg: e.msg });
    error = e.message; failedId = e.node?.id || null;
    const em = errStep(e, m0);
    const es = flow.nodes.find(n => n.type === 'errorStart');
    if (es) {
      const xm = { body: em.body, headers: { ...em.headers }, props: { ...em.props, CamelExceptionCaught: e.message }, exception: e.message, exchangeId: em.exchangeId };
      try {
        const r = walk(es.id, xm, false);
        final = r.m; handled = true;
        status = r.kind === 'errorEnd' ? 'FAILED' : 'COMPLETED';
      } catch (e2) {
        status = 'FAILED'; error = e2.message; final = errStep(e2, xm); failedId = e2.node?.id || failedId;
      }
    } else { status = 'FAILED'; final = em; }
  }
  return { status, error, handled, body: final.body, headers: final.headers, props: final.props, deliveries, dataStores, trace, failedId };
}

/* ---------------- Check estructural ---------------- */
function checkFlow(f) {
  const out = [];
  const E = (msg, ref) => out.push({ level: 'error', msg, ref });
  const W = (msg, ref) => out.push({ level: 'warn', msg, ref });
  const N = id => f.nodes.find(n => n.id === id);
  const ins = id => f.edges.filter(e => e.kind === 'seq' && e.to === id);
  const outs = id => f.edges.filter(e => e.kind === 'seq' && e.from === id);
  const starts = f.nodes.filter(n => n.type === 'start' || n.type === 'timer');
  if (!starts.length) E('Falta un Start Message o un Timer Start.');
  if (starts.length > 1) E('El proceso tiene más de un evento de inicio. El Exception Subprocess usa Error Start.');
  if (!f.nodes.some(n => n.type === 'end' || n.type === 'errorEnd')) E('Falta un End Message.');
  if (f.nodes.filter(n => n.type === 'errorStart').length > 1) E('Usá un solo Exception Subprocess.');
  f.edges.filter(e => e.kind === 'msg').forEach(e => { if (!e.props.adapter) E(`Elegí el adaptador de la conexión ${label(N(e.from))} → ${label(N(e.to))}.`, e.id); });
  const hasSender = f.nodes.some(n => n.type === 'sender');
  f.nodes.forEach(n => {
    const t = n.type, L = `«${label(n)}»`;
    if (t === 'sender') { if (!f.edges.some(e => e.kind === 'msg' && e.from === n.id)) W(`${L} no está conectado a ningún Start Message.`, n.id); return; }
    if (t === 'receiver') { if (!f.edges.some(e => e.kind === 'msg' && e.to === n.id)) W(`${L} no está conectado.`, n.id); return; }
    if (t === 'start' && hasSender && !f.edges.some(e => e.kind === 'msg' && e.to === n.id)) W(`${L} no recibe mensajes de ningún Sender.`, n.id);
    const isStart = ['start', 'timer', 'errorStart', 'lipStart'].includes(t), isEnd = ['end', 'errorEnd'].includes(t);
    const o = outs(n.id);
    if (!isStart && !ins(n.id).length) E(`${L} no tiene conexión de entrada.`, n.id);
    if (!isEnd && !o.length) E(`${L} no tiene conexión de salida.`, n.id);
    if (t !== 'router' && t !== 'multicast' && o.length > 1) E(`${L} tiene ${o.length} salidas. Solo un Router o un Multicast pueden bifurcar el flujo.`, n.id);
    if (t === 'multicast' && o.length === 1) W(`${L} tiene una sola rama.`, n.id);
    if (t === 'lipStart' && f.nodes.filter(k => k.type === 'lipStart' && label(k) === label(n)).length > 1) E(`Hay dos Local Integration Process llamados ${L}.`, n.id);
    if (t === 'processCall' && !f.nodes.some(k => k.type === 'lipStart' && label(k) === String(n.props.process || '').trim())) E(`${L} no tiene un Local Integration Process válido elegido.`, n.id);
    if (t === 'dsWrite' && !String(n.props.dsName || '').trim()) E(`${L} necesita un Data Store Name.`, n.id);
    if ((t === 'pgpEncryptor' || t === 'pgpDecryptor') && !String(n.props.keyName || '').trim()) E(`${L} necesita el nombre de la clave PGP.`, n.id);
    if (t === 'router' && o.length) {
      if (o.length < 2) W(`${L} tiene una sola ruta.`, n.id);
      if (o.filter(e => e.props.isDefault).length !== 1) E(`${L} necesita exactamente una ruta por defecto.`, n.id);
      o.filter(e => !e.props.isDefault && !String(e.props.condition || '').trim()).forEach(e => E(`La ruta «${e.props.name || 'sin nombre'}» del Router no tiene condición.`, e.id));
    }
    if ((t === 'requestReply' || t === 'send') && !f.edges.some(e => e.kind === 'msg' && e.from === n.id)) E(`${L} no está conectado a un Receiver.`, n.id);
    if (t === 'script' && !String(n.props.script || '').trim()) E(`${L} no tiene código.`, n.id);
    if (t === 'filter' && !String(n.props.xpath || '').trim()) E(`${L} necesita una expresión XPath.`, n.id);
    if (t === 'splitter' && n.props.exprType !== 'Line Break' && !String(n.props.xpath || '').trim()) E(`${L} necesita una expresión XPath.`, n.id);
    if (t === 'mapping' && !String(n.props.rules || '').trim()) E(`${L} no tiene reglas de mapeo.`, n.id);
  });
  return out;
}

/* ---------------- Verificación de ejercicios ---------------- */
function helpers(f) {
  const N = id => f.nodes.find(n => n.id === id);
  return {
    node: N,
    has: t => f.nodes.some(n => n.type === t),
    nodes: t => f.nodes.filter(n => n.type === t),
    outs: id => f.edges.filter(e => e.kind === 'seq' && e.from === id),
    senderEdge: () => f.edges.find(e => e.kind === 'msg' && N(e.from)?.type === 'sender'),
    recvEdge: name => f.edges.find(e => e.kind === 'msg' && N(e.to)?.type === 'receiver' && label(N(e.to)) === name),
  };
}
function verifyQuiz(ex) {
  const ans = (store.quiz[ex.id] ||= {});
  const items = ex.quiz.map((q, i) => ({ ok: ans[i] === 0, label: `Pregunta ${i + 1}`, detail: ans[i] == null ? 'Sin responder.' : '' }));
  const all = items.every(i => i.ok);
  if (all) { store.done[ex.id] = true; toast('¡Cuestionario aprobado!'); }
  save();
  state.results = { items, all, quiz: true };
  renderEx(); renderHeader();
  tabEj.scrollTo?.(0, 0);
}
function verify() {
  const ex = EX(); const f = state.flow;
  if (ex.quiz) return verifyQuiz(ex);
  const items = [];
  if (!ex.tests.length && !ex.checks.length) {
    state.results = { free: true }; state.tab = 'ej'; renderTabs(); renderEx(); return;
  }
  const errs = checkFlow(f).filter(i => i.level === 'error');
  items.push({ ok: !errs.length, label: 'El iFlow pasa el Check', detail: errs.map(i => i.msg).join(' · ') });
  const h = helpers(f);
  ex.checks.forEach(c => { let ok = false; try { ok = !!c.test(h); } catch (_) {} items.push({ ok, label: c.label }); });
  let lastRun = null;
  ex.tests.forEach(t => {
    if (errs.length) { items.push({ ok: false, label: `Prueba: ${t.name}`, detail: 'No se ejecutó porque el Check tiene errores.' }); return; }
    const r = simulate(clone(f), clone(t.input), ex.mocks); lastRun = { r, input: t.input };
    let res;
    if (r.status !== 'COMPLETED' && !t.allowFail) res = `El mensaje terminó en Failed: ${r.error}`;
    else { try { res = t.expect(r); } catch (e) { res = 'Error al evaluar la prueba: ' + e.message; } }
    items.push({ ok: res === true, label: `Prueba: ${t.name}`, detail: res === true ? '' : String(res) });
  });
  const all = items.every(i => i.ok);
  if (all) { store.done[ex.id] = true; save(); toast('¡Ejercicio resuelto! Quedó marcado como completado.'); }
  state.results = { items, all };
  if (lastRun) { state.simResult = lastRun.r; state.sim = { visited: new Set(lastRun.r.trace.map(s => s.id)), failed: lastRun.r.failedId }; renderSimOut(); }
  state.tab = 'ej'; renderTabs(); renderEx(); renderHeader(); renderCanvas();
}

/* ---------------- Modelo: edición ---------------- */
function clearSim() { if (state.sim) { state.sim = null; } }
function addNode(type, x, y) {
  const n = { id: uid(), type, x: snap(x), y: snap(y), props: defProps(type) };
  if (type === 'receiver') n.props.name = 'Receiver' + (state.flow.nodes.filter(k => k.type === 'receiver').length ? '_' + (state.flow.nodes.filter(k => k.type === 'receiver').length + 1) : '');
  state.flow.nodes.push(n);
  return n;
}
function addMacroExsub(x, y) {
  const a = addNode('errorStart', x - 90, y), b = addNode('end', x + 90, y);
  state.flow.edges.push({ id: uid(), kind: 'seq', from: a.id, to: b.id, props: {} });
  return a;
}
function addMacroLip(x, y) {
  const a = addNode('lipStart', x - 90, y), b = addNode('end', x + 90, y);
  const used = new Set(state.flow.nodes.filter(k => k.type === 'lipStart' && k !== a).map(label));
  let i = 1; while (used.has(`Local Process ${i}`)) i++;
  a.props.name = `Local Process ${i}`;
  state.flow.edges.push({ id: uid(), kind: 'seq', from: a.id, to: b.id, props: {} });
  return a;
}
const MACROS = { exsub: addMacroExsub, lip: addMacroLip };
function bounds(n) {
  const s = T[n.type].shape;
  if (s === 'task') return { x0: n.x - 60, y0: n.y - 29, x1: n.x + 60, y1: n.y + 29 };
  if (s === 'event') return { x0: n.x - 19, y0: n.y - 19, x1: n.x + 19, y1: n.y + 46 };
  if (s === 'gateway') return { x0: n.x - 26, y0: n.y - 26, x1: n.x + 26, y1: n.y + 50 };
  return { x0: n.x - 52, y0: n.y - 68, x1: n.x + 52, y1: n.y + 68 };
}
function autoPlace(type) {
  const f = state.flow; const inner = f.nodes.filter(n => !isPart(n));
  if (type === 'sender') return { x: 30, y: 260 + f.nodes.filter(n => n.type === 'sender').length * 180 };
  const maxX = Math.max(700, ...inner.map(n => n.x));
  if (type === 'receiver') { const c = f.nodes.filter(n => n.type === 'receiver').length; return { x: maxX + 230, y: 120 + c * 170 }; }
  if (!inner.length) return { x: 400, y: 260 };
  const minX = Math.min(...inner.map(n => n.x)), maxY = Math.max(...inner.map(n => n.y));
  return { x: (minX + maxX) / 2, y: maxY + 130 };
}
function distSeg(px, py, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y; const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / l2));
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}
function insertIntoEdge(e, n, place) {
  const f = state.flow; const a = byId(e.from), b = byId(e.to);
  if (place) {
    if (b.x > a.x && b.x - a.x < 300) f.nodes.forEach(k => { if (k !== a && k !== n && k.type !== 'sender' && k.x > a.x + 1) k.x += 170; });
    n.x = snap((a.x + b.x) / 2); n.y = snap((a.y + b.y) / 2);
  }
  const oldTo = e.to; e.to = n.id;
  f.edges.push({ id: uid(), kind: 'seq', from: n.id, to: oldTo, props: {} });
}
function tryInsert(n) {
  const sh = T[n.type].shape; if (sh !== 'task' && sh !== 'gateway') return false;
  if (state.flow.edges.some(e => e.from === n.id || e.to === n.id)) return false;
  const e = state.flow.edges.find(e => e.kind === 'seq' && e.from !== n.id && e.to !== n.id && distSeg(n.x, n.y, byId(e.from), byId(e.to)) < 20);
  if (!e) return false;
  insertIntoEdge(e, n, false); return true;
}
function addFromPalette(type) {
  const sh = T[type].shape; const sel = state.sel; let n;
  if (MACROS[type]) { const p = autoPlace('task'); n = MACROS[type](p.x, p.y); toast(`${T[type].label} agregado: insertá pasos en su flecha.`); }
  else if ((sh === 'task' || sh === 'gateway') && sel) {
    let e = null;
    if (sel.kind === 'edge') { const se = edgeById(sel.id); if (se && se.kind === 'seq') e = se; }
    else { const sn = byId(sel.id); const o = sn ? outSeq(sn.id) : []; if (sn && o.length === 1 && sn.type !== 'router' && sn.type !== 'multicast') e = o[0]; }
    n = addNode(type, 0, 0);
    if (e) { insertIntoEdge(e, n, true); toast(`${T[type].label} insertado en el flujo.`); }
    else { const p = autoPlace(type); n.x = snap(p.x); n.y = snap(p.y); toast(`${T[type].label} agregado. Conectalo arrastrando la flecha azul.`); }
  } else {
    const p = autoPlace(type); n = addNode(type, p.x, p.y);
    toast(`${T[type].label} agregado. ${sh === 'task' || sh === 'gateway' ? 'Seleccioná una flecha antes de hacer clic para insertarlo directo.' : 'Conectalo arrastrando la flecha azul.'}`);
  }
  clearSim(); save(); setSel({ kind: 'node', id: n.id }, true);
}
function addAt(type, x, y) {
  let n;
  if (MACROS[type]) n = MACROS[type](x, y);
  else { n = addNode(type, x, y); if (tryInsert(n)) toast(`${T[type].label} insertado en la flecha.`); }
  clearSim(); save(); setSel({ kind: 'node', id: n.id }, true);
}
function connect(fromId, toId) {
  const f = state.flow; let a = byId(fromId), b = byId(toId);
  if (!a || !b || a === b) return;
  const pa = isPart(a), pb = isPart(b);
  if (pa && pb) return toast('Dos participantes no se conectan entre sí.');
  let edge;
  if (pa || pb) {
    const part = pa ? a : b, other = pa ? b : a;
    if (part.type === 'sender') {
      if (other.type !== 'start') return toast('Un Sender se conecta solo a un Start Message.');
      a = part; b = other;
      if (f.edges.some(e => e.kind === 'msg' && e.to === b.id)) return toast('Ese Start Message ya tiene un Sender conectado.');
    } else {
      if (!['end', 'requestReply', 'send'].includes(other.type)) return toast('Un Receiver se conecta desde un End Message, un Request Reply o un Send.');
      a = other; b = part;
      if (a.type !== 'end' && f.edges.some(e => e.kind === 'msg' && e.from === a.id)) return toast(`«${label(a)}» ya está conectado a un Receiver.`);
    }
    if (f.edges.some(e => e.from === a.id && e.to === b.id)) return;
    edge = { id: uid(), kind: 'msg', from: a.id, to: b.id, props: { adapter: '' } };
    toast('Elegí el adaptador en el panel de propiedades.');
  } else {
    if (['start', 'timer', 'errorStart', 'lipStart'].includes(b.type)) return toast('Un evento de inicio no puede recibir conexiones.');
    if (['end', 'errorEnd'].includes(a.type)) return toast('Un evento de fin no tiene salidas dentro del proceso.');
    if (f.edges.some(e => e.from === a.id && e.to === b.id)) return;
    const o = outSeq(a.id);
    if (a.type !== 'router' && a.type !== 'multicast' && o.length) return toast(`«${label(a)}» ya tiene una salida. Borrá esa flecha o usá un Router o un Multicast para bifurcar.`);
    edge = { id: uid(), kind: 'seq', from: a.id, to: b.id, props: a.type === 'router' ? { name: `Ruta ${o.length + 1}`, exprType: 'XML', condition: '', isDefault: false } : {} };
  }
  f.edges.push(edge);
  clearSim(); save();
  if (edge.kind === 'msg' || a.type === 'router') setSel({ kind: 'edge', id: edge.id }, true);
  else { setSel({ kind: 'node', id: b.id }, false); }
}
function deleteSel() {
  const s = state.sel; if (!s) return; const f = state.flow;
  if (s.kind === 'edge') f.edges = f.edges.filter(e => e.id !== s.id);
  else {
    const n = byId(s.id); if (!n) return;
    const i = inSeq(n.id), o = outSeq(n.id);
    f.edges = f.edges.filter(e => e.from !== n.id && e.to !== n.id);
    f.nodes = f.nodes.filter(k => k !== n);
    if (!isPart(n) && i.length === 1 && o.length === 1 && i[0].from !== o[0].to) f.edges.push({ id: uid(), kind: 'seq', from: i[0].from, to: o[0].to, props: i[0].props });
  }
  clearSim(); save(); setSel(null);
}

/* ---------------- Render: lienzo ---------------- */
const svg = $('#canvas');
function wrapText(t, max) {
  const words = String(t).split(/\s+/); const lines = []; let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  if (cur) lines.push(cur);
  if (lines.length > 3) { lines.length = 3; lines[2] = lines[2].slice(0, max - 1) + '…'; }
  return lines.map(l => l.length > max + 3 ? l.slice(0, max + 2) + '…' : l);
}
const tspans = (lines, y0, lh = 14) => lines.map((l, i) => `<tspan x="0" ${i ? `dy="${lh}"` : `y="${y0}"`}>${esc(l)}</tspan>`).join('');
function clip(n, tx, ty) {
  const dx = tx - n.x, dy = ty - n.y; if (!dx && !dy) return { x: n.x, y: n.y };
  const s = T[n.type].shape;
  if (s === 'event') { const d = Math.hypot(dx, dy); return { x: n.x + dx / d * 19, y: n.y + dy / d * 19 }; }
  if (s === 'gateway') { const t = 26 / (Math.abs(dx) + Math.abs(dy)); return { x: n.x + dx * t, y: n.y + dy * t }; }
  const hw = s === 'task' ? 60 : 52, hh = s === 'task' ? 29 : 68;
  const t = Math.min(hw / Math.abs(dx || 1e-9), hh / Math.abs(dy || 1e-9));
  return { x: n.x + dx * t, y: n.y + dy * t };
}
function reach(fromId) {
  const seen = new Set([fromId]); const q = [fromId];
  while (q.length) { const id = q.shift(); outSeq(id).forEach(e => { if (!seen.has(e.to)) { seen.add(e.to); q.push(e.to); } }); }
  return seen;
}
function nodeSvg(n) {
  const sh = T[n.type].shape; const sel = state.sel?.kind === 'node' && state.sel.id === n.id;
  const cls = ['node', sh, n.type, sel ? 'sel' : '', state.sim?.visited.has(n.id) ? 'visited' : '', state.sim?.failed === n.id ? 'failed' : '', state.conn?.over === n.id ? 'target' : ''].join(' ');
  let inner = '';
  if (sh === 'participant') {
    inner = `<rect class="body" x="-52" y="-68" width="104" height="136" rx="6"/><path class="band" d="M-52 -46H52"/><text class="ptype" y="-53" text-anchor="middle">${n.type === 'sender' ? 'SENDER' : 'RECEIVER'}</text><text text-anchor="middle">${tspans(wrapText(label(n), 13), 6 - (wrapText(label(n), 13).length - 1) * 7)}</text>`;
  } else if (sh === 'event') {
    const g = {
      start: '<path class="glyph" d="M-8 -5.5h16v11h-16z M-8 -5.5l8 6 8-6"/>',
      end: '<path class="glyph" d="M-8 -5.5h16v11h-16z M-8 -5.5l8 6 8-6"/>',
      timer: '<circle class="glyph" r="10"/><path class="glyph" d="M0 -6v6l4 3"/>',
      errorStart: '<path class="glyph" d="M-6 8l3-9 4 3 4-10-3 9-4-3z"/>',
      errorEnd: '<path class="glyph" d="M-6 8l3-9 4 3 4-10-3 9-4-3z"/>',
    }[n.type] || '';
    const name = String(n.props.name || '').trim() || T[n.type].label;
    inner = `<circle class="body" r="19"/>${g}<text class="sub" text-anchor="middle">${tspans(wrapText(name, 16), 36, 13)}</text>`;
  } else if (sh === 'gateway') {
    inner = `<path class="body" d="M0 -26L26 0L0 26L-26 0Z"/><path class="glyph" d="${n.type === 'multicast' ? 'M0 -10V10M-10 0H10' : 'M-8 -8L8 8M8 -8L-8 8'}" style="stroke-width:2.4"/><text class="sub" text-anchor="middle">${tspans(wrapText(label(n), 16), 42, 13)}</text>`;
  } else {
    const lines = wrapText(label(n), 15);
    inner = `<rect class="body" x="-60" y="-29" width="120" height="58" rx="8"/><g class="ico" transform="translate(-56,-26) scale(.7)">${ICON[n.type]}</g><text text-anchor="middle">${tspans(lines, 8 - (lines.length - 1) * 7)}</text>`;
  }
  return `<g class="${cls}" data-node="${n.id}" transform="translate(${n.x},${n.y})">${inner}</g>`;
}
function renderCanvas() {
  const f = state.flow; if (!f) return;
  const inner = f.nodes.filter(n => !isPart(n));
  let px0 = Infinity, py0 = Infinity, px1 = -Infinity, py1 = -Infinity;
  inner.forEach(n => { const b = bounds(n); px0 = Math.min(px0, b.x0); py0 = Math.min(py0, b.y0); px1 = Math.max(px1, b.x1); py1 = Math.max(py1, b.y1); });
  if (!inner.length) { px0 = 220; py0 = 200; px1 = 760; py1 = 320; }
  px0 -= 74; py0 -= 46; px1 += 46; py1 += 34;
  if (py1 - py0 < 200) { const c = (py0 + py1) / 2; py0 = c - 100; py1 = c + 100; }
  let vx = px0 - 24, vy = py0 - 24, W = px1, H = py1;
  f.nodes.forEach(n => { const b = bounds(n); vx = Math.min(vx, b.x0 - 24); vy = Math.min(vy, b.y0 - 24); W = Math.max(W, b.x1); H = Math.max(H, b.y1); });
  W = Math.max(W + 60, vx + 1000); H = Math.max(H + 60, vy + 480);
  // Mientras se arrastra o se conecta, el origen queda fijo: si se moviera, el puntero y el dibujo se desfasarían
  if ((state.drag || state.conn) && state.vb) { vx = state.vb.vx; vy = state.vb.vy; W = Math.max(W, state.vb.W); H = Math.max(H, state.vb.H); }
  else state.vb = { vx, vy, W, H, cw: Math.min(W, (f.nodes.length ? Math.max(...f.nodes.map(n => bounds(n).x1)) : W) + 30) - vx };
  const vw = W - vx, vh = H - vy;
  svg.setAttribute('viewBox', `${vx} ${vy} ${vw} ${vh}`);
  svg.setAttribute('width', Math.round(vw * state.zoom)); svg.setAttribute('height', Math.round(vh * state.zoom));

  let out = `<defs>
    <marker id="aSeq" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="m-seq" d="M0 0L10 5L0 10z"/></marker>
    <marker id="aSel" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="m-sel" d="M0 0L10 5L0 10z"/></marker>
    <marker id="aVis" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="m-vis" d="M0 0L10 5L0 10z"/></marker>
    <marker id="aMsg" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path class="m-msg" d="M1 1L11 6L1 11z"/></marker>
    <marker id="oMsg" viewBox="0 0 12 12" refX="6" refY="6" markerWidth="8" markerHeight="8"><circle class="m-msg" cx="6" cy="6" r="4"/></marker>
  </defs>`;
  out += `<g class="pool"><rect class="pool-rect" x="${px0}" y="${py0}" width="${px1 - px0}" height="${py1 - py0}" rx="4"/><rect class="pool-head" x="${px0}" y="${py0}" width="30" height="${py1 - py0}" rx="4"/><text class="pool-title" text-anchor="middle" transform="translate(${px0 + 19},${(py0 + py1) / 2}) rotate(-90)">Integration Process</text></g>`;
  f.nodes.filter(n => n.type === 'errorStart' || n.type === 'lipStart').forEach(es => {
    const ids = reach(es.id); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    ids.forEach(id => { const n = byId(id); if (!n) return; const b = bounds(n); x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1); });
    x0 -= 22; y0 -= 32; x1 += 22; y1 += 12;
    const lip = es.type === 'lipStart';
    out += `<rect class="${lip ? 'lipbox' : 'exsub'}" x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="12"/><text class="${lip ? 'lipbox-title' : 'exsub-title'}" x="${x0 + 12}" y="${y0 + 16}">${lip ? 'Local Integration Process · ' + esc(label(es)) : 'Exception Subprocess'}</text>`;
  });
  const visEdge = e => state.sim && e.kind === 'seq' && state.sim.visited.has(e.from) && state.sim.visited.has(e.to) && state.sim.failed !== e.from;
  let labels = '';
  f.edges.forEach(e => {
    const a = byId(e.from), b = byId(e.to); if (!a || !b) return;
    const p1 = clip(a, b.x, b.y), p2 = clip(b, a.x, a.y);
    const sel = state.sel?.kind === 'edge' && state.sel.id === e.id;
    const vis = !sel && visEdge(e);
    const d = `M${p1.x.toFixed(1)} ${p1.y.toFixed(1)}L${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    const mk = e.kind === 'msg' ? (sel ? 'aSel' : 'aMsg') : sel ? 'aSel' : vis ? 'aVis' : 'aSeq';
    out += `<path class="edge ${e.kind} ${sel ? 'sel' : ''} ${vis ? 'visited' : ''}" d="${d}" marker-end="url(#${mk})" ${e.kind === 'msg' ? 'marker-start="url(#oMsg)"' : ''}/><path class="hit" data-edge="${e.id}" d="${d}"/>`;
    let txt = null, lc = '';
    if (e.kind === 'msg') { txt = e.props.adapter || 'Elegí adaptador'; lc = e.props.adapter ? 'msg' : 'warn'; }
    else if (a.type === 'router') { txt = (e.props.name || 'Ruta') + (e.props.isDefault ? ' · default' : ''); lc = !e.props.isDefault && !String(e.props.condition || '').trim() ? 'warn' : ''; }
    if (txt) {
      // Las etiquetas de adaptador se corren hacia el participante para no tapar el borde del pool
      const k = e.kind === 'msg' ? (a.type === 'sender' ? 0.3 : 0.7) : 0.5;
      const mx = p1.x + (p2.x - p1.x) * k, my = p1.y + (p2.y - p1.y) * k, w = txt.length * 6.3 + 14;
      labels += `<g class="elabel ${lc}" data-edge="${e.id}" transform="translate(${mx.toFixed(1)},${my.toFixed(1)})"><rect x="${-w / 2}" y="-10" width="${w}" height="20" rx="10"/><text text-anchor="middle" y="4">${esc(txt)}</text></g>`;
    }
  });
  out += labels;
  f.nodes.forEach(n => { out += nodeSvg(n); });
  if (state.sel?.kind === 'node') {
    const n = byId(state.sel.id);
    if (n && !state.drag) {
      const off = { participant: 52, event: 19, gateway: 26, task: 60 }[T[n.type].shape] + 16;
      out += `<g class="handle" data-handle="${n.id}" transform="translate(${n.x + off},${n.y})"><title>Arrastrá para conectar</title><circle r="11"/><path d="M-5 0h8M0 -3.5l3.5 3.5-3.5 3.5"/></g>`;
    }
  }
  if (state.conn) { const a = byId(state.conn.from); out += `<path class="tmp" d="M${a.x} ${a.y}L${state.conn.x} ${state.conn.y}"/>`; }
  svg.innerHTML = out;
  $('#zVal').textContent = Math.round(state.zoom * 100) + '%';
  $('#tip').textContent = state.sel?.kind === 'node' ? 'Arrastrá el círculo azul hasta otro elemento para conectar. Supr borra.' : state.sel?.kind === 'edge' ? 'Flecha seleccionada: un clic en la paleta inserta el paso acá. Supr la borra.' : 'Clic en la paleta para agregar · arrastrá elementos para moverlos · clic en una flecha para configurarla';
}

/* ---------------- Interacción con el lienzo ---------------- */
function svgPt(ev) { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
function hitNode(ev) { const el = document.elementFromPoint(ev.clientX, ev.clientY); const g = el && el.closest && el.closest('[data-node]'); return g ? g.dataset.node : null; }
svg.addEventListener('pointerdown', ev => {
  if (ev.button !== 0) return;
  const p = svgPt(ev);
  const h = ev.target.closest('[data-handle]');
  if (h) { state.conn = { from: h.dataset.handle, x: p.x, y: p.y, over: null }; svg.setPointerCapture(ev.pointerId); ev.preventDefault(); renderCanvas(); return; }
  const nEl = ev.target.closest('[data-node]');
  if (nEl) {
    const n = byId(nEl.dataset.node);
    state.drag = { id: n.id, ox: p.x - n.x, oy: p.y - n.y, sx: p.x, sy: p.y, moved: false };
    svg.setPointerCapture(ev.pointerId); ev.preventDefault();
    setSel({ kind: 'node', id: n.id }, true); return;
  }
  const eEl = ev.target.closest('[data-edge]');
  if (eEl) { setSel({ kind: 'edge', id: eEl.dataset.edge }, true); return; }
  setSel(null);
});
svg.addEventListener('pointermove', ev => {
  if (state.drag) {
    const p = svgPt(ev), d = state.drag;
    if (!d.moved && Math.hypot(p.x - d.sx, p.y - d.sy) < 4) return;
    d.moved = true; const n = byId(d.id); const vb = state.vb || { vx: 0, vy: 0 };
    n.x = Math.max(snap(vb.vx + 70), snap(p.x - d.ox)); n.y = Math.max(snap(vb.vy + 80), snap(p.y - d.oy)); renderCanvas();
  } else if (state.conn) {
    const p = svgPt(ev); state.conn.x = p.x; state.conn.y = p.y; const o = hitNode(ev); state.conn.over = o !== state.conn.from ? o : null; renderCanvas();
  }
});
svg.addEventListener('pointerup', ev => {
  if (state.drag) {
    const d = state.drag; state.drag = null;
    if (d.moved) { const n = byId(d.id); if (tryInsert(n)) toast(`${label(n)} insertado en la flecha.`); clearSim(); save(); }
    renderCanvas();
  }
  if (state.conn) { const c = state.conn; state.conn = null; const t = hitNode(ev); if (t && t !== c.from) connect(c.from, t); renderCanvas(); }
});
svg.addEventListener('pointercancel', () => { state.drag = null; state.conn = null; renderCanvas(); });
const wrapEl = $('#canvasWrap');
wrapEl.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
wrapEl.addEventListener('drop', e => { e.preventDefault(); const t = e.dataTransfer.getData('text/plain'); if (!T[t]) return; const p = svgPt(e); addAt(t, p.x, p.y); });
document.addEventListener('keydown', e => {
  const tg = e.target; if (tg.closest && tg.closest('input,textarea,select,[contenteditable]')) return;
  if ((e.key === 'Delete' || e.key === 'Backspace') && state.sel) { e.preventDefault(); deleteSel(); }
  if (e.key === 'Escape') setSel(null);
});
$('#zIn').addEventListener('click', () => { state.zoom = Math.min(1.6, +(state.zoom + 0.1).toFixed(2)); renderCanvas(); });
$('#zOut').addEventListener('click', () => { state.zoom = Math.max(0.5, +(state.zoom - 0.1).toFixed(2)); renderCanvas(); });
function fitZoom() {
  const w = $('#canvasWrap').clientWidth - 8;
  if (!state.vb || w <= 0) return;
  state.zoom = Math.max(0.6, Math.min(1, Math.floor((w / state.vb.cw) * 20) / 20));
  renderCanvas();
}
$('#zFit').addEventListener('click', fitZoom);

/* ---------------- Paleta ---------------- */
const pal = $('#palette');
pal.innerHTML = GROUPS.map(([g, items]) => `<div class="pgroup"><h4>${g}</h4><div class="pitems">${items.map(t => `<button type="button" class="pitem" draggable="true" data-type="${t}" title="${esc(T[t].desc)}"><svg viewBox="0 0 20 20" aria-hidden="true">${ICON[t]}</svg><span>${esc(T[t].short || T[t].label)}</span></button>`).join('')}</div></div>`).join('');
pal.addEventListener('click', e => { const b = e.target.closest('[data-type]'); if (b) addFromPalette(b.dataset.type); });
pal.addEventListener('dragstart', e => { const b = e.target.closest('[data-type]'); if (b) { e.dataTransfer.setData('text/plain', b.dataset.type); e.dataTransfer.effectAllowed = 'copy'; } });

/* ---------------- Panel: pestañas ---------------- */
function renderTabs() {
  ['ej', 'prop', 'test'].forEach(t => { $('#tab-' + t).hidden = state.tab !== t; $('#t-' + t).setAttribute('aria-selected', String(state.tab === t)); });
}
document.querySelector('.tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; state.tab = b.dataset.tab; renderTabs(); if (state.tab === 'prop') renderProp(); });
function setSel(s, toProps) {
  const same = JSON.stringify(s) === JSON.stringify(state.sel);
  state.sel = s;
  if (!same) { state.showJs = false; renderProp(); }
  if (s && toProps && state.tab !== 'prop') { state.tab = 'prop'; renderTabs(); }
  renderCanvas();
}

/* ---------------- Panel: propiedades ---------------- */
const tabProp = $('#tab-prop');
const F = {
  text: (k, lab, ph = '', help = '', cls = '') => `<label class="fld"><span>${lab}</span><input id="f_${k}" data-k="${k}" class="${cls}" value="${esc(state.formTarget[k] ?? '')}" placeholder="${esc(ph)}" spellcheck="false" autocomplete="off">${help ? `<small>${help}</small>` : ''}</label>`,
  area: (k, lab, rows = 4, cls = 'code', help = '', ph = '') => `<label class="fld"><span>${lab}</span><textarea id="f_${k}" data-k="${k}" class="${cls}" rows="${rows}" spellcheck="false" placeholder="${esc(ph)}">${esc(state.formTarget[k] ?? '')}</textarea>${help ? `<small>${help}</small>` : ''}</label>`,
  select: (k, lab, opts, help = '') => {
    const t = state.formTarget; if (t[k] == null || !opts.includes(t[k])) t[k] = opts[0];
    return `<label class="fld"><span>${lab}</span><select id="f_${k}" data-k="${k}">${opts.map(o => `<option${o === t[k] ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>${help ? `<small>${help}</small>` : ''}</label>`;
  },
  check: (k, lab, help = '') => `<label class="fld chk"><input type="checkbox" id="f_${k}" data-k="${k}"${state.formTarget[k] ? ' checked' : ''}><span>${lab}</span></label>${help ? `<p class="help">${help}</p>` : ''}`,
};
const head = (type, eyebrow, title, desc, msg) => `<div class="ph"><span class="ph-ico${msg ? ' msg' : ''}"><svg viewBox="0 0 20 20" aria-hidden="true">${ICON[type]}</svg></span><div><p class="eyebrow">${esc(eyebrow)}</p><h2 id="propTitle">${esc(title)}</h2></div></div>${desc ? `<p class="desc">${esc(desc)}</p>` : ''}`;
function rowsUi(list) {
  const rows = state.formTarget[list] || (state.formTarget[list] = []);
  const kind = list === 'headers' ? 'header' : 'property';
  return `${rows.map((r, i) => {
    const id = (c) => `r_${list}_${i}_${c}`;
    const sel = (c, opts) => `<select id="${id(c)}" data-list="${list}" data-i="${i}" data-c="${c}">${opts.map(o => `<option${o === r[c] ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
    return `<div class="row-card"><div class="row-grid">
      <label>Acción${sel('action', ['Create', 'Delete'])}</label>
      <label>Nombre<input id="${id('name')}" class="mono" data-list="${list}" data-i="${i}" data-c="name" value="${esc(r.name)}" spellcheck="false" autocomplete="off"></label>
      ${r.action === 'Delete' ? '' : `<label>Tipo de origen${sel('source', ['Constant', 'Expression', 'Header', 'Property', 'XPath'])}</label>
      <label class="wide">Valor<input id="${id('value')}" class="mono" data-list="${list}" data-i="${i}" data-c="value" value="${esc(r.value)}" spellcheck="false" autocomplete="off"></label>`}
    </div><div class="row-foot"><button type="button" class="ghost" data-act="rowdel" data-list="${list}" data-i="${i}">Quitar</button></div></div>`;
  }).join('') || `<p class="help">Todavía no hay ${kind === 'header' ? 'headers' : 'properties'}.</p>`}
  <button type="button" data-act="rowadd" data-list="${list}">+ Agregar ${kind}</button>
  <p class="help" style="margin-top:10px">Constant copia el texto tal cual. Expression resuelve <code>\${header.x}</code>, <code>\${property.x}</code>, <code>\${in.body}</code>, <code>\${date:now:yyyy-MM-dd}</code>. XPath lee un valor del body XML.</p>`;
}
function nodeForm(n) {
  const t = T[n.type]; const p = n.props; state.formTarget = p;
  let h = head(n.type, t.label, label(n), t.desc, isPart(n));
  h += F.text('name', 'Nombre', isPart(n) ? '' : t.label);
  switch (n.type) {
    case 'receiver':
      if (EX().mocks && EX().mocks[label(n)]) h += `<p class="help">En este ejercicio, ${esc(label(n))} responde con datos de prueba propios del ejercicio.</p>`;
      else h += F.area('mockBody', 'Respuesta simulada (para Request Reply)', 4, 'code', 'Lo que devuelve este sistema cuando lo llama un Request Reply.', '<Respuesta><Estado>OK</Estado></Respuesta>') + F.check('mockError', 'Simular caída (HTTP 500)');
      break;
    case 'sender': case 'start': case 'end': case 'requestReply': case 'send': {
      const ms = state.flow.edges.filter(e => e.kind === 'msg' && (e.from === n.id || e.to === n.id));
      h += ms.length ? `<h3>Conexiones de mensaje</h3><ul class="routes">${ms.map(e => `<li><button type="button" data-sel-edge="${e.id}"><span>${esc(label(byId(e.from)))} → ${esc(label(byId(e.to)))}</span><small>${esc(e.props.adapter || 'sin adaptador')}</small></button></li>`).join('')}</ul>` : '';
      break;
    }
    case 'timer': h += F.select('schedule', 'Programación', ['Run Once', 'Every minute', 'Daily', 'Weekly']); break;
    case 'contentModifier': {
      const tab = state.cmTab;
      h += `<div class="seg" role="group"><button type="button" data-cmtab="h" aria-pressed="${tab === 'h'}">Message Header</button><button type="button" data-cmtab="p" aria-pressed="${tab === 'p'}">Exchange Property</button><button type="button" data-cmtab="b" aria-pressed="${tab === 'b'}">Message Body</button></div>`;
      if (tab === 'h') h += rowsUi('headers');
      else if (tab === 'p') h += rowsUi('properties');
      else h += F.select('bodyType', 'Tipo', ['Expression', 'Constant']) + F.area('body', 'Body', 6, 'code', 'Vacío = el body no cambia. Con Expression se resuelven <code>\${...}</code>.');
      break;
    }
    case 'jsonToXml': h += F.check('useNsMapping', 'Use Namespace Mapping') + F.check('addRoot', 'Add XML Root Element') + (p.addRoot ? F.text('rootName', 'Nombre del elemento raíz', 'root') : ''); break;
    case 'xmlToJson': h += F.check('useNsMapping', 'Use Namespace Mapping') + F.check('suppressRoot', 'Suppress JSON Root Element'); break;
    case 'script':
      h += F.area('script', 'Script (Groovy)', 16, 'code', 'API: message.getBody(String), setBody(), getHeaders(), getHeader(n), setHeader(n, v), getProperty(n), setProperty(n, v). También JsonSlurper, JsonOutput, println y messageLogFactory.');
      h += `<div class="btnrow"><button type="button" data-act="showjs">${state.showJs ? 'Ocultar' : 'Ver'} el JavaScript que ejecuta el simulador</button></div>`;
      if (state.showJs) { let js; try { js = groovyToJs(p.script || ''); } catch (e) { js = 'Error: ' + e.message; } h += `<pre class="code">${esc(js)}</pre>`; }
      break;
    case 'mapping':
      h += F.text('targetRoot', 'Elemento raíz destino', 'SalesOrder', '', 'mono');
      h += F.area('rules', 'Reglas (una por línea)', 8, 'code', "Formato: <code>Campo/Destino = XPath</code> o <code>Campo = 'constante'</code>. Ejemplo: <code>Cliente/Nombre = /Order/Customer/Name</code>. Para atributos: <code>/Order/Amount/@currency</code>.", 'Number = /Order/Id');
      h += `<div class="btnrow"><button type="button" data-act="automap">Mapeo automático por nombre</button></div><p class="help">Genera una regla por cada campo del body de entrada de la pestaña Probar (si es XML), con el mismo nombre en el destino. Equivale al botón de mapeo por nombres similares del editor.</p>`;
      break;
    case 'multicast': h += F.select('mode', 'Tipo', ['Parallel Multicast', 'Sequential Multicast']) + '<p class="help">Conectá una flecha por rama. Todas reciben una copia del mismo mensaje.</p>'; break;
    case 'dsWrite':
      h += F.text('dsName', 'Data Store Name', 'Mi_DataStore', '', 'mono') + F.text('entryId', 'Entry ID', 'vacío = se genera; acepta ${property.x}', '', 'mono')
        + F.check('encrypt', 'Encrypt Stored Message') + F.check('overwrite', 'Overwrite Existing Message');
      break;
    case 'pgpEncryptor':
      h += F.text('keyName', 'Encryption Key User ID', 'Nombre de la clave pública', 'Tiene que coincidir con la clave cargada en Monitor → Manage Security → PGP Keys.', 'mono');
      break;
    case 'pgpDecryptor':
      h += F.select('signatures', 'Signatures', ['Signatures Optional', 'Signatures Required', 'No Signatures']) + F.text('keyName', 'Clave privada (User ID)', 'Nombre de la clave', 'Tiene que ser el par de la clave pública con la que se encriptó.', 'mono');
      break;
    case 'processCall': {
      const lips = state.flow.nodes.filter(k => k.type === 'lipStart').map(label);
      h += lips.length ? F.select('process', 'Local Integration Process', lips) : '<p class="help">Primero agregá un Local Integration Process desde la paleta (grupo Procesos).</p>';
      break;
    }
    case 'lipStart': h += '<p class="help">El Nombre de este inicio es el nombre del Local Integration Process que vas a elegir en el Process Call.</p>'; break;
    case 'filter':
      h += F.text('xpath', 'XPath Expression', '//Item[Stock > 0]', '', 'mono') + F.select('valueType', 'Value Type', ['Nodelist', 'Node', 'String', 'Integer', 'Boolean']);
      break;
    case 'splitter':
      h += F.select('splitType', 'Tipo de splitter', ['Iterating Splitter', 'General Splitter']) + F.select('exprType', 'Expression Type', ['XPath', 'Line Break']);
      if (p.exprType !== 'Line Break') h += F.text('xpath', 'XPath Expression', '//Item', '', 'mono') + F.text('grouping', 'Grouping', '1', 'Cantidad de nodos por parte.');
      break;
    case 'gather':
      h += F.select('format', 'Incoming Format', ['XML (Same Format)', 'Plain Text']);
      if (p.format !== 'Plain Text') { h += F.select('strategy', 'Aggregation Algorithm', ['Combine', 'Combine from Source (Retain Source Elements)']); if (p.strategy !== 'Combine') h += F.text('xpath', 'XPath del nodo a conservar', '//Item', '', 'mono'); }
      else h += '<p class="help">Plain Text concatena las partes, una por línea.</p>';
      break;
    case 'router': {
      const o = outSeq(n.id);
      h += `<h3>Rutas (en orden de evaluación)</h3>${o.length ? `<ul class="routes">${o.map(e => `<li><button type="button" data-sel-edge="${e.id}"><span>${esc(e.props.name || 'Ruta')}${e.props.isDefault ? ' · default' : ''}</span><small>${esc(e.props.isDefault ? 'ruta por defecto' : (e.props.condition || 'sin condición'))}</small></button></li>`).join('')}</ul>` : '<p class="help">Conectá el Router a dos o más pasos. Después configurá cada flecha.</p>'}`;
      break;
    }
  }
  h += `<div class="danger-row"><button type="button" class="ghost danger" data-act="delete">Eliminar ${isPart(n) ? 'participante' : 'elemento'}</button></div>`;
  return h;
}
function edgeForm(e) {
  const a = byId(e.from), b = byId(e.to); state.formTarget = e.props;
  let h = '';
  if (e.kind === 'msg') {
    const dir = a.type === 'sender' ? 'sender' : 'receiver'; const opts = Object.keys(ADAPTERS[dir]);
    h += head(dir === 'sender' ? 'sender' : 'receiver', dir === 'sender' ? 'Adaptador de entrada' : 'Adaptador de salida', `${label(a)} → ${label(b)}`,
      dir === 'sender' ? 'Define cómo el sistema emisor llega al iFlow.' : 'Define cómo el iFlow llega al sistema destino. Los campos aceptan expresiones como ${header.x} o ${property.x}.', true);
    h += `<label class="fld"><span>Adapter Type</span><select id="f_adapter" data-k="adapter"><option value=""${e.props.adapter ? '' : ' selected'}>Elegí un adaptador…</option>${opts.map(o => `<option${o === e.props.adapter ? ' selected' : ''}>${o}</option>`).join('')}</select></label>`;
    const spec = ADAPTERS[dir][e.props.adapter];
    if (spec) {
      h += `<h3>Connection</h3>`;
      spec.forEach(([k, lab, x]) => {
        if (x === 'check') h += F.check(k, lab);
        else if (x.startsWith('select:')) h += F.select(k, lab, x.slice(7).split('|'));
        else h += F.text(k, lab, x, '', 'mono');
      });
      if (dir === 'sender' && e.props.adapter === 'HTTPS') h += `<p class="help">URL de prueba: https://&lt;tenant&gt;.it-cpi.cfapps.&lt;región&gt;.hana.ondemand.com/http${esc(e.props.address || '/ruta')}</p>`;
    }
  } else if (a.type === 'router') {
    h += head('router', 'Ruta del Router', e.props.name || 'Ruta', 'Las rutas se evalúan en orden. La primera condición verdadera gana; la ruta por defecto se usa si ninguna se cumple.');
    h += F.text('name', 'Route Name', 'Ruta 1') + F.check('isDefault', 'Default Route');
    if (!e.props.isDefault) {
      h += F.select('exprType', 'Expression Type', ['XML', 'Non-XML']);
      h += F.area('condition', 'Condition', 3, 'code', e.props.exprType === 'Non-XML'
        ? "Expresión Camel Simple. Ej.: <code>\${header.pais} = 'AR'</code>, <code>\${property.total} &gt; 1000</code>. Operadores: = != &gt; &lt; &gt;= &lt;= contains regex in; combiná con and / or."
        : "XPath que devuelve verdadero o falso. Ej.: <code>/Order/Country = 'AR'</code> o <code>count(//Item) &gt; 2</code>.");
    }
    h += `<p class="help">Destino: ${esc(label(b))}</p>`;
  } else {
    h += head('send', 'Sequence Flow', `${label(a)} → ${label(b)}`, 'Conexión de secuencia: el mensaje pasa de un paso al siguiente.');
  }
  h += `<div class="danger-row"><button type="button" class="ghost danger" data-act="delete">Eliminar conexión</button></div>`;
  return h;
}
function renderProp() {
  const s = state.sel;
  if (!s) {
    state.formTarget = null;
    tabProp.innerHTML = `<div class="empty"><p class="eyebrow">Propiedades</p><h2>Nada seleccionado</h2><p>Hacé clic en un elemento o en una flecha del iFlow para configurarlo.</p><ul><li>Clic en la paleta: agrega un elemento. Con una flecha seleccionada, lo inserta en ella.</li><li>Círculo azul junto al elemento seleccionado: arrastralo hasta otro para conectar.</li><li>Línea punteada naranja: conexión de mensaje con un participante. Ahí se elige el adaptador.</li><li>Supr o Retroceso: borra lo seleccionado. Si borrás un paso intermedio, sus vecinos quedan conectados.</li></ul></div>`;
    return;
  }
  if (s.kind === 'node') { const n = byId(s.id); if (!n) { state.sel = null; return renderProp(); } tabProp.innerHTML = nodeForm(n); }
  else { const e = edgeById(s.id); if (!e) { state.sel = null; return renderProp(); } tabProp.innerHTML = edgeForm(e); }
}
function onPropInput(ev) {
  const el = ev.target; const t = state.formTarget; if (!t) return;
  const isToggle = el.type === 'checkbox' || el.tagName === 'SELECT';
  if (ev.type === 'input' && isToggle) return;
  if (ev.type === 'change' && !isToggle) return;
  const val = el.type === 'checkbox' ? el.checked : el.value;
  if (el.dataset.k) {
    const k = el.dataset.k; t[k] = val;
    if (k === 'adapter') Object.entries(ADEF[val] || {}).forEach(([dk, dv]) => { if (t[dk] === undefined) t[dk] = dv; });
    if (k === 'isDefault' && val && state.sel?.kind === 'edge') { const e = edgeById(state.sel.id); state.flow.edges.filter(x => x.from === e.from && x !== e).forEach(x => { x.props.isDefault = false; }); }
    if (k === 'name') { const h = $('#propTitle'); if (h && state.sel?.kind === 'node') h.textContent = label(byId(state.sel.id)); else if (h) h.textContent = val || 'Ruta'; }
    clearSim(); save(); renderCanvas();
    if (['adapter', 'isDefault', 'exprType', 'strategy', 'splitType', 'format', 'addRoot', 'mockError'].includes(k)) renderProp();
  } else if (el.dataset.list) {
    const r = t[el.dataset.list][+el.dataset.i]; r[el.dataset.c] = val;
    clearSim(); save(); renderCanvas();
    if (el.dataset.c === 'action') renderProp();
  }
}
tabProp.addEventListener('input', onPropInput);
tabProp.addEventListener('change', onPropInput);
tabProp.addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  if (b.dataset.cmtab) { state.cmTab = b.dataset.cmtab; renderProp(); return; }
  if (b.dataset.selEdge) { setSel({ kind: 'edge', id: b.dataset.selEdge }, true); return; }
  const act = b.dataset.act;
  if (act === 'delete') deleteSel();
  else if (act === 'rowadd') { state.formTarget[b.dataset.list].push({ action: 'Create', name: '', source: 'Constant', value: '' }); save(); renderProp(); const ins = tabProp.querySelectorAll(`[data-list="${b.dataset.list}"][data-c="name"]`); ins[ins.length - 1]?.focus(); }
  else if (act === 'rowdel') { state.formTarget[b.dataset.list].splice(+b.dataset.i, 1); clearSim(); save(); renderProp(); renderCanvas(); }
  else if (act === 'showjs') { state.showJs = !state.showJs; renderProp(); }
  else if (act === 'automap') {
    let d;
    try { d = new DOMParser().parseFromString($('#simBody').value.trim(), 'application/xml'); } catch (_) { d = null; }
    if (!d || d.getElementsByTagName('parsererror').length) { toast('Cargá un body XML en la pestaña Probar para generar las reglas.'); return; }
    const root = d.documentElement, rules = [];
    const walkEl = (el, path) => {
      [...el.attributes].filter(a => !a.name.startsWith('xmlns')).forEach(a => rules.push(`${path ? path + '/' : ''}@${a.name} = /${root.nodeName}${path ? '/' + path : ''}/@${a.name}`));
      const kids = [...el.children];
      if (!kids.length && path) { rules.push(`${path} = /${root.nodeName}/${path}`); return; }
      kids.forEach(k => walkEl(k, path ? `${path}/${k.nodeName}` : k.nodeName));
    };
    walkEl(root, '');
    state.formTarget.rules = rules.join('\n'); clearSim(); save(); renderProp();
    toast(`${rules.length} reglas generadas desde <${root.nodeName}>.`);
  }
});
document.addEventListener('keydown', ev => {
  const el = ev.target;
  if (ev.key === 'Tab' && el.tagName === 'TEXTAREA' && el.classList.contains('code') && !ev.shiftKey) {
    ev.preventDefault(); const s = el.selectionStart, e = el.selectionEnd;
    el.value = el.value.slice(0, s) + '    ' + el.value.slice(e); el.selectionStart = el.selectionEnd = s + 4;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
});

/* ---------------- Panel: ejercicio ---------------- */
const tabEj = $('#tab-ej');
function inputBlock(inp) {
  const hs = Object.entries(inp.headers || {});
  return `${inp.body ? `<pre class="code">${esc(pretty(inp.body))}</pre>` : '<p class="help">Body vacío.</p>'}${hs.length ? `<p class="help">Headers: ${hs.map(([k, v]) => `<code>${esc(k)}=${esc(v)}</code>`).join(' ')}</p>` : ''}`;
}
// Orden de opciones estable por pregunta: la respuesta correcta se escribe primero en los datos
function order(q) {
  let s = 7; for (const c of q.q) s = (Math.imul(s, 31) + c.charCodeAt(0)) >>> 0;
  const idx = q.o.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; const j = (s >>> 16) % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}
function renderQuiz(ex) {
  const done = !!store.done[ex.id]; const ans = store.quiz[ex.id] || {}; const R = state.results;
  let h = `<div class="ex-head"><span class="lvl">${esc(ex.level)}</span>${done ? '<span class="pill ok">Aprobado</span>' : ''}</div><h2>${esc(ex.title)}</h2>${ex.source ? `<p class="src">Basado en: ${esc(ex.source)}</p>` : ''}<p>${esc(ex.story)}</p>`;
  if (ex.keys?.length) h += `<h3>Ideas clave</h3><ul class="reqs">${ex.keys.map(k => `<li>${esc(k)}</li>`).join('')}</ul>`;
  h += `<h3>Cuestionario (${ex.quiz.length} preguntas)</h3>`;
  const shown = state.revealed || new Set();
  ex.quiz.forEach((q, i) => {
    const graded = R && R.quiz && ans[i] != null; const ok = ans[i] === 0; const show = shown.has(i);
    h += `<div class="quiz-q${graded ? (ok ? ' ok' : ' bad') : ''}"><p class="q">${i + 1}. ${esc(q.q)}</p>${order(q).map(j => `<label class="${show && j === 0 ? 'right' : ''}"><input type="radio" name="q${i}" data-q="${i}" data-o="${j}"${ans[i] === j ? ' checked' : ''}><span>${esc(q.o[j])}</span>${show && j === 0 ? '<b class="tag">Respuesta correcta</b>' : ''}</label>`).join('')}`
      + (graded ? `<p class="why">${ok ? 'Correcto. ' : 'No es esa. '}${esc(q.why || '')}</p>` : show ? `<p class="why">${esc(q.why || '')}</p>` : '')
      + `<div class="row-foot"><button type="button" class="ghost" data-act="reveal" data-i="${i}">${show ? 'Ocultar respuesta' : 'Ver respuesta'}</button></div></div>`;
  });
  const allShown = shown.size === ex.quiz.length;
  h += `<div class="btnrow"><button type="button" class="primary" data-act="verify">Corregir</button><button type="button" data-act="revealall">${allShown ? 'Ocultar respuestas' : 'Ver todas las respuestas'}</button><button type="button" class="ghost" data-act="quizreset">Borrar respuestas</button></div>`;
  if (R && R.quiz) {
    const n = R.items.filter(i => i.ok).length;
    h += `<div class="results${R.all ? ' all' : ''}"><div class="res-head"><span>${R.all ? 'Cuestionario aprobado' : 'Revisá las marcadas en rojo'}</span><span>${n}/${R.items.length}</span></div></div>`;
    if (R.all) { const nx = EXERCISES[EXERCISES.indexOf(ex) + 1]; if (nx) h += `<div class="btnrow"><button type="button" class="primary" data-act="next">Siguiente: ${esc(nx.title)}</button></div>`; }
  }
  tabEj.innerHTML = h;
}
function renderEx() {
  const ex = EX(); const done = !!store.done[ex.id];
  if (ex.quiz) return renderQuiz(ex);
  const inp = ex.sample || ex.tests[0]?.input || { body: '', headers: {} };
  let h = `<div class="ex-head"><span class="lvl">${esc(ex.level)}</span>${done ? '<span class="pill ok">Completado</span>' : ''}</div><h2>${esc(ex.title)}</h2>${ex.source ? `<p class="src">Basado en: ${esc(ex.source)}</p>` : ''}<p>${esc(ex.story)}</p>`;
  if (ex.objectives?.length) h += `<details class="hints" style="margin:0 0 4px"><summary>Objetivos de aprendizaje (${ex.objectives.length})</summary><ul>${ex.objectives.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`;
  if (ex.reqs.length) h += `<h3>Requisitos</h3><ul class="reqs">${ex.reqs.map(r => `<li>${r}</li>`).join('')}</ul>`;
  h += `<h3>Mensaje de entrada de ejemplo</h3>${inputBlock(inp)}`;
  if (ex.mockInfo) h += `<h3>Sistemas</h3><p>${esc(ex.mockInfo)}</p>${ex.mockSample ? `<pre class="code">${esc(pretty(ex.mockSample))}</pre>` : ''}`;
  if (ex.hints.length) h += `<details class="hints"><summary>Pistas (${ex.hints.length})</summary><ul>${ex.hints.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`;
  if (ex.realSteps?.length) h += `<details class="hints"><summary>En el tenant real (fuera del simulador)</summary><ul class="real">${ex.realSteps.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`;
  if (ex.tests.length) h += `<div class="btnrow"><button type="button" class="primary" data-act="verify">Verificar ejercicio</button><button type="button" data-act="goTest">Probar paso a paso</button></div>`;
  const R = state.results;
  if (R && R.free) h += '<p class="help">El modo libre no tiene comprobaciones. Usá la pestaña Probar para ejecutar tu iFlow.</p>';
  else if (R) {
    const ok = R.items.filter(i => i.ok).length;
    h += `<div class="results${R.all ? ' all' : ''}"><div class="res-head"><span>${R.all ? 'Ejercicio resuelto' : 'Todavía falta'}</span><span>${ok}/${R.items.length}</span></div><ul>${R.items.map(i => `<li class="${i.ok ? 'ok' : 'bad'}"><span class="mark">${i.ok ? '✓' : '✗'}</span><div>${esc(i.label)}${!i.ok && i.detail ? `<small>${esc(i.detail)}</small>` : ''}</div></li>`).join('')}</ul></div>`;
    if (R.all) { const nx = EXERCISES[EXERCISES.indexOf(ex) + 1]; if (nx) h += `<div class="btnrow"><button type="button" class="primary" data-act="next">Siguiente: ${esc(nx.title)}</button></div>`; }
  }
  if (state.confirm) {
    const sol = state.confirm === 'sol';
    h += `<div class="confirm"><p>${sol ? 'Esto reemplaza tu iFlow actual por la solución.' : 'Esto borra tu iFlow y vuelve a la plantilla inicial.'}</p><div class="btnrow" style="margin:0"><button type="button" class="primary" data-act="${sol ? 'solok' : 'resetok'}">${sol ? 'Cargar solución' : 'Reiniciar'}</button><button type="button" data-act="cancel">Cancelar</button></div></div>`;
  } else {
    h += `<div class="btnrow">${ex.solution ? '<button type="button" class="ghost" data-act="sol">Ver solución</button>' : ''}<button type="button" class="ghost" data-act="reset">Reiniciar ejercicio</button></div>`;
  }
  h += '<p class="note">Práctica independiente para aprender a modelar iFlows. Simula el comportamiento de Cloud Integration de forma simplificada; no se conecta a ningún tenant de SAP. Proyecto educativo independiente, sin afiliación con SAP SE. SAP y SAP Integration Suite son marcas de SAP SE. Los nombres de empresas, hosts y datos son ficticios.</p>';
  tabEj.innerHTML = h;
}
tabEj.addEventListener('click', ev => {
  const b = ev.target.closest('button[data-act]'); if (!b) return;
  const act = b.dataset.act, ex = EX();
  if (act === 'verify') verify();
  else if (act === 'goTest') { state.tab = 'test'; renderTabs(); }
  else if (act === 'sol' || act === 'reset') { state.confirm = act; renderEx(); }
  else if (act === 'cancel') { state.confirm = null; renderEx(); }
  else if (act === 'solok') { state.flow = ex.solution(); state.confirm = null; state.results = null; state.sim = null; state.sel = null; save(); renderAll(); fitZoom(); toast('Solución cargada. Revisala elemento por elemento.'); }
  else if (act === 'resetok') { state.flow = makeTemplate(ex.template); state.confirm = null; state.results = null; state.sim = null; state.sel = null; save(); renderAll(); fitZoom(); toast('Ejercicio reiniciado.'); }
  else if (act === 'next') { const nx = EXERCISES[EXERCISES.indexOf(ex) + 1]; if (nx) loadExercise(nx.id); }
  else if (act === 'quizreset') { store.quiz[ex.id] = {}; state.results = null; state.revealed = new Set(); save(); renderEx(); }
  else if (act === 'reveal') { const s = state.revealed ||= new Set(); const i = +b.dataset.i; s.has(i) ? s.delete(i) : s.add(i); renderEx(); }
  else if (act === 'revealall') { state.revealed = state.revealed?.size === ex.quiz.length ? new Set() : new Set(ex.quiz.map((_, i) => i)); renderEx(); }
});
tabEj.addEventListener('change', ev => {
  const el = ev.target; if (!el.dataset.q) return;
  const ex = EX(); (store.quiz[ex.id] ||= {})[+el.dataset.q] = +el.dataset.o;
  if (state.results?.quiz) { state.results = null; renderEx(); }
  save();
});

/* ---------------- Panel: probar ---------------- */
const simOut = $('#simOut');
function pretty(s) {
  const t = String(s ?? ''); const tt = t.trim(); if (!tt) return '';
  if (tt[0] === '{' || tt[0] === '[') { try { return JSON.stringify(JSON.parse(tt), null, 2); } catch (_) {} }
  if (tt[0] === '<') { try { return fmtXml(tt); } catch (_) {} }
  return t;
}
function fmtXml(x) {
  const toks = x.replace(/>\s+</g, '><').match(/<[^>]+>|[^<]+/g) || [];
  let out = '', depth = 0;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i]; const pad = '  '.repeat(Math.max(depth, 0));
    if (t.startsWith('</')) { depth--; out += '  '.repeat(Math.max(depth, 0)) + t + '\n'; }
    else if (t.startsWith('<?') || t.startsWith('<!') || t.endsWith('/>')) out += pad + t + '\n';
    else if (t.startsWith('<')) {
      if (toks[i + 1] && !toks[i + 1].startsWith('<') && toks[i + 2] && toks[i + 2].startsWith('</')) { out += pad + t + toks[i + 1] + toks[i + 2] + '\n'; i += 2; }
      else { out += pad + t + '\n'; depth++; }
    } else out += pad + t.trim() + '\n';
  }
  return out.trimEnd();
}
const kvTable = o => { const e = Object.entries(o || {}); return e.length ? `<table class="kv">${e.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>` : '<p class="help">(ninguno)</p>'; };
function issuesHtml(list) {
  if (!list) return '';
  if (!list.length) return '<h3>Check</h3><p class="okline">Sin errores de modelado.</p>';
  return `<h3>Check</h3><ul class="issues">${list.map(i => `<li class="${i.level}" data-ref="${i.ref || ''}"><b>${i.level === 'error' ? 'Error' : 'Aviso'}</b><span>${esc(i.msg)}</span></li>`).join('')}</ul>`;
}
function renderSimOut() {
  let h = issuesHtml(state.issues);
  const r = state.simResult;
  if (r) {
    h += `<h3>Resultado</h3><p><span class="status ${r.status === 'COMPLETED' ? 'ok' : 'bad'}">${r.status === 'COMPLETED' ? 'Completed' : 'Failed'}</span>${r.handled ? ' <span class="muted">· error manejado en el Exception Subprocess</span>' : ''}</p>`;
    if (r.error) h += `<div class="errbox">${esc(r.error)}</div>`;
    const toSender = !r.deliveries.some(d => d.via === 'end');
    h += `<h3>${toSender ? 'Respuesta al emisor' : 'Body final'}</h3>${r.body ? `<pre class="code">${esc(pretty(r.body))}</pre>` : '<p class="help">(body vacío)</p>'}`;
    h += `<details class="hints" style="margin-top:0"><summary>Headers finales</summary>${kvTable(r.headers)}</details>`;
    if (r.deliveries.length) {
      h += `<h3>Llamadas a receptores (${r.deliveries.length})</h3>` + r.deliveries.map(d => {
        const props = Object.entries(d.props).filter(([k, v]) => k !== 'adapter' && v !== '' && v !== false && v != null);
        return `<div class="dlv"><div class="dlv-h">→ ${esc(d.receiver)} <span>${esc(d.adapter)} · ${d.via === 'requestReply' ? 'Request Reply' : d.via === 'send' ? 'Send' : 'End Message'}${d.part ? ' · ' + esc(d.part) : ''}</span></div>${props.length ? `<dl>${props.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}<details><summary>Body enviado</summary><pre class="code">${esc(pretty(d.body)) || '(vacío)'}</pre></details>${d.response != null ? `<details><summary>Respuesta recibida</summary><pre class="code">${esc(pretty(d.response))}</pre></details>` : ''}</div>`;
      }).join('');
    }
    if (r.dataStores && r.dataStores.length) {
      h += `<h3>Data Stores (${r.dataStores.length} entradas)</h3>` + r.dataStores.map(d => `<div class="dlv ds"><div class="dlv-h">${esc(d.name)} <span>Entry ID ${esc(d.id)}${d.encrypted ? ' · encriptado' : ''}${d.part ? ' · ' + esc(d.part) : ''}</span></div><details><summary>body</summary><pre class="code">${esc(pretty(d.body)) || '(vacío)'}</pre></details></div>`).join('');
    }
    h += `<h3>Trace (${r.trace.length} pasos)</h3>` + r.trace.map((s, i) => `<details class="step${s.error ? ' err' : ''}"><summary><span class="n">${i + 1}</span><span><span class="t">${esc(s.label)}</span> ${s.part ? `<span class="part">${esc(s.part)}</span>` : ''}<span class="s">${esc(s.error || s.note || '')}</span></span></summary><div class="inner"><h5>Headers</h5>${kvTable(s.headers)}<h5>Exchange properties</h5>${kvTable(s.props)}<h5>Body</h5><pre class="code">${esc(pretty(s.body)) || '(vacío)'}</pre></div></details>`).join('');
  } else if (!state.issues) {
    h += '<p class="help">Ejecutá el iFlow para ver el resultado, las llamadas a cada sistema y el trace paso a paso con headers, properties y body.</p>';
  }
  simOut.innerHTML = h;
}
function parseHeaders(t) {
  const o = {};
  String(t).split('\n').forEach(l => { const m = l.match(/^\s*([^=:\s][^=:]*?)\s*[=:]\s*(.*)$/); if (m) o[m[1]] = m[2].trim(); });
  return o;
}
function loadSample() {
  const ex = EX(); const inp = ex.sample || ex.tests[0]?.input || { body: '', headers: {} };
  $('#simBody').value = pretty(inp.body);
  $('#simHeaders').value = Object.entries(inp.headers || {}).map(([k, v]) => `${k}=${v}`).join('\n');
}
function runCheck() { state.issues = checkFlow(state.flow); state.simResult = null; state.tab = 'test'; renderTabs(); renderSimOut(); }
function runSim() {
  state.issues = checkFlow(state.flow);
  const errs = state.issues.filter(i => i.level === 'error');
  state.tab = 'test'; renderTabs();
  if (errs.length) { state.simResult = null; state.sim = null; renderSimOut(); renderCanvas(); toast('Corregí los errores del Check antes de ejecutar.'); return; }
  const r = simulate(clone(state.flow), { body: $('#simBody').value, headers: parseHeaders($('#simHeaders').value) }, EX().mocks);
  state.simResult = r; state.sim = { visited: new Set(r.trace.map(s => s.id)), failed: r.failedId };
  renderSimOut(); renderCanvas();
}
$('#tab-test').addEventListener('click', ev => {
  const b = ev.target.closest('button[data-act]');
  if (b) { if (b.dataset.act === 'run') runSim(); else if (b.dataset.act === 'sample') loadSample(); return; }
  const li = ev.target.closest('.issues li[data-ref]');
  if (li && li.dataset.ref) { const ref = li.dataset.ref; setSel(byId(ref) ? { kind: 'node', id: ref } : { kind: 'edge', id: ref }, true); }
});

/* ---------------- Encabezado y carga ---------------- */
const exSel = $('#exSelect');
function renderHeader() {
  const groups = [...new Set(EXERCISES.map(e => e.group))];
  exSel.innerHTML = groups.map(g => `<optgroup label="${esc(g)}">${EXERCISES.filter(e => e.group === g).map(e => `<option value="${e.id}"${e.id === state.ex ? ' selected' : ''}>${store.done[e.id] ? '✓ ' : ''}${esc(e.short || e.title)}</option>`).join('')}</optgroup>`).join('');
  const graded = e => e.tests.length || e.quiz;
  const total = EXERCISES.filter(graded).length, done = EXERCISES.filter(e => graded(e) && store.done[e.id]).length;
  const pr = $('#progress'); pr.textContent = `${done}/${total} completados`; pr.classList.toggle('ok', done === total);
}
exSel.addEventListener('change', () => loadExercise(exSel.value));
$('#btnCheck').addEventListener('click', runCheck);
$('#btnRun').addEventListener('click', runSim);
$('#btnVerify').addEventListener('click', verify);
let toastTimer = null;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3200); }
function renderAll() { renderHeader(); renderTabs(); renderEx(); renderProp(); renderSimOut(); renderCanvas(); }
function loadExercise(id) {
  const ex = EXERCISES.find(e => e.id === id) || EXERCISES[0];
  state.ex = ex.id;
  state.flow = store.flows[ex.id] ? clone(store.flows[ex.id]) : makeTemplate(ex.template);
  Object.assign(state, { sel: null, results: null, sim: null, simResult: null, issues: null, confirm: null, tab: 'ej', revealed: new Set() });
  $('.app').classList.toggle('quiz', !!ex.quiz);
  loadSample(); save(); renderAll(); if (!ex.quiz) fitZoom();
  wrapEl.scrollTo(0, 0);
}
loadExercise(store.last);
})();
