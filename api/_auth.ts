import { createHmac, timingSafeEqual } from "node:crypto";

const tokenTtlMs = 1000 * 60 * 60 * 12;

function getSecret() {
  return process.env.ADMIN_PASSWORD || "development-secret";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createAdminToken() {
  const payload = JSON.stringify({ exp: Date.now() + tokenTtlMs });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function isValidAdminToken(header: string | undefined) {
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) return false;

  const expectedSignature = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}
