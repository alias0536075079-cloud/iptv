const http = require('http');
const https = require('https');
const url = require('url');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const targetPath = parsedUrl.path;

    if (targetPath === '/' || targetPath === '/favicon.ico') {
        res.writeHead(200, { 'Content-Type': 'text/plain;charset=UTF-8' });
        res.end('IPTV Rewrite Proxy is running!');
        return;
    }

    const initialTarget = `http://103.176.90.137${targetPath}`;

    function makeProxyRequest(currentUrl, originalReq) {
        const client = currentUrl.startsWith('https') ? https : http;

        client.get(currentUrl, {
            headers: {
                'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
                'Referer': 'http://103.176.90.137/'
            }
        }, (proxyRes) => {
            if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
                let redirectUrl = proxyRes.headers.location;
                if (redirectUrl.startsWith('/')) {
                    const parsedOriginal = new URL(currentUrl);
                    redirectUrl = `${parsedOriginal.protocol}//${parsedOriginal.host}${redirectUrl}`;
                }
                return makeProxyRequest(redirectUrl, originalReq);
            }

            // تحديد النطاق الخاص بك على Render تلقائياً
            const host = originalReq.headers['host'];
            const protocol = 'https://'; // إجبار الـ https

            // التحقق مما إذا كان الرد عبارة عن ملف نصي/محتوى m3u8 لتعديل روابطه الداخلية
            const contentType = proxyRes.headers['content-type'] || '';
            if (contentType.includes('text') || contentType.includes('application') || currentUrl.includes('.m3u8')) {
                let data = '';
                proxyRes.on('data', chunk => { data += chunk; });
                proxyRes.on('end', () => {
                    // استبدال روابط السيرفرات الداخلية برابط البروكسي الخاص بك لتظل آمنة
                    let modifiedData = data.replace(/http:\/\/([^\/]+)/g, `${protocol}${host}`);

                    res.writeHead(proxyRes.statusCode, {
                        ...proxyRes.headers,
                        'Access-Control-Allow-Origin': '*',
                        'Content-Length': Buffer.byteLength(modifiedData)
                    });
                    res.end(modifiedData);
                });
            } else {
                // تيار الفيديو المباشر (TS or Media Stream) يُمرر مباشرة بدون تعديل
                res.writeHead(proxyRes.statusCode, {
                    ...proxyRes.headers,
                    'Access-Control-Allow-Origin': '*'
                });
                proxyRes.pipe(res);
            }

        }).on('error', (err) => {
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain;charset=UTF-8' });
                res.end('Proxy Error: ' + err.message);
            }
        });
    }

    makeProxyRequest(initialTarget, req);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
