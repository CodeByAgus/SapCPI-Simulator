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
  formsIn: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  spItem: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/><circle cx="17.5" cy="17.5" r="3" fill="currentColor" stroke="none"/>',
  instant: '<rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M10 17.5h4"/><path d="M10 9l4 2-4 2z"/>',
  set: '<path d="M4 20l1-4.5L16 4.5l3.5 3.5L8.5 19z"/><path d="M14 6.5l3.5 3.5"/>',
  parseJson: '<path d="M9 4C7 4 7 5.5 7 7.5S6 11 4.5 12C6 13 7 14.5 7 16.5S7 20 9 20M15 4c2 0 2 1.5 2 3.5S18 11 19.5 12C18 13 17 14.5 17 16.5S17 20 15 20"/>',
  filter: '<path d="M4 5h16l-6.5 7.5V19l-3 1.5v-8z"/>',
  select: '<rect x="4" y="5" width="6" height="14" rx="1.5"/><rect x="14" y="5" width="6" height="14" rx="1.5"/><path d="M10 9h4M12.5 7.5L14 9l-1.5 1.5"/>',
  csv: '<path d="M7 3.5h7l4 4V20a.5.5 0 01-.5.5h-10.5a.5.5 0 01-.5-.5V4a.5.5 0 01.5-.5z"/><path d="M14 3.5V8h4M8.5 13h7M8.5 16.5h7M12 11v8"/>',
  if: '<path d="M4 12h6M10 12l6-6h4M10 12l6 6h4"/>',
  router: '<path d="M4 12h5M9 12l6-7h5M9 12h11M9 12l6 7h5"/>',
  foreach: '<path d="M20 12a8 8 0 11-2.3-5.6"/><path d="M20 4v4h-4"/><path d="M9 12h6M12 9v6"/>',
  terminate: '<circle cx="12" cy="12" r="8.5"/><rect x="9" y="9" width="6" height="6" rx="1"/>',
  varInit: '<path d="M8 4C6 4 6 6 6 8s-1 3-2 4c1 1 2 2 2 4s0 4 2 4M16 4c2 0 2 2 2 4s1 3 2 4c-1 1-2 2-2 4s0 4-2 4"/><path d="M10 10l4 4M14 10l-4 4"/>',
  varSet: '<path d="M8 4C6 4 6 6 6 8s-1 3-2 4c1 1 2 2 2 4s0 4 2 4M16 4c2 0 2 2 2 4s1 3 2 4c-1 1-2 2-2 4s0 4-2 4"/><path d="M10 10.5h4M10 13.5h4"/>',
  varInc: '<path d="M8 4C6 4 6 6 6 8s-1 3-2 4c1 1 2 2 2 4s0 4 2 4M16 4c2 0 2 2 2 4s1 3 2 4c-1 1-2 2-2 4s0 4-2 4"/><path d="M12 9v6M9 12h6"/>',
  varAppend: '<path d="M8 4C6 4 6 6 6 8s-1 3-2 4c1 1 2 2 2 4s0 4 2 4M16 4c2 0 2 2 2 4s1 3 2 4c-1 1-2 2-2 4s0 4-2 4"/><path d="M10 10h4M10 13h4M10 16h2"/>',
  http: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17"/>',
  approval: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  ai: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4 7l8 6 8-6"/>',
  slack: '<path d="M5 6.5A2.5 2.5 0 017.5 4h9A2.5 2.5 0 0119 6.5v6a2.5 2.5 0 01-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 015 12.5z"/>',
  sheets: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 10h16M4 15h16M10 4v16"/>',
  sheetsRead: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 10h16M10 4v16M13 15h4M15.5 13l2 2-2 2"/>',
  file: '<path d="M3.5 7.5A2 2 0 015.5 5.5H10l2 2h6.5a2 2 0 012 2V17a2 2 0 01-2 2h-13a2 2 0 01-2-2z"/><path d="M12 11v5M9.5 13.5L12 16l2.5-2.5"/>',
  task: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>',
  crm: '<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
  pbi: '<path d="M6 20V13M10 20V8M14 20v-9M18 20V4"/>',
  desktop: '<rect x="3.5" y="4.5" width="17" height="11.5" rx="2"/><path d="M9 20h6M12 16v4M8.5 10h3M10 8.5l1.5 1.5L10 11.5"/>',
  respond: '<path d="M10 7L5 12l5 5"/><path d="M5 12h9a5 5 0 015 5v1"/>',
  arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  down: '<path d="M7 7l10 10M17 9v8H9"/>',
};
const svg = (k, cls = '') => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${IC[k] || IC.arrow}</svg>`;

/* ---------------- Operaciones del simulador (las de Power Automate) ---------------- */
const TRIGGERS = ['formsIn', 'spItem', 'instant', 'webhook', 'schedule'];
const BRANCHING = ['if', 'router', 'foreach'];
const APPS = ['http', 'approval', 'ai', 'mail', 'slack', 'sheets', 'sheetsRead', 'file', 'task', 'crm', 'pbi', 'desktop', 'respond'];
const cond0 = () => ({ left: '', op: 'eq', right: '' });
const rows1 = () => [{ name: '', value: '' }];
const DEF = {
  formsIn: () => ({ form: '' }),
  spItem: () => ({ site: '', list: '' }),
  instant: () => ({ inputs: rows1() }),
  webhook: () => ({ path: '/flujo', method: 'POST' }),
  schedule: () => ({ every: 'Cada día', at: '09:00' }),
  set: () => ({ fields: rows1() }),
  parseJson: () => ({ content: '' }),
  filter: () => ({ from: '', cond: cond0() }),
  select: () => ({ from: '', textMode: false, value: '', fields: rows1() }),
  csv: () => ({ from: '' }),
  if: () => ({ cond: cond0() }),
  router: () => ({ on: '' }),
  foreach: () => ({ from: '' }),
  terminate: () => ({ status: 'Failed', code: '', message: '' }),
  varInit: () => ({ name: '', type: 'Integer', value: '' }),
  varSet: () => ({ name: '', value: '' }),
  varInc: () => ({ name: '', value: '1' }),
  varAppend: () => ({ name: '', value: '' }),
  http: () => ({ method: 'GET', url: '', body: '' }),
  approval: () => ({ assignedTo: '', title: '', details: '' }),
  ai: () => ({ prompt: '' }),
  mail: () => ({ to: '', subject: '', body: '' }),
  slack: () => ({ channel: '', text: '' }),
  sheets: () => ({ doc: '', sheet: '', columns: rows1() }),
  sheetsRead: () => ({ doc: '', sheet: '' }),
  file: () => ({ folder: '', name: '', content: '' }),
  task: () => ({ list: '', title: '', description: '', due: '' }),
  crm: () => ({ table: 'Contacts', email: '', name: '', props: [] }),
  pbi: () => ({ dataset: '', table: '', columns: rows1() }),
  desktop: () => ({ flowName: '', inputs: rows1() }),
  respond: () => ({ outputs: rows1() }),
};
const OPS = [['eq', 'es igual a'], ['neq', 'no es igual a'], ['contains', 'contiene'], ['ncontains', 'no contiene'], ['gt', 'es mayor que'], ['gte', 'es mayor o igual que'], ['lt', 'es menor que'], ['lte', 'es menor o igual que'], ['exists', 'no está vacío'], ['empty', 'está vacío']];

/* ---------------- Plataformas ---------------- */
// SAP CPI tiene su propio taller (editor BPMN y simulador de iFlows) en una página aparte
const SAP = { href: 'sap-cpi/index.html', scenarios: 11, practice: 9, quizzes: 20 };
const SOON = [
  ['MuleSoft', 'Integración y APIs de Salesforce: flows de Mule, conectores y DataWeave.'],
  ['KNIME', 'Workflows de nodos para preparar, analizar y transformar datos.'],
];
const N = (op, name, p = {}, branches) => ({ id: uid(), op, name, p: { ...DEF[op](), ...p }, ...(branches ? { branches } : {}) });
const col = (name, value) => ({ name, value });
const callsOf = (r, app) => r.calls.filter(c => c.app === app);
const all = (f, out = []) => { const walk = s => s.forEach(n => { out.push(n); (n.branches || []).forEach(b => walk(b.steps)); }); walk(f.steps); return out; };
const has = (f, op) => all(f).some(n => n.op === op);
const DEMO = 'empresa-demo.example';
const pa = s => `@{${s}}`;
const tb = f => pa(`triggerBody()?['${f}']`);
const bd = (a, f) => pa(`body('${a}')?['${f}']`);
const it = f => pa(`items('Apply_to_each')?['${f}']`);
const vr = n => pa(`variables('${n}')`);

/* Teoría: 20 clases, cada una con su cuestionario (la opción correcta va primero) */
const CLASSES = [
  ['Power Platform: panorama y licencias', [
    '<p><b>Microsoft Power Platform</b> reúne las herramientas low-code de Microsoft: <b>Power Apps</b> (aplicaciones), <b>Power Automate</b> (flujos), <b>Power BI</b> (reportes), <b>Copilot Studio</b> (agentes) y <b>Dataverse</b> (la base de datos común).</p>',
    '<p>Microsoft 365 incluye un uso básico de Power Automate con conectores <b>standard</b>. Los conectores <b>premium</b> (HTTP, Dataverse, SQL, SAP), los flujos de escritorio con ejecución desatendida, AI Builder y las aprobaciones avanzadas requieren licencias pagas: <b>Power Automate Premium</b> por usuario, <b>Process</b> por flujo o bot, o pago por uso con Azure.</p>',
    '<p>Por eso, en la práctica, Power Automate se aprende dentro de una empresa que ya pagó las licencias.</p>'
  ], [
    ['¿Qué herramienta de Power Platform se usa para automatizar procesos con flujos?', ['Power Automate', 'Power BI', 'Power Pages', 'Dataverse'], 'Power BI es para reportes y Dataverse es la base de datos.'],
    ['¿Qué conector requiere licencia premium?', ['HTTP', 'Office 365 Outlook', 'Microsoft Teams', 'OneDrive for Business'], 'HTTP, Dataverse, SQL y SAP son premium.'],
    ['¿Qué licencia se asigna a un flujo en lugar de a una persona?', ['Power Automate Process', 'Microsoft 365 E3', 'Power BI Pro', 'Power Apps per app'], 'Process sirve para flujos y bots de uso compartido.'],
    ['¿Qué es Dataverse?', ['La base de datos de Power Platform', 'Un conector de Excel', 'Un tipo de flujo', 'Un reporte de Power BI'], 'Guarda tablas con seguridad, relaciones y auditoría.'],
  ]],
  ['Entornos, seguridad y administración', [
    '<p>Todo vive dentro de un <b>entorno</b> (environment): flujos, apps, conexiones y datos de Dataverse. Lo habitual es tener entornos de <b>desarrollo</b>, <b>pruebas</b> y <b>producción</b>.</p>',
    '<ul><li>Los permisos se manejan con <b>roles de seguridad</b> (Environment Maker, System Administrator).</li><li>El <b>Power Platform admin center</b> administra entornos, capacidad y políticas.</li><li>Las <b>políticas de datos (DLP)</b> agrupan conectores en Business, Non-business y Blocked: un flujo no puede mezclar grupos.</li></ul>',
    '<p>Un error común es crear todo en el entorno por defecto (Default), que comparte toda la organización.</p>'
  ], [
    ['¿Para qué sirven varios entornos?', ['Para separar desarrollo, pruebas y producción', 'Para pagar menos', 'Para usar otro idioma', 'No sirven'], 'Así un cambio en desarrollo no rompe lo que está en producción.'],
    ['¿Qué controla una política de DLP?', ['Qué conectores se pueden combinar en un flujo', 'El horario de ejecución', 'El tamaño de los archivos', 'El idioma del diseñador'], 'Business y Non-business no se pueden mezclar.'],
    ['¿Desde dónde se administran los entornos?', ['Power Platform admin center', 'Power BI Desktop', 'Outlook', 'Planner'], 'También se ven capacidad, licencias y políticas.'],
    ['¿Qué riesgo tiene trabajar siempre en el entorno Default?', ['Lo comparte toda la organización y es difícil de gobernar', 'Es más lento', 'No tiene conectores', 'Ninguno'], 'Conviene usar entornos propios para cada equipo o proyecto.'],
  ]],
  ['Tipos de flujo y conectores', [
    '<ul><li><b>Automatizado</b>: arranca con un evento (llega un email, se crea un elemento).</li><li><b>Instantáneo</b>: lo dispara una persona con un botón o desde Power Apps.</li><li><b>Programado</b>: corre por horario (Recurrence).</li><li><b>De escritorio</b>: RPA con Power Automate Desktop.</li></ul>',
    '<p>Cada acción pertenece a un <b>conector</b> y usa una <b>conexión</b>: la cuenta con la que se autentica. Una misma conexión sirve para varios flujos.</p>',
    '<p>Si no existe un conector para un servicio, se puede crear un <b>conector personalizado</b> a partir de una definición OpenAPI.</p>'
  ], [
    ['¿Qué tipo de flujo corre todos los días a las 8?', ['Programado', 'Automatizado', 'Instantáneo', 'De escritorio'], 'Usa el trigger Recurrence.'],
    ['¿Qué es una conexión?', ['La cuenta con la que un conector se autentica', 'Una línea entre dos acciones', 'Un entorno', 'Un tipo de licencia'], 'Se crea una vez y se reutiliza.'],
    ['Un servicio interno tiene API pero no conector. ¿Qué podés hacer?', ['Crear un conector personalizado o usar HTTP', 'Nada', 'Usar Excel', 'Pedir un entorno nuevo'], 'El conector personalizado se arma desde OpenAPI.'],
    ['¿Qué tipo de flujo maneja aplicaciones de escritorio con clics y teclado?', ['De escritorio (Power Automate Desktop)', 'Programado', 'Instantáneo', 'Automatizado'], 'Es la parte de RPA de Power Automate.'],
  ]],
  ['Triggers', [
    '<p>El <b>trigger</b> es el primer paso. Ejemplos: <i>When a new response is submitted</i> (Forms), <i>When an item is created</i> (SharePoint), <i>When a new email arrives</i> (Outlook), <i>PowerApps (V2)</i>, <i>When a HTTP request is received</i> y <i>Recurrence</i>.</p>',
    '<ul><li>Los triggers por <b>polling</b> revisan cada tanto si hay novedades; los de <b>webhook</b> reciben el aviso al instante.</li><li>Las <b>trigger conditions</b> evitan que el flujo arranque si no se cumple una expresión, sin consumir ejecuciones.</li></ul>',
    '<p>Los datos del trigger se leen con <code>@{triggerBody()?[\'campo\']}</code>.</p>'
  ], [
    ['¿Qué trigger usarías para reaccionar cuando alguien completa un formulario?', ['When a new response is submitted', 'Recurrence', 'Apply to each', 'Compose'], 'Es el trigger de Microsoft Forms.'],
    ['¿Para qué sirven las trigger conditions?', ['Para que el flujo no arranque si no se cumple una condición', 'Para repetir el flujo', 'Para cambiar la conexión', 'Para crear variables'], 'Ahorran ejecuciones innecesarias.'],
    ['¿Cómo se lee el campo email del trigger?', ["@{triggerBody()?['email']}", '{{ $json.email }}', '${header.email}', '{{1.email}}'], 'Las otras opciones son de otras herramientas.'],
    ['¿Cuál es el trigger de un flujo programado?', ['Recurrence', 'When an item is created', 'PowerApps (V2)', 'Terminate'], 'Define frecuencia, hora y zona horaria.'],
  ]],
  ['Expresiones y contenido dinámico', [
    '<p>El <b>contenido dinámico</b> del diseñador son expresiones del lenguaje de Workflow Definition, escritas entre <code>@{ }</code>.</p>',
    '<pre>@{triggerBody()?[\'email\']}\n@{toLower(triggerBody()?[\'email\'])}\n@{concat(trim(triggerBody()?[\'nombre\']), \' \', triggerBody()?[\'apellido\'])}\n@{replace(triggerBody()?[\'dni\'], \'.\', \'\')}\n@{div(mul(int(triggerBody()?[\'monto\']), 121), 100)}</pre>',
    '<ul><li>Para leer otra acción: <code>body(\'Nombre_de_la_accion\')</code> u <code>outputs(\'Compose\')</code>, con guiones bajos en lugar de espacios.</li><li><code>?[\'campo\']</code> devuelve vacío si el campo no existe.</li><li>No hay operadores <code>+</code> ni <code>*</code>: se usan <code>add</code>, <code>sub</code>, <code>mul</code> y <code>div</code>.</li></ul>'
  ], [
    ['¿Cómo se suma en una expresión?', ['add(a, b)', 'a + b', 'sum(a, b)', 'plus(a, b)'], 'Las operaciones son funciones: add, sub, mul, div.'],
    ['La acción se llama "Send an email (V2)". ¿Cómo la referenciás?', ["body('Send_an_email_(V2)')", "body('Send an email (V2)')", 'body(Send_an_email)', "step('Send an email (V2)')"], 'Los espacios se reemplazan por guiones bajos.'],
    ['¿Qué devuelve replace(\'30.123.456\', \'.\', \'\')?', ['30123456', '30.123.456', '30', 'Un error'], 'Reemplaza todas las apariciones.'],
    ['¿Qué hace el ? en triggerBody()?[\'telefono\']?', ['Devuelve vacío si el campo no existe', 'Hace obligatorio el campo', 'Lo convierte en texto', 'Pide el valor al usuario'], 'Evita que el flujo falle por un campo faltante.'],
  ]],
  ['Operaciones de datos', [
    '<ul><li><b>Compose</b>: arma un valor u objeto para reutilizarlo.</li><li><b>Parse JSON</b>: convierte un JSON en campos que se pueden usar en el contenido dinámico.</li><li><b>Filter array</b>: deja solo los elementos de una lista que cumplen una condición; cada elemento es <code>item()</code>.</li><li><b>Select</b>: transforma cada elemento en otro objeto o, en modo texto, en un valor simple.</li><li><b>Create CSV table</b> y <b>Create HTML table</b>: convierten una lista en una tabla.</li></ul>',
    '<pre>Filter array → From: @{body(\'Parse_JSON\')?[\'pedidos\']}\n               @{item()?[\'estado\']} es igual a pendiente\n@{length(body(\'Filter_array\'))}\n@{join(body(\'Select\'), \', \')}</pre>',
    '<p>Filter array y Select procesan toda la lista en una sola acción: son mucho más rápidos que un Apply to each.</p>'
  ], [
    ['¿Qué representa item() dentro de Filter array?', ['El elemento que se está evaluando', 'El trigger', 'La última acción', 'Una variable'], 'Se usa en la condición: item()?[\'estado\'].'],
    ['¿Cómo contás los elementos que dejó un Filter array?', ["length(body('Filter_array'))", "count(Filter_array)", "items('Filter_array')", 'No se puede'], 'length funciona con listas y textos.'],
    ['¿Qué hace Select en modo texto?', ['Convierte cada elemento en un valor simple', 'Ordena la lista', 'Filtra la lista', 'Crea un archivo'], 'Sirve para después unir los valores con join().'],
    ['¿Por qué preferir Filter array a un Apply to each con Condition?', ['Procesa toda la lista en una acción y consume menos', 'Es obligatorio', 'Permite enviar emails', 'No hay diferencia'], 'Menos acciones, menos tiempo y menos límites.'],
  ]],
  ['Control: Condition, Switch y Apply to each', [
    '<ul><li><b>Condition</b>: dos ramas, Sí y No. Después de la Condition el flujo sigue con lo que esté debajo.</li><li><b>Switch</b>: compara un valor (<i>On</i>) con cada caso; si ninguno coincide, va al <b>Default</b>.</li><li><b>Apply to each</b>: repite las acciones de adentro por cada elemento de una lista. El elemento actual es <code>items(\'Apply_to_each\')</code>.</li><li><b>Do until</b>: repite hasta que se cumpla una condición.</li></ul>',
    '<p>Por defecto, Apply to each corre en orden. Se puede activar la <b>concurrencia</b> para procesar varios elementos a la vez, pero entonces las variables pueden pisarse.</p>'
  ], [
    ['¿Qué pasa después de una Condition?', ['El flujo sigue con las acciones de debajo', 'El flujo termina', 'Se repite', 'Vuelve al trigger'], 'Las ramas Sí y No se juntan al final.'],
    ['Llega un valor que no coincide con ningún caso del Switch. ¿Qué se ejecuta?', ['El Default', 'El primer caso', 'Nada y el flujo falla', 'Todos los casos'], 'Por eso conviene definir siempre el Default.'],
    ['Dentro de Apply to each, ¿cómo leés el campo nombre del elemento actual?', ["items('Apply_to_each')?['nombre']", "item()?['nombre']", "triggerBody()?['nombre']", "variables('nombre')"], 'item() es para Filter array y Select.'],
    ['¿Qué riesgo tiene activar la concurrencia en Apply to each?', ['Que varias iteraciones modifiquen la misma variable a la vez', 'Que no se ejecute', 'Que se borre la lista', 'Ninguno'], 'Con variables compartidas conviene dejarlo en orden.'],
  ]],
  ['Manejo de errores', [
    '<p>Cada acción tiene <b>Configure run after</b>: define si corre cuando la anterior terminó bien, falló, se saltó o venció el tiempo.</p>',
    '<ul><li>Patrón <b>try/catch</b>: un <b>Scope</b> "Try" con las acciones, y un Scope "Catch" configurado para correr solo si el primero falló.</li><li><b>Terminate</b> termina el flujo con estado Succeeded, Failed o Cancelled y un mensaje.</li><li>Las acciones HTTP y de conectores tienen <b>retry policy</b> para reintentar errores pasajeros.</li></ul>',
    '<p>Validar los datos al principio y terminar con un mensaje claro ahorra horas de búsqueda en el historial.</p>'
  ], [
    ['¿Cómo se arma un try/catch?', ['Con dos Scopes y Configure run after', 'Con un Switch', 'Con Apply to each', 'No se puede'], 'El Scope "Catch" corre cuando "Try" falla.'],
    ['¿Qué hace Terminate con estado Failed?', ['Termina el flujo marcándolo como fallido, con un mensaje', 'Reinicia el flujo', 'Saltea la acción', 'Envía un email'], 'El mensaje aparece en el historial.'],
    ['¿Qué configurás para reintentar una llamada HTTP que falla a veces?', ['La retry policy de la acción', 'Una trigger condition', 'Un entorno nuevo', 'Una variable'], 'Se puede elegir exponencial o intervalo fijo.'],
    ['¿Para qué sirve validar los datos al inicio del flujo?', ['Para cortar temprano con un error claro', 'Para que corra más rápido siempre', 'Para crear variables', 'No sirve'], 'Evita errores confusos más adelante.'],
  ]],
  ['Excel y SharePoint como origen de datos', [
    '<p><b>Excel Online (Business)</b> trabaja sobre <b>tablas</b>, no sobre rangos: <i>List rows present in a table</i> devuelve las filas en <code>value</code> y <i>Add a row into a table</i> agrega una.</p>',
    '<p><b>SharePoint</b> trabaja con <b>listas</b>: <i>When an item is created</i>, <i>Get items</i>, <i>Create item</i> y <i>Update item</i>. Es más robusto que Excel para varios usuarios a la vez.</p>',
    '<ul><li>List rows trae 256 filas por defecto: para más, activá la paginación.</li><li>Se puede filtrar en origen con una <b>Filter Query</b> OData para traer menos datos.</li><li>Excel bloquea el archivo mientras alguien lo edita; SharePoint no.</li></ul>'
  ], [
    ['¿Sobre qué trabaja el conector de Excel?', ['Tablas', 'Rangos sueltos', 'Gráficos', 'Macros'], 'Si el dato no está en una tabla, el conector no lo ve.'],
    ['¿Dónde quedan las filas que devuelve List rows present in a table?', ['En value', 'En rows', 'En items', 'En body directo'], 'Por eso se recorre body(...)?[\'value\'].'],
    ['¿Cuántas filas trae List rows por defecto?', ['256', '10', 'Todas', '5000'], 'Para más, se activa la paginación.'],
    ['¿Por qué una lista de SharePoint suele ser mejor que Excel como base de datos?', ['Soporta varios usuarios a la vez sin bloquear', 'Es más linda', 'No necesita conexión', 'Es premium'], 'Excel se bloquea mientras alguien edita.'],
  ]],
  ['Outlook y Teams', [
    '<ul><li><b>Send an email (V2)</b> envía desde el buzón de la conexión; <b>Send an email from a shared mailbox</b> desde un buzón compartido.</li><li><b>Post message in a chat or channel</b> publica en un canal o chat de Teams, como usuario o como Flow bot.</li><li>Las <b>tarjetas adaptables</b> permiten mostrar datos con formato y pedir una respuesta (<i>Post adaptive card and wait for a response</i>).</li></ul>',
    '<p>Para notificaciones de sistema conviene publicar como <b>Flow bot</b> o desde una cuenta de servicio, no con la cuenta personal de quien armó el flujo.</p>'
  ], [
    ['¿Qué acción envía un mensaje a un canal de Teams?', ['Post message in a chat or channel', 'Send an email (V2)', 'Create a task', 'Compose'], 'Se elige equipo, canal y quién publica.'],
    ['¿Qué permite una tarjeta adaptable?', ['Mostrar datos con formato y pedir una respuesta', 'Crear tablas de Excel', 'Cambiar licencias', 'Reemplazar un trigger'], 'El flujo puede esperar esa respuesta.'],
    ['¿Desde qué cuenta conviene enviar notificaciones de un proceso de la empresa?', ['Una cuenta de servicio o el Flow bot', 'La personal de quien armó el flujo', 'Cualquiera', 'Una cuenta de prueba'], 'Si la persona se va, el flujo sigue funcionando.'],
    ['¿Qué acción usarías para enviar desde el buzón de soporte@?', ['Send an email from a shared mailbox', 'Send an email (V2)', 'Post message', 'Create file'], 'La conexión necesita permisos sobre ese buzón.'],
  ]],
  ['Aprobaciones', [
    '<p><b>Start and wait for an approval</b> envía una solicitud por Teams, Outlook y la app de aprobaciones, y el flujo espera. El resultado queda en <code>outcome</code>: <b>Approve</b> o <b>Reject</b>.</p>',
    '<ul><li>Tipos: <i>Approve/Reject - First to respond</i>, <i>Everyone must approve</i> y respuestas personalizadas.</li><li>Para varios niveles (jefe y después finanzas) se encadenan aprobaciones con Conditions.</li><li>Una ejecución puede esperar hasta 30 días; para más, se diseña con tiempos límite y recordatorios.</li></ul>',
    '<p>Patrón útil: si se rechaza, avisar y <b>Terminate</b> con estado Succeeded para no seguir evaluando.</p>'
  ], [
    ['¿Qué valores devuelve outcome en una aprobación básica?', ['Approve o Reject', 'Sí o No', 'true o false', '1 o 0'], 'Con eso se arma la Condition siguiente.'],
    ['¿Cómo se arma una aprobación en dos niveles?', ['Encadenando aprobaciones con Conditions', 'Con un solo Compose', 'Con Recurrence', 'No se puede'], 'Primero el jefe y, si aprueba, finanzas.'],
    ['¿Cuánto puede esperar una ejecución por una aprobación?', ['Hasta 30 días', '1 hora', 'Para siempre', '5 minutos'], 'Es el límite de duración de una ejecución.'],
    ['Rechazaron la solicitud y no hay nada más que hacer. ¿Qué usás?', ['Terminate con estado Succeeded', 'Terminate con estado Failed', 'Un Switch', 'Una variable'], 'No es un error: el proceso terminó como corresponde.'],
  ]],
  ['Dataverse', [
    '<p><b>Dataverse</b> es la base de datos de Power Platform: tablas con columnas tipadas, relaciones, reglas de negocio, seguridad por roles y auditoría.</p>',
    '<ul><li>Acciones: <i>Add a new row</i>, <i>List rows</i>, <i>Get a row by ID</i>, <i>Update a row</i>.</li><li>Trigger: <i>When a row is added, modified or deleted</i>.</li><li><i>List rows</i> acepta filtros OData y FetchXML.</li></ul>',
    '<p>Es un conector premium. Las apps model-driven y Dynamics 365 guardan sus datos en Dataverse.</p>'
  ], [
    ['¿Qué es una tabla de Dataverse?', ['Un conjunto de filas con columnas tipadas y seguridad', 'Una hoja de Excel', 'Un canal de Teams', 'Un flujo'], 'Es más robusta que Excel o SharePoint.'],
    ['¿Qué trigger reacciona a cambios en Dataverse?', ['When a row is added, modified or deleted', 'Recurrence', 'When a new email arrives', 'Manually trigger a flow'], 'Se puede filtrar por columnas.'],
    ['¿Qué tipo de conector es Dataverse?', ['Premium', 'Standard', 'Personalizado', 'De escritorio'], 'Requiere licencia de Power Automate o Power Apps.'],
    ['¿Qué productos guardan sus datos en Dataverse?', ['Dynamics 365 y las apps model-driven', 'Outlook', 'Excel', 'Planner'], 'Por eso aparece en casi todos los proyectos de Dynamics.'],
  ]],
  ['HTTP y APIs', [
    '<p>El conector <b>HTTP</b> (premium) llama a cualquier API: GET, POST, PUT, PATCH o DELETE, con headers, body y autenticación (Basic, OAuth, certificado, Azure AD).</p>',
    '<ul><li>La respuesta queda en <code>body(\'HTTP\')</code> y el código en <code>outputs(\'HTTP\')?[\'statusCode\']</code>.</li><li>Las claves nunca van en la URL: van en la autenticación o en Azure Key Vault.</li><li>El trigger <i>When a HTTP request is received</i> expone el flujo como un endpoint.</li></ul>',
    '<p>Si una API se usa en muchos flujos, conviene un <b>conector personalizado</b>.</p>'
  ], [
    ['¿Dónde queda la respuesta de una llamada HTTP?', ["En body('HTTP')", 'En triggerBody()', "En variables('HTTP')", 'En el entorno'], 'El código de estado está en outputs.'],
    ['¿Dónde no deberías poner una clave de API?', ['En la URL', 'En Azure Key Vault', 'En la autenticación de la acción', 'En un conector personalizado'], 'La URL queda registrada en el historial.'],
    ['¿Qué trigger convierte un flujo en un endpoint que otros sistemas pueden llamar?', ['When a HTTP request is received', 'Recurrence', 'When a new response is submitted', 'Apply to each'], 'Genera una URL al guardar el flujo.'],
    ['¿Cómo sabés si la API respondió con error?', ["Revisando outputs('HTTP')?['statusCode']", 'Mirando el color de la acción', 'No se puede', 'Con un Switch vacío'], 'Un 200 es éxito; 4xx y 5xx son errores.'],
  ]],
  ['AI Builder y Copilot', [
    '<p><b>AI Builder</b> agrega modelos de IA a los flujos: <b>prompts</b> (<i>Run a prompt</i>), procesamiento de <b>facturas</b> y documentos, clasificación de texto, análisis de sentimiento y extracción de entidades.</p>',
    '<ul><li>Consume <b>créditos de AI Builder</b>, incluidos en algunas licencias o comprados aparte.</li><li>Pedí respuestas con formato fijo (una palabra de una lista o un JSON) y convertí con <code>json()</code>.</li><li><b>Copilot</b> en Power Automate permite describir un flujo en lenguaje natural para que lo arme.</li></ul>',
    '<p>Toda salida de IA que afecte a un cliente o a un pago tiene que tener revisión humana.</p>'
  ], [
    ['¿Qué consume AI Builder?', ['Créditos de AI Builder', 'Nada', 'Ejecuciones de Excel', 'Horas de Power BI'], 'Es un costo aparte de la licencia del flujo.'],
    ['Le pedís a un prompt un JSON. ¿Qué hacés antes de usar sus campos?', ['Convertirlo con json()', 'Pasarlo a mayúsculas', 'Enviarlo por Teams', 'Nada'], 'La respuesta llega como texto.'],
    ['¿Qué modelo de AI Builder sirve para leer facturas en PDF?', ['Procesamiento de facturas', 'Análisis de sentimiento', 'Clasificación de texto', 'Copilot'], 'Extrae proveedor, fecha, total y más.'],
    ['¿Cuándo hace falta revisión humana de una salida de IA?', ['Cuando afecta a un cliente o a un pago', 'Nunca', 'Solo los viernes', 'Solo en Excel'], 'La IA puede equivocarse con seguridad aparente.'],
  ]],
  ['Power Automate Desktop (RPA)', [
    '<p><b>Power Automate Desktop</b> automatiza aplicaciones de escritorio y web con clics, teclado y lectura de pantalla: sistemas viejos sin API, SAP GUI, Excel de escritorio.</p>',
    '<ul><li>Un flujo de nube lo llama con <i>Run a flow built with Power Automate for desktop</i>, pasándole entradas y recibiendo salidas.</li><li><b>Atendido</b>: corre con un usuario conectado. <b>Desatendido</b>: corre solo en una máquina, y requiere licencia Process o Premium con add-on.</li><li>La máquina se registra en un <b>machine group</b>.</li></ul>',
    '<p>RPA es frágil ante cambios de pantalla: si existe API o conector, siempre es mejor.</p>'
  ], [
    ['¿Cuándo conviene usar RPA?', ['Cuando el sistema no tiene API ni conector', 'Siempre', 'Para enviar emails', 'Para leer Excel en la nube'], 'Si hay API, es más estable usarla.'],
    ['¿Qué acción de un flujo de nube ejecuta un flujo de escritorio?', ['Run a flow built with Power Automate for desktop', 'Apply to each', 'HTTP', 'Compose'], 'Le pasa entradas y recibe salidas.'],
    ['¿Qué diferencia hay entre atendido y desatendido?', ['Atendido necesita un usuario conectado; desatendido corre solo', 'Son iguales', 'Desatendido es gratis', 'Atendido no tiene salidas'], 'El desatendido requiere licencia específica.'],
    ['¿Por qué RPA es frágil?', ['Depende de la pantalla, que puede cambiar', 'Porque es lento', 'Porque no usa Excel', 'No es frágil'], 'Un cambio de diseño en la app rompe el flujo.'],
  ]],
  ['Power Apps y Power Automate', [
    '<p>Una app de <b>Power Apps</b> puede ejecutar un flujo con el trigger <b>PowerApps (V2)</b>, que define entradas tipadas (texto, número, email, archivo).</p>',
    '<ul><li>El flujo devuelve datos a la app con <b>Respond to a PowerApp or flow</b>.</li><li>En la app se llama así: <code>Set(res, MiFlujo.Run(txtNombre.Text, txtEmail.Text))</code> y después <code>res.mensaje</code>.</li><li>El flujo corre con las conexiones de quien usa la app, salvo que se configure de otra forma.</li></ul>',
    '<p>Sirve para tareas que la app no puede hacer sola: enviar emails con formato, llamar APIs o generar archivos.</p>'
  ], [
    ['¿Qué trigger se usa para llamar un flujo desde Power Apps?', ['PowerApps (V2)', 'Recurrence', 'When a HTTP request is received', 'When an item is created'], 'Define las entradas que manda la app.'],
    ['¿Cómo devuelve datos el flujo a la app?', ['Con Respond to a PowerApp or flow', 'Con Send an email', 'Con Compose', 'No puede'], 'Las salidas se leen en la app.'],
    ['¿Cómo se ejecuta el flujo desde Power Fx?', ['MiFlujo.Run(...)', 'Run(MiFlujo)', 'Flow.Start(MiFlujo)', 'Call MiFlujo'], 'Se guarda el resultado con Set().'],
    ['¿Para qué se usa un flujo desde una app?', ['Para tareas que la app no hace sola, como llamar APIs o enviar emails', 'Para dibujar pantallas', 'Para cambiar colores', 'Para nada'], 'La app se ocupa de la interfaz y el flujo del proceso.'],
  ]],
  ['Power BI y análisis de datos con flujos', [
    '<p>Los flujos preparan y mueven datos para <b>Power BI</b>: <i>Add rows to a dataset</i> agrega filas a un dataset de streaming o push, y <i>Refresh a dataset</i> actualiza un modelo.</p>',
    '<ul><li>Para sumar o contar dentro de un flujo se usan <b>variables</b>: <i>Initialize variable</i> al principio, <i>Increment variable</i> dentro de Apply to each.</li><li>Las variables se inicializan en el nivel superior del flujo, nunca dentro de un bucle.</li><li>Desde Power BI, el visual de Power Automate permite lanzar un flujo con los datos filtrados en el reporte.</li></ul>',
    '<p>Para volúmenes grandes, el cálculo conviene hacerlo en Power BI o en una base de datos, no en el flujo.</p>'
  ], [
    ['¿Dónde se inicializa una variable?', ['En el nivel superior del flujo, antes de usarla', 'Dentro de Apply to each', 'En el trigger', 'En Power BI'], 'Initialize variable no se puede usar dentro de un bucle.'],
    ['¿Qué acción suma un valor a una variable numérica?', ['Increment variable', 'Set variable', 'Compose', 'Append to array variable'], 'Set variable reemplaza el valor.'],
    ['¿Qué acción manda datos a un dataset de Power BI?', ['Add rows to a dataset', 'Create file', 'Send an email', 'Parse JSON'], 'Sirve para datasets push o streaming.'],
    ['¿Dónde conviene calcular sobre millones de filas?', ['En Power BI o en una base de datos', 'En un Apply to each', 'En una variable', 'En Teams'], 'Los flujos tienen límites de acciones y tiempo.'],
  ]],
  ['Soluciones y ALM', [
    '<p>Una <b>solución</b> empaqueta flujos, apps, tablas y conectores para moverlos entre entornos. Es la base del ciclo de vida (<b>ALM</b>).</p>',
    '<ul><li><b>Referencias de conexión</b>: el flujo apunta a una referencia, y en cada entorno se elige la conexión real.</li><li><b>Variables de entorno</b>: URLs, IDs de listas o correos que cambian entre desarrollo y producción.</li><li>Las soluciones se exportan como <b>no administradas</b> (para desarrollo) y se importan como <b>administradas</b> en producción.</li><li><b>Pipelines</b> de Power Platform o Azure DevOps y GitHub automatizan el despliegue.</li></ul>'
  ], [
    ['¿Para qué sirve una solución?', ['Para mover flujos y apps entre entornos', 'Para pagar licencias', 'Para crear conexiones personales', 'Para borrar historial'], 'Es la unidad de despliegue.'],
    ['¿Qué resuelven las variables de entorno?', ['Valores que cambian entre desarrollo y producción', 'Errores de expresiones', 'Licencias', 'Idiomas'], 'Por ejemplo, la URL de una API o un ID de lista.'],
    ['¿Cómo se importa una solución en producción?', ['Como administrada', 'Como no administrada', 'Copiando el flujo a mano', 'Desde Excel'], 'Las administradas no se editan en producción.'],
    ['¿Qué son las referencias de conexión?', ['Un intermediario que permite elegir la conexión en cada entorno', 'Un tipo de trigger', 'Un conector premium', 'Una política DLP'], 'Evitan rearmar el flujo en cada entorno.'],
  ]],
  ['Monitoreo, límites y rendimiento', [
    '<p>El <b>historial de ejecuciones</b> (run history) muestra las entradas, salidas y duración de cada acción, y permite reenviar una ejecución.</p>',
    '<ul><li>Cada licencia tiene un límite de <b>solicitudes a la plataforma</b> por día; si se supera, el flujo se ralentiza.</li><li>Los conectores tienen sus propios límites de llamadas.</li><li>Para mejorar el rendimiento: filtrar en origen, usar Filter array y Select en vez de bucles, y activar la concurrencia con cuidado.</li><li>El <b>Power Platform admin center</b> y el <b>CoE Starter Kit</b> dan reportes de uso de toda la organización.</li></ul>'
  ], [
    ['¿Dónde ves las entradas y salidas de cada acción de una ejecución?', ['En el historial de ejecuciones', 'En el entorno', 'En la política DLP', 'En Planner'], 'También podés reenviar la ejecución.'],
    ['¿Qué pasa si un flujo supera el límite de solicitudes de la licencia?', ['Se ralentiza', 'Se borra', 'Se vuelve premium', 'No pasa nada'], 'Se aplica throttling.'],
    ['¿Qué mejora el rendimiento de un flujo con muchas filas?', ['Filtrar en origen y usar Filter array y Select', 'Agregar más Conditions', 'Usar más variables', 'Enviar más emails'], 'Menos acciones por ejecución.'],
    ['¿Qué herramienta da reportes de uso de toda la organización?', ['El CoE Starter Kit', 'Outlook', 'Planner', 'Power Automate Desktop'], 'Se instala en un entorno propio.'],
  ]],
  ['Gobierno y buenas prácticas', [
    '<ul><li>Nombrá las acciones por lo que hacen: <i>Obtener facturas vencidas</i> en lugar de <i>List rows present in a table 2</i>.</li><li>Usá <b>cuentas de servicio</b> para las conexiones de procesos de la empresa.</li><li>Guardá secretos en <b>Azure Key Vault</b> o en las conexiones, nunca en el flujo.</li><li>Agregá notas y Scopes para que otra persona entienda el flujo.</li><li>Definí un <b>Center of Excellence (CoE)</b>: quién puede crear flujos, en qué entornos y con qué conectores.</li></ul>',
    '<p>Un buen flujo no solo funciona: se entiende, se puede mover a producción y avisa cuando falla.</p>'
  ], [
    ['¿Qué cuenta conviene usar para las conexiones de un proceso de la empresa?', ['Una cuenta de servicio', 'La personal de quien armó el flujo', 'Cualquiera', 'Una de prueba'], 'Si la persona se va, el flujo sigue funcionando.'],
    ['¿Dónde se guardan los secretos?', ['En Azure Key Vault o en las conexiones', 'En un Compose', 'En el nombre del flujo', 'En la URL'], 'Así no quedan expuestos en el historial.'],
    ['¿Por qué renombrar las acciones?', ['Para que el flujo se entienda y las expresiones sean legibles', 'Porque es obligatorio', 'Para que sea más rápido', 'No hace falta'], 'body(\'Obtener_facturas_vencidas\') se entiende solo.'],
    ['¿Qué es un Center of Excellence (CoE)?', ['El equipo y las reglas que gobiernan Power Platform en la empresa', 'Un entorno de pruebas', 'Un conector', 'Un tipo de licencia'], 'Define quién crea qué y dónde.'],
  ]],
];

const P = {
  pa: {
    name: 'Power Platform', short: 'Power Automate', tone: 'sky', layout: 'v', flow: 'flujo', node: 'acción', run: 'Probar', enterprise: true,
    tag: 'Power Automate y Power Platform de Microsoft',
    intro: 'Power Automate es la herramienta de flujos de Microsoft Power Platform. Conecta Outlook, Teams, Excel, SharePoint, Dataverse y cientos de servicios, y se combina con Power Apps, Power BI y AI Builder. Los conectores premium, la automatización de escritorio y AI Builder requieren licencia paga.',
    cheat: ['Las expresiones van entre <code>@{ }</code>: <code>@{triggerBody()?[\'email\']}</code>.', 'La salida de una acción se lee por su nombre, con guiones bajos: <code>@{body(\'Run_a_prompt\')?[\'text\']}</code> u <code>outputs(\'Compose\')</code>.', 'En Apply to each: <code>@{items(\'Apply_to_each\')?[\'campo\']}</code>. En Filter array y Select: <code>@{item()?[\'campo\']}</code>.', 'Variables: <code>@{variables(\'total\')}</code>. Funciones: <code>toLower</code>, <code>concat</code>, <code>replace</code>, <code>add</code>, <code>mul</code>, <code>div</code>, <code>int</code>, <code>json</code>, <code>length</code>, <code>join</code>, <code>empty</code>, <code>and</code>, <code>not</code>.'],
    cat: {
      formsIn: ['When a new response is submitted', 'Triggers', 'Microsoft Forms: arranca cuando alguien envía el formulario.'],
      spItem: ['When an item is created', 'Triggers', 'SharePoint: arranca cuando se crea un elemento en una lista.'],
      instant: ['PowerApps (V2)', 'Triggers', 'Power Apps: la app ejecuta el flujo y le pasa entradas.'],
      webhook: ['When a HTTP request is received', 'Triggers', 'Request (premium): el flujo recibe una petición HTTP.'],
      schedule: ['Recurrence', 'Triggers', 'Schedule: el flujo corre por horario.'],
      if: ['Condition', 'Control', 'Dos ramas, Sí y No. Después, el flujo sigue con lo de abajo.'],
      router: ['Switch', 'Control', 'Compara un valor con cada caso; si ninguno coincide, va al Default.'],
      foreach: ['Apply to each', 'Control', 'Repite las acciones de adentro por cada elemento de una lista.'],
      terminate: ['Terminate', 'Control', 'Termina el flujo con estado Succeeded, Failed o Cancelled.'],
      varInit: ['Initialize variable', 'Variables', 'Crea una variable. Va en el nivel superior, antes de usarla.'],
      varSet: ['Set variable', 'Variables', 'Reemplaza el valor de una variable.'],
      varInc: ['Increment variable', 'Variables', 'Suma un valor a una variable Integer o Float.'],
      varAppend: ['Append to array variable', 'Variables', 'Agrega un elemento a una variable Array.'],
      set: ['Compose', 'Operaciones de datos', 'Arma un objeto con los campos que definas. Se lee con outputs(\'Compose\').'],
      parseJson: ['Parse JSON', 'Operaciones de datos', 'Convierte un JSON en un objeto con campos.'],
      filter: ['Filter array', 'Operaciones de datos', 'Deja los elementos de una lista que cumplen la condición (item()).'],
      select: ['Select', 'Operaciones de datos', 'Transforma cada elemento de una lista (item()).'],
      csv: ['Create CSV table', 'Operaciones de datos', 'Convierte una lista de objetos en un texto CSV.'],
      mail: ['Send an email (V2)', 'Office 365 Outlook', 'Envía un email desde Outlook.'],
      slack: ['Post message in a chat or channel', 'Microsoft Teams', 'Publica un mensaje en un canal de Teams.'],
      sheetsRead: ['List rows present in a table', 'Excel Online (Business)', 'Devuelve las filas de una tabla en value.'],
      sheets: ['Add a row into a table', 'Excel Online (Business)', 'Agrega una fila a una tabla de Excel.'],
      file: ['Create file', 'OneDrive for Business', 'Crea un archivo en una carpeta.'],
      task: ['Create a task', 'Planner', 'Crea una tarea en un plan de Planner.'],
      crm: ['Add a new row', 'Dataverse', 'Agrega una fila a una tabla de Dataverse (premium).'],
      approval: ['Start and wait for an approval', 'Approvals', 'Envía una aprobación y espera Approve o Reject.'],
      ai: ['Run a prompt', 'AI Builder', 'Ejecuta un prompt y devuelve la respuesta en text.'],
      pbi: ['Add rows to a dataset', 'Power BI', 'Agrega filas a un dataset de Power BI.'],
      desktop: ['Run a flow built with Power Automate for desktop', 'Power Automate Desktop', 'Ejecuta un flujo de RPA y recibe sus salidas.'],
      respond: ['Respond to a PowerApp or flow', 'Power Apps', 'Devuelve valores a la app que llamó al flujo.'],
      http: ['HTTP', 'HTTP (premium)', 'Llama a cualquier API.'],
    },
    lessons: CLASSES.map(c => [c[0], c[1]]),
    quizzes: CLASSES.map((c, i) => ({ id: 'c' + (i + 1), title: `Clase ${i + 1}: ${c[0]}`, qs: c[2] })),
  },
};

/* ---------------- Ejercicios: 11 escenarios guiados y 9 de práctica extra ---------------- */
const G = (n, j) => ({ ...j, cat: 'Escenarios guiados', level: `Clase ${n}` });
const X = j => ({ ...j, cat: 'Práctica extra', level: 'Extra' });
const okText = (call, ex) => call.params.text === ex || `El mensaje fue «${call.params.text}»; se esperaba «${ex}».`;
const inChannel = (r, ch) => { const t = callsOf(r, 'slack'); return t.find(x => String(x.params.channel).trim() === ch); };
const GASTO = (empleado, email, monto, concepto) => ({ empleado, email, monto, concepto });
const FACT = [['Distribuidora Andina', 'FA-0001-00012345', '185000'], ['Café del Puerto', 'FB-0002-00000731', '42000']];
const factAi = p => { const f = FACT.find(x => p.includes(x[1])); return f ? JSON.stringify({ proveedor: f[0], numero: f[1], total: f[2] }) : JSON.stringify({ proveedor: '', numero: '', total: '0' }); };
const COBROS = [['Ana Gil', 'ana@clientes.example', 'F-101', 25000, 'vencida'], ['Iván Sosa', 'ivan@clientes.example', 'F-102', 12000, 'pagada'], ['Mora Paz', 'mora@clientes.example', 'F-103', 54000, 'vencida']].map(([cliente, email, factura, monto, estado]) => ({ cliente, email, factura, monto, estado }));
const COBROS_B = [{ cliente: 'Luis Ortiz', email: 'luis@clientes.example', factura: 'F-201', monto: 9000, estado: 'pagada' }];
const dolar = v => () => ({ moneda: 'USD', compra: v - 20, venta: v, fecha: '2026-11-18' });
const PED = (...l) => () => ({ pedidos: l.map(([id, cliente, estado]) => ({ id, cliente, estado })) });
const PEND = [{ pedido: '7001', cliente: 'ACME', monto: 120000 }, { pedido: '7002', cliente: 'Verde SA', monto: 45000 }];
const erp = ({ flowName, inputs }) => (flowName === 'CargarPedidoERP' ? { estado: 'ok', numeroERP: '45' + inputs.pedido } : { estado: 'error', numeroERP: '' });
const VENTAS = [['Norte', 1200, 'pagado'], ['Sur', 3000, 'pagado'], ['Centro', 2500, 'pagado'], ['Sur', 900, 'pendiente'], ['Norte', 5000, 'pendiente']].map(([region, monto, estado], i) => ({ fecha: `2026-11-1${i}`, region, monto, estado }));
const VENTAS_B = [['Norte', 800, 'pagado'], ['Sur', 2600, 'pagado'], ['Centro', 4000, 'pendiente']].map(([region, monto, estado], i) => ({ fecha: `2026-11-2${i}`, region, monto, estado }));
const SERV = [['Web', 'https://web.empresa-demo.example/health'], ['Pagos', 'https://pagos.empresa-demo.example/health'], ['Stock', 'https://stock.empresa-demo.example/health']].map(([nombre, url]) => ({ nombre, url }));
const health = (...down) => ({ url }) => ({ statusCode: down.some(d => url.includes(d)) ? 503 : 200, body: {} });
const RECL = [['ACME', 'El pedido llegó con dos días de demora.'], ['Verde SA', 'La factura vino con el CUIT equivocado.'], ['Kiosco Sur', 'El repartidor no esperó y se llevó el pedido.']].map(([cliente, detalle]) => ({ cliente, detalle }));
const resumenAi = list => p => (list.every(r => p.includes(r.detalle)) ? `Resumen: ${list.length} reclamos esta semana, principalmente por entregas y facturación.` : 'No recibí los reclamos para resumir.');
const SENT = [['Nora Paz', 'nora@mail.example', 'Pésima atención, nadie responde los mensajes.', 'negativo'], ['Hugo Lima', 'hugo@mail.example', 'Excelente servicio, llegó antes de lo esperado.', 'positivo'], ['Eva Ruiz', 'eva@mail.example', 'Recibí el pedido.', 'neutro']];
const sentAi = p => (SENT.find(s => p.includes(s[2])) || [])[3] || 'neutro';
const CLIENTES = [{ nombre: 'Pérez, Ana', email: 'ana@mail.example', ciudad: 'Rosario' }, { nombre: 'Luis Ortiz', email: 'luis@mail.example', ciudad: 'Córdoba' }];

const PROJ = { pa: [
  G(4, {
    id: 'bienvenida', title: 'Bienvenida a un curso desde Forms',
    story: 'Cuando alguien completa el formulario de inscripción, tiene que recibir un email de bienvenida y el equipo tiene que enterarse en Teams.',
    objectives: ['Usar un trigger de Microsoft Forms.', 'Leer las respuestas con triggerBody().', 'Combinar texto fijo y contenido dinámico.'],
    reqs: [
      'Trigger: <b>When a new response is submitted</b> (formulario <code>Inscripción a cursos</code>).',
      '<b>Send an email (V2)</b> al <code>email</code> de la respuesta, con asunto <code>Bienvenida al curso CURSO</code> y el nombre en el cuerpo.',
      '<b>Post message in a chat or channel</b> en el canal <code>Inscripciones</code>: <code>Nueva inscripción: NOMBRE en CURSO</code>.',
    ],
    hints: ['Las respuestas se leen así: @{triggerBody()?[\'curso\']}.', 'En el asunto podés escribir texto fijo y al lado la expresión.'],
    real: ['En Power Automate real, el trigger de Forms solo trae el ID de la respuesta: hay que agregar "Get response details" para leer las respuestas.', 'El formulario tiene que pertenecer a la cuenta de la conexión o a un grupo de la que sea parte.'],
    sample: [{ nombre: 'Ana Pérez', email: 'ana@mail.example', curso: 'Power Automate desde cero' }],
    checks: [['Empieza con el trigger de Forms', f => f.steps[0]?.op === 'formsIn']],
    tests: [['Ana Pérez', 'ana@mail.example', 'Power Automate desde cero'], ['Luis Ortiz', 'luis@mail.example', 'Excel avanzado']].map(([nombre, email, curso]) => ({ name: `Inscripción de ${nombre}`, input: [{ nombre, email, curso }], expect: r => {
      const m = callsOf(r, 'mail')[0]; if (!m) return 'No se envió el email de bienvenida.';
      if (m.params.to !== email) return `El email fue a «${m.params.to}».`;
      if (m.params.subject !== `Bienvenida al curso ${curso}`) return `El asunto fue «${m.params.subject}».`;
      if (!m.params.body.includes(nombre)) return 'El cuerpo del email tiene que incluir el nombre.';
      const t = inChannel(r, 'Inscripciones'); if (!t) return 'Falta el mensaje en el canal Inscripciones.';
      return okText(t, `Nueva inscripción: ${nombre} en ${curso}`);
    } })),
    solution: () => ({ steps: [
      N('formsIn', 'When a new response is submitted', { form: 'Inscripción a cursos' }),
      N('mail', 'Send an email (V2)', { to: tb('email'), subject: `Bienvenida al curso ${tb('curso')}`, body: `Hola ${tb('nombre')}, ya estás inscripto. Te esperamos.` }),
      N('slack', 'Post message in a chat or channel', { channel: 'Inscripciones', text: `Nueva inscripción: ${tb('nombre')} en ${tb('curso')}` }),
    ] }),
  }),
  G(5, {
    id: 'normalizar', title: 'Normalizar datos con expresiones',
    story: 'Un sistema viejo manda los clientes con espacios de más, el email en mayúsculas, el DNI con puntos y el monto sin IVA. Antes de guardarlos en Excel hay que dejarlos prolijos.',
    objectives: ['Usar funciones de texto: trim, toLower, concat, replace.', 'Hacer cálculos con int, mul y div.', 'Reutilizar resultados con Compose.'],
    reqs: [
      'Trigger: <b>When a HTTP request is received</b>.',
      '<b>Compose</b> con cuatro campos: <code>nombreCompleto</code> (nombre y apellido sin espacios de más, separados por un espacio), <code>email</code> en minúsculas, <code>dni</code> sin puntos y <code>total</code> con 21% de IVA: <code>@{div(mul(int(triggerBody()?[\'monto\']), 121), 100)}</code>.',
      '<b>Add a row into a table</b> en la tabla <code>Clientes</code>, con las columnas <code>NombreCompleto</code>, <code>Email</code>, <code>DNI</code> y <code>Total</code> tomadas del Compose.',
    ],
    hints: ['concat(trim(triggerBody()?[\'nombre\']), \' \', trim(triggerBody()?[\'apellido\'])).', 'replace(triggerBody()?[\'dni\'], \'.\', \'\') quita todos los puntos.', 'Los campos del Compose se leen con @{outputs(\'Compose\')?[\'dni\']}.'],
    real: ['En el diseñador, las expresiones se escriben en la pestaña Expression del panel de contenido dinámico.', 'Para formatos de moneda existe formatNumber(valor, \'C2\', \'es-AR\').'],
    sample: [{ nombre: '  Ana ', apellido: 'Pérez ', email: 'ANA.PEREZ@MAIL.COM', dni: '30.123.456', monto: '1500' }],
    checks: [['Usa Compose', f => has(f, 'set')], ['Agrega la fila en Excel', f => has(f, 'sheets')]],
    tests: [[{ nombre: '  Ana ', apellido: 'Pérez ', email: 'ANA.PEREZ@MAIL.COM', dni: '30.123.456', monto: '1500' }, 'Ana Pérez', 'ana.perez@mail.com', '30123456', 1815], [{ nombre: 'Luis', apellido: ' Ortiz', email: 'Luis@Correo.COM', dni: '28.555.010', monto: '2000' }, 'Luis Ortiz', 'luis@correo.com', '28555010', 2420]].map(([inp, nc, em, dni, total]) => ({ name: `Cliente ${nc}`, input: [inp], expect: r => {
      const x = callsOf(r, 'sheets')[0]; if (!x) return 'No se agregó la fila.';
      if (String(x.params.sheet).trim() !== 'Clientes') return `La tabla es «${x.params.sheet}».`;
      const v = x.params.values;
      for (const [k, val] of [['NombreCompleto', nc], ['Email', em], ['DNI', dni], ['Total', total]]) if (String(v[k]) !== String(val)) return `La columna ${k} vale «${v[k] ?? ''}»; se esperaba «${val}».`;
      return true;
    } })),
    solution: () => ({ steps: [
      N('webhook', 'When a HTTP request is received', { path: '/clientes' }),
      N('set', 'Compose', { fields: [col('nombreCompleto', pa("concat(trim(triggerBody()?['nombre']), ' ', trim(triggerBody()?['apellido']))")), col('email', pa("toLower(triggerBody()?['email'])")), col('dni', pa("replace(triggerBody()?['dni'], '.', '')")), col('total', pa("div(mul(int(triggerBody()?['monto']), 121), 100)"))] }),
      N('sheets', 'Add a row into a table', { doc: 'Clientes.xlsx', sheet: 'Clientes', columns: [col('NombreCompleto', pa("outputs('Compose')?['nombreCompleto']")), col('Email', pa("outputs('Compose')?['email']")), col('DNI', pa("outputs('Compose')?['dni']")), col('Total', pa("outputs('Compose')?['total']"))] }),
    ] }),
  }),
  G(6, {
    id: 'pendientes', title: 'Pedidos pendientes con Filter array y Select',
    story: 'Logística quiere un aviso cada mañana con los pedidos que siguen pendientes. Los datos vienen de una API.',
    objectives: ['Leer una API y convertir la respuesta con Parse JSON.', 'Filtrar una lista sin bucles con Filter array.', 'Transformar con Select en modo texto y unir con join().'],
    reqs: [
      'Trigger: <b>Recurrence</b>.',
      '<b>HTTP</b>: GET a <code>https://api.logistica-demo.example/pedidos</code>.',
      '<b>Parse JSON</b> con Content <code>@{body(\'HTTP\')}</code>.',
      '<b>Filter array</b> sobre <code>@{body(\'Parse_JSON\')?[\'pedidos\']}</code>: <code>@{item()?[\'estado\']}</code> es igual a <code>pendiente</code>.',
      '<b>Select</b> en modo texto sobre <code>@{body(\'Filter_array\')}</code>, con el valor <code>@{item()?[\'id\']}</code>.',
      '<b>Teams</b> al canal <code>Logística</code>: <code>Pedidos pendientes (N): ID1, ID2</code>, con <code>length()</code> y <code>join()</code>.',
    ],
    mock: 'La API responde, por ejemplo: {"pedidos":[{"id":"P-101","cliente":"ACME","estado":"pendiente"}, …]}',
    hints: ['El texto del mensaje: Pedidos pendientes (@{length(body(\'Filter_array\'))}): @{join(body(\'Select\'), \', \')}.', 'Filter array y Select usan item(); Apply to each usa items().'],
    real: ['En Parse JSON real hay que pegar un esquema; el botón "Use sample payload" lo genera a partir de un ejemplo.', 'Filter array tiene un modo avanzado para condiciones compuestas.'],
    sample: [{}], http: PED(['P-101', 'ACME', 'pendiente'], ['P-102', 'Verde SA', 'entregado'], ['P-103', 'Kiosco Sur', 'pendiente']),
    checks: [['Usa Filter array', f => has(f, 'filter')], ['Usa Select', f => has(f, 'select')]],
    tests: [['Dos pendientes', PED(['P-101', 'ACME', 'pendiente'], ['P-102', 'Verde SA', 'entregado'], ['P-103', 'Kiosco Sur', 'pendiente']), 'Pedidos pendientes (2): P-101, P-103'], ['Uno pendiente', PED(['P-201', 'ACME', 'entregado'], ['P-202', 'Mate SA', 'pendiente']), 'Pedidos pendientes (1): P-202']].map(([name, http, ex]) => ({ name, input: [{}], http, expect: r => {
      const h = callsOf(r, 'http')[0]; if (!h || !h.params.url.includes('api.logistica-demo.example/pedidos')) return 'No se llamó a la API de pedidos.';
      const t = inChannel(r, 'Logística'); if (!t) return 'Falta el mensaje en el canal Logística.';
      return okText(t, ex);
    } })),
    solution: () => ({ steps: [
      N('schedule', 'Recurrence', { every: 'Cada día', at: '08:00' }), N('http', 'HTTP', { method: 'GET', url: 'https://api.logistica-demo.example/pedidos' }),
      N('parseJson', 'Parse JSON', { content: pa("body('HTTP')") }),
      N('filter', 'Filter array', { from: pa("body('Parse_JSON')?['pedidos']"), cond: { left: pa("item()?['estado']"), op: 'eq', right: 'pendiente' } }),
      N('select', 'Select', { from: pa("body('Filter_array')"), textMode: true, value: pa("item()?['id']") }),
      N('slack', 'Post message in a chat or channel', { channel: 'Logística', text: `Pedidos pendientes (${pa("length(body('Filter_array'))")}): ${pa("join(body('Select'), ', ')")}` }),
    ] }),
  }),
  G(7, {
    id: 'tickets-switch', title: 'Derivar pedidos de soporte con Switch',
    story: 'Los pedidos de soporte interno llegan con una prioridad. Los urgentes van a Teams y a Planner; los de prioridad media solo a Planner; el resto recibe una respuesta automática.',
    objectives: ['Elegir caminos con Switch.', 'Encadenar varias acciones en un mismo caso.', 'Usar el Default para lo no previsto.'],
    reqs: [
      'Trigger: <b>When a HTTP request is received</b> (recibe <code>id</code>, <code>usuario</code>, <code>email</code>, <code>prioridad</code> y <code>detalle</code>).',
      '<b>Switch</b> con On <code>@{triggerBody()?[\'prioridad\']}</code>.',
      'Caso <code>alta</code>: <b>Teams</b> al canal <code>Soporte urgente</code> y <b>Create a task</b> en el plan <code>Soporte</code>, con el id en el título.',
      'Caso <code>media</code>: solo la tarea en Planner.',
      'Default: <b>Send an email (V2)</b> al usuario con asunto <code>Recibimos tu pedido ID</code>.',
    ],
    hints: ['Cada caso tiene un valor: alta o media. El Default no lleva valor.', 'Título de la tarea: Pedido @{triggerBody()?[\'id\']}: @{triggerBody()?[\'detalle\']}.'],
    real: ['En Planner se elige el grupo, el plan y opcionalmente el bucket.', 'Los casos del Switch distinguen mayúsculas: normalizá con toLower si no confiás en el origen.'],
    sample: [{ id: 'S-77', usuario: 'Rita Gómez', email: 'rita@' + DEMO, prioridad: 'alta', detalle: 'No funciona la VPN' }],
    checks: [['Usa Switch', f => has(f, 'router')], ['Crea tareas en Planner', f => has(f, 'task')]],
    tests: [['alta', true, true, false], ['media', false, true, false], ['baja', false, false, true]].map(([prio, teams, task, mail]) => ({ name: `Prioridad ${prio}`, input: [{ id: 'S-' + prio.length, usuario: 'Rita Gómez', email: 'rita@' + DEMO, prioridad: prio, detalle: 'No funciona la VPN' }], expect: r => {
      const id = 'S-' + prio.length, s = callsOf(r, 'slack'), t = callsOf(r, 'task'), m = callsOf(r, 'mail');
      if (!!s.length !== teams) return teams ? 'Falta el aviso en Soporte urgente.' : `Con prioridad ${prio} no se avisa en Teams.`;
      if (teams && String(s[0].params.channel).trim() !== 'Soporte urgente') return 'El canal tiene que ser Soporte urgente.';
      if (!!t.length !== task) return task ? 'Falta la tarea en Planner.' : `Con prioridad ${prio} no se crea tarea.`;
      if (task && (String(t[0].params.list).trim() !== 'Soporte' || !t[0].params.title.includes(id))) return 'La tarea tiene que ir al plan Soporte con el id en el título.';
      if (!!m.length !== mail) return mail ? 'Falta la respuesta automática por email.' : 'No corresponde la respuesta automática.';
      return !mail || m[0].params.subject === `Recibimos tu pedido ${id}` || `El asunto fue «${m[0].params.subject}».`;
    } })),
    solution: () => { const task = n => N('task', n, { list: 'Soporte', title: `Pedido ${tb('id')}: ${tb('detalle')}`, description: `Pedido de ${tb('usuario')}` }); return { steps: [
      N('webhook', 'When a HTTP request is received', { path: '/soporte' }),
      N('router', 'Switch', { on: tb('prioridad') }, [
        { name: 'alta', value: 'alta', steps: [N('slack', 'Post message in a chat or channel', { channel: 'Soporte urgente', text: `Pedido urgente ${tb('id')} de ${tb('usuario')}: ${tb('detalle')}` }), task('Create a task')] },
        { name: 'media', value: 'media', steps: [task('Create a task 2')] },
        { name: 'Default', fallback: true, value: '', steps: [N('mail', 'Send an email (V2)', { to: tb('email'), subject: `Recibimos tu pedido ${tb('id')}`, body: 'Lo vamos a revisar a la brevedad.' })] },
      ]),
    ] }; },
  }),
  G(8, {
    id: 'validar', title: 'Validar datos y terminar con un error claro',
    story: 'Un sistema externo manda pedidos que a veces llegan incompletos. El flujo tiene que validar los datos y, si están mal, terminar como fallido con un mensaje que explique por qué.',
    objectives: ['Combinar condiciones con and, not y empty.', 'Usar Terminate con estado Failed.', 'Entender por qué conviene validar al principio.'],
    reqs: [
      'Trigger: <b>When a HTTP request is received</b> (recibe <code>email</code> y <code>monto</code>).',
      '<b>Condition</b>: <code>@{and(not(empty(triggerBody()?[\'email\'])), greater(int(triggerBody()?[\'monto\']), 0))}</code> es igual a <code>true</code>.',
      'Sí: <b>Add a row into a table</b> en <code>Pedidos</code>, con <code>Email</code> y <code>Monto</code>.',
      'No: <b>Terminate</b> con estado <code>Failed</code> y el mensaje <code>Datos inválidos: falta el email o el monto</code>.',
    ],
    hints: ['La expresión completa va del lado izquierdo de la Condition; del derecho, la palabra true.', 'Terminate con Failed hace que la ejecución quede marcada como fallida en el historial.'],
    real: ['Además de Terminate, se suele usar un Scope "Catch" con Configure run after para avisar por Teams cuando algo falla.', 'Con el trigger HTTP también se puede devolver un error 400 con la acción Response.'],
    sample: [{ email: 'compras@acme.example', monto: '2500' }],
    checks: [['Usa Terminate', f => has(f, 'terminate')], ['Valida con Condition', f => has(f, 'if')]],
    tests: [
      { name: 'Pedido válido', input: [{ email: 'compras@acme.example', monto: '2500' }], expect: r => { const x = callsOf(r, 'sheets')[0]; if (!x || String(x.params.sheet).trim() !== 'Pedidos') return 'Falta la fila en la tabla Pedidos.'; return (x.params.values.Email === 'compras@acme.example' && String(x.params.values.Monto) === '2500') || `La fila fue ${JSON.stringify(x.params.values)}.`; } },
      ...[['Sin email', { email: '', monto: '2500' }], ['Monto cero', { email: 'compras@acme.example', monto: '0' }]].map(([name, inp]) => ({ name, allowFail: true, input: [inp], expect: r => {
        if (callsOf(r, 'sheets').length) return 'Con datos inválidos no se tiene que agregar la fila.';
        if (!r.error) return 'La ejecución tendría que terminar como fallida con Terminate.';
        return r.error.includes('Datos inválidos: falta el email o el monto') || `El error fue «${r.error}»; tiene que incluir el mensaje pedido.`;
      } })),
    ],
    solution: () => ({ steps: [
      N('webhook', 'When a HTTP request is received', { path: '/pedidos' }),
      N('if', 'Condition', { cond: { left: pa("and(not(empty(triggerBody()?['email'])), greater(int(triggerBody()?['monto']), 0))"), op: 'eq', right: 'true' } }, [
        { name: 'Sí', steps: [N('sheets', 'Add a row into a table', { doc: 'Pedidos.xlsx', sheet: 'Pedidos', columns: [col('Email', tb('email')), col('Monto', tb('monto'))] })] },
        { name: 'No', steps: [N('terminate', 'Terminate', { status: 'Failed', code: 'DatosInvalidos', message: 'Datos inválidos: falta el email o el monto' })] },
      ]),
    ] }),
  }),
  G(9, {
    id: 'cobranzas', title: 'Recordatorios de cobranza desde Excel',
    story: 'Todos los lunes, el flujo revisa la tabla de facturas y le manda un recordatorio a cada cliente con una factura vencida.',
    objectives: ['Leer una tabla con List rows present in a table.', 'Recorrer las filas con Apply to each e items().', 'Decidir dentro del recorrido con una Condition.'],
    reqs: [
      'Trigger: <b>Recurrence</b>.',
      '<b>List rows present in a table</b> de la tabla <code>Facturas</code>.',
      '<b>Apply to each</b> sobre <code>@{body(\'List_rows_present_in_a_table\')?[\'value\']}</code>.',
      'Adentro, <b>Condition</b>: <code>@{items(\'Apply_to_each\')?[\'estado\']}</code> es igual a <code>vencida</code>. Sí: <b>Send an email (V2)</b> al cliente con asunto <code>Recordatorio: factura NUMERO vencida</code> y el monto en el cuerpo.',
    ],
    mock: 'La tabla Facturas tiene las columnas cliente, email, factura, monto y estado (pagada o vencida).',
    hints: ['Las acciones se agregan adentro del Apply to each con su botón +.', 'Dentro del recorrido, cada fila es items(\'Apply_to_each\').'],
    real: ['List rows trae 256 filas por defecto: activá la paginación para más, o filtrá en origen con una Filter Query.', 'Con Filter array antes del bucle, el flujo recorre solo las vencidas y consume menos.'],
    sample: [{}], rows: () => COBROS,
    checks: [['Lee la tabla Facturas', f => all(f).some(n => n.op === 'sheetsRead' && n.p.sheet.trim() === 'Facturas')], ['Recorre con Apply to each', f => has(f, 'foreach')]],
    tests: [['Dos facturas vencidas', COBROS, ['F-101', 'F-103']], ['Todo pagado', COBROS_B, []]].map(([name, data, venc]) => ({ name, input: [{}], rows: () => data, expect: r => {
      const m = callsOf(r, 'mail'); if (m.length !== venc.length) return `Se enviaron ${m.length} recordatorios; se esperaban ${venc.length}.`;
      for (const f of venc) { const row = data.find(x => x.factura === f), e = m.find(x => x.params.to === row.email); if (!e) return `Falta el recordatorio a ${row.email}.`; if (e.params.subject !== `Recordatorio: factura ${f} vencida`) return `El asunto fue «${e.params.subject}».`; if (!e.params.body.includes(String(row.monto))) return 'El cuerpo tiene que incluir el monto.'; }
      return true;
    } })),
    solution: () => ({ steps: [
      N('schedule', 'Recurrence', { every: 'Cada lunes', at: '09:00' }),
      N('sheetsRead', 'List rows present in a table', { doc: 'Cobranzas.xlsx', sheet: 'Facturas' }),
      N('foreach', 'Apply to each', { from: pa("body('List_rows_present_in_a_table')?['value']") }, [{ name: 'Acciones', steps: [
        N('if', 'Condition', { cond: { left: it('estado'), op: 'eq', right: 'vencida' } }, [
          { name: 'Sí', steps: [N('mail', 'Send an email (V2)', { to: it('email'), subject: `Recordatorio: factura ${it('factura')} vencida`, body: `Hola ${it('cliente')}, la factura ${it('factura')} por $${it('monto')} está vencida.` })] },
          { name: 'No', steps: [] },
        ]),
      ] }]),
    ] }),
  }),
  G(10, {
    id: 'compras-sp', title: 'Solicitudes de compra desde SharePoint',
    story: 'Las solicitudes de compra se cargan en una lista de SharePoint. Las de más de $200.000 las revisa el equipo de compras en Teams; las demás se aprueban solas y se avisa a quien la pidió.',
    objectives: ['Usar el trigger de SharePoint.', 'Leer columnas de la lista con triggerBody().', 'Notificar por Teams u Outlook según una condición.'],
    reqs: [
      'Trigger: <b>When an item is created</b> en el sitio <code>Compras</code>, lista <code>Solicitudes de compra</code>.',
      '<b>Condition</b>: <code>@{triggerBody()?[\'Monto\']}</code> es mayor que <code>200000</code>.',
      'Sí: <b>Teams</b> al canal <code>Compras</code>: <code>Revisar solicitud "TITULO" de SOLICITANTE por $MONTO</code>.',
      'No: <b>Send an email (V2)</b> al <code>Email</code> del solicitante con asunto <code>Solicitud aprobada: TITULO</code>.',
    ],
    hints: ['El título de un elemento de SharePoint está en la columna Title.', 'Las columnas se leen con su nombre interno: Title, Solicitante, Email, Monto.'],
    real: ['El nombre interno de una columna puede ser distinto del que se ve (por ejemplo, con _x0020_ en lugar de espacios).', 'Para avisar a quien creó el elemento existe Created By Email en el trigger.'],
    sample: [{ Title: 'Notebooks para soporte', Solicitante: 'Rita Gómez', Email: 'rita@' + DEMO, Monto: 850000 }],
    checks: [['Empieza con el trigger de SharePoint', f => f.steps[0]?.op === 'spItem']],
    tests: [[{ Title: 'Notebooks para soporte', Solicitante: 'Rita Gómez', Email: 'rita@' + DEMO, Monto: 850000 }, true], [{ Title: 'Resmas de papel', Solicitante: 'Iván Sosa', Email: 'ivan@' + DEMO, Monto: 45000 }, false]].map(([i, big]) => ({ name: `${i.Title} ($${i.Monto})`, input: [i], expect: r => {
      const t = inChannel(r, 'Compras'), m = callsOf(r, 'mail');
      if (big) { if (m.length) return 'Una solicitud grande no se aprueba sola.'; if (!t) return 'Falta el aviso en el canal Compras.'; return okText(t, `Revisar solicitud "${i.Title}" de ${i.Solicitante} por $${i.Monto}`); }
      if (t) return 'Una solicitud chica no se avisa en Teams.';
      if (m.length !== 1 || m[0].params.to !== i.Email) return 'Se esperaba un email al solicitante.';
      return m[0].params.subject === `Solicitud aprobada: ${i.Title}` || `El asunto fue «${m[0].params.subject}».`;
    } })),
    solution: () => ({ steps: [
      N('spItem', 'When an item is created', { site: 'Compras', list: 'Solicitudes de compra' }),
      N('if', 'Condition', { cond: { left: tb('Monto'), op: 'gt', right: '200000' } }, [
        { name: 'Sí', steps: [N('slack', 'Post message in a chat or channel', { channel: 'Compras', text: `Revisar solicitud "${tb('Title')}" de ${tb('Solicitante')} por $${tb('Monto')}` })] },
        { name: 'No', steps: [N('mail', 'Send an email (V2)', { to: tb('Email'), subject: `Solicitud aprobada: ${tb('Title')}`, body: 'Tu solicitud fue aprobada automáticamente.' })] },
      ]),
    ] }),
  }),
  G(11, {
    id: 'gastos', title: 'Aprobación de gastos',
    story: 'Cada rendición de gastos la aprueba finanzas. Si se aprueba, se registra en Excel y se avisa al empleado; si se rechaza, solo se le avisa.',
    objectives: ['Usar Start and wait for an approval.', 'Decidir con Condition según el outcome.', 'Combinar Excel y Outlook en cada rama.'],
    reqs: [
      'Trigger: <b>When a HTTP request is received</b> (recibe <code>empleado</code>, <code>email</code>, <code>monto</code> y <code>concepto</code>).',
      '<b>Start and wait for an approval</b> asignada a <code>finanzas@' + DEMO + '</code>, con un título que incluya el nombre del empleado.',
      '<b>Condition</b>: <code>@{body(\'Start_and_wait_for_an_approval\')?[\'outcome\']}</code> es igual a <code>Approve</code>.',
      'Sí: <b>Add a row into a table</b> en <code>Gastos</code> (Empleado, Monto, Concepto) y <b>Send an email (V2)</b> al empleado con asunto <code>Gasto aprobado: CONCEPTO</code>.',
      'No: <b>Send an email (V2)</b> al empleado con asunto <code>Gasto rechazado: CONCEPTO</code>.',
    ],
    mock: 'La aprobación es simulada: en las pruebas, finanzas aprueba o rechaza según el caso.',
    hints: ['Después de la aprobación, el empleado sigue en el trigger: @{triggerBody()?[\'empleado\']}.', 'Dentro de una rama podés agregar varias acciones seguidas.'],
    real: ['Las aprobaciones llegan por Teams, Outlook y la app de Approvals.', 'Para varios aprobadores en orden se encadenan aprobaciones (ver la práctica extra de aprobación en dos niveles).'],
    sample: [GASTO('Laura Gil', 'laura@' + DEMO, 85000, 'Viaje a Córdoba')], approval: () => 'Approve',
    checks: [['Usa una aprobación', f => has(f, 'approval')], ['Decide con Condition', f => has(f, 'if')]],
    tests: [[GASTO('Laura Gil', 'laura@' + DEMO, 85000, 'Viaje a Córdoba'), 'Approve'], [GASTO('Iván Sosa', 'ivan@' + DEMO, 400000, 'Notebook nueva'), 'Reject']].map(([g, out]) => ({ name: `${g.concepto}: ${out === 'Approve' ? 'aprobado' : 'rechazado'}`, input: [g], approval: () => out, expect: r => {
      const a = callsOf(r, 'approval')[0]; if (!a) return 'No se pidió la aprobación.';
      if (a.params.assignedTo !== 'finanzas@' + DEMO) return `La aprobación se asignó a «${a.params.assignedTo}».`;
      if (!a.params.title.includes(g.empleado)) return 'El título de la aprobación tiene que incluir el nombre del empleado.';
      const x = callsOf(r, 'sheets'), m = callsOf(r, 'mail');
      if (m.length !== 1 || m[0].params.to !== g.email) return 'Se esperaba un email al empleado.';
      if (out === 'Reject') { if (x.length) return 'Un gasto rechazado no se registra en Excel.'; return m[0].params.subject === `Gasto rechazado: ${g.concepto}` || `El asunto fue «${m[0].params.subject}».`; }
      if (!x.length || String(x[0].params.sheet).trim() !== 'Gastos') return 'Falta la fila en la tabla Gastos.';
      const v = x[0].params.values; if (v.Empleado !== g.empleado || String(v.Monto) !== String(g.monto) || v.Concepto !== g.concepto) return `La fila fue ${JSON.stringify(v)}.`;
      return m[0].params.subject === `Gasto aprobado: ${g.concepto}` || `El asunto fue «${m[0].params.subject}».`;
    } })),
    solution: () => ({ steps: [
      N('webhook', 'When a HTTP request is received', { path: '/gastos' }),
      N('approval', 'Start and wait for an approval', { assignedTo: 'finanzas@' + DEMO, title: `Gasto de ${tb('empleado')}: ${tb('concepto')}`, details: `Monto: $${tb('monto')}` }),
      N('if', 'Condition', { cond: { left: bd('Start_and_wait_for_an_approval', 'outcome'), op: 'eq', right: 'Approve' } }, [
        { name: 'Sí', steps: [N('sheets', 'Add a row into a table', { doc: 'Finanzas.xlsx', sheet: 'Gastos', columns: [col('Empleado', tb('empleado')), col('Monto', tb('monto')), col('Concepto', tb('concepto'))] }), N('mail', 'Send an email (V2)', { to: tb('email'), subject: `Gasto aprobado: ${tb('concepto')}`, body: 'Tu gasto fue aprobado.' })] },
        { name: 'No', steps: [N('mail', 'Send an email (V2) 2', { to: tb('email'), subject: `Gasto rechazado: ${tb('concepto')}`, body: 'Tu gasto fue rechazado. Consultá con finanzas.' })] },
      ]),
    ] }),
  }),
  G(12, {
    id: 'lead-dataverse', title: 'Lead de un formulario a Dataverse y Teams',
    story: 'Cada consulta de la web tiene que quedar en la tabla de contactos de Dataverse con el email en minúsculas, y ventas tiene que enterarse en Teams.',
    objectives: ['Leer datos del trigger con triggerBody().', 'Transformar con una expresión (toLower).', 'Agregar una fila en Dataverse con columnas extra.'],
    reqs: [
      'Trigger: <b>When a HTTP request is received</b>.',
      '<b>Compose</b> con <code>nombre</code> y <code>email</code>; el email en minúsculas: <code>@{toLower(triggerBody()?[\'email\'])}</code>.',
      '<b>Add a new row</b> en la tabla <code>Contacts</code>: email y nombre desde el Compose, y la columna <code>origen</code> con el valor del trigger.',
      '<b>Teams</b> en el canal <code>Ventas</code>: <code>Nuevo lead: NOMBRE (EMAIL)</code>.',
    ],
    hints: ['La salida del Compose se lee con @{outputs(\'Compose\')?[\'email\']}.', 'En Dataverse, las columnas extra van en Propiedades.'],
    real: ['El trigger HTTP y Dataverse son conectores premium.', 'En Dataverse real las columnas tienen nombres lógicos, como emailaddress1 o firstname.'],
    sample: [{ nombre: 'Carla Soto', email: 'CARLA@Industrias-Sur.example', origen: 'web' }],
    checks: [['Usa Compose', f => has(f, 'set')], ['Agrega la fila en Dataverse', f => has(f, 'crm')]],
    tests: [['Carla Soto', 'CARLA@Industrias-Sur.example', 'web'], ['Bruno Díaz', 'Bruno.Diaz@Empresa.COM', 'evento']].map(([nombre, email, origen]) => ({ name: `Lead de ${nombre}`, input: [{ nombre, email, origen }], expect: r => {
      const em = email.toLowerCase(), c = callsOf(r, 'crm')[0]; if (!c) return 'No se agregó la fila en Dataverse.';
      if (String(c.params.table).trim() !== 'Contacts') return `La tabla es «${c.params.table}».`;
      if (c.params.email !== em) return `El email quedó «${c.params.email}»; se esperaba «${em}».`;
      if (c.params.name !== nombre) return `El nombre quedó «${c.params.name}».`;
      if (c.params.props.origen !== origen) return `La columna origen vale «${c.params.props.origen ?? ''}».`;
      const t = inChannel(r, 'Ventas'); if (!t) return 'Falta el mensaje en el canal Ventas.';
      return okText(t, `Nuevo lead: ${nombre} (${em})`);
    } })),
    solution: () => ({ steps: [
      N('webhook', 'When a HTTP request is received', { path: '/leads' }),
      N('set', 'Compose', { fields: [col('nombre', tb('nombre')), col('email', pa("toLower(triggerBody()?['email'])"))] }),
      N('crm', 'Add a new row', { table: 'Contacts', email: pa("outputs('Compose')?['email']"), name: pa("outputs('Compose')?['nombre']"), props: [col('origen', tb('origen'))] }),
      N('slack', 'Post message in a chat or channel', { channel: 'Ventas', text: `Nuevo lead: ${pa("outputs('Compose')?['nombre']")} (${pa("outputs('Compose')?['email']")})` }),
    ] }),
  }),
  G(13, {
    id: 'dolar', title: 'Alerta de cotización del dólar',
    story: 'Compras necesita saber cuándo el dólar supera un valor. Cada hora, el flujo consulta una API de cotizaciones y, si la venta supera el umbral, avisa en Teams y registra el valor.',
    objectives: ['Llamar a una API con el conector HTTP.', 'Leer la respuesta con body(\'HTTP\').', 'Comparar números en una Condition.'],
    reqs: [
      'Trigger: <b>Recurrence</b>.',
      '<b>HTTP</b>: GET a <code>https://api.cotizaciones-demo.example/dolar</code>.',
      '<b>Condition</b>: <code>@{body(\'HTTP\')?[\'venta\']}</code> es mayor que <code>1500</code>.',
      'Sí: <b>Teams</b> al canal <code>Compras</code>: <code>Dólar venta: $VALOR</code> y <b>Add a row into a table</b> en <code>Cotizaciones</code> (Fecha y Venta). No: nada.',
    ],
    mock: 'La API responde, por ejemplo: {"moneda":"USD","compra":1480,"venta":1500,"fecha":"2026-11-18"}',
    hints: ['Dejá la rama No vacía: es válido.', 'Fecha y venta salen de la respuesta del HTTP.'],
    real: ['HTTP es premium. Si la API requiere clave, va en la autenticación de la acción o en Azure Key Vault, nunca en la URL.', 'Para no avisar cada hora lo mismo, se puede guardar el último valor en una lista de SharePoint.'],
    sample: [{}], http: dolar(1620),
    checks: [['Empieza con Recurrence', f => f.steps[0]?.op === 'schedule'], ['Llama a la API de cotizaciones', f => all(f).some(n => n.op === 'http' && n.p.url.includes('api.cotizaciones-demo.example/dolar'))]],
    tests: [['Venta en $1620', 1620, true], ['Venta en $1500', 1500, false]].map(([name, v, alert]) => ({ name, input: [{}], http: dolar(v), expect: r => {
      const s = callsOf(r, 'slack'), x = callsOf(r, 'sheets');
      if (!alert) return (!s.length && !x.length) || 'Con la venta en el umbral o por debajo no hay que avisar.';
      const t = inChannel(r, 'Compras'); if (!t) return 'Falta el aviso en el canal Compras.';
      if (t.params.text !== `Dólar venta: $${v}`) return `El mensaje fue «${t.params.text}».`;
      if (!x.length || String(x[0].params.sheet).trim() !== 'Cotizaciones') return 'Falta la fila en Cotizaciones.';
      return (String(x[0].params.values.Venta) === String(v) && x[0].params.values.Fecha === '2026-11-18') || `La fila fue ${JSON.stringify(x[0].params.values)}.`;
    } })),
    solution: () => ({ steps: [
      N('schedule', 'Recurrence', { every: 'Cada hora', at: '' }), N('http', 'HTTP', { method: 'GET', url: 'https://api.cotizaciones-demo.example/dolar' }),
      N('if', 'Condition', { cond: { left: bd('HTTP', 'venta'), op: 'gt', right: '1500' } }, [
        { name: 'Sí', steps: [N('slack', 'Post message in a chat or channel', { channel: 'Compras', text: `Dólar venta: $${bd('HTTP', 'venta')}` }), N('sheets', 'Add a row into a table', { doc: 'Compras.xlsx', sheet: 'Cotizaciones', columns: [col('Fecha', bd('HTTP', 'fecha')), col('Venta', bd('HTTP', 'venta'))] })] },
        { name: 'No', steps: [] },
      ]),
    ] }),
  }),
  G(14, {
    id: 'facturas-ia', title: 'Leer facturas de proveedores con AI Builder',
    story: 'Los proveedores mandan sus facturas por email. Un prompt de AI Builder extrae el proveedor, el número y el total; las facturas grandes las revisa finanzas en Teams y las demás se cargan en Excel.',
    objectives: ['Escribir un prompt que devuelva JSON.', 'Convertir la respuesta con json() e int().', 'Decidir con Condition sobre un dato que extrajo la IA.'],
    reqs: [
      'Trigger: <b>When a HTTP request is received</b> (recibe <code>de</code>, <code>asunto</code> y <code>cuerpo</code>).',
      '<b>Run a prompt</b>: pedí un JSON con <code>proveedor</code>, <code>numero</code> y <code>total</code>, e incluí <code>@{triggerBody()?[\'cuerpo\']}</code>.',
      '<b>Compose</b> con <code>proveedor</code>, <code>numero</code> y <code>total</code> (este como número, con <code>int()</code>), leídos de <code>@{json(body(\'Run_a_prompt\')?[\'text\'])}</code>.',
      '<b>Condition</b>: total mayor que <code>100000</code>. Sí: <b>Teams</b> al canal <code>Finanzas</code> con proveedor, número y total. No: <b>Add a row into a table</b> en <code>Facturas</code> (Proveedor, Numero, Total).',
    ],
    mock: 'El modelo simulado extrae los datos solo si el prompt incluye el cuerpo del email.',
    hints: ['Un campo del JSON: @{json(body(\'Run_a_prompt\')?[\'text\'])?[\'proveedor\']}.', 'Para el total: @{int(json(body(\'Run_a_prompt\')?[\'text\'])?[\'total\'])}.'],
    real: ['AI Builder también tiene un modelo prearmado de procesamiento de facturas que lee PDF directamente.', 'Validá siempre lo que extrae la IA antes de pagar algo.'],
    sample: [{ de: 'cobranzas@andina.example', asunto: 'Factura', cuerpo: 'Adjuntamos la factura FA-0001-00012345 de Distribuidora Andina por un total de $185000.' }], ai: factAi,
    checks: [['Usa AI Builder', f => has(f, 'ai')], ['Decide con Condition', f => has(f, 'if')]],
    tests: FACT.map(([prov, num, total]) => ({ name: `Factura ${num}`, input: [{ de: 'cobranzas@prov.example', asunto: 'Factura', cuerpo: `Adjuntamos la factura ${num} de ${prov} por un total de $${total}.` }], ai: factAi, expect: r => {
      const a = callsOf(r, 'ai')[0]; if (!a) return 'No se ejecutó el prompt.';
      if (!a.params.prompt.includes(num)) return 'El prompt no incluye el cuerpo del email.';
      const t = inChannel(r, 'Finanzas'), x = callsOf(r, 'sheets');
      if (Number(total) > 100000) { if (x.length) return 'Una factura grande no va directo a Excel.'; if (!t) return 'Falta el aviso en el canal Finanzas.'; return [prov, num, total].every(v => t.params.text.includes(v)) || `El mensaje «${t.params.text}» tiene que incluir proveedor, número y total.`; }
      if (t) return 'Una factura chica no se avisa en Teams.';
      if (!x.length || String(x[0].params.sheet).trim() !== 'Facturas') return 'Falta la fila en la tabla Facturas.';
      const v = x[0].params.values;
      if (v.Proveedor !== prov || v.Numero !== num) return `La fila fue ${JSON.stringify(v)}.`;
      return v.Total === Number(total) || `Total vale ${JSON.stringify(v.Total)}; se esperaba el número ${total}.`;
    } })),
    solution: () => { const j = f => pa(`json(body('Run_a_prompt')?['text'])?['${f}']`), o = f => pa(`outputs('Compose')?['${f}']`); return { steps: [
      N('webhook', 'When a HTTP request is received', { path: '/facturas' }),
      N('ai', 'Run a prompt', { prompt: `Extraé de este email el proveedor, el número de factura y el total (solo dígitos). Respondé solo con JSON: {"proveedor": "", "numero": "", "total": ""}\n\nEmail: ${tb('cuerpo')}` }),
      N('set', 'Compose', { fields: [col('proveedor', j('proveedor')), col('numero', j('numero')), col('total', pa("int(json(body('Run_a_prompt')?['text'])?['total'])"))] }),
      N('if', 'Condition', { cond: { left: o('total'), op: 'gt', right: '100000' } }, [
        { name: 'Sí', steps: [N('slack', 'Post message in a chat or channel', { channel: 'Finanzas', text: `Revisar factura ${o('numero')} de ${o('proveedor')} por $${o('total')}` })] },
        { name: 'No', steps: [N('sheets', 'Add a row into a table', { doc: 'Finanzas.xlsx', sheet: 'Facturas', columns: [col('Proveedor', o('proveedor')), col('Numero', o('numero')), col('Total', o('total'))] })] },
      ]),
    ] }; },
  }),

  X({
    id: 'rpa-erp', title: 'Cargar pedidos en un ERP sin API con RPA',
    story: 'El ERP de la empresa es una aplicación de escritorio sin API. Un flujo de Power Automate Desktop carga cada pedido a mano; el flujo de nube lo ejecuta por cada pedido pendiente y guarda el número que devuelve el ERP.',
    objectives: ['Ejecutar un flujo de escritorio desde la nube.', 'Pasarle entradas y leer sus salidas.', 'Hacerlo por cada fila de una tabla.'],
    reqs: [
      'Trigger: <b>Recurrence</b>.',
      '<b>List rows present in a table</b> de <code>Pedidos pendientes</code>.',
      '<b>Apply to each</b> sobre las filas (<code>value</code>).',
      'Adentro: <b>Run a flow built with Power Automate for desktop</b> con el flujo <code>CargarPedidoERP</code> y las entradas <code>pedido</code>, <code>cliente</code> y <code>monto</code> de cada fila.',
      'Después, en el mismo recorrido: <b>Add a row into a table</b> en <code>Pedidos cargados</code> con <code>Pedido</code> y <code>NumeroERP</code> (salida <code>numeroERP</code> del flujo de escritorio).',
    ],
    mock: 'El flujo de escritorio CargarPedidoERP devuelve {"estado":"ok","numeroERP":"…"}.',
    hints: ['La salida se lee con @{body(\'Run_a_flow_built_with_Power_Automate_for_desktop\')?[\'numeroERP\']}.', 'Las dos acciones van adentro del Apply to each, una debajo de la otra.'],
    real: ['El flujo de escritorio se arma en Power Automate Desktop y define sus variables de entrada y salida.', 'Para correr sin una persona conectada (desatendido) hace falta una máquina registrada y licencia Process.'],
    sample: [{}], rows: () => PEND, desktop: erp,
    checks: [['Ejecuta el flujo de escritorio', f => has(f, 'desktop')], ['Recorre con Apply to each', f => has(f, 'foreach')]],
    tests: [['Dos pedidos', PEND], ['Un pedido', [{ pedido: '7101', cliente: 'Mate SA', monto: 9000 }]]].map(([name, rows]) => ({ name, input: [{}], rows: () => rows, desktop: erp, expect: r => {
      const d = callsOf(r, 'desktop'); if (d.length !== rows.length) return `El flujo de escritorio se ejecutó ${d.length} veces; se esperaban ${rows.length}.`;
      for (const row of rows) { const c = d.find(x => String(x.params.inputs.pedido) === row.pedido); if (!c) return `No se cargó el pedido ${row.pedido}.`; if (c.params.flowName !== 'CargarPedidoERP') return `Se ejecutó «${c.params.flowName}».`; if (c.params.inputs.cliente !== row.cliente) return 'Falta la entrada cliente.'; }
      const x = callsOf(r, 'sheets'); if (x.length !== rows.length) return `Se agregaron ${x.length} filas en Pedidos cargados.`;
      return rows.every(row => x.some(c => String(c.params.sheet).trim() === 'Pedidos cargados' && String(c.params.values.Pedido) === row.pedido && c.params.values.NumeroERP === '45' + row.pedido)) || 'Cada fila tiene que tener el Pedido y el NumeroERP que devolvió el flujo de escritorio.';
    } })),
    solution: () => ({ steps: [
      N('schedule', 'Recurrence', { every: 'Cada hora', at: '' }), N('sheetsRead', 'List rows present in a table', { doc: 'Pedidos.xlsx', sheet: 'Pedidos pendientes' }),
      N('foreach', 'Apply to each', { from: bd('List_rows_present_in_a_table', 'value') }, [{ name: 'Acciones', steps: [
        N('desktop', 'Run a flow built with Power Automate for desktop', { flowName: 'CargarPedidoERP', inputs: [col('pedido', it('pedido')), col('cliente', it('cliente')), col('monto', it('monto'))] }),
        N('sheets', 'Add a row into a table', { doc: 'Pedidos.xlsx', sheet: 'Pedidos cargados', columns: [col('Pedido', it('pedido')), col('NumeroERP', bd('Run_a_flow_built_with_Power_Automate_for_desktop', 'numeroERP'))] }),
      ] }]),
    ] }),
  }),
  X({
    id: 'powerapps', title: 'Alta de empleados desde una app de Power Apps',
    story: 'Recursos Humanos carga los ingresos en una app de Power Apps. La app ejecuta un flujo que registra al empleado en Dataverse y le devuelve a la app el ID y un mensaje de confirmación.',
    objectives: ['Usar el trigger PowerApps (V2).', 'Devolver valores a la app con Respond to a PowerApp or flow.', 'Leer la salida de Dataverse.'],
    reqs: [
      'Trigger: <b>PowerApps (V2)</b> con las entradas <code>nombre</code>, <code>email</code> y <code>area</code>.',
      '<b>Add a new row</b> en la tabla <code>Empleados</code> con email, nombre y la columna <code>area</code>.',
      '<b>Respond to a PowerApp or flow</b> con dos salidas: <code>id</code> (el id de la fila creada) y <code>mensaje</code>: <code>Alta registrada para NOMBRE</code>.',
    ],
    hints: ['El id de la fila: @{body(\'Add_a_new_row\')?[\'id\']}.', 'En la app se leería así: Set(res, AltaEmpleado.Run(...)); res.mensaje.'],
    real: ['En el trigger PowerApps (V2) real, las entradas se leen como triggerBody()?[\'text\'], text_1, etc., según el orden en que se crearon.', 'El flujo tiene que estar en la misma solución o entorno que la app.'],
    sample: [{ nombre: 'Sofía Ríos', email: 'sofia@' + DEMO, area: 'Ventas' }],
    checks: [['Empieza con PowerApps (V2)', f => f.steps[0]?.op === 'instant'], ['Responde a la app', f => has(f, 'respond')]],
    tests: [['Sofía Ríos', 'sofia@' + DEMO, 'Ventas'], ['Tomás Vera', 'tomas@' + DEMO, 'Logística']].map(([nombre, email, area]) => ({ name: `Alta de ${nombre}`, input: [{ nombre, email, area }], expect: r => {
      const c = callsOf(r, 'crm')[0]; if (!c) return 'No se agregó la fila en Dataverse.';
      if (String(c.params.table).trim() !== 'Empleados' || c.params.email !== email || c.params.props.area !== area) return `La fila fue ${JSON.stringify(c.params)}.`;
      if (!r.response) return 'El flujo no le respondió a la app.';
      if (!String(r.response.id || '').startsWith('row-')) return `La salida id vale «${r.response.id ?? ''}»; tiene que ser el id de la fila creada.`;
      return r.response.mensaje === `Alta registrada para ${nombre}` || `La salida mensaje vale «${r.response.mensaje ?? ''}».`;
    } })),
    solution: () => ({ steps: [
      N('instant', 'PowerApps (V2)', { inputs: [col('nombre', 'Text'), col('email', 'Email'), col('area', 'Text')] }),
      N('crm', 'Add a new row', { table: 'Empleados', email: tb('email'), name: tb('nombre'), props: [col('area', tb('area'))] }),
      N('respond', 'Respond to a PowerApp or flow', { outputs: [col('id', bd('Add_a_new_row', 'id')), col('mensaje', `Alta registrada para ${tb('nombre')}`)] }),
    ] }),
  }),
  X({
    id: 'kpi-ventas', title: 'KPIs de ventas a Power BI con variables',
    story: 'Dirección sigue en Power BI cuánto se cobró y cuánto está pendiente. Cada noche, el flujo recorre las ventas del día, suma con variables y manda los totales a un dataset de Power BI.',
    objectives: ['Inicializar variables en el nivel superior.', 'Sumar con Increment variable dentro de Apply to each.', 'Usar los totales después del bucle.'],
    reqs: [
      'Trigger: <b>Recurrence</b>.',
      '<b>List rows present in a table</b> de <code>Ventas</code>.',
      'Dos <b>Initialize variable</b> de tipo Integer en 0: <code>cobrado</code> y <code>pendiente</code>.',
      '<b>Apply to each</b> sobre las filas, con una <b>Condition</b> adentro: si <code>estado</code> es <code>pagado</code>, <b>Increment variable</b> cobrado en el monto; si no, pendiente.',
      'Después del bucle: <b>Add rows to a dataset</b> (dataset <code>KPIs ventas</code>, tabla <code>Diario</code>) con <code>Cobrado</code> y <code>Pendiente</code>, y <b>Teams</b> al canal <code>Dirección</code>: <code>Cobrado: $X · Pendiente: $Y</code>.',
    ],
    mock: 'La tabla Ventas tiene las columnas fecha, region, monto y estado (pagado o pendiente).',
    hints: ['Las variables se inicializan antes del Apply to each, nunca adentro.', 'Increment variable suma el valor que le pases: @{items(\'Apply_to_each\')?[\'monto\']}.', 'Las acciones que van después del bucle se agregan con el + de abajo del Apply to each.'],
    real: ['El dataset de Power BI tiene que ser de tipo push o streaming para recibir filas.', 'Con muchos datos, conviene calcular en Power BI con DAX y usar el flujo solo para refrescar el modelo.'],
    sample: [{}], rows: () => VENTAS,
    checks: [['Inicializa variables', f => has(f, 'varInit')], ['Suma con Increment variable', f => has(f, 'varInc')], ['Envía a Power BI', f => has(f, 'pbi')]],
    tests: [['Ventas del día 1', VENTAS, 6700, 5900], ['Ventas del día 2', VENTAS_B, 3400, 4000]].map(([name, rows, cob, pen]) => ({ name, input: [{}], rows: () => rows, expect: r => {
      const b = callsOf(r, 'pbi'); if (b.length !== 1) return `Se enviaron ${b.length} filas a Power BI; se esperaba una sola, después del bucle.`;
      if (b[0].params.dataset !== 'KPIs ventas' || b[0].params.table !== 'Diario') return 'El dataset tiene que ser KPIs ventas, tabla Diario.';
      if (Number(b[0].params.values.Cobrado) !== cob || Number(b[0].params.values.Pendiente) !== pen) return `Power BI recibió ${JSON.stringify(b[0].params.values)}; se esperaba Cobrado ${cob} y Pendiente ${pen}.`;
      const t = inChannel(r, 'Dirección'); if (!t) return 'Falta el mensaje en el canal Dirección.';
      return okText(t, `Cobrado: $${cob} · Pendiente: $${pen}`);
    } })),
    solution: () => ({ steps: [
      N('schedule', 'Recurrence', { every: 'Cada día', at: '23:00' }), N('sheetsRead', 'List rows present in a table', { doc: 'Ventas.xlsx', sheet: 'Ventas' }),
      N('varInit', 'Initialize variable', { name: 'cobrado', type: 'Integer', value: '0' }), N('varInit', 'Initialize variable 2', { name: 'pendiente', type: 'Integer', value: '0' }),
      N('foreach', 'Apply to each', { from: bd('List_rows_present_in_a_table', 'value') }, [{ name: 'Acciones', steps: [
        N('if', 'Condition', { cond: { left: it('estado'), op: 'eq', right: 'pagado' } }, [
          { name: 'Sí', steps: [N('varInc', 'Increment variable', { name: 'cobrado', value: it('monto') })] },
          { name: 'No', steps: [N('varInc', 'Increment variable 2', { name: 'pendiente', value: it('monto') })] },
        ]),
      ] }]),
      N('pbi', 'Add rows to a dataset', { dataset: 'KPIs ventas', table: 'Diario', columns: [col('Cobrado', vr('cobrado')), col('Pendiente', vr('pendiente'))] }),
      N('slack', 'Post message in a chat or channel', { channel: 'Dirección', text: `Cobrado: $${vr('cobrado')} · Pendiente: $${vr('pendiente')}` }),
    ] }),
  }),
  X({
    id: 'monitoreo', title: 'Monitorear servicios con HTTP y variables',
    story: 'Infraestructura quiere un aviso cuando algún servicio no responde. El flujo recibe la lista de servicios, consulta cada uno y, al final, avisa una sola vez con todos los que fallaron.',
    objectives: ['Llamar a una API por cada elemento de una lista.', 'Leer el código de estado con outputs().', 'Acumular en una variable Array y usarla después del bucle.'],
    reqs: [
      'Trigger: <b>When a HTTP request is received</b> (recibe <code>servicios</code>, una lista con <code>nombre</code> y <code>url</code>).',
      '<b>Initialize variable</b> <code>caidos</code> de tipo Array con valor <code>[]</code>.',
      '<b>Apply to each</b> sobre <code>@{triggerBody()?[\'servicios\']}</code>: <b>HTTP</b> GET a la url de cada servicio y una <b>Condition</b>: si <code>@{outputs(\'HTTP\')?[\'statusCode\']}</code> no es igual a <code>200</code>, <b>Append to array variable</b> caidos con el nombre.',
      'Después del bucle, <b>Condition</b>: <code>@{length(variables(\'caidos\'))}</code> es mayor que <code>0</code>. Sí: <b>Teams</b> al canal <code>Infraestructura</code>: <code>Servicios caídos: NOMBRE1, NOMBRE2</code>.',
    ],
    mock: 'Cada servicio responde con statusCode 200 si funciona o 503 si está caído.',
    hints: ['El texto: Servicios caídos: @{join(variables(\'caidos\'), \', \')}.', 'Un solo aviso al final, no uno por servicio: por eso se acumula en una variable.'],
    real: ['Por defecto, una acción HTTP que recibe un 503 falla. Para seguir y evaluar el código hay que configurar "run after" en la acción siguiente.', 'Para monitoreo serio existen herramientas dedicadas, como Azure Monitor.'],
    sample: [{ servicios: SERV }], http: health('pagos'),
    checks: [['Usa una variable Array', f => all(f).some(n => n.op === 'varInit' && n.p.type === 'Array')], ['Acumula con Append to array variable', f => has(f, 'varAppend')]],
    tests: [['Pagos caído', health('pagos'), 'Servicios caídos: Pagos'], ['Todo funciona', health(), null], ['Pagos y Stock caídos', health('pagos', 'stock'), 'Servicios caídos: Pagos, Stock']].map(([name, http, ex]) => ({ name, input: [{ servicios: SERV }], http, expect: r => {
      if (callsOf(r, 'http').length !== SERV.length) return `Se consultaron ${callsOf(r, 'http').length} servicios; se esperaban ${SERV.length}.`;
      const t = callsOf(r, 'slack');
      if (!ex) return !t.length || 'Si todo funciona no hay que avisar.';
      if (t.length !== 1) return `Se enviaron ${t.length} avisos; se esperaba uno solo al final.`;
      if (String(t[0].params.channel).trim() !== 'Infraestructura') return 'El canal tiene que ser Infraestructura.';
      return okText(t[0], ex);
    } })),
    solution: () => ({ steps: [
      N('webhook', 'When a HTTP request is received', { path: '/monitoreo' }),
      N('varInit', 'Initialize variable', { name: 'caidos', type: 'Array', value: '[]' }),
      N('foreach', 'Apply to each', { from: tb('servicios') }, [{ name: 'Acciones', steps: [
        N('http', 'HTTP', { method: 'GET', url: it('url') }),
        N('if', 'Condition', { cond: { left: pa("outputs('HTTP')?['statusCode']"), op: 'neq', right: '200' } }, [
          { name: 'Sí', steps: [N('varAppend', 'Append to array variable', { name: 'caidos', value: it('nombre') })] },
          { name: 'No', steps: [] },
        ]),
      ] }]),
      N('if', 'Condition 2', { cond: { left: pa("length(variables('caidos'))"), op: 'gt', right: '0' } }, [
        { name: 'Sí', steps: [N('slack', 'Post message in a chat or channel', { channel: 'Infraestructura', text: `Servicios caídos: ${pa("join(variables('caidos'), ', ')")}` })] },
        { name: 'No', steps: [] },
      ]),
    ] }),
  }),
  X({
    id: 'resumen-ia', title: 'Resumen semanal de reclamos con IA',
    story: 'La gerencia no tiene tiempo de leer todos los reclamos. Cada viernes, el flujo toma los de la semana, le pide a AI Builder un resumen y lo manda por email.',
    objectives: ['Pasarle una lista completa a un prompt.', 'Usar la respuesta del modelo en un email.', 'Combinar Excel, AI Builder y Outlook.'],
    reqs: [
      'Trigger: <b>Recurrence</b>.',
      '<b>List rows present in a table</b> de <code>Reclamos</code>.',
      '<b>Run a prompt</b> que pida un resumen e incluya las filas: <code>@{body(\'List_rows_present_in_a_table\')?[\'value\']}</code>.',
      '<b>Send an email (V2)</b> a <code>gerencia@' + DEMO + '</code>, asunto <code>Resumen semanal de reclamos</code> y el texto del modelo como cuerpo.',
    ],
    mock: 'El modelo simulado solo resume si el prompt incluye el detalle de todos los reclamos.',
    hints: ['El cuerpo del email: @{body(\'Run_a_prompt\')?[\'text\']}.', 'Si pasás solo una fila, el modelo no tiene toda la información.'],
    real: ['Los prompts tienen un límite de tamaño: con muchos reclamos, conviene mandar solo la columna detalle con Select.', 'Revisá el resumen antes de usarlo para decisiones.'],
    sample: [{}], rows: () => RECL, ai: resumenAi(RECL),
    checks: [['Usa AI Builder', f => has(f, 'ai')], ['Lee la tabla Reclamos', f => all(f).some(n => n.op === 'sheetsRead' && n.p.sheet.trim() === 'Reclamos')]],
    tests: [['Tres reclamos', RECL], ['Dos reclamos', RECL.slice(1)]].map(([name, list]) => ({ name, input: [{}], rows: () => list, ai: resumenAi(list), expect: r => {
      const m = callsOf(r, 'mail')[0]; if (!m) return 'No se envió el email.';
      if (m.params.to !== 'gerencia@' + DEMO) return `El email fue a «${m.params.to}».`;
      if (m.params.subject !== 'Resumen semanal de reclamos') return `El asunto fue «${m.params.subject}».`;
      const ex = `Resumen: ${list.length} reclamos esta semana, principalmente por entregas y facturación.`;
      return m.params.body === ex || `El cuerpo fue «${short(m.params.body)}». ¿El prompt incluye todas las filas?`;
    } })),
    solution: () => ({ steps: [
      N('schedule', 'Recurrence', { every: 'Cada viernes', at: '17:00' }), N('sheetsRead', 'List rows present in a table', { doc: 'Atencion.xlsx', sheet: 'Reclamos' }),
      N('ai', 'Run a prompt', { prompt: `Resumí en dos líneas los reclamos de esta semana, indicando cuántos son y los temas principales: ${bd('List_rows_present_in_a_table', 'value')}` }),
      N('mail', 'Send an email (V2)', { to: 'gerencia@' + DEMO, subject: 'Resumen semanal de reclamos', body: bd('Run_a_prompt', 'text') }),
    ] }),
  }),
  X({
    id: 'aprobacion-2-niveles', title: 'Aprobación en dos niveles',
    story: 'Todo gasto lo aprueba primero el jefe. Si supera $100.000, después lo aprueba finanzas. Si alguno rechaza, se avisa y el flujo termina ahí.',
    objectives: ['Encadenar aprobaciones.', 'Cortar el flujo con Terminate Succeeded.', 'Usar el flujo que sigue después de una Condition.'],
    reqs: [
      'Trigger: <b>When a HTTP request is received</b> (recibe <code>empleado</code>, <code>email</code>, <code>monto</code> y <code>concepto</code>).',
      'Aprobación a <code>jefe@' + DEMO + '</code>. <b>Condition</b>: si el outcome es <code>Reject</code>, email al empleado con asunto <code>Gasto rechazado: CONCEPTO</code> y <b>Terminate</b> con estado <code>Succeeded</code>.',
      'Debajo, <b>Condition</b>: si el monto es mayor que <code>100000</code>, aprobación a <code>finanzas@' + DEMO + '</code>; si finanzas rechaza, el mismo email de rechazo y <b>Terminate</b> Succeeded.',
      'Al final del flujo: email al empleado con asunto <code>Gasto aprobado: CONCEPTO</code>.',
    ],
    mock: 'En las pruebas, el jefe y finanzas responden según el caso.',
    hints: ['La segunda aprobación se llama "Start and wait for an approval 2": su outcome es @{body(\'Start_and_wait_for_an_approval_2\')?[\'outcome\']}.', 'Terminate Succeeded corta el flujo sin marcarlo como error.', 'El email de aprobado va debajo de las Conditions, no adentro.'],
    real: ['Con "Everyone must approve" se pide la aprobación de varias personas a la vez.', 'Se puede guardar cada decisión en una lista de SharePoint para auditoría.'],
    sample: [GASTO('Laura Gil', 'laura@' + DEMO, 250000, 'Notebook')], approval: () => 'Approve',
    checks: [['Usa dos aprobaciones', f => all(f).filter(n => n.op === 'approval').length >= 2], ['Usa Terminate', f => has(f, 'terminate')]],
    tests: [['Jefe aprueba, monto chico', 50000, 'Approve', null, ['jefe'], 'aprobado'], ['Los dos aprueban', 250000, 'Approve', 'Approve', ['jefe', 'finanzas'], 'aprobado'], ['Finanzas rechaza', 250000, 'Approve', 'Reject', ['jefe', 'finanzas'], 'rechazado'], ['Jefe rechaza', 250000, 'Reject', null, ['jefe'], 'rechazado']].map(([name, monto, j, f, who, res]) => ({ name, input: [GASTO('Laura Gil', 'laura@' + DEMO, monto, 'Notebook')], approval: ({ assignedTo }) => (assignedTo.startsWith('jefe') ? j : f), expect: r => {
      if (r.error) return `El flujo terminó con error: ${r.error}. El rechazo tiene que terminar con Terminate Succeeded.`;
      const a = callsOf(r, 'approval').map(x => x.params.assignedTo.split('@')[0]);
      if (a.join(',') !== who.join(',')) return `Se pidieron aprobaciones a: ${a.join(', ') || 'nadie'}; se esperaba ${who.join(', ')}.`;
      const m = callsOf(r, 'mail'); if (m.length !== 1) return `Se enviaron ${m.length} emails; se esperaba uno.`;
      return m[0].params.subject === `Gasto ${res}: Notebook` || `El asunto fue «${m[0].params.subject}».`;
    } })),
    solution: () => { const rej = n => N('mail', n, { to: tb('email'), subject: `Gasto rechazado: ${tb('concepto')}`, body: 'Tu gasto fue rechazado.' }); return { steps: [
      N('webhook', 'When a HTTP request is received', { path: '/gastos' }),
      N('approval', 'Start and wait for an approval', { assignedTo: 'jefe@' + DEMO, title: `Gasto de ${tb('empleado')}: ${tb('concepto')}`, details: `Monto: $${tb('monto')}` }),
      N('if', 'Condition', { cond: { left: bd('Start_and_wait_for_an_approval', 'outcome'), op: 'eq', right: 'Reject' } }, [
        { name: 'Sí', steps: [rej('Send an email (V2)'), N('terminate', 'Terminate', { status: 'Succeeded' })] }, { name: 'No', steps: [] },
      ]),
      N('if', 'Condition 2', { cond: { left: tb('monto'), op: 'gt', right: '100000' } }, [
        { name: 'Sí', steps: [
          N('approval', 'Start and wait for an approval 2', { assignedTo: 'finanzas@' + DEMO, title: `Gasto de ${tb('empleado')}: ${tb('concepto')}`, details: `Monto: $${tb('monto')}` }),
          N('if', 'Condition 3', { cond: { left: bd('Start_and_wait_for_an_approval_2', 'outcome'), op: 'eq', right: 'Reject' } }, [
            { name: 'Sí', steps: [rej('Send an email (V2) 2'), N('terminate', 'Terminate 2', { status: 'Succeeded' })] }, { name: 'No', steps: [] },
          ]),
        ] }, { name: 'No', steps: [] },
      ]),
      N('mail', 'Send an email (V2) 3', { to: tb('email'), subject: `Gasto aprobado: ${tb('concepto')}`, body: 'Tu gasto fue aprobado.' }),
    ] }; },
  }),
  X({
    id: 'onboarding', title: 'Onboarding de un empleado nuevo',
    story: 'Cuando entra alguien a la empresa, se registra en Dataverse, se le da la bienvenida en Teams, se crea una tarea en Planner por cada paso del onboarding y, al final, se le manda un resumen.',
    objectives: ['Recorrer una lista que viene en el trigger.', 'Leer un elemento simple con items().', 'Continuar el flujo después de un Apply to each.'],
    reqs: [
      'Trigger: <b>When a HTTP request is received</b> (recibe <code>nombre</code>, <code>email</code>, <code>area</code> y <code>tareas</code>, una lista de textos).',
      '<b>Add a new row</b> en <code>Empleados</code> (email, nombre y area) y <b>Teams</b> al canal <code>RRHH</code>: <code>Damos la bienvenida a NOMBRE (AREA)</code>.',
      '<b>Apply to each</b> sobre <code>@{triggerBody()?[\'tareas\']}</code>: <b>Create a task</b> en el plan <code>Onboarding</code> con el título <code>TAREA - NOMBRE</code>.',
      'Después del bucle: <b>Send an email (V2)</b> al empleado con asunto <code>Tu plan de bienvenida</code> y el texto <code>Tenés N tareas asignadas en Planner.</code>',
    ],
    hints: ['Cada tarea es un texto, así que se lee directo con @{items(\'Apply_to_each\')}.', 'La cantidad: @{length(triggerBody()?[\'tareas\'])}.'],
    real: ['En Planner se puede asignar la tarea a la persona con su email.', 'Para el alta en Azure AD o Entra ID hay acciones del conector de Office 365 Users y de Entra ID.'],
    sample: [{ nombre: 'Sofía Ríos', email: 'sofia@' + DEMO, area: 'Ventas', tareas: ['Firmar contrato', 'Configurar notebook', 'Curso de seguridad'] }],
    checks: [['Recorre con Apply to each', f => has(f, 'foreach')], ['Crea tareas en Planner', f => has(f, 'task')]],
    tests: [['Tres tareas', ['Firmar contrato', 'Configurar notebook', 'Curso de seguridad']], ['Una tarea', ['Firmar contrato']]].map(([name, tareas]) => ({ name, input: [{ nombre: 'Sofía Ríos', email: 'sofia@' + DEMO, area: 'Ventas', tareas }], expect: r => {
      const c = callsOf(r, 'crm')[0]; if (!c || String(c.params.table).trim() !== 'Empleados') return 'Falta la fila en la tabla Empleados.';
      const t = inChannel(r, 'RRHH'); if (!t) return 'Falta la bienvenida en el canal RRHH.';
      const ok = okText(t, 'Damos la bienvenida a Sofía Ríos (Ventas)'); if (ok !== true) return ok;
      const k = callsOf(r, 'task'); if (k.length !== tareas.length) return `Se crearon ${k.length} tareas; se esperaban ${tareas.length}.`;
      if (!tareas.every(x => k.some(y => String(y.params.list).trim() === 'Onboarding' && y.params.title === `${x} - Sofía Ríos`))) return `Los títulos fueron: ${k.map(y => y.params.title).join(' | ')}.`;
      const m = callsOf(r, 'mail'); if (m.length !== 1) return `Se enviaron ${m.length} emails; se esperaba uno, después del bucle.`;
      if (m[0].params.subject !== 'Tu plan de bienvenida') return `El asunto fue «${m[0].params.subject}».`;
      return m[0].params.body.includes(`Tenés ${tareas.length} tareas asignadas en Planner.`) || `El cuerpo fue «${m[0].params.body}».`;
    } })),
    solution: () => ({ steps: [
      N('webhook', 'When a HTTP request is received', { path: '/ingresos' }),
      N('crm', 'Add a new row', { table: 'Empleados', email: tb('email'), name: tb('nombre'), props: [col('area', tb('area'))] }),
      N('slack', 'Post message in a chat or channel', { channel: 'RRHH', text: `Damos la bienvenida a ${tb('nombre')} (${tb('area')})` }),
      N('foreach', 'Apply to each', { from: tb('tareas') }, [{ name: 'Acciones', steps: [N('task', 'Create a task', { list: 'Onboarding', title: `${pa("items('Apply_to_each')")} - ${tb('nombre')}` })] }]),
      N('mail', 'Send an email (V2)', { to: tb('email'), subject: 'Tu plan de bienvenida', body: `Hola ${tb('nombre')}. Tenés ${pa("length(triggerBody()?['tareas'])")} tareas asignadas en Planner.` }),
    ] }),
  }),
  X({
    id: 'encuesta-ia', title: 'Clasificar encuestas de satisfacción con IA',
    story: 'Cada respuesta de la encuesta de satisfacción se clasifica con IA. Las negativas van a atención al cliente para contactar a la persona; las positivas se guardan como testimonios.',
    objectives: ['Clasificar texto con un prompt de una sola palabra.', 'Enrutar con Switch según la respuesta de la IA.', 'Dejar un Default sin acciones.'],
    reqs: [
      'Trigger: <b>When a new response is submitted</b> (recibe <code>nombre</code>, <code>email</code> y <code>comentario</code>).',
      '<b>Run a prompt</b> que clasifique el comentario en una sola palabra (<code>positivo</code>, <code>negativo</code> o <code>neutro</code>) e incluya el comentario.',
      '<b>Switch</b> con On <code>@{body(\'Run_a_prompt\')?[\'text\']}</code>. Caso <code>negativo</code>: <b>Teams</b> al canal <code>Atención al cliente</code>: <code>Contactar a NOMBRE (EMAIL): COMENTARIO</code>. Caso <code>positivo</code>: <b>Add a row into a table</b> en <code>Testimonios</code> (Nombre, Comentario). Default: nada.',
    ],
    mock: 'El modelo simulado clasifica bien solo si el prompt incluye el comentario.',
    hints: ['Pedí una sola palabra en minúsculas para que coincida con los casos del Switch.', 'Dejá el Default vacío.'],
    real: ['AI Builder tiene un modelo prearmado de análisis de sentimiento que devuelve positive, negative o neutral con un puntaje.', 'Convertí la respuesta con toLower y trim si no confiás en el formato.'],
    sample: [{ nombre: SENT[0][0], email: SENT[0][1], comentario: SENT[0][2] }], ai: sentAi,
    checks: [['Usa AI Builder', f => has(f, 'ai')], ['Enruta con Switch', f => has(f, 'router')]],
    tests: SENT.map(([nombre, email, comentario, s]) => ({ name: `Comentario ${s}`, input: [{ nombre, email, comentario }], ai: sentAi, expect: r => {
      const a = callsOf(r, 'ai')[0]; if (!a || !a.params.prompt.includes(comentario)) return 'El prompt no incluye el comentario.';
      const t = callsOf(r, 'slack'), x = callsOf(r, 'sheets');
      if (s === 'negativo') { if (x.length) return 'Un comentario negativo no es un testimonio.'; const c = inChannel(r, 'Atención al cliente'); if (!c) return 'Falta el aviso en Atención al cliente.'; return okText(c, `Contactar a ${nombre} (${email}): ${comentario}`); }
      if (s === 'positivo') { if (t.length) return 'Un comentario positivo no va a Teams.'; if (!x.length || String(x[0].params.sheet).trim() !== 'Testimonios') return 'Falta la fila en Testimonios.'; return (x[0].params.values.Nombre === nombre && x[0].params.values.Comentario === comentario) || `La fila fue ${JSON.stringify(x[0].params.values)}.`; }
      return (!t.length && !x.length) || 'Un comentario neutro no tiene que generar acciones.';
    } })),
    solution: () => ({ steps: [
      N('formsIn', 'When a new response is submitted', { form: 'Encuesta de satisfacción' }),
      N('ai', 'Run a prompt', { prompt: `Clasificá el sentimiento de este comentario. Respondé solo con una palabra en minúsculas: positivo, negativo o neutro.\n\nComentario: ${tb('comentario')}` }),
      N('router', 'Switch', { on: bd('Run_a_prompt', 'text') }, [
        { name: 'negativo', value: 'negativo', steps: [N('slack', 'Post message in a chat or channel', { channel: 'Atención al cliente', text: `Contactar a ${tb('nombre')} (${tb('email')}): ${tb('comentario')}` })] },
        { name: 'positivo', value: 'positivo', steps: [N('sheets', 'Add a row into a table', { doc: 'Marketing.xlsx', sheet: 'Testimonios', columns: [col('Nombre', tb('nombre')), col('Comentario', tb('comentario'))] })] },
        { name: 'Default', fallback: true, value: '', steps: [] },
      ]),
    ] }),
  }),
  X({
    id: 'backup-csv', title: 'Respaldo semanal de clientes en CSV',
    story: 'Cada domingo, el flujo exporta la tabla de clientes a un archivo CSV en OneDrive, solo con el nombre y el email.',
    objectives: ['Elegir columnas con Select.', 'Generar un CSV con Create CSV table.', 'Crear un archivo en OneDrive.'],
    reqs: [
      'Trigger: <b>Recurrence</b>.',
      '<b>List rows present in a table</b> de <code>Clientes</code>.',
      '<b>Select</b> sobre las filas, con los campos <code>Nombre</code> y <code>Email</code> (en ese orden).',
      '<b>Create CSV table</b> a partir de <code>@{body(\'Select\')}</code>.',
      '<b>Create file</b> en la carpeta <code>/Backups</code> con el nombre <code>clientes.csv</code> y el CSV como contenido.',
    ],
    hints: ['En Select, cada campo se lee con item(): Nombre = @{item()?[\'nombre\']}.', 'Create CSV table pone comillas cuando un valor tiene comas.'],
    real: ['Para no pisar el archivo de la semana anterior, se agrega la fecha al nombre con formatDateTime(utcNow(), \'yyyy-MM-dd\').', 'Create CSV table tiene un modo Custom para definir columnas sin usar Select.'],
    sample: [{}], rows: () => CLIENTES,
    checks: [['Usa Select', f => has(f, 'select')], ['Usa Create CSV table', f => has(f, 'csv')], ['Crea el archivo', f => has(f, 'file')]],
    tests: [['Dos clientes', CLIENTES, 'Nombre,Email\n"Pérez, Ana",ana@mail.example\nLuis Ortiz,luis@mail.example'], ['Un cliente', [{ nombre: 'Mora Paz', email: 'mora@mail.example', ciudad: 'Salta' }], 'Nombre,Email\nMora Paz,mora@mail.example']].map(([name, rows, csv]) => ({ name, input: [{}], rows: () => rows, expect: r => {
      const f = callsOf(r, 'file')[0]; if (!f) return 'No se creó el archivo.';
      if (f.params.folder.replace(/\/$/, '') !== '/Backups' || f.params.name !== 'clientes.csv') return `El archivo fue ${f.params.folder}/${f.params.name}.`;
      return f.params.content === csv || `El contenido fue:\n${f.params.content}\n\nSe esperaba:\n${csv}`;
    } })),
    solution: () => ({ steps: [
      N('schedule', 'Recurrence', { every: 'Cada domingo', at: '22:00' }), N('sheetsRead', 'List rows present in a table', { doc: 'CRM.xlsx', sheet: 'Clientes' }),
      N('select', 'Select', { from: bd('List_rows_present_in_a_table', 'value'), fields: [col('Nombre', pa("item()?['nombre']")), col('Email', pa("item()?['email']"))] }),
      N('csv', 'Create CSV table', { from: pa("body('Select')") }),
      N('file', 'Create file', { folder: '/Backups', name: 'clientes.csv', content: pa("body('Create_CSV_table')") }),
    ] }),
  }),
] };

/* Modo libre: sin verificación, con respuestas simuladas que define la persona */
Object.keys(PROJ).forEach(pf => PROJ[pf].push({
  id: 'libre', free: true, cat: 'Modo libre', level: 'Libre', title: 'Modo libre',
  story: `Armá cualquier ${P[pf].flow} con todas las acciones disponibles y probalo con tus propios datos. Vos definís qué responden la API, la IA, Excel, las aprobaciones y el flujo de escritorio.`,
  reqs: [], checks: [], tests: [], hints: ['Cambiá los datos de prueba y las respuestas simuladas, y ejecutá de nuevo para ver cómo cambia el resultado.', 'Abrí cada paso del resultado para ver qué datos entrega.'],
  sample: [{ nombre: 'Ana', email: 'ana@mail.example', total: 1500, items: [{ producto: 'Mate', monto: 1200 }, { producto: 'Termo', monto: 800 }] }],
}));
const FREE_DEF = { approval: 'Approve', http: '{\n  "statusCode": 200,\n  "items": [\n    { "nombre": "Mate", "stock": 3 },\n    { "nombre": "Termo", "stock": 12 }\n  ]\n}', ai: 'Respuesta simulada de la IA.', rows: '[\n  { "producto": "Mate", "monto": 1200 },\n  { "producto": "Termo", "monto": 800 }\n]', desktop: '{ "estado": "ok" }' };
const freeMocks = pf => { const m = ((data().free ||= {})[pf] ||= { ...FREE_DEF }); Object.keys(FREE_DEF).forEach(k => { if (m[k] == null) m[k] = FREE_DEF[k]; }); return m; };
function mocksFor(j, t = {}) {
  if (!j.free) return { http: t.http || j.http, ai: t.ai || j.ai, rows: t.rows || j.rows, approval: t.approval || j.approval, desktop: t.desktop || j.desktop };
  const m = freeMocks(state.pf), parse = (txt, what) => { try { return JSON.parse(txt); } catch (_) { throw new Error(`la respuesta simulada de ${what} no es JSON válido`); } };
  return {
    approval: () => String(m.approval ?? 'Approve').trim(), http: () => parse(m.http, 'la API'), desktop: () => parse(m.desktop, 'el flujo de escritorio'),
    rows: () => { const r = parse(m.rows, 'Excel'); if (!Array.isArray(r)) throw new Error('las filas simuladas tienen que ser una lista'); return r; },
    ai: () => { const s = m.ai.trim(); if (s.startsWith('{')) { try { return JSON.parse(s); } catch (_) {} } return m.ai; },
  };
}

/* ---------------- Simulador ---------------- */
// Una ejecución de Power Automate: un único contexto con la salida de cada acción (por nombre) y las variables
class SimError extends Error {}
const fail = m => { throw new SimError(m); };
const TERMINATE = { terminate: true };
const PAF = {
  toLower: s => String(s ?? '').toLowerCase(), toUpper: s => String(s ?? '').toUpperCase(), trim: s => String(s ?? '').trim(),
  concat: (...a) => a.map(x => (x == null ? '' : typeof x === 'object' ? JSON.stringify(x) : x)).join(''), length: x => (x ?? '').length,
  substring: (s, i, n) => String(s ?? '').substr(Number(i), n == null ? undefined : Number(n)), indexOf: (s, t) => String(s ?? '').indexOf(t),
  add: (a, b) => Number(a) + Number(b), sub: (a, b) => Number(a) - Number(b), mul: (a, b) => Number(a) * Number(b), div: (a, b) => { if (Number(b) === 0) throw new Error('div() no puede dividir por cero'); return Number(a) / Number(b); },
  int: x => { const n = parseInt(x, 10); if (isNaN(n)) throw new Error(`int() no puede convertir «${x}» en número`); return n; }, float: x => parseFloat(x),
  string: x => (x == null ? '' : typeof x === 'object' ? JSON.stringify(x) : String(x)),
  equals: (a, b) => a === b || String(a) === String(b), greater: (a, b) => Number(a) > Number(b), greaterOrEquals: (a, b) => Number(a) >= Number(b), less: (a, b) => Number(a) < Number(b), lessOrEquals: (a, b) => Number(a) <= Number(b),
  and: (...a) => a.every(Boolean), or: (...a) => a.some(Boolean), not: x => !x, iff: (c, a, b) => (c ? a : b),
  contains: (a, b) => (Array.isArray(a) ? a.includes(b) : a && typeof a === 'object' ? b in a : String(a ?? '').includes(b)),
  split: (x, d) => String(x ?? '').split(d), join: (a, d) => (Array.isArray(a) ? a : []).map(x => (typeof x === 'object' ? JSON.stringify(x) : x)).join(d), first: x => (Array.isArray(x) ? x[0] : String(x ?? '')[0]), last: x => (Array.isArray(x) ? x[x.length - 1] : String(x ?? '').slice(-1)),
  replace: (x, a, b) => String(x ?? '').split(a).join(b), coalesce: (...a) => a.find(x => x != null), empty: x => x == null || x === '' || (Array.isArray(x) && !x.length) || (typeof x === 'object' && !Object.keys(x).length),
  json: x => { if (typeof x !== 'string') return x; try { return JSON.parse(x); } catch (_) { throw new Error('json() recibió un texto que no es JSON válido'); } }, utcNow: () => new Date().toISOString(),
};
function evalPA(code, S) {
  const byName = name => { const k = Object.keys(S.names).find(n => n.replace(/ /g, '_') === String(name)); if (k === undefined) throw new Error(`no hay una acción anterior llamada '${name}' (los espacios van como guiones bajos)`); return S.names[k]; };
  const variables = name => { if (!(name in S.vars)) throw new Error(`la variable '${name}' no está inicializada (usá Initialize variable antes)`); return S.vars[name]; };
  const item = () => { if (S.cur === undefined) throw new Error('item() solo se puede usar dentro de Filter array o Select'); return S.cur; };
  const js = code.replace(/\?\[/g, '?.[').replace(/\bif\s*\(/g, 'iff(');
  try {
    return new Function('triggerBody', 'triggerOutputs', 'body', 'outputs', 'items', 'variables', 'item', ...Object.keys(PAF), 'return (' + js + ')')(() => S.trigger, () => ({ body: S.trigger }), byName, byName, byName, variables, item, ...Object.values(PAF));
  } catch (e) { fail(`Expresión @{${code.trim()}}: ${e.message}`); }
}
function ev(src, S) {
  const s = String(src ?? ''), one = s.trim().match(/^@\{([\s\S]+)\}$/);
  if (one && !one[1].includes('@{')) return evalPA(one[1], S);
  return s.replace(/@\{([\s\S]+?)\}(?!['\]])/g, (_, c) => { const v = evalPA(c, S); return v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); });
}
function test(cond, S) {
  const l = ev(cond.left, S), r = ev(cond.right, S);
  const num = v => v !== '' && v != null && typeof v !== 'boolean' && !isNaN(Number(v)), both = num(l) && num(r);
  switch (cond.op) {
    case 'eq': return both ? Number(l) === Number(r) : String(l ?? '') === String(r ?? '');
    case 'neq': return both ? Number(l) !== Number(r) : String(l ?? '') !== String(r ?? '');
    case 'contains': return String(l ?? '').includes(String(r ?? ''));
    case 'ncontains': return !String(l ?? '').includes(String(r ?? ''));
    case 'gt': return both && Number(l) > Number(r); case 'gte': return both && Number(l) >= Number(r);
    case 'lt': return both && Number(l) < Number(r); case 'lte': return both && Number(l) <= Number(r);
    case 'exists': return !PAF.empty(l); case 'empty': return PAF.empty(l);
  }
  return false;
}
function number(flow) { let i = 0; all(flow).forEach(n => { n.num = ++i; }); }
const csvCell = v => { const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
function runFlow(flow, pf, input, mocks = {}) {
  number(flow);
  const trace = [], calls = []; let error = null, failed = null, response = null, terminated = null;
  const S = { trigger: null, names: {}, vars: {}, cur: undefined, part: '' };
  const req = (v, what) => { if (String(v ?? '').trim() === '') fail(`Falta completar «${what}».`); return v; };
  const e = x => ev(x, S);
  const rowsOf = list => { const o = {}; (list || []).forEach(c => { if (String(c.name).trim()) o[c.name.trim()] = e(c.value); }); return o; };
  const arrayOf = (x, what) => { const v = e(req(x, what)); if (!Array.isArray(v)) fail(`«${what}» tiene que ser una lista y recibió ${v == null ? 'un valor vacío' : typeof v === 'object' ? 'un objeto' : `«${short(v, 40)}»`}.`); return v; };
  const done = (n, out, note) => { S.names[n.name] = out; trace.push({ num: n.num, name: n.name, out, note: (S.part ? `[${S.part}] ` : '') + note }); };
  const mock = (k, arg, label) => { try { return mocks[k] ? mocks[k](arg) : undefined; } catch (err) { fail(`${label}: ${err.message}`); } };
  function run(n) {
    const p = n.p;
    switch (n.op) {
      case 'formsIn': case 'spItem': case 'instant': case 'webhook': case 'schedule':
        S.trigger = clone((Array.isArray(input) ? input[0] : input) || {}); return done(n, S.trigger, 'Disparado');
      case 'if': { const ok = test(p.cond, S); trace.push({ num: n.num, name: n.name, out: { expression: ok }, note: (S.part ? `[${S.part}] ` : '') + (ok ? 'Sí: la condición se cumple' : 'No: la condición no se cumple') }); return seq(n.branches[ok ? 0 : 1].steps); }
      case 'router': {
        const v = e(req(p.on, 'On')), hit = n.branches.find(b => !b.fallback && String(e(b.value)) === String(v)) || n.branches.find(b => b.fallback);
        trace.push({ num: n.num, name: n.name, out: { on: v }, note: (S.part ? `[${S.part}] ` : '') + (hit ? `Caso «${hit.name}»` : 'Ningún caso coincide y no hay Default') });
        return hit ? seq(hit.steps) : undefined;
      }
      case 'foreach': {
        const arr = arrayOf(p.from, 'Select an output from previous steps'), part = S.part;
        trace.push({ num: n.num, name: n.name, out: arr, note: (part ? `[${part}] ` : '') + `${arr.length} elemento(s)` });
        arr.forEach((el, i) => { S.names[n.name] = el; S.part = `${part ? part + ' · ' : ''}${i + 1}/${arr.length}`; seq(n.branches[0].steps); });
        S.part = part; S.names[n.name] = arr; return;
      }
      case 'terminate':
        trace.push({ num: n.num, name: n.name, note: `Terminate con estado ${p.status}${p.message ? ': ' + e(p.message) : ''}` });
        if (p.status === 'Failed') fail(`Terminate (Failed)${p.code ? ' ' + e(p.code) : ''}: ${e(p.message) || 'sin mensaje'}`);
        terminated = p.status; throw TERMINATE;
      case 'varInit': {
        const name = String(req(p.name, 'Name')).trim(); if (name in S.vars) fail(`La variable '${name}' ya está inicializada.`);
        const raw = e(p.value); let v;
        if (p.type === 'Integer') v = raw === '' ? 0 : PAF.int(raw); else if (p.type === 'Float') v = raw === '' ? 0 : Number(raw);
        else if (p.type === 'Boolean') v = raw === true || raw === 'true'; else if (p.type === 'Array') v = raw === '' ? [] : PAF.json(raw);
        else v = raw == null ? '' : String(raw);
        if (p.type === 'Array' && !Array.isArray(v)) fail(`El valor inicial de '${name}' tiene que ser una lista, por ejemplo [].`);
        S.vars[name] = v; trace.push({ num: n.num, name: n.name, out: { [name]: v }, note: `Variable ${name} (${p.type})` }); return;
      }
      case 'varSet': case 'varInc': case 'varAppend': {
        const name = String(req(p.name, 'Name')).trim(); if (!(name in S.vars)) fail(`La variable '${name}' no está inicializada.`);
        const v = e(p.value);
        if (n.op === 'varSet') S.vars[name] = v;
        else if (n.op === 'varInc') { if (typeof S.vars[name] !== 'number') fail(`Increment variable solo sirve para variables Integer o Float.`); S.vars[name] += Number(v === '' ? 1 : v); }
        else if (Array.isArray(S.vars[name])) S.vars[name].push(v); else S.vars[name] = String(S.vars[name]) + String(v ?? '');
        trace.push({ num: n.num, name: n.name, out: { [name]: clone(S.vars[name]) }, note: (S.part ? `[${S.part}] ` : '') + `${name} = ${short(JSON.stringify(S.vars[name]), 60)}` }); return;
      }
      case 'set': return done(n, rowsOf(p.fields), 'Compose');
      case 'parseJson': { const v = e(req(p.content, 'Content')); return done(n, typeof v === 'string' ? PAF.json(v) : v, 'JSON leído'); }
      case 'filter': {
        const arr = arrayOf(p.from, 'From'), res = arr.filter(el => { S.cur = el; try { return test(p.cond, S); } finally { S.cur = undefined; } });
        return done(n, res, `${res.length} de ${arr.length} elemento(s) cumplen`);
      }
      case 'select': {
        const arr = arrayOf(p.from, 'From'), res = arr.map(el => { S.cur = el; try { return p.textMode ? e(p.value) : rowsOf(p.fields); } finally { S.cur = undefined; } });
        return done(n, res, `${res.length} elemento(s)`);
      }
      case 'csv': {
        const arr = arrayOf(p.from, 'From'), keys = [...new Set(arr.flatMap(o => (o && typeof o === 'object' ? Object.keys(o) : [])))];
        return done(n, [keys.map(csvCell).join(','), ...arr.map(o => keys.map(k => csvCell(o[k])).join(','))].join('\n'), `CSV de ${arr.length} fila(s)`);
      }
      case 'http': { const url = String(req(e(p.url), 'URI')); const r = mock('http', { url, method: p.method, body: e(p.body) }, 'HTTP') ?? { statusCode: 200 }; calls.push({ app: 'http', node: n.name, params: { method: p.method, url } }); return done(n, clone(r), `${p.method} ${short(url, 60)}`); }
      case 'approval': { const params = { assignedTo: String(req(e(p.assignedTo), 'Assigned to')), title: String(req(e(p.title), 'Title')), details: String(e(p.details) ?? '') }; const outcome = mock('approval', params, 'Aprobación') || 'Approve'; calls.push({ app: 'approval', node: n.name, params: { ...params, outcome } }); return done(n, { outcome, responses: [{ responder: params.assignedTo, approverResponse: outcome }] }, `Respuesta: ${outcome}`); }
      case 'ai': { const prompt = String(req(e(p.prompt), 'Prompt')); const r = mock('ai', prompt, 'AI Builder') ?? 'Respuesta simulada de la IA.'; calls.push({ app: 'ai', node: n.name, params: { prompt } }); return done(n, r && typeof r === 'object' ? { ...r, text: r.text ?? JSON.stringify(r) } : { text: String(r) }, 'Respuesta del modelo'); }
      case 'mail': { const params = { to: String(req(e(p.to), 'To')), subject: String(e(p.subject) ?? ''), body: String(e(p.body) ?? '') }; calls.push({ app: 'mail', node: n.name, params }); return done(n, { id: 'msg_' + uid(), ...params }, `Email a ${params.to}`); }
      case 'slack': { const params = { channel: String(req(e(p.channel), 'Channel')), text: String(req(e(p.text), 'Message')) }; calls.push({ app: 'slack', node: n.name, params }); return done(n, { id: 'teams_' + uid(), ...params }, `Mensaje en ${params.channel}`); }
      case 'sheets': { req(p.sheet, 'Table'); const values = rowsOf(p.columns); if (!Object.keys(values).length) fail('Agregá al menos una columna.'); calls.push({ app: 'sheets', node: n.name, params: { doc: p.doc, sheet: p.sheet, values } }); return done(n, values, `Fila agregada en ${p.sheet}`); }
      case 'sheetsRead': { req(p.sheet, 'Table'); const rows = clone(mock('rows', p.sheet.trim(), 'Excel') || []); if (!Array.isArray(rows)) fail('Las filas de la tabla tienen que ser una lista.'); return done(n, { value: rows }, `${rows.length} fila(s) en value`); }
      case 'file': { const params = { folder: String(req(e(p.folder), 'Folder Path')), name: String(req(e(p.name), 'File Name')), content: String(e(p.content) ?? '') }; calls.push({ app: 'file', node: n.name, params }); return done(n, { Name: params.name, Path: `${params.folder.replace(/\/$/, '')}/${params.name}` }, `Archivo ${params.name}`); }
      case 'task': { const params = { list: String(req(e(p.list), 'Plan')), title: String(req(e(p.title), 'Title')), description: String(e(p.description) ?? ''), due: String(e(p.due) ?? '') }; calls.push({ app: 'task', node: n.name, params }); return done(n, { id: 'task_' + calls.length, ...params }, `Tarea en ${params.list}`); }
      case 'crm': { const params = { table: p.table || 'Contacts', email: String(req(e(p.email), 'Email')), name: String(e(p.name) ?? ''), props: rowsOf(p.props) }; calls.push({ app: 'crm', node: n.name, params }); return done(n, { id: 'row-' + (1000 + calls.length), email: params.email, name: params.name, ...params.props }, `Fila en ${params.table}`); }
      case 'pbi': { const params = { dataset: String(req(e(p.dataset), 'Dataset')), table: String(req(e(p.table), 'Table')), values: rowsOf(p.columns) }; calls.push({ app: 'pbi', node: n.name, params }); return done(n, params.values, `Fila en ${params.dataset}`); }
      case 'desktop': { const params = { flowName: String(req(e(p.flowName), 'Desktop flow')), inputs: rowsOf(p.inputs) }; const outputs = mock('desktop', params, 'Flujo de escritorio') ?? {}; calls.push({ app: 'desktop', node: n.name, params: { ...params, outputs } }); return done(n, clone(outputs), `Flujo de escritorio ${params.flowName}`); }
      case 'respond': { const outputs = rowsOf(p.outputs); response = outputs; calls.push({ app: 'respond', node: n.name, params: outputs }); return done(n, outputs, 'Respuesta enviada a Power Apps'); }
    }
    fail(`La acción «${n.op}» no existe en el simulador.`);
  }
  function seq(steps) {
    for (const n of steps) {
      try { run(n); } catch (err) { if (err === TERMINATE) throw err; err.num = err.num || n.num; err.nodeName = err.nodeName || n.name; throw err; }
    }
  }
  try {
    if (!flow.steps.length) fail('El flujo está vacío: elegí un trigger.');
    if (!TRIGGERS.includes(flow.steps[0].op)) fail('El primer paso tiene que ser un trigger.');
    seq(flow.steps);
  } catch (err) {
    if (err !== TERMINATE) { error = err.message; failed = err.num || null; trace.push({ num: err.num, name: err.nodeName || 'Flujo', error: err.message }); }
  }
  return { trace, calls, error, failed, response, terminated, vars: S.vars };
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
  const links = [['home', 'Inicio'], ['sap', 'SAP CPI'], ['pa', 'Power Automate'], ['dash', 'Mi avance']];
  $('#navLinks').innerHTML = links.map(([k, l]) => `<button type="button" data-go="${k}"${(state.view === k || (state.view !== 'home' && state.view !== 'dash' && state.pf === k)) ? ' aria-current="page"' : ''}>${l}</button>`).join('');
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
      <h1 class="display">Practicá el software de flujos que usan las empresas</h1>
      <div><span class="pill">SAP CPI · Power Automate</span></div>
      <p class="lead">Las plataformas de integración y automatización empresarial no se pueden usar libremente sin una licencia. flowDev te deja practicarlas con talleres que imitan cada herramienta, proyectos guiados y un simulador que revisa tu flujo paso a paso.</p>
      <div class="row">${u ? `<button class="btn" data-go="dash">Seguir donde quedé</button>` : `<button class="btn" data-auth="registro">Crear cuenta gratis</button><button class="btn line" data-go="pa">Probar sin cuenta</button>`}</div>
    </div>
    <div class="side dark">
      <div class="tiles">
        <div class="tile"><span class="big">2</span><p>plataformas empresariales y 2 más en camino</p></div>
        <div class="tile grey">${svg('router')}<p>${c.pro + SAP.scenarios + SAP.practice} proyectos y ejercicios con verificación</p></div>
        <div class="tile grey">${svg('formsIn')}<p>${c.les + SAP_LESSONS.length} clases cortas, sin relleno</p></div>
        <div class="tile"><span class="big">${c.q + SAP.quizzes}</span><p>cuestionarios para repasar</p></div>
      </div>
    </div>
  </section>

  <section class="card">
    <div class="grid2" style="align-items:end;margin-bottom:22px">
      <h2 class="display">Plataformas empresariales</h2>
      <p class="lead">Las herramientas que piden las empresas y que no se pueden practicar gratis: integración con SAP y automatización con Microsoft Power Platform.</p>
    </div>
    <div class="grid2">${pcard('pa')}<button type="button" class="pcard grey" data-go="sap" style="text-align:left"><div class="row" style="justify-content:space-between"><span class="pill">iFlows</span><span class="arrow">${svg('arrow')}</span></div><div class="name">SAP CPI</div><p class="dim">Integración empresarial con SAP Cloud Integration.</p><div class="foot-row"><span class="pill fill">${SAP.scenarios} escenarios</span><span class="pill fill">${SAP.quizzes} cuestionarios</span></div></button></div>
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
      <p class="lead dim">${reg ? 'Guardá tus flujos, tus respuestas y tu progreso en cada plataforma.' : 'Ingresá para seguir con tus proyectos donde los dejaste.'}</p>
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
        <div class="row"><button class="btn" type="submit">${reg ? 'Crear cuenta' : 'Ingresar'}</button><button class="btn line" type="button" data-go="pa">Seguir sin cuenta</button></div>
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
  <section class="grid2">${keys.map(pcard).join('')}</section>`;
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
  else if (tab === 'libre') body = `<div class="grid2" style="align-items:center"><div class="stack"><h2 class="h2">Modo libre</h2><p class="lead">Abrí el ${TALLER[pf].toLowerCase()} sin requisitos ni verificación, con todas las acciones: IA, APIs, Excel, aprobaciones, variables y RPA.</p><p class="dim">Vos definís los datos de entrada y qué responden la API, la IA, Excel, las aprobaciones y el flujo de escritorio. Tu ${esc(p.flow)} queda guardado.</p><div><button type="button" class="btn" data-proj="libre">Abrir el editor libre</button></div></div><div class="tiles"><div class="tile">${svg('ai')}<p>Respuesta de la IA a tu medida</p></div><div class="tile grey">${svg('http')}<p>Respuesta de la API en JSON</p></div><div class="tile grey">${svg('sheetsRead')}<p>Filas de la hoja de cálculo</p></div><div class="tile">${svg('approval')}<p>Aprobaciones que se aprueban o rechazan</p></div></div></div>`;
  else if (!state.quizId) body = p.quizzes.map(q => `<button type="button" class="list-item" data-quiz="${q.id}"><span class="pill${pr[`${pf}:Q:${q.id}`] ? ' ok' : ''}">${pr[`${pf}:Q:${q.id}`] ? 'Aprobado' : q.qs.length + ' preguntas'}</span><span class="grow"><span class="h3">${esc(q.title)}</span></span><span class="arrow">${svg('arrow')}</span></button>`).join('');
  else {
    const quiz = p.quizzes.find(q => q.id === state.quizId), ans = data().quiz[`${pf}:${quiz.id}`] || {};
    body = `<div class="row" style="justify-content:space-between;margin-bottom:14px"><button type="button" class="btn line sm" data-quiz="">← Cuestionarios</button><span class="h3">${esc(quiz.title)}</span></div>` + quiz.qs.map((q, i) => { const g = state.graded && ans[i] != null, ok = ans[i] === 0, show = state.reveal.has(i);
      return `<div class="q${g ? (ok ? ' ok' : ' bad') : ''}"><p class="t">${i + 1}. ${esc(q[0])}</p>${order(q).map(k => `<label class="${show && k === 0 ? 'right' : ''}"><input type="radio" name="q${i}" data-q="${i}" data-o="${k}"${ans[i] === k ? ' checked' : ''}><span>${esc(q[1][k])}</span></label>`).join('')}${g || show ? `<p class="why">${g ? (ok ? 'Correcto. ' : 'No es esa. ') : ''}${esc(q[2])}</p>` : ''}<div class="row" style="justify-content:flex-end;margin-top:6px"><button type="button" class="btn line sm" data-act="reveal" data-i="${i}">${show ? 'Ocultar respuesta' : 'Ver respuesta'}</button></div></div>`; }).join('')
      + `<div class="row"><button type="button" class="btn" data-act="grade">Corregir</button>${pr[`${pf}:Q:${quiz.id}`] ? '<span class="pill ok">Aprobado</span>' : ''}</div>`;
  }
  return `<section class="card ${p.tone === 'dark' ? 'dark' : ''} flush split">
    <div class="side"><h1 class="display">${p.name}</h1><div><span class="pill">${esc(p.tag)}</span></div><p class="lead ${p.tone === 'dark' ? 'dim' : ''}">${esc(p.intro)}</p><div><button type="button" class="btn ${p.tone === 'dark' ? 'sky' : ''}" data-proj="${(gr.find(j => !pr[`${pf}:P:${j.id}`]) || gr[0]).id}">Abrir el ${TALLER[pf].toLowerCase()}</button></div></div>
    <div class="side ${p.tone === 'dark' ? '' : 'dark'}">
      <div class="tiles">
        <div class="tile"><span class="big">${pct(pf)}%</span><p>de ${p.name} completado</p></div>
        <div class="tile grey"><span class="big">${gr.length}</span><p>ejercicios con verificación</p></div>
        <div class="tile grey"><span class="big">${p.quizzes.length}</span><p>${p.quizzes.length === 1 ? 'cuestionario' : 'cuestionarios, uno por clase'}</p></div>
        <div class="tile"><span class="big">${p.lessons.length}</span><p>clases de teoría</p></div>
      </div>
    </div>
  </section>
  <section class="card">
    <div class="tabs" role="tablist" style="margin-bottom:16px">${[['lecciones', 'Teoría'], ['proyectos', 'Proyectos'], ['quiz', 'Cuestionarios'], ['libre', 'Modo libre']].map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${tab === k}">${l}</button>`).join('')}</div>
    ${body}
  </section>`;
}

/* ---------------- SAP CPI: página de introducción (el taller vive en sap-cpi/) ---------------- */
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
const SAP_LESSONS = [
  ['Qué es Cloud Integration y qué es un iFlow', [
    '<p><b>Cloud Integration</b> es una capacidad de SAP Integration Suite, dentro de SAP BTP. Sirve para que sistemas distintos (S/4HANA, un ERP viejo, una tienda online, un banco) intercambien datos sin conectarse directo entre sí.</p>',
    '<p>Cada integración es un <b>iFlow</b> (integration flow). Se dibuja en <b>BPMN</b>: un rectángulo grande, el <i>Integration Process</i>, con los pasos adentro, y los sistemas externos afuera como participantes.</p>',
    '<ul><li>Los iFlows se guardan en <b>paquetes</b> (Design).</li><li>Para que funcionen hay que <b>desplegarlos</b> (Deploy) en el tenant.</li><li>Cada ejecución se revisa en <b>Monitor</b>.</li></ul>',
    '<p>Lo que viaja por el iFlow es un <b>mensaje</b> con tres partes: <b>body</b> (los datos), <b>headers</b> y <b>exchange properties</b>.</p>'
  ]],
  ['Participantes y adaptadores', [
    '<p>Los sistemas se representan como <b>Sender</b> (quien envía) y <b>Receiver</b> (quien recibe). La línea punteada que los une al proceso lleva un <b>adaptador</b>: define el protocolo de esa conexión.</p>',
    '<ul><li><b>HTTPS</b>: expone un endpoint para que te llamen. <b>HTTP</b> llama a otro servicio.</li><li><b>SOAP</b>, <b>OData</b>, <b>RFC</b> e <b>IDoc</b>: los protocolos clásicos del mundo SAP.</li><li><b>SFTP</b>: lee o deja archivos en un servidor.</li><li><b>AMQP</b> y <b>JMS</b>: colas de mensajes.</li><li><b>Open Connectors</b>: apps de terceros con conectores ya armados.</li></ul>',
    '<p>Hacia afuera hay tres formas de llamar: <b>Request Reply</b> (espera la respuesta y reemplaza el body), <b>Send</b> (envía y sigue) y conectar el <b>End Message</b> a un Receiver (entrega al final).</p>',
    '<p>Para llegar a un sistema dentro de la red de la empresa se usa <b>Proxy Type On-Premise</b>, que pasa por el Cloud Connector.</p>'
  ]],
  ['Headers, properties y expresiones', [
    '<p>El <b>Content Modifier</b> crea o borra headers y properties, y puede reemplazar el body.</p>',
    '<ul><li>Un <b>header</b> viaja con el mensaje hacia los receptores.</li><li>Una <b>exchange property</b> vive solo dentro del iFlow: sirve para guardar datos que vas a necesitar más adelante.</li></ul>',
    '<p>Los valores se leen con expresiones <b>Camel Simple</b> o con <b>XPath</b> sobre un body XML:</p>',
    '<pre>${header.nombre}\n${property.clienteId}\n${in.body}\n${exception.message}\n/Pedido/ClienteId        (XPath)</pre>',
    '<p>Hay headers con significado propio: <code>CamelHttpQuery</code> trae los parámetros de la URL, <code>CamelFileName</code> define el nombre del archivo en SFTP y <code>CamelHttpResponseCode</code> el código HTTP de la respuesta.</p>',
    '<p>Error típico: después de un Request Reply el body es la respuesta. Si necesitabas el mensaje original, guardalo antes en una property.</p>'
  ]],
  ['Transformar y enrutar', [
    '<ul><li><b>Message Mapping</b>: pasa de una estructura a otra, campo por campo, a partir de XSD o WSDL.</li><li><b>Conversores</b> JSON a XML y XML a JSON.</li><li><b>Groovy Script</b>: lógica propia sobre el mensaje.</li><li><b>Filter</b>: conserva solo la parte del XML que devuelve un XPath.</li></ul>',
    '<ul><li><b>Router</b>: el mensaje toma una sola ruta, la primera cuya condición se cumple, o la ruta por defecto.</li><li><b>Multicast</b>: el mismo mensaje va por todas las ramas, en paralelo o en secuencia.</li><li><b>Splitter</b> y <b>Gather</b>: dividen un mensaje en partes y las vuelven a juntar.</li><li><b>Local Integration Process</b>: un subproceso reutilizable, que se ejecuta con un Process Call.</li></ul>'
  ]],
  ['Errores, persistencia, seguridad y monitoreo', [
    '<p>Un <b>Exception Subprocess</b> se dispara cuando falla un paso. Si termina en <b>End Message</b>, el mensaje queda Completed y quien llamó recibe tu respuesta; si termina en <b>Error End</b>, queda Failed.</p>',
    '<ul><li><b>Data Store</b>: guarda mensajes en el tenant para consultarlos o reprocesarlos.</li><li><b>Security Material</b>: credenciales, claves y certificados, siempre fuera del iFlow.</li><li><b>Known Hosts</b> y claves <b>PGP</b>: confianza con servidores SFTP y encriptado de archivos.</li></ul>',
    '<p>En <b>Monitor</b>, cada ejecución tiene su <b>MPL</b> (Message Processing Log). Con el nivel de log en <i>Trace</i> ves el body, los headers y las properties después de cada paso. Es lo que reproduce la pestaña Probar del taller.</p>'
  ]],
];
const sapDone = () => { try { return JSON.parse(localStorage.getItem('taller-iflows-v1') || '{}').done || {}; } catch (_) { return {}; } };
function sap() {
  const tab = state.tab, pr = data().progress, done = sapDone(), href = id => `${SAP.href}#${id}`;
  const total = SAP_SCEN.length + SAP_EXTRA.length + SAP_QUIZ.length, n = [...SAP_SCEN.map(s => s[0]), ...SAP_EXTRA.map(s => s[0]), ...SAP_QUIZ.map((_, i) => `q-c${i + 1}`)].filter(id => done[id]).length;
  const link = (id, pill, title, sub) => `<a class="list-item" href="${href(id)}"><span class="pill${done[id] ? ' ok' : ''}">${done[id] ? 'Resuelto' : esc(pill)}</span><span class="grow"><span class="h3">${esc(title)}</span>${sub ? `<br><span class="dim">${esc(sub)}</span>` : ''}</span><span class="arrow">${svg('arrow')}</span></a>`;
  let body = '';
  if (tab === 'lecciones') body = SAP_LESSONS.map(([t, parts], i) => `<details class="lesson${pr[`sap:L${i}`] ? ' done' : ''}"${i === 0 && !pr['sap:L0'] ? ' open' : ''}>
      <summary><span class="n">${i + 1}</span><span class="h3" style="flex:1">${esc(t)}</span>${pr[`sap:L${i}`] ? '<span class="pill ok">Leída</span>' : ''}</summary>
      <div class="body">${parts.join('')}<button type="button" class="btn sm" data-act="read" data-i="${i}">${pr[`sap:L${i}`] ? 'Leída' : 'Marcar como leída'}</button></div></details>`).join('');
  else if (tab === 'proyectos') body = `<p class="gtitle" style="margin-top:6px">Escenarios guiados · ${SAP_SCEN.length}</p><div>${SAP_SCEN.map(([id, c, t, s]) => link(id, c, t, s)).join('')}</div><p class="gtitle" style="margin-top:20px">Práctica extra · ${SAP_EXTRA.length}</p><div>${SAP_EXTRA.map(([id, t]) => link(id, 'Extra', t)).join('')}</div>`;
  else if (tab === 'quiz') body = SAP_QUIZ.map((t, i) => link(`q-c${i + 1}`, `Clase ${i + 1}`, t)).join('');
  else body = `<div class="grid2" style="align-items:center"><div class="stack"><h2 class="h2">Modo libre</h2><p class="lead">Abrí el taller de iFlows sin requisitos ni verificación y armá cualquier integración con todos los pasos y adaptadores.</p><p class="dim">Los Receivers responden con la respuesta simulada que les configures, y podés hacer que fallen para probar el manejo de errores.</p><div><a class="btn" href="${href('libre')}">Abrir el editor libre</a></div></div><div class="tiles"><div class="tile">${svg('router')}<p>Router, Multicast, Splitter y Gather</p></div><div class="tile grey">${svg('code')}<p>Groovy Script y Message Mapping</p></div><div class="tile grey">${svg('http')}<p>Adaptadores con respuesta simulada</p></div><div class="tile">${svg('sheets')}<p>Trace con headers, properties y body</p></div></div></div>`;
  return `<section class="card flush split" style="background:var(--grey);color:var(--paper)">
    <div class="side"><h1 class="display">SAP CPI</h1><div><span class="pill">iFlows · integración empresarial</span></div><p class="lead" style="color:#D6D6CE">${esc(SAP_INTRO)}</p><div><a class="btn sky" href="${href((SAP_SCEN.find(s => !done[s[0]]) || SAP_SCEN[0])[0])}">Abrir el taller de iFlows</a></div></div>
    <div class="side dark">
      <div class="tiles">
        <div class="tile"><span class="big">${Math.round(n / total * 100)}%</span><p>del taller completado</p></div>
        <div class="tile grey"><span class="big">${SAP_SCEN.length + SAP_EXTRA.length}</span><p>escenarios y ejercicios</p></div>
        <div class="tile grey"><span class="big">${SAP_QUIZ.length}</span><p>cuestionarios teóricos</p></div>
        <div class="tile"><span class="big">${SAP_LESSONS.length}</span><p>clases de teoría</p></div>
      </div>
    </div>
  </section>
  <section class="card">
    <div class="tabs" role="tablist" style="margin-bottom:16px">${[['lecciones', 'Teoría'], ['proyectos', 'Escenarios'], ['quiz', 'Cuestionarios'], ['libre', 'Modo libre']].map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${tab === k}">${l}</button>`).join('')}</div>
    ${body}
  </section>`;
}

/* ---------------- Taller: barra | paleta | lienzo | panel (la misma distribución que el taller de iFlows) ---------------- */
const TALLER = { pa: 'Taller de cloud flows' };
const getSeq = id => { if (id === 'root') return state.flow.steps; const [nid, bi] = id.split(':'); return all(state.flow).find(n => n.id === nid).branches[+bi].steps; };
const findNode = id => all(state.flow).find(n => n.id === id);
const condText = c => (c && c.left ? `${c.left} ${OPS.find(o => o[0] === c.op)[1]}${['exists', 'empty'].includes(c.op) ? '' : ' ' + c.right}` : 'sin condición');
const kind = op => (TRIGGERS.includes(op) ? 'trigger' : APPS.includes(op) ? 'app' : 'tool');
function nodeHtml(n, pf) {
  const cat = P[pf].cat[n.op] || [n.op], r = state.run;
  const cls = ['fnode', 'k-' + kind(n.op), state.sel === n.id ? 'sel' : '', r && r.failed === n.num ? 'failed' : r && r.trace.some(t => t.num === n.num && !t.skipped && !t.error) ? 'ran' : ''].join(' ');
  const inner = `<span class="ic">${svg(n.op)}</span><span class="tx"><span class="sb">${esc(cat[0])}</span><span class="nm">${n.num}. ${esc(n.name)}</span></span>`;
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
    if (n.branches) h += `<span class="link"></span><div class="branches">${n.branches.map((b, bi) => `<div class="branch"><span class="link0"></span><span class="blabel" title="${esc(condText(b.cond))}">${n.op === 'router' ? (b.fallback ? 'Default' : 'Case · ' + esc(short(b.value || 'sin valor', 22))) : n.op === 'foreach' ? 'Por cada elemento' : esc(b.name)}</span>${seqHtml(b.steps, `${n.id}:${bi}`, pf)}</div>`).join('')}</div>`;
  });
  if (steps.length || seqId !== 'root') h += addBtn(seqId, steps.length);
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
    <label class="fld"><span>Excel: lista de filas</span><textarea class="mono" rows="4" data-mock="rows" spellcheck="false">${esc(fm.rows)}</textarea></label>
    <label class="fld"><span>Flujo de escritorio: salidas en JSON</span><textarea class="mono" rows="2" data-mock="desktop" spellcheck="false">${esc(fm.desktop)}</textarea></label>
    ${pf === 'pa' ? `<label class="fld"><span>Respuesta de las aprobaciones</span><select data-mock="approval"><option${fm.approval === 'Approve' ? ' selected' : ''}>Approve</option><option${fm.approval === 'Reject' ? ' selected' : ''}>Reject</option></select></label>` : ''}` : ''}
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
    else idx = f.steps.length;
    if (op === 'varInit' && seqId !== 'root') return toast('Initialize variable va en el nivel superior del flujo, no dentro de un control.');
    if (seqId === 'root' && idx === 0) idx = 1;
  }
  const used = new Set(all(f).map(x => x.name)), base = cat[0].split(' · ')[0]; let name = base, k = 2; while (used.has(name)) name = `${base} ${k++}`;
  const n = N(op, name, {}, op === 'if' ? [{ name: 'Sí', steps: [] }, { name: 'No', steps: [] }] : op === 'router' ? [{ name: 'Case', value: '', steps: [] }, { name: 'Default', value: '', fallback: true, steps: [] }] : op === 'foreach' ? [{ name: 'Acciones', steps: [] }] : undefined);
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
    case 'webhook': f = t('path', 'Ruta', '/mi-flujo') + '<p class="note">El trigger entrega el JSON que llega en la petición (los datos de entrada de la pestaña Probar). Se lee con <code>@{triggerBody()?[\'campo\']}</code>.</p>'; break;
    case 'formsIn': f = t('form', 'Form Id', 'Inscripción a cursos', false) + '<p class="note">Cada respuesta llega como datos de entrada: <code>@{triggerBody()?[\'campo\']}</code>.</p>'; break;
    case 'spItem': f = t('site', 'Site Address', 'Compras', false) + t('list', 'List Name', 'Solicitudes', false) + '<p class="note">Las columnas del elemento se leen con <code>@{triggerBody()?[\'Title\']}</code>.</p>'; break;
    case 'instant': f = `<p class="gtitle">Entradas de la app</p>${rowsUi(p.inputs, 'inputs', 'nombre', 'tipo (Text, Number, Email)')}<p class="note">Se leen con <code>@{triggerBody()?['nombre']}</code>.</p>`; break;
    case 'schedule': f = t('every', 'Frecuencia', 'Cada día', false) + t('at', 'Hora', '09:00'); break;
    case 'set': f = `<p class="gtitle">Inputs</p>${rowsUi(p.fields, 'fields', 'campo', 'valor o expresión')}<p class="note">Se lee con <code>@{outputs('${esc(n.name.replace(/ /g, '_'))}')?['campo']}</code>.</p>`; break;
    case 'parseJson': f = t('content', 'Content', "@{body('HTTP')}") + '<p class="note">El resultado se lee con <code>@{body(\'Parse_JSON\')?[\'campo\']}</code>.</p>'; break;
    case 'filter': f = t('from', 'From', "@{body('Parse_JSON')?['lista']}") + `<p class="gtitle">Condición (cada elemento es item())</p>${condUi(p.cond, 'cond.')}`; break;
    case 'select': f = t('from', 'From', "@{body('Filter_array')}") + `<label class="row" style="margin:6px 0 10px"><input type="checkbox" data-k="textMode"${p.textMode ? ' checked' : ''} style="width:auto"> Modo texto (un valor por elemento)</label>` + (p.textMode ? t('value', 'Valor', "@{item()?['id']}") : `<p class="gtitle">Map</p>${rowsUi(p.fields, 'fields', 'clave', "@{item()?['campo']}")}`); break;
    case 'csv': f = t('from', 'From', "@{body('Select')}") + '<p class="note">Las columnas salen de las claves de los objetos.</p>'; break;
    case 'if': f = `<p class="gtitle">Condición</p>${condUi(p.cond, 'cond.')}<p class="note">Después de la Condition, el flujo sigue con lo que esté debajo.</p>`; break;
    case 'router': f = t('on', 'On', "@{triggerBody()?['prioridad']}") + '<p class="gtitle">Casos</p>' + n.branches.map((b, i) => b.fallback ? '' : `<div class="rowcard"><input data-b="${i}" data-f="name" value="${esc(b.name)}" aria-label="Nombre del caso" placeholder="nombre"><input class="mono" data-b="${i}" data-f="value" value="${esc(b.value || '')}" aria-label="Equals" placeholder="es igual a"><button type="button" class="x" data-act="brdel" data-i="${i}" aria-label="Quitar">×</button></div>`).join('') + `<button type="button" class="btn line sm" data-act="bradd">+ Agregar caso</button><p class="note" style="margin-top:8px">Si ningún caso coincide, se ejecuta el Default.</p>`; break;
    case 'foreach': f = t('from', 'Select an output from previous steps', "@{body('List_rows_present_in_a_table')?['value']}") + '<p class="note">Adentro, el elemento actual es <code>@{items(\'Apply_to_each\')}</code>. Lo que agregues debajo corre una vez, al terminar.</p>'; break;
    case 'terminate': f = `<label class="fld"><span>Status</span><select data-k="status">${['Succeeded', 'Failed', 'Cancelled'].map(m => `<option${p.status === m ? ' selected' : ''}>${m}</option>`).join('')}</select></label>` + (p.status === 'Failed' ? t('code', 'Code', 'DatosInvalidos') + ta('message', 'Message') : ''); break;
    case 'varInit': f = t('name', 'Name', 'total') + `<label class="fld"><span>Type</span><select data-k="type">${['Integer', 'Float', 'String', 'Boolean', 'Array', 'Object'].map(m => `<option${p.type === m ? ' selected' : ''}>${m}</option>`).join('')}</select></label>` + t('value', 'Value', '0'); break;
    case 'varSet': case 'varInc': case 'varAppend': f = t('name', 'Name', 'total') + t('value', 'Value', n.op === 'varInc' ? '1' : ''); break;
    case 'http': f = `<label class="fld"><span>Method</span><select data-k="method">${['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => `<option${p.method === m ? ' selected' : ''}>${m}</option>`).join('')}</select></label>` + t('url', 'URI', 'https://api…') + ta('body', 'Body (opcional)') + '<p class="note">Respuesta: <code>@{body(\'HTTP\')}</code>. Código: <code>@{outputs(\'HTTP\')?[\'statusCode\']}</code>.</p>'; break;
    case 'ai': f = ta('prompt', 'Prompt', 6) + '<p class="note">La respuesta queda en <code>@{body(\'Run_a_prompt\')?[\'text\']}</code>. Incluí en el prompt los datos que la IA tiene que leer.</p>'; break;
    case 'crm': f = t('table', 'Table name', 'Contacts', false) + t('email', 'Email') + t('name', 'Nombre') + `<p class="gtitle">Otras columnas</p>${rowsUi(p.props || (p.props = []), 'props', 'columna', 'valor o expresión')}`; break;
    case 'task': f = t('list', 'Plan', 'Soporte', false) + t('title', 'Title') + ta('description', 'Description') + t('due', 'Due Date', '2026-12-01'); break;
    case 'sheetsRead': f = t('doc', 'File', 'Ventas.xlsx', false) + t('sheet', 'Table', 'Ventas', false) + '<p class="note">Las filas quedan en <code>@{body(\'List_rows_present_in_a_table\')?[\'value\']}</code>.</p>'; break;
    case 'sheets': f = t('doc', 'File', 'Finanzas.xlsx', false) + t('sheet', 'Table', 'Gastos', false) + `<p class="gtitle">Columnas</p>${rowsUi(p.columns, 'columns', 'columna', 'valor o expresión')}`; break;
    case 'file': f = t('folder', 'Folder Path', '/Backups') + t('name', 'File Name', 'archivo.csv') + ta('content', 'File Content'); break;
    case 'pbi': f = t('dataset', 'Dataset', 'KPIs', false) + t('table', 'Table', 'Diario', false) + `<p class="gtitle">Columnas</p>${rowsUi(p.columns, 'columns', 'columna', 'valor o expresión')}`; break;
    case 'desktop': f = t('flowName', 'Desktop flow', 'CargarPedidoERP', false) + `<p class="gtitle">Entradas</p>${rowsUi(p.inputs, 'inputs', 'variable', 'valor o expresión')}<p class="note">Las salidas se leen con <code>@{body('${esc(n.name.replace(/ /g, '_'))}')?['salida']}</code>.</p>`; break;
    case 'respond': f = `<p class="gtitle">Salidas</p>${rowsUi(p.outputs, 'outputs', 'nombre', 'valor o expresión')}`; break;
    case 'mail': f = t('to', 'To') + t('subject', 'Subject') + ta('body', 'Body'); break;
    case 'slack': f = t('channel', 'Canal de Teams', 'Ventas', false) + ta('text', 'Message'); break;
    case 'approval': f = `<label class="fld"><span>Approval type</span><select disabled><option>Approve/Reject - First to respond</option></select></label>` + t('assignedTo', 'Assigned to', 'persona@empresa.com') + t('title', 'Title') + ta('details', 'Details') + `<p class="note">El flujo espera la respuesta. El resultado queda en <code>@{body('${esc(n.name.replace(/ /g, '_'))}')?['outcome']}</code>: Approve o Reject.</p>`; break;
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
  else if (act === 'rowadd') { (n.p[b.dataset.r] ||= []).push({ name: '', value: '' }); saveFlow(); openProps(n.id); }
  else if (act === 'rowdel') { n.p[b.dataset.r].splice(+b.dataset.i, 1); saveFlow(); openProps(n.id); }
  else if (act === 'bradd') { n.branches.splice(n.branches.length - 1, 0, { name: 'Case ' + n.branches.length, value: '', steps: [] }); saveFlow(); render(); openProps(n.id); }
  else if (act === 'brdel') { if (n.branches.length <= 2) return toast('El Switch necesita al menos un caso además del Default.'); n.branches.splice(+b.dataset.i, 1); state.ins = null; saveFlow(); render(); openProps(n.id); }
});
function onDrawerInput(e) {
  const el = e.target, n = state.sel && findNode(state.sel); if (!n) return;
  const val = el.type === 'checkbox' ? el.checked : el.value;
  if (el.dataset.name !== undefined) { n.name = val || P[state.pf].cat[n.op][0]; $('#drawerTitle').textContent = n.name; }
  else if (el.dataset.k) { n.p[el.dataset.k] = val; if (['textMode', 'status'].includes(el.dataset.k)) { state.run = null; saveFlow(); openProps(n.id); return; } }
  else if (el.dataset.r) n.p[el.dataset.r][+el.dataset.i][el.dataset.f] = val;
  else if (el.dataset.c) { const [where, key] = el.dataset.c.split('.'); (where === 'cond' ? n.p.cond : n.branches[+where.slice(1)].cond)[key] = val; }
  else if (el.dataset.b) n.branches[+el.dataset.b][el.dataset.f] = val;
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
  view.innerHTML = { home, auth, dash, platform, project, sap }[state.view]();
  if (state.view === 'project') { const m = $('#propMount'); if (m) { if (!state.sel || !findNode(state.sel)) { state.sel = null; propsEmpty(); } m.appendChild(dBody); } }
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-go],[data-auth],[data-tab],[data-proj],[data-act],[data-add],[data-node],[data-quiz],[data-pal],[data-ptab]'); if (!el) return;
  const d = el.dataset;
  if (d.go) { if (P[d.go]) go('platform', { pf: d.go, tab: d.keepTab || 'lecciones' }); else go(d.go, { pf: null, ...(d.go === 'sap' ? { tab: 'lecciones' } : {}) }); return; }
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
    case 'read': mark(`${state.view === 'sap' ? 'sap' : pf}:L${d.i}`); toast('Lección marcada como leída.'); return render();
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
if (location.hash === '#sap') { state.view = 'sap'; state.tab = 'lecciones'; }
render();
})();
