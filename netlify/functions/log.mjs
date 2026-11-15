// Gym Log sync: stores the workout history in this site's Netlify Blobs.
// The whole site sits behind the password gate (edge-functions/gate.js), so there is one history: yours.
import { getStore } from "@netlify/blobs";

const KEY = "history";

export default async (req) => {
  const store = getStore({ name: "gymlog", consistency: "strong" });

  if (req.method === "GET") {
    const data = await store.get(KEY, { type: "json" });
    return Response.json(Array.isArray(data) ? data : [], { headers: { "cache-control": "no-store" } });
  }
  if (req.method === "PUT") {
    let body;
    try { body = await req.json(); } catch { return new Response("bad json", { status: 400 }); }
    if (!Array.isArray(body) || JSON.stringify(body).length > 2_000_000) return new Response("bad data", { status: 400 });
    await store.setJSON(KEY, body);
    return Response.json({ ok: true, count: body.length });
  }
  return new Response("method not allowed", { status: 405 });
};

export const config = { path: "/api/log" };
