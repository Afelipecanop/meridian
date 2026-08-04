import assert from "node:assert/strict";
import {
  boldIntegritySignature,
  boldWebhookSignature,
  boldProvider,
} from "../src/lib/payments/bold";

/**
 * Tests de las firmas de Bold (`npm run test:bold`). Sin framework: asserts
 * de node y process.exit, igual que los demás scripts.
 *
 * Vectores: el ejemplo de firma de integridad viene de la doc oficial
 * (developers.bold.co → Botón de pagos → Integración manual): orderId
 * "inv0334", monto 39400, COP, llave "kgfq2nN0o52XqnuXZWIN2F". El payload del
 * webhook es el ejemplo SALE_APPROVED de developers.bold.co/webhook. Los hex
 * esperados están precalculados con node:crypto sobre esos valores.
 */

const DOC_SECRET = "kgfq2nN0o52XqnuXZWIN2F";

// SHA-256("inv033439400COPkgfq2nN0o52XqnuXZWIN2F")
const EXPECTED_INTEGRITY =
  "620a64c6eab8858d0f96d4f818a1d77be5e9b9eb9dc681f527de1af54fc1b739";

// Ejemplo de evento de la doc de webhooks de Bold.
const docEvent = {
  id: "e4f8c1b9-3d02-4a7c-8e51-f672a9b3d0e4",
  type: "SALE_APPROVED",
  subject: "F8A5D6B7G2H1",
  source: "/payments",
  spec_version: "1.0",
  time: 1761060600000000000,
  data: {
    payment_id: "F8A5D6B7G2H1",
    merchant_id: "PQR6Y4T8Z3",
    created_at: "2025-10-21T11:30:15-05:00",
    amount: {
      currency: "COP",
      total: 1000,
      taxes: [{ base: 810, type: "VAT", value: 190 }],
      tip: 0,
    },
    metadata: { reference: "ORD-20251021-00145" },
    payment_method: "CARD",
  },
  datacontenttype: "application/json",
};

// HMAC-SHA256(base64(JSON.stringify(docEvent)), DOC_SECRET)
const EXPECTED_WEBHOOK_SIG =
  "ee277834f2c581e7d41bda74fe114726c0f00257a1c70fc39bfd333a9d1e9321";

function headersWith(signature: string): Headers {
  return new Headers({ "x-bold-signature": signature });
}

async function main() {
  process.env.BOLD_SECRET_KEY = DOC_SECRET;
  delete process.env.BOLD_SANDBOX;

  // 1. Firma de integridad: reproduce el ejemplo de la documentación.
  assert.equal(
    boldIntegritySignature("inv0334", 39400, "COP", DOC_SECRET),
    EXPECTED_INTEGRITY,
    "firma de integridad del ejemplo oficial",
  );

  // 2. Cualquier campo manipulado produce otra firma.
  assert.notEqual(
    boldIntegritySignature("inv0334", 1, "COP", DOC_SECRET),
    EXPECTED_INTEGRITY,
    "monto manipulado debe cambiar la firma",
  );
  assert.notEqual(
    boldIntegritySignature("inv0335", 39400, "COP", DOC_SECRET),
    EXPECTED_INTEGRITY,
    "orderId manipulado debe cambiar la firma",
  );

  // 3. Webhook válido: firma correcta sobre el payload de ejemplo.
  const rawBody = JSON.stringify(docEvent);
  const signature = boldWebhookSignature(rawBody, DOC_SECRET);
  assert.equal(signature, EXPECTED_WEBHOOK_SIG, "HMAC del payload de ejemplo");

  const ok = await boldProvider.verifyWebhook(rawBody, headersWith(signature));
  assert.ok(ok.ok && !ok.ignored, "webhook válido debe aceptarse");
  assert.equal(ok.orderRef, "ORD-20251021-00145");
  assert.equal(ok.paymentStatus, "paid");
  assert.equal(ok.providerRef, "F8A5D6B7G2H1");

  // 4. Cuerpo manipulado (monto alterado) con la firma original: rechazado.
  const tampered = rawBody.replace('"total":1000', '"total":1');
  const bad1 = await boldProvider.verifyWebhook(tampered, headersWith(signature));
  assert.ok(!bad1.ok, "cuerpo manipulado debe rechazarse");

  // 5. Firma inválida o ausente: rechazado.
  const bad2 = await boldProvider.verifyWebhook(
    rawBody,
    headersWith("0".repeat(64)),
  );
  assert.ok(!bad2.ok, "firma inválida debe rechazarse");
  const bad3 = await boldProvider.verifyWebhook(rawBody, new Headers());
  assert.ok(!bad3.ok, "firma ausente debe rechazarse");

  // 6. Normalización de eventos: rechazo → failed, anulaciones → ignorado.
  const rejected = JSON.stringify({ ...docEvent, type: "SALE_REJECTED" });
  const r = await boldProvider.verifyWebhook(
    rejected,
    headersWith(boldWebhookSignature(rejected, DOC_SECRET)),
  );
  assert.ok(r.ok && !r.ignored && r.paymentStatus === "failed");

  const voided = JSON.stringify({ ...docEvent, type: "VOID_APPROVED" });
  const v = await boldProvider.verifyWebhook(
    voided,
    headersWith(boldWebhookSignature(voided, DOC_SECRET)),
  );
  assert.ok(v.ok && v.ignored === true, "VOID_* debe ignorarse");

  console.log("✔ Firmas de Bold: 6 casos OK");
}

main().catch((error) => {
  console.error("✖ Test de firmas de Bold falló:", error.message ?? error);
  process.exit(1);
});
