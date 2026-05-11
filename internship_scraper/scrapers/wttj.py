"""
Scraper Welcome to the Jungle (WTTJ) via leur API publique.
Meilleure couverture des stages en France.
"""

import requests
import time
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

WTTJ_API = "https://api.welcometothejungle.com/api/v1/jobs"
WTTJ_BASE = "https://www.welcometothejungle.com"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "Origin": "https://www.welcometothejungle.com",
    "Referer": "https://www.welcometothejungle.com/",
}

ENERGY_TRADING_KEYWORDS = [
    "trading énergie",
    "energy trading",
    "marché énergie",
    "energy market",
    "trader énergie",
    "analyste énergie",
    "quantitatif énergie",
    "commodities",
    "power trading",
    "electricity trading",
    "gaz naturel trading",
    "structureur énergie",
    "pricing énergie",
    "portefeuille énergie",
    "renewable energy trading",
]


def _is_energy_trading_related(job: dict) -> bool:
    """Filtre les offres vraiment liées au trading/marchés de l'énergie."""
    text = " ".join([
        job.get("name", ""),
        job.get("description", ""),
        job.get("profile", ""),
        " ".join(job.get("sectors", {}).get("reference", [])),
    ]).lower()

    energy_terms = ["énergie", "energy", "électricité", "electricity", "gaz", "gas",
                    "power", "renouvelable", "renewable", "commodit"]
    trading_terms = ["trading", "trader", "marché", "market", "quantitat", "pricing",
                     "structur", "portefeuille", "arbitrage", "desk", "analytique"]

    has_energy = any(t in text for t in energy_terms)
    has_trading = any(t in text for t in trading_terms)
    return has_energy and has_trading


def scrape_wttj(keywords: list[str], max_per_keyword: int = 20) -> list[dict]:
    """
    Scrape les offres de stage sur WTTJ pour les mots-clés donnés.
    Retourne une liste de dicts normalisés.
    """
    seen_ids = set()
    results = []

    for keyword in keywords:
        logger.info(f"[WTTJ] Recherche : '{keyword}'")
        page = 1

        while True:
            params = {
                "query": keyword,
                "contract_type[]": "internship",
                "page": page,
                "per_page": 20,
                "locale": "fr",
            }

            try:
                resp = requests.get(WTTJ_API, headers=HEADERS, params=params, timeout=15)
                if resp.status_code != 200:
                    logger.warning(f"[WTTJ] Status {resp.status_code} pour '{keyword}'")
                    break

                data = resp.json()
                jobs = data.get("jobs", [])

                if not jobs:
                    break

                for job in jobs:
                    job_id = job.get("slug") or job.get("id")
                    if job_id in seen_ids:
                        continue
                    seen_ids.add(job_id)

                    if not _is_energy_trading_related(job):
                        continue

                    organization = job.get("organization", {})
                    contract = job.get("contract_type", {})
                    office = (job.get("offices") or [{}])[0]

                    normalized = {
                        "source": "WelcomeToTheJungle",
                        "id": job_id,
                        "title": job.get("name", "N/A"),
                        "company": organization.get("name", "N/A"),
                        "location": office.get("city", "N/A"),
                        "contract_type": contract.get("name", "Stage"),
                        "description": job.get("description", ""),
                        "profile": job.get("profile", ""),
                        "apply_url": f"{WTTJ_BASE}/fr/companies/{organization.get('slug','')}/jobs/{job_id}",
                        "posted_at": job.get("published_at", ""),
                        "salary": job.get("salary_min") or "",
                        "scraped_at": datetime.utcnow().isoformat(),
                        "keyword": keyword,
                    }
                    results.append(normalized)
                    logger.info(f"  ✓ {normalized['title']} — {normalized['company']} ({normalized['location']})")

                if len(results) >= max_per_keyword or page * 20 >= data.get("total", 0):
                    break

                page += 1
                time.sleep(1)

            except Exception as e:
                logger.error(f"[WTTJ] Erreur pour '{keyword}': {e}")
                break

        time.sleep(1.5)

    logger.info(f"[WTTJ] Total offres pertinentes : {len(results)}")
    return results
