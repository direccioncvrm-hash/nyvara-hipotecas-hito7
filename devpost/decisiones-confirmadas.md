# NYVARA — decisiones confirmadas

Registro de acuerdos de conversación. No sustituye scope.md, prd.md ni spec.md del Devpost Learn Skill Pack. Implementación pendiente. No se ha publicado repositorio ni conectado Twilio.

## Propósito
Primer filtro hipotecario y solicitud de cita con Arturo Aguirre. Generar ficha estructurada para captura manual en CRM. La integración con CRM pertenece al Hito 8.

## Saludo aprobado
¡Hola! 👋 Soy NYVARA, el asistente inteligente de Arturo Aguirre, impulsado por inteligencia artificial. Te ayudo a explorar opciones para tu vivienda y a coordinar una asesoría personalizada con Arturo.

Nuestra asesoría y gestión son gratuitas y tenemos cobertura nacional.

¿Qué te gustaría hacer?
1. Comprar una vivienda.
2. Cambiar tu hipoteca, con posibilidad de liquidez adicional.
3. Hablar directamente con Arturo.

Puedes elegir una opción o contarme lo que necesitas.

## Compra de vivienda
- Ciudad y estado del inmueble o ubicación deseada.
- Precio aproximado de vivienda; distinguirlo del monto de crédito.
- Enganche y crédito solicitado, si se conocen, sin bloquear el avance.
- Actividad: asalariado, independiente o ambos.
- Ingreso mensual aproximado; admitir rango.
- Interés en sumar ingresos con cónyuge.
- Si cotiza en Infonavit, para revisar posibles opciones de Apoyo Infonavit o Cofinavit sin prometer elegibilidad.
- Día, hora y medio de contacto preferido.

## Cambio de hipoteca más liquidez
- Institución del crédito actual.
- Mes y año de adquisición del crédito; admitir aproximación.
- Ciudad y estado del inmueble.
- Valor actual estimado.
- Saldo pendiente y mensualidad.
- Si está al corriente en pagos.
- Objetivo: mejorar condiciones, liquidez o ambos; importe de liquidez deseado.
- Actividad laboral e ingreso aproximado.
- Atención inmediata o cita.
- Liquidez sujeta a evaluación y aprobación.

## Conversación y atención
- Preguntar de una en una y conservar datos ya proporcionados.
- Prioridad: facilitar cita; no exigir filtro completo.
- No exigir CURP, nombre completo ni correo en el primer filtro.
- Solicitar correo si el cliente elige ese medio.
- Contacto: correo, WhatsApp, llamada, videollamada o en persona; detalles por coordinar.
- Recibir solicitudes 24/7. Atención humana inmediata sujeta a confirmación de disponibilidad.
- Avisos internos por WhatsApp pendientes de configurar. Números privados excluidos de este proyecto público.
- Asesoría y gestión gratuitas no equivalen a gratuidad de gastos del crédito o escrituración.

## Separación y estado
- Microproyecto nuevo separado del sistema privado existente.
- Demo con datos ficticios; la integración de este proyecto nuevo con Twilio sigue pendiente. El acceso recuperado y la prueba del sistema anterior no acreditan la integración del nuevo.
- No afirmar integración, IA funcional, notificaciones enviadas o citas confirmadas sin implementación y verificación.
- Plan de demo en navegador propuesto; arquitectura y diseño todavía por definir.
- Trabajar un paso controlado por vez con Arturo.

## Seguimiento aprobado
- Primer recordatorio tras dos horas sin respuesta.
- Segundo y último al día siguiente.
- Envíos entre 09:00 y 19:00 según la hora del cliente, salvo horario solicitado por este. Si no se conoce su zona horaria, solicitarla antes de programar.
- Cancelar al responder, agendar, pedir detener los mensajes o tomar Arturo la conversación.
- Pausar tras dos intentos sin respuesta.
- Respetar consentimiento y requisitos de plantillas de WhatsApp. Funcionalidad pendiente de implementar; estos intervalos son una hipótesis comercial a evaluar, no una regla científica.

## Aviso por interés alto
- Señal definida por Arturo: el cliente pregunta qué información necesita aportar para avanzar o agilizar su trámite.
- Arturo aprobó recibir un aviso interno por WhatsApp ante esa señal, aunque el interesado todavía no haya pedido cita.
- Distinguir interés alto de urgencia de contacto. No equivale a crédito aprobado ni cita confirmada.
- Requisito aprobado, envío automático pendiente de implementar y probar en el nuevo proyecto.

## Atención humana y cierre de Hito 7
- Cuando Arturo toma la atención, NYVARA detiene respuestas y recordatorios para ese prospecto y no retoma automáticamente la conversación.
- Arturo atiende al cliente y lo captura manualmente en CRM.
- Arturo informa a NYVARA si ya lo registró en CRM; también contempla que NYVARA se lo pregunte. Mecanismo y momento de esa pregunta interna pendientes de definir.
- Confirmar captura cierra el seguimiento de Hito 7; no reactiva a NYVARA ni implica integración o verificación del CRM.
- Hito 8 se enfocará en clientes dentro del CRM: etapa de solicitud, documentos faltantes y comunicación del estatus. Detalles de integración pendientes.

## Objetivo de aprendizaje expresado por Arturo
Automatizar y hacer más eficiente y pronta la atención mediante un agente que conserve el contexto, dé seguimiento a nuevos clientes y pueda escalar.

## Referencias
- Reglas: https://learn-ai-basics.devpost.com/rules
- Paquete oficial: https://github.com/challengepost/learn-ai-basics
- Etapa inicial consultada: https://raw.githubusercontent.com/challengepost/learn-ai-basics/main/skills/1-start/SKILL.md
