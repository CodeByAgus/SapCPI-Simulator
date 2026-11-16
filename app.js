(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const clone = o => JSON.parse(JSON.stringify(o));
const short = (s, n = 80) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n) + '…' : s; };

/* ---------------- Íconos ---------------- */
const IC = {
  webhook: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  schedule: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
  set: '<path d="M4 20l1-4.5L16 4.5l3.5 3.5L8.5 19z"/><path d="M14 6.5l3.5 3.5"/>',
  if: '<path d="M4 12h6M10 12l6-6h4M10 12l6 6h4"/>',
  router: '<path d="M4 12h5M9 12l6-7h5M9 12h11M9 12l6 7h5"/>',
  filter: '<path d="M4 5h16l-6.5 7.5V19l-3 1.5v-8z"/>',
  http: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17"/>',
  code: '<path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/>',
  split: '<path d="M4 12h5M9 12l7-6M9 12h7M9 12l7 6"/><circle cx="18.5" cy="6" r="1.5"/><circle cx="18.5" cy="12" r="1.5"/><circle cx="18.5" cy="18" r="1.5"/>',
  aggregate: '<path d="M20 12h-5M15 12L8 6M15 12H8M15 12l-7 6"/><circle cx="5.5" cy="6" r="1.5"/><circle cx="5.5" cy="12" r="1.5"/><circle cx="5.5" cy="18" r="1.5"/>',
  sheets: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 10h16M4 15h16M10 4v16"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4 7l8 6 8-6"/>',
  slack: '<path d="M5 6.5A2.5 2.5 0 017.5 4h9A2.5 2.5 0 0119 6.5v6a2.5 2.5 0 01-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 015 12.5z"/>',
  telegram: '<path d="M20.5 4L3.5 11l6 2.2L11.5 19l3-4 4 3z"/><path d="M9.5 13.2L20.5 4"/>',
  ai: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  crm: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>',
  task: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>',
  sheetsRead: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 10h16M10 4v16M13 15h4M15.5 13l2 2-2 2"/>',
  summarize: '<path d="M17 5H7l5 7-5 7h10"/>',
  sort: '<path d="M7 5v14M4 16l3 3 3-3M13 7h7M13 12h5M13 17h3"/>',
  limit: '<path d="M5 7h14M5 12h14"/><path d="M5 17h6" stroke-dasharray="2 3"/>',
  dedupe: '<rect x="4" y="4" width="11" height="11" rx="2"/><path d="M9 20h9a2 2 0 002-2V9"/>',
  arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  down: '<path d="M7 7l10 10M17 9v8H9"/>',
};
const svg = (k, cls = '') => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${IC[k] || IC.arrow}</svg>`;

/* ---------------- Operaciones genéricas del simulador ---------------- */
const TRIGGERS = ['webhook', 'schedule'];
const BRANCHING = ['if', 'router'];
const APPS = ['sheets', 'mail', 'slack', 'telegram'];
const DEF = {
  webhook: () => ({ path: '/mi-webhook', method: 'POST' }),
  schedule: () => ({ every: 'Todos los días', at: '09:00' }),
  set: () => ({ keep: true, fields: [{ name: '', value: '' }] }),
  filter: () => ({ cond: { left: '', op: 'eq', right: '' } }),
  if: () => ({ cond: { left: '', op: 'eq', right: '' } }),
  router: () => ({}),
  http: () => ({ method: 'GET', url: '', body: '' }),
  code: () => ({ mode: 'each', inputs: [], code: 'return { ...$json };' }),
  split: () => ({ field: '' }),
  aggregate: () => ({ field: 'items' }),
  sheets: () => ({ doc: '', sheet: '', columns: [{ name: '', value: '' }] }),
  mail: () => ({ to: '', subject: '', body: '' }),
  slack: () => ({ channel: '', text: '' }),
  telegram: () => ({ chatId: '', text: '' }),
  ai: () => ({ prompt: '' }),
  crm: () => ({ email: '', name: '', props: [] }),
  task: () => ({ list: '', title: '', description: '', due: '' }),
  sheetsRead: () => ({ doc: '', sheet: '' }),
  summarize: () => ({ fields: [{ name: '', value: 'sum' }], groupBy: '' }),
  sort: () => ({ field: '', dir: 'asc' }),
  limit: () => ({ max: '1' }),
  dedupe: () => ({ field: '' }),
};
const OPS = [['eq', 'es igual a'], ['neq', 'es distinto de'], ['contains', 'contiene'], ['ncontains', 'no contiene'], ['gt', 'es mayor que'], ['gte', 'es mayor o igual que'], ['lt', 'es menor que'], ['lte', 'es menor o igual que'], ['exists', 'existe'], ['empty', 'está vacío']];

/* ---------------- Plataformas ---------------- */
const P = {
  n8n: {
    name: 'n8n', tone: 'dark', layout: 'h', flow: 'workflow', node: 'nodo', run: 'Execute workflow', routerMode: 'first',
    tag: 'Workflows con nodos, self-hosted o en la nube',
    intro: 'n8n arma automatizaciones como un lienzo de nodos conectados. Podés usarlo en la nube o instalarlo en tu propio servidor, y cuando lo visual no alcanza, escribís JavaScript en un nodo Code.',
    cheat: ['<code>{{ $json.campo }}</code> lee un campo del nodo anterior.', '<code>{{ $(\'Nombre del nodo\').item.json.campo }}</code> lee un nodo anterior por su nombre.', 'Adentro de las llaves va JavaScript: <code>{{ $json.email.toLowerCase() }}</code>.'],
    cat: {
      webhook: ['Webhook', 'Triggers', 'Arranca cuando llega una petición HTTP a su URL.'],
      schedule: ['Schedule Trigger', 'Triggers', 'Arranca según un horario.'],
      set: ['Edit Fields (Set)', 'Datos', 'Agrega o cambia campos del item.'],
      code: ['Code', 'Datos', 'JavaScript propio sobre cada item.'],
      split: ['Split Out', 'Datos', 'Convierte una lista en un item por elemento.'],
      aggregate: ['Aggregate', 'Datos', 'Junta varios items en uno solo.'],
      if: ['If', 'Lógica', 'Separa los items en true y false.'],
      router: ['Switch', 'Lógica', 'Envía cada item a la primera salida que cumple.'],
      filter: ['Filter', 'Lógica', 'Deja pasar solo los items que cumplen.'],
      http: ['HTTP Request', 'Apps', 'Llama a cualquier API.'],
      sheets: ['Google Sheets · Append Row', 'Apps', 'Agrega una fila a una hoja.'],
      mail: ['Gmail · Send a message', 'Apps', 'Envía un email.'],
      slack: ['Slack · Send a message', 'Apps', 'Publica en un canal.'],
      telegram: ['Telegram · Send a text message', 'Apps', 'Envía un mensaje a un chat.'],
      sheetsRead: ['Google Sheets · Get Row(s)', 'Apps', 'Lee las filas de una hoja: un item por fila.'],
      crm: ['HubSpot · Create a contact', 'Apps', 'Crea un contacto en el CRM.'],
      task: ['Trello · Create a card', 'Apps', 'Crea una tarjeta en una lista.'],
      ai: ['OpenAI · Message a model', 'IA', 'Envía un prompt a un modelo y devuelve su respuesta en text.'],
      summarize: ['Summarize', 'Datos', 'Suma, cuenta o promedia, con agrupación opcional.'],
      sort: ['Sort', 'Datos', 'Ordena los items por un campo.'],
      limit: ['Limit', 'Datos', 'Deja pasar solo los primeros items.'],
      dedupe: ['Remove Duplicates', 'Datos', 'Quita los items repetidos según un campo.'],
    },
    lessons: [
      ['Workflows, nodos e items', [
        '<p>Un <b>workflow</b> es una cadena de <b>nodos</b>. El primero siempre es un <b>trigger</b>: define cuándo arranca (un Webhook, un horario, un evento de una app). Los demás son acciones o lógica.</p>',
        '<p>Entre nodos no viaja "un dato", viaja una <b>lista de items</b>. Cada item es un objeto JSON. Cada nodo se ejecuta una vez por cada item que recibe: si llegan 5 items a un nodo de Slack, se envían 5 mensajes.</p>',
        '<pre>[\n  { "json": { "nombre": "Ana", "total": 1500 } },\n  { "json": { "nombre": "Luis", "total": 300 } }\n]</pre>',
        '<ul><li><b>Credentials</b>: las claves de cada app se guardan aparte y se reutilizan entre workflows.</li><li><b>Executions</b>: el historial de cada corrida, con los datos de cada nodo.</li></ul>'
      ]],
      ['Expresiones y datos', [
        '<p>Para usar datos de un nodo anterior, escribís una <b>expresión</b> entre llaves dobles. Adentro va JavaScript.</p>',
        '<pre>{{ $json.email }}\n{{ $json.email.toLowerCase() }}\n{{ $(\'Webhook\').item.json.nombre }}\nHola {{ $json.nombre }}, tu total es ${{ $json.total }}</pre>',
        '<ul><li><code>$json</code> es el item que llega del nodo <b>inmediatamente anterior</b>.</li><li><code>$(\'Nombre\')</code> lee cualquier nodo anterior por su nombre. Hace falta cuando un nodo intermedio cambió los datos.</li><li>El nodo <b>Edit Fields (Set)</b> agrega o reemplaza campos; con "Include Other Input Fields" conserva los que ya venían.</li></ul>',
        '<p>Error típico: después de un nodo de app, <code>$json</code> ya es la respuesta de esa app y no tu dato original.</p>'
      ]],
      ['Lógica: If, Switch y Filter', [
        '<ul><li><b>If</b>: una condición, dos salidas (true y false). Cada item va por una.</li><li><b>Switch</b>: varias salidas; cada item va por la primera regla que cumple.</li><li><b>Filter</b>: una sola salida; los items que no cumplen se descartan.</li></ul>',
        '<p>Para trabajar con listas: <b>Split Out</b> convierte un arreglo en un item por elemento, y <b>Aggregate</b> hace lo contrario.</p>',
        '<p>Cuidado con los tipos: <code>"1500" &gt; 1000</code> compara texto con número. Convertí con <code>Number()</code> si el dato llega como texto.</p>'
      ]],
      ['Probar, activar y manejar errores', [
        '<ul><li>El Webhook tiene dos URLs: la de <b>test</b> (solo mientras ejecutás a mano) y la de <b>producción</b> (cuando el workflow está activo).</li><li><b>Pin data</b> fija la salida de un nodo para probar el resto sin volver a dispararlo.</li><li>Un workflow con <b>Error Trigger</b> puede avisarte cuando otro falla.</li><li>En cada nodo: <b>Retry On Fail</b> reintenta, y <b>On Error</b> decide si se detiene o continúa.</li></ul>',
        '<p>Buenas prácticas: nombrá los nodos por lo que hacen, guardá las claves solo en Credentials y probá cada nodo antes de agregar el siguiente.</p>'
      ]],
    ],
    quiz: [
      ['¿Qué viaja entre dos nodos de n8n?', ['Una lista de items, cada uno con su JSON', 'Un único texto', 'Solo el último campo modificado', 'Un archivo CSV'], 'Cada nodo se ejecuta una vez por item recibido.'],
      ['¿Qué devuelve {{ $json.email }}?', ['El campo email del item que llega del nodo anterior', 'El email del dueño del workflow', 'El email del primer nodo, siempre', 'Un error: falta $node'], '$json es el item de entrada del nodo actual.'],
      ['Llegan 4 items a un nodo de Slack. ¿Cuántos mensajes se envían?', ['4', '1', 'Ninguno hasta usar Aggregate', 'Depende del plan'], 'Los nodos corren una vez por item.'],
      ['¿Qué diferencia hay entre If y Filter?', ['If tiene dos salidas; Filter descarta lo que no cumple', 'Son iguales', 'Filter tiene dos salidas e If una', 'If solo funciona con números'], 'Con If podés hacer algo distinto con los que no cumplen.'],
      ['¿Para qué sirve la URL de test del Webhook?', ['Para recibir datos mientras ejecutás el workflow a mano', 'Para producción', 'Para ver las credenciales', 'Para exportar el workflow'], 'La de producción funciona cuando el workflow está activo.'],
    ],
  },
  make: {
    name: 'Make', tone: 'sky', layout: 'h', flow: 'escenario', node: 'módulo', run: 'Run once', routerMode: 'all',
    tag: 'Escenarios visuales con módulos y rutas',
    intro: 'Make (antes Integromat) arma escenarios como una cadena de módulos circulares. Se destaca por su mapeo visual de datos, el Router con filtros y el control fino de errores.',
    cheat: ['<code>{{1.campo}}</code> lee un campo de la salida del módulo 1.', 'Hay funciones: <code>{{lower(1.email)}}</code>, <code>{{upper(1.nombre)}}</code>, <code>{{trim(1.texto)}}</code>, <code>{{if(1.total &gt; 1000; "alto"; "bajo")}}</code> (acá usá coma).', 'El número es el que aparece en la burbuja de cada módulo.'],
    cat: {
      webhook: ['Webhooks · Custom webhook', 'Triggers', 'Arranca cuando llega una petición a la URL.'],
      schedule: ['Programación del escenario', 'Triggers', 'Arranca según el horario del escenario.'],
      set: ['Tools · Set multiple variables', 'Datos', 'Define variables para usar después.'],
      split: ['Iterator', 'Datos', 'Convierte un arreglo en un bundle por elemento.'],
      aggregate: ['Array aggregator', 'Datos', 'Junta varios bundles en un arreglo.'],
      router: ['Router', 'Lógica', 'Divide el flujo en rutas, cada una con su filtro.'],
      filter: ['Filtro (entre módulos)', 'Lógica', 'Deja pasar solo los bundles que cumplen.'],
      http: ['HTTP · Make a request', 'Apps', 'Llama a cualquier API.'],
      sheets: ['Google Sheets · Add a Row', 'Apps', 'Agrega una fila a una hoja.'],
      mail: ['Email · Send an Email', 'Apps', 'Envía un email.'],
      slack: ['Slack · Create a Message', 'Apps', 'Publica en un canal.'],
      telegram: ['Telegram Bot · Send a Text Message', 'Apps', 'Envía un mensaje a un chat.'],
      sheetsRead: ['Google Sheets · Search Rows', 'Apps', 'Lee las filas de una hoja: un bundle por fila.'],
      crm: ['HubSpot CRM · Create a Contact', 'Apps', 'Crea un contacto en el CRM.'],
      task: ['Trello · Create a Card', 'Apps', 'Crea una tarjeta en una lista.'],
      ai: ['OpenAI · Create a Completion', 'IA', 'Envía un prompt a un modelo y devuelve su respuesta en text.'],
    },
    lessons: [
      ['Escenarios, módulos y bundles', [
        '<p>Un <b>escenario</b> es una cadena de <b>módulos</b>. El primero es el trigger. Hay triggers <b>instantáneos</b> (webhooks: arrancan apenas llega el dato) y <b>programados</b> (revisan cada cierto tiempo si hay algo nuevo).</p>',
        '<p>Cada módulo entrega <b>bundles</b>: paquetes de datos. Si un módulo entrega 3 bundles, los módulos siguientes se ejecutan 3 veces.</p>',
        '<p>Cada ejecución de un módulo consume crédito de tu plan (Make las llamó históricamente <b>operaciones</b>). Por eso conviene filtrar temprano: lo que no pasa un filtro no gasta en los módulos siguientes.</p>'
      ]],
      ['Mapeo y funciones', [
        '<p>Al hacer clic en un campo se abre el panel de mapeo, con las salidas de los módulos anteriores. Cada dato se identifica con el número del módulo.</p>',
        '<pre>{{1.email}}\n{{lower(1.email)}}\nNuevo lead: {{1.nombre}} ({{2.email}})</pre>',
        '<ul><li>Funciones de texto: <code>lower</code>, <code>upper</code>, <code>trim</code>, <code>length</code>.</li><li>Generales: <code>if(condición; valor si; valor no)</code>.</li><li><b>Set multiple variables</b> guarda valores calculados para reutilizarlos más adelante.</li></ul>',
        '<p>En Make real los argumentos de las funciones se separan con punto y coma. En este simulador usá coma.</p>'
      ]],
      ['Router, filtros, Iterator y Aggregator', [
        '<ul><li><b>Router</b>: abre varias rutas. Cada ruta tiene un <b>filtro</b>; el bundle sigue por todas las rutas cuyo filtro cumple. La <b>ruta de respaldo</b> (fallback) se usa solo si ninguna otra cumple.</li><li><b>Filtro</b>: se configura en la línea entre dos módulos.</li><li><b>Iterator</b>: toma un arreglo y entrega un bundle por elemento.</li><li><b>Array aggregator</b>: junta los bundles de nuevo en un arreglo.</li></ul>',
        '<p>Patrón frecuente: HTTP trae una lista → Iterator → filtro → acción por cada elemento.</p>'
      ]],
      ['Ejecución y manejo de errores', [
        '<ul><li><b>Run once</b> ejecuta el escenario una vez para probarlo y muestra una burbuja con los datos de cada módulo.</li><li>Un webhook necesita recibir un dato de ejemplo para "aprender" la estructura.</li><li>El escenario corre solo cuando lo activás (ON) y definís su programación.</li></ul>',
        '<p>Cada módulo puede tener una ruta de error con una directiva: <b>Ignore</b> (seguir), <b>Resume</b> (seguir con un valor de reemplazo), <b>Break</b> (guardar para reintentar), <b>Rollback</b> (deshacer) o <b>Commit</b> (terminar guardando lo hecho).</p>'
      ]],
    ],
    quiz: [
      ['¿Qué es un bundle?', ['Un paquete de datos que entrega un módulo', 'Un grupo de escenarios', 'Una credencial', 'Un tipo de webhook'], 'Los módulos siguientes se ejecutan una vez por bundle.'],
      ['¿Qué significa {{2.email}}?', ['El campo email de la salida del módulo 2', 'El segundo email de una lista', 'El email multiplicado por 2', 'Un error de sintaxis'], 'El número identifica al módulo de origen.'],
      ['En un Router, ¿cuándo se usa la ruta de respaldo?', ['Solo cuando ningún otro filtro cumple', 'Siempre, además de las otras', 'Nunca en producción', 'Cuando hay un error'], 'Es el "si no" del Router.'],
      ['¿Qué hace el Iterator?', ['Entrega un bundle por cada elemento de un arreglo', 'Junta bundles en un arreglo', 'Repite el escenario cada minuto', 'Filtra por condición'], 'El Array aggregator hace lo contrario.'],
      ['¿Por qué conviene filtrar temprano?', ['Porque lo que no pasa el filtro no consume en los módulos siguientes', 'Porque los filtros son gratis siempre', 'Porque Make lo exige', 'No conviene'], 'Menos ejecuciones de módulos, menos consumo.'],
    ],
  },
  zapier: {
    name: 'Zapier', tone: 'white', layout: 'v', flow: 'Zap', node: 'paso', run: 'Test Zap', routerMode: 'all',
    tag: 'Zaps paso a paso, con miles de apps',
    intro: 'Zapier es la forma más directa de conectar apps: un Zap es un trigger seguido de acciones, de arriba hacia abajo. Tiene el catálogo de integraciones más grande y casi no requiere conocimientos técnicos.',
    cheat: ['<code>{{1.campo}}</code> representa un campo del paso 1 (en Zapier lo elegís de una lista).', 'Formatter acepta funciones: <code>{{lower(1.email)}}</code>, <code>{{upper(1.nombre)}}</code>, <code>{{trim(1.texto)}}</code>.', 'El número es el del paso en el Zap.'],
    cat: {
      webhook: ['Webhooks by Zapier · Catch Hook', 'Triggers', 'Arranca cuando llega una petición a la URL.'],
      schedule: ['Schedule by Zapier', 'Triggers', 'Arranca cada día, semana u hora.'],
      set: ['Formatter by Zapier', 'Datos', 'Transforma texto, números y fechas.'],
      code: ['Code by Zapier', 'Datos', 'JavaScript propio.'],
      split: ['Looping by Zapier', 'Datos', 'Repite los pasos siguientes por cada elemento.'],
      router: ['Paths', 'Lógica', 'Divide el Zap en caminos con reglas.'],
      filter: ['Filter by Zapier', 'Lógica', 'El Zap sigue solo si se cumple la condición.'],
      http: ['Webhooks by Zapier · GET/POST', 'Apps', 'Llama a cualquier API.'],
      sheets: ['Google Sheets · Create Spreadsheet Row', 'Apps', 'Agrega una fila a una hoja.'],
      mail: ['Gmail · Send Email', 'Apps', 'Envía un email.'],
      slack: ['Slack · Send Channel Message', 'Apps', 'Publica en un canal.'],
      telegram: ['Telegram · Send Message', 'Apps', 'Envía un mensaje a un chat.'],
      sheetsRead: ['Google Sheets · Get Many Spreadsheet Rows', 'Apps', 'Trae varias filas en una lista llamada rows.'],
      crm: ['HubSpot · Create Contact', 'Apps', 'Crea un contacto en el CRM.'],
      task: ['Trello · Create Card', 'Apps', 'Crea una tarjeta en una lista.'],
      ai: ['AI by Zapier', 'IA', 'Envía un prompt a un modelo y devuelve su respuesta en text.'],
    },
    lessons: [
      ['Zaps: trigger y acciones', [
        '<p>Un <b>Zap</b> tiene un <b>trigger</b> (el evento que lo dispara) y una o más <b>acciones</b>, en orden. Se lee de arriba hacia abajo.</p>',
        '<ul><li>Triggers <b>instantáneos</b>: la app avisa apenas ocurre el evento.</li><li>Triggers por <b>polling</b>: Zapier revisa cada tantos minutos, según tu plan.</li></ul>',
        '<p>Cada paso se <b>prueba</b> por separado con un registro de ejemplo antes de publicar el Zap.</p>'
      ]],
      ['Mapear campos y Formatter', [
        '<p>En cada campo de una acción elegís datos de pasos anteriores desde una lista. Zapier los muestra como etiquetas con el número del paso.</p>',
        '<pre>Nuevo lead: {{1.nombre}} ({{2.email}})</pre>',
        '<p><b>Formatter by Zapier</b> transforma datos sin código: mayúsculas y minúsculas, recortar espacios, formatear fechas y números, o buscar un valor en una tabla.</p>',
        '<p>Para lógica más compleja está <b>Code by Zapier</b> (JavaScript o Python).</p>'
      ]],
      ['Filter, Paths y Looping', [
        '<ul><li><b>Filter</b>: si la condición no se cumple, el Zap se detiene ahí.</li><li><b>Paths</b>: divide el Zap en caminos; cada uno tiene reglas y sus propias acciones. Se ejecutan todos los caminos cuyas reglas se cumplen, y hay un camino de respaldo opcional.</li><li><b>Looping</b>: repite los pasos siguientes por cada valor de una lista.</li></ul>',
        '<p>Regla práctica: usá Filter para "seguir o no seguir" y Paths para "hacer cosas distintas según el caso".</p>'
      ]],
      ['Tasks, historial y buenas prácticas', [
        '<p>Zapier cobra por <b>tasks</b>: cada acción que se completa con éxito cuenta una. El trigger y los filtros que detienen el Zap no cuentan.</p>',
        '<ul><li><b>Zap History</b> muestra cada ejecución, los datos de cada paso y permite reintentar las fallidas.</li><li>Poné el Filter lo más arriba posible para no gastar tasks de más.</li><li>Nombrá los Zaps y los pasos de forma clara, y agrupalos en carpetas.</li></ul>'
      ]],
    ],
    quiz: [
      ['¿De qué se compone un Zap?', ['Un trigger y una o más acciones', 'Solo acciones', 'Dos triggers', 'Un trigger sin acciones'], 'El trigger dispara y las acciones se ejecutan en orden.'],
      ['¿Qué cuenta como task?', ['Cada acción completada con éxito', 'Cada vez que se dispara el trigger', 'Cada filtro evaluado', 'Cada Zap creado'], 'Los triggers y los filtros que detienen el Zap no consumen tasks.'],
      ['¿Qué pasa si un Filter no se cumple?', ['El Zap se detiene en ese paso', 'Se salta el filtro y sigue', 'Se borra el Zap', 'Se ejecuta el camino B'], 'Para hacer algo distinto en cada caso se usa Paths.'],
      ['¿Para qué sirve Formatter?', ['Para transformar texto, números y fechas sin código', 'Para enviar emails', 'Para crear webhooks', 'Para pagar el plan'], 'Por ejemplo, pasar un email a minúsculas.'],
      ['¿Qué hace Looping by Zapier?', ['Repite los pasos siguientes por cada valor de una lista', 'Reinicia el Zap cada hora', 'Une dos Zaps', 'Filtra duplicados'], 'Es el equivalente a iterar una lista.'],
    ],
  },
};
// SAP CPI tiene su propio taller (editor BPMN y simulador de iFlows) en una página aparte
const SAP = { href: 'sap-cpi/index.html', scenarios: 11, practice: 9, quizzes: 20 };
const SOON = [
  ['Power Automate', 'Flujos de Microsoft integrados con Office 365, Teams y SharePoint.'],
  ['Activepieces', 'Alternativa open source con flujos visuales y piezas propias.'],
];

/* ---------------- Proyectos (tres escenarios, adaptados a cada plataforma) ---------------- */
const N = (op, name, p = {}, branches) => ({ id: uid(), op, name, p: { ...DEF[op](), ...p }, ...(branches ? { branches } : {}) });
const col = (name, value) => ({ name, value });
const callsOf = (r, app) => r.calls.filter(c => c.app === app);
const PRODUCTS = { productos: [{ sku: 'A1', nombre: 'Mate imperial', stock: 2 }, { sku: 'B2', nombre: 'Bombilla alpaca', stock: 14 }, { sku: 'C3', nombre: 'Termo 1L', stock: 0 }, { sku: 'D4', nombre: 'Yerba 1kg', stock: 30 }] };
const FULL = { productos: [{ sku: 'A1', nombre: 'Mate imperial', stock: 20 }, { sku: 'B2', nombre: 'Bombilla alpaca', stock: 14 }] };

function projects(pf) {
  const p = P[pf], c = p.cat, n8 = pf === 'n8n';
  const j = f => n8 ? `{{ $json.${f} }}` : `{{1.${f}}}`;
  const stockApp = pf === 'zapier' ? 'slack' : 'telegram';
  const stockDest = pf === 'zapier' ? '#stock' : '-100200300';
  return [
    {
      id: 'lead', level: 'Inicial', title: 'Lead del formulario a una hoja y aviso',
      story: 'Cada vez que alguien completa el formulario de la web, el lead tiene que quedar en la hoja "Leads" con el email en minúsculas, y el equipo tiene que enterarse por Slack.',
      reqs: [
        `Trigger: <b>${c.webhook[0]}</b>.`,
        `<b>${c.set[0]}</b>: campo <code>email</code> en minúsculas. ${n8 ? 'Usá <code>{{ $json.email.toLowerCase() }}</code> y conservá los demás campos.' : 'Usá <code>{{lower(1.email)}}</code>.'}`,
        `<b>${c.sheets[0]}</b> en la hoja <code>Leads</code> con las columnas <code>Nombre</code>, <code>Email</code> e <code>Interes</code>.`,
        `<b>${c.slack[0]}</b> al canal <code>#leads</code> con el texto <code>Nuevo lead: NOMBRE (EMAIL)</code>.`,
      ],
      hints: [n8 ? 'Después de Google Sheets, $json es la fila creada: sus campos se llaman como las columnas (Nombre, Email).' : 'El email en minúsculas sale del paso 2; el nombre y el interés siguen estando en el paso 1.', 'Si un campo sale vacío, revisá en el resultado de la ejecución qué entrega cada paso.'],
      sample: [{ nombre: 'Ana Pérez', email: 'ANA@MAIL.COM', interes: 'Automatización', origen: 'landing' }],
      checks: [['Empieza con un webhook', f => f.steps[0]?.op === 'webhook'], ['Tiene un paso que transforma el email', f => has(f, 'set') || has(f, 'code')]],
      tests: [['Lead de Ana', [{ nombre: 'Ana Pérez', email: 'ANA@MAIL.COM', interes: 'Automatización', origen: 'landing' }]], ['Lead de Bruno', [{ nombre: 'Bruno Díaz', email: 'Bruno.Diaz@Empresa.COM', interes: 'CRM', origen: 'ads' }]]].map(([name, input]) => ({ name, input, expect: r => {
        const i = input[0], em = i.email.toLowerCase();
        const s = callsOf(r, 'sheets')[0]; if (!s) return 'No se agregó ninguna fila en Google Sheets.';
        if (String(s.params.sheet).trim() !== 'Leads') return `La hoja es «${s.params.sheet}»; tiene que ser Leads.`;
        const v = s.params.values;
        if (v.Nombre !== i.nombre) return `La columna Nombre vale «${v.Nombre ?? ''}»; se esperaba «${i.nombre}».`;
        if (v.Email !== em) return `La columna Email vale «${v.Email ?? ''}»; se esperaba «${em}».`;
        if (v.Interes !== i.interes) return `La columna Interes vale «${v.Interes ?? ''}»; se esperaba «${i.interes}».`;
        const k = callsOf(r, 'slack')[0]; if (!k) return 'No se envió el mensaje de Slack.';
        if (String(k.params.channel).trim() !== '#leads') return `El canal es «${k.params.channel}»; tiene que ser #leads.`;
        return k.params.text === `Nuevo lead: ${i.nombre} (${em})` || `El mensaje fue «${k.params.text}»; se esperaba «Nuevo lead: ${i.nombre} (${em})».`;
      } })),
      solution: () => ({ steps: [
        N('webhook', 'Formulario web', { path: '/lead' }),
        N('set', 'Normalizar email', { keep: n8, fields: [col('email', n8 ? '{{ $json.email.toLowerCase() }}' : '{{lower(1.email)}}')] }),
        N('sheets', 'Guardar lead', { doc: 'CRM', sheet: 'Leads', columns: [col('Nombre', n8 ? '{{ $json.nombre }}' : '{{1.nombre}}'), col('Email', n8 ? '{{ $json.email }}' : '{{2.email}}'), col('Interes', n8 ? '{{ $json.interes }}' : '{{1.interes}}')] }),
        N('slack', 'Avisar al equipo', { channel: '#leads', text: n8 ? 'Nuevo lead: {{ $json.Nombre }} ({{ $json.Email }})' : 'Nuevo lead: {{1.nombre}} ({{2.email}})' }),
      ] }),
    },
    {
      id: 'pedidos', level: 'Intermedio', title: 'Clasificar pedidos por monto',
      story: 'Los pedidos de más de $1000 tienen que avisarse al equipo de ventas en Slack. Los demás reciben un email de confirmación automático.',
      reqs: [
        `Trigger: <b>${c.webhook[0]}</b>.`,
        n8 ? `<b>${c.if[0]}</b> con la condición <code>{{ $json.total }}</code> es mayor que <code>1000</code>.` : `<b>${c.router[0]}</b> con dos ${pf === 'make' ? 'rutas' : 'caminos'}: uno con la condición <code>{{1.total}}</code> es mayor que <code>1000</code> y otro de respaldo.`,
        `Si es mayor: <b>${c.slack[0]}</b> al canal <code>#ventas-grandes</code>, con el número de pedido y el cliente en el texto.`,
        `Si no: <b>${c.mail[0]}</b> al <code>email</code> del pedido, con el número de pedido en el asunto.`,
      ],
      hints: ['Un pedido de exactamente 1000 no es "mayor que 1000": va por el camino del email.', n8 ? 'El If termina la cadena principal: agregá los pasos dentro de cada rama.' : 'Marcá uno de los caminos como respaldo para que reciba todo lo que no cumple la condición.'],
      sample: [{ pedido: 'P-1001', cliente: 'ACME', total: 1500, email: 'compras@acme.example' }],
      checks: [['Empieza con un webhook', f => f.steps[0]?.op === 'webhook'], ['Tiene una bifurcación', f => has(f, 'if') || has(f, 'router')]],
      tests: [['Pedido de $1500', 1500, true], ['Pedido de $300', 300, false], ['Pedido de $1000 exactos', 1000, false]].map(([name, total, big]) => ({ name, input: [{ pedido: 'P-' + total, cliente: 'ACME', total, email: 'compras@acme.example' }], expect: r => {
        const s = callsOf(r, 'slack'), m = callsOf(r, 'mail');
        if (big) {
          if (m.length) return 'Un pedido grande no tiene que enviar el email.';
          if (s.length !== 1) return 'Se esperaba un mensaje de Slack.';
          if (String(s[0].params.channel).trim() !== '#ventas-grandes') return `El canal es «${s[0].params.channel}»; tiene que ser #ventas-grandes.`;
          return (s[0].params.text.includes('P-' + total) && s[0].params.text.includes('ACME')) || `El texto «${s[0].params.text}» tiene que incluir el pedido y el cliente.`;
        }
        if (s.length) return 'Un pedido chico no tiene que avisar por Slack.';
        if (m.length !== 1) return 'Se esperaba un email de confirmación.';
        if (m[0].params.to !== 'compras@acme.example') return `El email fue a «${m[0].params.to}»; tiene que ir al email del pedido.`;
        return m[0].params.subject.includes('P-' + total) || `El asunto «${m[0].params.subject}» tiene que incluir el número de pedido.`;
      } })),
      solution: () => {
        const sl = N('slack', 'Avisar a ventas', { channel: '#ventas-grandes', text: `Pedido grande ${j('pedido')} de ${j('cliente')}: $${j('total')}` });
        const ml = N('mail', 'Confirmar al cliente', { to: j('email'), subject: `Recibimos tu pedido ${j('pedido')}`, body: `Gracias, ${j('cliente')}.` });
        const cond = { left: j('total'), op: 'gt', right: '1000' };
        return { steps: [N('webhook', 'Nuevo pedido', { path: '/pedidos' }), n8
          ? N('if', '¿Pedido grande?', { cond }, [{ name: 'true', steps: [sl] }, { name: 'false', steps: [ml] }])
          : N('router', 'Por monto', {}, [{ name: 'Grandes', cond, steps: [sl] }, { name: 'Resto', fallback: true, cond: { left: '', op: 'eq', right: '' }, steps: [ml] }])] };
      },
    },
    {
      id: 'stock', level: 'Avanzado', title: 'Consultar una API y avisar el stock bajo',
      story: 'Todos los días a las 9, el flujo consulta la API de la tienda y avisa por cada producto que tenga menos de 5 unidades.',
      reqs: [
        `Trigger: <b>${c.schedule[0]}</b>.`,
        `<b>${c.http[0]}</b>: GET a <code>https://api.tienda-demo.example/productos</code>.`,
        `<b>${c.split[0]}</b> sobre la lista <code>productos</code>${n8 ? '' : ' (<code>{{2.productos}}</code>)'}.`,
        `<b>${c.filter[0]}</b>: stock menor que <code>5</code>.`,
        `<b>${c[stockApp][0]}</b> a <code>${stockDest}</code> con el texto <code>Stock bajo: NOMBRE (STOCK)</code>.`,
      ],
      mock: 'La API responde: ' + JSON.stringify(PRODUCTS),
      hints: [n8 ? 'En Split Out va el nombre del campo que tiene la lista: productos.' : 'Después del paso 3, cada producto se lee como {{3.nombre}} y {{3.stock}}.', 'Si no hay productos con stock bajo, no se envía ningún mensaje: es el comportamiento correcto.'],
      sample: [{}], http: () => PRODUCTS,
      checks: [['Empieza con un trigger programado', f => f.steps[0]?.op === 'schedule'], ['Llama a la API de productos', f => all(f).some(n => n.op === 'http' && /api\.tienda-demo\.example\/productos\/?$/.test(n.p.url.trim()))]],
      tests: [
        { name: 'Dos productos con stock bajo', input: [{}], http: () => PRODUCTS, expect: r => { const t = callsOf(r, stockApp).map(x => x.params.text).sort().join(' | '); const ex = 'Stock bajo: Mate imperial (2) | Stock bajo: Termo 1L (0)'; if (t !== ex) return `Los avisos fueron «${t || 'ninguno'}»; se esperaba «${ex}».`; const d = callsOf(r, stockApp)[0].params; return String(d.channel ?? d.chatId).trim() === stockDest || `El destino tiene que ser ${stockDest}.`; } },
        { name: 'Todo con stock suficiente', input: [{}], http: () => FULL, expect: r => callsOf(r, stockApp).length === 0 || 'Con todo en stock no hay que enviar avisos.' },
      ],
      solution: () => ({ steps: [
        N('schedule', 'Cada día 9:00'), N('http', 'Traer productos', { method: 'GET', url: 'https://api.tienda-demo.example/productos' }),
        N('split', 'Por producto', { field: n8 ? 'productos' : '{{2.productos}}' }),
        N('filter', 'Stock bajo', { cond: { left: n8 ? '{{ $json.stock }}' : '{{3.stock}}', op: 'lt', right: '5' } }),
        N(stockApp, 'Avisar', { [stockApp === 'slack' ? 'channel' : 'chatId']: stockDest, text: n8 ? 'Stock bajo: {{ $json.nombre }} ({{ $json.stock }})' : 'Stock bajo: {{3.nombre}} ({{3.stock}})' }),
      ] }),
    },
  ];
}
const PROJ = { n8n: projects('n8n'), make: projects('make'), zapier: projects('zapier') };

