# Proyecto final y certificado de cumplimiento

Fecha: 2026-11-26 · Piloto: Power Automate · Estado: borrador para aprobar

## Intención

flowDev existe para que alguien que **quiere mejorar su CV** practique con herramientas empresariales que **no puede pagar sin un empleo**, en un entorno parecido al trabajo real. Practicar no alcanza: esa persona necesita **algo que mostrar** en LinkedIn o en una entrevista. El certificado de cumplimiento es eso, y además es lo que puede traer visitas: cada certificado compartido en LinkedIn lleva gente al sitio.

## Qué se construye

1. **Un proyecto final por plataforma**: un desafío empresarial realista que se resuelve en el mismo taller. El piloto es Power Automate; después se repite en SAP CPI, Claude Code y Conexiones.
2. **Un certificado de cumplimiento** que se emite al aprobar el proyecto final, con una **página pública de verificación**.

## Objetivos

- El proyecto final llega como **un pedido del negocio**, no como una lista de pasos.
- Está dividido en **partes con pistas sobre la estructura**, sin dar la solución.
- Explica **para qué se usa esto en una empresa**, para que la persona sepa contarlo en una entrevista.
- El certificado dice con precisión qué se hizo y se puede **verificar con un enlace**.
- Compartirlo en LinkedIn tiene que ser un clic.

## No objetivos

- No es una certificación oficial de Microsoft, SAP ni Anthropic, y no puede parecerlo.
- No hay revisión manual de entregas.
- El blog de cursos es otro proyecto: se diseña después.

## Anti-objetivos (fracasaría aunque funcione)

- Un certificado que se consigue sin esfuerzo (por ejemplo, con un botón de solución) no vale nada para un reclutador.
- Un certificado que usa logos o nombres de forma que parezca emitido por la marca.
- Un desafío tan difícil o confuso que casi nadie lo termina.

## Enfoques considerados

| Enfoque | Qué ofrece | Qué sacrifica |
|---|---|---|
| **A. Corrección en el navegador y certificado guardado en Supabase** (elegido) | Rápido de construir, usa lo que ya existe | Alguien con conocimientos técnicos puede emitirse uno sin hacer el proyecto |
| B. Corrección en el servidor (función de Supabase) | Nadie puede fabricar un certificado | Más trabajo: la corrección tiene que poder correr en el servidor |
| C. Revisión manual desde el panel | Muy creíble, permite devoluciones | Depende del tiempo del dueño; la persona espera días |

**Elegido: A**, por decisión del dueño del proyecto. Para compensar su debilidad (decisión del diseño): cada certificado **guarda la solución entregada** y la página de verificación la **muestra**, así el trabajo queda a la vista y un certificado vacío se nota. Pasar a B más adelante no cambia la tabla ni la página: solo agrega quién emite.

## Cómo funciona para la persona

1. Completa los **11 escenarios guiados** de Power Automate (la práctica extra y los cuestionarios no son requisito).
2. Se desbloquea el **Proyecto final** en el taller (nueva categoría en el selector y en la pestaña Escenarios). Antes de eso aparece con candado y dice cuántos escenarios faltan.
3. Lo resuelve en el mismo editor. No hay botón **Ver solución**; sí **Verificar**, **Probar** y **Reiniciar**.
4. Al pasar todas las pruebas, si tiene **cuenta**, se emite el certificado. Sin cuenta puede resolverlo, pero para el certificado se le pide crear una (con su nombre real, que es el que va a figurar).
5. Ve su certificado con tres acciones: **Agregar a LinkedIn**, **Copiar enlace** e **Imprimir o guardar como PDF**.

## El desafío del piloto (Power Automate)

Empresa ficticia: **Distribuidora Andina** (la misma de los otros ejercicios y del curso de Conexiones).

**El pedido del negocio:** "Vendemos por la tienda web. Cada pedido tiene que llegar a nuestro sistema, revisar si hay stock de cada producto, avisar a logística si falta algo y confirmarle al cliente por email."

**Partes, cada una con pistas de estructura y una línea de "para qué se usa":**

