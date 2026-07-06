const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const root = __dirname;
const port = Number(process.env.PORT || 8080);
const spaRoutes = ['/login', '/register', '/app', '/store', '/checkout', '/success'];

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

async function handleApi(req, res, pathname) {
  const apiName = pathname.replace(/^\/api\//, '').split('/')[0];
  const handlerFile = path.join(root, 'api', `${apiName}.js`);
  if (!handlerFile.startsWith(path.join(root, 'api'))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  if (!fs.existsSync(handlerFile)) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'API route not found' }));
    return;
  }
  delete require.cache[require.resolve(handlerFile)];
  const handler = require(handlerFile);
  const url = new URL(req.url, `http://localhost:${port}`);
  req.url = `${pathname}${url.search || ''}`;
  await handler(req, res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  let filePath = path.join(root, pathname === '/' ? 'frontend/index.html' : pathname);

  if (pathname.startsWith('/api/')) {
    handleApi(req, res, pathname).catch((error) => {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: error.message || 'API handler failed' }));
    });
    return;
  }

  if (spaRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    filePath = path.join(root, 'frontend/index.html');
  }

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`TokoKit dev server running at http://localhost:${port}`);
});
