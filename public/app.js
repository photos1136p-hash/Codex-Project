const imageInput = document.getElementById('imageInput');
const enhanceBtn = document.getElementById('enhanceBtn');
const denoiseBtn = document.getElementById('denoiseBtn');
const dramaticBtn = document.getElementById('dramaticBtn');
const resetBtn = document.getElementById('resetBtn');
const aiEditBtn = document.getElementById('aiEditBtn');
const promptInput = document.getElementById('promptInput');
const statusEl = document.getElementById('status');
const downloadBtn = document.getElementById('downloadBtn');

const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

let originalImageData = null;

function setStatus(message, error = false) {
  statusEl.textContent = message;
  statusEl.style.color = error ? '#ff8f8f' : '#97f7cb';
}

function fitCanvasToImage(img) {
  const maxDim = 1024;
  const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
  canvas.width = Math.floor(img.width * scale);
  canvas.height = Math.floor(img.height * scale);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

imageInput.addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    fitCanvasToImage(img);
    setStatus('Image loaded. Choose a local tool or run AI prompt edit.');
    URL.revokeObjectURL(img.src);
  };
  img.onerror = () => setStatus('Could not read the selected image.', true);
  img.src = URL.createObjectURL(file);
});

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

function applyPixelPass(transform) {
  if (!originalImageData) {
    setStatus('Upload an image first.', true);
    return;
  }

  const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = current;

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = transform(data[i], data[i + 1], data[i + 2], data[i + 3]);
    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
    data[i + 3] = clamp(a);
  }

  ctx.putImageData(current, 0, 0);
}

enhanceBtn.addEventListener('click', () => {
  applyPixelPass((r, g, b, a) => {
    const avg = (r + g + b) / 3;
    const contrast = 1.08;
    const saturateBoost = 1.12;
    return [
      (r - avg) * contrast + avg * saturateBoost + 8,
      (g - avg) * contrast + avg * saturateBoost + 8,
      (b - avg) * contrast + avg * saturateBoost + 8,
      a
    ];
  });
  setStatus('Auto Enhance complete.');
});

denoiseBtn.addEventListener('click', () => {
  if (!originalImageData) {
    setStatus('Upload an image first.', true);
    return;
  }

  const src = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const dst = ctx.createImageData(canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;
      let count = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = x + kx;
          const py = y + ky;
          if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) {
            continue;
          }

          const idx = (py * canvas.width + px) * 4;
          sumR += src.data[idx];
          sumG += src.data[idx + 1];
          sumB += src.data[idx + 2];
          sumA += src.data[idx + 3];
          count++;
        }
      }

      const out = (y * canvas.width + x) * 4;
      dst.data[out] = sumR / count;
      dst.data[out + 1] = sumG / count;
      dst.data[out + 2] = sumB / count;
      dst.data[out + 3] = sumA / count;
    }
  }

  ctx.putImageData(dst, 0, 0);
  setStatus('Denoise & Smooth complete.');
});

dramaticBtn.addEventListener('click', () => {
  applyPixelPass((r, g, b, a) => {
    const lift = 18;
    const gamma = 0.9;
    const nr = Math.pow((r + lift) / 255, gamma) * 255;
    const ng = Math.pow((g + lift) / 255, gamma) * 255;
    const nb = Math.pow((b + lift) / 255, gamma) * 255;
    return [nr * 1.08, ng * 1.02, nb * 0.95, a];
  });
  setStatus('Dramatic Relight complete.');
});

resetBtn.addEventListener('click', () => {
  if (!originalImageData) {
    setStatus('Upload an image first.', true);
    return;
  }

  ctx.putImageData(originalImageData, 0, 0);
  setStatus('Image reset to original.');
});

aiEditBtn.addEventListener('click', async () => {
  if (!originalImageData) {
    setStatus('Upload an image first.', true);
    return;
  }

  const prompt = promptInput.value.trim();
  if (!prompt) {
    setStatus('Enter a prompt for AI edit.', true);
    return;
  }

  aiEditBtn.disabled = true;

  try {
    setStatus('Generating AI edit...');

    const response = await fetch('/api/ai-edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        imageDataUrl: canvas.toDataURL('image/png')
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error || 'AI edit failed.', true);
      return;
    }

    const edited = new Image();
    edited.onload = () => {
      fitCanvasToImage(edited);
      setStatus('AI edit complete.');
    };
    edited.onerror = () => setStatus('AI returned an unreadable image.', true);
    edited.src = payload.image;
  } catch (error) {
    setStatus(error.message || 'Unexpected AI edit error.', true);
  } finally {
    aiEditBtn.disabled = false;
  }
});

downloadBtn.addEventListener('click', () => {
  if (!originalImageData) {
    setStatus('Upload an image first.', true);
    return;
  }

  const imageUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = 'ai-image-edit.png';
  link.href = imageUrl;

  if (typeof link.download === 'string') {
    link.click();
    return;
  }

  // iOS/Safari fallback where download attribute may be ignored.
  window.open(imageUrl, '_blank', 'noopener,noreferrer');
});
