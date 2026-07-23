import { createHmac } from "node:crypto";

const tokenTtlMs = 1000 * 60 * 60 * 12;

function getSecret() {
  return process.env.ADMIN_PASSWORD || "development-secret";
}

function sign(value) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function createAdminToken() {
  const payload = JSON.stringify({ exp: Date.now() + tokenTtlMs });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export default function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ ok: false });
  }

  const { email, password } = request.body || {};
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return response.status(500).json({ ok: false, error: "missing_config" });
  }

  const isValid =
    String(email || "").trim().toLowerCase() === adminEmail.trim().toLowerCase() &&
    String(password || "") === adminPassword;

  if (!isValid) {
    return response.status(401).json({ ok: false });
  }

  return response.status(200).json({ ok: true, token: createAdminToken() });
}
