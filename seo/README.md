# SEO workflow — Mason Homes Construction (Tampa)

Domain: `masonhomesconstruction.com`
Site source: `../site/` (static HTML, deployed to Netlify)

## Pipeline

```
1. inventory     → list every URL we already publish (from site/sitemap.xml)
2. competitors   → pick 5–8 Tampa remodeling competitors
3. fetch         → DataForSEO: ranked keywords for us + each competitor
4. gap           → keywords competitors rank for that we don't
5. brief         → cluster gap keywords → new-page briefs (seo/page-briefs/)
6. build         → write new HTML pages into site/
7. audit         → Firecrawl + on-page checks against site/ or live URL
8. deploy        → Netlify (CLI or API)
```

## Folders

- `competitors/` — competitor lists, profile notes
- `gaps/` — gap-analysis CSVs (one per run, dated)
- `page-briefs/` — markdown briefs per new page (target keyword, SERP intent, outline)
- `audits/` — audit reports per run (dated)
- `data/` — raw DataForSEO/Firecrawl JSON dumps (gitignored — credit-derived)

## Cost discipline

DataForSEO charges per task. Before any script that hits the live API:

- Run with `DATAFORSEO_MODE=sandbox` first (free, returns dummy data).
- Each script prints the **estimated cost** and waits for confirmation unless
  `--yes` is passed.
- All raw responses are cached under `seo/data/<endpoint>/<hash>.json` so
  re-running is free.

## Common commands

```bash
# one-time setup
python -m venv .venv && source .venv/bin/activate
pip install -r ../requirements.txt
cp ../.env.example ../.env  # then fill in secrets

# per-run (from repo root)
python scripts/inventory.py                    # scan site/ → seo/our-pages.csv
python scripts/dataforseo_competitors.py       # pull competitor keywords
python scripts/dataforseo_gap.py               # compute gap, write seo/gaps/<date>.csv
python scripts/audit.py --target site          # local file audit
python scripts/audit.py --target live          # crawl masonhomesconstruction.com
python scripts/deploy.py                       # stub — Vercel not configured yet
```
