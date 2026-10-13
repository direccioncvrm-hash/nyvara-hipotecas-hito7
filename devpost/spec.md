---
doc: spec
status: approved
---
# NYVARA Hipotecas — plan técnico de la demo local

## How This Works, In Plain Language
La pantalla reúne prospectos, conversación y ficha. Cada respuesta actualiza exclusivamente al prospecto seleccionado. La ficha conserva lo que ya sabemos, muestra lo pendiente y permite corregir un dato sin borrar los demás. Arturo puede pedir contacto, tomar la atención y declarar la captura manual en CRM.

Hoy proponemos un recorrido guiado que funciona en el navegador, sin tarjeta ni servicios de pago. Una franja permanente informa: «Demo con datos ficticios · Recorrido guiado · IA y WhatsApp sin conectar». El saludo aprobado se conserva, acompañado de esa aclaración. Las respuestas programadas no se presentan como comprensión libre de una IA.

Los datos de prueba se conservan únicamente en ese navegador. No se comparten entre teléfonos ni computadoras. El sistema privado anterior permanece separado.

## The Core Journey Through the System
Implementa `prd.md > Recorrido completo` y `scope.md > El elemento distintivo`.
1. Crear un prospecto independiente con saludo aprobado y ficha vacía.
2. Elegir compra, cambio de hipoteca o atención directa.
3. Contestar una pregunta cada vez; las respuestas actualizan campos de la ficha. Para aportar varios datos a la vez, el modo guiado admite etiquetas explícitas como «Ciudad: Puebla; Estado: Puebla; Crédito: 1500000». Texto ambiguo se conserva en conversación y se aclara, nunca se adivina.
4. Corregir desde la ficha o mediante esas etiquetas, sin perder información previa. Permitir omitir datos desconocidos y solicitar contacto en cualquier momento.
5. Registrar interés con evidencia textual y urgencia separadamente; generar avisos internos claramente simulados.
6. Copiar el resumen; tomar atención suspende permanentemente respuestas y recordatorios automáticos para ese prospecto.
7. Declarar captura en CRM cierra Hito 7, sin consultar ni modificar un CRM real.

## Stack
Propuesta técnica para revisión, derivada del plan local aprobado: HTML, CSS y JavaScript, sin framework ni paquetes externos. HTML estructura la pantalla, CSS define su apariencia y JavaScript conecta conversación y ficha. Esto mantiene la demo sencilla y evita instalaciones y cuentas adicionales.

