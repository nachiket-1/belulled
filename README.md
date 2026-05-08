# lull · be lulled

A small offering for an Instagram bio link.

Curated by **Nachiket**.

---

## What's inside

**Four experiences:**

🌙 **slow down** — pick an ambient soundscape (rain, ocean, fire, night, stream, or silence) → sixty seconds of guided breathing with a luminous orb that breathes with you.

🌌 **feel small** — a real Three.js cinematic zoom-out: from a stylized 3D mountain → Earth (with atmosphere shader) → our sun among many → a spiral galaxy → distant cosmos. Poetic captions fade in as the camera moves through space.

✨ **play** — draw your own constellation. Drag from one bright star to another to connect them. Lines stay glowing. When you're done: *"it has never existed before. no one will ever draw it the same way. that's what makes it yours."*

◌ **heavy day** — for the days when nothing is okay. A slow, honest sequence of words appears, then a gentle 30-second guided exhale (4 in, 2 hold, 6 out). No fixes. Just presence.

---

## Run locally

```bash
npm install
npm run dev
```

## Deploy (auto)

Set up to auto-deploy to GitHub Pages on every push to `main`.

1. Repo → **Settings → Pages → Source → GitHub Actions**.
2. Push code. Wait ~3 minutes.
3. Live at `https://YOUR_USERNAME.github.io/lull/`.

## Audio

Five ambient tracks live in `public/sounds/` — `rain.mp3`, `ocean.mp3`, `fire.mp3`, `night.mp3`, `stream.mp3`. Each is ~1-1.4MB, 96kbps mono, ~120s loop with fade-in/out for clean looping.

## Customizing

- **Your name in signature** → `SIGNATURE` constant at the top of `src/App.tsx`
- **Add/remove choices** → the `choices` array in `App.tsx`
- **Heavy-day text** → `LINES` array at the top of `src/HeavyDay.tsx`
- **Sound options** → `SOUNDS` array in `src/Breathing.tsx`
- **3D scene tweaks** → `src/FeelSmall.tsx` (Three.js)
- **Constellation behavior** → `src/Constellation.tsx`
- **Colors / typography** → `src/index.css` (CSS variables at top)

## Domain

`lull` is short and uncommon — domains are usually under ₹250/year:
- `lull.fun`, `lull.xyz`, `lull.space`, `lull.lol`, `lull.in`

Best registrar: **Porkbun**. After buying, see `vite.config.ts` to switch base path to `/`, and add a `public/CNAME` file with your domain.
