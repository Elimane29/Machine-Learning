"""
Scraper Welcome to the Jungle via Playwright (rendu JS complet, bypass 403).
"""

import time
import logging
import re
from datetime import datetime

logger = logging.getLogger(__name__)

CHROMIUM_PATH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
WTTJ_BASE = "https://www.welcometothejungle.com"

ENERGY_TERMS = re.compile(
    r"énergie|energy|électricité|electricity|gaz naturel|power|renouvelable|"
    r"renewable|commodit|fcr|spot|dispatch|solaire|éolien|photovolta",
    re.I,
)
TRADING_TERMS = re.compile(
    r"trading|trader|marché|market|quantitat|pricing|structur|"
    r"portefeuille|portfolio|analys|optimis|arbitrage|desk",
    re.I,
)


def _is_relevant(title: str, desc: str = "") -> bool:
    text = title + " " + desc
    return bool(ENERGY_TERMS.search(text)) and bool(TRADING_TERMS.search(text))


def scrape_wttj(keywords: list[str], max_per_keyword: int = 20) -> list[dict]:
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
            logger.info(f"[WTTJ] Recherche : '{keyword}'")
            url = (
                f"{WTTJ_BASE}/fr/jobs"
                f"?query={keyword.replace(' ', '+')}"
                f"&contract_type[]=internship&contract_type[]=apprenticeship"
            )
            try:
                page.goto(url, timeout=30000, wait_until="domcontentloaded")
                page.wait_for_timeout(3000)  # laisse le JS rendre les offres

                # Accepte les cookies si le bandeau apparaît
                try:
                    page.click("button:has-text('Accepter')", timeout=3000)
                    page.wait_for_timeout(1000)
                except Exception:
                    pass

                # Récupère toutes les cartes offre
                cards = page.query_selector_all("li[data-testid='search-results-list-item-wrapper']")
                if not cards:
                    # Fallback sélecteur
                    cards = page.query_selector_all("article, [class*='JobCard'], [class*='job-card']")

                logger.info(f"  {len(cards)} cartes trouvées")

                for card in cards[:max_per_keyword]:
                    try:
                        title_el = card.query_selector("h2, h3, [class*='title'], [class*='Title']")
                        title = title_el.inner_text().strip() if title_el else ""
                        if not title:
                            continue

                        company_el = card.query_selector("[class*='company'], [class*='Company'], strong")
                        company = company_el.inner_text().strip() if company_el else "N/A"

                        location_el = card.query_selector("[class*='location'], [class*='Location'], [class*='city']")
                        location = location_el.inner_text().strip() if location_el else "France"

                        link_el = card.query_selector("a[href]")
                        href = link_el.get_attribute("href") if link_el else ""
                        apply_url = href if href.startswith("http") else f"{WTTJ_BASE}{href}"

                        job_id = href or title
                        if job_id in seen_ids:
                            continue
                        seen_ids.add(job_id)

                        desc_el = card.query_selector("[class*='desc'], [class*='Desc'], p")
                        desc = desc_el.inner_text().strip() if desc_el else ""

                        if not _is_relevant(title, desc):
                            continue

                        job = {
                            "source": "WelcomeToTheJungle",
                            "id": job_id,
                            "title": title,
                            "company": company,
                            "location": location,
                            "contract_type": "Alternance/Stage",
                            "description": desc,
                            "profile": "",
                            "apply_url": apply_url,
                            "posted_at": "",
                            "salary": "",
                            "scraped_at": datetime.utcnow().isoformat(),
                            "keyword": keyword,
                        }
                        results.append(job)
                        logger.info(f"  ✓ {title} — {company} ({location})")

                    except Exception as e:
                        logger.debug(f"  Erreur carte : {e}")

            except Exception as e:
                logger.error(f"[WTTJ] Erreur pour '{keyword}': {e}")

            time.sleep(2)

        browser.close()

    logger.info(f"[WTTJ] Total offres pertinentes : {len(results)}")
    return results