- [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML), [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) y [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript): interfaz y lógica.
- [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage): conservación local de pruebas, con formato versionado.
- [Node.js](https://nodejs.org/api/): servidor local de archivos y pruebas incorporadas, sin dependencias instalables. Verificar la versión del entorno al construir.

## Where It Runs and How Someone Tries It
Plan de ejecución, aún no implementado: desde la raíz del nuevo proyecto, `node server.mjs`; abrir `http://127.0.0.1:4177`. El servidor escucha solo en el equipo local y sirve `dist/`. Pruebas: `node --test`.

No requiere claves ni tarjeta. Se podrá grabar la demo en navegador. Publicación y repositorio remoto quedan para la preparación de entrega; no se realizan en este paso. La convocatoria y fecha deben volver a verificarse antes de enviar: https://learn-ai-basics.devpost.com/rules. El material del curso orienta el desarrollo, no sustituye las reglas oficiales.

## Look and Feel
Implementa `prd.md > Pantalla y distribución` y `prd.md > Apariencia`.
Azul marino, paneles azules y texto claro; acento turquesa para acciones principales. Prospectos a la izquierda, conversación en el centro y ficha a la derecha. Tipografía del sistema, estados con palabras además de color, controles accesibles con teclado. En móvil alternar conversación y ficha mediante pestañas. Contexto, responsable y siguiente acción deben verse sin buscar en el historial.

## Components
### Command Center
Implementa `prd.md > Pantalla y distribución` e `Interés y prioridad`. Lista seleccionable, búsqueda, nuevo prospecto, estado, datos destacados y orden por solicitudes inmediatas, solicitudes próximas y seguimiento pendiente. No ordenar por ingreso ni monto. Restablecer datos requiere confirmación y afecta solo esta demo.

### Conversación guiada y ficha
Implementa `prd.md > Perfil y ficha` y `Recorrido completo`. Catálogo separado de preguntas por producto, campos editables, pendientes explícitos y copia de resumen. Todos los campos aprobados en decisiones-confirmadas.md tienen lugar en la ficha, incluida fecha del crédito. Validación de importes, fechas y opciones; una entrada dudosa no sobrescribe datos válidos. Texto libre no reconocido se conserva y produce una aclaración sobre las capacidades del modo guiado.

### Solicitudes y entrega a Arturo
Implementa `prd.md > Solicitudes, avisos y control humano`. Canal y preferencia de contacto, atención inmediata solicitada o fecha/hora y zona; siempre pendientes de confirmación. Correo solo si se elige ese canal. Interés alto exige frase de evidencia; un aviso por motivo evita duplicados. «Tomar atención» cambia responsable y cancela automatismos; «Ya capturado en CRM» solo disponible tras tomar atención, registra declaración manual.

### Reloj y seguimiento simulados
Implementa `prd.md > Seguimiento simulado`. Consentimiento explícito, zona horaria conocida y ventana permitida son requisitos. Primer intento a las dos horas, ajustado a 09:00–19:00 local o ventana elegida; segundo al día siguiente a la misma hora local. Máximo dos. Sin zona o consentimiento, no programar. Respuesta, rechazo, solicitud de atención o toma por Arturo cancelan pendientes sin reiniciar automáticamente. Avanzar el reloj solo agrega eventos simulados al registro; no envía mensajes ni ejecuta tareas con el navegador cerrado.

### Conservación local
Implementa `prd.md > Estados y límites`. Guardar una colección versionada por identificador de prospecto en una clave exclusiva de la demo. Leer y validar al abrir; no reemplazar datos ilegibles silenciosamente. Actualizaciones preparadas antes de guardar; si falla, avisar que no se guardó y mantener los datos válidos previos.

## Data Model
- Aplicación: versión, reloj simulado, prospecto seleccionado, colección de prospectos.
- Prospecto: id único, nombre de trato opcional, producto, ficha por campos, preguntas omitidas, conversación con autor y fecha, estado y responsable.
- Interés: por confirmar/alto y evidencia; urgencia de contacto independiente.
- Solicitud: canal, contacto ficticio pertinente, fecha/hora/zona preferidas, inmediata o programada, estado pendiente.
- Seguimiento: consentimiento, zona, ventana, vencimientos, intentos, cancelación y motivo.
- Avisos: id, motivo, fecha y marca «simulado»; claves de deduplicación por prospecto.
- CRM: fecha de declaración manual, sin identificador ni confirmación externa inventados.

Todos viven en el navegador y se actualizan mediante acciones sobre un id, nunca mediante contexto compartido entre prospectos. La copia al portapapeles ocurre únicamente al pulsar el botón.

## File Structure
Estructura prevista; los archivos de aplicación todavía no existen.
```text
nyvara-hackathon/
  dist/
    index.html          Pantalla de la demo
    styles.css          Diseño adaptable
    app.js              Eventos y representación de la pantalla
    core.js             Perfil, solicitudes, estados y seguimiento
    questions.js        Saludo aprobado y preguntas de ambos productos
    storage.js          Conservación y validación local
  test/
    core.test.js        Contexto, aislamiento, entrega y tiempos
  server.mjs            Servidor local limitado a dist
  package.json          Comandos y módulos JavaScript
  devpost/              Acuerdos, alcance, funcionamiento, plan y avance
  README.md             Cómo ejecutar y límites de la demo
  .gitignore            Exclusiones de secretos y notas privadas
```
Las carpetas src y public existentes contienen marcadores vacíos y no se usan en esta propuesta.

## External Services and Dependencies
Ninguna llamada externa desde la demo de hoy. IA, Twilio, Redis, CRM y alojamiento no se conectan. No copiar claves del proyecto privado. Las futuras conexiones requieren contratos y pruebas propios; no se dan por resueltas con esta especificación.

## Important Failure Modes
- Datos locales corruptos o almacenamiento bloqueado: mensaje claro, sin borrar originales; permitir reintentar o restablecer explícitamente.
- Respuesta ambigua: conservar el mensaje y pedir aclaración; no inventar datos ni inferir aprobación de crédito.
- Portapapeles no disponible: mostrar resumen seleccionable y copia manual, sin anunciar éxito falso.
- Fecha/zona inválida: impedir programación y explicar el dato pendiente. Al saltar varios días con el reloj, registrar solo los intentos previstos, sin duplicarlos.

## What Was Simplified and Why
Recorrido guiado local para avanzar sin servicios pagados; comprensión general de lenguaje natural queda para la conexión del modelo. La conservación de contexto, correcciones, aislamiento y entrega humana sí deben funcionar de verdad. Recordatorios y avisos son registros de simulación. No hay sincronización, operación multiusuario ni persistencia de producción.

## Verification
Primera prueba: compra, varios campos etiquetados, corrección de monto, recarga y segundo prospecto sin datos heredados. Segunda: cambio de hipoteca con fecha de contratación, ficha parcial y solicitud. Tercera: tomar atención, recibir otro mensaje sin respuesta automática, cerrar manualmente en CRM. Cuarta: reloj, consentimiento, zonas, horario, máximo dos intentos y todas las cancelaciones. Comprobar escritorio/móvil y errores de guardado. Arturo prueba la primera versión antes de continuar con los siguientes incrementos.

## Decisions and Open Issues
El usuario aprobó el plan de trabajo local, las funciones del PRD y esta propuesta técnica con «SI ME PARECE BIEN, CONTINUEMOS». Incluye HTML/CSS/JS, entrada guiada con etiquetas y el orden de incrementos descrito abajo. Modo acompañado: probar cada incremento antes de continuar.

Incertidumbre expresada: qué se puede avanzar sin tarjeta ni IA conectada. La demo permitirá verificar que una ficha y sus reglas funcionan sin llamadas pagadas, mientras la interfaz distingue esa capacidad de una IA conversacional. El criterio de comprensión libre no queda certificado por esta etapa.

Orden propuesto: perfil y conservación de compra; segundo producto y entrega humana; avisos y reloj; revisión conjunta. No activar publicación, conexiones reales ni pregunta proactiva sobre CRM en este paso.
