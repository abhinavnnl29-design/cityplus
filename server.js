const http = require('http');
const fs = require('fs');
const path = require('path');

let roboflowVision;
try {
    roboflowVision = require('./backend/roboflow_vision.js');
} catch (e) {
    console.warn('Roboflow vision module fallback:', e.message);
}

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname || process.cwd();

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = urlObj.pathname;

    // ------------------------------------------------------------------
    // REST API Endpoint: POST /api/vision/detect
    // ------------------------------------------------------------------
    if (pathname === '/api/vision/detect' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                let payload = {};
                try { payload = JSON.parse(body); } catch (e) { }

                const base64Img = payload.image || payload.frame;
                let result;
                if (roboflowVision) {
                    result = await roboflowVision.inferRoboflowBase64(base64Img);
                } else {
                    result = { status: 'SIMULATED', predictions: [] };
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify(result));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // ------------------------------------------------------------------
    // Static File Serving & MP4 Range Streaming (HTTP 206)
    // ------------------------------------------------------------------
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
    const extname = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            return res.end('<h1>404 Not Found</h1>', 'utf-8');
        }

        const range = req.headers.range;
        const fileSize = stats.size;

        if (range && contentType === 'video/mp4') {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
            const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK_SIZE - 1, fileSize - 1);
            const chunkSize = (end - start) + 1;

            const fileStream = fs.createReadStream(filePath, { start, end });
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4',
                'Cache-Control': 'public, max-age=3600'
            });
            fileStream.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': contentType,
                'Accept-Ranges': 'bytes',
                'Cache-Control': contentType === 'video/mp4' ? 'public, max-age=3600' : 'no-cache'
            });
            fs.createReadStream(filePath).pipe(res);
        }
    });
});

server.listen(PORT, () => {
    console.log(`UrbanPulse Municipal OS Server running at http://localhost:${PORT}`);
});