/* ---------------- Proyectos por tema (n8n y Zapier) ---------------- */
Object.values(PROJ).forEach(list => list.forEach(j => { j.cat = 'Primeros pasos'; }));
const DEMO = 'empresa-demo.example';
const sameMail = r => callsOf(r, 'mail');
const ENRICH = { 'acme-logistica.example': { empresa: 'ACME Logística', industria: 'Transporte', empleados: 340 }, 'verde-sa.example': { empresa: 'Verde SA', industria: 'Agro', empleados: 45 } };
const enrichApi = ({ url }) => { const m = String(url).match(/[?&]dominio=([^&\s]+)/); if (!m) throw new Error('400: falta el parámetro dominio en la URL'); return ENRICH[m[1]] || { empresa: null, industria: null, empleados: null }; };
const TICKETS = [['T-501', 'Laura Gil', 'Me cobraron dos veces la factura de octubre.', 'facturacion'], ['T-502', 'Iván Sosa', 'La app se cierra sola cuando abro el panel.', 'tecnico'], ['T-503', 'Mora Paz', '¿Tienen local en Rosario?', 'otro']];
const ticketAi = p => (TICKETS.find(t => p.includes(t[2])) || [])[3] || 'otro';
const mailAi = p => { const n = p.match(/soy ([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+ [A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/), q = p.match(/(\d+) unidades de ([^.\n]+?)(?= para|\.|$)/m); return JSON.stringify(n && q ? { cliente: n[1], producto: q[2].trim(), cantidad: q[1] } : { cliente: '', producto: '', cantidad: '' }); };
const VENTAS_A = [['Norte', 1200, 'pagado'], ['Norte', 3000, 'pagado'], ['Sur', 2500, 'pagado'], ['Sur', 900, 'pendiente'], ['Centro', 5000, 'pendiente']].map(([region, monto, estado], i) => ({ fecha: `2026-11-0${i + 1}`, region, monto, estado }));
const VENTAS_B = [['Norte', 800, 'pagado'], ['Sur', 2600, 'pagado'], ['Sur', 1900, 'pagado'], ['Centro', 4000, 'pagado'], ['Centro', 9000, 'anulado']].map(([region, monto, estado], i) => ({ fecha: `2026-11-1${i}`, region, monto, estado }));
const HOY_A = [['Ana', 1500], ['Luis', 900], ['Ana', 2000], ['Rita', 800]].map(([vendedor, monto]) => ({ vendedor, monto }));
const HOY_B = [['Luis', 3000], ['Rita', 3500]].map(([vendedor, monto]) => ({ vendedor, monto }));
const jsonCt = v => /^application\/json$/i.test(String(v || ''));
const ref = (node, f) => `{{ $('${node}').item.json.${f} }}`;

PROJ.n8n.push(
  {
    id: 'scoring', cat: 'Leads', level: 'Intermedio', title: 'Lead scoring con Code y CRM',
    story: 'Ventas pierde tiempo con leads que no califican. El workflow tiene que puntuar cada lead, cargar en el CRM solo los calientes y mandar a los demás un email de seguimiento.',
    objectives: ['Escribir lógica propia en un nodo Code (Run Once for Each Item).', 'Bifurcar con If según un campo calculado.', 'Leer datos de un nodo anterior por su nombre.'],
    reqs: [
      'Trigger: <b>Webhook</b>.',
      '<b>Code</b> que agregue <code>score</code> y <code>segmento</code>: +40 si <code>empleados</code> ≥ 50, +40 si <code>presupuesto</code> ≥ 5000, +20 si <code>origen</code> es <code>referido</code>. <code>segmento</code> es <code>caliente</code> con score ≥ 60 y <code>frio</code> si no.',
      '<b>If</b>: <code>{{ $json.segmento }}</code> es igual a <code>caliente</code>.',
      'true: <b>HubSpot · Create a contact</b> (email, nombre y la propiedad <code>score</code>) y <b>Slack</b> a <code>#ventas</code>: <code>Lead caliente: NOMBRE de EMPRESA (score N)</code>.',
      'false: <b>Gmail</b> al email del lead con asunto <code>Gracias por tu interés, NOMBRE</code>.',
    ],
    hints: ['En el Code, devolvé el item completo más los campos nuevos: return { ...$json, score, segmento }.', 'Después de HubSpot, $json es el contacto creado. Para el Slack leé el nodo Code por su nombre: {{ $(\'Nombre del nodo\').item.json.empresa }}.'],
    real: ['El Webhook se prueba con la URL de test mientras ejecutás a mano.', 'HubSpot, Slack y Gmail necesitan una credencial cada uno (Credentials).', 'En un caso real, las reglas del score conviene acordarlas con el equipo de ventas y revisarlas cada tanto.'],
    sample: [{ nombre: 'Carla Soto', email: 'carla@industrias-sur.example', empresa: 'Industrias Sur', empleados: 120, presupuesto: 8000, origen: 'referido' }],
    checks: [['Usa un nodo Code', f => has(f, 'code')], ['Bifurca con If', f => has(f, 'if')]],
    tests: [
      [{ nombre: 'Carla Soto', email: 'carla@industrias-sur.example', empresa: 'Industrias Sur', empleados: 120, presupuesto: 8000, origen: 'referido' }, 100],
      [{ nombre: 'Tomás Vera', email: 'tomas@kiosco.example', empresa: 'Kiosco Vera', empleados: 3, presupuesto: 6000, origen: 'ads' }, 40],
      [{ nombre: 'Elsa Ruiz', email: 'elsa@textil-rosario.example', empresa: 'Textil Rosario', empleados: 60, presupuesto: 1000, origen: 'referido' }, 60],
    ].map(([i, score]) => ({ name: `${i.nombre}: score ${score}`, input: [i], expect: r => {
      const c = callsOf(r, 'crm'), s = callsOf(r, 'slack'), m = sameMail(r);
      if (score >= 60) {
        if (m.length) return 'Un lead caliente no recibe el email de seguimiento.';
        if (c.length !== 1) return 'Se esperaba un contacto creado en HubSpot.';
        if (c[0].params.email !== i.email) return `El contacto se creó con el email «${c[0].params.email}».`;
        if (String(c[0].params.props.score) !== String(score)) return `La propiedad score vale «${c[0].params.props.score ?? ''}»; se esperaba ${score}.`;
        if (!s.length || String(s[0].params.channel).trim() !== '#ventas') return 'Falta el aviso en #ventas.';
        const ex = `Lead caliente: ${i.nombre} de ${i.empresa} (score ${score})`;
        return s[0].params.text === ex || `El mensaje fue «${s[0].params.text}»; se esperaba «${ex}».`;
      }
      if (c.length || s.length) return 'Un lead frío no va al CRM ni a Slack.';
      if (m.length !== 1 || m[0].params.to !== i.email) return 'Se esperaba un email al lead.';
      return m[0].params.subject === `Gracias por tu interés, ${i.nombre}` || `El asunto fue «${m[0].params.subject}».`;
    } })),
    solution: () => ({ steps: [
      N('webhook', 'Webhook', { path: '/leads' }),
      N('code', 'Calcular score', { mode: 'each', code: "let score = 0;\nif ($json.empleados >= 50) score += 40;\nif ($json.presupuesto >= 5000) score += 40;\nif ($json.origen === 'referido') score += 20;\nreturn { ...$json, score, segmento: score >= 60 ? 'caliente' : 'frio' };" }),
      N('if', '¿Caliente?', { cond: { left: '{{ $json.segmento }}', op: 'eq', right: 'caliente' } }, [
        { name: 'true', steps: [N('crm', 'Crear contacto', { email: '{{ $json.email }}', name: '{{ $json.nombre }}', props: [col('score', '{{ $json.score }}')] }), N('slack', 'Avisar a ventas', { channel: '#ventas', text: `Lead caliente: ${ref('Calcular score', 'nombre')} de ${ref('Calcular score', 'empresa')} (score ${ref('Calcular score', 'score')})` })] },
        { name: 'false', steps: [N('mail', 'Email de seguimiento', { to: '{{ $json.email }}', subject: 'Gracias por tu interés, {{ $json.nombre }}', body: 'Te vamos a escribir con novedades.' })] },
      ]),
    ] }),
  },
  {
    id: 'enriquecer', cat: 'Conexión con servicios', level: 'Intermedio', title: 'Enriquecer un lead con una API',
    story: 'El formulario solo pide nombre y email. Antes de guardar el lead, el workflow consulta una API con el dominio del email para sumar la empresa y la industria.',
    objectives: ['Armar una URL dinámica en HTTP Request.', 'Entender que, después de una llamada, $json es la respuesta de la API.', 'Combinar datos de dos nodos con Edit Fields.'],
    reqs: [
      'Trigger: <b>Webhook</b>.',
      '<b>HTTP Request</b>: GET a <code>https://api.enriquecer-demo.example/empresa?dominio=</code> seguido del dominio del email: <code>{{ $json.email.split(\'@\')[1] }}</code>.',
      '<b>Edit Fields (Set)</b>: conservá la respuesta y agregá <code>nombre</code> y <code>email</code> leyéndolos del Webhook.',
      '<b>Google Sheets · Append Row</b> en la hoja <code>Leads enriquecidos</code>: columnas <code>Nombre</code>, <code>Email</code>, <code>Empresa</code> e <code>Industria</code>.',
    ],
    mock: 'La API responde, por ejemplo: {"empresa":"ACME Logística","industria":"Transporte","empleados":340}',
    hints: ['El nombre y el email ya no están en $json después del HTTP Request: usá {{ $(\'Webhook\').item.json.nombre }}.', 'Ejecutá y abrí cada paso para ver qué campos entrega.'],
    real: ['En una API real casi siempre hace falta autenticación: se configura en la credencial del HTTP Request, no en la URL.', 'Conviene activar Retry On Fail para tolerar caídas momentáneas.', 'Revisá el límite de llamadas (rate limit) del proveedor.'],
    sample: [{ nombre: 'Diego Luna', email: 'diego@acme-logistica.example' }], http: enrichApi,
    checks: [['Llama a la API de enriquecimiento', f => all(f).some(n => n.op === 'http' && n.p.url.includes('api.enriquecer-demo.example/empresa'))]],
    tests: [[{ nombre: 'Diego Luna', email: 'diego@acme-logistica.example' }, 'acme-logistica.example'], [{ nombre: 'Paula Ríos', email: 'paula@verde-sa.example' }, 'verde-sa.example']].map(([i, dom]) => ({ name: `Lead de ${dom}`, input: [i], http: enrichApi, expect: r => {
      const h = callsOf(r, 'http')[0]; if (!h) return 'No se llamó a la API.';
      if (!h.params.url.endsWith('dominio=' + dom)) return `La URL fue «${h.params.url}»; tiene que terminar en dominio=${dom}.`;
      const s = callsOf(r, 'sheets')[0]; if (!s) return 'No se agregó la fila.';
      if (String(s.params.sheet).trim() !== 'Leads enriquecidos') return `La hoja es «${s.params.sheet}».`;
      const v = s.params.values, e = ENRICH[dom];
      for (const [k, val] of [['Nombre', i.nombre], ['Email', i.email], ['Empresa', e.empresa], ['Industria', e.industria]]) if (v[k] !== val) return `La columna ${k} vale «${v[k] ?? ''}»; se esperaba «${val}».`;
      return true;
    } })),
    solution: () => ({ steps: [
      N('webhook', 'Webhook', { path: '/lead' }),
      N('http', 'Consultar empresa', { method: 'GET', url: "https://api.enriquecer-demo.example/empresa?dominio={{ $json.email.split('@')[1] }}" }),
      N('set', 'Unir datos', { keep: true, fields: [col('nombre', ref('Webhook', 'nombre')), col('email', ref('Webhook', 'email'))] }),
      N('sheets', 'Guardar lead', { doc: 'CRM', sheet: 'Leads enriquecidos', columns: [col('Nombre', '{{ $json.nombre }}'), col('Email', '{{ $json.email }}'), col('Empresa', '{{ $json.empresa }}'), col('Industria', '{{ $json.industria }}')] }),
    ] }),
  },
  {
    id: 'tickets-ia', cat: 'Flujos con IA', level: 'Intermedio', title: 'Clasificar tickets de soporte con IA',
    story: 'Los tickets llegan todos mezclados. Un modelo de IA lee el mensaje, lo clasifica en una categoría y el workflow lo deriva al canal correcto.',
    objectives: ['Escribir un prompt que incluya los datos del item.', 'Pedirle al modelo una salida corta y predecible.', 'Enrutar con Switch según la respuesta de la IA.'],
    reqs: [
      'Trigger: <b>Webhook</b>.',
      '<b>OpenAI · Message a model</b>: un prompt que pida clasificar el mensaje en una sola palabra (<code>facturacion</code>, <code>tecnico</code> u <code>otro</code>) e incluya <code>{{ $json.mensaje }}</code>.',
      '<b>Switch</b> sobre <code>{{ $json.text }}</code>: <code>facturacion</code> → <b>Slack</b> <code>#facturacion</code>; <code>tecnico</code> → <b>Slack</b> <code>#soporte-tecnico</code>; respaldo → <b>Gmail</b> a <code>soporte@' + DEMO + '</code>.',
      'El texto de Slack y el asunto del email tienen que incluir el <code>id</code> del ticket.',
    ],
    mock: 'El modelo es simulado: responde la categoría correcta solo si el prompt incluye el mensaje del ticket.',
    hints: ['La respuesta del modelo queda en $json.text. El id del ticket quedó en el Webhook: {{ $(\'Webhook\').item.json.id }}.', 'Si todo cae en "otro", revisá que el prompt tenga {{ $json.mensaje }}.'],
    real: ['Pedí siempre un formato cerrado ("respondé solo con una de estas palabras") y dejá una ruta de respaldo: el modelo puede devolver algo inesperado.', 'n8n también tiene el nodo Text Classifier y el AI Agent con Chat Model, memoria y herramientas.', 'Cada llamada consume tokens: clasificá con un modelo chico y barato.'],
    sample: [{ id: 'T-501', cliente: 'Laura Gil', mensaje: 'Me cobraron dos veces la factura de octubre.' }], ai: ticketAi,
    checks: [['Usa un nodo de IA', f => has(f, 'ai')], ['Enruta con Switch', f => has(f, 'router')]],
    tests: TICKETS.map(([id, cliente, mensaje, cat]) => ({ name: `Ticket ${id} (${cat})`, input: [{ id, cliente, mensaje }], ai: ticketAi, expect: r => {
      const a = callsOf(r, 'ai')[0]; if (!a) return 'No se llamó al modelo.';
      if (!a.params.prompt.includes(mensaje)) return 'El prompt no incluye el mensaje del ticket.';
      const s = callsOf(r, 'slack'), m = sameMail(r);
      if (cat === 'otro') { if (s.length) return 'Un ticket sin categoría no va a Slack.'; if (m.length !== 1 || m[0].params.to !== 'soporte@' + DEMO) return `Se esperaba un email a soporte@${DEMO}.`; return m[0].params.subject.includes(id) || 'El asunto tiene que incluir el id del ticket.'; }
      if (m.length) return 'Un ticket clasificado no va por email.';
      const ch = cat === 'facturacion' ? '#facturacion' : '#soporte-tecnico';
      if (s.length !== 1 || String(s[0].params.channel).trim() !== ch) return `Se esperaba un mensaje en ${ch}.`;
      return s[0].params.text.includes(id) || 'El texto tiene que incluir el id del ticket.';
    } })),
    solution: () => { const txt = `Ticket ${ref('Webhook', 'id')}: ${ref('Webhook', 'mensaje')}`, c = v => ({ left: '{{ $json.text }}', op: 'eq', right: v }); return { steps: [
      N('webhook', 'Webhook', { path: '/tickets' }),
      N('ai', 'Clasificar', { prompt: 'Clasificá este mensaje de soporte. Respondé solo con una palabra: facturacion, tecnico u otro.\n\nMensaje: {{ $json.mensaje }}' }),
      N('router', 'Por categoría', {}, [
        { name: 'facturacion', cond: c('facturacion'), steps: [N('slack', 'A facturación', { channel: '#facturacion', text: txt })] },
        { name: 'tecnico', cond: c('tecnico'), steps: [N('slack', 'A soporte técnico', { channel: '#soporte-tecnico', text: txt })] },
        { name: 'otro', fallback: true, cond: c(''), steps: [N('mail', 'A la casilla general', { to: 'soporte@' + DEMO, subject: `Ticket ${ref('Webhook', 'id')} sin clasificar`, body: ref('Webhook', 'mensaje') })] },
      ]),
    ] }; },
  },
  {
    id: 'email-ia', cat: 'Flujos con IA', level: 'Avanzado', title: 'Extraer datos de un email con IA',
    story: 'Los pedidos llegan por email, escritos de cualquier manera. La IA extrae cliente, producto y cantidad en JSON, y un Code lo convierte en datos listos para la hoja.',
    objectives: ['Pedirle a un modelo una salida en JSON.', 'Parsear y validar esa salida con Code.', 'Convertir tipos: de texto a número.'],
    reqs: [
      'Trigger: <b>Webhook</b> (recibe <code>de</code>, <code>asunto</code> y <code>cuerpo</code>).',
      '<b>OpenAI · Message a model</b>: pedí un JSON con <code>cliente</code>, <code>producto</code> y <code>cantidad</code>, e incluí <code>{{ $json.cuerpo }}</code>.',
      '<b>Code</b>: <code>JSON.parse($json.text)</code> y devolvé <code>cliente</code>, <code>producto</code> y <code>cantidad</code> como <b>número</b>.',
      '<b>Google Sheets</b> en la hoja <code>Pedidos por email</code>: columnas <code>Cliente</code>, <code>Producto</code>, <code>Cantidad</code> y <code>Email</code> (el remitente).',
    ],
    mock: 'El modelo simulado devuelve, por ejemplo: {"cliente":"Marta Ríos","producto":"Termo 1L","cantidad":"12"}. La cantidad llega como texto.',
    hints: ['La IA devuelve texto: hasta que no hacés JSON.parse no podés leer sus campos.', 'Number("12") convierte el texto en número.', 'El remitente está en el Webhook: {{ $(\'Webhook\').item.json.de }}.'],
    real: ['Los modelos a veces envuelven el JSON en texto o en ```: en n8n podés usar Structured Output Parser o el nodo Information Extractor para forzar el formato.', 'Validá siempre los campos antes de escribirlos en un sistema.'],
    sample: [{ de: 'marta@cliente.example', asunto: 'Pedido', cuerpo: 'Hola, soy Marta Ríos. Necesito 12 unidades de Termo 1L para el viernes.' }], ai: mailAi,
    checks: [['Usa un nodo de IA', f => has(f, 'ai')], ['Usa un nodo Code', f => has(f, 'code')]],
    tests: [['marta@cliente.example', 'Hola, soy Marta Ríos. Necesito 12 unidades de Termo 1L para el viernes.', 'Marta Ríos', 'Termo 1L', 12], ['pablo@otro.example', 'Buen día, soy Pablo Díaz. Necesito 3 unidades de Mate imperial.', 'Pablo Díaz', 'Mate imperial', 3]].map(([de, cuerpo, cli, prod, cant]) => ({ name: `Pedido de ${cli}`, input: [{ de, asunto: 'Pedido', cuerpo }], ai: mailAi, expect: r => {
      const s = callsOf(r, 'sheets')[0]; if (!s) return 'No se agregó la fila.';
      if (String(s.params.sheet).trim() !== 'Pedidos por email') return `La hoja es «${s.params.sheet}».`;
      const v = s.params.values;
      if (v.Cliente !== cli) return `Cliente vale «${v.Cliente ?? ''}»; se esperaba «${cli}». ¿El prompt incluye el cuerpo del email?`;
      if (v.Producto !== prod) return `Producto vale «${v.Producto ?? ''}»; se esperaba «${prod}».`;
      if (v.Cantidad !== cant) return `Cantidad vale ${JSON.stringify(v.Cantidad)}; se esperaba el número ${cant}.`;
      return v.Email === de || `Email vale «${v.Email ?? ''}»; se esperaba «${de}».`;
    } })),
    solution: () => ({ steps: [
      N('webhook', 'Webhook', { path: '/emails' }),
      N('ai', 'Extraer pedido', { prompt: 'Extraé los datos del pedido y respondé solo con JSON: {"cliente": "", "producto": "", "cantidad": ""}\n\nEmail: {{ $json.cuerpo }}' }),
      N('code', 'Parsear JSON', { mode: 'each', code: 'const d = JSON.parse($json.text);\nreturn { cliente: d.cliente, producto: d.producto, cantidad: Number(d.cantidad) };' }),
      N('sheets', 'Registrar pedido', { doc: 'Pedidos', sheet: 'Pedidos por email', columns: [col('Cliente', '{{ $json.cliente }}'), col('Producto', '{{ $json.producto }}'), col('Cantidad', '{{ $json.cantidad }}'), col('Email', ref('Webhook', 'de'))] }),
    ] }),
  },
  {
    id: 'reporte', cat: 'Análisis de datos', level: 'Intermedio', title: 'Reporte semanal: la mejor región',
    story: 'Cada lunes, dirección quiere saber qué región vendió más. El workflow lee la hoja de ventas, cuenta solo lo cobrado y avisa el resultado.',
    objectives: ['Leer filas de una hoja como items.', 'Agrupar y sumar con Summarize.', 'Ordenar y quedarse con el primero (Sort y Limit).'],
    reqs: [
      'Trigger: <b>Schedule Trigger</b>.',
      '<b>Google Sheets · Get Row(s)</b> de la hoja <code>Ventas</code>.',
      '<b>Filter</b>: <code>estado</code> es igual a <code>pagado</code>.',
      '<b>Summarize</b>: <code>sum</code> de <code>monto</code>, agrupado por <code>region</code>.',
      '<b>Sort</b> por <code>sum_monto</code> descendente y <b>Limit</b> en 1.',
      '<b>Slack</b> a <code>#reportes</code>: <code>Mejor región: REGION ($TOTAL)</code>.',
    ],
    mock: 'La hoja Ventas tiene las columnas fecha, region, monto y estado (pagado, pendiente o anulado).',
    hints: ['Cada fila de la hoja es un item. Summarize devuelve un item por región.', 'El campo sumado se llama sum_monto.', 'Si filtrás después de sumar, contás ventas que no se cobraron.'],
    real: ['Con muchas filas, filtrá en el propio nodo de Google Sheets para traer menos datos.', 'Para reportes más ricos podés armar una tabla en HTML o Markdown con un nodo Code.'],
    sample: [{}], rows: () => VENTAS_A,
    checks: [['Lee la hoja Ventas', f => all(f).some(n => n.op === 'sheetsRead' && n.p.sheet.trim() === 'Ventas')], ['Resume con Summarize o Code', f => has(f, 'summarize') || has(f, 'code')]],
    tests: [['Semana 1', VENTAS_A, 'Mejor región: Norte ($4200)'], ['Semana 2', VENTAS_B, 'Mejor región: Sur ($4500)']].map(([name, data, ex]) => ({ name, input: [{}], rows: () => data, expect: r => {
      const s = callsOf(r, 'slack'); if (s.length !== 1) return `Se esperaba un solo mensaje y hubo ${s.length}.`;
      if (String(s[0].params.channel).trim() !== '#reportes') return 'El canal tiene que ser #reportes.';
      return s[0].params.text === ex || `El mensaje fue «${s[0].params.text}»; se esperaba «${ex}».`;
    } })),
    solution: () => ({ steps: [
      N('schedule', 'Cada lunes', { every: 'Todos los lunes', at: '08:00' }), N('sheetsRead', 'Leer ventas', { doc: 'Ventas', sheet: 'Ventas' }),
      N('filter', 'Solo pagadas', { cond: { left: '{{ $json.estado }}', op: 'eq', right: 'pagado' } }),
      N('summarize', 'Total por región', { fields: [col('monto', 'sum')], groupBy: 'region' }),
      N('sort', 'Mayor primero', { field: 'sum_monto', dir: 'desc' }), N('limit', 'La mejor', { max: '1' }),
      N('slack', 'Avisar', { channel: '#reportes', text: 'Mejor región: {{ $json.region }} (${{ $json.sum_monto }})' }),
    ] }),
  },
  {
    id: 'limpieza', cat: 'Análisis de datos', level: 'Avanzado', title: 'Limpiar y resumir datos con Code',
    story: 'Un sistema viejo manda los pedidos con duplicados y con los montos como texto. Finanzas necesita un resumen confiable: cuántos pedidos, total, promedio y el mayor.',
    objectives: ['Usar Code en modo Run Once for All Items.', 'Quitar duplicados y convertir tipos.', 'Devolver un único item con el resumen.'],
    reqs: [
      'Trigger: <b>Webhook</b> (recibe <code>pedidos</code>, una lista).',
      '<b>Split Out</b> sobre <code>pedidos</code>.',
      '<b>Code</b> en modo <i>Run Once for All Items</i>: quitá los duplicados por <code>id</code>, convertí <code>monto</code> a número y devolvé un solo item con <code>cantidad</code>, <code>total</code>, <code>promedio</code> (redondeado) y <code>mayor</code>.',
      '<b>Gmail</b> a <code>finanzas@' + DEMO + '</code>: asunto <code>Resumen: N pedidos por $TOTAL</code> y el promedio en el cuerpo.',
    ],
    hints: ['En este modo, $input.all() devuelve todos los items: cada uno tiene sus datos en .json.', 'Devolvé una lista: return [{ json: { cantidad, total, promedio, mayor } }].', 'También podés resolverlo con Remove Duplicates y Summarize: lo que se verifica es el resultado.'],
    real: ['Run Once for All Items es el modo por defecto del nodo Code.', 'Para volúmenes grandes conviene procesar por lotes (Loop Over Items).'],
    sample: [{ pedidos: [{ id: 'A1', monto: '1200' }, { id: 'A2', monto: '300' }, { id: 'A1', monto: '1200' }, { id: 'A3', monto: '2000' }] }],
    checks: [['Separa la lista en items', f => has(f, 'split')]],
    tests: [['Con un duplicado', [['A1', '1200'], ['A2', '300'], ['A1', '1200'], ['A3', '2000']], 'Resumen: 3 pedidos por $3500', '1167'], ['Sin duplicados', [['B1', '500'], ['B2', '1500']], 'Resumen: 2 pedidos por $2000', '1000']].map(([name, list, subj, avg]) => ({ name, input: [{ pedidos: list.map(([id, monto]) => ({ id, monto })) }], expect: r => {
      const m = sameMail(r); if (m.length !== 1) return `Se esperaba un solo email y hubo ${m.length}.`;
      if (m[0].params.to !== 'finanzas@' + DEMO) return `El email fue a «${m[0].params.to}».`;
      if (m[0].params.subject !== subj) return `El asunto fue «${m[0].params.subject}»; se esperaba «${subj}».`;
      return m[0].params.body.includes(avg) || `El cuerpo tiene que incluir el promedio (${avg}).`;
    } })),
    solution: () => ({ steps: [
      N('webhook', 'Webhook', { path: '/pedidos-legacy' }), N('split', 'Por pedido', { field: 'pedidos' }),
      N('code', 'Limpiar y resumir', { mode: 'all', code: 'const vistos = new Set();\nconst montos = [];\nfor (const item of $input.all()) {\n  if (vistos.has(item.json.id)) continue;\n  vistos.add(item.json.id);\n  montos.push(Number(item.json.monto));\n}\nconst total = montos.reduce((a, b) => a + b, 0);\nreturn [{ json: { cantidad: montos.length, total, promedio: Math.round(total / montos.length), mayor: Math.max(...montos) } }];' }),
      N('mail', 'Enviar resumen', { to: 'finanzas@' + DEMO, subject: 'Resumen: {{ $json.cantidad }} pedidos por ${{ $json.total }}', body: 'Promedio: ${{ $json.promedio }}. Pedido mayor: ${{ $json.mayor }}.' }),
    ] }),
  }
);

const REVIEWS = [['Nora Paz', 'nora@mail.example', 1, 'El pedido llegó tarde y con la caja rota.'], ['Hugo Lima', 'hugo@mail.example', 5, 'Excelente atención, llegó antes de lo esperado.']];
const reviewAi = p => { const r = REVIEWS.find(x => p.includes(x[0]) && p.includes(x[3])); return r ? `Hola ${r[0]}, gracias por tu reseña. Tomamos nota de lo que nos contás.` : 'Gracias por tu mensaje.'; };
const TASKS = [['sofi', 'Hay que mandar la propuesta a Banco Litoral antes del 2026-12-01, es urgente.', { titulo: 'Mandar la propuesta a Banco Litoral', fecha: '2026-12-01', prioridad: 'alta' }], ['leo', 'Cuando puedas, ordená la carpeta de contratos. Fecha tentativa 2026-12-20.', { titulo: 'Ordenar la carpeta de contratos', fecha: '2026-12-20', prioridad: 'normal' }]];
const taskAi = p => (TASKS.find(t => p.includes(t[1])) || [])[2] || { titulo: '', fecha: '', prioridad: '' };

PROJ.zapier.push(
  {
    id: 'corporativos', cat: 'Leads', level: 'Inicial', title: 'Solo leads corporativos al CRM',
    story: 'El formulario recibe muchos leads con emails personales. Al CRM solo tienen que entrar los corporativos, con el nombre y el email prolijos, y ventas tiene que enterarse.',
    objectives: ['Limpiar datos con Formatter.', 'Detener el Zap con Filter.', 'Entender qué pasos consumen tasks.'],
    reqs: [
      'Trigger: <b>Webhooks by Zapier · Catch Hook</b>.',
      '<b>Formatter</b>: <code>email</code> en minúsculas y <code>nombre</code> sin espacios de más y con mayúscula inicial: <code>{{capitalize(trim(1.nombre))}}</code>.',
      '<b>Filter</b>: el email <i>no contiene</i> <code>gmail.com</code>.',
      '<b>HubSpot · Create Contact</b> con el email y el nombre ya formateados.',
      '<b>Gmail</b> a <code>ventas@' + DEMO + '</code> con asunto <code>Nuevo lead corporativo: NOMBRE</code>.',
    ],
    hints: ['Los datos formateados salen del paso 2: {{2.email}} y {{2.nombre}}.', 'Cuando el Filter no se cumple, el Zap termina ahí sin error: es lo esperado.'],
    real: ['El Filter que detiene el Zap no consume tasks: ponelo antes de las acciones pagas.', 'En Zapier real elegís los campos de una lista; no se escriben las llaves a mano.'],
    sample: [{ nombre: '  julia torres ', email: 'JULIA@Constructora-Norte.example' }],
    checks: [['Tiene un Formatter', f => has(f, 'set')], ['Tiene un Filter', f => has(f, 'filter')]],
    tests: [
      { name: 'Lead corporativo', input: [{ nombre: '  julia torres ', email: 'JULIA@Constructora-Norte.example' }], expect: r => {
        const c = callsOf(r, 'crm')[0]; if (!c) return 'No se creó el contacto en HubSpot.';
        if (c.params.email !== 'julia@constructora-norte.example') return `El email quedó «${c.params.email}».`;
        if (c.params.name !== 'Julia Torres') return `El nombre quedó «${c.params.name}»; se esperaba «Julia Torres».`;
        const m = sameMail(r)[0]; if (!m || m.params.to !== 'ventas@' + DEMO) return 'Falta el email a ventas.';
        return m.params.subject === 'Nuevo lead corporativo: Julia Torres' || `El asunto fue «${m.params.subject}».`;
      } },
      { name: 'Lead con Gmail', input: [{ nombre: 'pedro gomez', email: 'Pedro.Gomez@GMAIL.com' }], expect: r => (!callsOf(r, 'crm').length && !sameMail(r).length) || 'Un lead con Gmail no tiene que llegar al CRM ni avisar a ventas.' },
    ],
    solution: () => ({ steps: [
      N('webhook', 'Nuevo lead', { path: '/leads' }),
      N('set', 'Limpiar datos', { keep: false, fields: [col('email', '{{lower(1.email)}}'), col('nombre', '{{capitalize(trim(1.nombre))}}')] }),
      N('filter', 'Solo corporativos', { cond: { left: '{{2.email}}', op: 'ncontains', right: 'gmail.com' } }),
      N('crm', 'Crear contacto', { email: '{{2.email}}', name: '{{2.nombre}}' }),
      N('mail', 'Avisar a ventas', { to: 'ventas@' + DEMO, subject: 'Nuevo lead corporativo: {{2.nombre}}', body: '{{2.email}}' }),
    ] }),
  },
  {
    id: 'asignar', cat: 'Nodos de programación', level: 'Intermedio', title: 'Asignar vendedor con Code by Zapier',
    story: 'Cada lead tiene que ir al vendedor de su país, y los de monto alto se marcan con prioridad. Son reglas simples, pero no hay una app que las resuelva: va con código.',
    objectives: ['Pasar datos al código con Input Data.', 'Recordar que inputData siempre trae texto.', 'Devolver campos nuevos con output.'],
    reqs: [
      'Trigger: <b>Catch Hook</b>.',
      '<b>Code by Zapier</b> con Input Data <code>pais</code> y <code>monto</code>. Tiene que devolver <code>vendedor</code> (AR → <code>ana@' + DEMO + '</code>, MX → <code>luis@' + DEMO + '</code>, el resto → <code>equipo@' + DEMO + '</code>) y <code>prioridad</code> (<code>alta</code> si el monto es ≥ 3000, si no <code>normal</code>).',
      '<b>Google Sheets</b> en la hoja <code>Asignaciones</code>: columnas <code>Lead</code>, <code>Vendedor</code> y <code>Prioridad</code>.',
      '<b>Slack</b> a <code>#leads</code>: <code>Lead NOMBRE → VENDEDOR (prioridad PRIORIDAD)</code>.',
    ],
    hints: ['inputData.monto es texto: comparalo con Number(inputData.monto) >= 3000.', 'Asigná el resultado así: output = { vendedor, prioridad };', 'El resultado del código es el paso 2: {{2.vendedor}}.'],
    real: ['Code by Zapier corre JavaScript o Python, con límites de tiempo y memoria: sirve para lógica corta, no para procesos pesados.', 'Antes de escribir código, fijate si Formatter o Lookup Table ya lo resuelven.'],
    sample: [{ nombre: 'Omar Ruiz', email: 'omar@cliente.example', pais: 'AR', monto: '4500' }],
    checks: [['Usa Code by Zapier', f => has(f, 'code')]],
    tests: [['Omar Ruiz', 'AR', '4500', 'ana', 'alta'], ['Lía Campos', 'MX', '500', 'luis', 'normal'], ['Raúl Peña', 'CL', '3000', 'equipo', 'alta']].map(([nombre, pais, monto, v, pr]) => ({ name: `${nombre} (${pais}, $${monto})`, input: [{ nombre, email: 'x@cliente.example', pais, monto }], expect: r => {
      const vend = `${v}@${DEMO}`, s = callsOf(r, 'sheets')[0]; if (!s) return 'No se agregó la fila en Asignaciones.';
      if (String(s.params.sheet).trim() !== 'Asignaciones') return `La hoja es «${s.params.sheet}».`;
      const val = s.params.values;
      if (val.Lead !== nombre || val.Vendedor !== vend || val.Prioridad !== pr) return `La fila fue ${JSON.stringify(val)}; se esperaba Lead «${nombre}», Vendedor «${vend}», Prioridad «${pr}».`;
      const k = callsOf(r, 'slack')[0], ex = `Lead ${nombre} → ${vend} (prioridad ${pr})`;
      if (!k || String(k.params.channel).trim() !== '#leads') return 'Falta el aviso en #leads.';
      return k.params.text === ex || `El mensaje fue «${k.params.text}»; se esperaba «${ex}».`;
    } })),
    solution: () => ({ steps: [
      N('webhook', 'Nuevo lead', { path: '/leads' }),
      N('code', 'Asignar vendedor', { inputs: [col('pais', '{{1.pais}}'), col('monto', '{{1.monto}}')], code: `const mapa = { AR: 'ana@${DEMO}', MX: 'luis@${DEMO}' };\noutput = {\n  vendedor: mapa[inputData.pais] || 'equipo@${DEMO}',\n  prioridad: Number(inputData.monto) >= 3000 ? 'alta' : 'normal'\n};` }),
      N('sheets', 'Registrar', { doc: 'Ventas', sheet: 'Asignaciones', columns: [col('Lead', '{{1.nombre}}'), col('Vendedor', '{{2.vendedor}}'), col('Prioridad', '{{2.prioridad}}')] }),
      N('slack', 'Avisar', { channel: '#leads', text: 'Lead {{1.nombre}} → {{2.vendedor}} (prioridad {{2.prioridad}})' }),
    ] }),
  },
  {
    id: 'resenas-ia', cat: 'Flujos con IA', level: 'Intermedio', title: 'Responder reseñas con IA',
    story: 'Cada reseña merece una respuesta. La IA redacta un borrador; si la reseña es mala, lo revisa una persona antes de contestar, y si es buena, se envía sola.',
    objectives: ['Generar texto con AI by Zapier usando datos del trigger.', 'Dividir el Zap con Paths.', 'Dejar a una persona en el medio cuando el riesgo es alto.'],
    reqs: [
      'Trigger: <b>Catch Hook</b> (recibe <code>cliente</code>, <code>email</code>, <code>estrellas</code> y <code>comentario</code>).',
      '<b>AI by Zapier</b>: un prompt que pida una respuesta breve e incluya el nombre del cliente y el comentario.',
      '<b>Paths</b>. Camino A, <code>estrellas</code> menor que <code>3</code>: <b>Slack</b> a <code>#atencion-urgente</code> con el nombre del cliente y el borrador de la IA.',
      'Camino de respaldo: <b>Gmail</b> al cliente con asunto <code>Gracias por tu reseña, NOMBRE</code> y el texto de la IA como cuerpo.',
    ],
    mock: 'El modelo simulado redacta la respuesta solo si el prompt incluye el nombre del cliente y su comentario.',
    hints: ['El texto que genera la IA está en {{2.text}}.', 'El paso de IA va antes de Paths para que los dos caminos puedan usar su resultado.'],
    real: ['Para respuestas a clientes enojados, dejá siempre revisión humana: la IA puede prometer algo que no corresponde.', 'En AI by Zapier definís el prompt y los campos de salida; cada ejecución consume tasks.'],
    sample: [{ cliente: 'Nora Paz', email: 'nora@mail.example', estrellas: 1, comentario: 'El pedido llegó tarde y con la caja rota.' }], ai: reviewAi,
    checks: [['Usa un paso de IA', f => has(f, 'ai')], ['Divide con Paths', f => has(f, 'router')]],
    tests: REVIEWS.map(([cliente, email, estrellas, comentario]) => ({ name: `Reseña de ${estrellas} estrella(s)`, input: [{ cliente, email, estrellas, comentario }], ai: reviewAi, expect: r => {
      const reply = `Hola ${cliente}, gracias por tu reseña. Tomamos nota de lo que nos contás.`, s = callsOf(r, 'slack'), m = sameMail(r);
      if (estrellas < 3) {
        if (m.length) return 'Una reseña mala no se responde sola por email.';
        if (s.length !== 1 || String(s[0].params.channel).trim() !== '#atencion-urgente') return 'Se esperaba un aviso en #atencion-urgente.';
        if (!s[0].params.text.includes(cliente)) return 'El aviso tiene que incluir el nombre del cliente.';
        return s[0].params.text.includes(reply) || 'El aviso tiene que incluir el borrador de la IA. ¿El prompt tiene el nombre y el comentario?';
      }
      if (s.length) return 'Una reseña buena no va a #atencion-urgente.';
      if (m.length !== 1 || m[0].params.to !== email) return 'Se esperaba un email al cliente.';
      if (m[0].params.subject !== `Gracias por tu reseña, ${cliente}`) return `El asunto fue «${m[0].params.subject}».`;
      return m[0].params.body === reply || 'El cuerpo tiene que ser el texto de la IA. ¿El prompt tiene el nombre y el comentario?';
    } })),
    solution: () => ({ steps: [
      N('webhook', 'Nueva reseña', { path: '/resenas' }),
      N('ai', 'Redactar respuesta', { prompt: 'Escribí una respuesta breve y amable para {{1.cliente}}, que dejó esta reseña: {{1.comentario}}' }),
      N('router', 'Según estrellas', {}, [
        { name: 'Mala experiencia', cond: { left: '{{1.estrellas}}', op: 'lt', right: '3' }, steps: [N('slack', 'Pedir revisión', { channel: '#atencion-urgente', text: 'Reseña de {{1.cliente}} ({{1.estrellas}} estrellas). Borrador: {{2.text}}' })] },
        { name: 'Resto', fallback: true, cond: { left: '', op: 'eq', right: '' }, steps: [N('mail', 'Responder', { to: '{{1.email}}', subject: 'Gracias por tu reseña, {{1.cliente}}', body: '{{2.text}}' })] },
      ]),
    ] }),
  },
  {
    id: 'tarea-ia', cat: 'Flujos con IA', level: 'Avanzado', title: 'De un mensaje a una tarea con IA',
    story: 'El equipo pide cosas por chat y después se pierden. La IA lee el mensaje, saca el título, la fecha y la prioridad, y el Zap crea la tarjeta en Trello. Si es urgente, también avisa.',
    objectives: ['Usar la IA para extraer campos estructurados.', 'Mapear esos campos en otra app.', 'Combinar una acción fija con un Filter posterior.'],
    reqs: [
      'Trigger: <b>Catch Hook</b> (recibe <code>usuario</code> y <code>texto</code>).',
      '<b>AI by Zapier</b>: pedí <code>titulo</code>, <code>fecha</code> y <code>prioridad</code>, e incluí <code>{{1.texto}}</code>.',
      '<b>Trello · Create Card</b> en la lista <code>Pendientes</code>: título y vencimiento de la IA, y el usuario en la descripción.',
      '<b>Filter</b>: <code>prioridad</code> es igual a <code>alta</code>. Después, <b>Slack</b> a <code>#urgentes</code>: <code>Tarea urgente: TITULO (vence FECHA)</code>.',
    ],
    mock: 'El modelo simulado devuelve campos listos, por ejemplo: titulo, fecha y prioridad (alta o normal).',
    hints: ['Los campos de la IA se leen como {{2.titulo}}, {{2.fecha}} y {{2.prioridad}}.', 'El Filter va después de Trello: la tarjeta se crea siempre y solo el aviso depende de la prioridad.'],
    real: ['En AI by Zapier definís los campos de salida y su tipo, así el siguiente paso los puede mapear.', 'Revisá las fechas: los modelos se confunden con "el viernes" o "la semana que viene" si no les das la fecha de hoy.'],
    sample: [{ usuario: TASKS[0][0], texto: TASKS[0][1] }], ai: taskAi,
    checks: [['Usa un paso de IA', f => has(f, 'ai')], ['Crea la tarjeta en Trello', f => has(f, 'task')]],
    tests: TASKS.map(([usuario, texto, o]) => ({ name: `Tarea de prioridad ${o.prioridad}`, input: [{ usuario, texto }], ai: taskAi, expect: r => {
      const t = callsOf(r, 'task')[0]; if (!t) return 'No se creó la tarjeta.';
      if (String(t.params.list).trim() !== 'Pendientes') return `La lista es «${t.params.list}».`;
      if (t.params.title !== o.titulo) return `El título fue «${t.params.title}»; se esperaba «${o.titulo}». ¿El prompt incluye el texto?`;
      if (t.params.due !== o.fecha) return `El vencimiento fue «${t.params.due}»; se esperaba ${o.fecha}.`;
      if (!t.params.description.includes(usuario)) return 'La descripción tiene que incluir el usuario.';
      const s = callsOf(r, 'slack');
      if (o.prioridad !== 'alta') return !s.length || 'Una tarea normal no avisa en #urgentes.';
      const ex = `Tarea urgente: ${o.titulo} (vence ${o.fecha})`;
      if (s.length !== 1 || String(s[0].params.channel).trim() !== '#urgentes') return 'Falta el aviso en #urgentes.';
      return s[0].params.text === ex || `El mensaje fue «${s[0].params.text}»; se esperaba «${ex}».`;
    } })),
    solution: () => ({ steps: [
      N('webhook', 'Mensaje del chat', { path: '/chat' }),
      N('ai', 'Extraer tarea', { prompt: 'Extraé titulo, fecha (AAAA-MM-DD) y prioridad (alta o normal) de este mensaje: {{1.texto}}' }),
      N('task', 'Crear tarjeta', { list: 'Pendientes', title: '{{2.titulo}}', due: '{{2.fecha}}', description: 'Pedido por {{1.usuario}}' }),
      N('filter', 'Solo urgentes', { cond: { left: '{{2.prioridad}}', op: 'eq', right: 'alta' } }),
      N('slack', 'Avisar', { channel: '#urgentes', text: 'Tarea urgente: {{2.titulo}} (vence {{2.fecha}})' }),
    ] }),
  },
  {
    id: 'reporte-diario', cat: 'Análisis de datos', level: 'Avanzado', title: 'Reporte diario de ventas con Code',
    story: 'Al cierre del día, el equipo quiere un mensaje con cuántas ventas hubo, el total y quién vendió más. Los datos están en una hoja.',
    objectives: ['Traer varias filas en un solo paso.', 'Recorrer y agregar una lista con código.', 'Armar un mensaje con los resultados.'],
    reqs: [
      'Trigger: <b>Schedule by Zapier</b>.',
      '<b>Google Sheets · Get Many Spreadsheet Rows</b> de la hoja <code>Ventas hoy</code>.',
      '<b>Code by Zapier</b> con Input Data <code>filas</code> ← <code>{{2.rows}}</code>. Devolvé <code>cantidad</code>, <code>total</code> y <code>mejor</code> (el vendedor que más sumó).',
      '<b>Slack</b> a <code>#reportes</code>: <code>Ventas de hoy: N ventas por $TOTAL. Mejor vendedor: NOMBRE</code>.',
    ],
    mock: 'Cada fila tiene vendedor y monto. En el simulador la lista llega al código como texto JSON.',
    hints: ['Empezá con const filas = JSON.parse(inputData.filas);', 'Sumá por vendedor en un objeto y ordená para encontrar el mayor.', 'El resultado del código es el paso 3.'],
    real: ['En Zapier real, las listas llegan como "line items" o texto separado por comas, según la app: revisá el formato en la prueba del paso.', 'Para acumular datos durante el día existe Digest by Zapier.'],
    sample: [{}], rows: () => HOY_A,
    checks: [['Lee la hoja Ventas hoy', f => all(f).some(n => n.op === 'sheetsRead' && n.p.sheet.trim() === 'Ventas hoy')], ['Usa Code by Zapier', f => has(f, 'code')]],
    tests: [['Día con 4 ventas', HOY_A, 'Ventas de hoy: 4 ventas por $5200. Mejor vendedor: Ana'], ['Día con 2 ventas', HOY_B, 'Ventas de hoy: 2 ventas por $6500. Mejor vendedor: Rita']].map(([name, data, ex]) => ({ name, input: [{}], rows: () => data, expect: r => {
      const s = callsOf(r, 'slack'); if (s.length !== 1) return `Se esperaba un mensaje y hubo ${s.length}.`;
      if (String(s[0].params.channel).trim() !== '#reportes') return 'El canal tiene que ser #reportes.';
      return s[0].params.text === ex || `El mensaje fue «${s[0].params.text}»; se esperaba «${ex}».`;
    } })),
    solution: () => ({ steps: [
      N('schedule', 'Cada día 18:00', { at: '18:00' }), N('sheetsRead', 'Leer ventas', { doc: 'Ventas', sheet: 'Ventas hoy' }),
      N('code', 'Calcular resumen', { inputs: [col('filas', '{{2.rows}}')], code: 'const filas = JSON.parse(inputData.filas);\nconst porVendedor = {};\nlet total = 0;\nfilas.forEach(f => {\n  total += Number(f.monto);\n  porVendedor[f.vendedor] = (porVendedor[f.vendedor] || 0) + Number(f.monto);\n});\nconst mejor = Object.entries(porVendedor).sort((a, b) => b[1] - a[1])[0][0];\noutput = { cantidad: filas.length, total, mejor };' }),
      N('slack', 'Publicar reporte', { channel: '#reportes', text: 'Ventas de hoy: {{3.cantidad}} ventas por ${{3.total}}. Mejor vendedor: {{3.mejor}}' }),
    ] }),
  },
  {
    id: 'monitoreo', cat: 'Análisis de datos', level: 'Avanzado', title: 'Detectar anomalías en métricas',
    story: 'Un monitor manda métricas de cada servicio. El Zap calcula la tasa de error, deja todo registrado y reacciona distinto según la gravedad.',
    objectives: ['Calcular un indicador con código.', 'Clasificar con umbrales.', 'Usar Paths con más de una condición y sin camino de respaldo.'],
    reqs: [
      'Trigger: <b>Catch Hook</b> (recibe <code>servicio</code>, <code>latencia_ms</code>, <code>errores</code> y <code>total</code>, como texto).',
      '<b>Code by Zapier</b>: devolvé <code>tasa</code> (porcentaje de errores con un decimal) y <code>estado</code>: <code>critico</code> si la tasa es mayor que 5 o la latencia mayor que 2000; <code>alerta</code> si la tasa es mayor que 1; si no, <code>ok</code>.',
      '<b>Google Sheets</b> en la hoja <code>Monitoreo</code>: columnas <code>Servicio</code>, <code>Tasa</code> y <code>Estado</code>. Se registra siempre.',
      '<b>Paths</b>. <code>critico</code>: <b>Slack</b> a <code>#incidentes</code> y <b>Trello</b> en la lista <code>Incidentes</code> con título <code>Incidente en SERVICIO</code>. <code>alerta</code>: <b>Slack</b> a <code>#monitoreo</code>. Con <code>ok</code> no pasa nada más.',
    ],
    hints: ['Tasa con un decimal: Math.round(errores / total * 1000) / 10.', 'Acordate de convertir con Number(): todo llega como texto.', 'Quitá la marca de respaldo de los caminos: si el estado es ok, ninguno tiene que ejecutarse.'],
    real: ['Para no repetir avisos del mismo incidente se puede guardar el último estado en Storage by Zapier.', 'Los umbrales deberían salir de los datos históricos del servicio.'],
    sample: [{ servicio: 'api-pagos', latencia_ms: '2400', errores: '12', total: '400' }],
    checks: [['Usa Code by Zapier', f => has(f, 'code')], ['Divide con Paths', f => has(f, 'router')]],
    tests: [['api-pagos', '2400', '12', '400', '3', 'critico'], ['api-envios', '300', '8', '400', '2', 'alerta'], ['api-stock', '200', '1', '1000', '0.1', 'ok']].map(([servicio, lat, err, tot, tasa, estado]) => ({ name: `${servicio}: ${estado}`, input: [{ servicio, latencia_ms: lat, errores: err, total: tot }], expect: r => {
      const s = callsOf(r, 'sheets')[0]; if (!s) return 'No se registró la métrica en la hoja.';
      const v = s.params.values;
      if (String(s.params.sheet).trim() !== 'Monitoreo' || v.Servicio !== servicio) return 'La fila tiene que ir a Monitoreo con el servicio.';
      if (String(v.Tasa) !== tasa) return `Tasa vale «${v.Tasa ?? ''}»; se esperaba ${tasa}.`;
      if (v.Estado !== estado) return `Estado vale «${v.Estado ?? ''}»; se esperaba «${estado}».`;
      const k = callsOf(r, 'slack'), t = callsOf(r, 'task');
      if (estado === 'ok') return (!k.length && !t.length) || 'Con estado ok no hay avisos ni tarjetas.';
      if (estado === 'alerta') { if (t.length) return 'Una alerta no crea tarjeta.'; return (k.length === 1 && String(k[0].params.channel).trim() === '#monitoreo') || 'Se esperaba un aviso en #monitoreo.'; }
      if (k.length !== 1 || String(k[0].params.channel).trim() !== '#incidentes') return 'Se esperaba un aviso en #incidentes.';
      if (!t.length || String(t[0].params.list).trim() !== 'Incidentes') return 'Falta la tarjeta en la lista Incidentes.';
      return t[0].params.title === `Incidente en ${servicio}` || `El título fue «${t[0].params.title}».`;
    } })),
    solution: () => ({ steps: [
      N('webhook', 'Métrica', { path: '/metricas' }),
      N('code', 'Calcular estado', { inputs: [col('latencia', '{{1.latencia_ms}}'), col('errores', '{{1.errores}}'), col('total', '{{1.total}}')], code: "const tasa = Math.round(Number(inputData.errores) / Number(inputData.total) * 1000) / 10;\nconst estado = (tasa > 5 || Number(inputData.latencia) > 2000) ? 'critico' : tasa > 1 ? 'alerta' : 'ok';\noutput = { tasa, estado };" }),
      N('sheets', 'Registrar', { doc: 'Operaciones', sheet: 'Monitoreo', columns: [col('Servicio', '{{1.servicio}}'), col('Tasa', '{{2.tasa}}'), col('Estado', '{{2.estado}}')] }),
      N('router', 'Según gravedad', {}, [
        { name: 'Crítico', cond: { left: '{{2.estado}}', op: 'eq', right: 'critico' }, steps: [N('slack', 'Avisar incidente', { channel: '#incidentes', text: 'CRÍTICO en {{1.servicio}}: {{2.tasa}}% de errores, {{1.latencia_ms}} ms' }), N('task', 'Abrir incidente', { list: 'Incidentes', title: 'Incidente en {{1.servicio}}', description: 'Tasa {{2.tasa}}%' })] },
        { name: 'Alerta', cond: { left: '{{2.estado}}', op: 'eq', right: 'alerta' }, steps: [N('slack', 'Avisar alerta', { channel: '#monitoreo', text: 'Alerta en {{1.servicio}}: {{2.tasa}}% de errores' })] },
      ]),
    ] }),
  }
);

/* Modo libre: sin verificación, con respuestas simuladas que define la persona */
Object.keys(PROJ).forEach(pf => PROJ[pf].push({
  id: 'libre', free: true, cat: 'Modo libre', level: 'Libre', title: 'Modo libre',
  story: `Armá cualquier ${P[pf].flow} con todos los ${P[pf].node}s disponibles y probalo con tus propios datos. Vos definís qué responden la API, la IA y la hoja.`,
  reqs: [], checks: [], tests: [], hints: ['Cambiá los datos de prueba y las respuestas simuladas, y ejecutá de nuevo para ver cómo cambia el resultado.', 'Abrí cada paso del resultado para ver qué datos entrega.'],
  sample: [{ nombre: 'Ana', email: 'ana@mail.example', total: 1500 }],
}));
const FREE_DEF = { http: '{\n  "ok": true,\n  "items": [\n    { "nombre": "Mate", "stock": 3 },\n    { "nombre": "Termo", "stock": 12 }\n  ]\n}', ai: 'Respuesta simulada de la IA.', rows: '[\n  { "producto": "Mate", "monto": 1200 },\n  { "producto": "Termo", "monto": 800 }\n]' };
const freeMocks = pf => ((data().free ||= {})[pf] ||= { ...FREE_DEF });
function mocksFor(j, t = {}) {
  if (!j.free) return { http: t.http || j.http, ai: t.ai || j.ai, rows: t.rows || j.rows };
  const m = freeMocks(state.pf), parse = (txt, what) => { try { return JSON.parse(txt); } catch (_) { throw new Error(`la respuesta simulada de ${what} no es JSON válido`); } };
  return { http: () => parse(m.http, 'la API'), rows: () => { const r = parse(m.rows, 'la hoja'); if (!Array.isArray(r)) throw new Error('las filas simuladas tienen que ser una lista'); return r; }, ai: () => { const s = m.ai.trim(); if (s.startsWith('{')) { try { return JSON.parse(s); } catch (_) {} } return m.ai; } };
}

/* ---------------- Teoría por tema (n8n y Zapier) ---------------- */
P.n8n.lessons.push(
  ['IA en n8n: modelos, prompts y agentes', [
    '<p>n8n tiene nodos de IA de dos tipos. Los <b>simples</b> hacen una tarea: enviar un mensaje a un modelo, clasificar texto (<b>Text Classifier</b>), extraer datos (<b>Information Extractor</b>) o resumir. El <b>AI Agent</b> decide por sí mismo qué pasos dar.</p>',
    '<p>Un AI Agent se arma con sub-nodos: un <b>Chat Model</b> (el modelo), <b>Memory</b> (para recordar la conversación) y <b>Tools</b> (lo que puede usar: una API, una hoja, otro workflow).</p>',
    '<ul><li>Incluí en el prompt los datos del item con expresiones.</li><li>Pedí un formato cerrado: una palabra de una lista o un JSON con campos fijos.</li><li>Para garantizar JSON válido usá <b>Structured Output Parser</b>.</li><li>Dejá siempre una ruta de respaldo: la respuesta puede no ser la esperada.</li></ul>',
    '<p>Cada llamada cuesta tokens. Usá el modelo más chico que resuelva la tarea y no mandes al modelo datos que no necesita.</p>'
  ]],
  ['El nodo Code y el trabajo con datos', [
    '<p>El nodo <b>Code</b> tiene dos modos:</p><ul><li><b>Run Once for All Items</b> (por defecto): el código corre una vez y ve todos los items con <code>$input.all()</code>. Devuelve una lista de <code>{ json: {...} }</code>. Sirve para sumar, agrupar o quitar duplicados.</li><li><b>Run Once for Each Item</b>: corre una vez por item, con <code>$json</code>. Devuelve un objeto.</li></ul>',
    '<pre>// All Items\nconst total = $input.all().reduce((a, i) => a + i.json.monto, 0);\nreturn [{ json: { total } }];</pre>',
    '<p>Antes de escribir código, mirá los nodos de datos: <b>Summarize</b> (sumar, contar, promediar, agrupar), <b>Sort</b>, <b>Limit</b>, <b>Remove Duplicates</b>, <b>Split Out</b> y <b>Aggregate</b>. Son más fáciles de mantener.</p>'
  ]],
  ['Conectar servicios: credenciales, APIs y webhooks', [
    '<ul><li><b>Credentials</b>: cada servicio guarda su clave una sola vez y se reutiliza. Nunca van escritas en un nodo.</li><li><b>HTTP Request</b>: conecta cualquier API que no tenga nodo propio. Soporta autenticación, paginación y reintentos.</li><li><b>Webhook</b>: es la URL que otros sistemas llaman para disparar tu workflow.</li></ul>',
    '<p>Después de un HTTP Request, <code>$json</code> es la <b>respuesta</b> de la API. Para volver a un dato anterior usá <code>$(\'Nombre del nodo\')</code>.</p>',
    '<p>Buenas prácticas: activá <b>Retry On Fail</b> para errores pasajeros, respetá el rate limit del proveedor y revisá el código de respuesta (401 credencial, 404 recurso, 429 demasiadas llamadas).</p>'
  ]]
);
P.zapier.lessons.push(
  ['IA en Zapier', [
    '<p><b>AI by Zapier</b> agrega un paso de IA a cualquier Zap: le das un prompt, le pasás datos de pasos anteriores y definís qué <b>campos de salida</b> querés (texto, número, sí/no). También hay apps como ChatGPT o Claude para usar tu propia cuenta.</p>',
    '<ul><li>Usos típicos: resumir, clasificar, extraer datos y redactar borradores.</li><li>Mapeá en el prompt los campos del trigger.</li><li>Definí campos de salida con nombre, así el paso siguiente los puede usar.</li></ul>',
    '<p>La IA puede equivocarse o inventar. Cuando la salida llega a un cliente o cambia datos importantes, sumá revisión humana: un aviso con el borrador antes de enviar.</p>'
  ]],
  ['Code by Zapier y datos', [
    '<p><b>Code by Zapier</b> corre JavaScript o Python. Los datos entran por <b>Input Data</b>: definís nombres y los mapeás desde pasos anteriores. En el código están en <code>inputData</code>, y <b>siempre son texto</b>.</p>',
    '<pre>const monto = Number(inputData.monto);\noutput = { prioridad: monto >= 3000 ? \'alta\' : \'normal\' };</pre>',
    '<ul><li>Lo que asignás a <code>output</code> queda disponible para los pasos siguientes.</li><li>Tiene límites de tiempo y memoria: es para lógica corta.</li><li>Las listas suelen llegar como <b>line items</b> o texto separado por comas.</li></ul>',
    '<p>Probá primero con <b>Formatter</b>, <b>Lookup Table</b> o <b>Filter</b>: si alcanzan, son más fáciles de mantener que el código.</p>'
  ]],
  ['Apps, conexiones y webhooks', [
    '<ul><li>Cada app se conecta una vez (<b>connection</b>) y esa conexión se reutiliza en todos los Zaps.</li><li><b>Webhooks by Zapier</b> recibe datos de sistemas sin integración (Catch Hook) o llama a una API (GET, POST). Es una app premium.</li><li>Los triggers por <b>polling</b> evitan duplicados recordando el identificador de cada registro ya procesado.</li></ul>',
    '<p>Si una app devuelve error, el paso falla y queda en el <b>Zap History</b>, desde donde se puede reintentar. Con <b>Autoreplay</b>, Zapier reintenta solo los pasos fallidos.</p>',
    '<p>Buenas prácticas: usá una cuenta de servicio y no una personal, y revisá los permisos que pide cada conexión.</p>'
  ]]
);
const QUIZ_EXTRA = {
  n8n: [
    ['ia', 'IA y agentes', [
      ['¿Qué necesita un AI Agent para funcionar?', ['Un Chat Model, y opcionalmente memoria y herramientas', 'Solo un nodo Code', 'Un Webhook de producción', 'Una hoja de cálculo'], 'El Chat Model es obligatorio; Memory y Tools amplían lo que puede hacer.'],
      ['¿Cómo conseguís que la salida del modelo sea fácil de enrutar?', ['Pidiendo un formato cerrado, como una palabra de una lista o un JSON fijo', 'Pidiendo una respuesta larga y creativa', 'Subiendo la temperatura', 'Sin dar instrucciones'], 'Una salida predecible se puede comparar en un Switch.'],
      ['¿Por qué dejar una ruta de respaldo después de clasificar con IA?', ['Porque el modelo puede devolver algo inesperado', 'Porque n8n lo exige', 'Porque ahorra tokens', 'No hace falta'], 'Sin respaldo, un item mal clasificado se pierde sin aviso.'],
      ['¿Qué nodo ayuda a garantizar que el modelo devuelva JSON con una estructura?', ['Structured Output Parser', 'Sort', 'Schedule Trigger', 'Remove Duplicates'], 'Valida la salida contra un esquema.'],
    ]],
    ['codigo', 'Código y análisis de datos', [
      ['¿Qué modo del nodo Code usarías para sumar el total de todos los items?', ['Run Once for All Items', 'Run Once for Each Item', 'Cualquiera, da igual', 'Ninguno: no se puede'], 'Necesitás ver todos los items juntos con $input.all().'],
      ['En modo All Items, ¿qué tiene que devolver el código?', ['Una lista de objetos { json: {...} }', 'Un texto', 'Un número', 'Nada'], 'Cada elemento de la lista es un item de salida.'],
      ['Summarize con sum de monto agrupado por region. ¿Cómo se llama el campo de salida?', ['sum_monto', 'monto', 'total', 'region_sum'], 'El nombre es operación_campo.'],
      ['Los montos llegan como texto ("1200"). ¿Qué hacés antes de sumar?', ['Convertirlos con Number()', 'Sumarlos igual', 'Pasarlos a mayúsculas', 'Borrarlos'], '"1200" + "300" da "1200300", no 1500.'],
    ]],
    ['conexiones', 'Conexión con servicios', [
      ['¿Dónde se guarda la clave de una API?', ['En Credentials', 'En la URL del HTTP Request', 'En un nodo Code', 'En el nombre del workflow'], 'Así se reutiliza y no queda expuesta al exportar el workflow.'],
      ['Después de un HTTP Request, ¿qué contiene $json?', ['La respuesta de la API', 'Los datos del Webhook', 'Las credenciales', 'Nada'], 'Para leer datos anteriores se usa $(\'Nombre del nodo\').'],
      ['Una API responde 429. ¿Qué significa?', ['Demasiadas llamadas: superaste el rate limit', 'Credencial incorrecta', 'El recurso no existe', 'Todo bien'], '401 es credencial, 404 recurso inexistente.'],
      ['¿Para qué sirve Retry On Fail?', ['Para reintentar un nodo ante errores pasajeros', 'Para borrar el workflow', 'Para activar el Webhook', 'Para ordenar items'], 'Útil ante cortes momentáneos de red o del proveedor.'],
    ]],
  ],
  zapier: [
    ['ia', 'IA en Zapier', [
      ['¿Para qué sirven los campos de salida en AI by Zapier?', ['Para que los pasos siguientes puedan mapear cada dato', 'Para pagar menos', 'Para elegir el trigger', 'No existen'], 'Un campo con nombre se usa como cualquier otro dato del Zap.'],
      ['Una reseña negativa se responde con un texto de IA. ¿Qué conviene?', ['Que una persona revise el borrador antes de enviarlo', 'Enviarlo sin mirar', 'Borrar la reseña', 'Desactivar el Zap'], 'La IA puede prometer algo que no corresponde.'],
      ['¿Qué tenés que incluir en el prompt para que la IA trabaje sobre el caso real?', ['Los campos del trigger mapeados', 'Solo instrucciones generales', 'El nombre del Zap', 'Nada'], 'Sin los datos, el modelo responde en abstracto.'],
      ['¿Qué riesgo propio de la IA hay que tener presente?', ['Que invente o se equivoque con seguridad aparente', 'Que borre el Zap', 'Que cambie el trigger', 'Ninguno'], 'Por eso se validan las salidas importantes.'],
    ]],
    ['codigo', 'Code by Zapier y datos', [
      ['¿De qué tipo son los valores de inputData?', ['Siempre texto', 'Números', 'Depende del día', 'Objetos'], 'Hay que convertir con Number() o JSON.parse().'],
      ['¿Cómo devolvés datos al Zap desde JavaScript?', ['Asignándolos a output', 'Con console.log', 'Con alert', 'No se puede'], 'Lo que queda en output lo usan los pasos siguientes.'],
      ['¿Cuándo conviene usar Code by Zapier?', ['Cuando Formatter, Filter o Lookup Table no alcanzan', 'Siempre, antes que nada', 'Para procesos de varios minutos', 'Nunca'], 'Tiene límites de tiempo y memoria.'],
      ['¿Qué app acumula datos para enviar un resumen más tarde?', ['Digest by Zapier', 'Filter by Zapier', 'Paths', 'Webhooks by Zapier'], 'Junta entradas y las libera en un resumen.'],
    ]],
    ['conexiones', 'Apps y conexiones', [
      ['¿Qué hace Catch Hook?', ['Recibe datos que otro sistema envía a una URL', 'Llama a una API cada hora', 'Envía emails', 'Crea tarjetas'], 'Es el trigger de Webhooks by Zapier.'],
      ['¿Cómo evita duplicados un trigger por polling?', ['Recordando el identificador de cada registro ya procesado', 'Borrando la app', 'Con un Filter obligatorio', 'No los evita'], 'Solo dispara con registros nuevos.'],
      ['Un paso falló por un error de la app. ¿Dónde lo ves y lo reintentás?', ['En Zap History', 'En el trigger', 'En Formatter', 'No se puede'], 'Con Autoreplay se reintenta solo.'],
      ['¿Qué cuenta conviene usar para conectar una app en un Zap de la empresa?', ['Una cuenta de servicio', 'La personal de quien arma el Zap', 'Cualquiera', 'Una compartida por chat'], 'Si la persona se va, el Zap sigue funcionando.'],
    ]],
  ],
};
Object.keys(P).forEach(pf => { P[pf].quizzes = [{ id: 'base', title: 'Fundamentos', qs: P[pf].quiz }, ...(QUIZ_EXTRA[pf] || []).map(([id, title, qs]) => ({ id, title, qs }))]; });
const all = (f, out = []) => { const walk = s => s.forEach(n => { out.push(n); (n.branches || []).forEach(b => walk(b.steps)); }); walk(f.steps); return out; };
const has = (f, op) => all(f).some(n => n.op === op);

/* ---------------- Simulador ---------------- */
class SimError extends Error {}
const fail = m => { throw new SimError(m); };
const FN = { upper: s => String(s ?? '').toUpperCase(), lower: s => String(s ?? '').toLowerCase(), trim: s => String(s ?? '').trim(), capitalize: s => String(s ?? '').toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase()), length: s => (s ?? '').length, round: n => Math.round(Number(n)), now: () => new Date().toISOString(), iff: (c, a, b) => (c ? a : b) };
function evalCode(code, item, pf) {
  try {
    if (pf === 'n8n') {
      const ref = name => { if (!(name in item.names)) throw new Error(`no hay un nodo anterior llamado «${name}»`); const json = item.names[name]; return { item: { json }, first: () => ({ json }), json }; };
      return new Function('$json', '$', '$now', 'return (' + code + ')')(item.json, ref, new Date().toISOString());
    }
    const js = code.replace(/(?<![\w.$\]"'])(\d+)\.(?=[A-Za-z_])/g, (m, n) => { if (!(n in item.ctx)) throw new Error(`no hay un paso ${n} antes de este`); return `$m[${n}].`; }).replace(/\bif\s*\(/g, 'iff(').replace(/;/g, ',');
    return new Function('$m', ...Object.keys(FN), 'return (' + js + ')')(item.ctx, ...Object.values(FN));
  } catch (e) { fail(`Expresión {{${code.trim()}}}: ${e.message}`); }
}
function ev(src, item, pf) {
  const s = String(src ?? ''), one = s.trim().match(/^\{\{([\s\S]+?)\}\}$/);
  if (one && !one[1].includes('{{')) return evalCode(one[1], item, pf);
  return s.replace(/\{\{([\s\S]+?)\}\}/g, (_, c) => { const v = evalCode(c, item, pf); return v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); });
}
function test(cond, item, pf) {
  const l = ev(cond.left, item, pf), r = ev(cond.right, item, pf);
  const num = v => v !== '' && v != null && !isNaN(Number(v)), both = num(l) && num(r);
  switch (cond.op) {
    case 'eq': return both ? Number(l) === Number(r) : String(l ?? '') === String(r ?? '');
    case 'neq': return both ? Number(l) !== Number(r) : String(l ?? '') !== String(r ?? '');
    case 'contains': return String(l ?? '').includes(String(r ?? ''));
    case 'ncontains': return !String(l ?? '').includes(String(r ?? ''));
    case 'gt': return both && Number(l) > Number(r); case 'gte': return both && Number(l) >= Number(r);
    case 'lt': return both && Number(l) < Number(r); case 'lte': return both && Number(l) <= Number(r);
    case 'exists': return l != null && l !== ''; case 'empty': return l == null || l === '';
  }
  return false;
}
function number(flow) { let i = 0; all(flow).forEach(n => { n.num = ++i; }); }
function runFlow(flow, pf, input, mocks = {}) {
  const httpMock = mocks.http;
  number(flow);
  const trace = [], calls = []; let error = null, failed = null;
  const child = (json, prev) => ({ json, ctx: { ...(prev ? prev.ctx : {}) }, names: { ...(prev ? prev.names : {}) } });
  const stamp = (it, n) => { it.ctx[n.num] = it.json; it.names[n.name] = it.json; return it; };
  const req = (v, what) => { if (String(v ?? '').trim() === '') fail(`Falta completar «${what}».`); return v; };
  function exec(n, items) {
    const p = n.p, out = [];
    const each = fn => items.forEach(it => { const j = fn(it); if (j !== undefined) out.push(stamp(child(j, it), n)); });
    switch (n.op) {
      case 'webhook': case 'schedule': return (Array.isArray(input) && input.length ? input : [{}]).map(j => stamp(child(clone(j)), n));
      case 'set': each(it => { const o = p.keep ? { ...it.json } : {}; p.fields.forEach(f => { if (f.name.trim()) o[f.name.trim()] = ev(f.value, it, pf); }); return o; }); break;
      case 'code': {
        const norm = r => (r && typeof r === 'object' && r.json && typeof r.json === 'object' ? r.json : r);
        const push = (r, it) => (Array.isArray(r) ? r : [r]).forEach(x => { x = norm(x); if (!x || typeof x !== 'object') fail('El código tiene que devolver un objeto (o una lista de objetos).'); out.push(stamp(child(x, it), n)); });
        const runJs = (args, vals) => { try { return new Function(...args, pf === 'zapier' ? `let output;\n${p.code}\n;return output;` : p.code)(...vals); } catch (e) { fail('El código lanzó un error: ' + e.message); } };
        if (pf !== 'zapier' && p.mode === 'all') {
          const list = items.map(i => ({ json: clone(i.json) }));
          const r = runJs(['items', '$input'], [list, { all: () => list, first: () => list[0] }]);
          if (r === undefined) fail('El código tiene que devolver los items: return [{ json: { ... } }]');
          push(r, items[0]);
        } else items.forEach(it => {
          const j = clone(it.json); let inputData = j;
          if (pf === 'zapier') { inputData = {}; (p.inputs || []).forEach(c2 => { if (c2.name.trim()) { const v = ev(c2.value, it, pf); inputData[c2.name.trim()] = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); } }); }
          const r = runJs(['$json', 'inputData', '$input'], [j, inputData, { item: { json: j }, all: () => [{ json: j }], first: () => ({ json: j }) }]);
          if (r === undefined) fail(pf === 'zapier' ? 'El código tiene que asignar output = { ... }' : 'El código tiene que devolver un objeto: return { ... }');
          push(r, it);
        });
        break;
      }
      case 'ai': each(it => { const prompt = String(req(ev(p.prompt, it, pf), 'prompt')); let r; try { r = mocks.ai ? mocks.ai(prompt, n) : 'Respuesta simulada de la IA.'; } catch (e) { fail('IA: ' + e.message); } calls.push({ app: 'ai', node: n.name, params: { prompt } }); return r && typeof r === 'object' ? { ...r, text: r.text ?? JSON.stringify(r) } : { text: String(r) }; }); break;
      case 'crm': each(it => { const props = {}; (p.props || []).forEach(c2 => { if (c2.name.trim()) props[c2.name.trim()] = ev(c2.value, it, pf); }); const params = { email: req(ev(p.email, it, pf), 'email'), name: String(ev(p.name, it, pf) ?? ''), props }; calls.push({ app: 'crm', node: n.name, params }); return { id: 'contact_' + calls.length, email: params.email, name: params.name, ...props }; }); break;
      case 'task': each(it => { const params = { list: req(ev(p.list, it, pf), 'lista'), title: String(req(ev(p.title, it, pf), 'título')), description: String(ev(p.description, it, pf) ?? ''), due: String(ev(p.due, it, pf) ?? '') }; calls.push({ app: 'task', node: n.name, params }); return { id: 'card_' + calls.length, ...params }; }); break;
      case 'sheetsRead': items.forEach(it => { req(p.sheet, 'hoja'); let rows; try { rows = clone((mocks.rows ? mocks.rows(p.sheet.trim()) : []) || []); } catch (e) { fail('Hoja: ' + e.message); } if (pf === 'zapier') out.push(stamp(child({ rows, count: rows.length }, it), n)); else rows.forEach(r => out.push(stamp(child(r, it), n))); }); break;
      case 'summarize': {
        const defs = (p.fields || []).filter(f => f.name.trim()); if (!defs.length) fail('Agregá al menos un campo a resumir.');
        const g = (p.groupBy || '').trim(), groups = new Map();
        items.forEach(it => { const k = g ? it.json[g] : '_'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); });
        groups.forEach((list, k) => {
          const o = g ? { [g]: k } : {};
          defs.forEach(f => {
            const agg = f.value.trim().toLowerCase() || 'sum', fld = f.name.trim(), nums = list.map(i => Number(i.json[fld])).filter(v => !isNaN(v)), sum = nums.reduce((a, b) => a + b, 0);
            if (!['sum', 'count', 'avg', 'min', 'max'].includes(agg)) fail(`Operación «${f.value}» no válida: usá sum, count, avg, min o max.`);
            o[`${agg}_${fld}`] = agg === 'count' ? list.length : agg === 'sum' ? sum : agg === 'avg' ? (nums.length ? sum / nums.length : 0) : agg === 'min' ? Math.min(...nums) : Math.max(...nums);
          });
          out.push(stamp(child(o, list[0]), n));
        });
        break;
      }
      case 'sort': { const fld = String(req(p.field, 'campo')).trim(); [...items].sort((a, b) => { const x = a.json[fld], y = b.json[fld]; const c = (!isNaN(Number(x)) && !isNaN(Number(y))) ? Number(x) - Number(y) : String(x ?? '').localeCompare(String(y ?? '')); return p.dir === 'desc' ? -c : c; }).forEach(it => out.push(stamp(child(it.json, it), n))); break; }
      case 'limit': items.slice(0, Math.max(1, parseInt(p.max, 10) || 1)).forEach(it => out.push(stamp(child(it.json, it), n))); break;
      case 'dedupe': { const fld = String(req(p.field, 'campo')).trim(), seen = new Set(); items.forEach(it => { const k = String(it.json[fld]); if (!seen.has(k)) { seen.add(k); out.push(stamp(child(it.json, it), n)); } }); break; }
      case 'filter': each(it => (test(p.cond, it, pf) ? it.json : undefined)); break;
      case 'split': items.forEach(it => {
        req(p.field, 'lista a separar');
        const v = p.field.includes('{{') ? ev(p.field, it, pf) : p.field.trim().split('.').reduce((o, k) => (o == null ? o : o[k]), it.json);
        if (!Array.isArray(v)) fail(`«${p.field}» no es una lista en los datos de entrada.`);
        v.forEach(el => out.push(stamp(child(el && typeof el === 'object' ? el : { value: el }, it), n)));
      }); break;
      case 'aggregate': if (items.length) out.push(stamp(child({ [p.field.trim() || 'items']: items.map(i => i.json) }, items[0]), n)); break;
      case 'http': each(it => { const url = req(ev(p.url, it, pf), 'URL'); let r; try { r = httpMock ? httpMock({ url, method: p.method }) : { ok: true }; } catch (e) { fail('HTTP: ' + e.message); } calls.push({ app: 'http', node: n.name, params: { method: p.method, url } }); return clone(r); }); break;
      case 'sheets': each(it => { req(p.sheet, 'hoja'); const values = {}; p.columns.forEach(c2 => { if (c2.name.trim()) values[c2.name.trim()] = ev(c2.value, it, pf); }); if (!Object.keys(values).length) fail('Agregá al menos una columna.'); calls.push({ app: 'sheets', node: n.name, params: { doc: p.doc, sheet: p.sheet, values } }); return { ...values, row_number: 2 + calls.filter(x => x.app === 'sheets').length }; }); break;
      case 'mail': each(it => { const params = { to: req(ev(p.to, it, pf), 'destinatario'), subject: String(ev(p.subject, it, pf) ?? ''), body: String(ev(p.body, it, pf) ?? '') }; calls.push({ app: 'mail', node: n.name, params }); return { id: 'msg_' + uid(), ...params }; }); break;
      case 'slack': each(it => { const params = { channel: req(ev(p.channel, it, pf), 'canal'), text: String(req(ev(p.text, it, pf), 'texto')) }; calls.push({ app: 'slack', node: n.name, params }); return { ok: true, ts: String(Date.now()), ...params }; }); break;
      case 'telegram': each(it => { const params = { chatId: req(ev(p.chatId, it, pf), 'chat ID'), text: String(req(ev(p.text, it, pf), 'texto')) }; calls.push({ app: 'telegram', node: n.name, params }); return { ok: true, message_id: calls.length, ...params }; }); break;
    }
    return out;
  }
  function seq(steps, items, first) {
    for (const n of steps) {
      if (!first && !items.length) { trace.push({ num: n.num, name: n.name, skipped: true, note: 'No llegaron datos: no se ejecuta.' }); continue; }
      first = false;
      try {
        if (n.op === 'if') {
          const t = [], f = []; items.forEach(it => (test(n.p.cond, it, pf) ? t : f).push(stamp(child(it.json, it), n)));
          trace.push({ num: n.num, name: n.name, out: items.map(i => i.json), note: `true: ${t.length} · false: ${f.length}` });
          seq(n.branches[0].steps, t); seq(n.branches[1].steps, f); return;
        }
        if (n.op === 'router') {
          const buckets = n.branches.map(() => []);
          items.forEach(it => {
            const s = stamp(child(it.json, it), n); let hit = false;
            n.branches.forEach((b, i) => { if (b.fallback || (hit && P[pf].routerMode === 'first')) return; if (test(b.cond, s, pf)) { buckets[i].push(s); hit = true; } });
            if (!hit) { const fb = n.branches.findIndex(b => b.fallback); if (fb >= 0) buckets[fb].push(s); }
          });
          trace.push({ num: n.num, name: n.name, out: items.map(i => i.json), note: n.branches.map((b, i) => `${b.name}: ${buckets[i].length}`).join(' · ') });
          n.branches.forEach((b, i) => seq(b.steps, buckets[i])); return;
        }
        const out = exec(n, items);
        trace.push({ num: n.num, name: n.name, out: out.map(i => i.json), note: `${items.length || 1} entrada(s) → ${out.length} salida(s)` });
        items = out;
      } catch (e) { e.num = e.num || n.num; e.nodeName = e.nodeName || n.name; throw e; }
    }
  }
  try {
    if (!flow.steps.length) fail('El flujo está vacío: elegí un trigger.');
    if (!TRIGGERS.includes(flow.steps[0].op)) fail('El primer paso tiene que ser un trigger.');
    seq(flow.steps, [], true);
  } catch (e) { error = e.message; failed = e.num || null; trace.push({ num: e.num, name: e.nodeName || 'Flujo', error: e.message }); }
  return { trace, calls, error, failed };
}

/* ---------------- Datos del usuario (solo en este navegador) ---------------- */
const KEY = 'flowdev-v1';
const blank = () => ({ progress: {}, flows: {}, quiz: {}, free: {} });
let db = { users: {}, session: null, guest: blank() };
try { const raw = localStorage.getItem(KEY); if (raw) db = { ...db, ...JSON.parse(raw) }; } catch (_) {}
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (_) {} };
const me = () => (db.session && db.users[db.session]) || null;
const data = () => me() || db.guest;
async function hash(text) {
  if (window.crypto?.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  let h = 5381; for (const ch of text) h = (Math.imul(h, 33) ^ ch.charCodeAt(0)) >>> 0; return 'x' + h.toString(16);
}
const graded = pf => PROJ[pf].filter(j => !j.free);
const TOTAL = pf => P[pf].lessons.length + graded(pf).length + P[pf].quizzes.length;
const validKeys = pf => new Set([...P[pf].lessons.map((_, i) => `${pf}:L${i}`), ...graded(pf).map(j => `${pf}:P:${j.id}`), ...P[pf].quizzes.map(q => `${pf}:Q:${q.id}`)]);
const doneCount = pf => { const v = validKeys(pf); return Object.keys(data().progress).filter(k => v.has(k)).length; };
const pct = pf => Math.round(doneCount(pf) / TOTAL(pf) * 100);
const mark = k => { if (!data().progress[k]) { data().progress[k] = true; persist(); } };

/* ---------------- Vistas ---------------- */
const state = { view: 'home', pf: null, tab: 'lecciones', proj: null, flow: null, sel: null, run: null, results: null, auth: 'registro', reveal: new Set(), graded: false, quizId: null, ptab: 'ej', ins: null, tquiz: null, inputRaw: null };
const view = $('#view');
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2800); }
function go(v, extra = {}) { Object.assign(state, { view: v, sel: null, run: null, results: null, reveal: new Set(), graded: false, quizId: null, ptab: 'ej', ins: null, tquiz: null }, extra); render(); window.scrollTo(0, 0); }

