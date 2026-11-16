const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const targetPath = parsedUrl.path;

    if (targetPath === '/' || targetPath === '/favicon.ico') {
        res.writeHead(200, { 'Content-Type': 'text/plain;charset=UTF-8' });
        res.end('IPTV Proxy is running successfully!');
        return;
    }

    // الرابط المستهدف الأصلي
    const targetUrl = `http://103.176.90.137${targetPath}`;

    const proxyReq = http.request(targetUrl, {
        headers: {
            'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
            'Referer': 'http://103.176.90.137/'
        }
    }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
            ...proxyRes.headers,
            'Access-Control-Allow-Origin': '*'
        });
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'text/plain;charset=UTF-8' });
        res.end('Proxy Error: ' + err.message);
    });

    req.pipe(proxyReq);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
