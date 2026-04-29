# Interactive ML + LLM Learning Journey

A static React app for teaching beginner-friendly machine learning and LLM concepts with interactive demos, visual modules, quizzes, a concept map, glossary, and use cases.

Built by Sai Lokesh with Codex.

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173/`.

## Build

```bash
npm run build
```

The static output is generated in `dist/`.

## Deploy To Netlify

1. Push this folder to a Git repository.
2. Create a Netlify site from that repository.
3. Netlify will use `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`

## Deploy To GitHub Pages

```bash
npm run deploy:github
```

The Vite config uses a relative base path, so the built app works from a GitHub Pages project subpath.
