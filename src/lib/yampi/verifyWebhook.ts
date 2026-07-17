import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Yampi signs webhooks with HMAC-SHA256 (base64) of the raw request body,
 * sent in the `X-Yampi-Hmac-SHA256` header. Must hash the raw body text,
 * not a re-serialized version, since key order/whitespace could differ.
 */
export function verifyYampiWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
): boolean {
  if (!signatureHeader) return false;

  const expected = createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("base64");

  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signatureHeader);

  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}
