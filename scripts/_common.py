"""Shared helpers for SEO scripts."""
from __future__ import annotations

import hashlib
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env")

SITE_DIR = REPO_ROOT / "site"
SEO_DIR = REPO_ROOT / "seo"
DATA_DIR = SEO_DIR / "data"
CACHE_DIR = SEO_DIR / ".cache"
DATA_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def env(key: str, required: bool = True, default: str | None = None) -> str:
    val = os.environ.get(key, default)
    if required and not val:
        sys.exit(f"missing env var: {key} (set in {REPO_ROOT}/.env)")
    return val or ""


def confirm(prompt: str, *, yes_flag: bool) -> bool:
    if yes_flag:
        return True
    answer = input(f"{prompt} [y/N] ").strip().lower()
    return answer in ("y", "yes")


def cache_path(endpoint: str, payload: dict) -> Path:
    key = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    out = DATA_DIR / endpoint.strip("/").replace("/", "_") / f"{key}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    return out


def load_cache(path: Path) -> dict | None:
    if path.exists():
        return json.loads(path.read_text())
    return None


def save_cache(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, indent=2))