function renderNav() {
  const links = [['home', 'Inicio'], ['n8n', 'n8n'], ['make', 'Make'], ['zapier', 'Zapier'], ['dash', 'Mi avance']];
  $('#navLinks').innerHTML = links.map(([k, l]) => `<button type="button" data-go="${k}"${(state.view === k || (state.view !== 'home' && state.view !== 'dash' && state.pf === k)) ? ' aria-current="page"' : ''}>${l}</button>`).join('').replace('<button type="button" data-go="dash"', `<a href="${SAP.href}">SAP CPI</a><button type="button" data-go="dash"`);
  const u = me();
  $('#navUser').innerHTML = u
    ? `<span class="chip"><i>${esc(u.name.trim()[0]?.toUpperCase() || '?')}</i>${esc(u.name.split(' ')[0])}</span><button type="button" class="btn line sm" data-act="logout">Salir</button>`
    : `<button type="button" class="btn line sm" data-auth="ingreso">Ingresar</button><button type="button" class="btn sky sm" data-auth="registro">Crear cuenta</button>`;
}
const counts = () => ({ les: Object.values(P).reduce((a, p) => a + p.lessons.length, 0), pro: Object.keys(PROJ).reduce((a, k) => a + graded(k).length, 0), q: Object.values(P).reduce((a, p) => a + p.quizzes.length, 0) });

