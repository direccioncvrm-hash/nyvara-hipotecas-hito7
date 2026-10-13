---
doc: prd
status: approved
---
# NYVARA Hipotecas — funcionamiento de la demo

Command Center para que Arturo identifique prospectos que requieren atención y retome una conversación con su contexto. Este documento concreta el alcance aprobado. Distribución de escritorio y orden de atención aprobados; las otras propuestas señaladas siguen en revisión.

## Recorrido completo
Fuente: scope.md > Recorrido principal y Cómo demostraremos que funciona.
1. Abrir la demo, identificada como entorno de pruebas con datos ficticios.
2. Iniciar una conversación y mostrar exactamente el saludo de decisiones-confirmadas.md > Saludo aprobado.
3. Elegir compra de vivienda, cambio de hipoteca más liquidez o atención directa; también admitir texto libre.
4. Registrar los datos que aporte el interesado, incluso varios en un mensaje, y preguntar solo por información pendiente, de una en una.
5. Incorporar correcciones sin borrar el resto de la ficha. Permitir continuar cuando un dato no se conoce.
6. Registrar atención inmediata o preferencia de día, hora y medio sin exigir completar el perfil. Mostrar solicitud pendiente de confirmación, nunca cita confirmada automáticamente.
7. Arturo consulta la ficha y copia el resumen para captura manual en CRM. En la demo puede simular que toma la atención y verificar que se detiene el seguimiento automático.
8. Arturo marca “Ya capturado en CRM”; el prospecto queda cerrado para Hito 7 y ningún mensaje posterior reactiva automáticamente a NYVARA.

## Pantalla y distribución
Fuente: scope.md > Identidad e inspiración; referencia-visual.md.
Distribución de escritorio aprobada: prospectos a la izquierda, conversación al centro y ficha a la derecha. El bloque de siguiente acción y avisos simulados se integra en la ficha. Propuesta para pantalla estrecha: conversación y ficha se alternan con pestañas.

Esta vista conjunta es para Arturo y la demostración, con datos ficticios. No es un portal público con acceso a expedientes reales. El futuro cliente de WhatsApp solo verá su conversación.

## Apariencia
Referencia aportada por Arturo: Command Center de NYVARA, fondo azul oscuro, paneles azules, texto claro y navegación lateral. Usar tipografía legible y etiquetas de estado con texto además de color. No reproducir expedientes ni código del sistema anterior. Presentación de referencia: https://nyvara-presentacion.vercel.app/.

## Perfil y ficha
Fuente: scope.md > El elemento distintivo; decisiones-confirmadas.md > Compra de vivienda y Cambio de hipoteca más liquidez.
Destacar ciudad, estado, producto, monto solicitado, actividad laboral, interés y urgencia de contacto. Mantener por separado precio del inmueble, enganche, crédito solicitado y liquidez adicional.

La ficha reúne todos los campos definidos en decisiones-confirmadas.md para cada producto, incluido mes y año aproximados de contratación de la hipoteca actual. Mostrar lo no proporcionado como pendiente; no rellenarlo con datos inventados. No pedir CURP ni nombre completo en el primer filtro. Nombre de trato opcional; obtener el dato de contacto correspondiente al medio elegido cuando se solicite atención. En la demo utilizar identificadores y contactos ficticios.

## Interés y prioridad
Fuente: referencia-visual.md > Señal de interés alto definida por Arturo.
Interés alto cuando el cliente pregunta qué necesita aportar para avanzar o agilizar su trámite; conservar una frase que respalde la etiqueta. En ausencia de evidencia, mostrar por confirmar. No inferir urgencia, desinterés ni elegibilidad financiera a partir del monto, ingreso o silencio.

Orden aprobado: solicitudes explícitas de contacto inmediato, citas próximas (indicando si son solicitudes pendientes de confirmar) y seguimientos pendientes. Mostrar una marca de interés alto independiente del orden y de la urgencia. El monto sirve como contexto, no como criterio para dar prioridad.

## Solicitudes, avisos y control humano
Fuente: scope.md > Límite de la primera demostración; decisiones-confirmadas.md > Aviso por interés alto.
Crear un aviso simulado ante solicitud de contacto o señal de interés alto, incluso sin cita. Incluir motivo, producto, ubicación, monto y datos disponibles. No mostrar enviado por WhatsApp: mostrar aviso simulado. Propuesta: un único aviso de interés alto por episodio, sin repetirlo por cada mensaje.

Controles propuestos: copiar ficha y simular avance del tiempo. Tomar atención cambia la responsabilidad a Arturo, detiene respuestas automáticas y cancela recordatorios pendientes; no inicia una llamada ni envía un mensaje real. Arturo confirmó que NYVARA no retomará automáticamente a ese prospecto durante Hito 7, tampoco si el cliente vuelve a escribir.

### Entrega a Arturo y cierre manual en CRM
Decisión de Arturo: tras tomar la atención, él gestiona al cliente hasta capturarlo manualmente en CRM. El panel debe distinguir atención a cargo de Arturo, pendiente de captura en CRM, y capturado en CRM según confirmación de Arturo. Esta confirmación es declarada, no verificada mediante integración. Al confirmarla, termina el seguimiento de Hito 7 y NYVARA no lo retoma.

Arturo podrá informar que ya capturó al cliente; también contempla que NYVARA se lo pregunte. Botón interno aprobado para la demo: “Ya capturado en CRM”. La pregunta proactiva interna y su momento siguen por definir; no enviar nada automáticamente hasta resolverlo. No aceptar un mensaje del cliente como confirmación operativa de captura en CRM ni como autorización para reactivar al agente.

## Seguimiento simulado
Fuente: decisiones-confirmadas.md > Seguimiento aprobado.
Mostrar en un registro los recordatorios que corresponderían tras dos horas de inactividad y al día siguiente. Respetar horario de 09:00 a 19:00 según zona del cliente o su horario elegido; si no se conoce zona, no programar hasta aclararla. Propuesta para concretar al día siguiente: misma hora local del primer recordatorio, ajustada al horario permitido.

Pedir permiso de seguimiento antes de habilitarlo; propuesta de pregunta breve: “¿Te parece bien que te enviemos hasta dos recordatorios por WhatsApp para retomar esta consulta?”. Sin aceptación no generar recordatorios. En la demo tampoco se enviarán mensajes reales si acepta.

Cancelar pendientes cuando responde, pide detener mensajes, solicita/agendar atención o Arturo toma la conversación. No reiniciar automáticamente una nueva secuencia al responder: la reanudación se podrá coordinar después. Máximo dos intentos por consulta, luego pausado. El reloj simulado permite probar esto sin esperar horas y queda identificado como simulación.

## Estados y límites
- Inicio: saludo aprobado y ficha vacía; nuevos prospectos sin contexto de Consorcio, Medina ni QTA.
- Perfil parcial: permitir pedir atención con información incompleta.
- Ambigüedad: pedir aclaración concreta antes de sobrescribir un monto, fecha o dato contradictorio.
- Fallo al responder o guardar: mostrar fallo y posibilidad de reintentar; mantener la ficha válida anterior. No anunciar guardado, aviso o cita exitosos si fallaron.
- Propuesta de persistencia de demo: mantener conversaciones ficticias al recargar en el mismo navegador; permitir iniciar un prospecto independiente y restablecer los datos de prueba. No prometer acceso entre dispositivos.
- Solicitud de atención: pendiente de coordinación; no supone disponibilidad inmediata de Arturo.
- Solo datos ficticios en la demo pública; no cargar información financiera real ni teléfonos internos.
- Si no hay modelo conectado, identificar explícitamente modo simulado. No hacer pasar respuestas programadas por IA activa.

## Criterios comprobables
- El saludo coincide con la versión congelada.
- Ambos productos producen sus campos correspondientes; cambio de hipoteca incluye fecha aproximada del crédito.
- Un mensaje con varios datos los incorpora sin volver a pedirlos; una corrección modifica solo los datos correspondientes.
- Precio de vivienda y monto de préstamo aparecen separados.
- Solicitar atención antes de completar preguntas genera ficha parcial y solicitud pendiente.
- Preguntar cómo avanzar marca interés alto con evidencia y un aviso simulado, sin marcar atención inmediata si no fue solicitada.
- Un segundo prospecto no hereda datos del primero.
- Copiar ficha entrega un resumen legible con pendientes identificados.
- Al simular tiempo se respetan los dos recordatorios, horario y consentimiento; responder, detener o tomar atención cancela pendientes.
- Los errores no borran silenciosamente la ficha ni generan avisos de éxito.
- Tomar atención detiene respuestas y recordatorios incluso si el cliente vuelve a escribir. Marcar “Ya capturado en CRM” cierra Hito 7 sin reactivar al agente ni afirmar que se consultó el CRM.

## Decisiones confirmadas y propuestas
Confirmado: dos productos, prioridad comercial de conseguir cita, saludo, campos, urgencia separada de interés, señal de interés alto y aviso interno, seguimiento limitado, identidad tipo Command Center y separación del proyecto previo.

También aprobado en dos respuestas explícitas: distribución de escritorio y orden de atención descritos arriba.
También aprobado: entrega definitiva a Arturo dentro de Hito 7 y botón “Ya capturado en CRM” para cierre manual. No hay retorno automático a NYVARA.

Para aprobación de este borrador: adaptación móvil, controles, aviso sin duplicados, permiso de recordatorios, hora del segundo intento y conservación local de pruebas. Son propuestas para concretar el comportamiento, no decisiones previas atribuidas al usuario.

## Posterior a la demo
Fuente: scope.md > Después de la primera demo.
Integración real de Twilio en entorno separado, avisos reales, plantillas, programación durable, almacenamiento para operación y pruebas de seguridad, recuperación y concurrencia. Hito 8: clientes ya registrados en CRM, etapa de la solicitud, documentos pendientes e información de estatus al cliente, con integración y permisos por definir. No incluye aprobación crediticia, garantía de tasa o liquidez, llamadas automáticas ni un sistema general de expedientes.

## Estado de revisión
Documento aprobado por Arturo mediante respuesta explícita “SI” a la revisión final de los puntos pendientes: adaptación móvil, conservación local de pruebas, avisos sin duplicados, permiso de recordatorios, hora del segundo intento y controles de demo. Las menciones a propuestas en el cuerpo quedan aceptadas por esta aprobación. La pregunta proactiva interna sobre captura en CRM queda diferida; el botón aprobado resuelve el cierre de esta demo. Aplicación aún no implementada.
