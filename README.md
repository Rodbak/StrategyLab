# StrategyLab — static site

Black & gold marketing site with **EN/FR** language switching, **multi-currency** display (GHS, USD, EUR, GBP), quote estimator, and Formspree contact forms.

## Run locally

This site loads translations via `fetch('locales/*.json')`, so open it through a **local server** (not `file://`), for example:

```bash
npx --yes serve .
```

Then visit the URL shown (e.g. `http://localhost:3000`).

## Deploy on GitHub

1. Create a new repository on GitHub (no template required).
2. From this folder:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
   git push -u origin main
   ```

### GitHub Pages

- Repo **Settings → Pages → Build and deployment**: choose **GitHub Actions** or deploy the **`main`** branch from **`/` (root)**.
- If the site is served from a **project** URL (`https://USER.github.io/REPO/`), relative paths like `locales/en.json` and `styles.css` still work as long as you open `index.html` via that base URL (not a nested path you didn’t configure).

After the first deploy, confirm **`/locales/en.json`** loads in the browser (Network tab). If it 404s, check the Pages “site URL” matches how you’re opening the site.

## Project layout

| Path | Purpose |
|------|--------|
| `index.html` | Home |
| `get-a-quote.html` | Quote estimator |
| `styles.css`, `quote.css` | Styles |
| `script.js`, `quote.js`, `i18n.js` | Behavior & i18n |
| `locales/en.json`, `locales/fr.json` | Copy & quote strings |

## Config you may change

- **Formspree** endpoints in the HTML forms (`formspree.io/f/...`).
- **Analytics**: gtag + Shown.io scripts in HTML `<head>`.
- **Exchange rates** (indicative): `GHS_PER_UNIT` in `i18n.js`.

## License

Add a `LICENSE` file in the repo if you want to specify terms for the code/assets.