function pcard(pf) {
  const p = P[pf], d = pct(pf);
  return `<button type="button" class="pcard ${p.tone === 'white' ? '' : p.tone}" data-go="${pf}">
    <div class="row" style="justify-content:space-between"><span class="pill">${esc(p.flow)}s</span><span class="arrow">${svg('arrow')}</span></div>
    <div class="name">${p.name}</div><p class="${p.tone === 'dark' ? 'dim' : ''}">${esc(p.tag)}</p>
    <div class="foot-row"><div style="flex:1"><div class="meter"><span style="width:${d}%"></span></div></div><span style="font-variant-numeric:tabular-nums;font-size:13px">${d}%</span></div>
  </button>`;
}
function home() {
  const c = counts(), u = me();
  return `
  <section class="card flush split">
    <div class="side">
      <h1 class="display">Aprendé a automatizar con flujos</h1>
      <div><span class="pill">n8n · Make · Zapier · SAP CPI</span></div>
      <p class="lead">flowDev te enseña a pensar y construir automatizaciones e integraciones: lecciones cortas, proyectos guiados y un editor que revisa tu flujo paso a paso.</p>
      <div class="row">${u ? `<button class="btn" data-go="dash">Seguir donde quedé</button>` : `<button class="btn" data-auth="registro">Crear cuenta gratis</button><button class="btn line" data-go="n8n">Probar sin cuenta</button>`}</div>
    </div>
    <div class="side dark">
      <div class="tiles">
        <div class="tile"><span class="big">4</span><p>plataformas con el mismo método</p></div>
        <div class="tile grey">${svg('router')}<p>${c.pro + SAP.scenarios + SAP.practice} proyectos y ejercicios con verificación</p></div>
        <div class="tile grey">${svg('code')}<p>${c.les} lecciones cortas, sin relleno</p></div>
        <div class="tile"><span class="big">${c.q + SAP.quizzes}</span><p>cuestionarios para repasar</p></div>
      </div>
    </div>
  </section>

  <section class="card">
    <div class="grid2" style="align-items:end;margin-bottom:22px">
      <h2 class="display">Elegí tu plataforma</h2>
      <p class="lead">Todas resuelven lo mismo con ideas parecidas: un disparador, pasos que transforman datos y lógica para decidir. Lo que aprendés en una te sirve en las otras.</p>
    </div>
    <div class="grid3">${Object.keys(P).map(pcard).join('')}</div>
    <a class="pcard grey wide" href="${SAP.href}" style="margin-top:14px">
      <div class="row" style="justify-content:space-between"><span class="pill">iFlows · integración empresarial</span><span class="arrow">${svg('arrow')}</span></div>
      <div class="name">SAP CPI</div>
      <p class="dim" style="max-width:62ch">El taller completo de SAP Cloud Integration: editor BPMN de iFlows con adaptadores, Router, Message Mapping, Groovy, Data Store, PGP y Local Integration Process, y un trace paso a paso.</p>
      <div class="row"><span class="pill fill">${SAP.scenarios} escenarios guiados</span><span class="pill fill">${SAP.quizzes} cuestionarios teóricos</span><span class="pill fill">${SAP.practice} ejercicios extra</span><span class="pill fill">Modo libre</span></div>
    </a>
    <div class="grid2" style="margin-top:14px">${SOON.map(([n, d]) => `<div class="pcard soon"><div><span class="pill">Próximamente</span></div><div class="name">${n}</div><p>${esc(d)}</p></div>`).join('')}</div>
  </section>

  <section class="card dark flush split">
    <div class="side">
      <h2 class="display">Ruta de aprendizaje</h2>
      <div><span class="pill">por etapa</span></div>
      <p class="lead dim">Cada plataforma sigue el mismo recorrido. Avanzás de entender los conceptos a resolver un caso real con una API.</p>
    </div>
    <div class="side">
      <div class="bars">
        <div class="bar"><b>Conceptos</b><i style="height:34%"></i><span>Lecciones</span></div>
        <div class="bar"><b>Primer flujo</b><i style="height:54%"></i><span>Inicial</span></div>
        <div class="bar"><b>Lógica</b><i style="height:76%"></i><span>Intermedio</span></div>
        <div class="bar"><b>APIs y listas</b><i style="height:100%"></i><span>Avanzado</span></div>
      </div>
    </div>
  </section>

  <section class="card flush split">
    <div class="side">
      <h2 class="display">Cómo se practica</h2>
      <span class="arrow">${svg('down')}</span>
      <p class="lead">Armás el flujo en un editor con el vocabulario de cada herramienta, lo ejecutás con datos de prueba y flowDev te dice qué funciona y qué falta.</p>
    </div>
    <div class="side" style="gap:10px">
      <div class="tile black" style="min-height:0"><p class="eyebrow dim">Ejecutar</p><p class="h3">Mirá qué datos entran y salen de cada paso.</p></div>
      <div class="grid2" style="gap:10px">
        <div class="tile" style="min-height:140px"><span class="big">Verificar</span><p>Casos de prueba automáticos por proyecto.</p></div>
        <div class="tile" style="min-height:140px"><span class="pill" style="align-self:flex-start;background:#fff;border-color:#fff">Solución</span><p>Si te trabás, cargás la respuesta y la estudiás.</p></div>
      </div>
    </div>
  </section>`;
}

