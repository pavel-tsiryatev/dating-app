import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 5173);
const upstream = new URL(process.env.API_URL || 'http://127.0.0.1:3000');
if (!['http:', 'https:'].includes(upstream.protocol)) throw new Error('API_URL must be HTTP(S)');
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.png':'image/png', '.json':'application/json' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      const endpoint = new URL(upstream);
      endpoint.pathname = upstream.pathname.replace(/\/$/, '') + url.pathname.slice(4);
      endpoint.search = url.search;
      const headers = {};
      for (const key of ['authorization','content-type','idempotency-key']) if (req.headers[key]) headers[key] = req.headers[key];
      const chunks=[]; let size=0;
      for await (const chunk of req) { size+=chunk.length; if(size>(url.pathname==='/api/profile/photos/upload'?6*1048576:1048576)) {res.writeHead(413);res.end();return;} chunks.push(chunk); }
      const response = await fetch(endpoint, { method:req.method, headers, body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks), signal:AbortSignal.timeout(15000), redirect:'manual' });
      res.writeHead(response.status, { 'Content-Type':response.headers.get('content-type') || 'application/json', 'Cache-Control':'no-store' });
      res.end(Buffer.from(await response.arrayBuffer())); return;
    }
    const decoded = decodeURIComponent(url.pathname);
    const file = path.resolve(root, '.' + (decoded==='/'?'/index.html':decoded));
    const relative = path.relative(root,file);
    if (!file.startsWith(root) || !(relative==='index.html' || ['assets','src'].some(dir=>relative.startsWith(dir+path.sep)))) {res.writeHead(404);res.end('Not found');return;}
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type':mime[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff', 'Cache-Control':'no-cache', 'Referrer-Policy':'same-origin' });res.end(body);
  } catch(error) {res.writeHead(error.code==='ENOENT'?404:502, { 'Content-Type':'application/json; charset=utf-8' });res.end(JSON.stringify({message:error.code==='ENOENT'?'Файл не найден':'Бэкенд недоступен. Запусти API на порту 3000 или проверь API_URL.'}));}
});
server.listen(port, '127.0.0.1', () => console.log(`CAMPUS: http://localhost:${server.address().port}\nAPI proxy: ${upstream.origin}`));
