(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const clone = o => JSON.parse(JSON.stringify(o));
const short = (s, n = 80) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n) + '…' : s; };

/* ---------------- Íconos ---------------- */
const IC = {
  file: '<path d="M7 3.5h7l4 4V20a.5.5 0 01-.5.5h-10.5a.5.5 0 01-.5-.5V4a.5.5 0 01.5-.5z"/><path d="M14 3.5V8h4"/>',
  md: '<path d="M7 3.5h7l4 4V20a.5.5 0 01-.5.5h-10.5a.5.5 0 01-.5-.5V4a.5.5 0 01.5-.5z"/><path d="M14 3.5V8h4M9 12h6M9 15.5h6"/>',
  json: '<path d="M9 4C7 4 7 5.5 7 7.5S6 11 4.5 12C6 13 7 14.5 7 16.5S7 20 9 20M15 4c2 0 2 1.5 2 3.5S18 11 19.5 12C18 13 17 14.5 17 16.5S17 20 15 20"/>',
  sh: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M7.5 9.5l3 2.5-3 2.5M12.5 15h4"/>',
  yml: '<path d="M6 5h12M9 9.5h9M9 14h9M6 18.5h12"/>',
  terminal: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M7.5 9.5l3 2.5-3 2.5M12.5 15h4"/>',
  shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  hook: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  agent: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
  skill: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  plug: '<path d="M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 01-11 0zM12 16.5V21"/>',
  slash: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M14.5 7.5l-5 9"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
  approval: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  router: '<path d="M4 12h5M9 12l6-7h5M9 12h11M9 12l6 7h5"/>',
  csv: '<path d="M7 3.5h7l4 4V20a.5.5 0 01-.5.5h-10.5a.5.5 0 01-.5-.5V4a.5.5 0 01.5-.5z"/><path d="M14 3.5V8h4M8.5 13h7M8.5 16.5h7"/>',
  task: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>',
  arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  down: '<path d="M7 7l10 10M17 9v8H9"/>',
};
const svg = (k, cls = '') => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${IC[k] || IC.arrow}</svg>`;

/* Teoría: 8 clases, cada una con su cuestionario (la opción correcta va primero) */
const CLASSES = [
  ['Qué es una API y cómo se conectan los sistemas', [
    '<p>Una <b>API</b> (Application Programming Interface) es la puerta que un sistema abre para que otros le pidan datos o le encarguen acciones, sin entrar a su base de datos ni a su pantalla.</p>',
    '<p>Toda conexión tiene dos partes: un <b>cliente</b> que hace un pedido (request) y un <b>servidor</b> que responde (response). Cuando Power Automate llama a un ERP, Power Automate es el cliente; cuando el ERP le avisa algo a SAP CPI, el ERP es el cliente.</p>',
    '<ul><li><b>Sincrónica</b>: el cliente espera la respuesta (consultar el stock de un producto).</li><li><b>Asincrónica</b>: el cliente deja el mensaje y sigue (un evento en una cola, un archivo en un SFTP).</li></ul>',
    '<p>Para conectarse hay que saber cuatro cosas: <b>dónde</b> está la API (URL), <b>qué</b> se pide (método y recurso), <b>cómo</b> se demuestra quién sos (autenticación) y <b>en qué formato</b> viajan los datos (JSON, XML…). Eso es lo que vas a practicar en este curso.</p>'
  ], [
    ['¿Qué es una API?', ['La puerta que un sistema abre para que otros le pidan datos o acciones', 'Una base de datos', 'Un lenguaje de programación', 'Una pantalla de usuario'], 'Los otros sistemas no entran a la base de datos: piden a través de la API.'],
    ['En una conexión, ¿quién hace el pedido?', ['El cliente', 'El servidor', 'La base de datos', 'Nadie'], 'El servidor recibe el pedido y responde.'],
    ['¿Qué caracteriza a una conexión sincrónica?', ['El cliente espera la respuesta', 'El mensaje queda en una cola', 'No hay respuesta nunca', 'Solo funciona de noche'], 'En la asincrónica el cliente deja el mensaje y sigue.'],
    ['¿Qué hay que saber para conectarse a una API?', ['URL, método y recurso, autenticación y formato de datos', 'Solo la URL', 'El color de la pantalla', 'La contraseña de la base de datos'], 'Son las cuatro preguntas de cualquier integración.'],
  ]],
  ['HTTP: el idioma de las APIs', [
    '<p>La mayoría de las APIs usan <b>HTTP</b>. Un pedido HTTP tiene:</p>',
    '<ul><li><b>Método</b>: qué querés hacer. <code>GET</code> lee, <code>POST</code> crea, <code>PUT</code> reemplaza, <code>PATCH</code> modifica una parte, <code>DELETE</code> borra.</li><li><b>URL</b>: dónde está el recurso, por ejemplo <code>https://api.andina-demo.example/v1/productos/101</code>.</li><li><b>Headers</b>: datos sobre el pedido, como <code>Content-Type</code> (formato de lo que mandás), <code>Accept</code> (formato que querés recibir) y <code>Authorization</code> (quién sos).</li><li><b>Body</b>: los datos que enviás, en POST, PUT y PATCH.</li></ul>',
    '<pre>POST /v1/pedidos HTTP/1.1\nHost: api.andina-demo.example\nContent-Type: application/json\nAuthorization: Bearer abc123\n\n{ "cliente": "C-01", "items": [ { "productoId": 101, "cantidad": 3 } ] }</pre>',
    '<p>La respuesta trae un <b>código de estado</b>, sus propios headers y un body con los datos.</p>'
  ], [
    ['¿Qué método se usa para leer datos?', ['GET', 'POST', 'DELETE', 'PATCH'], 'GET no modifica nada en el servidor.'],
    ['¿Qué header indica el formato de lo que enviás?', ['Content-Type', 'Accept', 'Authorization', 'Host'], 'Accept indica el formato que querés recibir.'],
    ['¿Qué diferencia hay entre PUT y PATCH?', ['PUT reemplaza el recurso completo; PATCH modifica una parte', 'Son iguales', 'PATCH borra', 'PUT solo lee'], 'Para cambiar un campo, PATCH.'],
    ['¿Dónde van los datos que enviás en un POST?', ['En el body', 'En el método', 'En el código de estado', 'En el nombre del servidor'], 'Los headers describen el pedido; el body lleva los datos.'],
  ]],
  ['Códigos de estado', [
    '<p>El código de estado dice cómo salió el pedido. Se agrupan por centenas:</p>',
    '<ul><li><b>2xx, éxito</b>: <code>200 OK</code>, <code>201 Created</code> (se creó algo), <code>204 No Content</code> (salió bien y no hay body).</li><li><b>4xx, error del cliente</b>: <code>400 Bad Request</code> (datos mal armados), <code>401 Unauthorized</code> (falta autenticarse o la credencial no sirve), <code>403 Forbidden</code> (te reconoce pero no tenés permiso), <code>404 Not Found</code> (no existe), <code>415 Unsupported Media Type</code> (formato que no acepta), <code>429 Too Many Requests</code> (demasiados pedidos).</li><li><b>5xx, error del servidor</b>: <code>500 Internal Server Error</code>, <code>503 Service Unavailable</code>.</li></ul>',
    '<p>Regla práctica: con un 4xx hay que corregir el pedido; con un 5xx o un 429 conviene <b>reintentar</b> más tarde. Así se configuran las retry policy de Power Automate y el manejo de errores en CPI.</p>'
  ], [
    ['¿Qué significa 201?', ['Que se creó un recurso', 'Que no existe', 'Que falta autenticarse', 'Que el servidor falló'], 'Es la respuesta típica de un POST exitoso.'],
    ['¿Qué diferencia hay entre 401 y 403?', ['401: falta autenticarse o la credencial no sirve; 403: estás autenticado pero sin permiso', 'Son iguales', '403 es éxito', '401 es error del servidor'], 'Con 401 se revisan credenciales; con 403, permisos.'],
    ['Recibís un 503. ¿Qué conviene hacer?', ['Reintentar más tarde', 'Cambiar el body', 'Borrar el recurso', 'Nada, salió bien'], 'Los 5xx suelen ser pasajeros.'],
    ['¿Qué indica un 4xx?', ['Que el pedido tiene un error y hay que corregirlo', 'Que todo salió bien', 'Que el servidor está caído', 'Que hay que esperar'], 'Reintentar el mismo pedido no lo arregla.'],
  ]],
  ['JSON', [
    '<p><b>JSON</b> es el formato más usado en las APIs modernas. Tiene dos estructuras: <b>objetos</b> entre llaves, con pares <code>"clave": valor</code>, y <b>listas</b> entre corchetes.</p>',
    '<pre>{\n  "id": 101,\n  "nombre": "Yerba Andina 1 kg",\n  "precio": 3200.5,\n  "activo": true,\n  "categoria": null,\n  "tags": ["yerba", "almacén"],\n  "proveedor": { "id": "PR-7", "pais": "AR" }\n}</pre>',
    '<ul><li>Tipos de valor: texto entre comillas dobles, número, <code>true</code>/<code>false</code>, <code>null</code>, objeto y lista.</li><li>Las claves van siempre entre comillas dobles. No se permiten comas al final ni comentarios.</li><li>Para leer un dato se recorre la ruta: <code>proveedor.pais</code> vale <code>"AR"</code>; <code>tags[0]</code> vale <code>"yerba"</code>.</li></ul>',
    '<p>Así se leen los datos en cada herramienta: <code>body(\'HTTP\')?[\'proveedor\']?[\'pais\']</code> en Power Automate, <code>$.proveedor.pais</code> en JSONPath, o convertido a XML en SAP CPI.</p>'
  ], [
    ['¿Cómo se escribe una lista en JSON?', ['Entre corchetes: ["a", "b"]', 'Entre llaves: {"a", "b"}', 'Entre paréntesis', 'Separada por punto y coma'], 'Los objetos van entre llaves.'],
    ['¿Qué está mal en {nombre: "Ana"}?', ['La clave tiene que ir entre comillas dobles', 'Nada', 'Falta un punto y coma', 'Las llaves'], 'JSON válido: {"nombre": "Ana"}.'],
    ['En el ejemplo, ¿qué vale tags[0]?', ['"yerba"', '"almacén"', '101', 'null'], 'Las listas empiezan en la posición 0.'],
    ['¿Cuál de estos NO es un tipo de valor de JSON?', ['Fecha', 'Número', 'Booleano', 'null'], 'Las fechas viajan como texto, por ejemplo "2026-11-26".'],
  ]],
  ['XML y otros formatos', [
    '<p><b>XML</b> organiza los datos con etiquetas de apertura y cierre. Domina en SAP (IDoc, SOAP, BAPI) y en sistemas más antiguos.</p>',
    '<pre>&lt;Cliente xmlns="urn:andina:clientes" id="C-01"&gt;\n  &lt;Nombre&gt;Almacén Sur&lt;/Nombre&gt;\n  &lt;Pais&gt;AR&lt;/Pais&gt;\n&lt;/Cliente&gt;</pre>',
    '<ul><li><b>Atributos</b> dentro de la etiqueta (<code>id="C-01"</code>) y <b>elementos</b> anidados.</li><li>Los <b>namespaces</b> (<code>xmlns</code>) identifican el vocabulario; si no se tienen en cuenta, un XPath devuelve vacío.</li><li>Se recorre con <b>XPath</b>: <code>/Cliente/Nombre</code>.</li></ul>',
    '<p>Otros formatos frecuentes:</p>',
    '<ul><li><b>CSV</b>: tabla en texto, un registro por línea y columnas separadas por comas o punto y coma.</li><li><b>Form URL-encoded</b>: <code>clave=valor&amp;otra=valor</code>, típico al pedir tokens de OAuth.</li><li><b>Archivos planos de ancho fijo</b>, todavía comunes en bancos.</li></ul>',
    '<p>El header <code>Accept</code> pide un formato (<code>application/json</code>, <code>application/xml</code>) y <code>Content-Type</code> declara el que mandás.</p>'
  ], [
    ['¿En qué sistemas domina XML?', ['SAP (IDoc, SOAP, BAPI) y sistemas más antiguos', 'Solo en redes sociales', 'En ninguno', 'Solo en Excel'], 'JSON domina en las APIs REST modernas.'],
    ['¿Para qué sirve el namespace en XML?', ['Identifica el vocabulario de las etiquetas', 'Comprime el archivo', 'Encripta los datos', 'Nada'], 'Si se ignora, el XPath devuelve vacío.'],
    ['¿Qué header pide recibir XML?', ['Accept: application/xml', 'Content-Type: application/xml', 'Authorization: XML', 'Host: xml'], 'Content-Type declara lo que enviás.'],
    ['¿Qué formato se usa típicamente para pedir un token de OAuth?', ['Form URL-encoded (clave=valor&otra=valor)', 'CSV', 'XML siempre', 'Una imagen'], 'Es el formato del endpoint de token.'],
  ]],
  ['REST: recursos, parámetros y paginación', [
    '<p>Una API <b>REST</b> organiza todo en <b>recursos</b> con URLs claras, y usa los métodos HTTP para operar sobre ellos:</p>',
    '<pre>GET    /v1/productos           lista\nGET    /v1/productos/101       uno\nPOST   /v1/pedidos             crea\nPATCH  /v1/pedidos/P-1001      modifica\nDELETE /v1/pedidos/P-1001      borra</pre>',
    '<ul><li><b>Parámetros de ruta</b>: identifican un recurso (<code>/productos/101</code>).</li><li><b>Parámetros de consulta</b> (query): filtran u ordenan, después del <code>?</code> y separados por <code>&amp;</code>: <code>/productos?categoria=yerba&amp;limit=2</code>.</li><li><b>Paginación</b>: las listas grandes se piden por partes con <code>limit</code> y <code>offset</code> o con un enlace a la página siguiente.</li><li>REST es <b>stateless</b>: cada pedido lleva todo lo necesario, incluida la autenticación.</li></ul>',
    '<p><b>OData</b>, muy usado por SAP, es REST con reglas fijas para consultar: <code>$filter</code>, <code>$select</code>, <code>$top</code>.</p>'
  ], [
    ['¿Para qué sirven los parámetros de consulta?', ['Para filtrar u ordenar resultados', 'Para autenticarse siempre', 'Para borrar datos', 'Para elegir el método'], 'Van después del ? de la URL.'],
    ['¿Cómo se separan varios parámetros de consulta?', ['Con &', 'Con ;', 'Con espacios', 'Con /'], '?categoria=yerba&limit=2.'],
    ['¿Qué significa que REST sea stateless?', ['Cada pedido lleva todo lo necesario, incluida la autenticación', 'Que no guarda datos nunca', 'Que no tiene estados de error', 'Que solo usa GET'], 'El servidor no recuerda pedidos anteriores.'],
    ['¿Qué estándar de SAP usa $filter y $top?', ['OData', 'SOAP', 'CSV', 'FTP'], 'Es REST con reglas de consulta fijas.'],
  ]],
  ['Autenticación', [
    '<p>Toda API seria pide que demuestres quién sos. Las formas más comunes:</p>',
    '<ul><li><b>API key</b>: una clave fija en un header (<code>x-api-key: …</code>) o, peor, en la URL.</li><li><b>Basic</b>: usuario y contraseña codificados en Base64: <code>Authorization: Basic dXN1YXJpbzpjbGF2ZQ==</code>. Base64 no es cifrado: solo sirve sobre HTTPS.</li><li><b>Bearer token</b>: <code>Authorization: Bearer &lt;token&gt;</code>. El token vence y se renueva.</li><li><b>OAuth 2.0 client credentials</b>: el sistema pide un token al servidor de autorización con su <code>client_id</code> y <code>client_secret</code>, y después lo usa como Bearer. Es el estándar entre sistemas (SAP BTP, Microsoft, Salesforce).</li><li><b>Certificados (mTLS)</b>: las dos partes se identifican con certificados.</li></ul>',
    '<pre>POST /oauth/token\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=client_credentials&amp;client_id=…&amp;client_secret=…</pre>',
    '<p>Las credenciales nunca van en el código ni en la URL: se guardan en un lugar seguro (Security Material en CPI, conexiones en Power Automate, secrets en GitHub).</p>'
  ], [
    ['¿Cómo se envía un token Bearer?', ['En el header Authorization: Bearer <token>', 'En la URL', 'En el body siempre', 'En el nombre del archivo'], 'Es la forma estándar.'],
    ['¿Base64 cifra la contraseña en Basic?', ['No: solo la codifica, por eso se usa sobre HTTPS', 'Sí, es seguro sin HTTPS', 'La borra', 'La convierte en token'], 'Cualquiera puede decodificarla.'],
    ['¿Qué datos usa OAuth client credentials para pedir el token?', ['client_id y client_secret', 'Solo el email', 'Un código por SMS', 'Ninguno'], 'El token se usa después como Bearer.'],
    ['¿Dónde no deben ir las credenciales?', ['En el código ni en la URL', 'En un gestor de secretos', 'En las conexiones de la herramienta', 'En el Security Material de CPI'], 'Quedarían expuestas.'],
  ]],
  ['Otros tipos de conexión', [
    '<p>No todo es REST. En una empresa vas a encontrar:</p>',
    '<ul><li><b>SOAP</b>: servicios con contrato <b>WSDL</b> y mensajes XML en un sobre (envelope). Común en SAP y bancos.</li><li><b>Webhooks</b>: en lugar de preguntar cada tanto (polling), el sistema origen <b>avisa</b> llamando a una URL tuya cuando pasa algo.</li><li><b>Archivos por SFTP</b>: un sistema deja un archivo (CSV, XML) en un servidor y otro lo recoge.</li><li><b>Colas y eventos</b> (Event Mesh, Kafka, AMQP): el emisor publica y los suscriptores reciben, aunque estén caídos un rato.</li><li><b>Conectores</b>: piezas ya armadas que esconden la API (los conectores de Power Automate, los adaptadores de CPI, los servidores MCP de Claude Code).</li></ul>',
    '<p>En los talleres de flowDev vas a ver estas conexiones: el adaptador HTTPS y SFTP de SAP CPI, la acción HTTP y los conectores de Power Automate, y los servidores MCP de Claude Code. Todos se basan en lo que viste en este curso.</p>'
  ], [
    ['¿Qué describe el contrato de un servicio SOAP?', ['El WSDL', 'El CSV', 'Un webhook', 'El token'], 'Los mensajes viajan en XML.'],
    ['¿Qué diferencia a un webhook del polling?', ['El webhook avisa cuando pasa algo; el polling pregunta cada tanto', 'Son iguales', 'El polling es más rápido siempre', 'El webhook usa SFTP'], 'Ahorra pedidos innecesarios.'],
    ['¿Qué ventaja tiene una cola de mensajes?', ['El mensaje llega aunque el destino esté caído un rato', 'Es más lenta', 'No necesita formato', 'Reemplaza la autenticación'], 'Desacopla emisor y receptor.'],
    ['¿Qué tienen en común los conectores de Power Automate, los adaptadores de CPI y los servidores MCP?', ['Esconden una API detrás de una pieza ya armada', 'Son el mismo producto', 'No usan HTTP nunca', 'Solo funcionan con Excel'], 'Por dentro, igual hacen pedidos a una API.'],
  ]],
];

const P = {
  api: {
    name: 'Conexiones y APIs', tone: 'sky', flow: 'pedido', node: 'pedido', run: 'Enviar',
    tag: 'Curso base · HTTP, JSON, XML y autenticación',
    intro: 'Todos los talleres de flowDev conectan sistemas: SAP CPI, Power Automate y Claude Code llaman APIs, leen JSON y XML y se autentican. Este curso corto explica cómo funciona una conexión y te deja practicar con la API de una empresa ficticia: armás el pedido HTTP, lo enviás y leés la respuesta.',
    lessons: CLASSES.map(c => [c[0], c[1]]),
    quizzes: CLASSES.map((c, i) => ({ id: 'c' + (i + 1), cls: `Clase ${i + 1}`, title: c[0], qs: c[2] })),
  },
};

/* ---------------- API de práctica: Distribuidora Andina (simulada en el navegador) ---------------- */
const BASE_URL = 'https://api.andina-demo.example/v1';
const API_KEY = 'key-andina-123', CLIENT_ID = 'flowdev-app', CLIENT_SECRET = 's3cr3t-demo', TOKEN = 'tk-andina-7f3a';
const PRODUCTOS = [
  { id: 101, nombre: 'Yerba Andina 1 kg', categoria: 'yerba', precio: 3200, stock: 40, proveedor: { nombre: 'Molino Andino', pais: 'AR' } },
  { id: 102, nombre: 'Yerba Andina 500 g', categoria: 'yerba', precio: 1700, stock: 0, proveedor: { nombre: 'Molino Andino', pais: 'AR' } },
  { id: 103, nombre: 'Mate de calabaza', categoria: 'bazar', precio: 5400, stock: 12, proveedor: { nombre: 'Artesanías del Sur', pais: 'AR' } },
  { id: 104, nombre: 'Bombilla de acero', categoria: 'bazar', precio: 2100, stock: 30, proveedor: { nombre: 'Metalúrgica Paraná', pais: 'AR' } },
  { id: 105, nombre: 'Yerba Andina Compuesta 1 kg', categoria: 'yerba', precio: 3500, stock: 18, proveedor: { nombre: 'Molino Andino', pais: 'AR' } },
];
const CLIENTES = { 'C-01': { nombre: 'Almacén Sur', ciudad: 'Rosario', pais: 'AR' }, 'C-02': { nombre: 'Kiosco Norte', ciudad: 'Córdoba', pais: 'AR' } };
const PEDIDOS = { 'P-1001': { id: 'P-1001', cliente: 'C-01', estado: 'en preparación', items: [{ productoId: 101, cantidad: 2 }], total: 6400 } };
const ESTADOS = ['en preparación', 'enviado', 'cancelado'];
const DOCS = [
  ['GET', '/productos', 'Lista de productos. Query: categoria, limit, offset.', 'Pública'],
  ['GET', '/productos/{id}', 'Un producto por id.', 'Pública'],
  ['GET', '/clientes/{id}', 'Un cliente. Responde JSON o XML según el header Accept.', 'Header x-api-key: ' + API_KEY],
  ['POST', '/oauth/token', 'Pide un token. Body form URL-encoded: grant_type=client_credentials, client_id, client_secret.', `client_id ${CLIENT_ID} · client_secret ${CLIENT_SECRET}`],
  ['GET', '/pedidos/{id}', 'Un pedido por id (existe P-1001).', 'Bearer token'],
  ['POST', '/pedidos', 'Crea un pedido. Body JSON: { "cliente": "C-01", "items": [ { "productoId": 101, "cantidad": 1 } ] }.', 'Bearer token'],
  ['PATCH', '/pedidos/{id}', 'Cambia el estado. Body JSON: { "estado": "en preparación" | "enviado" | "cancelado" }.', 'Bearer token'],
];
const hdr = (req, n) => { const h = (req.headers || []).find(x => x.name.trim().toLowerCase() === n.toLowerCase()); return h ? h.value.trim() : ''; };
const jres = (status, obj, extra = {}) => ({ status, type: 'application/json', body: JSON.stringify(obj, null, 2), ...extra });
const xmlEsc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STATUS = { 200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed', 415: 'Unsupported Media Type' };
// Responde un pedido HTTP como lo haría la API real. No guarda cambios: cada pedido se evalúa sobre los mismos datos.
function api(req) {
  const method = String(req.method || 'GET').toUpperCase();
  let u; try { u = new URL(String(req.url || '').trim()); } catch (_) { return { status: 0, error: 'La URL no es válida. Tiene que empezar con https://' }; }
  if (u.origin + '/v1' !== BASE_URL || !u.pathname.startsWith('/v1/')) return { status: 0, error: `No se pudo conectar con ${u.host}. La API de práctica está en ${BASE_URL}` };
  const path = u.pathname.slice(3).replace(/\/+$/, ''), q = u.searchParams, seg = path.split('/').filter(Boolean);
  const bearer = () => { const a = hdr(req, 'Authorization'); if (!a) return jres(401, { error: 'Falta el header Authorization.' }); if (!/^Bearer\s+/i.test(a)) return jres(401, { error: 'Authorization tiene que ser: Bearer <token>.' }); if (a.replace(/^Bearer\s+/i, '') !== TOKEN) return jres(401, { error: 'El token no es válido o venció.' }); return null; };
  const json = () => { if (!/application\/json/i.test(hdr(req, 'Content-Type'))) return { err: jres(415, { error: 'El body tiene que ser JSON: agregá Content-Type: application/json.' }) }; try { return { v: JSON.parse(req.body || '') }; } catch (e) { return { err: jres(400, { error: 'El body no es JSON válido: ' + e.message }) }; } };
  if (seg[0] === 'productos') {
    if (method !== 'GET') return jres(405, { error: 'Este recurso solo acepta GET.' });
    if (seg[1]) { const p = PRODUCTOS.find(x => String(x.id) === seg[1]); return p ? jres(200, p) : jres(404, { error: `No existe el producto ${seg[1]}.` }); }
    let list = PRODUCTOS.filter(p => !q.get('categoria') || p.categoria === q.get('categoria'));
    const total = list.length, off = +q.get('offset') || 0, lim = q.get('limit') ? +q.get('limit') : list.length;
    list = list.slice(off, off + lim);
    return jres(200, { total, offset: off, limit: lim, items: list.map(({ id, nombre, categoria, precio, stock }) => ({ id, nombre, categoria, precio, stock })) });
  }
  if (seg[0] === 'clientes' && seg[1]) {
    if (method !== 'GET') return jres(405, { error: 'Este recurso solo acepta GET.' });
    const key = hdr(req, 'x-api-key'); if (!key) return jres(401, { error: 'Falta el header x-api-key.' }); if (key !== API_KEY) return jres(403, { error: 'La API key no tiene permiso.' });
    const c = CLIENTES[seg[1]]; if (!c) return jres(404, { error: `No existe el cliente ${seg[1]}.` });
    if (/xml/i.test(hdr(req, 'Accept'))) return { status: 200, type: 'application/xml', body: `<?xml version="1.0" encoding="UTF-8"?>\n<Cliente xmlns="urn:andina:clientes" id="${seg[1]}">\n  <Nombre>${xmlEsc(c.nombre)}</Nombre>\n  <Ciudad>${xmlEsc(c.ciudad)}</Ciudad>\n  <Pais>${c.pais}</Pais>\n</Cliente>` };
    return jres(200, { id: seg[1], ...c });
  }
  if (path === '/oauth/token') {
    if (method !== 'POST') return jres(405, { error: 'Pedí el token con POST.' });
    if (!/application\/x-www-form-urlencoded/i.test(hdr(req, 'Content-Type'))) return jres(415, { error: 'El body tiene que ser form URL-encoded: Content-Type: application/x-www-form-urlencoded.' });
    const f = new URLSearchParams(String(req.body || '').trim());
    if (f.get('grant_type') !== 'client_credentials') return jres(400, { error: 'grant_type tiene que ser client_credentials.' });
    if (f.get('client_id') !== CLIENT_ID || f.get('client_secret') !== CLIENT_SECRET) return jres(401, { error: 'client_id o client_secret incorrectos.' });
    return jres(200, { access_token: TOKEN, token_type: 'Bearer', expires_in: 3600 });
  }
  if (seg[0] === 'pedidos') {
    const a = bearer(); if (a) return a;
    if (!seg[1]) {
      if (method !== 'POST') return jres(405, { error: 'Para listar no hay endpoint: usá GET /pedidos/{id} o POST /pedidos para crear.' });
      const j = json(); if (j.err) return j.err; const b = j.v;
      if (!CLIENTES[b?.cliente]) return jres(400, { error: 'cliente tiene que ser un id existente, como "C-01".' });
      if (!Array.isArray(b.items) || !b.items.length) return jres(400, { error: 'items tiene que ser una lista con al menos un producto.' });
      let total = 0;
      for (const it of b.items) { const p = PRODUCTOS.find(x => x.id === it?.productoId); if (!p) return jres(400, { error: `No existe el producto ${it?.productoId}. productoId tiene que ser un número.` }); if (!Number.isInteger(it.cantidad) || it.cantidad < 1) return jres(400, { error: 'cantidad tiene que ser un número entero mayor que 0.' }); total += p.precio * it.cantidad; }
      return jres(201, { id: 'P-2001', cliente: b.cliente, estado: 'recibido', items: b.items, total }, { location: '/v1/pedidos/P-2001' });
    }
    const p = PEDIDOS[seg[1]]; if (!p) return jres(404, { error: `No existe el pedido ${seg[1]}.` });
    if (method === 'GET') return jres(200, p);
    if (method === 'PATCH') { const j = json(); if (j.err) return j.err; if (!ESTADOS.includes(j.v?.estado)) return jres(400, { error: `estado tiene que ser uno de: ${ESTADOS.join(', ')}.` }); return jres(200, { ...p, estado: j.v.estado }); }
    return jres(405, { error: 'Este recurso acepta GET y PATCH.' });
  }
  return jres(404, { error: `No existe el recurso ${path}. Mirá la documentación de la API.` });
}
const parseBody = r => { try { return JSON.parse(r.body); } catch (_) { return null; } };
const urlOf = req => { try { return new URL(String(req.url).trim()); } catch (_) { return null; } };
const ok = (c, m) => (c ? true : m);

/* ---------------- Ejercicios: 8 pedidos guiados contra la API de práctica ---------------- */
let gN = 0;
const G = (n, j) => ({ ...j, title: `Ejercicio_${String(++gN).padStart(3, '0')}: ${j.title}`, cat: 'Escenarios guiados', level: `Clase ${n}`, source: `Escenario guiado · Clase N° ${n}`, checks: [], hints: j.hints || [] });
const H = (name, value) => ({ name, value });
const R = (method, path, headers = [], body = '') => ({ method, url: BASE_URL + path, headers, body });
const EMPTY = () => ({ req: { method: 'GET', url: BASE_URL + '/', headers: [H('', '')], body: '' }, answer: '' });
const st = (res, code) => ok(res.status === code, res.status ? `La API respondió ${res.status}; se esperaba ${code}.` : (res.error || 'No hubo respuesta.'));
const PROJ = { api: [
  G(2, { id: 'producto', title: 'Consultar un producto',
    story: 'El área de ventas necesita los datos del mate de calabaza (id 103) para cargarlo en un catálogo.',
    objectives: ['Armar un pedido GET.', 'Usar un parámetro de ruta.'],
    reqs: ['Método <code>GET</code>.', `URL <code>${BASE_URL}/productos/103</code>.`, 'Enviá el pedido y mirá la respuesta.'],
    hints: ['Los productos son públicos: no hace falta autenticación.'],
    tests: [{ name: 'Pide el producto 103', run: (req, res) => { if (req.method !== 'GET') return 'El método tiene que ser GET.'; const r = st(res, 200); if (r !== true) return r; return ok(parseBody(res)?.id === 103, 'La respuesta no es la del producto 103.'); } }],
    solution: () => ({ req: R('GET', '/productos/103'), answer: '' }) }),
  G(3, { id: 'no-existe', title: 'Entender un error',
    story: 'Un sistema pide el producto 999 y falla. Hay que reproducir el error y saber qué significa.',
    objectives: ['Leer el código de estado.', 'Distinguir errores del cliente y del servidor.'],
    reqs: [`<code>GET ${BASE_URL}/productos/999</code>.`, 'En la respuesta, ¿qué código de estado devolvió la API? Escribilo abajo.'],
    ask: '¿Qué código de estado devolvió la API?',
    hints: ['Los 4xx indican que el pedido tiene algo mal: acá, que el recurso no existe.'],
    tests: [{ name: 'Reproduce el error', run: (req, res) => ok(req.method === 'GET' && /\/productos\/999$/.test(urlOf(req)?.pathname || ''), 'Pedí GET /productos/999.') }, { name: 'Código correcto', run: (req, res, a) => ok(a.trim() === '404', 'Revisá el código de estado de la respuesta.') }],
    solution: () => ({ req: R('GET', '/productos/999'), answer: '404' }) }),
  G(4, { id: 'leer-json', title: 'Leer un dato anidado en JSON',
    story: 'Compras quiere saber quién provee la Yerba Andina 1 kg (id 101).',
    objectives: ['Recorrer un objeto JSON anidado.'],
    reqs: [`<code>GET ${BASE_URL}/productos/101</code>.`, 'En la respuesta, buscá <code>proveedor.nombre</code> y escribilo abajo.'],
    ask: '¿Cómo se llama el proveedor?',
    hints: ['proveedor es un objeto dentro del producto.'],
    tests: [{ name: 'Pide el producto 101', run: (req, res) => { const r = st(res, 200); return r !== true ? r : ok(parseBody(res)?.id === 101, 'Pedí el producto 101.'); } }, { name: 'Lee proveedor.nombre', run: (req, res, a) => ok(a.trim().toLowerCase() === 'molino andino', 'Ese no es el valor de proveedor.nombre.') }],
    solution: () => ({ req: R('GET', '/productos/101'), answer: 'Molino Andino' }) }),
  G(5, { id: 'xml', title: 'Pedir XML con una API key',
    story: 'El ERP de logística solo entiende XML. Hay que pedir el cliente C-02 en XML, autenticándose con la API key.',
    objectives: ['Usar el header Accept.', 'Autenticarse con una API key.', 'Leer XML.'],
    reqs: [`<code>GET ${BASE_URL}/clientes/C-02</code>.`, `Header <code>x-api-key: ${API_KEY}</code>.`, 'Header <code>Accept: application/xml</code>.', 'En la respuesta XML, buscá la ciudad y escribila abajo.'],
    ask: '¿En qué ciudad está el cliente?',
    hints: ['Sin x-api-key la API responde 401.', 'Sin Accept, la respuesta llega en JSON.'],
    tests: [{ name: 'Respuesta en XML', run: (req, res) => { const r = st(res, 200); if (r !== true) return r; return ok(res.type === 'application/xml' && res.body.includes('id="C-02"'), 'La respuesta tiene que ser el cliente C-02 en XML: revisá el header Accept.'); } }, { name: 'Lee la ciudad', run: (req, res, a) => ok(a.trim().toLowerCase() === 'córdoba' || a.trim().toLowerCase() === 'cordoba', 'Buscá el elemento <Ciudad>.') }],
    solution: () => ({ req: R('GET', '/clientes/C-02', [H('x-api-key', API_KEY), H('Accept', 'application/xml')]), answer: 'Córdoba' }) }),
  G(6, { id: 'filtrar', title: 'Filtrar y paginar con parámetros de consulta',
    story: 'La web muestra las yerbas de a dos por página. Hay que pedir la primera página.',
    objectives: ['Usar parámetros de consulta.', 'Entender limit y la paginación.'],
    reqs: [`<code>GET ${BASE_URL}/productos</code> con los parámetros <code>categoria=yerba</code> y <code>limit=2</code>.`, '¿Cuántas yerbas hay en total? (campo <code>total</code>). Escribilo abajo.'],
    ask: '¿Cuántas yerbas hay en total?',
    hints: ['Los parámetros van después del ? y se separan con &.'],
    tests: [{ name: 'Filtra por categoría y limita a 2', run: (req, res) => { const u = urlOf(req); if (!u) return 'La URL no es válida.'; if (u.searchParams.get('categoria') !== 'yerba' || u.searchParams.get('limit') !== '2') return 'La URL tiene que tener ?categoria=yerba&limit=2.'; const r = st(res, 200); return r !== true ? r : ok(parseBody(res)?.items.length === 2, 'La respuesta tendría que traer 2 productos.'); } }, { name: 'Lee el total', run: (req, res, a) => ok(a.trim() === '3', 'Mirá el campo total de la respuesta.') }],
    solution: () => ({ req: R('GET', '/productos?categoria=yerba&limit=2'), answer: '3' }) }),
  G(7, { id: 'token', title: 'Pedir un token con OAuth 2.0',
    story: 'Para crear pedidos hace falta un token. La API usa OAuth 2.0 client credentials.',
    objectives: ['Armar un body form URL-encoded.', 'Entender el flujo de client credentials.'],
    reqs: [`<code>POST ${BASE_URL}/oauth/token</code>.`, 'Header <code>Content-Type: application/x-www-form-urlencoded</code>.', `Body: <code>grant_type=client_credentials&amp;client_id=${CLIENT_ID}&amp;client_secret=${CLIENT_SECRET}</code>.`, 'Copiá el <code>access_token</code> de la respuesta y escribilo abajo.'],
    ask: '¿Qué access_token devolvió la API?',
    hints: ['En un sistema real, client_secret se guarda en un lugar seguro, nunca en el código.'],
    tests: [{ name: 'Obtiene el token', run: (req, res) => st(res, 200) }, { name: 'Copia el token', run: (req, res, a) => ok(a.trim() === TOKEN, 'Copiá el valor de access_token.') }],
    solution: () => ({ req: R('POST', '/oauth/token', [H('Content-Type', 'application/x-www-form-urlencoded')], `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`), answer: TOKEN }) }),
  G(7, { id: 'crear-pedido', title: 'Crear un pedido con JSON y Bearer',
    story: 'Almacén Sur (C-01) pide 3 Yerba Andina 1 kg (101) y 2 bombillas (104). Hay que cargar el pedido por la API.',
    objectives: ['Armar un body JSON con una lista.', 'Autenticarse con un token Bearer.', 'Reconocer un 201.'],
    reqs: [`<code>POST ${BASE_URL}/pedidos</code>.`, `Headers <code>Authorization: Bearer ${TOKEN}</code> y <code>Content-Type: application/json</code>.`, 'Body JSON con <code>cliente</code> y la lista <code>items</code> (cada uno con <code>productoId</code> y <code>cantidad</code> como números).', 'Escribí abajo el <code>total</code> del pedido creado.'],
    ask: '¿Cuál es el total del pedido?',
    hints: ['productoId y cantidad van sin comillas: son números.', 'Sin Content-Type la API responde 415; sin token, 401.'],
    tests: [{ name: 'Crea el pedido', run: (req, res) => { const r = st(res, 201); if (r !== true) return r; const b = parseBody(res); const it = b.items.map(i => `${i.productoId}x${i.cantidad}`).sort().join(','); return ok(b.cliente === 'C-01' && it === '101x3,104x2', 'El pedido tiene que ser para C-01 con 3 del 101 y 2 del 104.'); } }, { name: 'Lee el total', run: (req, res, a) => ok(a.trim().replace(/[.$\s]/g, '') === '13800', 'Mirá el campo total de la respuesta.') }],
    solution: () => ({ req: R('POST', '/pedidos', [H('Authorization', 'Bearer ' + TOKEN), H('Content-Type', 'application/json')], JSON.stringify({ cliente: 'C-01', items: [{ productoId: 101, cantidad: 3 }, { productoId: 104, cantidad: 2 }] }, null, 2)), answer: '13800' }) }),
  G(2, { id: 'cancelar', title: 'Cancelar un pedido con PATCH',
    story: 'El cliente del pedido P-1001 se arrepintió. Hay que cambiar solo el estado a cancelado.',
    objectives: ['Usar PATCH para modificar una parte de un recurso.'],
    reqs: [`<code>PATCH ${BASE_URL}/pedidos/P-1001</code>.`, `Headers <code>Authorization: Bearer ${TOKEN}</code> y <code>Content-Type: application/json</code>.`, 'Body: <code>{ "estado": "cancelado" }</code>.'],
    hints: ['PUT reemplazaría el pedido completo; PATCH cambia solo lo que mandás.'],
    tests: [{ name: 'Cancela el pedido', run: (req, res) => { if (req.method !== 'PATCH') return 'El método tiene que ser PATCH.'; const r = st(res, 200); return r !== true ? r : ok(parseBody(res)?.estado === 'cancelado' && parseBody(res)?.id === 'P-1001', 'El pedido P-1001 tiene que quedar cancelado.'); } }],
    solution: () => ({ req: R('PATCH', '/pedidos/P-1001', [H('Authorization', 'Bearer ' + TOKEN), H('Content-Type', 'application/json')], '{ "estado": "cancelado" }'), answer: '' }) }),
  { id: 'libre', free: true, cat: 'Modo libre', level: 'Libre', title: 'Modo libre', checks: [], tests: [], story: 'Probá cualquier pedido contra la API de práctica: todos los endpoints de la documentación, con los métodos, headers y bodies que quieras.', reqs: [], hints: ['Probá provocar errores a propósito (sin token, con JSON mal armado) para ver cada código de estado.'] },
] };

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
const graded = pf => PROJ[pf].filter(j => !j.free);
const TOTAL = pf => P[pf].lessons.length + graded(pf).length + P[pf].quizzes.length;
const validKeys = pf => new Set([...P[pf].lessons.map((_, i) => `${pf}:L${i}`), ...graded(pf).map(j => `${pf}:P:${j.id}`), ...P[pf].quizzes.map(q => `${pf}:Q:${q.id}`)]);
const doneCount = pf => { const v = validKeys(pf); return Object.keys(data().progress).filter(k => v.has(k)).length; };
const pct = pf => Math.round(doneCount(pf) / TOTAL(pf) * 100);
const mark = k => { if (!data().progress[k]) { data().progress[k] = true; persist(); } };

/* ---------------- Vistas: la página del curso de conexiones y su taller ---------------- */
const state = { view: 'platform', pf: 'api', res: null, tab: 'lecciones', proj: null, flow: null, sel: null, run: null, results: null, reveal: new Set(), graded: false, quizId: null, ptab: 'ej', ins: null, tquiz: null, inputRaw: null };
const view = $('#view');
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2800); }
function go(v, extra = {}) { Object.assign(state, { view: v, sel: null, run: null, results: null, reveal: new Set(), graded: false, quizId: null, ptab: 'ej', ins: null, tquiz: null }, extra); render(); window.scrollTo(0, 0); }

// Inicio, SAP CPI, Mi avance y la cuenta viven en otras páginas de flowDev
const HOME = '../index.html';
function renderNav() {
  const links = [[HOME, 'Inicio'], [null, 'Conexiones'], ['../sap-cpi/index.html', 'SAP CPI'], ['../power-automate/index.html', 'Power Automate'], ['../claude-code/index.html', 'Claude Code'], [HOME + '#avance', 'Mi avance']];
  $('#navLinks').innerHTML = links.map(([href, l]) => href ? `<a href="${href}">${l}</a>` : `<button type="button" data-go="api" aria-current="page">${l}</button>`).join('');
  const u = me();
  $('#navUser').innerHTML = u
    ? `<span class="chip"><i>${esc(u.name.trim()[0]?.toUpperCase() || '?')}</i>${esc(u.name.split(' ')[0])}</span><button type="button" class="btn line sm" data-act="logout">Salir</button>`
    : `<a class="btn line sm" href="${HOME}#ingreso">Ingresar</a><a class="btn sky sm" href="${HOME}#registro">Crear cuenta</a>`;
}

const order = q => { let s = 7; for (const ch of q[0]) s = (Math.imul(s, 31) + ch.charCodeAt(0)) >>> 0; const idx = q[1].map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; const k = (s >>> 16) % (i + 1); [idx[i], idx[k]] = [idx[k], idx[i]]; } return idx; };
/* Sin cuenta: solo las primeras 3 clases de teoría y los primeros 2 cuestionarios de cada plataforma */
const FREE_LES = 3, FREE_QZ = 2;
const guest = () => !me();
const lockRow = (pill, title, what) => `<button type="button" class="list-item locked" data-auth="registro" aria-label="${esc(title)}: creá una cuenta para ver ${what === 'clase' ? 'esta clase' : 'este cuestionario'}"><span class="pill">${esc(pill)}</span><span class="grow"><span class="h3">${esc(title)}</span><br><span class="dim">Creá una cuenta gratis para ver ${what === 'clase' ? 'esta clase' : 'este cuestionario'}.</span></span><span class="pill fill">Con cuenta</span></button>`;
const guestNote = what => (guest() ? `<p class="note guest-note">Sin cuenta podés ver ${what === 'clase' ? `${FREE_LES} clases` : `${FREE_QZ} cuestionarios`}. <button type="button" class="linkbtn" data-auth="registro">Creá una cuenta gratis</button> para ver todo y guardar tu avance.</p>` : '');
function platform() {
  const pf = state.pf, p = P[pf], pr = data().progress, tab = state.tab, gr = graded(pf);
  const total = TOTAL(pf), item = j => `<button type="button" class="list-item" data-proj="${j.id}"><span class="pill${pr[`${pf}:P:${j.id}`] ? ' ok' : ''}">${pr[`${pf}:P:${j.id}`] ? 'Resuelto' : esc(j.level)}</span><span class="grow"><span class="h3">${esc(j.title)}</span><br><span class="dim">${esc(j.objectives ? j.objectives[0] : j.story)}</span></span><span class="arrow">${svg('arrow')}</span></button>`;
  let body = '';
  if (tab === 'lecciones') body = guestNote('clase') + p.lessons.map(([t, parts], i) => guest() && i >= FREE_LES ? lockRow(String(i + 1), t, 'clase') : `<details class="lesson${pr[`${pf}:L${i}`] ? ' done' : ''}"${i === 0 && !pr[`${pf}:L0`] ? ' open' : ''}>
      <summary><span class="n">${i + 1}</span><span class="h3" style="flex:1">${esc(t)}</span>${pr[`${pf}:L${i}`] ? '<span class="pill ok">Leída</span>' : ''}</summary>
      <div class="body">${parts.join('')}<button type="button" class="btn sm" data-act="read" data-i="${i}">${pr[`${pf}:L${i}`] ? 'Leída' : 'Marcar como leída'}</button></div></details>`).join('');
  else if (tab === 'proyectos') body = [...new Set(gr.map(j => j.cat))].map((c2, k) => `<p class="gtitle" style="margin-top:${k ? 20 : 6}px">${esc(c2)} · ${gr.filter(j => j.cat === c2).length}</p><div>${gr.filter(j => j.cat === c2).map(item).join('')}</div>`).join('');
  else if (tab === 'libre') body = `<div class="grid2" style="align-items:center"><div class="stack"><p class="lead">Abrí el ${TALLER[pf].toLowerCase()} sin requisitos ni verificación y probá cualquier pedido HTTP contra la API de práctica.</p><p class="dim">Todos los endpoints, métodos, headers y bodies: provocá errores a propósito para ver cada código de estado.</p><div><button type="button" class="btn" data-proj="libre">Abrir el editor libre</button></div></div><div class="tiles"><div class="tile">${svg('router')}<p>GET, POST, PATCH y parámetros</p></div><div class="tile grey">${svg('json')}<p>JSON y XML</p></div><div class="tile grey">${svg('shield')}<p>API key, Bearer y OAuth 2.0</p></div><div class="tile">${svg('task')}<p>Códigos de estado y errores</p></div></div></div>`;
  else if (!state.quizId) body = guestNote('quiz') + p.quizzes.map((q, qi) => guest() && qi >= FREE_QZ ? lockRow(q.cls, q.title, 'quiz') : `<button type="button" class="list-item" data-quiz="${q.id}"><span class="pill${pr[`${pf}:Q:${q.id}`] ? ' ok' : ''}">${pr[`${pf}:Q:${q.id}`] ? 'Aprobado' : esc(q.cls)}</span><span class="grow"><span class="h3">${esc(q.title)}</span></span><span class="arrow">${svg('arrow')}</span></button>`).join('');
  else {
    const quiz = p.quizzes.find(q => q.id === state.quizId), ans = data().quiz[`${pf}:${quiz.id}`] || {};
    body = `<div class="row" style="justify-content:space-between;margin-bottom:14px"><button type="button" class="btn line sm" data-quiz="">← Cuestionarios</button><span class="h3">${esc(quiz.cls)} · ${esc(quiz.title)}</span></div>` + quiz.qs.map((q, i) => { const g = state.graded && ans[i] != null, ok = ans[i] === 0, show = state.reveal.has(i);
      return `<div class="q${g ? (ok ? ' ok' : ' bad') : ''}"><p class="t">${i + 1}. ${esc(q[0])}</p>${order(q).map(k => `<label class="${show && k === 0 ? 'right' : ''}"><input type="radio" name="q${i}" data-q="${i}" data-o="${k}"${ans[i] === k ? ' checked' : ''}><span>${esc(q[1][k])}</span></label>`).join('')}${g || show ? `<p class="why">${g ? (ok ? 'Correcto. ' : 'No es esa. ') : ''}${esc(q[2])}</p>` : ''}<div class="row" style="justify-content:flex-end;margin-top:6px"><button type="button" class="btn line sm" data-act="reveal" data-i="${i}">${show ? 'Ocultar respuesta' : 'Ver respuesta'}</button></div></div>`; }).join('')
      + `<div class="row"><button type="button" class="btn" data-act="grade">Corregir</button>${pr[`${pf}:Q:${quiz.id}`] ? '<span class="pill ok">Aprobado</span>' : ''}</div>`;
  }
  const tabs = [
    ['lecciones', 'Teoría', `${p.lessons.length} clases cortas: APIs, HTTP, códigos de estado, JSON, XML, REST, autenticación y otros tipos de conexión.`],
    ['proyectos', 'Escenarios', 'Pedidos guiados contra la API de una empresa ficticia, que se verifican al instante.'],
    ['quiz', 'Cuestionarios', 'Un cuestionario por clase para repasar lo que leíste.'],
    ['libre', 'Modo libre', 'La API de práctica sin requisitos: probá cualquier pedido.'],
  ], cur = tabs.find(t => t[0] === tab) || tabs[0], done = doneCount(pf);
  const stats = [
    [svg('approval'), `${Math.round(done / total * 100)}%`, 'Taller completado', `${done} de ${total} ejercicios resueltos`],
    [svg('router'), gr.length, 'Escenarios', 'Guiados y de práctica extra'],
    [svg('csv'), p.lessons.length, 'Clases', 'Teoría corta, sin relleno'],
    [svg('task'), p.quizzes.length, 'Cuestionarios', 'Uno por cada clase'],
  ];
  return `<section class="card hero">
    <div class="mark-row"><span class="mark lg" data-mark="${pf}"></span><p class="eyebrow dim">Plataforma</p></div>
    <h1 class="display">${p.name}</h1>
    <span class="pill">${esc(p.tag)}</span>
    <p class="lead">${esc(p.intro)}</p>
    <div class="row hero-cta"><button type="button" class="btn" data-proj="${(gr.find(j => !pr[`${pf}:P:${j.id}`]) || gr[0]).id}">Abrir el ${TALLER[pf].toLowerCase()}</button><button type="button" class="btn line" data-tab="lecciones">Empezar por la teoría</button></div>
  </section>
  <section class="card dark proc">
    <div class="proc-head"><h2 class="display">Tu avance</h2><p class="lead dim">Lo que resolvés en el editor y lo que leés en la teoría se guarda solo.</p></div>
    <ol class="proc-steps">${stats.map(([ic, big, t, s], i) => `<li><span class="proc-n">0${i + 1}</span>${ic}<span class="big">${big}</span><b>${t}</b><p>${s}</p></li>`).join('')}</ol>
  </section>
  <section class="card" id="contenido">
    <div class="proc-head"><h2 class="display">${cur[1]}</h2><p class="lead">${cur[2]}</p></div>
    <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${tab === k}">${l}</button>`).join('')}</div>
    <div class="tab-body">${body}</div>
  </section>`;
}
/* ---------------- Taller: barra | documentación | pedido y respuesta | panel ---------------- */
const TALLER = { api: 'Taller de conexiones' };
function selectorHtml(pf) {
  const pr = data().progress, gr = graded(pf), cur = state.tquiz ? 'quiz:' + state.tquiz : state.proj.id;
  const opt = (v, text, done) => `<option value="${v}"${v === cur ? ' selected' : ''}>${done ? '✓ ' : ''}${esc(text)}</option>`;
  return `<select id="tlSel" aria-label="Ejercicio"><optgroup label="Escenarios guiados">${gr.map(j => opt(j.id, `${j.level} · ${j.title}`, pr[`${pf}:P:${j.id}`])).join('')}</optgroup><optgroup label="Cuestionarios teóricos">${P[pf].quizzes.map(q => opt('quiz:' + q.id, `${q.cls} · ${q.title}`, pr[`${pf}:Q:${q.id}`])).join('')}</optgroup><optgroup label="Modo libre">${opt('libre', 'Modo libre', false)}</optgroup></select>`;
}
function quizHtml(pf, quiz) {
  const ans = data().quiz[`${pf}:${quiz.id}`] || {}, done = data().progress[`${pf}:Q:${quiz.id}`];
  return `<div class="row" style="margin-bottom:6px"><span class="pill">Cuestionario teórico</span>${done ? '<span class="pill ok">Aprobado</span>' : ''}</div><h2 class="h2" style="margin-bottom:14px">${esc(quiz.cls)} · ${esc(quiz.title)}</h2>`
    + quiz.qs.map((q, i) => { const g = state.graded && ans[i] != null, ok = ans[i] === 0, show = state.reveal.has(i);
      return `<div class="q${g ? (ok ? ' ok' : ' bad') : ''}"><p class="t">${i + 1}. ${esc(q[0])}</p>${order(q).map(k => `<label class="${show && k === 0 ? 'right' : ''}"><input type="radio" name="q${i}" data-q="${i}" data-o="${k}"${ans[i] === k ? ' checked' : ''}><span>${esc(q[1][k])}</span></label>`).join('')}${g || show ? `<p class="why">${g ? (ok ? 'Correcto. ' : 'No es esa. ') : ''}${esc(q[2])}</p>` : ''}<div class="row" style="justify-content:flex-end;margin-top:6px"><button type="button" class="btn line sm" data-act="reveal" data-i="${i}">${show ? 'Ocultar respuesta' : 'Ver respuesta'}</button></div></div>`; }).join('')
    + `<div class="row"><button type="button" class="btn" data-act="grade">Corregir</button></div>`;
}
const req = () => state.flow.req;
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
function docsHtml() {
  return `<div class="pgroup"><h4>API de Distribuidora Andina</h4><p class="note mono" style="margin-bottom:10px;word-break:break-all">${BASE_URL}</p><div class="pitems">${DOCS.map(([m, path, d, auth], i) => `<button type="button" class="ditem" data-doc="${i}" title="Usar este endpoint"><span class="meth m-${m}">${m}</span><span class="dtx"><code>${esc(path)}</code><small>${esc(d)}</small><small class="dauth">Autenticación: ${esc(auth)}</small></span></button>`).join('')}</div></div>`;
}
function responseHtml() {
  const r = state.res;
  if (!r) return '<p class="empty-flow">Armá el pedido y tocá Enviar</p>';
  if (!r.status) return `<div class="resp"><div class="resp-head"><span class="code c-err">Sin conexión</span></div><p class="resp-err">${esc(r.error)}</p></div>`;
  const cls = r.status < 300 ? 'c-ok' : r.status < 500 ? 'c-warn' : 'c-err';
  return `<div class="resp"><div class="resp-head"><span class="code ${cls}">${r.status} ${STATUS[r.status] || ''}</span><span class="mono dim">Content-Type: ${esc(r.type)}${r.location ? ` · Location: ${esc(r.location)}` : ''}</span></div><pre class="resp-body">${esc(r.body)}</pre></div>`;
}
function project() {
  const pf = state.pf, p = P[pf], j = state.proj, quiz = state.tquiz && p.quizzes.find(q => q.id === state.tquiz);
  const top = `<section class="tl-top">
    <button type="button" class="btn sky sm" data-go="${pf}" data-keep-tab="${quiz ? 'quiz' : 'proyectos'}">← Conexiones</button>
    <span class="mark sm" data-mark="${pf}"></span><div class="tl-brand"><b>${TALLER[pf]}</b><small>Pedidos HTTP a una API de práctica</small></div>
    <label class="tl-sel"><span>Ejercicio</span>${selectorHtml(pf)}</label>
    <span class="pill tl-prog">${doneCount(pf)}/${TOTAL(pf)} completados</span>
    ${quiz ? '' : '<button type="button" class="btn line sm" data-act="tour">Cómo se usa</button>'}
    ${quiz ? '' : `<button type="button" class="btn line sm" data-act="send">Enviar</button>${j.free ? '' : '<button type="button" class="btn sky sm" data-act="verify">Verificar ejercicio</button>'}`}
  </section>`;
  if (quiz) return `${top}<section class="tl quiz"><div class="tl-panel"><div class="tl-body">${quizHtml(pf, quiz)}</div></div></section>`;
  const R = state.results, done = data().progress[`${pf}:P:${j.id}`], q = req();
  const ej = `<div class="row" style="margin-bottom:6px"><span class="pill">${esc(j.source || j.cat)}</span>${done ? '<span class="pill ok">Resuelto</span>' : ''}</div>
    <h2 class="h2">${esc(j.title)}</h2><p style="margin:8px 0 14px">${esc(j.story)}</p>
    ${j.objectives ? `<details class="fold"><summary>Objetivos de aprendizaje (${j.objectives.length})</summary><ul class="reqs">${j.objectives.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>` : ''}
    ${j.free ? '' : `<p class="gtitle">Requisitos</p><ol class="reqs">${j.reqs.map(x => `<li>${x}</li>`).join('')}</ol>`}
    ${j.ask ? `<label class="fld" style="margin-top:12px"><span>${esc(j.ask)}</span><input id="answer" value="${esc(state.flow.answer || '')}" autocomplete="off"></label>` : ''}
    ${j.hints.length ? `<details class="fold"><summary>Pistas (${j.hints.length})</summary><ul class="reqs">${j.hints.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>` : ''}
    <div class="row" style="margin:16px 0 4px">${j.free ? '' : '<button type="button" class="btn" data-act="verify">Verificar ejercicio</button>'}</div>
    ${R ? `<div class="resbox${R.all ? ' all' : ''}"><div class="row" style="justify-content:space-between;margin-bottom:6px"><span class="h3">${R.all ? 'Ejercicio resuelto' : 'Todavía falta'}</span><span class="pill ${R.all ? 'ok' : ''}">${R.items.filter(i => i.ok).length}/${R.items.length}</span></div><ul class="results">${R.items.map(i => `<li class="${i.ok ? 'ok' : 'bad'}"><span class="mk">${i.ok ? '✓' : '✗'}</span><span>${esc(i.label)}${!i.ok && i.detail ? `<small>${esc(i.detail)}</small>` : ''}</span></li>`).join('')}</ul></div>` : ''}
    <div class="row" style="margin-top:14px">${state.confirm ? `<span style="flex-basis:100%">${state.confirm === 'sol' ? 'Esto reemplaza tu pedido por la solución.' : 'Esto borra tu pedido.'}</span><button type="button" class="btn sm" data-act="${state.confirm}ok">Confirmar</button><button type="button" class="btn line sm" data-act="cancel">Cancelar</button>` : `${j.free ? '' : '<button type="button" class="btn line sm" data-act="sol">Ver solución</button>'}<button type="button" class="btn line sm" data-act="reset">Reiniciar ejercicio</button>`}</div>
    <p class="note" style="margin-top:18px;border-top:1.5px solid var(--line);padding-top:12px">La API de práctica responde en tu navegador: no se envía nada a internet.</p>`;
  return `${top}<section class="tl">
    <aside class="tl-pal" aria-label="Documentación de la API">${docsHtml()}</aside>
    <div class="tl-stage"><div class="tl-bar">Clic en un endpoint de la documentación para usarlo · completá headers y body · Enviar</div>
      <div class="canvas api"><div class="reqbox">
        <div class="reqline"><select id="rqMethod" aria-label="Método">${METHODS.map(m => `<option${m === q.method ? ' selected' : ''}>${m}</option>`).join('')}</select><input id="rqUrl" class="mono" value="${esc(q.url)}" aria-label="URL" spellcheck="false"><button type="button" class="btn" data-act="send">Enviar</button></div>
        <p class="gtitle">Headers</p>
        ${q.headers.map((h, i) => `<div class="rowcard"><input class="mono" data-h="${i}" data-f="name" value="${esc(h.name)}" placeholder="Nombre (Content-Type)" aria-label="Nombre del header"><input class="mono" data-h="${i}" data-f="value" value="${esc(h.value)}" placeholder="Valor" aria-label="Valor del header"><button type="button" class="x" data-act="hdel" data-i="${i}" aria-label="Quitar">×</button></div>`).join('')}
        <button type="button" class="btn line sm" data-act="hadd">+ Header</button>
        <label class="fld" style="margin-top:12px"><span>Body</span><textarea id="rqBody" class="mono" rows="6" spellcheck="false" placeholder="JSON, form URL-encoded…">${esc(q.body)}</textarea></label>
        <p class="gtitle" style="margin-top:4px">Respuesta</p>${responseHtml()}
      </div></div></div>
    <aside class="tl-panel">
      <nav class="tl-tabs" role="tablist"><button type="button" role="tab" aria-selected="true">Ejercicio</button></nav>
      <div class="tl-body">${ej}</div>
    </aside>
  </section>`;
}
const saveFlow = () => { if (state.proj) { data().flows[`${state.pf}:${state.proj.id}`] = state.flow; persist(); } };
function openProject(id) {
  const j = PROJ[state.pf].find(x => x.id === id), saved = data().flows[`${state.pf}:${id}`];
  go('project', { proj: j, flow: saved?.req ? clone(saved) : EMPTY(), res: null, confirm: null });
}
const openQuiz = id => (guest() && P[state.pf].quizzes.findIndex(q => q.id === id) >= FREE_QZ) ? (toast('Creá una cuenta para ver todos los cuestionarios.'), location.href = `${HOME}#registro`) : go('project', { tquiz: id, quizId: id, proj: null, flow: EMPTY() });
function verify() {
  const j = state.proj, res = api(req()), items = j.tests.map(t => { let r; try { r = t.run(req(), res, state.flow.answer || ''); } catch (e) { r = e.message; } return { ok: r === true, label: 'Prueba: ' + t.name, detail: r === true ? '' : String(r) }; });
  const allOk = items.every(i => i.ok);
  if (allOk) { mark(`${state.pf}:P:${j.id}`); toast('Ejercicio resuelto.'); }
  state.res = res; state.results = { items, all: allOk }; render();
}

