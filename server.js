const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_BODY_SIZE = 12 * 1024 * 1024; // 12MB JSON payload cap

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let totalSize = 0;
    const chunks = [];

    req.on('data', (chunk) => {
      totalSize += chunk.length;
      if (totalSize > MAX_BODY_SIZE) {
        reject(new Error('Body is too large. Please use a smaller image.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        resolve(JSON.parse(raw || '{}'));
      } catch {
        reject(new Error('Invalid JSON request body.'));
      }
    });

    req.on('error', (err) => reject(err));
  });
}

function parseDataUrl(imageDataUrl) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(imageDataUrl || '');
  if (!match) {
    return null;
  }

  const mimeType = match[1];
  const base64 = match[2];
  return { mimeType, buffer: Buffer.from(base64, 'base64') };
}

async function serveStaticFile(req, res) {
  const requestPath = new URL(req.url, `http://${req.headers.host}`).pathname;
  const safePath = requestPath === '/' ? '/index.html' : requestPath;
  const normalizedPath = path.normalize(safePath).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, normalizedPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: 'Forbidden path.' });
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(file);
  } catch {
    sendJson(res, 404, { error: 'Not found.' });
  }
}

async function handleAiEdit(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(res, 500, { error: 'OPENAI_API_KEY is not configured on the server.' });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
    return;
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const imageDataUrl = typeof body.imageDataUrl === 'string' ? body.imageDataUrl : '';

  if (!prompt) {
    sendJson(res, 400, { error: 'Please provide an edit prompt.' });
    return;
  }

  const parsed = parseDataUrl(imageDataUrl);
  if (!parsed || !parsed.buffer.length) {
    sendJson(res, 400, { error: 'Please provide a valid base64 data URL image.' });
    return;
  }

  const formData = new FormData();
  const imageBlob = new Blob([parsed.buffer], { type: parsed.mimeType });
  formData.append('model', 'gpt-image-1');
  formData.append('prompt', prompt);
  formData.append('image', imageBlob, `input.${parsed.mimeType.split('/')[1] || 'png'}`);

  try {
    const aiResponse = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    });

    const text = await aiResponse.text();
    let payload = {};
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }

    if (!aiResponse.ok) {
      sendJson(res, aiResponse.status, {
        error: 'Failed to generate AI edit.',
        details: payload
      });
      return;
    }

    const base64Image = payload?.data?.[0]?.b64_json;
    if (!base64Image) {
      sendJson(res, 502, { error: 'AI response did not include an edited image.' });
      return;
    }

    sendJson(res, 200, { image: `data:image/png;base64,${base64Image}` });
  } catch (error) {
    sendJson(res, 500, {
      error: 'Unexpected server error while editing image.',
      details: error.message
    });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/ai-edit') {
    await handleAiEdit(req, res);
    return;
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    await serveStaticFile(req, res);
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed.' });
});

server.listen(PORT, () => {
  console.log(`AI Image Studio running at http://localhost:${PORT}`);
});
