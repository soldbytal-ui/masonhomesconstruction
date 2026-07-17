"""Scan site/sitemap.xml and emit seo/our-pages.csv. Free, no API."""
from __future__ import annotations

import csv
import re
from pathlib import Path

from _common import REPO_ROOT, SEO_DIR, SITE_DIR

SITEMAP = SITE_DIR / "sitemap.xml"


def main() -> None:
    if not SITEMAP.exists():
        raise SystemExit(f"no sitemap at {SITEMAP}")
    text = SITEMAP.read_text()
    urls = re.findall(r"<loc>([^<]+)</loc>", text)
    out = SEO_DIR / "our-pages.csv"
    with out.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["url", "path", "section"])
        for u in urls:
            path = u.replace("https://masonhomesconstruction.com", "") or "/"
            section = path.strip("/").split("/")[0] or "home"
            w.writerow([u, path, section])
    print(f"{len(urls)} urls → {out.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
