# AIDevStudios

A full-stack AI chatbot designed for developers, featuring a proper yellow-themed UI with dark/light modes, Markdown, and LaTeX support.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, React Markdown, KaTeX
- **Backend:** Cloudflare Workers (Streaming & Auth)
- **Database:** Cloudflare D1
- **AI Models:** Cloudflare Workers AI

## 🚀 Setup & Local Development

### 1. Database Setup
Create a Cloudflare D1 database:
```bash
npx wrangler d1 create aidevstudios-db
```
*Note the `database_id` provided in the output and replace `YOUR_D1_DATABASE_ID_HERE` in `wrangler.json` with it.*

Initialize the database schema:
```bash
npx wrangler d1 execute aidevstudios-db --local --file=./schema.sql
```
*(To apply schema to production, run the same command without `--local`)*

### 2. Start the Backend Worker
In the root directory (`d:\AIChatbot`), start the Cloudflare Worker:
```bash
npm install -g wrangler
npx wrangler dev
```
The backend will run on `http://localhost:8787`.

### 3. Start the Frontend UI
Open a new terminal, navigate to the `frontend` folder, and start Vite:
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`. 

## 🌐 Deployment

1. **Backend:** Run `npx wrangler deploy` from the root directory.
2. **Frontend:** Update `frontend/.env` to point `VITE_API_URL` to your newly deployed worker's URL (`https://your-worker.your-subdomain.workers.dev`), then build and deploy the frontend (e.g., to Cloudflare Pages or Vercel).

## Features Included
- ✅ Multi-user support with simple DB authentication (No JWT, just direct DB auth for personal use)
- ✅ Real-time Markdown and LaTeX Math rendering
- ✅ Model selection & Extended Thinking toggle
- ✅ Fully local sync across devices using Cloudflare D1
- ✅ Custom yellow aesthetic with Dark/Light modes
- ✅ OpenAI-compatible & Cloudflare Native AI streaming support
