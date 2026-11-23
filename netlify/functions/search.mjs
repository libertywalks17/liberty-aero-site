// Parts search API: the inventory stays on the server; the browser only gets the rows it asked for.
import { getStore } from "@netlify/blobs";
import PARTS from "../lib/parts.mjs";
import { makeEngine } from "../lib/engine.mjs";

const ENG = makeEngine(PARTS);

async function logSearch(entry) {
  try {
    const key = `${entry.t.slice(0, 10)}/${entry.t.slice(11, 23)}-${Math.random().toString(36).slice(2, 8)}`;
    await getStore("search-log").setJSON(key, entry);
  } catch (e) {
    console.error("search log failed", e && e.message);
  }
}

export default async (req, context) => {
  const url = new URL(req.url);
  const pns = (url.searchParams.get("pns") || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50);
  const q = (url.searchParams.get("q") || "").slice(0, 80);
  const res = pns.length > 1 ? ENG.bulk(pns) : ENG.single(pns[0] || q);

  if (res.mode !== "short") {
    const entry = {
      t: new Date().toISOString(),
      country: (context && context.geo && context.geo.country && context.geo.country.code) || "",
      mode: res.mode,
      query: res.mode === "bulk" ? res.checked.join(" | ") : (pns[0] || q).trim().toUpperCase(),
      hits: res.items.length,
      not_found: res.mode === "bulk" ? res.missing.join(" | ") : (res.items.length ? "" : (pns[0] || q).trim().toUpperCase()),
    };
    const p = logSearch(entry);
    if (context && typeof context.waitUntil === "function") context.waitUntil(p);
    else await p;
  }

  return new Response(JSON.stringify(res), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
};

export const config = {
  path: "/api/search",
  rateLimit: { windowLimit: 40, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
