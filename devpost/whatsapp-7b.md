# Hito 7B — WhatsApp AI pilot

Prepared locally on 2026-10-17. Not yet verified against the live OpenAI/Redis credentials or deployed.

## Scope

The existing signed, allowlisted Twilio webhook now has an opt-in AI mode. The web Command Center remains a separate local-storage demo. WhatsApp profiles do not appear in that UI. Human requests are stored in the WhatsApp profile and pause AI; they do not notify Arturo or book appointments. No CRM integration, outbound campaigns, document intake or credit decisions.

Only fictional test data and the configured test senders are supported. Incoming text is limited to 1200 characters. Attachments are rejected before model calls.

## Configuration in Vercel Production

Keep existing TWILIO_WEBHOOK_URL, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and NYVARA_TEST_SENDERS. Keep their actual values private.

- OPENAI_API_KEY: secret, Responses write permission.
- KV_REST_API_URL and KV_REST_API_TOKEN: provisioned by the dedicated Upstash database. The read-only token is not sufficient.
- NYVARA_AI_ENABLED: `true` activates this pilot. Missing/false preserves the connectivity-only reply. Set false and redeploy to roll back.
- OPENAI_MODEL: optional; default `gpt-4.1-mini`. Availability with the project's key still needs live verification.

Upload api/whatsapp.js, the complete lib/ folder, test/whatsapp-ai.test.js, devpost/whatsapp-7b.md and vercel.json at repository root, preserving paths. Keep existing dist, tests and other files. No package installation or new dependency is required; APIs are called through native fetch. Wait for Vercel Ready, then add the activation variable and redeploy so the storage credentials and activation setting reach the function.

## Memory and processing

The dedicated Redis namespace is nyvara:hipotecas:7b. The sender's hash partitions each profile; hashes are pseudonymous, not anonymous. State includes product, validated profile fields, skipped fields, pause flag, human-request flag and last 12 history entries. Only the latest eight entries plus the profile go to OpenAI. OpenAI Responses uses store:false; provider retention policies still apply.

State expires seven days after the latest committed interaction. BORRAR resets the active profile and history. Message identifiers and daily usage counters remain temporarily for processing controls; cached replies are not stored. Twilio/WhatsApp history is not deleted by this command.

Lua scripts atomically acquire a 30-second sender lock, reserve daily usage, load state, and commit profile plus processed MessageSid. A repeated committed MessageSid receives empty TwiML without another AI call. A concurrent message gets a prompt to resend after the previous reply. There is no background task, durable queue or automatic retry after acknowledgment. Out-of-order messages are not reordered. This is a serialized, synchronous pilot, not a durable asynchronous delivery system.

The model request aborts after 7 seconds; each Redis request after 1.5 seconds. There is one model call and at most three Redis requests per attempt. Cold starts/network overhead can still exceed Twilio's deadline and require testing. Failure returns an explicit retry message and does not intentionally advance the profile. If commit succeeded but its response was lost, the outcome is ambiguous; the user should check FICHA. If Twilio loses the response after commit, a repeated MessageSid is suppressed: exactly-once delivery of replies is NOT guaranteed.

Global limit: 100 non-control attempts per UTC day across the allowed test senders; failures count. Commands HOLA, FICHA, BORRAR, CONTINUAR, STOP and explicit human requests bypass that model-use allowance. Each call allows 650 output tokens. These bounds are not a currency spending cap; they do not control other projects using the OpenAI account.

Money/percentages are validated using the existing deterministic validators and compared with the model's literal evidence. Other extracted fields and general answers still depend on model interpretation. All profiles require human review. The model cannot call tools, approve loans or change authorization.

## Validation

42 local tests pass, including existing demo tests and added tests for signature rejection, sender isolation, percentage evidence, pause/resume, erase, duplicate events, persistence failure, timeout fallback, XML escaping and API request shape.

OpenAI and Redis HTTP calls are mocked in local tests. Lua execution against real Redis, model latency/behavior, API permissions, Vercel packaging and actual Twilio delivery are pending live checks. No live messages were sent by the assistant during implementation.

## Live acceptance sequence (user sends these from the authorized test phone)

1. HOLA: expect the AI-demo greeting, not the old connectivity reply. This verifies storage, not a model call.
2. Quiero comprar una vivienda en Xalapa, Veracruz. Expect a relevant next question; verify fields with FICHA.
3. La vivienda cuesta dos millones de pesos. Expect the single down-payment question.
4. Tengo contemplado diez por ciento. FICHA must show 10%, not pesos or zero.
5. Continue with fictional activity, income, spouse and Infonavit answers. Missing values may be omitted.
6. HABLAR CON ARTURO: expect a pause and explicit notice that no notification/appointment was sent.
7. Send another ordinary message: expect no AI reply while paused. FICHA still works.
8. CONTINUAR resumes. BORRAR then FICHA must show no previous profile values.

On failure inspect Vercel logs for NYVARA_WHATSAPP_FAILURE and the safe category, without sharing secrets. GET /api/whatsapp only reports installed mode, never proves provider connectivity.

## Sources

- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/models/gpt-4.1-mini
- https://upstash.com/docs/redis/features/restapi
- https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides
