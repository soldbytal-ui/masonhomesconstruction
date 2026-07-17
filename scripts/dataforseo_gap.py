"""Compute the keyword gap from cached ranked_keywords responses.

Reads everything under seo/data/ranked_keywords/ (filled by dataforseo_competitors.py),
emits seo/gaps/<YYYY-MM-DD>.csv with keywords competitors rank for that we don't
(or rank for poorly).

Free — no API calls. Run after dataforseo_competitors.py.
"""
from __future__ import annotations

import csv
import json
from collections import defaultdict
from datetime import date
from pathlib import Path

from _common import DATA_DIR, SEO_DIR, env

# A keyword is a "gap" if a competitor ranks in top N and we either don't rank
# at all or rank below GAP_OUR_THRESHOLD.
COMP_TOP = 20
GAP_OUR_THRESHOLD = 30


def parse(blob: dict) -> tuple[str, list[dict]]:
    """Pull domain + (keyword, position, search_volume, intent) rows from one response."""
    task = (blob.get("tasks") or [{}])[0]
    result = (task.get("result") or [{}])[0]
    target = result.get("target") or task.get("data", {}).get("target", "?")
    items = result.get("items") or []
    rows = []
    for it in items:
        kd = it.get("keyword_data") or {}
        kw = kd.get("keyword")
        sv = (kd.get("keyword_info") or {}).get("search_volume") or 0
        intent = (kd.get("search_intent_info") or {}).get("main_intent")
        pos = (it.get("ranked_serp_element") or {}).get("serp_item", {}).get("rank_absolute")
        if kw and pos:
            rows.append({"keyword": kw, "position": pos, "volume": sv, "intent": intent})
    return target, rows


def main() -> None:
    own_domain = env("SITE_DOMAIN")
    cache_dir = DATA_DIR / "ranked_keywords"
    if not cache_dir.exists():
        raise SystemExit(f"no cached data at {cache_dir} — run dataforseo_competitors.py first")

    by_domain: dict[str, dict[str, dict]] = defaultdict(dict)
    for f in cache_dir.glob("*.json"):
        target, rows = parse(json.loads(f.read_text()))
        for r in rows:
            by_domain[target][r["keyword"]] = r

    if own_domain not in by_domain:
        raise SystemExit(f"no data for own domain {own_domain}; check the cache")

    ours = by_domain.pop(own_domain)
    competitor_kw: dict[str, dict] = {}
    competitor_count: dict[str, int] = defaultdict(int)
    for d, kws in by_domain.items():
        for kw, r in kws.items():
            if r["position"] > COMP_TOP:
                continue
            if kw in ours and ours[kw]["position"] <= GAP_OUR_THRESHOLD:
                continue
            competitor_count[kw] += 1
            cur = competitor_kw.get(kw)
            if not cur or r["position"] < cur["position"]:
                competitor_kw[kw] = {**r, "competitor": d}

    out = SEO_DIR / "gaps" / f"{date.today().isoformat()}.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["keyword", "best_comp_pos", "best_competitor",
                    "competitors_ranking", "search_volume", "intent",
                    "our_position"])
        rows = sorted(
            competitor_kw.items(),
            key=lambda kv: (-kv[1]["volume"], kv[1]["position"]),
        )
        for kw, r in rows:
            w.writerow([kw, r["position"], r["competitor"],
                        competitor_count[kw], r["volume"], r["intent"],
                        ours.get(kw, {}).get("position", "")])
    print(f"{len(rows)} gap keywords → {out.relative_to(SEO_DIR.parent)}")


if __name__ == "__main__":
    main()