1. **Recibir el pedido**: llega por HTTP con cliente, email e ítems. Pista: qué trigger recibe datos de otro sistema.
2. **Validar los datos**: si falta el email o no hay ítems, el flujo termina con error claro. Pista: Condition y Terminate.
3. **Revisar el stock de cada ítem**: consulta la API de stock por producto y junta los faltantes. Pista: Apply to each, HTTP y una variable de tipo Array.
4. **Avisar a logística**: solo si hubo faltantes, un mensaje en el canal de Teams de Logística con la lista. Pista: Condition después del bucle y `join()`.
5. **Registrar y confirmar**: agrega el pedido a la tabla de Excel de pedidos y envía el email de confirmación al cliente, que dice si hay demoras. Pista: Add a row y Send an email.

**Pruebas (corrección automática, más exigente que los escenarios):** tres casos que el flujo tiene que pasar a la vez:

- Todo en stock: fila en Excel, email sin demora, sin mensaje a logística.
- Con faltantes: fila en Excel, mensaje a logística con exactamente los productos faltantes, email que avisa la demora.
- Datos inválidos: el flujo termina como fallido y no registra ni envía nada.

Los valores exactos (nombres de canal, tabla, textos) los fija quien construye y los dice el enunciado de cada parte.

## El certificado

**Qué dice:** nombre de la persona · "completó el proyecto final de Power Automate en flowDev" · qué incluyó (11 escenarios guiados y el desafío "Pedidos de la tienda web": trigger HTTP, validación, Apply to each, variables, Teams, Excel y Outlook) · fecha · código de verificación.

**Aviso fijo:** "flowDev es un proyecto educativo independiente. Este certificado acredita la práctica en un simulador y no es una certificación oficial de Microsoft."

**Diseño:** identidad de flowDev (carbón, blanco, celeste, Inter Tight), con la marca de la plataforma de `marks.js`, no logos oficiales. Imprimible en A4 apaisado.

```
┌──────────────────────────────────────────────┐
│ flowDev                       [marca PA]     │
│ CERTIFICADO DE CUMPLIMIENTO                  │
│                                              │
│ Ana Pérez                                    │
│ completó el proyecto final de                │
│ Power Automate                               │
│                                              │
│ 11 escenarios guiados · desafío "Pedidos de  │
│ la tienda web" (HTTP, Apply to each, Teams…) │
│                                              │
│ 26/11/2026 · Código AB12-CD34                │
│ Verificar: flowdev…/certificado/?c=AB12-CD34 │
└──────────────────────────────────────────────┘
```

## Datos (Supabase)

Tabla nueva `certificates`:

- `code` (texto, clave primaria, 8 caracteres legibles como `AB12-CD34`, generado al azar)
- `user_id` (referencia a la cuenta)
- `platform` (`pa`, más adelante `sap`, `cc`, `api`)
- `full_name`, `issued_at`, `summary` (lo que el certificado dice que se hizo)
- `solution` (jsonb: el flujo entregado, con límite de tamaño)

Reglas de acceso:

- Cualquiera, sin cuenta, puede **leer** un certificado (es público a propósito: para eso es la verificación). No se exponen el email ni el `user_id` en la página.
- Cada usuario puede **crear** solo certificados propios, y **uno por plataforma** (si vuelve a aprobar, se conserva el primero).
- Nadie puede editar ni borrar desde la web.

## Páginas

- **`certificado/?c=CODIGO`**: página pública. Muestra el certificado, si es válido, y el flujo entregado en modo solo lectura (lista de pasos con sus propiedades principales). Si el código no existe, lo dice claramente.
- En **Mi avance**: los certificados obtenidos, con enlace.
- **Agregar a LinkedIn**: el enlace de LinkedIn para sumar una certificación al perfil, con nombre, organización flowDev, fecha, código y URL de verificación prellenados.

## Lo que decidió el dueño

- Certificado por **proyecto final**, no por cantidad de ejercicios.
- Proyecto final como **pedido del negocio con partes y pistas de estructura**.
- Enfoque **A**: corrección en el navegador.

## Decisiones del diseño (el dueño puede corregirlas)

- Uno por plataforma; piloto en Power Automate.
- Requisito: los 11 escenarios guiados.
- Sin botón de solución en el proyecto final.
- Solo con cuenta; el nombre del certificado es el de la cuenta.
- Guardar y mostrar la solución entregada para compensar el enfoque A.
- Código de 8 caracteres y página pública de verificación.
- Un certificado por persona y plataforma.

## Lo que queda a quien construye

- Textos exactos del enunciado y valores de las pruebas del desafío.
- Formato visual fino del certificado dentro de la identidad de flowDev.
- Cómo se muestra el flujo en la página de verificación (lista legible, no el editor).
- Actualizar `admin.sql` para contar certificados emitidos.
