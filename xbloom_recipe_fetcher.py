"""
xBloom Recipe Fetcher
Scrapes publicly available xBloom recipes from the web and optionally from X (Twitter).
Outputs Markdown files: a full snapshot and a diff of new entries since last run.
"""

import json
import os
import sys
from datetime import datetime, timezone
from urllib.robotparser import RobotFileParser
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

OUTPUT_DIR = "output"
CACHE_FILE = os.path.join(OUTPUT_DIR, "xbloom_recipes_cache.json")
LATEST_FILE = os.path.join(OUTPUT_DIR, "xbloom_recipes_latest.md")

X_TARGET_USERNAME = "XbloomCoffee"
X_SEARCH_QUERY = "xbloom recipe -is:retweet lang:en"
X_MAX_RESULTS = 10

SOURCES = {
    "official": "https://xbloom.com/collections/recipes-coffee",
    "eu": "https://xbloom.com/pages/eu-whole-bean-coffee-recipes-center",
    "community": "https://xbloom-app.vercel.app/",
}


# ---------------------------------------------------------------------------
# HTTP session
# ---------------------------------------------------------------------------

def get_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({
        "User-Agent": (
            "XBloomRecipeFetcher/1.0 "
            "(+https://github.com/xxxkouxxx/desktop-tutorial)"
        )
    })
    return session


# ---------------------------------------------------------------------------
# robots.txt check
# ---------------------------------------------------------------------------

def _is_allowed(url: str, session: requests.Session) -> bool:
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp = RobotFileParser()
    rp.set_url(robots_url)
    try:
        resp = session.get(robots_url, timeout=10)
        rp.parse(resp.text.splitlines())
    except Exception:
        return True  # if robots.txt is unreachable, allow by default
    return rp.can_fetch("*", url)


# ---------------------------------------------------------------------------
# Scrapers
# ---------------------------------------------------------------------------

def _scrape_links(session: requests.Session, url: str, source_key: str) -> list[dict]:
    if not _is_allowed(url, session):
        print(f"  [SKIP] robots.txt disallows: {url}")
        return []
    try:
        resp = session.get(url, timeout=10)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  [ERROR] {source_key}: {e}")
        return []

    soup = BeautifulSoup(resp.text, "lxml")
    recipes: list[dict] = []
    seen: set[str] = set()

    for tag in soup.find_all("a", href=True):
        href: str = tag["href"]
        if not href.startswith("http"):
            href = urljoin(url, href)

        text = tag.get_text(strip=True)
        if not text or href in seen:
            continue

        recipes.append({
            "id": href,
            "source": source_key,
            "url": href,
            "name": text,
            "description": "",
        })
        seen.add(href)

    return recipes


def fetch_official_recipes(session: requests.Session) -> list[dict]:
    print("Fetching official recipes from xbloom.com...")
    url = SOURCES["official"]
    if not _is_allowed(url, session):
        print("  [SKIP] robots.txt disallows official recipes page.")
        return []
    try:
        resp = session.get(url, timeout=10)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  [ERROR] official: {e}")
        return []

    soup = BeautifulSoup(resp.text, "lxml")
    recipes: list[dict] = []
    seen: set[str] = set()

    # Shopify collection page: product links typically contain /products/
    for tag in soup.find_all("a", href=True):
        href: str = tag["href"]
        if "/products/" not in href and "/recipes" not in href.lower():
            continue
        if not href.startswith("http"):
            href = urljoin(url, href)
        name = tag.get_text(strip=True)
        if not name or href in seen:
            continue
        recipes.append({
            "id": href,
            "source": "official",
            "url": href,
            "name": name,
            "description": "",
        })
        seen.add(href)

    print(f"  Found {len(recipes)} official recipe links.")
    return recipes


