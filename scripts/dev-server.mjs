import http from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { getFrontendConfig, buildFrontendHealth } from "../src/config/env.mjs";

const config = getFrontendConfig();
const currentDir = dirname(fileURLToPath(import.meta.url));
const publicDir = join(currentDir, "..", "public");

function html(title, body) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body>
    ${body}
  </body>
</html>`;
}

function write(response, statusCode, contentType, body) {
  response.writeHead(statusCode, {
    "content-type": contentType,
    "content-length": Buffer.byteLength(body)
  });
  response.end(body);
}

function contentTypeFor(pathname) {
  const ext = extname(pathname).toLowerCase();
  const types = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml; charset=utf-8"
  };

  return types[ext] ?? "application/octet-stream";
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (request.method === "GET" && url.pathname === "/health") {
    write(response, 200, "application/json; charset=utf-8", JSON.stringify(buildFrontendHealth(config), null, 2));
    return;
  }

  if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/client")) {
    write(response, 200, "text/html; charset=utf-8", html("Data Exchange - Portal Cliente", "<main><h1>Data Exchange</h1><p>Portal cliente reservado para Fase 1.</p></main>"));
    return;
  }

  if (request.method === "GET" && url.pathname === "/admin") {
    write(response, 200, "text/html; charset=utf-8", html("Data Exchange - Portal Admin", "<main><h1>Decision Data Admin</h1><p>Portal admin reservado para Fase 1.</p></main>"));
    return;
  }

  if (request.method === "GET" && url.pathname === "/admin/agent-workbench") {
    const workbenchHtml = readFileSync(join(publicDir, "agent-workbench-live.html"), "utf8");
    write(response, 200, "text/html; charset=utf-8", workbenchHtml);
    return;
  }

  if (request.method === "GET" && url.pathname.startsWith("/")) {
    const requestedPath = normalize(url.pathname.replace(/^\/+/, ""));
    const assetPath = join(publicDir, requestedPath);

    if (assetPath.startsWith(publicDir) && existsSync(assetPath)) {
      write(response, 200, contentTypeFor(assetPath), readFileSync(assetPath));
      return;
    }
  }

  write(response, 404, "application/json; charset=utf-8", JSON.stringify({ status: "not_found", path: url.pathname }));
});

server.listen(config.port, config.host, () => {
  console.log(`data-exchange-frontend listening on http://${config.host}:${config.port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, closing data-exchange-frontend`);
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
