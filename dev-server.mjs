// Local preview server for build/. Run with `npm run dev` or `node dev-server.mjs`.
// Watches build/ for changes? No — just serves. Re-run `npm run build` after edits.
// Port override: PORT=4000 node dev-server.mjs
import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const ROOT = resolve("C:/Users/Public/juniper/build");
const PORT = parseInt(process.env.PORT || "8899", 10);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg":  "image/svg+xml",
  ".webp": "image/webp",
  ".ico":  "image/x-icon",
  ".sql":  "text/plain; charset=utf-8",
  ".md":   "text/markdown; charset=utf-8",
  ".woff2": "font/woff2",
};

createServer((req, res) => {
  let url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/" || url.endsWith("/")) url += "index.html";
  // Pretty URLs: /drift → /drift.html
  if (!extname(url) && !url.endsWith("/")) url += ".html";
  const path = resolve(join(ROOT, url));
  if (!path.startsWith(ROOT)) { res.writeHead(403); return res.end("forbidden"); }
  try {
    const stat = statSync(path);
    if (stat.isDirectory()) { res.writeHead(404); return res.end("not found"); }
    const body = readFileSync(path);
    res.writeHead(200, {
      "Content-Type": TYPES[extname(path)] || "application/octet-stream",
      "Content-Length": body.length,
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found: " + url);
  }
}).listen(PORT, () => {
  console.log(`Juniper dev server → http://localhost:${PORT}/`);
  console.log(`  /drift   /admin   /index   /directory   /offers   /events   /support`);
});
