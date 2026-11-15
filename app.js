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
  code: () => ({ code: 'return { ...$json };' }),
  split: () => ({ field: '' }),
  aggregate: () => ({ field: 'items' }),
  sheets: () => ({ doc: '', sheet: '', columns: [{ name: '', value: '' }] }),
  mail: () => ({ to: '', subject: '', body: '' }),
  slack: () => ({ channel: '', text: '' }),
  telegram: () => ({ chatId: '', text: '' }),
};
const OPS = [['eq', 'es igual a'], ['neq', 'es distinto de'], ['contains', 'contiene'], ['gt', 'es mayor que'], ['gte', 'es mayor o igual que'], ['lt', 'es menor que'], ['lte', 'es menor o igual que'], ['exists', 'existe'], ['empty', 'está vacío']];

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
const all = (f, out = []) => { const walk = s => s.forEach(n => { out.push(n); (n.branches || []).forEach(b => walk(b.steps)); }); walk(f.steps); return out; };
const has = (f, op) => all(f).some(n => n.op === op);

/* ---------------- Simulador ---------------- */
class SimError extends Error {}
const fail = m => { throw new SimError(m); };
const FN = { upper: s => String(s ?? '').toUpperCase(), lower: s => String(s ?? '').toLowerCase(), trim: s => String(s ?? '').trim(), length: s => (s ?? '').length, round: n => Math.round(Number(n)), now: () => new Date().toISOString(), iff: (c, a, b) => (c ? a : b) };
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
    case 'gt': return both && Number(l) > Number(r); case 'gte': return both && Number(l) >= Number(r);
    case 'lt': return both && Number(l) < Number(r); case 'lte': return both && Number(l) <= Number(r);
    case 'exists': return l != null && l !== ''; case 'empty': return l == null || l === '';
  }
  return false;
}
function number(flow) { let i = 0; all(flow).forEach(n => { n.num = ++i; }); }
function runFlow(flow, pf, input, httpMock) {
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
      case 'code': each(it => { let r; try { r = new Function('$json', 'inputData', p.code)(clone(it.json), clone(it.json)); } catch (e) { fail('El código lanzó un error: ' + e.message); } if (!r || typeof r !== 'object') fail('El código tiene que devolver un objeto: return { ... }'); return r; }); break;
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
const blank = () => ({ progress: {}, flows: {}, quiz: {} });
let db = { users: {}, session: null, guest: blank() };
try { const raw = localStorage.getItem(KEY); if (raw) db = { ...db, ...JSON.parse(raw) }; } catch (_) {}
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (_) {} };
const me = () => (db.session && db.users[db.session]) || null;
const data = () => me() || db.guest;
async function hash(text) {
  if (window.crypto?.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  let h = 5381; for (const ch of text) h = (Math.imul(h, 33) ^ ch.charCodeAt(0)) >>> 0; return 'x' + h.toString(16);
}
const TOTAL = pf => P[pf].lessons.length + PROJ[pf].length + 1;
const doneCount = pf => Object.keys(data().progress).filter(k => k.startsWith(pf + ':')).length;
const pct = pf => Math.round(doneCount(pf) / TOTAL(pf) * 100);
const mark = k => { if (!data().progress[k]) { data().progress[k] = true; persist(); } };

/* ---------------- Vistas ---------------- */
const state = { view: 'home', pf: null, tab: 'lecciones', proj: null, flow: null, sel: null, run: null, results: null, auth: 'registro', reveal: new Set(), graded: false };
const view = $('#view');
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2800); }
function go(v, extra = {}) { Object.assign(state, { view: v, sel: null, run: null, results: null, reveal: new Set(), graded: false }, extra); render(); window.scrollTo(0, 0); }

