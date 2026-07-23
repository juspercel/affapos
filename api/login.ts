import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(request: VercelRequest, response: VercelResponse) {
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

  return response.status(200).json({ ok: true });
}
