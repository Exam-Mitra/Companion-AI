# Anshika — AI Companion (₹0 budget clone)

A recreation of your Emergent AI-companion app: onboarding → chat with a
personality-driven companion → companions list → mood journal. Built with
React + Vite, installable as a PWA, and deployable entirely on free tiers.

## What's inside

- **Frontend**: React 19 + Vite + React Router. All UI/UX matches the
  original screens (onboarding steps, chat bubbles with TTS playback,
  companions list/detail, mood journal).
- **Data storage**: Browser `localStorage` — no database needed, no cost,
  works offline. (If you later want multi-device sync, swap this for
  Firebase Firestore free tier or MongoDB Atlas free tier.)
- **AI brain**: `/api/chat` serverless function calling **Groq's free API**
  (Llama 3.3 70B) — fast, free, no credit card. Falls back to a small
  local rule-based responder if no API key is set, so the app never breaks.
- **Voice**: Uses the browser's built-in `SpeechSynthesis` API (100% free,
  no API key) for the speaker/"read aloud" icon under companion messages.
- **PWA**: `vite-plugin-pwa` generates a manifest + service worker so the
  app is installable on Android/iOS home screens and works offline.

## 1. Run it locally

```bash
npm install
npm run dev
```

Open the printed local URL. The app works immediately with the local
fallback AI responder (no API key needed to try it out).

## 2. Get a free AI key (Groq)

1. Go to https://console.groq.com/keys and sign up (free, no card).
2. Create an API key.
3. Keep it handy for the deployment step below.

## 3. Deploy for free (Vercel)

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com → "Add New Project" → import your repo.
   Vercel's Hobby plan is free forever for personal projects.
3. In **Project Settings → Environment Variables**, add:
   - `GROQ_API_KEY` = your key from step 2
4. Deploy. Vercel automatically builds the Vite app and turns
   `api/chat.js` into a serverless function.
5. Your app is now live at `https://your-project.vercel.app` — completely
   free, with a real AI companion brain.

> Alternative free hosts: Netlify (use Netlify Functions instead of
> `/api`), Cloudflare Pages + Pages Functions. The React app itself is
> host-agnostic; only the serverless function syntax would need minor
> tweaks.

## 4. Install it as an app (PWA — works today, zero extra steps)

Once deployed, visiting the site on Android Chrome shows an "Install app"
option (or Menu → "Add to Home screen"). This gives a real app icon,
splash screen, and standalone window — no Play Store needed.

## 5. Publish to the Indus App Store (also free)

Indus Appstore (by PhonePe) accepts APK/AAB files, has **no listing fee
for the first year**, and no commission on in-app payments. Steps:

### Step A — Turn the PWA into an installable APK using Bubblewrap (free, Google's official tool)

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://your-project.vercel.app/manifest.webmanifest
# Follow prompts (it will offer to download Android SDK/JDK automatically)
bubblewrap build
```

This produces an `app-release-signed.apk` (and `.aab`) — a real native
Android app that just wraps your deployed website in a fast, chrome-less
WebView (a "Trusted Web Activity"). This is the same technique Twitter,
Starbucks and many production apps use.

**Important**: to avoid the Android browser UI bar showing, you must add
a **Digital Asset Links** file at
`https://your-project.vercel.app/.well-known/assetlinks.json` proving you
own the domain and the APK. Bubblewrap prints the exact JSON to paste —
just add it as a static file in `public/.well-known/assetlinks.json` in
this project and redeploy.

### Step B — Register as an Indus Appstore developer (free)

1. Go to https://www.indusappstore.com and sign up as a developer
   (self-serve, free).
2. Create a new app listing, upload the APK/AAB from Step A.
3. Fill in title, description, screenshots (you can reuse the ones from
   this chat), category (Lifestyle / Health & Fitness), and privacy
   policy link (see note below).
4. Submit for review — no listing fee for the first year, 0% commission.

### A note on privacy policy & content

Companion/chat apps that discuss emotional topics should have a simple
privacy policy page (what data is stored — in this app, only in the
user's own browser — and that it's not shared with anyone besides the AI
API call for generating replies). I can generate that page for you too if
you want it included in the app.

## Folder structure

```
src/
  pages/          Onboarding, Chat, Companions, CompanionDetail, Journal
  components/     BottomNav, ProgressBar
  lib/            storage.js (localStorage data layer), ai.js (chat + TTS)
api/
  chat.js         Serverless function → Groq free API
public/
  icon-*.png      App icons
  favicon.svg
```

## Customizing

- Colors/fonts: edit CSS variables at the top of `src/index.css`.
- Companion personality prompt: edit `systemPrompt` in `api/chat.js`.
- Onboarding options (relationships/traits): edit the arrays at the top
  of `src/pages/Onboarding.jsx`.

Total cost to build, host, and publish this: **₹0** — Groq API free tier,
Vercel Hobby free tier, browser storage, browser TTS, and Indus Appstore's
free-for-first-year developer listing.
