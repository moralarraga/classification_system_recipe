# Recipe Organization System

Info 202 final project: an information organization and retrieval system for a recipe collection.

## Contents
- `web/`: the faceted recipe browser (Vite + React, optional Supabase, deploys on Vercel). See [web/README.md](web/README.md).
- `classifier/`: cultural relevance classifier (train/tune/sealed holdout split). See [classifier/README.md](classifier/README.md).

## Run the browser
    cd web
    npm install
    npm run dev

## Deploy on Vercel
Import this repo in Vercel and set **Root Directory** to `web` (framework: Vite).
