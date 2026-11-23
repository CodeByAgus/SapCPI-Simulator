# flowDev

Plataforma educativa para aprender automatización e integración con flujos en software empresarial: **SAP CPI** y **Microsoft Power Platform**.

## Qué incluye

**Plataformas empresariales**, las que piden las empresas y no se pueden practicar libremente sin licencia:

- **SAP CPI** (`sap-cpi/`): introducción con teoría y el taller de iFlows con editor BPMN, 11 escenarios guiados, 20 cuestionarios teóricos, 9 ejercicios extra y modo libre.
- **Power Platform (Power Automate)** (`power-automate/`): 20 clases con su cuestionario, taller de cloud flows con 11 escenarios guiados, 9 ejercicios extra y modo libre. Incluye Condition, Switch, Apply to each, variables, Terminate, Filter array, Select, CSV, Excel, SharePoint, Teams, Outlook, Dataverse, aprobaciones, AI Builder, Power BI, Power Apps y flujos de escritorio, con las expresiones reales (`@{triggerBody()?['campo']}`, `body('Accion')`, `items('Apply_to_each')`, `variables('x')`).
- **Próximamente:** MuleSoft y KNIME.

Los talleres comparten la misma distribución: barra con selector de ejercicios, paleta, lienzo con el estilo de cada herramienta y panel con las pestañas Ejercicio, Propiedades y Probar. La primera vez que se abre un taller aparece una guía paso a paso (`tour.js`, compartido por los dos talleres); el botón «Cómo se usa» la vuelve a abrir.

## Estructura

```
index.html  styles.css  app.js      landing: inicio, crear cuenta / ingresar y Mi avance
config.js                           datos públicos de Supabase (lo usan todas las páginas)
sap-cpi/
  index.html  sap.css  sap.js       SAP CPI: introducción, 20 clases y lista de escenarios
  taller.html taller.css taller.js  taller de iFlows (editor BPMN y simulador)
power-automate/
  index.html  power-automate.css  power-automate.js
                                    Power Automate: clases, cuestionarios y taller de cloud flows
supabase/schema.sql                 tabla de avance, políticas RLS y límites
vercel.json                         headers de seguridad y caché del sitio
assets/                             imagen para compartir (Open Graph) e íconos
privacidad.html  404.html           privacidad y página de error
robots.txt  sitemap.xml  site.webmanifest  favicon.svg
tour.js                             guía paso a paso de los talleres
admin/                              panel de estadísticas (solo administradores)
supabase/admin.sql                  tabla admins y función admin_stats() del panel
```

Cada carpeta es independiente: tiene su propio HTML, CSS y JS. Las páginas comparten la cuenta y el avance a través de `localStorage` y Supabase. La landing tiene un catálogo chico con los ids de los escenarios de cada plataforma para mostrar Mi avance: si se agregan clases, escenarios o cuestionarios, hay que actualizarlo en `app.js`.

## Cómo funciona

Sitio estático sin build ni servidor propio. Los editores son simuladores: evalúan expresiones, condiciones, bucles y variables en el navegador, y las apps responden con datos de prueba.

- **Sin cuenta:** el avance se guarda en el `localStorage` del navegador.
- **Con cuenta:** las cuentas (email y contraseña, o Google) y el avance se guardan en Supabase. «¿Olvidaste tu contraseña?» (en Ingresar) manda un enlace por email y «Cambiar contraseña» (en Mi avance) cambia la contraseña con la sesión iniciada; las contraseñas nuevas tienen al menos 8 caracteres. La tabla `progress` tiene RLS: cada usuario solo lee y escribe su propia fila. Si `config.js` queda vacío, las cuentas se guardan solo en el navegador.

## Panel de administración

`/admin/` muestra registros, usuarios activos, avance promedio, embudo y contenido más completado. Para activarlo, ejecutar `supabase/admin.sql` en el SQL Editor con el email de tu cuenta en la última línea. La función `admin_stats()` solo responde a las cuentas de la tabla `admins` y devuelve datos anónimos (sin emails ni nombres). Para sumar otro administrador, repetir el `insert` con su email.

El avance del taller de iFlows (escenarios y cuestionarios) se guarda en el navegador y se copia a la cuenta (`sap:P:<id>`, `sap:Q:c<n>`) al abrir el inicio o la página de SAP CPI con la sesión iniciada.

## Desarrollo local

```bash
python -m http.server 8000
```

## Deploy

En Vercel: importar el repositorio con Framework Preset *Other*, sin comando de build. Dirección actual: `https://flowdev-simulators.vercel.app`.

Si cambia el dominio, reemplazarlo en: el `<head>` de cada HTML (canonical y Open Graph), `sitemap.xml`, `robots.txt`, `privacidad.html` y el JSON-LD de `index.html`.

### Seguridad

- `vercel.json` manda los headers de seguridad: CSP, HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `COOP` y `Permissions-Policy`. La CSP necesita `'unsafe-eval'` porque los simuladores evalúan Groovy y expresiones con `new Function`. Si se agrega otro servicio externo (analítica, otra CDN), hay que sumarlo a la CSP.
- La librería de Supabase se carga desde jsDelivr con versión fija y hash de integridad (SRI). Si se actualiza la versión, hay que recalcular el `integrity`.
- La anon key de `config.js` es pública por diseño: la protección son las políticas RLS de `supabase/schema.sql`.

### SEO

Cada página tiene título, descripción, canonical, Open Graph y Twitter Card (la vista previa de LinkedIn usa `assets/og-image.png`, 1200×630). Hay `robots.txt`, `sitemap.xml`, `site.webmanifest`, íconos, datos estructurados (JSON-LD) en el inicio y una página `404.html`.

## Aviso

Proyecto educativo independiente. SAP, Microsoft, Power Platform, Power Automate, MuleSoft y KNIME son marcas de sus respectivos dueños. Los nombres de empresas, hosts y datos de los ejercicios son ficticios.
