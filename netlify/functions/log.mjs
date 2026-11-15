// Gym Log sync: stores the workout history in this site's Netlify Blobs, under a key derived from your sync code.
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const key = req.headers.get("x-sync-key") || "";
  if (!/^[a-f0-9]{64}$/.test(key)) return new Response("missing sync key", { status: 400 });
  const store = getStore({ name: "gymlog", consistency: "strong" });

  if (req.method === "GET") {
    const data = await store.get(key, { type: "json" });
    return Response.json(Array.isArray(data) ? data : []);
  }
  if (req.method === "PUT") {
    let body;
    try { body = await req.json(); } catch { return new Response("bad json", { status: 400 }); }
    if (!Array.isArray(body) || JSON.stringify(body).length > 2_000_000) return new Response("bad data", { status: 400 });
    await store.setJSON(key, body);
    return Response.json({ ok: true, count: body.length });
  }
  return new Response("method not allowed", { status: 405 });
};

export const config = { path: "/api/log" };
