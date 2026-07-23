import { createHmac, timingSafeEqual } from "node:crypto";

const siteKey = "affapos:site";
const tokenTtlMs = 1000 * 60 * 60 * 12;

function getSecret() {
  return process.env.ADMIN_PASSWORD || "development-secret";
}

function sign(value) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function isValidAdminToken(header) {
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
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function getRedisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return { url, token };
}

function hasRedisConfig() {
  const { url, token } = getRedisConfig();
  return Boolean(url && token);
}

async function redisCommand(command) {
  const { url, token } = getRedisConfig();

  if (!url || !token) {
    throw new Error("missing_redis_config");
  }

  const response = await fetch(url.replace(/\/$/, ""), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }

  if (!response.ok || data?.error) {
    throw new Error(data?.error || `redis_${response.status}`);
  }

  return data;
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    if (request.method === "GET") {
      if (!hasRedisConfig()) {
        return response.status(200).json({ ok: true, data: null, storage: "local" });
      }

      const data = await redisCommand(["GET", siteKey]);
      const result = typeof data.result === "string" ? JSON.parse(data.result) : null;
      return response.status(200).json({ ok: true, data: result, storage: "redis" });
    }

    if (request.method === "POST") {
      if (!isValidAdminToken(request.headers.authorization)) {
        return response.status(401).json({ ok: false });
      }

      if (!hasRedisConfig()) {
        return response.status(500).json({ ok: false, error: "missing_redis_config" });
      }

      const payload = request.body || {};
      await redisCommand(["SET", siteKey, JSON.stringify(payload)]);

      return response.status(200).json({ ok: true, storage: "redis" });
    }

    response.setHeader("Allow", "GET, POST");
    return response.status(405).json({ ok: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return response.status(500).json({ ok: false, error: message });
  }
}
