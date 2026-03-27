# AI Image Studio

AI Image Studio is an iPhone-friendly website for AI-assisted image editing with fast local tools and prompt-based generative edits.

## iPhone-first improvements

- ✅ Mobile-first responsive UI with touch-friendly controls.
- ✅ Camera capture support (`capture="environment"`).
- ✅ Web Share support to share edited images directly from iPhone.
- ✅ Progressive Web App support (`manifest.webmanifest` + service worker) so you can add it to your Home Screen.
- ✅ Better denoise implementation (no black border artifacts).
- ✅ AI edit uses the **current canvas image** so local edits can be chained into prompt edits.

## Features

- Upload and edit images in-browser on a canvas.
- Local quick tools:
  - Auto Enhance
  - Denoise & Smooth
  - Dramatic Relight
  - Reset
- Prompt-based AI image edits using OpenAI `gpt-image-1`.
- Download PNG and share images from supported mobile browsers.

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

## Use on iPhone as a website/app

1. Open the deployed website in Safari.
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. Launch AI Image Studio from your Home Screen for an app-like experience.

## API

- `POST /api/ai-edit`
  - Request JSON:
    - `prompt` (string)
    - `imageDataUrl` (data URL string, e.g. `data:image/png;base64,...`)
  - Response JSON:
    - `image` (data URL string)
