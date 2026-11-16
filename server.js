const http = require('http');
const https = require('https');
const url = require('url');

const server = http.createServer((req, res) => {
    try {
        const parsedUrl = url.parse(req.url, true);
        const targetPath = parsedUrl.path;

        if (targetPath === '/' || targetPath === '/favicon.ico') {
            res.writeHead(200, { 'Content-Type': 'text/plain;charset=UTF-8' });
            res.end('IPTV Safe Proxy is running!');
            return;
        }

        const initialTarget = `http://103.176.90.137${targetPath}`;

        function makeProxyRequest(currentUrl, originalReq) {
            const client = currentUrl.startsWith('https') ? https : http;

            const proxyReq = client.get(currentUrl, {
                headers: {
                    'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
                    'Referer': 'http://103.176.90.137/',
                    'Accept': '*/*'
                },
                timeout: 10000 // مهلة 10 ثوانٍ لمنع تعليق السيرفر
            }, (proxyRes) => {
                // تتبع التحويل (Redirect)
                if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
                    let redirectUrl = proxyRes.headers.location;
                    if (redirectUrl.startsWith('/')) {
                        try {
                            const parsedOriginal = new URL(currentUrl);
                            redirectUrl = `${parsedOriginal.protocol}//${parsedOriginal.host}${redirectUrl}`;
                        } catch (e) {}
                    }
                    return makeProxyRequest(redirectUrl, originalReq);
                }

                const host = originalReq.headers['host'];
                const protocol = 'https://';
                const contentType = proxyRes.headers['content-type'] || '';
                const isM3U8 = currentUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('text');

                if (isM3U8) {
                    let data = '';
                    proxyRes.on('data', chunk => { data += chunk; });
                    proxyRes.on('end', () => {
                        try {
                            // تعديل الروابط الداخلية لتمر عبر البروكسي الآمن
                            let modifiedData = data.replace(/http:\/\/([^\/]+)(\/[^\s]+)?/g, (match, p1, p2) => {
                                return `${protocol}${host}${p2 || ''}`;
                            });

                            res.writeHead(proxyRes.statusCode, {
                                ...proxyRes.headers,
                                'Access-Control-Allow-Origin': '*',
                                'Content-Length': Buffer.byteLength(modifiedData)
                            });
                            res.end(modifiedData);
                        } catch (err) {
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('M3U8 Parse Error');
                        }
                    });
                } else {
                    // تمرير تدفق الفيديو المباشر (TS) بدون أي تعديل وبسلاسة
                    res.writeHead(proxyRes.statusCode, {
                        ...proxyRes.headers,
                        'Access-Control-Allow-Origin': '*'
                    });
                    proxyRes.pipe(res);
                }
            });

            proxyReq.on('error', (err) => {
                if (!res.headersSent) {
                    res.writeHead(502, { 'Content-Type': 'text/plain;charset=UTF-8' });
                    res.end('Bad Gateway / Stream Unreachable');
                }
            });

            proxyReq.on('timeout', () => {
                proxyReq.destroy();
                if (!res.headersSent) {
                    res.writeHead(504, { 'Content-Type': 'text/plain;charset=UTF-8' });
                    res.end('Gateway Timeout');
                }
            });
        }

        makeProxyRequest(initialTarget, req);

    } catch (e) {
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Server Internal Error');
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
