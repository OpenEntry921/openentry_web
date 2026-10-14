import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("archive/public-source"),
  port = Number(process.env.PORT || 3002);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};
http
  .createServer(async (req, res) => {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      res.end();
      return;
    }
    try {
      let p = resolve(
        root,
        "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
      );
      if (p !== root && !p.startsWith(root + sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      if ((await stat(p)).isDirectory()) {
        const requested=new URL(req.url,'http://localhost');
        if(!requested.pathname.endsWith('/')) {
          res.writeHead(301,{Location:requested.pathname+'/'+requested.search});
          res.end();return;
        }
        p=resolve(p,'index.html');
      }
      const data = await readFile(p);
      res.writeHead(200, {
        "Content-Type": types[extname(p)] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(req.method === "HEAD" ? undefined : data);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    }
  })
  .listen(port, "0.0.0.0", () =>
    console.log(`OpenEntry listening on port ${port}`),
  );
