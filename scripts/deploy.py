"""Deploy stub — Vercel is not configured for this project yet.

When ready:
  1. `npm i -g vercel` (if needed)
  2. `vercel link` from repo root, point at the existing project
  3. Update this script to run `vercel deploy` (preview) / `vercel --prod`
  4. Add VERCEL_TOKEN / VERCEL_PROJECT_ID / VERCEL_ORG_ID to .env.example
"""
import sys

MSG = (
    "Deploy not configured.\n"
    "When ready, run `vercel link` from the repo root and update scripts/deploy.py.\n"
    "Production deploys require explicit user approval — never auto-prod."
)

if __name__ == "__main__":
    print(MSG)
    sys.exit(1)