function renderNav() {
  const links = [['home', 'Inicio'], ['n8n', 'n8n'], ['make', 'Make'], ['zapier', 'Zapier'], ['dash', 'Mi avance']];
  $('#navLinks').innerHTML = links.map(([k, l]) => `<button type="button" data-go="${k}"${(state.view === k || (state.view !== 'home' && state.view !== 'dash' && state.pf === k)) ? ' aria-current="page"' : ''}>${l}</button>`).join('').replace('<button type="button" data-go="dash"', `<a href="${SAP.href}">SAP CPI</a><button type="button" data-go="dash"`);
  const u = me();
  $('#navUser').innerHTML = u
    ? `<span class="chip"><i>${esc(u.name.trim()[0]?.toUpperCase() || '?')}</i>${esc(u.name.split(' ')[0])}</span><button type="button" class="btn line sm" data-act="logout">Salir</button>`
    : `<button type="button" class="btn line sm" data-auth="ingreso">Ingresar</button><button type="button" class="btn sky sm" data-auth="registro">Crear cuenta</button>`;
}
const counts = () => ({ les: Object.values(P).reduce((a, p) => a + p.lessons.length, 0), pro: Object.values(PROJ).reduce((a, p) => a + p.length, 0), q: Object.values(P).reduce((a, p) => a + p.quiz.length, 0) });

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
        <div class="tile"><span class="big">${Object.keys(P).length + SAP.quizzes}</span><p>cuestionarios para repasar</p></div>
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
  const pf = state.pf, p = P[pf], pr = data().progress, tab = state.tab;
  let body = '';
  if (tab === 'lecciones') body = p.lessons.map(([t, parts], i) => `<details class="lesson${pr[`${pf}:L${i}`] ? ' done' : ''}"${i === 0 && !pr[`${pf}:L0`] ? ' open' : ''}>
      <summary><span class="n">${i + 1}</span><span class="h3" style="flex:1">${esc(t)}</span>${pr[`${pf}:L${i}`] ? '<span class="pill ok">Leída</span>' : ''}</summary>
      <div class="body">${parts.join('')}<button type="button" class="btn sm" data-act="read" data-i="${i}">${pr[`${pf}:L${i}`] ? 'Leída' : 'Marcar como leída'}</button></div></details>`).join('');
  else if (tab === 'proyectos') body = PROJ[pf].map(j => `<button type="button" class="list-item" data-proj="${j.id}"><span class="pill${pr[`${pf}:P:${j.id}`] ? ' ok' : ''}">${pr[`${pf}:P:${j.id}`] ? 'Resuelto' : esc(j.level)}</span><span class="grow"><span class="h3">${esc(j.title)}</span><br><span class="dim">${esc(j.story)}</span></span><span class="arrow">${svg('arrow')}</span></button>`).join('');
  else {
    const ans = data().quiz[pf] || {};
    body = p.quiz.map((q, i) => { const g = state.graded && ans[i] != null, ok = ans[i] === 0, show = state.reveal.has(i);
      return `<div class="q${g ? (ok ? ' ok' : ' bad') : ''}"><p class="t">${i + 1}. ${esc(q[0])}</p>${order(q).map(k => `<label class="${show && k === 0 ? 'right' : ''}"><input type="radio" name="q${i}" data-q="${i}" data-o="${k}"${ans[i] === k ? ' checked' : ''}><span>${esc(q[1][k])}</span></label>`).join('')}${g || show ? `<p class="why">${g ? (ok ? 'Correcto. ' : 'No es esa. ') : ''}${esc(q[2])}</p>` : ''}<div class="row" style="justify-content:flex-end;margin-top:6px"><button type="button" class="btn line sm" data-act="reveal" data-i="${i}">${show ? 'Ocultar respuesta' : 'Ver respuesta'}</button></div></div>`; }).join('')
      + `<div class="row"><button type="button" class="btn" data-act="grade">Corregir</button>${pr[`${pf}:Q`] ? '<span class="pill ok">Aprobado</span>' : ''}</div>`;
  }
  return `<section class="card ${p.tone === 'dark' ? 'dark' : ''} flush split">
    <div class="side"><h1 class="display">${p.name}</h1><div><span class="pill">${esc(p.tag)}</span></div><p class="lead ${p.tone === 'dark' ? 'dim' : ''}">${esc(p.intro)}</p></div>
    <div class="side ${p.tone === 'dark' ? '' : 'dark'}">
      <div class="tiles">
        <div class="tile"><span class="big">${pct(pf)}%</span><p>de ${p.name} completado</p></div>
        <div class="tile grey"><span class="big">${PROJ[pf].length}</span><p>proyectos guiados</p></div>
        <div class="tile grey"><p class="eyebrow">Se llama</p><p>${esc(p.flow)} · ${esc(p.node)} · ${esc(p.run)}</p></div>
        <div class="tile"><span class="big">${p.lessons.length}</span><p>lecciones</p></div>
      </div>
    </div>
  </section>
  <section class="card">
    <div class="tabs" role="tablist" style="margin-bottom:16px">${[['lecciones', 'Lecciones'], ['proyectos', 'Proyectos'], ['quiz', 'Cuestionario']].map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${tab === k}">${l}</button>`).join('')}</div>
    ${body}
  </section>`;
}

/* ---------------- Editor de flujos ---------------- */
const getSeq = id => { if (id === 'root') return state.flow.steps; const [nid, bi] = id.split(':'); return all(state.flow).find(n => n.id === nid).branches[+bi].steps; };
const findNode = id => all(state.flow).find(n => n.id === id);
const condText = c => (c && c.left ? `${c.left} ${OPS.find(o => o[0] === c.op)[1]}${['exists', 'empty'].includes(c.op) ? '' : ' ' + c.right}` : 'sin condición');
function nodeHtml(n, pf) {
  const cat = P[pf].cat[n.op] || [n.op], r = state.run;
  const cls = ['fnode', state.sel === n.id ? 'sel' : '', r && r.failed === n.num ? 'failed' : r && r.trace.some(t => t.num === n.num && !t.skipped && !t.error) ? 'ran' : ''].join(' ');
  const inner = pf === 'zapier' ? `<span class="ic">${svg(n.op)}</span><span class="tx"><span class="nm">${esc(n.name)}</span><span class="sb">${esc(cat[0])}</span></span>` : `<span class="ic">${svg(n.op)}</span><span class="nm">${esc(n.name)}</span><span class="sb">${esc(cat[0])}</span>`;
  return `<button type="button" class="${cls}" data-node="${n.id}"><span class="num">${n.num}</span>${inner}</button>`;
}
const addBtn = (seqId, idx) => `<span class="link"><button type="button" class="add" data-add="${seqId}" data-idx="${idx}" aria-label="Agregar paso">+</button></span>`;
function seqHtml(steps, seqId, pf) {
  let h = '<div class="seq">';
  if (seqId === 'root' && steps.length && !TRIGGERS.includes(steps[0].op)) h += `<button type="button" class="add first" data-add="root" data-idx="0">+ Elegir trigger</button><span class="link"></span>`;
  steps.forEach((n, i) => {
    if (i > 0 || seqId !== 'root') h += addBtn(seqId, i);
    h += nodeHtml(n, pf);
    if (n.branches) h += `<span class="link"></span><div class="branches">${n.branches.map((b, bi) => `<div class="branch"><span class="link0"></span><span class="blabel" title="${esc(condText(b.cond))}">${esc(b.name)}${n.op === 'router' ? (b.fallback ? ' · respaldo' : ' · ' + esc(short(condText(b.cond), 26))) : ''}</span>${seqHtml(b.steps, `${n.id}:${bi}`, pf)}</div>`).join('')}</div>`;
  });
  const last = steps[steps.length - 1];
  if (!steps.length && seqId === 'root') h += `<button type="button" class="add first" data-add="root" data-idx="0">+ Elegir trigger</button>`;
  else if (!last || !last.branches) h += addBtn(seqId, steps.length);
  return h + '</div>';
}
function project() {
  const pf = state.pf, p = P[pf], j = state.proj, r = state.run, R = state.results;
  number(state.flow);
  const done = data().progress[`${pf}:P:${j.id}`];
  return `<section class="card ${p.tone === 'dark' ? 'dark' : ''}">
    <div class="row" style="justify-content:space-between;margin-bottom:12px"><button type="button" class="btn line sm" data-go="${pf}" data-keep-tab="proyectos">← ${p.name}</button><span class="row"><span class="pill">${esc(j.level)}</span>${done ? '<span class="pill ok">Resuelto</span>' : ''}</span></div>
    <h1 class="h2">${esc(j.title)}</h1><p class="lead ${p.tone === 'dark' ? 'dim' : ''}" style="margin-top:8px;max-width:70ch">${esc(j.story)}</p>
  </section>
  <section class="work">
    <div class="stack">
      <div class="card" style="padding:16px">
        <div class="row" style="justify-content:space-between;margin-bottom:12px"><span class="eyebrow dim">Tu ${esc(p.flow)}</span><span class="row"><button type="button" class="btn sm" data-act="run">${esc(p.run)}</button><button type="button" class="btn sky sm" data-act="verify">Verificar</button></span></div>
        <div class="canvas"><div class="flow ${pf} ${p.layout === 'v' ? 'v' : ''}">${seqHtml(state.flow.steps, 'root', pf)}</div></div>
        <p class="note" style="margin-top:10px">Tocá <b>+</b> para agregar un ${esc(p.node)} y tocá un ${esc(p.node)} para configurarlo. El número de cada uno es el que se usa en las expresiones.</p>
      </div>
      <div class="card dark">
        <div class="row" style="justify-content:space-between;margin-bottom:10px"><span class="h3">Resultado de la ejecución</span>${r ? `<span class="pill ${r.error ? '' : 'fill'}">${r.error ? 'Con error' : 'Correcta'}</span>` : ''}</div>
        ${!r ? `<p class="dim">Ejecutá el ${esc(p.flow)} para ver qué datos entrega cada ${esc(p.node)}.</p>` : `
          ${r.error ? `<p style="color:#ff9c94;margin-bottom:10px">${esc(r.error)}</p>` : ''}
          ${r.calls.filter(c => c.app !== 'http').length ? `<p class="eyebrow dim" style="margin-bottom:6px">Acciones realizadas</p>${r.calls.filter(c => c.app !== 'http').map(c => `<div class="call"><b>${esc(P[pf].cat[c.app][0])}</b><dl>${Object.entries(c.params).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(typeof v === 'object' ? JSON.stringify(v) : v)}</dd>`).join('')}</dl></div>`).join('')}` : ''}
          <p class="eyebrow dim" style="margin:10px 0 2px">Paso a paso</p>
          ${r.trace.map(t => `<details class="step${t.error ? ' fail' : ''}"><summary><span class="k">${t.num ?? '·'}</span><span><b style="font-weight:500">${esc(t.name)}</b> <span class="dim">· ${esc(t.error || t.note || '')}</span></span></summary>${t.out ? `<pre>${esc(JSON.stringify(t.out, null, 2))}</pre>` : ''}</details>`).join('')}`}
      </div>
    </div>
    <aside class="side-panel">
      <div class="card">
        <p class="eyebrow dim" style="margin-bottom:8px">Requisitos</p>
        <ol class="reqs">${j.reqs.map(x => `<li>${x}</li>`).join('')}</ol>
        ${j.mock ? `<p class="note" style="margin-top:8px">${esc(j.mock)}</p>` : ''}
        <p class="eyebrow dim" style="margin:14px 0 6px">Datos de prueba</p>
        <textarea id="runInput" class="mono" rows="5" spellcheck="false">${esc(JSON.stringify(state.input ?? j.sample, null, 2))}</textarea>
        <details style="margin-top:10px"><summary style="cursor:pointer;font-weight:500">Pistas (${j.hints.length})</summary><ul class="reqs" style="margin-top:8px">${j.hints.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>
      </div>
      ${R ? `<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:6px"><span class="h3">${R.all ? 'Proyecto resuelto' : 'Todavía falta'}</span><span class="pill ${R.all ? 'ok' : ''}">${R.items.filter(i => i.ok).length}/${R.items.length}</span></div><ul class="results">${R.items.map(i => `<li class="${i.ok ? 'ok' : 'bad'}"><span class="mk">${i.ok ? '✓' : '✗'}</span><span>${esc(i.label)}${!i.ok && i.detail ? `<small>${esc(i.detail)}</small>` : ''}</span></li>`).join('')}</ul></div>` : ''}
      <div class="card" style="padding:16px"><div class="row">${state.confirm ? `<span style="flex-basis:100%">${state.confirm === 'sol' ? 'Esto reemplaza tu flujo por la solución.' : 'Esto borra tu flujo.'}</span><button type="button" class="btn sm" data-act="${state.confirm}ok">Confirmar</button><button type="button" class="btn line sm" data-act="cancel">Cancelar</button>` : `<button type="button" class="btn line sm" data-act="sol">Ver solución</button><button type="button" class="btn line sm" data-act="reset">Vaciar</button>`}</div></div>
    </aside>
  </section>`;
}
const saveFlow = () => { data().flows[`${state.pf}:${state.proj.id}`] = state.flow; persist(); };
function openProject(id) {
  const j = PROJ[state.pf].find(x => x.id === id), saved = data().flows[`${state.pf}:${id}`];
  go('project', { proj: j, flow: saved ? clone(saved) : { steps: [] }, input: null, confirm: null });
}
function readInput() { try { const v = JSON.parse($('#runInput').value); state.input = Array.isArray(v) ? v : [v]; return state.input; } catch (_) { toast('Los datos de prueba no son JSON válido.'); return null; } }
function verify() {
  const j = state.proj, pf = state.pf, f = state.flow, items = [];
  j.checks.forEach(([label, t]) => { let ok = false; try { ok = !!t(f); } catch (_) {} items.push({ ok, label }); });
  let last = null;
  j.tests.forEach(t => {
    const r = runFlow(clone(f), pf, t.input, t.http || j.http); last = r;
    let res = r.error ? `Falló en «${r.trace[r.trace.length - 1].name}»: ${r.error}` : null;
    if (!res) { try { res = t.expect(r); } catch (e) { res = 'No se pudo evaluar: ' + e.message; } }
    items.push({ ok: res === true, label: 'Prueba: ' + t.name, detail: res === true ? '' : String(res) });
  });
  const allOk = items.every(i => i.ok);
  if (allOk) { mark(`${pf}:P:${j.id}`); toast('Proyecto resuelto.'); }
  state.results = { items, all: allOk }; state.run = last; render();
}

/* Selector de pasos y propiedades */
const drawer = $('#drawer'), dBody = $('#drawerBody');
const closeDrawer = () => { drawer.hidden = true; state.sel = null; state.picking = null; render(); };
function openPicker(seqId, idx) {
  const pf = state.pf, cat = P[pf].cat, trig = seqId === 'root' && idx === 0;
  state.picking = { seqId, idx };
  const ops = Object.keys(cat).filter(o => trig ? TRIGGERS.includes(o) : !TRIGGERS.includes(o));
  const atEnd = idx === getSeq(seqId).length;
  const groups = [...new Set(ops.map(o => cat[o][1]))];
  dBody.innerHTML = `<div class="drawer-head"><div><p class="eyebrow dim">${trig ? 'Trigger' : 'Agregar ' + esc(P[pf].node)}</p><h2 class="h2" id="drawerTitle">${trig ? '¿Cuándo arranca?' : '¿Qué sigue?'}</h2></div><button type="button" class="x" data-act="close" aria-label="Cerrar">×</button></div>`
    + groups.map(g => `<p class="gtitle">${esc(g)}</p>` + ops.filter(o => cat[o][1] === g).map(o => { const off = BRANCHING.includes(o) && !atEnd; return `<button type="button" class="pick" data-pick="${o}"${off ? ' disabled title="Solo al final de la cadena"' : ''}><span class="ic">${svg(o)}</span><span><b style="font-weight:500">${esc(cat[o][0])}</b><small>${esc(off ? 'Las bifurcaciones van al final de la cadena.' : cat[o][2])}</small></span></button>`; }).join('')).join('');
  drawer.hidden = false;
}
const condUi = (c, pre) => `<div class="rowcard cond"><input class="mono" data-c="${pre}left" value="${esc(c.left)}" placeholder="valor" aria-label="Valor"><select data-c="${pre}op" aria-label="Operador">${OPS.map(([k, l]) => `<option value="${k}"${c.op === k ? ' selected' : ''}>${l}</option>`).join('')}</select><input class="mono" data-c="${pre}right" value="${esc(c.right)}" placeholder="comparar con" aria-label="Comparar con"></div>`;
const rowsUi = (list, key, a, b) => list.map((r, i) => `<div class="rowcard"><input class="mono" data-r="${key}" data-i="${i}" data-f="name" value="${esc(r.name)}" placeholder="${a}" aria-label="${a}"><input class="mono" data-r="${key}" data-i="${i}" data-f="value" value="${esc(r.value)}" placeholder="${b}" aria-label="${b}"><button type="button" class="x" data-act="rowdel" data-r="${key}" data-i="${i}" aria-label="Quitar">×</button></div>`).join('') + `<button type="button" class="btn line sm" data-act="rowadd" data-r="${key}">+ Agregar</button>`;
function openProps(id) {
  const n = findNode(id), pf = state.pf, cat = P[pf].cat[n.op], p = n.p;
  state.sel = id;
  const t = (k, l, ph = '', mono = true) => `<label class="fld"><span>${l}</span><input ${mono ? 'class="mono"' : ''} data-k="${k}" value="${esc(p[k])}" placeholder="${esc(ph)}"></label>`;
  const ta = (k, l, rows = 3) => `<label class="fld"><span>${l}</span><textarea class="mono" rows="${rows}" data-k="${k}" spellcheck="false">${esc(p[k])}</textarea></label>`;
  let f = '';
  switch (n.op) {
    case 'webhook': f = t('path', 'Ruta del webhook', '/mi-webhook') + '<p class="note">El trigger entrega el JSON que llega en la petición (los "Datos de prueba").</p>'; break;
    case 'schedule': f = t('every', 'Frecuencia', 'Todos los días', false) + t('at', 'Hora', '09:00'); break;
    case 'set': f = `<p class="gtitle">Campos</p>${rowsUi(p.fields, 'fields', 'campo', 'valor o expresión')}<label class="row" style="margin-top:10px"><input type="checkbox" data-k="keep"${p.keep ? ' checked' : ''} style="width:auto"> Conservar los demás campos de entrada</label>`; break;
    case 'filter': case 'if': f = `<p class="gtitle">Condición</p>${condUi(p.cond, 'cond.')}`; break;
    case 'router': f = `<p class="gtitle">${pf === 'zapier' ? 'Caminos' : 'Rutas'}</p>` + n.branches.map((b, i) => `<div style="border:1.5px solid var(--line);border-radius:14px;padding:10px;margin-bottom:8px"><div class="row" style="margin-bottom:8px"><input data-b="${i}" data-f="name" value="${esc(b.name)}" aria-label="Nombre" style="flex:1"><button type="button" class="x" data-act="brdel" data-i="${i}" aria-label="Quitar">×</button></div>${b.fallback ? '' : condUi(b.cond, `b${i}.`)}<label class="row"><input type="checkbox" data-b="${i}" data-f="fallback"${b.fallback ? ' checked' : ''} style="width:auto"> Es el camino de respaldo</label></div>`).join('') + `<button type="button" class="btn line sm" data-act="bradd">+ Agregar</button>`; break;
    case 'http': f = `<label class="fld"><span>Método</span><select data-k="method">${['GET', 'POST', 'PUT', 'DELETE'].map(m => `<option${p.method === m ? ' selected' : ''}>${m}</option>`).join('')}</select></label>` + t('url', 'URL', 'https://api…') + ta('body', 'Body (opcional)'); break;
    case 'code': f = ta('code', 'JavaScript', 7) + '<p class="note">Se ejecuta una vez por item. Usá <code>$json</code> (o <code>inputData</code>) y devolvé un objeto.</p>'; break;
    case 'split': f = t('field', 'Lista a separar', pf === 'n8n' ? 'productos' : '{{2.productos}}'); break;
    case 'aggregate': f = t('field', 'Nombre del campo de salida', 'items'); break;
    case 'sheets': f = t('doc', 'Documento', 'CRM', false) + t('sheet', 'Hoja', 'Leads', false) + `<p class="gtitle">Columnas</p>${rowsUi(p.columns, 'columns', 'columna', 'valor o expresión')}`; break;
    case 'mail': f = t('to', 'Para') + t('subject', 'Asunto') + ta('body', 'Mensaje'); break;
    case 'slack': f = t('channel', 'Canal', '#canal') + ta('text', 'Texto'); break;
    case 'telegram': f = t('chatId', 'Chat ID') + ta('text', 'Texto'); break;
  }
  const lastOut = state.run?.trace.find(x => x.num === n.num && x.out);
  dBody.innerHTML = `<div class="drawer-head"><div><p class="eyebrow dim">${esc(cat[0])} · ${esc(P[pf].node)} ${n.num}</p><h2 class="h2" id="drawerTitle">${esc(n.name)}</h2></div><button type="button" class="x" data-act="close" aria-label="Cerrar">×</button></div>
    <p class="dim" style="margin-bottom:12px">${esc(cat[2])}</p>
    <label class="fld"><span>Nombre</span><input data-name value="${esc(n.name)}"></label>${f}
    <div class="cheat"><p><b style="font-weight:500">Expresiones en ${P[pf].name}</b></p>${P[pf].cheat.map(x => `<p>${x}</p>`).join('')}</div>
    ${lastOut ? `<p class="gtitle">Salida en la última ejecución</p><pre style="max-height:180px">${esc(JSON.stringify(lastOut.out, null, 2))}</pre>` : ''}
    <div class="row" style="margin-top:16px"><button type="button" class="btn" data-act="close">Listo</button><button type="button" class="btn danger" data-act="delnode">Eliminar</button></div>`;
  drawer.hidden = false;
}
dBody.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.pick) {
    const op = b.dataset.pick, { seqId, idx } = state.picking, cat = P[state.pf].cat[op];
    const used = new Set(all(state.flow).map(x => x.name)); let name = cat[0].split(' · ')[0], k = 2; while (used.has(name)) name = `${cat[0].split(' · ')[0]} ${k++}`;
    const n = N(op, name, {}, op === 'if' ? [{ name: 'true', steps: [] }, { name: 'false', steps: [] }] : op === 'router' ? [{ name: 'Camino A', cond: { left: '', op: 'eq', right: '' }, steps: [] }, { name: 'Camino B', cond: { left: '', op: 'eq', right: '' }, fallback: true, steps: [] }] : undefined);
    if (seqId === 'root' && idx === 0 && state.flow.steps[0] && TRIGGERS.includes(state.flow.steps[0].op)) state.flow.steps[0] = n; else getSeq(seqId).splice(idx, 0, n);
    state.run = null; saveFlow(); render(); openProps(n.id); return;
  }
  const act = b.dataset.act, n = state.sel && findNode(state.sel);
  if (act === 'close') closeDrawer();
  else if (act === 'delnode') { const drop = s => { const i = s.findIndex(x => x.id === n.id); if (i >= 0) s.splice(i, 1); else s.forEach(x => (x.branches || []).forEach(br => drop(br.steps))); }; drop(state.flow.steps); state.run = null; saveFlow(); closeDrawer(); }
  else if (act === 'rowadd') { n.p[b.dataset.r].push({ name: '', value: '' }); saveFlow(); openProps(n.id); }
  else if (act === 'rowdel') { n.p[b.dataset.r].splice(+b.dataset.i, 1); saveFlow(); openProps(n.id); }
  else if (act === 'bradd') { n.branches.push({ name: 'Camino ' + String.fromCharCode(65 + n.branches.length), cond: { left: '', op: 'eq', right: '' }, steps: [] }); saveFlow(); openProps(n.id); }
  else if (act === 'brdel') { if (n.branches.length <= 2) return toast('Tiene que haber al menos dos caminos.'); n.branches.splice(+b.dataset.i, 1); saveFlow(); openProps(n.id); }
});
function onDrawerInput(e) {
  const el = e.target, n = state.sel && findNode(state.sel); if (!n) return;
  const val = el.type === 'checkbox' ? el.checked : el.value;
  if (el.dataset.name !== undefined) { n.name = val || P[state.pf].cat[n.op][0]; $('#drawerTitle').textContent = n.name; }
  else if (el.dataset.k) n.p[el.dataset.k] = val;
  else if (el.dataset.r) n.p[el.dataset.r][+el.dataset.i][el.dataset.f] = val;
  else if (el.dataset.c) { const [where, key] = el.dataset.c.split('.'); (where === 'cond' ? n.p.cond : n.branches[+where.slice(1)].cond)[key] = val; }
  else if (el.dataset.b) { const br = n.branches[+el.dataset.b]; if (el.dataset.f === 'fallback') { n.branches.forEach(x => { x.fallback = false; }); br.fallback = val; saveFlow(); openProps(n.id); return; } br[el.dataset.f] = val; }
  else return;
  state.run = null; saveFlow();
}
dBody.addEventListener('input', onDrawerInput);
dBody.addEventListener('change', e => { if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') onDrawerInput(e); });
drawer.addEventListener('click', e => { if (e.target === drawer) closeDrawer(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) closeDrawer(); });

/* ---------------- Render y eventos ---------------- */
function render() {
  renderNav();
  view.innerHTML = { home, auth, dash, platform, project }[state.view]();
}
document.addEventListener('click', e => {
  if (!drawer.hidden && e.target.closest('#drawer')) return;
  const el = e.target.closest('[data-go],[data-auth],[data-tab],[data-proj],[data-act],[data-add],[data-node]'); if (!el) return;
  const d = el.dataset;
  if (d.go) { if (P[d.go]) go('platform', { pf: d.go, tab: d.keepTab || 'lecciones' }); else go(d.go, { pf: null }); return; }
  if (d.auth) return go('auth', { auth: d.auth, pf: null });
  if (d.tab) { state.tab = d.tab; state.graded = false; state.reveal = new Set(); return render(); }
  if (d.proj) return openProject(d.proj);
  if (d.add !== undefined) return openPicker(d.add, +d.idx);
  if (d.node) { state.sel = d.node; render(); return openProps(d.node); }
  const pf = state.pf;
  switch (d.act) {
    case 'logout': db.session = null; persist(); toast('Sesión cerrada.'); return go('home', { pf: null });
    case 'read': mark(`${pf}:L${d.i}`); toast('Lección marcada como leída.'); return render();
    case 'reveal': { const i = +d.i; state.reveal.has(i) ? state.reveal.delete(i) : state.reveal.add(i); return render(); }
    case 'grade': { const ans = data().quiz[pf] || {}; state.graded = true; if (P[pf].quiz.every((_, i) => ans[i] === 0)) { mark(`${pf}:Q`); toast('Cuestionario aprobado.'); } return render(); }
    case 'run': { const inp = readInput(); if (!inp) return; state.run = runFlow(clone(state.flow), pf, inp, state.proj.http); state.results = null; return render(); }
    case 'verify': return verify();
    case 'sol': case 'reset': state.confirm = d.act; return render();
    case 'cancel': state.confirm = null; return render();
    case 'solok': state.flow = state.proj.solution(); state.confirm = null; state.run = null; state.results = null; saveFlow(); toast('Solución cargada: abrí cada paso para estudiarla.'); return render();
    case 'resetok': state.flow = { steps: [] }; state.confirm = null; state.run = null; state.results = null; saveFlow(); return render();
  }
});
document.addEventListener('change', e => {
  const el = e.target; if (el.dataset.q === undefined) return;
  const pf = state.pf; (data().quiz[pf] ||= {})[+el.dataset.q] = +el.dataset.o; state.graded = false; persist();
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
