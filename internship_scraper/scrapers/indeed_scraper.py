"""
Scraper Indeed France via parsing HTML.
Indeed bloque agressivement les scrapers — on utilise des headers réalistes
et on respecte les délais.
"""

import requests
import time
import logging
import re
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urlencode, quote_plus

logger = logging.getLogger(__name__)

BASE_URL = "https://fr.indeed.com/jobs"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

ENERGY_TERMS = [
    "énergie", "energy", "électricité", "electricity", "gaz", "power",
    "trading", "marché", "commodit", "renouvelable", "renewable",
]


def _is_relevant(title: str, description: str = "") -> bool:
    text = (title + " " + description).lower()
    has_energy = any(t in text for t in ["énergie", "energy", "électricité", "gaz", "power", "commodit"])
    has_trading = any(t in text for t in ["trading", "trader", "marché", "market", "quantitat", "pricing", "structur"])
    return has_energy and has_trading


def _extract_jobs_from_page(soup: BeautifulSoup, keyword: str) -> list[dict]:
    jobs = []
    cards = soup.find_all("div", attrs={"data-jk": True})

    for card in cards:
        job_id = card.get("data-jk", "")
        title_el = card.find("h2", class_=re.compile("jobTitle"))
        title = title_el.get_text(strip=True) if title_el else "N/A"
        company_el = card.find("span", attrs={"data-testid": "company-name"})
        company = company_el.get_text(strip=True) if company_el else "N/A"
        location_el = card.find("div", attrs={"data-testid": "text-location"})
        location = location_el.get_text(strip=True) if location_el else "N/A"
        snippet_el = card.find("div", class_=re.compile("job-snippet|jobsnippet"))
        snippet = snippet_el.get_text(strip=True) if snippet_el else ""
        date_el = card.find("span", class_=re.compile("date|posted"))
        posted = date_el.get_text(strip=True) if date_el else ""

        if not _is_relevant(title, snippet):
            continue

        jobs.append({
            "source": "Indeed",
            "id": job_id,
            "title": title,
            "company": company,
            "location": location,
            "contract_type": "Stage",
            "description": snippet,
            "profile": "",
            "apply_url": f"https://fr.indeed.com/viewjob?jk={job_id}",
            "posted_at": posted,
            "salary": "",
            "scraped_at": datetime.utcnow().isoformat(),
            "keyword": keyword,
        })
    return jobs


def scrape_indeed(keywords: list[str], max_results: int = 30) -> list[dict]:
    """Scrape Indeed France pour les stages trading/énergie."""
    session = requests.Session()
    session.headers.update(HEADERS)
    seen_ids = set()
    results = []

    for keyword in keywords:
        logger.info(f"[Indeed] Recherche : '{keyword}'")

        for start in range(0, max_results, 10):
            params = {
                "q": keyword,
                "l": "France",
                "jt": "internship",
                "start": start,
                "lang": "fr",
            }
            url = f"{BASE_URL}?{urlencode(params)}"

            try:
                resp = session.get(url, timeout=15)
                if resp.status_code != 200:
                    logger.warning(f"[Indeed] Status {resp.status_code}")
                    break

                soup = BeautifulSoup(resp.text, "lxml")
                jobs = _extract_jobs_from_page(soup, keyword)

                new_jobs = [j for j in jobs if j["id"] not in seen_ids]
                seen_ids.update(j["id"] for j in new_jobs)
                results.extend(new_jobs)

                for j in new_jobs:
                    logger.info(f"  ✓ {j['title']} — {j['company']} ({j['location']})")

                if not jobs:
                    break

                time.sleep(2)

            except Exception as e:
                logger.error(f"[Indeed] Erreur : {e}")
                break

        time.sleep(2)

    logger.info(f"[Indeed] Total offres pertinentes : {len(results)}")
    return results
