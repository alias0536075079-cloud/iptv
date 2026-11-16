const http = require('http');
const https = require('https');
const url = require('url');

const server = http.createServer((req, res) => {
    try {
        const parsedUrl = url.parse(req.url, true);
        const targetPath = parsedUrl.path;

        if (targetPath === '/' || targetPath === '/favicon.ico') {
            res.writeHead(200, { 'Content-Type': 'text/plain;charset=UTF-8' });
            res.end('IPTV Clean Proxy is running!');
            return;
        }

        // استخدام السيرفر المباشر الفعّال
        const initialTarget = `http://103.176.91.49${targetPath}`;

        const proxyReq = http.request(initialTarget, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'http://103.176.91.49/',
                'Accept': '*/*'
            }
        }, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, {
                ...proxyRes.headers,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                'Access-Control-Allow-Headers': '*'
            });

            proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
            if (!res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'text/plain;charset=UTF-8' });
                res.end('Proxy Error: ' + err.message);
            }
        });

        req.pipe(proxyReq);

    } catch (e) {
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        }
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
