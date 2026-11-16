const http = require('http');
const https = require('https');
const url = require('url');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const targetPath = parsedUrl.path;

    if (targetPath === '/' || targetPath === '/favicon.ico') {
        res.writeHead(200, { 'Content-Type': 'text/plain;charset=UTF-8' });
        res.end('IPTV Stream Proxy is running!');
        return;
    }

    // الرابط الأساسي الأول
    const initialTarget = `http://103.176.90.137${targetPath}`;

    function makeProxyRequest(currentUrl) {
        const client = currentUrl.startsWith('https') ? https : http;

        client.get(currentUrl, {
            headers: {
                'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
                'Referer': 'http://103.176.90.137/',
                'Accept': '*/*'
            }
        }, (proxyRes) => {
            // تتبع التحويل (Redirect) إذا حدث
            if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
                let redirectUrl = proxyRes.headers.location;
                if (redirectUrl.startsWith('/')) {
                    const parsedOriginal = new URL(currentUrl);
                    redirectUrl = `${parsedOriginal.protocol}//${parsedOriginal.host}${redirectUrl}`;
                }
                return makeProxyRequest(redirectUrl);
            }

            // إرسال الرؤوس مع السماح بالوصول من أي مصدر (CORS)
            res.writeHead(proxyRes.statusCode, {
                ...proxyRes.headers,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                'Access-Control-Allow-Headers': '*'
            });

            // تمرير تدفق الفيديو مباشرة وبدون انقطاع
            proxyRes.pipe(res);

        }).on('error', (err) => {
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain;charset=UTF-8' });
                res.end('Proxy Error: ' + err.message);
            }
        });
    }

    makeProxyRequest(initialTarget);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
