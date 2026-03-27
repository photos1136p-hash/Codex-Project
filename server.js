const express = require('express');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.post('/api/ai-edit', upload.single('image'), async (req, res) => {
  try {
    const { prompt } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Please upload an image.' });
    }

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Please add an edit prompt.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OPENAI_API_KEY is not configured on the server.'
      });
    }

    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });

    formData.append('model', 'gpt-image-1');
    formData.append('prompt', prompt);
    formData.append('image', blob, file.originalname || 'upload.png');

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      const details = await response.text();
      return res.status(response.status).json({
        error: 'Failed to generate AI edit.',
        details
      });
    }

    const payload = await response.json();
    const base64Image = payload?.data?.[0]?.b64_json;

    if (!base64Image) {
      return res.status(502).json({ error: 'No edited image returned by AI API.' });
    }

    return res.json({ image: `data:image/png;base64,${base64Image}` });
  } catch (error) {
    return res.status(500).json({
      error: 'Unexpected server error while editing image.',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI Image Editor running at http://localhost:${PORT}`);
});