function auth() {
  const reg = state.auth === 'registro';
  return `<section class="card flush split">
    <div class="side dark">
      <h1 class="display">${reg ? 'Creá tu cuenta' : 'Volvé a tu avance'}</h1>
      <div><span class="pill">gratis</span></div>
      <p class="lead dim">${reg ? 'Guardá tus flujos, tus respuestas y tu progreso en las tres plataformas.' : 'Ingresá para seguir con tus proyectos donde los dejaste.'}</p>
      <div class="tiles" style="margin-top:auto">
        <div class="tile"><span class="big">${counts().pro}</span><p>proyectos para resolver</p></div>
        <div class="tile grey">${svg('sheets')}<p>Tu avance queda guardado en este navegador</p></div>
      </div>
    </div>
    <div class="side">
      <div class="tabs" role="tablist"><button type="button" data-auth="registro" aria-selected="${reg}">Crear cuenta</button><button type="button" data-auth="ingreso" aria-selected="${!reg}">Ingresar</button></div>
      <form id="authForm" novalidate>
        ${reg ? `<label class="fld"><span>Nombre</span><input id="au_name" autocomplete="name" required></label>` : ''}
        <label class="fld"><span>Email</span><input id="au_email" type="email" autocomplete="email" required></label>
        <label class="fld"><span>Contraseña</span><input id="au_pass" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" minlength="6" required></label>
        <p class="err" id="authErr" role="alert"></p>
        <div class="row"><button class="btn" type="submit">${reg ? 'Crear cuenta' : 'Ingresar'}</button><button class="btn line" type="button" data-go="n8n">Seguir sin cuenta</button></div>
      </form>
      <p class="note">Las cuentas de flowDev se guardan solo en este navegador: no se envía nada a un servidor y no sirven en otro dispositivo. No uses una contraseña que uses en otros sitios.</p>
    </div>
  </section>`;
}

