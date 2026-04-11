# Demo GIF Recording Guide

Target: 30-second GIF showing **add URL → AI classification → Slack alert**.

## Prerequisites

- [ ] Screen recorder installed (Kap, LICEcap, or OBS)
- [ ] Browser at 1280×720 (or 1440×900 for retina)
- [ ] Dark system theme (matches the app)
- [ ] Close browser tabs, bookmarks bar, extensions
- [ ] Hide macOS dock & menu bar (Cmd+Ctrl+F for fullscreen or `defaults write com.apple.dock autohide`)

## Option A: Record with real data (best)

Seed the DB first:

```bash
cd apps/api
npx tsx prisma/seed-demo.ts
```

Then sign in as `demo@apidelta.dev` (via magic link to local SMTP or directly set session).

## Option B: Record with demo mode (no backend needed)

Just append `?demo=true` to any dashboard URL:
- `http://localhost:3000/dashboard?demo=true`
- `http://localhost:3000/dashboard/changes?demo=true`
- etc.

## Option C: Playwright auto-capture (screenshots → GIF)

```bash
cd apps/web
pnpm exec playwright test e2e/demo-capture.spec.ts --headed

# Then stitch with gifski:
gifski --fps 2 --width 1280 -o demo.gif e2e/demo-screenshots/*.png

# Or ffmpeg:
ffmpeg -framerate 2 -pattern_type glob -i 'e2e/demo-screenshots/*.png' \
  -vf "scale=1280:-1:flags=lanczos" -loop 0 demo.gif
```

---

## Recording Script (30 seconds)

Follow this beat-for-beat. Each step = ~3-5 seconds.

### Beat 1: Landing page (0s–5s)
1. Start on `apidelta.dev` landing page (or localhost:3000)
2. Show the hero: "Know when APIs break before your users do"
3. Scroll slowly past the features grid → Slack alert mock preview
4. Pause on the alert preview (this is the hook)

### Beat 2: Dashboard overview (5s–10s)
5. Click "Start free trial" → show the dashboard
6. Pause on stat cards: **5 Monitored APIs, 12 Recent Changes, 10 Alerts Sent**
7. Glance at the recent changes list (CRITICAL badges visible)

### Beat 3: Changes classified by AI (10s–18s)
8. Click "Changes" in the sidebar
9. Show the full changes list — severity badges + change types clearly visible
10. Click the **"Payment Intents: `source` parameter removed"** row (CRITICAL)
11. Detail panel slides open — show:
    - CRITICAL badge + BREAKING type
    - Description with migration deadline
    - Affected endpoints: `/v1/payment_intents`, `/v1/payment_intents/confirm`
12. Pause 2 seconds on the detail panel (let viewer read)

### Beat 4: Alerts → Slack (18s–26s)
13. Click "Alerts" in sidebar
14. Show the alert rules: "Critical → Slack" and "All breaking → Email"
15. Switch to "History" tab
16. Show 10 sent alerts — all green checkmarks
17. Pause on the Slack alert row showing Stripe critical change

### Beat 5: End card (26s–30s)
18. Navigate back to landing page
19. End on CTA: "Start free trial — no credit card required"
20. Fade out or hold

---

## Post-processing

1. **Trim** to exactly 30 seconds
2. **Optimize** with gifski or gifsicle:
   ```bash
   gifsicle --optimize=3 --lossy=80 --colors 256 demo.gif -o demo-optimized.gif
   ```
3. **Target size**: Under 5MB for GitHub README, under 15MB for landing page
4. **Dimensions**: 1280×720 or 960×540

## File placement

- Landing page GIF: `apps/web/public/demo.gif`
- README: embed with `![Demo](apps/web/public/demo.gif)`
- Launch posts: upload to Imgur or GitHub directly

## Tips

- Move your mouse slowly and deliberately — fast cursor movement looks chaotic in GIFs
- Don't click too fast — viewers need time to see what you're clicking
- If using Kap: set to 15 FPS, no click indicators, export as GIF (not MP4)
- If the GIF is too large, reduce to 10 FPS or 960px width
- Test the GIF in a browser before publishing — some viewers loop differently
