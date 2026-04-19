# xBloom Recipe Fetcher

Scrapes publicly available xBloom coffee recipes from the web and optionally from X (Twitter), then outputs Markdown files with a full snapshot and a diff of new entries since the last run.

## Sources

| Source | URL | Auth required |
|--------|-----|---------------|
| xBloom Official Recipes | https://xbloom.com/collections/recipes-coffee | No |
| xBloom EU Recipes | https://xbloom.com/pages/eu-whole-bean-coffee-recipes-center | No |
| Community Platform | https://xbloom-app.vercel.app/ | No |
| X (@XbloomCoffee tweets) | X API v2 | Bearer Token (optional, free) |
| X (recipe search) | X API v2 | Bearer Token (optional, free) |

## Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. (Optional) Configure X API access
cp .env.example .env
# Edit .env and set X_BEARER_TOKEN=<your token>
# Get a free token at: https://developer.twitter.com/en/portal/dashboard
```

## Usage

```bash
python xbloom_recipe_fetcher.py
```

Output files are written to `output/` (gitignored):

- `xbloom_recipes_latest.md` — full snapshot, overwritten each run
- `xbloom_recipes_diff_YYYY-MM-DD.md` — new entries since the previous run

## Automated Weekly Runs (GitHub Actions)

The included workflow (`.github/workflows/weekly_fetch.yml`) runs every Monday at 09:00 UTC and commits the output files automatically.

To enable X data in CI, add your Bearer Token as a GitHub Secret named `X_BEARER_TOKEN` in **Settings → Secrets and variables → Actions**.

## X API limits (free tier)

- Monthly read limit: 500 tweets
- This tool fetches ≤ 10 tweets per query × 2 queries per week ≈ 80 tweets/month — well within the limit.