function dash() {
  const u = me(), keys = Object.keys(P), totalDone = keys.reduce((a, k) => a + doneCount(k), 0), total = keys.reduce((a, k) => a + TOTAL(k), 0);
  return `<section class="card flush split">
    <div class="side">
      <h1 class="display">${u ? 'Hola, ' + esc(u.name.split(' ')[0]) : 'Tu avance'}</h1>
      <div><span class="pill">${totalDone} de ${total} completados</span></div>
      <p class="lead">${u ? 'Este es tu progreso en cada plataforma.' : 'Estás practicando sin cuenta. El avance se guarda en este navegador; con una cuenta queda separado por persona.'}</p>
      ${u ? '' : '<div><button class="btn" data-auth="registro">Crear cuenta</button></div>'}
    </div>
    <div class="side dark">
      <p class="eyebrow dim">${Math.round(totalDone / total * 100)}% del recorrido</p>
      <div class="dots">${Array.from({ length: total }, (_, i) => `<i class="${i < totalDone ? 'on' : ''}"></i>`).join('')}</div>
      <div class="bars" style="height:150px;margin-top:auto">${keys.map(k => `<div class="bar"><b>${pct(k)}%</b><i style="height:${Math.max(6, pct(k))}%"></i><span>${P[k].name}</span></div>`).join('')}</div>
    </div>
  </section>
  <section class="grid3">${keys.map(pcard).join('')}</section>`;
}

