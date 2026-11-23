// Search log export as CSV. Open: /api/export?key=YOUR_EXPORT_KEY&days=7
import { getStore } from "@netlify/blobs";

const csvCell = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export default async (req) => {
  const url = new URL(req.url);
  const key = process.env.EXPORT_KEY;
  if (!key || url.searchParams.get("key") !== key) return new Response("Not found", { status: 404 });

  const days = Math.max(1, Math.min(parseInt(url.searchParams.get("days") || "7", 10) || 7, 90));
  const store = getStore("search-log");
  const rows = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    const { blobs } = await store.list({ prefix: `${day}/` });
    for (let j = 0; j < blobs.length; j += 25) {
      const batch = await Promise.all(blobs.slice(j, j + 25).map((b) => store.get(b.key, { type: "json" })));
      for (const e of batch) if (e) rows.push(e);
    }
  }
  rows.sort((a, b) => (a.t < b.t ? 1 : -1));
  const head = ["time_utc", "country", "mode", "query", "hits", "not_found"];
  const csv = [head.join(",")]
    .concat(rows.map((e) => [e.t, e.country, e.mode, e.query, e.hits, e.not_found].map(csvCell).join(",")))
    .join("\n");
  const today = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="las-search-log-${today}.csv"`,
      "cache-control": "no-store",
    },
  });
};

export const config = {
  path: "/api/export",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
