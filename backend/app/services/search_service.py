"""Web search + page reading for the AI, behind a swappable provider.

Current provider: Brave Search API (free tier: 2,000 queries/month).
To switch providers (e.g. self-hosted SearXNG), replace `web_search` only —
the tool layer and prompts don't care where results come from.
"""

import asyncio

import httpx

from app.config import settings

BRAVE_ENDPOINT = "https://api.search.brave.com/res/v1/web/search"
MAX_PAGE_CHARS = 6000


class SearchNotConfigured(Exception):
    pass


async def web_search(query: str, count: int = 5) -> list[dict]:
    """Return [{title, url, snippet}] for a query."""
    if not settings.brave_search_api_key:
        raise SearchNotConfigured(
            "Web search is not configured (missing BRAVE_SEARCH_API_KEY)"
        )

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            BRAVE_ENDPOINT,
            params={"q": query, "count": min(count, 10)},
            headers={
                "X-Subscription-Token": settings.brave_search_api_key,
                "Accept": "application/json",
            },
        )
        response.raise_for_status()
        payload = response.json()

    results = []
    for item in payload.get("web", {}).get("results", []):
        results.append(
            {
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "snippet": item.get("description", ""),
            }
        )
    return results


async def fetch_page(url: str) -> str:
    """Fetch a web page and extract its readable text content."""
    async with httpx.AsyncClient(
        timeout=15, follow_redirects=True, headers={"User-Agent": "FamilyPlate/1.0"}
    ) as client:
        response = await client.get(url)
        response.raise_for_status()
        html = response.text

    import trafilatura

    # trafilatura is synchronous — keep the event loop free
    text = await asyncio.to_thread(
        trafilatura.extract, html, include_links=False, include_comments=False
    )
    if not text:
        return "Could not extract readable content from this page."
    if len(text) > MAX_PAGE_CHARS:
        text = text[:MAX_PAGE_CHARS] + "\n\n[content truncated]"
    return text
