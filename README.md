# StrategyLab — static site

Web, software, AI-automation & Meta Ads agency site. **EN/FR** language switching, **multi-currency** display (GHS, CFA/XOF), quote estimator, and Formspree contact forms. No build step — plain HTML/CSS/JS, deployable as-is.

> **Status:** `index.html` and `get-a-quote.html` are both on the new design system — cold white / vibrant indigo / night blue. `pdf/influencer-marketing-proposal.html` is still on its original styling, pending the same pass.

## Run locally

This site loads translations via `fetch('locales/*.json')`, so open it through a **local server** (not `file://`):

```bash
npx --yes serve .
# or
python3 -m http.server
```

Then visit the URL shown (e.g. `http://localhost:3000`).

## Deploy

### GitHub Pages

1. Push this folder to a GitHub repo.
2. Repo **Settings → Pages → Build and deployment**: deploy the **`main`** branch from **`/` (root)**.
3. `CNAME` is already set to `strategylab.it.com` — point your domain's DNS at GitHub Pages if you haven't already (GitHub's docs: *Managing a custom domain for your GitHub Pages site*).
4. After the first deploy, open `/locales/en.json` directly in the browser to confirm it 200s rather than 404s.

### Vercel

No configuration needed — Vercel auto-detects this as a static site (no `package.json`, no framework).

1. **Add New → Project** → import this repo (or run `npx vercel` from this folder).
2. Leave the build settings blank/default and deploy.
3. Add `strategylab.it.com` under **Project → Settings → Domains** if you want the same custom domain here instead of / in addition to GitHub Pages.

## Project layout

| Path | Purpose |
|------|--------|
| `index.html` | Home |
| `get-a-quote.html` | Quote estimator |
| `pdf/influencer-marketing-proposal.html` | Standalone client proposal document (previous design, pending update) |
| `theme.css` | Shared design system used by `index.html` and `get-a-quote.html` |
| `quote.css` | Quote-page-specific styles (estimator form, results, lead capture) |
| `main.js` | Shared nav/counter/form interactions (all pages) |
| `quote.js` | Quote-page estimator logic (budget, pricing, results, lead capture) |
| `i18n.js` | Shared translation + currency engine (all pages) |
| `locales/en.json`, `locales/fr.json` | Copy & quote strings |

## Config you may change

- **Formspree** endpoints in the HTML forms (`formspree.io/f/...`).
- **Analytics**: gtag + Shown.io scripts in each page's `<head>`.
- **Exchange rate** (indicative, drifts over time): `GHS_PER_UNIT` in `i18n.js`.

## License

Add a `LICENSE` file in the repo if you want to specify terms for the code/assets.
