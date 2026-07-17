"""Seed seo/competitors/competitors.yml from Google SERPs (DataForSEO).

Endpoint: /v3/serp/google/organic/live/regular
Cost: $0.0006 per query × N queries. With 3 queries → ~$0.002.

Usage:
    python scripts/seed_competitors.py            # prompts before live call
    python scripts/seed_competitors.py --yes
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.parse
from collections import defaultdict
from pathlib import Path

import requests
import yaml

from _common import SEO_DIR, cache_path, confirm, env, load_cache, save_cache

ENDPOINT_LIVE = "https://api.dataforseo.com/v3/serp/google/organic/live/regular"
COST_PER_QUERY_USD = 0.0006
COST_CAP_USD = 1.00

QUERIES = [
    "kitchen remodeling tampa",
    "home remodeling tampa",
    "general contractor tampa",
]

# Exclusions — directories, franchises, big-box, maps results.
EXCLUDE_DOMAINS = {
    "houzz.com", "angi.com", "angieslist.com", "yelp.com", "homeadvisor.com",
    "thumbtack.com", "bbb.org", "homedepot.com", "lowes.com", "google.com",
    "maps.google.com", "facebook.com", "instagram.com", "linkedin.com",
    "youtube.com", "pinterest.com", "nextdoor.com", "porch.com", "buildzoom.com",
    "indeed.com", "glassdoor.com", "wikipedia.org", "reddit.com",
    "expertise.com", "trustpilot.com", "yellowpages.com", "manta.com",
    "mapquest.com", "tripadvisor.com",
}
EXCLUDE_DOMAIN_SUFFIXES = (".gov", ".edu")
# Known franchise / national chains in remodeling.
EXCLUDE_KEYWORDS = (
    "bathfitter", "bath-fitter", "rebath", "re-bath", "kitchentuneup",
    "kitchen-tune-up", "callerie", "longhornremod", "fivestarbath",
    "westshorehome", "americanvision",
)


def is_excluded(domain: str) -> bool:
    d = domain.lower().lstrip("www.")
    if d in EXCLUDE_DOMAINS:
        return True
    if d.endswith(EXCLUDE_DOMAIN_SUFFIXES):
        return True
    return any(k in d for k in EXCLUDE_KEYWORDS)


def fetch_serp(query: str, location_code: int, language_code: str) -> dict:
    payload = [{
        "keyword": query,
        "location_code": location_code,
        "language_code": language_code,
        "depth": 20,
    }]
    cache_key = cache_path("serp_organic", payload[0])
    cached = load_cache(cache_key)
    if cached:
        print(f"  (cached) {query!r}")
        return cached
    auth = (env("DATAFORSEO_LOGIN"), env("DATAFORSEO_PASSWORD"))
    base = ENDPOINT_LIVE
    if env("DATAFORSEO_MODE", required=False, default="live") == "sandbox":
        base = base.replace("api.dataforseo.com", "sandbox.dataforseo.com")
    print(f"  fetching SERP: {query!r}")
    r = requests.post(base, auth=auth, json=payload, timeout=120)
    r.raise_for_status()
    data = r.json()
    save_cache(cache_key, data)
    return data


def extract_domains(blob: dict, query: str) -> list[tuple[str, int, str]]:
    """Return list of (domain, rank, source_url)."""
    items = (((blob.get("tasks") or [{}])[0].get("result") or [{}])[0].get("items") or [])
    out = []
    for it in items:
        if it.get("type") != "organic":
            continue
        url = it.get("url") or ""
        rank = it.get("rank_absolute") or 99
        host = urllib.parse.urlparse(url).netloc.lower().lstrip("www.")
        if not host:
            continue
        out.append((host, rank, url))
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--yes", action="store_true")
    ap.add_argument("--top", type=int, default=8, help="max competitors to seed")
    args = ap.parse_args()

    location_code = int(env("SITE_LOCATION_CODE", required=False, default="1023191"))
    language_code = env("SITE_LANGUAGE_CODE", required=False, default="en")
    own_domain = env("SITE_DOMAIN").lower().lstrip("www.")
    mode = env("DATAFORSEO_MODE", required=False, default="live")

    estimate = len(QUERIES) * COST_PER_QUERY_USD
    print(f"\nMode:        {mode}")
    print(f"Location:    {location_code}")
    print(f"Queries:     {len(QUERIES)} → {QUERIES}")
    print(f"Est. cost:   ${estimate:.4f}")
    print(f"Hard cap:    ${COST_CAP_USD:.2f}\n")

    if estimate > COST_CAP_USD:
        sys.exit(f"estimate ${estimate:.4f} exceeds cap ${COST_CAP_USD:.2f}")
    if mode == "live" and not confirm("Proceed?", yes_flag=args.yes):
        sys.exit("aborted")

    # rank_sum = lower is better; appearances = how many SERPs they showed in
    scores: dict[str, dict] = defaultdict(lambda: {"appearances": 0, "best_rank": 99, "queries": [], "url": ""})
    for q in QUERIES:
        blob = fetch_serp(q, location_code, language_code)
        for host, rank, url in extract_domains(blob, q):
            if host == own_domain or is_excluded(host):
                continue
            s = scores[host]
            s["appearances"] += 1
            s["best_rank"] = min(s["best_rank"], rank)
            s["queries"].append(f"{q} (#{rank})")
            if not s["url"]:
                s["url"] = url

    ranked = sorted(
        scores.items(),
        key=lambda kv: (-kv[1]["appearances"], kv[1]["best_rank"]),
    )[: args.top]

    out_path = SEO_DIR / "competitors" / "competitors.yml"
    body = {
        "_note": "Auto-seeded by scripts/seed_competitors.py — review before running dataforseo_competitors.py",
        "competitors": [
            {
                "domain": d,
                "appearances": s["appearances"],
                "best_rank": s["best_rank"],
                "queries": s["queries"],
                "url": s["url"],
                "notes": "",
            }
            for d, s in ranked
        ],
    }
    out_path.write_text(yaml.safe_dump(body, sort_keys=False, width=120))
    print(f"\nseeded {len(ranked)} competitors → {out_path.relative_to(SEO_DIR.parent)}")
    for d, s in ranked:
        print(f"  {d:40s} appearances={s['appearances']} best_rank={s['best_rank']}")


if __name__ == "__main__":
    main()
