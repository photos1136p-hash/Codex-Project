# AI Image Studio

AI Image Studio is a web app focused on AI-assisted image editing.

## Features

- Upload and edit images in-browser on a canvas.
- Local "AI-style" quick tools:
  - Auto Enhance
  - Denoise & Smooth
  - Dramatic Relight
- Prompt-based AI image edit powered by OpenAI's image editing API (`gpt-image-1`).
- Download edited images as PNG.

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set your OpenAI API key:

   ```bash
   export OPENAI_API_KEY="your_api_key_here"
   ```

3. Start the app:

   ```bash
   npm start
   ```

4. Open:

   ```
   http://localhost:3000
   ```

## Notes

- The prompt-based AI edit route is `POST /api/ai-edit`.
- If `OPENAI_API_KEY` is missing, the route returns a server error with guidance.
