"""Pull ranked keywords for our domain + each competitor in seo/competitors/competitors.yml.

DataForSEO endpoint: /v3/dataforseo_labs/google/ranked_keywords/live
Cost: ~$0.075 per domain at default limit=1000.

Usage:
    python scripts/dataforseo_competitors.py            # prints estimate, prompts
    python scripts/dataforseo_competitors.py --yes      # skip prompt
    python scripts/dataforseo_competitors.py --limit 200
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import requests
import yaml

from _common import (
    DATA_DIR,
    SEO_DIR,
    cache_path,
    confirm,
    env,
    load_cache,
    save_cache,
)

ENDPOINT = "https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live"
COST_PER_TASK_USD = 0.075  # at limit=1000; scales roughly linearly with limit


def pull(domain: str, limit: int, location_code: int, language_code: str) -> dict:
    payload = [{
        "target": domain,
        "location_code": location_code,
        "language_code": language_code,
        "limit": limit,
        "ignore_synonyms": True,
    }]
    cache_key = cache_path("ranked_keywords", payload[0])
    cached = load_cache(cache_key)
    if cached:
        print(f"  (cached) {domain}")
        return cached

    auth = (env("DATAFORSEO_LOGIN"), env("DATAFORSEO_PASSWORD"))
    base = ENDPOINT
    if env("DATAFORSEO_MODE", required=False, default="live") == "sandbox":
        base = base.replace("api.dataforseo.com", "sandbox.dataforseo.com")
    print(f"  fetching {domain} ...")
    r = requests.post(base, auth=auth, json=payload, timeout=120)
    r.raise_for_status()
    data = r.json()
    save_cache(cache_key, data)
    return data


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=1000, help="keywords per domain")
    ap.add_argument("--yes", action="store_true", help="skip cost prompt")
    args = ap.parse_args()

    comp_file = SEO_DIR / "competitors" / "competitors.yml"
    competitors = yaml.safe_load(comp_file.read_text()).get("competitors") or []
    if not competitors:
        sys.exit(f"add competitors to {comp_file} first")

    own_domain = env("SITE_DOMAIN")
    domains = [own_domain] + [c["domain"] for c in competitors]
    cost_factor = args.limit / 1000
    estimate = len(domains) * COST_PER_TASK_USD * cost_factor
    mode = env("DATAFORSEO_MODE", required=False, default="live")

    print(f"\nMode:        {mode}")
    print(f"Domains:     {len(domains)} ({', '.join(domains)})")
    print(f"Limit:       {args.limit} keywords each")
    print(f"Est. cost:   ${estimate:.2f} (sandbox = $0.00)\n")

    if mode == "live" and not confirm("Proceed?", yes_flag=args.yes):
        sys.exit("aborted")

    location = int(env("SITE_LOCATION_CODE", required=False, default="2840"))
    language = env("SITE_LANGUAGE_CODE", required=False, default="en")

    for d in domains:
        pull(d, args.limit, location, language)
    print(f"\ndone. raw responses cached under {DATA_DIR.relative_to(SEO_DIR.parent)}/ranked_keywords/")


if __name__ == "__main__":
    main()
