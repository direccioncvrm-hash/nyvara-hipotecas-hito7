# NYVARA Hipotecas — Hito 7A

Local proof of concept for mortgage intake: home purchase and mortgage refinancing with optional additional cash, subject to lender review. Built as a separate project with the Devpost Learn Skill Pack.

**Guided demo, not a live AI or WhatsApp integration. Use fictional data only.** No API keys, paid services, external databases or installation of npm packages are required.

## Run and test
Requires a modern Node.js release (Node 22 or newer recommended) and a browser.

    node server.mjs

Open http://127.0.0.1:4177. The server binds only to this computer. Stop with Ctrl+C.

    node --test

The interface is in Spanish. Its technical behavior and test instructions are documented below in English.

## End-to-end walkthrough
1. Select **Prospectos → Nuevo prospecto** (Prospects → New prospect). Choose **1 · Compra de vivienda** (home purchase).
2. Enter `Ciudad: Puebla; Estado: Puebla; Precio: 2 millones; Crédito: 1500000`. The profile keeps property value and requested loan separate. Enter `Crédito: 1800000` to correct only the loan.
3. Open **Ficha** (Profile), reload, and verify persistence. Create another prospect to verify isolation.
4. For refinancing choose **2 · Cambio de hipoteca**. Try `Institución: Infonavit; Fecha: marzo 2015; Saldo: 900000; Liquidez: 200000`. Continue one question at a time or skip an unknown value with **No sé / omitir** (I don't know / skip).
5. **Solicitar contacto** (Request contact) works with a partial profile. Supply fictional contact information, for example `demo@example.com` for email. Requests remain pending confirmation; no messages are sent.
6. **Tomar atención** (Take over) assigns the conversation to the human advisor and stops automatic replies and reminders permanently for this case. **Ya capturado en CRM** (Already entered into CRM) records a human declaration and closes Hito 7. It does not query or update a CRM.
7. In a new case, enter `¿Qué información necesitas para agilizar mi trámite?` (What information do you need to move my application forward?). **Ficha** shows high interest with the original evidence. It does not infer urgency or loan eligibility.
8. In that case, choose **Preparar recordatorios** (Prepare reminders), explicitly simulate consent, choose a time zone and window, and click **Programar simulación** (Schedule simulation). Use **Ir al próximo recordatorio** (Go to next reminder). After the first event, send a message. The status becomes cancelled; advance a day and verify no second event appears. In another test case, silence allows a maximum of two simulated events.

## Boundaries
- Programmed recognition of common phrases, labelled fields, Spanish month names and common amount expressions. Not general natural-language understanding.
- Browser-local storage only; no multi-user synchronization or production security. Do not use real customer data.
- Simulation clock advances only through controls and affects all demo prospects. Header time is Mexico City; event times use the selected client zone.
- Default window 09:00–19:00, first event after two hours adjusted to the allowed window, second on the next local day. Explicit consent and zone are required. Reply, opt-out, contact request or human takeover cancels pending events. Prior events stay as history. Old demo records may lack a cancellation timestamp; the UI states that instead of inventing one.
- Contact preferences are free text. Immediate requests are prioritized; other requests are ordered by receipt, not interpreted appointment date. No appointments are automatically confirmed.
- No automated financial approval, guaranteed savings or guaranteed cash-out.

## Project stages
- **7A:** this local hackathon demo and delivery materials.
- **7B:** future real WhatsApp and AI integration with authorized test numbers and human review.
- **7.5:** future assessment of reusable plugin capabilities.
- **8:** future CRM integration.

## Source map
`dist/app.js`: interface and actions. `core.js`: intake and profile updates. `questions.js`: questions. `input.js`: amounts and dates. `handoff.js`: contact and human takeover. `followup.js`: simulated scheduling and interest. `storage.js`: local persistence. `test/`: regression tests. `devpost/`: planning and review records. Open `devpost/app-map.html` for a short offline guide.

## Delivery status
Local functional review completed with the project owner. 27 automated checks passed at the Hito 7A checkpoint. Public repository, accessible demo-video URL, English translations of remaining Spanish submission materials, learner-authored submission fields and Devpost submission are still pending. This repository is not evidence of a submitted entry.

Official rules: https://learn-ai-basics.devpost.com/rules. Course guidance is separate from official competition rules. Existing private project code, credentials and customer records were not incorporated.
