---
doc: checklist
status: approved
---
# Construcción de NYVARA
Build mode: learn
Orden presentado en spec.md y aprobado por Arturo: compra y conservación; segundo producto y entrega; avisos y reloj; revisión conjunta. Este registro concreta ese orden sin pedir una segunda aprobación.

## Slices
- [x] **1. Compra de vivienda con ficha y memoria local**
  Becomes usable: Conversación guiada, correcciones, ficha y prospectos independientes que se conservan al recargar.
  Why now: Comprueba que NYVARA conserva contexto antes de ampliar productos.
  PRD ref: `prd.md > Recorrido completo`, `prd.md > Perfil y ficha`
  Spec ref: `spec.md > Conversación guiada y ficha`, `spec.md > Conservación local`
  Build: Pantalla de tres columnas, preguntas de compra, entrada etiquetada múltiple, edición y copia de ficha; servidor local y pruebas.
  Verify (mechanical): Pruebas Node de corrección, aislamiento, validación y almacenamiento; prueba en navegador y recarga.
  Learner check: Aportar ciudad y crédito, corregir crédito, crear otro prospecto y volver al primero.
  Commit: `Build purchase profiling and local memory`
- [x] **2. Cambio de hipoteca y entrega definitiva al asesor**
  Becomes usable: Segundo producto, solicitudes de contacto y cierre declarado en CRM.
  Why now: Completa el recorrido comercial sobre la memoria comprobada.
  PRD ref: `prd.md > Solicitudes, avisos y control humano`
  Spec ref: `spec.md > Solicitudes y entrega a Arturo`
  Build: Preguntas de refinanciamiento, solicitudes, tomar atención y captura manual.
  Verify (mechanical): Fecha de crédito y perfil parcial; un mensaje posterior no reactiva respuestas ni seguimiento tras entrega o cierre.
  Learner check: Solicitar atención con perfil incompleto y declarar captura manual.
  Commit: `Add refinance and human handoff`
- [x] **3. Avisos y seguimiento simulados**
  Becomes usable: Evidencia de interés alto, avisos sin duplicados y recordatorios con reloj visible.
  Why now: Las cancelaciones dependen de los estados anteriores.
  PRD ref: `prd.md > Seguimiento simulado`, `prd.md > Interés y prioridad`
  Spec ref: `spec.md > Reloj y seguimiento simulados`
  Build: Consentimiento, zona, ventanas, dos intentos y cancelaciones.
  Verify (mechanical): Horarios, zonas, máximo dos, deduplicación y cancelaciones.
  Learner check: Avanzar reloj, comprobar dos intentos y cancelación al responder.
  Commit: `Add simulated follow-up controls`

## Hands-on Checkpoints
- [x] Primera versión de compra probada por Arturo; corrección de respuesta mixta revisada y aceptada.
- [x] Segundo producto revisado y aceptado por Arturo: «EXCELENTE YA QUEDO DE 10». Entrega y cierre comprobados también en navegador.
- [x] Reloj probado por Arturo: cancelación confirmada y avance posterior sin segundo recordatorio.

## Final Review
- [ ] Revisión final completa y confirmación de preparación para entrega.

## Code Tour and App Map
- [ ] Recorrido breve por el código y evidencia de práctica.
- [ ] Reflexión opcional ofrecida.
- [ ] devpost/app-map.html generado, comprobado y mostrado.

## Revisions

### Evidencia del incremento 1 (pendiente de prueba del usuario)
Seis pruebas Node aprobadas. Navegador: captura de Ciudad/Estado/Crédito; edición de 1500000 a 1800000; conservación al recargar; segundo prospecto vacío y retorno al primero con sus datos. Vista estrecha con pestañas y distribución de escritorio comprobadas. Repositorio Git local inicializado, sin remoto; commit pendiente del checkpoint acompañado. Servidor local en 127.0.0.1:4177.
Corrección tras prueba de Arturo: reconocer «SI COTIZO, COMO PUEDE APOYARME?» como respuesta explícita y duda, conservarla en notas y orientar hacia revisión de Arturo. Ocho pruebas automáticas aprobadas. Pendiente reintento del usuario. No equivale a comprensión general de lenguaje natural.


### Evidencia del incremento 2 (pendiente de prueba de Arturo)
Cambio de hipoteca más liquidez implementado con institución, fecha mes/año, ubicación, valor, saldo, mensualidad, situación de pagos, objetivo, liquidez e ingresos. Solicitud parcial con canal y preferencia de contacto; aviso de solicitud simulado y deduplicado. Tomar atención y captura manual detienen automatismos permanentemente para Hito 7. Prueba en navegador: prospecto 03, fecha 03/2021, saldo 900000 y liquidez 200000; solicitud parcial, toma, cierre, mensaje posterior y recarga sin respuesta automática. Doce pruebas Node aprobadas. Sin conexiones externas ni cambios al proyecto privado. Falta checkpoint acompañado antes de commit de este incremento.

Corrección solicitada por Arturo: fechas con mes en letra y montos comunes en palabras. MARZO 2015 y 03/2015 se guardan como 03/2015; 3 millones y tres millones como 3000000. Se rechazan rangos ambiguos sin sobrescribir. Quince pruebas aprobadas, incluida la secuencia conversacional de ambos valores. Pendiente reintento de Arturo.

Corrección de claridad tras prueba de Arturo: saldo pregunta explícitamente dinero en pesos. Si responde 13 años/trece años, conservar plazo en notas copiables y aclarar el saldo sin rechazar toda la respuesta ni convertir años en pesos. Dieciséis pruebas aprobadas.

Ajuste pedido por Arturo: al completar u omitir las últimas preguntas, el cierre invita a indicar medio y horario; la interfaz abre el formulario de contacto automáticamente si no existe solicitud y Arturo no tomó la atención. No reabre al corregir un perfil ya completo ni al recibir mensajes después de entrega. Apertura comprobada en navegador con prospecto demo 10. La copia de ficha continúa como herramienta del asesor. En WhatsApp real este paso conversacional queda pendiente de integración.


### Incremento 3: listo para prueba de Arturo
Aviso de interés alto con frase de evidencia y sin duplicados; no implica urgencia. Reloj global de simulación, consentimiento explícito en formulario, zona conocida, ventana 09–19 configurable a petición del cliente y máximo dos eventos simulados. Cancelación al responder, detener, pedir contacto, tomar atención y cerrar CRM, sin reinicio de la consulta. Se usa la hora simulada en las acciones nuevas; el reloj no avanza automáticamente al cerrar el navegador.
Verificación: 23 pruebas Node aprobadas, incluidos cambio de horario estacional, zonas, horarios, dos intentos y cancelaciones. Navegador: aviso de interés, permiso, programación, salto al primer recordatorio, segundo al día siguiente y recarga con registro conservado. Pendiente prueba de Arturo y commit del incremento.
Limitación pendiente de revisión final: la preferencia de cita se guarda como texto libre; dentro del grupo de solicitudes no urgentes se ordena por orden de recepción, todavía no por fecha de cita. No se afirma que sean citas confirmadas.

## Cierre local Hito 7A
27 pruebas aprobadas. Revisión funcional iterativa realizada con Arturo. Mapa y resumen técnico preparados. Solicitud de cierre del usuario recibida; publicación y envío todavía pendientes. Repaso basado en la práctica ya realizada: cancelación y evidencia de tiempo; no se repite ejercicio. Mapa: devpost/app-map.html. Lista de entrega: devpost/entrega-7A.md. Limitación de orden por fecha de cita documentada, no ocultada. Ninguna participación enviada ni video publicado.

