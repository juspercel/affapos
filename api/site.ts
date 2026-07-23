import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isValidAdminToken } from "./_auth";

const siteKey = "affapos:site";

function getRedisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return { url, token };
}

async function redisRequest(path: string, init?: RequestInit) {
  const { url, token } = getRedisConfig();

  if (!url || !token) {
    throw new Error("missing_redis_config");
  }

  const response = await fetch(`${url.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`redis_${response.status}`);
  }

  return response.json() as Promise<{ result?: unknown }>;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    if (request.method === "GET") {
      const data = await redisRequest(`/get/${encodeURIComponent(siteKey)}`);
      const result = typeof data.result === "string" ? JSON.parse(data.result) : null;
      return response.status(200).json({ ok: true, data: result });
    }

    if (request.method === "POST") {
      if (!isValidAdminToken(request.headers.authorization)) {
        return response.status(401).json({ ok: false });
      }

      const payload = request.body || {};
      await redisRequest(`/set/${encodeURIComponent(siteKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(JSON.stringify(payload)),
      });

      return response.status(200).json({ ok: true });
    }

    response.setHeader("Allow", "GET, POST");
    return response.status(405).json({ ok: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return response.status(500).json({ ok: false, error: message });
  }
}
