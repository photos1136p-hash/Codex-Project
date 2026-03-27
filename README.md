# AI Image Studio

AI Image Studio is a web app for AI-assisted image editing with fast local tools and prompt-based generative edits.

## What's improved

- ✅ Dependency-free Node server (no `npm install` required).
- ✅ Cleaner and safer API flow using JSON payloads.
- ✅ Better denoise implementation (no black border artifacts).
- ✅ AI edit uses the **current canvas image** so local edits can be chained into the prompt edit.

## Features

- Upload and edit images in-browser on a canvas.
- Local quick tools:
  - Auto Enhance
  - Denoise & Smooth
  - Dramatic Relight
  - Reset
- Prompt-based AI image edits using OpenAI `gpt-image-1`.
- Download edited images as PNG.

## Run locally

1. Set your OpenAI API key:

   ```bash
   export OPENAI_API_KEY="your_api_key_here"
   ```

2. Start the app:

   ```bash
   npm start
   ```

3. Open:

   ```
   http://localhost:3000
   ```

## API

- `POST /api/ai-edit`
  - Request JSON:
    - `prompt` (string)
    - `imageDataUrl` (data URL string, e.g. `data:image/png;base64,...`)
  - Response JSON:
    - `image` (data URL string)