const order = q => { let s = 7; for (const ch of q[0]) s = (Math.imul(s, 31) + ch.charCodeAt(0)) >>> 0; const idx = q[1].map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; const k = (s >>> 16) % (i + 1); [idx[i], idx[k]] = [idx[k], idx[i]]; } return idx; };
function platform() {
  const pf = state.pf, p = P[pf], pr = data().progress, tab = state.tab, gr = graded(pf);
  const item = j => `<button type="button" class="list-item" data-proj="${j.id}"><span class="pill${pr[`${pf}:P:${j.id}`] ? ' ok' : ''}">${pr[`${pf}:P:${j.id}`] ? 'Resuelto' : esc(j.level)}</span><span class="grow"><span class="h3">${esc(j.title)}</span><br><span class="dim">${esc(j.story)}</span></span><span class="arrow">${svg('arrow')}</span></button>`;
  let body = '';
  if (tab === 'lecciones') body = p.lessons.map(([t, parts], i) => `<details class="lesson${pr[`${pf}:L${i}`] ? ' done' : ''}"${i === 0 && !pr[`${pf}:L0`] ? ' open' : ''}>
      <summary><span class="n">${i + 1}</span><span class="h3" style="flex:1">${esc(t)}</span>${pr[`${pf}:L${i}`] ? '<span class="pill ok">Leída</span>' : ''}</summary>
      <div class="body">${parts.join('')}<button type="button" class="btn sm" data-act="read" data-i="${i}">${pr[`${pf}:L${i}`] ? 'Leída' : 'Marcar como leída'}</button></div></details>`).join('');
  else if (tab === 'proyectos') body = [...new Set(gr.map(j => j.cat))].map(c2 => `<p class="gtitle" style="margin-top:20px">${esc(c2)} · ${gr.filter(j => j.cat === c2).length}</p><div>${gr.filter(j => j.cat === c2).map(item).join('')}</div>`).join('');
  else if (tab === 'libre') body = `<div class="grid2" style="align-items:center"><div class="stack"><h2 class="h2">Modo libre</h2><p class="lead">Abrí el ${TALLER[pf].toLowerCase().replace('zaps', 'Zaps')} sin requisitos ni verificación, con todos los ${esc(p.node)}s: IA, código, APIs, hojas y lógica.</p><p class="dim">Vos definís los datos de entrada y qué responden la API, la IA y la hoja de cálculo. Tu ${esc(p.flow)} queda guardado.</p><div><button type="button" class="btn" data-proj="libre">Abrir el editor libre</button></div></div><div class="tiles"><div class="tile">${svg('ai')}<p>Respuesta de la IA a tu medida</p></div><div class="tile grey">${svg('http')}<p>Respuesta de la API en JSON</p></div><div class="tile grey">${svg('sheetsRead')}<p>Filas de la hoja de cálculo</p></div><div class="tile">${svg('code')}<p>Código propio en cada paso</p></div></div></div>`;
  else if (!state.quizId) body = p.quizzes.map(q => `<button type="button" class="list-item" data-quiz="${q.id}"><span class="pill${pr[`${pf}:Q:${q.id}`] ? ' ok' : ''}">${pr[`${pf}:Q:${q.id}`] ? 'Aprobado' : q.qs.length + ' preguntas'}</span><span class="grow"><span class="h3">${esc(q.title)}</span></span><span class="arrow">${svg('arrow')}</span></button>`).join('');
  else {
    const quiz = p.quizzes.find(q => q.id === state.quizId), ans = data().quiz[`${pf}:${quiz.id}`] || {};
    body = `<div class="row" style="justify-content:space-between;margin-bottom:14px"><button type="button" class="btn line sm" data-quiz="">← Cuestionarios</button><span class="h3">${esc(quiz.title)}</span></div>` + quiz.qs.map((q, i) => { const g = state.graded && ans[i] != null, ok = ans[i] === 0, show = state.reveal.has(i);
      return `<div class="q${g ? (ok ? ' ok' : ' bad') : ''}"><p class="t">${i + 1}. ${esc(q[0])}</p>${order(q).map(k => `<label class="${show && k === 0 ? 'right' : ''}"><input type="radio" name="q${i}" data-q="${i}" data-o="${k}"${ans[i] === k ? ' checked' : ''}><span>${esc(q[1][k])}</span></label>`).join('')}${g || show ? `<p class="why">${g ? (ok ? 'Correcto. ' : 'No es esa. ') : ''}${esc(q[2])}</p>` : ''}<div class="row" style="justify-content:flex-end;margin-top:6px"><button type="button" class="btn line sm" data-act="reveal" data-i="${i}">${show ? 'Ocultar respuesta' : 'Ver respuesta'}</button></div></div>`; }).join('')
      + `<div class="row"><button type="button" class="btn" data-act="grade">Corregir</button>${pr[`${pf}:Q:${quiz.id}`] ? '<span class="pill ok">Aprobado</span>' : ''}</div>`;
  }
  return `<section class="card ${p.tone === 'dark' ? 'dark' : ''} flush split">
    <div class="side"><h1 class="display">${p.name}</h1><div><span class="pill">${esc(p.tag)}</span></div><p class="lead ${p.tone === 'dark' ? 'dim' : ''}">${esc(p.intro)}</p><div><button type="button" class="btn ${p.tone === 'dark' ? 'sky' : ''}" data-proj="${(gr.find(j => !pr[`${pf}:P:${j.id}`]) || gr[0]).id}">Abrir el ${TALLER[pf].toLowerCase().replace('zaps', 'Zaps')}</button></div></div>
    <div class="side ${p.tone === 'dark' ? '' : 'dark'}">
      <div class="tiles">
        <div class="tile"><span class="big">${pct(pf)}%</span><p>de ${p.name} completado</p></div>
        <div class="tile grey"><span class="big">${gr.length}</span><p>proyectos guiados</p></div>
        <div class="tile grey"><span class="big">${p.quizzes.length}</span><p>${p.quizzes.length === 1 ? 'cuestionario' : 'cuestionarios por tema'}</p></div>
        <div class="tile"><span class="big">${p.lessons.length}</span><p>lecciones</p></div>
      </div>
    </div>
  </section>
  <section class="card">
    <div class="tabs" role="tablist" style="margin-bottom:16px">${[['lecciones', 'Teoría'], ['proyectos', 'Proyectos'], ['quiz', 'Cuestionarios'], ['libre', 'Modo libre']].map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${tab === k}">${l}</button>`).join('')}</div>
    ${body}
  </section>`;
}

/* ---------------- Taller: barra | paleta | lienzo | panel (la misma distribución que el taller de iFlows) ---------------- */
const TALLER = { n8n: 'Taller de workflows', make: 'Taller de escenarios', zapier: 'Taller de Zaps' };
const getSeq = id => { if (id === 'root') return state.flow.steps; const [nid, bi] = id.split(':'); return all(state.flow).find(n => n.id === nid).branches[+bi].steps; };
const findNode = id => all(state.flow).find(n => n.id === id);
const condText = c => (c && c.left ? `${c.left} ${OPS.find(o => o[0] === c.op)[1]}${['exists', 'empty'].includes(c.op) ? '' : ' ' + c.right}` : 'sin condición');
const kind = op => (TRIGGERS.includes(op) ? 'trigger' : [...APPS, 'http', 'crm', 'task', 'sheetsRead', 'ai'].includes(op) ? 'app' : 'tool');
function nodeHtml(n, pf) {
  const cat = P[pf].cat[n.op] || [n.op], r = state.run;
  const cls = ['fnode', 'k-' + kind(n.op), state.sel === n.id ? 'sel' : '', r && r.failed === n.num ? 'failed' : r && r.trace.some(t => t.num === n.num && !t.skipped && !t.error) ? 'ran' : ''].join(' ');
  const inner = pf === 'zapier'
    ? `<span class="ic">${svg(n.op)}</span><span class="tx"><span class="sb">${esc(cat[0])}</span><span class="nm">${n.num}. ${esc(n.name)}</span></span>`
    : `<span class="num">${n.num}</span><span class="ic">${svg(n.op)}</span><span class="nm">${esc(n.name)}</span><span class="sb">${esc(cat[0])}</span>`;
  return `<button type="button" class="${cls}" data-node="${n.id}">${inner}</button>`;
}
const insOn = (seqId, idx) => state.ins && state.ins.seqId === seqId && state.ins.idx === idx;
const addBtn = (seqId, idx) => `<span class="link"><button type="button" class="add${insOn(seqId, idx) ? ' on' : ''}" data-add="${seqId}" data-idx="${idx}" aria-label="Insertar acá" title="Insertar acá">+</button></span>`;
function seqHtml(steps, seqId, pf) {
  let h = '<div class="seq">';
  const needTrigger = seqId === 'root' && (!steps.length || !TRIGGERS.includes(steps[0].op));
  if (needTrigger) h += `<span class="empty-flow">Elegí un trigger en la paleta</span>${steps.length ? '<span class="link"></span>' : ''}`;
  steps.forEach((n, i) => {
    if (i > 0 || seqId !== 'root') h += addBtn(seqId, i);
    h += nodeHtml(n, pf);
    if (n.branches) h += `<span class="link"></span><div class="branches">${n.branches.map((b, bi) => `<div class="branch"><span class="link0"></span><span class="blabel" title="${esc(condText(b.cond))}">${esc(b.name)}${n.op === 'router' ? (b.fallback ? ' · respaldo' : ' · ' + esc(short(condText(b.cond), 26))) : ''}</span>${seqHtml(b.steps, `${n.id}:${bi}`, pf)}</div>`).join('')}</div>`;
  });
  const last = steps[steps.length - 1];
  if (steps.length ? !last.branches : seqId !== 'root') h += addBtn(seqId, steps.length);
  return h + '</div>';
}
function paletteHtml(pf) {
  const cat = P[pf].cat, groups = [...new Set(Object.values(cat).map(c => c[1]))];
  return groups.map(g => `<div class="pgroup"><h4>${esc(g)}</h4><div class="pitems">${Object.keys(cat).filter(o => cat[o][1] === g).map(o => `<button type="button" class="pitem" data-pal="${o}" title="${esc(cat[o][2])}">${svg(o)}<span>${esc(cat[o][0])}</span></button>`).join('')}</div></div>`).join('');
}
function selectorHtml(pf) {
  const pr = data().progress, gr = graded(pf), cur = state.tquiz ? 'quiz:' + state.tquiz : state.proj.id;
  const opt = (v, text, done) => `<option value="${v}"${v === cur ? ' selected' : ''}>${done ? '✓ ' : ''}${esc(text)}</option>`;
  return `<select id="tlSel" aria-label="Ejercicio">${[...new Set(gr.map(j => j.cat))].map(c => `<optgroup label="${esc(c)}">${gr.filter(j => j.cat === c).map(j => opt(j.id, j.title, pr[`${pf}:P:${j.id}`])).join('')}</optgroup>`).join('')}<optgroup label="Cuestionarios teóricos">${P[pf].quizzes.map(q => opt('quiz:' + q.id, q.title, pr[`${pf}:Q:${q.id}`])).join('')}</optgroup><optgroup label="Modo libre">${opt('libre', 'Modo libre', false)}</optgroup></select>`;
}
function quizHtml(pf, quiz) {
  const ans = data().quiz[`${pf}:${quiz.id}`] || {}, done = data().progress[`${pf}:Q:${quiz.id}`];
  return `<div class="row" style="margin-bottom:6px"><span class="pill">Cuestionario teórico</span>${done ? '<span class="pill ok">Aprobado</span>' : ''}</div><h2 class="h2" style="margin-bottom:14px">${esc(quiz.title)}</h2>`
    + quiz.qs.map((q, i) => { const g = state.graded && ans[i] != null, ok = ans[i] === 0, show = state.reveal.has(i);
      return `<div class="q${g ? (ok ? ' ok' : ' bad') : ''}"><p class="t">${i + 1}. ${esc(q[0])}</p>${order(q).map(k => `<label class="${show && k === 0 ? 'right' : ''}"><input type="radio" name="q${i}" data-q="${i}" data-o="${k}"${ans[i] === k ? ' checked' : ''}><span>${esc(q[1][k])}</span></label>`).join('')}${g || show ? `<p class="why">${g ? (ok ? 'Correcto. ' : 'No es esa. ') : ''}${esc(q[2])}</p>` : ''}<div class="row" style="justify-content:flex-end;margin-top:6px"><button type="button" class="btn line sm" data-act="reveal" data-i="${i}">${show ? 'Ocultar respuesta' : 'Ver respuesta'}</button></div></div>`; }).join('')
    + `<div class="row"><button type="button" class="btn" data-act="grade">Corregir</button></div>`;
}
function project() {
  const pf = state.pf, p = P[pf], j = state.proj, quiz = state.tquiz && p.quizzes.find(q => q.id === state.tquiz);
  const top = `<section class="tl-top">
    <button type="button" class="btn sky sm" data-go="${pf}" data-keep-tab="${quiz ? 'quiz' : 'proyectos'}">← ${p.name}</button>
    <div class="tl-brand"><b>${TALLER[pf]}</b><small>Práctica de ${p.name} en flowDev</small></div>
    <label class="tl-sel"><span>Ejercicio</span>${selectorHtml(pf)}</label>
    <span class="pill tl-prog">${doneCount(pf)}/${TOTAL(pf)} completados</span>
    ${quiz ? '' : `<button type="button" class="btn line sm" data-act="run">${esc(p.run)}</button>${j.free ? '' : '<button type="button" class="btn sky sm" data-act="verify">Verificar ejercicio</button>'}`}
  </section>`;
  if (quiz) return `${top}<section class="tl quiz"><div class="tl-panel"><div class="tl-body">${quizHtml(pf, quiz)}</div></div></section>`;
  number(state.flow);
  const r = state.run, R = state.results, tab = state.ptab, done = data().progress[`${pf}:P:${j.id}`];
  const fm = j.free ? freeMocks(pf) : null;
  const ej = `<div class="row" style="margin-bottom:6px"><span class="pill">${esc(j.cat)}</span>${j.free ? '' : `<span class="pill">${esc(j.level)}</span>`}${done ? '<span class="pill ok">Resuelto</span>' : ''}</div>
    <h2 class="h2">${esc(j.title)}</h2><p style="margin:8px 0 14px">${esc(j.story)}</p>
    ${j.objectives ? `<details class="fold"><summary>Objetivos de aprendizaje (${j.objectives.length})</summary><ul class="reqs">${j.objectives.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>` : ''}
    ${j.free ? `<p class="note">Definí los datos de entrada y las respuestas simuladas en la pestaña Probar.</p>` : `<p class="gtitle">Requisitos</p><ol class="reqs">${j.reqs.map(x => `<li>${x}</li>`).join('')}</ol>`}
    ${j.mock ? `<p class="gtitle">Sistemas simulados</p><p class="note">${esc(j.mock)}</p>` : ''}
    ${j.free ? '' : `<p class="gtitle">Datos de entrada de ejemplo</p><pre>${esc(JSON.stringify(j.sample, null, 2))}</pre>`}
    <details class="fold"><summary>Pistas (${j.hints.length})</summary><ul class="reqs">${j.hints.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>
    ${j.real ? `<details class="fold"><summary>En ${p.name} real (fuera del simulador)</summary><ul class="reqs">${j.real.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>` : ''}
    <div class="row" style="margin:16px 0 4px">${j.free ? '' : '<button type="button" class="btn" data-act="verify">Verificar ejercicio</button>'}<button type="button" class="btn line" data-ptab="run">Probar paso a paso</button></div>
    ${R ? `<div class="resbox${R.all ? ' all' : ''}"><div class="row" style="justify-content:space-between;margin-bottom:6px"><span class="h3">${R.all ? 'Ejercicio resuelto' : 'Todavía falta'}</span><span class="pill ${R.all ? 'ok' : ''}">${R.items.filter(i => i.ok).length}/${R.items.length}</span></div><ul class="results">${R.items.map(i => `<li class="${i.ok ? 'ok' : 'bad'}"><span class="mk">${i.ok ? '✓' : '✗'}</span><span>${esc(i.label)}${!i.ok && i.detail ? `<small>${esc(i.detail)}</small>` : ''}</span></li>`).join('')}</ul></div>` : ''}
    <div class="row" style="margin-top:14px">${state.confirm ? `<span style="flex-basis:100%">${state.confirm === 'sol' ? 'Esto reemplaza tu flujo por la solución.' : 'Esto borra tu flujo.'}</span><button type="button" class="btn sm" data-act="${state.confirm}ok">Confirmar</button><button type="button" class="btn line sm" data-act="cancel">Cancelar</button>` : `${j.free ? '' : '<button type="button" class="btn line sm" data-act="sol">Ver solución</button>'}<button type="button" class="btn line sm" data-act="reset">Reiniciar ejercicio</button>`}</div>
    <p class="note" style="margin-top:18px;border-top:1.5px solid var(--line);padding-top:12px">Simulador simplificado de ${p.name}: no se conecta a ninguna cuenta ni servicio real.</p>`;
  const run = `<label class="fld"><span>Datos de entrada (JSON)</span><textarea id="runInput" class="mono" rows="6" spellcheck="false">${esc(state.inputRaw ?? JSON.stringify(state.input ?? j.sample, null, 2))}</textarea></label>
    ${fm ? `<p class="gtitle">Respuestas simuladas</p>
    <label class="fld"><span>API (HTTP): JSON que devuelve</span><textarea class="mono" rows="4" data-mock="http" spellcheck="false">${esc(fm.http)}</textarea></label>
    <label class="fld"><span>IA: texto (o JSON) que devuelve</span><textarea class="mono" rows="2" data-mock="ai" spellcheck="false">${esc(fm.ai)}</textarea></label>
    <label class="fld"><span>Hoja de cálculo: lista de filas</span><textarea class="mono" rows="4" data-mock="rows" spellcheck="false">${esc(fm.rows)}</textarea></label>` : ''}
    <div class="row"><button type="button" class="btn" data-act="run">${esc(p.run)}</button></div>
    ${!r ? `<p class="note" style="margin-top:12px">Ejecutá el ${esc(p.flow)} para ver el resultado, las acciones realizadas y los datos que entrega cada ${esc(p.node)}.</p>` : `<div class="res-dark">
      <div class="row" style="justify-content:space-between;margin-bottom:10px"><span class="h3">Resultado</span><span class="pill ${r.error ? '' : 'fill'}">${r.error ? 'Con error' : 'Correcta'}</span></div>
      ${r.error ? `<p style="color:#ff9c94;margin-bottom:10px">${esc(r.error)}</p>` : ''}
      ${r.calls.filter(c => c.app !== 'http').length ? `<p class="eyebrow dim" style="margin-bottom:6px">Acciones realizadas</p>${r.calls.filter(c => c.app !== 'http').map(c => `<div class="call"><b>${esc(P[pf].cat[c.app][0])}</b><dl>${Object.entries(c.params).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(typeof v === 'object' ? JSON.stringify(v) : v)}</dd>`).join('')}</dl></div>`).join('')}` : ''}
      <p class="eyebrow dim" style="margin:10px 0 2px">Paso a paso</p>
      ${r.trace.map(t => `<details class="step${t.error ? ' fail' : ''}"><summary><span class="k">${t.num ?? '·'}</span><span><b style="font-weight:500">${esc(t.name)}</b> <span class="dim">· ${esc(t.error || t.note || '')}</span></span></summary>${t.out ? `<pre>${esc(JSON.stringify(t.out, null, 2))}</pre>` : ''}</details>`).join('')}</div>`}`;
  const tip = state.ins ? `Punto de inserción elegido: hacé clic en un ${esc(p.node)} de la paleta.` : `Clic en la paleta para agregar un ${esc(p.node)} al final · el + elige dónde insertar · clic en un ${esc(p.node)} para configurarlo`;
  return `${top}<section class="tl">
    <aside class="tl-pal" aria-label="Paleta">${paletteHtml(pf)}</aside>
    <div class="tl-stage"><div class="tl-bar">${tip}</div><div class="canvas ${pf}"><div class="flow ${pf} ${p.layout === 'v' ? 'v' : ''}">${seqHtml(state.flow.steps, 'root', pf)}</div></div></div>
    <aside class="tl-panel">
      <nav class="tl-tabs" role="tablist">${[['ej', 'Ejercicio'], ['prop', 'Propiedades'], ['run', 'Probar']].map(([k, l]) => `<button type="button" role="tab" data-ptab="${k}" aria-selected="${tab === k}">${l}</button>`).join('')}</nav>
      <div class="tl-body" data-pane="ej"${tab === 'ej' ? '' : ' hidden'}>${ej}</div>
      <div class="tl-body" data-pane="prop" id="propMount"${tab === 'prop' ? '' : ' hidden'}></div>
      <div class="tl-body" data-pane="run"${tab === 'run' ? '' : ' hidden'}>${run}</div>
    </aside>
  </section>`;
}
const saveFlow = () => { if (state.proj) { data().flows[`${state.pf}:${state.proj.id}`] = state.flow; persist(); } };
function openProject(id) {
  const j = PROJ[state.pf].find(x => x.id === id), saved = data().flows[`${state.pf}:${id}`];
  go('project', { proj: j, flow: saved ? clone(saved) : { steps: [] }, input: null, inputRaw: null, confirm: null });
}
const openQuiz = id => go('project', { tquiz: id, quizId: id, proj: null, flow: { steps: [] } });
function readInput() { try { const v = JSON.parse($('#runInput').value); state.input = Array.isArray(v) ? v : [v]; return state.input; } catch (_) { toast('Los datos de entrada no son JSON válido.'); return null; } }
function verify() {
  const j = state.proj, pf = state.pf, f = state.flow, items = [];
  j.checks.forEach(([label, t]) => { let ok = false; try { ok = !!t(f); } catch (_) {} items.push({ ok, label }); });
  let last = null;
  j.tests.forEach(t => {
    const r = runFlow(clone(f), pf, t.input, mocksFor(j, t)); last = r;
    let res = r.error ? `Falló en «${r.trace[r.trace.length - 1].name}»: ${r.error}` : null;
    if (!res) { try { res = t.expect(r); } catch (e) { res = 'No se pudo evaluar: ' + e.message; } }
    items.push({ ok: res === true, label: 'Prueba: ' + t.name, detail: res === true ? '' : String(res) });
  });
  const allOk = items.every(i => i.ok);
  if (allOk) { mark(`${pf}:P:${j.id}`); toast('Ejercicio resuelto.'); }
  state.results = { items, all: allOk }; state.run = last; state.ptab = 'ej'; render();
}

