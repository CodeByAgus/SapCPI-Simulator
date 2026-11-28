/* flowDev · SAP SuccessFactors: contenido de la plataforma (Employee Central, ausencias, objetivos y selección) */
(() => {
const { eq, match, numEq, row, rows, all, photo, n } = window.FD;
const APP = 'SAP SuccessFactors';
const POS = [['50001021', '50001021 · Analista de datos jr. (Finanzas)'], ['50001034', '50001034 · Analista de integración jr. (Sistemas)'], ['50001040', '50001040 · Supervisor/a de depósito (Logística)'], ['50001052', '50001052 · Analista de RRHH (Personas)']];
const RAZON_ALTA = ['Nueva contratación', 'Recontratación', 'Transferencia entre empresas'];
const RAZON_CAMBIO = ['Promoción', 'Transferencia lateral', 'Cambio de jefe', 'Reorganización'];
const BIEN = [{ k: 'gen', label: 'Género', type: 'select', opts: ['Femenino', 'Masculino', 'No binario', 'Prefiere no decirlo'] }];
window.FD_PLAT = {
  id: 'successfactors', name: 'SAP SuccessFactors', mark: 'sf', vendor: 'SAP', area: 'Personas y RRHH', role: 'Analista de RRHH · HRIS jr.', hours: 6,
  roles: ['Analista de RRHH', 'Analista HRIS', 'Consultor/a SuccessFactors jr.'],
  blurb: 'Gestionás personas en la suite de RRHH de SAP: altas, cambios de puesto, ausencias, objetivos de desempeño y búsquedas. Cada pedido llega de un jefe o de RRHH como en el día a día.',
  context: 'SuccessFactors es la suite de RRHH en la nube de SAP y la usan muchas empresas grandes de la región. Saber registrar eventos de personal con la fecha y el motivo correctos es la base de un puesto de analista de RRHH o HRIS: de eso dependen la liquidación de sueldos, los reportes y las auditorías.',
  photo: photo('1573497620053-ea5300f94f21', 'Dos personas conversando en una entrevista de trabajo'),
  lessons: [
    { t: 'Qué es SuccessFactors', body: [
      '<p><b>SAP SuccessFactors</b> es la suite de recursos humanos en la nube de SAP. Se organiza en módulos que se contratan por separado:</p><ul><li><b>Employee Central</b> (EC): el legajo, la estructura organizativa y los eventos del empleado.</li><li><b>Time Off</b>: vacaciones, licencias y ausencias.</li><li><b>Performance &amp; Goals</b>: objetivos y evaluaciones de desempeño.</li><li><b>Recruiting</b> y <b>Onboarding</b>: búsquedas, candidatos e incorporación.</li><li><b>Learning</b>: capacitaciones.</li></ul>',
      '<p>Employee Central es el centro: los otros módulos toman de ahí quién es cada persona, su puesto y su jefe.</p>',
      '<p>Se usa desde el navegador. Cada persona ve lo que le permiten sus <b>permisos por rol</b> (Role-Based Permissions): un empleado ve su perfil, un jefe ve a su equipo, RRHH ve a toda la empresa.</p>'],
      quiz: [
        ['¿Qué módulo guarda el legajo y la estructura organizativa?', ['Employee Central', 'Learning', 'Recruiting', 'Time Off'], 'Es el núcleo de la suite.'],
        ['¿Qué módulo maneja vacaciones y licencias?', ['Time Off', 'Performance & Goals', 'Onboarding', 'Learning'], 'Se integra con el legajo de Employee Central.'],
        ['¿Qué controla lo que ve cada persona?', ['Los permisos por rol', 'El navegador', 'El horario', 'Nada, todos ven todo'], 'Role-Based Permissions (RBP).'],
        ['¿De dónde toman los otros módulos el puesto y el jefe de cada persona?', ['De Employee Central', 'De Excel', 'De Recruiting', 'De Learning'], 'Por eso un legajo mal cargado afecta todo.'],
      ] },
    { t: 'Estructura organizativa y puestos', body: [
      '<p>La estructura se arma con <b>objetos de fundación</b>: <b>empresa</b> (entidad legal), <b>unidad de negocio</b>, <b>división</b>, <b>departamento</b> y <b>ubicación</b>.</p>',
      '<p>En muchas implementaciones se trabaja con <b>gestión de posiciones</b>: cada <b>posición</b> es un lugar en el organigrama (por ejemplo <i>Analista de datos jr. de Finanzas</i>) que existe aunque esté vacante. Al contratar a alguien se lo asigna a una posición y hereda su departamento, ubicación, jefe y clasificación del puesto.</p>',
      '<p>La <b>clasificación del puesto</b> (Job Classification) agrupa puestos similares y suele definir la <b>banda salarial</b> (pay grade).</p>',
      '<p>Así, cuando RRHH pide un reporte de vacantes o un organigrama, sale directo del sistema.</p>'],
      quiz: [
        ['¿Qué es una posición?', ['Un lugar del organigrama que existe aunque esté vacante', 'Un empleado', 'Un sueldo', 'Una ausencia'], 'La persona se asigna a la posición.'],
        ['Al contratar a alguien en una posición, ¿qué hereda?', ['Departamento, ubicación, jefe y clasificación', 'Nada', 'Solo el nombre', 'El sueldo del anterior'], 'Evita cargar datos a mano.'],
        ['¿Qué suele definir la clasificación del puesto?', ['La banda salarial', 'El horario', 'El género', 'La contraseña'], 'Agrupa puestos similares.'],
        ['¿Cuál es un objeto de fundación?', ['Departamento', 'Objetivo de desempeño', 'Candidato', 'Vacaciones'], 'También empresa, división y ubicación.'],
      ] },
    { t: 'Eventos del empleado y fecha de vigencia', body: [
      '<p>Todo cambio en la vida laboral es un <b>evento</b> con un <b>motivo</b> (event reason) y una <b>fecha de vigencia</b>:</p><table><tr><th>Evento</th><th>Motivos típicos</th></tr><tr><td>Contratación</td><td>Nueva contratación, recontratación</td></tr><tr><td>Cambio de datos del puesto</td><td>Promoción, transferencia lateral, cambio de jefe</td></tr><tr><td>Baja</td><td>Renuncia, despido, jubilación</td></tr></table>',
      '<p>Employee Central guarda la <b>historia con fechas</b> (effective dating): si una promoción rige desde el 1 de diciembre, hasta el 30 de noviembre el sistema muestra el puesto anterior. Por eso se carga la fecha real del cambio, no la fecha en que se tipea.</p>',
      '<p>Los cambios importantes pueden pasar por un <b>workflow de aprobación</b> (por ejemplo, el jefe del jefe y RRHH) antes de quedar registrados.</p>'],
      quiz: [
        ['¿Qué fecha se carga en una promoción?', ['La fecha desde la que rige el cambio', 'La fecha en que se tipea', 'El 1 de enero', 'Cualquiera'], 'Es la fecha de vigencia.'],
        ['¿Qué tiene todo evento además de la fecha?', ['Un motivo (event reason)', 'Un candidato', 'Una foto', 'Un objetivo'], 'El motivo explica por qué cambió el registro.'],
        ['¿Qué es el effective dating?', ['Guardar la historia de cada dato con sus fechas de vigencia', 'Borrar datos viejos', 'Cambiar la zona horaria', 'Una evaluación'], 'Permite ver cómo estaba el legajo en cualquier fecha.'],
        ['¿Para qué sirve un workflow de aprobación?', ['Para que otros aprueben un cambio antes de registrarlo', 'Para liquidar sueldos', 'Para buscar candidatos', 'Para cargar vacaciones'], 'Por ejemplo, jefe y RRHH.'],
      ] },
    { t: 'Ausencias (Time Off)', body: [
      '<p>En <b>Time Off</b> cada empleado tiene <b>cuentas</b> por tipo de ausencia (vacaciones, día de estudio…) con su <b>saldo</b>. Al pedir una ausencia se elige el <b>tipo</b>, el desde y el hasta; el sistema descuenta los días hábiles según el <b>calendario de trabajo</b> y los feriados.</p>',
      '<p>Algunos tipos requieren aprobación del jefe; otros, como una licencia por enfermedad, requieren adjuntar un certificado.</p>',
      '<p>En Argentina las vacaciones se cuentan en días corridos según la ley de contrato de trabajo, aunque muchas empresas las gestionan en días hábiles por política interna: la regla se configura en el sistema y el analista tiene que conocerla.</p>'],
      quiz: [
        ['¿Qué controla el saldo disponible de vacaciones?', ['La cuenta de ausencias del empleado', 'El jefe a mano', 'El calendario de Outlook', 'Nada'], 'Cada tipo de ausencia tiene su cuenta.'],
        ['¿De qué depende cuántos días descuenta una ausencia?', ['Del calendario de trabajo, los feriados y la regla configurada', 'Del humor del jefe', 'Del navegador', 'De la hora'], 'Hábiles o corridos según la regla.'],
        ['¿Qué suele pedir una licencia por enfermedad?', ['Un certificado adjunto', 'Una entrevista', 'Un objetivo', 'Nada'], 'Depende de la configuración.'],
        ['¿Quién aprueba habitualmente las vacaciones?', ['El jefe directo', 'El candidato', 'Sistemas', 'Nadie'], 'Por workflow.'],
      ] },
    { t: 'Objetivos, desempeño y selección', body: [
      '<p>En <b>Performance &amp; Goals</b> cada persona tiene un <b>plan de objetivos</b>. Un buen objetivo es <b>SMART</b>: específico, medible, alcanzable, relevante y con fecha. Cada objetivo tiene una <b>métrica</b> y un <b>peso</b>; los pesos del plan suman 100%.</p>',
      '<p>En <b>Recruiting</b> todo empieza con una <b>requisición</b> (job requisition): la solicitud de cubrir una posición. Indica la posición, la cantidad de vacantes, el <b>hiring manager</b> (el jefe que decide) y el <b>reclutador/a</b>. Aprobada la requisición, se publica el aviso y llegan los candidatos.</p>',
      '<p>Cuando se elige a alguien, Onboarding y Employee Central toman los datos de la requisición para la contratación: por eso conviene cargarla completa desde el principio.</p>'],
      quiz: [
        ['¿Cuánto deben sumar los pesos de un plan de objetivos?', ['100%', '50%', 'Lo que se quiera', '10%'], 'Cada objetivo tiene su peso.'],
        ['¿Qué significa que un objetivo sea medible?', ['Que tiene una métrica para saber si se cumplió', 'Que es largo', 'Que lo aprueba RRHH', 'Que no tiene fecha'], 'La M de SMART.'],
        ['¿Con qué empieza una búsqueda en Recruiting?', ['Con una requisición', 'Con la contratación', 'Con el onboarding', 'Con la evaluación'], 'Es la solicitud para cubrir una posición.'],
        ['¿Quién es el hiring manager?', ['El jefe que decide la contratación', 'El candidato', 'El reclutador', 'El sistema'], 'El reclutador gestiona el proceso.'],
      ] },
  ],
  tickets: [
    { id: 'alta', num: '7101', title: 'Alta de la nueva analista de datos', from: 'Sofía Herrera · Jefa de RRHH', prio: 'Prioridad alta', level: 'Inicial',
      desc: 'Ingresa Valentina Ruiz como analista de datos jr. en Finanzas el martes 1 de diciembre. La posición ya existe y está vacante. Cargá la contratación para que entre en la liquidación de diciembre.',
      reqs: ['Empresa <code>Distribuidora Andina SA</code>.', 'Motivo <b>Nueva contratación</b>, fecha de ingreso 01/12/2026.', 'Nombre <code>Valentina</code>, apellido <code>Ruiz</code>.', 'Posición <code>50001021</code>.', 'Tipo de empleo: tiempo completo.'],
      data: [{ name: 'oferta-aceptada.txt', body: 'Candidata: Valentina Ruiz\nPuesto: Analista de datos jr. · Finanzas\nPosición: 50001021\nIngreso: 01/12/2026\nJornada: completa (9 a 18 h)' }],
      hints: ['La fecha es la de ingreso, no la de hoy.', 'Al elegir la posición, el departamento y el jefe se completan solos.'],
      ws: { type: 'form', app: APP, screen: 'Employee Central · Agregar empleado nuevo', tabs: [
        { label: 'Identidad', fields: [{ k: 'emp', label: 'Empresa', type: 'select', opts: ['Distribuidora Andina SA', 'Andina Logística SRL'] }, { k: 'fecha', label: 'Fecha de ingreso', type: 'date' }, { k: 'mot', label: 'Motivo del evento', type: 'select', opts: RAZON_ALTA }, { k: 'nom', label: 'Nombre' }, { k: 'ape', label: 'Apellido' }, ...BIEN] },
        { label: 'Información del puesto', fields: [{ k: 'pos', label: 'Posición', type: 'select', opts: POS }, { k: 'tipo', label: 'Tipo de empleo', type: 'select', opts: ['Tiempo completo', 'Tiempo parcial', 'Pasantía'] }] } ] },
      checks: [
        { t: 'Empresa y motivo de alta', ok: all(eq('emp', 'Distribuidora Andina SA'), eq('mot', 'Nueva contratación')) },
        { t: 'Fecha de ingreso 01/12/2026', ok: eq('fecha', '2026-12-01'), why: 'Se carga la fecha en que rige el ingreso.' },
        { t: 'Nombre y apellido', ok: all(eq('nom', 'Valentina'), eq('ape', 'Ruiz')) },
        { t: 'Posición y jornada', ok: all(eq('pos', '50001021'), eq('tipo', 'Tiempo completo')) },
      ],
      solve: { v: { emp: 'Distribuidora Andina SA', fecha: '2026-12-01', mot: 'Nueva contratación', nom: 'Valentina', ape: 'Ruiz', pos: '50001021', tipo: 'Tiempo completo' } } },
    { id: 'promocion', num: '7102', title: 'Promoción de Tomás a supervisor', from: 'Javier Sosa · Encargado de depósito', prio: 'Prioridad media', level: 'Intermedio',
      desc: 'Tomás Acuña (ID 10458) pasa a supervisor de depósito desde el 1 de enero, con un aumento a $1.450.000 brutos mensuales. Ya lo aprobó la gerencia.',
      reqs: ['Empleado <code>10458</code>.', 'Evento <b>cambio de datos del puesto</b>, motivo <b>Promoción</b>.', 'Vigencia 01/01/2027.', 'Nueva posición <code>50001040</code>.', 'Sueldo base mensual <code>1450000</code>.'],
      hints: ['La vigencia es el 1 de enero de 2027, aunque lo cargues hoy.'],
      ws: { type: 'form', app: APP, screen: 'Employee Central · Tomás Acuña · Tomar acción', fields: [
        { k: 'id', label: 'ID de empleado' }, { k: 'ev', label: 'Evento', type: 'select', opts: ['Cambio de datos del puesto', 'Contratación', 'Baja'] },
        { k: 'mot', label: 'Motivo', type: 'select', opts: RAZON_CAMBIO }, { k: 'fecha', label: 'Fecha de vigencia', type: 'date' },
        { k: 'pos', label: 'Nueva posición', type: 'select', opts: POS }, { k: 'sueldo', label: 'Sueldo base mensual (ARS)', type: 'number' } ] },
      checks: [
        { t: 'Empleado correcto', ok: eq('id', '10458') },
        { t: 'Cambio de puesto por promoción', ok: all(eq('ev', 'Cambio de datos del puesto'), eq('mot', 'Promoción')) },
        { t: 'Vigencia 01/01/2027', ok: eq('fecha', '2027-01-01') },
        { t: 'Posición y sueldo nuevos', ok: all(eq('pos', '50001040'), numEq('sueldo', 1450000)) },
      ],
      solve: { v: { id: '10458', ev: 'Cambio de datos del puesto', mot: 'Promoción', fecha: '2027-01-01', pos: '50001040', sueldo: '1450000' } } },
    { id: 'vacaciones', num: '7103', title: 'Cargar las vacaciones de Marina', from: 'Marina Ríos · Jefa de Compras', prio: 'Prioridad baja', level: 'Inicial',
      desc: 'Me tomo vacaciones del lunes 4 al viernes 15 de enero y no puedo entrar al portal desde el celular. ¿Me las cargás? Queda a cargo Laura Gómez.',
      reqs: ['Tipo <b>Vacaciones</b>.', 'Desde 04/01/2027 hasta 15/01/2027.', 'Días hábiles: 10.', 'Comentario: <code>Reemplazo: Laura Gómez</code>.'],
      hints: ['Del lunes 4 al viernes 15 hay dos semanas laborales.'],
      ws: { type: 'form', app: APP, screen: 'Time Off · Marina Ríos · Solicitar ausencia', fields: [
        { k: 'tipo', label: 'Tipo de ausencia', type: 'select', opts: ['Vacaciones', 'Día de estudio', 'Licencia por enfermedad', 'Licencia por mudanza'] },
        { k: 'desde', label: 'Desde', type: 'date' }, { k: 'hasta', label: 'Hasta', type: 'date' },
        { k: 'dias', label: 'Días hábiles solicitados', type: 'number' }, { k: 'com', label: 'Comentario', wide: true } ] },
      checks: [
        { t: 'Tipo vacaciones', ok: eq('tipo', 'Vacaciones') },
        { t: 'Período correcto', ok: all(eq('desde', '2027-01-04'), eq('hasta', '2027-01-15')) },
        { t: '10 días hábiles', ok: numEq('dias', 10) },
        { t: 'Reemplazo indicado', ok: match('com', /laura g[oó]mez/i) },
      ],
      solve: { v: { tipo: 'Vacaciones', desde: '2027-01-04', hasta: '2027-01-15', dias: '10', com: 'Reemplazo: Laura Gómez' } } },
    { id: 'objetivos', num: '7104', title: 'Plan de objetivos de un analista', from: 'Sofía Herrera · Jefa de RRHH', prio: 'Prioridad media', level: 'Intermedio',
      desc: 'Arranca el ciclo de desempeño 2027. Cargá el plan de objetivos que acordó Laura Gómez con su jefe. Los pesos tienen que sumar 100.',
      reqs: ['Objetivo “Cierre mensual en 5 días hábiles”, métrica <code>días de cierre</code>, peso 50.', 'Objetivo “Automatizar 3 reportes con Power BI”, métrica <code>reportes automatizados</code>, peso 30.', 'Objetivo “Completar curso de SQL”, métrica <code>certificado obtenido</code>, peso 20.', 'Fecha límite de todos: 31/12/2027.'],
      hints: ['50 + 30 + 20 = 100.'],
      ws: { type: 'form', app: APP, screen: 'Performance & Goals · Plan de objetivos 2027 · Laura Gómez', fields: [{ k: 'plan', label: 'Plan', type: 'select', opts: ['Objetivos 2026', 'Objetivos 2027'] }, { k: 'venc', label: 'Fecha límite', type: 'date' }],
        grid: { label: 'Objetivos', cols: [{ k: 'obj', label: 'Objetivo' }, { k: 'met', label: 'Métrica' }, { k: 'peso', label: 'Peso %', type: 'number' }], start: [{ obj: '', met: '', peso: '' }] } },
      checks: [
        { t: 'Plan 2027 con fecha límite', ok: all(eq('plan', 'Objetivos 2027'), eq('venc', '2027-12-31')) },
        { t: 'Objetivo de cierre (50%)', ok: row({ obj: /cierre mensual/i, met: /d[ií]as de cierre/i, peso: 50 }) },
        { t: 'Objetivo de Power BI (30%)', ok: row({ obj: /power bi/i, met: /reportes automatizados/i, peso: 30 }) },
        { t: 'Objetivo de SQL (20%)', ok: row({ obj: /sql/i, met: /certificado/i, peso: 20 }) },
        { t: 'Pesos suman 100', ok: s => Math.round(s.grid.reduce((a, r) => a + (Number(r.peso) || 0), 0)) === 100 && rows(3)(s) },
      ],
      solve: { v: { plan: 'Objetivos 2027', venc: '2027-12-31' }, grid: [{ obj: 'Cierre mensual en 5 días hábiles', met: 'días de cierre', peso: '50' }, { obj: 'Automatizar 3 reportes con Power BI', met: 'reportes automatizados', peso: '30' }, { obj: 'Completar curso de SQL', met: 'certificado obtenido', peso: '20' }] } },
    { id: 'requisicion', num: '7105', title: 'Abrir la búsqueda de analista de integración', from: 'Diego Paz · Jefe de Sistemas', prio: 'Prioridad alta', level: 'Avanzado',
      desc: 'Necesito sumar una persona al equipo de integración (posición 50001034). Yo hago las entrevistas técnicas; la búsqueda la lleva Sofía de RRHH. Publicalo solo en el portal externo, es remoto con presencialidad un día por semana.',
      reqs: ['Posición <code>50001034</code>, 1 vacante.', 'Hiring manager: <b>Diego Paz</b>; reclutadora: <b>Sofía Herrera</b>.', 'Modalidad <b>Híbrida</b>.', 'Publicación: <b>Portal externo</b>.'],
      hints: ['El hiring manager es quien decide; el reclutador gestiona.'],
      ws: { type: 'form', app: APP, screen: 'Recruiting · Crear requisición', fields: [
        { k: 'pos', label: 'Posición', type: 'select', opts: POS }, { k: 'vac', label: 'Cantidad de vacantes', type: 'number' },
        { k: 'hm', label: 'Hiring manager', type: 'select', opts: ['Diego Paz', 'Sofía Herrera', 'Marina Ríos'] }, { k: 'rec', label: 'Reclutador/a', type: 'select', opts: ['Diego Paz', 'Sofía Herrera', 'Marina Ríos'] },
        { k: 'mod', label: 'Modalidad', type: 'select', opts: ['Presencial', 'Híbrida', 'Remota'] }, { k: 'pub', label: 'Publicación', type: 'select', opts: ['Solo interna', 'Portal externo', 'Interna y externa'] } ] },
      checks: [
        { t: 'Posición y vacantes', ok: all(eq('pos', '50001034'), numEq('vac', 1)) },
        { t: 'Roles de la búsqueda', ok: all(eq('hm', 'Diego Paz'), eq('rec', 'Sofía Herrera')), why: 'Diego decide (hiring manager); Sofía gestiona (reclutadora).' },
        { t: 'Híbrida', ok: eq('mod', 'Híbrida') },
        { t: 'Publicada en el portal externo', ok: eq('pub', 'Portal externo') },
      ],
      solve: { v: { pos: '50001034', vac: '1', hm: 'Diego Paz', rec: 'Sofía Herrera', mod: 'Híbrida', pub: 'Portal externo' } } },
  ],
  final: {
    num: '7190', company: 'Distribuidora Andina', from: 'Sofía Herrera · Jefa de RRHH', title: 'Incorporar a la nueva analista de RRHH',
    certTitle: 'Proyecto final de SAP SuccessFactors: ciclo de incorporación de una posición',
    brief: '“Se libera la posición de analista de RRHH. Quiero el ciclo completo en el sistema: la búsqueda, el alta de quien quede seleccionada y su plan de objetivos del primer año. Sin pasos manuales por fuera.”',
    why: 'Es el recorrido completo de una incorporación: Recruiting, Employee Central y Performance & Goals. Podés contarlo como “gestioné en SuccessFactors el ciclo requisición → contratación → objetivos de una posición”.',
    parts: [
      { title: 'Requisición de la búsqueda', structure: 'Recruiting: posición, vacantes, hiring manager, reclutador, modalidad y publicación', from: 'Sofía Herrera · Jefa de RRHH',
        desc: 'Posición 50001052. La decisión final la toma Sofía (es su equipo) y la búsqueda la lleva Marina Ríos, que está colaborando con RRHH. Presencial, publicada interna y externamente.',
        reqs: ['Posición <code>50001052</code>, 1 vacante.', 'Hiring manager Sofía Herrera, reclutadora Marina Ríos.', 'Presencial; publicación interna y externa.'],
        why: 'Una requisición completa evita volver a cargar datos al contratar.',
        ws: { type: 'form', app: APP, screen: 'Recruiting · Crear requisición', fields: [
          { k: 'pos', label: 'Posición', type: 'select', opts: POS }, { k: 'vac', label: 'Cantidad de vacantes', type: 'number' },
          { k: 'hm', label: 'Hiring manager', type: 'select', opts: ['Diego Paz', 'Sofía Herrera', 'Marina Ríos'] }, { k: 'rec', label: 'Reclutador/a', type: 'select', opts: ['Diego Paz', 'Sofía Herrera', 'Marina Ríos'] },
          { k: 'mod', label: 'Modalidad', type: 'select', opts: ['Presencial', 'Híbrida', 'Remota'] }, { k: 'pub', label: 'Publicación', type: 'select', opts: ['Solo interna', 'Portal externo', 'Interna y externa'] } ] },
        checks: [
          { t: 'Posición 50001052 · 1 vacante', ok: all(eq('pos', '50001052'), numEq('vac', 1)) },
          { t: 'Hiring manager y reclutadora', ok: all(eq('hm', 'Sofía Herrera'), eq('rec', 'Marina Ríos')) },
          { t: 'Presencial, interna y externa', ok: all(eq('mod', 'Presencial'), eq('pub', 'Interna y externa')) } ],
        solve: { v: { pos: '50001052', vac: '1', hm: 'Sofía Herrera', rec: 'Marina Ríos', mod: 'Presencial', pub: 'Interna y externa' } } },
      { title: 'Contratación', structure: 'Employee Central: empresa, motivo, fecha de vigencia, datos y posición', from: 'Sofía Herrera · Jefa de RRHH',
        desc: 'Quedó seleccionada Camila Ortiz. Ya había trabajado en la empresa hasta 2024. Ingresa el 2 de febrero de 2027, jornada completa.',
        reqs: ['Distribuidora Andina SA.', 'Motivo correcto para alguien que vuelve a la empresa.', 'Ingreso 02/02/2027.', 'Camila Ortiz en la posición 50001052, tiempo completo.'],
        why: 'El motivo correcto mantiene la antigüedad y los reportes de rotación bien calculados.',
        ws: { type: 'form', app: APP, screen: 'Employee Central · Agregar empleado nuevo', tabs: [
          { label: 'Identidad', fields: [{ k: 'emp', label: 'Empresa', type: 'select', opts: ['Distribuidora Andina SA', 'Andina Logística SRL'] }, { k: 'fecha', label: 'Fecha de ingreso', type: 'date' }, { k: 'mot', label: 'Motivo del evento', type: 'select', opts: RAZON_ALTA }, { k: 'nom', label: 'Nombre' }, { k: 'ape', label: 'Apellido' }, ...BIEN] },
          { label: 'Información del puesto', fields: [{ k: 'pos', label: 'Posición', type: 'select', opts: POS }, { k: 'tipo', label: 'Tipo de empleo', type: 'select', opts: ['Tiempo completo', 'Tiempo parcial', 'Pasantía'] }] } ] },
        checks: [
          { t: 'Recontratación en Distribuidora Andina', ok: all(eq('emp', 'Distribuidora Andina SA'), eq('mot', 'Recontratación')), why: 'Camila ya trabajó en la empresa: es una recontratación.' },
          { t: 'Ingreso 02/02/2027', ok: eq('fecha', '2027-02-02') },
          { t: 'Camila Ortiz', ok: all(eq('nom', 'Camila'), eq('ape', 'Ortiz')) },
          { t: 'Posición 50001052 a tiempo completo', ok: all(eq('pos', '50001052'), eq('tipo', 'Tiempo completo')) } ],
        solve: { v: { emp: 'Distribuidora Andina SA', fecha: '2027-02-02', mot: 'Recontratación', nom: 'Camila', ape: 'Ortiz', pos: '50001052', tipo: 'Tiempo completo' } } },
      { title: 'Objetivos del primer año', structure: 'Performance & Goals: plan, fecha límite y objetivos con métrica y peso (suman 100)', from: 'Sofía Herrera · Jefa de RRHH',
        desc: 'Acordamos tres objetivos para Camila en 2027: reducir el tiempo de alta de empleados, digitalizar legajos y armar el tablero de rotación.',
        reqs: ['Plan Objetivos 2027, fecha límite 31/12/2027.', '“Alta de empleados en 48 h”, métrica <code>horas promedio de alta</code>, peso 40.', '“Digitalizar el 100% de los legajos”, métrica <code>% de legajos digitales</code>, peso 35.', '“Tablero de rotación mensual”, métrica <code>tablero publicado</code>, peso 25.'],
        why: 'Objetivos medibles desde el ingreso hacen justa la evaluación de fin de año.',
        ws: { type: 'form', app: APP, screen: 'Performance & Goals · Plan de objetivos 2027 · Camila Ortiz', fields: [{ k: 'plan', label: 'Plan', type: 'select', opts: ['Objetivos 2026', 'Objetivos 2027'] }, { k: 'venc', label: 'Fecha límite', type: 'date' }],
          grid: { label: 'Objetivos', cols: [{ k: 'obj', label: 'Objetivo' }, { k: 'met', label: 'Métrica' }, { k: 'peso', label: 'Peso %', type: 'number' }], start: [{ obj: '', met: '', peso: '' }] } },
        checks: [
          { t: 'Plan 2027 con fecha límite', ok: all(eq('plan', 'Objetivos 2027'), eq('venc', '2027-12-31')) },
          { t: 'Alta en 48 h (40%)', ok: row({ obj: /48\s*h/i, met: /horas promedio/i, peso: 40 }) },
          { t: 'Legajos digitales (35%)', ok: row({ obj: /legajos/i, met: /% de legajos|legajos digitales/i, peso: 35 }) },
          { t: 'Tablero de rotación (25%)', ok: row({ obj: /rotaci[oó]n/i, met: /tablero publicado/i, peso: 25 }) },
          { t: 'Tres objetivos que suman 100', ok: s => rows(3)(s) && Math.round(s.grid.reduce((a, r) => a + (Number(r.peso) || 0), 0)) === 100 } ],
        solve: { v: { plan: 'Objetivos 2027', venc: '2027-12-31' }, grid: [{ obj: 'Alta de empleados en 48 h', met: 'horas promedio de alta', peso: '40' }, { obj: 'Digitalizar el 100% de los legajos', met: '% de legajos digitales', peso: '35' }, { obj: 'Tablero de rotación mensual', met: 'tablero publicado', peso: '25' }] } },
    ],
  },
};
})();
