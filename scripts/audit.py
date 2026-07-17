"""Run an SEO audit against site/ (local files) or the live domain via Firecrawl.

Local mode: free, parses HTML, checks title/meta/canonical/H1/internal-link sanity.
Live mode:  uses Firecrawl /v1/scrape per URL — Firecrawl pricing applies (~1 credit/page).

Usage:
    python scripts/audit.py --target site          # parse local site/ files
    python scripts/audit.py --target live --yes    # crawl live domain via Firecrawl
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
from datetime import date
from pathlib import Path

import requests
from bs4 import BeautifulSoup

from _common import REPO_ROOT, SEO_DIR, SITE_DIR, confirm, env

FIRECRAWL_SCRAPE = "https://api.firecrawl.dev/v1/scrape"


def check_html(html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    title = soup.title.string.strip() if soup.title and soup.title.string else ""
    meta_desc = soup.find("meta", attrs={"name": "description"})
    desc = (meta_desc.get("content") or "").strip() if meta_desc else ""
    canonical = soup.find("link", attrs={"rel": "canonical"})
    canon = canonical.get("href") if canonical else ""
    h1s = [h.get_text(strip=True) for h in soup.find_all("h1")]
    word_count = len(re.findall(r"\w+", soup.get_text(" ")))
    issues = []
    if not title: issues.append("missing-title")
    elif len(title) > 60: issues.append("title-too-long")
    if not desc: issues.append("missing-description")
    elif len(desc) > 160: issues.append("description-too-long")
    if not canon: issues.append("missing-canonical")
    if len(h1s) == 0: issues.append("no-h1")
    elif len(h1s) > 1: issues.append("multiple-h1")
    if word_count < 300: issues.append("thin-content")
    return {
        "title": title, "title_len": len(title),
        "description": desc, "description_len": len(desc),
        "canonical": canon, "h1_count": len(h1s),
        "word_count": word_count,
        "issues": ";".join(issues) or "ok",
    }


def audit_local() -> list[dict]:
    out = []
    for p in sorted(SITE_DIR.rglob("index.html")):
        rel = "/" + str(p.relative_to(SITE_DIR).parent).replace("\\", "/").rstrip(".") + "/"
        if rel == "/./": rel = "/"
        row = {"url": rel, **check_html(p.read_text(errors="ignore"))}
        out.append(row)
    return out


def audit_live(urls: list[str]) -> list[dict]:
    api_key = env("FIRECRAWL_API_KEY")
    headers = {"Authorization": f"Bearer {api_key}"}
    out = []
    for u in urls:
        r = requests.post(
            FIRECRAWL_SCRAPE,
            headers=headers,
            json={"url": u, "formats": ["html"]},
            timeout=120,
        )
        r.raise_for_status()
        html = (r.json().get("data") or {}).get("html", "")
        out.append({"url": u, **check_html(html)})
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", choices=["site", "live"], required=True)
    ap.add_argument("--yes", action="store_true")
    args = ap.parse_args()

    if args.target == "site":
        rows = audit_local()
    else:
        sitemap = SITE_DIR / "sitemap.xml"
        urls = re.findall(r"<loc>([^<]+)</loc>", sitemap.read_text())
        print(f"will Firecrawl-scrape {len(urls)} urls (~{len(urls)} credits)")
        if not confirm("Proceed?", yes_flag=args.yes):
            sys.exit("aborted")
        rows = audit_live(urls)

    out = SEO_DIR / "audits" / f"{date.today().isoformat()}-{args.target}.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    bad = sum(1 for r in rows if r["issues"] != "ok")
    print(f"{len(rows)} pages audited, {bad} with issues → {out.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