/* ---------------- Guía de uso del taller (tour.js) ---------------- */
const TOUR_STEPS = [
  { title: 'Así se usa el taller de conexiones', text: 'Vas a armar pedidos HTTP como los que hacen SAP CPI, Power Automate o cualquier integración, y ver cómo responde una API real. Son 5 pasos.' },
  { sel: '.tl-sel', title: 'Elegí un ejercicio', text: 'Cada escenario es una tarea concreta. Los cuestionarios de cada clase también están en esta lista.' },
  { sel: '.tl-pal', title: 'Leé la documentación', text: 'Ahí están los endpoints de la API de práctica, con su método, qué hacen y cómo se autentican. Un clic carga el endpoint en el pedido.' },
  { sel: '.tl-stage', title: 'Armá y enviá el pedido', text: 'Elegí el método, completá la URL, los headers y el body, y tocá Enviar. Abajo ves el código de estado y la respuesta.' },
  { sel: '.tl-panel', title: 'Verificá', text: 'Leé el escenario, respondé la pregunta si la hay y tocá Verificar ejercicio.' },
];

/* ---------------- Render y eventos ---------------- */
function render() {
  renderNav();
  $('.shell').classList.toggle('wide', state.view === 'project');
  $('.shell').classList.toggle('full', state.view === 'platform');
  document.body.classList.toggle('in-taller', state.view === 'project');
  view.innerHTML = { platform, project }[state.view]();
  if (state.view === 'project' && !state.tquiz && window.flowTour && !window.flowTour.isOpen()) setTimeout(() => window.flowTour.auto(TOUR_STEPS, 'api-taller'), 400);
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-go],[data-auth],[data-tab],[data-proj],[data-act],[data-quiz],[data-doc]'); if (!el) return;
  const d = el.dataset;
  if (d.go) return go('platform', { tab: d.keepTab || 'lecciones' });
  if (d.auth) { location.href = `${HOME}#${d.auth}`; return; }
  if (d.tab) { state.tab = d.tab; state.quizId = null; state.graded = false; state.reveal = new Set(); render(); document.getElementById('contenido')?.scrollIntoView({ block: 'start' }); return; }
  if (d.quiz !== undefined) return d.quiz ? openQuiz(d.quiz) : (state.quizId = null, render());
  if (d.proj) return openProject(d.proj);
  if (d.doc) { const [m, path] = DOCS[+d.doc]; Object.assign(req(), { method: m, url: BASE_URL + path.replace('{id}', path.startsWith('/pedidos') ? 'P-1001' : path.startsWith('/clientes') ? 'C-01' : '101') }); saveFlow(); return render(); }
  const pf = state.pf;
  switch (d.act) {
    case 'logout': if (cloud) { clearTimeout(syncT); pushCloud().finally(() => sb.auth.signOut()); cloud = null; } db.session = null; persist(); toast('Sesión cerrada.'); return render();
    case 'read': mark(`${pf}:L${d.i}`); toast('Lección marcada como leída.'); return render();
    case 'reveal': { const i = +d.i; state.reveal.has(i) ? state.reveal.delete(i) : state.reveal.add(i); return render(); }
    case 'grade': { const qz = P[pf].quizzes.find(q => q.id === state.quizId), ans = data().quiz[`${pf}:${qz.id}`] || {}; state.graded = true; if (qz.qs.every((_, i) => ans[i] === 0)) { mark(`${pf}:Q:${qz.id}`); toast('Cuestionario aprobado.'); } return render(); }
    case 'send': state.res = api(req()); state.results = null; return render();
    case 'verify': return verify();
    case 'tour': return window.flowTour?.start(TOUR_STEPS, 'api-taller');
    case 'hadd': req().headers.push(H('', '')); saveFlow(); return render();
    case 'hdel': req().headers.splice(+d.i, 1); if (!req().headers.length) req().headers.push(H('', '')); saveFlow(); return render();
    case 'sol': case 'reset': state.confirm = d.act; return render();
    case 'cancel': state.confirm = null; return render();
    case 'solok': state.flow = state.proj.solution(); Object.assign(state, { confirm: null, results: null, res: api(state.flow.req) }); saveFlow(); toast('Solución cargada: mirá el pedido y la respuesta.'); return render();
    case 'resetok': state.flow = EMPTY(); Object.assign(state, { confirm: null, results: null, res: null }); saveFlow(); return render();
  }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'tlSel') return el.value.startsWith('quiz:') ? openQuiz(el.value.slice(5)) : openProject(el.value);
  if (el.id === 'rqMethod') { req().method = el.value; state.results = null; return saveFlow(); }
  if (el.dataset.q === undefined) return;
  (data().quiz[`${state.pf}:${state.quizId}`] ||= {})[+el.dataset.q] = +el.dataset.o; state.graded = false; persist();
});
document.addEventListener('input', e => {
  const el = e.target; if (state.view !== 'project' || !state.proj) return;
  if (el.id === 'rqUrl') req().url = el.value;
  else if (el.id === 'rqBody') req().body = el.value;
  else if (el.id === 'answer') state.flow.answer = el.value;
  else if (el.dataset.h !== undefined) req().headers[+el.dataset.h][el.dataset.f] = el.value;
  else return;
  state.results = null; saveFlow();
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'rqUrl') { e.preventDefault(); state.res = api(req()); render(); } });
// Mi avance enlaza a un escenario con #ejercicio=<id>
const openFromHash = () => { const m = location.hash.match(/^#ejercicio=([\w-]+)$/); if (m && PROJ.api.some(j => j.id === m[1])) { openProject(m[1]); return true; } return false; };
if (!openFromHash()) render();
window.addEventListener('hashchange', () => { if (!openFromHash() && !location.hash) go('platform'); });
if (sb) {
  sb.auth.getSession().then(async ({ data: { session } }) => { if (session) { await loadCloud(session.user); render(); } });
  sb.auth.onAuthStateChange((ev, session) => { if (ev === 'SIGNED_IN' && session && !cloud) loadCloud(session.user).then(render); });
}
})();