/* Propiedades: el contenido vive en un nodo persistente que se monta en la pestaña del panel */
const dBody = $('#drawerBody');
dBody.remove();
const showTab = () => { document.querySelectorAll('[data-pane]').forEach(el => { el.hidden = el.dataset.pane !== state.ptab; }); document.querySelectorAll('[data-ptab][role="tab"]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.ptab === state.ptab))); };
const propsEmpty = () => { dBody.innerHTML = `<p class="eyebrow dim">Propiedades</p><h2 class="h2" style="margin:4px 0 8px">Nada seleccionado</h2><p>Hacé clic en un ${esc(P[state.pf]?.node || 'paso')} del lienzo para configurarlo.</p><ul class="reqs dim" style="margin-top:10px"><li>La paleta agrega al final de la cadena.</li><li>El botón + del lienzo elige otro punto de inserción.</li><li>El número de cada ${esc(P[state.pf]?.node || 'paso')} es el que se usa en las expresiones.</li></ul>`; };
const closeDrawer = () => { state.sel = null; state.ptab = 'ej'; propsEmpty(); render(); };
function addOp(op) {
  const pf = state.pf, cat = P[pf].cat[op], f = state.flow, trig = TRIGGERS.includes(op);
  let seqId = 'root', idx = 0;
  if (!trig) {
    if (!f.steps.length || !TRIGGERS.includes(f.steps[0].op)) return toast('Primero elegí un trigger en la paleta.');
    if (state.ins) { ({ seqId, idx } = state.ins); try { getSeq(seqId); } catch (_) { state.ins = null; return render(); } }
    else { idx = f.steps.length; if (f.steps[idx - 1].branches) return toast('La cadena principal termina en una bifurcación: tocá un + dentro de una rama para agregar ahí.'); }
    if (BRANCHING.includes(op) && idx !== getSeq(seqId).length) return toast('Las bifurcaciones van al final de la cadena.');
    if (seqId === 'root' && idx === 0) idx = 1;
  }
  const used = new Set(all(f).map(x => x.name)), base = cat[0].split(' · ')[0]; let name = base, k = 2; while (used.has(name)) name = `${base} ${k++}`;
  const empty = { left: '', op: 'eq', right: '' };
  const n = N(op, name, {}, op === 'if' ? [{ name: 'true', steps: [] }, { name: 'false', steps: [] }] : op === 'router' ? [{ name: 'Camino A', cond: { ...empty }, steps: [] }, { name: 'Camino B', cond: { ...empty }, fallback: true, steps: [] }] : undefined);
  if (op === 'code') n.p.code = pf === 'zapier' ? 'output = { resultado: inputData.campo };' : 'return { ...$json };';
  if (trig && f.steps[0] && TRIGGERS.includes(f.steps[0].op)) f.steps[0] = n; else getSeq(seqId).splice(idx, 0, n);
  state.ins = null; state.run = null; state.results = null; saveFlow(); state.sel = n.id; state.ptab = 'prop'; render(); openProps(n.id);
}
const condUi = (c, pre) => `<div class="rowcard cond"><input class="mono" data-c="${pre}left" value="${esc(c.left)}" placeholder="valor" aria-label="Valor"><select data-c="${pre}op" aria-label="Operador">${OPS.map(([k, l]) => `<option value="${k}"${c.op === k ? ' selected' : ''}>${l}</option>`).join('')}</select><input class="mono" data-c="${pre}right" value="${esc(c.right)}" placeholder="comparar con" aria-label="Comparar con"></div>`;
const rowsUi = (list, key, a, b) => list.map((r, i) => `<div class="rowcard"><input class="mono" data-r="${key}" data-i="${i}" data-f="name" value="${esc(r.name)}" placeholder="${a}" aria-label="${a}"><input class="mono" data-r="${key}" data-i="${i}" data-f="value" value="${esc(r.value)}" placeholder="${b}" aria-label="${b}"><button type="button" class="x" data-act="rowdel" data-r="${key}" data-i="${i}" aria-label="Quitar">×</button></div>`).join('') + `<button type="button" class="btn line sm" data-act="rowadd" data-r="${key}">+ Agregar</button>`;
function openProps(id) {
  const n = findNode(id), pf = state.pf; if (!n) return propsEmpty();
  const cat = P[pf].cat[n.op], p = n.p;
  state.sel = id; state.ptab = 'prop';
  const t = (k, l, ph = '', mono = true) => `<label class="fld"><span>${l}</span><input ${mono ? 'class="mono"' : ''} data-k="${k}" value="${esc(p[k])}" placeholder="${esc(ph)}"></label>`;
  const ta = (k, l, rows = 3) => `<label class="fld"><span>${l}</span><textarea class="mono" rows="${rows}" data-k="${k}" spellcheck="false">${esc(p[k])}</textarea></label>`;
  let f = '';
  switch (n.op) {
    case 'webhook': f = t('path', 'Ruta del webhook', '/mi-webhook') + '<p class="note">El trigger entrega el JSON que llega en la petición (los datos de entrada de la pestaña Probar).</p>'; break;
    case 'schedule': f = t('every', 'Frecuencia', 'Todos los días', false) + t('at', 'Hora', '09:00'); break;
    case 'set': f = `<p class="gtitle">Campos</p>${rowsUi(p.fields, 'fields', 'campo', 'valor o expresión')}<label class="row" style="margin-top:10px"><input type="checkbox" data-k="keep"${p.keep ? ' checked' : ''} style="width:auto"> Conservar los demás campos de entrada</label>`; break;
    case 'filter': case 'if': f = `<p class="gtitle">Condición</p>${condUi(p.cond, 'cond.')}`; break;
    case 'router': f = `<p class="gtitle">${pf === 'zapier' ? 'Caminos' : 'Rutas'}</p>` + n.branches.map((b, i) => `<div style="border:1.5px solid var(--line);border-radius:14px;padding:10px;margin-bottom:8px"><div class="row" style="margin-bottom:8px"><input data-b="${i}" data-f="name" value="${esc(b.name)}" aria-label="Nombre" style="flex:1"><button type="button" class="x" data-act="brdel" data-i="${i}" aria-label="Quitar">×</button></div>${b.fallback ? '' : condUi(b.cond, `b${i}.`)}<label class="row"><input type="checkbox" data-b="${i}" data-f="fallback"${b.fallback ? ' checked' : ''} style="width:auto"> Es el camino de respaldo</label></div>`).join('') + `<button type="button" class="btn line sm" data-act="bradd">+ Agregar</button>`; break;
    case 'http': f = `<label class="fld"><span>Método</span><select data-k="method">${['GET', 'POST', 'PUT', 'DELETE'].map(m => `<option${p.method === m ? ' selected' : ''}>${m}</option>`).join('')}</select></label>` + t('url', 'URL', 'https://api…') + ta('body', 'Body (opcional)'); break;
    case 'code': f = (pf === 'zapier'
      ? `<p class="gtitle">Input Data</p>${rowsUi(p.inputs || (p.inputs = []), 'inputs', 'nombre', 'dato de un paso anterior')}<p class="note" style="margin:8px 0 12px">Todo lo que entra por Input Data llega como texto en <code>inputData</code>. Convertí con <code>Number()</code> o <code>JSON.parse()</code>.</p>`
      : `<label class="fld"><span>Modo</span><select data-k="mode"><option value="each"${p.mode !== 'all' ? ' selected' : ''}>Run Once for Each Item</option><option value="all"${p.mode === 'all' ? ' selected' : ''}>Run Once for All Items</option></select></label>`)
      + ta('code', 'JavaScript', 9)
      + (pf === 'zapier' ? '<p class="note">Asigná el resultado a <code>output</code>: <code>output = { campo: valor };</code></p>' : '<p class="note">Each Item: usá <code>$json</code> y devolvé un objeto. All Items: usá <code>$input.all()</code> y devolvé una lista de <code>{ json: {...} }</code>.</p>'); break;
    case 'ai': f = ta('prompt', 'Prompt', 6) + '<p class="note">La respuesta queda en el campo <code>text</code>. Incluí en el prompt los datos que la IA tiene que leer.</p>'; break;
    case 'crm': f = t('email', 'Email') + t('name', 'Nombre') + `<p class="gtitle">Propiedades</p>${rowsUi(p.props || (p.props = []), 'props', 'propiedad', 'valor o expresión')}`; break;
    case 'task': f = t('list', 'Lista', 'Pendientes', false) + t('title', 'Título') + ta('description', 'Descripción') + t('due', 'Vencimiento', '2026-12-01'); break;
    case 'sheetsRead': f = t('doc', 'Documento', 'Ventas', false) + t('sheet', 'Hoja', 'Ventas', false) + `<p class="note">${pf === 'zapier' ? 'Devuelve un solo resultado con la lista <code>rows</code>.' : 'Devuelve un ' + (pf === 'make' ? 'bundle' : 'item') + ' por cada fila.'}</p>`; break;
    case 'summarize': f = `<p class="gtitle">Campos a resumir</p>${rowsUi(p.fields, 'fields', 'campo', 'sum, count, avg, min o max')}<div style="height:10px"></div>` + t('groupBy', 'Agrupar por (opcional)', 'region') + '<p class="note">La salida se llama <code>operación_campo</code>, por ejemplo <code>sum_monto</code>.</p>'; break;
    case 'sort': f = t('field', 'Campo') + `<label class="fld"><span>Orden</span><select data-k="dir"><option value="asc"${p.dir !== 'desc' ? ' selected' : ''}>Ascendente</option><option value="desc"${p.dir === 'desc' ? ' selected' : ''}>Descendente</option></select></label>`; break;
    case 'limit': f = t('max', 'Cantidad máxima de items', '1'); break;
    case 'dedupe': f = t('field', 'Campo que identifica los duplicados', 'id'); break;
    case 'split': f = t('field', 'Lista a separar', pf === 'n8n' ? 'productos' : '{{2.productos}}'); break;
    case 'aggregate': f = t('field', 'Nombre del campo de salida', 'items'); break;
    case 'sheets': f = t('doc', 'Documento', 'CRM', false) + t('sheet', 'Hoja', 'Leads', false) + `<p class="gtitle">Columnas</p>${rowsUi(p.columns, 'columns', 'columna', 'valor o expresión')}`; break;
    case 'mail': f = t('to', 'Para') + t('subject', 'Asunto') + ta('body', 'Mensaje'); break;
    case 'slack': f = t('channel', 'Canal', '#canal') + ta('text', 'Texto'); break;
    case 'telegram': f = t('chatId', 'Chat ID') + ta('text', 'Texto'); break;
  }
  const lastOut = state.run?.trace.find(x => x.num === n.num && x.out);
  dBody.innerHTML = `<div class="ph"><span class="ph-ic">${svg(n.op)}</span><div><p class="eyebrow dim">${esc(cat[0])} · ${esc(P[pf].node)} ${n.num}</p><h2 class="h2" id="drawerTitle">${esc(n.name)}</h2></div></div>
    <p class="dim" style="margin-bottom:12px">${esc(cat[2])}</p>
    <label class="fld"><span>Nombre</span><input data-name value="${esc(n.name)}"></label>${f}
    <div class="cheat"><p><b style="font-weight:500">Expresiones en ${P[pf].name}</b></p>${P[pf].cheat.map(x => `<p>${x}</p>`).join('')}</div>
    ${lastOut ? `<p class="gtitle">Salida en la última ejecución</p><pre style="max-height:180px">${esc(JSON.stringify(lastOut.out, null, 2))}</pre>` : ''}
    <div class="row" style="margin-top:16px;border-top:1.5px solid var(--line);padding-top:14px"><button type="button" class="btn" data-act="close">Listo</button><button type="button" class="btn danger" data-act="delnode">Eliminar ${esc(P[pf].node)}</button></div>`;
  showTab();
}
dBody.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  e.stopPropagation();
  const act = b.dataset.act, n = state.sel && findNode(state.sel);
  if (act === 'close') closeDrawer();
  else if (!n) return;
  else if (act === 'delnode') { const drop = s => { const i = s.findIndex(x => x.id === n.id); if (i >= 0) s.splice(i, 1); else s.forEach(x => (x.branches || []).forEach(br => drop(br.steps))); }; drop(state.flow.steps); state.run = null; state.results = null; state.ins = null; saveFlow(); closeDrawer(); }
  else if (act === 'rowadd') { (n.p[b.dataset.r] ||= []).push({ name: '', value: b.dataset.r === 'fields' && n.op === 'summarize' ? 'sum' : '' }); saveFlow(); openProps(n.id); }
  else if (act === 'rowdel') { n.p[b.dataset.r].splice(+b.dataset.i, 1); saveFlow(); openProps(n.id); }
  else if (act === 'bradd') { n.branches.push({ name: 'Camino ' + String.fromCharCode(65 + n.branches.length), cond: { left: '', op: 'eq', right: '' }, steps: [] }); saveFlow(); render(); openProps(n.id); }
  else if (act === 'brdel') { if (n.branches.length <= 2) return toast('Tiene que haber al menos dos caminos.'); n.branches.splice(+b.dataset.i, 1); state.ins = null; saveFlow(); render(); openProps(n.id); }
});
function onDrawerInput(e) {
  const el = e.target, n = state.sel && findNode(state.sel); if (!n) return;
  const val = el.type === 'checkbox' ? el.checked : el.value;
  if (el.dataset.name !== undefined) { n.name = val || P[state.pf].cat[n.op][0]; $('#drawerTitle').textContent = n.name; }
  else if (el.dataset.k) n.p[el.dataset.k] = val;
  else if (el.dataset.r) n.p[el.dataset.r][+el.dataset.i][el.dataset.f] = val;
  else if (el.dataset.c) { const [where, key] = el.dataset.c.split('.'); (where === 'cond' ? n.p.cond : n.branches[+where.slice(1)].cond)[key] = val; }
  else if (el.dataset.b) { const br = n.branches[+el.dataset.b]; if (el.dataset.f === 'fallback') { n.branches.forEach(x => { x.fallback = false; }); br.fallback = val; saveFlow(); render(); openProps(n.id); return; } br[el.dataset.f] = val; }
  else return;
  state.run = null; saveFlow();
}
dBody.addEventListener('input', onDrawerInput);
dBody.addEventListener('change', e => { if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') onDrawerInput(e); });
// Al salir de un campo de propiedades se actualiza el lienzo (nombres y condiciones) sin perder el foco mientras se escribe
dBody.addEventListener('focusout', () => { if (state.view === 'project' && state.sel) { const cv = $('.tl-stage .flow'); if (cv) { number(state.flow); cv.innerHTML = seqHtml(state.flow.steps, 'root', state.pf); } } });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.view === 'project' && state.sel && !e.target.closest('input,textarea,select')) closeDrawer(); });

/* ---------------- Render y eventos ---------------- */
function render() {
  renderNav();
  $('.shell').classList.toggle('wide', state.view === 'project');
  view.innerHTML = { home, auth, dash, platform, project }[state.view]();
  if (state.view === 'project') { const m = $('#propMount'); if (m) { if (!state.sel || !findNode(state.sel)) { state.sel = null; propsEmpty(); } m.appendChild(dBody); } }
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-go],[data-auth],[data-tab],[data-proj],[data-act],[data-add],[data-node],[data-quiz],[data-pal],[data-ptab]'); if (!el) return;
  const d = el.dataset;
  if (d.go) { if (P[d.go]) go('platform', { pf: d.go, tab: d.keepTab || 'lecciones' }); else go(d.go, { pf: null }); return; }
  if (d.auth) return go('auth', { auth: d.auth, pf: null });
  if (d.tab) { state.tab = d.tab; state.quizId = null; state.graded = false; state.reveal = new Set(); return render(); }
  if (d.quiz) return openQuiz(d.quiz);
  if (d.proj) return openProject(d.proj);
  if (d.ptab) { state.ptab = d.ptab; return showTab(); }
  if (d.pal) return addOp(d.pal);
  if (d.add !== undefined) { state.ins = insOn(d.add, +d.idx) ? null : { seqId: d.add, idx: +d.idx }; return render(); }
  if (d.node) { state.sel = d.node; state.ptab = 'prop'; render(); return openProps(d.node); }
  const pf = state.pf;
  switch (d.act) {
    case 'logout': db.session = null; persist(); toast('Sesión cerrada.'); return go('home', { pf: null });
    case 'read': mark(`${pf}:L${d.i}`); toast('Lección marcada como leída.'); return render();
    case 'reveal': { const i = +d.i; state.reveal.has(i) ? state.reveal.delete(i) : state.reveal.add(i); return render(); }
    case 'grade': { const qz = P[pf].quizzes.find(q => q.id === state.quizId), ans = data().quiz[`${pf}:${qz.id}`] || {}; state.graded = true; if (qz.qs.every((_, i) => ans[i] === 0)) { mark(`${pf}:Q:${qz.id}`); toast('Cuestionario aprobado.'); } return render(); }
    case 'run': { const inp = readInput(); if (!inp) { state.ptab = 'run'; return showTab(); } state.run = runFlow(clone(state.flow), pf, inp, mocksFor(state.proj)); state.results = null; state.ptab = 'run'; return render(); }
    case 'verify': return verify();
    case 'sol': case 'reset': state.confirm = d.act; return render();
    case 'cancel': state.confirm = null; return render();
    case 'solok': state.flow = state.proj.solution(); Object.assign(state, { confirm: null, run: null, results: null, sel: null, ins: null }); saveFlow(); toast('Solución cargada: abrí cada paso para estudiarla.'); return render();
    case 'resetok': state.flow = { steps: [] }; Object.assign(state, { confirm: null, run: null, results: null, sel: null, ins: null }); saveFlow(); return render();
  }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'tlSel') return el.value.startsWith('quiz:') ? openQuiz(el.value.slice(5)) : openProject(el.value);
  if (el.dataset.q === undefined) return;
  (data().quiz[`${state.pf}:${state.quizId}`] ||= {})[+el.dataset.q] = +el.dataset.o; state.graded = false; persist();
});
document.addEventListener('input', e => {
  if (e.target.id === 'runInput') state.inputRaw = e.target.value;
  const k = e.target.dataset.mock; if (k && state.proj?.free) { freeMocks(state.pf)[k] = e.target.value; persist(); }
});
document.addEventListener('submit', async e => {
  if (e.target.id !== 'authForm') return;
  e.preventDefault();
  const err = $('#authErr'), email = $('#au_email').value.trim().toLowerCase(), pass = $('#au_pass').value, reg = state.auth === 'registro';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'Escribí un email válido.'; return; }
  if (pass.length < 6) { err.textContent = 'La contraseña tiene que tener al menos 6 caracteres.'; return; }
  if (reg) {
    const name = $('#au_name').value.trim();
    if (!name) { err.textContent = 'Escribí tu nombre.'; return; }
    if (db.users[email]) { err.textContent = 'Ya hay una cuenta con ese email en este navegador. Ingresá.'; return; }
    const salt = uid() + uid();
    db.users[email] = { name, email, salt, hash: await hash(salt + pass), ...clone(db.guest) };
    db.guest = blank(); db.session = email; persist(); toast(`Cuenta creada. Hola, ${name.split(' ')[0]}.`); return go('dash', { pf: null });
  }
  const u = db.users[email];
  if (!u || u.hash !== await hash(u.salt + pass)) { err.textContent = 'El email o la contraseña no coinciden con una cuenta de este navegador.'; return; }
  db.session = email; persist(); toast(`Hola de nuevo, ${u.name.split(' ')[0]}.`); go('dash', { pf: null });
});
render();
})();
