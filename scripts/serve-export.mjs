// Local QA server for the exported files; production uses any static host.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('out');
const raw = await readFile(resolve(root, '_headers'), 'utf8');
const headers = Object.fromEntries(
  raw
    .split('\n')
    .filter((s) => s.startsWith('  '))
    .map((s) => {
      const i = s.indexOf(':');
      return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
    }),
);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    let path = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    const data = await readFile(path);
    res.writeHead(200, {
      ...headers,
      'Content-Type': mime[extname(path)] ?? 'application/octet-stream',
    });
    res.end(data);
  } catch {
    res.writeHead(404, headers);
    res.end('Not found');
  }
});
server.listen(3100, '127.0.0.1', () => console.log('Unmeta static export: http://127.0.0.1:3100'));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
