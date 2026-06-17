const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const PUBLIC_DIR = path.resolve(__dirname);
const DB_FILE = path.join(PUBLIC_DIR, 'data', 'db.json');
const LOGS_FILE = path.join(PUBLIC_DIR, 'data', 'logs.json');

// Load .env secure government credentials if present
const envPath = path.join(PUBLIC_DIR, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const index = trimmed.indexOf('=');
            if (index !== -1) {
                const key = trimmed.substring(0, index).trim();
                const val = trimmed.substring(index + 1).trim();
                process.env[key] = val;
            }
        }
    });
}

// Ensure database directory exists
const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // API endpoint GET /api/cases
    if (req.method === 'GET' && req.url === '/api/cases') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            res.end(data || '[]');
        } else {
            res.end('[]');
        }
        return;
    }

    // API endpoint POST /api/cases
    if (req.method === 'POST' && req.url === '/api/cases') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                JSON.parse(body);
                fs.writeFileSync(DB_FILE, body, 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            }
        });
        return;
    }

    // API endpoint GET /api/logs
    if (req.method === 'GET' && req.url === '/api/logs') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        if (fs.existsSync(LOGS_FILE)) {
            const data = fs.readFileSync(LOGS_FILE, 'utf8');
            res.end(data || '[]');
        } else {
            res.end('[]');
        }
        return;
    }

    // API endpoint POST /api/logs
    if (req.method === 'POST' && req.url === '/api/logs') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                JSON.parse(body);
                fs.writeFileSync(LOGS_FILE, body, 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            }
        });
        return;
    }

    // Static file serving
    // Normalize URL path to prevent directory traversal
    const urlPath = req.url.split('?')[0]; // Ignore query params
    let filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath);
    
    // Check if path is outside PUBLIC_DIR
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        const headers = { 'Content-Type': contentType };
        if (filePath.endsWith('service-worker.js') || filePath.endsWith('index.html')) {
            headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
        }

        res.writeHead(200, headers);
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Data file path: ${DB_FILE}`);
    console.log(`Logs file path: ${LOGS_FILE}`);
    if (process.env.UIDAI_SUB_AUA_KEY) {
        console.log(`\x1b[32m[SECURE GATEWAY] Loaded UIDAI Aadhaar e-Sign license key: ${process.env.UIDAI_SUB_AUA_KEY.substring(0, 15)}...\x1b[0m`);
        console.log(`\x1b[32m[SECURE GATEWAY] Loaded AP MeeBhoomi revenue mutation secret: ${process.env.Bhudar_REVENUE_SECRET.substring(0, 15)}...\x1b[0m`);
        console.log(`\x1b[32m[SECURE GATEWAY] IPsec VPN Tunnel configured on gov-port: ${process.env.GOV_VPN_TUNNEL_PORT}\x1b[0m`);
    } else {
        console.log(`\x1b[33m[SECURE GATEWAY] Gateway credentials not detected. Operating in mock offline sandbox mode.\x1b[0m`);
    }
});
