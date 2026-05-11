"""
Scraper Indeed France via Playwright (contourne le blocage 403).
"""

import time
import logging
import re
from datetime import datetime

logger = logging.getLogger(__name__)

CHROMIUM_PATH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
BASE_URL = "https://fr.indeed.com/jobs"

ENERGY_TERMS = re.compile(
    r"énergie|energy|électricité|electricity|gaz|power|commodit|renouvelable", re.I
)
TRADING_TERMS = re.compile(
    r"trading|trader|marché|market|quantitat|pricing|structur|analys|dispatch", re.I
)


def _is_relevant(title: str, snippet: str = "") -> bool:
    text = title + " " + snippet
    return bool(ENERGY_TERMS.search(text)) and bool(TRADING_TERMS.search(text))


def scrape_indeed(keywords: list[str], max_results: int = 30) -> list[dict]:
    from playwright.sync_api import sync_playwright

    seen_ids: set = set()
    results: list[dict] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path=CHROMIUM_PATH,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        )
        ctx = browser.new_context(
            ignore_https_errors=True,
            user_agent=(
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        page = ctx.new_page()

        for keyword in keywords:
            logger.info(f"[Indeed] Recherche : '{keyword}'")

            for start in range(0, max_results, 10):
                url = (
                    f"{BASE_URL}?q={keyword.replace(' ', '+')}"
                    f"&l=France&jt=internship&start={start}"
                )
                try:
                    page.goto(url, timeout=30000, wait_until="domcontentloaded")
                    page.wait_for_timeout(3000)

                    # Accepte cookies si nécessaire
                    try:
                        page.click("button:has-text('Accept')", timeout=2000)
                        page.wait_for_timeout(1000)
                    except Exception:
                        pass

                    cards = page.query_selector_all("div[data-jk]")
                    if not cards:
                        break

                    for card in cards:
                        job_id = card.get_attribute("data-jk") or ""
                        if job_id in seen_ids:
                            continue
                        seen_ids.add(job_id)

                        title_el = card.query_selector("h2[class*='jobTitle'] span, h2 span")
                        title = title_el.inner_text().strip() if title_el else ""
                        if not title:
                            continue

                        company_el = card.query_selector("[data-testid='company-name'], span[class*='company']")
                        company = company_el.inner_text().strip() if company_el else "N/A"

                        location_el = card.query_selector("[data-testid='text-location']")
                        location = location_el.inner_text().strip() if location_el else "France"

                        snippet_el = card.query_selector("div[class*='snippet'], ul li")
                        snippet = snippet_el.inner_text().strip() if snippet_el else ""

                        if not _is_relevant(title, snippet):
                            continue

                        results.append({
                            "source": "Indeed",
                            "id": job_id,
                            "title": title,
                            "company": company,
                            "location": location,
                            "contract_type": "Stage/Alternance",
                            "description": snippet,
                            "profile": "",
                            "apply_url": f"https://fr.indeed.com/viewjob?jk={job_id}",
                            "posted_at": "",
                            "salary": "",
                            "scraped_at": datetime.utcnow().isoformat(),
                            "keyword": keyword,
                        })
                        logger.info(f"  ✓ {title} — {company}")

                    time.sleep(2)

                except Exception as e:
                    logger.error(f"[Indeed] Erreur : {e}")
                    break

            time.sleep(2)

        browser.close()

    logger.info(f"[Indeed] Total offres pertinentes : {len(results)}")
    return results