def fetch_eu_recipes(session: requests.Session) -> list[dict]:
    print("Fetching EU recipes from xbloom.com...")
    url = SOURCES["eu"]
    if not _is_allowed(url, session):
        print("  [SKIP] robots.txt disallows EU recipes page.")
        return []
    try:
        resp = session.get(url, timeout=10)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  [ERROR] eu: {e}")
        return []

    soup = BeautifulSoup(resp.text, "lxml")
    recipes: list[dict] = []
    seen: set[str] = set()

    for tag in soup.find_all("a", href=True):
        href: str = tag["href"]
        if not href.startswith("http"):
            href = urljoin(url, href)
        name = tag.get_text(strip=True)
        if not name or href in seen or urlparse(href).netloc not in ("xbloom.com", "www.xbloom.com"):
            continue
        recipes.append({
            "id": href,
            "source": "eu",
            "url": href,
            "name": name,
            "description": "",
        })
        seen.add(href)

    print(f"  Found {len(recipes)} EU recipe links.")
    return recipes


def fetch_community_recipes(session: requests.Session) -> list[dict]:
    print("Fetching community recipes from xbloom-app.vercel.app...")
    url = SOURCES["community"]
    if not _is_allowed(url, session):
        print("  [SKIP] robots.txt disallows community site.")
        return []
    try:
        resp = session.get(url, timeout=10)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  [ERROR] community: {e}")
        return []

    soup = BeautifulSoup(resp.text, "lxml")
    recipes: list[dict] = []
    seen: set[str] = set()

    for tag in soup.find_all("a", href=True):
        href: str = tag["href"]
        if not href.startswith("http"):
            href = urljoin(url, href)
        name = tag.get_text(strip=True)
        if not name or href in seen:
            continue
        recipes.append({
            "id": href,
            "source": "community",
            "url": href,
            "name": name,
            "description": "",
        })
        seen.add(href)

    print(f"  Found {len(recipes)} community links.")
    return recipes


# ---------------------------------------------------------------------------
# X (Twitter) — optional
# ---------------------------------------------------------------------------

def get_x_client():
    load_dotenv()
    token = os.getenv("X_BEARER_TOKEN")
    if not token or token == "your_bearer_token_here":
        print("  [INFO] X_BEARER_TOKEN not set — skipping X data.")
        return None
    try:
        import tweepy
        return tweepy.Client(bearer_token=token, wait_on_rate_limit=True)
    except ImportError:
        print("  [WARN] tweepy not installed — skipping X data.")
        return None


def fetch_x_account_tweets(client) -> list[dict]:
    import tweepy
    print(f"Fetching tweets from @{X_TARGET_USERNAME}...")
    try:
        user_resp = client.get_user(username=X_TARGET_USERNAME)
        if not user_resp.data:
            print(f"  [WARN] @{X_TARGET_USERNAME} not found.")
            return []
        user_id = user_resp.data.id
        tweet_fields = ["id", "text", "created_at", "public_metrics"]
        resp = client.get_users_tweets(
            id=user_id,
            max_results=X_MAX_RESULTS,
            tweet_fields=tweet_fields,
            exclude=["retweets", "replies"],
        )
        if not resp.data:
            return []
        results = []
        for t in resp.data:
            results.append({
                "id": str(t.id),
                "source": "x_account",
                "url": f"https://x.com/{X_TARGET_USERNAME}/status/{t.id}",
                "name": str(t.created_at)[:10] if t.created_at else "",
                "description": t.text,
            })
        print(f"  Found {len(results)} tweets from @{X_TARGET_USERNAME}.")
        return results
    except tweepy.TweepyException as e:
        print(f"  [ERROR] X account tweets: {e}")
        return []


def fetch_x_recipe_search(client) -> list[dict]:
    import tweepy
    print(f"Searching X for: {X_SEARCH_QUERY!r}...")
    try:
        tweet_fields = ["id", "text", "created_at", "author_id"]
        resp = client.search_recent_tweets(
            query=X_SEARCH_QUERY,
            max_results=X_MAX_RESULTS,
            tweet_fields=tweet_fields,
        )
        if not resp.data:
            return []
        results = []
        for t in resp.data:
            results.append({
                "id": str(t.id),
                "source": "x_search",
                "url": f"https://x.com/i/web/status/{t.id}",
                "name": str(t.created_at)[:10] if t.created_at else "",
                "description": t.text,
                "matched_query": X_SEARCH_QUERY,
            })
        print(f"  Found {len(results)} search results.")
        return results
    except tweepy.TweepyException as e:
        print(f"  [ERROR] X recipe search: {e}")
        return []


