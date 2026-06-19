import http from 'node:http';
import https from 'node:https';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createRequestHandler } from '@react-router/express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.resolve(__dirname, '../build/client');
const require = createRequire(import.meta.url);
globalThis.__KRAIG_MF_RUNTIME_PATH__ = require.resolve('@module-federation/runtime');
const build = await import('../build/server/index.js');
const webAppManifest = JSON.parse(
  await readFile(path.join(buildDir, 'manifest.json'), 'utf8')
);

const app = express();
const gatewayOrigin = process.env.GATEWAY_ORIGIN ?? 'http://localhost:3001';
const htmlSecurityHeaders = {
  'Content-Security-Policy': `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self' 'unsafe-inline' ${gatewayOrigin}; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' ${gatewayOrigin}; worker-src 'self'`,
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy':
    'accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp; report-to="default"',
  'Cross-Origin-Resource-Policy': 'same-site',
};
const assetCorsHeaders = {
  'Access-Control-Allow-Origin': 'https://kraig.social',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers':
    'DNT,User-Agent,If-Modified-Since,Cache-Control,Content-Type,Range',
};

app.disable('x-powered-by');

/** Trust that the original request was made over HTTPS */
app.set('trust proxy', true);

app.use('/__gateway', (req, res, next) => {
  const gatewayPath = req.originalUrl.slice('/__gateway'.length) || '/';
  const targetUrl = new URL(gatewayPath, gatewayOrigin);
  const transport = targetUrl.protocol === 'https:' ? https : http;
  const headers = { ...req.headers, host: targetUrl.host };

  const proxyRequest = transport.request(
    targetUrl,
    {
      method: req.method,
      headers,
    },
    (proxyResponse) => {
      const isBrowserReleaseAsset =
        targetUrl.pathname.startsWith('/mf/releases/') &&
        targetUrl.pathname.includes('/browser/') &&
        /\.(?:html|js|json)$/u.test(targetUrl.pathname);

      if (!isBrowserReleaseAsset) {
        res.status(proxyResponse.statusCode ?? 502);
        for (const [name, value] of Object.entries(proxyResponse.headers)) {
          if (value !== undefined) {
            res.setHeader(name, value);
          }
        }
        proxyResponse.pipe(res);
        return;
      }

      const chunks = [];
      proxyResponse.on('data', (chunk) => chunks.push(chunk));
      proxyResponse.on('end', () => {
        const browserGatewayOrigin = '/__gateway';
        let body = Buffer.concat(chunks).toString('utf8');
        body = body
          .split('http://localhost:3001')
          .join(browserGatewayOrigin)
          .split(gatewayOrigin.replace(/\/$/u, ''))
          .join(browserGatewayOrigin);

        res.status(proxyResponse.statusCode ?? 502);
        for (const [name, value] of Object.entries(proxyResponse.headers)) {
          if (
            value !== undefined &&
            name !== 'content-length' &&
            name !== 'content-encoding' &&
            name !== 'etag' &&
            name !== 'cache-control'
          ) {
            res.setHeader(name, value);
          }
        }
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Content-Length', Buffer.byteLength(body));
        res.send(body);
      });
    }
  );

  proxyRequest.on('error', next);
  req.pipe(proxyRequest);
});

app.use((req, res, next) => {
  let contentType;
  const originalSetHeader = res.setHeader.bind(res);

  res.setHeader = (name, value) => {
    if (typeof name === 'string' && name.toLowerCase() === 'content-type') {
      contentType = Array.isArray(value) ? value[0] : value;
    }
    return originalSetHeader(name, value);
  };

  const applyHtmlHeaders = () => {
    const currentType =
      contentType ??
      (typeof res.getHeader === 'function' ? res.getHeader('Content-Type') : undefined);
    if (typeof currentType === 'string' && currentType.toLowerCase().includes('text/html')) {
      for (const [key, value] of Object.entries(htmlSecurityHeaders)) {
        if (!res.hasHeader(key)) {
          res.setHeader(key, value);
        }
      }
    }
  };

  const originalWriteHead = res.writeHead.bind(res);
  res.writeHead = (...args) => {
    applyHtmlHeaders();
    return originalWriteHead(...args);
  };

  const originalEnd = res.end.bind(res);
  res.end = (...args) => {
    applyHtmlHeaders();
    return originalEnd(...args);
  };

  next();
});

app.use((req, res, next) => {
  const isAssetPath =
    req.path.startsWith('/assets/') ||
    /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i.test(req.path);

  if (isAssetPath) {
    for (const [key, value] of Object.entries(assetCorsHeaders)) {
      if (!res.hasHeader(key)) {
        res.setHeader(key, value);
      }
    }

    const vary = res.getHeader('Vary');
    if (!vary) {
      res.setHeader('Vary', 'Origin');
    } else if (typeof vary === 'string' && !vary.includes('Origin')) {
      res.setHeader('Vary', `${vary}, Origin`);
    }
  }

  next();
});

app.use(
  '/assets',
  express.static(path.join(buildDir, 'assets'), {
    immutable: true,
    maxAge: '1y',
  })
);
app.get('/sw.1.js', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(buildDir, 'service-worker.js'));
});
app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
  res.status(204).end();
});
app.get('/manifest.json', (req, res) => {
  const configuredOrigin = process.env.PUBLIC_ORIGIN?.replace(/\/+$/u, '');
  const forwardedHost = req.get('x-forwarded-host')?.split(',')[0]?.trim();
  const requestHost = forwardedHost || req.get('host');
  const requestOrigin = `${req.protocol}://${requestHost}`;
  const publicOrigin = configuredOrigin || requestOrigin;

  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Vary', 'Host, X-Forwarded-Host, X-Forwarded-Proto');
  res.json({
    ...webAppManifest,
    scope: `${publicOrigin}/`,
    start_url: `${publicOrigin}/`,
  });
});
app.use(express.static(buildDir, { maxAge: '1h' }));

app.use(createRequestHandler({ build }));

const host = process.env.HOST ?? '0.0.0.0';
const port = Number.parseInt(process.env.PORT ?? '3000', 10);

app.listen(port, host, () => {
  console.log(`kraig-social server listening on http://${host}:${port}`);
});
