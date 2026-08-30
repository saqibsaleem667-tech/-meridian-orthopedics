# Meridian Orthopaedics — Deployment

This is a ready-to-deploy Vite + React project. The backend (Google Sheets +
Apps Script) is already deployed and wired into `src/App.jsx` via `API_URL`.

## Deploy via GitHub + Vercel (free)

1. **GitHub**
   - Go to github.com, create a new repository (e.g. `meridian-orthopaedics`).
   - Upload all the files in this folder to that repo (drag-and-drop on
     GitHub's web UI works fine, or use `git push` if you have git set up).

2. **Vercel**
   - Go to vercel.com, sign in with your GitHub account.
   - "Add New" → "Project" → pick the `meridian-orthopaedics` repo.
   - Vercel auto-detects Vite — leave the defaults, click "Deploy".
   - After a minute you'll get a live URL like
     `meridian-orthopaedics.vercel.app` — that's your real site.

3. **First admin login**
   - Open your live site + `?admin=1` (e.g.
     `meridian-orthopaedics.vercel.app/?admin=1`).
   - Log in with passcode `meridian2026` — since the Google Sheet is brand
     new, this first login sets that as the real passcode.
   - Go straight to Site Settings / passcode section and generate a
     recovery code (there's no default one anymore — it's genuinely random
     now) and save it somewhere safe.
   - Then change the passcode to something only you know.

4. Every future change: edit the code, push to GitHub, Vercel redeploys
   automatically within a minute or two.