# ---------------------------------------------------------------------------
# Cache / diff
# ---------------------------------------------------------------------------

def load_cache(path: str) -> set[str]:
    if not os.path.exists(path):
        return set()
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return set(data.get("ids", []))
    except (json.JSONDecodeError, KeyError):
        return set()


def save_cache(recipes: list[dict], path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    ids = [r["id"] for r in recipes]
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"ids": ids, "updated_at": datetime.now(timezone.utc).isoformat()}, f, indent=2)


def compute_diff(all_recipes: list[dict], cached_ids: set[str]) -> list[dict]:
    return [r for r in all_recipes if r["id"] not in cached_ids]


# ---------------------------------------------------------------------------
# Markdown rendering
# ---------------------------------------------------------------------------

def _section(title: str, recipes: list[dict]) -> str:
    if not recipes:
        return f"\n## {title} (0)\n\n_No entries found._\n"
    lines = [f"\n## {title} ({len(recipes)})\n"]
    for r in recipes:
        name = r.get("name") or r.get("id")
        desc = r.get("description", "")
        line = f"- **{name}** — {r['url']}"
        if desc:
            line += f"\n  > {desc[:120]}"
        lines.append(line)
    return "\n".join(lines) + "\n"


def render_full_markdown(
    official: list[dict],
    eu: list[dict],
    community: list[dict],
    x_account: list[dict],
    x_search: list[dict],
    date_str: str,
) -> str:
    parts = [f"# xBloom Recipes — {date_str}\n"]
    parts.append(_section("Official Recipes", official))
    parts.append(_section("EU Recipes", eu))
    parts.append(_section("Community Recipes", community))
    parts.append(_section(f"X Posts (@{X_TARGET_USERNAME})", x_account))
    parts.append(_section(f'X Search: "{X_SEARCH_QUERY}"', x_search))
    return "\n".join(parts)


def render_diff_markdown(new_entries: list[dict], date_str: str) -> str:
    if not new_entries:
        return f"# xBloom New Entries — {date_str} (0 new)\n\n_No new entries since last run._\n"
    lines = [f"# xBloom New Entries — {date_str} ({len(new_entries)} new)\n"]
    for r in new_entries:
        name = r.get("name") or r.get("id")
        desc = r.get("description", "")
        line = f"- [{r['source']}] **{name}** — {r['url']}"
        if desc:
            line += f"\n  > {desc[:120]}"
        lines.append(line)
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

def save_output(full_md: str, diff_md: str, date_str: str) -> tuple[str, str]:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(LATEST_FILE, "w", encoding="utf-8") as f:
        f.write(full_md)
    diff_file = os.path.join(OUTPUT_DIR, f"xbloom_recipes_diff_{date_str}.md")
    with open(diff_file, "w", encoding="utf-8") as f:
        f.write(diff_md)
    return LATEST_FILE, diff_file


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print("=== xBloom Recipe Fetcher ===")
    session = get_session()
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    official = fetch_official_recipes(session)
    eu = fetch_eu_recipes(session)
    community = fetch_community_recipes(session)

    x_client = get_x_client()
    x_account: list[dict] = []
    x_search: list[dict] = []
    if x_client is not None:
        x_account = fetch_x_account_tweets(x_client)
        x_search = fetch_x_recipe_search(x_client)

    all_recipes = official + eu + community + x_account + x_search

    cached_ids = load_cache(CACHE_FILE)
    new_entries = compute_diff(all_recipes, cached_ids)
    save_cache(all_recipes, CACHE_FILE)

    full_md = render_full_markdown(official, eu, community, x_account, x_search, date_str)
    diff_md = render_diff_markdown(new_entries, date_str)
    latest_path, diff_path = save_output(full_md, diff_md, date_str)

    total = len(all_recipes)
    print(f"\nTotal entries : {total}")
    print(f"New this run  : {len(new_entries)}")
    print(f"Full snapshot : {latest_path}")
    print(f"Diff file     : {diff_path}")


if __name__ == "__main__":
    main()
